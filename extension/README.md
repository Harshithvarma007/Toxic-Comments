# Toxic Comment Filter: Chrome extension (MV3)

Blurs or hides toxic YouTube comments. The model (int8 ONNX, ~34 MB) runs **on-device** through
transformers.js / ONNX Runtime Web in an offscreen document. Everything ships inside the
extension, so it makes no network calls in the default mode.

```
content.js   ── finds comments (MutationObserver), batches text ──┐
background.js ── routes: on-device (offscreen) | cloud API ◄──────┘ ── badge count per tab
offscreen.js  ── AutoTokenizer + AutoModelForSequenceClassification (q8, WASM)
popup.*       ── Off / Blur / Hide · Balanced / Child-safe · On-device / Cloud
```

## Build and load

```bash
../scripts/fetch_model.sh   # or: python ../scripts/sync_artifacts.py after training
pnpm install && pnpm build  # -> dist/
```

Open `chrome://extensions`, turn on Developer mode, click **Load unpacked**, and pick `dist/`. `pnpm zip` produces the Web Store upload.

## Test

`node test/parity.mjs http://127.0.0.1:8000` checks that the on-device scores match the Python API for the same model files. Max |Δ| must be under 0.01.

## Notes

- The YouTube selectors live at the top of `src/content.js` (`TEXT_SELECTOR`, `CONTAINER_SELECTOR`). YouTube changes its DOM every so often, so this is the first place to look if filtering stops.
- Single-threaded WASM, because extension pages aren't cross-origin isolated. Expect roughly 15–40 ms per comment on a laptop, batched 16 at a time.
- Privacy policy: [`docs/PRIVACY.md`](../docs/PRIVACY.md).
