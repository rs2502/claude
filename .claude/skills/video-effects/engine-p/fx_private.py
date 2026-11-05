# Extra effects for engine P of the video-effects skill.
# fx.py loads this file with exec() when it sits next to it (scripts/fx_private.py), so every helper of
# fx.py defined before that point is available here: effect, clamp, ease_*, font, text_img, rrect,
# shadowed, place, comp, cached, np_thumb, vary, cursor, tick, fade, GREEN, BLUE, ORANGE ...
# The installer and the cloud hook copy it into ~/claude-effects-py/scripts/.

import re as _re

_KW = {'const', 'let', 'var', 'await', 'async', 'def', 'return', 'import', 'from', 'function', 'if', 'else',
       'for', 'in', 'while', 'class', 'new', 'true', 'false', 'None', 'True', 'False'}
_TOK = _re.compile(r'("[^"]*"?|\'[^\']*\'?|#.*|//.*|\d+(?:\.\d+)?|[A-Za-z_]\w*|\s+|.)')
_ED = dict(bg=(24, 24, 30), bar=(34, 34, 42), side=(29, 29, 36), line=(255, 255, 255, 26), txt=(214, 216, 224),
           dim=(110, 112, 124), kw=(198, 120, 221), st=(152, 195, 121), num=(209, 154, 102), fn=(97, 175, 239),
           com=(110, 120, 135))


def _code_colors(s):
    out, toks = [], [t for t in _TOK.findall(s) if t]
    for i, t in enumerate(toks):
        if t[:1] in '"\'': col = _ED['st']
        elif t.startswith('#') or t.startswith('//'): col = _ED['com']
        elif t[:1].isdigit(): col = _ED['num']
        elif t in _KW: col = _ED['kw']
        elif t[:1].isalpha() or t[:1] == '_':
            nxt = next((x for x in toks[i + 1:] if not x.isspace()), '')
            col = _ED['fn'] if nxt == '(' else _ED['txt']
        else: col = _ED['txt']
        out.append((t, col))
    return out


def _window_chrome(w, h, u, title, accent, run_label, pressed):
    """Dark editor window with traffic lights, a centred title and a Run button on the right."""
    im = rrect(w, h, 22 * u, _ED['bg'] + (246,), (255, 255, 255, 40), max(1, int(2 * u)))
    d = ImageDraw.Draw(im); bh = 62 * u
    d.rounded_rectangle([0, 0, w - 1, bh], 22 * u, fill=_ED['bar'] + (255,)); d.rectangle([0, bh * 0.5, w - 1, bh], fill=_ED['bar'] + (255,))
    for i, col in enumerate(((255, 95, 87), (254, 188, 46), (40, 200, 64))):
        x = 30 * u + i * 30 * u; d.ellipse([x - 9 * u, bh / 2 - 9 * u, x + 9 * u, bh / 2 + 9 * u], fill=col + (255,))
    d.text((w / 2, bh / 2), title, font=font('uim', 26 * u), fill=_ED['dim'] + (255,), anchor='mm')
    bw, bhh = 128 * u, 40 * u; bx1 = w - 22 * u; bx0 = bx1 - bw; by0 = bh / 2 - bhh / 2
    k = 0.92 if pressed else 1.0; cx, cy = (bx0 + bx1) / 2, bh / 2
    d.rounded_rectangle([cx - bw / 2 * k, cy - bhh / 2 * k, cx + bw / 2 * k, cy + bhh / 2 * k], 10 * u, fill=accent + (255,))
    d.text((cx, cy), run_label, font=font('uib', 22 * u * k), fill=(255, 255, 255, 255), anchor='mm')
    d.line([(0, bh), (w, bh)], fill=_ED['line'], width=max(1, int(2 * u)))
    return im, bh, (cx, cy)


def _ease_path(p0, p1, q):
    q = ease_inout(q); arc = math.sin(q * math.pi) * 0.08
    return p0[0] + (p1[0] - p0[0]) * q, p0[1] + (p1[1] - p0[1]) * q - arc * abs(p1[0] - p0[0])


def _status(d, w, h, u, text, col, alpha, y1=None):
    if alpha <= 0: return
    f = font('uib', 24 * u); tw = f.getlength(text) + 70 * u; x1 = w - 24 * u; y1 = h - 20 * u if y1 is None else y1
    d.rounded_rectangle([x1 - tw, y1 - 46 * u, x1, y1], 23 * u, fill=col + (int(235 * alpha),))
    tick(d, x1 - tw + 20 * u, y1 - 35 * u, 22 * u, (255, 255, 255, int(255 * alpha)), int(4 * u))
    d.text((x1 - tw + 52 * u, y1 - 23 * u), text, font=f, fill=(255, 255, 255, int(255 * alpha)), anchor='lm')


def _editor_code(c, e, w, h, u, accent):
    lines = e.o.get('text', 'const clip = await load("reel.mp4")|const face = track(clip)|clip.add("text-behind", face)|'
                    'await render(clip, "4k")  // done').split('|')
    t_type0, t_type1 = 0.35, max(0.9, e.d * 0.58); t_click = max(t_type1 + 0.35, e.d * 0.74)
    pressed = t_click <= c.lt < t_click + 0.14
    im, bh, run = _window_chrome(w, h, u, e.o.get('title', 'main.js'), accent, e.o.get('run', 'Run ▶').replace('▶', '').strip() + ' ▶', pressed)
    d = ImageDraw.Draw(im); sw = w * 0.24
    # sidebar slides in
    sk = ease_out((c.lt - 0.1) / 0.3); sx = -sw * (1 - sk)
    d.rectangle([sx, bh + 1, sx + sw, h - 22 * u], fill=_ED['side'] + (255,))
    d.text((sx + 22 * u, bh + 30 * u), 'EXPLORER', font=font('uib', 18 * u), fill=_ED['dim'] + (255,), anchor='lm')
    files = e.o.get('files', 'main.js|effects.js|reel.mp4|render.json').split('|')
    for i, fn in enumerate(files):
        y = bh + 74 * u + i * 44 * u; act = i == 0
        if act: d.rectangle([sx + 6 * u, y - 19 * u, sx + sw - 6 * u, y + 19 * u], fill=(255, 255, 255, 18))
        d.rounded_rectangle([sx + 22 * u, y - 9 * u, sx + 38 * u, y + 9 * u], 3 * u, fill=(accent if act else _ED['dim']) + (255,))
        d.text((sx + 50 * u, y), fn, font=font('uim', 23 * u), fill=(_ED['txt'] if act else _ED['dim']) + (255,), anchor='lm')
    # code panel: lines type out one after another
    total = sum(len(l) for l in lines); shown = int(total * clamp((c.lt - t_type0) / (t_type1 - t_type0)))
    f = font('mono', 25 * u); lh = 46 * u; x0 = sw + 74 * u; y0 = bh + 40 * u
    caret = (x0, y0)
    for i, l in enumerate(lines):
        y = y0 + i * lh
        if y > h - 80 * u: break
        d.text((sw + 50 * u, y), str(i + 1), font=f, fill=_ED['dim'] + (255,), anchor='rm')
        n = int(clamp(shown, 0, len(l))); shown -= len(l); x = x0
        for tok, col in _code_colors(l[:n]):
            d.text((x, y), tok, font=f, fill=col + (255,), anchor='lm'); x += f.getlength(tok)
        if n > 0: caret = (x, y)
    if caret and c.lt < t_click and int(c.lt * 3.2) % 2 == 0:
        d.rectangle([caret[0] + 2 * u, caret[1] - 16 * u, caret[0] + 5 * u, caret[1] + 16 * u], fill=accent + (255,))
    # mouse: comes in, clicks Run, a status chip confirms
    if c.lt >= t_click + 0.14:
        k = ease_back((c.lt - t_click - 0.14) / 0.3)
        _status(d, w, h, u, e.o.get('status', 'Build succeeded'), GREEN, clamp(k))
        rk = clamp((c.lt - t_click) / 0.45)
        if rk < 1:
            r = 20 * u + 60 * u * rk; d.ellipse([run[0] - r, run[1] - r, run[0] + r, run[1] + r], outline=accent + (int(200 * (1 - rk)),), width=int(4 * u))
    mq = clamp((c.lt - (t_click - 0.75)) / 0.75)
    if c.lt > t_click - 0.75:
        mx, my = _ease_path((w * 0.7, h * 0.95), (run[0] - 10 * u, run[1] - 4 * u), mq)
        im.alpha_composite(cursor(40 * u), (int(mx), int(my)))
    return im


def _editor_video(c, e, w, h, u, accent):
    t_drag0 = max(0.5, e.d * 0.3); t_drop = max(t_drag0 + 0.6, e.d * 0.6); t_done = max(t_drop + 0.4, e.d * 0.78)
    im, bh, run = _window_chrome(w, h, u, e.o.get('title', 'Reel Edit — Timeline'), accent, e.o.get('run', 'Export'), t_done <= c.lt < t_done + 0.14)
    d = ImageDraw.Draw(im)
    top_h = (h - bh) * 0.56; bin_w = w * 0.3; pad = 18 * u
    # media bin: four looks of your own shot
    thumbs = cached(e, 'thumbs', lambda: [vary(np_thumb(c, 120, 150), i) for i in range(4)])
    tw, th = (bin_w - 3 * pad) / 2, (top_h - 3 * pad) / 2
    slots = []
    bk = ease_out((c.lt - 0.1) / 0.3)
    for i in range(4):
        x = pad + (i % 2) * (tw + pad) - bin_w * (1 - bk); y = bh + pad + (i // 2) * (th + pad)
        slots.append((x, y))
        if i == 1 and c.lt >= t_drag0: d.rounded_rectangle([x, y, x + tw, y + th], 8 * u, outline=_ED['dim'] + (160,), width=max(1, int(2 * u))); continue
        t = thumbs[i].resize((int(tw), int(th))).convert('RGBA'); im.alpha_composite(t, (int(x), int(y)))
    # preview: the live frame
    pk = ease_out((c.lt - 0.2) / 0.3); pw = w - bin_w - 2 * pad; ph = top_h - 2 * pad
    pv = np_thumb(c, int(ph * 0.5625), int(ph)).convert('RGBA')
    px = bin_w + pad + (pw - pv.width) / 2 + w * 0.3 * (1 - pk)
    d.rectangle([bin_w, bh + 1, w - 1, bh + top_h], fill=(16, 16, 20, 255))
    im.alpha_composite(pv, (int(px), int(bh + pad)))
    tc = f'00:00:{int(c.t) % 60:02d}:{int(c.t * 30) % 30:02d}'
    d.text((w - pad * 2, bh + top_h - pad * 1.6), tc, font=font('mono', 22 * u), fill=_ED['txt'] + (255,), anchor='rm')
    # timeline
    ty = bh + top_h; d.line([(0, ty), (w, ty)], fill=_ED['line'], width=max(1, int(2 * u)))
    lab_w = 70 * u; tr_h = (h - ty - 46 * u) / 3; x0, x1 = lab_w, w - pad
    for j in range(12):
        x = x0 + (x1 - x0) * j / 11; d.line([(x, ty + 8 * u), (x, ty + (16 if j % 2 else 24) * u)], fill=_ED['dim'] + (255,), width=max(1, int(2 * u)))
    tracks = [('V2', []), ('V1', [(0.0, 0.42), (0.45, 1.0)]), ('A1', [(0.0, 1.0)])]
    drop_slot = (0.3, 0.72)
    for r, (name, clips) in enumerate(tracks):
        y = ty + 34 * u + r * tr_h
        d.text((pad, y + tr_h / 2), name, font=font('uib', 20 * u), fill=_ED['dim'] + (255,), anchor='lm')
        for a, b in clips:
            col = (46, 160, 120) if name == 'A1' else (accent[0] // 2 + 40, accent[1] // 2 + 40, accent[2] // 2 + 60)
            d.rounded_rectangle([x0 + (x1 - x0) * a + 2 * u, y + 6 * u, x0 + (x1 - x0) * b - 2 * u, y + tr_h - 6 * u], 8 * u, fill=col + (255,))
            if name == 'A1':
                for k in range(80):
                    xx = x0 + (x1 - x0) * (a + (b - a) * k / 80); amp = (0.2 + 0.8 * abs(math.sin(k * 0.7) * math.sin(k * 0.23))) * (tr_h * 0.32)
                    d.line([(xx, y + tr_h / 2 - amp), (xx, y + tr_h / 2 + amp)], fill=(170, 240, 210, 255), width=max(1, int(2 * u)))
    v2y = ty + 34 * u
    tgt = (x0 + (x1 - x0) * drop_slot[0], v2y + 6 * u)
    if c.lt >= t_drop:
        k = ease_back((c.lt - t_drop) / 0.25); cw_ = (x1 - x0) * (drop_slot[1] - drop_slot[0])
        d.rounded_rectangle([tgt[0], v2y + 6 * u + (1 - k) * 10 * u, tgt[0] + cw_, v2y + tr_h - 6 * u], 8 * u, fill=accent + (255,))
        d.text((tgt[0] + 14 * u, v2y + tr_h / 2), e.o.get('text', 'b-roll.mp4'), font=font('uib', 20 * u), fill=(255, 255, 255, 255), anchor='lm')
    # playhead
    phx = x0 + (x1 - x0) * clamp(c.lt / e.d)
    d.line([(phx, ty + 6 * u), (phx, h - 30 * u)], fill=(255, 255, 255, 255), width=max(2, int(3 * u)))
    d.polygon([(phx - 9 * u, ty + 4 * u), (phx + 9 * u, ty + 4 * u), (phx, ty + 16 * u)], fill=(255, 255, 255, 255))
    if c.lt >= t_done + 0.14: _status(d, w, h, u, e.o.get('status', 'Exported 4K'), GREEN, clamp(ease_back((c.lt - t_done - 0.14) / 0.3)), bh + top_h - 52 * u)
    # mouse: grabs the second bin clip, drags it onto V2, then clicks Export
    src = (slots[1][0] + tw / 2, slots[1][1] + th / 2)
    if c.lt < t_drag0: mp = _ease_path((w * 0.55, h * 0.9), src, clamp((c.lt - 0.2) / max(0.1, t_drag0 - 0.2)))
    elif c.lt < t_drop:
        q = clamp((c.lt - t_drag0) / (t_drop - t_drag0)); mp = _ease_path(src, (tgt[0] + 30 * u, tgt[1] + 20 * u), q)
        g = thumbs[1].resize((int(tw * 0.8), int(th * 0.8))).convert('RGBA'); g.putalpha(g.split()[3].point(lambda v: v * 200 // 255))
        im.alpha_composite(shadowed(g, 8, 6, 120), (int(mp[0] - g.width / 2), int(mp[1] - g.height / 2)))
    else: mp = _ease_path((tgt[0] + 30 * u, tgt[1] + 20 * u), (run[0] - 10 * u, run[1] - 4 * u), clamp((c.lt - t_drop - 0.1) / max(0.2, t_done - t_drop - 0.1)))
    im.alpha_composite(cursor(40 * u), (int(clamp(mp[0], 0, w - 40 * u)), int(clamp(mp[1], 0, h - 58 * u))))
    return im


@effect('editor', 'a code or video editor window pops up above your head, a cursor types, drags and clicks')
def fx_editor(c, e):
    W, H = c.W, c.H; u = W / 1080; accent = rgb(e.o.get('color'), (124, 92, 255))
    look = str(e.o.get('look', 'code')).lower(); w = W * 0.9
    n = len(str(e.o.get('text', '1|2|3|4')).split('|'))
    h = W * 0.56 if look == 'video' else max(W * 0.36, (62 + 40 + 46 * max(n, 4) + 70) * u)
    im = (_editor_video if look == 'video' else _editor_code)(c, e, w, h, u, accent)
    k = ease_back(c.lt / 0.32); al = clamp(c.lt / 0.12) * fade(c, e)
    if str(e.o.get('pos', 'above')) == 'below':
        cy = min(H * 0.94 - h / 2, max(c.fy + c.fw * 1.4 + h / 2, H * 0.55)); behind = False
    else:
        cy = max(H * 0.06 + h / 2, c.fy - c.fw * 1.55); behind = True
    place(c, shadowed(im, int(20 * u), int(12 * u), 140), W / 2, cy + (1 - k) * 40 * u, 0.86 + 0.14 * k, 0, al, behind=behind, guard=not behind)


ALIASES.update({'code-editor': 'editor', 'video-editor': 'editor', 'ide': 'editor'})
