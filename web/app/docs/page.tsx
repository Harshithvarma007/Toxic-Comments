import type { Metadata } from "next";
import { Frame } from "@/components/frame";

export const metadata: Metadata = {
  title: "API",
  description: "REST API for scoring comments: POST /v1/classify.",
};

const REQUEST = `curl -X POST https://api.toxic.harshithvarma.in/v1/classify \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: $TOXIC_API_KEY" \\
  -d '{"texts": ["Great video, thanks!", "you are an idiot"], "profile": "balanced"}'`;

const RESPONSE = `{
  "model": "toxic-all-MiniLM-L12-v2",
  "profile": "balanced",
  "results": [
    { "toxic": false, "score": 0.0012, "labels": [],
      "scores": { "toxic": 0.0012, "severe_toxic": 0.0001, "obscene": 0.0004,
                  "threat": 0.0001, "insult": 0.0006, "identity_hate": 0.0002 } },
    { "toxic": true, "score": 0.9731, "labels": ["toxic", "insult"],
      "scores": { "toxic": 0.9731, "severe_toxic": 0.0412, "obscene": 0.2210,
                  "threat": 0.0031, "insult": 0.8312, "identity_hate": 0.0090 } }
  ]
}`;

const ENDPOINTS = [
  ["POST", "/v1/classify", "Score 1–64 comments. profile: balanced | strict."],
  ["GET", "/v1/model", "Model name, labels, thresholds for both profiles, held-out metrics."],
  ["GET", "/healthz", "Liveness: the process is up."],
  ["GET", "/readyz", "Readiness: the model is loaded and warmed up."],
  ["GET", "/metrics", "Prometheus: request counts, comments scored, cache hits, latency histogram."],
  ["GET", "/docs", "Interactive OpenAPI (Swagger UI)."],
];

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 sm:pt-20">
      <p className="label-mono">REST API · v1</p>
      <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.25rem,1.4rem+3.6vw,4rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-peak">
        One endpoint. Batch in, scores out.
      </h1>
      <p className="measure mt-5 text-lg leading-relaxed text-secondary">
        The FastAPI service runs the int8 ONNX model on CPU. Self-host it with one Docker command, or point the
        extension and your own apps at the hosted instance.
      </p>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <Frame tag="Request" glow className="overflow-hidden p-5 pt-12">
          <pre className="overflow-x-auto font-mono text-[0.8125rem] leading-relaxed text-primary">{REQUEST}</pre>
        </Frame>
        <Frame tag="Response" className="overflow-hidden p-5 pt-12">
          <pre className="overflow-x-auto font-mono text-[0.8125rem] leading-relaxed text-primary">{RESPONSE}</pre>
        </Frame>
      </div>

      <div className="mt-12 overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse">
          <thead>
            <tr className="border-b border-line">
              {["Method", "Path", "Purpose"].map((h) => (
                <th key={h} scope="col" className="label-mono pb-2 pr-6 text-left font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {ENDPOINTS.map(([m, p, d]) => (
              <tr key={p}>
                <td className="py-3 pr-6 font-mono text-sm text-accent">{m}</td>
                <td className="py-3 pr-6 font-mono text-sm text-peak">{p}</td>
                <td className="py-3 text-secondary">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <Frame tag="Self-host" className="p-5 pt-12">
          <pre className="overflow-x-auto font-mono text-[0.8125rem] leading-relaxed text-primary">
            {`docker build -t toxic-api api/\ndocker run -p 8000:8000 toxic-api\nopen http://localhost:8000/docs`}
          </pre>
        </Frame>
        <Frame tag="Limits" className="p-5 pt-12">
          <ul className="flex flex-col gap-2 text-secondary">
            <li>64 texts per request, 5,000 characters per text (longer text is truncated).</li>
            <li>The model reads the first 128 tokens of each comment.</li>
            <li>120 requests / minute / IP by default (TOXIC_RATE_LIMIT_PER_MINUTE).</li>
            <li>Errors: 401 bad key · 413 batch too large · 422 invalid body · 429 rate limited.</li>
          </ul>
        </Frame>
      </div>
    </div>
  );
}
