import { ipc } from "@/renderer/lib/ipc-client";

export function getPlatform() {
  return ipc.client.app.currentPlatform();
}

export function appVersionQueryOptions() {
  return ipc.utils.app.appVersion.queryOptions({ staleTime: Infinity });
}

export function watchWindowState(signal: AbortSignal) {
  return ipc.client.app.windowState(undefined, { signal });
}
