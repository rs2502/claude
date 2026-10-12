"""Deterministic soundtrack for the Italia reel (15 s, 100 BPM, one beat = 0.6 s).

Plucked guitar arpeggios, mandolin tremolo, upright bass and a shaker, all
Karplus-Strong synthesis with seeded noise; scene cuts (3.0 / 6.6 / 10.2 /
12.6 s) land on beats. Re-running gives a byte-identical WAV.

    python3 scripts/sound.py   ->  assets/audio/soundtrack.wav
"""

import wave
from pathlib import Path

import numpy as np

SR = 48000
DUR = 15.0
N = int(SR * DUR)
BEAT = 0.6
rng = np.random.default_rng(1994)

dry = np.zeros((N, 2))
send = np.zeros((N, 2))


def place(sig, at, gain=1.0, pan=0.0, rev=0.0):
    i = int(at * SR)
    if i >= N or i < 0:
        return
    sig = sig[: N - i] * gain
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    dry[i : i + len(sig), 0] += sig * l
    dry[i : i + len(sig), 1] += sig * r
    if rev:
        send[i : i + len(sig), 0] += sig * l * rev
        send[i : i + len(sig), 1] += sig * r * rev


def ks(freq, dur, bright=0.5, decay=0.996):
    """Karplus-Strong plucked string, computed one period-block at a time."""
    n = int(dur * SR)
    p = max(2, int(round(SR / freq)))
    y = np.zeros(n + p + 1)
    exc = rng.uniform(-1, 1, p)
    # soften the excitation (darker pluck when bright is low)
    for _ in range(int((1 - bright) * 4)):
        exc = 0.5 * (exc + np.roll(exc, 1))
    y[1 : p + 1] = exc
    k = p + 1
    while k < n + p + 1:
        e = min(k + p, n + p + 1)
        y[k:e] = decay * 0.5 * (y[k - p : e - p] + y[k - p - 1 : e - p - 1])
        k = e
    out = y[p + 1 :][:n]
    t = np.arange(n) / SR
    return out * np.minimum(1, (dur - t) / 0.05)


def noise_hit(dur, tau, hp=6000):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    a = 1 - np.exp(-2 * np.pi * hp / SR)
    lp = np.empty(n)
    s = 0.0
    for i in range(n):
        s += a * (x[i] - s)
        lp[i] = s
    t = np.arange(n) / SR
    return (x - lp) * np.exp(-t / tau)


def whoosh(dur, rise=True):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    u = np.linspace(0, 1, n)
    cut = (300 * (20 ** u)) if rise else (6000 * (0.05 ** u))
    a = 1 - np.exp(-2 * np.pi * cut / SR)
    y = np.empty(n)
    s = 0.0
    for i in range(n):
        s += a[i] * (x[i] - s)
        y[i] = s
    env = np.sin(np.pi * u) ** 2
    return y * env * 2.5


def thud(dur=0.5, f0=140, f1=45, tau=0.14):
    t = np.arange(int(dur * SR)) / SR
    f = f1 + (f0 - f1) * np.exp(-t / 0.03)
    return np.tanh(1.5 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / tau))


def chime(f, dur=1.6):
    t = np.arange(int(dur * SR)) / SR
    y = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / (0.9 / m)) for m, a in ((1, 1), (2.76, 0.4), (5.4, 0.2)))
    return y * (1 - np.exp(-t / 0.002)) * 0.4


def hz(name):
    idx = {"C": -9, "C#": -8, "D": -7, "Eb": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "Bb": 1, "B": 2}
    return 440 * 2 ** ((idx[name[:-1]] + 12 * (int(name[-1]) - 4)) / 12)


# ---- harmony: one chord per bar (4 beats = 2.4 s) ----
CHORDS = [
    ("C3", ["C3", "G3", "C4", "E4", "G4", "E4", "C4", "G3"]),
    ("A2", ["A2", "E3", "A3", "C4", "E4", "C4", "A3", "E3"]),
    ("F2", ["F2", "C3", "F3", "A3", "C4", "A3", "F3", "C3"]),
    ("G2", ["G2", "D3", "G3", "B3", "D4", "B3", "G3", "D3"]),
    ("C3", ["C3", "G3", "C4", "E4", "G4", "E4", "C4", "G3"]),
    ("F2", ["F2", "C3", "F3", "A3", "C4", "A3", "F3", "C3"]),
    ("C3", ["C3", "G3", "C4", "E4"]),
]
MELODY = [  # (beat, note, beats) — mandolin tremolo line
    (4, "E5", 2), (6, "D5", 1), (7, "C5", 1),
    (8, "C5", 2), (10, "E5", 1), (11, "A5", 1),
    (12, "A5", 2), (14, "G5", 1), (15, "F5", 1),
    (16, "D5", 2), (18, "B4", 1), (19, "D5", 1),
    (20, "E5", 2), (22, "G5", 2),
    (21.5, "F5", 0.5),
    (24, "E5", 1),
]

for bar, (root, arp) in enumerate(CHORDS):
    t0 = bar * 4 * BEAT
    # guitar arpeggio in eighths
    for i, n in enumerate(arp):
        t = t0 + i * BEAT / 2
        if t >= DUR - 0.05:
            break
        place(ks(hz(n), 1.6, bright=0.25, decay=0.997), t, 0.32, pan=-0.25 + 0.5 * (i % 2), rev=0.25)
    # upright bass on 1 and 3
    if t0 < DUR:
        place(ks(hz(root) / 2 * 2, 1.2, bright=0.1, decay=0.995), t0, 0.55, rev=0.05)
    if t0 + 2 * BEAT < DUR - 0.3 and bar < 6:
        fifth = hz(root) * 1.5
        place(ks(fifth, 1.0, bright=0.1, decay=0.995), t0 + 2 * BEAT, 0.4, rev=0.05)

# mandolin tremolo: rapid re-plucks of the melody note
for beat, note, length in MELODY:
    t0 = beat * BEAT
    steps = int(length * BEAT / 0.075)
    for k in range(steps):
        t = t0 + k * 0.075
        if t >= DUR - 0.1:
            break
        g = 0.13 * (0.85 + 0.15 * ((k % 2) == 0))
        place(ks(hz(note), 0.35, bright=0.5, decay=0.99), t, g * 0.8, pan=0.3, rev=0.35)

# shaker on eighths from bar 2, softer on the off-beats
t = 4 * BEAT
while t < 12.6:
    off = round(t / (BEAT / 2)) % 2
    place(noise_hit(0.08, 0.018), t, 0.05 if off else 0.03, pan=0.45)
    t += BEAT / 2

# ---- sound design on picture cues ----
place(chime(hz("E6")), 1.58, 0.25, pan=0.3, rev=0.6)  # flag tick pops
place(chime(hz("B5")), 1.66, 0.15, pan=0.4, rev=0.6)
place(whoosh(0.6), 2.55, 0.18)  # logo lifts away
place(whoosh(0.7, rise=False), 2.95, 0.28, pan=0.2)  # burrata rises in
place(whoosh(0.55), 6.05, 0.22, pan=0.6)  # plate exits right
place(whoosh(0.7, rise=False), 6.55, 0.28, pan=-0.4)  # carpaccio enters left
place(whoosh(0.55), 9.65, 0.22)
place(whoosh(0.7, rise=False), 10.2, 0.25)
place(whoosh(0.5), 12.1, 0.2)
place(thud(0.6), 13.8, 0.7, rev=0.3)  # stamp lands
place(noise_hit(0.25, 0.05, hp=1500), 13.8, 0.25)
# final ring: C major add9 swell under the end card
for i, n in enumerate(("C4", "E4", "G4", "D5", "G5")):
    place(ks(hz(n), 2.2, bright=0.6, decay=0.9985), 13.8 + i * 0.06, 0.18, pan=-0.4 + i * 0.2, rev=0.6)

# ---- reverb + master ----
ir_n = int(1.8 * SR)
ir_t = np.arange(ir_n) / SR
ir = rng.standard_normal((ir_n, 2)) * np.exp(-ir_t / 0.55)[:, None]
ir /= np.sqrt((ir**2).sum(axis=0))
size = 1 << int(np.ceil(np.log2(N + ir_n)))
wet = np.stack([np.fft.irfft(np.fft.rfft(send[:, c], size) * np.fft.rfft(ir[:, c], size), size)[:N] for c in range(2)], axis=1)
mix = dry + wet * 0.45
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.3)
fade_in = np.minimum(1, np.arange(N) / (0.03 * SR))
fade_out = np.ones(N)
fade_out[-int(0.5 * SR) :] = np.linspace(1, 0, int(0.5 * SR)) ** 1.5
mix *= (fade_in * fade_out)[:, None]
size2 = 1 << int(np.ceil(np.log2(N)))
over = np.stack([np.fft.irfft(np.fft.rfft(mix[:, c], size2), size2 * 4) * 4 for c in range(2)], axis=1)
mix *= 0.80 / np.max(np.abs(over))  # true-peak headroom for AAC

out = Path(__file__).resolve().parent.parent / "assets" / "audio" / "soundtrack.wav"
out.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(out), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("wrote", out)
