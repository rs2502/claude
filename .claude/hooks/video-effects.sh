#!/bin/bash
# Installs both engines of the merged video-effects skill (.claude/skills/video-effects) into a fresh container.
# Called from session-start.sh; safe to run again, and it never touches an existing checkout's files.
set -euo pipefail

REPO_URL="https://github.com/KenoMedien/claude-video-effects.git"
# Reviewed commit. Bump only after reading the upstream diff: skill/*.md become Claude's instructions.
REPO_SHA="8f4bdfb14b0ef599ba8b3350fdb3faefa21b459d"
DIR="$HOME/claude-video-effects"

if [ ! -d "$DIR/.git" ]; then
  git init --quiet "$DIR"
  git -C "$DIR" fetch --quiet --depth 1 "$REPO_URL" "$REPO_SHA"
  git -C "$DIR" checkout --quiet FETCH_HEAD
fi

cd "$DIR"
[ -d node_modules ] || npm install --no-audit --no-fund --loglevel=error

# The merged skill lives in this repo (.claude/skills/video-effects), so the upstream skill is not
# installed as a personal skill any more; that would load a second, outdated video-effects skill.
rm -rf "$HOME/.claude/skills/video-effects"

# Remotion downloads its Chrome from remotion.media, which the network policy may block. Point its
# browser cache at the container's preinstalled headless Chromium instead.
cache="node_modules/.remotion/chrome-headless-shell"
local_shell="$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64 2>/dev/null | tail -1)"
if [ ! -e "$cache/linux64/chrome-headless-shell-linux64/chrome-headless-shell" ] && [ -n "$local_shell" ]; then
  mkdir -p "$cache/linux64"
  ln -sfn "$local_shell" "$cache/linux64/chrome-headless-shell-linux64"
  # Remotion re-downloads unless VERSION matches the version it was tested with.
  node -e 'process.stdout.write(require(process.argv[1]).TESTED_VERSION)' \
    "$PWD/node_modules/@remotion/renderer/dist/browser/get-chrome-download-url.js" > "$cache/VERSION"
fi

# Engine P of the merged skill: Python effect pack (github.com/Vibha-Ramprakash/claude-video-effects).
# Reviewed commit, same rule as above. Its Python venv is created on first use (scripts/setup.sh).
PY_URL="https://github.com/Vibha-Ramprakash/claude-video-effects.git"
PY_SHA="93140a976dcd1c78bda8819fa432ca7b4f260bf7"
PY_DIR="$HOME/claude-effects-py"
if [ ! -d "$PY_DIR/.git" ]; then
  git init --quiet "$PY_DIR"
  git -C "$PY_DIR" fetch --quiet --depth 1 "$PY_URL" "$PY_SHA"
  git -C "$PY_DIR" checkout --quiet FETCH_HEAD
fi
# Its own SKILL.md must not be loaded as a separate skill; only the merged one counts.
rm -rf "$HOME/.claude/skills/effects"
