#!/bin/bash
# usage: mixmusic.sh music_file out.mp4 [music_offset_s]
# Mixes music under the SFX track (music ducks slightly on SFX hits), muxes onto the clean cut.
set -e
R=/tmp/claude-0/-home-user-claude/12c49631-ca9c-5648-9da1-0be9e9648064/scratchpad/r2
M="$1"; OUT="$2"; OFF="${3:-0}"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$R/clean.mp4")
FO=$(python3 -c "print(round($D-0.9,3))")
ffmpeg -v error -y -i "$R/clean.mp4" -ss "$OFF" -i "$M" -i "$R/sfx.wav" -filter_complex "
[1:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:$D,asetpts=PTS-STARTPTS,
 loudnorm=I=-17:TP=-2:LRA=11,afade=t=in:d=0.05,afade=t=out:st=$FO:d=0.9[mus];
[2:a]aresample=48000,asplit=2[sfx][key];
[mus][key]sidechaincompress=threshold=0.08:ratio=3:attack=5:release=180:makeup=1[duck];
[duck][sfx]amix=inputs=2:weights='1 1.15':normalize=0,
 loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]" \
 -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k -t "$D" -movflags +faststart "$OUT"
