import { PanelLeftIcon, PanelRightIcon } from "lucide-react";
import { type CSSProperties, type ReactNode } from "react";

import DragWindowRegion from "@/renderer/components/drag-window-region";
import { Button } from "@/renderer/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/renderer/components/ui/resizable";
import { useWindowState } from "@/renderer/hooks/use-window-state";
import { useWindowLayoutStore } from "@/renderer/stores/window-layout-store";
import { APP_CONFIG } from "@/shared/app-config";
import { getTitleBarLayout } from "@/shared/window";

import { useCollapsiblePanel } from "./use-collapsible-panel";

interface BaseLayoutProps {
  children: ReactNode;
  title?: ReactNode;
  toolbar?: ReactNode;
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
}

export default function BaseLayout({
  children,
  title = APP_CONFIG.name,
  toolbar,
  leftPanel,
  rightPanel,
}: BaseLayoutProps) {
  const {
    panelRef: leftPanelRef,
    open: leftOpen,
    toggle: toggleLeft,
    onResize: resizeLeft,
  } = useCollapsiblePanel();
  const {
    panelRef: rightPanelRef,
    open: rightOpen,
    toggle: toggleRight,
    onResize: resizeRight,
  } = useCollapsiblePanel();
  const windowState = useWindowState();
  const windowLayout = useWindowLayoutStore((state) => state.layout);
  const setWindowLayout = useWindowLayoutStore((state) => state.setLayout);

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
      onClick={toggleLeft}
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
      onClick={toggleRight}
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
      <ResizablePanelGroup
        orientation="horizontal"
        defaultLayout={windowLayout ?? undefined}
        onLayoutChanged={(next, meta) => {
          if (meta.isUserInteraction) setWindowLayout(meta.requestedLayout ?? next);
        }}
      >
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
              onResize={resizeLeft}
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
              onResize={resizeRight}
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
