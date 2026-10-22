import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";

import { setTheme, syncWithLocalTheme, watchSystemTheme } from "@/actions/theme";
import { ipc } from "@/ipc/manager";

vi.mock("@/ipc/manager", () => ({
  ipc: {
    client: {
      theme: {
        getCurrentThemeMode: vi
          .fn<typeof ipc.client.theme.getCurrentThemeMode>()
          .mockResolvedValue("system"),
        setThemeMode: vi.fn<typeof ipc.client.theme.setThemeMode>(),
      },
    },
  },
}));

let mediaQuery: EventTarget;
let prefersDark: boolean;

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  mediaQuery = new EventTarget();
  prefersDark = false;
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      get matches() {
        return prefersDark;
      },
      addEventListener: mediaQuery.addEventListener.bind(mediaQuery),
      removeEventListener: mediaQuery.removeEventListener.bind(mediaQuery),
    })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

function changeSystemTheme(dark: boolean) {
  prefersDark = dark;
  mediaQuery.dispatchEvent(Object.assign(new Event("change"), { matches: dark }));
}

test("defaults to the system dark theme without a saved preference", async () => {
  prefersDark = true;
  await syncWithLocalTheme();
  expect(ipc.client.theme.setThemeMode).toHaveBeenCalledWith("system");
  expect(localStorage.getItem("theme")).toBe("system");
  expect(document.documentElement).toHaveClass("dark");
});

test("the system light theme removes the dark appearance", async () => {
  document.documentElement.classList.add("dark");
  await syncWithLocalTheme();
  expect(document.documentElement).not.toHaveClass("dark");
});

test("restores an explicitly saved theme", async () => {
  localStorage.setItem("theme", "dark");
  await syncWithLocalTheme();
  expect(ipc.client.theme.setThemeMode).toHaveBeenCalledWith("dark");
  expect(document.documentElement).toHaveClass("dark");
});

test("follows system changes and stops watching when disposed", async () => {
  const stopWatching = watchSystemTheme();
  await syncWithLocalTheme();
  changeSystemTheme(true);
  expect(document.documentElement).toHaveClass("dark");
  changeSystemTheme(false);
  expect(document.documentElement).not.toHaveClass("dark");
  stopWatching();
  changeSystemTheme(true);
  expect(document.documentElement).not.toHaveClass("dark");
});

test("system changes respect a manual theme until system mode is selected", async () => {
  const stopWatching = watchSystemTheme();
  try {
    await setTheme("light");
    changeSystemTheme(true);
    expect(document.documentElement).not.toHaveClass("dark");
    await setTheme("dark");
    changeSystemTheme(false);
    expect(document.documentElement).toHaveClass("dark");
    await setTheme("system");
    expect(document.documentElement).not.toHaveClass("dark");
    changeSystemTheme(true);
    expect(document.documentElement).toHaveClass("dark");
  } finally {
    stopWatching();
  }
});
