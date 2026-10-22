import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

import { afterEach, expect, test } from "vite-plus/test";

const bootstrap = readFileSync("public/theme-init.js", "utf8");

afterEach(() => {
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "";
});

test.each([
  { saved: null, systemDark: true, expectedDark: true },
  { saved: null, systemDark: false, expectedDark: false },
  { saved: "system", systemDark: true, expectedDark: true },
  { saved: "light", systemDark: true, expectedDark: false },
  { saved: "dark", systemDark: false, expectedDark: true },
])(
  "applies the first-paint theme: $saved, system dark: $systemDark",
  ({ saved, systemDark, expectedDark }) => {
    runInNewContext(bootstrap, {
      document,
      localStorage: { getItem: () => saved },
      window: { matchMedia: () => ({ matches: systemDark }) },
    });
    expect(document.documentElement.classList.contains("dark")).toBe(expectedDark);
    expect(document.documentElement.style.colorScheme).toBe(expectedDark ? "dark" : "light");
  },
);

test("uses the system theme before first paint if storage is unavailable", () => {
  runInNewContext(bootstrap, {
    document,
    localStorage: {
      getItem: () => {
        throw new Error("Storage unavailable");
      },
    },
    window: { matchMedia: () => ({ matches: true }) },
  });
  expect(document.documentElement).toHaveClass("dark");
});
