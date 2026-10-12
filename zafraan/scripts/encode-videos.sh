#!/usr/bin/env bash
# Re-wrap the Google Flow films for scroll scrubbing (does not regenerate them).
# Short GOPs + no B-frames let the decoder land on any frame instantly;
# faststart puts the index first so metadata arrives with the first bytes.
set -euo pipefail
cd "$(dirname "$0")/../public/media"
mkdir -p .orig
for f in video-*.mp4; do
  [ -f ".orig/$f" ] || cp "$f" ".orig/$f"
  ffmpeg -y -loglevel error -i ".orig/$f" -an \
    -vf "scale='min(1920,iw)':-2" \
    -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p \
    -g 6 -keyint_min 6 -bf 0 -movflags +faststart "$f"
  echo "✓ $f"
done
