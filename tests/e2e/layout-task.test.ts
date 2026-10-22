import { expect, test } from "@playwright/test";

import { launchTestApp } from "./fixtures";

test("a resized panel keeps its width after a relaunch", async () => {
  const first = await launchTestApp();
  let second: Awaited<ReturnType<typeof launchTestApp>> | undefined;
  try {
    const page = await first.app.firstWindow();
    const panel = page.locator("#window-left-panel");
    await expect(panel).toBeVisible();
    const before = (await panel.boundingBox())!.width;

    const handle = page.locator('[aria-label="Resize left panel"]');
    const box = (await handle.boundingBox())!;
    const y = box.y + box.height / 2;
    const x = box.x + box.width / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 50, y, { steps: 8 });
    await page.mouse.up();

    await expect.poll(async () => (await panel.boundingBox())!.width).toBeGreaterThan(before + 30);
    const resized = (await panel.boundingBox())!.width;

    await first.dispose({ keepProfile: true });
    second = await launchTestApp({ profile: first.profile });
    const relaunched = await second.app.firstWindow();
    const restored = relaunched.locator("#window-left-panel");
    await expect(restored).toBeVisible();
    await expect
      .poll(async () => Math.abs((await restored.boundingBox())!.width - resized))
      .toBeLessThan(4);
  } finally {
    await first.dispose();
    await second?.dispose();
  }
});
