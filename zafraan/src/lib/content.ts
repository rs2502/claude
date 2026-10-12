/* Alle Texte der Seite. Speisekarte, Adresse und Zeiten stammen von ristorante-pizzeria-italia.com. */

export const site = {
  name: "Ristorante Pizzeria Italia",
  short: "Italia",
  tagline: "Cucina Italiana · Bruchhausen-Vilsen",
  url: "https://ristorante-pizzeria-italia.com",
  description:
    "Ristorante Pizzeria Italia in Bruchhausen-Vilsen — italienische Küche mit frischen Zutaten, in warmer Atmosphäre. Tisch reservieren, Speisekarte ansehen, Feiern & Catering.",
  address: { street: "Engelbergplatz 4", city: "Bruchhausen-Vilsen", postcode: "27305", country: "DE" },
  phone: "04252 4597",
  phoneHref: "tel:+4942524597",
  email: "kontakt@ristorante-pizzeria-italia.com",
  reserveUrl: "https://ristorante-pizzeria-italia.com/reservierungsportal/",
  routeUrl: "https://www.google.com/maps/dir/?api=1&destination=Engelbergplatz+4+27305+Bruchhausen-Vilsen",
  imprintUrl: "https://ristorante-pizzeria-italia.com/Impressum/impressum.html",
  privacyUrl: "https://ristorante-pizzeria-italia.com/Datenschutz/datenschutz.html",
  hours: [
    { days: "Montag", time: "11:30–14:30 · 17:30–22:30" },
    { days: "Dienstag & Mittwoch", time: "Ruhetag" },
    { days: "Donnerstag – Samstag", time: "11:30–14:30 · 17:30–22:30" },
    { days: "Sonntag", time: "11:30–14:00 · 17:00–22:00" },
  ],
} as const;

export const media = {
  video: (n: 1 | 2 | 3 | 4 | 5 | 6) => `/media/video-${n}.mp4`,
  image: (n: 1 | 2 | 3 | 4) => `/media/image-${n}.jpeg`,
} as const;

export const nav = [
  { label: "Willkommen", href: "/#story" },
  { label: "Zutaten", href: "/#ingredients" },
  { label: "Handwerk", href: "/#craft" },
  { label: "Saucen", href: "/#sauces" },
  { label: "Speisekarte", href: "/menu" },
] as const;

export type Callout = {
  id: string;
  title: string;
  note: string;
  /** Ankerpunkt auf dem Film, in % der Bildtafel. */
  at: { x: number; y: number };
  side: "left" | "right";
  /** Scroll-Fenster (0–1), in dem das Label sichtbar ist. */
  window: [number, number];
};

export const samosaCallouts: Callout[] = [
  { id: "teig", title: "Der Teig", note: "Von Hand ausgezogen, dünn in der Mitte, luftig am Rand.", at: { x: 42, y: 44 }, side: "left", window: [0.12, 0.5] },
  { id: "pomodoro", title: "Tomatensauce", note: "Die Grundlage fast jeder Pizza — fruchtig und würzig.", at: { x: 54, y: 50 }, side: "right", window: [0.22, 0.6] },
  { id: "mozzarella", title: "Käse", note: "Geschmolzen, goldbraun, mit Zug.", at: { x: 60, y: 32 }, side: "right", window: [0.32, 0.7] },
  { id: "belag", title: "Der Belag", note: "Schinken, Salami, Champignons, Meeresfrüchte — 21 Pizzen zur Wahl.", at: { x: 41, y: 74 }, side: "left", window: [0.42, 0.8] },
  { id: "kraeuter", title: "Oregano & Basilikum", note: "Zum Schluss, für den Duft Italiens.", at: { x: 62, y: 70 }, side: "right", window: [0.52, 0.9] },
  { id: "ofen", title: "Aus dem Ofen", note: "Knusprig gebacken und sofort serviert.", at: { x: 36, y: 58 }, side: "left", window: [0.62, 0.95] },
];

export type Ingredient = {
  id: string;
  name: string;
  it: string;
  /** Gerichte von der Karte, in denen die Zutat steckt. */
  usedIn: string;
  note: string;
  glyph: "tomato" | "ball" | "leaf" | "olive" | "garlic" | "wedge" | "sprig" | "chili";
  /** Position in der Konstellation, in % der Fläche. */
  at: { x: number; y: number };
};

export const ingredients: Ingredient[] = [
  { id: "pomodoro", name: "Tomate", it: "Pomodoro", usedIn: "Pizza Margherita · Bruschetta · Crema di Pomodoro", note: "Als Sauce, als Suppe, frisch auf geröstetem Brot.", glyph: "tomato", at: { x: 50, y: 18 } },
  { id: "mozzarella", name: "Mozzarella", it: "Mozzarella", usedIn: "Insalata Mozzarella e Pomodore · Melanzone alla Parmegiano", note: "Mild und cremig — kalt zu Tomaten oder goldbraun überbacken.", glyph: "ball", at: { x: 76, y: 30 } },
  { id: "basilico", name: "Basilikum", it: "Basilico", usedIn: "Bruschetta · Insalata Mozzarella e Pomodore", note: "Frisch gezupft, kurz vor dem Servieren.", glyph: "leaf", at: { x: 84, y: 60 } },
  { id: "olio", name: "Olivenöl", it: "Olio d'oliva", usedIn: "Spaghetti Aglio Olio · Gamberoni al Forno", note: "Zum Braten, zum Beträufeln, zum Eintunken.", glyph: "olive", at: { x: 64, y: 82 } },
  { id: "aglio", name: "Knoblauch", it: "Aglio", usedIn: "Pizza Spinat und Knoblauch · Calamari alla Livornese", note: "Sanft angeschwitzt, nie verbrannt.", glyph: "garlic", at: { x: 36, y: 82 } },
  { id: "parmigiano", name: "Parmesan", it: "Parmigiano", usedIn: "Carpaccio · Spaghetti mit Filetspitzen", note: "Frisch gehobelt über Rucola, Carpaccio und Pasta.", glyph: "wedge", at: { x: 16, y: 60 } },
  { id: "origano", name: "Oregano", it: "Origano", usedIn: "Pizza Margherita", note: "Das Kraut, das nach Pizzeria duftet.", glyph: "sprig", at: { x: 24, y: 30 } },
  { id: "peperoncino", name: "Peperoncino", it: "Peperoncino", usedIn: "Arrabbiata · Pizza Inferno · Pizza Diavolo", note: "Für alle, die es pikant mögen.", glyph: "chili", at: { x: 50, y: 50 } },
];

export type Step = {
  no: string;
  title: string;
  it: string;
  body: string;
  ingredient: string;
  duration: string;
  image: 1 | 2 | 3 | 4;
};

export const craftSteps: Step[] = [
  { no: "01", title: "Kneten", it: "Impasto", body: "Mehl, Wasser, Hefe, Salz. Mehr braucht ein guter Pizzateig nicht — nur Hände und Zeit.", ingredient: "Mehl · Hefe · Salz", duration: "Von Hand", image: 2 },
  { no: "02", title: "Ruhen", it: "Riposo", body: "Der Teig darf gehen. Erst dann wird er leicht, luftig und bekömmlich.", ingredient: "Geduld", duration: "Mit Ruhe", image: 3 },
  { no: "03", title: "Ausziehen", it: "Stendere", body: "Kein Nudelholz: Der Teig wird mit den Fingern geformt, damit der Rand schön aufgeht.", ingredient: "Teig", duration: "Mit Gefühl", image: 4 },
  { no: "04", title: "Belegen", it: "Condire", body: "Tomatensauce, Käse und der Belag Ihrer Wahl — jede weitere Zutat ist möglich.", ingredient: "Tomate · Käse", duration: "Großzügig", image: 1 },
  { no: "05", title: "Backen", it: "Infornare", body: "Heiß und schnell, bis der Rand knusprig ist. Dann direkt an Ihren Tisch.", ingredient: "Hitze", duration: "Frisch serviert", image: 2 },
];

export type Sauce = {
  id: string;
  name: string;
  it: string;
  notes: string;
  pairs: string;
  heat: 0 | 1 | 2 | 3;
  tone: string;
};

export const sauces: Sauce[] = [
  { id: "arrabbiata", name: "Arrabbiata", it: "Salsa all'arrabbiata", notes: "Scharfe Tomatensauce mit Knoblauch und Peperoncino.", pairs: "Spaghetti · Pennette", heat: 3, tone: "#b4372a" },
  { id: "bolognese", name: "Bolognese", it: "Ragù", notes: "Kräftige Fleischsauce, lange geschmort.", pairs: "Tortellini al Frac", heat: 0, tone: "#7a3524" },
  { id: "gorgonzola", name: "Gorgonzola", it: "Salsa al gorgonzola", notes: "Cremig, würzig, mit Charakter.", pairs: "Filettini alla Gorgonzola", heat: 0, tone: "#d8c27a" },
  { id: "vinorosso", name: "Rotweinsauce", it: "Salsa al vino rosso", notes: "Dunkel, glänzend, zum Rinderfilet.", pairs: "Filetto al Vino Rosso", heat: 0, tone: "#5a1f2a" },
];

export const menu: { course: string; note?: string; dishes: { name: string; note: string; price: string }[] }[] = [
  {
    course: "Vorspeisen",
    dishes: [
      { name: "Carpaccio", note: "Rohes Rinderfilet, hauchdünn geschnitten.", price: "18,00" },
      { name: "Antipasto Italiano", note: "Gemischte italienische Vorspeisen.", price: "16,00" },
      { name: "Lasagnetta", note: "Carpaccio, Rucola und Parmesan, geschichtet.", price: "13,00" },
      { name: "Bruschetta", note: "Geröstetes Brot mit Tomaten, Knoblauch und Basilikum.", price: "7,00" },
      { name: "Tomaten mit Mozzarella überbacken", note: "", price: "9,00" },
      { name: "Melanzone alla Parmegiano", note: "Auberginen mit Tomaten und Mozzarella überbacken.", price: "13,50" },
    ],
  },
  {
    course: "Zuppe",
    dishes: [
      { name: "Brokkoli-Cremesuppe", note: "Cremige Brokkolisuppe.", price: "7,00" },
      { name: "Crema di Pomodoro", note: "Tomatencremesuppe.", price: "7,00" },
      { name: "Zuppa di Pesce", note: "Fischsuppe.", price: "9,00" },
      { name: "Zuppa di Cipolla", note: "Zwiebelsuppe.", price: "7,00" },
    ],
  },
  {
    course: "Insalate",
    dishes: [
      { name: "Insalata Romantica", note: "Grüner Salat, Tomaten, Gurken, Käse, Ei, Champignons, Schinken.", price: "13,00" },
      { name: "Insalata Mozzarella e Pomodore", note: "Weichkäse mit Tomaten, Basilikum, Olivenöl.", price: "11,00" },
      { name: "Insalata Ulli", note: "Großer gemischter Salat mit getrockneten Tomaten, Parmesan und Artischocken.", price: "14,00" },
      { name: "Insalata Francese", note: "Grüner Salat, Schinken, Champignons, Thunfisch, Artischocken, Oliven, Ei.", price: "13,50" },
      { name: "Insalata Capricciosa", note: "Grüner Salat, Salami, Käse, Thunfisch, Oliven, Paprika, Champignons, Ei.", price: "13,50" },
      { name: "Insalata Roberto", note: "Grüner Salat mit Filetspitzen, Schafskäse, Tomaten.", price: "16,00" },
      { name: "Insalata Italia", note: "Salat, Tomaten, Gurken, Schinken, Salami, Käse, Champignons, Paprika, Ei, Erbsen, Zwiebeln.", price: "14,00" },
      { name: "Insalata Rucola", note: "Gebratene Entenbrustscheiben, getrocknete Tomaten, Paprika, Gurken und Mais.", price: "18,00" },
    ],
  },
  {
    course: "Baguette",
    dishes: [
      { name: "Baguette Italiana", note: "Mit Käse, Schinken, Ananas.", price: "7,80" },
      { name: "Baguette a modo Mio", note: "Mit Käse, Thunfisch, Tomaten, Gurken, Salat, Zwiebeln.", price: "7,80" },
      { name: "Baguette della Mamma", note: "Mit Käse, Salami, Tomaten, Gurken, Salat, Zwiebeln.", price: "7,80" },
      { name: "Baguette alla Romana", note: "Mit Käse, Schinken, Tomaten, Gurken, Salat, Zwiebeln.", price: "7,80" },
      { name: "Baguette „Italy“", note: "Mit Käse, Salami, Schinken, Paprika, Tomaten, Gurken, Salat, Zwiebeln.", price: "7,80" },
      { name: "Baguette Vegetarisch", note: "Paprika, Tomaten, Gurken, Salat, Zwiebeln.", price: "7,80" },
    ],
  },
  {
    course: "Pizza",
    note: "Jede weitere Zutat 1,50 €",
    dishes: [
      { name: "Pizza Margherita", note: "Tomaten, Käse, Oregano.", price: "10,50" },
      { name: "Pizza mit Filetspitzen", note: "Mit Rucola und Parmesan, Tomatensauce.", price: "16,00" },
      { name: "Pizza Prosciutto", note: "Mit Schinken.", price: "11,50" },
      { name: "Pizza Salami", note: "Mit Salami.", price: "11,50" },
      { name: "Pizza Prosciutto e Funghi", note: "Mit Champignons, Schinken.", price: "12,00" },
      { name: "Pizza Tonno e Cipolla", note: "Mit Thunfisch, Zwiebeln.", price: "14,00" },
      { name: "Pizza Salami e Champignon", note: "Mit Salami, Champignons.", price: "12,00" },
      { name: "Pizza Quattro Stagioni", note: "Mit Schinken, Champignons, Salami, Artischocken.", price: "14,50" },
      { name: "Pizza Spinat und Knoblauch", note: "Mit Spinat und Knoblauch.", price: "13,00" },
      { name: "Pizza Pugliese", note: "Mit Auberginen, Zucchini und Knoblauch.", price: "13,50" },
      { name: "Pizza Spinat und Lachs", note: "Mit Tomatensauce.", price: "16,00" },
      { name: "Überraschungspizza", note: "Überraschung des Hauses.", price: "15,00" },
      { name: "Pizza Frutti di Mare", note: "Mit Meeresfrüchten.", price: "15,00" },
      { name: "Pizza Capricciosa", note: "Mit Schinken, Champignons, Sardellen, Oliven, Paprika, Kapern.", price: "13,50" },
      { name: "Pizza Inferno", note: "Mit Salami, Paprika, Kapern, Sardellen, scharfe Peperoni.", price: "13,50" },
      { name: "Pizza Calzone", note: "Mit Schinken und Champignons gefüllt.", price: "13,00" },
      { name: "Pizza Hawaii", note: "Mit Schinken, Ananas.", price: "12,50" },
      { name: "Pizza „Diavolo“", note: "Mit Thunfisch, Schinken, Zwiebeln, Kapern, Knoblauch — pikant.", price: "14,00" },
      { name: "Pizza Gorgonzola", note: "Mit Salami, Gorgonzola, Knoblauch.", price: "14,00" },
      { name: "Pizza della Casa", note: "Mit Thunfisch, Schinken.", price: "13,50" },
      { name: "Pizza Vegetale", note: "Mit Brokkoli, Zwiebeln, frischen Tomaten, Paprika.", price: "13,50" },
    ],
  },
  {
    course: "Pasta",
    dishes: [
      { name: "Spaghetti all'Arrabbiata", note: "Mit scharfer Tomatensauce.", price: "11,00" },
      { name: "Spaghetti Aglio Olio Peperoncino", note: "Mit Knoblauch, Öl, Peperoni, Rucola und Parmesan — pikant.", price: "11,00" },
      { name: "Pasta Fresca", note: "Mit verschiedenen Füllungen.", price: "11,00" },
      { name: "Spaghetti mit Lachssoße und Spinat", note: "Spaghetti mit Lachssoße und Spinat.", price: "14,50" },
      { name: "Spaghetti alla Marinara", note: "Mit Meeresfrüchten, Tomatensauce.", price: "14,00" },
      { name: "Spaghetti mit Scampi", note: "In Zitronensauce, mit Rucola und Parmesan.", price: "15,00" },
      { name: "Spaghetti mit Filetspitzen", note: "Mit Rucola und Parmesan.", price: "15,00" },
      { name: "Tagliatelle Mare e Monti", note: "Bandnudeln mit Krabben, Champignons in Tomatensauce, mit Käse überbacken.", price: "14,00" },
      { name: "Pennette alla Paesana", note: "Mit Schinken, Parmesan, Fleischsauce, Sahne.", price: "11,00" },
      { name: "Pennette all'Arrabbiata", note: "Mit scharfer Tomatensauce.", price: "11,00" },
      { name: "Tortellini alla Panna", note: "Mit Schinken und Sahne.", price: "11,00" },
      { name: "Tortellini al Frac", note: "Mit Schinken, Käse, Sahne, Bolognesesauce.", price: "10,50" },
      { name: "Lasagne al Forno", note: "Gebackene Nudeln.", price: "14,50" },
      { name: "Cannelloni", note: "Gefüllte Teigröllchen.", price: "14,00" },
      { name: "Rigatoni al Forno", note: "Hausspezialität.", price: "13,50" },
      { name: "Rigatoni Pasticciati", note: "Mit Schinken, Ei, Erbsen, Fleischsauce, Käse, überbacken.", price: "13,50" },
      { name: "Rigatoni della Mamma", note: "Mit Gorgonzola, Champignons, Schinken in Sahnesoße, überbacken.", price: "13,50" },
      { name: "Tortellini del Nord", note: "Mit Champignons, Schinken, Sahne, Gorgonzola, überbacken.", price: "13,50" },
      { name: "Tortellini Fantasia", note: "Mit Brokkoli, Erbsen, Zwiebeln, Schinken, mit Käse überbacken.", price: "13,50" },
      { name: "Nudelkombination", note: "Drei Nudelarten mit Sahnesoße, Schinken, Thunfisch, mit Käse überbacken.", price: "14,00" },
    ],
  },
  {
    course: "Pesce",
    note: "In der Saison Muscheln in Tomaten- oder Weinsauce und täglich frische Fischgerichte — sprechen Sie uns an!",
    dishes: [
      { name: "Gamberoni alla Griglia", note: "Gambas, gegrillte Scampis, mit Tagesbeilage.", price: "27,50" },
      { name: "Gamberoni alla Marinara", note: "Gambas mit Meeresfrüchten, scharfe Tomatensoße, mit Tagesbeilage.", price: "28,00" },
      { name: "Calamari alla Livornese", note: "Tintenfisch in Tomaten-Knoblauchsoße, mit Tagesbeilage.", price: "25,00" },
      { name: "Calamari Fritti", note: "Frittierte Tintenfischringe, mit Tagesbeilage.", price: "24,50" },
      { name: "Gamberoni al Forno", note: "Scampi in Öl mit Knoblauch, überbacken, mit Tagesbeilage.", price: "28,00" },
      { name: "Gamberoni al Cartoccio", note: "Scampi in scharfer Sauce überbacken, mit Tagesbeilage.", price: "28,00" },
      { name: "Salmone alla Griglia", note: "Lachs gegrillt, mit Tagesbeilage.", price: "26,50" },
      { name: "Seeteufel in Currysauce", note: "Mit Gemüse.", price: "28,00" },
    ],
  },
  {
    course: "Carne",
    dishes: [
      { name: "Bistecca alla Pizzaiola", note: "Rumpsteak mit scharfer Tomatensoße, Kapern, Oliven, mit Tagesbeilage.", price: "27,50" },
      { name: "Bistecca alla Griglia", note: "Rumpsteak gegrillt, mit Tagesbeilage.", price: "27,00" },
      { name: "Bistecca al Vino Rosso", note: "Rumpsteak in Rotweinsauce, mit Tagesbeilage.", price: "27,50" },
      { name: "Filetto alla Griglia", note: "Rinderfiletsteak gegrillt, mit Tagesbeilage.", price: "31,00" },
      { name: "Filetto al Vino Rosso", note: "Rinderfilet in Rotweinsauce, mit Tagesbeilage.", price: "31,50" },
      { name: "Filetto al Pepe Verde", note: "Filetsteak mit grünem Pfeffer in Sahnesoße, mit Tagesbeilage.", price: "31,50" },
      { name: "Filetto alla Chef", note: "Filetsteak mit Pfifferlingen in Rahmsoße, mit Tagesbeilage.", price: "31,50" },
      { name: "Saltimbocca alla Romana", note: "Schweinemedaillons mit Käse, Schinken, Salbei, Rigatoni.", price: "24,00" },
      { name: "Filettini alla Gorgonzola", note: "Schweinemedaillons mit Gorgonzolasoße, Rigatoni.", price: "25,00" },
      { name: "Filettini „Italia“", note: "Hausspezialität, mit Rigatoni.", price: "25,00" },
      { name: "Scaloppine al Vino Bianco", note: "Schweinelachssteak in Weißweinsoße, mit Pommes Frites.", price: "24,00" },
      { name: "Cordon Bleu", note: "Gefülltes Fleisch mit Champignons, mit Pommes Frites.", price: "25,00" },
      { name: "Lammkotelett in Senfsauce", note: "Mit Kroketten.", price: "28,00" },
      { name: "Lammcarré in Marsalasauce", note: "Mit Kroketten.", price: "28,00" },
      { name: "Gemischter Grillteller", note: "Variation aus Lammkoteletts, Schweine- und Rindfleisch, mit Pommes Frites.", price: "26,00" },
    ],
  },
  {
    course: "Contorni",
    note: "Tagesbeilage extra — wählbar.",
    dishes: [
      { name: "Spaghetti", note: "Als Beilage.", price: "4,00" },
      { name: "Kroketten", note: "Als Beilage.", price: "4,00" },
      { name: "Pommes Frites", note: "Als Beilage.", price: "4,00" },
      { name: "Gemüse", note: "Als Beilage.", price: "4,00" },
      { name: "Gemischter Salat", note: "Als Beilage.", price: "4,00" },
    ],
  },
  {
    course: "Kinderteller",
    dishes: [
      { name: "Tom & Jerry", note: "Spaghetti mit Tomaten- oder Fleischsoße.", price: "7,00" },
      { name: "Max & Moritz", note: "Kleines Schnitzel mit Pommes und Salat.", price: "7,00" },
      { name: "Pizza Disneyland", note: "Mit Salami oder Schinken oder Champignons.", price: "7,00" },
    ],
  },
  {
    course: "Dolci",
    dishes: [
      { name: "Tiramisu", note: "Löffelbiscuit mit einer Mascarpone-Creme.", price: "" },
      { name: "Cassata", note: "Ricotta, Biscuit und kandierte Früchte.", price: "" },
      { name: "Sorbet di Limone", note: "Cremiges Zitronen-Eissorbet.", price: "" },
      { name: "Tartufo", note: "Italienische Eisspezialität.", price: "" },
      { name: "Crème Brûlée", note: "Eigelb, Sahne, Zucker, Vanille mit Karamellkruste.", price: "" },
      { name: "Panna Cotta", note: "Sahnedessert mit einer Fruchtsauce.", price: "" },
    ],
  },
  {
    course: "Caffè",
    dishes: [
      { name: "Kaffee", note: "Frisch gebrühter Kaffee.", price: "3,00" },
      { name: "Cappuccino", note: "Espresso mit cremigem Milchschaum.", price: "4,00" },
      { name: "Espresso", note: "Klassischer italienischer Espresso.", price: "3,00" },
      { name: "Latte Macchiato", note: "Heiße Milch mit Espresso.", price: "4,50" },
      { name: "Affogato al Caffè", note: "Cremiges Vanilleeis mit heißem Espresso übergossen.", price: "6,00" },
    ],
  },
];
