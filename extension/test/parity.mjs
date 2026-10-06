// Checks that transformers.js (what the extension runs) produces the same scores as the
// Python API for the same model files. Run: node test/parity.mjs [api-url]
import { AutoModelForSequenceClassification, AutoTokenizer, env } from "@huggingface/transformers";

env.allowRemoteModels = false;
env.localModelPath = new URL("../dist/models/", import.meta.url).pathname;
const texts = ["Thanks for the tutorial, really clear explanation!", "you are a worthless idiot, shut up", "I will find you and hurt you"];

const tok = await AutoTokenizer.from_pretrained("toxic");
const model = await AutoModelForSequenceClassification.from_pretrained("toxic", { dtype: "q8" });
const { logits } = await model(tok(texts, { padding: true, truncation: true, max_length: 128 }));
const [n, k] = logits.dims;
const js = [...Array(n)].map((_, r) => [...Array(k)].map((_, c) => 1 / (1 + Math.exp(-logits.data[r * k + c]))));

const api = process.argv[2];
let maxDiff = 0;
if (api) {
  const res = await fetch(`${api}/v1/classify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texts }) });
  const py = (await res.json()).results.map((r) => Object.values(r.scores));
  js.forEach((row, i) => row.forEach((p, j) => (maxDiff = Math.max(maxDiff, Math.abs(p - py[i][j])))));
}
texts.forEach((t, i) => console.log(js[i].map((p) => p.toFixed(3)).join(" "), "|", t));
if (api) {
  console.log(`max |js - python| = ${maxDiff.toFixed(4)}`);
  if (maxDiff > 0.01) process.exit(1);
}
