import { createMemoryHistory, createRouter } from "@tanstack/react-router";

import { queryClient } from "@/renderer/lib/query-client";
import { routeTree } from "@/renderer/routeTree.gen";

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export const router = createRouter({
  context: { queryClient },
  defaultPreloadStaleTime: 0,
  history: createMemoryHistory({
    initialEntries: ["/"],
  }),
  routeTree,
});
