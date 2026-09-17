/* ============================================================
   Storyboard Studio — Prompt Generator
   Rein statisch, keine API. Alles im Browser (localStorage).
   ============================================================ */

/* Version. Der Dateistand wird automatisch aus dem Last-Modified-Datum
   von script.js gelesen — APP_DATE dient nur als Rückfall. */
const APP_VERSION = '1.0';
const APP_DATE    = '28.07.2026';

/* Der Browser darf die Seite nicht aus dem Vor-/Zurück-Speicher (bfcache)
   wiederherstellen — sonst siehst du eine eingefrorene alte Fassung. */
window.addEventListener('pageshow', e => { if (e.persisted) location.reload(); });

/* Prüft, ob index.html auf dem Server neuer ist als die geladene Fassung,
   und lädt in dem Fall genau einmal nach. */
async function ensureFreshPage(){
  try {
    const res = await fetch(location.pathname, { method:'HEAD', cache:'no-store' });
    const lm  = res.headers.get('last-modified'); if (!lm) return;
    const neu = new Date(lm).getTime();
    const alt = new Date(document.lastModified).getTime();
    if (neu - alt > 2000 && !sessionStorage.getItem('sbReloaded')){
      sessionStorage.setItem('sbReloaded', '1');
      location.reload();
      return;
    }
    sessionStorage.removeItem('sbReloaded');
  } catch(e){ /* file:// oder offline — dann bleibt es beim Cache-Buster */ }
}

async function showBuildDate(){
  const el = $('#appVer'); if (!el) return;
  try {
    const res = await fetch('script.js', { method:'HEAD', cache:'no-store' });
    const lm = res.headers.get('last-modified');
    if (!lm) return;
    const d = new Date(lm);
    el.title = `Storyboard Studio ${APP_VERSION} — Dateistand ` +
      d.toLocaleString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric',
                                  hour:'2-digit', minute:'2-digit' });
  } catch(e){ /* z. B. beim Öffnen per Doppelklick (file://) — Rückfall bleibt */ }
}

const KEY = 'sbstudio.v1';
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- Feld-Register ---------- */
const FIELDS = [
  'projectName',
  'c_name','c_age','c_body','c_face','c_outfit','c_acc','c_marks','c_style','c_bg','c_extra',
  'p_name','p_shape','p_mat','p_color','p_brand','p_feat','p_unique','p_detail','p_style','p_bg','p_light','p_extra',
  's_title','s_story','s_chars','s_setting','s_style','s_tone','s_light',
  's_dur','s_count','s_ratio','s_split','s_model','s_director','s_date','s_special',
  'a_model','a_shotlen','a_cam','a_audio','a_extra'
];
const CHECKS = ['o_num','o_time','o_cap','o_notes','o_foot','o_dlg',
                'a_notext','a_diegetic','a_nomusic','a_ref','a_loop'];

let state = { fields:{}, checks:{}, panels:[], library:[], imgs:{ char:[], prod:[] },
              storyMode:'image', animMode:'full', storyBoard:'all', animBoard:'all' };

/* Keys liegen bewusst getrennt vom Projekt — sie werden nie mitexportiert.
   Zwei Anbieter: OpenAI beschreibt auch Gesichter, Gemini blockiert sie bei
   Fotos realer Personen (PROHIBITED_CONTENT). */
const PROVIDERS = {
  claude: { label:'Anthropic Claude', keyLabel:'Anthropic API-Key', ph:'sk-ant-…', model:'claude-sonnet-5',
            hint:'Key erstellen: console.anthropic.com → API keys. Achtung: das Claude-Abo gilt hier nicht, die API braucht eigenes Guthaben. Claude verweigert nur die Identifikation einer Person, beschreibt Aussehen für Figurenentwürfe aber normalerweise.' },
  openai: { label:'OpenAI', keyLabel:'OpenAI API-Key', ph:'sk-…', model:'gpt-4.1-mini',
            hint:'Key erstellen: platform.openai.com → API keys. OpenAI verweigert nur die Identifikation einer Person („wer ist das?"), beschreibt Aussehen aber normalerweise.' },
  gemini: { label:'Google Gemini', keyLabel:'Google AI Studio API-Key', ph:'AIza… / AQ.…', model:'gemini-flash-latest',
            hint:'Key erstellen: aistudio.google.com → „Get API key". Achtung: Google blockiert das Beschreiben von Gesichtern realer Personen — dann werden nur Kleidung und Statur übernommen.' }
};
const KEY_PROV = 'sbstudio.provider';
const provider = () => PROVIDERS[localStorage.getItem(KEY_PROV)] ? localStorage.getItem(KEY_PROV) : 'claude';
const apiKey   = (p = provider()) => localStorage.getItem(`sbstudio.key.${p}`) || '';
const apiModel = (p = provider()) => localStorage.getItem(`sbstudio.model.${p}`) || PROVIDERS[p].model;

/* Einmalige Übernahme aus der früheren Ein-Anbieter-Fassung */
(function migrate(){
  const k = localStorage.getItem('sbstudio.apikey');
  if (k && !localStorage.getItem('sbstudio.key.gemini')){
    localStorage.setItem('sbstudio.key.gemini', k);
    const m = localStorage.getItem('sbstudio.apimodel');
    if (m) localStorage.setItem('sbstudio.model.gemini', m);
    localStorage.removeItem('sbstudio.apikey');
    localStorage.removeItem('sbstudio.apimodel');
  }
})();

/* ============================================================
   Story-Beats & Shot-Typen
   ============================================================ */
const BEATS = [
  { key:'intro',     de:'Einführung', en:'Introduction',  w:.13 },
  { key:'inciting',  de:'Auslöser',   en:'Inciting event', w:.13 },
  { key:'rising',    de:'Steigerung', en:'Rising action',  w:.27 },
  { key:'emotional', de:'Emotion',    en:'Emotional beat', w:.14 },
  { key:'climax',    de:'Höhepunkt',  en:'Climax',         w:.19 },
  { key:'ending',    de:'Auflösung',  en:'Resolution',     w:.14 }
];

const SHOTS = {
  intro:     ['WIDE ESTABLISHING SHOT','MEDIUM SHOT','AERIAL WIDE SHOT','MEDIUM CLOSE-UP'],
  inciting:  ['EXTREME CLOSE-UP','OVER-THE-SHOULDER SHOT','MACRO DETAIL SHOT','TIGHT CLOSE-UP'],
  rising:    ['DYNAMIC LOW ANGLE','TRACKING SIDE SHOT','HIGH ANGLE SHOT','WIDE SHOT','POV SHOT','DUTCH ANGLE'],
  emotional: ['TIGHT CLOSE-UP','TWO-SHOT','MEDIUM CLOSE-UP','OVER-THE-SHOULDER SHOT'],
  climax:    ['LOW ANGLE HERO SHOT','MEDIUM WIDE SHOT','EXTREME CLOSE-UP','DYNAMIC LOW ANGLE','HIGH ANGLE SHOT'],
  ending:    ['WARM MEDIUM CLOSE-UP','GOLDEN WIDE CLOSING SHOT','WIDE SHOT','AERIAL WIDE SHOT']
};

/* Grundhaltung je Beat — füllt leere Beschreibungen sinnvoll auf */
const BEAT_HINT = {
  intro:     'establish the world and the character in a calm, readable composition',
  inciting:  'the thing that changes everything is noticed for the first time',
  rising:    'the situation escalates, movement and energy increase',
  emotional: 'hold on the character; the feeling reads clearly on the face',
  climax:    'the biggest moment of the story, peak energy and scale',
  ending:    'the aftermath settles into a warm, conclusive final image'
};

/* Shot-Typ → Kamerabewegung für den Videoprompt */
const CAM_MOVE = [
  [/ESTABLISH|AERIAL/,        'slow push-in from a locked wide, gentle parallax'],
  [/TRACKING/,                'lateral tracking dolly moving with the subject'],
  [/LOW ANGLE|HERO/,          'low rising crane, slight tilt up'],
  [/HIGH ANGLE/,              'slow descending crane looking down'],
  [/EXTREME CLOSE|MACRO/,     'micro push-in, shallow focus, near-static'],
  [/OVER-THE-SHOULDER/,       'subtle arc around the shoulder'],
  [/POV/,                     'handheld first-person move, natural head motion'],
  [/DUTCH/,                   'tilted frame with a slow roll back to level'],
  [/TWO-SHOT|MEDIUM WIDE/,    'gentle drift, reframing on the action'],
  [/CLOSE-UP/,                'slow push-in, minimal handheld drift'],
  [/WIDE|CLOSING/,            'slow pull-back revealing the environment']
];
const camMove = shot => (CAM_MOVE.find(([re]) => re.test(shot || '')) || [null,'smooth, motivated camera move'])[1];

/* ============================================================
   Stil-Katalog — Label für die Auswahl, ausformulierte
   Beschreibung für den Prompt. Eigene Eingaben bleiben möglich.
   ============================================================ */
const STYLE_ART = [
  ['Pixar-Stil 3D', 'Pixar-style 3D animation, feature-film quality, appealing stylized proportions, soft subsurface-scattering skin, expressive large eyes, warm rounded forms, physically based rendering, cinematic depth of field'],
  ['Disney 2D klassisch', 'classic hand-drawn Disney-style 2D animation, clean confident linework, rounded appealing shapes, painted backgrounds, warm nostalgic palette, expressive squash-and-stretch acting'],
  ['Anime modern', 'modern Japanese TV anime style, crisp cel shading with sharp shadow shapes, expressive large eyes, detailed hair highlights, dynamic perspective, subtle film grain'],
  ['Anime handgemalt', 'hand-painted Japanese feature animation, soft gouache backgrounds, gentle natural light, restrained character linework, nostalgic pastoral atmosphere'],
  ['Stylized 3D malerisch', 'painterly stylized 3D, hand-painted textures over sculpted forms, visible brush strokes, dramatic rim lighting, rich saturated palette, semi-realistic proportions'],
  ['Comic / Graphic Novel', 'inked comic-book art, bold black linework, halftone dot shading, flat spot colours, dramatic compositions, high contrast'],
  ['Cinematic Live Action', 'photorealistic cinematic live-action film still, 35 mm anamorphic lenses, shallow depth of field, natural skin texture, filmic colour grade, fine grain'],
  ['Stop Motion / Knete', 'handcrafted stop-motion animation, visible clay and felt textures, tiny fingerprints and seams, miniature practical sets, charming handmade imperfection, macro lens look'],
  ['Aquarell-Bilderbuch', "children's picture-book watercolour illustration, soft washes on textured paper, visible pencil underdrawing, gentle pastel palette, generous white space"],
  ['Dark Fantasy', 'dark fantasy illustration, moody chiaroscuro lighting, muted desaturated palette with deep shadows, ornate detail, painterly texture, epic scale'],
  ['Retro Sci-Fi', 'retro-futuristic science-fiction illustration in 1970s paperback style, airbrushed gradients, chrome and matte plastic surfaces, orange and teal palette, vast horizons'],
  ['Film Noir', 'black-and-white film noir cinematography, hard key light and venetian-blind shadows, deep blacks, extreme contrast, smoke and rain atmosphere, 1940s wardrobe'],
  ['Cel-Shaded Spiel', 'cel-shaded video-game render, bold outlines, flat toon shading with sharp light steps, saturated colours, clean readable silhouettes'],
  ['Scherenschnitt / Papercut', 'layered paper-cut illustration, stacked coloured card with visible edges and soft drop shadows, flat graphic shapes, tactile handmade look'],
  ['Pixel Art', 'detailed pixel-art scene, limited palette, crisp pixel clusters, subtle dithering, 16-bit era charm'],
  ['Horror', 'high-contrast horror imagery, cold desaturated palette, deep shadows swallowing detail, unsettling composition, fog and harsh practical lights']
];

const STYLE_PROD = [
  ['Produktfoto realistisch', 'photorealistic product photography, tack-sharp focus, true-to-life materials and colour, soft box lighting with clean gradients'],
  ['Luxus / Premium', 'luxury product photography, deep blacks and controlled specular highlights, polished surfaces, elegant restrained composition, editorial quality'],
  ['Minimalistisch', 'minimalist commercial product shot, flat even lighting, generous empty space, no distractions, calm neutral palette'],
  ['Futuristischer Tech-Render', 'futuristic technical 3D render, precise engineering surfaces, cool metallic and glass materials, crisp reflections, subtle emissive accents'],
  ['Cinematic Hero Shot', 'cinematic hero product shot, dramatic single key light with deep falloff, moody atmosphere, shallow depth of field, filmic colour grade'],
  ['Stylized 3D', 'stylized 3D product render, slightly exaggerated proportions, clean matte materials, playful saturated colours, soft ambient occlusion'],
  ['Explosionszeichnung', 'technical exploded view, every component separated along clean axes with even spacing, neutral studio lighting, engineering clarity'],
  ['Blueprint / technisch', 'technical blueprint illustration, precise white line drawing on deep blue ground, dimension lines and orthographic accuracy'],
  ['Vintage-Werbung', 'vintage advertising illustration, mid-century printed look, slightly faded inks, visible paper grain, warm retro palette'],
  ['Makro-Detail', 'extreme macro product photography, razor-thin depth of field, visible surface micro-texture, precise controlled highlights']
];

function styleInfo(id, catalog){
  const raw = clean(val(id));
  if (!raw) return { label: catalog[0][0], full: catalog[0][1] };
  const hit = catalog.find(([l]) => l.toLowerCase() === raw.toLowerCase());
  return hit ? { label: hit[0], full: hit[1] } : { label: raw, full: raw };
}

/* ============================================================
   Helfer
   ============================================================ */
const val   = id => (($(`#${id}`) || {}).value || '').trim();
const chk   = id => !!(($(`#${id}`) || {}).checked);
const clean = t => (t || '').replace(/\s+/g, ' ').trim().replace(/[.,;]+$/, '');
/* wie clean, aber Satzzeichen bleiben erhalten (für Fließtext in Anführungszeichen) */
const soft  = t => (t || '').replace(/\s+/g, ' ').trim();
const sent  = t => { const s = clean(t); return s ? s + '.' : ''; };
/* kurze Bildunterschrift: erster Satz bzw. maximal ~120 Zeichen */
function caption(t){
  const s = soft(t);
  if (s.length <= 120) return s;
  const cut = s.slice(0, 120);
  const dot = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return (dot > 50 ? cut.slice(0, dot + 1) : cut.slice(0, cut.lastIndexOf(' ')) + ' …').trim();
}

function timecode(sec){
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function gridFor(n){
  const map = {4:[2,2],6:[2,3],8:[2,4],9:[3,3],10:[2,5],12:[3,4],14:[2,7],15:[3,5],16:[4,4],18:[3,6],20:[4,5],21:[3,7],24:[4,6],25:[5,5]};
  if (map[n]) return map[n];
  const cols = n % 5 === 0 ? 5 : n % 4 === 0 ? 4 : n % 3 === 0 ? 3 : 5;
  return [Math.ceil(n / cols), cols];
}
function beatFor(i, n){
  let acc = 0;
  const pos = (i + .5) / n;
  for (const b of BEATS){ acc += b.w; if (pos <= acc) return b; }
  return BEATS[BEATS.length - 1];
}
function toast(msg){
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 1800);
}

/* ============================================================
   Bild-Upload & Analyse
   ============================================================ */
const MAX_IMGS = 4;

/* Bild verkleinern, damit es in den localStorage passt */
function shrink(file, max = 900){
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = () => rej(new Error('Datei konnte nicht gelesen werden.'));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => rej(new Error('Das ist kein lesbares Bild.'));
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = Object.assign(document.createElement('canvas'),
                  { width: Math.round(img.width * s), height: Math.round(img.height * s) });
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', .82));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

async function addImages(kind, files){
  const list = [...files].filter(f => /^image\//.test(f.type));
  if (!list.length) return;
  const room = MAX_IMGS - state.imgs[kind].length;
  if (room <= 0) return toast(`Maximal ${MAX_IMGS} Bilder.`);
  for (const f of list.slice(0, room)){
    try { state.imgs[kind].push(await shrink(f)); }
    catch(e){ toast(e.message); }
  }
  renderThumbs(kind); save(); render();
}

function renderThumbs(kind){
  const box = $(kind === 'char' ? '#charThumbs' : '#prodThumbs');
  box.innerHTML = '';
  state.imgs[kind].forEach((src, i) => {
    const t = document.createElement('div');
    t.className = 'thumb';
    t.innerHTML = `<img src="${src}" alt="Referenzbild ${i + 1}"><button title="entfernen">✕</button>`;
    t.querySelector('button').addEventListener('click', () => {
      state.imgs[kind].splice(i, 1); renderThumbs(kind); save(); render();
    });
    box.appendChild(t);
  });
  const info = $(kind === 'char' ? '#charAiInfo' : '#prodAiInfo');
  const n = state.imgs[kind].length;
  info.textContent = !n
    ? 'Erst ein Bild hochladen.'
    : apiKey()
      ? `${n} Bild${n === 1 ? '' : 'er'} bereit — Analyse mit ${apiModel()} (${PROVIDERS[provider()].label}).`
      : `${n} Bild${n === 1 ? '' : 'er'} als Referenz gespeichert. Für die automatische Analyse oben einen API-Key hinterlegen.`;
}

function setupUpload(kind, dropId, fileId){
  const drop = $(dropId), file = $(fileId);
  drop.addEventListener('click', () => file.click());
  drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); file.click(); } });
  file.addEventListener('change', e => { addImages(kind, e.target.files); e.target.value = ''; });
  ['dragenter','dragover'].forEach(ev => drop.addEventListener(ev, e => {
    e.preventDefault(); drop.classList.add('drag');
  }));
  ['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => {
    e.preventDefault(); drop.classList.remove('drag');
  }));
  drop.addEventListener('drop', e => addImages(kind, e.dataTransfer.files));
}

/* Einfügen aus der Zwischenablage — landet im gerade offenen Tab */
function setupPaste(){
  document.addEventListener('paste', e => {
    const files = [...(e.clipboardData?.files || [])];
    if (!files.length) return;
    const kind = $('#tab-char').classList.contains('active') ? 'char'
               : $('#tab-prod').classList.contains('active') ? 'prod' : null;
    if (!kind) return;
    e.preventDefault(); addImages(kind, files);
  });
}

const ASK_CHAR =
`You are a character designer building a stylized, fictional animated character that is loosely inspired by the attached artwork. Do not identify, name or recognise any individual — describe only generic design attributes an illustrator would need: silhouette, colours, garment cuts, materials and general age impression.
Write every value in English, lower case, as comma-separated visual detail without a closing full stop. Be exact about colours, cuts and materials. Never invent anything that is not visible; if something cannot be seen, return an empty string for that key.
Return ONLY a JSON object with exactly these keys:
{"name":"a short invented first name for this fictional character, or empty","age":"approximate age range and general appearance in a few words","body":"build, height impression, posture","face":"hair colour, cut and texture, facial hair style, general face shape and eye colour as an illustrator would draw them","outfit":"every garment from top to bottom with exact colour, cut and material, including shoes","acc":"bags, straps, glasses, jewellery, watches, hats with their colours, or empty","marks":"distinctive design features such as tattoos or patterns, or empty"}`;

/* Rückfallebene: Googles Richtlinie blockiert detaillierte Gesichtsbeschreibungen
   von Fotos realer Personen. Dann ohne Gesichtsmerkmale erneut fragen. */
const ASK_CHAR_SAFE =
`You are a costume and character designer. From the attached artwork, describe ONLY the clothing, accessories, colour palette, silhouette and general build. Do not describe the face, facial features, eyes, skin or any characteristic that could identify a person — skip all of that entirely.
Write every value in English, lower case, as comma-separated visual detail without a closing full stop. Be exact about colours, cuts and materials.
Return ONLY a JSON object with exactly these keys:
{"age":"approximate age range and general impression in a few words","body":"build, height impression, posture","outfit":"every garment from top to bottom with exact colour, cut and material, including shoes","acc":"bags, straps, glasses, jewellery, watches, hats with their colours, or empty"}`;

const ASK_PROD =
`You are a product designer preparing a reference sheet. Study the attached image(s) of ONE product and describe precisely and only what you can actually see, for use inside an image-generation prompt.
Write every value in English, lower case, as comma-separated visual detail without a closing full stop. Be exact about colours, materials, finishes and proportions. Never invent anything that is not visible; if something cannot be seen, return an empty string for that key.
Return ONLY a JSON object with exactly these keys:
{"name":"what the product is, in a few words","shape":"form, proportions and approximate size","mat":"materials and surface finish","color":"all colours and where they sit","brand":"visible branding, logo placement, embossing, or empty","feat":"buttons, dials, ports, seams, mechanisms, visible functions","unique":"the design elements that make it recognisable","detail":"the single most interesting feature for a close-up shot"}`;

/* Anbieter-Weiche */
async function askJSON(imgs, instruction){
  if (!apiKey()) throw new Error('Kein API-Key hinterlegt.');
  const p = provider();
  return p === 'claude' ? claudeJSON(imgs, instruction)
       : p === 'openai' ? openaiJSON(imgs, instruction)
                        : geminiJSON(imgs, instruction);
}

/* Anthropic erlaubt den Direktaufruf aus dem Browser nur mit diesem Header */
const claudeHeaders = () => ({
  'Content-Type':'application/json',
  'x-api-key': apiKey('claude'),
  'anthropic-version':'2023-06-01',
  'anthropic-dangerous-direct-browser-access':'true'
});

async function claudeJSON(imgs, instruction){
  const content = imgs.map(d => ({
    type:'image',
    source:{ type:'base64', media_type:'image/jpeg', data: d.split(',')[1] }
  }));
  content.push({ type:'text', text: instruction + '\nAnswer with the raw JSON object only, no explanation and no code fences.' });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST', headers: claudeHeaders(),
    body: JSON.stringify({ model: apiModel(), max_tokens: 1024, messages:[{ role:'user', content }] })
  });
  if (!res.ok){
    let msg = `${res.status}`;
    try { msg = (await res.json()).error?.message || msg; } catch(e){}
    throw new Error(msg);
  }
  const j = await res.json();
  if (j.stop_reason === 'refusal') throw new Error('Anfrage abgelehnt (refusal).');
  const txt = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('').trim();
  if (!txt) throw new Error(`Modell lieferte keinen Text (${j.stop_reason || 'leer'}).`);
  return parseLooseJSON(txt);
}

async function openaiJSON(imgs, instruction){
  const content = [{ type:'text', text: instruction }];
  imgs.forEach(d => content.push({ type:'image_url', image_url:{ url: d, detail:'high' } }));

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + apiKey() },
    body: JSON.stringify({
      model: apiModel(),
      messages:[{ role:'user', content }],
      response_format:{ type:'json_object' }
    })
  });
  if (!res.ok){
    let msg = `${res.status}`;
    try { msg = (await res.json()).error?.message || msg; } catch(e){}
    throw new Error(msg);
  }
  const m = (await res.json()).choices?.[0]?.message;
  if (m?.refusal) throw new Error('Anfrage abgelehnt (refusal): ' + m.refusal);
  const txt = (m?.content || '').trim();
  if (!txt) throw new Error('Modell lieferte keinen Text.');
  return parseLooseJSON(txt);
}

async function geminiJSON(imgs, instruction){
  const key = apiKey();
  if (!key) throw new Error('Kein API-Key hinterlegt.');
  const parts = [{ text: instruction }];
  imgs.forEach(d => parts.push({ inline_data:{ mime_type:'image/jpeg', data: d.split(',')[1] } }));

  const url  = MODEL_URL(apiModel());
  const send = cfg => fetch(url, {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({ contents:[{ parts }], generationConfig: cfg })
  });

  let res = await send({ temperature:.2, responseMimeType:'application/json' });
  /* manche Modelle kennen den JSON-Modus nicht — dann ohne ihn erneut versuchen */
  if (res.status === 400) res = await send({ temperature:.2 });

  if (!res.ok){
    let msg = `${res.status}`;
    try { msg = (await res.json()).error?.message || msg; } catch(e){}
    throw new Error(msg);
  }
  const j    = await res.json();
  const cand = (j.candidates || [])[0];
  /* Denk-Modelle liefern zusätzlich „thought"-Teile — die enthalten kein Ergebnis */
  const txt  = (cand?.content?.parts || [])
                 .filter(p => !p.thought)
                 .map(p => p.text || '').join('').trim();

  if (!txt){
    const why = j.promptFeedback?.blockReason || cand?.finishReason || 'leere Antwort';
    throw new Error(`Modell lieferte keinen Text (${why}). Anderes Modell versuchen.`);
  }
  return parseLooseJSON(txt);
}

/* JSON auch dann lesen, wenn das Modell Codeblöcke oder Fließtext drumherum schreibt */
function parseLooseJSON(t){
  const s = t.replace(/^﻿/, '').replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(s); } catch(e){}
  const m = s.match(/\{[\s\S]*\}/);
  if (m){ try { return JSON.parse(m[0]); } catch(e){} }
  throw new Error('Antwort war kein JSON — Modell schrieb: ' + s.slice(0, 180));
}

const MAP_CHAR = { name:'c_name', age:'c_age', body:'c_body', face:'c_face',
                   outfit:'c_outfit', acc:'c_acc', marks:'c_marks' };
const MAP_PROD = { name:'p_name', shape:'p_shape', mat:'p_mat', color:'p_color',
                   brand:'p_brand', feat:'p_feat', unique:'p_unique', detail:'p_detail' };

async function analyze(kind){
  const btn  = $(kind === 'char' ? '#btnAnalyzeChar' : '#btnAnalyzeProd');
  const info = $(kind === 'char' ? '#charAiInfo' : '#prodAiInfo');
  const imgs = state.imgs[kind];

  if (!imgs.length) return toast('Bitte zuerst ein Bild hochladen.');
  if (!apiKey()){ openModal(); return toast('Bitte zuerst einen API-Key hinterlegen.'); }

  const label = btn.textContent;
  btn.disabled = true; btn.textContent = 'Analysiere …';
  info.textContent = 'Bild wird ausgelesen …';
  let blocked = false;
  try {
    let data;
    try {
      data = await askJSON(imgs, kind === 'char' ? ASK_CHAR : ASK_PROD);
    } catch(e){
      /* Gesichtsbeschreibung blockiert → ohne Gesichtsmerkmale erneut versuchen */
      if (kind !== 'char' || !/PROHIBITED_CONTENT|SAFETY|BLOCKLIST|refus/i.test(e.message)) throw e;
      blocked = true;
      info.textContent = 'Gesichtsbeschreibung blockiert — zweiter Versuch ohne Gesicht …';
      data = await askJSON(imgs, ASK_CHAR_SAFE);
    }
    const map  = kind === 'char' ? MAP_CHAR : MAP_PROD;
    let filled = 0;
    /* erst alle betroffenen Felder leeren, damit nichts Altes stehen bleibt */
    Object.values(map).forEach(id => { const el = $('#' + id); if (el) el.value = ''; });
    Object.entries(map).forEach(([k, id]) => {
      const v = (data[k] || '').toString().trim();
      if (!v) return;
      const el = $('#' + id); if (!el) return;
      el.value = v; filled++;
    });
    render(); save(); renderThumbs(kind);
    if (blocked){
      info.textContent = 'Kleidung und Statur übernommen. Das Gesicht darf Google aus Fotos realer Personen nicht beschreiben — bitte selbst eintragen. Das angehängte Referenzbild trägt die Ähnlichkeit ohnehin.';
      toast(`${filled} Felder gefüllt — Gesicht bitte selbst ergänzen.`);
    } else {
      toast(filled ? `${filled} Felder aus dem Bild gefüllt.` : 'Das Modell hat nichts erkannt.');
    }
  } catch(e){
    const gone  = /no longer available|not found|not supported/i.test(e.message);
    const guard = /PROHIBITED_CONTENT|SAFETY|BLOCKLIST|refus/i.test(e.message);
    info.textContent = 'Fehler: ' + e.message +
      (gone  ? ' → ⚙ Bildanalyse öffnen und „Passendes Modell finden" klicken.' : '') +
      (guard ? ' → Google blockiert das Beschreiben dieser Person. Felder bitte selbst ausfüllen; das Bild bleibt als Referenz angehängt.' : '');
    toast(gone  ? 'Modell nicht verfügbar — bitte neues Modell suchen.'
        : guard ? 'Von Google blockiert — Felder bitte selbst ausfüllen.'
                : 'Analyse fehlgeschlagen: ' + e.message);
    if (gone) openModal();
  } finally {
    btn.disabled = false; btn.textContent = label;
  }
}

/* ---------- Prompt direkt zum Generator schicken ----------
   prefill: Dienst nimmt den Text per ?q= entgegen. Sonst nur Zwischenablage. */
const TARGETS = {
  img: [
    { label:'ChatGPT',  url:'https://chatgpt.com/?q=',        plain:'https://chatgpt.com/',            prefill:true  },
    { label:'Gemini',   url:'https://gemini.google.com/app',  plain:'https://gemini.google.com/app',   prefill:false },
    { label:'Firefly',  url:'https://firefly.adobe.com/generate/images', plain:'https://firefly.adobe.com/generate/images', prefill:false },
    { label:'Whisk',    url:'https://labs.google/fx/tools/whisk', plain:'https://labs.google/fx/tools/whisk', prefill:false }
  ],
  vid: [
    { label:'Sora',     url:'https://sora.chatgpt.com/',      plain:'https://sora.chatgpt.com/',       prefill:false },
    { label:'Veo (Gemini)', url:'https://gemini.google.com/app', plain:'https://gemini.google.com/app', prefill:false },
    { label:'Kling',    url:'https://app.klingai.com/',       plain:'https://app.klingai.com/',        prefill:false },
    { label:'Runway',   url:'https://app.runwayml.com/',      plain:'https://app.runwayml.com/',       prefill:false }
  ]
};

async function sendTo(t, text){
  const enc = encodeURIComponent(text);
  const canPrefill = t.prefill && enc.length < 4000;
  await copyText(text, canPrefill
    ? `${t.label} öffnet sich — Prompt steht im Eingabefeld.`
    : `Prompt kopiert — in ${t.label} einfügen (⌘V).`);
  window.open(canPrefill ? t.url + enc : t.plain, '_blank', 'noopener');
}

function renderOpenRows(){
  $$('.openrow').forEach(row => {
    if (row.dataset.ready) return;
    row.dataset.ready = '1';
    const kind = row.dataset.kind === 'vid' ? 'vid' : 'img';
    const lab = document.createElement('span');
    lab.className = 'openlabel';
    lab.textContent = kind === 'vid' ? 'Video erzeugen in:' : 'Bild erzeugen in:';
    row.appendChild(lab);
    TARGETS[kind].forEach(t => {
      const b = document.createElement('button');
      b.className = 'btn small ghost';
      b.textContent = t.label;
      b.title = 'Prompt kopieren und ' + t.label + ' öffnen';
      b.addEventListener('click', () => sendTo(t, $('#' + row.dataset.out).textContent));
      row.appendChild(b);
    });
    const note = document.createElement('span');
    note.className = 'hint';
    note.textContent = kind === 'vid'
      ? 'Storyboard-Blatt dort anhängen.'
      : 'Referenzbild dort anhängen.';
    row.appendChild(note);
  });
}

/* ---------- Kostenloser Weg: Auftrag in den Chat, Antwort zurück ---------- */
function chatBrief(kind){
  const ask = kind !== 'char' ? ASK_PROD : (chk('askNoFace') ? ASK_CHAR_SAFE : ASK_CHAR);
  return ask +
    `\n\n(Das ${kind === 'char' ? 'Foto der Figur' : 'Produktfoto'} hängt dieser Nachricht an. ` +
    `Bitte antworte ausschließlich mit dem JSON-Objekt, ohne Erklärung und ohne Code-Block.)`;
}

async function copyText(text, msg){
  try { await navigator.clipboard.writeText(text); toast(msg); }
  catch(e){
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove(); toast(msg);
  }
}

function applyPasted(kind){
  const box  = $(kind === 'char' ? '#pasteChar' : '#pasteProd');
  const info = $(kind === 'char' ? '#charAiInfo' : '#prodAiInfo');
  const raw  = box.value.trim();
  if (!raw) return toast('Bitte zuerst die Antwort aus dem Chat einfügen.');

  let data;
  try { data = parseLooseJSON(raw); }
  catch(e){ info.textContent = 'Fehler: ' + e.message; return toast('Das war kein verwertbares JSON.'); }

  const map = kind === 'char' ? MAP_CHAR : MAP_PROD;
  let filled = 0;
  Object.values(map).forEach(id => { const el = $('#' + id); if (el) el.value = ''; });
  Object.entries(map).forEach(([k, id]) => {
    const v = (data[k] || '').toString().trim();
    if (!v) return;
    const el = $('#' + id); if (!el) return;
    el.value = v; filled++;
  });
  render(); save();
  info.textContent = `${filled} Felder aus der Chat-Antwort übernommen.`;
  toast(`${filled} Felder übernommen.`);
  box.value = '';
}

/* Referenz-Passus für den Prompt */
function refLine(kind, what){
  const n = state.imgs[kind].length;
  if (!n) return '';
  return `\n\nREFERENCE IMAGE${n > 1 ? 'S' : ''}: ${n > 1 ? `${n} reference images are` : 'A reference image is'} attached showing this exact ${what}. Copy ${what === 'character' ? 'the face, proportions, hair, wardrobe and colours' : 'the shape, proportions, materials, colours and every design detail'} from ${n > 1 ? 'them' : 'it'} precisely — the written description above only supports what is visible in the reference, and the reference wins wherever the two differ.`;
}

/* ---------- Modell-Erkennung ----------
   Google sperrt ältere Modelle für neue Keys. Deshalb reicht die Modell-Liste
   nicht — jedes Modell wird mit einer Mini-Anfrage tatsächlich getestet. */
const MODEL_URL = m => `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(apiKey())}`;

/* nur Modelle, die Text zurückgeben — Bildgeneratoren, TTS und Embeddings raus */
const SKIP_MODEL = /tts|image|embedding|embed|gemma|aqa|imagen|veo|learnlm|audio|live|robotics|guard/i;

function scoreModel(n){
  /* „-latest" zeigt immer auf eine aktuelle Version und bleibt für neue Keys
     freigeschaltet — deshalb weit vorn, gleich hinter der neuesten Generation. */
  let s = /latest/.test(n)            ? 290
        : /(^|[^\d])3[.-]/.test(n)    ? 300
        : /2\.5/.test(n)              ? 250
        : /2\.0/.test(n)              ? 200 : 150;
  if (/flash/.test(n))       s += 20;   // günstig und schnell bevorzugen
  if (/lite/.test(n))        s -= 8;
  if (/preview|exp/.test(n)) s -= 4;
  return s;
}

/* OpenAI: Bewertung der bildfähigen Modelle */
const SKIP_OAI = /audio|realtime|instruct|embedding|tts|whisper|moderation|davinci|babbage|dall|sora|search|transcribe|codex|guard/i;
function scoreOAI(n){
  let s = /gpt-5/.test(n) ? 300 : /gpt-4\.1/.test(n) ? 260 : /gpt-4o/.test(n) ? 230 : /^o\d/.test(n) ? 150 : 100;
  if (/mini/.test(n))    s += 15;   // günstig reicht für Bildbeschreibung
  if (/nano/.test(n))    s += 5;
  if (/preview|chat/.test(n)) s -= 6;
  if (/\d{4}-\d{2}-\d{2}/.test(n)) s -= 3;   // datierte Fixversionen nachrangig
  return s;
}

/* Claude: neueste Generation zuerst, günstige Modelle innerhalb der Generation bevorzugt */
function scoreClaude(n){
  let s = /(fable|opus|sonnet|haiku)-5/.test(n) ? 300
        : /4[-.]5/.test(n)                      ? 260
        : /-4[^.\d]/.test(n)                    ? 220 : 180;
  if (/sonnet/.test(n)) s += 20;
  if (/haiku/.test(n))  s += 12;
  if (/opus/.test(n))   s += 6;
  if (/\d{8}/.test(n))  s -= 3;   // datierte Fixversionen nachrangig
  return s;
}

async function listModels(){
  if (provider() === 'claude'){
    const res = await fetch('https://api.anthropic.com/v1/models?limit=100', { headers: claudeHeaders() });
    if (!res.ok){
      let msg = `${res.status}`;
      try { msg = (await res.json()).error?.message || msg; } catch(e){}
      throw new Error(msg);
    }
    return ((await res.json()).data || [])
      .map(m => m.id)
      .filter(n => /^claude/.test(n))
      .sort((a, b) => scoreClaude(b) - scoreClaude(a));
  }

  if (provider() === 'openai'){
    const res = await fetch('https://api.openai.com/v1/models', {
      headers:{ 'Authorization':'Bearer ' + apiKey() }
    });
    if (!res.ok){
      let msg = `${res.status}`;
      try { msg = (await res.json()).error?.message || msg; } catch(e){}
      throw new Error(msg);
    }
    return ((await res.json()).data || [])
      .map(m => m.id)
      .filter(n => /^(gpt-|o\d)/.test(n) && !SKIP_OAI.test(n))
      .sort((a, b) => scoreOAI(b) - scoreOAI(a));
  }

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey())}`);
  if (!res.ok){
    let msg = `${res.status}`;
    try { msg = (await res.json()).error?.message || msg; } catch(e){}
    throw new Error(msg);
  }
  return ((await res.json()).models || [])
    .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map(m => m.name.replace(/^models\//, ''))
    .filter(n => !SKIP_MODEL.test(n))
    .sort((a, b) => scoreModel(b) - scoreModel(a));
}

async function probeModel(name){
  try {
    if (provider() === 'claude'){
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers: claudeHeaders(),
        body: JSON.stringify({ model:name, max_tokens:1, messages:[{ role:'user', content:'ok' }] })
      });
      return res.status;
    }
    if (provider() === 'openai'){
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + apiKey() },
        body: JSON.stringify({ model:name, messages:[{ role:'user', content:'ok' }] })
      });
      return res.status;
    }
    const res = await fetch(MODEL_URL(name), {
      method:'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ contents:[{ parts:[{ text:'ok' }] }],
                             generationConfig:{ maxOutputTokens: 8 } })
    });
    return res.status;
  } catch(e){ return 0; }
}

async function findModel(){
  const btn  = $('#btnFindModel');
  const info = $('#modelInfo');
  if (!apiKey()){ $('#apiKey').focus(); return toast('Bitte zuerst den Key eintragen und speichern.'); }

  btn.disabled = true;
  const label = btn.textContent; btn.textContent = 'Suche …';
  try {
    const names = (await listModels()).slice(0, 14);
    if (!names.length) throw new Error('Kein Textmodell in der Liste deines Keys.');

    const working = [];
    for (let i = 0; i < names.length; i++){
      info.textContent = `Teste ${i + 1}/${names.length}: ${names[i]} …`;
      const st = await probeModel(names[i]);
      if (st === 200) working.push(names[i]);
      if (working.length >= 4) break;          // vier Treffer reichen als Auswahl
    }
    if (!working.length) throw new Error('Kein Modell hat geantwortet — Kontingent erschöpft oder Key gesperrt.');

    $('#modellist').innerHTML = working.map(n => `<option>${esc(n)}</option>`).join('');
    $('#apiModel').value = working[0];
    localStorage.setItem(`sbstudio.model.${provider()}`, working[0]);
    info.textContent = `Funktioniert: ${working.join(', ')}`;
    renderThumbs('char'); renderThumbs('prod');
    toast(`Modell gesetzt: ${working[0]}`);
  } catch(e){
    info.textContent = 'Fehler: ' + e.message;
    toast('Fehlgeschlagen: ' + e.message);
  } finally {
    btn.disabled = false; btn.textContent = label;
  }
}

/* ---------- Einstellungen ---------- */
function syncProviderUI(){
  const p = provider(), cfg = PROVIDERS[p];
  $('#apiProvider').value  = p;
  $('#keyLabel').textContent = cfg.keyLabel;
  $('#apiKey').placeholder   = cfg.ph;
  $('#apiKey').value         = apiKey(p);
  $('#apiModel').placeholder = cfg.model;
  $('#apiModel').value       = apiModel(p);
  $('#provHint').textContent = cfg.hint;
  $('#modelInfo').textContent = apiKey(p) ? '' : 'Zuerst Key eintragen und speichern.';
  $('#modellist').innerHTML = '';
}

function openModal(){
  syncProviderUI();
  $('#modal').hidden = false;
  setTimeout(() => $('#apiKey').focus(), 30);
}
function closeModal(){ $('#modal').hidden = true; }

/* ============================================================
   1 — Charakter-Sheet
   ============================================================ */
function buildCharacter(){
  const st    = styleInfo('c_style', STYLE_ART);
  const style = st.full;
  const bg    = val('c_bg') || 'plain neutral grey studio background';
  const name  = clean(val('c_name'));

  const bits = [];
  if (val('c_age'))    bits.push(clean(val('c_age')));
  if (val('c_body'))   bits.push(clean(val('c_body')));
  if (val('c_face'))   bits.push(clean(val('c_face')));
  if (val('c_outfit')) bits.push('wearing ' + clean(val('c_outfit')));
  if (val('c_acc'))    bits.push('accessories: ' + clean(val('c_acc')));
  if (val('c_marks'))  bits.push('distinctive details: ' + clean(val('c_marks')));

  const desc = bits.length
    ? bits.join('; ') + '.'
    : '[Figur beschreiben: Alter, Körperbau, Gesicht, Haare, Kleidung, Accessoires]';

  return (
`Create a professional character reference sheet of one and the same character seen from multiple angles, built for consistent AI image generation.

CHARACTER${name ? ` — ${name.toUpperCase()}` : ''}: ${desc}${refLine('char', 'character')}

LAYOUT: display this identical character in four views on a ${bg}, arranged in one clean symmetrical row-based layout with equal spacing between the views:
1. FULL BODY FRONT — slight three-quarter front view, the entire body visible from head to toe, relaxed neutral standing pose.
2. FULL BODY BACK — straight rear view, full body visible head to toe, showing the back of the hair, clothing and any accessories.
3. FRONT PORTRAIT — detailed head-and-shoulders front view showing facial features, skin and hair texture and the upper clothing.
4. SIDE PORTRAIT — head-and-shoulders left profile at a true 90 degree side view, including neck and upper shoulders.

STYLE & CONSISTENCY: keep the same face, skull shape, body proportions, hairstyle, outfit, colours and accessories in all four views; preserve every costume detail and the character's identity from every angle; clean balanced studio lighting with soft shadows and realistic material textures; sharp, high-detail presentation suitable as a production character design reference.

ART STYLE: ${style}. Maintain this exact style across all four views without drifting.

REQUIREMENTS: ${bg} only — no text, labels, numbers, logos, watermarks, props, furniture, shadows on walls or extra characters; symmetrical organised layout with even spacing; every view fully inside the frame with nothing cropped.${val('c_extra') ? '\n\nADDITIONAL: ' + sent(val('c_extra')) : ''}

NEGATIVE: no text or lettering of any kind, no watermark, no signature, no cropped limbs, no changing hairstyle or wardrobe between views, no distorted or extra hands and fingers, no additional people, no background props, no colour shift between the views.`
  );
}

/* ============================================================
   2 — Produkt-Sheet
   ============================================================ */
function buildProduct(){
  const style = styleInfo('p_style', STYLE_PROD).full;
  const bg    = val('p_bg') || 'plain neutral grey background';
  const light = clean(val('p_light')) || 'clean studio lighting with soft shadows and balanced highlights';

  const bits = [];
  if (val('p_name'))   bits.push(clean(val('p_name')));
  if (val('p_shape'))  bits.push(clean(val('p_shape')));
  if (val('p_mat'))    bits.push('made of ' + clean(val('p_mat')));
  if (val('p_color'))  bits.push('colours: ' + clean(val('p_color')));
  if (val('p_feat'))   bits.push('features: ' + clean(val('p_feat')));
  if (val('p_brand'))  bits.push('branding: ' + clean(val('p_brand')));
  if (val('p_unique')) bits.push('unique design elements: ' + clean(val('p_unique')));

  const desc   = bits.length ? bits.join('; ') + '.' : '[Produkt beschreiben: Form, Material, Farben, Features, Branding]';
  const detail = clean(val('p_detail')) || 'the most important feature, texture or mechanism of the product';

  return (
`Create a professional product reference sheet showing one and the same product from multiple angles, built for consistent AI image generation.

PRODUCT: ${desc}${refLine('prod', 'product')}

LAYOUT: display this identical product in four clean studio views on a ${bg}, in a symmetrical layout with even spacing between each view:
1. FRONT VIEW — straight-on, highlighting the main design and the key features.
2. REAR VIEW — direct back view showing the reverse side and its details.
3. SIDE VIEW — true 90 degree side angle showing thickness and profile.
4. CLOSE-UP DETAIL — a tight, high-detail close-up of ${detail}.

STYLE & CONSISTENCY: keep the design, proportions, colours, materials, surface finish and every detail identical across all four views; render realistic textures and accurate reflections true to the material; ${light}; sharp, high-quality detail suitable as a professional design reference.

VISUAL STYLE: ${style}. Maintain this exact look across all four views.

REQUIREMENTS: ${bg} only — no text, labels, watermarks, hands, models, props, packaging, price tags or extra objects; clean symmetrical layout with even spacing; the whole product inside the frame in each view, nothing cropped.${val('p_extra') ? '\n\nADDITIONAL: ' + sent(val('p_extra')) : ''}

NEGATIVE: no lettering or invented brand text, no watermark, no signature, no hands or human parts, no packaging or background props, no changing colour, proportion or material between the views, no blown-out highlights, no clutter.`
  );
}

/* ============================================================
   3 — Storyboard
   ============================================================ */
function scaffold(){
  const n   = Math.max(2, Math.min(40, parseInt(val('s_count')) || 15));
  const dur = Math.max(1, parseFloat(val('s_dur')) || 15);
  const per = dur / n;
  const old = state.panels;
  const out = [];
  let prev = '';

  for (let i = 0; i < n; i++){
    const beat = beatFor(i, n);
    const pool = SHOTS[beat.key];
    let shot = pool[i % pool.length];
    if (shot === prev) shot = pool[(i + 1) % pool.length];
    prev = shot;

    const keep = old[i] || {};
    out.push({
      beat: beat.key,
      time: timecode(i * per),
      shot: keep.shot || shot,
      desc: keep.desc || '',
      note: keep.note || '',
      dlg:  keep.dlg  || ''
    });
  }
  state.panels = out;
  renderPanels();
  save();
}

function renderPanels(){
  const list = $('#panelList');
  list.innerHTML = '';

  state.panels.forEach((p, i) => {
    const beat = BEATS.find(b => b.key === p.beat) || BEATS[0];
    const el = document.createElement('div');
    el.className = 'panelcard';
    el.innerHTML = `
      <div class="pchead">
        <span class="pcnum">${i + 1}</span>
        <span class="pctime">[${p.time}]</span>
        <span class="pcbeat">${beat.de}</span>
        <span class="pcactions">
          <button data-act="up"   title="nach oben">↑</button>
          <button data-act="down" title="nach unten">↓</button>
          <button data-act="dup"  title="duplizieren">⧉</button>
          <button data-act="del" class="del" title="löschen">✕</button>
        </span>
      </div>
      <div class="pcgrid">
        <div class="field"><label>Shot-Typ</label>
          <input type="text" data-f="shot" list="shotlist" value="${esc(p.shot)}"></div>
        <div class="field"><label>Notes</label>
          <input type="text" data-f="note" value="${esc(p.note)}" placeholder="Stimmung, Sound, Timing"></div>
        <div class="field full"><label>Beschreibung <em>(was passiert, welcher Ausdruck)</em></label>
          <textarea data-f="desc" rows="2" placeholder="${esc(BEAT_HINT[p.beat])}">${esc(p.desc)}</textarea></div>
        ${chk('o_dlg') ? `<div class="field full"><label>Dialog</label>
          <input type="text" data-f="dlg" value="${esc(p.dlg)}" placeholder='Figur: "…"'></div>` : ''}
      </div>`;

    el.querySelectorAll('[data-f]').forEach(inp => {
      inp.addEventListener('input', () => { state.panels[i][inp.dataset.f] = inp.value; save(); render(); });
    });
    el.querySelectorAll('[data-act]').forEach(b => {
      b.addEventListener('click', () => panelAction(b.dataset.act, i));
    });
    list.appendChild(el);
  });

  const empty = state.panels.filter(p => !p.desc.trim()).length;
  $('#panelHint').innerHTML = state.panels.length === 0
    ? '„Gerüst erzeugen" legt Panels mit Story-Beats, Shot-Typen und Timecodes an. Beschreibungen ergänzt du selbst — oder du lässt sie über den KI-Auftrag schreiben.'
    : `${state.panels.length} Panels` + (empty
        ? ` — <span class="warn">${empty} ohne Beschreibung</span> (werden im Prompt automatisch mit dem Story-Beat aufgefüllt).`
        : ' — alle beschrieben.');
}

function esc(s){
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function panelAction(act, i){
  const p = state.panels;
  if (act === 'up'   && i > 0)              [p[i-1], p[i]] = [p[i], p[i-1]];
  if (act === 'down' && i < p.length - 1)   [p[i+1], p[i]] = [p[i], p[i+1]];
  if (act === 'dup')                        p.splice(i + 1, 0, { ...p[i] });
  if (act === 'del')                        p.splice(i, 1);
  retime(); renderPanels(); save(); render();
}

function retime(){
  const dur = Math.max(1, parseFloat(val('s_dur')) || 15);
  const per = dur / Math.max(1, state.panels.length);
  state.panels.forEach((p, i) => { p.time = timecode(i * per); });
  $('#s_count').value = state.panels.length;
}

function addPanel(){
  const i = state.panels.length;
  const beat = beatFor(i, i + 1);
  state.panels.push({ beat: beat.key, time:'0:00', shot: SHOTS[beat.key][0], desc:'', note:'', dlg:'' });
  retime(); renderPanels(); save(); render();
}

function panelDesc(p){
  const d = soft(p.desc);
  if (d) return d;
  const beat = BEATS.find(b => b.key === p.beat) || BEATS[0];
  return `${beat.en} — ${BEAT_HINT[p.beat]}.`;
}

/* Panels in bis zu 3 möglichst gleich große Blätter aufteilen */
function boards(){
  const parts = Math.max(1, Math.min(3, parseInt(val('s_split')) || 1));
  const all = state.panels, out = [];
  let idx = 0, rest = all.length;
  for (let i = 0; i < parts; i++){
    const size = Math.ceil(rest / (parts - i));
    if (size > 0) out.push({ start: idx, panels: all.slice(idx, idx + size) });
    idx += size; rest -= size;
  }
  return out;
}

function buildStoryboard(){
  if (!state.panels.length) return 'Noch keine Panels. Klicke links auf „Gerüst erzeugen".';
  const bs  = boards();
  const sel = state.storyBoard;
  const list = (sel === 'all' || !bs[sel - 1]) ? bs : [bs[sel - 1]];
  $('#s_grid').value = bs.map(b => gridFor(b.panels.length).join(' × ')).join('  |  ');
  return list.map(b => buildBoard(b, bs.indexOf(b) + 1, bs.length))
             .join('\n\n' + '═'.repeat(64) + '\n\n');
}

function buildBoard(board, boardNo, boardCount){
  const n     = board.panels.length;
  const first = board.start + 1, last = board.start + n;

  const [rows, cols] = gridFor(n);

  const title  = clean(val('s_title')) || 'UNTITLED';
  const st     = styleInfo('s_style', STYLE_ART);
  const style  = st.label;
  const tone   = clean(val('s_tone'))  || 'warm and cinematic';
  const ratio  = val('s_ratio') || '16:9';
  const dur    = val('s_dur') || '15';
  const light  = clean(val('s_light'));
  const setting= clean(val('s_setting'));
  const chars  = clean(val('s_chars'));
  const story  = clean(val('s_story'));
  const times  = board.panels.map(p => `[${p.time}]`).join(' ');
  const span   = `${board.panels[0].time}–${board.panels[n - 1].time}`;
  const part   = boardCount > 1 ? ` (part ${boardNo} of ${boardCount})` : '';

  const wantCap  = chk('o_cap');
  const wantNum  = chk('o_num');
  const wantTime = chk('o_time');
  const wantNote = chk('o_notes');
  const wantFoot = chk('o_foot');
  const wantDlg  = chk('o_dlg');

  /* — Kopf — */
  let out = '';
  if (boardCount > 1)
    out += `⟦ BLATT ${boardNo} VON ${boardCount} — Panels ${first}–${last}, Zeitfenster ${span} ⟧\n\n`;
  out += `Render a professional ${style} storyboard sheet${part} covering seconds ${span} of a ${dur}-second sequence. CRITICAL: every label, ${wantNum ? 'frame number, ' : ''}${wantTime ? 'timecode, ' : ''}shot-type heading${wantCap ? ', scene description' : ''}${wantNote ? ' and production note' : ''} listed below MUST be rendered as real, sharp, correctly spelled printed text on the sheet — this is a typed production document, not a bare image grid. Only the ${n} picture panels are pure artwork; all typography lives outside them${wantCap ? ' in the caption strips' : ''}${wantNum || wantTime ? ', in the corner badges' : ''}${wantFoot ? ' and in the footer bar' : ''}.\n\n`;

  /* — Sheet-Layout — */
  out += `SHEET LAYOUT: a clean off-white production page with soft rounded corners and a thin outer border, holding ${n} cinematic ${ratio} panels in a precise ${rows}-row × ${cols}-column grid with even gutters, read left to right and top to bottom.`;
  if (wantNum)  out += ` Each panel carries a small solid black square badge in its top-left corner with the white frame number, numbered ${first} to ${last}${boardCount > 1 ? ' — the numbering continues the previous sheet and must start at ' + first + ', not at 1' : ''}.`;
  if (wantTime) out += ` Each panel carries a small dark timecode tag in its top-right corner, reading in order ${times}.`;
  if (wantCap){
    out += ` Directly beneath every panel sits a white caption strip`;
    out += wantNote
      ? ` divided by a vertical hairline: the wide left column prints the SHOT TYPE in small bold uppercase letter-spaced sans-serif above ${wantDlg ? 'one to two short lines' : 'two short lines'} of italic scene description; the narrow right column is headed ${wantDlg ? 'NOTES / DIALOGUE:' : 'NOTES:'} in small bold uppercase above one short italic line.`
      : ` printing the SHOT TYPE in small bold uppercase letter-spaced sans-serif above two short lines of italic scene description.`;
  }
  if (wantFoot){
    const foot = [
      `PROJECT: ${title.toUpperCase()}`,
      `FORMAT: ${ratio}`,
      `STYLE: ${style.toUpperCase()}`,
      `TONE: ${tone.toUpperCase()}`,
      boardCount > 1    ? `SHEET: ${boardNo} OF ${boardCount}` : null,
      val('s_director') ? `DIRECTOR: ${clean(val('s_director')).toUpperCase()}` : null,
      val('s_date')     ? `DATE: ${clean(val('s_date')).toUpperCase()}` : null
    ].filter(Boolean).join('    ');
    out += ` A thin horizontal footer bar spans the bottom of the whole sheet in small letter-spaced uppercase sans-serif, printing: ${foot}.`;
  }
  out += ` All lettering is small, crisp, dark grey on white, perfectly legible and correctly spelled. No text, captions or speech balloons ever appear inside the rendered panel artwork itself.\n\n`;

  /* — Stil — */
  out += `PANEL ART STYLE — ${st.full}. Every panel is a fully rendered, feature-quality ${style} frame, never a sketch — appealing composition, cinematic depth of field, high detail and clear character acting`;
  if (light)   out += `, lit as ${light}`;
  if (setting) out += `, set in ${setting}`;
  out += `. Identical colour grade, lighting direction and art style across all ${n} frames. Overall tone: ${tone}.\n\n`;

  /* — Charaktere — */
  if (chars) out += `CHARACTER LOCK — identical in every single panel: ${chars.replace(/\s*\n\s*/g, ' ')}\n\n`;
  if (story) out += `STORY: ${sent(story)}\n\n`;

  /* — Panels — */
  board.panels.forEach((p, i) => {
    const no = board.start + i + 1;
    const head = [];
    if (wantNum)  head.push(`PANEL ${no}`);
    if (wantTime) head.push(`[${p.time}]`);
    const shot = clean(p.shot).toUpperCase() || 'MEDIUM SHOT';
    out += `${head.join(' ') || `PANEL ${no}`} — ${shot} — ${panelDesc(p)}`;
    if (wantCap){
      out += ` PRINT UNDER THIS PANEL — heading: ${shot} — description: "${caption(panelDesc(p))}"`;
      if (wantNote){
        const note = soft(p.note) || (BEATS.find(b => b.key === p.beat) || {}).en || 'Beat';
        out += ` — ${wantDlg ? 'NOTES / DIALOGUE' : 'NOTES'}: "${note}${wantDlg && soft(p.dlg) ? ' — ' + soft(p.dlg) : ''}"`;
      }
    }
    out += `\n\n`;
  });

  /* — Konsistenz & Negativ — */
  out += `CONSISTENCY: keep every character's face, proportions, hairstyle, wardrobe and colours pixel-consistent across all ${n} frames${boardCount > 1 ? ' and identical to the other sheets of this sequence — same character design, same colour grade, same rendering style, so the sheets read as one continuous storyboard' : ''}, keep the same location, lighting direction and colour grade throughout, and vary camera angle and shot size in every panel so that no two consecutive frames share a composition. Masterpiece quality, sharp compositions, high detail, rich environmental storytelling, production-ready layout, clean accurate typography.`;
  if (val('s_special')) out += `\n\nSPECIAL REQUESTS: ${sent(val('s_special'))}`;
  out += `\n\nNEGATIVE: no missing ${wantCap ? 'caption strips, no empty note boxes, ' : ''}panels, no garbled, misspelled or invented lettering, no speech balloons or subtitles inside the artwork, no watermark or signature, no extra characters, no wardrobe or colour changes between panels, no distorted hands or duplicated limbs, no blurry or low-detail frames, no style drift between panels.`;

  return out;
}

/* — KI-Auftrag: lässt ein Sprachmodell die Panel-Texte schreiben — */
function buildBrief(){
  const n = Math.max(2, parseInt(val('s_count')) || 15);
  const [rows, cols] = gridFor(n);
  return (
`You are an expert Hollywood storyboard artist, film director and AI prompt engineer.

Write the ${n} panel descriptions for the storyboard below, then output ONE single continuous image prompt for ${val('s_model') || 'GPT Image 2'} that renders the complete storyboard sheet.

PROJECT: ${clean(val('s_title')) || '(untitled)'}
STORY IDEA: ${clean(val('s_story')) || '(describe the story)'}
CHARACTERS: ${clean(val('s_chars')) || '(no reference given — invent them and keep them identical in every panel)'}
SETTING: ${clean(val('s_setting')) || '(choose a fitting location)'}
VISUAL STYLE: ${styleInfo('s_style', STYLE_ART).full}
TONE: ${clean(val('s_tone')) || 'warm and cinematic'}
LIGHTING / COLOUR: ${clean(val('s_light')) || '(choose a fitting cinematic lighting scheme)'}
FORMAT: ${n} panels, ${val('s_dur') || 15} seconds, ${rows}×${cols} grid, ${val('s_ratio') || '16:9'} panels
SPECIAL REQUESTS: ${clean(val('s_special')) || 'none'}

Build a complete narrative arc across the panels: introduction, inciting event, rising action, emotional moment, climax and ending. For every panel give: panel number, time position, camera angle and shot size, main action, character expressions, key environment details and the emotional focus. Mix shot types naturally — wide, medium, close-up, low angle, high angle, over-the-shoulder, dynamic action — and never repeat the same composition in two consecutive panels.

The final image prompt must describe a professional storyboard sheet on a neutral presentation background with numbered frames, timecode indicators, a printed shot-type heading and a two-line scene description under every panel, a short production note per panel, and a footer bar with project, format, style, tone, director and date. All that lettering must be rendered as real, correctly spelled text on the sheet; no text, subtitles or speech balloons inside the panel artwork.

Output the finished image prompt as one continuous block, ready to copy and paste. Do not explain your reasoning and do not summarise the story. At the very end, briefly list any assumptions you made about style or missing details.`
  );
}

/* ============================================================
   4 — Animationsfilm
   ============================================================ */
function buildAnimation(){
  const n = state.panels.length;
  if (!n) return 'Noch keine Panels im Storyboard-Tab. Erst dort ein Gerüst erzeugen.';

  const stA    = styleInfo('s_style', STYLE_ART);
  const style  = stA.label;
  const tone   = clean(val('s_tone'))  || 'warm and cinematic';
  const ratio  = val('s_ratio') || '16:9';
  const model  = val('a_model') || 'Sora 2';
  const shotLen= parseFloat(val('a_shotlen')) || 1;
  const total  = (n * shotLen).toFixed(shotLen % 1 ? 1 : 0);
  const cam    = clean(val('a_cam')) || 'smooth cinematic camera movement, motivated moves only';
  const light  = clean(val('s_light'));
  const setting= clean(val('s_setting'));
  const chars  = clean(val('s_chars'));
  const audio  = clean(val('a_audio'));

  const rules = [];
  if (chk('a_ref'))      rules.push('Follow the attached storyboard sheet shot for shot; it is the visual reference for framing, character design and colour');
  rules.push(`preserve absolute character consistency — face, proportions, hairstyle, wardrobe and colours never change between shots`);
  rules.push(`hold one single visual style (${style}) and one colour grade across the whole film`);
  rules.push(cam + ', no jitter, no random zooms, no whip transitions unless described');
  if (chk('a_loop'))     rules.push('each shot ends in a position the next shot can continue from, so the cuts read as one continuous sequence');
  if (chk('a_notext'))   rules.push('absolutely no text, titles, subtitles, captions, watermarks, logos or UI of any kind in the image');

  const sound = [];
  if (chk('a_diegetic')) sound.push('diegetic sound only — natural ambience, environmental foley and subject-driven sound, recorded as if on location');
  if (audio)             sound.push(audio);
  if (chk('a_nomusic'))  sound.push('no music, no score, no sound design flourishes, no voice-over, no narration');

  /* Blätter = Segmente des Films */
  const bs   = boards();
  const sel  = state.animBoard;
  const list = (sel === 'all' || !bs[sel - 1]) ? bs : [bs[sel - 1]];
  const num  = v => v.toFixed(shotLen % 1 ? 1 : 0);

  /* — Modus: Einzel-Shots — */
  if (state.animMode === 'shots'){
    let head = `SERIES SETUP (repeat in every shot prompt) — ${style}, ${ratio}, ${tone}. `;
    if (setting) head += `Location: ${setting}. `;
    if (light)   head += `Lighting: ${light}. `;
    if (chars)   head += `\nCHARACTER LOCK: ${chars.replace(/\s*\n\s*/g, ' ')}\n`;
    head += `\nAudio: ${sound.join('; ')}.\n\n${'—'.repeat(48)}\n\n`;

    return head + list.map(b => {
      const title = bs.length > 1
        ? `⟦ SEGMENT ${bs.indexOf(b) + 1} VON ${bs.length} — Shots ${b.start + 1}–${b.start + b.panels.length}, ${num(b.start * shotLen)}s–${num((b.start + b.panels.length) * shotLen)}s ⟧\n\n`
        : '';
      return title + b.panels.map((p, i) =>
        `SHOT ${b.start + i + 1} / ${n}  ·  ${shotLen}s  ·  ${clean(p.shot).toUpperCase()}\n` +
        `${panelDesc(p)} Camera: ${camMove(p.shot)}. ${light ? light + '. ' : ''}${style}, ${ratio}. ` +
        `${soft(p.note) ? 'Mood: ' + soft(p.note) + '. ' : ''}` +
        `Audio: ${chk('a_diegetic') ? 'diegetic only — ' : ''}${audio || 'natural ambience and foley matching the action'}.` +
        `${chk('a_notext') ? ' No text, no subtitles, no logos.' : ''}`
      ).join('\n\n');
    }).join('\n\n' + '═'.repeat(64) + '\n\n');
  }

  /* — Modus: ganzer Film, je Segment ein Prompt — */
  return list.map(b => {
    const no    = bs.indexOf(b) + 1;
    const cnt   = b.panels.length;
    const secs  = num(cnt * shotLen);
    const from  = num(b.start * shotLen), to = num((b.start + cnt) * shotLen);
    const multi = bs.length > 1;

    let out = '';
    if (multi) out += `⟦ SEGMENT ${no} VON ${bs.length} — Shots ${b.start + 1}–${b.start + cnt}, ${from}s–${to}s des Gesamtfilms ⟧\n\n`;
    out += `Turn the reference storyboard into a ${secs}-second ${style} animated ${multi ? `segment — part ${no} of ${bs.length} of a ${total}-second film` : 'film'} in ${ratio}, told in ${cnt} shots of about ${shotLen} second${shotLen === 1 ? '' : 's'} each. Target model: ${model}.\n\n`;
    if (clean(val('s_story'))) out += `STORY${multi ? ' (whole film, for context)' : ''}: ${sent(val('s_story'))}\n\n`;
    if (multi){
      const opens = no === 1
        ? 'It opens the film'
        : `It must pick up exactly where segment ${no - 1} ended, with the same character positions, wardrobe state and lighting`;
      const ends = no === bs.length
        ? 'and it closes the film on the final shot'
        : `and it must end in a state that segment ${no + 1} can continue from without a visible jump`;
      out += `THIS SEGMENT covers seconds ${from}–${to} of the film. ${opens} ${ends}. Character design, colour grade, lighting and rendering style are identical in every segment.\n\n`;
    }
    if (chars) out += `CHARACTER LOCK — identical in every shot: ${chars.replace(/\s*\n\s*/g, ' ')}\n\n`;
    out += `LOOK: ${stA.full}. ${tone}${setting ? `, set in ${setting}` : ''}${light ? `, lit as ${light}` : ''}. Cinematic depth of field, natural physics-driven motion, expressive character acting, smooth interpolation between poses, consistent scale and continuity of props and wardrobe.\n\n`;

    out += `SHOT LIST\n`;
    b.panels.forEach((p, i) => {
      const start = num((b.start + i) * shotLen), end = num((b.start + i + 1) * shotLen);
      out += `${String(b.start + i + 1).padStart(2, '0')}. ${start}s–${end}s — ${clean(p.shot).toUpperCase()} — ${panelDesc(p)} Camera: ${camMove(p.shot)}.` +
             `${soft(p.note) ? ` (${soft(p.note)})` : ''}\n`;
    });

    out += `\nDIRECTION: ${rules.join('; ')}.\n\n`;
    out += `AUDIO: ${sound.join('; ')}.\n\n`;
    if (val('a_extra')) out += `ADDITIONAL: ${sent(val('a_extra'))}\n\n`;
    out += `NEGATIVE: no on-screen text, subtitles, captions, watermarks or logos; no morphing faces or shifting character design; no style or colour drift between shots${multi ? ' or between segments' : ''}; no extra characters appearing; no warped hands or limbs; no flicker, no stuttering frames; no music or narration; no camera moves that were not described.`;
    return out;
  }).join('\n\n' + '═'.repeat(64) + '\n\n');
}

/* ============================================================
   Bibliothek
   ============================================================ */
function charBlock(){
  const bits = [];
  if (val('c_age'))    bits.push(clean(val('c_age')));
  if (val('c_body'))   bits.push(clean(val('c_body')));
  if (val('c_face'))   bits.push(clean(val('c_face')));
  if (val('c_outfit')) bits.push('wearing ' + clean(val('c_outfit')));
  if (val('c_acc'))    bits.push('accessories: ' + clean(val('c_acc')));
  if (val('c_marks'))  bits.push(clean(val('c_marks')));
  return bits.join('; ') + '.';
}

function saveChar(){
  const name = clean(val('c_name'));
  if (!name)        return toast('Bitte zuerst einen Namen eingeben.');
  if (!val('c_face') && !val('c_outfit')) return toast('Bitte Gesicht oder Kleidung ausfüllen.');

  const entry = {
    name,
    text: `${name.toUpperCase()} — ${charBlock()}`,
    fields: Object.fromEntries(FIELDS.filter(f => f.startsWith('c_')).map(f => [f, val(f)]))
  };
  const i = state.library.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
  if (i >= 0) state.library[i] = entry; else state.library.push(entry);
  renderLibrary(); save();
  toast(`„${name}" gespeichert.`);
}

function renderLibrary(){
  const box = $('#charLib');
  box.innerHTML = '';
  state.library.forEach((c, i) => {
    const chip = document.createElement('span');
    chip.className = 'libchip';
    chip.innerHTML = `<span class="load" role="button" tabindex="0">${esc(c.name)}</span><button title="löschen">✕</button>`;
    chip.querySelector('.load').addEventListener('click', () => {
      Object.entries(c.fields || {}).forEach(([k, v]) => { const el = $('#' + k); if (el) el.value = v; });
      render(); save(); toast(`„${c.name}" geladen.`);
    });
    chip.querySelector('button').addEventListener('click', () => {
      state.library.splice(i, 1); renderLibrary(); save();
    });
    box.appendChild(chip);
  });
  $('#libInfo').textContent = state.library.length
    ? `${state.library.length} Figur${state.library.length === 1 ? '' : 'en'} in der Bibliothek`
    : 'Noch keine Figuren gespeichert.';

  const sel = $('#s_libSelect');
  const cur = sel.value;
  sel.innerHTML = '<option value="">— Aus Charakter-Bibliothek —</option>' +
    state.library.map((c, i) => `<option value="${i}">${esc(c.name)}</option>`).join('');
  sel.value = cur;
}

function insertChar(){
  const i = $('#s_libSelect').value;
  if (i === '') return toast('Bitte eine Figur auswählen.');
  const c = state.library[+i];
  const ta = $('#s_chars');
  ta.value = (ta.value.trim() ? ta.value.trim() + '\n\n' : '') + c.text;
  render(); save(); toast(`„${c.name}" eingefügt.`);
}

/* ============================================================
   Rendern, Speichern, Laden
   ============================================================ */
/* Umschalter „Alle / Blatt 1 / 2 / 3" über der Ausgabe */
function renderBoardBtns(){
  const bs = state.panels.length ? boards() : [];
  [['#storyBoards','storyBoard','Blatt'], ['#animBoards','animBoard','Segment']].forEach(([id, key, word]) => {
    const box = $(id);
    box.innerHTML = '';
    if (bs.length < 2){ state[key] = 'all'; return; }
    if (state[key] !== 'all' && !bs[state[key] - 1]) state[key] = 'all';
    const mk = (label, v, title) => {
      const b = document.createElement('button');
      b.className = 'segbtn' + (state[key] === v ? ' active' : '');
      b.textContent = label; b.title = title || '';
      b.addEventListener('click', () => { state[key] = v; renderBoardBtns(); render(); save(); });
      box.appendChild(b);
    };
    mk('Alle', 'all', 'Alle Blätter untereinander');
    bs.forEach((b, i) => mk(`${word} ${i + 1}`, i + 1,
      `Panels ${b.start + 1}–${b.start + b.panels.length} (${b.panels[0].time}–${b.panels[b.panels.length - 1].time})`));
  });

  const hint = $('#splitHint');
  if (hint) hint.textContent = bs.length < 2
    ? 'Ein einziges Blatt mit allen Panels.'
    : `${bs.length} Blätter à ${bs.map(b => b.panels.length).join(' + ')} Panels — jedes Blatt wird einzeln generiert und im Video-Tab zu einem eigenen Segment.`;
}

function render(){
  renderBoardBtns(); renderOpenRows();
  $('#out-char').textContent = buildCharacter();
  $('#out-prod').textContent = buildProduct();
  $('#out-story').textContent = state.storyMode === 'brief' ? buildBrief() : buildStoryboard();
  $('#out-anim').textContent  = buildAnimation();
  $('#segNote').textContent = state.storyMode === 'brief'
    ? 'Diesen Auftrag in Claude oder ChatGPT einfügen — das Modell schreibt die Panels und liefert den fertigen Bild-Prompt zurück.'
    : 'Fertiger Prompt für das Bildmodell. Charakter-Referenzblatt beim Generieren mit anhängen.';
  $('#animInfo').textContent = state.panels.length
    ? `${state.panels.length} Shots aus dem Storyboard übernommen.`
    : 'Noch keine Panels im Storyboard-Tab.';
}

function collect(){
  state.app = { version: APP_VERSION, saved: new Date().toISOString().slice(0, 10) };
  state.fields = Object.fromEntries(FIELDS.map(f => [f, ($('#' + f) || {}).value ?? '']));
  state.checks = Object.fromEntries(CHECKS.map(c => [c, chk(c)]));
}
function save(){
  collect();
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch(e){
    /* Speicher voll — meist wegen der Bilder: ohne Bilder erneut versuchen */
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...state, imgs:{ char:[], prod:[] } }));
      toast('Speicher voll — Bilder werden nicht dauerhaft gesichert.');
    } catch(e2){}
  }
}
function load(){
  let data = null;
  try { data = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch(e){}
  if (!data) return false;
  apply(data);
  return true;
}
function apply(data){
  state = Object.assign({ fields:{}, checks:{}, panels:[], library:[], imgs:{ char:[], prod:[] },
                          storyMode:'image', animMode:'full', storyBoard:'all', animBoard:'all' }, data);
  state.imgs = Object.assign({ char:[], prod:[] }, state.imgs);
  Object.entries(state.fields || {}).forEach(([k, v]) => { const el = $('#' + k); if (el) el.value = v; });
  Object.entries(state.checks || {}).forEach(([k, v]) => { const el = $('#' + k); if (el) el.checked = !!v; });
  $$('#storyMode .segbtn').forEach(b => b.classList.toggle('active', b.dataset.mode  === state.storyMode));
  $$('#animMode  .segbtn').forEach(b => b.classList.toggle('active', b.dataset.amode === state.animMode));
  renderLibrary(); renderPanels(); renderThumbs('char'); renderThumbs('prod'); render();
}

/* ---------- Standardwerte für Auswahl- und Zahlenfelder ---------- */
const DEFAULTS = {
  s_dur:'15', s_count:'15', s_ratio:'16:9', s_split:'1', s_model:'GPT Image 2',
  a_model:'Sora 2', a_shotlen:'1'
};
function applyDefaults(force){
  Object.entries(DEFAULTS).forEach(([id, v]) => {
    const el = $('#' + id); if (!el) return;
    if (force || !el.value) el.value = v;
  });
  ['c_bg','p_bg'].forEach(id => { const el = $('#' + id); if (el && !el.value) el.selectedIndex = 0; });
}

/* ---------- Felder eines Tabs leeren ---------- */
function clearFields(prefix){
  FIELDS.filter(f => f.startsWith(prefix)).forEach(f => { const el = $('#' + f); if (el) el.value = ''; });
  applyDefaults(false);
  render(); save();
}

/* ---------- Beispielprojekt (nur auf Knopfdruck) ---------- */
function seed(){
  const v = (id, t) => { const el = $('#' + id); if (el) el.value = t; };
  v('projectName','Walter & Rudi');
  v('c_name','Walter');
  v('c_age','European man, mid-50s');
  v('c_body','lean, average height, relaxed posture');
  v('c_face','strongly receding hairline and high bald forehead, very short silver-grey hair cropped close at the sides and back, short grey-and-white stubble beard and moustache, clear blue eyes, prominent straight nose, weathered friendly face');
  v('c_outfit','unzipped black zip-up hoodie with the hood down, plain white V-neck T-shirt beneath, dark indigo straight-leg jeans, dark brown-black low sneakers with tan gum soles');
  v('c_acc','slate-blue canvas messenger bag on a wide blue strap worn diagonally from left shoulder to right hip');
  v('c_style','Pixar-Stil 3D');
  v('s_title','Walter & Rudi');
  v('s_story','Ein Mann geht mit seinem Rhodesian Ridgeback durch den Herbstwald. Der Hund entdeckt ein Eichhörnchen und reißt ihn von den Beinen.');
  v('s_chars','WALTER — European man, mid-50s, lean; strongly receding hairline, very short silver-grey hair, grey-and-white stubble beard, clear blue eyes; unzipped black hoodie, white V-neck T-shirt, dark indigo jeans, dark sneakers with tan soles, slate-blue messenger bag on a blue strap across the chest.\n\nRUDI — large muscular Rhodesian Ridgeback, short wheaten red-fawn coat, dark charcoal muzzle mask, amber eyes, the breed ridge along the spine, tan leather collar and long brown leash.');
  v('s_setting','autumn beech forest, narrow sun-dappled trail, deep leaf litter');
  v('s_style','Pixar-Stil 3D');
  v('s_tone','komödiantisch, warmherzig');
  v('s_light','golden hour morning light, god-rays through the canopy, amber and moss-green palette');
  v('s_director','Reinhard Schockemöhle');
  v('s_date', new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' }).toUpperCase());
  v('a_audio','rustling leaves, birdsong, paws on soil, panting, leash creak, distant wind');
  /* eigenes Format erzwingen — sonst erbt das Beispiel Panelanzahl und Dauer des Vorprojekts */
  v('s_dur','15'); v('s_count','15'); v('s_ratio','16:9'); v('s_split','1');
  v('a_shotlen','1');
  state.storyBoard = 'all'; state.animBoard = 'all';
  scaffold();
  DEMO_PANELS.forEach((d, i) => { if (state.panels[i]) Object.assign(state.panels[i], d); });
  renderPanels();
}

/* Beispielprojekt: 15 fertige Panels */
const DEMO_PANELS = [
  { shot:'WIDE ESTABLISHING SHOT', note:'Calm, idyllic. Birdsong.',
    desc:'Walter strolls the sunlit forest trail, shoulders relaxed. Rudi trots ahead on a slack leash.' },
  { shot:'MEDIUM SHOT', note:'Warm, cosy. Whistling.',
    desc:'Walter sips from a steaming thermos cup, eyes blissfully closed, whistling. Blissfully unaware.' },
  { shot:'EXTREME CLOSE-UP', note:'Comic freeze. Silent beat.',
    desc:"Rudi's head turns to camera: ears snap upright, nostrils flare, pupils shrink to pinpoints." },
  { shot:'OVER-THE-SHOULDER SHOT', note:'Tension builds. Standoff.',
    desc:'Past Rudi down the trail: a fat squirrel on a mossy stump, cheeks bulging, utterly unimpressed.' },
  { shot:'MACRO DETAIL SHOT', note:'Ominous setup. Ticking clock.',
    desc:"The leash loop cinched tight around Walter's wrist, fingers still loose around the thermos." },
  { shot:'DYNAMIC LOW ANGLE', note:'Impact beat. Whip pan.',
    desc:'Rudi explodes forward out of frame. Walter is yanked off his feet, coffee suspended mid-air.' },
  { shot:'TRACKING SIDE SHOT', note:'Peak slapstick. Fast.',
    desc:'Walter dragged face-down through the leaf litter, arms stretched ahead, one shoe already lost.' },
  { shot:'HIGH ANGLE SHOT', note:'Chaos peak. Wide beat.',
    desc:'Seen from above the canopy: the pair bursts through a bramble, leaves and birds scattering.' },
  { shot:'TIGHT CLOSE-UP', note:'Deadpan. Comic pause.',
    desc:"A single leaf plastered to Walter's dirt-streaked forehead, one eye squinted, resigned grimace." },
  { shot:'WIDE SHOT', note:'Reversal. Skid.',
    desc:'The squirrel rockets up a tree. Rudi brake-slides to a stop — Walter slides straight past him.' },
  { shot:'LOW ANGLE HERO SHOT', note:'Slow motion. Epic framing.',
    desc:'Walter airborne above a wide mud puddle, arms windmilling, face frozen in serene resignation.' },
  { shot:'MEDIUM WIDE SHOT', note:'Punchline. Big splash.',
    desc:'Impact: a crown of mud erupts. Beside it Rudi sits bolt upright, spotless and innocent.' },
  { shot:'HIGH OVER-THE-SHOULDER', note:'Verticality. Silent judgement.',
    desc:'From the branch behind the squirrel, looking down at the muddy scene far below as it chews.' },
  { shot:'WARM MEDIUM CLOSE-UP', note:'Heart beat. Music swells.',
    desc:'Mud-covered Walter sits up, only his blue eyes clean. Rudi licks his face; he laughs helplessly.' },
  { shot:'GOLDEN WIDE CLOSING SHOT', note:'The end. Ambience fades.',
    desc:'They walk into the golden sun, Walter filthy and grinning, Rudi carrying the dented thermos.' }
];

/* ============================================================
   Events
   ============================================================ */
function init(){
  const ver = $('#appVer');
  ver.textContent = 'v' + APP_VERSION;
  ver.title = `Storyboard Studio ${APP_VERSION} — Stand ${APP_DATE}`;
  showBuildDate();
  ensureFreshPage();

  /* Stil-Listen aus dem Katalog */
  $('#styles').innerHTML     = STYLE_ART.map(([l, p]) => `<option value="${esc(l)}">${esc(p.slice(0, 70))}…</option>`).join('');
  $('#prodstyles').innerHTML = STYLE_PROD.map(([l, p]) => `<option value="${esc(l)}">${esc(p.slice(0, 70))}…</option>`).join('');

  /* Shot-Typ-Datalist */
  const dl = document.createElement('datalist');
  dl.id = 'shotlist';
  dl.innerHTML = [...new Set(Object.values(SHOTS).flat())].map(s => `<option>${s}</option>`).join('');
  document.body.appendChild(dl);

  /* Tabs */
  $$('.tab').forEach(t => t.addEventListener('click', () => {
    $$('.tab').forEach(x => x.classList.remove('active'));
    $$('.tabpanel').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    $('#tab-' + t.dataset.tab).classList.add('active');
  }));

  /* Eingaben */
  [...FIELDS, ...CHECKS].forEach(id => {
    const el = $('#' + id);
    if (!el) return;
    el.addEventListener('input',  () => { onInput(id); });
    el.addEventListener('change', () => { onInput(id); });
  });

  /* Buttons */
  $('#btnScaffold').addEventListener('click', () => { scaffold(); render(); toast('Panel-Gerüst erzeugt.'); });
  $('#btnAddPanel').addEventListener('click', addPanel);
  $('#btnSaveChar').addEventListener('click', saveChar);
  $('#btnInsertChar').addEventListener('click', insertChar);
  $('#btnBuildAnim').addEventListener('click', () => { render(); toast('Video-Prompt aus dem Storyboard aufgebaut.'); });

  /* Bild-Upload & Analyse */
  setupUpload('char', '#charDrop', '#charFile');
  setupUpload('prod', '#prodDrop', '#prodFile');
  setupPaste();
  $('#btnAnalyzeChar').addEventListener('click', () => analyze('char'));
  $('#btnAnalyzeProd').addEventListener('click', () => analyze('prod'));
  $('#btnClearChar').addEventListener('click', () => { clearFields('c_'); toast('Charakter-Felder geleert.'); });
  $('#btnClearProd').addEventListener('click', () => { clearFields('p_'); toast('Produkt-Felder geleert.'); });

  /* Kostenloser Weg über einen Chat — der Auftrag geht per URL mit, damit er
     im Chat schon im Eingabefeld steht. Zusätzlich in der Zwischenablage,
     falls der Dienst den Parameter einmal ignoriert. */
  const CHATS = {
    claude:{ label:'Claude',  url:'https://claude.ai/new?q=', plain:'https://claude.ai/new',  prefill:true },
    gpt:   { label:'ChatGPT', url:'https://chatgpt.com/?q=',  plain:'https://chatgpt.com/',   prefill:true }
  };
  const wire = (id, kind, where) => $(id).addEventListener('click', async () => {
    const brief = chatBrief(kind);
    if (where) return sendTo(CHATS[where], brief);
    copyText(brief, 'Auftrag kopiert.');
  });
  wire('#btnChatClaudeChar', 'char', 'claude');
  wire('#btnChatGptChar',    'char', 'gpt');
  wire('#btnCopyAskChar',    'char', null);
  wire('#btnChatClaudeProd', 'prod', 'claude');
  wire('#btnChatGptProd',    'prod', 'gpt');
  wire('#btnCopyAskProd',    'prod', null);
  $('#btnApplyChar').addEventListener('click', () => applyPasted('char'));
  $('#btnApplyProd').addEventListener('click', () => applyPasted('prod'));
  $('#btnDemo').addEventListener('click', () => {
    if (!confirm('Beispielprojekt „Walter & Rudi" laden? Deine aktuellen Eingaben werden dabei überschrieben.')) return;
    seed(); render(); save(); toast('Beispielprojekt geladen.');
  });

  /* Einstellungen */
  $('#btnSettings').addEventListener('click', openModal);
  $('#btnFindModel').addEventListener('click', findModel);
  $('#btnCloseModal').addEventListener('click', closeModal);
  $('#modal').addEventListener('click', e => { if (e.target === $('#modal')) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });
  $('#apiProvider').addEventListener('change', e => {
    localStorage.setItem(KEY_PROV, e.target.value);
    syncProviderUI(); renderThumbs('char'); renderThumbs('prod');
  });
  $('#btnSaveKey').addEventListener('click', () => {
    const p = provider();
    const k = $('#apiKey').value.trim(), m = $('#apiModel').value.trim() || PROVIDERS[p].model;
    if (k) localStorage.setItem(`sbstudio.key.${p}`, k); else localStorage.removeItem(`sbstudio.key.${p}`);
    localStorage.setItem(`sbstudio.model.${p}`, m);
    renderThumbs('char'); renderThumbs('prod'); closeModal();
    toast(k ? `${PROVIDERS[p].label}-Key gespeichert.` : 'Key entfernt.');
  });
  $('#btnClearKey').addEventListener('click', () => {
    localStorage.removeItem(`sbstudio.key.${provider()}`); $('#apiKey').value = '';
    renderThumbs('char'); renderThumbs('prod'); syncProviderUI();
    toast('Key gelöscht.');
  });

  /* Segmente */
  $$('#storyMode .segbtn').forEach(b => b.addEventListener('click', () => {
    state.storyMode = b.dataset.mode;
    $$('#storyMode .segbtn').forEach(x => x.classList.toggle('active', x === b));
    render(); save();
  }));
  $$('#animMode .segbtn').forEach(b => b.addEventListener('click', () => {
    state.animMode = b.dataset.amode;
    $$('#animMode .segbtn').forEach(x => x.classList.toggle('active', x === b));
    render(); save();
  }));

  /* Kopieren / Download */
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const text = $('#' + b.dataset.copy).textContent;
    try { await navigator.clipboard.writeText(text); toast('In die Zwischenablage kopiert.'); }
    catch(e){
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove(); toast('In die Zwischenablage kopiert.');
    }
  }));
  $$('[data-download]').forEach(b => b.addEventListener('click', () => {
    download($('#' + b.dataset.download).textContent, b.dataset.file, 'text/plain');
  }));

  /* Projekt */
  $('#btnExport').addEventListener('click', () => {
    save();
    const name = (val('projectName') || 'storyboard-studio').replace(/[^\w\-]+/g, '-').toLowerCase();
    download(JSON.stringify(state, null, 2), `${name}.json`, 'application/json');
  });
  $('#btnImport').addEventListener('click', () => $('#fileImport').click());
  $('#fileImport').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try { apply(JSON.parse(r.result)); save(); toast('Projekt geladen.'); }
      catch(err){ toast('Datei konnte nicht gelesen werden.'); }
    };
    r.readAsText(f);
    e.target.value = '';
  });
  $('#btnReset').addEventListener('click', () => {
    if (!confirm('Alle Felder, Panels und Referenzbilder leeren? Die Charakter-Bibliothek und der API-Key bleiben erhalten.')) return;
    const lib = state.library;
    [...FIELDS].forEach(f => { const el = $('#' + f); if (el) el.value = ''; });
    state.panels = []; state.library = lib; state.imgs = { char:[], prod:[] };
    state.storyBoard = 'all'; state.animBoard = 'all';
    applyDefaults(true);
    renderPanels(); renderLibrary(); renderThumbs('char'); renderThumbs('prod'); render(); save();
    toast('Zurückgesetzt.');
  });

  /* Leerer Start — das Beispiel gibt es nur über den Button „Beispiel" */
  load();
  applyDefaults(false);
  renderThumbs('char'); renderThumbs('prod');
  renderPanels(); renderLibrary(); render();
}

function onInput(id){
  if (id === 's_count'){
    const n = parseInt(val('s_count'));
    if (n >= 2 && n <= 40 && n !== state.panels.length) scaffold();
  }
  if (id === 's_dur'){ retime(); renderPanels(); }
  if (id === 'o_dlg') renderPanels();
  render(); save();
}

function download(text, filename, type){
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href:url, download:filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

/* Das Skript wird dynamisch nachgeladen — DOMContentLoaded kann bereits
   vorbei sein, deshalb den Zustand prüfen statt blind auf das Ereignis warten. */
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
