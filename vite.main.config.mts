import { defineConfig } from "vite";

import { sourceAlias } from "./scripts/vite-shared";
export default defineConfig({
  resolve: { alias: sourceAlias },
  build: { lib: { entry: "src/main/index.ts", formats: ["cjs"], fileName: () => "main.cjs" } },
});
