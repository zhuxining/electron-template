import { describe, expect, test } from "vite-plus/test";

import { openExternalLinkInputSchema } from "@/main/ipc/shell/schemas";
import { isSafeExternalUrl, isTrustedIpcSender, isTrustedRendererUrl } from "@/main/security";

const entry = "file:///app/renderer/index.html";
describe("desktop capability policy", () => {
  test.each([
    [entry, true],
    [entry + "#route", true],
    [entry + "?reload=1", true],
    ["file:///other/index.html", false],
    ["https://example.com/index.html", false],
    ["not a URL", false],
  ])("renderer URL %s is trusted: %s", (url, expected) =>
    expect(isTrustedRendererUrl(url, entry)).toBe(expected),
  );
  test("development accepts only the configured origin and document", () => {
    expect(isTrustedRendererUrl("http://localhost:5173/", "http://localhost:5173/")).toBe(true);
    expect(isTrustedRendererUrl("http://localhost:5174/", "http://localhost:5173/")).toBe(false);
    expect(isTrustedRendererUrl("http://localhost:5173/other", "http://localhost:5173/")).toBe(
      false,
    );
  });
  test("requires the registered window and its live main frame", () => {
    const frame = { url: entry, origin: "null" };
    const contents = { mainFrame: frame };
    expect(isTrustedIpcSender({ sender: contents, senderFrame: frame }, contents, entry)).toBe(
      true,
    );
    expect(
      isTrustedIpcSender({ sender: contents, senderFrame: { ...frame } }, contents, entry),
    ).toBe(false);
    expect(
      isTrustedIpcSender({ sender: { mainFrame: frame }, senderFrame: frame }, contents, entry),
    ).toBe(false);
    expect(isTrustedIpcSender({ sender: contents, senderFrame: null }, contents, entry)).toBe(
      false,
    );
    frame.url = "file:///app/another.html";
    expect(isTrustedIpcSender({ sender: contents, senderFrame: frame }, contents, entry)).toBe(
      false,
    );
  });
  test("development also validates the frame origin", () => {
    const frame = { url: "http://localhost:5173/", origin: "https://untrusted.example" };
    const contents = { mainFrame: frame };
    expect(isTrustedIpcSender({ sender: contents, senderFrame: frame }, contents, frame.url)).toBe(
      false,
    );
  });
  test.each([
    ["https://example.com/docs", true],
    ["http://localhost:3000/", true],
    ["file:///tmp/document", false],
    ["myapp://invoke", false],
    ["javascript:alert(1)", false],
    ["https://user:secret@example.com", false],
    ["not a URL", false],
  ])("external URL %s is allowed: %s", (url, allowed) => {
    expect(isSafeExternalUrl(url)).toBe(allowed);
    expect(openExternalLinkInputSchema.safeParse({ url }).success).toBe(allowed);
  });
});
