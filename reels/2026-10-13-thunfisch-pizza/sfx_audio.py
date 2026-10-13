"""Procedural SFX track for the tuna pizza reel, synced to the cuts.

Everything is synthesised (no samples), so there are no licensing issues.
Writes a 48 kHz stereo WAV with the full mix plus one WAV per layer.

Usage: python3 sfx_audio.py <out_dir>
"""
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
DUR = 179 / 24  # 7.458 s, matches the video
FPS = 24
rng = np.random.default_rng(11)


def t_of(frame):
    return frame / FPS


def env(n, attack, decay, curve=4.0):
    a = max(1, int(attack * SR))
    e = np.ones(n)
    e[:a] = np.linspace(0, 1, a) ** 2
    rest = n - a
    if rest > 0:
        e[a:] = np.exp(-curve * np.linspace(0, 1, rest)) * (1 - np.linspace(0, 1, rest) ** 8)
    return e


def filt(x, kind, freq, order=2):
    sos = butter(order, freq, btype=kind, fs=SR, output="sos")
    return sosfilt(sos, x)


def noise(sec):
    return rng.standard_normal(int(sec * SR))


def pink(sec):
    n = int(sec * SR)
    spec = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    spec[1:] /= np.sqrt(f[1:])
    x = np.fft.irfft(spec, n)
    return x / np.abs(x).max()


def sweep_bp(x, f0, f1, q=1.2):
    """State-variable band-pass whose centre sweeps exponentially f0 -> f1."""
    n = len(x)
    fc = f0 * (f1 / f0) ** np.linspace(0, 1, n)
    g = np.tan(np.pi * fc / SR)
    k = 1 / q
    ic1 = ic2 = 0.0
    out = np.empty(n)
    for i in range(n):
        gi = g[i]
        a1 = 1 / (1 + gi * (gi + k))
        v1 = a1 * ic1 + gi * a1 * (x[i] - ic2)
        v2 = ic2 + gi * v1
        ic1 = 2 * v1 - ic1
        ic2 = 2 * v2 - ic2
        out[i] = v1
    return out


def norm(x, peak=1.0):
    m = np.abs(x).max()
    return x / m * peak if m else x


# ---- sound generators -------------------------------------------------------

def whoosh(sec=0.45, f0=300, f1=4000, peak_at=0.7):
    x = sweep_bp(noise(sec), f0, f1, q=0.9)
    n = len(x)
    p = int(n * peak_at)
    e = np.concatenate([np.linspace(0, 1, p) ** 2.5, np.linspace(1, 0, n - p) ** 1.5])
    return norm(x * e)


def boom(sec=0.9, f0=110, f1=38):
    n = int(sec * SR)
    tt = np.arange(n) / SR
    freq = f1 + (f0 - f1) * np.exp(-tt * 9)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    body = np.sin(phase) * np.exp(-tt * 4.2)
    click = filt(noise(sec), "lowpass", 2500) * np.exp(-tt * 60) * 0.6
    return norm(np.tanh(1.6 * (body + click)))


def plop(f0=None):
    sec = 0.09
    n = int(sec * SR)
    tt = np.arange(n) / SR
    f0 = f0 or rng.uniform(260, 480)
    freq = f0 * np.exp(-tt * 18) + 90
    s = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-tt * 45)
    nz = filt(noise(sec), "bandpass", [600, 3000]) * np.exp(-tt * 90) * 0.5
    return norm(s + nz)


def poof(sec=0.6):
    x = filt(noise(sec), "lowpass", 1400, 4)
    x = filt(x, "highpass", 120)
    return norm(x * env(len(x), 0.02, sec, 5))


def thud():
    sec = 0.18
    n = int(sec * SR)
    tt = np.arange(n) / SR
    low = np.sin(2 * np.pi * (85 + 40 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 22)
    slap = filt(noise(sec), "bandpass", [900, 3500]) * np.exp(-tt * 80) * 0.7
    return norm(low + slap)


def squelch(sec=0.7):
    x = noise(sec)
    n = len(x)
    lo = sweep_bp(x[: n // 2], 350, 1100, q=3)
    hi = sweep_bp(x[n // 2:], 1100, 450, q=3)
    wet = np.concatenate([lo, hi])
    am = 0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(rng.uniform(4, 11, n)) / SR)
    bubbles = np.zeros(n)
    for _ in range(9):
        p = plop(rng.uniform(500, 900)) * 0.35
        i = rng.integers(0, n - len(p))
        bubbles[i:i + len(p)] += p
    return norm((wet * am + bubbles) * env(n, 0.05, sec, 2))


def sprinkle(sec=0.9, rate=180):
    n = int(sec * SR)
    out = np.zeros(n)
    grain = int(0.004 * SR)
    for _ in range(int(sec * rate)):
        i = rng.integers(0, n - grain)
        g = rng.standard_normal(grain) * np.exp(-np.linspace(0, 8, grain))
        out[i:i + grain] += g * rng.uniform(0.2, 1.0)
    out = filt(out, "highpass", 2500)
    return norm(out * env(n, 0.08, sec, 1.5))


def scrape(sec=0.7):
    x = filt(noise(sec), "bandpass", [1200, 3200], 2)
    n = len(x)
    am = 0.5 + 0.5 * np.abs(np.sin(np.linspace(0, 9 * np.pi, n)))
    wood = filt(noise(sec), "bandpass", [180, 500]) * 0.5
    return norm((x * am + wood) * env(n, 0.06, sec, 2.5))


def fire(sec=1.0):
    n = int(sec * SR)
    roar = filt(np.cumsum(noise(sec)) / 200, "bandpass", [40, 450], 2)
    roar *= 0.7 + 0.3 * filt(noise(sec), "lowpass", 6) * 8
    crackle = np.zeros(n)
    for _ in range(int(sec * 40)):
        i = rng.integers(0, n - 200)
        crackle[i:i + 200] += rng.standard_normal(200) * np.exp(-np.linspace(0, 10, 200)) * rng.uniform(0.2, 1)
    crackle = filt(crackle, "bandpass", [1800, 7000])
    return norm((norm(roar) + 0.45 * norm(crackle)) * env(n, 0.12, sec, 1.2))


def sizzle(sec=0.6):
    x = filt(noise(sec), "highpass", 4500, 4)
    n = len(x)
    gran = (rng.uniform(0, 1, n // 240 + 1) ** 3).repeat(240)[:n]
    return norm(x * (0.4 + gran) * env(n, 0.03, sec, 2.5))


def ding(f=1568.0, sec=1.4):
    n = int(sec * SR)
    tt = np.arange(n) / SR
    out = np.zeros(n)
    for ratio, amp, dec in [(1, 1, 3.0), (2.76, 0.45, 5), (5.4, 0.25, 8), (8.93, 0.12, 12)]:
        out += amp * np.sin(2 * np.pi * f * ratio * tt) * np.exp(-tt * dec)
    out *= 1 - np.exp(-tt * 800)
    return norm(out)


def shimmer(sec=0.8):
    n = int(sec * SR)
    tt = np.arange(n) / SR
    out = np.zeros(n)
    for f in [2637, 3136, 3951, 4699, 5274]:
        out += np.sin(2 * np.pi * f * tt + rng.uniform(0, 6)) * (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(5, 9) * tt))
    return norm(out * env(n, 0.15, sec, 3))


def riser(sec=0.5):
    x = filt(noise(sec), "highpass", 1500)
    n = len(x)
    return norm(x * np.linspace(0, 1, n) ** 3)


def room_tone():
    x = filt(pink(DUR + 0.1), "lowpass", 900)
    x = filt(x, "highpass", 60)
    return norm(x)[: int(DUR * SR)]


# ---- arrangement ------------------------------------------------------------

LAYERS = {}


def place(layer, sound, t, gain_db, pan=0.0):
    buf = LAYERS.setdefault(layer, np.zeros((int(DUR * SR) + SR, 2)))
    i = int(t * SR)
    if i < 0:
        sound = sound[-i:]
        i = 0
    seg = sound[: buf.shape[0] - i]
    g = 10 ** (gain_db / 20)
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(seg), 0] += seg * g * l * 1.414
    buf[i:i + len(seg), 1] += seg * g * r * 1.414


def build():
    # Ambience bed under everything
    place("ambience", room_tone(), 0, -34)

    # A 0.00 hook: ingredients rain onto the sauce
    place("impacts", boom(), 0.0, -4)
    place("whoosh", whoosh(0.55, 4000, 400, 0.2), 0.0, -10, -0.2)
    for j, t in enumerate([0.30, 0.36, 0.41, 0.47, 0.52, 0.56]):
        place("foley", plop(), t, -14, rng.uniform(-0.6, 0.6))

    # B 0.625 flash-forward to the finished pizza
    place("whoosh", whoosh(0.3, 600, 6000), t_of(15) - 0.22, -9, 0.4)
    place("impacts", boom(0.5, 90, 45), t_of(15), -9)
    place("foley", sizzle(0.4), t_of(15), -16)

    # C 1.04 chef slaps flour
    place("whoosh", whoosh(0.3, 500, 3000), t_of(25) - 0.2, -13, -0.4)
    place("foley", poof(0.7), t_of(25) + 0.04, -8)
    place("foley", thud(), t_of(25) + 0.08, -10)

    # D 1.75 hands press dough
    place("foley", thud(), t_of(42), -8)
    place("foley", thud(), t_of(42) + 0.22, -12)
    place("foley", poof(0.35), t_of(42) + 0.02, -16)

    # E 2.17 sauce spiral
    place("whoosh", whoosh(0.25, 800, 4000), t_of(52) - 0.18, -15, 0.3)
    place("foley", squelch(0.72), t_of(52) + 0.02, -9)

    # F 2.875 cheese sprinkle
    place("foley", sprinkle(0.92), t_of(69), -11, 0.15)

    # G 3.79 toppings drop
    place("whoosh", whoosh(0.4, 3500, 350, 0.35), t_of(91) - 0.12, -9, -0.3)
    place("impacts", boom(0.7, 100, 40), t_of(91), -6)
    for t in [3.93, 3.98, 4.03, 4.08]:
        place("foley", plop(), t, -14, rng.uniform(-0.5, 0.5))

    # H 4.125 tuna placed
    place("foley", plop(220), t_of(99) + 0.08, -12)
    place("foley", plop(260), t_of(99) + 0.35, -14)

    # I 4.71 pizza onto the peel
    place("whoosh", whoosh(0.3, 400, 2500), t_of(113) - 0.2, -14, 0.5)
    place("foley", scrape(0.7), t_of(113) + 0.05, -12, -0.2)

    # J 5.5 zoom into the oven
    place("whoosh", whoosh(0.45, 300, 5000, 0.85), t_of(132) - 0.38, -6)
    place("impacts", boom(0.6, 70, 35), t_of(132), -9)
    place("foley", fire(0.85), t_of(132), -8)

    # K 6.29 finished close-up
    place("impacts", boom(0.6, 95, 42), t_of(152), -8)
    place("foley", sizzle(0.7), t_of(152), -13)

    # L 6.75 chef presents: ding + glint, then riser into the loop
    place("accents", ding(), t_of(162) + 0.05, -9)
    place("accents", shimmer(0.7), t_of(166), -20, 0.3)
    place("whoosh", riser(0.45), DUR - 0.45, -14)


def reverb(x, sec=0.7, mix=0.14):
    n = int(sec * SR)
    ir = rng.standard_normal((n, 2)) * np.exp(-np.linspace(0, 7, n))[:, None]
    ir = filt(ir.T, "lowpass", 5000).T
    wet = np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], 1)
    wet = norm(wet, np.abs(x).max())
    return x * (1 - mix) + wet * mix


def main(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    build()
    n = int(DUR * SR)
    mix = np.zeros((n, 2))
    for name, buf in LAYERS.items():
        buf = buf[:n]
        if name != "ambience":
            buf = reverb(buf)
        LAYERS[name] = buf
        mix += buf
    mix = np.tanh(mix * 1.2) / np.tanh(1.2)  # soft clip / glue
    fade = int(0.01 * SR)
    mix[:fade] *= np.linspace(0, 1, fade)[:, None]
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
    wavfile.write(os.path.join(out_dir, "sfx_mix.wav"), SR, (norm(mix, 0.89) * 32767).astype(np.int16))
    for name, buf in LAYERS.items():
        wavfile.write(os.path.join(out_dir, f"stem_{name}.wav"), SR, (np.clip(buf, -1, 1) * 32767).astype(np.int16))
    print("layers:", ", ".join(LAYERS))


if __name__ == "__main__":
    main(sys.argv[1])
