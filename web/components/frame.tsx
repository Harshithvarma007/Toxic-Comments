import type { ReactNode } from "react";
import { PerimeterGlow } from "./perimeter-glow";

/**
 * The NOUS crosshair container: hairline outline, four bright corner ticks, an optional
 * monospace content tag in the top-left, and (optionally) the travelling perimeter glow.
 * Reserved for containers that carry real content weight — never dense chrome.
 */
export function Frame({
  children,
  tag,
  glow = false,
  glass = false,
  glowOffset = 0,
  glowPeriodMs,
  className = "",
  as: Tag = "div",
}: {
  children?: ReactNode;
  tag?: string;
  glow?: boolean;
  glass?: boolean;
  glowOffset?: number;
  glowPeriodMs?: number;
  className?: string;
  as?: "div" | "section" | "article" | "figure";
}) {
  return (
    <Tag className={`frame-crosshair ${glass ? "frame-crosshair--glass" : ""} ${className}`}>
      {glow && <PerimeterGlow offset={glowOffset} periodMs={glowPeriodMs} />}
      {tag && <span className="label-mono absolute left-3 top-3 z-10">{tag}</span>}
      {children}
      <span className="frame-crosshair__mark frame-crosshair__mark--tl" aria-hidden="true" />
      <span className="frame-crosshair__mark frame-crosshair__mark--tr" aria-hidden="true" />
      <span className="frame-crosshair__mark frame-crosshair__mark--bl" aria-hidden="true" />
      <span className="frame-crosshair__mark frame-crosshair__mark--br" aria-hidden="true" />
    </Tag>
  );
}
