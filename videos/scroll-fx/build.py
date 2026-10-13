"""Inject scroll effects into the restaurant's startseite.html.

Input : videos/website-einbau/startseite.html (user's page with the CSS hero animation)
Output: videos/website-einbau/startseite.html (same page + scroll effects)

Everything is plain CSS + a small vanilla-JS scroll handler (transform/opacity
only, rAF-throttled, passive listeners), so it runs on iPhone Safari without
any video or special file formats. Respects prefers-reduced-motion.
"""
from pathlib import Path

PAGE = Path("/home/user/claude/videos/website-einbau/startseite.html")
src = PAGE.read_text(encoding="utf-8")
assert "SCROLL-EFFEKTE" not in src, "already injected"

CSS = r"""
  /* ===== SCROLL-EFFEKTE ===== */
  #scrollbar{position:fixed;left:0;top:0;height:3px;width:100%;background:var(--accent);transform-origin:0 50%;transform:scaleX(0);z-index:200;pointer-events:none}
  .split .w{display:inline-block;opacity:0;transform:translateY(.45em);transition:opacity .6s cubic-bezier(.2,.8,.2,1),transform .6s cubic-bezier(.2,.8,.2,1);transition-delay:calc(var(--i) * 70ms)}
  .split.in .w{opacity:1;transform:none}
  .pillar.reveal{transform:translateY(46px) rotateX(10deg);transform-origin:50% 100%}
  .pillars{perspective:900px}
  .pillar.reveal.in{transform:none}

  /* Unsere Küche – Karten-Stapel beim Scrollen */
  .kueche{position:relative;height:450vh;height:450svh;background:var(--paper);border-top:1px solid var(--line)}
  .kstage{position:sticky;top:0;height:100vh;height:100svh;overflow:hidden;display:flex;align-items:center}
  .kgrid{display:grid;grid-template-columns:1fr;gap:22px;align-items:center;width:100%;padding-top:64px}
  @media(min-width:880px){.kgrid{grid-template-columns:1fr 1fr;gap:60px;padding-top:40px}}
  .ktext{position:relative}
  .knames{position:relative;height:clamp(140px,22vh,200px)}
  .kn{position:absolute;inset:0;opacity:0;transform:translateY(14px);transition:opacity .45s ease,transform .45s ease}
  .kn.on{opacity:1;transform:none}
  .kn h3{font-family:"Playfair Display","Didot",Georgia,serif;font-weight:700;font-size:clamp(34px,6vw,58px);line-height:1.05;color:var(--ink)}
  .kn h3 em{color:var(--accent);font-style:italic}
  .kn p{color:var(--muted);font-size:clamp(16px,2vw,19px);margin-top:12px;max-width:440px}
  .kmeta{display:flex;align-items:center;gap:16px;margin:6px 0 22px;color:var(--muted);font-size:14px;font-weight:600;letter-spacing:1px}
  .kmeta b{color:var(--accent);font-size:18px}
  .kline{flex:0 0 140px;height:2px;background:var(--line);position:relative;overflow:hidden}
  .kline i{position:absolute;inset:0;background:var(--accent);transform-origin:0 50%;transform:scaleX(0)}
  .kcards{position:relative;width:min(74vw,330px);aspect-ratio:4/5;margin:0 auto}
  @media(min-width:880px){.kcards{width:min(34vw,400px)}}
  @media(max-width:879px){.ktext .cta{display:none}.knames{height:120px}.kgrid{gap:10px}}
  .kc{position:absolute;inset:0;margin:0;opacity:0;border-radius:24px;overflow:hidden;background:#e6dccb;box-shadow:0 24px 60px rgba(120,90,50,.22);will-change:transform;transform:translate3d(0,115%,0)}
  .kc img{width:100%;height:100%;object-fit:cover}
  .kc figcaption{position:absolute;left:0;right:0;bottom:0;padding:48px 20px 18px;background:linear-gradient(transparent,rgba(23,15,8,.72));color:#fff;font-family:"Playfair Display",Georgia,serif;font-size:26px;font-weight:600;display:flex;align-items:baseline;gap:10px}
  .kc figcaption span{font-family:"Segoe UI",system-ui,sans-serif;font-size:13px;letter-spacing:2px;color:var(--gold-soft);font-weight:700}
  .kueche.static{height:auto}
  .kueche.static .kstage{position:relative;height:auto;padding:80px 0}
  .kueche.static .kcards{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;width:100%;aspect-ratio:auto}
  .kueche.static .kc{position:relative;inset:auto;aspect-ratio:4/5;transform:none}
  .kueche.static .knames{height:auto}.kueche.static .kn{position:relative;opacity:1;transform:none;display:none}.kueche.static .kn:first-child{display:block}
  .kueche.static .kmeta{display:none}
"""

PROGRESS = '<div id="scrollbar" aria-hidden="true"></div>\n'

CATS = [
    ("pizza", "Pizza", "Pizza <em>aus dem Ofen</em>", "Knuspriger Teig, gute Zutaten – direkt aus dem Ofen."),
    ("pasta", "Pasta", "Raffinierte <em>Pasta</em>", "Unsere Nudelgerichte – klassisch und kreativ."),
    ("carne", "Carne", "Vom <em>Grill</em>", "Gegrilltes Fleisch, auf den Punkt zubereitet."),
    ("pesce", "Pesce", "Frischer <em>Fisch</em>", "Fisch und Meeresfrüchte, frisch zubereitet."),
    ("insalate", "Insalate", "Knackige <em>Salate</em>", "Täglich frische, sorgfältig ausgewählte Zutaten."),
    ("dolci", "Dolci", "Süßer <em>Abschluss</em>", "Italienische Desserts für den perfekten Ausklang."),
]
names = "\n".join(
    f'          <div class="kn{" on" if i == 0 else ""}"><h3>{h}</h3><p>{d}</p></div>'
    for i, (_, _, h, d) in enumerate(CATS)
)
cards = "\n".join(
    f'        <figure class="kc"><img src="/app/img/{f}.webp" alt="{t}" loading="lazy"><figcaption><span>{i + 1:02d}</span>{t}</figcaption></figure>'
    for i, (f, t, _, _) in enumerate(CATS)
)
SECTION = f"""<!-- UNSERE KÜCHE (Scroll-Effekt) -->
<section class="kueche" id="kueche" aria-label="Unsere Küche">
  <div class="kstage">
    <div class="wrap kgrid">
      <div class="ktext">
        <div class="sec-eyebrow">Unsere Küche</div>
        <div class="knames">
{names}
        </div>
        <div class="kmeta"><span><b class="kcount">01</b> / {len(CATS):02d}</span><span class="kline"><i></i></span></div>
        <a class="cta primary" href="/app/">Speisekarte ansehen →</a>
      </div>
      <div class="kcards">
{cards}
      </div>
    </div>
  </div>
</section>

"""

JS = r"""
<script>
/* ===== SCROLL-EFFEKTE ===== */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bar = document.getElementById('scrollbar');
  var k = document.getElementById('kueche');
  var cards = k ? Array.prototype.slice.call(k.querySelectorAll('.kc')) : [];
  var names = k ? Array.prototype.slice.call(k.querySelectorAll('.kn')) : [];
  var count = k ? k.querySelector('.kcount') : null;
  var line = k ? k.querySelector('.kline i') : null;
  var feiern = document.getElementById('feiern');
  var heroCard = document.querySelector('.hero .hero-photo');
  var row = document.querySelector('.marquee .row');
  var N = cards.length, active = 0;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  /* Überschriften Wort für Wort */
  document.querySelectorAll('h2.title, .feiern h2').forEach(function (h) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i++); s.textContent = part; frag.appendChild(s);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1) { walk(c); }
      });
    })(h);
    h.classList.add('split');
  });

  if (reduce) { if (k) k.classList.add('static'); }

  var ticking = false;
  function update() {
    ticking = false;
    var y = window.pageYOffset || document.documentElement.scrollTop;
    var vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;
    if (bar) bar.style.transform = 'scaleX(' + clamp(max > 0 ? y / max : 0, 0, 1) + ')';
    if (reduce) return;

    if (heroCard) heroCard.style.transform = 'translate3d(0,' + (clamp(y, 0, 900) * 0.12).toFixed(1) + 'px,0)';

    if (k && N) {
      var r = k.getBoundingClientRect();
      var total = k.offsetHeight - vh;
      var p = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
      var idx = p * (N - 1);
      for (var i = 0; i < N; i++) {
        var d = idx - i, ty, sc = 1, rot, op = 1;
        if (i === 0 && d < 0) d = 0;
        if (d <= -1) { ty = 120; rot = 9; op = 0; }
        else if (d < 0) { var t = ease(d + 1); ty = (1 - t) * 120; rot = (1 - t) * 9; op = Math.min(1, (d + 1) * 2.5); }
        else { var depth = Math.min(d, 3); ty = -depth * 5; sc = 1 - depth * 0.07; rot = (i % 2 ? 1 : -1) * depth * 3; op = d > 3 ? 0 : 1; }
        var c = cards[i];
        c.style.transform = 'translate3d(0,' + ty.toFixed(2) + '%,0) scale(' + sc.toFixed(3) + ') rotate(' + rot.toFixed(2) + 'deg)';
        c.style.opacity = op;
        c.style.zIndex = i;
      }
      var a = clamp(Math.round(idx), 0, N - 1);
      if (a !== active) {
        names[active].classList.remove('on'); names[a].classList.add('on'); active = a;
        if (count) count.textContent = (a + 1 < 10 ? '0' : '') + (a + 1);
      }
      if (line) line.style.transform = 'scaleX(' + (N > 1 ? idx / (N - 1) : 1).toFixed(3) + ')';
    }

    if (feiern) {
      var fr = feiern.getBoundingClientRect();
      var fp = clamp((vh - fr.top) / (vh * 0.85), 0, 1);
      var rad = (14 + ease(fp) * 136).toFixed(1);
      feiern.style.webkitClipPath = feiern.style.clipPath = 'circle(' + rad + '% at 50% 50%)';
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();

  /* Laufband: schneller beim schnellen Scrollen */
  if (!reduce && row && row.getAnimations) {
    var lastY = window.pageYOffset, vel = 0, spinning = false;
    function spin() {
      var anims = row.getAnimations();
      vel *= 0.9;
      anims.forEach(function (an) { an.playbackRate = 1 + Math.min(vel, 6); });
      if (vel > 0.02) requestAnimationFrame(spin); else { anims.forEach(function (an) { an.playbackRate = 1; }); spinning = false; }
    }
    window.addEventListener('scroll', function () {
      var yy = window.pageYOffset; vel = Math.min(vel + Math.abs(yy - lastY) / 60, 6); lastY = yy;
      if (!spinning) { spinning = true; requestAnimationFrame(spin); }
    }, { passive: true });
  }
})();
</script>
"""

out = src
out = out.replace("</style>\n</head>", CSS + "</style>\n</head>", 1)
out = out.replace("<body>\n", "<body>\n" + PROGRESS, 1)
out = out.replace("<!-- MARQUEE -->", SECTION + "<!-- MARQUEE -->", 1)
out = out.replace("</script>\n</body>", "</script>\n" + JS + "</body>", 1)
for marker in ("SCROLL-EFFEKTE ===== */\n  #scrollbar", 'id="scrollbar"', 'id="kueche"', "/* ===== SCROLL-EFFEKTE ===== */\n(function"):
    assert marker in out, marker
PAGE.write_text(out, encoding="utf-8", newline="")
print("ok", len(out) // 1024, "KB")
