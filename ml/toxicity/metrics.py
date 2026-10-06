"""Metrics shared by the baseline and the transformer, so the comparison is like for like."""

from __future__ import annotations

import numpy as np
from sklearn.metrics import (
    average_precision_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

from . import LABELS


def tune_thresholds(y_true: np.ndarray, probs: np.ndarray) -> dict[str, float]:
    """Per-label threshold that maximises F1 on the validation split."""
    grid = np.linspace(0.05, 0.95, 91)
    out = {}
    for i, label in enumerate(LABELS):
        scores = [f1_score(y_true[:, i], probs[:, i] >= t, zero_division=0) for t in grid]
        out[label] = float(grid[int(np.argmax(scores))])
    return out


def recall_thresholds(y_true: np.ndarray, probs: np.ndarray, target: float) -> dict[str, float]:
    """Per-label: the highest threshold whose recall on val is still >= target."""
    out = {}
    for i, label in enumerate(LABELS):
        pos = np.sort(probs[y_true[:, i] == 1, i])
        k = int(np.floor((1 - target) * len(pos)))
        out[label] = float(np.clip(pos[k] if len(pos) else 0.5, 0.01, 0.95))
    return out


def evaluate(
    y_true: np.ndarray,
    probs: np.ndarray,
    thresholds: dict[str, float],
    labels: list[str] | None = None,
) -> dict:
    """Per-label ROC-AUC / PR-AUC / F1 plus the binary "any toxic" view the product uses."""
    labels = labels or LABELS
    per_label = {}
    for label in labels:
        i = LABELS.index(label)
        yt, p = y_true[:, i], probs[:, i]
        if yt.min() == yt.max():
            continue
        pred = p >= thresholds[label]
        per_label[label] = {
            "roc_auc": float(roc_auc_score(yt, p)),
            "pr_auc": float(average_precision_score(yt, p)),
            "f1": float(f1_score(yt, pred, zero_division=0)),
            "precision": float(precision_score(yt, pred, zero_division=0)),
            "recall": float(recall_score(yt, pred, zero_division=0)),
            "support": int(yt.sum()),
        }

    # "Is this comment toxic at all?" — label = any Jigsaw label, score = max over labels.
    any_true = y_true.any(axis=1).astype(int)
    any_score = probs.max(axis=1)
    any_pred = (probs >= np.array([thresholds[lbl] for lbl in LABELS])).any(axis=1)
    summary = {
        "mean_roc_auc": float(np.mean([m["roc_auc"] for m in per_label.values()])),
        "any_toxic": {
            "roc_auc": float(roc_auc_score(any_true, any_score)),
            "pr_auc": float(average_precision_score(any_true, any_score)),
            "f1": float(f1_score(any_true, any_pred)),
            "precision": float(precision_score(any_true, any_pred)),
            "recall": float(recall_score(any_true, any_pred)),
            "accuracy": float((any_true == any_pred).mean()),
            "support": int(any_true.sum()),
            "n": int(len(any_true)),
        },
    }
    return {"summary": summary, "per_label": per_label}
