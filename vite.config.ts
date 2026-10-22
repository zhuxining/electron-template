import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

const ignorePatterns = [
  "**/routeTree.gen.ts",
  "**/node_modules/**",
  "**/.tanstack/**",
  "**/.vite/**",
  "**/dist/**",
  "**/out/**",
  "coverage/**",
  "playwright-report/**",
  "test-results/**",
  "src/components/ui/**",
];

export default defineConfig({
  lint: {
    ignorePatterns,
    jsPlugins: [
      { name: "vite-plus", specifier: "vite-plus/oxlint-plugin" },
      { name: "shadcn", specifier: "@shadcn/lint" },
    ],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
    plugins: ["eslint", "typescript", "react", "import", "promise", "node", "vitest"],
  },
  fmt: {
    ignorePatterns,
    sortPackageJson: true,
    sortScripts: true,
    sortImports: true,
    sortTailwindcss: true,
  },
  staged: {
    "*.{js,ts,jsx,tsx,vue,svelte,json,jsonc,css,md}": "vp check --fix",
  },
  plugins: [react({ compiler: true })],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    coverage: {
      exclude: [],
      include: ["src/**/*"],
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    css: true,
    dir: "./src/tests/unit",
    environment: "jsdom",
    globals: true,
    reporters: ["verbose"],
    setupFiles: "./src/tests/unit/setup.ts",
  },
});
