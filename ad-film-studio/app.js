/* ============================================================
   Ad Film Studio — app.js
   Ein Logo rein → Farb-DNA, Drehbuch und ein fertig gerenderter
   Werbeclip raus. Der Film läuft als Canvas-Animation im Browser
   und wird per MediaRecorder als WebM exportiert. Zusätzlich
   entsteht zu jeder Einstellung ein Prompt für Video-KI-Modelle.
   Läuft vollständig lokal, ohne API-Key.
   ============================================================ */

/* ═══════════════ Farb-Utilities ═══════════════ */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2; const d = max - min;
  if (d) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rgb;
  if (h < 60) rgb = [c, x, 0]; else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x]; else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c]; else rgb = [c, 0, x];
  return rgb.map(v => (v + m) * 255);
}
const hslToHex = (h, s, l) => rgbToHex(...hslToRgb(h, s, l));

function shift(hex, { h = 0, s = 1, l = 1 } = {}) {
  const [hh, ss, ll] = rgbToHsl(...hexToRgb(hex));
  return hslToHex(hh + h, clamp(ss * s, 0, 1), clamp(ll * l, 0.02, 0.98));
}
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const rgba = (hex, a) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };

/* ═══════════════ Palette aus dem Logo ═══════════════ */

function extractPalette(img) {
  const size = 140;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight);
  const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);

  const data = ctx.getImageData(0, 0, size, size).data;
  const buckets = new Map();
  let litSum = 0, litCount = 0, colored = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const [hue, sat, lig] = rgbToHsl(r, g, b);
    litSum += lig; litCount++;
    if (sat < 0.14 || lig < 0.07 || lig > 0.95) continue;
    const key = `${Math.round(hue / 15)}|${Math.round(sat * 3)}|${Math.round(lig * 4)}`;
    const bucket = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    bucket.n++; bucket.r += r; bucket.g += g; bucket.b += b;
    buckets.set(key, bucket);
    colored++;
  }

  const avgLight = litCount ? litSum / litCount : 0.5;
  let list = [...buckets.values()].map(b => {
    const hex = rgbToHex(b.r / b.n, b.g / b.n, b.b / b.n);
    const [hue, s, l] = rgbToHsl(...hexToRgb(hex));
    return { hex, n: b.n, hue, score: b.n * (0.45 + s) * (1 - Math.abs(l - 0.5) * 0.9) };
  }).sort((a, b) => b.score - a.score);

  // Subpixel-Antialiasing erzeugt farbige Kantenfransen — winzige Buckets raus.
  const floor = Math.max(10, colored * 0.06);
  const significant = list.filter(c => c.n >= floor);
  if (significant.length) list = significant;

  const distinct = [];
  for (const c of list) {
    if (!distinct.some(d => { const dh = Math.abs(d.hue - c.hue); return Math.min(dh, 360 - dh) < 22; })) distinct.push(c);
    if (distinct.length >= 5) break;
  }
  if (!distinct.length) {
    const base = avgLight > 0.55 ? '#e8e9ec' : '#1b1d22';
    return { primary: base, raw: [base] };
  }
  return { primary: distinct[0].hex, raw: distinct.map(d => d.hex) };
}

function buildSystem(primary, raw = []) {
  const [h, s, l] = rgbToHsl(...hexToRgb(primary));
  const second = raw[1] || hslToHex(h + 4, clamp(s * 0.94, 0.1, 1), clamp(l * 0.72, 0.12, 0.58));
  const accent = raw[2] || hslToHex(h + 168, clamp(s * 0.72, 0.22, 0.85), clamp(l * 1.02, 0.38, 0.66));
  const dark = luminance(primary) < 0.09;
  return {
    primary,
    deep: shift(primary, { l: 0.34, s: 1.05 }),
    mid: second,
    light: shift(primary, { l: 1.42, s: 0.72 }),
    accent,
    // Sehr dunkle Marken brauchen eine hellere Bühne, sonst verschwinden sie
    filmDark: dark ? hslToHex(h, clamp(s * .4, .02, .3), 0.14) : shift(primary, { l: 0.18, s: 1.1 }),
    filmLight: dark ? hslToHex(h, clamp(s * .3, .02, .25), 0.9) : shift(primary, { l: 1.2, s: .9 }),
    invert: dark
  };
}

/* ═══════════════ Marken-Daten ═══════════════ */

const ARCHETYPES = {
  auto:      { de: 'Automatisch aus Farbe ableiten', mood: '' },
  held:      { de: 'Held — Mut, Leistung, Triumph', mood: 'heroic, high-contrast, triumphant, athletic tension' },
  entdecker: { de: 'Entdecker — Freiheit, Weite, Aufbruch', mood: 'exploratory, wide horizons, wind and daylight' },
  weise:     { de: 'Weiser — Klarheit, Präzision, Wissen', mood: 'calm authority, surgical precision, quiet stillness' },
  narr:      { de: 'Narr — Spiel, Humor, Leichtigkeit', mood: 'playful, bouncy, candid laughter, spontaneous' },
  liebende:  { de: 'Liebende — Genuss, Sinnlichkeit, Nähe', mood: 'sensual warmth, intimate touch, slow indulgence' },
  herrscher: { de: 'Herrscher — Luxus, Kontrolle, Status', mood: 'regal, controlled, luxurious restraint' },
  schoepfer: { de: 'Schöpfer — Handwerk, Detail, Vision', mood: 'craft-driven, tactile making, artisan hands' },
  unschuld:  { de: 'Unschuldiger — Reinheit, Natur, Frische', mood: 'pure, sunlit, fresh morning air, honest' }
};

const TYPO = {
  auto:      { de: 'Automatisch aus Farbe ableiten' },
  geometric: { de: 'Geometrisch & kraftvoll', head: 'Montserrat', headWeight: 900, body: 'Inter',
               en: 'bold geometric grotesque (Montserrat Black) with a neutral text grotesque' },
  neutral:   { de: 'Neutral & technisch', head: 'Space Grotesk', headWeight: 700, body: 'Inter',
               en: 'technical neo-grotesque (Space Grotesk) with a high-legibility UI face' },
  editorial: { de: 'Editorial & luxuriös', head: 'Playfair Display', headWeight: 900, body: 'Inter',
               en: 'high-contrast didone serif (Playfair Display) with a quiet humanist sans' },
  serifsoft: { de: 'Warm & handwerklich', head: 'DM Serif Display', headWeight: 400, body: 'Inter',
               en: 'warm transitional serif (DM Serif Display) with an open humanist sans' }
};

const FORMATS = {
  '9:16': { w: 1080, h: 1920, de: '9:16 · Reels, TikTok, Shorts' },
  '4:5':  { w: 1080, h: 1350, de: '4:5 · Instagram Feed' },
  '1:1':  { w: 1080, h: 1080, de: '1:1 · Feed quadratisch' },
  '16:9': { w: 1920, h: 1080, de: '16:9 · YouTube, Pre-Roll' }
};

/* Copy-Pools je Archetyp — Hook, Headline-Wörter, Claim, Stat, CTA */
const COPY = {
  held: {
    hook: ['Manche geben auf.', 'Der Punkt, an dem andere aufhören.', 'Nicht für jeden.'],
    head: [['STÄRKER', 'ALS', 'GESTERN'], ['KEIN', 'ZURÜCK'], ['MACH', 'DEN', 'ANFANG']],
    claim: ['Für alle, die weitermachen.', 'Kompromisslos. Von Anfang an.', 'Leistung, die man schmeckt.'],
    stat: [['100 %', 'Einsatz. Jeden Tag.'], ['0', 'Ausreden.'], ['3×', 'mehr durchhalten.']],
    cta: ['Jetzt starten.', 'Hol es dir.', 'Ab sofort erhältlich.']
  },
  entdecker: {
    hook: ['Da draußen wartet mehr.', 'Und wenn du einfach losgehst?', 'Der erste Schritt zählt.'],
    head: [['RAUS', 'HIER'], ['NEUES', 'LAND'], ['IMMER', 'WEITER']],
    claim: ['Für alle, die losgehen.', 'Nimm es mit.', 'Dein Weg. Dein Tempo.'],
    stat: [['1', 'Marke. Überall dabei.'], ['48 h', 'unterwegs.'], ['∞', 'Wege.']],
    cta: ['Entdecke mehr.', 'Pack es ein.', 'Jetzt aufbrechen.']
  },
  weise: {
    hook: ['Die meisten übersehen es.', 'Präzision ist kein Zufall.', 'Ein Detail entscheidet.'],
    head: [['KLAR', 'GEDACHT'], ['GENAU', 'SO'], ['WENIGER', 'ABER', 'BESSER']],
    claim: ['Auf das Wesentliche reduziert.', 'Genau. Nicht ungefähr.', 'Klarheit, die bleibt.'],
    stat: [['0,1 mm', 'Toleranz.'], ['12', 'Prüfschritte.'], ['1', 'richtige Antwort.']],
    cta: ['Jetzt ansehen.', 'Mehr erfahren.', 'Selbst prüfen.']
  },
  narr: {
    hook: ['Kurze Frage.', 'Ganz ehrlich?', 'Das wird gut.'],
    head: [['EINFACH', 'GUT'], ['NA', 'DANN', 'MAL', 'LOS'], ['MEHR', 'DAVON']],
    claim: ['Macht den Tag heller.', 'Einfach dein Ding.', 'Gute Laune inklusive.'],
    stat: [['2 Sek.', 'bis zum Grinsen.'], ['0', 'schlechte Tage.'], ['100 %', 'gute Laune.']],
    cta: ['Probier es.', 'Jetzt zugreifen.', 'Los geht’s.']
  },
  liebende: {
    hook: ['Ein Moment nur für dich.', 'Riech mal.', 'Ganz langsam.'],
    head: [['GENUSS', 'PUR'], ['NIMM', 'DIR', 'ZEIT'], ['SO', 'GUT']],
    claim: ['Für den Moment, der zählt.', 'Genuss braucht keine Eile.', 'Jeder Bissen, Gold.'],
    stat: [['72 h', 'gereift.'], ['5', 'Zutaten. Mehr nicht.'], ['1', 'Moment für dich.']],
    cta: ['Jetzt genießen.', 'Gönn es dir.', 'Ab sofort erhältlich.']
  },
  herrscher: {
    hook: ['Manche Dinge erkennt man sofort.', 'Es beginnt mit einem Detail.', 'Nicht laut. Wirksam.'],
    head: [['DAS', 'ORIGINAL'], ['ÜBER', 'ALLEM'], ['ECHT', 'GOLD']],
    claim: ['Der Maßstab, seit jeher.', 'Luxus, der leise ist.', 'Form folgt Genuss.'],
    stat: [['1897', 'gegründet.'], ['24 K', 'Anspruch.'], ['1', 'Klasse für sich.']],
    cta: ['Jetzt entdecken.', 'Erleben Sie es.', 'Ab sofort erhältlich.']
  },
  schoepfer: {
    hook: ['Alles beginnt mit den Händen.', 'Sieh genauer hin.', 'Gemacht, nicht produziert.'],
    head: [['VON', 'HAND'], ['JEDES', 'DETAIL'], ['ECHTES', 'HANDWERK']],
    claim: ['Handgemacht. Jedes Stück.', 'Zeit, die man sieht.', 'Detail für Detail.'],
    stat: [['48', 'Arbeitsschritte.'], ['1', 'Paar Hände.'], ['0', 'Maschinen.']],
    cta: ['Jetzt ansehen.', 'Selbst erleben.', 'Zum Handwerk.']
  },
  unschuld: {
    hook: ['Guten Morgen.', 'Ganz einfach.', 'Nichts dazu. Nichts weg.'],
    head: [['REIN', 'UND', 'GUT'], ['EINFACH', 'ECHT'], ['SO', 'NATÜRLICH']],
    claim: ['Nichts drin, was nicht reingehört.', 'So einfach kann gut sein.', 'Ehrlich von Anfang an.'],
    stat: [['3', 'Zutaten.'], ['100 %', 'natürlich.'], ['0', 'Zusätze.']],
    cta: ['Jetzt probieren.', 'Mehr erfahren.', 'Ab sofort erhältlich.']
  }
};

/* ═══════════════ Zeichen-Helfer ═══════════════ */

const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
const easeOutBack = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);           // Teilabschnitt normalisieren
const rnd = i => { const x = Math.sin(i * 127.1) * 43758.5453; return x - Math.floor(x); };

let noiseTile = null;
function getNoise() {
  if (noiseTile) return noiseTile;
  const n = document.createElement('canvas');
  n.width = n.height = 128;
  const c = n.getContext('2d');
  const img = c.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 118 + Math.random() * 74;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  noiseTile = n;
  return n;
}

function grain(ctx, W, H, alpha, frame) {
  const n = getNoise();
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'overlay';
  const ox = (frame * 37) % 128, oy = (frame * 61) % 128;
  const p = ctx.createPattern(n, 'repeat');
  ctx.translate(-ox, -oy);
  ctx.fillStyle = p;
  ctx.fillRect(0, 0, W + 128, H + 128);
  ctx.restore();
}

function vignette(ctx, W, H, strength) {
  const g = ctx.createRadialGradient(W / 2, H * 0.46, Math.min(W, H) * 0.24, W / 2, H * 0.5, Math.max(W, H) * 0.78);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function bgGradient(ctx, W, H, top, bottom, glowHex, glowAlpha, gx, gy, gr) {
  const lg = ctx.createLinearGradient(0, 0, W * 0.3, H);
  lg.addColorStop(0, top);
  lg.addColorStop(1, bottom);
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, W, H);
  if (glowAlpha > 0) {
    const rg = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
    rg.addColorStop(0, rgba(glowHex, glowAlpha));
    rg.addColorStop(1, rgba(glowHex, 0));
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/* Logo zeichnen — niemals verzerrt, immer proportional eingepasst */
function drawLogo(ctx, logo, cx, cy, boxW, boxH, { alpha = 1, rot = 0, glow = 0, glowHex = '#fff' } = {}) {
  if (!logo || !logo.naturalWidth) return;
  const s = Math.min(boxW / logo.naturalWidth, boxH / logo.naturalHeight);
  const w = logo.naturalWidth * s, h = logo.naturalHeight * s;
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.translate(cx, cy);
  if (rot) ctx.rotate(rot);
  if (glow > 0) { ctx.shadowColor = rgba(glowHex, 0.85); ctx.shadowBlur = glow; }
  ctx.drawImage(logo, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function setFont(ctx, family, weight, size, track) {
  ctx.font = `${weight} ${size}px ${family}, sans-serif`;
  try { ctx.letterSpacing = `${track || 0}px`; } catch { /* ältere Engines ignorieren das */ }
}

function wrapText(ctx, text, maxW) {
  const words = String(text).split(' ');
  const lines = []; let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/* Headline mittig, automatisch umgebrochen und auf die Breite skaliert */
function drawHeadline(ctx, text, cx, cy, size, color, { family, weight, maxW, track = 0, alpha = 1, lineH = 1.06, shadow = 0 } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let s = size;
  setFont(ctx, family, weight, s, track);
  let lines = wrapText(ctx, text, maxW);
  // Falls ein einzelnes Wort zu breit ist: Schriftgrad herunterregeln
  let guard = 0;
  while (guard++ < 30 && lines.some(l => ctx.measureText(l).width > maxW)) {
    s *= 0.94;
    setFont(ctx, family, weight, s, track);
    lines = wrapText(ctx, text, maxW);
  }
  if (shadow) { ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = shadow; ctx.shadowOffsetY = s * 0.04; }
  ctx.fillStyle = color;
  const total = (lines.length - 1) * s * lineH;
  lines.forEach((l, i) => ctx.fillText(l, cx, cy - total / 2 + i * s * lineH));
  ctx.restore();
  return { size: s, lines: lines.length };
}

function drawLabel(ctx, text, cx, cy, size, color, { family = 'Inter', weight = 600, track = 0, alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  setFont(ctx, family, weight, size, track);
  ctx.fillStyle = color;
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

/* Specular-Sweep: das Glanzlicht, das über Materialien wandert */
function sweep(ctx, x, y, w, h, p, alpha = 0.5, angle = -0.35) {
  if (p <= 0 || p >= 1) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.translate(x + w * (p * 1.8 - 0.4), y + h / 2);
  ctx.rotate(angle);
  const bw = w * 0.32;
  const g = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, `rgba(255,255,255,${alpha})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-bw / 2, -h * 1.4, bw, h * 2.8);
  ctx.restore();
}

/* ═══════════════ Die Einstellungen (Shots) ═══════════════ */

/*  Jeder Shot:
    key, title, chip (Kamerabewegung), weight (Anteil an der Gesamtlänge),
    draw(ctx, W, H, t, C)  — t läuft von 0 bis 1 innerhalb der Einstellung
    vo(C)                  — Voiceover-/Textzeile
    prompt(C, lang)        — Prompt für Video-KI                                */

const SHOTS = [
  {
    key: 'hook', title: 'Auftakt — der Haken', chip: 'Slow Push-In', weight: 1.15,
    draw(ctx, W, H, t, C) {
      const u = Math.min(W, H) / 1000;
      const e = easeOutCubic(t);
      bgGradient(ctx, W, H, C.filmDark, '#040507', C.primary, 0.16 + 0.2 * e, W * 0.5, H * 0.44, Math.max(W, H) * (0.34 + 0.2 * e));

      // Lichtbalken, der über das Bild streicht
      const sp = seg(t, 0.08, 0.72);
      if (sp > 0 && sp < 1) {
        ctx.save();
        ctx.translate(W * (sp * 1.7 - 0.35), H * 0.5);
        ctx.rotate(-0.5);
        const g = ctx.createLinearGradient(-W * 0.16, 0, W * 0.16, 0);
        g.addColorStop(0, rgba(C.light, 0));
        g.addColorStop(0.5, rgba(C.light, 0.2));
        g.addColorStop(1, rgba(C.light, 0));
        ctx.fillStyle = g;
        ctx.fillRect(-W * 0.16, -H, W * 0.32, H * 2);
        ctx.restore();
      }

      const la = seg(t, 0.18, 0.85);
      drawLogo(ctx, C.logo, W / 2, H * 0.46, W * (0.30 + 0.04 * (1 - easeOutCubic(la))), H * 0.3,
        { alpha: 0.25 + 0.72 * easeOutCubic(la), glow: 60 * u * easeOutCubic(la), glowHex: C.primary });

      const ta = seg(t, 0.42, 0.95);
      drawHeadline(ctx, C.copy.hook, W / 2, H * 0.74 - 14 * u * (1 - easeOutCubic(ta)), 46 * u,
        rgba('#ffffff', 0.94), { family: C.font.body, weight: 400, maxW: W * 0.76, alpha: easeOutCubic(ta), shadow: 24 * u });

      vignette(ctx, W, H, 0.66);
    },
    vo: C => C.copy.hook,
    scene: 'Dunkler Auftakt. Ein einzelner Lichtstrahl wandert durch den Raum und legt die Marke frei.',
    camEn: 'slow 8mm push-in, 35mm anamorphic, f/2.0',
    actionEn: C => `A near-black volumetric space. A single hard light beam sweeps across frame and reveals the ${C.brand} logo emerging from darkness — the mark is reproduced exactly as supplied, never redrawn. Dust motes drift through the beam. A silhouetted hand enters the lower frame edge, slightly out of focus.`,
    actionDe: C => `Ein fast schwarzer, volumetrischer Raum. Ein harter Lichtstrahl wandert durchs Bild und legt das ${C.brand}-Logo frei — exakt wie geliefert, niemals neu gezeichnet. Staubpartikel im Lichtstrahl. Eine Hand tritt unscharf in den unteren Bildrand.`
  },

  {
    key: 'typeSlam', title: 'Kinetische Headline', chip: 'Cut · Statisch', weight: 0.9,
    draw(ctx, W, H, t, C) {
      const u = Math.min(W, H) / 1000;
      const drift = easeInOutCubic(t);
      bgGradient(ctx, W, H, C.primary, C.deep, C.light, 0.3, W * (0.3 + 0.4 * drift), H * 0.3, Math.max(W, H) * 0.6);

      const words = C.copy.head;
      const n = words.length;
      const base = 108 * u;
      const lineH = base * 1.02;
      const startY = H / 2 - (n - 1) * lineH / 2;

      words.forEach((word, i) => {
        const a = seg(t, 0.06 + i * 0.14, 0.34 + i * 0.14);
        const e = easeOutExpo(a);
        if (e <= 0) return;
        ctx.save();
        ctx.translate(W / 2, startY + i * lineH);
        ctx.scale(1 + 0.28 * (1 - e), 1 + 0.28 * (1 - e));
        drawHeadline(ctx, word, 0, 0, base, C.invert ? '#101216' : '#ffffff',
          { family: C.font.head, weight: C.font.headWeight, maxW: W * 0.84, track: -base * 0.02, alpha: e, shadow: 20 * u });
        ctx.restore();
      });

      // Akzentlinie, die unter der letzten Zeile durchzieht
      const lw = seg(t, 0.52, 0.9);
      if (lw > 0) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = C.accent;
        const wdt = W * 0.34 * easeOutCubic(lw);
        ctx.fillRect(W / 2 - wdt / 2, startY + (n - 1) * lineH + base * 0.72, wdt, 5 * u);
        ctx.restore();
      }

      vignette(ctx, W, H, 0.4);
    },
    vo: C => C.copy.head.join(' '),
    scene: 'Kinetische Typografie. Wort für Wort auf der Markenfarbe, harter Schnitt auf den Takt.',
    camEn: 'locked-off, no camera move, hard cut in and out',
    actionEn: C => `Full-frame ${C.primary} gradient field. The headline "${C.copy.head.join(' ')}" lands word by word, each word snapping into place on the beat with a 2-frame scale overshoot. An ${C.accent} accent rule wipes in beneath the last word. Clean, no clutter.`,
    actionDe: C => `Formatfüllendes ${C.primary}-Farbfeld. Die Headline „${C.copy.head.join(' ')}" schlägt Wort für Wort auf dem Takt ein, jeweils mit kurzem Scale-Overshoot. Eine ${C.accent}-Akzentlinie wischt unter dem letzten Wort ein.`
  },

  {
    key: 'heroPack', title: 'Produkt-Hero', chip: 'Push-In · Specular', weight: 1.2,
    draw(ctx, W, H, t, C) {
      const u = Math.min(W, H) / 1000;
      const e = easeInOutCubic(t);
      bgGradient(ctx, W, H, shift(C.primary, { l: 0.62 }), C.filmDark, C.primary, 0.34, W * 0.5, H * 0.42, Math.max(W, H) * 0.5);

      const pw = W * 0.46 * (0.94 + 0.14 * e);
      const ph = pw * 1.34;
      const px = W / 2 - pw / 2, py = H * 0.47 - ph / 2;

      ctx.save();
      ctx.translate(W / 2, H * 0.47);
      ctx.rotate((-0.055 + 0.05 * e));
      ctx.translate(-W / 2, -H * 0.47);

      // Schlagschatten
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.75)';
      ctx.shadowBlur = 90 * u;
      ctx.shadowOffsetY = 40 * u;
      ctx.fillStyle = '#000';
      roundRect(ctx, px, py, pw, ph, 26 * u);
      ctx.fill();
      ctx.restore();

      // Packung
      const pg = ctx.createLinearGradient(px, py, px + pw, py + ph);
      pg.addColorStop(0, rgba('#ffffff', 0.22));
      pg.addColorStop(0.45, rgba('#000000', 0.42));
      pg.addColorStop(1, rgba('#000000', 0.7));
      roundRect(ctx, px, py, pw, ph, 26 * u);
      ctx.fillStyle = pg;
      ctx.fill();
      ctx.strokeStyle = rgba('#ffffff', 0.18);
      ctx.lineWidth = 2 * u;
      ctx.stroke();

      drawLogo(ctx, C.logo, W / 2, H * 0.47, pw * 0.7, ph * 0.42, { alpha: 1 });
      sweep(ctx, px, py, pw, ph, seg(t, 0.2, 0.85), 0.42);
      ctx.restore();

      drawLabel(ctx, C.brand.toUpperCase(), W / 2, H * 0.83, 26 * u, rgba('#ffffff', 0.8),
        { family: C.font.body, weight: 600, track: 9 * u, alpha: easeOutCubic(seg(t, 0.35, 0.8)) });

      vignette(ctx, W, H, 0.58);
    },
    vo: C => `${C.brand}. ${C.category}.`,
    scene: 'Die Verpackung im Studiolicht, langsame Kamerafahrt nach vorn, Glanzlicht wandert über die Oberfläche.',
    camEn: 'slow dolly push-in on a slider, 85mm, f/2.8, subtle parallax',
    actionEn: C => `Studio hero shot of the ${C.brand} ${C.category} pack, held and slowly rotated by two hands with visible tendon and knuckle detail, short clean nails, real skin texture, slight motion blur on the fingertips. A specular highlight travels across the pack surface as it turns. The supplied logo sits dead centre on the front face, unaltered, owning 45% of the frame.`,
    actionDe: C => `Studio-Hero der ${C.brand}-Packung (${C.category}), von zwei Händen gehalten und langsam gedreht — sichtbare Sehnen, echte Hauttextur, leichte Bewegungsunschärfe an den Fingerspitzen. Ein Glanzlicht wandert beim Drehen über die Oberfläche. Das gelieferte Logo mittig auf der Vorderseite, unverändert, 45 % des Bildes.`
  },

  {
    key: 'splitGrid', title: 'Drei Welten', chip: 'Wipe · Stagger', weight: 0.85,
    draw(ctx, W, H, t, C) {
      const u = Math.min(W, H) / 1000;
      bgGradient(ctx, W, H, C.filmDark, '#050608', C.deep, 0.4, W * 0.5, H * 0.5, Math.max(W, H) * 0.6);

      const gap = W * 0.02;
      const pw = (W - gap * 4) / 3;
      const ph = H * 0.52;
      const py = H * 0.5 - ph / 2;
      const glide = easeInOutCubic(t) * W * 0.03;

      for (let i = 0; i < 3; i++) {
        const a = easeOutCubic(seg(t, 0.05 + i * 0.11, 0.5 + i * 0.11));
        if (a <= 0) continue;
        const px = gap + i * (pw + gap) + gap / 2 - glide;
        const oy = (1 - a) * H * 0.16;

        ctx.save();
        ctx.globalAlpha = a;
        roundRect(ctx, px, py + oy, pw, ph, 16 * u);
        ctx.clip();
        const tint = [C.primary, C.mid, C.deep][i];
        const g = ctx.createLinearGradient(px, py + oy, px + pw, py + oy + ph);
        g.addColorStop(0, shift(tint, { l: 1.25 }));
        g.addColorStop(1, shift(tint, { l: 0.42 }));
        ctx.fillStyle = g;
        ctx.fillRect(px, py + oy, pw, ph);

        // menschliche Präsenz: unscharfe Silhouette im unteren Drittel
        ctx.globalAlpha = a * 0.5;
        ctx.fillStyle = 'rgba(0,0,0,.55)';
        ctx.beginPath();
        ctx.ellipse(px + pw * (0.3 + 0.4 * rnd(i + 3)), py + oy + ph * 1.02, pw * 0.42, ph * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = a;
        drawLogo(ctx, C.logo, px + pw / 2, py + oy + ph * 0.44, pw * 0.62, ph * 0.3, { alpha: 0.95 });
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = a * 0.55;
        ctx.strokeStyle = rgba('#ffffff', 0.2);
        ctx.lineWidth = 1.6 * u;
        roundRect(ctx, px, py + oy, pw, ph, 16 * u);
        ctx.stroke();
        ctx.restore();
      }

      drawLabel(ctx, C.copy.claim, W / 2, H * 0.84, 30 * u, rgba('#ffffff', 0.86),
        { family: C.font.body, weight: 500, alpha: easeOutCubic(seg(t, 0.42, 0.9)) });

      vignette(ctx, W, H, 0.5);
    },
    vo: C => C.copy.claim,
    scene: 'Drei Anwendungen wischen nacheinander ins Bild — ein System, ein Gefühl.',
    camEn: 'static frame, graphic wipe transitions, slight lateral glide',
    actionEn: C => `Three vertical panels wipe up in sequence, each showing ${C.brand} in a different real-world moment — kitchen, desk, street — with a person mid-gesture in each: pouring, reaching, laughing. Identical lighting across all three so they read as one family. The logo stays unaltered in every panel.`,
    actionDe: C => `Drei vertikale Panels wischen nacheinander nach oben, jedes zeigt ${C.brand} in einem echten Moment — Küche, Schreibtisch, Straße — mit je einer Person mitten in der Bewegung: eingießen, greifen, lachen. Identisches Licht in allen dreien.`
  },

  {
    key: 'macro', title: 'Makro & Muster', chip: 'Zoom-Out · Drift', weight: 0.8,
    draw(ctx, W, H, t, C) {
      const u = Math.min(W, H) / 1000;
      const e = easeInOutCubic(t);
      const zoom = 2.5 - 1.25 * e;

      ctx.save();
      bgGradient(ctx, W, H, shift(C.primary, { l: 0.8 }), C.filmDark, C.primary, 0.3, W * 0.4, H * 0.4, Math.max(W, H) * 0.6);

      ctx.translate(W / 2, H / 2);
      ctx.rotate(-0.24);
      ctx.scale(zoom, zoom);
      ctx.globalAlpha = 0.4;
      const step = Math.max(W, H) * 0.26;
      const drift = e * step * 0.6;
      for (let x = -3; x <= 3; x++) {
        for (let y = -3; y <= 3; y++) {
          const id = (x + 3) * 7 + (y + 3);
          const a = 0.35 + 0.55 * rnd(id);
          drawLogo(ctx, C.logo, x * step + drift, y * step - drift * 0.5, step * 0.62, step * 0.42,
            { alpha: a, rot: (rnd(id + 11) - 0.5) * 0.3 });
        }
      }
      ctx.restore();

      // scharfe Marke im optischen Zentrum
      drawLogo(ctx, C.logo, W / 2, H * 0.5, W * 0.34, H * 0.24,
        { alpha: easeOutCubic(seg(t, 0.3, 0.9)), glow: 40 * u, glowHex: C.light });

      // Akzent-Kicker am Rand
      ctx.save();
      ctx.globalAlpha = 0.5 * e;
      const kg = ctx.createLinearGradient(0, 0, W, 0);
      kg.addColorStop(0, rgba(C.accent, 0.5));
      kg.addColorStop(0.3, rgba(C.accent, 0));
      ctx.fillStyle = kg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      vignette(ctx, W, H, 0.62);
      drawLabel(ctx, 'DETAIL', W / 2, H * 0.88, 20 * u, rgba('#ffffff', 0.55),
        { family: C.font.body, weight: 600, track: 12 * u, alpha: easeOutCubic(seg(t, 0.5, 0.95)) });
    },
    vo: () => '',
    scene: 'Extreme Makrofahrt über das zum Muster dekonstruierte Logo, Kamera zieht auf.',
    camEn: '100mm macro, focus-stacked, slow zoom-out with lateral drift',
    actionEn: C => `Extreme macro of the ${C.brand} mark tiled into a brand pattern across an embossed surface — every fibre, foil burr and print raster visible. A fingertip traces the emboss, fingerprint ridges sharp. Camera pulls back until one full, undistorted mark reads at the optical centre.`,
    actionDe: C => `Extreme Makroaufnahme der zum Muster gekachelten ${C.brand}-Marke auf geprägter Oberfläche — jede Faser, Prägekante und jedes Druckraster sichtbar. Eine Fingerkuppe fährt über die Prägung. Die Kamera zieht auf, bis eine vollständige Marke im Zentrum lesbar ist.`
  },

  {
    key: 'device', title: 'Screen & Hand', chip: 'Orbit · Handheld', weight: 0.85,
    draw(ctx, W, H, t, C) {
      const u = Math.min(W, H) / 1000;
      const e = easeInOutCubic(t);
      bgGradient(ctx, W, H, C.filmDark, '#050608', C.accent, 0.22, W * 0.7, H * 0.3, Math.max(W, H) * 0.55);

      const dw = W * 0.36 * (0.96 + 0.08 * e);
      const dh = dw * 2.02;
      ctx.save();
      ctx.translate(W / 2, H * 0.48);
      ctx.rotate(-0.11 + 0.07 * e);

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.8)';
      ctx.shadowBlur = 80 * u;
      ctx.shadowOffsetY = 34 * u;
      ctx.fillStyle = '#15171b';
      roundRect(ctx, -dw / 2, -dh / 2, dw, dh, dw * 0.13);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = rgba('#ffffff', 0.3);
      ctx.lineWidth = 3 * u;
      roundRect(ctx, -dw / 2, -dh / 2, dw, dh, dw * 0.13);
      ctx.stroke();

      // Display
      const iw = dw - 14 * u, ih = dh - 14 * u;
      ctx.save();
      roundRect(ctx, -iw / 2, -ih / 2, iw, ih, dw * 0.11);
      ctx.clip();
      const sg = ctx.createLinearGradient(-iw / 2, -ih / 2, iw / 2, ih / 2);
      sg.addColorStop(0, shift(C.primary, { l: 1.15 }));
      sg.addColorStop(1, C.deep);
      ctx.fillStyle = sg;
      ctx.fillRect(-iw / 2, -ih / 2, iw, ih);
      drawLogo(ctx, C.logo, 0, -ih * 0.04, iw * 0.56, ih * 0.24, { alpha: easeOutCubic(seg(t, 0.12, 0.6)) });
      drawLabel(ctx, C.copy.cta, 0, ih * 0.2, 26 * u, rgba('#ffffff', 0.8),
        { family: C.font.body, weight: 500, alpha: easeOutCubic(seg(t, 0.35, 0.8)) });
      sweep(ctx, -iw / 2, -ih / 2, iw, ih, seg(t, 0.15, 0.9), 0.3, -0.5);
      ctx.restore();

      // Notch
      ctx.fillStyle = '#000';
      roundRect(ctx, -dw * 0.13, -dh / 2 + 12 * u, dw * 0.26, 12 * u, 6 * u);
      ctx.fill();
      ctx.restore();

      // Handschatten von unten
      ctx.save();
      ctx.globalAlpha = 0.55;
      const hg = ctx.createRadialGradient(W * 0.5, H * 1.02, 0, W * 0.5, H * 1.02, W * 0.5);
      hg.addColorStop(0, 'rgba(0,0,0,.85)');
      hg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = hg;
      ctx.fillRect(0, H * 0.6, W, H * 0.4);
      ctx.restore();

      vignette(ctx, W, H, 0.55);
    },
    vo: C => C.copy.cta,
    scene: 'Die Marke digital: Logo als App-Icon, Displaylicht spiegelt auf der Haut.',
    camEn: 'handheld, subtle orbit, 50mm, f/2.0',
    actionEn: C => `A flagship smartphone held vertically in one hand, screen showing the ${C.brand} splash: the supplied logo unaltered on a ${C.primary} gradient. Natural one-handed grip, thumb resting mid-screen; the screen's emitted light bounces realistically onto the fingers with correct colour spill. Faint fingerprint smudges on the glass.`,
    actionDe: C => `Ein Flaggschiff-Smartphone hochkant in einer Hand, auf dem Display der ${C.brand}-Splashscreen: das gelieferte Logo unverändert auf einem ${C.primary}-Verlauf. Natürlicher Einhandgriff, Daumen auf halber Displayhöhe; das Displaylicht reflektiert realistisch auf die Finger. Feine Fingerabdrücke auf dem Glas.`
  },

  {
    key: 'stat', title: 'Beweis-Einstellung', chip: 'Cut · Counter', weight: 0.75,
    draw(ctx, W, H, t, C) {
      const u = Math.min(W, H) / 1000;
      bgGradient(ctx, W, H, C.deep, C.filmDark, C.primary, 0.24, W * 0.5, H * 0.36, Math.max(W, H) * 0.5);

      const [big, sub] = C.copy.stat;
      const e = easeOutBack(clamp(seg(t, 0.05, 0.45), 0, 1));
      ctx.save();
      ctx.translate(W / 2, H * 0.44);
      ctx.scale(0.8 + 0.2 * e, 0.8 + 0.2 * e);
      drawHeadline(ctx, big, 0, 0, 168 * u, C.invert ? '#101216' : C.light,
        { family: C.font.head, weight: C.font.headWeight, maxW: W * 0.8, alpha: clamp(e, 0, 1), shadow: 30 * u });
      ctx.restore();

      const la = easeOutCubic(seg(t, 0.3, 0.7));
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = C.accent;
      ctx.fillRect(W / 2 - W * 0.16 * la, H * 0.575, W * 0.32 * la, 4 * u);
      ctx.restore();

      drawHeadline(ctx, sub, W / 2, H * 0.66, 40 * u, rgba('#ffffff', 0.86),
        { family: C.font.body, weight: 400, maxW: W * 0.7, alpha: easeOutCubic(seg(t, 0.4, 0.85)) });

      drawLogo(ctx, C.logo, W / 2, H * 0.85, W * 0.2, H * 0.1,
        { alpha: 0.75 * easeOutCubic(seg(t, 0.55, 0.95)) });

      vignette(ctx, W, H, 0.55);
    },
    vo: C => C.copy.stat.join(' '),
    scene: 'Der harte Beweis: eine Zahl, eine Zeile, kein Beiwerk.',
    camEn: 'locked-off, hard cut, no move',
    actionEn: C => `Bold statement frame on a deep ${C.deep} field: the figure "${C.copy.stat[0]}" fills the centre with the line "${C.copy.stat[1]}" beneath it, an ${C.accent} rule between them. A hand places a ${C.brand} pack into the lower frame edge at the last beat. Absolutely no clutter.`,
    actionDe: C => `Klare Aussage-Einstellung auf tiefem ${C.deep}-Feld: die Zahl „${C.copy.stat[0]}" füllt die Mitte, darunter die Zeile „${C.copy.stat[1]}", dazwischen eine ${C.accent}-Linie. Am letzten Takt schiebt eine Hand eine ${C.brand}-Packung in den unteren Bildrand.`
  },

  {
    key: 'lifestyle', title: 'Lifestyle-Moment', chip: 'Handheld · Bokeh', weight: 1.0,
    draw(ctx, W, H, t, C) {
      const u = Math.min(W, H) / 1000;
      const e = easeInOutCubic(t);
      bgGradient(ctx, W, H, shift(C.primary, { l: 1.05, s: 0.8 }), shift(C.deep, { l: 0.8 }), C.light, 0.34, W * (0.32 + 0.12 * e), H * 0.3, Math.max(W, H) * 0.55);

      // Bokeh
      for (let i = 0; i < 14; i++) {
        const r = (0.03 + rnd(i) * 0.06) * W;
        const x = rnd(i + 20) * W + Math.sin(t * 2 + i) * 8 * u;
        const y = (0.12 + rnd(i + 40) * 0.7) * H;
        ctx.save();
        ctx.globalAlpha = 0.1 + rnd(i + 60) * 0.16;
        ctx.fillStyle = i % 3 === 0 ? C.light : '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Produkt leicht außermittig, goldener Schnitt
      const pw = W * 0.3, ph = pw * 1.3;
      const px = W * 0.56 - pw / 2, py = H * 0.5 - ph / 2 + 10 * u * (1 - e);
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.55)';
      ctx.shadowBlur = 60 * u;
      ctx.shadowOffsetY = 26 * u;
      const g = ctx.createLinearGradient(px, py, px + pw, py + ph);
      g.addColorStop(0, rgba('#ffffff', 0.24));
      g.addColorStop(1, rgba('#000000', 0.6));
      roundRect(ctx, px, py, pw, ph, 18 * u);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
      drawLogo(ctx, C.logo, px + pw / 2, py + ph * 0.46, pw * 0.68, ph * 0.4, { alpha: 1 });

      // unscharfe Hand im Vordergrund links
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.filter = 'blur(' + (10 * u) + 'px)';
      ctx.fillStyle = 'rgba(120,80,52,.9)';
      ctx.beginPath();
      ctx.ellipse(W * 0.16, H * (1.02 - 0.04 * e), W * 0.2, H * 0.26, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.filter = 'none';

      drawHeadline(ctx, C.copy.claim, W / 2, H * 0.82, 40 * u, '#ffffff',
        { family: C.font.body, weight: 500, maxW: W * 0.74, alpha: easeOutCubic(seg(t, 0.3, 0.8)), shadow: 26 * u });

      vignette(ctx, W, H, 0.5);
    },
    vo: C => C.copy.claim,
    scene: 'Das Produkt im echten Leben — Tageslicht, Bokeh, eine Hand im unscharfen Vordergrund.',
    camEn: 'handheld reportage, 35mm, f/1.8, shallow depth of field',
    actionEn: C => `A person actually using the ${C.brand} ${C.category} in a real ${C.place} — pouring, tasting, sharing — caught mid-gesture with authentic emotion, not a stock smile. A second hand crosses the foreground out of focus. Available window daylight, honest contrast, everything graded toward ${C.primary}.`,
    actionDe: C => `Eine Person nutzt ${C.brand} (${C.category}) wirklich, in einem echten ${C.place} — eingießen, probieren, teilen — mitten in der Bewegung, echte Emotion, kein Stockfoto-Lächeln. Eine zweite Hand quert unscharf den Vordergrund. Vorhandenes Fensterlicht, ehrlicher Kontrast.`
  },

  {
    key: 'claim', title: 'Der Claim', chip: 'Cut · Hold', weight: 0.8,
    draw(ctx, W, H, t, C) {
      const u = Math.min(W, H) / 1000;
      const e = easeInOutCubic(t);
      bgGradient(ctx, W, H, C.primary, C.deep, C.light, 0.26, W * (0.6 - 0.2 * e), H * 0.6, Math.max(W, H) * 0.55);

      drawHeadline(ctx, C.copy.claim, W / 2, H * 0.46, 76 * u, C.invert ? '#101216' : '#ffffff',
        { family: C.font.head, weight: C.font.headWeight, maxW: W * 0.8, lineH: 1.1,
          alpha: easeOutCubic(seg(t, 0.02, 0.4)), shadow: 26 * u });

      const la = easeOutCubic(seg(t, 0.25, 0.75));
      ctx.save();
      ctx.fillStyle = C.accent;
      ctx.fillRect(W / 2 - W * 0.2 * la, H * 0.63, W * 0.4 * la, 5 * u);
      ctx.restore();

      drawLabel(ctx, C.brand.toUpperCase(), W / 2, H * 0.72, 24 * u, rgba(C.invert ? '#101216' : '#ffffff', 0.8),
        { family: C.font.body, weight: 600, track: 10 * u, alpha: easeOutCubic(seg(t, 0.4, 0.85)) });

      vignette(ctx, W, H, 0.42);
    },
    vo: C => C.copy.claim,
    scene: 'Ein Satz, formatfüllend. Die Marke sagt, wofür sie steht.',
    camEn: 'locked-off, held frame, no move',
    actionEn: C => `Full-frame ${C.primary} → ${C.deep} gradient. The claim "${C.copy.claim}" sits centred and large; an ${C.accent} rule wipes in beneath it, then the ${C.brand} wordmark fades in below. Nothing else in frame.`,
    actionDe: C => `Formatfüllender Verlauf ${C.primary} → ${C.deep}. Der Claim „${C.copy.claim}" steht groß und mittig; darunter wischt eine ${C.accent}-Linie ein, dann blendet die ${C.brand}-Wortmarke auf. Sonst nichts im Bild.`
  },

  {
    key: 'endcard', title: 'Endcard — die Marke', chip: 'Spring · Bloom', weight: 1.35,
    draw(ctx, W, H, t, C) {
      const u = Math.min(W, H) / 1000;
      const e = easeOutBack(clamp(seg(t, 0, 0.4), 0, 1));
      const glowPulse = 0.28 + 0.14 * Math.sin(t * Math.PI * 1.6);

      bgGradient(ctx, W, H, C.filmDark, '#040507', C.primary, glowPulse, W * 0.5, H * 0.44, Math.max(W, H) * 0.52);
      // zusätzliches tiefes Feld, damit die Endcard satt sitzt
      ctx.fillStyle = 'rgba(0,0,0,.16)';
      ctx.fillRect(0, 0, W, H);

      drawLogo(ctx, C.logo, W / 2, H * 0.44, W * 0.46 * (0.86 + 0.14 * e), H * 0.3,
        { alpha: clamp(e, 0, 1), glow: 90 * u, glowHex: C.primary });

      const ta = easeOutCubic(seg(t, 0.28, 0.62));
      drawHeadline(ctx, C.copy.claim, W / 2, H * 0.65, 40 * u, rgba('#ffffff', 0.9),
        { family: C.font.body, weight: 400, maxW: W * 0.74, alpha: ta });

      // CTA-Pille
      const ca = easeOutCubic(seg(t, 0.45, 0.8));
      if (ca > 0) {
        ctx.save();
        ctx.globalAlpha = ca;
        setFont(ctx, C.font.body, 600, 30 * u, 2 * u);
        const label = C.copy.cta;
        const tw = ctx.measureText(label).width;
        const bw = tw + 76 * u, bh = 74 * u;
        const bx = W / 2 - bw / 2, by = H * 0.75;
        roundRect(ctx, bx, by, bw, bh, bh / 2);
        ctx.fillStyle = C.primary;
        ctx.fill();
        ctx.fillStyle = luminance(C.primary) > 0.45 ? '#0b0c0e' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, W / 2, by + bh / 2);
        ctx.restore();
      }

      // Abschließender Lichtsweep über das ganze Bild
      sweep(ctx, 0, 0, W, H, seg(t, 0.6, 1), 0.16, -0.4);
      vignette(ctx, W, H, 0.6);
    },
    vo: C => `${C.brand}. ${C.copy.cta}`,
    scene: 'Endcard: Logo groß, Claim, Handlungsaufforderung. Die letzte Einstellung gehört der Marke.',
    camEn: 'locked-off, logo lockup, gentle bloom',
    actionEn: C => `Final brand lockup: the supplied ${C.brand} logo springs into the centre of frame at 46% width on a ${C.primary} volumetric glow, unaltered. The claim "${C.copy.claim}" fades in below, then the CTA "${C.copy.cta}". A soft light bloom sweeps across the frame on the last beat. Nothing competes with the mark.`,
    actionDe: C => `Finales Marken-Lockup: das gelieferte ${C.brand}-Logo federt mittig ins Bild, 46 % Breite, auf einem volumetrischen ${C.primary}-Glühen, unverändert. Darunter blendet der Claim „${C.copy.claim}" auf, dann die Handlungsaufforderung „${C.copy.cta}". Ein weicher Lichtsweep zum Schluss.`
  }
];

/* Auswahl je Länge — die Endcard ist immer dabei */
const SETS = {
  15: ['hook', 'typeSlam', 'heroPack', 'macro', 'claim', 'endcard'],
  20: ['hook', 'typeSlam', 'heroPack', 'splitGrid', 'macro', 'device', 'claim', 'endcard'],
  30: ['hook', 'typeSlam', 'heroPack', 'splitGrid', 'macro', 'device', 'stat', 'lifestyle', 'claim', 'endcard']
};

const PACE = {
  calm:   { exp: 1.35, dip: 0.075, de: 'Ruhig' },
  normal: { exp: 1.0,  dip: 0.05,  de: 'Ausgewogen' },
  fast:   { exp: 0.72, dip: 0.03,  de: 'Schnell' }
};

const PLACES = {
  held: 'gym or training space', entdecker: 'rooftop or trailhead', weise: 'quiet studio desk',
  narr: 'busy street corner', liebende: 'warm evening kitchen', herrscher: 'stone-and-brass hotel bar',
  schoepfer: 'workshop bench', unschuld: 'sunlit morning kitchen'
};

/* ═══════════════ State ═══════════════ */

const state = {
  logo: null, logoSrc: null,
  palette: null,
  brand: '', category: '',
  archetype: 'auto', typo: 'auto',
  format: '9:16', duration: 20, pace: 'normal',
  copySeed: 0,
  audio: true, safe: false, loop: true,
  promptLang: 'en', negative: true, params: true,
  // Wiedergabe
  playing: false, time: 0, recording: false,
  timeline: [], total: 20, activeShot: -1
};

/* ═══════════════ DOM ═══════════════ */

const $ = s => document.querySelector(s);
const el = {
  drop: $('#drop'), dropInner: $('#dropInner'), file: $('#fileInput'), logo: $('#logoPreview'), demo: $('#btnDemo'),
  brand: $('#brandName'), category: $('#category'), archetype: $('#archetype'), typo: $('#typo'),
  format: $('#format'), duration: $('#duration'), pace: $('#pace'),
  audio: $('#optAudio'), safe: $('#optSafe'), loop: $('#optLoop'),
  swatches: $('#swatches'), primaryPick: $('#primaryPick'),
  lang: $('#promptLang'), negative: $('#optNegative'), params: $('#optParams'),
  empty: $('#empty'), studio: $('#studio'),
  canvas: $('#stage'), viewport: $('#viewport'), safeBox: $('#safe'), playOverlay: $('#playOverlay'), recBadge: $('#recBadge'),
  play: $('#btnPlay'), restart: $('#btnRestart'), scrub: $('#scrub'), fill: $('#fill'), marks: $('#marks'),
  time: $('#time'), nowPlaying: $('#nowPlaying'), shots: $('#shots'), boardMeta: $('#boardMeta'),
  reshuffle: $('#btnReshuffle'), copyAll: $('#btnCopyAll'), exportDoc: $('#btnExportDoc'), render: $('#btnRender'),
  toast: $('#toast')
};

const ctx2d = el.canvas.getContext('2d');

function fillSelect(node, map) {
  node.innerHTML = Object.entries(map).map(([k, v]) => `<option value="${k}">${v.de}</option>`).join('');
}
fillSelect(el.archetype, ARCHETYPES);
fillSelect(el.typo, TYPO);
fillSelect(el.format, FORMATS);
el.format.value = '9:16';

/* ═══════════════ Toast & Clipboard ═══════════════ */

let toastTimer;
function toast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('show'), 2100);
}
async function copy(text, msg = 'Kopiert') {
  try { await navigator.clipboard.writeText(text); toast(msg); }
  catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    toast(msg);
  }
}

/* ═══════════════ Kontext ═══════════════ */

function deriveArchetype(sys) {
  const [h, s, l] = rgbToHsl(...hexToRgb(sys.primary));
  if (s < 0.16) return l > 0.6 ? 'unschuld' : 'weise';
  if (s > 0.62 && l < 0.5 && (h < 22 || h > 340)) return 'held';
  if (h >= 22 && h < 48 && s > 0.4) return 'herrscher';
  if (h >= 48 && h < 78) return 'narr';
  if (h >= 78 && h < 165) return 'unschuld';
  if (h >= 165 && h < 210) return 'weise';
  if (h >= 210 && h < 260) return 'entdecker';
  if (h >= 260 && h < 310) return 'schoepfer';
  return 'liebende';
}
function deriveTypo(a) {
  return ({ herrscher: 'editorial', liebende: 'editorial', weise: 'neutral', entdecker: 'neutral',
            schoepfer: 'serifsoft', unschuld: 'serifsoft', held: 'geometric', narr: 'geometric' })[a] || 'geometric';
}

function buildContext() {
  const sys = buildSystem(state.palette.primary, state.palette.raw);
  const archetype = state.archetype === 'auto' ? deriveArchetype(sys) : state.archetype;
  const typo = state.typo === 'auto' ? deriveTypo(archetype) : state.typo;
  const pool = COPY[archetype];
  const pick = (arr, off) => arr[(state.copySeed + off) % arr.length];

  return {
    ...sys,
    logo: state.logo,
    brand: state.brand || 'DEINE MARKE',
    category: state.category || 'Consumer-Produkt',
    archetype, archetypeName: ARCHETYPES[archetype].de, archetypeMood: ARCHETYPES[archetype].mood,
    place: PLACES[archetype],
    font: { head: TYPO[typo].head, headWeight: TYPO[typo].headWeight, body: TYPO[typo].body },
    typoName: `${TYPO[typo].head} + ${TYPO[typo].body}`,
    typoEn: TYPO[typo].en,
    copy: {
      hook: pick(pool.hook, 0),
      head: pick(pool.head, 1),
      claim: pick(pool.claim, 2),
      stat: pick(pool.stat, 1),
      cta: pick(pool.cta, 0)
    }
  };
}

/* ═══════════════ Timeline ═══════════════ */

function buildTimeline(C) {
  const keys = SETS[state.duration];
  const shots = keys.map(k => SHOTS.find(s => s.key === k)).filter(Boolean);
  const exp = PACE[state.pace].exp;
  const weights = shots.map(s => Math.pow(s.weight, exp));
  const sum = weights.reduce((a, b) => a + b, 0);
  let cursor = 0;
  return shots.map((s, i) => {
    const dur = state.duration * weights[i] / sum;
    const item = { shot: s, index: i, start: cursor, dur, end: cursor + dur };
    cursor += dur;
    return item;
  });
}

/* ═══════════════ Renderer ═══════════════ */

let frameCounter = 0;

function renderFrame(time, ctx = ctx2d, W = el.canvas.width, H = el.canvas.height, C = currentContext) {
  if (!C) return;
  const tl = state.timeline;
  if (!tl.length) return;
  let item = tl.find(s => time >= s.start && time < s.end) || tl[tl.length - 1];
  const t = clamp((time - item.start) / item.dur, 0, 1);

  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  item.shot.draw(ctx, W, H, t, C);
  ctx.restore();

  // Schnitt-Behandlung: kurzer Abriss ins Schwarz an jeder Klebestelle
  const dip = PACE[state.pace].dip;
  const inDip = t < dip ? 1 - t / dip : 0;
  const outDip = t > 1 - dip * 0.6 ? (t - (1 - dip * 0.6)) / (dip * 0.6) : 0;
  const d = Math.max(inDip * 0.92, outDip * 0.5);
  if (d > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${d})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  grain(ctx, W, H, 0.055, frameCounter);

  if (item.index !== state.activeShot) {
    state.activeShot = item.index;
    highlightShot(item.index);
    paintNowPlaying(item, C);
  }
}

/* Bei 0.0 s liegt der Film noch im Schwarzabriss des ersten Schnitts.
   Als Standbild zeigen wir deshalb ein Posterframe aus der ersten Einstellung. */
function paintIdle() {
  if (state.playing) { renderFrame(state.time); return; }
  const poster = (state.time === 0 && state.timeline.length) ? state.timeline[0].dur * 0.5 : state.time;
  renderFrame(poster);
}

function paintNowPlaying(item, C) {
  const vo = item.shot.vo(C);
  el.nowPlaying.innerHTML = `
    <div class="np-head">
      <span class="np-idx">${String(item.index + 1).padStart(2, '0')}</span>
      <span class="np-title">${item.shot.title}</span>
      <span class="np-cam">${item.shot.chip}</span>
    </div>
    <p class="np-vo">${vo ? `<b>„${vo}"</b> · ` : ''}${item.shot.scene}</p>`;
}

function highlightShot(i) {
  el.shots.querySelectorAll('.shot').forEach((n, j) => n.classList.toggle('active', j === i));
}

/* ── Wiedergabe-Schleife ── */
let rafId = null, lastTs = 0;

function tick(ts) {
  if (!state.playing) return;
  const dt = lastTs ? (ts - lastTs) / 1000 : 0;
  lastTs = ts;
  frameCounter++;
  state.time += dt;

  if (state.time >= state.total) {
    if (state.recording) { state.time = state.total; renderFrame(state.total - 0.001); updateTransport(); stopRecording(); return; }
    if (state.loop) { state.time = 0; restartAudio(); }
    else { state.time = state.total; pause(); renderFrame(state.total - 0.001); updateTransport(); return; }
  }
  renderFrame(state.time);
  updateTransport();
  rafId = requestAnimationFrame(tick);
}

function play() {
  if (state.playing) return;
  if (state.time >= state.total - 0.01) state.time = 0;
  state.playing = true;
  lastTs = 0;
  el.viewport.classList.remove('paused');
  el.play.querySelector('.ico-play').hidden = true;
  el.play.querySelector('.ico-pause').hidden = false;
  startAudio(state.time);
  rafId = requestAnimationFrame(tick);
}
function pause() {
  state.playing = false;
  if (rafId) cancelAnimationFrame(rafId);
  el.viewport.classList.add('paused');
  el.play.querySelector('.ico-play').hidden = false;
  el.play.querySelector('.ico-pause').hidden = true;
  stopAudio();
}
function seek(time) {
  state.time = clamp(time, 0, state.total);
  renderFrame(state.time);
  updateTransport();
  if (state.playing) restartAudio();
}

function updateTransport() {
  const p = state.total ? state.time / state.total : 0;
  el.fill.style.width = (p * 100).toFixed(2) + '%';
  el.time.textContent = `${state.time.toFixed(1)} / ${state.total.toFixed(1)} s`;
}

/* ═══════════════ Sound-Bett ═══════════════ */

let audioCtx = null, audioMaster = null, audioDest = null, audioNodes = [];

function ensureAudio() {
  if (audioCtx) return audioCtx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  audioCtx = new AC();
  audioMaster = audioCtx.createGain();
  audioMaster.gain.value = 0.5;
  audioMaster.connect(audioCtx.destination);
  audioDest = audioCtx.createMediaStreamDestination();
  audioMaster.connect(audioDest);
  return audioCtx;
}

function noiseBuffer(ac, dur) {
  const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function kick(ac, at, gain = 0.8) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(120, at);
  o.frequency.exponentialRampToValueAtTime(44, at + 0.16);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.34);
  o.connect(g); g.connect(audioMaster);
  o.start(at); o.stop(at + 0.4);
  audioNodes.push(o, g);
}

function tick_(ac, at, gain = 0.1) {
  const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
  s.buffer = noiseBuffer(ac, 0.06);
  f.type = 'highpass'; f.frequency.value = 6000;
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.055);
  s.connect(f); f.connect(g); g.connect(audioMaster);
  s.start(at); s.stop(at + 0.07);
  audioNodes.push(s, g, f);
}

function riser(ac, at, dur, gain = 0.16) {
  const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
  s.buffer = noiseBuffer(ac, dur);
  f.type = 'bandpass'; f.Q.value = 1.2;
  f.frequency.setValueAtTime(300, at);
  f.frequency.exponentialRampToValueAtTime(5200, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + dur * 0.85);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  s.connect(f); f.connect(g); g.connect(audioMaster);
  s.start(at); s.stop(at + dur);
  audioNodes.push(s, g, f);
}

function startAudio(fromSec) {
  if (!state.audio) return;
  const ac = ensureAudio();
  if (!ac) return;
  stopAudio();
  if (ac.state === 'suspended') ac.resume();
  const t0 = ac.currentTime + 0.06;
  const remain = state.total - fromSec;

  // Drone: zwei leicht verstimmte Oszillatoren tragen den ganzen Film
  [55, 82.5].forEach((f, i) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = i ? 'triangle' : 'sine';
    o.frequency.value = f * (1 + i * 0.004);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(i ? 0.05 : 0.1, t0 + 1.2);
    g.gain.setValueAtTime(i ? 0.05 : 0.1, t0 + remain - 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + remain);
    o.connect(g); g.connect(audioMaster);
    o.start(t0); o.stop(t0 + remain + 0.1);
    audioNodes.push(o, g);
  });

  // Kick auf jeden Schnitt
  state.timeline.forEach((it, i) => {
    if (it.start < fromSec) return;
    kick(ac, t0 + (it.start - fromSec), i === state.timeline.length - 1 ? 0.95 : 0.7);
  });

  // gleichmäßiger Puls dazwischen
  const beat = 0.5;
  for (let b = Math.ceil(fromSec / beat) * beat; b < state.total; b += beat) {
    tick_(ac, t0 + (b - fromSec), 0.075);
  }

  // Riser in die Endcard
  const last = state.timeline[state.timeline.length - 1];
  if (last && last.start > fromSec) {
    const d = Math.min(1.4, last.start - fromSec);
    riser(ac, t0 + (last.start - fromSec) - d, d);
  }
}

function stopAudio() {
  audioNodes.forEach(n => { try { n.stop && n.stop(); } catch {} try { n.disconnect(); } catch {} });
  audioNodes = [];
}
function restartAudio() { if (state.playing) startAudio(state.time); }

/* ═══════════════ Video-Export ═══════════════ */

let recorder = null, recChunks = [];

function pickMime() {
  const list = [
    'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp9',
    'video/webm;codecs=vp8,opus', 'video/webm;codecs=vp8', 'video/webm'
  ];
  return list.find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';
}

function startRecording() {
  if (!window.MediaRecorder || !el.canvas.captureStream) {
    toast('Dieser Browser kann kein Video aufnehmen — Drehbuch-Export nutzen');
    return;
  }
  const mime = pickMime();
  if (!mime) { toast('Kein unterstütztes Video-Format gefunden'); return; }

  const stream = el.canvas.captureStream(30);
  if (state.audio) {
    const ac = ensureAudio();
    if (ac && audioDest) {
      const track = audioDest.stream.getAudioTracks()[0];
      if (track) stream.addTrack(track);
    }
  }

  recChunks = [];
  try {
    recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 });
  } catch {
    recorder = new MediaRecorder(stream);
  }
  recorder.ondataavailable = e => { if (e.data && e.data.size) recChunks.push(e.data); };
  recorder.onstop = finishRecording;

  state.recording = true;
  el.recBadge.hidden = false;
  el.render.disabled = true;
  el.render.textContent = 'Rendert …';

  state.time = 0;
  renderFrame(0);
  recorder.start(100);
  play();
}

function stopRecording() {
  if (!recorder || recorder.state === 'inactive') return;
  pause();
  setTimeout(() => { try { recorder.stop(); } catch {} }, 260);
}

function finishRecording() {
  state.recording = false;
  el.recBadge.hidden = true;
  el.render.disabled = false;
  el.render.textContent = 'Video rendern';

  const blob = new Blob(recChunks, { type: recChunks[0]?.type || 'video/webm' });
  const name = `${(state.brand || 'marke').toLowerCase().replace(/\s+/g, '-')}-werbeclip-${state.format.replace(':', 'x')}-${state.duration}s.webm`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 6000);
  toast(`Video exportiert · ${(blob.size / 1048576).toFixed(1)} MB`);
}

/* ═══════════════ Prompts & Drehbuch ═══════════════ */

const NEGATIVE = {
  en: 'NEGATIVE: do not alter, redraw, recolour or crop the logo; no extra logos or watermarks; no garbled invented text; no distorted or six-fingered hands; no sterile product-on-white; no clutter; no plastic CGI skin; no flat background; no oversaturation; no visible AI artefacts; no camera shake beyond the described move.',
  de: 'NEGATIV: Logo nicht verändern, neu zeichnen, umfärben oder beschneiden; keine zusätzlichen Logos oder Wasserzeichen; kein verstümmelter oder erfundener Text; keine verzerrten oder sechsfingrigen Hände; kein steriler Produkt-auf-Weiß-Shot; keine Unordnung; keine Plastik-CGI-Haut; kein flacher Hintergrund; keine Übersättigung; keine sichtbaren KI-Artefakte.'
};

function paramLine(C) {
  return `PARAMETERS: aspect ${state.format} · ${Math.round(state.curDur * 10) / 10}s · 24 fps · cinematic photoreal · Veo / Sora / Runway Gen-3 / Kling · seed locked for continuity across shots`;
}

function buildPrompt(item, C) {
  const lang = state.promptLang;
  const s = item.shot;
  const dur = item.dur.toFixed(1);
  state.curDur = item.dur;

  const head = lang === 'en'
    ? `SHOT ${String(item.index + 1).padStart(2, '0')} — ${s.title} · ${dur}s · ${state.format}
Ultra-photorealistic cinematic advertising film, 8K, IMAX-grade cinematography, shallow depth of field, filmic grain, natural motion blur.
BRAND: ${C.brand}${C.category ? ` — ${C.category}` : ''}. Archetype: ${C.archetypeMood}. Palette: ${C.primary} (primary), ${C.deep}, ${C.mid}, ${C.light}, ${C.accent} (accent).
TYPOGRAPHY: ${C.typoEn}. On-screen copy: "${s.vo(C) || '—'}" — short, small, never competing with the mark.
LOGO LAW: the supplied logo is the hero and must be reproduced pixel-exact — never redraw, restyle, recolour or crop it.`
    : `SHOT ${String(item.index + 1).padStart(2, '0')} — ${s.title} · ${dur}s · ${state.format}
Ultra-fotorealistischer Werbefilm, 8K, IMAX-Kinematografie, geringe Schärfentiefe, filmisches Korn, natürliche Bewegungsunschärfe.
MARKE: ${C.brand}${C.category ? ` — ${C.category}` : ''}. Archetyp: ${C.archetypeMood}. Palette: ${C.primary} (primär), ${C.deep}, ${C.mid}, ${C.light}, ${C.accent} (Akzent).
TYPOGRAFIE: ${C.typoEn}. Text im Bild: „${s.vo(C) || '—'}" — kurz, klein, niemals in Konkurrenz zur Marke.
LOGO-GESETZ: Das gelieferte Logo ist der Held und muss pixelgenau reproduziert werden — niemals neu zeichnen, umfärben oder beschneiden.`;

  const body = lang === 'en'
    ? `CAMERA: ${s.camEn}.
ACTION: ${s.actionEn(C)}
LIGHT: motivated key with volumetric haze, ${C.accent} rim separation, deep controlled shadows, no flat fill.
HUMAN LAW: real human activity in frame — hands, body or expression, diverse and naturally posed, never stock-photo stiff.`
    : `KAMERA: ${s.camEn}.
AKTION: ${s.actionDe(C)}
LICHT: motiviertes Hauptlicht mit volumetrischem Nebel, ${C.accent}-Kantenlicht zur Trennung, tiefe kontrollierte Schatten, kein flaches Fülllicht.
MENSCH-GESETZ: echte menschliche Aktivität im Bild — Hände, Körper oder Ausdruck, divers und natürlich posiert, niemals stockfoto-steif.`;

  const parts = [head, body];
  if (state.negative) parts.push(NEGATIVE[lang]);
  if (state.params) parts.push(paramLine(C));
  return parts.join('\n\n');
}

function scriptText(C) {
  const tl = state.timeline;
  const head = `WERBECLIP — ${C.brand}
${'='.repeat(52)}
Format      : ${state.format} (${FORMATS[state.format].w}×${FORMATS[state.format].h})
Länge       : ${state.duration} s · ${tl.length} Einstellungen · Schnitt ${PACE[state.pace].de}
Primärfarbe : ${C.primary}
Palette     : ${C.deep} · ${C.mid} · ${C.light} · Akzent ${C.accent}
Typografie  : ${C.typoName}
Archetyp    : ${C.archetypeName}

VOICEOVER / TEXTFAHNE
${tl.map((it, i) => {
    const vo = it.shot.vo(C);
    return `  ${fmtTC(it.start)}  ${vo ? `„${vo}"` : '(ohne Text)'}`;
  }).join('\n')}
`;
  const body = tl.map(it => `
${'─'.repeat(52)}
${String(it.index + 1).padStart(2, '0')} — ${it.shot.title}
Timecode: ${fmtTC(it.start)} – ${fmtTC(it.end)}  (${it.dur.toFixed(1)}s)
Kamera  : ${it.shot.chip}
Szene   : ${it.shot.scene}
${'─'.repeat(52)}
${buildPrompt(it, C)}
`).join('\n');
  return head + body;
}

function fmtTC(sec) {
  const s = Math.floor(sec), f = Math.round((sec - s) * 25);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
}

/* ═══════════════ Storyboard-UI ═══════════════ */

function renderBoard(C) {
  el.boardMeta.textContent = `· ${state.timeline.length} Einstellungen · ${state.duration} s · ${state.format}`;
  el.shots.innerHTML = state.timeline.map(it => `
    <article class="shot" data-i="${it.index}" style="animation-delay:${it.index * 40}ms">
      <div class="thumbwrap" data-seek="${it.start + it.dur * 0.5}">
        <canvas data-thumb="${it.index}"></canvas>
        <span class="tc">${fmtTC(it.start)} · ${it.dur.toFixed(1)}s</span>
      </div>
      <div class="shot-body">
        <div class="shot-head">
          <span class="idx">${String(it.index + 1).padStart(2, '0')}</span>
          <h3>${it.shot.title}</h3>
          <span class="cam">${it.shot.chip}</span>
        </div>
        <p class="shot-vo">${it.shot.vo(C) ? `<b>„${it.shot.vo(C)}"</b> · ` : ''}${it.shot.scene}</p>
        <pre class="prompt" data-prompt>${escapeHtml(buildPrompt(it, C))}</pre>
        <div class="shot-actions">
          <button class="btn tiny" data-act="toggle">Ganzen Prompt zeigen</button>
          <button class="btn tiny" data-act="goto">Zur Einstellung springen</button>
          <button class="btn tiny primary" data-act="copy">Prompt kopieren</button>
        </div>
      </div>
    </article>`).join('');

  // Thumbnails rendern
  const f = FORMATS[state.format];
  const tw = 264, th = Math.round(tw * f.h / f.w);
  state.timeline.forEach(it => {
    const cv = el.shots.querySelector(`[data-thumb="${it.index}"]`);
    if (!cv) return;
    cv.width = tw; cv.height = th;
    const c = cv.getContext('2d');
    c.fillStyle = '#000'; c.fillRect(0, 0, tw, th);
    it.shot.draw(c, tw, th, 0.58, C);
    grain(c, tw, th, 0.05, 7);
  });

  // Marker auf dem Scrubber
  el.marks.innerHTML = state.timeline.slice(1)
    .map(it => `<i style="left:${(it.start / state.total * 100).toFixed(2)}%"></i>`).join('');

  wireBoard(C);
}

function wireBoard(C) {
  el.shots.querySelectorAll('[data-seek]').forEach(n =>
    n.addEventListener('click', () => { seek(parseFloat(n.dataset.seek)); if (!state.playing) play(); }));

  el.shots.querySelectorAll('[data-act]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.shot');
      const pre = card.querySelector('[data-prompt]');
      const i = +card.dataset.i;
      if (btn.dataset.act === 'copy') copy(pre.textContent, `Prompt für Shot ${String(i + 1).padStart(2, '0')} kopiert`);
      else if (btn.dataset.act === 'goto') { seek(state.timeline[i].start + 0.02); if (!state.playing) play(); }
      else {
        pre.classList.toggle('open');
        btn.textContent = pre.classList.contains('open') ? 'Prompt einklappen' : 'Ganzen Prompt zeigen';
      }
    });
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

/* ═══════════════ Swatches ═══════════════ */

function renderSwatches(C) {
  const items = [['Primär', C.primary], ['Tiefe', C.deep], ['Sekundär', C.mid], ['Licht', C.light], ['Akzent', C.accent]];
  el.swatches.innerHTML = items.map(([n, hex]) =>
    `<button class="sw" data-hex="${hex}" title="${hex} kopieren"><i style="background:${hex}"></i><b>${n}</b></button>`).join('');
  el.swatches.querySelectorAll('.sw').forEach(b =>
    b.addEventListener('click', () => copy(b.dataset.hex, b.dataset.hex + ' kopiert')));
}

/* ═══════════════ Haupt-Update ═══════════════ */

let currentContext = null;

function rebuild({ keepTime = false } = {}) {
  if (!state.palette) return;
  const C = buildContext();
  currentContext = C;

  const root = document.documentElement.style;
  root.setProperty('--brand-1', C.primary);
  root.setProperty('--brand-2', C.deep);
  root.setProperty('--brand-3', C.light);
  root.setProperty('--accent', C.accent);
  root.setProperty('--font-head', `'${C.font.head}', sans-serif`);

  const f = FORMATS[state.format];
  el.canvas.width = f.w;
  el.canvas.height = f.h;

  state.total = state.duration;
  state.timeline = buildTimeline(C);
  state.activeShot = -1;
  if (!keepTime || state.time > state.total) state.time = 0;

  renderSwatches(C);
  renderBoard(C);
  paintIdle();
  updateTransport();

  el.empty.hidden = true;
  el.studio.hidden = false;
  [el.reshuffle, el.copyAll, el.exportDoc, el.render].forEach(b => b.disabled = false);
  if (!state.playing) el.viewport.classList.add('paused');
  if (state.playing) restartAudio();
}

/* ═══════════════ Logo laden ═══════════════ */

function loadLogo(src) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    state.logo = img;
    state.logoSrc = src;
    el.logo.src = src;
    el.logo.hidden = false;
    el.dropInner.style.display = 'none';
    el.drop.classList.add('has-logo');
    try { state.palette = extractPalette(img); }
    catch { state.palette = { primary: '#c8963e', raw: ['#c8963e'] }; }
    el.primaryPick.value = state.palette.primary;
    rebuild();
    toast('Farb-DNA extrahiert · Drehbuch und Film erzeugt');
  };
  img.onerror = () => toast('Bild konnte nicht gelesen werden');
  img.src = src;
}

function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) { toast('Bitte eine Bilddatei wählen'); return; }
  const r = new FileReader();
  r.onload = e => loadLogo(e.target.result);
  r.readAsDataURL(file);
}

el.drop.addEventListener('click', () => el.file.click());
el.drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.file.click(); } });
el.file.addEventListener('change', e => handleFile(e.target.files[0]));
['dragenter', 'dragover'].forEach(t => el.drop.addEventListener(t, e => { e.preventDefault(); el.drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(t => el.drop.addEventListener(t, e => { e.preventDefault(); el.drop.classList.remove('over'); }));
el.drop.addEventListener('drop', e => handleFile(e.dataTransfer.files[0]));
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => e.preventDefault());

el.demo.addEventListener('click', () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e6b95c"/><stop offset="1" stop-color="#a9701f"/></linearGradient></defs>
    <circle cx="300" cy="240" r="132" fill="none" stroke="url(#g)" stroke-width="26"/>
    <path d="M228 240 L300 160 L372 240 L300 320 Z" fill="url(#g)"/>
    <text x="300" y="452" font-family="Montserrat, Helvetica, sans-serif" font-size="88" font-weight="900"
          letter-spacing="14" text-anchor="middle" fill="url(#g)">AURELIS</text>
  </svg>`;
  el.brand.value = 'AURELIS'; state.brand = 'AURELIS';
  el.category.value = 'Bio-Schokolade'; state.category = 'Bio-Schokolade';
  loadLogo('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
});

/* ═══════════════ Eingaben ═══════════════ */

el.brand.addEventListener('input', e => { state.brand = e.target.value.trim(); rebuild({ keepTime: true }); });
el.category.addEventListener('input', e => { state.category = e.target.value.trim(); rebuild({ keepTime: true }); });
el.archetype.addEventListener('change', e => { state.archetype = e.target.value; rebuild({ keepTime: true }); });
el.typo.addEventListener('change', e => { state.typo = e.target.value; rebuild({ keepTime: true }); });
el.format.addEventListener('change', e => { state.format = e.target.value; rebuild({ keepTime: true }); });
el.duration.addEventListener('change', e => { state.duration = +e.target.value; rebuild(); });
el.pace.addEventListener('change', e => { state.pace = e.target.value; rebuild({ keepTime: true }); });
el.primaryPick.addEventListener('input', e => {
  state.palette = { primary: e.target.value, raw: [e.target.value] };
  rebuild({ keepTime: true });
});
el.audio.addEventListener('change', e => { state.audio = e.target.checked; if (!state.audio) stopAudio(); else restartAudio(); });
el.safe.addEventListener('change', e => { state.safe = e.target.checked; el.safeBox.hidden = !state.safe; });
el.loop.addEventListener('change', e => { state.loop = e.target.checked; });
el.lang.addEventListener('change', e => { state.promptLang = e.target.value; if (currentContext) renderBoard(currentContext); });
el.negative.addEventListener('change', e => { state.negative = e.target.checked; if (currentContext) renderBoard(currentContext); });
el.params.addEventListener('change', e => { state.params = e.target.checked; if (currentContext) renderBoard(currentContext); });

el.reshuffle.addEventListener('click', () => { state.copySeed++; rebuild({ keepTime: true }); toast('Neue Copy'); });
el.copyAll.addEventListener('click', () => copy(scriptText(currentContext), 'Drehbuch mit allen Shot-Prompts kopiert'));
el.render.addEventListener('click', startRecording);

el.exportDoc.addEventListener('click', () => {
  const C = currentContext;
  const tl = state.timeline;
  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${C.brand} — Werbeclip-Drehbuch</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&family=Montserrat:wght@900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}
body{margin:0;background:#07080b;color:#f4f5f7;font-family:Inter,sans-serif;padding:48px 24px}
.wrap{max-width:1120px;margin:0 auto}
h1{font-family:Montserrat,sans-serif;font-size:clamp(30px,6vw,58px);letter-spacing:-.03em;margin:0 0 6px;color:${C.primary}}
.sub{color:#9aa0ab;margin:0 0 36px;font-size:14px}
.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin-bottom:40px}
.cell{border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:15px}
.cell h4{margin:0 0 7px;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#61666f}
.cell p{margin:0;font-size:13px;color:#9aa0ab;line-height:1.6}
.chips{display:flex;gap:6px;flex-wrap:wrap}
.chip{font:11px ui-monospace,monospace;padding:6px 9px;border-radius:8px;border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;gap:6px}
.chip i{width:14px;height:14px;border-radius:4px;display:block}
.vo{border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:16px 18px;margin-bottom:40px}
.vo h4{margin:0 0 10px;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#61666f}
.vo ol{margin:0;padding-left:20px;color:#c8cdd5;font-size:13.5px;line-height:1.9}
.vo code{color:#61666f;font-size:11px;margin-right:8px}
.shot{border:1px solid rgba(255,255,255,.1);border-radius:18px;overflow:hidden;margin-bottom:22px;background:rgba(255,255,255,.03)}
.shot header{padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.1);display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.shot header b{font-family:Montserrat,sans-serif;font-size:12px;background:${C.primary};color:${luminance(C.primary) > 0.45 ? '#0b0c0e' : '#fff'};padding:3px 8px;border-radius:6px}
.shot header h2{margin:0;font-size:15px;font-weight:600}
.shot header em{font-style:normal;font-size:11px;color:#61666f;letter-spacing:.08em;text-transform:uppercase}
.shot header .tc{margin-left:auto;font:11px ui-monospace,monospace;color:${C.primary}}
.shot img{display:block;width:100%;max-width:230px;margin:18px 18px 0;border-radius:10px;border:1px solid rgba(255,255,255,.1)}
.shot pre{margin:0;padding:18px;font:11.5px/1.65 ui-monospace,SFMono-Regular,Menlo,monospace;color:#b9c0cb;white-space:pre-wrap;word-break:break-word}
.logo{display:block;max-width:200px;max-height:130px;object-fit:contain;margin:0 0 24px;filter:drop-shadow(0 12px 30px rgba(0,0,0,.6))}
</style></head><body><div class="wrap">
<img class="logo" src="${state.logoSrc}" alt="${C.brand}">
<h1>${C.brand}</h1>
<p class="sub">Werbeclip-Drehbuch · ${state.format} · ${state.duration} s · ${tl.length} Einstellungen · ${new Date().toLocaleDateString('de-DE')}</p>
<div class="meta">
  <div class="cell"><h4>Farbsystem</h4><div class="chips">
    ${[C.primary, C.deep, C.mid, C.light, C.accent].map(h => `<span class="chip"><i style="background:${h}"></i>${h.toUpperCase()}</span>`).join('')}
  </div></div>
  <div class="cell"><h4>Typografie</h4><p>${C.typoName}</p></div>
  <div class="cell"><h4>Archetyp</h4><p>${C.archetypeName}</p></div>
  <div class="cell"><h4>Schnitt</h4><p>${PACE[state.pace].de} · ${tl.length} Schnitte</p></div>
</div>
<div class="vo"><h4>Voiceover / Textfahne</h4><ol>
${tl.map(it => `<li><code>${fmtTC(it.start)}</code>${it.shot.vo(C) ? `„${it.shot.vo(C)}"` : '<span style="color:#61666f">ohne Text</span>'}</li>`).join('')}
</ol></div>
${tl.map(it => {
    const cv = el.shots.querySelector(`[data-thumb="${it.index}"]`);
    const png = cv ? cv.toDataURL('image/png') : '';
    return `<section class="shot">
  <header><b>${String(it.index + 1).padStart(2, '0')}</b><h2>${it.shot.title}</h2><em>${it.shot.chip}</em>
    <span class="tc">${fmtTC(it.start)} – ${fmtTC(it.end)} · ${it.dur.toFixed(1)}s</span></header>
  ${png ? `<img src="${png}" alt="Shot ${it.index + 1}">` : ''}
  <pre>${escapeHtml(buildPrompt(it, C))}</pre></section>`;
  }).join('')}
</div></body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${(C.brand || 'marke').toLowerCase().replace(/\s+/g, '-')}-werbeclip-drehbuch.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  toast('Drehbuch als HTML exportiert');
});

/* ═══════════════ Transport-Bedienung ═══════════════ */

function togglePlay() { state.playing ? pause() : play(); }
el.play.addEventListener('click', togglePlay);
el.playOverlay.addEventListener('click', togglePlay);
el.restart.addEventListener('click', () => { seek(0); play(); });

function scrubTo(e) {
  const r = el.scrub.getBoundingClientRect();
  seek(clamp((e.clientX - r.left) / r.width, 0, 1) * state.total);
}
let scrubbing = false;
el.scrub.addEventListener('pointerdown', e => { scrubbing = true; el.scrub.setPointerCapture(e.pointerId); scrubTo(e); });
el.scrub.addEventListener('pointermove', e => { if (scrubbing) scrubTo(e); });
el.scrub.addEventListener('pointerup', e => { scrubbing = false; try { el.scrub.releasePointerCapture(e.pointerId); } catch {} });

window.addEventListener('keydown', e => {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (!state.timeline.length) return;
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  else if (e.code === 'ArrowRight') { e.preventDefault(); seek(state.time + 0.5); }
  else if (e.code === 'ArrowLeft') { e.preventDefault(); seek(state.time - 0.5); }
});

/* In einem inaktiven Tab liefert requestAnimationFrame keine Frames mehr und
   captureStream friert ein — eine laufende Aufnahme würde dabei unbrauchbar.
   Deshalb: Wiedergabe anhalten, Aufnahme sauber beenden. */
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) return;
  if (state.recording) { stopRecording(); toast('Tab gewechselt — Aufnahme beendet. Bitte im sichtbaren Tab neu rendern.'); }
  else if (state.playing) pause();
});

/* ═══════════════ Start ═══════════════ */

el.viewport.classList.add('paused');

// Canvas-Text braucht geladene Schriften, sonst rendert der erste Frame in Fallback
const fontsNeeded = [
  '900 100px Montserrat', '700 100px "Space Grotesk"',
  '900 100px "Playfair Display"', '400 100px "DM Serif Display"',
  '400 60px Inter', '600 60px Inter'
];
Promise.all(fontsNeeded.map(f => document.fonts.load(f).catch(() => {})))
  .then(() => document.fonts.ready)
  .then(() => { if (currentContext) rebuild({ keepTime: true }); })
  .catch(() => {});
