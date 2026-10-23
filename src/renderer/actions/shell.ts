import { ipc } from "@/renderer/lib/ipc-client";

export function openExternalLinkMutationOptions() {
  return ipc.utils.shell.openExternalLink.mutationOptions({
    onError: (error) => {
      console.error("Failed to open external link:", error);
    },
  });
}
