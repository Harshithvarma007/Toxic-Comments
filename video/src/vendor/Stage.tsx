import React, { createContext, useContext, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Stage — the project's format-independence layer.
 *
 * The channel's scenes are authored once, at a 1920×1080 / 30fps "logical" canvas (pixel sizes,
 * hardcoded frame numbers, etc.). The canonical OUTPUT format is 4K/60fps. Rather than re-derive
 * every size and timing constant per composition, a scene wraps its content in <Stage>: it scales
 * the logical canvas to fill whatever the real composition size is, and exposes a *logical* frame
 * and fps via context. Components read `useLogicalFrame()` / `useLogicalConfig()` instead of the
 * raw Remotion hooks, so the same code renders identically at 1080p/30 or 4K/60 — just crisper and
 * smoother at 4K/60 (vector text scales cleanly; 60fps samples the same 30fps-authored motion).
 *
 * NousIntro is the exception: it is authored natively at 4K/60 and does NOT use Stage.
 */

type Logical = { width: number; height: number; fps: number; frame: number };
const LogicalContext = createContext<Logical | null>(null);

/** Logical frame (in the base-fps timeline). Falls back to the real frame outside a Stage. */
export function useLogicalFrame(): number {
  const ctx = useContext(LogicalContext);
  const real = useCurrentFrame();
  return ctx ? ctx.frame : real;
}

/** Logical {width,height,fps}. Falls back to the real video config outside a Stage. */
export function useLogicalConfig(): { width: number; height: number; fps: number } {
  const ctx = useContext(LogicalContext);
  const vc = useVideoConfig();
  return ctx ? { width: ctx.width, height: ctx.height, fps: ctx.fps } : { width: vc.width, height: vc.height, fps: vc.fps };
}

export const Stage: React.FC<{
  children: React.ReactNode;
  baseWidth?: number;
  baseHeight?: number;
  baseFps?: number;
}> = ({ children, baseWidth = 1920, baseHeight = 1080, baseFps = 30 }) => {
  const { width, height, fps } = useVideoConfig();
  const realFrame = useCurrentFrame();
  const scale = Math.min(width / baseWidth, height / baseHeight);
  const value = useMemo<Logical>(
    () => ({ width: baseWidth, height: baseHeight, fps: baseFps, frame: (realFrame * baseFps) / fps }),
    [realFrame, fps, baseFps, baseWidth, baseHeight]
  );
  return (
    <LogicalContext.Provider value={value}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div
          style={{
            width: baseWidth,
            height: baseHeight,
            flex: "none",
            position: "relative",
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {children}
        </div>
      </AbsoluteFill>
    </LogicalContext.Provider>
  );
};
