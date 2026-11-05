#!/usr/bin/env bash
# Installs the video-effects skill on your own computer, for every project (Mac, Linux, Windows via WSL).
# Run it once from a checkout of this repo:
#   bash .claude/skills/video-effects/install-local.sh
# Not strictly needed: the skill sets itself up on first use. This just does it ahead of time.
set -euo pipefail

SKILL_SRC="$(cd "$(dirname "$0")" && pwd)"
TARGET="$HOME/.claude/skills/video-effects"

printf '\n==> Skill: %s\n' "$TARGET"
mkdir -p "$TARGET/engine-p"
cp "$SKILL_SRC"/SKILL.md "$SKILL_SRC"/catalog.md "$SKILL_SRC"/matting.md "$SKILL_SRC"/bootstrap.sh "$TARGET/"
cp "$SKILL_SRC"/engine-p/fx_private.py "$TARGET/engine-p/"
echo "Copied."

# An old standalone 'effects' skill would compete with the merged one.
if [ -e "$HOME/.claude/skills/effects" ]; then
  mv "$HOME/.claude/skills/effects" "$HOME/.claude/skills-effects.backup.$(date +%s)"
  echo "Moved the old 'effects' skill out of the skills folder (backup next to it)."
fi

printf '\n==> Engines\n'
if ! bash "$TARGET/bootstrap.sh"; then
  echo
  echo "Setup stopped at the NEED_ line above. Install that, then run this script again."
  echo "  Mac:     brew install git ffmpeg node python@3.12"
  echo "  Linux:   sudo apt install git ffmpeg nodejs npm python3 python3-venv libegl1 libgles2"
  echo "  Windows: run this script inside WSL (Ubuntu) and use the Linux line"
  exit 1
fi

printf '\nDone. In Claude Code, in any project: /video-effects, or just say "edit my video".\n'
