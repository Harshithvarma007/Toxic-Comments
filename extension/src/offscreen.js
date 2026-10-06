// Runs the model on-device. Lives in an offscreen document because MV3 service workers are
// short-lived and cannot hold a WASM session reliably. Everything (model, tokenizer, WASM)
// ships inside the extension — no network access is needed or allowed.
import { AutoModelForSequenceClassification, AutoTokenizer, env } from "@huggingface/transformers";

env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = chrome.runtime.getURL("models/");
env.useWasmCache = false;
env.backends.onnx.wasm.wasmPaths = {
  mjs: chrome.runtime.getURL("wasm/ort-wasm-simd-threaded.asyncify.mjs"),
  wasm: chrome.runtime.getURL("wasm/ort-wasm-simd-threaded.asyncify.wasm"),
};
env.backends.onnx.wasm.numThreads = 1; // extension pages are not cross-origin isolated

const MAX_LEN = 128;
let loading = null;

function load() {
  loading ??= (async () => {
    const t0 = performance.now();
    const [tokenizer, model, thresholds] = await Promise.all([
      AutoTokenizer.from_pretrained("toxic"),
      AutoModelForSequenceClassification.from_pretrained("toxic", { dtype: "q8", device: "wasm" }),
      fetch(chrome.runtime.getURL("models/toxic/thresholds.json")).then((r) => r.json()),
    ]);
    const labels = Object.keys(model.config.id2label)
      .sort((a, b) => a - b)
      .map((k) => model.config.id2label[k]);
    console.info(`[toxic-filter] model ready in ${Math.round(performance.now() - t0)} ms`);
    return { tokenizer, model, thresholds, labels };
  })();
  return loading;
}

const normalise = (t) => t.replace(/\s+/g, " ").trim();

async function classify(texts, profile) {
  const { tokenizer, model, thresholds, labels } = await load();
  const th = thresholds[profile] ?? thresholds.balanced;
  const results = [];
  for (let i = 0; i < texts.length; i += 16) {
    const batch = texts.slice(i, i + 16).map(normalise);
    const inputs = tokenizer(batch, { padding: true, truncation: true, max_length: MAX_LEN });
    const { logits } = await model(inputs);
    const [n, k] = logits.dims;
    const data = logits.data;
    for (let r = 0; r < n; r++) {
      const scores = {};
      const flagged = [];
      let max = 0;
      for (let c = 0; c < k; c++) {
        const p = 1 / (1 + Math.exp(-data[r * k + c]));
        scores[labels[c]] = p;
        max = Math.max(max, p);
        if (p >= th[labels[c]]) flagged.push(labels[c]);
      }
      results.push({ toxic: flagged.length > 0, score: max, labels: flagged, scores });
    }
  }
  return results;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.target !== "offscreen") return;
  if (msg.type === "classify") {
    classify(msg.texts, msg.profile)
      .then((results) => sendResponse({ results }))
      .catch((e) => sendResponse({ error: String(e?.message ?? e) }));
    return true;
  }
  if (msg.type === "warmup") {
    load()
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ error: String(e?.message ?? e) }));
    return true;
  }
});
