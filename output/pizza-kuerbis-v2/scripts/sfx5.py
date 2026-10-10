"""SFX for reel 2: the original effects from reel 1's source audio (music filtered out by HPSS),
mapped through reel 2's cut and speed ramps; ElevenLabs food foley for shots past 10 s."""
import json, wave, bisect, subprocess
import numpy as np

S = "/tmp/claude-0/-home-user-claude/12c49631-ca9c-5648-9da1-0be9e9648064/scratchpad/r2"
SR = 48000
TL = json.load(open(f"{S}/timeline.json"))
HOOK_D = TL["hook"]["total"]
TOTAL = HOOK_D + TL["main"]["total"]
N = int(TOTAL * SR) + SR // 10
rng = np.random.default_rng(11)
sfx = np.zeros((N, 2), np.float32)

def sample(name, start=0.0, dur=None, fade=0.08):
    cmd = ["ffmpeg", "-v", "error", "-ss", str(start), "-i", f"{S}/samples/{name}.mp3"]
    if dur: cmd += ["-t", str(dur)]
    cmd += ["-ac", "2", "-ar", str(SR), "-f", "f32le", "-"]
    x = np.frombuffer(subprocess.run(cmd, capture_output=True).stdout, np.float32).reshape(-1, 2).copy()
    x /= np.abs(x).max() + 1e-9
    n = int(fade * SR); x[-n:] *= np.linspace(1, 0, n)[:, None]
    return x

def tile(src, dur, xfade=0.15):
    """loop a short recording to `dur` seconds with crossfades and random start points"""
    n = int(dur * SR); out = np.zeros((n, 2), np.float32); xf = int(xfade * SR); pos = 0; L = len(src)
    while pos < n:
        seg = src[int(rng.integers(0, max(1, L // 3))):].copy()
        k = min(xf, len(seg) // 3)
        seg[:k] *= np.linspace(0, 1, k)[:, None]; seg[-k:] *= np.linspace(1, 0, k)[:, None]
        j = min(n, pos + len(seg)); out[pos:j] += seg[: j - pos]; pos += len(seg) - k
    f = min(int(0.1 * SR), n // 4)
    out[:f] *= np.linspace(0, 1, f)[:, None]; out[-f:] *= np.linspace(1, 0, f)[:, None]
    return out

def place(sig, at, gain=1.0):
    i = int(at * SR)
    if i < 0: sig = sig[-i:]; i = 0
    j = min(N, i + len(sig)); sfx[i:j] += sig[: j - i] * gain

SLAM, SLOWMO, HIT = sample("slam", 0, 1.2), sample("slowmo", 0, 1.0), sample("hit", 0, 1.3, 0.25)
SWISH, CHEESE = sample("swish", 0.05, 0.6), sample("cheese", 0, None, 0.05)
FIRE, SAUCE, KNEAD = sample("fire", 0, None, 0.05), sample("sauce", 0, None, 0.05), sample("knead", 0, None, 0.05)
PLOPS, KITCHEN = sample("plops", 0.1, 1.4), sample("kitchen", 0, None, 0.05)
PEEL, REVEAL = sample("peel", 2.6, 1.3), sample("reveal", 0, 1.6, 0.3)

shots = {}
for s in TL["hook"]["shots"]:
    shots[s["name"]] = dict(s)
for s in TL["main"]["shots"]:
    d = dict(s); d["start"] += HOOK_D; d["end"] += HOOK_D; shots[s["name"]] = d

def at(name, src_t):
    s = shots[name]; k = bisect.bisect_left(s["src_pos"], src_t - s["src_in"])
    return s["start"] + min(k, len(s["src_pos"]) - 1) / 24

def span(name):
    return shots[name]["start"], shots[name]["end"]

# original effects (music removed), source time 0..10.3 s, same shots as reel 2
with wave.open(f"{S}/../ref/src1_effekte.wav") as w:
    ORIG = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2).astype(np.float32) / 32768
ORIG_D = len(ORIG) / SR

def mapped(name):
    """resample the original effects along this shot's speed ramp (slow-mo drops in pitch, like tape)"""
    s = shots[name]; n = int((s["end"] - s["start"]) * SR)
    t_frame = np.arange(len(s["src_pos"])) / 24
    t_out = np.arange(n) / SR
    src_t = s["src_in"] + np.interp(t_out, t_frame, s["src_pos"])
    if src_t[0] >= ORIG_D: return None
    idx = np.clip(src_t * SR, 0, len(ORIG) - 2); i0 = idx.astype(int); f = (idx - i0)[:, None]
    y = ORIG[i0] * (1 - f) + ORIG[i0 + 1] * f
    y[src_t >= ORIG_D] = 0
    k = int(0.01 * SR); y[:k] *= np.linspace(0, 1, k)[:, None]; y[-k:] *= np.linspace(1, 0, k)[:, None]
    return y

for name in ("flour_slam", "knead", "stretch", "sauce_pour", "ladle", "toppings_fly", "cheese_chef",
             "cheese_close", "pumpkin", "tomato"):
    y = mapped(name)
    if y is not None: place(y, shots[name]["start"], 1.0)

# shots past the original audio: recorded food foley
a, b = span("peel"); place(PEEL[: int((b - a + 0.1) * SR)], a + 0.03, 0.5)
a, b = span("oven"); place(tile(FIRE, b - a + 0.3), a - 0.05, 0.45)
a, b = span("parmesan"); place(tile(CHEESE, b - a - 0.1), a + 0.15, 0.6)

end = int(TOTAL * SR); tail = int(0.35 * SR)
sfx[end - tail:end] *= np.linspace(1, 0, tail)[:, None]
x = np.clip(sfx[:end], -1, 1)
with wave.open(f"{S}/sfx.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype(np.int16).tobytes())
for n, s in shots.items():
    i, j = int(s["start"] * SR), int(s["end"] * SR)
    print(f"{n:14s} {s['start']:6.2f} rms {20*np.log10(np.sqrt((x[i:j]**2).mean())+1e-9):6.1f}")
