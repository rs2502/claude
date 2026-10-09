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
