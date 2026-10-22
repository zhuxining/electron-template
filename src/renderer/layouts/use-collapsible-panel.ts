import { useState } from "react";
import { type PanelProps, usePanelRef } from "react-resizable-panels";

export function useCollapsiblePanel() {
  const panelRef = usePanelRef();
  const [open, setOpen] = useState(true);
  const toggle = () => {
    const panel = panelRef.current;
    if (!panel) return;
    const nextOpen = panel.isCollapsed();
    // Move the button before the resize callback, in the same React update.
    setOpen(nextOpen);
    if (nextOpen) panel.expand();
    else panel.collapse();
  };
  const onResize: NonNullable<PanelProps["onResize"]> = (size) => setOpen(size.asPercentage > 0);
  return { panelRef, open, toggle, onResize };
}
