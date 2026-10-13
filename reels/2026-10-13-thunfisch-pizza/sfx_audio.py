"""Procedural SFX + music track for the tuna pizza reel, synced to the cuts.

Everything is synthesised (no samples), so there are no licensing issues.
Cut times come from timeline.py. The beat runs at 128 BPM so the oven shot
lands on the downbeat of bar 4. Writes a 48 kHz stereo WAV with the full mix
plus one WAV per layer.

Usage: python3 sfx_audio.py <out_dir>
"""
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

import timeline as tl

SR = 48000
DUR = tl.DURATION
T = {k: v / tl.FPS for k, v in tl.STARTS.items()}  # output shot start times
BPM = 128
BEAT = 60 / BPM
rng = np.random.default_rng(11)


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


def karplus(f, sec=0.35, damp=0.996):
    n = int(sec * SR)
    period = int(SR / f)
    buf = rng.uniform(-1, 1, period)
    out = np.empty(n)
    for i in range(0, n, period):
        m = min(period, n - i)
        out[i:i + m] = buf[:m]
        buf = damp * 0.5 * (buf + np.roll(buf, -1))
    return out * np.exp(-np.linspace(0, 4, n))


def kick():
    sec = 0.35
    tt = np.arange(int(sec * SR)) / SR
    freq = 48 + 110 * np.exp(-tt * 28)
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-tt * 9)
    click = filt(noise(sec), "bandpass", [1500, 6000]) * np.exp(-tt * 300) * 0.4
    return norm(np.tanh(2 * (body + click)))


def clap():
    sec = 0.25
    n = int(sec * SR)
    tt = np.arange(n) / SR
    e = np.zeros(n)
    for d in (0, 0.011, 0.022):
        e += (tt >= d) * np.exp(-np.clip(tt - d, 0, None) * (140 if d < 0.02 else 22))
    return norm(filt(noise(sec), "bandpass", [900, 5000]) * e)


def hat(open_=False):
    sec = 0.22 if open_ else 0.05
    tt = np.arange(int(sec * SR)) / SR
    return norm(filt(noise(sec), "highpass", 7000, 4) * np.exp(-tt * (14 if open_ else 90)))


def bass_note(f, sec):
    n = int(sec * SR)
    tt = np.arange(n) / SR
    saw = 2 * ((f * tt) % 1) - 1
    x = filt(0.6 * saw + np.sin(2 * np.pi * f * tt), "lowpass", 380, 4)
    e = np.minimum(1, tt / 0.004) * np.exp(-tt * 3) * (1 - (tt / sec) ** 6)
    return norm(x * e)


CHORDS = [  # (bass root Hz, mandolin chord tones Hz) per bar: Am - F - C - G
    (110.0, [440.0, 523.25, 659.25]),
    (87.31, [349.23, 440.0, 523.25]),
    (130.81, [523.25, 659.25, 783.99]),
    (98.0, [392.0, 493.88, 587.33]),
]
KICKS = [0, 6, 10]          # 16th steps within a bar
CLAPS = [4, 12]
MUSIC_STOP = 14 * BEAT      # beat stops right before the final reveal


def music():
    s16 = BEAT / 4
    bars = int(np.ceil(MUSIC_STOP / (4 * BEAT)))
    for bar in range(bars):
        t0 = bar * 4 * BEAT
        root, tones = CHORDS[bar % 4]
        fill = bar == 2  # bar 3, beat 4: snare roll into the oven drop
        for step in range(16):
            t = t0 + step * s16
            if t >= MUSIC_STOP - 0.01:
                break
            in_fill = fill and step >= 12
            if step in KICKS and not in_fill:
                place("music", kick(), t, -6)
            if step in CLAPS and not in_fill:
                place("music", clap(), t, -11)
            if in_fill:
                place("music", clap(), t, -22 + (step - 12) * 3)
            elif step % 2 == 0:
                place("music", hat(step == 14), t, -21 if step % 4 else -18, 0.25)
            if step in (0, 6, 10) and not in_fill:
                length = {0: 6, 6: 4, 10: 6}[step] * s16
                place("music", bass_note(root, length), t, -9)
            if not in_fill:  # mandolin tremolo arpeggio
                f = tones[[0, 1, 2, 1][step % 4]] * (2 if step >= 8 and step % 8 == 7 else 1)
                place("music", karplus(f, 0.3), t, -20 if step % 2 else -17, -0.3 + 0.6 * (step % 2))
    # tape-stop style ending: one pitched-down bass + kick on the stop
    place("music", bass_note(55.0, 0.5), MUSIC_STOP, -10)


def build():
    # Ambience bed under everything
    place("ambience", room_tone(), 0, -34)
    music()

    # A hook: toppings rain onto the sauce (slow-mo, so the landings spread out)
    place("impacts", boom(), 0.0, -4)
    place("whoosh", whoosh(0.8, 4000, 400, 0.2), 0.0, -10, -0.2)
    for t in [0.45, 0.55, 0.66, 0.74, 0.83, 0.92, 1.0]:
        place("foley", plop(), t, -14, rng.uniform(-0.6, 0.6))

    # B flash-forward to the finished pizza
    place("whoosh", whoosh(0.3, 600, 6000), T["B"] - 0.22, -9, 0.4)
    place("impacts", boom(0.5, 90, 45), T["B"], -9)
    place("foley", sizzle(0.4), T["B"], -16)

    # C chef slaps flour
    place("whoosh", whoosh(0.3, 500, 3000), T["C"] - 0.2, -13, -0.4)
    place("foley", poof(0.7), T["C"] + 0.04, -8)
    place("foley", thud(), T["C"] + 0.08, -10)

    # D hands press dough
    place("foley", thud(), T["D"], -8)
    place("foley", thud(), T["D"] + 0.22, -12)
    place("foley", poof(0.35), T["D"] + 0.02, -16)

    # E sauce spiral
    place("whoosh", whoosh(0.25, 800, 4000), T["E"] - 0.18, -15, 0.3)
    place("foley", squelch(0.72), T["E"] + 0.02, -9)

    # F cheese sprinkle
    place("foley", sprinkle(0.92), T["F"], -11, 0.15)

    # H tuna placed
    place("whoosh", whoosh(0.25, 3000, 600), T["H"] - 0.15, -15, -0.3)
    place("foley", plop(220), T["H"] + 0.08, -11)
    place("foley", plop(260), T["H"] + 0.35, -13)

    # I pizza onto the peel
    place("whoosh", whoosh(0.3, 400, 2500), T["I"] - 0.2, -14, 0.5)
    place("foley", scrape(0.7), T["I"] + 0.05, -12, -0.2)

    # J zoom + time-lapse into the oven (bar 4 downbeat)
    place("whoosh", whoosh(0.45, 300, 5000, 0.85), T["J"] - 0.38, -6)
    place("impacts", boom(0.6, 70, 35), T["J"], -7)
    place("foley", fire(0.6), T["J"], -8)

    # K finished close-up
    place("impacts", boom(0.6, 95, 42), T["K"], -8)
    place("foley", sizzle(1.4), T["K"], -14)

    # L chef presents: ding + glint, then riser into the loop
    place("accents", ding(), T["L"] + 0.05, -8)
    place("accents", shimmer(0.7), T["L"] + 4 / tl.FPS, -20, 0.3)
    place("whoosh", riser(0.45), DUR - 0.45, -14)


def duck_envelope(n):
    """Pull the music down under the big impacts (simple side-chain)."""
    g = np.ones(n)
    for t in [0.0, T["B"], T["J"], T["K"]]:
        i = int(t * SR)
        rel = int(0.3 * SR)
        seg = 1 - 0.55 * np.exp(-np.linspace(0, 4, rel))
        g[i:i + rel] = np.minimum(g[i:i + rel], seg[: max(0, min(rel, n - i))])
    return g


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
        if name == "music":
            buf = reverb(buf, 0.5, 0.08) * duck_envelope(n)[:, None]
        elif name != "ambience":
            buf = reverb(buf)
        LAYERS[name] = buf
        mix += buf
    mix = np.tanh(mix * 1.2) / np.tanh(1.2)  # soft clip / glue
    fade = int(0.01 * SR)
    mix[:fade] *= np.linspace(0, 1, fade)[:, None]
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
    wavfile.write(os.path.join(out_dir, "sfx_mix.wav"), SR, (norm(mix, 0.89 * 0.78) * 32767).astype(np.int16))
    for name, buf in LAYERS.items():
        wavfile.write(os.path.join(out_dir, f"stem_{name}.wav"), SR, (np.clip(buf, -1, 1) * 32767).astype(np.int16))
    print("layers:", ", ".join(LAYERS))


if __name__ == "__main__":
    main(sys.argv[1])
