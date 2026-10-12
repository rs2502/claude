#!/usr/bin/env bash
# Bereitet die Filme fürs Scrollen auf (das Bildmaterial bleibt unverändert).
# Kurze Keyframe-Abstände + keine B-Frames: der Decoder springt sofort auf jedes Bild.
# "faststart" legt den Index nach vorn, damit das Video sofort startbereit ist.
# Bereits aufbereitete Dateien werden erkannt und übersprungen.
# Zu jedem Film entsteht ein Standbild (video-N.jpg), das vor dem Abspielen zu sehen ist.
set -euo pipefail
cd "$(dirname "$0")/../public/media"
mkdir -p .orig
for f in video-*.mp4; do
  poster="${f%.mp4}.jpg"
  if [ ! -f "$poster" ]; then
    ffmpeg -y -loglevel error -ss 1 -i "$f" -frames:v 1 -vf "scale='min(1600,iw)':-2" -q:v 4 "$poster"
    echo "✓ $poster (Standbild)"
  fi
  if ffprobe -v error -show_entries format_tags=comment -of csv=p=0 "$f" | grep -q "scrub-ready"; then
    echo "• $f ist schon fertig"
    continue
  fi
  cp "$f" ".orig/$f"
  ffmpeg -y -loglevel error -i ".orig/$f" -an \
    -vf "scale='min(1920,iw)':-2" \
    -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p \
    -g 6 -keyint_min 6 -bf 0 -movflags +faststart \
    -metadata comment=scrub-ready "$f"
  echo "✓ $f"
done
