import { randomUUID } from "node:crypto";

import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { sourceAlias } from "./scripts/vite-shared";

export default defineConfig(({ command }) => {
  const nonce = command === "serve" ? randomUUID() : undefined;
  return {
    html: { cspNonce: nonce },
    plugins: [
      tanstackRouter({
        target: "react",
        routesDirectory: "./src/renderer/routes",
        generatedRouteTree: "./src/renderer/routeTree.gen.ts",
      }),
      tailwindcss(),
      react({ compiler: true }),
      {
        name: "development-csp",
        transformIndexHtml(html) {
          return nonce
            ? html
                .replace("script-src 'self'", "script-src 'self' 'nonce-" + nonce + "'")
                .replace(
                  "connect-src 'self'",
                  "connect-src 'self' ws://localhost:* ws://127.0.0.1:*",
                )
            : html;
        },
      },
    ],
    resolve: { alias: sourceAlias, dedupe: ["react", "react-dom"], preserveSymlinks: false },
  };
});
