"use client";

import { useEffect, useMemo, useState } from "react";
import { Frame } from "./frame";
import { COMMENTS, VIDEO } from "@/content/comments";
import { classify, LABEL_NAMES, type Profile, type Result } from "@/lib/types";

type Mode = "off" | "blur" | "hide";

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="label-mono">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex rounded-[3px] border border-line p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-[2px] px-3 py-1 font-mono text-xs uppercase tracking-[0.06em] transition-colors ${
              value === o.value ? "bg-accent text-ground" : "text-secondary hover:text-primary"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function YouTubeDemo() {
  const [profile, setProfile] = useState<Profile>("strict");
  const [mode, setMode] = useState<Mode>("hide");
  const [results, setResults] = useState<Partial<Record<Profile, Result[]>>>({});
  const [error, setError] = useState<string | null>(null);
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    if (results[profile]) return;
    const c = new AbortController();
    const t0 = performance.now();
    classify(
      COMMENTS.map((x) => x.text),
      profile,
      c.signal,
    )
      .then((r) => {
        setResults((prev) => ({ ...prev, [profile]: r.results }));
        setMs(Math.round(performance.now() - t0));
        setError(null);
      })
      .catch((e) => e.name !== "AbortError" && setError(e.message));
    return () => c.abort();
  }, [profile, results]);

  const current = results[profile];
  const flagged = useMemo(() => current?.filter((r) => r.toxic).length ?? 0, [current]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <Frame tag="Simulated YouTube page" className="overflow-hidden bg-ground/60 p-4 pt-12 sm:p-6 sm:pt-12">
        {/* Video placeholder */}
        <div className="relative aspect-video w-full overflow-hidden rounded-[3px] border border-line bg-[radial-gradient(ellipse_at_50%_120%,#5a2a1c_0%,#2a1712_35%,#14141c_75%)]">
          <div className="absolute bottom-0 left-1/2 h-1/2 w-2/3 -translate-x-1/2 bg-[#1d1714] [clip-path:polygon(0_100%,38%_8%,62%_8%,100%_100%)]" />
          <div className="absolute bottom-[46%] left-1/2 h-10 w-24 -translate-x-1/2 rounded-full bg-[#e2683c]/70 blur-xl" />
          <span className="label-mono absolute bottom-3 right-3 rounded-[2px] bg-black/60 px-1.5 py-0.5 !text-primary">
            12:48
          </span>
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold leading-snug text-peak">{VIDEO.title}</h3>
        <p className="mt-1 text-sm text-secondary">
          {VIDEO.channel} · {VIDEO.views} · {VIDEO.ago}
        </p>

        <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
          <p className="font-display text-lg font-semibold text-primary">{COMMENTS.length} Comments</p>
          {current && mode !== "off" && (
            <p className="label-mono">
              {flagged} filtered · {profile === "strict" ? "child-safe" : "balanced"}
            </p>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-[3px] border border-danger/40 bg-danger/10 p-3 text-sm">{error}</p>
        )}

        <ul className="mt-4 flex flex-col">
          {COMMENTS.map((c, i) => {
            const r = current?.[i];
            const isToxic = !!r?.toxic && mode !== "off";
            if (isToxic && mode === "hide") return null;
            return (
              <li key={c.id} className="flex gap-3 py-3">
                <span
                  aria-hidden
                  className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-inset font-mono text-xs uppercase text-tertiary"
                >
                  {c.author.slice(1, 3)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.8125rem] text-secondary">
                    <span className="font-semibold text-primary">{c.author}</span> · {c.ago}
                  </p>
                  {isToxic ? (
                    <div className="mt-1">
                      <p className="tc-blur text-[0.9375rem] text-primary" title="Hover to reveal">
                        {c.text}
                      </p>
                      <p className="label-mono mt-1 !text-danger">
                        Hidden · {r!.labels.map((l) => LABEL_NAMES[l]).join(", ")}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-[0.9375rem] leading-relaxed text-primary">{c.text}</p>
                  )}
                  <p className="mt-1.5 text-xs text-tertiary">
                    ▲ {c.likes.toLocaleString()} {r && mode === "off" && (
                      <span className={`ml-3 font-mono ${r.toxic ? "text-danger" : "text-tertiary"}`}>
                        score {(r.score * 100).toFixed(0)}%
                      </span>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </Frame>

      <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
        <Frame tag="Extension popup" glow glowOffset={0.4} glass className="flex flex-col gap-5 p-5 pt-12">
          <Segmented
            label="Filter"
            value={mode}
            onChange={setMode}
            options={[
              { value: "off", label: "Off" },
              { value: "blur", label: "Blur" },
              { value: "hide", label: "Hide" },
            ]}
          />
          <Segmented
            label="Level"
            value={profile}
            onChange={setProfile}
            options={[
              { value: "balanced", label: "Balanced" },
              { value: "strict", label: "Child-safe" },
            ]}
          />
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-line bg-line">
            <div className="bg-surface p-3">
              <dt className="label-mono">Filtered</dt>
              <dd className="font-display text-3xl font-bold text-peak">{current ? flagged : "…"}</dd>
            </div>
            <div className="bg-surface p-3">
              <dt className="label-mono">Batch</dt>
              <dd className="font-display text-3xl font-bold text-peak">{ms !== null ? `${ms}ms` : "…"}</dd>
            </div>
          </dl>
          <p className="text-sm leading-relaxed text-secondary">
            <strong className="text-primary">Child-safe</strong> uses thresholds that catch at least 90% of toxic
            comments on validation data. It hides more borderline comments, which is the right trade-off for a
            child’s screen. <strong className="text-primary">Balanced</strong> maximises F1 for general use.
          </p>
        </Frame>
      </aside>
    </div>
  );
}
