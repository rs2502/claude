"""Cut + speed ramps for reel 2. Writes hook.mp4, main.mp4 and timeline.json (video only)."""
import subprocess, json, sys
import numpy as np

SRC = "/root/.claude/uploads/12c49631-ca9c-5648-9da1-0be9e9648064/94e942d7-10085.mov"
S = "/tmp/claude-0/-home-user-claude/12c49631-ca9c-5648-9da1-0be9e9648064/scratchpad/r2"
W, H, FPS = 1080, 1920, 24

# name, src_in, src_out, speed keyframes [(rel 0..1, speed)], zoom (start, end)
HOOK = [("hook_parmesan", 16.0, 16.8, [(0, 0.6), (1, 0.6)], (1.06, 1.16))]
MAIN = [
    ("flour_slam",   0.00, 1.20, [(0, 1.0), (0.21, 1.0), (0.25, 0.4), (0.48, 0.45), (0.62, 1.7), (1, 1.7)], (1.0, 1.0)),
    ("knead",        1.25, 1.95, [(0, 1.6), (1, 1.6)], (1.0, 1.0)),
    ("stretch",      2.05, 3.15, [(0, 1.4), (1, 1.4)], (1.0, 1.0)),
    ("sauce_pour",   3.25, 3.95, [(0, 1.0), (1, 1.0)], (1.0, 1.06)),
    ("ladle",        4.00, 4.65, [(0, 1.5), (1, 1.5)], (1.0, 1.0)),
    ("toppings_fly", 10.15, 11.60, [(0, 2.0), (1, 2.0)], (1.0, 1.18)),
    ("cheese_chef",  4.70, 5.95, [(0, 1.6), (1, 1.6)], (1.0, 1.0)),
    ("cheese_close", 6.05, 7.00, [(0, 0.8), (1, 0.8)], (1.0, 1.0)),
    ("pumpkin",      7.60, 9.10, [(0, 1.7), (0.25, 1.7), (0.40, 0.5), (0.65, 0.5), (0.8, 1.6), (1, 1.6)], (1.0, 1.0)),
    ("tomato",       9.20, 10.05, [(0, 1.5), (1, 1.5)], (1.0, 1.0)),
    ("peel",         12.30, 13.55, [(0, 1.8), (1, 1.8)], (1.0, 1.0)),
    ("oven",         13.60, 14.15, [(0, 0.8), (1, 0.8)], (1.0, 1.08)),
    ("prosciutto",   14.20, 15.30, [(0, 1.4), (1, 1.4)], (1.0, 1.0)),
    ("parmesan",     15.40, 16.95, [(0, 1.5), (0.5, 0.7), (1, 0.7)], (1.0, 1.0)),
    ("hero",         17.25, 19.45, [(0, 1.0), (1, 1.0)], (1.0, 1.05)),
]

def speed_at(kf, r):
    xs, ys = zip(*kf); s = float(np.interp(r, xs, ys))
    return s

def read_frames(a, b):
    n = int(round((b - a) * FPS)) + 2
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{a}", "-i", SRC, "-frames:v", str(n),
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    frames = []
    while True:
        buf = p.stdout.read(W * H * 3)
        if len(buf) < W * H * 3: break
        frames.append(np.frombuffer(buf, np.uint8).reshape(H, W, 3))
    p.wait(); return frames

def zoom(img, z):
    if z <= 1.0001: return img
    cw, ch = int(W / z), int(H / z); x0, y0 = (W - cw) // 2, (H - ch) // 2
    crop = img[y0:y0 + ch, x0:x0 + cw]
    # nearest-ish resize via index maps (fast, fine at <=1.2x)
    yi = (np.arange(H) * ch / H).astype(int); xi = (np.arange(W) * cw / W).astype(int)
    return crop[yi][:, xi]

def render(segs, out):
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                            "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "14",
                            "-preset", "medium", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    timeline, t_out = [], 0.0
    for name, a, b, kf, (z0, z1) in segs:
        fr = read_frames(a, b); D = b - a; pos = 0.0; n_out = 0; marks = []
        while pos < D - 1e-6:
            r = pos / D; fi = pos * FPS; i = int(fi); f = fi - i
            i = min(i, len(fr) - 1); j = min(i + 1, len(fr) - 1)
            img = fr[i] if f < 0.08 or i == j else \
                ((1 - f) * fr[i].astype(np.float32) + f * fr[j].astype(np.float32)).astype(np.uint8)
            enc.stdin.write(zoom(img, z0 + (z1 - z0) * r).tobytes())
            marks.append(pos); n_out += 1
            pos += speed_at(kf, r) / FPS
        dur = n_out / FPS
        timeline.append({"name": name, "start": round(t_out, 4), "end": round(t_out + dur, 4),
                         "src_in": a, "src_out": b, "src_pos": [round(m, 4) for m in marks]})
        t_out += dur
    enc.stdin.close(); enc.wait()
    return timeline, t_out

th, dh = render(HOOK, f"{S}/hook.mp4")
tm, dm = render(MAIN, f"{S}/main.mp4")
json.dump({"hook": {"total": dh, "shots": th}, "main": {"total": dm, "shots": tm}},
          open(f"{S}/timeline.json", "w"))
print("hook", round(dh, 2), "main", round(dm, 2))
for s in tm: print(f'{s["name"]:13s} {s["start"]:6.2f} {s["end"]:6.2f}')
