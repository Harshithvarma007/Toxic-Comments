import numpy as np

from toxicity import LABELS
from toxicity.metrics import evaluate, recall_thresholds, tune_thresholds


def _fake(n=2000, seed=0):
    rng = np.random.default_rng(seed)
    y = (rng.random((n, len(LABELS))) < 0.1).astype(int)
    p = np.clip(y * 0.6 + rng.random(y.shape) * 0.5, 0, 1)
    return y, p


def test_recall_threshold_hits_target():
    y, p = _fake()
    t = recall_thresholds(y, p, 0.9)
    for i, label in enumerate(LABELS):
        recall = (p[y[:, i] == 1, i] >= t[label]).mean()
        assert recall >= 0.9


def test_strict_is_at_least_as_permissive_as_balanced_on_recall():
    y, p = _fake(seed=1)
    bal = tune_thresholds(y, p)
    strict = {k: min(v, bal[k]) for k, v in recall_thresholds(y, p, 0.9).items()}  # as in export.py
    m_bal, m_strict = evaluate(y, p, bal), evaluate(y, p, strict)
    assert m_strict["summary"]["any_toxic"]["recall"] >= m_bal["summary"]["any_toxic"]["recall"] - 1e-9


def test_evaluate_shapes():
    y, p = _fake(seed=2)
    m = evaluate(y, p, {lbl: 0.5 for lbl in LABELS})
    assert set(m["per_label"]) == set(LABELS)
    assert 0 <= m["summary"]["any_toxic"]["f1"] <= 1
