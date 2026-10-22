import { Moon } from "lucide-react";
import { useState } from "react";

import { toggleTheme } from "@/renderer/actions/theme";
import { Button } from "@/renderer/components/ui/button";

export default function ToggleTheme() {
  const [pending, setPending] = useState(false);
  async function toggle() {
    setPending(true);
    try {
      await toggleTheme();
    } catch (error) {
      console.error("Failed to toggle app theme:", error);
    } finally {
      setPending(false);
    }
  }
  return (
    <Button onClick={toggle} disabled={pending} aria-label="Toggle theme" size="icon">
      <Moon size={16} />
    </Button>
  );
}
