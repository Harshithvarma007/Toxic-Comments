import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, spring, useVideoConfig } from "remotion";
import { AnimatedGrain } from "./vendor/AnimatedGrain";
import { FramedContainer } from "./vendor/FrameCorners";
import { PerimeterGlowTravel } from "./vendor/PerimeterGlowTravel";
import { Stage, useLogicalFrame } from "./vendor/Stage";

/*
 * House conventions, copied from Video OS src/compositions/Video1/shared.tsx:
 * logical canvas 1920x1080 @ 30fps, title-safe 5%, every scene sits inside the crosshair frame
 * with the ambient PerimeterGlowTravel, content tag bottom-left.
 */
export const FPS = 30;
export const s = (sec: number) => Math.round(sec * FPS);
export const SAFE_X = 96;
export const SAFE_Y = 54;
export const FRAME = { x: SAFE_X, y: SAFE_Y, w: 1920 - SAFE_X * 2, h: 1080 - SAFE_Y * 2 };

export const C = {
  canvas: "#14141c",
  ground: "#0c0c12",
  surface: "#191820",
  inset: "#201d25",
  line: "#2a2a38",
  peak: "#ffffff",
  primary: "#e4e6ec",
  secondary: "#b1b6c4",
  tertiary: "#ad8eb6",
  accent: "#f5c0c0",
  danger: "#e54d62",
  success: "#2ba88a",
};

export const EASE_OUT = Easing.bezier(0.22, 0.61, 0.36, 1);
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** One full-canvas timeline layer with its own Stage, so everything inside sees a local frame 0. */
export function Layer({ from, dur, children }: { from: number; dur: number; children: React.ReactNode }) {
  const k = useVideoConfig().fps / FPS;
  return (
    <Sequence from={Math.round(from * k)} durationInFrames={Math.round(dur * k)} layout="none">
      <AbsoluteFill>
        <Stage>{children}</Stage>
      </AbsoluteFill>
    </Sequence>
  );
}

export function Background() {
  return (
    <AbsoluteFill style={{ background: C.canvas }}>
      <AnimatedGrain />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse 84% 84% at 50% 50%, rgba(0,0,0,0) 56%, rgba(0,0,0,0.45) 100%)" }}
      />
    </AbsoluteFill>
  );
}

/** The house frame + ambient glow. The glow phase continues across scenes via `globalFrom`. */
export function FrameChrome({ tag, children, dur }: { tag: string; children?: React.ReactNode; dur: number }) {
  const f = useLogicalFrame();
  const fade = Math.min(interpolate(f, [0, 12], [0, 1], clamp), interpolate(f, [dur - 12, dur], [1, 0], clamp));
  return (
    <div style={{ position: "absolute", left: FRAME.x, top: FRAME.y, width: FRAME.w, height: FRAME.h }}>
      <FramedContainer tag={tag} tagPosition="bl">
        <div style={{ position: "absolute", inset: 0, opacity: fade }}>{children}</div>
      </FramedContainer>
      <PerimeterGlowTravel width={FRAME.w} height={FRAME.h} loopFrames={1800} />
    </div>
  );
}

/** Word-by-word rise + de-blur, the channel's default text entrance. */
export function Words({
  text,
  start = 0,
  stagger = 3,
  style,
  color = C.peak,
  accent,
}: {
  text: string;
  start?: number;
  stagger?: number;
  style?: React.CSSProperties;
  color?: string;
  /** words (exact match, punctuation included) to render in the accent colour */
  accent?: string[];
}) {
  const f = useLogicalFrame();
  const words = text.split(" ");
  return (
    <div style={style}>
      {words.map((w, i) => {
        const p = interpolate(f, [start + i * stagger, start + i * stagger + 14], [0, 1], { ...clamp, easing: EASE_OUT });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: "0.26em",
              opacity: p,
              transform: `translateY(${(1 - p) * 18}px)`,
              filter: `blur(${(1 - p) * 6}px)`,
              color: accent?.includes(w) ? C.accent : color,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
}

export function useIn(start: number, len = 16) {
  const f = useLogicalFrame();
  return interpolate(f, [start, start + len], [0, 1], { ...clamp, easing: EASE_OUT });
}

export function useSpring(start: number, damping = 18) {
  const f = useLogicalFrame();
  return spring({ frame: f - start, fps: FPS, config: { damping, stiffness: 120, mass: 0.8 } });
}

export const display = (size: number, weight = 800): React.CSSProperties => ({
  fontFamily: "var(--font-display)",
  fontWeight: weight,
  fontSize: size,
  lineHeight: 1.06,
  letterSpacing: "-0.03em",
});

export const mono = (size = 22, color = C.tertiary): React.CSSProperties => ({
  fontFamily: "var(--font-mono)",
  fontSize: size,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color,
});

export const body = (size = 30, color = C.secondary): React.CSSProperties => ({
  fontFamily: "var(--font-body)",
  fontSize: size,
  lineHeight: 1.45,
  color,
});
