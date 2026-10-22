import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { _electron as electron } from "@playwright/test";

import { readPackagedApp } from "../../scripts/packaged-app";

export async function launchTestApp({ profile: existing }: { profile?: string } = {}) {
  const profile = existing ?? (await mkdtemp(path.join(tmpdir(), "electron-e2e-")));
  let closed = false;
  let removed = false;
  const removeProfile = async () => {
    if (removed) return;
    removed = true;
    await rm(profile, { recursive: true, force: true, maxRetries: 5 });
  };
  try {
    const app = await electron.launch({
      chromiumSandbox: true,
      args: ["--user-data-dir=" + profile, readPackagedApp().main],
    });
    // Playwright defaults to emulated light mode; these tests observe the native theme.
    await (await app.firstWindow()).emulateMedia({ colorScheme: null });
    return {
      app,
      profile,
      dispose: async ({ keepProfile = false } = {}) => {
        try {
          if (!closed) {
            closed = true;
            await app.close();
          }
        } finally {
          if (!keepProfile) await removeProfile();
        }
      },
    };
  } catch (error) {
    await removeProfile();
    throw error;
  }
}
