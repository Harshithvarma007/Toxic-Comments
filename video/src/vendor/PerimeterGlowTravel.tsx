import React from "react";
import { useLogicalFrame } from "./Stage";

/**
 * v3 — fixes the "chunky" look of v2's stacked discrete-opacity dash bands. Researched how
 * production border-glow effects (e.g. CSS "border-beam" style components) stay smooth: they
 * use a continuously-interpolated gradient, not discrete steps — a browser linearly
 * interpolates BETWEEN gradient stops, so a handful of stops still reads as smooth, where
 * discrete stacked shapes always show visible edges between the steps. Most of those
 * implementations use conic-gradient + mask, which is simplest for a circle/rounded box, but
 * doesn't move at constant arc-length speed around a plain rectangle (it moves faster near
 * corners) — so this keeps this file's own constant-speed arc-length travel and applies the
 * "continuous gradient, not discrete steps" idea to that, via a real per-edge SVG
 * `linearGradient` sampled from the measured profile, redrawn fresh each frame at the current
 * position (not a dasharray stack).
 *
 * Still zero perpendicular bloom (see v2's note) — this only changes how the ALONG-the-line
 * falloff is drawn (continuous interpolation vs. discrete bands), not the line's thickness.
 *
 * Measured profile from image.png (offset from peak center in px, normalized 0-1):
 *   -68:0  -60:0.24  -48:0.47  -35:0.74  -25:0.95  0:1.0  25:0.95  35:0.74  48:0.47  60:0.24  68:0
 */
const PROFILE: [number, number][] = [
  [-68, 0],
  [-60, 0.24],
  [-48, 0.47],
  [-35, 0.74],
  [-25, 0.95],
  [0, 1],
  [25, 0.95],
  [35, 0.74],
  [48, 0.47],
  [60, 0.24],
  [68, 0],
];
const HALF_EXTENT = 68;

function bellOpacity(offset: number): number {
  if (offset <= PROFILE[0][0] || offset >= PROFILE[PROFILE.length - 1][0]) return 0;
  for (let i = 0; i < PROFILE.length - 1; i++) {
    const [x0, y0] = PROFILE[i];
    const [x1, y1] = PROFILE[i + 1];
    if (offset >= x0 && offset <= x1) {
      const t = (offset - x0) / (x1 - x0);
      return y0 + (y1 - y0) * t;
    }
  }
  return 0;
}

type Point = { x: number; y: number };
type Edge = { cumStart: number; cumEnd: number; start: Point; dir: Point };

export function PerimeterGlowTravel({
  width,
  height,
  loopFrames = 150,
  strokeWidth = 1.5,
  hue = "245,192,192",
  reverse = false,
  progressOverride,
}: {
  width: number;
  height: number;
  loopFrames?: number;
  strokeWidth?: number;
  hue?: string;
  reverse?: boolean;
  /** 0-1 position along the perimeter, bypassing the internal frame%loopFrames ambient loop —
   * for a caller that needs to drive this exact same glow to a specific point under its own
   * choreography (e.g. the frame-spawn/despawn transition in FrameTransitionDemo.tsx), instead
   * of duplicating this component's carefully-tuned look in a separate one-off renderer. */
  progressOverride?: number;
}) {
  const frame = useLogicalFrame();
  const w = width - 1;
  const h = height - 1;
  const perimeter = 2 * (w + h);
  const progress = progressOverride ?? (frame % loopFrames) / loopFrames;
  const rawCenter = (reverse ? 1 - progress : progress) * perimeter;

  const edges: Edge[] = [
    { cumStart: 0, cumEnd: w, start: { x: 0.5, y: 0.5 }, dir: { x: 1, y: 0 } }, // top, L->R
    { cumStart: w, cumEnd: w + h, start: { x: width - 0.5, y: 0.5 }, dir: { x: 0, y: 1 } }, // right, T->B
    { cumStart: w + h, cumEnd: 2 * w + h, start: { x: width - 0.5, y: height - 0.5 }, dir: { x: -1, y: 0 } }, // bottom, R->L
    { cumStart: 2 * w + h, cumEnd: perimeter, start: { x: 0.5, y: height - 0.5 }, dir: { x: 0, y: -1 } }, // left, B->T
  ];

  const pointAt = (edge: Edge, local: number): Point => ({
    x: edge.start.x + edge.dir.x * local,
    y: edge.start.y + edge.dir.y * local,
  });

  const segments: { id: string; x1: number; y1: number; x2: number; y2: number; stops: [number, number][] }[] = [];

  // Check the center at three wraps of the perimeter so a window straddling the 0/perimeter
  // seam still overlaps the right edges on both sides.
  [rawCenter - perimeter, rawCenter, rawCenter + perimeter].forEach((shiftedCenter, k) => {
    edges.forEach((edge, ei) => {
      const lo = Math.max(edge.cumStart, shiftedCenter - HALF_EXTENT);
      const hi = Math.min(edge.cumEnd, shiftedCenter + HALF_EXTENT);
      if (lo >= hi) return;
      const p1 = pointAt(edge, lo - edge.cumStart);
      const p2 = pointAt(edge, hi - edge.cumStart);
      const stopCount = 9;
      const stops: [number, number][] = [];
      for (let s = 0; s <= stopCount; s++) {
        const g = lo + ((hi - lo) * s) / stopCount;
        stops.push([s / stopCount, bellOpacity(g - shiftedCenter)]);
      }
      segments.push({ id: `pg-${k}-${ei}`, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stops });
    });
  });

  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}
    >
      <defs>
        {segments.map((seg) => (
          <linearGradient key={seg.id} id={seg.id} gradientUnits="userSpaceOnUse" x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}>
            {seg.stops.map(([offset, opacity], i) => (
              <stop key={i} offset={offset} stopColor={`rgba(${hue},${opacity})`} />
            ))}
          </linearGradient>
        ))}
      </defs>
      {segments.map((seg) => (
        <line key={seg.id} x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2} stroke={`url(#${seg.id})`} strokeWidth={strokeWidth} />
      ))}
    </svg>
  );
}
