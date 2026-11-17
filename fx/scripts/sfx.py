"""Soundeffekte passend zum Schnittplan erzeugen (synthetisch, keine fremden Samples).

usage: python3 scripts/sfx.py <plan.json> <ausgabe.wav>

Pro Cue: Whoosh zum Effektstart, Pop für jedes Hook-Wort, Einschlag auf das Hauptwort,
Ding, wenn auf der Endcard die Telefonnummer erscheint. Mischen danach mit ffmpeg (SFX ca. -10 dB unter der Stimme).
"""
import json
import sys
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def env(n, attack, decay):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / decay)


def whoosh(dur=0.45):
    n = int(SR * dur)
    noise = rng.standard_normal(n)
    # Bandpass-Sweep: gleitender Mittelwert mit wachsendem Fenster, dann Hüllkurve als Bogen.
    out = np.zeros(n)
    for i, w in enumerate(np.linspace(40, 4, 8)):
        a, b = i * n // 8, (i + 1) * n // 8
        k = np.ones(int(w)) / int(w)
        out[a:b] = np.convolve(noise[a:b], k, mode="same")
    shape = np.sin(np.linspace(0, np.pi, n)) ** 2
    return out * shape * 0.9


def pop():
    n = int(SR * 0.09)
    t = np.arange(n) / SR
    f = 900 * np.exp(-t * 30) + 300
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.03) * 0.8


def hit():
    n = int(SR * 0.6)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * np.cumsum(120 * np.exp(-t * 8) + 45) / SR) * env(n, 0.001, 0.18)
    crack = rng.standard_normal(n) * env(n, 0.0005, 0.025)
    return (body * 1.0 + crack * 0.5) * 0.95


def ding():
    n = int(SR * 0.9)
    t = np.arange(n) / SR
    tone = sum(np.sin(2 * np.pi * f * t) * a for f, a in [(1318.5, 1), (2637, 0.35), (3956, 0.12)])
    return tone * env(n, 0.002, 0.25) * 0.45


def place(track, clip, at):
    i = int(at * SR)
    if i >= len(track):
        return
    j = min(len(track), i + len(clip))
    track[i:j] += clip[: j - i]


plan = json.load(open(sys.argv[1]))
track = np.zeros(int(SR * (plan["durationInSeconds"] + 1)))
for c in plan["cues"]:
    at, fx, props = c["from"], c["fx"], c.get("props", {})
    if fx == "kinetic-hook":
        for w in props.get("words", []):
            place(track, hit() if w.get("hit") else pop(), at + w["at"])
    elif fx == "endcard":
        place(track, whoosh(0.5), at - 0.1)
        place(track, ding(), at + 0.5)
    else:
        place(track, whoosh(0.4), max(0, at - 0.1))

track /= max(1e-9, np.abs(track).max())
pcm = (track * 0.9 * 32767).astype(np.int16)
with wave.open(sys.argv[2], "wb") as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(SR)
    f.writeframes(pcm.tobytes())
print(sys.argv[2])
