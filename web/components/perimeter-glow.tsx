"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Web port of Video OS `PerimeterGlowTravel` (v3): a glow that travels around a rectangle at
 * constant arc-length speed, drawn as per-edge SVG linear gradients sampled from the measured
 * bell profile — continuous falloff along the line, zero perpendicular bloom.
 * Remotion's frame clock is replaced by requestAnimationFrame; it pauses off-screen and
 * renders a static frame for prefers-reduced-motion.
 */
const PROFILE: [number, number][] = [
  [-68, 0], [-60, 0.24], [-48, 0.47], [-35, 0.74], [-25, 0.95], [0, 1],
  [25, 0.95], [35, 0.74], [48, 0.47], [60, 0.24], [68, 0],
];
const HALF_EXTENT = 68;

function bell(offset: number): number {
  if (offset <= -HALF_EXTENT || offset >= HALF_EXTENT) return 0;
  for (let i = 0; i < PROFILE.length - 1; i++) {
    const [x0, y0] = PROFILE[i];
    const [x1, y1] = PROFILE[i + 1];
    if (offset >= x0 && offset <= x1) return y0 + ((y1 - y0) * (offset - x0)) / (x1 - x0);
  }
  return 0;
}

type Pt = { x: number; y: number };
type Edge = { cumStart: number; cumEnd: number; start: Pt; dir: Pt };
type Segment = { id: string; x1: number; y1: number; x2: number; y2: number; stops: [number, number][] };

function segmentsAt(width: number, height: number, progress: number, uid: string): Segment[] {
  const w = width - 1;
  const h = height - 1;
  const perimeter = 2 * (w + h);
  const center = progress * perimeter;
  const edges: Edge[] = [
    { cumStart: 0, cumEnd: w, start: { x: 0.5, y: 0.5 }, dir: { x: 1, y: 0 } },
    { cumStart: w, cumEnd: w + h, start: { x: width - 0.5, y: 0.5 }, dir: { x: 0, y: 1 } },
    { cumStart: w + h, cumEnd: 2 * w + h, start: { x: width - 0.5, y: height - 0.5 }, dir: { x: -1, y: 0 } },
    { cumStart: 2 * w + h, cumEnd: perimeter, start: { x: 0.5, y: height - 0.5 }, dir: { x: 0, y: -1 } },
  ];
  const segs: Segment[] = [];
  [center - perimeter, center, center + perimeter].forEach((c, k) => {
    edges.forEach((e, ei) => {
      const lo = Math.max(e.cumStart, c - HALF_EXTENT);
      const hi = Math.min(e.cumEnd, c + HALF_EXTENT);
      if (lo >= hi) return;
      const a = lo - e.cumStart;
      const b = hi - e.cumStart;
      const stops: [number, number][] = [];
      for (let s = 0; s <= 9; s++) {
        const g = lo + ((hi - lo) * s) / 9;
        stops.push([s / 9, bell(g - c)]);
      }
      segs.push({
        id: `${uid}-${k}-${ei}`,
        x1: e.start.x + e.dir.x * a,
        y1: e.start.y + e.dir.y * a,
        x2: e.start.x + e.dir.x * b,
        y2: e.start.y + e.dir.y * b,
        stops,
      });
    });
  });
  return segs;
}

let counter = 0;

export function PerimeterGlow({
  periodMs = 6000,
  strokeWidth = 1.5,
  reverse = false,
  offset = 0,
}: {
  periodMs?: number;
  strokeWidth?: number;
  reverse?: boolean;
  /** 0-1 phase offset so several frames on one page don't move in lockstep. */
  offset?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [uid] = useState(() => `pg${counter++}`);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [progress, setProgress] = useState(offset);

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const b = entry.borderBoxSize?.[0];
      setSize({ w: Math.round(b ? b.inlineSize : el.offsetWidth), h: Math.round(b ? b.blockSize : el.offsetHeight) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let visible = true;
    const t0 = performance.now();
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    });
    const tick = (now: number) => {
      const p = (((now - t0) / periodMs + offset) % 1 + 1) % 1;
      setProgress(reverse ? 1 - p : p);
      raf = visible ? requestAnimationFrame(tick) : 0;
    };
    if (ref.current) io.observe(ref.current);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [periodMs, reverse, offset]);

  const segs = size.w > 2 && size.h > 2 ? segmentsAt(size.w, size.h, progress, uid) : [];
  return (
    <svg
      ref={ref}
      aria-hidden="true"
      width={size.w}
      height={size.h}
      style={{ position: "absolute", top: -1, left: -1, pointerEvents: "none", overflow: "visible" }}
    >
      <defs>
        {segs.map((s) => (
          <linearGradient key={s.id} id={s.id} gradientUnits="userSpaceOnUse" x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}>
            {s.stops.map(([o, a], i) => (
              <stop key={i} offset={o} stopColor="rgb(245,192,192)" stopOpacity={a} />
            ))}
          </linearGradient>
        ))}
      </defs>
      {segs.map((s) => (
        <line key={s.id} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={`url(#${s.id})`} strokeWidth={strokeWidth} />
      ))}
    </svg>
  );
}
