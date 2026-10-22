import { PanelLeftIcon, PanelRightIcon } from "lucide-react";
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { type PanelImperativeHandle, usePanelRef } from "react-resizable-panels";

import { getPlatform, watchWindowState } from "@/actions/app";
import DragWindowRegion from "@/components/drag-window-region";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { getTitleBarLayout } from "@/config/window";

interface BaseLayoutProps {
  children: ReactNode;
  title?: ReactNode;
  toolbar?: ReactNode;
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
}

function togglePanel(panel: PanelImperativeHandle | null, setOpen: (open: boolean) => void) {
  if (!panel) return;
  const nextOpen = panel.isCollapsed();
  // Move the button in the same update as the panel, before onResize runs.
  setOpen(nextOpen);
  if (nextOpen) {
    panel.expand();
  } else {
    panel.collapse();
  }
}

export default function BaseLayout({
  children,
  title = "electron-template",
  toolbar,
  leftPanel,
  rightPanel,
}: BaseLayoutProps) {
  const leftPanelRef = usePanelRef();
  const rightPanelRef = usePanelRef();
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [windowState, setWindowState] = useState<{
    platform: string;
    isFullScreen: boolean;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    // Platform detection must not wait for the native fullscreen event stream.
    getPlatform()
      .then((platform) => {
        if (!controller.signal.aborted) {
          setWindowState((current) => current ?? { platform, isFullScreen: false });
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) console.error("Failed to detect platform:", error);
      });
    async function subscribe() {
      const states = await watchWindowState(controller.signal);
      for await (const state of states) {
        setWindowState(state);
      }
    }
    subscribe().catch((error: unknown) => {
      if (!controller.signal.aborted) console.error("Failed to observe window state:", error);
    });
    return () => controller.abort();
  }, []);

  const layout = getTitleBarLayout(windowState?.platform ?? "win32");
  const style = {
    "--window-title-bar-height": `${layout.height}px`,
    "--window-controls-width": `${windowState?.isFullScreen ? 0 : layout.controlsWidth}px`,
  } as CSSProperties;
  const hasLeft = leftPanel != null;
  const hasRight = rightPanel != null;

  const leftToggle = hasLeft && (
    <Button
      variant="ghost"
      size="icon-sm"
      className="aria-expanded:hover:bg-muted dark:aria-expanded:hover:bg-muted/50 aria-expanded:bg-transparent"
      aria-label="Toggle left panel"
      aria-controls="window-left-panel"
      aria-expanded={leftOpen}
      title={leftOpen ? "Hide left panel" : "Show left panel"}
      onClick={() => togglePanel(leftPanelRef.current, setLeftOpen)}
    >
      <PanelLeftIcon />
    </Button>
  );
  const rightToggle = hasRight && (
    <Button
      variant="ghost"
      size="icon-sm"
      className="aria-expanded:hover:bg-muted dark:aria-expanded:hover:bg-muted/50 aria-expanded:bg-transparent"
      aria-label="Toggle right panel"
      aria-controls="window-right-panel"
      aria-expanded={rightOpen}
      title={rightOpen ? "Hide right panel" : "Show right panel"}
      onClick={() => togglePanel(rightPanelRef.current, setRightOpen)}
    >
      <PanelRightIcon />
    </Button>
  );

  return (
    <div
      className="window-frame"
      style={style}
      data-platform={windowState?.platform ?? "pending"}
      data-full-screen={windowState?.isFullScreen ?? false}
    >
      <ResizablePanelGroup orientation="horizontal">
        {hasLeft && (
          <>
            <ResizablePanel
              id="window-left-panel"
              className="window-column"
              panelRef={leftPanelRef}
              collapsible
              collapsedSize={0}
              defaultSize={200}
              minSize={140}
              maxSize="35%"
              groupResizeBehavior="preserve-pixel-size"
              onResize={(size) => setLeftOpen(size.asPercentage > 0)}
            >
              <aside
                className="window-column bg-sidebar text-sidebar-foreground"
                aria-label="Left panel"
                aria-hidden={!leftOpen}
                inert={!leftOpen}
              >
                <DragWindowRegion reserveLeftControls leading={leftOpen && leftToggle} />
                <div className="window-panel-content">{leftPanel}</div>
              </aside>
            </ResizablePanel>
            <ResizableHandle aria-label="Resize left panel" />
          </>
        )}
        <ResizablePanel id="window-main-panel" className="window-column" minSize={240}>
          <DragWindowRegion
            reserveLeftControls={!hasLeft || !leftOpen}
            reserveRightControls={!hasRight || !rightOpen}
            leading={!leftOpen && leftToggle}
            title={title}
            toolbar={
              <>
                {toolbar}
                {!rightOpen && rightToggle}
              </>
            }
          />
          <main className="window-frame-content p-2">{children}</main>
        </ResizablePanel>
        {hasRight && (
          <>
            <ResizableHandle aria-label="Resize right panel" />
            <ResizablePanel
              id="window-right-panel"
              className="window-column"
              panelRef={rightPanelRef}
              collapsible
              collapsedSize={0}
              defaultSize={200}
              minSize={windowState?.platform === "win32" ? layout.controlsWidth + 52 : 140}
              maxSize="35%"
              groupResizeBehavior="preserve-pixel-size"
              onResize={(size) => setRightOpen(size.asPercentage > 0)}
            >
              <aside
                className="window-column bg-sidebar text-sidebar-foreground"
                aria-label="Right panel"
                aria-hidden={!rightOpen}
                inert={!rightOpen}
              >
                <DragWindowRegion reserveRightControls toolbar={rightOpen && rightToggle} />
                <div className="window-panel-content">{rightPanel}</div>
              </aside>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
