import { EventPublisher, os } from "@orpc/server";
import { app, type BrowserWindow } from "electron";

export const currentPlatfom = os.handler(() => process.platform);

export const appVersion = os.handler(() => app.getVersion());

export const windowState = os.$context<{ window: BrowserWindow }>().handler(async function* ({
  context,
  signal,
}) {
  const window = context.window;
  const publisher = new EventPublisher<{ change: { platform: string; isFullScreen: boolean } }>();
  const readState = () => ({ platform: process.platform, isFullScreen: window.isFullScreen() });
  const enterFullScreen = () =>
    publisher.publish("change", { platform: process.platform, isFullScreen: true });
  const leaveFullScreen = () =>
    publisher.publish("change", { platform: process.platform, isFullScreen: false });
  const changes = publisher.subscribe("change", { signal });
  window.on("enter-full-screen", enterFullScreen);
  window.on("leave-full-screen", leaveFullScreen);
  try {
    yield readState();
    yield* changes;
  } finally {
    window.removeListener("enter-full-screen", enterFullScreen);
    window.removeListener("leave-full-screen", leaveFullScreen);
    await changes.return();
  }
});
