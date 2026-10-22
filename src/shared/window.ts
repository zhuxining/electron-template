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
