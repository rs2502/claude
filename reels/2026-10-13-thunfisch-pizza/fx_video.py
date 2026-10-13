"""Visual FX pass for the tuna pizza reel.

Reads the 4x motion-interpolated source (src96.mp4), retimes it with the
edit list in timeline.py (speed ramps, shot G removed), applies cut-synced
effects (punch-in zooms, flashes, RGB split, shake, zoom-blur transition,
oven glow, light sweep, grade, vignette, grain), draws the text hook and the
step labels, and writes a 1080x1920 silent video.

Usage:
  ffmpeg -i input.mov -vf "minterpolate=fps=96:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=fdiff:scd_threshold=8" src96.mp4
  python3 fx_video.py src96.mp4 fx_silent.mp4
"""
import subprocess
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

import timeline as tl

SRC_W, SRC_H, FPS = 1080, 1950, tl.FPS
OUT_W, OUT_H = 1080, 1920
FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf"

FLASH_SHOTS = {"B", "K"}                       # white flash + RGB split
SHAKES = {("A", 0): 16, ("A", 14): 6, ("D", 0): 7, ("H", 0): 6, ("J", 0): 8, ("K", 0): 10}
SWEEP_SHOT, SWEEP_FROM, SWEEP_LEN = "L", 4, 16  # light sweep over the final pizza
rng = np.random.default_rng(7)


def ease_out(x):
    return 1 - (1 - x) ** 3


def ease_out_back(x, s=2.2):
    x -= 1
    return 1 + (s + 1) * x ** 3 + s * x ** 2


def transform(img, scale, dx=0.0, dy=0.0):
    h, w = img.shape[:2]
    m = cv2.getRotationMatrix2D((w / 2, h / 2), 0, scale)
    m[0, 2] += dx
    m[1, 2] += dy
    return cv2.warpAffine(img, m, (w, h), flags=cv2.INTER_LINEAR,
                          borderMode=cv2.BORDER_REFLECT)


def zoom_blur(img, strength, samples=8):
    acc = np.zeros_like(img, dtype=np.float32)
    for i in range(samples):
        acc += transform(img, 1 + strength * i / samples).astype(np.float32)
    return acc / samples


def rgb_split(img, px):
    if px < 1:
        return img
    out = img.copy()
    out[..., 0] = np.roll(img[..., 0], int(px), axis=1)
    out[..., 2] = np.roll(img[..., 2], -int(px), axis=1)
    return out


def build_grade_lut():
    x = np.arange(256) / 255.0
    s = x + 0.12 * np.sin(2 * np.pi * x) * -0.5  # gentle S-curve
    s = np.clip(s * 1.03 - 0.01, 0, 1)
    return (s * 255).astype(np.uint8)


LUT = build_grade_lut()
yy, xx = np.mgrid[0:OUT_H, 0:OUT_W].astype(np.float32)
_r = np.sqrt(((xx - OUT_W / 2) / (OUT_W / 2)) ** 2 + ((yy - OUT_H / 2) / (OUT_H / 2)) ** 2)
VIGNETTE = np.clip(1 - 0.32 * np.clip(_r - 0.55, 0, None) ** 1.6, 0, 1)[..., None]


def grade(img):
    img = cv2.LUT(img, LUT)
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * 0.97, 0, 255)  # source is already very warm
    img = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB).astype(np.float32)
    img[..., 0] *= 0.985  # pull the orange cast back slightly
    img[..., 2] *= 1.03
    return img


def glow(img, amount):
    # neutral (luma-based) halo so the glow brightens instead of tinting orange
    luma = img @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    bright = np.clip(luma - 170, 0, None) * 1.2
    halo = cv2.GaussianBlur(bright, (0, 0), 28)[..., None]
    return img + halo * amount


def light_sweep(img, k):
    pos = -0.3 + 1.6 * k
    d = (xx / OUT_W * 0.6 + yy / OUT_H * 0.4) - pos
    band = np.exp(-(d / 0.045) ** 2)[..., None]
    return img + band * np.array([255, 235, 200], np.float32) * 0.28


# ---- text sprites -----------------------------------------------------------

def _shadowed(layer, blur=14, alpha=0.75, offset=(0, 8)):
    a = np.array(layer)[..., 3].astype(np.float32)
    sh = cv2.GaussianBlur(a, (0, 0), blur) * alpha
    sh = np.roll(sh, offset, axis=(0, 1))
    base = np.zeros((*a.shape, 4), np.float32)
    base[..., 3] = sh
    top = np.array(layer).astype(np.float32)
    ta = top[..., 3:4] / 255
    out = base.copy()
    out[..., :3] = top[..., :3]
    out[..., 3] = ta[..., 0] * 255 + base[..., 3] * (1 - ta[..., 0])
    return out


def hook_sprite():
    l1, l2 = tl.HOOK
    size = 92
    while ImageFont.truetype(FONT, size).getlength(l1) > 860:  # fit inside the safe zone
        size -= 2
    f1 = ImageFont.truetype(FONT, size)
    f2 = ImageFont.truetype(FONT, 190)
    w, h = 1000, 420
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.text((w / 2, 70), l1, font=f1, anchor="mm", fill=(255, 255, 255, 255),
           stroke_width=10, stroke_fill=(20, 12, 8, 255))
    d.text((w / 2, 250), l2, font=f2, anchor="mm", fill=(255, 214, 92, 255),
           stroke_width=14, stroke_fill=(20, 12, 8, 255))
    return _shadowed(im, 18, 0.8, (0, 12))


def label_sprite(step, text):
    f = ImageFont.truetype(FONT, 64)
    fn = ImageFont.truetype(FONT, 54)
    tw = int(f.getlength(text))
    badge = 96 if step else 0
    w, h = tw + 80 + badge, 112
    im = Image.new("RGBA", (w + 40, h + 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((20, 20, 20 + w, 20 + h), radius=h // 2, fill=(255, 250, 242, 245))
    x = 20 + 40
    if step:
        d.ellipse((28, 28, 28 + 96, 28 + 96), fill=(214, 48, 36, 255))
        d.text((28 + 48, 28 + 50), str(step), font=fn, anchor="mm", fill=(255, 255, 255, 255))
        x = 28 + 96 + 24
    d.text((x, 20 + h / 2 + 2), text, font=f, anchor="lm", fill=(28, 18, 12, 255))
    return _shadowed(im, 12, 0.55, (0, 8))


def composite(img, sprite, cx, cy, scale=1.0, alpha=1.0):
    if scale <= 0.02 or alpha <= 0:
        return img
    sp = cv2.resize(sprite, None, fx=scale, fy=scale, interpolation=cv2.INTER_LINEAR)
    h, w = sp.shape[:2]
    x0, y0 = int(cx - w / 2), int(cy - h / 2)
    x1, y1 = max(0, x0), max(0, y0)
    x2, y2 = min(OUT_W, x0 + w), min(OUT_H, y0 + h)
    if x2 <= x1 or y2 <= y1:
        return img
    s = sp[y1 - y0:y2 - y0, x1 - x0:x2 - x0]
    a = s[..., 3:4] / 255 * alpha
    img[y1:y2, x1:x2] = img[y1:y2, x1:x2] * (1 - a) + s[..., :3] * a
    return img


HOOK = hook_sprite()
LABEL_SPRITES = {}
for _shot, (_step, _text) in tl.LABELS.items():
    LABEL_SPRITES.setdefault((_step, _text), label_sprite(_step, _text))


def label_run(f):
    """(sprite key, frames since the label appeared, frames until it leaves)."""
    fr = tl.FRAMES[f]
    key = tl.LABELS.get(fr["shot"])
    if not key:
        return None
    first = f
    while first > 0 and tl.LABELS.get(tl.FRAMES[first - 1]["shot"]) == key:
        first -= 1
    last = f
    while last < tl.TOTAL - 1 and tl.LABELS.get(tl.FRAMES[last + 1]["shot"]) == key:
        last += 1
    return key, f - first, last - f


def draw_text(img, f, shake_dx, shake_dy):
    a, b = tl.HOOK_FRAMES
    if a <= f <= b:
        n, left = f - a, b - f
        scale = ease_out_back(min(1, n / 7)) if n < 7 else 1.0
        if left < 4:
            scale *= 1 - ease_out(1 - left / 4) * 0.4
        alpha = min(1, left / 3) if left < 3 else 1.0
        img = composite(img, HOOK, OUT_W / 2 + shake_dx * 0.5, 470 + shake_dy * 0.5, scale, alpha)
    run = label_run(f)
    if run:
        key, n, left = run
        sp = LABEL_SPRITES[key]
        w = sp.shape[1]
        # slide in from the left with a little overshoot, slide out at the end
        x_in = -w / 2 + (w / 2 + 70 + w / 2) * ease_out_back(min(1, n / 6), 1.4)
        if left < 4:
            x_in -= (w + 100) * ease_out(1 - left / 4)
        if key[0] is None:  # "Fertig." pops in centred
            scale = ease_out_back(min(1, n / 6)) if n < 6 else 1.0
            img = composite(img, sp, OUT_W / 2, 1290, scale * 1.25, 1.0)
        else:
            img = composite(img, sp, x_in, 1290, 1.0, 1.0)
    return img


# ---- per-frame pipeline -----------------------------------------------------

def process(f, frame):
    fr = tl.FRAMES[f]
    shot, n, ln, k = fr["shot"], fr["n"], fr["len"], fr["k"]

    push = 0.06 if shot == "L" else 0.025
    scale = 1.0 + push * k

    if n < 6:  # punch-in on every cut
        scale *= 1 + (0.12 if shot in FLASH_SHOTS or f == 0 else 0.07) * (1 - ease_out(n / 6))

    zb = 0.0  # zoom-blur transition I -> J
    if shot == "I" and ln - n <= 3:
        p = (4 - (ln - n)) / 3
        zb, scale = 0.06 * p, scale * (1 + 0.10 * p)
    elif shot == "J" and n < 4:
        zb = 0.08 * (1 - n / 4)
        scale *= 1 + 0.12 * (1 - ease_out(n / 4))

    dx = dy = 0.0
    for (s, at), amp in SHAKES.items():
        m = n - at
        if shot == s and 0 <= m < 9:
            a = amp * (1 - m / 9) ** 2
            dx += a * rng.uniform(-1, 1)
            dy += a * rng.uniform(-1, 1)

    img = transform(frame, scale, dx, dy)
    if zb > 0:
        img = zoom_blur(img, zb).astype(np.uint8)

    off = (SRC_H - OUT_H) // 2
    img = img[off:off + OUT_H]

    if (shot in FLASH_SHOTS or f < 4) and n < 4:
        img = rgb_split(img, [16, 9, 4, 1][n])

    img = grade(img)

    if shot == "J":
        img = glow(img, 0.3 + 0.08 * np.sin(f * 1.7) + 0.05 * rng.uniform(-1, 1))
    elif shot in ("K", "L"):
        img = glow(img, 0.18)

    if shot == SWEEP_SHOT and SWEEP_FROM <= n < SWEEP_FROM + SWEEP_LEN:
        img = light_sweep(img, (n - SWEEP_FROM) / SWEEP_LEN)

    img = img * VIGNETTE
    img = draw_text(img, f, dx, dy)

    flash = 0.0
    if shot in FLASH_SHOTS and n < 3:
        flash = [0.75, 0.35, 0.1][n]
    if f < 3:
        flash = max(flash, [0.55, 0.25, 0.08][f])
    if f >= tl.TOTAL - 3:
        flash = max(flash, [0.12, 0.3, 0.5][f - (tl.TOTAL - 3)])
    if flash:
        img = img * (1 - flash) + 255 * flash

    img = img + rng.normal(0, 3.2, img.shape[:2])[..., None]
    return np.clip(img, 0, 255).astype(np.uint8)


def main(src96, dst):
    dec = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-i", src96, "-vf", "scale=in_color_matrix=bt709:in_range=tv",
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        stdout=subprocess.PIPE)
    enc = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{OUT_W}x{OUT_H}", "-r", str(FPS), "-i", "-",
         "-c:v", "libx264", "-preset", "slow", "-crf", "20",
         "-vf", "scale=out_color_matrix=bt709:out_range=tv", "-pix_fmt", "yuv420p",
         "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
         "-color_range", "tv", "-movflags", "+faststart", dst],
        stdin=subprocess.PIPE)
    size = SRC_W * SRC_H * 3
    idx, cur = -1, None
    for f, fr in enumerate(tl.FRAMES):
        want = fr["idx96"]
        while idx < want:  # the edit only moves forward through the source
            buf = dec.stdout.read(size)
            if len(buf) < size:
                break
            cur, idx = np.frombuffer(buf, np.uint8).reshape(SRC_H, SRC_W, 3), idx + 1
        enc.stdin.write(process(f, cur).tobytes())
    enc.stdin.close()
    dec.stdout.close()
    dec.kill()
    enc.wait()
    print(f"{tl.TOTAL} frames written to {dst}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
