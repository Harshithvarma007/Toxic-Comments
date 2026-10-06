"""Export the fine-tuned model to ONNX, quantise to int8, check parity, write the model card data.

Output layout (the transformers.js convention, so the browser extension and the API load the
same files):

    artifacts/onnx/
      config.json  tokenizer.json  tokenizer_config.json  special_tokens_map.json  vocab.txt
      thresholds.json  metrics.json
      onnx/model.onnx            fp32
      onnx/model_quantized.onnx  int8 (dynamic quantisation) — what we ship

Usage: python -m toxicity.export [--model-dir artifacts/model]
"""

from __future__ import annotations

import argparse
import json
import os
import time
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch
from onnxruntime.quantization import QuantType, quantize_dynamic
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from . import LABELS
from .data import load_split
from .metrics import evaluate, recall_thresholds, tune_thresholds

ROOT = Path(os.environ.get("TOXIC_ML_HOME", Path(__file__).resolve().parent.parent))


def onnx_probs(session: ort.InferenceSession, tokenizer, texts: list[str], max_len: int, batch=128) -> np.ndarray:
    names = {i.name for i in session.get_inputs()}
    out = []
    for i in range(0, len(texts), batch):
        enc = tokenizer(texts[i : i + batch], truncation=True, max_length=max_len, padding=True, return_tensors="np")
        feed = {k: v.astype(np.int64) for k, v in enc.items() if k in names}
        logits = session.run(None, feed)[0]
        out.append(1 / (1 + np.exp(-logits)))
    return np.concatenate(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model-dir", default=str(ROOT / "artifacts" / "model"))
    ap.add_argument("--out", default=str(ROOT / "artifacts" / "onnx"))
    ap.add_argument("--max-len", type=int, default=128)
    ap.add_argument("--eval-limit", type=int, default=0, help="debug: evaluate on the first N rows of each split")
    args = ap.parse_args()

    src, out = Path(args.model_dir), Path(args.out)
    (out / "onnx").mkdir(parents=True, exist_ok=True)
    tokenizer = AutoTokenizer.from_pretrained(src)
    model = AutoModelForSequenceClassification.from_pretrained(src, attn_implementation="eager").eval()

    sample = tokenizer(["you are great", "a second, longer example sentence"], padding=True, return_tensors="pt")
    input_names = [k for k in ("input_ids", "attention_mask", "token_type_ids") if k in sample]
    fp32 = out / "onnx" / "model.onnx"
    torch.onnx.export(
        model,
        tuple(sample[k] for k in input_names),
        fp32,
        input_names=input_names,
        output_names=["logits"],
        dynamic_axes={**{k: {0: "batch", 1: "seq"} for k in input_names}, "logits": {0: "batch"}},
        opset_version=17,
        dynamo=False,
    )
    int8 = out / "onnx" / "model_quantized.onnx"
    quantize_dynamic(fp32, int8, weight_type=QuantType.QInt8, per_channel=True)

    tokenizer.save_pretrained(out)
    model.config.save_pretrained(out)
    sess32 = ort.InferenceSession(str(fp32), providers=["CPUExecutionProvider"])
    sess8 = ort.InferenceSession(str(int8), providers=["CPUExecutionProvider"])

    # The legacy tracer can freeze shape-dependent mask logic. Check the fp32 graph against
    # PyTorch on batches whose lengths and padding differ from the trace sample.
    probe = load_split("val")["text"].sample(256, random_state=0).tolist()
    with torch.no_grad():
        enc = tokenizer(probe, truncation=True, max_length=args.max_len, padding=True, return_tensors="pt")
        p_torch = torch.sigmoid(model(**enc).logits).numpy()
    torch_onnx_diff = float(np.abs(p_torch - onnx_probs(sess32, tokenizer, probe, args.max_len, batch=37)).max())
    print(f"max |p_onnx_fp32 - p_torch| on mixed-length padded batches = {torch_onnx_diff:.5f}")
    if torch_onnx_diff > 1e-3:
        raise SystemExit("ONNX graph disagrees with PyTorch: export is broken, refusing to ship it")

    # Two operating points, both tuned on val with the int8 model we actually ship:
    #   balanced — max F1 per label (general moderation)
    #   strict   — highest threshold that still catches >= 90% of each label (child-safe mode)
    lim = lambda df: df.head(args.eval_limit) if args.eval_limit else df  # noqa: E731
    val = lim(load_split("val"))
    y_val = val[LABELS].to_numpy()
    p_val = onnx_probs(sess8, tokenizer, val["text"].tolist(), args.max_len)
    balanced = tune_thresholds(y_val, p_val)
    # Child-safe must never be less strict than balanced, so take the lower threshold per label.
    strict = {k: min(v, balanced[k]) for k, v in recall_thresholds(y_val, p_val, 0.9).items()}
    thresholds = {"balanced": balanced, "strict": strict}
    (out / "thresholds.json").write_text(json.dumps(thresholds, indent=2))

    report = {"model": model.config._name_or_path, "max_len": args.max_len, "labels": LABELS, "thresholds": thresholds}
    head = val["text"].head(2000).tolist()
    p32, p8 = onnx_probs(sess32, tokenizer, head, args.max_len), p_val[:2000]
    report["onnx_fp32_vs_torch_max_abs_diff"] = torch_onnx_diff
    report["int8_vs_fp32_max_abs_diff"] = float(np.abs(p32 - p8).max())
    report["int8_vs_fp32_mean_abs_diff"] = float(np.abs(p32 - p8).mean())

    for split, labels in (("test", None), ("youtube", [lbl for lbl in LABELS if lbl != "severe_toxic"])):
        df = lim(load_split(split))
        t0 = time.time()
        probs = onnx_probs(sess8, tokenizer, df["text"].tolist(), args.max_len)
        report[f"{split}_ms_per_comment"] = (time.time() - t0) * 1000 / len(df)
        report[split] = {
            profile: evaluate(df[LABELS].to_numpy(), probs, t, labels=labels) for profile, t in thresholds.items()
        }
        print(split, json.dumps({k: v["summary"] for k, v in report[split].items()}, indent=2))

    report["size_mb"] = {"fp32": fp32.stat().st_size / 1e6, "int8": int8.stat().st_size / 1e6}
    (out / "metrics.json").write_text(json.dumps(report, indent=2))
    print(f"int8 {report['size_mb']['int8']:.1f} MB, max |p_int8 - p_fp32| = {report['int8_vs_fp32_max_abs_diff']:.4f}")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
