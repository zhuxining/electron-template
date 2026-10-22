import { RPCHandler } from "@orpc/server/message-port";
import type { BrowserWindow } from "electron";

import { router } from "./router";

export const rpcHandler: RPCHandler<{ window: BrowserWindow }> = new RPCHandler(router);
