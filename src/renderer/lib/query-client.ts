import { createQueryKeyHashFn } from "@orpc/tanstack-query";
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, queryKeyHashFn: createQueryKeyHashFn() },
    mutations: { retry: false },
  },
});

// MessagePort operations remain available without a network connection.
queryClient.setQueryDefaults(["ipc"], { networkMode: "always" });
queryClient.setMutationDefaults(["ipc"], { networkMode: "always" });
