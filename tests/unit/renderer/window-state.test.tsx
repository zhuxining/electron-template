import { act, renderHook, cleanup } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vite-plus/test";

import { getPlatform, watchWindowState } from "@/renderer/actions/app";
import { useWindowState } from "@/renderer/hooks/use-window-state";
import type { WindowState } from "@/shared/window-state";
vi.mock("@/renderer/actions/app", () => ({
  getPlatform: vi.fn<typeof getPlatform>(),
  watchWindowState: vi.fn<typeof watchWindowState>(),
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
test("platform detection does not wait for the window stream", async () => {
  vi.mocked(getPlatform).mockResolvedValue("darwin");
  const stream = Promise.withResolvers<AsyncGenerator<WindowState>>();
  vi.mocked(watchWindowState).mockReturnValue(stream.promise);
  const { result, unmount } = renderHook(() => useWindowState());
  await vi.waitFor(() =>
    expect(result.current).toEqual({ platform: "darwin", isFullScreen: false }),
  );
  unmount();
  const signal = vi.mocked(watchWindowState).mock.calls[0]?.[0];
  expect(signal?.aborted).toBe(true);
  stream.resolve(
    (async function* () {
      yield { platform: "darwin", isFullScreen: true };
    })(),
  );
});
test("an initial fullscreen snapshot is not overwritten by a late platform response", async () => {
  const platform = Promise.withResolvers<Awaited<ReturnType<typeof getPlatform>>>();
  vi.mocked(getPlatform).mockReturnValue(platform.promise);
  vi.mocked(watchWindowState).mockResolvedValue(
    (async function* () {
      yield { platform: "darwin", isFullScreen: true };
    })(),
  );
  const { result } = renderHook(() => useWindowState());
  await vi.waitFor(() => expect(result.current?.isFullScreen).toBe(true));
  await act(async () => {
    platform.resolve("darwin");
  });
  expect(result.current).toEqual({ platform: "darwin", isFullScreen: true });
});
