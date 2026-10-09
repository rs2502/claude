import subprocess, json, wave, sys
import numpy as np

SRC = "/root/.claude/uploads/12c49631-ca9c-5648-9da1-0be9e9648064/c5414a2d-10084.mov"
S = "/tmp/claude-0/-home-user-claude/12c49631-ca9c-5648-9da1-0be9e9648064/scratchpad"
SR = 48000

# source in/out per shot (seconds), names for the SFX plan
EDL = [
    (0.25, 1.20, "flour_slam"),
    (1.25, 1.95, "knead"),
    (2.05, 3.15, "stretch"),
    (3.25, 3.95, "sauce_pour"),
    (4.00, 4.65, "ladle"),
    (4.70, 5.95, "cheese_chef"),
    (6.05, 7.00, "cheese_close"),
    (7.60, 9.10, "pumpkin"),
    (9.20, 10.10, "tomato"),
    (11.85, 12.80, "peel"),
    (12.88, 13.85, "oven"),
    (13.92, 15.20, "prosciutto"),
    (15.35, 17.10, "parmesan"),
    (17.20, 18.70, "hero"),
]

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print(r.stderr[-3000:]); sys.exit(1)
    return r

# ---- 1. cut (video + original foley, 8 ms fades at every cut) ----
parts, labels = [], []
for i, (a, b, _) in enumerate(EDL):
    d = b - a
    parts.append(f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS[v{i}];"
                 f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,aresample={SR},"
                 f"afade=t=in:d=0.008,afade=t=out:st={d-0.008:.3f}:d=0.008[a{i}];")
    labels.append(f"[v{i}][a{i}]")
fc = "".join(parts) + "".join(labels) + f"concat=n={len(EDL)}:v=1:a=1[v][a]"
run(["ffmpeg", "-v", "error", "-y", "-i", SRC, "-filter_complex", fc, "-map", "[v]", "-map", "[a]",
     "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p", "-r", "24",
     "-c:a", "pcm_s16le", f"{S}/cut.mov"])

cuts, t = [], 0.0
for a, b, n in EDL:
    cuts.append((t, t + (b - a), n)); t += b - a
TOTAL = t
json.dump({"total": TOTAL, "shots": cuts}, open(f"{S}/timeline.json", "w"), indent=1)

# ---- 2. read cut foley, find flour-slam transient ----
run(["ffmpeg", "-v", "error", "-y", "-i", f"{S}/cut.mov", "-ac", "2", "-ar", str(SR), f"{S}/foley.wav"])
with wave.open(f"{S}/foley.wav") as w:
    fol = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2).astype(np.float32) / 32768
N = int(TOTAL * SR) + SR // 10
fol = np.pad(fol, ((0, max(0, N - len(fol))), (0, 0)))[:N]
env = np.abs(fol[: int(0.95 * SR)].mean(1))
slam = float(np.argmax(np.convolve(env, np.ones(240) / 240, "same")) / SR)
print("slam at", round(slam, 3))

# ---- 3. synthesize SFX (numpy only) ----
rng = np.random.default_rng(7)
sfx = np.zeros((N, 2), np.float32)

def onepole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for i, v in enumerate(x):
        s = (1 - a) * v + a * s; y[i] = s
    return y

def band(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x)).astype(np.float32)

def sweep_band(x, f0, f1, q=0.6):
    # moving band-pass via short overlapping FFT frames
    n, hop = 2048, 512; out = np.zeros(len(x) + n, np.float32); win = np.hanning(n)
    frames = range(0, len(x), hop)
    for k, i in enumerate(frames):
        seg = np.zeros(n, np.float32); chunk = x[i:i + n]; seg[:len(chunk)] = chunk
        fc = f0 * (f1 / f0) ** (k / max(1, len(frames) - 1))
        X = np.fft.rfft(seg * win); f = np.fft.rfftfreq(n, 1 / SR)
        X *= np.exp(-((np.log(f + 1) - np.log(fc)) ** 2) / (2 * q ** 2))
        out[i:i + n] += np.fft.irfft(X, n).astype(np.float32)
    return out[:len(x)] / 1.5

def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N: return
    if sig.ndim == 1:
        l, r = np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)
        sig = np.stack([sig * l * 1.414, sig * r * 1.414], 1)
    j = min(N, i + len(sig)); sfx[i:j] += sig[: j - i] * gain

def whoosh(dur=0.35, f0=300, f1=3500, peak=0.6):
    n = int(dur * SR); x = rng.standard_normal(n).astype(np.float32)
    x = sweep_band(x, f0, f1)
    t = np.linspace(0, 1, n); env = np.where(t < peak, (t / peak) ** 2, ((1 - t) / (1 - peak)) ** 1.5)
    return (x * env / (np.abs(x).max() + 1e-9)).astype(np.float32)

def impact(dur=0.9, f0=110, f1=38):
    n = int(dur * SR); t = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(f1 + (f0 - f1) * np.exp(-t * 9)) / SR
    body = np.sin(ph) * np.exp(-t * 4.5)
    click = band(rng.standard_normal(n).astype(np.float32), 800, 6000) * np.exp(-t * 60)
    x = body + 0.5 * click / (np.abs(click).max() + 1e-9)
    return np.tanh(1.6 * x).astype(np.float32) * 0.9

def thud(f=150):
    n = int(0.18 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t * (1 - t * 1.5)) * np.exp(-t * 28)).astype(np.float32)

def scrape(dur):
    n = int(dur * SR); x = band(rng.standard_normal(n).astype(np.float32), 1500, 7000)
    t = np.arange(n) / SR; am = 0.6 + 0.4 * np.sin(2 * np.pi * 23 * t) * rng.uniform(0.6, 1, n)
    env = np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.12)
    return (x * am * env / (np.abs(x).max() + 1e-9)).astype(np.float32)

def fire(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    roar = band(rng.standard_normal(n).astype(np.float32), 60, 900)
    roar *= (0.7 + 0.3 * np.convolve(rng.standard_normal(n), np.ones(4000) / 4000, "same") * 20)
    roar /= np.abs(roar).max() + 1e-9
    crack = np.zeros(n, np.float32)
    for _ in range(int(dur * 38)):
        i = rng.integers(0, n - 600); L = rng.integers(60, 500)
        crack[i:i + L] += rng.standard_normal(L) * np.exp(-np.arange(L) / (L / 5)) * rng.uniform(0.3, 1)
    crack = band(crack, 1200, 12000); crack /= np.abs(crack).max() + 1e-9
    env = np.minimum(1, t / 0.15) * np.minimum(1, (dur - t) / 0.2)
    return ((0.8 * roar + 0.45 * crack) * env).astype(np.float32)

def sprinkle(dur, rate=45):
    n = int(dur * SR); x = np.zeros(n, np.float32)
    for _ in range(int(dur * rate)):
        i = rng.integers(0, n - 300); L = rng.integers(40, 220)
        x[i:i + L] += rng.standard_normal(L) * np.exp(-np.arange(L) / (L / 4)) * rng.uniform(0.2, 1)
    x = band(x, 2500, 14000); t = np.arange(n) / SR
    env = np.minimum(1, t / 0.1) * np.minimum(1, (dur - t) / 0.15)
    return (x * env / (np.abs(x).max() + 1e-9)).astype(np.float32)

def riser(dur):
    n = int(dur * SR); x = rng.standard_normal(n).astype(np.float32)
    x = sweep_band(x, 400, 9000, q=0.4); t = np.linspace(0, 1, n)
    return (x * t ** 2.5 / (np.abs(x).max() + 1e-9)).astype(np.float32)

def ding(f=1318.5, dur=1.6):
    n = int(dur * SR); t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * d) for m, a, d in
            [(1, 1, 3.0), (2.76, 0.35, 6), (5.4, 0.15, 11), (0.5, 0.25, 2.5)])
    return (x * np.minimum(1, t / 0.003) / 1.6).astype(np.float32)

def roomtone():
    x = band(rng.standard_normal(N).astype(np.float32), 80, 2500)
    x2 = band(rng.standard_normal(N).astype(np.float32), 80, 2500)
    s = np.stack([x, x2], 1); return s / np.abs(s).max()

shot = {n: (a, b) for a, b, n in cuts}

# kitchen room tone under everything, slightly louder where the source is silent
rt = roomtone(); g = np.full(N, 0.018, np.float32)
g[int(shot["peel"][0] * SR):] = 0.04
sfx += rt * g[:, None]

place(impact(), slam - 0.012, 0.85)                                  # flour slam
place(whoosh(0.30, 2000, 400, 0.3), slam - 0.02, 0.25)               # flour puff
for (a, b, n) in cuts[1:]:                                           # transition swishes
    big = n in ("pumpkin", "peel", "oven", "hero")
    place(whoosh(0.32 if big else 0.22), a - (0.20 if big else 0.14), 0.38 if big else 0.16,
          pan=rng.uniform(-0.4, 0.4))
a, b = shot["pumpkin"]                                               # cube landings
for k, dt in enumerate((0.55, 0.85, 1.12)):
    place(thud(140 + 25 * k), a + dt, 0.35)
a, b = shot["peel"];       place(scrape(b - a + 0.05), a + 0.05, 0.75)
a, b = shot["oven"];       place(fire(b - a + 0.25), a - 0.05, 0.42); place(impact(0.6, 70, 32), a, 0.35)
a, b = shot["prosciutto"]; place(sprinkle(b - a, 18), a + 0.2, 0.5); place(whoosh(0.5, 200, 900, 0.4), a + 0.25, 0.35)
a, b = shot["parmesan"];   place(sprinkle(b - a - 0.1, 60), a + 0.15, 0.75)
a, b = shot["ladle"]; place(whoosh(b - a, 150, 700, 0.5), a, 0.5); place(whoosh(b - a, 300, 1400, 0.45), a + 0.05, 0.3, pan=0.3)
place(riser(0.9), shot["hero"][0] - 0.9, 0.22)
place(ding(), shot["hero"][0] + 0.02, 0.32)
place(impact(0.7, 90, 35), shot["hero"][0], 0.4)

# fade the tail so the loop restarts clean
tail = int(0.35 * SR); end = int(TOTAL * SR)
sfx[end - tail:end] *= np.linspace(1, 0, tail)[:, None]; sfx[end:] = 0
fol[end - tail:end] *= np.linspace(1, 0.2, tail)[:, None]; fol[end:] = 0

def wr(path, x):
    x = np.clip(x, -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())

wr(f"{S}/sfx_only.wav", sfx[:end])
wr(f"{S}/mix_raw.wav", (fol * 0.9 + sfx)[:end])
print("total", round(TOTAL, 3))
