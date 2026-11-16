#!/bin/bash
# Installs the video-effects skill (github.com/KenoMedien/claude-video-effects) into a fresh container.
# Called from session-start.sh; safe to run again. On top of the pinned commit it applies our own
# extra effects from video-effects-extra.patch (once; skipped when already applied).
set -euo pipefail

REPO_URL="https://github.com/KenoMedien/claude-video-effects.git"
# Reviewed commit. Bump only after reading the upstream diff: skill/*.md become Claude's instructions.
REPO_SHA="8f4bdfb14b0ef599ba8b3350fdb3faefa21b459d"
DIR="$HOME/claude-video-effects"
HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -d "$DIR/.git" ]; then
  git init --quiet "$DIR"
  git -C "$DIR" fetch --quiet --depth 1 "$REPO_URL" "$REPO_SHA"
  git -C "$DIR" checkout --quiet FETCH_HEAD
fi

cd "$DIR"

# Our own extra effects (graph split, flight map, notes, ...): src/effects/extra.tsx plus catalog entries.
# Applied once on top of the pinned commit; skipped when already applied.
PATCH="$HOOK_DIR/video-effects-extra.patch"
if [ -f "$PATCH" ] && ! git apply --reverse --check "$PATCH" 2>/dev/null; then
  git apply "$PATCH"
fi

# An interrupted install leaves node_modules without .bin, so check for the CLI itself.
[ -x node_modules/.bin/remotion ] || npm install --no-audit --no-fund --loglevel=error

# Copies skill/ to ~/.claude/skills/video-effects with the repo path filled in.
bash scripts/install-skill.sh

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
