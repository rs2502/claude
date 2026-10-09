/* ==========================================================================
   Deutsch → Englisch für die Wochenkarte
   --------------------------------------------------------------------------
   Grundlage ist die komplette Speisekarte von Da Mimmo (Stand 2025):
   Antipasti, Salate, Suppen, Pasta, Pizza, Burger, Fleisch, Fisch.
   Italienische Gerichtnamen bleiben stehen — übersetzt wird die deutsche
   Beschreibung darunter.

   Reihenfolge: zuerst ganze Sätze (SAETZE), dann lange Wortgruppen, dann
   einzelne Begriffe. Was die App vorschlägt, lässt sich im Feld „English“
   jederzeit überschreiben; diese Korrektur gilt dann immer.
   ========================================================================== */
const Woerterbuch = (()=>{

/* Ganze Beschreibungen, die so auf der Karte stehen ----------------------- */
const SAETZE = {
  'gemischte vorspeisen aus der vitrine': 'mixed starters from our counter',
  'preis nach menge': 'price by portion',
  'kleinere portionen auf anfrage erhältlich': 'smaller portions available on request',
  'keine kleinen portionen': 'no small portions',
  'an feiertagen gilt die wochenkarte nicht': 'not valid on public holidays',
  'außer-haus-verkauf & lieferung': 'takeaway & delivery',
  'dienstag bis samstag': 'Tuesday to Saturday',
  'montag bis freitag': 'Monday to Friday',
  'montag bis samstag': 'Monday to Saturday',
  'extra karte': 'Specials',
  'extrakarte': 'Specials',
  'wochenkarte': 'Weekly Menu',
  'mittagstisch': 'Lunch Menu',
  'speisen': 'Food',
  'empfohlene getränke': 'Recommended drinks',
  'getränke': 'Drinks',
  'aperitivo': 'Aperitivo',
  'aperitif': 'Aperitif',
  'vorspeisen': 'Starters',
  'hauptgerichte': 'Main courses',
  'hauptspeisen': 'Main courses',
  'nachspeisen': 'Desserts',
  'nachtisch': 'Dessert',
  'desserts': 'Desserts',
  'beilagen': 'Side dishes',
  'salate': 'Salads',
  'suppen': 'Soups',
  'weine': 'Wines',
  'offene weine': 'Wines by the glass',
  'fisch': 'Fish',
  'fleisch': 'Meat',
  'für kinder': 'For children',
  'kinderkarte': 'For children',
  'tisch reservieren': 'Reserve a table',
  'wichtige hinweise': 'Please note',
};

/* Wortgruppen und Begriffe — lange zuerst, das ordnet die App selbst ------ */
const BEGRIFFE = {
  /* --- Beilagen und Hinweise, die überall auftauchen --- */
  'dazu servieren wir ihnen eine beilage': 'served with a side dish',
  'dazu erhalten sie eine beilage': 'served with a side dish',
  'dazu eine beilage': 'with a side dish',
  'serviert mit einer beilage': 'served with a side dish',
  'dazu salatbeilage': 'with a side salad',
  'dazu salat': 'with a side salad',
  'zusätzliche beilage': 'extra side dish',
  'salatbeilage': 'side salad',
  'gemüsebeilage': 'side of vegetables',
  'beilage': 'side dish',
  'nicht als kleine portion erhältlich': 'not available as a small portion',
  'auf wunsch zusätzlich mit': 'add if you like',

  /* --- Antipasti --- */
  'parmaschinken mit melone': 'Parma ham with melon',
  'tomaten mit mozzarella und frischem basilikum': 'tomatoes with mozzarella and fresh basil',
  'rinderfilet dünngeschnitten': 'thinly sliced beef fillet',
  'gehobeltem parmesan': 'shaved parmesan',
  'parmesanhobel': 'shaved parmesan',
  'parmesankäse': 'parmesan',
  'tomatenconcassee': 'tomato concassée',
  'tomatenconcassée': 'tomato concassée',
  'gerösteten brotscheiben': 'toasted bread',
  'kalte kalbsbratenscheibchen': 'thin slices of cold roast veal',
  'hausgemachter thunfischsoße': 'homemade tuna sauce',
  'shrimps-cocktail': 'shrimp cocktail',
  'parmaschinken': 'Parma ham',
  'melone': 'melon',
  'filatakäse': 'filata cheese',
  'kuhmilch': "cow's milk",

  /* --- Salate --- */
  'gemischter salat': 'mixed salad',
  'tomaten-gurkensalat': 'tomato and cucumber salad',
  'tomatensalat': 'tomato salad',
  'gurkensalat': 'cucumber salad',
  'artischockensalat': 'artichoke salad',
  'rucola-salat': 'rocket salad',
  'kräuter-sahnedressing': 'herb cream dressing',
  'balsamico-dressing': 'balsamic dressing',
  'olivenöl-balsamico': 'olive oil and balsamic',
  'pinienkernen': 'pine nuts',
  'pinienkerne': 'pine nuts',
  'dressing': 'dressing',

  /* --- Suppen --- */
  'kraftbrühe mit aufgeschlagenem ei': 'clear broth with whisked egg',
  'nach römischer art': 'Roman style',
  'tomatencremesuppe': 'cream of tomato soup',
  'gemüsesuppe': 'vegetable soup',
  'kraftbrühe': 'clear broth',
  'mit fleisch gefüllte ringnudeln': 'meat-filled tortellini',
  'fleischgefüllte ringnudeln': 'meat-filled tortellini',
  'ringnudeln': 'tortellini',

  /* --- Pasta --- */
  'gemischte nudeln': 'mixed pasta',
  'nudelrollen mit fleischfüllung': 'pasta rolls with a meat filling',
  'teigblätter': 'pasta sheets',
  'bandnudeln': 'tagliatelle',
  'kartoffelnudeln': 'gnocchi',
  'nudeln': 'pasta',
  'knoblauchscheiben': 'sliced garlic',
  'rinderhackfleisch': 'minced beef',
  'hackfleisch': 'minced meat',
  'fleischragout': 'meat ragù',
  'körnigem senf': 'wholegrain mustard',
  'körniger senf': 'wholegrain mustard',
  'pikanter käsesoße': 'spicy cheese sauce',
  'käsesoße': 'cheese sauce',
  'tomaten-sahnesoße': 'tomato and cream sauce',
  'brandy-sahne-tomatensoße': 'brandy, cream and tomato sauce',
  'leichter tomatensoße': 'light tomato sauce',
  'pikanter tomatensoße': 'spicy tomato sauce',
  'würzig-pikanter tomatensoße': 'spicy, aromatic tomato sauce',
  'tomatensoße': 'tomato sauce',
  'sahnesoße': 'cream sauce',
  'gorgonzolasoße': 'gorgonzola sauce',
  'weißweinsoße': 'white wine sauce',
  'honigsoße': 'honey sauce',
  'zitronensoße': 'lemon sauce',
  'grüner soße': 'green sauce',
  'burgersoße': 'burger sauce',
  'fischsoße': 'fish sauce',
  'thunfischsoße': 'tuna sauce',
  'rosa pfeffer-sahnesoße': 'pink peppercorn cream sauce',
  'pfeffer-sahnesoße': 'peppercorn cream sauce',
  'mit knoblauch abgeschmeckt': 'seasoned with garlic',
  'al dente gekocht': 'cooked al dente',
  'geschichtet': 'layered',
  'überbacken': 'gratinated',
  'bechamel': 'béchamel',
  'mascarpone': 'mascarpone',
  'spinat': 'spinach',
  'erbsen': 'peas',
  'broccoli': 'broccoli',
  'brokkoli': 'broccoli',

  /* --- Pizza --- */
  'gefüllte pizza': 'folded pizza',
  'vegetarische pizza': 'vegetarian pizza',
  'diverse antipasti': 'assorted antipasti',
  'pilz der saison': 'mushroom of the season',
  'pilzen der saison': 'mushrooms of the season',
  'büffelmozzarella': 'buffalo mozzarella',
  'ziegenkäse': "goat's cheese",
  'schafskäse': 'feta',
  'gorgonzola-käse': 'gorgonzola',
  'trüffelöl': 'truffle oil',
  'trüffelmayonnaise': 'truffle mayonnaise',
  'trüffel-steinpilzcreme': 'truffle and porcini cream',
  'ananas': 'pineapple',
  'spargel': 'asparagus',
  'oliven': 'olives',
  'mais': 'sweetcorn',
  'glutenfrei': 'gluten-free',
  'maisstärke': 'corn starch',
  'reismehl': 'rice flour',
  'sauerteig': 'sourdough',
  'teig': 'dough',

  /* --- Burger --- */
  'karamellisierten zwiebeln': 'caramelised onions',
  'roten zwiebeln': 'red onions',
  'eisbergsalat': 'iceberg lettuce',
  'avocadocreme': 'avocado cream',
  'knoblauchcreme': 'garlic cream',
  'balsamicocreme': 'balsamic cream',
  'gin-mayonnaise': 'gin mayonnaise',
  'mayonnaise': 'mayonnaise',
  'paprikafilets': 'pepper strips',
  'tomatenscheiben': 'tomato slices',
  'preiselbeeren': 'cranberries',
  'gemüsepatty': 'veggie patty',
  'lachssteak': 'salmon steak',
  'brötchen': 'bun',
  'krosses': 'crisp',
  'rundes': 'round',
  'edamer': 'Edam',
  'camembert': 'camembert',
  'pommes frites': 'fries',
  'pommes': 'fries',
  'ketchup': 'ketchup',

  /* --- Fleisch --- */
  'paniertes schweinemedaillon': 'breaded pork medallion',
  'schweinemedaillons': 'pork medallions',
  'schweinemedaillon': 'pork medallion',
  'in scheiben geteiltes rumpsteak vom grill': 'sliced grilled rump steak',
  'zarte scheiben vom grill': 'tender slices from the grill',
  'auswahl verschiedener fleischsorten': 'selection of different meats',
  'liebevoll zubereitet auf dem grill': 'lovingly prepared on the grill',
  'eine hochwertige': 'a fine',
  'rindfleischstreifen': 'strips of beef',
  'rinderfiletstreifen': 'strips of beef fillet',
  'rinderfilet': 'beef fillet',
  'schweinefilet': 'pork fillet',
  'lammfilet': 'lamb fillet',
  'kalbsrücken': 'saddle of veal',
  'kalbfleisch': 'veal',
  'rumpsteak': 'rump steak',
  'angus rumpsteak': 'Angus rump steak',
  'hähnchenbrust': 'chicken breast',
  'hähnchenfleisch': 'chicken',
  'grünen pfeffer': 'green peppercorns',
  'grüner pfeffer': 'green peppercorns',
  'rosa pfeffer': 'pink peppercorns',
  'in feinem olivenöl gebraten': 'fried in fine olive oil',
  'in olivenöl gebraten': 'fried in olive oil',
  'gebratenen': 'fried',
  'gebratenem': 'fried',
  'gebratene': 'fried',
  'gebraten': 'fried',
  'gegrilltem': 'grilled',
  'gegrillt': 'grilled',
  'frittierter': 'deep-fried',
  'paniert': 'breaded',
  'verfeinert mit': 'refined with',
  'garstufe': 'cooking level',

  /* --- Fisch --- */
  'birnen-ingwer-chutney': 'pear and ginger chutney',
  'ingwer': 'ginger',
  'birne': 'pear',
  'fischfilet': 'fish fillet',
  'lachsfilet': 'salmon fillet',
  'hähnchenfilet': 'chicken fillet',
  'seelachs': 'pollock',
  'dorade': 'sea bream',
  'wolfsbarsch': 'sea bass',
  'meeresfrüchten': 'seafood',
  'meeresfrüchte': 'seafood',
  'flusskrebsen': 'crayfish',
  'tintenfisch': 'squid',
  'muscheln': 'mussels',
  'thunfisch': 'tuna',
  'gambas': 'king prawns',
  'gamba': 'king prawn',
  'shrimps': 'shrimps',
  'lachs': 'salmon',

  /* --- Gemüse, Kräuter, Zutaten --- */
  'frischen champignons': 'fresh mushrooms',
  'frische champignons': 'fresh mushrooms',
  'champignons': 'mushrooms',
  'pfifferlingen': 'chanterelles',
  'pfifferlinge': 'chanterelles',
  'steinpilze': 'porcini',
  'artischocken': 'artichokes',
  'auberginen': 'aubergines',
  'cherrytomaten': 'cherry tomatoes',
  'frischen tomaten': 'fresh tomatoes',
  'tomaten': 'tomatoes',
  'zwiebeln': 'onions',
  'knoblauch': 'garlic',
  'zucchini': 'courgettes',
  'gemüse': 'vegetables',
  'salat': 'salad',
  'rucola': 'rocket',
  'frischen kräutern': 'fresh herbs',
  'kräutern': 'herbs',
  'kräuter': 'herbs',
  'rosmarin': 'rosemary',
  'thymian': 'thyme',
  'basilikum': 'basil',
  'salbei': 'sage',
  'minze': 'mint',
  'peperoni': 'chilli peppers',
  'paprika': 'bell pepper',
  'chili': 'chilli',
  'curry': 'curry',
  'senf': 'mustard',
  'olivenöl': 'olive oil',
  'schinken': 'ham',
  'salami': 'salami',
  'speck': 'bacon',
  'käse': 'cheese',
  'sahne': 'cream',
  'butter': 'butter',
  'ei': 'egg',
  'kartoffeln': 'potatoes',
  'reis': 'rice',
  'brot': 'bread',
  'zitronensaft': 'lemon juice',
  'holunderblüte': 'elderflower',
  'zitrone': 'lemon',
  'orange': 'orange',
  'alkoholfreie': 'non-alcoholic',
  'alkoholfrei': 'non-alcoholic',
  'hausgemachter': 'homemade',
  'hausgemachte': 'homemade',
  'hausgemacht': 'homemade',
  'besonders an warmen tagen beliebt': 'especially popular on warm days',
  'leicht fruchtig': 'lightly fruity',
  'spritzig': 'sparkling',
  'pikant': 'spicy',
  'herb': 'dry',
  'frischem': 'fresh',
  'frischen': 'fresh',
  'frische': 'fresh',
  'frischer': 'fresh',
  'kleine portion': 'small portion',
  'portion': 'portion',
  'vegetarisch': 'vegetarian',

  /* --- Getränke --- */
  'hausgemachte limonade': 'homemade lemonade',
  'limonade': 'lemonade',
  'apfelschorle': 'apple spritzer',
  'weinschorle': 'wine spritzer',
  'mineralwasser': 'sparkling mineral water',
  'stilles wasser': 'still water',
  'wasser': 'water',
  'rotwein': 'red wine',
  'weißwein': 'white wine',
  'roséwein': 'rosé wine',
  'hauswein': 'house wine',
  'wein': 'wine',
  'bier vom fass': 'draught beer',
  'bier': 'beer',
  'saft': 'juice',
  'apfelsaft': 'apple juice',
  'orangensaft': 'orange juice',
  'traubensaft': 'grape juice',
  'kaffee': 'coffee',
  'tee': 'tea',
  'flasche': 'bottle',
  'glas': 'glass',
  'trocken': 'dry',
  'halbtrocken': 'medium dry',
  'lieblich': 'sweet',
  'eisgekühlt': 'ice-cold',
  'frisch gepresst': 'freshly squeezed',

  /* --- Bindewörter ganz zum Schluss --- */
  'sowie': 'as well as',
  'dazu': 'with',
  'oder': 'or',
  'und': 'and',
  'mit': 'with',
  'ohne': 'without',
  'auf': 'on',
  'aus': 'from',
  'vom': 'from the',
  'von': 'from',
  'einer': 'a',
  'einem': 'a',
  'eine': 'a',
  'ein': 'a',
  'der': 'the',
  'die': 'the',
  'das': 'the',
  'den': 'the',
  'dem': 'the',
  'in': 'in',
  'im': 'in the',
  'nach': 'in',
  'für': 'for',
  'je': 'per',
  'stück': 'piece',
};

/* Alles einmal nach Länge sortieren: „frischen champignons“ muss vor
   „champignons“ und „frischen“ drankommen. */
const LISTE = Object.keys(BEGRIFFE).sort((a,b)=> b.length - a.length)
  .map(k => ({ such: new RegExp('(^|[^\\p{L}])(' + esc(k) + ')(?![\\p{L}])', 'giu'),
               rein: BEGRIFFE[k] }));

function esc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }

/* Großschreibung am Satzanfang übernehmen */
function wieVorlage(vorlage, text){
  if(!vorlage || !text) return text;
  const ersterBuchstabe = vorlage.match(/\p{L}/u);
  if(ersterBuchstabe && ersterBuchstabe[0] === ersterBuchstabe[0].toUpperCase())
    return text.charAt(0).toUpperCase() + text.slice(1);
  return text;
}

/* Übersetzt einen Namen oder eine Beschreibung.
   Italienische Namen und alles Unbekannte bleiben unverändert stehen. */
function uebersetzen(text){
  const roh = String(text||'').trim();
  if(!roh) return '';

  const ganz = SAETZE[roh.toLowerCase().replace(/[.!]+$/,'')];
  if(ganz) return wieVorlage(roh, ganz) + (/[.!]$/.test(roh) ? roh.slice(-1) : '');

  let aus = roh;
  for(const {such, rein} of LISTE){
    aus = aus.replace(such, (treffer, vorher, wort, stelle)=>{
      /* Gleiches Wort in beiden Sprachen (Curry, Mozzarella, Camembert …):
         dann bleibt die Schreibweise des Gastgebers stehen. */
      if(rein.toLowerCase() === wort.toLowerCase()) return vorher + wort;
      /* Im Deutschen ist jedes Hauptwort groß — im Englischen nur das
         erste Wort des Satzes. Sonst steht da „with Chanterelles“. */
      const satzAnfang = stelle === 0 || /[.!?]\s+$/.test(aus.slice(0, stelle+vorher.length));
      return vorher + (satzAnfang ? wieVorlage(wort, rein) : rein);
    });
  }
  return aus;
}

/* Für die festen Beschriftungen der Karte */
function begriff(schluessel){
  return SAETZE[String(schluessel||'').toLowerCase()] || schluessel;
}

return { uebersetzen, begriff, SAETZE, BEGRIFFE };
})();

if(typeof window !== 'undefined') window.Woerterbuch = Woerterbuch;
if(typeof module !== 'undefined') module.exports = Woerterbuch;
