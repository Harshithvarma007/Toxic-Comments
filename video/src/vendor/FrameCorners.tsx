import React from "react";

/**
 * Rebuilt from direct pixel analysis of image.png (see tokens.css comment above
 * .frame-crosshair). A continuous low-opacity outline around the whole box, plus a short
 * (7px), bright, opaque-looking accent tick at each corner sitting on top of it. No rivet dot.
 */
export function FrameCrosshairMarks() {
  return (
    <>
      <span className="frame-crosshair__mark frame-crosshair__mark--tl" aria-hidden="true" />
      <span className="frame-crosshair__mark frame-crosshair__mark--tr" aria-hidden="true" />
      <span className="frame-crosshair__mark frame-crosshair__mark--bl" aria-hidden="true" />
      <span className="frame-crosshair__mark frame-crosshair__mark--br" aria-hidden="true" />
    </>
  );
}

export function FramedContainer({
  tag,
  tagPosition = "tl",
  pop = false,
  glass = false,
  children,
  style,
}: {
  tag?: string;
  tagPosition?: "tl" | "bl";
  /** Stronger depth shadow for a nested frame that should visually lift off its parent's
   * plane (e.g. a content window inside the outer scene frame), not just off the grain. */
  pop?: boolean;
  /** Translucent, backdrop-blurred fill — the frosted-glass material used everywhere else in
   * this system (grain + glass, per design-system/visual-library.md §3), instead of an opaque
   * background. */
  glass?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const classes = ["frame-crosshair", pop && "frame-crosshair--pop", glass && "frame-crosshair--glass"]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} style={{ width: "100%", height: "100%", ...style }}>
      {children}
      <FrameCrosshairMarks />
      {tag && <span className={`frame-crosshair__tag frame-crosshair__tag--${tagPosition}`}>{tag}</span>}
    </div>
  );
}
