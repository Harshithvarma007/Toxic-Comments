export const LABELS = ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"] as const;
export type Label = (typeof LABELS)[number];
export type Profile = "balanced" | "strict";

export const LABEL_NAMES: Record<Label, string> = {
  toxic: "Toxic",
  severe_toxic: "Severe",
  obscene: "Obscene",
  threat: "Threat",
  insult: "Insult",
  identity_hate: "Identity hate",
};

export type Result = {
  toxic: boolean;
  score: number;
  labels: Label[];
  scores: Record<Label, number>;
};

export type ClassifyResponse = { model: string; profile: Profile; results: Result[] };

export async function classify(texts: string[], profile: Profile, signal?: AbortSignal): Promise<ClassifyResponse> {
  const res = await fetch("/api/classify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts, profile }),
    signal,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? body.error ?? `API error ${res.status}`);
  }
  return res.json();
}
