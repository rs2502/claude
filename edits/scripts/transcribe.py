"""Speech to text with a timestamp for every word (OpenAI Whisper, runs locally).
Part of the Claude Code edit setup by Kapa (@kappa.ai).

Writes a word list that HyperFrames imports directly:
    [{"text": "Everybody", "start": 0.0, "end": 0.48}, ...]

Usage:
    <python> scripts/transcribe.py <audio or video> [--model small] [--language en]
        [--prompt "Claude Code"] [--out transcript.json]
Then, inside a HyperFrames project:
    npx hyperframes transcribe transcript.json

Models: tiny, base, small (default, good balance), medium, large-v3 (best, slow on CPU).
The model downloads once on first use and then works offline.
"""

import argparse
import json
import sys

import whisper

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ap = argparse.ArgumentParser()
ap.add_argument("media")
ap.add_argument("--model", default="small")
ap.add_argument(
    "--language", default=None, help="for example en, es, ru; empty = detect"
)
ap.add_argument("--out", default="transcript.json")
ap.add_argument(
    "--prompt",
    default=None,
    help='names to spell right, for example "Claude Code, HyperFrames"',
)
a = ap.parse_args()

model = whisper.load_model(a.model)
result = model.transcribe(
    a.media,
    word_timestamps=True,
    language=a.language,
    initial_prompt=a.prompt,
    fp16=False,
)
words = [
    {
        "text": w["word"].strip(),
        "start": round(float(w["start"]), 3),
        "end": round(float(w["end"]), 3),
    }
    for seg in result["segments"]
    for w in seg.get("words", [])
    if w["word"].strip()
]
with open(a.out, "w", encoding="utf-8") as f:
    json.dump(words, f, ensure_ascii=False, indent=1)
print(f"{len(words)} words -> {a.out}")
print(result["text"].strip()[:300])
