import { app, BrowserWindow, type MessagePortMain, type WebContents } from "electron";
import squirrelStartup from "electron-squirrel-startup";
import { ipcMain } from "electron/main";
import { UpdateSourceType, updateElectronApp } from "update-electron-app";

import { APP_CONFIG, updateRepository } from "@/shared/app-config";
import { IPC_CHANNELS } from "@/shared/constants";

import { rpcHandler } from "./ipc/handler";
import { isTrustedIpcSender } from "./security";
import { createAppWindow } from "./window";

const entries = new WeakMap<WebContents, string>();
const connections = new WeakMap<WebContents, MessagePortMain>();
const smokeTest = process.argv.includes("--smoke-test");

function createWindow() {
  const created = createAppWindow();
  const contents = created.window.webContents;
  entries.set(contents, created.entryUrl);
  const closeConnection = () => {
    connections.get(contents)?.close();
    connections.delete(contents);
  };
  contents.on("did-start-loading", closeConnection);
  contents.once("destroyed", closeConnection);
  created.loaded
    .then(async () => {
      if (!smokeTest) return;
      await contents.executeJavaScript(
        "new Promise((resolve, reject) => { const deadline = Date.now() + 10000; function check() { const frame = document.querySelector('.window-frame'); if (frame && frame.dataset.platform !== 'pending' && document.querySelector('h1')) resolve(true); else if (Date.now() > deadline) reject(new Error('Renderer or IPC did not become ready')); else setTimeout(check, 50); } check(); })",
      );
      const hasNode = await contents.executeJavaScript(
        "typeof require !== 'undefined' || typeof globalThis.process?.versions?.node !== 'undefined'",
      );
      if (hasNode) throw new Error("Unexpected renderer Node privileges");
      const renderer = app.getAppMetrics().find((entry) => entry.pid === contents.getOSProcessId());
      if (renderer?.sandboxed === false) throw new Error("Renderer sandbox is disabled");
      console.log("Packaged application and IPC are ready");
      app.exit(0);
    })
    .catch((error: unknown) => {
      console.error("Failed to initialize window:", error);
      app.exit(1);
    });
}

async function initializeApp() {
  await app.whenReady();
  app.setAppUserModelId(APP_CONFIG.appId);
  ipcMain.on(IPC_CHANNELS.START_ORPC_SERVER, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const entry = entries.get(event.sender);
    const [port] = event.ports;
    if (
      !window ||
      !entry ||
      event.ports.length !== 1 ||
      !port ||
      !isTrustedIpcSender(event, window.webContents, entry)
    ) {
      for (const rejected of event.ports) rejected.close();
      return;
    }
    connections.get(event.sender)?.close();
    connections.set(event.sender, port);
    rpcHandler.upgrade(port, { context: { window } });
    port.start();
  });
  createWindow();
  if (app.isPackaged && !smokeTest && process.platform !== "linux") {
    updateElectronApp({
      updateSource: { repo: updateRepository, type: UpdateSourceType.ElectronPublicUpdateService },
    });
  }
}

if (squirrelStartup) {
  app.quit();
} else {
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
  app.on("activate", () => {
    const [existing] = BrowserWindow.getAllWindows();
    if (!existing) {
      createWindow();
      return;
    }
    if (existing.isMinimized()) existing.restore();
    existing.show();
  });
  initializeApp().catch((error: unknown) => {
    console.error("Error during app initialization:", error);
    app.exit(1);
  });
}
