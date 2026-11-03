"""Original 15 s score for the showreel: 120 BPM, F major, synthesized from scratch with numpy."""
import numpy as np, sys

SR = 48000
DUR = 15.0
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(7)

def t_(d): return np.arange(int(SR * d)) / SR
def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)

def fft_filter(x, lo=None, hi=None, slope=1.0):
    """Zero-phase spectral band filter with soft edges."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    if hi: g *= 1 / (1 + (f / hi) ** (4 * slope))
    if lo: g *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** (4 * slope))
    return np.fft.irfft(X * g, len(x))

def put(bus, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(bus): return
    j = min(len(bus), i + len(sig))
    bus[i:j] += sig[: j - i] * gain

def saw(freq, d, detune=0.0):
    ph = np.cumsum(np.full(int(SR * d), freq * 2 ** (detune / 1200) / SR)) + rng.random()
    return 2 * (ph % 1.0) - 1

def env(d, a=0.005, dec=0.3, sus=0.0, rel=None):
    t = t_(d)
    e = np.minimum(1, t / max(a, 1e-4)) * (sus + (1 - sus) * np.exp(-(t - a).clip(0) / dec))
    if rel:
        e *= np.clip((d - t) / rel, 0, 1)
    return e

# ---------------- instruments ----------------
def kick(strength=1.0, d=0.42):
    t = t_(d)
    f = 45 + 110 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.16)
    click = fft_filter(rng.standard_normal(len(t)), lo=2000) * np.exp(-t / 0.004) * 0.25
    return np.tanh((body + click) * 1.6 * strength) * 0.9

def clap():
    d = 0.35; t = t_(d)
    n = fft_filter(rng.standard_normal(len(t)), lo=900, hi=3800)
    e = np.zeros_like(t)
    for k, o in enumerate([0, 0.011, 0.022]):
        e += (t >= o) * np.exp(-(t - o).clip(0) / 0.006) * (0.7 if k < 2 else 1)
    e += (t >= 0.022) * np.exp(-(t - 0.022).clip(0) / 0.11) * 0.55
    return n / np.abs(n).max() * e * 0.6

def hat(d=0.05, dec=0.012):
    t = t_(d)
    n = fft_filter(rng.standard_normal(len(t)), lo=7000)
    return n / np.abs(n).max() * np.exp(-t / dec) * 0.5

def bass_note(m, d=0.22):
    f = mtof(m)
    s = saw(f, d) * 0.6 + np.sin(2 * np.pi * f * t_(d)) * 0.7
    s = fft_filter(s, hi=420)
    return s * env(d, 0.004, 0.16, 0.35, 0.03)

def arp_note(m, d=0.16):
    f = mtof(m); t = t_(d)
    s = np.zeros_like(t)
    for h in (1, 3, 5, 7, 9):
        s += np.sin(2 * np.pi * f * h * t) / h          # band-limited square
    s += 0.5 * saw(f * 2, d, 7)
    s = fft_filter(s, hi=5200)
    return s * env(d, 0.002, 0.055, 0.0) * 0.32

def pad(chord, d=2.6, bright=2600, gain=1.0):
    out = np.zeros(int(SR * d))
    for m in chord:
        for dt in (-12, -5, 0, 5, 12):
            out += saw(mtof(m), d, dt) * 0.18
    out = fft_filter(out, lo=90, hi=bright)
    return out * env(d, 0.008, 0.9, 0.18, 0.4) * gain * 0.55

def noise_whoosh(d=0.45, f0=600, f1=5000, peak=0.6, gain=0.35):
    """Noise swept through a moving band, swelling to `peak` fraction then dying."""
    n = rng.standard_normal(int(SR * d))
    out = np.zeros_like(n); hop = 1024
    for i in range(0, len(n), hop):
        p = i / len(n)
        fc = f0 * (f1 / f0) ** p
        seg = n[i:i + hop * 2]
        out[i:i + len(seg)] += fft_filter(seg, lo=fc * 0.6, hi=fc * 1.6) * np.hanning(len(seg)) if len(seg) > 8 else 0
    t = np.linspace(0, 1, len(n))
    e = np.where(t < peak, (t / peak) ** 2, np.exp(-(t - peak) / 0.12))
    return out / (np.abs(out).max() + 1e-9) * e * gain

def ui_click(gain=0.55):
    d = 0.06; t = t_(d)
    s = np.sin(2 * np.pi * 2100 * t) * np.exp(-t / 0.008)
    s += fft_filter(rng.standard_normal(len(t)), lo=3000) * np.exp(-t / 0.0025) * 0.6
    s += np.sin(2 * np.pi * 900 * t) * np.exp(-t / 0.015) * 0.4
    return s * gain

def pop(f=520, gain=0.4):
    d = 0.12; t = t_(d)
    fr = f * (1 + 0.9 * (1 - np.exp(-t / 0.02)))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.035) * gain

def tick(gain=0.18, f=4200):
    d = 0.02; t = t_(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-t / 0.003) * gain

def chime(m, gain=0.22):
    d = 1.2; t = t_(d); f = mtof(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.15)
    return s * np.exp(-t / 0.45) * gain

# ---------------- buses ----------------
drums = np.zeros(N); music = np.zeros(N); sfx = np.zeros(N); verb_send = np.zeros(N)
side = np.ones(N)  # sidechain gain driven by kick

SCENES = [0, 3, 6, 9, 12]
CHORDS = [[53, 57, 60, 65], [50, 53, 57, 62], [46, 50, 53, 58], [48, 52, 55, 60], [53, 57, 60, 65, 69]]
ROOTS = [41, 38, 34, 36, 41]
def scene_at(t): return max(i for i, s in enumerate(SCENES) if t >= s - 1e-6)

# drums: kick every beat, clap every other beat (backbeat), light offbeat hats
for b in range(30):
    tb = b * BEAT
    strong = 1.25 if abs(tb - 12.0) < 1e-6 else 1.0
    put(drums, kick(strong), tb, 1.0)
    i = int(tb * SR); L = int(0.22 * SR)
    side[i:i + L] = np.minimum(side[i:i + L], 1 - 0.55 * np.exp(-np.arange(L) / SR / 0.07))
    if b % 2 == 1:
        put(drums, clap(), tb, 0.8); put(verb_send, clap(), tb, 0.25)
    if tb < 10.0 or tb >= 12.0:
        put(drums, hat(), tb + 0.25, 0.32)

# riser section 10–12 s: frequent hats, 16ths then 32nds, growing
for k in range(16):
    tt = 10.0 + k * 0.0625 * 1
    if tt < 11.0: put(drums, hat(0.04, 0.01), tt, 0.18 + 0.12 * k / 16)
for k in range(32):
    tt = 11.0 + k * 0.03125
    if tt < 11.97: put(drums, hat(0.03, 0.008), tt, 0.24 + 0.2 * k / 32)
# noise riser + pitch riser
d = 2.0; tr = t_(d)
riser = noise_whoosh(d, 400, 9000, peak=0.985, gain=0.55)
sweep = np.sin(2 * np.pi * np.cumsum(200 * (8 ** (tr / d))) / SR) * (tr / d) ** 2 * 0.12
put(sfx, riser + sweep, 10.0)

# bass: offbeat 8ths on the scene root (with octave bounce)
for k in range(60):
    tt = k * 0.25
    if k % 2 == 1:
        s = scene_at(tt)
        if 11.875 <= tt < 12.0: continue
        put(music, bass_note(ROOTS[s] + (12 if k % 4 == 3 else 0)), tt, 0.85)

# bright arpeggio: 16ths over chord tones
PATTERN = [0, 1, 2, 3, 4, 3, 2, 1]
for k in range(120):
    tt = k * 0.125
    if 11.875 <= tt < 12.0: continue
    s = scene_at(tt)
    tones = [m + 12 for m in CHORDS[s][:4]] + [CHORDS[s][0] + 24]
    m = tones[PATTERN[k % 8]]
    g = 0.7 if k % 4 == 0 else 0.5
    if 10 <= tt < 12: g *= 1 + 0.6 * (tt - 10) / 2
    a = arp_note(m)
    put(music, a, tt, g)
    for e, eg in ((0.375, 0.35), (0.75, 0.15)):   # dotted-8th echo
        put(music, a, tt + e, g * eg)

# chord on every scene change (biggest at 12)
for i, s in enumerate(SCENES):
    big = i == 4
    p = pad(CHORDS[i], d=3.0 if big else 2.4, bright=5200 if big else 3000, gain=1.5 if big else 1.0)
    put(music, p, s, 1.0); put(verb_send, p, s, 0.5)

# ---------------- sound effects (per scene) ----------------
put(sfx, noise_whoosh(0.6, 300, 2500, 0.7, 0.18), 0.0)
for tt in (0.12, 0.5): put(sfx, tick(), tt)
put(sfx, pop(440, 0.25), 1.0); put(sfx, tick(), 1.24); put(sfx, tick(), 1.38)
put(sfx, pop(520, 0.4), 1.5); put(sfx, pop(620, 0.22), 1.62)
put(sfx, noise_whoosh(0.35, 1500, 5000, 0.6, 0.12), 2.05)
put(sfx, ui_click(), 2.5)
put(sfx, noise_whoosh(0.45, 600, 4000, 0.55, 0.28), 2.7)
put(sfx, pop(400, 0.3), 3.0)
for i in range(5): put(sfx, tick(0.16, 3600 + 200 * i), 3.5 + i * 0.13)
put(sfx, noise_whoosh(0.3, 1500, 5000, 0.6, 0.1), 4.45)
put(sfx, ui_click(), 5.0); put(sfx, noise_whoosh(0.3, 800, 3000, 0.4, 0.2), 5.02)
put(sfx, noise_whoosh(0.4, 3000, 700, 0.5, 0.25), 5.45)
for i, tt in enumerate((5.95, 6.45, 6.95)): put(sfx, pop(480 + 80 * i, 0.38), tt)
put(sfx, ui_click(0.5), 7.5)
for k in range(9): put(sfx, tick(0.12, 3000), 7.6 + k * 0.1)
put(sfx, pop(300, 0.2), 8.03); put(sfx, pop(330, 0.2), 8.45)
put(sfx, ui_click(0.45), 8.5)
put(sfx, noise_whoosh(0.55, 250, 6000, 0.55, 0.45), 8.55)
put(sfx, pop(520, 0.3), 9.18); put(sfx, pop(660, 0.35), 9.5)
for i, tt in enumerate((10.0, 10.5, 11.0, 11.25, 11.5)): put(sfx, pop(560 + 90 * i, 0.32), tt)
put(sfx, pop(900, 0.3), 11.62)
# climax at 12.0: click + strongest hit
put(sfx, ui_click(0.7), 12.0)
th = t_(2.4)
boom = np.sin(2 * np.pi * np.cumsum(38 + 80 * np.exp(-th / 0.06)) / SR) * np.exp(-th / 0.7)
crash = fft_filter(rng.standard_normal(len(th)), lo=3500) * np.exp(-th / 0.6) * 0.18
put(sfx, np.tanh(boom * 1.8) * 0.9 + crash, 12.0)
put(verb_send, crash * 2, 12.0, 0.6)
put(sfx, noise_whoosh(0.4, 5000, 1200, 0.3, 0.2), 12.45)
put(sfx, noise_whoosh(0.35, 900, 3500, 0.5, 0.15), 12.95)
for i, tt in enumerate((13.45, 13.53, 13.61)):
    c = chime(84 + [0, 4, 7][i]); put(sfx, c, tt); put(verb_send, c, tt, 0.5)
put(sfx, tick(0.15), 14.0); put(sfx, tick(0.15), 14.5)

# ---------------- mix ----------------
# reverb: exponentially decaying stereo-ish noise IR, FFT convolution
ir_t = t_(1.6)
ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / 0.38)
ir = fft_filter(ir, lo=200, hi=7000); ir /= np.sqrt((ir ** 2).sum())
L = N + len(ir)
verb = np.fft.irfft(np.fft.rfft(verb_send, L) * np.fft.rfft(ir, L), L)[:N] * 0.6

music *= side
mix = drums * 0.9 + music * 0.75 + sfx * 0.9 + verb
# short silence breath right before the hit (music + hats), kick/riser keep going
gate = np.ones(N); a, b = int(11.9 * SR), int(12.0 * SR)
mix[a:b] = mix[a:b] * 0.55 + sfx[a:b] * 0.2
# soft master glue + fade-out
mix = np.tanh(mix * 1.2) / 1.2
fade = int(0.35 * SR); mix[-fade:] *= np.linspace(1, 0, fade) ** 2
mix[:int(0.005 * SR)] *= np.linspace(0, 1, int(0.005 * SR))
# slight stereo: delayed copy of arp/verb for width
w = music * 0.75 * 0.3 + verb * 0.6
dl = int(0.011 * SR)
wd = np.concatenate([np.zeros(dl), w[:-dl]])
side_sig = (wd - w) * 0.5
stereo = np.stack([mix + side_sig, mix - side_sig], 1)
stereo /= np.abs(stereo).max() * 1.05
stereo.astype('<f4').tofile(sys.argv[1])
print('ok', stereo.shape)
