import path from "node:path";

import { app, BrowserWindow, nativeTheme } from "electron";
import { ipcMain } from "electron/main";
import { UpdateSourceType, updateElectronApp } from "update-electron-app";

import {
  getTitleBarOverlayColors,
  getWindowBackgroundColor,
  getWindowTitleBarOptions,
} from "./config/window";
import { IPC_CHANNELS, inDevelopment } from "./constants";
import { getBasePath } from "./utils/path";

function createWindow() {
  const basePath = getBasePath();
  const preload = path.join(basePath, "preload.cjs");
  const mainWindow = new BrowserWindow({
    backgroundColor: getWindowBackgroundColor(nativeTheme.shouldUseDarkColors),
    show: false,
    height: 600,
    ...getWindowTitleBarOptions(process.platform, nativeTheme.shouldUseDarkColors),
    webPreferences: {
      contextIsolation: true,
      devTools: inDevelopment,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,

      preload,
    },
    width: 800,
  });
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("close", () => mainWindow.hide());

  const updateWindowTheme = () => {
    mainWindow.setBackgroundColor(getWindowBackgroundColor(nativeTheme.shouldUseDarkColors));
    if (process.platform === "win32") {
      mainWindow.setTitleBarOverlay(getTitleBarOverlayColors(nativeTheme.shouldUseDarkColors));
    }
  };
  nativeTheme.on("updated", updateWindowTheme);
  mainWindow.once("closed", () => nativeTheme.removeListener("updated", updateWindowTheme));

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL).catch((error: unknown) => {
      console.error("Failed to load main window URL:", error);
    });
  } else {
    mainWindow
      .loadFile(path.join(basePath, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
      .catch((error: unknown) => {
        console.error("Failed to load main window file:", error);
      });
  }
}

function checkForUpdates() {
  if (!app.isPackaged) {
    return;
  }

  updateElectronApp({
    updateSource: {
      repo: "zhuxining/electron-template",
      type: UpdateSourceType.ElectronPublicUpdateService,
    },
  });
}

async function setupORPC() {
  const { rpcHandler } = await import("./ipc/handler");

  ipcMain.on(IPC_CHANNELS.START_ORPC_SERVER, (event) => {
    const [serverPort] = event.ports;
    if (!serverPort) {
      return;
    }

    serverPort.start();
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;
    rpcHandler.upgrade(serverPort, { context: { window } });
  });
}

async function initializeApp() {
  await app.whenReady();
  await setupORPC();
  createWindow();
  checkForUpdates();
}

initializeApp().catch((error: unknown) => {
  console.error("Error during app initialization:", error);
});

//osX only
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
//osX only ends
