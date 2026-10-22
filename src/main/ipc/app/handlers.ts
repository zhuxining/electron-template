import { os } from "@orpc/server";
import { app, type BrowserWindow } from "electron";

import { observeWindowState } from "@/main/window-state";

export const currentPlatform = os.handler(() => process.platform);
export const appVersion = os.handler(() => app.getVersion());
export const windowState = os
  .$context<{ window: BrowserWindow }>()
  .handler(({ context, signal }) => observeWindowState(context.window, signal));
