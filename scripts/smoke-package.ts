import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { readPackagedApp } from "./packaged-app";

async function main() {
  const profile = await mkdtemp(path.join(tmpdir(), "electron-smoke-"));
  try {
    const app = readPackagedApp();
    await new Promise<void>((resolve, reject) => {
      const child = spawn(app.executable, ["--smoke-test", "--user-data-dir=" + profile], {
        stdio: ["ignore", "pipe", "inherit"],
        env: { ...process.env, ELECTRON_ENABLE_LOGGING: "1" },
      });
      let output = "";
      child.stdout.on("data", (chunk: Buffer) => {
        const text = chunk.toString();
        process.stdout.write(text);
        output += text;
      });
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error("Packaged application startup timed out"));
      }, 30000);
      child.once("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      child.once("exit", (code) => {
        clearTimeout(timeout);
        if (code === 0 && output.includes("Packaged application and IPC are ready")) resolve();
        else reject(new Error("Packaged application smoke test failed: " + code));
      });
    });
  } finally {
    await rm(profile, { recursive: true, force: true, maxRetries: 5 });
  }
}
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
