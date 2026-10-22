import { readFileSync } from "node:fs";
import path from "node:path";

import { parseElectronApp } from "electron-playwright-helpers";

export function readPackagedApp() {
  const metadata = JSON.parse(readFileSync("package.json", "utf8")) as {
    name: string;
    productName?: string;
  };
  const directory = path.resolve(
    "out",
    (metadata.productName ?? metadata.name) + "-" + process.platform + "-" + process.arch,
  );
  return parseElectronApp(directory);
}
