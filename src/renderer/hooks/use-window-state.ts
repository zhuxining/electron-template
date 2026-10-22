import { useEffect, useState } from "react";

import { getPlatform, watchWindowState } from "@/renderer/actions/app";
import type { WindowState } from "@/shared/window-state";

export function useWindowState() {
  const [state, setState] = useState<WindowState | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    getPlatform()
      .then((platform) => {
        if (!controller.signal.aborted)
          setState((current) => current ?? { platform, isFullScreen: false });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) console.error("Failed to detect platform:", error);
      });
    async function subscribe() {
      const states = await watchWindowState(controller.signal);
      for await (const next of states) {
        if (controller.signal.aborted) break;
        setState(next);
      }
    }
    subscribe().catch((error: unknown) => {
      if (!controller.signal.aborted) console.error("Failed to observe window state:", error);
    });
    return () => controller.abort();
  }, []);
  return state;
}
