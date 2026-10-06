import React from "react";
import { AbsoluteFill } from "remotion";

/**
 * Shared NOUS brand furniture — the native-4K crosshair frame + palette used by both the intro
 * (NousIntro) and the outro (NousOutro), so the two bookends are literally the same component.
 * Palette values mirror tokens.css (channel-consistent); sizes are native 4K (2× the 1080p spec).
 */
export const GROUND = "#0c0c12";
export const PEAK = "#ffffff";
export const PRIMARY = "#e4e6ec";
export const TERTIARY = "#ad8eb6";
export const ACCENT = "#f5c0c0";

const FRAME_INSET = 104;
const TICK_ARM = 30;
const TICK_W = 3;

const Tick: React.FC<{ pos: "tl" | "tr" | "bl" | "br"; arm: number; color: string }> = ({ pos, arm, color }) => {
  const top = pos[0] === "t";
  const left = pos[1] === "l";
  const wrap: React.CSSProperties = {
    position: "absolute",
    width: arm,
    height: arm,
    ...(top ? { top: -2 } : { bottom: -2 }),
    ...(left ? { left: -2 } : { right: -2 }),
  };
  const h: React.CSSProperties = {
    position: "absolute",
    height: TICK_W,
    width: arm,
    background: color,
    ...(top ? { top: 0 } : { bottom: 0 }),
    ...(left ? { left: 0 } : { right: 0 }),
  };
  const v: React.CSSProperties = {
    position: "absolute",
    width: TICK_W,
    height: arm,
    background: color,
    ...(top ? { top: 0 } : { bottom: 0 }),
    ...(left ? { left: 0 } : { right: 0 }),
  };
  return (
    <div style={wrap}>
      <div style={h} />
      <div style={v} />
    </div>
  );
};

/**
 * The crosshair container. `lock` (0→1) extends/brightens the corner ticks and the border (the
 * "lock" beat). `tag` is whatever renders in the top-left content-tag slot (the caller owns its
 * content/animation — e.g. the intro's DEFINITION→NOUS crossfade).
 */
export const Crosshair: React.FC<{ lock?: number; tag?: React.ReactNode; children?: React.ReactNode }> = ({
  lock = 0,
  tag,
  children,
}) => {
  const arm = TICK_ARM + lock * 22;
  const tickColor = `rgba(245,192,192,${0.85 + lock * 0.15})`;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: FRAME_INSET,
          border: `2px solid rgba(245,192,192,${0.12 + lock * 0.06})`,
          boxShadow: "0 0 120px 24px rgba(0,0,0,0.45)",
        }}
      >
        {children}
        <Tick pos="tl" arm={arm} color={tickColor} />
        <Tick pos="tr" arm={arm} color={tickColor} />
        <Tick pos="bl" arm={arm} color={tickColor} />
        <Tick pos="br" arm={arm} color={tickColor} />
        <div
          style={{
            position: "absolute",
            top: 26,
            left: 28,
            fontFamily: "var(--font-mono)",
            fontSize: 26,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: TERTIARY,
            height: 32,
          }}
        >
          {tag}
        </div>
      </div>
    </AbsoluteFill>
  );
};
