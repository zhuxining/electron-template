import { render, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vite-plus/test";

import { toggleTheme } from "@/renderer/actions/theme";
import ToggleTheme from "@/renderer/components/toggle-theme";
vi.mock("@/renderer/actions/theme", () => ({ toggleTheme: vi.fn<typeof toggleTheme>() }));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
test("reports a failed operation and enables the control for retry", async () => {
  vi.mocked(toggleTheme).mockRejectedValueOnce(new Error("disconnected"));
  const report = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const { getByRole } = render(<ToggleTheme />);
  const button = getByRole("button", { name: "Toggle theme" });
  await userEvent.click(button);
  await vi.waitFor(() => expect(button).toBeEnabled());
  expect(report).toHaveBeenCalledWith("Failed to toggle app theme:", expect.any(Error));
});
