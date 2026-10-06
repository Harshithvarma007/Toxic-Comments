"""Two baselines, to put a number on what the original notebook got wrong.

1. "leaky": the original protocol — TF-IDF(5000) on the binary any-toxic label, SMOTE over the
   whole dataset, *then* train/test split, small MLP. Accuracy is measured on a test set that is
   50% synthetic and shares neighbours with training.
2. "honest": TF-IDF (word + char n-grams) + one-vs-rest logistic regression, trained on the train
   split only, thresholds tuned on val, scored on the untouched Jigsaw test set and on YouTube.

Usage: python -m toxicity.baseline
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import numpy as np
import torch
from imblearn.over_sampling import SMOTE
from scipy.sparse import hstack
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score
from sklearn.model_selection import train_test_split

from . import LABELS
from .data import load_split
from .metrics import evaluate, tune_thresholds

ROOT = Path(os.environ.get("TOXIC_ML_HOME", Path(__file__).resolve().parent.parent))


def _mlp_fit_predict(x_train, y_train, x_test, epochs=5):
    """Same shape as the notebook's Keras model: Dense(64, relu) -> Dropout(.5) -> sigmoid."""
    torch.manual_seed(42)
    net = torch.nn.Sequential(
        torch.nn.Linear(x_train.shape[1], 64), torch.nn.ReLU(), torch.nn.Dropout(0.5), torch.nn.Linear(64, 1)
    )
    opt = torch.optim.Adam(net.parameters(), lr=1e-3)
    dense = lambda x: torch.tensor(x.toarray(), dtype=torch.float32)  # noqa: E731  (densify per batch)
    yt = torch.tensor(np.asarray(y_train), dtype=torch.float32)
    for _ in range(epochs):
        perm = torch.randperm(x_train.shape[0]).numpy()
        for i in range(0, len(perm), 256):
            idx = perm[i : i + 256]
            loss = torch.nn.functional.binary_cross_entropy_with_logits(net(dense(x_train[idx])).squeeze(1), yt[idx])
            opt.zero_grad()
            loss.backward()
            opt.step()
    net.eval()
    with torch.no_grad():
        out = [torch.sigmoid(net(dense(x_test[i : i + 4096])).squeeze(1)) for i in range(0, x_test.shape[0], 4096)]
        return torch.cat(out).numpy()


def leaky_vs_honest_protocol(train, test) -> dict:
    vect = TfidfVectorizer(max_features=5000, stop_words="english")
    x_all = vect.fit_transform(train["text"].str.lower())
    y_all = train[LABELS].any(axis=1).astype(int).to_numpy()

    # Original: SMOTE on everything, then split.
    xr, yr = SMOTE(random_state=42).fit_resample(x_all, y_all)
    x_tr, x_te, y_tr, y_te = train_test_split(xr, yr, test_size=0.2, random_state=42)
    p = _mlp_fit_predict(x_tr, y_tr, x_te)
    leaky = {"accuracy": float(((p > 0.5) == y_te).mean()), "f1": float(f1_score(y_te, p > 0.5))}

    # Same model, SMOTE on train only, scored on the real (imbalanced, untouched) test set.
    xs, ys = SMOTE(random_state=42).fit_resample(x_all, y_all)
    x_test = vect.transform(test["text"].str.lower())
    y_test = test[LABELS].any(axis=1).astype(int).to_numpy()
    p = _mlp_fit_predict(xs, ys, x_test)
    honest = {"accuracy": float(((p > 0.5) == y_test).mean()), "f1": float(f1_score(y_test, p > 0.5))}
    majority = float(1 - y_test.mean())
    return {"leaky_protocol": leaky, "same_model_honest_split": honest, "always_predict_clean_accuracy": majority}


def tfidf_logreg(train, val, test, youtube) -> dict:
    word = TfidfVectorizer(ngram_range=(1, 2), min_df=3, max_features=200_000, sublinear_tf=True, strip_accents="unicode")
    char = TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), min_df=3, max_features=200_000, sublinear_tf=True)
    word.fit(train["text"])
    char.fit(train["text"])
    feats = lambda df: hstack([word.transform(df["text"]), char.transform(df["text"])]).tocsr()  # noqa: E731
    x_train, x_val, x_test, x_yt = feats(train), feats(val), feats(test), feats(youtube)

    def probs(x):
        return np.stack([m.predict_proba(x)[:, 1] for m in models], axis=1)

    models = []
    for label in LABELS:
        m = LogisticRegression(C=4.0, max_iter=1000, solver="liblinear")
        m.fit(x_train, train[label])
        models.append(m)

    thresholds = tune_thresholds(val[LABELS].to_numpy(), probs(x_val))
    return {
        "thresholds": thresholds,
        "test": evaluate(test[LABELS].to_numpy(), probs(x_test), thresholds),
        "youtube": evaluate(
            youtube[LABELS].to_numpy(), probs(x_yt), thresholds, labels=[lbl for lbl in LABELS if lbl != "severe_toxic"]
        ),
    }


def main():
    train, val, test, youtube = (load_split(s) for s in ("train", "val", "test", "youtube"))
    results = {"protocol": leaky_vs_honest_protocol(train, test)}
    print(json.dumps(results["protocol"], indent=2))
    results["tfidf_logreg"] = tfidf_logreg(train, val, test, youtube)
    print(json.dumps({k: v["summary"] for k, v in results["tfidf_logreg"].items() if k != "thresholds"}, indent=2))
    out = ROOT / "artifacts" / "baseline_metrics.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(results, indent=2))
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
