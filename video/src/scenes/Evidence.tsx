import React from "react";
import { interpolate } from "remotion";
import metrics from "../data/metrics.json";
import { useLogicalFrame } from "../vendor/Stage";
import { body, C, clamp, display, EASE_OUT, FrameChrome, mono, useIn, Words } from "../shared";

const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;

function Bar({ label, value, max = 1, start, color, fmt }: { label: string; value: number; max?: number; start: number; color: string; fmt: string }) {
  const f = useLogicalFrame();
  const p = interpolate(f, [start, start + 36], [0, 1], { ...clamp, easing: EASE_OUT });
  return (
    <div style={{ opacity: interpolate(f, [start - 6, start + 6], [0, 1], clamp) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={body(28, C.primary)}>{label}</span>
        <span style={{ ...display(44, 800), color }}>{fmt}</span>
      </div>
      <div style={{ marginTop: 12, height: 10, background: C.inset, borderRadius: 5, overflow: "hidden" }}>
        <div style={{ width: `${(value / max) * 100 * p}%`, height: "100%", background: color, borderRadius: 5 }} />
      </div>
    </div>
  );
}

/* 03 — v1 → v2: the leak. */
export const LEAK_DUR = 510;
export function Leak() {
  const f = useLogicalFrame();
  const L = metrics.leak!;
  const counter = interpolate(f, [8, 50], [0, 96.38], { ...clamp, easing: EASE_OUT });
  const strike = interpolate(f, [130, 150], [0, 1], clamp);
  const explain = useIn(150, 20);
  return (
    <FrameChrome tag="v1 → v2 · the honest number" dur={LEAK_DUR}>
      <div style={{ position: "absolute", left: 120, top: 120, width: 700 }}>
        <div style={mono(22)}>Version 1 claimed</div>
        <div style={{ position: "relative", display: "inline-block", ...display(200), color: C.peak, marginTop: 10 }}>
          {counter.toFixed(2)}%
          <div style={{ position: "absolute", left: -10, right: -10, top: "52%", height: 8, background: C.danger, transform: `scaleX(${strike})`, transformOrigin: "left" }} />
        </div>
        <div style={{ ...body(32), marginTop: 26, opacity: explain, transform: `translateY(${(1 - explain) * 16}px)` }}>
          SMOTE oversampled the <span style={{ color: C.peak }}>whole dataset</span> before the train/test split. Synthetic copies
          of test comments leaked into training, and the test set ended up half synthetic and perfectly balanced.
        </div>
      </div>
      <div style={{ position: "absolute", left: 930, right: 120, top: 150, display: "flex", flexDirection: "column", gap: 54 }}>
        <Bar label="v1 protocol · accuracy" value={L.leaky_protocol.accuracy} start={200} color={C.danger} fmt={pct(L.leaky_protocol.accuracy)} />
        <Bar label="Same model, real test set · F1" value={L.same_model_honest_split.f1} start={250} color={C.accent} fmt={pct(L.same_model_honest_split.f1)} />
        <Bar label='Always predict "clean" · accuracy' value={L.always_predict_clean_accuracy} start={300} color={C.tertiary} fmt={pct(L.always_predict_clean_accuracy)} />
      </div>
      <div style={{ position: "absolute", left: 120, right: 120, bottom: 120 }}>
        <Words text="The number was measuring the leak, not the model." start={370} style={display(64)} accent={["leak,"]} />
      </div>
    </FrameChrome>
  );
}

/* 04 — What we built: pipeline → one file → three surfaces. */
export const BUILT_DUR = 570;
const STEPS = [
  ["Data", "159k Jigsaw comments, deduped. 1k YouTube held out."],
  ["Train", "MiniLM-L12, 6 labels, Kaggle T4 GPU."],
  ["Calibrate", "Balanced + child-safe thresholds."],
  ["Export", "ONNX int8, parity-checked."],
];
const SURFACES = [
  ["Browser extension", "Runs on-device. Blurs or hides toxic YouTube comments."],
  ["FastAPI service", "POST /v1/classify. Docker, metrics, rate limits."],
  ["Website", "Live demo, model card, the honest numbers."],
];
export function Built() {
  const f = useLogicalFrame();
  const core = useIn(250, 20);
  return (
    <FrameChrome tag="What we built" dur={BUILT_DUR}>
      <div style={{ position: "absolute", left: 120, top: 90 }}>
        <Words text="One model file. Three surfaces." start={6} style={display(72)} />
      </div>
      <div style={{ position: "absolute", left: 120, right: 120, top: 250, display: "flex", gap: 18 }}>
        {STEPS.map(([k, v], i) => {
          const p = interpolate(f, [60 + i * 40, 80 + i * 40], [0, 1], { ...clamp, easing: EASE_OUT });
          return (
            <div key={k} style={{ flex: 1, padding: "24px 26px", background: C.surface, border: `1px solid ${C.line}`, opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>
              <div style={mono(20, C.accent)}>0{i + 1} {k}</div>
              <div style={{ ...body(26), marginTop: 10 }}>{v}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 470, display: "flex", justifyContent: "center", opacity: core }}>
        <div style={{ padding: "18px 40px", border: `1px solid ${C.accent}`, ...mono(26, C.peak) }}>
          model_quantized.onnx · {metrics.size_mb} MB
        </div>
      </div>
      <div style={{ position: "absolute", left: 120, right: 120, top: 610, display: "flex", gap: 24 }}>
        {SURFACES.map(([k, v], i) => {
          const p = interpolate(f, [300 + i * 30, 322 + i * 30], [0, 1], { ...clamp, easing: EASE_OUT });
          return (
            <div key={k} style={{ flex: 1, padding: "30px 32px", background: C.ground, border: `1px solid ${i === 0 ? C.accent : C.line}`, opacity: p, transform: `translateY(${(1 - p) * 24}px)` }}>
              <div style={{ ...display(40, 700), color: C.peak }}>{k}</div>
              <div style={{ ...body(26), marginTop: 12 }}>{v}</div>
            </div>
          );
        })}
      </div>
    </FrameChrome>
  );
}

/* 05 — Held-out results. */
export const RESULTS_DUR = 420;
export function Results() {
  const T = metrics.transformer;
  const B = metrics.baseline!;
  const stat = useIn(250, 20);
  return (
    <FrameChrome tag="Held-out results" dur={RESULTS_DUR}>
      <div style={{ position: "absolute", left: 120, top: 90 }}>
        <Words text="Tested on data it never saw." start={6} style={display(72)} />
      </div>
      <div style={{ position: "absolute", left: 120, width: 700, top: 260, display: "flex", flexDirection: "column", gap: 40 }}>
        <div style={mono(22)}>Jigsaw test · 64k comments · F1</div>
        <Bar label="TF-IDF + logistic regression" value={B.test.f1} start={50} color={C.tertiary} fmt={pct(B.test.f1)} />
        <Bar label="Transformer" value={T.test.balanced.f1} start={80} color={C.success} fmt={pct(T.test.balanced.f1)} />
      </div>
      <div style={{ position: "absolute", right: 120, width: 700, top: 260, display: "flex", flexDirection: "column", gap: 40 }}>
        <div style={mono(22)}>YouTube · unseen platform · ROC-AUC</div>
        <Bar label="TF-IDF + logistic regression" value={B.youtube.roc_auc} start={130} color={C.tertiary} fmt={B.youtube.roc_auc.toFixed(3)} />
        <Bar label="Transformer" value={T.youtube.balanced.roc_auc} start={160} color={C.success} fmt={T.youtube.balanced.roc_auc.toFixed(3)} />
      </div>
      <div style={{ position: "absolute", left: 120, right: 120, bottom: 110, display: "flex", gap: 24, opacity: stat }}>
        {[
          [`${metrics.size_mb} MB`, "int8 model"],
          [`${metrics.ms_per_comment_cpu.toFixed(1)} ms`, "per comment on CPU"],
          [pct(T.test.strict.recall), "toxic caught · child-safe · Jigsaw test"],
        ].map(([v, k]) => (
          <div key={k} style={{ flex: 1, padding: "22px 28px", background: C.surface, border: `1px solid ${C.line}` }}>
            <div style={{ ...display(56), color: C.peak }}>{v}</div>
            <div style={{ ...mono(20), marginTop: 6 }}>{k}</div>
          </div>
        ))}
      </div>
    </FrameChrome>
  );
}
