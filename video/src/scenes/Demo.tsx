import React from "react";
import { interpolate } from "remotion";
import demo from "../data/demo.json";
import { useLogicalFrame } from "../vendor/Stage";
import { body, C, clamp, display, EASE_OUT, FrameChrome, mono, useIn, Words } from "../shared";

type Scored = { author: string; text: string; toxic: boolean; score: number; labels: string[] };
const ROWS = (demo.strict as Scored[]).slice(0, 26);
const SCORE_AT = 70; // scores appear
const BLUR_AT = 170; // toxic rows blur
const HIDE_AT = 300; // toxic rows collapse
const ROW_H = 54;

/* 06 — The child-safe demo, with real model scores for every comment. */
export const DEMO_DUR = 540;
export function Demo() {
  const f = useLogicalFrame();
  const blur = interpolate(f, [BLUR_AT, BLUR_AT + 20], [0, 1], clamp);
  const hide = interpolate(f, [HIDE_AT, HIDE_AT + 40], [0, 1], { ...clamp, easing: EASE_OUT });
  const flagged = ROWS.filter((r) => r.toxic).length;
  const counted = Math.round(interpolate(f, [BLUR_AT, BLUR_AT + 40], [0, flagged], clamp));
  const mode = f < BLUR_AT ? "OFF" : f < HIDE_AT ? "BLUR" : "HIDE";
  const panel = useIn(20, 20);

  return (
    <FrameChrome tag="Child-safe mode · real model scores" dur={DEMO_DUR}>
      <div style={{ position: "absolute", left: 90, top: 70, width: 960, bottom: 60, overflow: "hidden" }}>
        <div style={mono(20)}>Curious Lab · How Volcanoes Actually Work · comments</div>
        <div style={{ marginTop: 20 }}>
          {ROWS.map((r, i) => {
            const h = r.toxic ? ROW_H * (1 - hide) : ROW_H;
            const scoreIn = interpolate(f, [SCORE_AT + i * 4, SCORE_AT + i * 4 + 10], [0, 1], clamp);
            return (
              <div key={i} style={{ height: h, overflow: "hidden", opacity: r.toxic ? 1 - hide : 1, borderBottom: `1px solid ${C.line}` }}>
                <div style={{ height: ROW_H, display: "flex", alignItems: "center", gap: 18 }}>
                  <span style={{ ...body(18, C.tertiary), width: 170, flex: "none", overflow: "hidden", whiteSpace: "nowrap" }}>{r.author}</span>
                  <span
                    style={{
                      ...body(23, C.primary),
                      flex: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      filter: r.toxic ? `blur(${blur * 7}px)` : undefined,
                    }}
                  >
                    {r.text}
                  </span>
                  <span style={{ ...mono(18, r.toxic ? C.danger : C.tertiary), width: 90, textAlign: "right", opacity: scoreIn }}>
                    {(r.score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ position: "absolute", right: 90, top: 110, width: 520, opacity: panel, transform: `translateY(${(1 - panel) * 20}px)` }}>
        <div style={{ padding: 34, background: "rgba(20,19,26,0.7)", border: `1px solid rgba(245,192,192,0.25)` }}>
          <div style={mono(20)}>Extension · filter</div>
          <div style={{ display: "flex", marginTop: 14, border: `1px solid ${C.line}`, padding: 3 }}>
            {["OFF", "BLUR", "HIDE"].map((m) => (
              <div key={m} style={{ flex: 1, textAlign: "center", padding: "10px 0", ...mono(20, m === mode ? C.canvas : C.secondary), background: m === mode ? C.accent : "transparent" }}>
                {m}
              </div>
            ))}
          </div>
          <div style={{ ...mono(20), marginTop: 30 }}>Filtered</div>
          <div style={{ ...display(120), color: C.peak }}>{counted}</div>
          <div style={{ ...body(24), marginTop: 8 }}>of {ROWS.length} comments · scored on-device</div>
        </div>
        <Words
          text="Questions stay. Jokes stay. Disagreement stays."
          start={380}
          style={{ ...display(46, 700), marginTop: 50 }}
          color={C.primary}
        />
      </div>
    </FrameChrome>
  );
}

/* 07 — End state / the perfect final state. */
export const END_DUR = 450;
const ROADMAP = [
  ["Now", "Honest model · on-device extension · API · this demo", C.success],
  ["Next", "Learn from mistakes: opt-in reports, reviewed, retrained monthly", C.accent],
  ["Next", "Fairness audit: no over-flagging of identity terms", C.accent],
  ["Later", "Hindi, Telugu, Hinglish: a multilingual student model", C.tertiary],
  ["Later", "Context-aware: video topic and parent comment, not just words", C.tertiary],
  ["Later", "Chrome Web Store, Firefox, Safari, and a parent dashboard", C.tertiary],
] as const;
export function EndState() {
  const f = useLogicalFrame();
  return (
    <FrameChrome tag="Where this goes" dur={END_DUR}>
      <div style={{ position: "absolute", left: 120, top: 90, right: 120 }}>
        <Words text="The end state: moderation on the family's terms." start={6} style={display(68)} accent={["family's"]} />
        <div style={{ marginTop: 50, borderTop: `1px solid ${C.line}` }}>
          {ROADMAP.map(([when, what, col], i) => {
            const p = interpolate(f, [70 + i * 40, 90 + i * 40], [0, 1], { ...clamp, easing: EASE_OUT });
            return (
              <div key={i} style={{ display: "flex", gap: 40, padding: "22px 0", borderBottom: `1px solid ${C.line}`, opacity: p, transform: `translateX(${(1 - p) * -24}px)` }}>
                <span style={{ ...mono(22, col), width: 110, flex: "none" }}>{when}</span>
                <span style={body(32, C.primary)}>{what}</span>
              </div>
            );
          })}
        </div>
      </div>
    </FrameChrome>
  );
}
