import { expect, test } from "@playwright/test";

import { launchTestApp } from "./fixtures";

test("a theme chosen in the UI survives a relaunch", async () => {
  const first = await launchTestApp();
  let second: Awaited<ReturnType<typeof launchTestApp>> | undefined;
  try {
    const page = await first.app.firstWindow();
    const toggle = page.getByRole("button", { name: "Toggle theme" });
    await expect(toggle).toBeEnabled();
    const startedDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    const chosen = startedDark ? "light" : "dark";

    await toggle.click();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains("dark")))
      .toBe(chosen === "dark");
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(chosen);

    await first.dispose({ keepProfile: true });
    second = await launchTestApp({ profile: first.profile });
    const relaunched = await second.app.firstWindow();
    await expect
      .poll(() => relaunched.evaluate(() => document.documentElement.classList.contains("dark")))
      .toBe(chosen === "dark");
    expect(await relaunched.evaluate(() => localStorage.getItem("theme"))).toBe(chosen);
  } finally {
    try {
      await second?.dispose();
    } finally {
      await first.dispose();
    }
  }
});
