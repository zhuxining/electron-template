import type { BrowserWindowConstructorOptions } from "electron";

const TITLE_BAR_LAYOUT = {
  darwin: { height: 48, controlsWidth: 88 },
  win32: { height: 40, controlsWidth: 138 },
  other: { height: 40, controlsWidth: 0 },
} as const;

export function getTitleBarLayout(platform: string) {
  return TITLE_BAR_LAYOUT[platform === "darwin" || platform === "win32" ? platform : "other"];
}

export function getWindowBackgroundColor(isDark: boolean) {
  return isDark ? "#0a0a0a" : "#ffffff";
}

export function getTitleBarOverlayColors(isDark: boolean) {
  return isDark
    ? { color: "#252525", symbolColor: "#fafafa" }
    : { color: "#ffffff", symbolColor: "#252525" };
}

export function getWindowTitleBarOptions(
  platform: string,
  isDark = false,
): BrowserWindowConstructorOptions {
  if (platform === "darwin") {
    // Native traffic lights are 14 points tall; share the renderer's center line.
    return {
      titleBarStyle: "hiddenInset",
      trafficLightPosition: { x: 16, y: (getTitleBarLayout(platform).height - 14) / 2 },
    };
  }
  if (platform === "win32") {
    return {
      titleBarStyle: "hidden",
      titleBarOverlay: {
        ...getTitleBarOverlayColors(isDark),
        height: getTitleBarLayout(platform).height,
      },
    };
  }
  return { titleBarStyle: "default" };
}
