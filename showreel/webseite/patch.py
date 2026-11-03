"""Fügt Logo-Aufbau + federnde Buttons (aus dem Showreel) in die Startseite ein. Nur Ergänzungen."""
import sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()

def once(a, b):
    global s
    assert s.count(a) == 1, f'nicht eindeutig gefunden: {a[:60]}'
    s = s.replace(a, b)

CSS = '''
  /* ── Animation aus dem Showreel: Logo-Aufbau beim Laden + federnde Buttons ── */
  .brand .rp,.brand b,.brand .st span{display:inline-block}
  .brand b{position:relative}
  @media(prefers-reduced-motion:no-preference){
    .brand b{animation:lg-rise .8s cubic-bezier(.34,1.45,.64,1) .1s both}
    .brand b::after{content:"";position:absolute;left:6%;right:6%;bottom:-.06em;height:.13em;border-radius:99px;background:var(--accent);transform:scaleX(0);animation:lg-line 1.5s .2s both}
    .brand .rp{animation:lg-wipe .75s cubic-bezier(.22,1,.36,1) .55s both}
    .brand .st span{animation:lg-pop .55s cubic-bezier(.34,1.8,.64,1) both}
    .brand .st:first-child span:nth-child(3),.brand .st:last-child span:nth-child(1){animation-delay:.85s}
    .brand .st:first-child span:nth-child(2),.brand .st:last-child span:nth-child(2){animation-delay:.93s}
    .brand .st:first-child span:nth-child(1),.brand .st:last-child span:nth-child(3){animation-delay:1.01s}
    .cta{transition:transform .5s cubic-bezier(.34,1.56,.64,1),background .2s,color .2s,box-shadow .2s}
    .cta.cta.cta:active,.feiern .cta.light:active{transform:scale(.94);transition-duration:.08s}
  }
  @keyframes lg-rise{from{transform:translateY(100%);clip-path:inset(-.3em -.3em 100% -.3em)}to{transform:none;clip-path:inset(-.3em -.3em -.3em -.3em)}}
  @keyframes lg-wipe{from{transform:translateX(.5em);clip-path:inset(-.3em -.3em -.3em 100%)}to{transform:none;clip-path:inset(-.3em -.3em -.3em -.3em)}}
  @keyframes lg-pop{from{transform:scale(0)}to{transform:scale(1)}}
  @keyframes lg-line{
    0%{transform:scaleX(0);animation-timing-function:cubic-bezier(.34,1.5,.64,1)}
    35%{transform:scaleX(1)}
    70%{transform:scaleX(1);animation-timing-function:cubic-bezier(.6,0,.4,1)}
    100%{transform:scaleX(0)}}
</style>'''
once('\n</style>', CSS)

STARS = '<span class="st" aria-hidden="true"><span>★</span><span>★</span><span>★</span></span>'
once('<a class="brand" href="#top"><span class="st">★★★</span>Ristorante Pizzeria <b>Italia</b><span class="st">★★★</span></a>',
     f'<a class="brand" href="#top">{STARS}<span class="rp">Ristorante Pizzeria</span> <b>Italia</b>{STARS}</a>')

once("const hdr=document.getElementById('hdr');",
     "// iOS zeigt :active (federnder Button) nur mit einem touchstart-Listener\n"
     "document.addEventListener('touchstart',()=>{},{passive:true});\n"
     "const hdr=document.getElementById('hdr');")
open(dst, 'w', encoding='utf-8').write(s)
print('ok', dst)
