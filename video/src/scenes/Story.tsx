import React from "react";
import { interpolate } from "remotion";
import demo from "../data/demo.json";
import { useLogicalFrame } from "../vendor/Stage";
import { body, C, clamp, display, EASE_OUT, FrameChrome, mono, useIn, Words } from "../shared";

type Scored = { author: string; text: string; toxic: boolean; score: number };
const STRICT = demo.strict as Scored[];

/* 01 — Cold open: a comment section scrolls past; the abusive ones flare. */
export const COLD_DUR = 300;
export function ColdOpen() {
  const f = useLogicalFrame();
  const scroll = interpolate(f, [0, COLD_DUR], [40, -900], clamp);
  return (
    <FrameChrome tag="The problem" dur={COLD_DUR}>
      <div style={{ position: "absolute", left: 80, top: 0, bottom: 0, width: 760, overflow: "hidden", maskImage: "linear-gradient(transparent, black 18%, black 82%, transparent)" }}>
        <div style={{ transform: `translateY(${scroll}px)`, paddingTop: 200 }}>
          {STRICT.map((c, i) => {
            const y = 200 + i * 118 + scroll; // approx on-screen y
            const flare = c.toxic ? interpolate(y, [380, 520, 700], [0.55, 1, 0], clamp) : 0;
            return (
              <div key={i} style={{ display: "flex", gap: 18, padding: "22px 0", borderBottom: `1px solid ${C.line}` }}>
                <div style={{ width: 46, height: 46, borderRadius: 23, background: C.inset, flex: "none" }} />
                <div>
                  <div style={{ ...body(20, C.tertiary) }}>{c.author}</div>
                  <div style={{ ...body(26, C.primary), color: flare > 0.3 ? C.danger : C.primary, opacity: 0.55 + flare * 0.45 }}>
                    {c.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", left: 940, right: 90, top: 330 }}>
        <Words text="Every kids' video has a comment section." start={20} style={display(76)} />
        <Words text="It isn't written for kids." start={120} style={{ ...display(76), marginTop: 36 }} color={C.danger} />
      </div>
    </FrameChrome>
  );
}

/* 02 — Why we built it. */
export const WHY_DUR = 360;
const WHY_LINES = [
  { t: "Platforms moderate late, at their own thresholds.", at: 10 },
  { t: "Parents get one switch: turn all comments off.", at: 80 },
  { t: "We wanted the middle option.", at: 160 },
];
export function Why() {
  const p = useIn(220, 20);
  return (
    <FrameChrome tag="Why we built it" dur={WHY_DUR}>
      <div style={{ position: "absolute", left: 120, top: 150, right: 120 }}>
        {WHY_LINES.map((l, i) => (
          <Words key={i} text={l.t} start={l.at} style={{ ...display(i === 2 ? 84 : 60, i === 2 ? 800 : 600), marginTop: i ? 34 : 0 }} color={i === 2 ? C.peak : C.secondary} />
        ))}
        <div style={{ display: "flex", gap: 24, marginTop: 70, opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>
          {[
            ["Keep", "questions, jokes, honest disagreement", C.success],
            ["Remove", "insults, slurs, threats", C.danger],
            ["Where", "on the family's own device", C.accent],
          ].map(([k, v, col]) => (
            <div key={k} style={{ flex: 1, padding: "26px 28px", background: C.surface, border: `1px solid ${C.line}` }}>
              <div style={mono(20, col)}>{k}</div>
              <div style={{ ...body(30, C.primary), marginTop: 10 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </FrameChrome>
  );
}

/* 08 — Outro. */
export const OUTRO_DUR = 240;
export function Outro() {
  const f = useLogicalFrame();
  const p = useIn(6, 24);
  const out = interpolate(f, [OUTRO_DUR - 30, OUTRO_DUR], [1, 0], clamp);
  return (
    <FrameChrome tag="Toxic comment detection · v2" dur={OUTRO_DUR}>
      <div style={{ position: "absolute", left: 140, top: 300, opacity: p * out }}>
        <div style={{ ...display(132), color: C.peak, transform: `translateY(${(1 - p) * 24}px)` }}>Toxic Comment Detection</div>
        <Words text="Keep the conversation. Lose the abuse." start={30} style={{ ...display(56, 600), marginTop: 30 }} color={C.secondary} accent={["abuse."]} />
        <div style={{ marginTop: 90, display: "flex", flexDirection: "column", gap: 16, opacity: interpolate(f, [70, 100], [0, 1], { ...clamp, easing: EASE_OUT }) }}>
          <div style={mono(28, C.accent)}>toxic.harshithvarma.in</div>
          <div style={mono(24, C.tertiary)}>github.com/Harshithvarma007/Toxic-Comments</div>
        </div>
      </div>
    </FrameChrome>
  );
}
