#!/usr/bin/env bash
# Einmalige Einrichtung von RobustVideoMatting (GPL-3.0, wird nicht mitgeliefert) für scripts/make-cutout.sh.
# Ist PyTorch schon installiert, wird es mitbenutzt, sonst in eine eigene Umgebung installiert.
# usage: bash scripts/setup-rvm.sh
set -euo pipefail

RVM_DIR="${RVM_DIR:-$HOME/.cache/claude-video-effects/rvm}"
PYTHON="${PYTHON:-python3}"

mkdir -p "$(dirname "$RVM_DIR")"
[ -d "$RVM_DIR/.git" ] || git clone --depth 1 https://github.com/PeterL1n/RobustVideoMatting.git "$RVM_DIR"

if [ ! -x "$RVM_DIR/venv/bin/python" ]; then
  if "$PYTHON" -c "import torch" 2>/dev/null; then
    "$PYTHON" -m venv --system-site-packages "$RVM_DIR/venv"
  else
    "$PYTHON" -m venv "$RVM_DIR/venv"
  fi
fi
PY="$RVM_DIR/venv/bin/python"
"$PY" -c "import torch" 2>/dev/null || "$PY" -m pip install torch
# torchvision passend zum vorhandenen torch, ohne torch selbst neu zu ziehen.
"$PY" -c "import torchvision" 2>/dev/null || "$PY" -m pip install --no-deps torchvision
"$PY" -m pip install av pims tqdm

mkdir -p "$RVM_DIR/weights"
for variant in resnet50 mobilenetv3; do
  file="$RVM_DIR/weights/rvm_$variant.pth"
  [ -s "$file" ] || curl -fL --progress-bar -o "$file" "https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_$variant.pth"
done
"$PY" -c "import torch, torchvision, av" && echo "RVM bereit in $RVM_DIR"
