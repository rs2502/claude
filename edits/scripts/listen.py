#!/usr/bin/env python3
"""Ears for sounds: finds sound events in a video or audio file and names them
(CLAP model by LAION). Part of the Claude Code edit setup by Kapa (@kappa.ai).

Run with the edit-tools Python:
  macOS:   ~/.local/edit-tools/.venv/bin/python
  Windows: ~/.local/edit-tools/.venv/Scripts/python.exe
  <python> scripts/listen.py events <video or audio> [--out events.json]
                                   [--sensitivity 1.6]
  <python> scripts/listen.py match <piece.wav> <sound effects folder> [--top 5]
  <python> scripts/listen.py label <file or folder>

events  finds every sharp sound start and prints its time, length, brightness
        and the three most likely names.
match   finds the effects in a folder that sound most like a given piece.
label   names every file as a whole (to sort a sound effects library).
"""

import argparse
import json
import os
import shutil
import subprocess
import sys

import numpy as np

# Windows: keep UTF-8 output from crashing on the console encoding
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SR = 48000
# ffmpeg: the FFMPEG variable, else ffmpeg from PATH, else ~/.local/bin/ffmpeg
FFMPEG = (
    os.environ.get("FFMPEG")
    or shutil.which("ffmpeg")
    or os.path.expanduser("~/.local/bin/ffmpeg")
)
MODEL = "laion/clap-htsat-unfused"

# What the model can name.
# The key is the text prompt for CLAP, the value is the name we print.
LABELS = {
    "mouse click": "mouse click",
    "soft button tap": "soft button tap",
    "keyboard typing": "keyboard typing",
    "single key press": "single key press",
    "pop": "pop",
    "bubble pop": "bubble pop",
    "whoosh": "whoosh",
    "fast swipe": "fast swipe",
    "riser sweep going up": "riser sweep going up",
    "downward sweep": "downward sweep",
    "deep bass hit": "deep bass hit",
    "kick drum": "kick drum",
    "hi-hat": "hi-hat",
    "snare or clap": "snare or clap",
    "bell ding": "bell ding",
    "chime sparkle": "chime sparkle",
    "notification sound": "notification sound",
    "switch toggle": "switch toggle",
    "camera shutter": "camera shutter",
    "paper rustle": "paper rustle",
    "page turn": "page turn",
    "pen writing on paper": "pen writing on paper",
    "marker squeak": "marker squeak",
    "checkmark tick": "checkmark tick",
    "coin": "coin",
    "glass clink": "glass clink",
    "wooden knock": "wooden knock",
    "snap": "snap",
    "glitch digital noise": "glitch digital noise",
    "cartoon boing": "cartoon boing",
    "water drop": "water drop",
    "zipper": "zipper",
    "cash register": "cash register",
    "error buzz": "error buzz",
    "success jingle": "success jingle",
    "music melody": "music melody",
    "sustained bass note": "sustained bass note",
    "speech": "speech",
    "silence": "silence",
}


def load_audio(path, start=None, end=None):
    cmd = [FFMPEG, "-nostdin", "-v", "error"]
    if start is not None:
        cmd += ["-ss", str(start)]
    if end is not None:
        cmd += ["-to", str(end)]
    cmd += ["-i", path, "-vn", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def find_onsets(x, min_gap=0.09, sensitivity=1.6):
    """Sharp sound starts: peaks of spectral flux."""
    n, hop = 2048, 480  # 10 ms step
    win = np.hanning(n).astype(np.float32)
    frames = 1 + max(0, (len(x) - n) // hop)
    mags = np.empty((frames, n // 2 + 1), dtype=np.float32)
    for i in range(frames):
        mags[i] = np.abs(np.fft.rfft(x[i * hop : i * hop + n] * win))
    logm = np.log1p(40 * mags)
    flux = np.maximum(0, np.diff(logm, axis=0)).sum(axis=1)
    flux = np.concatenate([[0], flux])
    # threshold: moving median
    k = 30
    thr = np.array(
        [np.median(flux[max(0, i - k) : i + k + 1]) for i in range(len(flux))]
    )
    cand = []
    for i in range(1, len(flux) - 1):
        if (
            flux[i] > thr[i] * sensitivity + 1e-6
            and flux[i] >= flux[i - 1]
            and flux[i] > flux[i + 1]
        ):
            cand.append((i, flux[i] / (thr[i] + 1e-6)))
    onsets = []
    for i, strength in cand:
        t = (i * hop + n / 2) / SR
        if onsets and t - onsets[-1][0] < min_gap:
            if strength > onsets[-1][1]:
                onsets[-1] = (t, strength)
            continue
        onsets.append((t, strength))
    return onsets


def describe_shape(seg):
    """Simple measurable features: tail length, brightness."""
    if len(seg) < 256:
        return {}
    env = np.abs(seg)
    hop = 240
    e = np.array([env[i : i + hop].max() for i in range(0, len(env) - hop, hop)])
    peak = e.max() + 1e-9
    above = np.where(e > peak * 0.2)[0]
    dur = (above[-1] - above[0] + 1) * hop / SR if len(above) else 0
    spec = np.abs(np.fft.rfft(seg * np.hanning(len(seg))))
    freqs = np.fft.rfftfreq(len(seg), 1 / SR)
    centroid = float((spec * freqs).sum() / (spec.sum() + 1e-9))
    return {
        "length_s": round(float(dur), 2),
        "brightness_hz": int(centroid),
        "peak_db": round(float(20 * np.log10(peak)), 1),
    }


class Ears:
    def __init__(self):
        import torch
        from transformers import ClapModel, ClapProcessor

        self.torch = torch
        self.model = ClapModel.from_pretrained(MODEL).eval()
        self.proc = ClapProcessor.from_pretrained(MODEL)
        self.label_keys = list(LABELS)
        with torch.no_grad():
            t = self.proc(
                text=[f"the sound of {k}" for k in self.label_keys],
                return_tensors="pt",
                padding=True,
            )
            te = self.model.get_text_features(**t)
            self.text_emb = te / te.norm(dim=-1, keepdim=True)

    def embed(self, clips):
        torch = self.torch
        out = []
        for i in range(0, len(clips), 8):
            batch = [
                c if len(c) > 4800 else np.pad(c, (0, 4800 - len(c)))
                for c in clips[i : i + 8]
            ]
            with torch.no_grad():
                a = self.proc(audios=batch, sampling_rate=SR, return_tensors="pt")
                ae = self.model.get_audio_features(**a)
                out.append(ae / ae.norm(dim=-1, keepdim=True))
        return torch.cat(out)

    def name(self, emb, top=3):
        sims = (emb @ self.text_emb.T) * 20
        probs = sims.softmax(dim=-1)
        res = []
        for row in probs:
            idx = row.argsort(descending=True)[:top]
            res.append(
                [(LABELS[self.label_keys[j]], round(float(row[j]), 2)) for j in idx]
            )
        return res


def cmd_events(args):
    x = load_audio(args.media)
    total = len(x) / SR
    onsets = find_onsets(x, sensitivity=args.sensitivity)
    ears = Ears()
    clips, rows = [], []
    for k, (t, strength) in enumerate(onsets):
        nxt = onsets[k + 1][0] if k + 1 < len(onsets) else total
        a = max(0, t - 0.03)
        b = min(total, max(t + 0.25, min(t + 1.0, nxt)))
        seg = x[int(a * SR) : int(b * SR)]
        clips.append(seg)
        rows.append(
            {
                "time": round(t, 2),
                "strength": round(float(strength), 1),
                **describe_shape(seg),
            }
        )
    names = ears.name(ears.embed(clips)) if clips else []
    for r, nm in zip(rows, names):
        r["sounds_like"] = nm
        print(
            f'{r["time"]:6.2f} s  strength {r["strength"]:4.1f}  '
            f'length {r.get("length_s", 0):.2f}  '
            f'brightness {r.get("brightness_hz", 0):5d} Hz  -> '
            + ", ".join(f"{n} {p:.2f}" for n, p in nm)
        )
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(rows, f, ensure_ascii=False, indent=1)
        print("saved:", args.out)


def audio_files(folder):
    exts = (".wav", ".mp3", ".ogg", ".flac", ".m4a", ".aif", ".aiff")
    res = []
    for root, _, files in os.walk(folder):
        for f in sorted(files):
            if f.lower().endswith(exts):
                res.append(os.path.join(root, f))
    return res


def cmd_match(args):
    ears = Ears()
    q = ears.embed([load_audio(args.snippet)])
    files = audio_files(args.library)
    lib = ears.embed([load_audio(f)[: SR * 10] for f in files])
    sims = (lib @ q.T).squeeze(1)
    order = sims.argsort(descending=True)[: args.top]
    for j in order:
        print(f"{float(sims[j]):.3f}  {os.path.relpath(files[j], args.library)}")


def cmd_label(args):
    ears = Ears()
    files = audio_files(args.path) if os.path.isdir(args.path) else [args.path]
    clips = [load_audio(f)[: SR * 10] for f in files]
    for f, nm, c in zip(files, ears.name(ears.embed(clips)), clips):
        print(
            f"{os.path.basename(f):28s} {len(c)/SR:5.2f} s  -> "
            + ", ".join(f"{n} {p:.2f}" for n, p in nm)
        )


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    e = sub.add_parser("events")
    e.add_argument("media")
    e.add_argument("--out")
    e.add_argument("--sensitivity", type=float, default=1.6)
    m = sub.add_parser("match")
    m.add_argument("snippet")
    m.add_argument("library")
    m.add_argument("--top", type=int, default=5)
    l = sub.add_parser("label")
    l.add_argument("path")
    a = ap.parse_args()
    {"events": cmd_events, "match": cmd_match, "label": cmd_label}[a.cmd](a)
