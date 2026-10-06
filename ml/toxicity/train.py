"""Fine-tune a small transformer for 6-label toxicity classification.

Defaults are chosen so the model is small enough to ship inside a browser extension
(all-MiniLM-L12-v2: 33M parameters, ~33 MB after int8 quantisation) while still beating the
TF-IDF baseline by a wide margin.

Usage: python -m toxicity.train [--model sentence-transformers/all-MiniLM-L12-v2] [--epochs 3]
"""

from __future__ import annotations

import argparse
import json
import math
import os
import time
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import DataLoader, Dataset
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    get_linear_schedule_with_warmup,
)

from . import LABELS
from .data import load_split
from .metrics import evaluate, tune_thresholds

ROOT = Path(os.environ.get("TOXIC_ML_HOME", Path(__file__).resolve().parent.parent))


class Comments(Dataset):
    def __init__(self, df, tokenizer, max_len):
        self.texts = df["text"].tolist()
        self.labels = df[LABELS].to_numpy(dtype=np.float32)
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, i):
        return self.texts[i], self.labels[i]

    def collate(self, batch):
        texts, labels = zip(*batch, strict=True)
        enc = self.tokenizer(list(texts), truncation=True, max_length=self.max_len, padding=True, return_tensors="pt")
        enc["labels"] = torch.tensor(np.stack(labels))
        return enc


@torch.no_grad()
def predict(model, loader, device) -> tuple[np.ndarray, np.ndarray]:
    model.eval()
    probs, labels = [], []
    for batch in loader:
        y = batch.pop("labels")
        batch = {k: v.to(device) for k, v in batch.items()}
        logits = model(**batch).logits
        probs.append(torch.sigmoid(logits).float().cpu().numpy())
        labels.append(y.numpy())
    model.train()
    return np.concatenate(labels), np.concatenate(probs)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="sentence-transformers/all-MiniLM-L12-v2")
    ap.add_argument("--epochs", type=float, default=2)
    ap.add_argument("--batch-size", type=int, default=32)
    ap.add_argument("--lr", type=float, default=1e-4)
    ap.add_argument("--max-len", type=int, default=128)
    ap.add_argument("--eval-every", type=int, default=1500)
    ap.add_argument("--limit", type=int, default=0, help="debug: train on the first N rows")
    ap.add_argument("--out", default=str(ROOT / "artifacts" / "model"))
    args = ap.parse_args()

    torch.manual_seed(42)
    device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    tokenizer = AutoTokenizer.from_pretrained(args.model)
    model = AutoModelForSequenceClassification.from_pretrained(
        args.model,
        num_labels=len(LABELS),
        problem_type="multi_label_classification",
        id2label=dict(enumerate(LABELS)),
        label2id={lbl: i for i, lbl in enumerate(LABELS)},
    ).to(device)

    train_df, val_df = load_split("train"), load_split("val")
    if args.limit:
        train_df, val_df = train_df.head(args.limit), val_df.head(max(args.limit // 5, 500))
    train_ds, val_ds = Comments(train_df, tokenizer, args.max_len), Comments(val_df, tokenizer, args.max_len)
    train_dl = DataLoader(
        train_ds, batch_size=args.batch_size, shuffle=True, collate_fn=train_ds.collate, num_workers=2 if device == "cuda" else 0
    )
    val_dl = DataLoader(val_ds, batch_size=128, collate_fn=val_ds.collate)

    total_steps = math.ceil(len(train_dl) * args.epochs)
    optim = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=0.01)
    scaler = torch.amp.GradScaler("cuda", enabled=device == "cuda")
    sched = get_linear_schedule_with_warmup(optim, int(0.06 * total_steps), total_steps)

    print(f"device={device} model={args.model} train={len(train_ds)} val={len(val_ds)} steps={total_steps}")
    best_auc, step, t0, history = -1.0, 0, time.time(), []
    model.train()
    while step < total_steps:
        for batch in train_dl:
            batch = {k: v.to(device) for k, v in batch.items()}
            with torch.autocast("cuda", dtype=torch.float16, enabled=device == "cuda"):
                loss = model(**batch).loss
            scaler.scale(loss).backward()
            scaler.unscale_(optim)
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            scaler.step(optim)
            scaler.update()
            sched.step()
            optim.zero_grad(set_to_none=True)
            step += 1

            if step % 100 == 0:
                rate = step / (time.time() - t0)
                eta = (total_steps - step) / rate / 60
                print(f"step {step}/{total_steps} loss {loss.item():.4f} {rate:.1f} it/s eta {eta:.0f}m", flush=True)

            if step % args.eval_every == 0 or step == total_steps:
                y, p = predict(model, val_dl, device)
                thresholds = tune_thresholds(y, p)
                m = evaluate(y, p, thresholds)
                auc = m["summary"]["mean_roc_auc"]
                history.append({"step": step, "val_mean_roc_auc": auc, "val_any_f1": m["summary"]["any_toxic"]["f1"]})
                print(f"[eval] step {step} val mean ROC-AUC {auc:.4f} any-toxic F1 {m['summary']['any_toxic']['f1']:.4f}", flush=True)
                if auc > best_auc:
                    best_auc = auc
                    model.save_pretrained(out)
                    tokenizer.save_pretrained(out)
                    (out / "thresholds.json").write_text(json.dumps(thresholds, indent=2))
                    print(f"[save] new best -> {out}", flush=True)
            if step >= total_steps:
                break

    (out / "train_history.json").write_text(
        json.dumps({"args": vars(args), "history": history, "minutes": (time.time() - t0) / 60}, indent=2)
    )
    print(f"done. best val mean ROC-AUC {best_auc:.4f}")


if __name__ == "__main__":
    main()
