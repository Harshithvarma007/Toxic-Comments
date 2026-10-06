import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

/**
 * Video-native extension of harshith-design-system's `effects/static-paper-grain` (same
 * feTurbulence recipe: baseFrequency 0.85, numOctaves 2, stitchTiles stitch; same dark-theme
 * tuning: 16% opacity, `normal` blend, white speckle) — the one thing that primitive's own name
 * says it deliberately isn't: animated. A still page can't flicker its own texture; a video can.
 * Real film grain is a different noise pattern almost every frame — this regenerates the SVG
 * turbulence `seed` from the current frame, so the grain itself feels alive instead of a static
 * decal sitting on top of the scene.
 */
function noiseDataUri(seed: number) {
  return (
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E" +
    "%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' " +
    `seed='${seed}' stitchTiles='stitch' result='t'/%3E` +
    "%3CfeColorMatrix in='t' type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0'/%3E" +
    "%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"
  );
}

/**
 * Reverted to static per feedback — per-frame flicker read as noisy/strobing rather than
 * "alive." `animated` is kept as an opt-in escape hatch, off by default, rather than deleted,
 * in case a future scene wants it deliberately.
 */
export function AnimatedGrain({ opacity = 0.16, animated = false }: { opacity?: number; animated?: boolean }) {
  const frame = useCurrentFrame();
  const seed = animated ? frame : 0;
  return (
    <AbsoluteFill
      aria-hidden="true"
      style={{
        pointerEvents: "none",
        opacity,
        mixBlendMode: "normal",
        backgroundImage: `url("${noiseDataUri(seed)}")`,
        backgroundSize: "200px 200px",
        backgroundRepeat: "repeat",
      }}
    />
  );
}
