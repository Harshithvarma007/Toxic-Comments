#!/bin/sh
# Bundle the shipped model files into the release asset that fetch_model.sh downloads.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/api/model"
tar -czf "$ROOT/toxic-model-onnx.tar.gz" config.json tokenizer.json tokenizer_config.json thresholds.json metrics.json onnx/model_quantized.onnx
echo "wrote toxic-model-onnx.tar.gz ($(du -h "$ROOT/toxic-model-onnx.tar.gz" | cut -f1))"
