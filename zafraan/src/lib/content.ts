/* Editorial copy lives here so sections stay pure layout + motion. */

export const site = {
  name: "Zafraan",
  tagline: "House of Indian Gastronomy",
  url: "https://zafraan.example",
  description:
    "Zafraan is a twelve-seat tasting house reinterpreting the royal kitchens of Awadh and Rajputana — a slow, sixteen-course thali composed one ingredient at a time.",
  address: { street: "14 Marylebone Lane", city: "London", postcode: "W1U 2NE", country: "GB" },
  phone: "+44 20 7946 0123",
  email: "table@zafraan.example",
  hours: [
    { days: "Wednesday — Saturday", time: "18:30 — 23:00" },
    { days: "Sunday", time: "13:00 — 16:30" },
  ],
} as const;

export const media = {
  video: (n: 1 | 2 | 3 | 4 | 5 | 6) => `/media/video-${n}.mp4`,
  image: (n: 1 | 2 | 3 | 4) => `/media/image-${n}.jpeg`,
} as const;

export const nav = [
  { label: "Story", href: "/#story" },
  { label: "Ingredients", href: "/#ingredients" },
  { label: "Craft", href: "/#craft" },
  { label: "Sauces", href: "/#sauces" },
  { label: "Menu", href: "/menu" },
] as const;

export type Callout = {
  id: string;
  title: string;
  note: string;
  /** Anchor point on the frame, in % of the stage. */
  at: { x: number; y: number };
  /** Which side the label sits on. */
  side: "left" | "right";
  /** Window of scroll progress (0–1) where the label lives. */
  window: [number, number];
};

export const samosaCallouts: Callout[] = [
  { id: "pastry", title: "Ajwain pastry", note: "Ghee-rubbed, rested twice, rolled to 1.2 mm.", at: { x: 42, y: 44 }, side: "left", window: [0.12, 0.5] },
  { id: "potato", title: "Hand-crushed potato", note: "Kufri Jyoti, steamed in its skin, never mashed.", at: { x: 54, y: 50 }, side: "right", window: [0.22, 0.6] },
  { id: "peas", title: "First-flush peas", note: "Shelled at dawn, blanched for eleven seconds.", at: { x: 60, y: 32 }, side: "right", window: [0.32, 0.7] },
  { id: "cumin", title: "Toasted cumin & coriander", note: "Dry-roasted over charcoal, cracked — not ground.", at: { x: 41, y: 74 }, side: "left", window: [0.42, 0.8] },
  { id: "chili", title: "Green chili & ginger", note: "Brightness first, heat second.", at: { x: 62, y: 70 }, side: "right", window: [0.52, 0.9] },
  { id: "amchur", title: "Amchur & pomegranate", note: "Sour notes that wake the palate for the next course.", at: { x: 36, y: 58 }, side: "left", window: [0.62, 0.95] },
];

export type Ingredient = {
  id: string;
  name: string;
  hindi: string;
  origin: string;
  note: string;
  glyph: "thread" | "pod" | "seed" | "bark" | "star" | "leaf" | "chili" | "root";
  /** Position in the constellation, in % of the field. */
  at: { x: number; y: number };
};

export const ingredients: Ingredient[] = [
  { id: "saffron", name: "Saffron", hindi: "Kesar", origin: "Pampore, Kashmir", note: "Mongra grade, picked before sunrise. Bloomed in warm milk for forty minutes.", glyph: "thread", at: { x: 50, y: 18 } },
  { id: "cardamom", name: "Green cardamom", hindi: "Elaichi", origin: "Idukki, Kerala", note: "Bruised, never powdered, so the oils arrive whole.", glyph: "pod", at: { x: 76, y: 30 } },
  { id: "cumin", name: "Cumin", hindi: "Jeera", origin: "Unjha, Gujarat", note: "Bloomed in smoking ghee until it crackles once — then stopped.", glyph: "seed", at: { x: 84, y: 60 } },
  { id: "cinnamon", name: "True cinnamon", hindi: "Dalchini", origin: "Matale, Sri Lanka", note: "Paper-thin quills, sweeter and softer than cassia.", glyph: "bark", at: { x: 64, y: 82 } },
  { id: "anise", name: "Star anise", hindi: "Chakra phool", origin: "Arunachal Pradesh", note: "One star per pot. It carries the biryani's long finish.", glyph: "star", at: { x: 36, y: 82 } },
  { id: "fenugreek", name: "Fenugreek leaf", hindi: "Kasuri methi", origin: "Kasur, Punjab", note: "Sun-dried, crushed between palms over the makhani.", glyph: "leaf", at: { x: 16, y: 60 } },
  { id: "kashmiri", name: "Kashmiri chili", hindi: "Lal mirch", origin: "Anantnag, Kashmir", note: "All colour, gentle heat. Soaked, seeded, ground to silk.", glyph: "chili", at: { x: 24, y: 30 } },
  { id: "turmeric", name: "Lakadong turmeric", hindi: "Haldi", origin: "Jaintia Hills, Meghalaya", note: "Seven percent curcumin — the brightest root we have found.", glyph: "root", at: { x: 50, y: 50 } },
];

export type Step = {
  no: string;
  title: string;
  hindi: string;
  body: string;
  ingredient: string;
  duration: string;
  image: 1 | 2 | 3 | 4;
};

export const craftSteps: Step[] = [
  { no: "01", title: "Soak", hindi: "Bhigona", body: "Basmati aged two years rests in cold water overnight. Patience here decides the length of every grain tomorrow.", ingredient: "Aged basmati", duration: "12 hours", image: 2 },
  { no: "02", title: "Temper", hindi: "Tadka", body: "Whole spices meet smoking ghee for seconds, not minutes. We listen for the crackle, then take it off the flame.", ingredient: "Cumin · clove · bay", duration: "40 seconds", image: 3 },
  { no: "03", title: "Grind", hindi: "Pisaai", body: "Masalas are ground on a granite sil-batta by hand. Friction, not blades — so nothing ever tastes of heat.", ingredient: "Coriander · mace", duration: "25 minutes", image: 4 },
  { no: "04", title: "Seal", hindi: "Dum", body: "The handi is sealed with dough and buried in embers. Nothing escapes; everything is exchanged.", ingredient: "Saffron milk", duration: "3 hours", image: 1 },
  { no: "05", title: "Rest", hindi: "Thehrav", body: "The final step is restraint. Ten minutes off the coals, lid on, so the aromatics settle back into the rice.", ingredient: "Time", duration: "10 minutes", image: 2 },
];

export type Sauce = {
  id: string;
  name: string;
  hindi: string;
  notes: string;
  pairs: string;
  heat: 0 | 1 | 2 | 3;
  tone: string;
};

export const sauces: Sauce[] = [
  { id: "makhani", name: "Saffron makhani", hindi: "Kesari makhani", notes: "Slow tomato, cultured butter, a breath of fenugreek.", pairs: "Tandoori lamb chop", heat: 1, tone: "#c0602f" },
  { id: "imli", name: "Tamarind & jaggery", hindi: "Imli saunth", notes: "Dark, sour, glossy — reduced over four hours.", pairs: "Ajwain samosa", heat: 0, tone: "#5a2e1f" },
  { id: "hari", name: "Coriander & mint", hindi: "Hari chutney", notes: "Stone-ground to order. Green, cold, alive.", pairs: "Galouti kebab", heat: 2, tone: "#6f7a4f" },
  { id: "lal", name: "Kashmiri chili oil", hindi: "Lal tel", notes: "Mustard oil warmed with whole chilies and asafoetida.", pairs: "Dal Zafraan", heat: 3, tone: "#9c3b26" },
];

export const menu = [
  {
    course: "To begin",
    dishes: [
      { name: "Ajwain samosa", note: "Hand-crushed potato, first-flush peas, tamarind & jaggery", price: "14" },
      { name: "Galouti kebab", note: "Lamb melted with raw papaya, saffron sheermal, mint", price: "18" },
      { name: "Dahi puri", note: "Hung yoghurt, pomegranate, coriander snow", price: "12" },
    ],
  },
  {
    course: "From the handi",
    dishes: [
      { name: "Dal Zafraan", note: "Black lentils, forty-eight hours over embers, Kashmiri chili oil", price: "16" },
      { name: "Nalli nihari", note: "Lamb shank, bone marrow, khameeri roti", price: "38" },
      { name: "Kathal dum biryani", note: "Young jackfruit, two-year basmati, sealed with dough", price: "29" },
    ],
  },
  {
    course: "The royal thali",
    dishes: [
      { name: "Shahi thali", note: "Sixteen small courses composed for the table. Served for two.", price: "145" },
    ],
  },
  {
    course: "To close",
    dishes: [
      { name: "Shahi tukda", note: "Brioche, rabri, pistachio, silver leaf", price: "12" },
      { name: "Kesar kulfi", note: "Saffron, cardamom, falooda, rose", price: "11" },
    ],
  },
] as const;
