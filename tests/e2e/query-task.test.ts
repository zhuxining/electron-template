import { expect, test } from "@playwright/test";

import { launchTestApp } from "./fixtures";

test("the app version loads offline and stays cached across page navigation", async () => {
  const { app, dispose } = await launchTestApp();
  try {
    const page = await app.firstWindow();
    const version = await app.evaluate(({ app }) => app.getVersion());
    await expect(page.getByTestId("app-version")).toHaveText(`v${version}`);
    await page.context().setOffline(true);
    await page.reload();
    await expect(page.getByTestId("app-version")).toHaveText(`v${version}`);

    // A return to the home page should use the cached version even if IPC now fails.
    await app.evaluate(({ app }) => {
      app.getVersion = () => {
        throw new Error("Version temporarily unavailable");
      };
    });
    await page.getByRole("link", { name: "Second Page", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Second Page" })).toBeVisible();
    await page.getByRole("link", { name: "Home Page", exact: true }).click();
    await expect(page.getByTestId("app-version")).toHaveText(`v${version}`);
  } finally {
    await dispose();
  }
});

test("a failed version query can be retried from the home page", async () => {
  const { app, dispose } = await launchTestApp();
  try {
    const page = await app.firstWindow();
    await expect(page.getByTestId("app-version")).toBeVisible();
    const version = await app.evaluate(({ app }) => {
      const version = app.getVersion();
      app.getVersion = () => {
        throw new Error("Version temporarily unavailable");
      };
      return version;
    });
    await page.reload();
    const retry = page.getByRole("button", { name: "Version unavailable. Retry" });
    await expect(retry).toBeVisible();

    await app.evaluate(({ app }, version) => {
      app.getVersion = () => version;
    }, version);
    await retry.click();
    await expect(page.getByTestId("app-version")).toHaveText(`v${version}`);
    await expect(retry).toHaveCount(0);
  } finally {
    await dispose();
  }
});

test("external link mutations run offline and allow retry after a native failure", async () => {
  const { app, dispose } = await launchTestApp();
  try {
    const page = await app.firstWindow();
    await expect(page.getByTestId("app-version")).toBeVisible();
    await app.evaluate(({ shell }) => {
      const attempts: string[] = [];
      Reflect.set(shell, "externalLinkAttempts", attempts);
      // Exercise the real IPC handler without opening the operating system browser.
      shell.openExternal = async (url: string) => {
        attempts.push(url);
        if (attempts.length === 1) throw new Error("Browser temporarily unavailable");
      };
    });
    await page.context().setOffline(true);
    const link = page.getByRole("button", { name: "Documentation", exact: true });
    const failure = page.waitForEvent("console", {
      predicate: (message) => message.text().includes("Failed to open external link:"),
    });
    await link.click();
    await failure;
    await expect(link).toBeEnabled();
    const attempts = () =>
      app.evaluate(({ shell }) => Reflect.get(shell, "externalLinkAttempts") as string[]);
    expect(await attempts()).toHaveLength(1);

    await link.click();
    await expect.poll(attempts).toHaveLength(2);
    await expect(link).toBeEnabled();
    const opened = await attempts();
    expect(opened[0]).toMatch(/^https:\/\//);
    expect(opened[1]).toBe(opened[0]);
  } finally {
    await dispose();
  }
});
