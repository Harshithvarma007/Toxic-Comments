"""Copy the exported model into the places that serve it, and publish its metrics to the site.

    python scripts/sync_artifacts.py [--onnx ml/artifacts/onnx]

- api/model/            int8 ONNX + tokenizer + thresholds + metrics   (baked into the Docker image)
- extension/model/      same files, loaded on-device by transformers.js
- web/content/metrics.json   curated numbers the website renders (never hand-typed)
"""

import argparse
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SHIP = ["config.json", "tokenizer.json", "tokenizer_config.json", "thresholds.json", "metrics.json", "onnx/model_quantized.onnx"]


def pick(m: dict) -> dict:
    s = m["summary"]
    a = s["any_toxic"]
    return {
        "mean_roc_auc": s["mean_roc_auc"],
        "roc_auc": a["roc_auc"],
        "pr_auc": a["pr_auc"],
        "f1": a["f1"],
        "precision": a["precision"],
        "recall": a["recall"],
        "accuracy": a["accuracy"],
        "n": a["n"],
        "positives": a["support"],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--onnx", default=str(ROOT / "ml" / "artifacts" / "onnx"))
    args = ap.parse_args()
    src = Path(args.onnx)

    m = json.loads((src / "metrics.json").read_text())
    hist_path = src.parent / "model" / "train_history.json"
    hist = json.loads(hist_path.read_text()) if hist_path.exists() else None
    base_model = hist["args"]["model"] if hist else "sentence-transformers/all-MiniLM-L12-v2"
    m["model"] = f"toxic-{base_model.split('/')[-1]}"
    m["base_model"] = base_model

    for dest in (ROOT / "api" / "model", ROOT / "extension" / "model"):
        shutil.rmtree(dest, ignore_errors=True)
        for f in SHIP:
            (dest / f).parent.mkdir(parents=True, exist_ok=True)
            shutil.copy(src / f, dest / f)
        (dest / "metrics.json").write_text(json.dumps(m, indent=2))
        print(f"copied model -> {dest.relative_to(ROOT)}")
    out = {
        "model": m["model"],
        "base_model": m["base_model"],
        "params_m": 33,
        "size_mb": round(m["size_mb"]["int8"], 1),
        "ms_per_comment_cpu": round(m["test_ms_per_comment"], 2),
        "int8_vs_fp32_mean_abs_diff": m["int8_vs_fp32_mean_abs_diff"],
        "thresholds": m["thresholds"],
        "transformer": {
            split: {profile: pick(v) for profile, v in m[split].items()} for split in ("test", "youtube")
        },
        "per_label": {
            label: v for label, v in m["test"]["balanced"]["per_label"].items()
        },
    }
    if hist:
        out["training"] = hist

    base_path = ROOT / "ml" / "artifacts" / "baseline_metrics.json"
    if base_path.exists():
        b = json.loads(base_path.read_text())
        out["baseline"] = {"test": pick(b["tfidf_logreg"]["test"]), "youtube": pick(b["tfidf_logreg"]["youtube"])}
        out["leak"] = b["protocol"]

    dest = ROOT / "web" / "content" / "metrics.json"
    dest.write_text(json.dumps(out, indent=2))
    print(f"wrote {dest.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
