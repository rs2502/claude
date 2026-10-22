"""Writes index.html: the Wolters reel, cut to the voice.

Word times come from assets/transcript.json (Whisper on assets/voice.wav, the voice with
its pauses shortened). Run again after any change here: python3 build.py
"""
import json

OFF = 0.25  # the voice starts this late
END = 16.9
W = json.load(open("assets/transcript.json", encoding="utf-8"))
T = lambda i: round(W[i]["start"] + OFF, 3)
FRAME = 1 / 30

# shots: id, start, end. Every cut lands just before the word that motivates it.
SHOTS = [
    ("hook", 0.0, 1.2),
    ("three", 1.2, 3.35),
    ("device", 3.35, 4.95),
    ("chip", 4.95, 6.15),
    ("relax", 6.15, 7.2),
    ("fit", 7.2, 8.5),
    ("nein", 8.5, 9.15),
    ("stand", 9.15, 11.8),
    ("often", 11.8, 12.6),
    ("week", 12.6, 14.1),
    ("cta", 14.1, END),
]
SHOT = {s[0]: s for s in SHOTS}

# kinetic text: shot, lines of word indices, keywords (bigger, green), optional style
TEXT = [
    ("hook", [[0], [1, 2]], {0}, "xl"),
    ("three", [[4], [5, 6]], {4}, ""),
    ("device", [[7, 8], [9, 10, 11]], {10}, ""),
    ("chip", [[12], [13, 14]], {14}, ""),
    ("relax", [[15, 16], [17, 18]], {18}, ""),
    ("fit", [[19, 20], [21, 22]], {21}, ""),
    ("nein", [[23]], set(), "slab"),
    ("stand", [[24, 25], [26], [27, 28]], set(), "sm shade", (9.15, 10.45)),
    ("stand", [[29, 30], [31]], {31}, "shade", (10.45, 11.8)),
    ("often", [[32], [33]], {33}, "xl mid"),
    ("week", [[34], [35, 36], [37, 38]], {34}, ""),
    ("cta", [[39, 40], [41, 42], [43]], {40}, "sm"),
]
SHOW = {}  # spelling fixes for display, by word index


def word(i):
    return SHOW.get(i, W[i]["text"]).upper()


html, js, audio = [], [], []
add = js.append

# ---- the shots' visuals ------------------------------------------------------------
def shot_div(sid, inner, extra_cls=""):
    _, s, e = SHOT[sid]
    html.append(
        f'      <div id="{sid}" class="clip shot {extra_cls}" data-start="{s}" data-duration="{round(e - s, 3)}" '
        f'data-track-index="1">\n{inner}\n      </div>'
    )


def photo(pid, extra=""):
    return (
        f'        <div class="stage"><div class="photo" id="{pid}">'
        f'<img src="assets/machine-fg.png" alt="Training am Gerät" />{extra}</div></div>'
    )


shot_div("hook", '        <div class="hero" id="kb"><img src="assets/kettlebell.png" alt="Kettlebell" /></div>')
shot_div("three", '        <div class="giant" id="g3">3</div>')
shot_div("device", photo("m1"))
shot_div("chip", '        <div class="ring" id="r1"></div><div class="ring" id="r2"></div>')
shot_div("relax", photo("m2"))
shot_div("fit", "")
# the orbit renders sit at root level: a timed <video> must not be inside a timed wrapper
for vid, sid, src in (("v1", "chip", "wristband-orbit"), ("v2", "fit", "kettlebell-orbit")):
    _, s, e = SHOT[sid]
    html.append(
        f'      <video id="{vid}" class="clip hero-v" data-start="{s}" data-duration="{round(e - s, 3)}" '
        f'data-track-index="3" src="assets/{src}.webm" muted playsinline></video>'
    )
shot_div("nein", "", "flash")
shot_div("stand", photo("m3", '<div class="spot" id="spot"></div>'))
shot_div("often", "")
shot_div(
    "week",
    '        <div class="hero" id="cal"><img src="assets/calendar.png" alt="Wochenkalender" />'
    '<img id="callit" src="assets/calendar-2x.png" alt="Montag und Donnerstag abgehakt" style="opacity:0" /></div>',
)
shot_div("cta", '        <div class="logo" id="logo"><img src="assets/logo-green.png" alt="Therapie und Sport Wolters" /></div>')

# hook: the kettlebell is already falling on frame 0 and lands on "Training"
land = T(0) - 0.03
add(f'      tl.fromTo("#kb", {{ y: -170, rotation: -14 }}, {{ y: 0, rotation: 0, duration: {land}, ease: "power3.in" }}, 0);')
add(f'      tl.to("#kb", {{ scaleY: 0.9, scaleX: 1.08, duration: 0.06, ease: "power2.out" }}, {land});')
add(f'      tl.to("#kb", {{ scaleY: 1, scaleX: 1, duration: 0.35, ease: "elastic.out(1, 0.45)" }}, {round(land + 0.06, 3)});')
add(f'      tl.to("#hook", {{ y: 22, duration: 0.05, ease: "power2.out", yoyo: true, repeat: 3 }}, {land});')
add(f'      tl.to("#kb", {{ y: -30, duration: 0.7, ease: "sine.out" }}, {round(land + 0.4, 3)});')
# the giant 3 slams on "Drei" and keeps creeping closer
add(f'      tl.fromTo("#g3", {{ scale: 2.6, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.18, ease: "power4.out" }}, {T(3) - 0.04});')
add(f'      tl.to("#g3", {{ scale: 1.12, rotation: -4, duration: 1.8, ease: "sine.out" }}, {T(3) + 0.14});')
# device: a push in on the screen while the stage turns (a camera orbit on a cut-out photo)
_, s, e = SHOT["device"]
add(f'      tl.fromTo("#m1", {{ scale: 0.92, rotationY: -16, x: 60 }}, {{ scale: 1.9, rotationY: 9, x: -40, duration: {round(e - s, 3)}, ease: "power2.inOut" }}, {s});')
# chip: rings go out from the band on "Chip"
c = T(14)
for n, at in (("r1", c), ("r2", round(c + 0.2, 3))):
    add(f'      tl.fromTo("#{n}", {{ scale: 0.3, opacity: 1 }}, {{ scale: 1.6, opacity: 0, duration: 0.8, ease: "power2.out" }}, {at});')
add(f'      tl.fromTo("#v1", {{ scale: 0.85 }}, {{ scale: 1, duration: 0.4, ease: "back.out(1.7)" }}, 4.95);')
# relax: a slow orbit the other way round, closer on the back
_, s, e = SHOT["relax"]
add(f'      tl.fromTo("#m2", {{ scale: 1.35, rotationY: 12, x: 120, y: 260 }}, {{ scale: 1.5, rotationY: -6, x: 40, y: 230, duration: {round(e - s, 3)}, ease: "sine.inOut" }}, {s});')
add(f'      tl.fromTo("#v2", {{ scale: 0.8, y: 80 }}, {{ scale: 1, y: 0, duration: 0.4, ease: "back.out(1.6)" }}, 7.2);')
# stand: tilt down from the screen to the feet, landing on "stehst"
_, s, e = SHOT["stand"]
st = T(31)
add(f'      tl.fromTo("#m3", {{ scale: 1.5, y: 190 }}, {{ scale: 1.32, y: -600, duration: {round(st - s, 3)}, ease: "power2.inOut" }}, {s});')
add(f'      tl.to("#m3", {{ scale: 1.36, duration: {round(e - st, 3)}, ease: "sine.out" }}, {st});')
add(f'      tl.fromTo("#spot", {{ scale: 0.2, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)" }}, {st});')
# week: the calendar lands, then the two days tick on "Zweimal"
_, s, e = SHOT["week"]
add(f'      tl.fromTo("#cal", {{ y: 700, rotation: 10 }}, {{ y: 0, rotation: -2, duration: 0.35, ease: "back.out(1.4)" }}, {s});')
tick = round(T(34) + 0.18, 3)
add(f'      tl.to("#callit", {{ opacity: 1, duration: 0.15, ease: "power2.out" }}, {tick});')
add(f'      tl.to("#cal", {{ scale: 1.07, duration: 0.1, ease: "power2.out", yoyo: true, repeat: 1 }}, {tick});')
add(f'      tl.to("#cal", {{ rotation: 1, duration: {round(e - s - 0.36, 3)}, ease: "sine.inOut" }}, {round(s + 0.36, 3)});')
# cta: the logo lands with the bass hit and breathes
_, s, e = SHOT["cta"]
add(f'      tl.fromTo("#logo", {{ scale: 0.4, opacity: 0, rotation: -6 }}, {{ scale: 1, opacity: 1, rotation: 0, duration: 0.4, ease: "back.out(1.8)" }}, {s + 0.05});')
add(f'      tl.to("#logo", {{ scale: 1.05, duration: {round(e - s - 0.6, 3)}, ease: "sine.inOut" }}, {s + 0.45});')

# ---- kinetic text ----------------------------------------------------------------------
for n, (sid, lines, keys, style, *win) in enumerate(TEXT):
    s, e = win[0] if win else SHOT[sid][1:]
    rows = []
    for li, line in enumerate(lines):
        spans = "".join(
            f'<span class="w{" k" if i in keys else ""}" id="t{i}">{word(i)}</span>' for i in line
        )
        rows.append(f'<div class="line">{spans}</div>')
    html.append(
        f'      <div id="txt{n}" class="clip txt {style}" data-start="{s}" data-duration="{round(e - s, 3)}" '
        f'data-track-index="2">{"".join(rows)}</div>'
    )
    k = 0
    for line in lines:
        for i in line:
            t = max(T(i) - 0.02, s)
            if sid == "hook" and i == 0:
                t = 0  # frame 0 is the thumbnail: the first word is already there
                add(f'      tl.to("#t0", {{ color: "#B3FF00", scale: 1.06, duration: 0.08, ease: "power2.out" }}, {land});')
                add(f'      tl.to("#t0", {{ scale: 1, duration: 0.25, ease: "power2.inOut" }}, {round(land + 0.1, 3)});')
                continue
            frm = ["y: 90", "x: -140", "x: 140", "y: -80"][k % 4]
            if i in keys:
                add(f'      tl.fromTo("#t{i}", {{ scale: 2.2, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.16, ease: "power4.out" }}, {t});')
            else:
                add(f'      tl.fromTo("#t{i}", {{ {frm}, opacity: 0 }}, {{ x: 0, y: 0, opacity: 1, duration: 0.16, ease: "power3.out" }}, {t});')
            k += 1

# ---- sound -------------------------------------------------------------------------------
PEAK = {"whoosh": 0.162, "impact-bass-1": 0.073, "impact-bass-2": 1.986, "click": 0.073, "pop": 0.12}
LENGTH = {"whoosh": 0.575, "impact-bass-1": 2.12, "impact-bass-2": 2.59, "click": 0.37, "pop": 0.72}
cues = [
    ("impact-bass-1", land, 0.55, 1),
    ("whoosh", 1.2, 0.3, 1.0),
    ("whoosh", 3.35, 0.3, 0.85),
    ("whoosh", 4.95, 0.32, 1.15),
    ("click", T(14), 0.5, 1),
    ("whoosh", 7.2, 0.3, 0.92),
    ("impact-bass-1", T(23), 0.6, 1.08),
    ("whoosh", 9.15, 0.28, 1.08),
    ("pop", st, 0.4, 1),
    ("whoosh", 11.8, 0.32, 0.88),
    ("pop", tick, 0.4, 1.1),
    ("impact-bass-2", SHOT["cta"][1] + 0.1, 0.5, 1),
]
for n, (name, hit, vol, rate) in enumerate(cues):
    at = round(max(0, hit - PEAK[name] / rate + FRAME), 3)
    audio.append(
        f'      <audio id="sfx{n}" class="clip" data-start="{at}" data-duration="{round(min(LENGTH[name] / rate, END - at), 3)}" '
        f'data-track-index="{6 + n}" '
        f'data-volume="{vol}" data-playback-rate="{rate}" src="assets/sfx/{name}.mp3"></audio>'
    )
# the voice also sets the NEIN flash
add(f'      tl.fromTo("#nein", {{ backgroundColor: "#ffffff" }}, {{ backgroundColor: "#b3ff00", duration: 0.12, ease: "power2.out" }}, 8.5);')

NL = "\n"
page = f"""<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="gsap.min.js"></script>
    <style>
      :root {{
        --ground: #0b0e0c;
        --ground-2: #1d2a0c;
        --ink: #ffffff;
        --brand: #b3ff00;
        --font: "Nunito";
      }}
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 1080px; height: 1920px; overflow: hidden; background: var(--ground); }}
      #root {{ position: relative; width: 100%; height: 100%; overflow: hidden; font-family: var(--font);
        background: radial-gradient(circle at 50% 52%, var(--ground-2) 0%, var(--ground) 58%); }}
      .shot {{ position: absolute; inset: 0; }}
      .flash {{ background: var(--brand); }}
      .stage {{ position: absolute; inset: 0; perspective: 1600px; }}
      .photo {{ position: absolute; left: -160px; top: 620px; width: 1400px; height: 1250px; }}
      #m1 {{ transform-origin: 744px 258px; }}
      #m3 {{ transform-origin: 700px 625px; }}
      .photo img {{ width: 100%; height: 100%; }}
      .spot {{ position: absolute; left: 700px; top: 975px; width: 300px; height: 84px; border-radius: 50%;
        border: 8px solid var(--brand); box-shadow: 0 0 40px var(--brand); }}
      .hero {{ position: absolute; left: 40px; top: 600px; width: 1000px; height: 1000px; }}
      .hero img {{ position: absolute; inset: 0; width: 100%; height: 100%; }}
      .hero-v {{ position: absolute; left: -40px; top: 500px; width: 1160px; height: 1160px; }}
      .ring {{ position: absolute; left: 190px; top: 710px; width: 700px; height: 700px; border-radius: 50%;
        border: 14px solid var(--brand); opacity: 0; }}
      .giant {{ position: absolute; top: 560px; width: 100%; text-align: center; font-weight: 900; font-size: 1000px;
        line-height: 1; color: var(--brand); }}
      .logo {{ position: absolute; left: 220px; top: 800px; width: 640px; }}
      .logo img {{ width: 100%; }}
      .txt {{ position: absolute; top: 230px; width: 100%; padding: 0 50px; text-align: center; font-weight: 900;
        color: var(--ink); line-height: 1.0; text-transform: uppercase; overflow: visible; }}
      .txt .line {{ font-size: 112px; }}
      .txt.sm .line {{ font-size: 92px; }}
      .txt.xl .line {{ font-size: 150px; }}
      .txt.slab {{ top: 700px; }}
      .txt.mid {{ top: 640px; }}
      .txt.mid .line {{ font-size: 230px; }}
      .txt.shade {{ text-shadow: 0 4px 30px rgba(0, 0, 0, 0.85), 0 0 8px rgba(0, 0, 0, 0.6); }}
      .txt.slab .line {{ font-size: 330px; }}
      .txt.slab .w {{ color: var(--ground); }}
      .w {{ display: inline-block; margin: 0 0.12em; }}
      .k {{ color: var(--brand); font-size: 1.32em; }}
      #often .x {{ }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{END}" data-width="1080" data-height="1920">
{NL.join(html)}
      <audio id="voice" class="clip" data-start="{OFF}" data-track-index="5" data-volume="1" src="assets/voice.wav"></audio>
{NL.join(audio)}
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
{NL.join(js)}
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
"""
open("index.html", "w", encoding="utf-8").write(page)
print("index.html written")
