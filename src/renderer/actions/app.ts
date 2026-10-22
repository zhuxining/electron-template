import { ipc } from "@/renderer/lib/ipc-client";

export function getPlatform() {
  return ipc.client.app.currentPlatform();
}

export function getAppVersion() {
  return ipc.client.app.appVersion();
}

export function watchWindowState(signal: AbortSignal) {
  return ipc.client.app.windowState(undefined, { signal });
}
