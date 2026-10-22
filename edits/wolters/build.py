"""Writes index.html from assets/transcript.json (Whisper word timings).

Run again after a new transcript or a change below: python3 build.py
"""
import json

OFF = 0.3  # the voice starts this late, so no caption sits at exactly 0 s
END = 21.0
W = json.load(open("assets/transcript.json", encoding="utf-8"))
T = lambda i: round(W[i]["start"] + OFF, 2)  # word start in video time
E = lambda i: round(W[i]["end"] + OFF, 2)

# spelling fixes for what is shown (the timing stays Whisper's)
SHOW = {7: "Stellt"}

# scene: id, start, end, kicker, title word indices (karaoke), visual
SCENES = [
    ("intro", 0.0, 4.25, "3 Fragen · 3 Antworten", range(0, 3), "logo"),
    ("q1", 4.25, 9.0, "Frage 1 / 3", range(7, 12), "wristband"),
    ("q2", 9.0, 14.5, "Frage 2 / 3", range(19, 23), "kettlebell"),
    ("q3", 14.5, 17.65, "Frage 3 / 3", range(32, 34), "calendar"),
    ("outro", 17.65, END, "", [], "logo"),
]
# caption groups (word indices); the questions are karaoke in the title instead
GROUPS = [
    range(3, 7),
    range(12, 15),
    range(15, 19),
    range(23, 24),
    range(24, 27),
    range(27, 32),
    range(34, 39),
    range(39, 44),
]


def text(i):
    return SHOW.get(i, W[i]["text"])


def scene_of(t):
    return next(s for s in SCENES if s[1] <= t < s[2])


html_scenes, html_caps, js = [], [], []

for sid, s, e, kicker, title, visual in SCENES:
    d = round(e - s, 2)
    words = " ".join(f'<span class="w" id="{sid}t{i}">{text(i)}</span>' for i in title)
    if visual == "logo":
        big = sid == "outro"
        vis = f'<img class="logo{" logo-big" if big else ""}" id="{sid}v" src="assets/logo-green.png" alt="Therapie und Sport Wolters" />'
    elif visual == "calendar":
        vis = (
            f'<div class="obj" id="{sid}v"><img src="assets/calendar.png" alt="Wochenkalender" />'
            f'<img id="{sid}lit" src="assets/calendar-2x.png" alt="Montag und Donnerstag abgehakt" style="opacity:0" /></div>'
        )
    else:
        pulse = '<div class="pulse" id="p1"></div><div class="pulse" id="p2"></div>' if visual == "wristband" else ""
        vis = f'<div class="obj" id="{sid}v">{pulse}<img src="assets/{visual}.png" alt="{visual}" /></div>'
    head = ""
    if kicker:
        head += f'<div class="kicker" id="{sid}k">{kicker}</div>'
    if title:
        head += f'<div class="title" id="{sid}h">{words}</div>'
    html_scenes.append(
        f'      <div id="{sid}" class="clip scene" data-start="{s}" data-duration="{d}" data-track-index="1">\n'
        f"        {head}\n        {vis}\n      </div>"
    )
    # in: the visual pops, the headline slides (the intro is already on screen at 0 s,
    # it is the thumbnail); out: everything fades before the cut
    if sid != "intro":
        js.append(f'      tl.fromTo("#{sid}v", {{ opacity: 0, scale: 0.82, y: 40 }}, {{ opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(1.6)" }}, {s + 0.02});')
    if kicker and sid != "intro":
        js.append(f'      tl.fromTo("#{sid}k", {{ opacity: 0, y: -16 }}, {{ opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }}, {s + 0.05});')
    if title and sid != "intro":
        js.append(f'      tl.fromTo("#{sid}h", {{ opacity: 0, y: 24 }}, {{ opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }}, {s + 0.08});')
    if sid != "outro":
        js.append(f'      tl.to("#{sid}v", {{ y: -18, duration: {round(d - 0.7, 2)}, ease: "sine.inOut" }}, {s + 0.47});')
        js.append(f'      tl.to("#{sid} > *", {{ opacity: 0, duration: 0.2, ease: "power2.in" }}, {round(e - 0.22, 2)});')
    for i in title:
        js.append(f'      tl.to("#{sid}t{i}", {{ color: "#B3FF00", scale: 1.08, duration: 0.08, ease: "power2.out" }}, {T(i)});')
        js.append(f'      tl.to("#{sid}t{i}", {{ scale: 1, duration: 0.2, ease: "power2.inOut" }}, {round(T(i) + 0.1, 2)});')

# moments: the chip pulse on "Chip", the two days on "Zweimal"
chip = T(14)
for n, at in (("p1", chip), ("p2", round(chip + 0.35, 2))):
    js.append(f'      tl.fromTo("#{n}", {{ scale: 0.4, opacity: 0.9 }}, {{ scale: 1.5, opacity: 0, duration: 0.9, ease: "power2.out" }}, {at});')
two = T(34)
js.append(f'      tl.to("#q3lit", {{ opacity: 1, duration: 0.25, ease: "power2.out" }}, {two});')
js.append(f'      tl.to("#q3v", {{ scale: 1.06, duration: 0.12, ease: "power2.out", yoyo: true, repeat: 1 }}, {two});')

for gi, g in enumerate(GROUPS):
    g = list(g)
    s = round(T(g[0]) - 0.08, 2)
    nxt = round(T(GROUPS[gi + 1][0]) - 0.1, 2) if gi + 1 < len(GROUPS) else END - 0.3
    e = round(min(nxt, E(g[-1]) + 0.7, scene_of(T(g[0]))[2] - 0.02), 2)
    spans = " ".join(f'<span class="w" id="c{gi}w{i}">{text(i)}</span>' for i in g)
    html_caps.append(
        f'        <div id="c{gi}" class="clip cap" data-start="{s}" data-duration="{round(e - s, 2)}" data-track-index="2"><div class="capin" id="c{gi}in">{spans}</div></div>'
    )
    js.append(f'      tl.fromTo("#c{gi}in", {{ y: 26, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.16, ease: "power3.out" }}, {s});')
    for i in g:
        js.append(f'      tl.to("#c{gi}w{i}", {{ color: "#B3FF00", scale: 1.1, duration: 0.08, ease: "power2.out" }}, {T(i)});')
        js.append(f'      tl.to("#c{gi}w{i}", {{ scale: 1, duration: 0.2, ease: "power2.inOut" }}, {round(T(i) + 0.1, 2)});')
    js.append(f'      tl.to("#c{gi}in", {{ opacity: 0, duration: 0.12, ease: "power2.in" }}, {round(e - 0.13, 2)});')

NL = "\n"
html = f"""<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="gsap.min.js"></script>
    <style>
      :root {{
        --ground: #0c0f0d;
        --ground-2: #1c2610;
        --ink: #ffffff;
        --brand: #b3ff00;
        --font: "Nunito";
      }}
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 1080px; height: 1920px; overflow: hidden; background: var(--ground); }}
      #root {{ position: relative; width: 100%; height: 100%; overflow: hidden; font-family: var(--font);
        background: radial-gradient(circle at 50% 44%, var(--ground-2) 0%, var(--ground) 60%); }}
      .scene {{ position: absolute; inset: 0; }}
      .kicker {{ position: absolute; top: 240px; width: 100%; text-align: center; font-weight: 800; font-size: 34px;
        letter-spacing: 0.16em; text-transform: uppercase; color: var(--brand); }}
      .title {{ position: absolute; top: 298px; width: 100%; padding: 0 80px; text-align: center; font-weight: 900;
        font-size: 84px; line-height: 1.08; color: var(--ink); }}
      .obj {{ position: absolute; left: 60px; top: 330px; width: 960px; height: 960px; }}
      .obj img {{ position: absolute; inset: 0; width: 100%; height: 100%; }}
      .pulse {{ position: absolute; left: 368px; top: 144px; width: 220px; height: 220px; border-radius: 50%;
        border: 10px solid var(--brand); opacity: 0; }}
      .logo {{ position: absolute; left: 190px; top: 520px; width: 700px; }}
      .logo-big {{ left: 130px; top: 420px; width: 820px; }}
      .cap {{ position: absolute; top: 1170px; width: 100%; overflow: visible; }}
      .capin {{ width: 100%; padding: 0 60px; text-align: center; font-weight: 900; font-size: 68px; line-height: 1.12;
        color: var(--ink); text-shadow: 0 6px 24px rgba(0,0,0,0.5); }}
      .w {{ display: inline-block; margin: 0 0.08em; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{END}" data-width="1080" data-height="1920">
{NL.join(html_scenes)}
      <div id="captions" class="clip" data-start="0" data-duration="{END}" data-track-index="2" data-track-kind="captions">
{NL.join(html_caps)}
      </div>
      <audio id="voice" class="clip" data-start="{OFF}" data-duration="19.49" data-track-index="5" src="assets/voice.mp3"></audio>
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
open("index.html", "w", encoding="utf-8").write(html)
print("index.html written")
