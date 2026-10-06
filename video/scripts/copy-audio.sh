#!/bin/sh
# Audio comes from the NOUS Video OS library and is not committed (Mixkit's licence allows use in
# videos, not redistribution of the files). Override VIDEO_OS if your library lives elsewhere.
set -e
SRC="${VIDEO_OS:-$HOME/Desktop/Video OS}/visuals/public/audio"
DEST="$(dirname "$0")/../public/audio"
mkdir -p "$DEST"
for f in music/music-ambient-think_01.wav brand/nous-sonic-logo_01.wav data/data-ping_01.wav data/counter-land_01.wav; do
  cp "$SRC/$f" "$DEST/$(basename "$f")"
done
echo "copied audio -> $DEST"
