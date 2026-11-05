#!/usr/bin/env bash
# Sets up both engines of the video-effects skill wherever the skill runs (cloud container, Mac, Linux, WSL).
#   bash bootstrap.sh          everything; prints READY when the skill can be used
#   bash bootstrap.sh --quick  download only, skip the Python packages (used by the cloud SessionStart hook)
# Safe to run again: existing engine checkouts are left alone, only our own fx_private.py is refreshed.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
QUICK=0; [ "${1:-}" = "--quick" ] && QUICK=1

# Reviewed upstream commits. Bump only after reading the upstream diff.
R_URL="https://github.com/KenoMedien/claude-video-effects.git"
R_SHA="8f4bdfb14b0ef599ba8b3350fdb3faefa21b459d"
R_DIR="${VFX_R_DIR:-$HOME/claude-video-effects}"
P_URL="https://github.com/Vibha-Ramprakash/claude-video-effects.git"
P_SHA="93140a976dcd1c78bda8819fa432ca7b4f260bf7"
P_DIR="${VFX_P_DIR:-$HOME/claude-effects-py}"

say() { printf '==> %s\n' "$*"; }
need() { printf 'NEED_%s: %s\n' "$1" "$2"; exit 1; }

command -v git >/dev/null 2>&1 || need GIT "install git (Mac: xcode-select --install, Linux: apt install git)"
command -v ffmpeg >/dev/null 2>&1 && command -v ffprobe >/dev/null 2>&1 || need FFMPEG "install ffmpeg (Mac: brew install ffmpeg, Linux: apt install ffmpeg, Windows: use WSL)"
command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1 || need NODE "install Node 18+ (Mac: brew install node, Linux: apt install nodejs npm)"
[ "$(node -p 'process.versions.node.split(".")[0]')" -ge 18 ] || need NODE "Node 18 or newer is needed"

fetch_pinned() { # url sha dir
  [ -d "$3/.git" ] && return 0
  [ -e "$3" ] && need FOLDER "$3 exists but is not a git checkout; move it away and run again"
  say "downloading $(basename "$3")"
  git init --quiet "$3"
  git -C "$3" fetch --quiet --depth 1 "$1" "$2"
  git -C "$3" checkout --quiet FETCH_HEAD
}

# ---- engine R: Remotion ----
fetch_pinned "$R_URL" "$R_SHA" "$R_DIR"
if [ ! -d "$R_DIR/node_modules" ]; then
  say "installing Remotion (npm)"
  (cd "$R_DIR" && npm install --no-audit --no-fund --loglevel=error)
fi
# Cloud containers may block Remotion's Chrome download; use the preinstalled headless Chromium if there is one.
cache="$R_DIR/node_modules/.remotion/chrome-headless-shell"
local_shell="$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64 2>/dev/null | tail -1 || true)"
if [ -n "$local_shell" ] && [ ! -e "$cache/linux64/chrome-headless-shell-linux64/chrome-headless-shell" ]; then
  mkdir -p "$cache/linux64"
  ln -sfn "$local_shell" "$cache/linux64/chrome-headless-shell-linux64"
  node -e 'process.stdout.write(require(process.argv[1]).TESTED_VERSION)' \
    "$R_DIR/node_modules/@remotion/renderer/dist/browser/get-chrome-download-url.js" > "$cache/VERSION"
fi

# ---- engine P: Python ----
fetch_pinned "$P_URL" "$P_SHA" "$P_DIR"
cp "$SKILL_DIR/engine-p/fx_private.py" "$P_DIR/scripts/fx_private.py"   # our own effects, e.g. editor
# The pack's own SKILL.md must not load as a second skill.
[ -d "$HOME/.claude/skills/effects/scripts" ] && rm -rf "$HOME/.claude/skills/effects"

[ "$QUICK" = 1 ] && { echo "DOWNLOADED (Python packages follow on first use)"; exit 0; }

# mediapipe on Linux needs libEGL; install it when we can do that without a password prompt.
if [ "$(uname -s)" = Linux ] && ! ldconfig -p 2>/dev/null | grep -q 'libEGL.so.1'; then
  if [ "$(id -u)" = 0 ]; then apt-get install -y -q libegl1 libgles2 >/dev/null 2>&1 || { apt-get update -q >/dev/null 2>&1 && apt-get install -y -q libegl1 libgles2 >/dev/null 2>&1; } || true
  elif sudo -n true 2>/dev/null; then sudo apt-get install -y -q libegl1 libgles2 >/dev/null 2>&1 || true
  fi
  ldconfig -p 2>/dev/null | grep -q 'libEGL.so.1' || need EGL "run: sudo apt install libegl1 libgles2"
fi
say "Python packages (first time 1 to 3 minutes)"
out="$(bash "$P_DIR/scripts/setup.sh" 2>&1 | tail -1)"
case "$out" in READY*) ;; NEED_PYTHON*) need PYTHON "install Python 3.10+ (Mac: brew install python@3.12, Linux: apt install python3 python3-venv)";; *) echo "$out"; exit 1;; esac

echo "READY"
