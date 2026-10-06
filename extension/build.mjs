// Bundles the extension into dist/: JS via esbuild, plus the model and ONNX Runtime WASM files
// copied in so the extension needs no network access at runtime (MV3 forbids remote code).
import { build } from "esbuild";
import { cpSync, mkdirSync, rmSync, readdirSync, existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const out = "dist";
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

await build({
  entryPoints: ["src/background.js", "src/offscreen.js", "src/popup.js"],
  bundle: true,
  format: "esm",
  target: "chrome120",
  outdir: out,
  minify: true,
  logLevel: "info",
});
await build({ entryPoints: ["src/content.js"], bundle: true, format: "iife", target: "chrome120", outdir: out, minify: true, logLevel: "info" });

for (const f of ["manifest.json", "popup.html", "popup.css", "offscreen.html", "content.css"]) cpSync(join("src", f), join(out, f));
cpSync("icons", join(out, "icons"), { recursive: true });

// ONNX Runtime Web WASM (the asyncify build transformers.js uses on CPU).
const req = createRequire(import.meta.url);
const tjs = dirname(req.resolve("@huggingface/transformers"));
const ortDist = join(tjs, "..", "..", "..", "onnxruntime-web", "dist");
mkdirSync(join(out, "wasm"));
for (const f of readdirSync(ortDist).filter((f) => f.startsWith("ort-wasm-simd-threaded.asyncify"))) cpSync(join(ortDist, f), join(out, "wasm", f));

// Model: transformers.js expects models/<name>/{config.json,tokenizer.json,onnx/model_quantized.onnx}
if (!existsSync("model/onnx/model_quantized.onnx")) throw new Error("extension/model missing — run scripts/sync_artifacts.py");
cpSync("model", join(out, "models", "toxic"), { recursive: true });

const v = JSON.parse(readFileSync("src/manifest.json", "utf8")).version;
console.log(`built extension v${v} -> ${out}/`);
