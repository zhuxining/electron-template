import path from "node:path";
import { pathToFileURL } from "node:url";

import { app, BrowserWindow, nativeTheme, type BrowserWindowConstructorOptions } from "electron";

import { APP_CONFIG } from "@/shared/app-config";
import {
  getTitleBarLayout,
  getTitleBarOverlayColors,
  getWindowBackgroundColor,
} from "@/shared/window";

import { getBasePath } from "./path";
import { isTrustedRendererUrl } from "./security";

function getTitleBarOptions(): BrowserWindowConstructorOptions {
  const height = getTitleBarLayout(process.platform).height;
  if (process.platform === "darwin")
    return { titleBarStyle: "hiddenInset", trafficLightPosition: { x: 16, y: (height - 14) / 2 } };
  if (process.platform === "win32")
    return {
      titleBarStyle: "hidden",
      titleBarOverlay: { ...getTitleBarOverlayColors(nativeTheme.shouldUseDarkColors), height },
    };
  return { titleBarStyle: "default" };
}

export function createAppWindow() {
  const basePath = getBasePath();
  const entryUrl =
    MAIN_WINDOW_VITE_DEV_SERVER_URL ||
    pathToFileURL(path.join(basePath, "../renderer/", MAIN_WINDOW_VITE_NAME, "index.html")).href;
  const window = new BrowserWindow({
    title: APP_CONFIG.name,
    backgroundColor: getWindowBackgroundColor(nativeTheme.shouldUseDarkColors),
    show: false,
    height: 600,
    width: 800,
    ...getTitleBarOptions(),
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      nodeIntegrationInSubFrames: false,
      webviewTag: false,
      devTools: !app.isPackaged,
      preload: path.join(basePath, "preload.cjs"),
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (!isTrustedRendererUrl(url, entryUrl)) event.preventDefault();
  });
  window.webContents.on("will-attach-webview", (event) => event.preventDefault());
  window.once("ready-to-show", () => {
    if (!process.argv.includes("--smoke-test")) window.show();
  });
  const updateTheme = () => {
    window.setBackgroundColor(getWindowBackgroundColor(nativeTheme.shouldUseDarkColors));
    if (process.platform === "win32")
      window.setTitleBarOverlay(getTitleBarOverlayColors(nativeTheme.shouldUseDarkColors));
  };
  nativeTheme.on("updated", updateTheme);
  window.once("closed", () => nativeTheme.removeListener("updated", updateTheme));
  const loaded = window.loadURL(entryUrl);
  return { window, entryUrl, loaded };
}
