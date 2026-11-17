#!/bin/bash
# Bereitet fx/ (16 Reel-Effekte, Remotion) für den Skill automatisch vor. Wird von session-start.sh aufgerufen.
set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}/fx"
[ -d node_modules ] || npm install --no-audit --no-fund --loglevel=error

# Remotion lädt sein Chrome von remotion.media, das hier gesperrt sein kann: das vorinstallierte nehmen.
cache="node_modules/.remotion/chrome-headless-shell"
local_shell="$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64 2>/dev/null | tail -1)"
if [ ! -e "$cache/linux64/chrome-headless-shell-linux64/chrome-headless-shell" ] && [ -n "$local_shell" ]; then
  mkdir -p "$cache/linux64"
  ln -sfn "$local_shell" "$cache/linux64/chrome-headless-shell-linux64"
  node -e 'process.stdout.write(require(process.argv[1]).TESTED_VERSION)' \
    "$PWD/node_modules/@remotion/renderer/dist/browser/get-chrome-download-url.js" > "$cache/VERSION"
fi
