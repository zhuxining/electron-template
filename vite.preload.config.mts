import { defineConfig } from "vite";

import { sourceAlias } from "./scripts/vite-shared";
export default defineConfig({
  resolve: { alias: sourceAlias },
  build: { rollupOptions: { output: { entryFileNames: "preload.cjs" } } },
});
