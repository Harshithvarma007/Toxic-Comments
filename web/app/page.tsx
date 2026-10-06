import Link from "next/link";
import { Classifier } from "@/components/classifier";
import { Frame } from "@/components/frame";
import { ButtonLink, Section, Stat } from "@/components/section";
import { metrics, num, pct } from "@/lib/metrics";

const T = metrics.transformer;
const B = metrics.baseline;
const L = metrics.leak;

const SURFACES = [
  {
    tag: "Browser extension",
    title: "On-device, private by default",
    body: "The model runs inside Chrome via ONNX Runtime Web. YouTube comments are scored on the machine and never leave it. Toxic comments are blurred or hidden before a child reads them.",
    href: "/extension",
  },
  {
    tag: "FastAPI service",
    title: "One endpoint for everything else",
    body: "POST /v1/classify scores up to 64 comments per call on a CPU container. It has health and readiness checks, Prometheus metrics, rate limits, optional API keys and an LRU cache for repeated comments.",
    href: "/docs",
  },
  {
    tag: "This website",
    title: "The demo and the evidence",
    body: "A live classifier, a simulated YouTube comment section you can filter, and a model card with the held-out numbers. Those numbers include the ones that are not flattering.",
    href: "/model",
  },
];

const PIPELINE = [
  ["Data", "Jigsaw 159k Wikipedia comments, deduped against test sets. YouTube 1k kept out as an unseen domain."],
  ["Train", "all-MiniLM-L12-v2, 6-label sigmoid head, fine-tuned on a Kaggle T4 GPU with mixed precision."],
  ["Calibrate", "Two operating points tuned on validation: balanced (max F1) and child-safe (≥ 90% recall)."],
  ["Export", "ONNX, dynamic int8 quantisation, parity-checked against fp32. One file serves every surface."],
  ["Serve", "FastAPI + ONNX Runtime in a slim CPU container (no PyTorch). The extension runs the same file in the browser."],
];

const ROADMAP = [
  ["Now", "33M transformer, on-device extension, API, honest evaluation on an unseen domain."],
  ["Next", "Collect opt-in false-positive / false-negative reports from the extension. Retrain monthly on them with a human-reviewed queue."],
  ["Next", "Fairness audit: measure false-positive rates on identity terms (Jigsaw Unintended Bias set) and fix the gaps before claiming child-safety."],
  ["Later", "Multilingual student model (XLM-R distilled) for Hindi, Telugu and code-mixed comments, which make up a large share of YouTube."],
  ["Later", "Context-aware scoring: use the video topic and parent comment, so 'I'll kill it at the recital' stops being a threat."],
  ["Later", "Firefox + Safari ports, a parent dashboard with weekly digests, and a creator-side API for pre-moderation queues."],
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div aria-hidden className="blueprint pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-16 sm:px-6 sm:pt-24">
          <p className="label-mono rise">Toxic comment detection · v2</p>
          <h1 className="rise mt-4 max-w-4xl font-display text-[clamp(2.5rem,1.4rem+5vw,5.25rem)] font-extrabold leading-[1.02] tracking-[-0.04em] text-peak [animation-delay:80ms]">
            Filter the worst of the comment section before a child reads it.
          </h1>
          <p className="rise measure mt-6 text-lg leading-relaxed text-secondary [animation-delay:160ms] sm:text-xl">
            A {metrics.size_mb} MB transformer that scores comments for six kinds of toxicity in about{" "}
            {Math.round(metrics.ms_per_comment_cpu)} ms on a CPU. It ships as a browser extension that cleans up YouTube
            on-device, an API for everything else, and this demo.
          </p>
          <div className="rise mt-8 flex flex-wrap gap-3 [animation-delay:240ms]">
            <ButtonLink href="/demo" primary>
              Try the YouTube demo →
            </ButtonLink>
            <ButtonLink href="/extension">Get the extension</ButtonLink>
            <ButtonLink href="https://github.com/Harshithvarma007/Toxic-Comments">Source on GitHub</ButtonLink>
          </div>
        </div>
        <div className="relative mx-auto mt-10 max-w-6xl px-4 sm:px-6">
          <Classifier />
        </div>
      </section>

      <Section
        id="why"
        index="01"
        eyebrow="Why we built it"
        title="Comment sections on kids' videos are not written for kids."
        lede="Every popular video collects insults, slurs and threats underneath it. Platforms moderate after the fact and at their own thresholds. Parents get one blunt switch that turns all comments off. We wanted a middle option: keep the questions, jokes and honest disagreement, and remove the abuse, on the parent's terms and on the parent's device."
      >
        <div className="grid gap-px overflow-hidden rounded-[3px] border border-line bg-line sm:grid-cols-3">
          <Stat label="Labels" value="6" sub="toxic · severe · obscene · threat · insult · identity hate" />
          <Stat label="Model size" value={`${metrics.size_mb} MB`} sub={`${metrics.params_m}M params, int8 ONNX`} />
          <Stat label="Unseen YouTube data" value={num(T.youtube.balanced.roc_auc, 3)} sub="ROC-AUC on 1,000 comments never trained on" />
        </div>
      </Section>

      <Section
        id="honest"
        index="02"
        eyebrow="What changed from v1"
        title="The old 96% was measuring the wrong thing."
        lede={
          <>
            v1 oversampled the whole dataset with SMOTE <em>before</em> splitting it. Synthetic neighbours of test
            comments ended up in training, and the test set was half synthetic and perfectly balanced. Re-running that
            protocol and then scoring the same model on real, untouched comments shows the gap.
          </>
        }
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Frame tag="v1 protocol vs reality" className="p-5 pt-12 sm:p-6 sm:pt-12">
            <div className="grid gap-px overflow-hidden rounded-[3px] border border-line bg-line sm:grid-cols-2">
              <Stat label="Leaky split · accuracy" value={pct(L?.leaky_protocol.accuracy)} sub={`F1 ${pct(L?.leaky_protocol.f1)}`} tone="danger" />
              <Stat label="Real test set · F1" value={pct(L?.same_model_honest_split.f1)} sub={`accuracy ${pct(L?.same_model_honest_split.accuracy)}`} />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-secondary">
              On real data, a model that never flags anything scores {pct(L?.always_predict_clean_accuracy)} accuracy.
              That is why v2 reports ROC-AUC, PR-AUC and F1 on the toxic class, never accuracy alone.
            </p>
          </Frame>
          <Frame tag="v2 · held-out Jigsaw test (64k)" glow glowOffset={0.25} className="p-5 pt-12 sm:p-6 sm:pt-12">
            <div className="grid gap-px overflow-hidden rounded-[3px] border border-line bg-line sm:grid-cols-2">
              <Stat label="TF-IDF + LogReg · F1" value={pct(B?.test.f1)} sub={`PR-AUC ${num(B?.test.pr_auc)}`} />
              <Stat label="Transformer · F1" value={pct(T.test.balanced.f1)} sub={`PR-AUC ${num(T.test.balanced.pr_auc)}`} tone="success" />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-secondary">
              Any-toxic F1 on the official test set, with thresholds tuned on validation only. Full per-label numbers
              are on the <Link href="/model" className="text-accent underline-offset-4 hover:underline">model card</Link>.
            </p>
          </Frame>
        </div>
      </Section>

      <Section
        id="what"
        index="03"
        eyebrow="What we built"
        title="One model file, three surfaces."
        lede="Training produces a single quantised ONNX file. The API, the extension and the site all run that exact file, so a number on the model card is the number you get in production."
      >
        <ol className="grid gap-px overflow-hidden rounded-[3px] border border-line bg-line md:grid-cols-5">
          {PIPELINE.map(([k, v], i) => (
            <li key={k} className="bg-surface p-5">
              <p className="label-mono">
                <span className="text-accent">0{i + 1}</span> {k}
              </p>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-secondary">{v}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {SURFACES.map((s, i) => (
            <Link key={s.tag} href={s.href} className="group block">
              <Frame tag={s.tag} glow={i === 0} className="h-full p-5 pt-12 transition-colors group-hover:bg-surface/60 sm:p-6 sm:pt-12">
                <h3 className="font-display text-xl font-semibold tracking-[-0.01em] text-peak">{s.title}</h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-secondary">{s.body}</p>
                <p className="label-mono mt-5 !text-accent">Open →</p>
              </Frame>
            </Link>
          ))}
        </div>
      </Section>

      <Section
        id="end-state"
        index="04"
        eyebrow="Where this goes"
        title="The end state: moderation that runs on the family's terms."
        lede="Today's build is the foundation: an honest model, private on-device inference and a real API. A production child-safety tool needs three more things. It has to learn from its mistakes, prove it treats identity groups fairly, and understand more than English."
      >
        <ol className="flex flex-col divide-y divide-line border-y border-line">
          {ROADMAP.map(([when, what], i) => (
            <li key={i} className="grid gap-2 py-5 sm:grid-cols-[8rem_1fr]">
              <span className={`label-mono ${when === "Now" ? "!text-success" : when === "Next" ? "!text-accent" : ""}`}>{when}</span>
              <span className="text-[1.0625rem] leading-relaxed text-primary">{what}</span>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
