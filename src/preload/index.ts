import { ipcRenderer } from "electron";

import { IPC_CHANNELS } from "@/shared/constants";

function connect(event: MessageEvent) {
  if (event.data !== IPC_CHANNELS.START_ORPC_SERVER) return;
  // Local file messages serialize their opaque origin as "null" in Electron.
  const expectedOrigin = window.location.protocol === "file:" ? "null" : window.location.origin;
  if (event.source !== window || event.origin !== expectedOrigin || event.ports.length !== 1) {
    for (const port of event.ports) port.close();
    return;
  }
  const [port] = event.ports;
  if (!port) return;
  window.removeEventListener("message", connect);
  ipcRenderer.postMessage(IPC_CHANNELS.START_ORPC_SERVER, null, [port]);
}
window.addEventListener("message", connect);
