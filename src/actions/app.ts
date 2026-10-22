import { ipc } from "@/ipc/manager";

export function getPlatform() {
  return ipc.client.app.currentPlatfom();
}

export function getAppVersion() {
  return ipc.client.app.appVersion();
}

export function watchWindowState(signal: AbortSignal) {
  return ipc.client.app.windowState(undefined, { signal });
}
