#!/usr/bin/env bash
# Installs the video-effects skill on your own computer, for every project (Mac, Linux, Windows via WSL).
# Run it once from a checkout of this repo:
#   bash .claude/skills/video-effects/install-local.sh
# Safe to run again: it updates the skill files and leaves existing engine checkouts alone.
set -euo pipefail

SKILL_SRC="$(cd "$(dirname "$0")" && pwd)"
HOOK="$SKILL_SRC/../../hooks/video-effects.sh"
TARGET="$HOME/.claude/skills/video-effects"
R_DIR="$HOME/claude-video-effects"
P_DIR="$HOME/claude-effects-py"

say()  { printf '\n==> %s\n' "$*"; }
fail() { printf '\nSTOP: %s\n' "$*" >&2; exit 1; }

# The reviewed engine commits live in the cloud hook; read them from there so both stay in step.
[ -f "$HOOK" ] || fail "cannot find $HOOK - run this script from a checkout of the repo."
pin() { sed -n "s/^$1=\"\(.*\)\"$/\1/p" "$HOOK"; }
R_URL="$(pin REPO_URL)"; R_SHA="$(pin REPO_SHA)"
P_URL="$(pin PY_URL)";   P_SHA="$(pin PY_SHA)"
[ -n "$R_SHA" ] && [ -n "$P_SHA" ] || fail "could not read the engine commits from $HOOK."

say "Checking tools"
missing=""
command -v git     >/dev/null 2>&1 || missing="$missing git"
command -v ffmpeg  >/dev/null 2>&1 || missing="$missing ffmpeg"
command -v ffprobe >/dev/null 2>&1 || missing="$missing ffprobe"
command -v node    >/dev/null 2>&1 || missing="$missing node"
command -v npm     >/dev/null 2>&1 || missing="$missing npm"
if [ -n "$missing" ]; then
  echo "Missing:$missing"
  echo "  Mac:     brew install git ffmpeg node python@3.12"
  echo "  Linux:   sudo apt install git ffmpeg nodejs npm python3 python3-venv"
  echo "  Windows: run this script inside WSL (Ubuntu) and use the Linux line"
  fail "install the missing tools, then run this script again."
fi
node_major="$(node -p 'process.versions.node.split(".")[0]')"
[ "$node_major" -ge 18 ] || fail "Node $node_major is too old, version 18 or newer is needed."

fetch_pinned() { # url sha dir
  if [ -d "$3/.git" ]; then
    echo "$3 exists, left as it is ($(git -C "$3" rev-parse --short HEAD))."
  elif [ -e "$3" ]; then
    fail "$3 exists but is not a git checkout. Move it away and run again."
  else
    git init --quiet "$3"
    git -C "$3" fetch --quiet --depth 1 "$1" "$2"
    git -C "$3" checkout --quiet FETCH_HEAD
    echo "$3 installed at ${2:0:7}."
  fi
}

say "Engine R (Remotion): $R_DIR"
fetch_pinned "$R_URL" "$R_SHA" "$R_DIR"
( cd "$R_DIR" && { [ -d node_modules ] || npm install --no-audit --no-fund --loglevel=error; } )

say "Engine P (Python): $P_DIR"
fetch_pinned "$P_URL" "$P_SHA" "$P_DIR"
if ! bash "$P_DIR/scripts/setup.sh"; then
  echo "Python setup did not finish. Install Python 3.10 or newer (Mac: brew install python@3.12),"
  echo "then run: bash $P_DIR/scripts/setup.sh"
fi

say "Skill: $TARGET"
mkdir -p "$TARGET"
cp "$SKILL_SRC"/SKILL.md "$SKILL_SRC"/catalog.md "$SKILL_SRC"/matting.md "$TARGET/"
echo "Copied SKILL.md, catalog.md, matting.md."

# The two old single skills would compete with the merged one.
if [ -e "$HOME/.claude/skills/effects" ]; then
  mv "$HOME/.claude/skills/effects" "$HOME/.claude/skills-effects.backup.$(date +%s)"
  echo "Moved the old 'effects' skill out of the skills folder (backup next to it)."
fi

say "Done. In Claude Code, in any project: /video-effects, or just say \"edit my video\"."
echo "The cut-out for some effects downloads about 2 GB on first use (see matting.md)."
