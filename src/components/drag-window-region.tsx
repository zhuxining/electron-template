import { type ReactNode } from "react";

interface DragWindowRegionProps {
  leading?: ReactNode;
  title?: ReactNode;
  toolbar?: ReactNode;
  reserveLeftControls?: boolean;
  reserveRightControls?: boolean;
}

export default function DragWindowRegion({
  leading,
  title,
  toolbar,
  reserveLeftControls = false,
  reserveRightControls = false,
}: DragWindowRegionProps) {
  return (
    <header
      className="window-title-bar"
      data-reserve-left={reserveLeftControls}
      data-reserve-right={reserveRightControls}
    >
      <div className="window-title-bar-content">
        {leading && <div className="window-no-drag window-title-bar-toolbar">{leading}</div>}
        {title != null && <div className="window-title-bar-title">{title}</div>}
        {toolbar && (
          <div className="window-no-drag window-title-bar-toolbar window-title-bar-trailing">
            {toolbar}
          </div>
        )}
      </div>
    </header>
  );
}
