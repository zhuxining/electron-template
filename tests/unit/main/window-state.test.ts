import { EventEmitter } from "node:events";

import { expect, test } from "vite-plus/test";

import { observeWindowState } from "@/main/window-state";

function createWindow() {
  return Object.assign(new EventEmitter(), { isFullScreen: () => false });
}
function expectClean(window: EventEmitter) {
  for (const event of ["enter-full-screen", "leave-full-screen", "closed"])
    expect(window.listenerCount(event)).toBe(0);
}
test("yields the initial state, buffers rapid changes in order, and cleans up on return", async () => {
  const window = createWindow();
  const states = observeWindowState(window);
  expect((await states.next()).value).toEqual({ platform: process.platform, isFullScreen: false });
  try {
    window.emit("enter-full-screen");
    window.emit("leave-full-screen");
    window.emit("enter-full-screen");
    for (const isFullScreen of [true, false, true]) {
      expect((await states.next()).value).toEqual({ platform: process.platform, isFullScreen });
    }
  } finally {
    await states.return();
  }
  expectClean(window);
});
test("abort terminates a pending observation and removes native listeners", async () => {
  const window = createWindow();
  const controller = new AbortController();
  const states = observeWindowState(window, controller.signal);
  await states.next();
  const pending = states.next();
  controller.abort();
  expect((await pending).done).toBe(true);
  expectClean(window);
});
test("window destruction terminates the observation without waiting for the renderer", async () => {
  const window = createWindow();
  const states = observeWindowState(window);
  await states.next();
  const pending = states.next();
  window.emit("closed");
  expect((await pending).done).toBe(true);
  expectClean(window);
});
test("an already canceled observation never yields a snapshot", async () => {
  const window = createWindow();
  const states = observeWindowState(window, AbortSignal.abort());
  expect((await states.next()).done).toBe(true);
  expectClean(window);
});
