#!/usr/bin/env bash
# Installs the video edit tools in a fresh cloud container (safe to run again: it skips
# what is already there). Paste it into the environment's setup script, or run:
#   bash edits/setup.sh
set -u
T=~/.local/edit-tools
PY=$T/.venv/bin/python
log() { echo "[edit-tools] $*"; }

# system packages: Blender (3D), espeak-ng (test voices)
if ! command -v blender >/dev/null || ! command -v espeak-ng >/dev/null; then
  log "apt: blender espeak-ng"
  apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq blender espeak-ng >/dev/null
fi

# Python env for Whisper, CLAP, Demucs (torch from PyPI: download.pytorch.org is blocked)
if ! "$PY" -c "import torch, transformers, demucs, whisper" 2>/dev/null; then
  log "python env"
  mkdir -p $T
  uv venv -q --python 3.11 $T/.venv
  uv pip install -q --python "$PY" torch==2.2.2 torchaudio==2.2.2 "numpy<2" transformers==4.44.2 soundfile demucs==4.0.1
  uv pip install -q --python "$PY" --only-binary llvmlite --only-binary numba openai-whisper
fi

# Whisper model, so the first transcription doesn't wait for it (needs openaipublic.azureedge.net)
"$PY" -c "import whisper; whisper.load_model('small')" >/dev/null 2>&1 || log "whisper model not downloaded (network?)"

# HyperFrames: its Claude skills and the headless Chrome it renders with
npx -y hyperframes@latest skills update >/dev/null 2>&1 || log "hyperframes skills failed"
npx -y hyperframes@latest browser ensure >/dev/null 2>&1 || log "hyperframes browser failed"

log "done: $("$PY" -c 'import torch; print("torch", torch.__version__)' 2>/dev/null), $(blender --version 2>/dev/null | head -1)"
