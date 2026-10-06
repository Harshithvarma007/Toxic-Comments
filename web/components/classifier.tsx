"use client";

import { useEffect, useRef, useState } from "react";
import { Frame } from "./frame";
import { classify, LABEL_NAMES, LABELS, type Profile, type Result } from "@/lib/types";

const EXAMPLES = [
  "Thanks for this, the explanation at 4:20 finally made it click.",
  "Nobody asked for your opinion, you absolute clown.",
  "I respectfully disagree, the second method is faster.",
  "Shut up you stupid idiot, go back to where you came from.",
  "If I see you at the meetup I will hurt you.",
];

export function Classifier() {
  const [text, setText] = useState(EXAMPLES[1]);
  const [profile, setProfile] = useState<Profile>("balanced");
  const [scored, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = text.trim();
    if (!t) return;
    const id = setTimeout(async () => {
      ctrl.current?.abort();
      const c = new AbortController();
      ctrl.current = c;
      setPending(true);
      const t0 = performance.now();
      try {
        const res = await classify([t], profile, c.signal);
        setResult(res.results[0]);
        setLatency(Math.round(performance.now() - t0));
        setError(null);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError((e as Error).message);
      } finally {
        if (ctrl.current === c) setPending(false);
      }
    }, 250);
    return () => clearTimeout(id);
  }, [text, profile]);

  const result = text.trim() ? scored : null;
  const verdict = result ? (result.toxic ? "Toxic" : "Clean") : "—";

  return (
    <Frame tag="Live model" glow glass className="p-5 pt-12 sm:p-8 sm:pt-14">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-4">
          <label htmlFor="comment" className="sr-only">
            Comment to classify
          </label>
          <textarea
            id="comment"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            maxLength={5000}
            placeholder="Type or paste a comment…"
            className="w-full resize-none rounded-[3px] border border-line bg-ground/70 p-4 text-[1.0625rem] leading-relaxed text-primary outline-none transition-colors placeholder:text-tertiary/70 focus:border-accent/50"
          />
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setText(ex)}
                className="max-w-[16rem] truncate rounded-[3px] border border-line px-2.5 py-1 text-left text-sm text-secondary transition-colors hover:border-line-strong hover:text-primary"
              >
                {ex}
              </button>
            ))}
          </div>
          <div className="mt-1 flex items-center gap-3">
            <span className="label-mono">Profile</span>
            <div role="radiogroup" aria-label="Threshold profile" className="flex rounded-[3px] border border-line p-0.5">
              {(["balanced", "strict"] as const).map((p) => (
                <button
                  key={p}
                  role="radio"
                  aria-checked={profile === p}
                  onClick={() => setProfile(p)}
                  className={`rounded-[2px] px-3 py-1 font-mono text-xs uppercase tracking-[0.06em] transition-colors ${
                    profile === p ? "bg-accent text-ground" : "text-secondary hover:text-primary"
                  }`}
                >
                  {p === "strict" ? "Child-safe" : "Balanced"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5" aria-live="polite">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="label-mono">Verdict</p>
              <p
                className={`font-display text-5xl font-bold tracking-[-0.03em] transition-colors ${
                  result?.toxic ? "text-danger" : result ? "text-success" : "text-tertiary"
                } ${pending ? "opacity-60" : ""}`}
              >
                {verdict}
              </p>
            </div>
            <p className="label-mono text-right">
              {latency !== null ? `${latency} ms` : ""}
              <br />
              {result ? `max ${(result.score * 100).toFixed(1)}%` : ""}
            </p>
          </div>
          {error ? (
            <p className="rounded-[3px] border border-danger/40 bg-danger/10 p-3 text-sm text-primary">{error}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {LABELS.map((label) => {
                const p = result?.scores[label] ?? 0;
                const on = result?.labels.includes(label);
                return (
                  <li key={label} className="grid grid-cols-[7rem_1fr_3.5rem] items-center gap-3">
                    <span className={`text-sm ${on ? "text-peak" : "text-secondary"}`}>{LABEL_NAMES[label]}</span>
                    <span className="relative h-1.5 overflow-hidden rounded-full bg-inset">
                      <span
                        className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-[var(--ease-standard)] ${
                          on ? "bg-danger" : "bg-accent/60"
                        }`}
                        style={{ width: `${Math.max(p * 100, 1)}%` }}
                      />
                    </span>
                    <span className="text-right font-mono text-xs tabular-nums text-secondary">
                      {(p * 100).toFixed(1)}%
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Frame>
  );
}
