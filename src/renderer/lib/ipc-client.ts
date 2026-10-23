import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/message-port";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils, type RouterUtils } from "@orpc/tanstack-query";

import type { router } from "@/main/ipc/router";
import { IPC_CHANNELS } from "@/shared/constants";

let client: RouterClient<typeof router> | undefined;
let utils: RouterUtils<RouterClient<typeof router>> | undefined;

function getClient() {
  if (!client) {
    const { port1, port2 } = new MessageChannel();
    client = createORPCClient(new RPCLink({ port: port1 }));
    port1.start();
    window.postMessage(
      IPC_CHANNELS.START_ORPC_SERVER,
      window.location.protocol === "file:" ? "*" : window.location.origin,
      [port2],
    );
    window.addEventListener("pagehide", () => port1.close(), { once: true });
  }
  return client;
}

export const ipc = {
  get client() {
    return getClient();
  },
  get utils() {
    return (utils ??= createTanstackQueryUtils(getClient(), { prefix: "ipc" }));
  },
};
