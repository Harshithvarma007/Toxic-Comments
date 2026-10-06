"""Build leak-free train / val / test splits.

Sources
- Jigsaw Toxic Comment Classification (Wikipedia talk pages): train.csv for train+val,
  the official test.csv + test_labels.csv (rows labelled -1 were never scored and are dropped)
  for the in-domain test set.
- YouTube toxicity data (1,000 comments): kept entirely out of training and used as an
  out-of-domain test set, because the browser extension runs on YouTube.

Leakage rules (the original notebook broke the first one):
1. Any resampling happens after the split, on the training split only.
2. Exact-duplicate texts (after whitespace normalisation) are removed from train/val when they
   also appear in a test set.

Usage: python -m toxicity.data
"""

from __future__ import annotations

import os
import re
from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split

from . import LABELS

ROOT = Path(os.environ.get("TOXIC_ML_HOME", Path(__file__).resolve().parent.parent))
RAW = Path(os.environ.get("TOXIC_RAW_DIR", ROOT / "data" / "raw"))
OUT = ROOT / "data" / "processed"
SEED = 42

_ws = re.compile(r"\s+")


def normalise(text: str) -> str:
    """The only preprocessing the model sees, here and at inference time."""
    return _ws.sub(" ", str(text)).strip()


def _find(name: str) -> Path:
    """Locate a raw file locally or under a Kaggle /kaggle/input mount (plain or .zip)."""
    for candidate in (name, name + ".zip"):
        hits = sorted(RAW.rglob(candidate))
        if hits:
            return hits[0]
    raise FileNotFoundError(f"{name} not found under {RAW}")


def load_jigsaw_train() -> pd.DataFrame:
    df = pd.read_csv(_find("train.csv"))
    df["text"] = df["comment_text"].map(normalise)
    return df[["text", *LABELS]]


def load_jigsaw_test() -> pd.DataFrame:
    text = pd.read_csv(_find("test.csv"))
    labels = pd.read_csv(_find("test_labels.csv"))
    df = text.merge(labels, on="id")
    df = df[df["toxic"] != -1]
    df["text"] = df["comment_text"].map(normalise)
    return df[["text", *LABELS]].reset_index(drop=True)


def load_youtube() -> pd.DataFrame:
    df = pd.read_csv(_find("youtoxic_english_1000.csv"))
    out = pd.DataFrame({"text": df["Text"].map(normalise)})
    # Map the YouTube taxonomy onto the Jigsaw labels as closely as it allows.
    out["toxic"] = df["IsToxic"].astype(int)
    out["severe_toxic"] = 0  # no equivalent label; excluded from per-label YouTube metrics
    out["obscene"] = df["IsObscene"].astype(int)
    out["threat"] = df["IsThreat"].astype(int)
    out["insult"] = df["IsAbusive"].astype(int)
    hate_cols = ["IsHatespeech", "IsRacist", "IsSexist", "IsHomophobic", "IsReligiousHate", "IsNationalist"]
    out["identity_hate"] = df[hate_cols].any(axis=1).astype(int)
    return out


def build() -> dict[str, pd.DataFrame]:
    train_full = load_jigsaw_train()
    test = load_jigsaw_test()
    youtube = load_youtube()

    held_out = set(test["text"]) | set(youtube["text"])
    before = len(train_full)
    train_full = train_full[~train_full["text"].isin(held_out)]
    train_full = train_full.drop_duplicates("text").reset_index(drop=True)
    print(f"jigsaw train: {before} rows -> {len(train_full)} after dedup / test-overlap removal")

    any_toxic = train_full[LABELS].any(axis=1)
    train, val = train_test_split(train_full, test_size=0.1, random_state=SEED, stratify=any_toxic)

    splits = {
        "train": train.reset_index(drop=True),
        "val": val.reset_index(drop=True),
        "test": test,
        "youtube": youtube,
    }
    OUT.mkdir(parents=True, exist_ok=True)
    for name, df in splits.items():
        df.to_parquet(OUT / f"{name}.parquet", index=False)
        rate = df[LABELS].any(axis=1).mean()
        print(f"{name:8s} {len(df):7d} rows  any-toxic rate {rate:.3f}")
    return splits


def load_split(name: str) -> pd.DataFrame:
    return pd.read_parquet(OUT / f"{name}.parquet")


if __name__ == "__main__":
    build()
