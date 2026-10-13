"""Visual FX pass for the tuna pizza reel.

Reads the source clip frame by frame, applies cut-synced effects
(punch-in zooms, flashes, RGB split, shake, zoom-blur transition, oven glow,
light sweep, grade, vignette, grain) and writes a 1080x1920 silent video.

Usage: python3 fx_video.py <input.mov> <output_silent.mp4>
"""
import subprocess
import sys

import cv2
import numpy as np

SRC_W, SRC_H, FPS = 1080, 1950, 24
OUT_W, OUT_H = 1080, 1920

# Hard cuts in the source (first frame of each new shot), found with scdet.
CUTS = [15, 25, 42, 52, 69, 91, 99, 113, 132, 152, 162]
# Shots: A hook drop, B finished close-up, C chef + flour, D dough, E sauce,
# F cheese, G toppings drop, H tuna, I peel, J oven, K finished close-up,
# L chef presents.
FLASH_CUTS = {15, 91, 152}          # big beats get a white flash + RGB split
SHAKES = {0: 16, 10: 6, 42: 7, 91: 14, 99: 5, 152: 10}  # frame -> px amplitude
ZOOM_TRANSITION = 132               # zoom-blur into the oven shot
OVEN = range(132, 152)
SWEEP = range(165, 178)             # light sweep over the final pizza


def ease_out(x):
    return 1 - (1 - x) ** 3


def shot_start(f):
    return max([0] + [c for c in CUTS if c <= f])


def shot_end(f):
    later = [c for c in CUTS if c > f]
    return later[0] if later else 179


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
    out[..., 0] = np.roll(img[..., 0], int(px), axis=1)   # R right
    out[..., 2] = np.roll(img[..., 2], -int(px), axis=1)  # B left
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
rng = np.random.default_rng(7)


def grade(img):
    img = cv2.LUT(img, LUT)
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * 1.12, 0, 255)
    img = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB).astype(np.float32)
    img[..., 0] *= 1.035  # warm
    img[..., 2] *= 0.96
    return img


def glow(img, amount):
    bright = np.clip(img - 150, 0, None) * 1.6
    halo = cv2.GaussianBlur(bright, (0, 0), 28)
    return img + halo * amount


def light_sweep(img, k):
    # diagonal warm-white band travelling top-left -> bottom-right
    pos = -0.3 + 1.6 * k
    d = (xx / OUT_W * 0.6 + yy / OUT_H * 0.4) - pos
    band = np.exp(-(d / 0.045) ** 2)[..., None]
    return img + band * np.array([255, 235, 200], np.float32) * 0.28


def process(f, frame):
    img = frame
    start, end = shot_start(f), shot_end(f)
    k_shot = (f - start) / max(1, end - start)

    # slow push-in inside each shot, stronger on the final hero shot
    push = 0.06 if start == 162 else 0.025
    scale = 1.0 + push * k_shot

    # punch-in on every cut (and on frame 0 for the hook)
    for c in [0] + CUTS:
        n = f - c
        if 0 <= n < 6:
            scale *= 1 + (0.12 if c in FLASH_CUTS or c == 0 else 0.07) * (1 - ease_out(n / 6))

    # zoom-blur transition into the oven
    zb = 0.0
    n = f - ZOOM_TRANSITION
    if -3 <= n < 0:
        zb = 0.06 * (n + 4) / 3
        scale *= 1 + 0.10 * (n + 4) / 3
    elif 0 <= n < 4:
        zb = 0.08 * (1 - n / 4)
        scale *= 1 + 0.12 * (1 - ease_out(n / 4))

    # camera shake
    dx = dy = 0.0
    for c, amp in SHAKES.items():
        n = f - c
        if 0 <= n < 9:
            a = amp * (1 - n / 9) ** 2
            dx += a * rng.uniform(-1, 1)
            dy += a * rng.uniform(-1, 1)

    img = transform(img, scale, dx, dy)
    if zb > 0:
        img = zoom_blur(img, zb).astype(np.uint8)

    # crop 1950 -> 1920
    off = (SRC_H - OUT_H) // 2
    img = img[off:off + OUT_H]

    # RGB split on flash beats
    for c in FLASH_CUTS | {0}:
        n = f - c
        if 0 <= n < 4:
            img = rgb_split(img, [16, 9, 4, 1][n])

    img = grade(img)

    if f in OVEN:
        flick = 0.3 + 0.08 * np.sin(f * 1.7) + 0.05 * rng.uniform(-1, 1)
        img = glow(img, flick)
    elif start == 162 or start == 152:
        img = glow(img, 0.18)

    if f in SWEEP:
        img = light_sweep(img, (f - SWEEP.start) / len(SWEEP))

    img = img * VIGNETTE

    # white flashes (frame 0 + last frames make the loop seamless)
    flash = 0.0
    for c in FLASH_CUTS:
        n = f - c
        if 0 <= n < 3:
            flash = max(flash, [0.75, 0.35, 0.1][n])
    if f < 3:
        flash = max(flash, [0.55, 0.25, 0.08][f])
    if f >= 176:
        flash = max(flash, [0.12, 0.3, 0.5][f - 176])
    if flash:
        img = img * (1 - flash) + 255 * flash

    img = img + rng.normal(0, 3.2, img.shape[:2])[..., None]  # grain
    return np.clip(img, 0, 255).astype(np.uint8)


def main(src, dst):
    dec = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-i", src, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        stdout=subprocess.PIPE)
    enc = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{OUT_W}x{OUT_H}", "-r", str(FPS), "-i", "-",
         "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p",
         "-movflags", "+faststart", dst],
        stdin=subprocess.PIPE)
    size = SRC_W * SRC_H * 3
    f = 0
    while True:
        buf = dec.stdout.read(size)
        if len(buf) < size:
            break
        frame = np.frombuffer(buf, np.uint8).reshape(SRC_H, SRC_W, 3)
        enc.stdin.write(process(f, frame).tobytes())
        f += 1
    enc.stdin.close()
    enc.wait()
    dec.wait()
    print(f"{f} frames written to {dst}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
