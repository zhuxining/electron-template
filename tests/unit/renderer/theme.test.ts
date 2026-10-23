import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";

import type { ThemeMode } from "@/shared/theme";
const native = vi.hoisted(() => ({
  set: vi.fn<(mode: ThemeMode, options?: { signal?: AbortSignal }) => Promise<boolean>>(),
  toggle: vi.fn<() => Promise<boolean>>(),
}));
vi.mock("@/renderer/lib/ipc-client", () => ({
  ipc: { client: { theme: { setThemeMode: native.set, toggleThemeMode: native.toggle } } },
}));
let theme: typeof import("@/renderer/actions/theme");
let media: EventTarget;
let systemDark: boolean;
let stops: Array<() => void>;
beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "";
  systemDark = false;
  stops = [];
  media = new EventTarget();
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      get matches() {
        return systemDark;
      },
      addEventListener: media.addEventListener.bind(media),
      removeEventListener: media.removeEventListener.bind(media),
    })),
  );
  native.set.mockImplementation(
    async (mode) => mode === "dark" || (mode === "system" && systemDark),
  );
  theme = await import("@/renderer/actions/theme");
});
afterEach(() => {
  for (const stop of stops) stop();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});
function start() {
  const stop = theme.startThemeSync();
  stops.push(stop);
  return stop;
}
function changeSystem(dark: boolean) {
  systemDark = dark;
  media.dispatchEvent(Object.assign(new Event("change"), { matches: dark }));
}
async function restored(mode: ThemeMode) {
  await vi.waitFor(() => expect(localStorage.getItem("theme")).toBe(mode));
}

test("restores an explicit preference and ignores system changes until system is selected", async () => {
  localStorage.setItem("theme", "dark");
  start();
  await vi.waitFor(() => expect(document.documentElement).toHaveClass("dark"));
  changeSystem(false);
  expect(document.documentElement).toHaveClass("dark");
  await theme.setTheme("system");
  expect(document.documentElement).not.toHaveClass("dark");
  changeSystem(true);
  expect(document.documentElement).toHaveClass("dark");
});
test("stops following the system when disposed", async () => {
  const stop = start();
  await restored("system");
  stop();
  changeSystem(true);
  expect(document.documentElement).not.toHaveClass("dark");
});
test("a user choice wins when startup restoration is still pending", async () => {
  const started = Promise.withResolvers<void>();
  const gate = Promise.withResolvers<boolean>();
  native.set.mockImplementationOnce(() => {
    started.resolve();
    return gate.promise;
  });
  start();
  await started.promise;
  const manual = theme.setTheme("light");
  gate.resolve(true);
  await manual;
  expect(localStorage.getItem("theme")).toBe("light");
  expect(document.documentElement).not.toHaveClass("dark");
});
test("failed native changes do not commit local state or poison later operations", async () => {
  await theme.setTheme("light");
  native.set.mockRejectedValueOnce(new Error("native unavailable"));
  await expect(theme.setTheme("dark")).rejects.toThrow("native unavailable");
  expect(localStorage.getItem("theme")).toBe("light");
  expect(document.documentElement).not.toHaveClass("dark");
  await theme.setTheme("dark");
  expect(document.documentElement).toHaveClass("dark");
});
test("storage failures do not prevent restoring or changing appearance", async () => {
  systemDark = true;
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("storage unavailable");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("storage unavailable");
  });
  start();
  await vi.waitFor(() => expect(document.documentElement).toHaveClass("dark"));
  await theme.setTheme("light");
  expect(document.documentElement).not.toHaveClass("dark");
});
test("an aborted startup does not commit its late response", async () => {
  const started = Promise.withResolvers<void>();
  const gate = Promise.withResolvers<boolean>();
  native.set.mockImplementationOnce(() => {
    started.resolve();
    return gate.promise;
  });
  const stop = start();
  await started.promise;
  stop();
  gate.resolve(true);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(localStorage.getItem("theme")).toBeNull();
  expect(document.documentElement).not.toHaveClass("dark");
});
