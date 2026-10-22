import { type ElectronApplication, expect, test } from "@playwright/test";

import { launchTestApp } from "./fixtures";

let electronApp: ElectronApplication;
let dispose: (() => Promise<void>) | undefined;
test.beforeAll(async () => {
  const launched = await launchTestApp();
  electronApp = launched.app;
  dispose = launched.dispose;
});
test.afterAll(async () => {
  await dispose?.();
});

test("an invalid saved preference recovers to system mode through the real IPC path", async () => {
  const page = await electronApp.firstWindow();
  await page.locator("h1").waitFor();
  await page.evaluate(() => localStorage.setItem("theme", "purple"));
  await page.reload();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("theme"))).toBe("system");
  await expect
    .poll(() => electronApp.evaluate(({ nativeTheme }) => nativeTheme.themeSource))
    .toBe("system");
  await electronApp.evaluate(({ nativeTheme }) => {
    nativeTheme.themeSource = "dark";
  });
  await expect(page.locator("html")).toHaveClass(/dark/);
  await electronApp.evaluate(({ nativeTheme }) => {
    nativeTheme.themeSource = "light";
  });
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("the saved theme is painted even before the application module loads", async () => {
  const page = await electronApp.firstWindow();
  await page.locator("h1").waitFor();
  await page.evaluate(() => localStorage.setItem("theme", "dark"));
  await electronApp.evaluate(({ nativeTheme }) => {
    nativeTheme.themeSource = "light";
  });
  await page.addInitScript(() => {
    new PerformanceObserver((entries) => {
      if (entries.getEntries().some((entry) => entry.name === "first-paint")) {
        document.documentElement.dataset.firstPaintDark = String(
          document.documentElement.classList.contains("dark"),
        );
      }
    }).observe({ type: "paint", buffered: true });
  });
  await page.route("**/assets/*.js", (route) => route.abort());
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-first-paint-dark", "true");
  await expect(page.locator("#app")).toBeEmpty();
  expect(
    await page.locator("html").evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toMatch(/^(rgb\(10, 10, 10\)|oklch\(0\.145 0 0\))$/);
});

test("native window background tracks dark and light themes", async () => {
  for (const [mode, expected] of [
    ["dark", "0a0a0a"],
    ["light", "ffffff"],
  ] as const) {
    await electronApp.evaluate(({ nativeTheme }, mode) => {
      nativeTheme.themeSource = mode;
    }, mode);
    await expect
      .poll(() =>
        electronApp.evaluate(({ BrowserWindow }) =>
          BrowserWindow.getAllWindows()[0]!.getBackgroundColor().toLowerCase(),
        ),
      )
      .toMatch(new RegExp(`${expected}$`));
  }
});

test("closing destroys the window on macOS and dock activation recreates it", async () => {
  test.skip(
    process.platform !== "darwin",
    "macOS keeps the process alive after its final window closes",
  );
  const remaining = await electronApp.evaluate(async ({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows()[0]!;
    const closed = new Promise<void>((resolve) => window.once("closed", () => resolve()));
    window.close();
    await closed;
    return BrowserWindow.getAllWindows().length;
  });
  expect(remaining).toBe(0);
  const recreated = await electronApp.evaluate(({ app, BrowserWindow }) => {
    app.emit("activate");
    return BrowserWindow.getAllWindows().length;
  });
  expect(recreated).toBe(1);
});
