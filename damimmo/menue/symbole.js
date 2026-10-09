/* ==========================================================================
   Da Mimmo · Symbolsatz
   Jedes Symbol ist ein Satz Pfade im 24×24-Raster. Dieselben Pfade werden
   als SVG (Karte, Gästeseite) und über Path2D im Canvas (Instagram) benutzt.
   ========================================================================== */
const SYMBOLE = {
  pasta: { name:'Pasta', strich:[
    'M2.6 13.6h18.8c0 3.9-4.2 7-9.4 7s-9.4-3.1-9.4-7z',
    'M6.4 13.4c0-3.1 2.5-5.6 5.6-5.6s5.6 2.5 5.6 5.6',
    'M7.8 11c1-1.1 2.5-1.8 4.2-1.8s3.2.7 4.2 1.8',
    'M9.6 13.4c0-1.3 1.1-2.4 2.4-2.4s2.4 1.1 2.4 2.4',
    'M4.6 13.6c-1.2-1.4-1.4-3-0.6-4.2M19.4 13.6c1.2-1.4 1.4-3 .6-4.2',
  ]},
  pizza: { name:'Pizza', strich:[
    'M12 3 4.1 19.1a17.6 17.6 0 0 0 15.8 0z',
    'M6.6 15.9a15 15 0 0 0 10.8 0',
  ], punkte:[[10.4,12.2,.95],[13.6,14.6,.95],[10.8,16.6,.85]]},
  fisch: { name:'Fisch', strich:[
    'M19.4 12c-2.4 3-5.5 4.7-9.1 4.7S3.6 15 1.6 12C3.6 9 6.7 7.3 10.3 7.3s6.7 1.7 9.1 4.7z',
    'M19 9.6 22.6 7v10l-3.6-2.6',
    'M6.2 14.4c.9.6 1.9 1 3 1.2',
  ], punkte:[[6.6,10.8,.9]]},
  steak: { name:'Fleisch', strich:[
    'M4.4 12.6C3.2 9 6.4 5.2 10.8 4.3c4.4-.9 8.7 1.3 9.5 4.8.8 3.5-2.4 7.3-6.8 8.2-4.4.9-7.9-1.2-9.1-4.7z',
    'M8.4 6.6 11.8 13.4M11.6 5.6 15 12.4M14.8 5.4 17.9 11.6',
  ]},
  schwein: { name:'Schwein', strich:[
    'M12 20.2c-4.2 0-7.6-3.2-7.6-7.2S7.8 5.8 12 5.8s7.6 3.2 7.6 7.2-3.4 7.2-7.6 7.2z',
    'M7.4 7.2 5.5 3.1l4.3 2.2M16.6 7.2l1.9-4.1-4.3 2.2',
    'M12 11.4c1.9 0 3.4 1.1 3.4 2.5S13.9 16.4 12 16.4s-3.4-1.1-3.4-2.5S10.1 11.4 12 11.4z',
  ], punkte:[[10.8,13.9,.55],[13.2,13.9,.55]]},
  huhn: { name:'Geflügel', strich:[
    'M20.3 7.6a4.9 4.9 0 1 1-9.8 0 4.9 4.9 0 0 1 9.8 0z',
    'M11.8 9.9 7.4 14.3M13.4 11.5 9 15.9',
    'M7.4 14.3a1.9 1.9 0 1 0-2.7 2.7 1.9 1.9 0 0 0 2.7-2.7z',
    'M9 15.9a1.9 1.9 0 1 0-2.7 2.7A1.9 1.9 0 0 0 9 15.9z',
  ]},
  muschel: { name:'Meeresfrüchte', strich:[
    'M12 18.6 4.2 9.8A9.6 9.6 0 0 1 12 5.6a9.6 9.6 0 0 1 7.8 4.2z',
    'M12 18.6V9.4M12 18.6 7.6 10.2M12 18.6l4.4-8.4',
    'M9.6 18.2c-1.3 1-2.8 1.2-3.8.4M14.4 18.2c1.3 1 2.8 1.2 3.8.4',
  ]},
  salat: { name:'Salat', strich:[
    'M3.4 13.4h17.2c0 3.7-3.8 6.8-8.6 6.8s-8.6-3.1-8.6-6.8z',
    'M11.6 13.2c-2.6-2.6-2.2-6.2.8-8.4 1.6 3.2 1.2 6.2-.8 8.4z',
    'M13 13.2c1.4-3 4.4-4.2 7-2.8-1.4 2.6-4 3.8-7 2.8z',
    'M10.8 13.2c-2-2.2-5-2.4-7.2-.6 1.8 2 4.6 2.6 7.2.6z',
  ]},
  suppe: { name:'Suppe', strich:[
    'M3.2 13.4h17.6c0 3.5-3.9 6.4-8.8 6.4s-8.8-2.9-8.8-6.4z',
    'M9 10.4c0-1.1 1.1-1.6 1.1-2.7S9 6.1 9 5',
    'M13.4 10.4c0-1.1 1.1-1.6 1.1-2.7s-1.1-1.6-1.1-2.7',
  ]},
  dessert: { name:'Dessert', strich:[
    'M7.6 11.4h8.8l-1.6 8.4H9.2z',
    'M10.2 11.2a2.6 2.6 0 1 1 3.9-.1',
    'M13.6 11.2a2.4 2.4 0 1 1 3.1-.4',
    'M7.3 10.8a2.4 2.4 0 1 1 3.1-.4',
  ]},
  brot: { name:'Brot', strich:[
    'M4 13.2c0-3.4 3.6-6.2 8-6.2s8 2.8 8 6.2v1.6c0 1.7-1.4 3-3 3H7c-1.7 0-3-1.3-3-3z',
    'M9.4 8.2 7.7 11.2M13.2 7.6l-1.7 3M16.6 8.6l-1.6 2.8',
  ]},
  kaese: { name:'Käse', strich:[
    'M3 12.4 12 7.6l9 4.8v4.8H3z',
    'M3 12.4h18',
  ], punkte:[[7.6,14.8,1.05],[14.8,15,1.25],[11,13.6,.8]]},
  spritz: { name:'Spritz / Cocktail', strich:[
    'M4.2 5.4h15.6L12 13.8z',
    'M12 13.8V19M8.4 19h7.2',
    'M15.8 3.4 13.4 8',
  ], punkte:[[16.4,8.4,1.25]]},
  bier: { name:'Bier', strich:[
    'M5.6 9.4h9.6V19c0 .8-.6 1.4-1.4 1.4H7c-.8 0-1.4-.6-1.4-1.4z',
    'M15.2 11.4h2.2a2.6 2.6 0 0 1 0 5.2h-2.2',
    'M5.6 9.4c.7-1.8 2.3-2.6 3.6-1.9 1-1.5 3.2-1.6 4.3-.2 1 .3 1.6 1.1 1.7 2.1',
    'M8.4 12.4v4.4M12.4 12.4v4.4',
  ]},
  wein: { name:'Wein', strich:[
    'M7.6 3.8h8.8l-.8 5.6a4 4 0 0 1-7.2 0z',
    'M12 14.4v5.2M8.6 19.6h6.8',
    'M7.9 7.6h8.2',
  ]},
  kaffee: { name:'Kaffee', strich:[
    'M4.4 9.4h11.2v4.8a5.6 5.6 0 0 1-11.2 0z',
    'M15.6 10.6h1.9a2.6 2.6 0 0 1 0 5.2h-1.9',
    'M3.4 19.6h13.6',
    'M8 6.6c0-.9.9-1.3.9-2.2S8 3.1 8 3.1M11.8 6.6c0-.9.9-1.3.9-2.2s-.9-1.3-.9-2.2',
  ]},
  blatt: { name:'Vegetarisch', strich:[
    'M5 19.4C3.7 12 9 5.4 19.4 4.6c.6 8.4-4.8 14.2-11.6 14.2z',
    'M5 19.4 14.2 10',
  ]},
  besteck: { name:'Allgemein', strich:[
    'M7 3.4v5.2a2.4 2.4 0 0 0 4.8 0V3.4',
    'M9.4 11v9.6',
    'M16.8 3.4c1.8 1.8 1.8 5.6 0 7.4v9.8',
  ]},
};

/* Welches Symbol passt? Reihenfolge ist Absicht — Genaueres zuerst. */
const SYMBOL_REGELN = [
  [/pizza|calzone|steinofen|focaccia/, 'pizza'],
  [/nudel|pasta|spaghetti|tagliatelle|penne|lasagne|gnocchi|tortellini|ravioli|risotto|linguine/, 'pasta'],
  [/garnel|scampi|krabbe|muschel|tintenfisch|calamar|meeresfrücht|frutti di mare|vongole/, 'muschel'],
  [/fisch|lachs|dorade|wolfsbarsch|thunfisch|pesce|forelle|zander/, 'fisch'],
  [/huhn|hähnchen|pollo|pute|ente|geflügel/, 'huhn'],
  [/schwein|filetspitzen vom schwein|schnitzel|porchetta/, 'schwein'],
  [/steak|rump|rind|lamm|kalb|entrecote|filet|fleisch|carne|braten/, 'steak'],
  [/suppe|minestrone|brühe|zuppa/, 'suppe'],
  [/salat|insalata|rucola|caprese/, 'salat'],
  [/dessert|dolci|nachtisch|tiramisu|panna|eis|sorbet|kuchen/, 'dessert'],
  [/käse|formaggio|parmesan pur|gorgonzola/, 'kaese'],
  [/brot|bruschetta|antipast|vorspeise|focaccia|grissini/, 'brot'],
  [/spritz|aperol|cocktail|limonade|saft|alkoholfrei|drink/, 'spritz'],
  [/bier|beck|pils|weizen|hopfen/, 'bier'],
  [/wein|vino|prosecco|secco|schorle/, 'wein'],
  [/kaffee|espresso|cappuccino|latte|caffè/, 'kaffee'],
  [/vegetarisch|vegan|gemüse|verdure/, 'blatt'],
];

function symbolRaten(gangName, gericht){
  const text = ((gericht.name||'')+' '+(gericht.desc||'')+' '+(gangName||'')).toLowerCase();
  for(const [muster,schluessel] of SYMBOL_REGELN) if(muster.test(text)) return schluessel;
  return 'besteck';
}

/* Welches Symbol gilt für dieses Gericht? */
function symbolFuer(gangName, gericht){
  if(gericht.symbol && gericht.symbol !== 'auto' && SYMBOLE[gericht.symbol]) return gericht.symbol;
  return symbolRaten(gangName, gericht);
}

/* ==========================================================================
   Merkmale: kleine Zeichen hinter dem Gericht (vegetarisch, laktosefrei).
   Gleiches 24×24-Raster wie die Symbole.
   ========================================================================== */
const MERKMALE = {
  vegetarisch: { name:'Vegetarisch', strich:[
    'M20.5 3.5c0 8.5-4.6 13.5-11 13.5-1.6 0-3-0.3-4.2-0.9C5.6 9.2 10.6 4.4 20.5 3.5z',
    'M4.2 20.5c1.4-4.4 4.2-8 8.3-10.6',
  ]},
  laktosefrei: { name:'Laktosefrei', strich:[
    'M9 2.8h6v2.6l2.2 4.1v11.7H6.8V9.5L9 5.4z',
    'M6.8 11.4h10.4',
    'M3.6 20.8 20.4 3.4',
  ]},
};

function merkmalSVG(schluessel, klasse='merkmal'){
  const m = MERKMALE[schluessel]; if(!m) return '';
  const striche = (m.strich||[]).map(d=>`<path d="${d}"/>`).join('');
  return `<svg class="${klasse}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
    aria-label="${m.name}">${striche}</svg>`;
}

function merkmalZeichnen(ctx, schluessel, x, y, groesse, farbe, staerke=1.7){
  const m = MERKMALE[schluessel]; if(!m) return;
  const faktor = groesse/24;
  ctx.save();
  ctx.translate(x, y - groesse/2);
  ctx.scale(faktor, faktor);
  ctx.strokeStyle = farbe; ctx.lineWidth = staerke; ctx.lineCap='round'; ctx.lineJoin='round';
  (m.strich||[]).forEach(d=> ctx.stroke(new Path2D(d)));
  ctx.restore();
}

/* --- als SVG (Karte, Gästeseite) --- */
function symbolSVG(schluessel, klasse='speise-symbol'){
  const sym = SYMBOLE[schluessel] || SYMBOLE.besteck;
  const striche = (sym.strich||[]).map(d=>`<path d="${d}"/>`).join('');
  const punkte  = (sym.punkte||[]).map(([x,y,r])=>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor" stroke="none"/>`).join('');
  return `<svg class="${klasse}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${striche}${punkte}</svg>`;
}

/* --- ins Canvas (Instagram) --- */
function symbolZeichnen(ctx, schluessel, x, y, groesse, farbe, staerke=1.5){
  const sym = SYMBOLE[schluessel] || SYMBOLE.besteck;
  const faktor = groesse/24;
  ctx.save();
  ctx.translate(x - groesse/2, y - groesse/2);
  ctx.scale(faktor, faktor);
  ctx.strokeStyle = farbe; ctx.fillStyle = farbe;
  ctx.lineWidth = staerke; ctx.lineCap='round'; ctx.lineJoin='round';
  (sym.strich||[]).forEach(d=> ctx.stroke(new Path2D(d)));
  (sym.punkte||[]).forEach(([px,py,r])=>{
    ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2); ctx.fill();
  });
  ctx.restore();
}
