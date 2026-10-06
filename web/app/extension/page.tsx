import type { Metadata } from "next";
import { Frame } from "@/components/frame";
import { ButtonLink } from "@/components/section";
import { metrics } from "@/lib/metrics";

export const metadata: Metadata = {
  title: "Browser extension",
  description: "A Chrome extension that blurs or hides toxic YouTube comments, with the model running on-device.",
};

const STEPS = [
  ["Watch", "A MutationObserver picks up comments as YouTube lazy-loads them, including replies and infinite scroll."],
  ["Score", `Comments are batched and scored by the ${metrics.size_mb} MB model in an offscreen document. ONNX Runtime Web runs on WebAssembly, so nothing is uploaded.`],
  ["Filter", "Toxic comments are blurred (hover to reveal) or removed, with the reason shown. The toolbar badge counts what was caught."],
  ["Control", "Parents choose Off / Blur / Hide and Balanced / Child-safe, and can switch to the cloud API on low-end machines."],
];

const INSTALL = [
  "Download the latest extension zip from GitHub Releases (or run pnpm build in extension/).",
  "Open chrome://extensions and turn on Developer mode.",
  "Click Load unpacked and select the unzipped folder.",
  "Open any YouTube video and scroll to the comments.",
];

export default function ExtensionPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 sm:pt-20">
      <p className="label-mono">Chrome · Edge · Brave · Arc</p>
      <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.25rem,1.4rem+3.6vw,4rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-peak">
        YouTube comments, without the abuse.
      </h1>
      <p className="measure mt-5 text-lg leading-relaxed text-secondary">
        The extension runs the same model as the API, but inside your browser. A child’s viewing history is never sent
        anywhere, it costs nothing to run, and it keeps working when our server is down.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="https://github.com/Harshithvarma007/Toxic-Comments/releases" primary>
          Download for Chrome
        </ButtonLink>
        <ButtonLink href="/demo">See it on a demo page</ButtonLink>
      </div>

      <ol className="mt-16 grid gap-px overflow-hidden rounded-[3px] border border-line bg-line md:grid-cols-4">
        {STEPS.map(([k, v], i) => (
          <li key={k} className="bg-surface p-5">
            <p className="label-mono">
              <span className="text-accent">0{i + 1}</span> {k}
            </p>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-secondary">{v}</p>
          </li>
        ))}
      </ol>

      <div className="mt-16 grid gap-6 lg:grid-cols-2">
        <Frame tag="Install (developer mode)" glow className="p-6 pt-12">
          <ol className="flex flex-col gap-4">
            {INSTALL.map((s, i) => (
              <li key={i} className="flex gap-4">
                <span className="font-mono text-sm text-accent">{i + 1}</span>
                <span className="leading-relaxed text-primary">{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-tertiary">
            A Chrome Web Store listing is the next step. It needs a privacy policy, store screenshots and review time.
          </p>
        </Frame>
        <Frame tag="Privacy" className="p-6 pt-12">
          <ul className="flex flex-col gap-3 leading-relaxed text-secondary">
            <li>
              <strong className="text-primary">On-device mode (default):</strong> comment text is processed locally and
              never leaves the browser.
            </li>
            <li>
              <strong className="text-primary">Cloud mode (opt-in):</strong> comment text is sent to the API over HTTPS
              for scoring and is not stored. Only aggregate counters are kept for monitoring.
            </li>
            <li>
              <strong className="text-primary">Permissions:</strong> access to youtube.com only, plus storage for
              your settings. No history, no tabs, no analytics.
            </li>
          </ul>
        </Frame>
      </div>
    </div>
  );
}
