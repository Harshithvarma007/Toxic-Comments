#!/bin/zsh
# Poll the Kaggle kernel until it finishes, then download its outputs into ml/artifacts/kaggle.
cd "$(dirname "$0")/.."
K=${KAGGLE_KERNEL:-harshithvarma007/toxic-comments-transformer}
KG=../.venv-ml/bin/kaggle
while true; do
  s=$($KG kernels status $K 2>&1)
  echo "$(date +%H:%M:%S) $s"
  case "$s" in
    *COMPLETE*|*complete*) break;;
    *ERROR*|*error*|*CANCEL*|*cancel*) echo FAILED; $KG kernels output $K -p artifacts/kaggle-failed -o >/dev/null 2>&1; exit 1;;
  esac
  sleep 60
done
mkdir -p artifacts/kaggle
$KG kernels output $K -p artifacts/kaggle -o
find artifacts/kaggle -maxdepth 4 | head -40
