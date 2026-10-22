import { LOCAL_STORAGE_KEYS } from "@/constants";
import { ipc } from "@/ipc/manager";
import type { ThemeMode } from "@/types/theme-mode";

export interface ThemePreferences {
  local: ThemeMode | null;
  system: ThemeMode;
}

export async function getCurrentTheme(): Promise<ThemePreferences> {
  const currentTheme = await ipc.client.theme.getCurrentThemeMode();
  const localTheme = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME) as ThemeMode | null;

  return {
    local: localTheme,
    system: currentTheme,
  };
}

export async function setTheme(newTheme: ThemeMode) {
  await ipc.client.theme.setThemeMode(newTheme);
  const isDarkMode =
    newTheme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : newTheme === "dark";
  localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, newTheme);
  updateDocumentTheme(isDarkMode);
}

export async function toggleTheme() {
  const isDarkMode = await ipc.client.theme.toggleThemeMode();
  const newTheme = isDarkMode ? "dark" : "light";

  updateDocumentTheme(isDarkMode);
  localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, newTheme);
}

export async function syncWithLocalTheme() {
  const { local } = await getCurrentTheme();
  if (!local) {
    await setTheme("system");
    return;
  }

  await setTheme(local);
}

export function watchSystemTheme() {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = (event: MediaQueryListEvent) => {
    const localTheme = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME);
    if (!localTheme || localTheme === "system") {
      updateDocumentTheme(event.matches);
    }
  };
  mediaQuery.addEventListener("change", handleChange);
  return () => mediaQuery.removeEventListener("change", handleChange);
}

function updateDocumentTheme(isDarkMode: boolean) {
  document.documentElement.style.colorScheme = isDarkMode ? "dark" : "light";
  if (isDarkMode) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}
