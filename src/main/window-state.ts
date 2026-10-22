import type { EventEmitter } from "node:events";

import { EventPublisher } from "@orpc/server";

import type { WindowState } from "@/shared/window-state";

type WindowSource = EventEmitter & { isFullScreen(): boolean };

export async function* observeWindowState(window: WindowSource, signal?: AbortSignal) {
  if (signal?.aborted) return;
  const closed = new AbortController();
  const subscriptionSignal = signal ? AbortSignal.any([signal, closed.signal]) : closed.signal;
  const publisher = new EventPublisher<{ change: WindowState }>();
  const changes = publisher.subscribe("change", { signal: subscriptionSignal });
  const publish = (isFullScreen: boolean) =>
    publisher.publish("change", { platform: process.platform, isFullScreen });
  const enter = () => publish(true);
  const leave = () => publish(false);
  const stop = () => closed.abort();
  window.on("enter-full-screen", enter);
  window.on("leave-full-screen", leave);
  window.on("closed", stop);
  try {
    if (subscriptionSignal.aborted) return;
    yield { platform: process.platform, isFullScreen: window.isFullScreen() };
    yield* changes;
  } catch (error) {
    if (!subscriptionSignal.aborted) throw error;
  } finally {
    window.removeListener("enter-full-screen", enter);
    window.removeListener("leave-full-screen", leave);
    window.removeListener("closed", stop);
    await changes.return();
  }
}
