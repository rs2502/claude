"""SFX for reel 2 (source is silent). Writes sfx.wav for the full timeline: hook + main."""
import json, wave, bisect
import numpy as np

S = "/tmp/claude-0/-home-user-claude/12c49631-ca9c-5648-9da1-0be9e9648064/scratchpad/r2"
SR = 48000
TL = json.load(open(f"{S}/timeline.json"))
HOOK_D = TL["hook"]["total"]
TOTAL = HOOK_D + TL["main"]["total"]
N = int(TOTAL * SR) + SR // 10

# shared synth helpers (whoosh, impact, thud, scrape, fire, sprinkle, riser, ding, roomtone, place)
body = open(f"{S}/synthlib_body.py").read().rsplit("shot = ", 1)[0]
exec(body)

shots = {}
for s in TL["hook"]["shots"]:
    shots[s["name"]] = dict(s)
for s in TL["main"]["shots"]:
    d = dict(s); d["start"] += HOOK_D; d["end"] += HOOK_D; shots[s["name"]] = d

def at(name, src_t):
    """output time where source time src_t of shot `name` is shown"""
    s = shots[name]; k = bisect.bisect_left(s["src_pos"], src_t - s["src_in"])
    return s["start"] + min(k, len(s["src_pos"]) - 1) / 24

def blip(f0):
    n = int(0.05 * SR); t = np.arange(n) / SR
    f = f0 * (1 + 1.2 * t / 0.05)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 70)).astype(np.float32)

def glug(dur, rate=28):
    out = np.zeros(int(dur * SR), np.float32)
    for _ in range(int(dur * rate)):
        b = blip(rng.uniform(180, 520)) * rng.uniform(0.3, 1); i = rng.integers(0, len(out) - len(b))
        out[i:i + len(b)] += b
    goo = band(rng.standard_normal(len(out)).astype(np.float32), 80, 500)
    t = np.arange(len(out)) / SR
    env = np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.12)
    return ((out / (np.abs(out).max() + 1e-9) + 0.5 * goo / (np.abs(goo).max() + 1e-9)) * env).astype(np.float32)

def squish():
    n = int(0.22 * SR); t = np.arange(n) / SR
    x = band(rng.standard_normal(n).astype(np.float32), 150, 2200) * np.exp(-t * 18)
    return (x / (np.abs(x).max() + 1e-9)).astype(np.float32)

def rewind(dur=0.45):
    # fast descending sweep with stutter: "back to the start"
    x = whoosh(dur, 7000, 250, 0.15); t = np.arange(len(x)) / SR
    return (x * (0.55 + 0.45 * np.sign(np.sin(2 * np.pi * 22 * t)))).astype(np.float32)

def slow_swell(dur):
    # pitched-down air: low band sweep falling, used under slow-mo
    return whoosh(dur, 1100, 120, 0.25)

import subprocess
def sample(name, start=0.0, dur=None, fade=0.08):
    cmd = ["ffmpeg", "-v", "error", "-ss", str(start), "-i", f"{S}/samples/{name}.mp3"]
    if dur: cmd += ["-t", str(dur)]
    cmd += ["-ac", "2", "-ar", str(SR), "-f", "f32le", "-"]
    x = np.frombuffer(subprocess.run(cmd, capture_output=True).stdout, np.float32).reshape(-1, 2).copy()
    x /= np.abs(x).max() + 1e-9
    n = int(fade * SR); x[-n:] *= np.linspace(1, 0, n)[:, None]
    return x

SLAM = sample("slam", 0, 1.2)
SLOWMO = sample("slowmo", 0, 1.0)
HIT = sample("hit", 0, 1.3, 0.25)
SWISH = sample("swish", 0.05, 0.6)

CHEESE = sample("cheese", 0, None, 0.05)

def cheese(dur):
    """natural cheese-sprinkle foley, tiled with crossfades to any length"""
    n = int(dur * SR); out = np.zeros((n, 2), np.float32); xf = int(0.15 * SR); pos = 0
    L = len(CHEESE)
    while pos < n:
        st = int(rng.integers(0, max(1, L // 3))); seg = CHEESE[st:].copy()
        seg[:xf] *= np.linspace(0, 1, xf)[:, None]; seg[-xf:] *= np.linspace(1, 0, xf)[:, None]
        j = min(n, pos + len(seg)); out[pos:j] += seg[: j - pos]; pos += len(seg) - xf
    f = int(0.1 * SR); out[:f] *= np.linspace(0, 1, f)[:, None]; out[-f:] *= np.linspace(1, 0, f)[:, None]
    return out

# room tone everywhere
rt = roomtone(); sfx += rt * 0.012

# ---- hook: result first, slow-mo ----
h = shots["hook_parmesan"]
place(SLOWMO, 0.0, 0.35)
place(cheese(h["end"] - 0.05), 0.02, 0.4)
place(HIT, 0.0, 0.3)
place(SWISH, HOOK_D - 0.22, 0.45)

# ---- main ----
slam = at("flour_slam", 0.28)
place(SLAM, slam - 0.02, 0.9)
place(whoosh(0.30, 2000, 400, 0.3), slam - 0.02, 0.3)
place(SLOWMO, slam + 0.02, 0.3)
place(whoosh(0.25, 400, 5000, 0.8), at("flour_slam", 0.72) - 0.1, 0.35)   # ramp back to speed

kn = shots["knead"]; place(thud(110), kn["start"] + 0.06, 0.35); place(thud(95), kn["start"] + 0.28, 0.3)
st = shots["stretch"]; place(whoosh(0.4, 250, 1600, 0.5), st["start"] + 0.2, 0.85)
sp = shots["sauce_pour"]; place(glug(sp["end"] - sp["start"] + 0.1), sp["start"], 0.42)
ld = shots["ladle"]; place(whoosh(ld["end"] - ld["start"], 150, 700, 0.5), ld["start"], 0.5)
tf = shots["toppings_fly"]
place(whoosh(0.55, 300, 6000, 0.55), tf["start"] - 0.25, 0.6); place(HIT, tf["start"], 0.3)
place(cheese(tf["end"] - tf["start"]), tf["start"] + 0.05, 0.3)
cc = shots["cheese_chef"]; place(cheese(cc["end"] - cc["start"]), cc["start"] + 0.1, 0.45); place(whoosh(0.5, 300, 2500, 0.4), cc["start"] + 0.1, 0.3)
cl = shots["cheese_close"]; place(cheese(cl["end"] - cl["start"]), cl["start"], 0.9); place(SLOWMO, cl["start"], 0.22)
pk = shots["pumpkin"]
place(whoosh(0.4, 400, 4000, 0.7), pk["start"] - 0.2, 0.45)
place(SLOWMO, at("pumpkin", 7.6 + 0.38 * 1.5), 0.3)
for k, srt in enumerate((8.40, 8.48, 8.58)):
    place(thud(150 + 20 * k), at("pumpkin", srt), 0.45)
tm = shots["tomato"]; place(squish(), tm["start"] + 0.12, 0.45); place(squish(), tm["start"] + 0.33, 0.3)
pl = shots["peel"]; place(scrape(pl["end"] - pl["start"]), pl["start"] + 0.05, 0.7)
ov = shots["oven"]; place(fire(ov["end"] - ov["start"] + 0.3), ov["start"] - 0.05, 0.5)
place(HIT, ov["start"], 0.22)
pr = shots["prosciutto"]; place(whoosh(0.5, 200, 900, 0.4), pr["start"] + 0.2, 0.4)
place(cheese(pr["end"] - pr["start"]), pr["start"] + 0.2, 0.18)
pm = shots["parmesan"]; place(cheese(pm["end"] - pm["start"] - 0.1), pm["start"] + 0.15, 0.9)
he = shots["hero"]
place(riser(0.9), he["start"] - 0.9, 0.3); place(HIT, he["start"], 0.3)
place(ding(), he["start"] + 0.02, 0.35)

# small swish on every remaining cut
for name in ("knead", "stretch", "sauce_pour", "ladle", "cheese_chef", "cheese_close", "tomato",
             "peel", "oven", "prosciutto", "parmesan"):
    place(whoosh(0.22), shots[name]["start"] - 0.14, 0.18, pan=float(rng.uniform(-0.4, 0.4)))

end = int(TOTAL * SR); tail = int(0.35 * SR)
sfx[end - tail:end] *= np.linspace(1, 0, tail)[:, None]
x = np.clip(sfx[:end], -1, 1)
with wave.open(f"{S}/sfx.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype(np.int16).tobytes())
for n, s in shots.items():
    a, b = int(s["start"] * SR), int(s["end"] * SR)
    print(f"{n:14s} {s['start']:6.2f} rms {20*np.log10(np.sqrt((x[a:b]**2).mean())+1e-9):6.1f}")
print("total", round(TOTAL, 2), "slam", round(slam, 2))
