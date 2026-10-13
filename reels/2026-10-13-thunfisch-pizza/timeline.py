"""Edit decision list for the tuna pizza reel: shot order, speed ramps, labels.

Shared by fx_video.py and sfx_audio.py so picture and sound stay in sync.
Run it directly to print the output timeline and write timeline.json.
"""
import json
import os

FPS = 24
INTERP = 4  # src96.mp4 holds 4 motion-interpolated frames per source frame

# Source shots (first frame, end frame exclusive), found with scdet.
SHOTS = {
    "A": (0, 15),     # hook: toppings rain onto the sauce spiral
    "B": (15, 25),    # flash-forward: finished pizza
    "C": (25, 42),    # chef + flour
    "D": (42, 52),    # hands press dough
    "E": (52, 69),    # sauce spiral
    "F": (69, 91),    # mozzarella
    "G": (91, 99),    # toppings drop with ham on bare sauce (continuity error, cut)
    "H": (99, 113),   # tuna placed
    "I": (113, 132),  # peel
    "J": (132, 152),  # oven
    "K": (152, 162),  # finished close-up
    "L": (162, 179),  # chef presents
}


def linear(x):
    return x


def slow_down(x, a=0.5):
    # speed starts at (2 - a) and ends at a (relative to the piece average)
    return a * x + (1 - a) * (1 - (1 - x) ** 2)


def speed_up(x):
    return 0.5 * x + 0.5 * x ** 2


def settle(x):
    return 1 - (1 - x) ** 1.5


# (shot, output frames, warp). Source span is always the whole shot.
EDIT = [
    ("A", 26, slow_down),  # slow-mo rain, ~0.9x -> 0.3x
    ("B", 10, linear),
    ("C", 17, linear),
    ("D", 10, linear),
    ("E", 17, linear),
    ("F", 22, linear),
    ("H", 14, linear),
    ("I", 19, linear),
    ("J", 14, speed_up),   # time-lapse into the oven, ~0.7x -> 2.1x
    ("K", 10, linear),
    ("L", 28, settle),     # slow final reveal that comes to rest
]

LABELS = {  # shot -> (step number or None, text)
    "C": (1, "Teig"),
    "D": (1, "Teig"),
    "E": (2, "Tomatensoße"),
    "F": (3, "Mozzarella"),
    "H": (4, "Thunfisch"),
    "I": (4, "Thunfisch"),
    "J": (5, "Ab in den Ofen"),
    "L": (None, "Fertig."),
}

HOOK = ("DIE UNTERSCHÄTZTESTE", "PIZZA?")
HOOK_FRAMES = (1, 44)  # first and last output frame of the hook text


def build():
    """Return per-output-frame records and the output shot start frames."""
    frames, starts, out = [], {}, 0
    for shot, n, warp in EDIT:
        s, e = SHOTS[shot]
        starts[shot] = out
        for i in range(n):
            x = i / (n - 1) if n > 1 else 0
            t = s + (e - 1 - s) * warp(x)
            frames.append({
                "out": out, "shot": shot, "src": t,
                "idx96": int(round(t * INTERP)),
                "n": i, "len": n, "k": i / n,
            })
            out += 1
    return frames, starts


FRAMES, STARTS = build()
TOTAL = len(FRAMES)
DURATION = TOTAL / FPS


def write_json(path):
    with open(path, "w") as fh:
        json.dump({"fps": FPS, "total_frames": TOTAL, "duration": DURATION,
                   "shot_starts": STARTS,
                   "shot_starts_sec": {k: v / FPS for k, v in STARTS.items()}}, fh, indent=2)


if __name__ == "__main__":
    for shot, f in STARTS.items():
        print(f"{shot}  frame {f:3d}  {f / FPS:6.3f}s")
    print(f"total {TOTAL} frames = {DURATION:.3f}s")
    write_json(os.path.join(os.path.dirname(os.path.abspath(__file__)), "timeline.json"))
