import { expect, test } from "@playwright/test";

import { launchTestApp } from "./fixtures";

test("the sandboxed renderer reaches native state through IPC without Node globals", async () => {
  const { app, dispose } = await launchTestApp();
  try {
    const page = await app.firstWindow();
    await expect(page.locator(".window-frame")).toHaveAttribute("data-platform", process.platform);
    const globals = await page.evaluate(() => ({
      require: typeof Reflect.get(window, "require"),
      process: typeof Reflect.get(window, "process"),
    }));
    expect(globals).toEqual({ require: "undefined", process: "undefined" });
    expect(await page.evaluate(() => window.open("https://example.com") === null)).toBe(true);
    expect(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)).toBe(1);
    const renderer = await app.evaluate(({ app: nativeApp, BrowserWindow }) =>
      nativeApp
        .getAppMetrics()
        .find(
          (entry) => entry.pid === BrowserWindow.getAllWindows()[0]!.webContents.getOSProcessId(),
        ),
    );
    if (renderer?.sandboxed !== undefined) expect(renderer.sandboxed).toBe(true);
  } finally {
    await dispose();
  }
});
