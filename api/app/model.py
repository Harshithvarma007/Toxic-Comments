"""ONNX Runtime inference. No torch / transformers at serving time: the image stays small and
cold starts stay fast. The tokenizer is the same tokenizer.json the browser extension uses."""

from __future__ import annotations

import json
import re
import threading
from collections import OrderedDict
from pathlib import Path

import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer

_ws = re.compile(r"\s+")


def normalise(text: str) -> str:
    # Must match ml/toxicity/data.py:normalise — the training-time preprocessing.
    return _ws.sub(" ", text).strip()


class LRU:
    def __init__(self, size: int):
        self.size, self.data, self.lock = size, OrderedDict(), threading.Lock()

    def get(self, key):
        with self.lock:
            if key in self.data:
                self.data.move_to_end(key)
                return self.data[key]
        return None

    def put(self, key, value):
        if self.size <= 0:
            return
        with self.lock:
            self.data[key] = value
            self.data.move_to_end(key)
            while len(self.data) > self.size:
                self.data.popitem(last=False)


class ToxicityModel:
    def __init__(self, model_dir: Path, model_file: str, max_len: int, threads: int = 0, cache_size: int = 0):
        self.model_dir = model_dir
        config = json.loads((model_dir / "config.json").read_text())
        self.labels = [config["id2label"][str(i)] for i in range(len(config["id2label"]))]
        self.thresholds: dict[str, dict[str, float]] = json.loads((model_dir / "thresholds.json").read_text())
        metrics_path = model_dir / "metrics.json"
        self.metrics = json.loads(metrics_path.read_text()) if metrics_path.exists() else {}
        self.name = self.metrics.get("model", config.get("_name_or_path", "unknown"))

        self.tokenizer = Tokenizer.from_file(str(model_dir / "tokenizer.json"))
        self.tokenizer.enable_truncation(max_length=max_len)
        self.tokenizer.enable_padding()

        opts = ort.SessionOptions()
        if threads:
            opts.intra_op_num_threads = threads
        self.session = ort.InferenceSession(str(model_dir / model_file), opts, providers=["CPUExecutionProvider"])
        self.input_names = {i.name for i in self.session.get_inputs()}
        self.cache = LRU(cache_size)

    def _run(self, texts: list[str]) -> np.ndarray:
        enc = self.tokenizer.encode_batch(texts)
        feed = {
            "input_ids": np.array([e.ids for e in enc], dtype=np.int64),
            "attention_mask": np.array([e.attention_mask for e in enc], dtype=np.int64),
        }
        if "token_type_ids" in self.input_names:
            feed["token_type_ids"] = np.array([e.type_ids for e in enc], dtype=np.int64)
        logits = self.session.run(None, feed)[0]
        return 1.0 / (1.0 + np.exp(-logits))

    def predict(self, texts: list[str]) -> tuple[np.ndarray, int]:
        """Probabilities, shape (len(texts), len(labels)); also returns the number of cache hits."""
        texts = [normalise(t) for t in texts]
        out = np.zeros((len(texts), len(self.labels)), dtype=np.float32)
        missing = []
        for i, t in enumerate(texts):
            hit = self.cache.get(t)
            if hit is None:
                missing.append(i)
            else:
                out[i] = hit
        if missing:
            # Sort by length so padding inside each micro-batch is minimal.
            order = sorted(missing, key=lambda i: len(texts[i]))
            for start in range(0, len(order), 32):
                chunk = order[start : start + 32]
                probs = self._run([texts[i] for i in chunk])
                for i, p in zip(chunk, probs, strict=True):
                    out[i] = p
                    self.cache.put(texts[i], p)
        return out, len(texts) - len(missing)
