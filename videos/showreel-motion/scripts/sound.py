"""Deterministic sound design for the showreel.

Every cue below is pinned to a timeline time in index.html, so picture and
sound share one clock. Pure numpy synthesis, seeded noise: re-running this
script produces a byte-identical WAV.

    python3 scripts/sound.py   ->  assets/audio/soundtrack.wav
"""

import wave
from pathlib import Path

import numpy as np

SR = 48000
DUR = 15.0
N = int(SR * DUR)
rng = np.random.default_rng(1981)  # The Illusion of Life

dry = np.zeros((N, 2))
wet_send = np.zeros((N, 2))


def t_axis(d):
    return np.arange(int(d * SR)) / SR


def place(sig, at, gain=1.0, pan=0.0, send=0.0):
    """Mix a mono signal into the stereo bus at time `at` (seconds)."""
    i = int(at * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    dry[i : i + len(sig), 0] += sig * l
    dry[i : i + len(sig), 1] += sig * r
    if send:
        wet_send[i : i + len(sig), 0] += sig * l * send
        wet_send[i : i + len(sig), 1] += sig * r * send


def onepole_lp(x, cutoff):
    """One-pole lowpass with a per-sample (or constant) cutoff in Hz."""
    cutoff = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = 1.0 - np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    s = 0.0
    for n in range(len(x)):
        s += a[n] * (x[n] - s)
        y[n] = s
    return y


def env_exp(d, tau):
    return np.exp(-t_axis(d) / tau)


def thud(d=0.45, f0=150, f1=42, tau=0.12, click=0.35):
    t = t_axis(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.03)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / tau)
    c = rng.standard_normal(len(t)) * np.exp(-t / 0.004) * click
    return np.tanh(1.6 * (body + c))


def whoosh(d, f_from, f_to, tau_in=0.6, peak=0.75):
    """Filtered noise sweep; `peak` is where (0..1) the swell peaks."""
    n = int(d * SR)
    x = rng.standard_normal(n)
    u = np.linspace(0, 1, n)
    cut = f_from * (f_to / f_from) ** u
    lp = onepole_lp(x, cut)
    hp = lp - onepole_lp(lp, cut * 0.25)
    shape = np.where(u < peak, (u / peak) ** 2, np.exp(-(u - peak) / (1 - peak + 1e-9) * 4))
    return hp * shape * 1.8


def blip(f, d=0.07, tau=0.018):
    t = t_axis(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-t / tau) * (1 - np.exp(-t / 0.0008))


def click(f=3200, d=0.03):
    t = t_axis(d)
    n = rng.standard_normal(len(t))
    hp = n - onepole_lp(n, 2500)
    return (hp * 0.6 + np.sin(2 * np.pi * f * t)) * np.exp(-t / 0.004)


def pluck(f, d=0.55, bright=1.0):
    t = t_axis(d)
    y = np.zeros_like(t)
    for k, a in ((1, 1.0), (2, 0.5 * bright), (3, 0.28 * bright), (4, 0.14 * bright), (5, 0.07 * bright)):
        y += a * np.sin(2 * np.pi * f * k * t) * np.exp(-t / (0.32 / k))
    return y * (1 - np.exp(-t / 0.002)) * 0.6


def hat(d=0.05):
    t = t_axis(d)
    n = rng.standard_normal(len(t))
    return (n - onepole_lp(n, 7000)) * np.exp(-t / 0.012)


def pad(freqs, d, attack=0.4, release=0.6, bright=0.4):
    t = t_axis(d)
    y = np.zeros_like(t)
    for i, f in enumerate(freqs):
        det = 1 + 0.0025 * ((i % 3) - 1)
        for k in range(1, 6):
            y += np.sin(2 * np.pi * f * det * k * t + i) * (bright ** (k - 1)) / k
    env = np.minimum(1, t / attack) * np.minimum(1, (d - t) / release)
    return y / len(freqs) * np.clip(env, 0, 1)


def glitch(d=0.28):
    n = int(d * SR)
    y = np.zeros(n)
    seg = int(0.018 * SR)
    for s in range(0, n, seg):
        f = rng.choice([180, 330, 740, 1210, 2900, 95])
        t = np.arange(min(seg, n - s)) / SR
        y[s : s + len(t)] = np.sign(np.sin(2 * np.pi * f * t)) * rng.uniform(0.3, 1.0)
    y = np.round(y * 4) / 4  # bitcrush
    return y * 0.5


def note(name):
    names = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    return 440.0 * 2 ** ((names[name[:-1]] + 12 * (int(name[-1]) - 4)) / 12)


# ---------------- S1 PHYSICS (0 – 2.3) ----------------
place(whoosh(0.42, 2500, 400, peak=0.9), 0.15, 0.25, pan=-0.1)
place(thud(), 0.57, 0.95)
place(whoosh(0.26, 600, 1800, peak=0.3), 0.64, 0.12)
place(thud(0.3, 170, 60, tau=0.07), 1.14, 0.6)
place(whoosh(0.45, 1500, 9000, peak=0.25), 1.32, 0.3, send=0.3)  # line zip
for i in range(6):
    place(click(2400 + i * 260), 1.38 + i * 0.045 + 0.12, 0.25, pan=-0.6 + i * 0.24)
riser = whoosh(0.32, 300, 6000, peak=0.98)
place(riser, 1.98, 0.5, send=0.2)

# ---------------- S2 EASING (2.3 – 5.1) ----------------
place(thud(0.6, 120, 38, tau=0.2, click=0.6), 2.3, 1.0, send=0.25)
for i in range(9):
    place(blip(1800 + i * 90, tau=0.012), 2.36 + i * 0.03, 0.08, pan=-0.5 + i * 0.12)
word_notes = ["A3", "C4", "E4", "A4"]
for i, t in enumerate([2.7, 3.25, 3.8, 4.35]):
    place(pluck(note(word_notes[i]), bright=1.2), t, 0.55, send=0.4)
    place(pluck(note(word_notes[i]) * 2, d=0.3, bright=0.4), t, 0.15, pan=0.4, send=0.3)
# bounce.out → three little re-hits; elastic.out → wobble
for dt, g in ((0.18, 0.3), (0.34, 0.18), (0.44, 0.1)):
    place(blip(note("C5"), 0.06), 3.25 + dt, g)
for k in range(4):
    place(blip(note("E5") * (1 + 0.03 * (-1) ** k), 0.05), 3.8 + 0.06 + k * 0.07, 0.18 * 0.6**k)
place(whoosh(0.32, 400, 5000, peak=0.95), 4.8, 0.45, send=0.3)

# ---------------- S3 RHYTHM (5.1 – 7.6) ----------------
place(thud(0.4, 140, 50, tau=0.1), 5.1, 0.8)
scale = [note(n) for n in ("A4", "C5", "D5", "E5", "G5", "A5", "C6")]
for i in range(24):
    place(blip(scale[(i * 3) % 7], 0.05, 0.01), 5.12 + i * 0.019, 0.12, pan=np.sin(i * 1.7) * 0.8)
for i in range(12):
    place(click(1800 + 120 * i, 0.02), 5.72 + i * 0.035, 0.1, pan=-0.8 + i * 0.14)
place(thud(0.3, 200, 70, tau=0.06), 5.88, 0.55)
place(whoosh(0.4, 4000, 900, peak=0.2), 5.88, 0.2)
for i in range(16):
    place(blip(scale[i % 7] * 2, 0.04, 0.008), 6.38 + i * 0.025, 0.07, pan=-0.9 + i * 0.12)
suck = whoosh(0.62, 200, 7000, peak=0.97)
place(suck, 6.98, 0.55, send=0.2)

# ---------------- S4 TIMING (7.6 – 10.0) ----------------
place(thud(0.7, 110, 34, tau=0.25, click=0.7), 7.6, 1.0, send=0.3)
for i in range(30):
    place(click(2600 + (i % 2) * 400, 0.018), 7.75 + i * (1.1 / 30), 0.22, pan=-0.7 + i * 0.047)
place(pluck(note("A5"), d=0.4), 8.86, 0.25, send=0.5)
place(whoosh(0.22, 800, 6000, peak=0.95), 9.0, 0.4)
place(thud(0.6, 160, 36, tau=0.18, click=0.9), 9.22, 1.0, send=0.35)
place(glitch(), 9.72, 0.45)

# ---------------- S5 PRINCIPLES (10.0 – 12.4) ----------------
place(thud(0.5, 130, 40, tau=0.15, click=0.8), 10.0, 0.95)
place(whoosh(0.25, 3000, 800, peak=0.2), 10.0, 0.25)
for k in range(1, 12):
    t = 10.25 + (k - 1) * 0.135
    place(click(1500 + k * 60, 0.025), t, 0.45, pan=0.15)
    place(thud(0.08, 600, 300, tau=0.015, click=0.2), t, 0.25)
place(whoosh(0.44, 300, 9000, peak=0.98), 11.96, 0.7, send=0.3)

# ---------------- S6 RESOLVE (12.4 – 15.0) ----------------
place(thud(0.9, 100, 30, tau=0.35, click=0.9), 12.4, 1.0, send=0.4)
t = t_axis(0.4)
fall = np.sin(2 * np.pi * np.cumsum(2200 * (300 / 2200) ** (t / 0.4)) / SR) * 0.15 * (t / 0.4)
place(fall, 12.85, 0.5)
place(thud(0.6, 180, 45, tau=0.16), 13.25, 0.95)
place(thud(0.25, 220, 80, tau=0.05), 13.51 + 0.18, 0.4)
place(whoosh(0.8, 6000, 900, peak=0.08), 13.27, 0.25, send=0.6)
resolve = pad([note(n) for n in ("A2", "E3", "C#4", "G#4", "B4")], 1.75, attack=0.05, release=0.9, bright=0.55)
place(resolve, 13.25, 0.55, send=0.7)
for i, n in enumerate(("E5", "G#5", "B5", "E6")):
    place(pluck(note(n), d=0.9, bright=0.6), 13.55 + i * 0.08, 0.12, pan=-0.3 + i * 0.2, send=0.8)

# ---------------- bed + groove (2.3 – 12.4) ----------------
place(pad([note(n) for n in ("A2", "E3", "B3", "C4")], 10.1, attack=1.2, release=0.4, bright=0.35), 2.3, 0.16, send=0.3)
sub = np.sin(2 * np.pi * note("A1") * t_axis(10.1)) * np.minimum(1, t_axis(10.1) / 0.5) * np.minimum(1, (10.1 - t_axis(10.1)) / 0.3)
place(sub, 2.3, 0.14)
beat = 0.55
k = 0
while 2.7 + k * beat / 2 < 11.9:
    tt = 2.7 + k * beat / 2
    place(hat(), tt, 0.09 if k % 2 else 0.05, pan=0.35 if k % 2 else -0.35)
    if k % 2 == 0 and not (5.0 < tt < 5.2 or 7.5 < tt < 7.7 or 9.1 < tt < 9.3 or 9.7 < tt < 10.1):
        place(thud(0.25, 130, 48, tau=0.07, click=0.25), tt, 0.35)
    k += 1

# ---------------- reverb (FFT convolution) + master ----------------
ir_len = int(1.6 * SR)
ir_t = np.arange(ir_len) / SR
ir = rng.standard_normal((ir_len, 2)) * np.exp(-ir_t / 0.45)[:, None]
ir[:, 0] = onepole_lp(ir[:, 0], 5000)
ir[:, 1] = onepole_lp(ir[:, 1], 5000)
ir /= np.sqrt((ir**2).sum(axis=0))
size = 1 << int(np.ceil(np.log2(N + ir_len)))
wet = np.stack(
    [np.fft.irfft(np.fft.rfft(wet_send[:, c], size) * np.fft.rfft(ir[:, c], size), size)[:N] for c in range(2)],
    axis=1,
)
mix = dry + wet * 0.5
mix = np.tanh(mix / np.max(np.abs(mix)) * 3.2)  # drive into soft saturation
fade = np.ones(N)
fade[-int(0.35 * SR) :] = np.linspace(1, 0, int(0.35 * SR)) ** 1.5
mix *= fade[:, None]
# true-peak safe: measure the 4x-oversampled peak, land it at -1.5 dBTP
size2 = 1 << int(np.ceil(np.log2(N)))
over = np.stack([np.fft.irfft(np.fft.rfft(mix[:, ch], size2), size2 * 4) * 4 for ch in range(2)], axis=1)
mix *= 0.84 / np.max(np.abs(over))

out = Path(__file__).resolve().parent.parent / "assets" / "audio" / "soundtrack.wav"
out.parent.mkdir(parents=True, exist_ok=True)
pcm = (mix * 32767).astype("<i2")
with wave.open(str(out), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", out, f"{N / SR:.2f}s")
