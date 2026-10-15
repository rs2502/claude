#!/bin/bash
# Prepares cloud sessions for the skills in .claude/skills.
set -euo pipefail

# Only cloud sessions start from a fresh container; local machines keep their installs.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# ig-* skills read the voice file and log from ~/.claude/instagram (see CLAUDE.md).
mkdir -p ~/.claude/instagram
cp -n .claude/instagram/voice.md .claude/instagram/log.md ~/.claude/instagram/ 2>/dev/null || true

# kinetic-multicam transcribes with the `whisper` CLI from openai-whisper.
if ! command -v whisper >/dev/null 2>&1; then
  pip install --quiet -r .claude/skills/kinetic-multicam/requirements.txt
fi
