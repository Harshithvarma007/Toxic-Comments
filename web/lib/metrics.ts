import raw from "@/content/metrics.json";

export type SplitMetrics = {
  mean_roc_auc: number;
  roc_auc: number;
  pr_auc: number;
  f1: number;
  precision: number;
  recall: number;
  accuracy: number;
  n: number;
  positives: number;
};

type PerLabel = Record<string, { roc_auc: number; pr_auc: number; f1: number; precision: number; recall: number; support: number }>;

export type Metrics = {
  model: string;
  base_model: string;
  params_m: number;
  size_mb: number;
  ms_per_comment_cpu: number;
  thresholds: Record<"balanced" | "strict", Record<string, number>>;
  transformer: Record<"test" | "youtube", Record<"balanced" | "strict", SplitMetrics>>;
  per_label: PerLabel;
  baseline?: Record<"test" | "youtube", SplitMetrics>;
  leak?: {
    leaky_protocol: { accuracy: number; f1: number };
    same_model_honest_split: { accuracy: number; f1: number };
    always_predict_clean_accuracy: number;
  };
  training?: { args: Record<string, unknown>; minutes: number };
};

export const metrics = raw as unknown as Metrics;

export const pct = (x: number | undefined, digits = 1) => (x === undefined ? "—" : `${(x * 100).toFixed(digits)}%`);
export const num = (x: number | undefined, digits = 3) => (x === undefined ? "—" : x.toFixed(digits));
