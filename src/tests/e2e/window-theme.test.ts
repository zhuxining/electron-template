import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { type ElectronApplication, _electron as electron, expect, test } from "@playwright/test";
import { findLatestBuild, parseElectronApp } from "electron-playwright-helpers";

let electronApp: ElectronApplication;
let profile: string;

test.beforeAll(async () => {
  profile = await mkdtemp(path.join(tmpdir(), "electron-window-theme-"));
  const appInfo = parseElectronApp(findLatestBuild());
  electronApp = await electron.launch({ args: [`--user-data-dir=${profile}`, appInfo.main] });
});

test.afterAll(async () => {
  await electronApp?.close();
  if (profile) await rm(profile, { recursive: true, force: true });
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

test("closing hides the window before its renderer is destroyed", async () => {
  test.skip(
    process.platform !== "darwin",
    "macOS keeps the process alive after its final window closes",
  );
  const visibleOnClose = await electronApp.evaluate(({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows()[0]!;
    let visible = true;
    window.on("close", () => {
      visible = window.isVisible();
    });
    window.close();
    return visible;
  });
  expect(visibleOnClose).toBe(false);
});
