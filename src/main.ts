import path from "node:path";

import { app, BrowserWindow } from "electron";
import { ipcMain } from "electron/main";
import { UpdateSourceType, updateElectronApp } from "update-electron-app";

import { ipcContext } from "@/ipc/context";

import { IPC_CHANNELS, inDevelopment } from "./constants";
import { getBasePath } from "./utils/path";

function createWindow() {
  const basePath = getBasePath();
  const preload = path.join(basePath, "preload.cjs");
  const mainWindow = new BrowserWindow({
    height: 600,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    trafficLightPosition: process.platform === "darwin" ? { x: 5, y: 5 } : undefined,
    webPreferences: {
      contextIsolation: true,
      devTools: inDevelopment,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,

      preload,
    },
    width: 800,
  });
  ipcContext.setMainWindow(mainWindow);

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
    rpcHandler.upgrade(serverPort);
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
