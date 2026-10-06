# Assessment: v1 → v2

_2026-10-06. Every number here is reproducible with `make data baseline train-kaggle export`._

## Was v1 production-grade?

No. In order of severity:

| # | v1 state | Why it matters | v2 |
|---|---|---|---|
| 1 | **SMOTE ran on the full dataset before `train_test_split`.** | Synthetic interpolations of test rows were in training, and the test set was half synthetic and perfectly balanced. The headline 96.38% accuracy measured the leak. | Split first. Dedupe across splits. No resampling: imbalance is handled with thresholds tuned on validation. |
| 2 | Accuracy was the headline metric at 10% prevalence. | "Never flag anything" scores 90.2% on the real test set. | ROC-AUC, PR-AUC, F1, precision and recall on the toxic class, per label and any-toxic. |
| 3 | No held-out test from the target domain. | The product runs on YouTube, but the model was evaluated on Wikipedia talk pages. | The 1,000-comment YouTube set is held out completely as an out-of-domain test. |
| 4 | TF-IDF(5000) + a 64-unit MLP on dense 5000-d vectors. | Weak with obfuscation and word order, and it ignores context. | Fine-tuned 33M transformer, 6 labels, int8 ONNX. |
| 5 | The repo's web app was an unrelated v0 template (quests, habits, "financial fortress"), with `ignoreBuildErrors: true`. The backend lived in another repo on Render's sleeping free tier. | Nothing in the repo ran the model. | `api/`, `web/`, `extension/` in one repo, all running the same model file. |
| 6 | No tests, CI, Docker, config, monitoring, licence, model versioning or privacy policy. | | All added (see the README). |

### The leak, measured

`ml/toxicity/baseline.py` reproduces the v1 protocol (TF-IDF 5000 → SMOTE on everything → split → Dense(64)/Dropout/sigmoid) and then scores the same architecture correctly:

| Protocol | Accuracy | F1 (toxic) |
|---|---|---|
| v1: SMOTE before split, synthetic balanced test | 94.9% | 0.949 |
| Same model, SMOTE on train only, **real** Jigsaw test | 84.4% | **0.533** |
| Predict "clean" for everything | 90.2% | 0.000 |

## v2 results (held out, int8 model as shipped)

Thresholds tuned on validation only.

| Any-toxic | Jigsaw test ROC-AUC | PR-AUC | F1 | YouTube ROC-AUC | YouTube F1 |
|---|---|---|---|---|---|
| TF-IDF (word + char n-grams) + LogReg | 0.966 | 0.789 | 0.669 | 0.807 | 0.680 |
| **MiniLM-L12, balanced** | **0.971** | **0.801** | **0.687** | **0.863** | **0.733** |
| MiniLM-L12, child-safe | 0.971 | 0.801 | 0.634 (recall 0.945) | 0.863 | 0.766 |

**Honest reading:**
- **On Jigsaw itself, the transformer barely beats a strong TF-IDF baseline:** mean 6-label ROC-AUC 0.9797 vs 0.9795. Character n-gram logistic regression is famously strong on this dataset, and test-label noise caps everyone.
- **On YouTube, which is where the product runs, it is clearly better:** +5.6 ROC-AUC points and +5.3 F1 points. Generalising to a new platform is what the pretrained transformer buys.
- **Quantisation is free here.** On 8k test comments, int8 per-channel scores a mean ROC-AUC of 0.9808 vs 0.9807 for fp32. It is 4× smaller (34 MB) and 2.2× faster (6.5 ms per comment on an M2 Pro CPU).
- **The exported ONNX graph matches PyTorch exactly** (max |Δ| < 1e-5 on mixed-length padded batches). This check gates every export.
- **The extension's on-device scores match the API** to within 0.0008.
- **On a live YouTube page** ("Me at the zoo", 140 comments, child-safe mode) it flagged 2 comments. One was a fair call ("Holy shit…") and one was a false positive ("crazy algorithm today").
- **Known misses:** implicit threats and dehumanising language without slurs, e.g. "I know where you film these. watch your back." The threat label is the weakest (F1 0.26).

## Should we add a transformer? Yes, but know what it buys

- **What it buys:** robustness on new platforms (YouTube +5.6 AUC), better recall at the same precision, and a model small enough to run inside the browser.
- **What it doesn't buy:** a big jump on Jigsaw-style text, context ("watch your back"), multilingual coverage, or fairness.

Those need the next steps below, not a bigger model alone. A larger backbone (DeBERTa-v3-base, ~0.986 Jigsaw AUC in the literature) is a reasonable *API-side* upgrade later. The extension should stay small.

## The perfect final state

1. **Feedback loop (most important).** "Wrong call?" in the extension → opt-in report → human review queue → monthly retrain → release gate (no regression on test PR-AUC or on YouTube).
2. **Fairness gate.** Evaluate on the Jigsaw Unintended Bias set (subgroup AUC, BPSN, BNSP) and block releases that over-flag identity mentions. For a child-safety product this matters as much as accuracy.
3. **Domain data.** Label 5–10k real YouTube and kids'-platform comments, including implicit threats and code-mixed Hinglish/Telugu. That's where the remaining errors are.
4. **Multilingual student.** Distil an XLM-R teacher into a small multilingual student that still fits on-device.
5. **Context-aware scoring.** Feed the parent comment and the video category, so "I'll kill it at the recital" stops being a threat and "watch your back" starts being one.
6. **Distribution.** Chrome Web Store → Firefox/Edge → Safari. Add a parent dashboard (weekly digest, per-child levels) and a creator-side API for pre-moderation queues.
7. **Ops.** Drift alert on the share of comments flagged, shadow-deploying new models against the old one, a model registry (HF Hub), and signed release artefacts.
