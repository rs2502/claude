/* Gemeinsame Foto-Zuordnung für Redaktion, Karte und Gästeseite. */
const TELLER = {
  pasta:'bilder/pasta.webp', pesce:'bilder/pesce.webp', carne:'bilder/carne.webp',
  pizza:'bilder/pizza.webp', insalate:'bilder/insalate.webp', dolci:'bilder/dolci.webp',
};
const TELLER_NAMEN = {
  pasta:'Pasta', pesce:'Fisch', carne:'Fleisch',
  pizza:'Pizza', insalate:'Salat', dolci:'Dessert',
};

/* Rät aus Gang-, Gericht- und Beschreibungstext das passende Foto. */
function bildRaten(gangName, gericht){
  const text = ((gangName||'')+' '+(gericht.name||'')+' '+(gericht.desc||'')).toLowerCase();
  const regeln = [
    [/pizza|steinofen|calzone/, 'pizza'],
    [/nudel|pasta|spaghetti|tagliatelle|penne|lasagne|risotto|gnocchi|tortellini/, 'pasta'],
    [/fisch|meer|lachs|dorade|garnel|scampi|pesce|muschel|tintenfisch|thunfisch/, 'pesce'],
    [/fleisch|steak|filet|rump|schwein|rind|lamm|kalb|huhn|hähnchen|pollo|carne/, 'carne'],
    [/salat|insalata|vorspeise|antipast/, 'insalate'],
    [/dessert|dolci|nachtisch|tiramisu|panna|\beis/, 'dolci'],
  ];
  for(const [muster,schluessel] of regeln) if(muster.test(text)) return schluessel;
  return null;
}

/* Fertige Bildquelle (Pfad oder eingebettetes Bild) — null, wenn keins gewollt ist. */
function bildQuelle(gangName, gericht){
  if(gericht.bild === 'keins') return null;
  if(gericht.bild && gericht.bild.startsWith('data:')) return gericht.bild;
  if(gericht.bild && TELLER[gericht.bild]) return TELLER[gericht.bild];
  const geraten = bildRaten(gangName, gericht);
  return geraten ? TELLER[geraten] : null;
}
