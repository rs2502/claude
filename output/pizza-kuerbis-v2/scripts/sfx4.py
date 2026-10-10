"""SFX for reel 2: food foley only (no whooshes, hits, risers or ambience), recorded ElevenLabs samples."""
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

# hook (0-1.3 s): no effects, the music carries it

slam = at("flour_slam", 0.28)
place(SLAM, slam - 0.02, 0.9)                                    # dough hits the counter

a, b = span("knead"); place(tile(KNEAD, b - a + 0.1), a, 0.7)
a, _ = span("sauce_pour"); _, b = span("ladle"); place(tile(SAUCE, b - a + 0.1), a, 0.8)
a, b = span("cheese_chef"); place(tile(CHEESE, b - a), a + 0.1, 0.6)
a, b = span("cheese_close"); place(tile(CHEESE, b - a), a, 0.7)
place(PLOPS, at("pumpkin", 8.38), 0.7)                           # pumpkin cubes land
a, b = span("tomato"); place(PLOPS, a + 0.05, 0.5)
a, b = span("peel"); place(PEEL[: int((b - a + 0.1) * SR)], a + 0.03, 0.6)
a, b = span("oven"); place(tile(FIRE, b - a + 0.3), a - 0.05, 0.5)
a, b = span("parmesan"); place(tile(CHEESE, b - a - 0.1), a + 0.15, 0.7)

end = int(TOTAL * SR); tail = int(0.35 * SR)
sfx[end - tail:end] *= np.linspace(1, 0, tail)[:, None]
x = np.clip(sfx[:end], -1, 1)
with wave.open(f"{S}/sfx.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype(np.int16).tobytes())
for n, s in shots.items():
    i, j = int(s["start"] * SR), int(s["end"] * SR)
    print(f"{n:14s} {s['start']:6.2f} rms {20*np.log10(np.sqrt((x[i:j]**2).mean())+1e-9):6.1f}")
