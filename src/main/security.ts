interface RendererFrame {
  url: string;
  origin: string;
}
interface RendererContents {
  mainFrame: RendererFrame;
}

export function isTrustedRendererUrl(candidate: string, entry: string): boolean {
  try {
    const actual = new URL(candidate);
    const expected = new URL(entry);
    if (!["file:", "http:", "https:"].includes(expected.protocol)) return false;
    actual.hash = expected.hash = "";
    actual.search = expected.search = "";
    return actual.href === expected.href;
  } catch {
    return false;
  }
}

export function isTrustedIpcSender(
  event: { sender: RendererContents; senderFrame: RendererFrame | null },
  contents: RendererContents,
  entry: string,
): boolean {
  const frame = event.senderFrame;
  if (event.sender !== contents || !frame || frame !== contents.mainFrame) return false;
  if (!isTrustedRendererUrl(frame.url, entry)) return false;
  const expected = new URL(entry);
  return expected.protocol === "file:" || frame.origin === expected.origin;
}

export function isSafeExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password
    );
  } catch {
    return false;
  }
}
