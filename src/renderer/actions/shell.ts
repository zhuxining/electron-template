import { ipc } from "@/renderer/lib/ipc-client";

export function openExternalLink(url: string) {
  return ipc.client.shell.openExternalLink({ url });
}
