import { ipc } from "@/renderer/lib/ipc-client";
import { LOCAL_STORAGE_KEYS } from "@/shared/constants";
import { normalizeThemeMode, type ThemeMode } from "@/shared/theme";

let preference: ThemeMode = "system";
let pending: Promise<unknown> = Promise.resolve();

function readPreference(): ThemeMode {
  try {
    return normalizeThemeMode(localStorage.getItem(LOCAL_STORAGE_KEYS.THEME));
  } catch {
    return "system";
  }
}
function applyTheme(mode: ThemeMode, isDark: boolean) {
  preference = mode;
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, mode);
  } catch {
    /* Appearance remains usable when storage is unavailable. */
  }
}
function enqueue(operation: () => Promise<void>) {
  const result = pending.then(operation);
  pending = result.catch(() => undefined);
  return result;
}
export function setTheme(mode: ThemeMode, signal?: AbortSignal) {
  return enqueue(async () => {
    signal?.throwIfAborted();
    const isDark = await ipc.client.theme.setThemeMode(mode, { signal });
    signal?.throwIfAborted();
    applyTheme(mode, isDark);
  });
}
export function toggleTheme() {
  return enqueue(async () => {
    const isDark = await ipc.client.theme.toggleThemeMode();
    applyTheme(isDark ? "dark" : "light", isDark);
  });
}
export function startThemeSync() {
  const controller = new AbortController();
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  preference = readPreference();
  const followSystem = (event: MediaQueryListEvent) => {
    if (preference === "system") {
      document.documentElement.classList.toggle("dark", event.matches);
      document.documentElement.style.colorScheme = event.matches ? "dark" : "light";
    }
  };
  media.addEventListener("change", followSystem);
  setTheme(preference, controller.signal).catch((error: unknown) => {
    if (!controller.signal.aborted) console.error("Failed to restore app theme:", error);
  });
  return () => {
    controller.abort();
    media.removeEventListener("change", followSystem);
  };
}
