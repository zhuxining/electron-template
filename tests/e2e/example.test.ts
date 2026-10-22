import { type ElectronApplication, expect, type Page, test } from "@playwright/test";

import { launchTestApp } from "./fixtures";

/*
 * Using Playwright with Electron:
 * https://www.electronjs.org/pt/docs/latest/tutorial/automated-testing#using-playwright
 */

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

test("renders the first page", async () => {
  const page: Page = await electronApp.firstWindow();

  const title = await page.waitForSelector("h1");
  const text = await title.textContent();
  expect(text).toBe("electron-template");
});

test("three columns span the viewport and their content fills the available height", async () => {
  const page = await electronApp.firstWindow();
  await expect(page.locator(".window-frame")).toHaveAttribute("data-platform", process.platform);
  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => {
      const box = document.querySelector(selector)!.getBoundingClientRect();
      return { x: box.x, top: box.top, bottom: box.bottom, height: box.height, right: box.right };
    };
    return {
      left: rect("#window-left-panel"),
      center: rect("#window-main-panel"),
      right: rect("#window-right-panel"),
      headers: [...document.querySelectorAll(".window-title-bar")].map(
        (element) => element.getBoundingClientRect().top,
      ),
      title: rect("#window-main-panel .window-title-bar"),
      content: rect(".window-frame-content"),
      pageContent: rect(".window-frame-content > .flex-1"),
      navigation: rect(".window-frame-content > [data-slot=navigation-menu]"),
      height: innerHeight,
    };
  });
  for (const column of [geometry.left, geometry.center, geometry.right]) {
    expect(column.top).toBe(0);
    expect(column.bottom).toBe(geometry.height);
  }
  expect(geometry.headers).toEqual([0, 0, 0]);
  expect(geometry.left.right).toBeLessThanOrEqual(geometry.center.x);
  expect(geometry.center.right).toBeLessThanOrEqual(geometry.right.x);
  expect(geometry.content.top).toBe(geometry.title.bottom);
  expect(geometry.content.bottom).toBe(geometry.height);
  expect(geometry.pageContent.top).toBe(geometry.navigation.bottom);
  expect(geometry.pageContent.height).toBe(
    geometry.content.height - geometry.navigation.height - 16,
  );
  expect(geometry.pageContent.bottom).toBe(geometry.height - 8);
});

test("native fullscreen adapts both panel buttons and preserves full content height", async () => {
  const page = await electronApp.firstWindow();
  const frame = page.locator(".window-frame");
  const leftToggle = page.getByRole("button", { name: "Toggle left panel" });
  const rightToggle = page.getByRole("button", { name: "Toggle right panel" });
  const rightInset = () =>
    rightToggle.evaluate((button) => innerWidth - button.getBoundingClientRect().right);
  const expectedRightInset = process.platform === "win32" ? 150 : 12;
  await expect.poll(rightInset).toBeCloseTo(expectedRightInset, 1);
  const normalX = (await leftToggle.boundingBox())!.x;
  const title = page.locator("#window-main-panel .window-title-bar-title");
  const titleBarHeight = (await page.locator("#window-main-panel .window-title-bar").boundingBox())!
    .height;
  try {
    await electronApp.evaluate(async ({ BrowserWindow }) => {
      const window = BrowserWindow.getAllWindows()[0]!;
      await new Promise<void>((resolve) => {
        window.once("enter-full-screen", () => resolve());
        window.setFullScreen(true);
      });
    });
    await expect(frame).toHaveAttribute("data-full-screen", "true");
    await expect(title).toHaveText("electron-template");
    if (process.platform === "darwin") {
      expect((await leftToggle.boundingBox())!.x).toBe(12);
      expect((await leftToggle.boundingBox())!.x).toBeLessThan(normalX);
    }
    await expect.poll(rightInset).toBeCloseTo(12, 1);
    await rightToggle.click();
    await expect(rightToggle).toHaveAttribute("aria-expanded", "false");
    // The collapsed panel leaves a 1px separator at the window edge.
    await expect.poll(rightInset).toBeCloseTo(13, 1);
    await rightToggle.click();
    await expect(rightToggle).toHaveAttribute("aria-expanded", "true");
    await expect.poll(rightInset).toBeCloseTo(12, 1);
    const content = await page.locator(".window-frame-content").boundingBox();
    expect(content!.y).toBe(titleBarHeight);
    expect(content!.y + content!.height).toBe(await page.evaluate(() => innerHeight));
    await leftToggle.click();
    await expect(leftToggle).toHaveAttribute("aria-expanded", "false");
    if (process.platform === "darwin") {
      const centerX = (await page.getByTestId("window-main-panel").boundingBox())!.x;
      expect((await leftToggle.boundingBox())!.x - centerX).toBe(12);
    }
    await leftToggle.click();
    await expect(leftToggle).toHaveAttribute("aria-expanded", "true");
  } finally {
    await electronApp.evaluate(async ({ BrowserWindow }) => {
      const window = BrowserWindow.getAllWindows()[0]!;
      if (!window.isFullScreen()) return;
      await new Promise<void>((resolve) => {
        window.once("leave-full-screen", () => resolve());
        window.setFullScreen(false);
      });
    });
  }
  await expect(frame).toHaveAttribute("data-full-screen", "false");
  expect((await leftToggle.boundingBox())!.x).toBe(normalX);
  await expect.poll(rightInset).toBeCloseTo(expectedRightInset, 1);
});

test("panel buttons share the native traffic light center line", async () => {
  const page = await electronApp.firstWindow();
  const header = (await page.locator("#window-main-panel .window-title-bar").boundingBox())!;
  for (const button of await page.locator(".window-title-bar").getByRole("button").all()) {
    const box = (await button.boundingBox())!;
    expect(Math.abs(box.y + box.height / 2 - (header.y + header.height / 2))).toBeLessThan(0.01);
    expect(
      await button.evaluate((element) =>
        getComputedStyle(element).getPropertyValue("-webkit-app-region"),
      ),
    ).toBe("no-drag");
  }
  if (process.platform === "darwin") {
    const position = await electronApp.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]!.getWindowButtonPosition(),
    );
    expect(position!.y + 7).toBe(header.height / 2);
    const leftButton = (await page
      .getByRole("button", { name: "Toggle left panel" })
      .boundingBox())!;
    expect(leftButton.x).toBeGreaterThanOrEqual(position!.x + 54);
  }
});

test("panels collapse independently and restore their resized width", async () => {
  const page = await electronApp.firstWindow();
  const leftToggle = page.getByRole("button", { name: "Toggle left panel" });
  const rightToggle = page.getByRole("button", { name: "Toggle right panel" });
  const leftPanel = page.getByTestId("window-left-panel");
  const rightPanel = page.getByTestId("window-right-panel");
  const width = async (panel: ReturnType<Page["getByTestId"]>) =>
    (await panel.boundingBox())!.width;

  await page.getByRole("separator", { name: "Resize left panel" }).focus();
  await page.keyboard.press("ArrowRight");
  const leftWidth = await width(leftPanel);
  const rightWidth = await width(rightPanel);

  try {
    await leftToggle.click();
    await expect(leftToggle).toHaveAttribute("aria-expanded", "false");
    await expect(rightToggle).toHaveAttribute("aria-expanded", "true");
    await expect.poll(() => width(leftPanel)).toBe(0);
    expect(await width(rightPanel)).toBeCloseTo(rightWidth, 0);

    await rightToggle.click();
    await expect(rightToggle).toHaveAttribute("aria-expanded", "false");
    await expect.poll(() => width(rightPanel)).toBe(0);
    if (process.platform === "darwin") {
      const box = (await rightToggle.boundingBox())!;
      expect((await page.evaluate(() => innerWidth)) - box.x - box.width).toBeCloseTo(13, 1);
    }

    await leftToggle.click();
    await expect(leftToggle).toHaveAttribute("aria-expanded", "true");
    await expect.poll(() => width(leftPanel)).toBeCloseTo(leftWidth, 0);
    await expect(rightToggle).toHaveAttribute("aria-expanded", "false");

    await rightToggle.click();
    await expect.poll(() => width(rightPanel)).toBeCloseTo(rightWidth, 0);
  } finally {
    if ((await leftToggle.getAttribute("aria-expanded")) === "false") await leftToggle.click();
    if ((await rightToggle.getAttribute("aria-expanded")) === "false") await rightToggle.click();
  }
});

test("panel buttons do not jump while collapsing or expanding", async () => {
  const page = await electronApp.firstWindow();
  for (const side of ["left", "right"]) {
    const label = `Toggle ${side} panel`;
    const button = page.getByRole("button", { name: label });
    const initialState = await button.getAttribute("aria-expanded");
    try {
      for (let toggle = 0; toggle < 2; toggle++) {
        const positions = page.evaluate(
          (label) =>
            new Promise<number[]>((resolve) => {
              const samples: number[] = [];
              const sample = () => {
                const button = document.querySelector(`[aria-label="${label}"]`)!;
                samples.push(button.getBoundingClientRect().x);
                if (samples.length < 20) requestAnimationFrame(sample);
                else resolve(samples);
              };
              document.addEventListener(
                "click",
                () => {
                  sample();
                },
                { once: true, capture: true },
              );
            }),
          label,
        );
        await button.click();
        const samples = await positions;
        // Moving between column headers may cross the 1px panel separator.
        expect(Math.max(...samples) - Math.min(...samples)).toBeLessThanOrEqual(1.1);
      }
    } finally {
      if ((await button.getAttribute("aria-expanded")) !== initialState) await button.click();
    }
  }
});
