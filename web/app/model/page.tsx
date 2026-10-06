import type { Metadata } from "next";
import { Frame } from "@/components/frame";
import { Stat } from "@/components/section";
import { metrics, num, pct, type SplitMetrics } from "@/lib/metrics";
import { LABEL_NAMES, LABELS } from "@/lib/types";

export const metadata: Metadata = {
  title: "Model card",
  description: "Training data, evaluation, operating points and known limitations of the toxic comment model.",
};

function Row({ name, m, highlight }: { name: string; m?: SplitMetrics; highlight?: boolean }) {
  const cells = m ? [num(m.roc_auc), num(m.pr_auc), pct(m.f1), pct(m.precision), pct(m.recall)] : ["—", "—", "—", "—", "—"];
  return (
    <tr className={highlight ? "text-peak" : "text-secondary"}>
      <th scope="row" className="py-3 pr-4 text-left font-normal">
        {name}
      </th>
      {cells.map((c, i) => (
        <td key={i} className="py-3 pl-4 text-right font-mono text-sm tabular-nums">
          {c}
        </td>
      ))}
    </tr>
  );
}

function Table({ caption, rows }: { caption: string; rows: [string, SplitMetrics | undefined, boolean?][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-[0.9375rem]">
        <caption className="label-mono pb-3 text-left">{caption}</caption>
        <thead>
          <tr className="border-b border-line">
            {["Model", "ROC-AUC", "PR-AUC", "F1", "Precision", "Recall"].map((h, i) => (
              <th key={h} scope="col" className={`label-mono pb-2 font-normal ${i ? "pl-4 text-right" : "text-left"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map(([n, m, h]) => (
            <Row key={n} name={n} m={m} highlight={h} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ModelPage() {
  const T = metrics.transformer;
  const B = metrics.baseline;
  return (
    <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 sm:pt-20">
      <p className="label-mono">Model card · {metrics.model}</p>
      <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.25rem,1.4rem+3.6vw,4rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-peak">
        What the model is, how it was tested, and where it fails.
      </h1>

      <div className="mt-12 grid gap-px overflow-hidden rounded-[3px] border border-line bg-line sm:grid-cols-4">
        <Stat label="Base model" value="MiniLM" sub={metrics.base_model} />
        <Stat label="Size" value={`${metrics.size_mb} MB`} sub="int8 ONNX, dynamic quantisation" />
        <Stat label="CPU latency" value={`${metrics.ms_per_comment_cpu.toFixed(1)} ms`} sub="per comment, batched" />
        <Stat label="Test mean ROC-AUC" value={num(T.test.balanced.mean_roc_auc)} sub="6 labels, official Jigsaw test" />
      </div>

      <section className="mt-20" aria-labelledby="eval">
        <h2 id="eval" className="font-display text-3xl font-bold tracking-[-0.03em] text-peak">
          Evaluation
        </h2>
        <p className="measure mt-4 leading-relaxed text-secondary">
          The binary view: is the comment toxic under any label? Score = max over labels. Thresholds were tuned on a
          10% validation split and never on the test sets. The YouTube set comes from a different platform with
          different labellers and was never used in training, so it is the closest stand-in for how the extension
          behaves in practice.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Frame tag={`Jigsaw test · n=${T.test.balanced.n.toLocaleString()}`} className="p-5 pt-12">
            <Table
              caption="Any-toxic, held-out"
              rows={[
                ["TF-IDF + LogReg", B?.test],
                ["Transformer · balanced", T.test.balanced, true],
                ["Transformer · child-safe", T.test.strict],
              ]}
            />
          </Frame>
          <Frame tag={`YouTube · unseen domain · n=${T.youtube.balanced.n.toLocaleString()}`} glow className="p-5 pt-12">
            <Table
              caption="Any-toxic, out-of-domain"
              rows={[
                ["TF-IDF + LogReg", B?.youtube],
                ["Transformer · balanced", T.youtube.balanced, true],
                ["Transformer · child-safe", T.youtube.strict],
              ]}
            />
          </Frame>
        </div>
      </section>

      <section className="mt-20" aria-labelledby="labels">
        <h2 id="labels" className="font-display text-3xl font-bold tracking-[-0.03em] text-peak">
          Per label (Jigsaw test, balanced thresholds)
        </h2>
        <Frame className="mt-8 overflow-x-auto p-5">
          <table className="w-full min-w-[36rem] border-collapse text-[0.9375rem]">
            <thead>
              <tr className="border-b border-line">
                {["Label", "Positives", "ROC-AUC", "PR-AUC", "F1", "Threshold", "Child-safe threshold"].map((h, i) => (
                  <th key={h} scope="col" className={`label-mono pb-2 font-normal ${i ? "pl-4 text-right" : "text-left"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {LABELS.map((l) => {
                const m = metrics.per_label[l];
                return (
                  <tr key={l} className="text-secondary">
                    <th scope="row" className="py-3 text-left font-normal text-primary">
                      {LABEL_NAMES[l]}
                    </th>
                    {[m?.support.toLocaleString(), num(m?.roc_auc), num(m?.pr_auc), pct(m?.f1), num(metrics.thresholds.balanced[l], 2), num(metrics.thresholds.strict[l], 2)].map(
                      (c, i) => (
                        <td key={i} className="py-3 pl-4 text-right font-mono text-sm tabular-nums">
                          {c}
                        </td>
                      ),
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Frame>
      </section>

      <section className="mt-20 grid gap-10 lg:grid-cols-2" aria-label="Data and limitations">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-[-0.03em] text-peak">Data</h2>
          <ul className="mt-5 flex flex-col gap-3 leading-relaxed text-secondary">
            <li>
              <strong className="text-primary">Train / validation:</strong> Jigsaw Toxic Comment Classification
              (Wikipedia talk pages), 159k comments, deduplicated and with any text that also appears in a test set
              removed. Stratified 90/10 split.
            </li>
            <li>
              <strong className="text-primary">Test:</strong> the official Jigsaw test set (64k scored rows).
            </li>
            <li>
              <strong className="text-primary">Out-of-domain test:</strong> 1,000 labelled YouTube comments. Its
              labels were mapped onto Jigsaw’s (Abusive→insult, Hatespeech/Racist/Sexist/…→identity hate).
            </li>
            <li>
              <strong className="text-primary">No resampling.</strong> Class imbalance is handled by threshold
              tuning instead of SMOTE, so the test distribution stays real.
            </li>
          </ul>
        </div>
        <div>
          <h2 className="font-display text-3xl font-bold tracking-[-0.03em] text-peak">Known limitations</h2>
          <ul className="mt-5 flex flex-col gap-3 leading-relaxed text-secondary">
            <li>English only. Code-mixed comments (Hinglish and similar) are mostly missed.</li>
            <li>
              Jigsaw-trained models are known to over-flag comments that merely mention identity groups (“as a gay
              teacher…”). This model has not yet been audited for that bias.
            </li>
            <li>
              Implicit abuse with no rude words slips through. In the demo thread it misses “I know where you film
              these. watch your back.” (a veiled threat) and “people from that country are all animals” (dehumanising).
              The threat label is the weakest (F1 {pct(metrics.per_label.threat?.f1)}).
            </li>
            <li>No context: sarcasm, quotes of abuse, and in-group banter are judged on the words alone.</li>
            <li>Obfuscation (“f*ck”, “1d10t”, emoji substitutions) is only partly handled.</li>
            <li>
              Child-safe mode deliberately trades precision for recall. Expect some harmless comments to be hidden.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
