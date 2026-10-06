#!/bin/sh
# Download the released model and put it where the API and extension expect it.
#   scripts/fetch_model.sh [tag]     (default: model-v2.0.0)
set -e
TAG="${1:-model-v2.0.0}"
REPO="Harshithvarma007/Toxic-Comments"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
curl -fsSL "https://github.com/$REPO/releases/download/$TAG/toxic-model-onnx.tar.gz" -o "$TMP/model.tgz"
for dest in "$ROOT/api/model" "$ROOT/extension/model"; do
  rm -rf "$dest" && mkdir -p "$dest"
  tar -xzf "$TMP/model.tgz" -C "$dest"
done
rm -rf "$TMP"
echo "model $TAG -> api/model, extension/model"
