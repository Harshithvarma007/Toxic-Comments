# Toxic Comment Detection

**Filter the worst of the comment section before a child reads it.**

A 33M-parameter transformer (all-MiniLM-L12-v2, fine-tuned, int8 ONNX, ~34 MB) that scores comments for six kinds of toxicity. The same model file ships in three ways:

| | |
|---|---|
| 🧩 **Chrome extension** ([`extension/`](extension)) | Blurs or hides toxic YouTube comments. Runs **on-device** (ONNX Runtime Web), and has a child-safe mode. |
| ⚡ **API** ([`api/`](api)) | FastAPI + ONNX Runtime on CPU. `POST /v1/classify`, health/ready probes, Prometheus metrics, rate limits, Docker. |
| 🌐 **Website** ([`web/`](web)) | Live classifier, a simulated YouTube comment section you can filter, model card, API docs. Next.js on Vercel. |

Plus the training pipeline ([`ml/`](ml)) and a launch video ([`video/`](video), Remotion).

<!-- RESULTS:START -->
### Results (held out, int8 model as shipped)

| Any-toxic | Jigsaw test PR-AUC | Jigsaw test F1 | **YouTube ROC-AUC** (unseen platform) | **YouTube F1** |
|---|---|---|---|---|
| TF-IDF + LogReg baseline | 0.789 | 0.669 | 0.807 | 0.680 |
| **MiniLM-L12, balanced** | **0.801** | **0.687** | **0.863** | **0.733** |
| MiniLM-L12, child-safe | 0.801 | 0.634 (recall 0.945) | 0.863 | 0.766 |

34 MB int8 ONNX · 6.5 ms/comment on CPU · ONNX matches PyTorch to 1e-6 · extension matches the API to 1e-3.
The transformer's gain is mostly **out-of-domain**: on Jigsaw it roughly ties a strong char-n-gram baseline. The full, honest breakdown is in [docs/ASSESSMENT.md](docs/ASSESSMENT.md).

🎬 Launch video: `video/` (Remotion, 1:53). Render with `make video`; the mp4 is meant to be attached to the GitHub release.
<!-- RESULTS:END -->

## Why v2

v1 reported **96.38% accuracy**. It ran SMOTE over the whole dataset *before* the train/test split, so synthetic neighbours of test rows were in training and the test set was half synthetic and 50/50 balanced. Re-running that protocol gives 94.9% accuracy. The same model scored on the real, untouched test set gets **0.53 F1** and **84.4% accuracy**, which is *below* the 90.2% you get by never flagging anything. The full write-up is in [docs/ASSESSMENT.md](docs/ASSESSMENT.md).

v2 fixes the methodology:
- Split first. Dedupe across splits.
- No resampling. Imbalance is handled with thresholds tuned on validation.
- Report ROC-AUC / PR-AUC / F1, not accuracy alone.
- Hold out a second platform (YouTube) as an unseen-domain test, because that's where the extension runs.

## Architecture

```
 Kaggle T4 GPU                          GitHub Release (model-vX)
 ┌───────────────────────────┐          ┌──────────────────────┐
 │ data → train → calibrate  │ ──────►  │ model_quantized.onnx │
 │ → export (ONNX int8)      │          │ tokenizer · thresholds│
 └───────────────────────────┘          │ metrics.json          │
                                        └─────┬───────────┬─────┘
                                              │           │
                       ┌──────────────────────▼─┐   ┌─────▼──────────────────┐
  browser ─► Vercel ─► │ FastAPI (Cloud Run)     │   │ Chrome extension (MV3) │
  (web)  /api/classify │ onnxruntime + tokenizers│   │ transformers.js, WASM  │
                       └─────────────────────────┘   │ on-device, offline     │
                                                     └────────────────────────┘
```

Two operating points, both tuned on validation and shipped in `thresholds.json`:
- **balanced**: max F1 per label, for general moderation.
- **strict / child-safe**: catches at least 90% of each label on validation (never less strict than balanced). It hides more borderline comments, which is the right trade-off on a child's screen.

## Quick start

```bash
make setup               # venvs + JS deps
make model               # download the released model (or train it, below)
make api                 # http://localhost:8000/docs
make web                 # http://localhost:3000
make extension           # then load extension/dist in chrome://extensions
```

Train it yourself (needs `~/.kaggle/kaggle.json`):

```bash
make data                # Jigsaw + YouTube, leak-free splits
make baseline            # TF-IDF baseline + v1 leak reproduction
make train-kaggle        # pushes a T4 GPU kernel, waits, downloads the model
make export sync test    # ONNX int8 + evaluation → api/, extension/, web/ metrics
```

## Repository

```
ml/          data.py · baseline.py · train.py · export.py · metrics.py · kaggle/ (GPU kernel builder) · tests/
api/         FastAPI service, Dockerfile, tests
web/         Next.js 16 site (NOUS design system: crosshair frame + travelling perimeter glow)
extension/   Chrome MV3 extension, esbuild, parity + live-YouTube e2e tests
video/       Remotion launch video, built on the NOUS Video OS components
scripts/     sync_artifacts.py · fetch_model.sh · package_model.sh
docs/        ASSESSMENT · DEPLOYMENT · PRIVACY
.github/     CI (lint, tests, builds, Docker smoke test) · release · Cloud Run deploy
```

## Deployment

Web goes to Vercel. The API is a Docker container on Cloud Run (scale to zero). The model is a GitHub Release asset. The extension goes to the Chrome Web Store. Step-by-step instructions are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Limitations

English only, no conversational context, partial robustness to obfuscation, and not yet audited for identity-term bias. Jigsaw-trained models are known to over-flag comments that merely *mention* identity groups. See the [model card](https://toxic.harshithvarma.in/model) and the roadmap on the home page.

Background reading: [End-to-End Machine Learning Project, Part I](https://medium.com/@harshith007varma007/end-to-end-machine-learning-project-part-i-c29c2b982055) (v1).

## License

Code: [MIT](LICENSE). Training data: Jigsaw Toxic Comment Classification (CC0 text / CC-BY-SA Wikipedia comments) and the YouTube Toxicity dataset; check their terms before redistributing data or derived datasets.
