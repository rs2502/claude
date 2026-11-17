#!/usr/bin/env bash
# Thumbnails für Wände, Ringe und Karten aus dem eigenen Video: Standbilder an verteilten Stellen,
# abwechselnd nah/weit und farbig getönt. usage: bash scripts/make-tiles.sh <video in public/> [anzahl=12]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VIDEO="$ROOT/public/$1"
COUNT="${2:-12}"
OUT="$ROOT/public/tiles"
[ -f "$VIDEO" ] || { echo "Video nicht gefunden: $VIDEO" >&2; exit 1; }
mkdir -p "$OUT"

DUR="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIDEO")"
TINTS=("0.9:1.1:1.3" "1.3:0.9:0.85" "0.85:1.15:1.1" "1.15:0.95:1.3" "1.3:1.05:0.8" "1:1:1")
for i in $(seq 1 "$COUNT"); do
  t="$(awk -v d="$DUR" -v i="$i" -v n="$COUNT" 'BEGIN { printf "%.2f", d * (i - 0.5) / n }')"
  IFS=: read -r r g b <<< "${TINTS[$(( (i - 1) % ${#TINTS[@]} ))]}"
  if (( i % 2 )); then zoom="crop=iw*0.62:ih*0.62:(iw-iw*0.62)/2:ih*0.08"; else zoom="crop=iw:ih:0:0"; fi
  ffmpeg -y -loglevel error -ss "$t" -i "$VIDEO" -frames:v 1 \
    -vf "$zoom,scale=540:960:force_original_aspect_ratio=increase,crop=540:960,colorchannelmixer=rr=$r:gg=$g:bb=$b,eq=contrast=1.08:saturation=1.15" \
    -q:v 3 "$OUT/$(printf '%02d' "$i").jpg"
done
echo "$COUNT Kacheln in $OUT"
