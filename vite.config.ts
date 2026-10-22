import { builtinModules } from "node:module";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

import { sourceAlias } from "./scripts/vite-shared";

const nativeImports = [
  ...new Set([
    ...builtinModules,
    ...builtinModules.map((name) => (name.startsWith("node:") ? name : "node:" + name)),
    "electron",
    "electron/main",
    "electron/renderer",
    "electron/common",
  ]),
];
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
    overrides: [
      {
        files: ["src/renderer/**"],
        rules: {
          "no-restricted-globals": [
            "error",
            "process",
            "Buffer",
            "require",
            "module",
            "exports",
            "__dirname",
            "__filename",
            "global",
          ],
          "no-restricted-imports": [
            "error",
            {
              paths: nativeImports,
              patterns: [
                {
                  group: ["@/main/**", "@/preload/**", "**/main/**", "**/preload/**"],
                  allowTypeImports: true,
                  message: "Use the typed IPC client for native capabilities.",
                },
              ],
            },
          ],
        },
      },
      {
        files: ["src/main/**"],
        rules: {
          "no-restricted-imports": [
            "error",
            { patterns: ["@/renderer/**", "**/renderer/**", "@/preload/**", "**/preload/**"] },
          ],
        },
      },
      {
        files: ["src/preload/**"],
        rules: {
          "no-restricted-imports": [
            "error",
            { patterns: ["@/renderer/**", "**/renderer/**", "@/main/**", "**/main/**"] },
          ],
        },
      },
      {
        files: ["src/shared/**"],
        rules: {
          "no-restricted-globals": [
            "error",
            "process",
            "Buffer",
            "require",
            "module",
            "exports",
            "__dirname",
            "__filename",
            "global",
          ],
          "no-restricted-imports": [
            "error",
            {
              paths: nativeImports,
              patterns: [
                "@/renderer/**",
                "@/main/**",
                "@/preload/**",
                "**/renderer/**",
                "**/main/**",
                "**/preload/**",
              ],
            },
          ],
        },
      },
    ],
  },
  fmt: {
    ignorePatterns,
    sortPackageJson: true,
    sortScripts: true,
    sortImports: true,
    sortTailwindcss: true,
  },
  staged: { "*.{js,ts,jsx,tsx,vue,svelte,json,jsonc,css,md}": "vp check --fix" },
  plugins: [react({ compiler: true })],
  resolve: { alias: sourceAlias },
  test: {
    coverage: {
      include: ["src/main/**/*.ts", "src/renderer/**/*.{ts,tsx}", "src/shared/**/*.ts"],
      exclude: ["**/routeTree.gen.ts", "**/components/ui/**"],
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    reporters: ["verbose"],
    projects: [
      {
        extends: true,
        test: { name: "main", include: ["tests/unit/main/**/*.test.ts"], environment: "node" },
      },
      {
        extends: true,
        test: {
          name: "renderer",
          include: ["tests/unit/renderer/**/*.test.{ts,tsx}"],
          environment: "jsdom",
          setupFiles: ["tests/unit/renderer/setup.ts"],
          css: true,
        },
      },
    ],
  },
});
