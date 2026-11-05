#!/bin/bash
# Cloud sessions: downloads both engines of the video-effects skill (.claude/skills/video-effects).
# The work is in the skill's own bootstrap.sh, which the skill also runs by itself wherever it is used.
# --quick skips the Python packages to keep session start fast; the skill installs them on first use.
set -euo pipefail

# The merged skill lives in this repo; an older personal copy of the upstream skill would load twice.
rm -rf "$HOME/.claude/skills/video-effects"

bash "$(dirname "$0")/../skills/video-effects/bootstrap.sh" --quick
