/* reinart – Nachhilfe fürs Gymnasium
   Profile mit PIN, Fortschritt pro Kind, Schwierigkeit nach Klassenstufe,
   Aufgaben abfotografieren (Tipps → Lösungsweg → eigene Testaufgaben).

   HINWEIS ZUR PIN: Die PIN trennt die Profile und den Lernfortschritt
   voneinander. Sie ist KEIN echter Schutz – alles läuft im Browser und
   wäre für jemanden mit Technikkenntnis umgehbar. */

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = arr => arr[rnd(0, arr.length - 1)];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ggt(a, b) { return b === 0 ? Math.abs(a) : ggt(b, a % b); }
function kuerze(z, n) { const t = ggt(z, n) || 1; return [z / t, n / t]; }

/* Wählt aus einem Pool nur die Einträge, die zur Klassenstufe passen.
   Jeder Eintrag trägt `k` = ab welcher Klasse er drankommt. */
function fuerKlasse(pool, klasse) {
  const passend = pool.filter(e => e.k <= klasse);
  return passend.length ? passend : pool;
}

/* ============================================================
   PROFILE
   Alles liegt im Browser. Die PIN trennt die Geschwister voneinander,
   sie ist kein Schutz gegen jemanden, der sich auskennt — muss sie aber
   auch nicht sein: hinter ihr liegt nur der eigene Punktestand.
   ============================================================ */

const profile = [
  { id: 'jonte', name: 'Jonte', klasse: 5, avatar: '🦊', standardPin: '1111' },
  { id: 'bent',  name: 'Bent',  klasse: 8, avatar: '🦅', standardPin: '2222' },
  { id: 'gast',  name: 'Gast',  klasse: 8, avatar: '🦉', standardPin: '0000' }
];

const SPEICHER = 'reinart.v4.';

function ladeDaten(id) {
  try {
    const roh = localStorage.getItem(SPEICHER + id);
    if (roh) return JSON.parse(roh);
  } catch (e) { /* beschädigte Daten ignorieren, neu anfangen */ }
  return { punkte: 0, stats: {}, pin: null };
}

function speichereDaten(id, daten) {
  localStorage.setItem(SPEICHER + id, JSON.stringify(daten));
}

function pinVon(p) {
  return ladeDaten(p.id).pin || p.standardPin;
}

/* ============================================================
   AUFGABEN-GENERATOREN   gen(klasse) -> Aufgabe
   ============================================================ */

const generatoren = {

  /* ---------- MATHE ---------- */
  'mathe-rechnen'(klasse) {
    /* Die Aufgaben werden so gebaut, dass immer eine ganze Zahl herauskommt —
       sonst rät man an Kommastellen herum statt die Reihenfolge zu üben. */
    const bauformen = klasse <= 6 ? [
      () => { const a = rnd(2, 20), b = rnd(2, 9), c = rnd(2, 9);
              return { text: `${a} + ${b} · ${c}`, wert: a + b * c }; },
      () => { const b = rnd(2, 9), c = rnd(2, 9), a = b * c + rnd(1, 20);
              return { text: `${a} − ${b} · ${c}`, wert: a - b * c }; },
      () => { const a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 9), d = rnd(2, 9);
              return { text: `${a} · ${b} + ${c} · ${d}`, wert: a * b + c * d }; },
      () => { const b = rnd(2, 9), k = rnd(2, 9), a = b * k, c = rnd(2, 20);
              return { text: `${a} : ${b} + ${c}`, wert: k + c }; },
      () => { const a = rnd(11, 99), b = rnd(11, 99);
              return { text: `${a} · ${b}`, wert: a * b }; }
    ] : [
      () => { const a = rnd(2, 15), b = rnd(2, 15), c = rnd(2, 9);
              return { text: `(${a} + ${b}) · ${c}`, wert: (a + b) * c }; },
      () => { const a = rnd(2, 12), b = rnd(5, 20), c = rnd(1, 4);
              return { text: `${a} · (${b} − ${c})`, wert: a * (b - c) }; },
      () => { const b = rnd(2, 6), c = rnd(1, 5), k = rnd(2, 9), a = (b + c) * k;
              return { text: `${a} : (${b} + ${c})`, wert: k }; },
      () => { const a = rnd(-15, -2), b = rnd(2, 12), c = rnd(2, 9);
              return { text: `${a} + ${b} · ${c}`, wert: a + b * c }; },
      () => { const a = rnd(2, 6), b = rnd(2, 9), c = rnd(2, 9);
              return { text: `${a}² + ${b} · ${c}`, wert: a * a + b * c }; }
    ];

    const auf = pick(bauformen)();
    return {
      frage: `Berechne: ${auf.text}`,
      hinweis: 'Denk an die Reihenfolge: Klammern, dann Punkt vor Strich',
      typ: 'text',
      loesung: String(auf.wert),
      erklaerung: `Die Reihenfolge ist entscheidend: zuerst die Klammern, dann Punkt vor Strich ` +
        `(Mal und Geteilt), zuletzt Plus und Minus von links nach rechts. ` +
        `Damit ergibt ${auf.text} genau ${auf.wert}.`
    };
  },

  'mathe-gleichungen'(klasse) {
    let a, x, b;
    if (klasse <= 6) {
      // Kleine, positive Zahlen – Ergebnis immer eine natürliche Zahl.
      a = rnd(2, 9); x = rnd(1, 12); b = rnd(1, 20);
    } else {
      a = rnd(2, 12); x = rnd(-9, 12); b = rnd(-20, 20);
    }
    const c = a * x + b;
    return {
      frage: `Löse die Gleichung nach x auf: ${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${c}`,
      hinweis: 'Gib nur die Zahl ein, z. B. ' + (klasse <= 6 ? '7' : '−3'),
      typ: 'text',
      loesung: String(x),
      erklaerung: `Zuerst ${b < 0 ? 'addierst' : 'subtrahierst'} du auf beiden Seiten ${Math.abs(b)}: ` +
        `${a}x = ${c} ${b < 0 ? '+' : '−'} ${Math.abs(b)} = ${a * x}. ` +
        `Dann teilst du beide Seiten durch ${a}: x = ${a * x} : ${a} = ${x}.`
    };
  },

  'mathe-brueche'(klasse) {
    let n1, d1, n2, d2, op;
    if (klasse <= 6) {
      // Gleicher Nenner oder ein Vielfaches – und das Ergebnis bleibt positiv.
      d1 = rnd(2, 8);
      d2 = pick([d1, d1 * 2]);
      n1 = rnd(1, d1 - 1);
      n2 = rnd(1, d2 - 1);
      op = pick(['+', '−']);
      if (op === '−' && n1 / d1 < n2 / d2) { [n1, d1, n2, d2] = [n2, d2, n1, d1]; }
    } else {
      n1 = rnd(2, 9); d1 = rnd(2, 9); n2 = rnd(2, 9); d2 = rnd(2, 9);
      op = pick(['+', '−', '·']);
    }

    let z, n, weg;
    if (op === '·') {
      z = n1 * n2; n = d1 * d2;
      weg = `Beim Multiplizieren rechnest du Zähler mal Zähler und Nenner mal Nenner: (${n1}·${n2})/(${d1}·${d2}) = ${z}/${n}.`;
    } else if (d1 === d2) {
      z = op === '+' ? n1 + n2 : n1 - n2;
      n = d1;
      weg = `Die Nenner sind schon gleich. Dann ${op === '+' ? 'addierst' : 'subtrahierst'} du nur die Zähler und lässt den Nenner stehen: ${z}/${n}.`;
    } else {
      const gn = d1 * d2;
      z = op === '+' ? n1 * d2 + n2 * d1 : n1 * d2 - n2 * d1;
      n = gn;
      weg = `Du brauchst einen gemeinsamen Nenner: ${d1}·${d2} = ${gn}. ` +
        `Damit wird ${n1}/${d1} zu ${n1 * d2}/${gn} und ${n2}/${d2} zu ${n2 * d1}/${gn}. ` +
        `Jetzt nur noch die Zähler ${op === '+' ? 'addieren' : 'subtrahieren'}: ${z}/${gn}.`;
    }

    const [zk, nk] = kuerze(z, n);
    const loesung = nk === 1 ? String(zk) : `${zk}/${nk}`;
    return {
      frage: `Berechne und kürze so weit wie möglich: ${n1}/${d1} ${op} ${n2}/${d2}`,
      hinweis: 'Schreibe den Bruch als z/n, z. B. 3/4',
      typ: 'text',
      loesung,
      alternativen: [`${z}/${n}`],
      erklaerung: `${weg} Gekürzt ergibt das ${loesung}.`
    };
  },

  'mathe-prozent'(klasse) {
    // Ab Klasse 7 kommt auch die Umkehraufgabe dran: der Grundwert ist gesucht.
    if (klasse >= 7 && Math.random() < 0.4) {
      const satz = pick([5, 10, 20, 25, 40, 50]);
      const grund = rnd(2, 40) * 25;
      const wert = grund * satz / 100;
      return {
        frage: `${satz} % einer Zahl sind ${wert}. Wie groß ist die Zahl (der Grundwert)?`,
        hinweis: 'Nur die Zahl eingeben',
        typ: 'text',
        loesung: String(grund),
        erklaerung: `Hier ist der Grundwert gesucht: G = Prozentwert · 100 : Prozentsatz. ` +
          `Also ${wert} · 100 : ${satz} = ${wert * 100} : ${satz} = ${grund}. ` +
          `Probe: ${satz} % von ${grund} sind ${wert} – passt.`
      };
    }
    const grund = klasse <= 6 ? rnd(2, 20) * 100 : rnd(2, 40) * 25;
    const satz = klasse <= 6 ? pick([10, 20, 25, 50]) : pick([5, 12, 15, 20, 25, 40, 60, 75]);
    const wert = grund * satz / 100;
    return {
      frage: `Wie viel sind ${satz} % von ${grund}?`,
      hinweis: 'Nur die Zahl eingeben',
      typ: 'text',
      loesung: String(wert),
      erklaerung: `Prozentwert = Grundwert · Prozentsatz : 100. ` +
        `Also ${grund} · ${satz} : 100 = ${grund * satz} : 100 = ${wert}. ` +
        `Merke: 1 % von ${grund} sind ${grund / 100}, davon ${satz} Stück ergeben ${wert}.`
    };
  },

  'mathe-binome'() {
    const a = rnd(1, 6), b = rnd(1, 9);
    const vz = pick(['+', '−']);
    const mitte = 2 * a * b;
    const aTeil = a === 1 ? 'x' : `${a}x`;
    const quad = a === 1 ? 'x²' : `${a * a}x²`;
    return {
      frage: `Löse die Klammer auf (binomische Formel): (${aTeil} ${vz} ${b})²`,
      hinweis: 'Schreibe z. B. 4x²+12x+9 (ohne Leerzeichen)',
      typ: 'text',
      loesung: `${quad}${vz === '+' ? '+' : '-'}${mitte}x+${b * b}`,
      alternativen: [`${quad}${vz === '+' ? '+' : '−'}${mitte}x+${b * b}`],
      erklaerung: `${vz === '+' ? 'Erste' : 'Zweite'} binomische Formel: (a ${vz} b)² = a² ${vz} 2ab + b². ` +
        `Hier ist a = ${aTeil} und b = ${b}. Also a² = ${quad}, 2ab = 2·${a}·${b} = ${mitte}x und b² = ${b * b}. ` +
        `Ergebnis: ${quad} ${vz} ${mitte}x + ${b * b}.`
    };
  },

  'mathe-geometrie'(klasse) {
    const grundschule = [
      () => {
        const a = rnd(3, 20), b = rnd(3, 20);
        return {
          frage: `Ein Rechteck ist ${a} cm lang und ${b} cm breit. Wie groß ist seine Fläche in cm²?`,
          hinweis: 'Nur die Zahl',
          typ: 'text',
          loesung: String(a * b),
          erklaerung: `Rechteckfläche: A = Länge · Breite = ${a} · ${b} = ${a * b} cm².`
        };
      },
      () => {
        const a = rnd(3, 20), b = rnd(3, 20);
        return {
          frage: `Ein Rechteck ist ${a} cm lang und ${b} cm breit. Wie groß ist sein Umfang in cm?`,
          hinweis: 'Nur die Zahl',
          typ: 'text',
          loesung: String(2 * (a + b)),
          erklaerung: `Der Umfang ist einmal rundherum: U = 2 · (Länge + Breite) = 2 · (${a} + ${b}) = ${2 * (a + b)} cm.`
        };
      },
      () => {
        const g = rnd(3, 20), h = rnd(2, 20);
        return {
          frage: `Ein Dreieck hat die Grundseite g = ${g} cm und die Höhe h = ${h} cm. Wie groß ist die Fläche in cm²?`,
          hinweis: 'Nur die Zahl, Komma als Punkt',
          typ: 'text',
          loesung: String(g * h / 2),
          erklaerung: `Dreiecksfläche: A = (g · h) : 2 = (${g} · ${h}) : 2 = ${g * h} : 2 = ${g * h / 2} cm². ` +
            `Ein Dreieck ist immer halb so groß wie das Rechteck mit denselben Maßen.`
        };
      }
    ];

    const mittelstufe = [
      () => {
        const r = rnd(2, 12);
        const A = (Math.PI * r * r).toFixed(2);
        return {
          frage: `Ein Kreis hat den Radius r = ${r} cm. Wie groß ist seine Fläche? (auf 2 Nachkommastellen)`,
          hinweis: 'Einheit weglassen, Komma als Punkt, z. B. 50.27',
          typ: 'text',
          loesung: A,
          erklaerung: `Die Kreisfläche berechnest du mit A = π · r². Hier: A = π · ${r}² = π · ${r * r} ≈ ${A} cm².`
        };
      },
      () => {
        const a = rnd(3, 15), b = rnd(3, 15);
        const c = Math.sqrt(a * a + b * b).toFixed(2);
        return {
          frage: `Ein rechtwinkliges Dreieck hat die Katheten a = ${a} cm und b = ${b} cm. Wie lang ist die Hypotenuse c? (2 Nachkommastellen)`,
          hinweis: 'Komma als Punkt, z. B. 12.53',
          typ: 'text',
          loesung: c,
          erklaerung: `Satz des Pythagoras: a² + b² = c². ` +
            `Also c = √(${a}² + ${b}²) = √(${a * a} + ${b * b}) = √${a * a + b * b} ≈ ${c} cm.`
        };
      },
      () => {
        const r = rnd(2, 12), h = rnd(3, 20);
        const V = (Math.PI * r * r * h).toFixed(2);
        return {
          frage: `Ein Zylinder hat den Radius r = ${r} cm und die Höhe h = ${h} cm. Wie groß ist sein Volumen in cm³? (2 Nachkommastellen)`,
          hinweis: 'Komma als Punkt',
          typ: 'text',
          loesung: V,
          erklaerung: `Zylindervolumen: V = π · r² · h = π · ${r}² · ${h} = π · ${r * r * h} ≈ ${V} cm³. ` +
            `Du rechnest also Grundfläche mal Höhe.`
        };
      }
    ];

    return klasse <= 6 ? pick(grundschule)() : pick(mittelstufe.concat(grundschule[2]))();
  },

  /* ---------- DEUTSCH ---------- */
  'deutsch-faelle'(klasse) {
    const saetze = [
      { k: 5, s: '<b>Der Hund</b> bellt laut im Garten.', f: 'Nominativ', w: 'Wer oder was?' },
      { k: 5, s: 'Der Lehrer erklärt <b>dem Schüler</b> die Aufgabe.', f: 'Dativ', w: 'Wem?' },
      { k: 5, s: 'Ich lese <b>ein spannendes Buch</b>.', f: 'Akkusativ', w: 'Wen oder was?' },
      { k: 5, s: 'Das ist das Fahrrad <b>meines Bruders</b>.', f: 'Genitiv', w: 'Wessen?' },
      { k: 5, s: '<b>Die Sonne</b> scheint heute besonders hell.', f: 'Nominativ', w: 'Wer oder was?' },
      { k: 5, s: 'Sie schenkt <b>ihrer Freundin</b> ein Buch.', f: 'Dativ', w: 'Wem?' },
      { k: 7, s: 'Wir besuchen <b>unsere Großeltern</b> am Wochenende.', f: 'Akkusativ', w: 'Wen oder was?' },
      { k: 7, s: 'Der Wagen <b>des Nachbarn</b> steht in der Einfahrt.', f: 'Genitiv', w: 'Wessen?' },
      { k: 8, s: 'Trotz <b>des schlechten Wetters</b> fand das Spiel statt.', f: 'Genitiv', w: 'Wessen? – nach „trotz" steht der Genitiv' },
      { k: 8, s: 'Der Zeuge widersprach <b>dem Angeklagten</b> deutlich.', f: 'Dativ', w: 'Wem? – „widersprechen" verlangt den Dativ' }
    ];
    const a = pick(fuerKlasse(saetze, klasse));
    return {
      frage: `In welchem Fall steht der fett gedruckte Satzteil?<br>${a.s}`,
      typ: 'auswahl',
      optionen: shuffle(['Nominativ', 'Genitiv', 'Dativ', 'Akkusativ']),
      loesung: a.f,
      erklaerung: `Richtig ist der <b>${a.f}</b>. Du erkennst ihn an der Frageprobe: „${a.w}" – ` +
        `stelle diese Frage an den Satz, und der gesuchte Satzteil ist die Antwort.`
    };
  },

  'deutsch-rechtschreibung'(klasse) {
    const paare = [
      { k: 5, r: 'das Fahrrad', f: 'das Farrad', e: 'Das „h" in „Fahr-" ist ein Dehnungs-h und gehört zum Wortstamm von „fahren".' },
      { k: 5, r: 'seit gestern', f: 'seid gestern', e: '„seit" mit t bezeichnet Zeit. „seid" mit d ist die Form von „sein" (ihr seid).' },
      { k: 5, r: 'das heißt', f: 'das heisst', e: 'Nach dem Doppellaut „ei" steht ß, nicht ss.' },
      { k: 5, r: 'Ich nehme das Rad, das dort steht.', f: 'Ich nehme das Rad, dass dort steht.', e: 'Wenn du „welches" einsetzen kannst, ist es das Relativpronomen „das" mit einem s.' },
      { k: 5, r: 'Rad fahren', f: 'radfahren', e: 'Nomen und Verb werden getrennt geschrieben, das Nomen groß.' },
      { k: 5, r: 'viel Spaß', f: 'viel Spass', e: 'Nach langem Vokal (a) steht ß.' },
      { k: 7, r: 'wider Erwarten', f: 'wieder Erwarten', e: '„wider" heißt „gegen". „wieder" heißt „nochmal".' },
      { k: 7, r: 'im Allgemeinen', f: 'im allgemeinen', e: 'Nach Präposition mit Artikel wird das Adjektiv substantiviert – also groß.' },
      { k: 8, r: 'des Öfteren', f: 'des öfteren', e: 'Substantiviertes Adjektiv nach Artikel – daher groß.' },
      { k: 8, r: 'auf dem Laufenden', f: 'auf dem laufenden', e: 'Auch hier ist das Adjektiv substantiviert und wird großgeschrieben.' }
    ];
    const a = pick(fuerKlasse(paare, klasse));
    return {
      frage: 'Welche Schreibweise ist richtig?',
      typ: 'auswahl',
      optionen: shuffle([a.r, a.f]),
      loesung: a.r,
      erklaerung: `Richtig ist „${a.r}". ${a.e}`
    };
  },

  'deutsch-wortarten'(klasse) {
    const woerter = [
      { k: 5, w: 'schnell', a: 'Adjektiv', e: 'Es beschreibt, wie etwas ist, und lässt sich steigern (schnell – schneller – am schnellsten).' },
      { k: 5, w: 'laufen', a: 'Verb', e: 'Es beschreibt eine Tätigkeit und lässt sich konjugieren (ich laufe, du läufst).' },
      { k: 5, w: 'der Baum', a: 'Nomen', e: 'Es hat einen Artikel und wird großgeschrieben.' },
      { k: 5, w: 'sie', a: 'Pronomen', e: 'Es steht stellvertretend für ein Nomen.' },
      { k: 5, w: 'unter', a: 'Präposition', e: 'Es steht vor einem Nomen und beschreibt ein Verhältnis (unter dem Tisch).' },
      { k: 7, w: 'die Freiheit', a: 'Nomen', e: 'Die Endung „-heit" macht aus einem Adjektiv ein Nomen.' },
      { k: 7, w: 'aber', a: 'Konjunktion', e: 'Es verbindet zwei Sätze oder Satzteile miteinander.' },
      { k: 7, w: 'immer', a: 'Adverb', e: 'Es bestimmt ein Verb zeitlich näher und ist nicht steigerbar.' }
    ];
    const a = pick(fuerKlasse(woerter, klasse));
    const alle = klasse <= 6
      ? ['Nomen', 'Verb', 'Adjektiv', 'Pronomen', 'Präposition']
      : ['Nomen', 'Verb', 'Adjektiv', 'Adverb', 'Pronomen', 'Präposition', 'Konjunktion'];
    const ablenker = shuffle(alle.filter(o => o !== a.a)).slice(0, 3);
    return {
      frage: `Zu welcher Wortart gehört das Wort „${a.w}"?`,
      typ: 'auswahl',
      optionen: shuffle([a.a, ...ablenker]),
      loesung: a.a,
      erklaerung: `„${a.w}" ist ein <b>${a.a}</b>. ${a.e}`
    };
  },

  /* ---------- ENGLISCH ---------- */
  'englisch-vokabeln'(klasse) {
    const v = [
      { k: 5, de: 'die Schule', en: 'school' }, { k: 5, de: 'der Freund', en: 'friend' },
      { k: 5, de: 'das Frühstück', en: 'breakfast' }, { k: 5, de: 'die Hausaufgaben', en: 'homework' },
      { k: 5, de: 'die Ferien', en: 'holidays' }, { k: 5, de: 'das Wetter', en: 'weather' },
      { k: 5, de: 'das Tier', en: 'animal' }, { k: 5, de: 'die Stadt', en: 'city' },
      { k: 5, de: 'besuchen', en: 'visit' }, { k: 5, de: 'kaufen', en: 'buy' },
      { k: 5, de: 'teuer', en: 'expensive' }, { k: 5, de: 'müde', en: 'tired' },
      { k: 5, de: 'die Küche', en: 'kitchen' }, { k: 5, de: 'gefährlich', en: 'dangerous' },
      { k: 7, de: 'die Umwelt', en: 'environment' }, { k: 7, de: 'die Erfahrung', en: 'experience' },
      { k: 7, de: 'der Vorteil', en: 'advantage' }, { k: 7, de: 'der Nachteil', en: 'disadvantage' },
      { k: 7, de: 'die Entscheidung', en: 'decision' }, { k: 7, de: 'die Möglichkeit', en: 'opportunity' },
      { k: 8, de: 'die Regierung', en: 'government' }, { k: 8, de: 'die Gesellschaft', en: 'society' },
      { k: 8, de: 'die Verantwortung', en: 'responsibility' }, { k: 8, de: 'die Forschung', en: 'research' },
      { k: 8, de: 'die Herausforderung', en: 'challenge' }, { k: 8, de: 'der Beweis', en: 'evidence' },
      { k: 8, de: 'die Bildung', en: 'education' }, { k: 8, de: 'der Einfluss', en: 'influence' }
    ];
    const a = pick(fuerKlasse(v, klasse));
    return {
      frage: `Wie heißt „${a.de}" auf Englisch?`,
      hinweis: 'Groß-/Kleinschreibung egal',
      typ: 'text',
      loesung: a.en,
      erklaerung: `„${a.de}" heißt auf Englisch <b>${a.en}</b>. ` +
        `Schreib dir das Wort am besten in einem ganzen Beispielsatz auf – so merkst du es dir viel besser als isoliert.`
    };
  },

  'englisch-verben'(klasse) {
    const verben = [
      { k: 5, i: 'go', p: 'went', pp: 'gone', de: 'gehen' },
      { k: 5, i: 'see', p: 'saw', pp: 'seen', de: 'sehen' },
      { k: 5, i: 'take', p: 'took', pp: 'taken', de: 'nehmen' },
      { k: 5, i: 'eat', p: 'ate', pp: 'eaten', de: 'essen' },
      { k: 5, i: 'drink', p: 'drank', pp: 'drunk', de: 'trinken' },
      { k: 5, i: 'write', p: 'wrote', pp: 'written', de: 'schreiben' },
      { k: 5, i: 'give', p: 'gave', pp: 'given', de: 'geben' },
      { k: 5, i: 'find', p: 'found', pp: 'found', de: 'finden' },
      { k: 5, i: 'swim', p: 'swam', pp: 'swum', de: 'schwimmen' },
      { k: 7, i: 'bring', p: 'brought', pp: 'brought', de: 'bringen' },
      { k: 7, i: 'think', p: 'thought', pp: 'thought', de: 'denken' },
      { k: 7, i: 'catch', p: 'caught', pp: 'caught', de: 'fangen' },
      { k: 7, i: 'choose', p: 'chose', pp: 'chosen', de: 'wählen' },
      { k: 8, i: 'break', p: 'broke', pp: 'broken', de: 'zerbrechen' },
      { k: 8, i: 'begin', p: 'began', pp: 'begun', de: 'beginnen' },
      { k: 8, i: 'forget', p: 'forgot', pp: 'forgotten', de: 'vergessen' }
    ];
    const a = pick(fuerKlasse(verben, klasse));
    // In Klasse 5 wird meist erst das simple past sicher verlangt.
    const gefragt = klasse <= 6 ? 'past' : pick(['past', 'pp']);
    return {
      frage: gefragt === 'past'
        ? `Wie lautet das <b>simple past</b> von „${a.i}" (${a.de})?`
        : `Wie lautet das <b>past participle</b> (3. Form) von „${a.i}" (${a.de})?`,
      hinweis: 'Nur das eine Wort eingeben',
      typ: 'text',
      loesung: gefragt === 'past' ? a.p : a.pp,
      erklaerung: `Die drei Formen lauten: <b>${a.i} – ${a.p} – ${a.pp}</b> (${a.de}). ` +
        `Das simple past brauchst du für abgeschlossene Handlungen in der Vergangenheit, ` +
        `das past participle für Perfekt (have ${a.pp}) und Passiv.`
    };
  },

  'englisch-zeiten'(klasse) {
    const s = [
      { k: 5, f: 'Look! It ___ outside.', l: 'is raining', o: ['is raining', 'rains', 'rained', 'has rained'], e: 'Present progressive: etwas passiert gerade jetzt. Signalwort ist „Look!".' },
      { k: 5, f: 'They ___ to Spain last summer.', l: 'went', o: ['went', 'have gone', 'go', 'were going'], e: 'Simple past: „last summer" ist ein abgeschlossener Zeitpunkt in der Vergangenheit.' },
      { k: 5, f: 'She ___ to school every day.', l: 'goes', o: ['goes', 'is going', 'went', 'has gone'], e: 'Simple present: „every day" zeigt eine regelmäßige Gewohnheit an.' },
      { k: 7, f: 'I ___ my homework when the phone rang.', l: 'was doing', o: ['was doing', 'did', 'have done', 'do'], e: 'Past progressive: eine laufende Handlung wird von einer kurzen Handlung (rang) unterbrochen.' },
      { k: 7, f: 'She ___ in London since 2019.', l: 'has lived', o: ['has lived', 'lives', 'lived', 'is living'], e: '„since" verlangt das present perfect: die Handlung begann früher und dauert bis heute an.' },
      { k: 8, f: 'By 2030 the company ___ its emissions by half.', l: 'will have reduced', o: ['will have reduced', 'will reduce', 'reduces', 'reduced'], e: 'Future perfect: bis zu einem Zeitpunkt in der Zukunft ist die Handlung abgeschlossen („by 2030").' },
      { k: 8, f: 'He said he ___ the film the day before.', l: 'had seen', o: ['had seen', 'has seen', 'saw', 'was seeing'], e: 'Past perfect: in der indirekten Rede rückt die Zeit eine Stufe zurück (backshift).' }
    ];
    const a = pick(fuerKlasse(s, klasse));
    return {
      frage: `Welche Zeitform passt?<br><i>${a.f}</i>`,
      typ: 'auswahl',
      optionen: shuffle(a.o),
      loesung: a.l,
      erklaerung: `Richtig ist „<b>${a.l}</b>". ${a.e}`
    };
  },

  /* ---------- PHYSIK ---------- */
  'physik-rechnen'() {
    const aufgaben = [
      () => {
        const s = rnd(20, 400), t = rnd(2, 20);
        return {
          frage: `Ein Auto legt ${s} m in ${t} s zurück. Wie groß ist seine Durchschnittsgeschwindigkeit in m/s? (2 Nachkommastellen)`,
          hinweis: 'Komma als Punkt',
          typ: 'text',
          loesung: (s / t).toFixed(2),
          erklaerung: `Geschwindigkeit ist Weg pro Zeit: v = s : t = ${s} m : ${t} s ≈ ${(s / t).toFixed(2)} m/s. ` +
            `Wenn du das in km/h willst, multiplizierst du mit 3,6.`
        };
      },
      () => {
        const U = rnd(3, 230), R = rnd(2, 60);
        return {
          frage: `An einem Widerstand von ${R} Ω liegt eine Spannung von ${U} V an. Wie groß ist die Stromstärke in Ampere? (2 Nachkommastellen)`,
          hinweis: 'Komma als Punkt',
          typ: 'text',
          loesung: (U / R).toFixed(2),
          erklaerung: `Ohmsches Gesetz: U = R · I, also I = U : R = ${U} V : ${R} Ω ≈ ${(U / R).toFixed(2)} A. ` +
            `Merkhilfe: Je größer der Widerstand bei gleicher Spannung, desto kleiner der Strom.`
        };
      },
      () => {
        const m = rnd(1, 90), a = rnd(2, 15);
        return {
          frage: `Ein Körper mit der Masse ${m} kg wird mit ${a} m/s² beschleunigt. Wie groß ist die Kraft in Newton?`,
          hinweis: 'Nur die Zahl',
          typ: 'text',
          loesung: String(m * a),
          erklaerung: `Zweites Newtonsches Gesetz: F = m · a = ${m} kg · ${a} m/s² = ${m * a} N. ` +
            `Ein Newton ist genau die Kraft, die 1 kg mit 1 m/s² beschleunigt.`
        };
      },
      () => {
        const P = rnd(20, 2000), t = rnd(10, 600);
        return {
          frage: `Ein Gerät hat die Leistung ${P} W und läuft ${t} s. Wie viel Energie in Joule verbraucht es?`,
          hinweis: 'Nur die Zahl',
          typ: 'text',
          loesung: String(P * t),
          erklaerung: `Energie ist Leistung mal Zeit: E = P · t = ${P} W · ${t} s = ${P * t} J. 1 Joule = 1 Wattsekunde.`
        };
      }
    ];
    return pick(aufgaben)();
  },

  'physik-einheiten'() {
    const e = [
      { g: 'Kraft', l: 'Newton (N)', o: ['Newton (N)', 'Joule (J)', 'Watt (W)', 'Pascal (Pa)'], x: '1 N = 1 kg·m/s²' },
      { g: 'Energie / Arbeit', l: 'Joule (J)', o: ['Joule (J)', 'Newton (N)', 'Watt (W)', 'Volt (V)'], x: '1 J = 1 N·m = 1 Ws' },
      { g: 'Leistung', l: 'Watt (W)', o: ['Watt (W)', 'Joule (J)', 'Ampere (A)', 'Ohm (Ω)'], x: '1 W = 1 J/s' },
      { g: 'Druck', l: 'Pascal (Pa)', o: ['Pascal (Pa)', 'Newton (N)', 'Joule (J)', 'Watt (W)'], x: '1 Pa = 1 N/m²' },
      { g: 'elektrische Ladung', l: 'Coulomb (C)', o: ['Coulomb (C)', 'Ampere (A)', 'Volt (V)', 'Ohm (Ω)'], x: '1 C = 1 A·s' },
      { g: 'Frequenz', l: 'Hertz (Hz)', o: ['Hertz (Hz)', 'Sekunde (s)', 'Watt (W)', 'Newton (N)'], x: '1 Hz = 1/s' }
    ];
    const a = pick(e);
    return {
      frage: `In welcher Einheit wird <b>${a.g}</b> gemessen?`,
      typ: 'auswahl',
      optionen: shuffle(a.o),
      loesung: a.l,
      erklaerung: `${a.g} misst man in <b>${a.l}</b>. Zusammenhang mit den Basiseinheiten: ${a.x}.`
    };
  },

  /* ---------- BIOLOGIE ---------- */
  'bio-fragen'(klasse) {
    const f = [
      { k: 5, q: 'Welches Merkmal haben alle Säugetiere gemeinsam?', l: 'Sie säugen ihre Jungen mit Milch', o: ['Sie säugen ihre Jungen mit Milch', 'Sie legen Eier', 'Sie haben Schuppen', 'Sie atmen durch Kiemen'], e: 'Namensgebend ist genau das: Säugetiere ernähren ihren Nachwuchs mit Milch aus Drüsen.' },
      { k: 5, q: 'Welcher Teil einer Blütenpflanze nimmt Wasser aus dem Boden auf?', l: 'Die Wurzel', o: ['Die Wurzel', 'Das Blatt', 'Die Blüte', 'Der Stängel'], e: 'Die Wurzel verankert die Pflanze und nimmt Wasser samt Mineralstoffen auf.' },
      { k: 5, q: 'Womit atmen Fische?', l: 'Mit Kiemen', o: ['Mit Kiemen', 'Mit Lungen', 'Mit der Haut allein', 'Mit Tracheen'], e: 'Kiemen holen den im Wasser gelösten Sauerstoff heraus.' },
      { k: 5, q: 'Wie viele Beine haben Insekten?', l: '6', o: ['6', '8', '4', '10'], e: 'Insekten haben immer sechs Beine und drei Körperabschnitte: Kopf, Brust, Hinterleib. Spinnen mit acht Beinen sind keine Insekten.' },
      { k: 7, q: 'Wo in der Pflanzenzelle findet die Fotosynthese statt?', l: 'In den Chloroplasten', o: ['In den Chloroplasten', 'In den Mitochondrien', 'Im Zellkern', 'In den Ribosomen'], e: 'Die Chloroplasten enthalten den grünen Farbstoff Chlorophyll, der das Sonnenlicht einfängt.' },
      { k: 7, q: 'Welche Aufgabe haben die Mitochondrien?', l: 'Energiegewinnung durch Zellatmung', o: ['Energiegewinnung durch Zellatmung', 'Speicherung der Erbinformation', 'Herstellung von Proteinen', 'Abbau von Abfallstoffen'], e: 'Mitochondrien heißen auch „Kraftwerke der Zelle" – hier entsteht ATP, der Energieträger der Zelle.' },
      { k: 7, q: 'Was entsteht bei der Fotosynthese neben Glucose?', l: 'Sauerstoff', o: ['Sauerstoff', 'Kohlenstoffdioxid', 'Stickstoff', 'Wasserstoff'], e: 'Die Gleichung lautet: 6 CO₂ + 6 H₂O + Licht → C₆H₁₂O₆ + 6 O₂. Der Sauerstoff stammt aus dem Wasser.' },
      { k: 7, q: 'Welches Organell besitzt eine Pflanzenzelle, eine Tierzelle aber nicht?', l: 'Zellwand', o: ['Zellwand', 'Zellkern', 'Zellmembran', 'Mitochondrium'], e: 'Pflanzenzellen haben zusätzlich eine feste Zellwand aus Cellulose, Chloroplasten und eine große Vakuole.' },
      { k: 8, q: 'Wie viele Chromosomen hat eine normale menschliche Körperzelle?', l: '46', o: ['46', '23', '48', '92'], e: '46 Chromosomen, also 23 Paare. Keimzellen (Ei und Spermium) haben nur den halben Satz: 23.' },
      { k: 8, q: 'Was bedeutet „dominant" in der Genetik?', l: 'Das Merkmal setzt sich gegenüber dem rezessiven durch', o: ['Das Merkmal setzt sich gegenüber dem rezessiven durch', 'Das Merkmal tritt nur bei reinerbigen Individuen auf', 'Das Merkmal wird nur von der Mutter vererbt', 'Das Merkmal überspringt eine Generation'], e: 'Ein dominantes Allel prägt das Erscheinungsbild schon aus, wenn es nur einmal vorhanden ist (Aa zeigt A).' },
      { k: 8, q: 'Was transportiert das Xylem in einer Pflanze?', l: 'Wasser und Mineralstoffe von der Wurzel nach oben', o: ['Wasser und Mineralstoffe von der Wurzel nach oben', 'Zucker von den Blättern nach unten', 'Sauerstoff aus der Luft', 'Hormone im ganzen Pflanzenkörper'], e: 'Xylem transportiert Wasser aufwärts, Phloem die Zuckerlösung von den Blättern zu allen anderen Teilen.' }
    ];
    const a = pick(fuerKlasse(f, klasse));
    return {
      frage: a.q,
      typ: 'auswahl',
      optionen: shuffle(a.o),
      loesung: a.l,
      erklaerung: `Richtig: <b>${a.l}</b>. ${a.e}`
    };
  }
};

/* ============================================================
   LERNINHALTE – Blöcke tragen `k` = ab welcher Klasse sie erscheinen
   ============================================================ */

const lernbloecke = {
  'mathe-wissen': [
    { k: 5, html: `<h3>Die Rechenreihenfolge</h3>
      <p>Wenn mehrere Rechenzeichen in einer Aufgabe stehen, ist die Reihenfolge festgelegt:</p>
      <ul><li><b>1. Klammern</b> — was in Klammern steht, kommt zuerst dran.</li>
      <li><b>2. Potenzen</b> — z. B. 3².</li>
      <li><b>3. Punkt vor Strich</b> — Mal und Geteilt vor Plus und Minus.</li>
      <li><b>4. Von links nach rechts</b> — bei gleichrangigen Zeichen.</li></ul>
      <div class="example"><b>Beispiel:</b> 3 + 4 · 5 = 3 + 20 = 23 — <i>nicht</i> 7 · 5 = 35.<br>
      Mit Klammern wäre es anders: (3 + 4) · 5 = 7 · 5 = 35.</div>` },
    { k: 5, html: `<h3>Gleichungen lösen – die Grundregel</h3>
      <p>Eine Gleichung ist wie eine Waage. Was du auf der einen Seite machst, musst du auch auf der anderen machen – dann bleibt sie im Gleichgewicht.</p>
      <ul><li>Zuerst alle Zahlen ohne x auf eine Seite bringen (addieren/subtrahieren).</li>
      <li>Dann durch die Zahl vor dem x teilen.</li></ul>
      <div class="example"><b>Beispiel:</b> 5x + 7 = 32 → 5x = 25 → x = 5</div>` },
    { k: 5, html: `<h3>Flächen und Umfang</h3>
      <ul><li>Rechteck: <span class="formula">A = a · b</span>, Umfang <span class="formula">U = 2 · (a + b)</span></li>
      <li>Dreieck: <span class="formula">A = g · h : 2</span></li>
      <li>Quadrat: <span class="formula">A = a · a</span></li></ul>` },
    { k: 5, html: `<h3>Bruchrechnen in vier Sätzen</h3>
      <ul><li><b>Addieren/Subtrahieren:</b> erst auf gemeinsamen Nenner bringen, dann nur die Zähler verrechnen.</li>
      <li><b>Multiplizieren:</b> Zähler mal Zähler, Nenner mal Nenner.</li>
      <li><b>Dividieren:</b> mit dem Kehrwert multiplizieren.</li>
      <li><b>Kürzen:</b> Zähler und Nenner durch dieselbe Zahl teilen.</li></ul>` },
    { k: 5, html: `<h3>Prozentrechnung</h3>
      <p><span class="formula">Prozentwert = Grundwert · Prozentsatz : 100</span></p>
      <p>Umgekehrt: <span class="formula">Grundwert = Prozentwert · 100 : Prozentsatz</span></p>
      <div class="example"><b>Trick:</b> Rechne erst 1 % aus (Grundwert : 100), dann nimmst du das mal den Prozentsatz.</div>` },
    { k: 7, html: `<h3>Binomische Formeln</h3>
      <p><span class="formula">(a + b)² = a² + 2ab + b²</span></p>
      <p><span class="formula">(a − b)² = a² − 2ab + b²</span></p>
      <p><span class="formula">(a + b)(a − b) = a² − b²</span></p>
      <div class="example"><b>Beispiel:</b> (3x + 4)² = 9x² + 24x + 16</div>` },
    { k: 7, html: `<h3>Kreis, Zylinder und Pythagoras</h3>
      <ul><li>Kreis: <span class="formula">A = π · r²</span>, Umfang <span class="formula">U = 2 · π · r</span></li>
      <li>Trapez: <span class="formula">A = (a + c) : 2 · h</span></li>
      <li>Zylinder: <span class="formula">V = π · r² · h</span></li>
      <li>Pythagoras: <span class="formula">a² + b² = c²</span> (nur im rechtwinkligen Dreieck!)</li></ul>` }
  ],

  'deutsch-wissen': [
    { k: 5, html: `<h3>Die vier Fälle mit Frageprobe</h3>
      <ul><li><b>Nominativ</b> – Wer oder was? <i>Der Schüler lernt.</i></li>
      <li><b>Genitiv</b> – Wessen? <i>Das Buch des Schülers.</i></li>
      <li><b>Dativ</b> – Wem? <i>Ich helfe dem Schüler.</i></li>
      <li><b>Akkusativ</b> – Wen oder was? <i>Ich sehe den Schüler.</i></li></ul>
      <div class="example">Wenn du unsicher bist: stelle die Frage laut an den Satz. Der Satzteil, der antwortet, steht im gesuchten Fall.</div>` },
    { k: 5, html: `<h3>„das" oder „dass"?</h3>
      <p>Setze testweise <i>welches</i>, <i>dieses</i> oder <i>jenes</i> ein. Passt eines davon, schreibst du <b>das</b> mit einem s. Passt keines, ist es die Konjunktion <b>dass</b>.</p>
      <div class="example"><b>Beispiel:</b> „Ich glaube, <b>dass</b> es regnet." (kein Ersatz möglich) · „Das Buch, <b>das</b> hier liegt." (= welches)</div>` },
    { k: 5, html: `<h3>Die Wortarten</h3>
      <ul><li><b>Nomen</b> – hat einen Artikel, wird großgeschrieben</li>
      <li><b>Verb</b> – Tätigkeit, lässt sich konjugieren</li>
      <li><b>Adjektiv</b> – beschreibt, lässt sich steigern</li>
      <li><b>Pronomen</b> – steht für ein Nomen (er, sie, mein)</li>
      <li><b>Präposition</b> – Verhältniswort (auf, unter, wegen)</li></ul>` },
    { k: 7, html: `<h3>Aufbau einer Textanalyse</h3>
      <ul><li><b>Einleitung:</b> Titel, Autor, Textsorte, Erscheinungsjahr, Thema in einem Satz.</li>
      <li><b>Inhaltsangabe:</b> knapp, im Präsens, in eigenen Worten, ohne Zitate.</li>
      <li><b>Hauptteil:</b> Sprache, Aufbau und Stilmittel – <i>immer</i> mit Textbeleg und Zeilenangabe.</li>
      <li><b>Schluss:</b> Deutung, Wirkung auf den Leser, eigene begründete Einschätzung.</li></ul>` },
    { k: 7, html: `<h3>Häufige Stilmittel</h3>
      <ul><li><b>Metapher</b> – bildhafter Vergleich ohne „wie": <i>ein Meer aus Menschen</i></li>
      <li><b>Anapher</b> – Wortwiederholung am Satzanfang</li>
      <li><b>Alliteration</b> – gleicher Anfangslaut: <i>Milch macht müde Männer munter</i></li>
      <li><b>Personifikation</b> – Dinge handeln wie Menschen: <i>die Sonne lacht</i></li>
      <li><b>Rhetorische Frage</b> – Frage, die keine Antwort erwartet</li></ul>` }
  ],

  'englisch-wissen': [
    { k: 5, html: `<h3>Simple present oder present progressive?</h3>
      <p><b>Simple present</b> für Gewohnheiten: <i>every day, always, usually, never</i>. → <i>She goes to school every day.</i></p>
      <p><b>Present progressive</b> für das, was gerade läuft: <i>now, at the moment, Look!, Listen!</i> → <i>She is going to school right now.</i></p>` },
    { k: 5, html: `<h3>Simple past bilden</h3>
      <p>Regelmäßige Verben bekommen <b>-ed</b>: <i>play → played, watch → watched</i>.</p>
      <p>Unregelmäßige Verben musst du auswendig lernen: <i>go → went, see → saw, take → took</i>.</p>
      <div class="example">Signalwörter: yesterday, last week, two years ago, in 2019</div>` },
    { k: 7, html: `<h3>Simple Past oder Present Perfect?</h3>
      <p><b>Simple past</b> nutzt du, wenn der Zeitpunkt vorbei und benannt ist: <i>yesterday, last week, in 2019, ago</i>.</p>
      <p><b>Present perfect</b> nutzt du, wenn die Handlung bis in die Gegenwart reicht oder das Ergebnis zählt: <i>since, for, already, yet, never, just, ever</i>.</p>
      <div class="example"><b>Vergleich:</b> „I <b>saw</b> him yesterday." vs. „I <b>have</b> just <b>seen</b> him."</div>` },
    { k: 7, html: `<h3>Die Bedingungssätze (if-clauses)</h3>
      <ul><li><b>Typ I</b> (realistisch): <i>If it rains, I will stay home.</i></li>
      <li><b>Typ II</b> (unwahrscheinlich): <i>If I had time, I would help you.</i></li>
      <li><b>Typ III</b> (unmöglich, Vergangenheit): <i>If I had known, I would have come.</i></li></ul>
      <div class="example">Merke: Im if-Satz steht <b>nie</b> ein „will".</div>` },
    { k: 8, html: `<h3>Nützliche Wendungen für Textproduktion</h3>
      <ul><li>Meinung: <i>In my opinion / From my point of view / I would argue that</i></li>
      <li>Argument ergänzen: <i>Furthermore / Moreover / In addition</i></li>
      <li>Gegenargument: <i>However / On the other hand / Nevertheless</i></li>
      <li>Fazit: <i>All in all / To sum up / In conclusion</i></li></ul>` }
  ],

  'physik-wissen': [
    { k: 7, html: `<h3>Die wichtigsten Formeln der Mittelstufe</h3>
      <ul><li>Geschwindigkeit: <span class="formula">v = s : t</span></li>
      <li>Beschleunigung: <span class="formula">a = Δv : t</span></li>
      <li>Kraft: <span class="formula">F = m · a</span></li>
      <li>Gewichtskraft: <span class="formula">F = m · g</span> mit g ≈ 9,81 m/s²</li>
      <li>Arbeit: <span class="formula">W = F · s</span></li>
      <li>Leistung: <span class="formula">P = W : t</span></li>
      <li>Dichte: <span class="formula">ρ = m : V</span></li>
      <li>Druck: <span class="formula">p = F : A</span></li></ul>` },
    { k: 7, html: `<h3>Elektrizität</h3>
      <ul><li>Ohmsches Gesetz: <span class="formula">U = R · I</span></li>
      <li>Elektrische Leistung: <span class="formula">P = U · I</span></li>
      <li>Reihenschaltung: der Strom ist überall gleich, die Spannungen addieren sich.</li>
      <li>Parallelschaltung: die Spannung ist überall gleich, die Ströme addieren sich.</li></ul>` },
    { k: 7, html: `<h3>So rechnest du sauber mit Einheiten</h3>
      <p>Schreibe immer die Einheit mit. Wenn am Ende die falsche Einheit herauskommt, hast du dich verrechnet – das ist deine beste Selbstkontrolle.</p>
      <div class="example"><b>Beispiel:</b> kg · m/s² ergibt N. Kommt bei einer Kraftaufgabe etwas anderes heraus, stimmt der Ansatz nicht.</div>
      <p>Umrechnung Geschwindigkeit: m/s → km/h mit <b>· 3,6</b>, km/h → m/s mit <b>: 3,6</b>.</p>` }
  ],

  'bio-wissen': [
    { k: 5, html: `<h3>Die Wirbeltierklassen</h3>
      <ul><li><b>Säugetiere</b> – Fell, säugen ihre Jungen, gleichwarm</li>
      <li><b>Vögel</b> – Federn, legen Eier, gleichwarm</li>
      <li><b>Reptilien</b> – Schuppen, legen Eier, wechselwarm</li>
      <li><b>Amphibien</b> – feuchte Haut, Larven im Wasser, wechselwarm</li>
      <li><b>Fische</b> – Schuppen, Kiemen, wechselwarm</li></ul>` },
    { k: 5, html: `<h3>Die Teile einer Blütenpflanze</h3>
      <ul><li><b>Wurzel</b> – verankert, nimmt Wasser und Mineralstoffe auf</li>
      <li><b>Stängel</b> – trägt die Pflanze, transportiert Wasser nach oben</li>
      <li><b>Blatt</b> – hier findet die Fotosynthese statt</li>
      <li><b>Blüte</b> – dient der Fortpflanzung</li></ul>` },
    { k: 7, html: `<h3>Die Zelle im Überblick</h3>
      <ul><li><b>Zellkern</b> – enthält die DNA, steuert die Zelle.</li>
      <li><b>Mitochondrien</b> – Zellatmung, liefern Energie (ATP).</li>
      <li><b>Ribosomen</b> – bauen Proteine zusammen.</li>
      <li><b>Zellmembran</b> – grenzt ab und regelt, was hinein- und hinausgeht.</li>
      <li>Nur bei Pflanzen: <b>Zellwand</b>, <b>Chloroplasten</b>, große <b>Vakuole</b>.</li></ul>` },
    { k: 7, html: `<h3>Fotosynthese und Zellatmung</h3>
      <p>Fotosynthese: <span class="formula">6 CO₂ + 6 H₂O + Licht → C₆H₁₂O₆ + 6 O₂</span></p>
      <p>Zellatmung: <span class="formula">C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + Energie</span></p>
      <div class="example">Die beiden Vorgänge sind genau umgekehrt zueinander. Die Fotosynthese speichert Energie chemisch, die Zellatmung holt sie wieder heraus.</div>` },
    { k: 8, html: `<h3>Genetik – die Grundbegriffe</h3>
      <ul><li><b>Gen</b> – Abschnitt der DNA mit einer Bauanleitung.</li>
      <li><b>Allel</b> – eine Variante eines Gens.</li>
      <li><b>Genotyp</b> – die Erbanlage (z. B. Aa), <b>Phänotyp</b> – das sichtbare Merkmal.</li>
      <li><b>dominant</b> setzt sich durch, <b>rezessiv</b> zeigt sich nur reinerbig (aa).</li>
      <li><b>Mitose</b> – Zellteilung für Wachstum, zwei identische Zellen.</li>
      <li><b>Meiose</b> – Bildung der Keimzellen, halber Chromosomensatz.</li></ul>` }
  ]
};

function lerninhaltFuer(id, klasse) {
  const bloecke = (lernbloecke[id] || []).filter(b => b.k <= klasse);
  return bloecke.map(b => `<div class="learn-block">${b.html}</div>`).join('');
}

/* ============================================================
   FÄCHER – `k` steuert, ab welcher Klasse Fach bzw. Thema erscheint
   ============================================================ */

const faecher = {
  mathe: {
    name: 'Mathe', icon: '📐', k: 5, desc: 'Gleichungen, Brüche, Prozente, Geometrie',
    themen: [
      { id: 'mathe-rechnen', label: 'Rechnen & Punkt vor Strich', k: 5 },
      { id: 'mathe-gleichungen', label: 'Gleichungen', k: 5 },
      { id: 'mathe-brueche', label: 'Bruchrechnen', k: 5 },
      { id: 'mathe-prozent', label: 'Prozentrechnung', k: 5 },
      { id: 'mathe-geometrie', label: 'Geometrie', k: 5 },
      { id: 'mathe-binome', label: 'Binomische Formeln', k: 7 },
      { id: 'mathe-wissen', label: '📘 Nachschlagen', k: 5, lernen: true }
    ]
  },
  deutsch: {
    name: 'Deutsch', icon: '📖', k: 5, desc: 'Grammatik, Rechtschreibung, Textanalyse',
    themen: [
      { id: 'deutsch-faelle', label: 'Die vier Fälle', k: 5 },
      { id: 'deutsch-rechtschreibung', label: 'Rechtschreibung', k: 5 },
      { id: 'deutsch-wortarten', label: 'Wortarten', k: 5 },
      { id: 'deutsch-wissen', label: '📘 Nachschlagen', k: 5, lernen: true }
    ]
  },
  englisch: {
    name: 'Englisch', icon: '🇬🇧', k: 5, desc: 'Vokabeln, Zeiten, unregelmäßige Verben',
    themen: [
      { id: 'englisch-vokabeln', label: 'Vokabeltrainer', k: 5 },
      { id: 'englisch-verben', label: 'Unregelmäßige Verben', k: 5 },
      { id: 'englisch-zeiten', label: 'Zeitformen', k: 5 },
      { id: 'englisch-wissen', label: '📘 Nachschlagen', k: 5, lernen: true }
    ]
  },
  physik: {
    name: 'Physik', icon: '⚡', k: 7, desc: 'Formeln, Einheiten, Mechanik & Elektrik',
    themen: [
      { id: 'physik-rechnen', label: 'Rechenaufgaben', k: 7 },
      { id: 'physik-einheiten', label: 'Einheiten', k: 7 },
      { id: 'physik-wissen', label: '📘 Formelsammlung', k: 7, lernen: true }
    ]
  },
  biologie: {
    name: 'Biologie', icon: '🧬', k: 5, desc: 'Tiere, Pflanzen, Zelle, Genetik',
    themen: [
      { id: 'bio-fragen', label: 'Grundwissen', k: 5 },
      { id: 'bio-wissen', label: '📘 Nachschlagen', k: 5, lernen: true }
    ]
  }
};

/* ============================================================
   ZUSTAND
   ============================================================ */

const state = {
  profil: null,
  daten: null,
  fach: null,
  thema: null,
  aufgabe: null,
  gewaehlt: null,
  beantwortet: false,
  nummer: 0,
  serie: 0
};

/* ============================================================
   ANMELDUNG (rein im Browser)
   ============================================================ */

let pinAuswahl = null;
let pinEingabe = '';

function zeichneProfile() {
  const grid = document.getElementById('profileGrid');
  grid.innerHTML = '';
  profile.forEach(p => {
    const b = document.createElement('button');
    b.className = 'profile-card';
    b.innerHTML = `<span class="profile-avatar">${p.avatar}</span>
      <span class="profile-name">${p.name}</span>
      <span class="profile-klasse">${p.klasse}. Klasse</span>`;
    b.onclick = () => profilWaehlen(p);
    grid.appendChild(b);
  });
}

function profilWaehlen(p) {
  pinAuswahl = p;
  pinEingabe = '';
  document.getElementById('profileGrid').hidden = true;
  document.getElementById('pinBox').hidden = false;
  document.getElementById('pinName').textContent = p.name;
  document.getElementById('pinError').textContent = '';
  zeichnePinDots();
}

function profilAbwaehlen() {
  pinAuswahl = null;
  pinEingabe = '';
  document.getElementById('profileGrid').hidden = false;
  document.getElementById('pinBox').hidden = true;
}

function zeichnePinDots() {
  const box = document.getElementById('pinDots');
  box.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const d = document.createElement('div');
    d.className = 'pin-dot' + (i < pinEingabe.length ? ' filled' : '');
    box.appendChild(d);
  }
}

function pinZiffer(z) {
  if (pinEingabe.length >= 4) return;
  pinEingabe += z;
  document.getElementById('pinError').textContent = '';
  zeichnePinDots();
  if (pinEingabe.length === 4) setTimeout(pinPruefen, 150);
}

function pinLoeschen() {
  pinEingabe = pinEingabe.slice(0, -1);
  zeichnePinDots();
}

function pinPruefen() {
  if (pinEingabe === pinVon(pinAuswahl)) {
    anmelden(pinAuswahl);
  } else {
    document.getElementById('pinError').textContent = 'Falsche PIN. Versuch es noch einmal.';
    pinEingabe = '';
    zeichnePinDots();
  }
}

function zeichnePinPad() {
  const pad = document.getElementById('pinPad');
  pad.innerHTML = '';
  ['1','2','3','4','5','6','7','8','9'].forEach(z => {
    const b = document.createElement('button');
    b.className = 'pin-key';
    b.textContent = z;
    b.onclick = () => pinZiffer(z);
    pad.appendChild(b);
  });
  pad.appendChild(document.createElement('span'));

  const null0 = document.createElement('button');
  null0.className = 'pin-key';
  null0.textContent = '0';
  null0.onclick = () => pinZiffer('0');
  pad.appendChild(null0);

  const del = document.createElement('button');
  del.className = 'pin-key wide';
  del.textContent = '⌫';
  del.onclick = pinLoeschen;
  pad.appendChild(del);
}

function anmelden(p) {
  state.profil = p;
  state.daten = ladeDaten(p.id);

  document.getElementById('topbarRight').hidden = false;
  document.getElementById('userAvatar').textContent = p.avatar;
  document.getElementById('userName').textContent = p.name;
  aktualisierePunkte();

  zeichneStartseite();
  zeigeView('view-home');
}

function abmelden() {
  state.profil = null;
  state.daten = null;
  pinAuswahl = null;
  pinEingabe = '';
  document.getElementById('topbarRight').hidden = true;
  document.getElementById('profileGrid').hidden = false;
  document.getElementById('pinBox').hidden = true;
  document.getElementById('pinChangeMsg').textContent = '';
  document.getElementById('pinAlt').value = '';
  document.getElementById('pinNeu').value = '';
  zeigeView('view-login');
}

function pinAendern() {
  const alt = document.getElementById('pinAlt').value.trim();
  const neu = document.getElementById('pinNeu').value.trim();
  const msg = document.getElementById('pinChangeMsg');

  if (alt !== pinVon(state.profil)) {
    msg.className = 'pin-change-msg no';
    msg.textContent = 'Die alte PIN stimmt nicht.';
    return;
  }
  if (!/^\d{4}$/.test(neu)) {
    msg.className = 'pin-change-msg no';
    msg.textContent = 'Die neue PIN muss aus genau 4 Ziffern bestehen.';
    return;
  }
  state.daten.pin = neu;
  speichereDaten(state.profil.id, state.daten);
  msg.className = 'pin-change-msg ok';
  msg.textContent = 'PIN geändert. Merk sie dir gut!';
  document.getElementById('pinAlt').value = '';
  document.getElementById('pinNeu').value = '';
}

/* ============================================================
   PUNKTE & STATISTIK
   ============================================================ */

function aktualisierePunkte() {
  document.getElementById('scoreValue').textContent = state.daten.punkte;
}

function merkeErgebnis(fachKey, richtig) {
  if (!state.daten.stats[fachKey]) state.daten.stats[fachKey] = { r: 0, f: 0 };
  state.daten.stats[fachKey][richtig ? 'r' : 'f']++;
  if (richtig) state.daten.punkte += 10;
  speichereDaten(state.profil.id, state.daten);
  aktualisierePunkte();
}

function zeichneStatistik() {
  const card = document.getElementById('statsCard');
  const stats = state.daten.stats;
  const keys = Object.keys(stats).filter(k => faecher[k]);

  if (!keys.length) {
    card.innerHTML = `<h3>Deine Statistik</h3>
      <p class="stat-empty">Noch keine Aufgaben gelöst. Leg los – hier siehst du dann, wie gut du wirst!</p>`;
    return;
  }

  let gesamtR = 0, gesamtF = 0;
  const zeilen = keys.map(k => {
    const s = stats[k];
    gesamtR += s.r; gesamtF += s.f;
    const ges = s.r + s.f;
    const quote = Math.round(s.r / ges * 100);
    return `<div class="stat-item">${faecher[k].icon} ${faecher[k].name}<b>${quote} %</b>${s.r} von ${ges} richtig</div>`;
  }).join('');

  const gesamtQuote = Math.round(gesamtR / (gesamtR + gesamtF) * 100);
  card.innerHTML = `<h3>Deine Statistik</h3>
    <div class="stats-row">${zeilen}</div>
    <div class="stat-bar"><span style="width:${gesamtQuote}%"></span></div>
    <p class="stat-empty">Insgesamt ${gesamtR} von ${gesamtR + gesamtF} Aufgaben richtig (${gesamtQuote} %).</p>`;
}

/* ============================================================
   NAVIGATION
   ============================================================ */

function zeigeView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function zeichneStartseite() {
  const p = state.profil;
  document.getElementById('homeGreeting').textContent = `Hallo ${p.name}! 👋`;
  document.getElementById('homeIntro').textContent =
    `Ich bin dein Nachhilfelehrer. Alle Aufgaben sind auf die ${p.klasse}. Klasse abgestimmt – ` +
    `ich erkläre dir jede Lösung Schritt für Schritt.`;

  const grid = document.getElementById('subjectGrid');
  grid.innerHTML = '';
  Object.keys(faecher).filter(k => faecher[k].k <= p.klasse).forEach(key => {
    const f = faecher[key];
    const b = document.createElement('button');
    b.className = 'subject-card';
    b.innerHTML = `<span class="subject-icon">${f.icon}</span>
      <span class="subject-name">${f.name}</span>
      <span class="subject-desc">${f.desc}</span>`;
    b.onclick = () => oeffneFach(key);
    grid.appendChild(b);
  });

  zeichneStatistik();
}

function goHome() {
  state.fach = null;
  zeichneStartseite();
  zeigeView('view-home');
}

function oeffneFach(key) {
  const fach = faecher[key];
  const klasse = state.profil.klasse;
  state.fach = key;
  state.nummer = 0;
  state.serie = 0;

  document.getElementById('subjectHeaderIcon').textContent = fach.icon;
  document.getElementById('subjectHeaderName').textContent = fach.name;
  document.getElementById('klassenBadge').textContent = `${klasse}. Klasse`;

  /* Der Eingabe-Bereich erscheint nur in den Fächern, in denen der Löser
     wirklich rechnen kann. In Deutsch, Englisch und Biologie gäbe es dort
     nichts als eine Absage — dann lieber gar nicht erst anbieten. */
  const themen = [
    ...(EIGENE_AUFGABE_FAECHER[key] ? [{ id: 'eigene', label: '✏️ Eigene Aufgabe', k: 5, eigene: true }] : []),
    ...fach.themen.filter(t => t.k <= klasse)
  ];
  const tabs = document.getElementById('subjectTabs');
  tabs.innerHTML = '';
  themen.forEach((t, i) => {
    const b = document.createElement('button');
    b.className = 'tab' + (i === 0 ? ' active' : '');
    b.textContent = t.label;
    b.onclick = () => waehleThema(t, b);
    tabs.appendChild(b);
  });

  zeigeView('view-subject');
  waehleThema(themen[0], tabs.firstChild);
}

function waehleThema(thema, btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');

  state.thema = thema;
  const practice = document.getElementById('practicePanel');
  const learn = document.getElementById('learnPanel');
  const eigene = document.getElementById('eigenePanel');

  practice.hidden = true;
  learn.hidden = true;
  eigene.hidden = true;

  if (thema.eigene) {
    eigene.hidden = false;
    eigeneVorbereiten();
  } else if (thema.lernen) {
    learn.hidden = false;
    document.getElementById('learnContent').innerHTML =
      lerninhaltFuer(thema.id, state.profil.klasse);
  } else {
    practice.hidden = false;
    state.nummer = 0;
    state.serie = 0;
    nextQuestion();
  }
}

/* ============================================================
   QUIZ
   ============================================================ */

function nextQuestion() {
  const gen = generatoren[state.thema.id];
  if (!gen) return;

  state.aufgabe = gen(state.profil.klasse);
  state.gewaehlt = null;
  state.beantwortet = false;
  state.nummer++;

  document.getElementById('quizCounter').textContent = `Aufgabe ${state.nummer}`;
  document.getElementById('streak').textContent =
    state.serie >= 3 ? `🔥 ${state.serie} richtig in Folge!` : '';

  document.getElementById('questionText').innerHTML = state.aufgabe.frage +
    (state.aufgabe.hinweis ? `<span class="hint">${state.aufgabe.hinweis}</span>` : '');

  document.getElementById('feedback').innerHTML = '';
  const area = document.getElementById('answerArea');
  area.innerHTML = '';
  const checkBtn = document.getElementById('checkBtn');
  checkBtn.disabled = true;

  if (state.aufgabe.typ === 'auswahl') {
    state.aufgabe.optionen.forEach(opt => {
      const b = document.createElement('button');
      b.className = 'option';
      b.innerHTML = opt;
      b.dataset.value = opt;
      b.onclick = () => {
        if (state.beantwortet) return;
        area.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
        b.classList.add('selected');
        state.gewaehlt = opt;
        checkBtn.disabled = false;
      };
      area.appendChild(b);
    });
  } else {
    const input = document.createElement('input');
    input.className = 'text-input';
    input.type = 'text';
    input.placeholder = 'Deine Antwort …';
    input.autocomplete = 'off';
    input.oninput = () => { checkBtn.disabled = input.value.trim() === ''; };
    input.onkeydown = e => {
      if (e.key === 'Enter') {
        if (state.beantwortet) nextQuestion();
        else if (!checkBtn.disabled) checkAnswer();
      }
    };
    area.appendChild(input);
    setTimeout(() => input.focus(), 30);
  }
}

function normalisiere(s) {
  return String(s).toLowerCase().trim()
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .replace(/−/g, '-')
    .replace(/·/g, '*');
}

function istRichtig(eingabe, aufgabe) {
  const kandidaten = [aufgabe.loesung, ...(aufgabe.alternativen || [])];
  const e = normalisiere(eingabe);
  if (kandidaten.some(k => normalisiere(k) === e)) return true;

  const eNum = parseFloat(e);
  if (!Number.isNaN(eNum) && /^-?\d*\.?\d+$/.test(e)) {
    return kandidaten.some(k => {
      const kNum = parseFloat(normalisiere(k));
      return !Number.isNaN(kNum) && Math.abs(kNum - eNum) < 0.005;
    });
  }
  return false;
}

function checkAnswer() {
  if (state.beantwortet) return;

  let eingabe;
  if (state.aufgabe.typ === 'auswahl') {
    eingabe = state.gewaehlt;
    if (eingabe === null) return;
  } else {
    const input = document.querySelector('#answerArea .text-input');
    eingabe = input.value;
    if (!eingabe.trim()) return;
    input.disabled = true;
  }

  state.beantwortet = true;
  const richtig = istRichtig(eingabe, state.aufgabe);

  if (state.aufgabe.typ === 'auswahl') {
    document.querySelectorAll('#answerArea .option').forEach(o => {
      o.disabled = true;
      o.classList.remove('selected');
      if (o.dataset.value === state.aufgabe.loesung) o.classList.add('correct');
      else if (o.dataset.value === eingabe) o.classList.add('wrong');
    });
  }

  const fb = document.getElementById('feedback');
  if (richtig) {
    state.serie++;
    fb.innerHTML = `<div class="feedback-box ok">
      <strong>${pick(['Richtig! 👏', 'Sehr gut! ✅', 'Genau so ist es! 🎯', 'Perfekt gemacht! 🌟'])}</strong>
      <span class="explain">${state.aufgabe.erklaerung}</span></div>`;
  } else {
    state.serie = 0;
    fb.innerHTML = `<div class="feedback-box no">
      <strong>Noch nicht ganz. Die richtige Antwort ist: ${state.aufgabe.loesung}</strong>
      <span class="explain">${state.aufgabe.erklaerung}</span></div>`;
  }

  merkeErgebnis(state.fach, richtig);
  document.getElementById('checkBtn').disabled = true;
  document.getElementById('nextBtn').focus();
}

/* ============================================================
   EIGENE AUFGABE EINGEBEN
   Gerechnet wird komplett hier im Browser (siehe loeser.js).
   Ablauf: Aufgabe → Tipps einzeln aufdeckbar → Lösungsweg → Üben.
   ============================================================ */

/* Pro Fach: Platzhalter, Einleitung und antippbare Beispiele.
   In Mathe und Physik kann der Löser echte Aufgaben ausrechnen; in den
   anderen Fächern erkennt er das Thema und führt zu Erklärung und Übung. */
const EIGENE_AUFGABE_FAECHER = {
  mathe: {
    platzhalter: 'z. B.  3 + 4 · 5   oder   7x + 12 = 54   oder   Bruchrechnen',
    intro: 'Tippe deine Aufgabe ein, so wie sie im Heft steht — ich rechne sie dir Schritt für ' +
           'Schritt vor. Oder gib einfach ein Thema ein, dann zeige ich dir die Erklärung dazu.',
    beispiele: [
      { text: '3 + 4 · 5', label: 'Punkt vor Strich' },
      { text: '(12 + 8) : 4', label: 'Klammern' },
      { text: '34 · 27', label: 'Multiplizieren' },
      { text: '7x + 12 = 54', label: 'Gleichung' },
      { text: '20 % von 250', label: 'Prozentwert' },
      { text: '3/4 + 2/5', label: 'Brüche addieren' },
      { text: '(3x+4)²', label: 'Binomische Formel' },
      { text: 'Pythagoras a = 3, b = 4', label: 'Pythagoras' }
    ]
  },
  physik: {
    platzhalter: 'z. B.  s = 100, t = 20   oder   Einheiten',
    intro: 'Tippe ein, welche Größen gegeben sind — ich suche die passende Formel, setze ein ' +
           'und rechne vor. Oder gib ein Thema ein, dann zeige ich dir die Erklärung dazu.',
    beispiele: [
      { text: 's = 100, t = 20', label: 'Geschwindigkeit' },
      { text: '250 m in 40 s', label: 'ohne Formelzeichen' },
      { text: 'm = 5, a = 3', label: 'Kraft' },
      { text: 'U = 12, R = 4', label: 'Stromstärke' },
      { text: 'P = 60, t = 120', label: 'Energie' },
      { text: 'm = 200, V = 25', label: 'Dichte' },
      { text: 'Einheiten', label: 'Thema' },
      { text: 'Elektrizität', label: 'Thema' }
    ]
  },
  deutsch: {
    platzhalter: 'z. B.  Genitiv   oder   das oder dass',
    intro: 'Gib ein, womit du gerade Probleme hast. Ich zeige dir die Erklärung dazu und ' +
           'lasse dich anschließend gezielt üben.',
    beispiele: [
      { text: 'Die vier Fälle', label: 'Thema' },
      { text: 'Genitiv', label: 'Thema' },
      { text: 'das oder dass', label: 'Thema' },
      { text: 'Rechtschreibung', label: 'Thema' },
      { text: 'Wortarten', label: 'Thema' },
      { text: 'Adjektiv', label: 'Thema' },
      { text: 'Stilmittel', label: 'Thema' },
      { text: 'Textanalyse', label: 'Thema' }
    ]
  },
  englisch: {
    platzhalter: 'z. B.  Present Perfect   oder   unregelmäßige Verben',
    intro: 'Gib ein, womit du gerade Probleme hast. Ich zeige dir die Erklärung dazu und ' +
           'lasse dich anschließend gezielt üben.',
    beispiele: [
      { text: 'Present Perfect', label: 'Thema' },
      { text: 'Simple Past', label: 'Thema' },
      { text: 'Zeiten', label: 'Thema' },
      { text: 'unregelmäßige Verben', label: 'Thema' },
      { text: 'Vokabeln', label: 'Thema' },
      { text: 'if-Sätze', label: 'Thema' },
      { text: 'Progressive', label: 'Thema' },
      { text: 'Textproduktion', label: 'Thema' }
    ]
  },
  biologie: {
    platzhalter: 'z. B.  Fotosynthese   oder   Zelle',
    intro: 'Gib ein, womit du gerade Probleme hast. Ich zeige dir die Erklärung dazu und ' +
           'lasse dich anschließend gezielt üben.',
    beispiele: [
      { text: 'Fotosynthese', label: 'Thema' },
      { text: 'Die Zelle', label: 'Thema' },
      { text: 'Mitochondrien', label: 'Thema' },
      { text: 'Genetik', label: 'Thema' },
      { text: 'Vererbung', label: 'Thema' },
      { text: 'Wirbeltiere', label: 'Thema' },
      { text: 'Pflanzen', label: 'Thema' },
      { text: 'Zellatmung', label: 'Thema' }
    ]
  }
};

/* ============================================================
   THEMENERKENNUNG
   Ordnet eine eingetippte Beschreibung einem Thema zu — und damit
   der passenden Erklärung und den passenden Übungsaufgaben.
   `k` ist wie überall die Klassenstufe, ab der das Thema drankommt.
   ============================================================ */

const THEMEN_INDEX = {
  mathe: [
    /* Achtung bei Stichwörtern: "rechnen" wäre in "bruchrechnen" enthalten und
       würde es überstimmen, weil das längste Stichwort gewinnt. Deshalb hier
       nur eindeutige Begriffe. */
    { name: 'Rechenreihenfolge', k: 5, uebung: 'mathe-rechnen', lernTitel: 'Die Rechenreihenfolge',
      woerter: ['punkt vor strich', 'rechenreihenfolge', 'reihenfolge', 'klammer', 'malnehmen', 'mal nehmen',
                'multiplizieren', 'dividieren', 'addieren', 'subtrahieren', 'kopfrechnen', 'grundrechen',
                'grundrechenarten', 'plus', 'minus', 'geteilt', 'zusammenzählen', 'zusammenzaehlen'] },
    { name: 'Gleichungen', k: 5, uebung: 'mathe-gleichungen', lernTitel: 'Gleichungen lösen',
      woerter: ['gleichung', 'nach x', 'x ausrechnen', 'x bestimmen', 'umformen', 'waage', 'unbekannte'] },
    { name: 'Bruchrechnen', k: 5, uebung: 'mathe-brueche', lernTitel: 'Bruchrechnen',
      woerter: ['bruch', 'brüche', 'bruche', 'nenner', 'zähler', 'zaehler', 'kürzen', 'kuerzen', 'erweitern', 'kehrwert'] },
    { name: 'Prozentrechnung', k: 5, uebung: 'mathe-prozent', lernTitel: 'Prozentrechnung',
      woerter: ['prozent', 'rabatt', 'grundwert', 'prozentsatz', 'prozentwert', 'zinsen'] },
    { name: 'Geometrie', k: 5, uebung: 'mathe-geometrie', lernTitel: 'Flächen und Umfang',
      woerter: ['geometrie', 'fläche', 'flaeche', 'umfang', 'rechteck', 'dreieck', 'quadrat'] },
    { name: 'Kreis und Pythagoras', k: 7, uebung: 'mathe-geometrie', lernTitel: 'Kreis, Zylinder und Pythagoras',
      woerter: ['kreis', 'pythagoras', 'hypotenuse', 'kathete', 'zylinder', 'volumen', 'radius'] },
    /* "klammer" gehört bewusst zur Rechenreihenfolge — wer die binomischen
       Formeln meint, schreibt "binom". */
    { name: 'Binomische Formeln', k: 7, uebung: 'mathe-binome', lernTitel: 'Binomische Formeln',
      woerter: ['binom', 'binomisch', 'klammer quadrat', 'quadrat der summe'] }
  ],
  deutsch: [
    { name: 'Die vier Fälle', k: 5, uebung: 'deutsch-faelle', lernTitel: 'Die vier Fälle',
      woerter: ['fall', 'fälle', 'faelle', 'kasus', 'nominativ', 'genitiv', 'dativ', 'akkusativ', 'deklination', 'wessen', 'wem'] },
    { name: 'Rechtschreibung', k: 5, uebung: 'deutsch-rechtschreibung', lernTitel: '„das" oder „dass"',
      woerter: ['rechtschreibung', 'das oder dass', 'dass', 'seit', 'seid', 'großschreibung', 'grossschreibung',
                'kleinschreibung', 'ß', 'diktat', 'zwei s', 'doppel s', 'doppeltes s', 'scharfes s', 'komma'] },
    { name: 'Wortarten', k: 5, uebung: 'deutsch-wortarten', lernTitel: 'Die Wortarten',
      woerter: ['wortart', 'nomen', 'substantiv', 'verb', 'adjektiv', 'adverb', 'pronomen', 'präposition', 'praeposition', 'konjunktion'] },
    { name: 'Textanalyse', k: 7, uebung: null, lernTitel: 'Aufbau einer Textanalyse',
      woerter: ['textanalyse', 'analyse', 'interpretation', 'inhaltsangabe', 'erörterung', 'eroerterung', 'aufsatz'] },
    { name: 'Stilmittel', k: 7, uebung: null, lernTitel: 'Häufige Stilmittel',
      woerter: ['stilmittel', 'metapher', 'anapher', 'alliteration', 'personifikation', 'rhetorisch', 'gedicht', 'lyrik'] }
  ],
  englisch: [
    { name: 'Zeitformen', k: 5, uebung: 'englisch-zeiten', lernTitel: 'Simple present oder present progressive',
      woerter: ['zeit', 'zeiten', 'tense', 'progressive', 'simple present', 'verlaufsform', 'ing'] },
    { name: 'Simple Past', k: 5, uebung: 'englisch-zeiten', lernTitel: 'Simple past bilden',
      woerter: ['simple past', 'vergangenheit', 'past tense', 'ed'] },
    { name: 'Present Perfect', k: 7, uebung: 'englisch-zeiten', lernTitel: 'Simple Past oder Present Perfect',
      woerter: ['present perfect', 'perfect', 'since', 'already', 'yet', 'ever', 'never'] },
    { name: 'Unregelmäßige Verben', k: 5, uebung: 'englisch-verben', lernTitel: 'Simple past bilden',
      woerter: ['unregelmäßig', 'unregelmaessig', 'irregular', 'verb', 'drei formen', 'past participle'] },
    { name: 'Vokabeln', k: 5, uebung: 'englisch-vokabeln', lernTitel: null,
      woerter: ['vokabel', 'wörter', 'woerter', 'übersetzen', 'uebersetzen', 'wortschatz'] },
    { name: 'Bedingungssätze', k: 7, uebung: null, lernTitel: 'Bedingungssätze',
      woerter: ['if', 'conditional', 'bedingungssatz', 'bedingungssätze'] },
    { name: 'Textproduktion', k: 8, uebung: null, lernTitel: 'Nützliche Wendungen',
      woerter: ['textproduktion', 'aufsatz', 'schreiben', 'wendungen', 'comment', 'essay'] }
  ],
  physik: [
    { name: 'Formeln der Mechanik', k: 7, uebung: 'physik-rechnen', lernTitel: 'Die wichtigsten Formeln',
      woerter: ['formel', 'geschwindigkeit', 'kraft', 'arbeit', 'leistung', 'beschleunigung', 'dichte', 'druck', 'newton'] },
    { name: 'Elektrizität', k: 7, uebung: 'physik-rechnen', lernTitel: 'Elektrizität',
      woerter: ['strom', 'spannung', 'widerstand', 'ohm', 'elektr', 'volt', 'ampere', 'schaltung'] },
    { name: 'Einheiten', k: 7, uebung: 'physik-einheiten', lernTitel: 'So rechnest du sauber mit Einheiten',
      woerter: ['einheit', 'umrechnen', 'km/h', 'joule', 'watt', 'pascal'] }
  ],
  biologie: [
    { name: 'Wirbeltiere', k: 5, uebung: 'bio-fragen', lernTitel: 'Die Wirbeltierklassen',
      woerter: ['wirbeltier', 'säugetier', 'saeugetier', 'vogel', 'fisch', 'reptil', 'amphibi', 'tier'] },
    { name: 'Pflanzen', k: 5, uebung: 'bio-fragen', lernTitel: 'Die Teile einer Blütenpflanze',
      woerter: ['pflanze', 'wurzel', 'blatt', 'blüte', 'bluete', 'stängel', 'staengel'] },
    { name: 'Die Zelle', k: 7, uebung: 'bio-fragen', lernTitel: 'Die Zelle im Überblick',
      woerter: ['zelle', 'zellkern', 'mitochondri', 'ribosom', 'zellmembran', 'zellwand', 'chloroplast', 'vakuole'] },
    { name: 'Fotosynthese', k: 7, uebung: 'bio-fragen', lernTitel: 'Fotosynthese und Zellatmung',
      woerter: ['fotosynthese', 'photosynthese', 'zellatmung', 'chlorophyll', 'glucose', 'sauerstoff'] },
    { name: 'Genetik', k: 8, uebung: 'bio-fragen', lernTitel: 'Genetik',
      woerter: ['genetik', 'gen', 'vererbung', 'dominant', 'rezessiv', 'chromosom', 'dna', 'allel', 'mitose', 'meiose'] }
  ]
};

/** Sucht das Thema, das am besten zur Eingabe passt. */
function themaErkennen(eingabe, fach, klasse) {
  const text = String(eingabe || '').toLowerCase().trim();
  if (!text) return null;

  const kandidaten = (THEMEN_INDEX[fach] || []).filter(t => t.k <= klasse);
  let bestes = null, besteLaenge = 0;

  for (const thema of kandidaten) {
    for (const wort of thema.woerter) {
      // Das längste passende Stichwort gewinnt — "present perfect" schlägt "perfect"
      if (text.includes(wort) && wort.length > besteLaenge) {
        bestes = thema;
        besteLaenge = wort.length;
      }
    }
  }
  return bestes;
}

/** Holt den passenden Erklärblock aus dem Nachschlage-Bereich. */
function lernblockFinden(fach, titelTeil, klasse) {
  if (!titelTeil) return null;
  const id = { mathe: 'mathe-wissen', deutsch: 'deutsch-wissen', englisch: 'englisch-wissen',
               physik: 'physik-wissen', biologie: 'bio-wissen' }[fach];
  const block = (lernbloecke[id] || [])
    .filter(b => b.k <= klasse)
    .find(b => b.html.toLowerCase().includes(titelTeil.toLowerCase()));
  return block ? `<div class="learn-block">${block.html}</div>` : null;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let tippZaehler = 0;

let eigene = { ergebnis: null, punkteVergeben: false };

function eigeneVorbereiten() {
  const konfig = EIGENE_AUFGABE_FAECHER[state.fach];
  if (!konfig) return;

  eigene = { ergebnis: null, punkteVergeben: false };
  tippZaehler = 0;

  document.getElementById('eigeneErgebnis').innerHTML = '';
  document.getElementById('antwortFeedback').innerHTML = '';
  document.getElementById('antwortBereich').hidden = true;
  document.getElementById('wegSofortBtn').hidden = true;
  document.getElementById('beispielBereich').hidden = false;
  document.getElementById('eigeneAntwort').value = '';
  document.getElementById('eigeneBtn').textContent = 'Aufgabe übernehmen';

  const feld = document.getElementById('eigeneEingabe');
  feld.value = '';
  feld.disabled = false;
  feld.placeholder = konfig.platzhalter;

  document.getElementById('eigeneTitel').textContent =
    `Deine ${faecher[state.fach].name}-Aufgabe eingeben`;
  document.getElementById('eigeneIntro').textContent = konfig.intro;

  const liste = document.getElementById('beispielListe');
  liste.innerHTML = '';
  konfig.beispiele.forEach(b => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'beispiel-chip';
    btn.textContent = b.text;
    btn.title = b.label;
    btn.onclick = () => { feld.value = b.text; aufgabeUebernehmen(); };
    liste.appendChild(btn);
  });
}

/** Schritt 1: Aufgabe entgegennehmen und das Lösungsfeld freischalten. */
function aufgabeUebernehmen() {
  const eingabe = document.getElementById('eigeneEingabe').value;
  const ziel = document.getElementById('eigeneErgebnis');
  const klasse = state.profil.klasse;
  tippZaehler = 0;
  ziel.innerHTML = '';
  document.getElementById('antwortFeedback').innerHTML = '';

  const ergebnis = aufgabeLoesen(eingabe, state.fach);
  const nichtGeloest = ergebnis.nichtErkannt || ergebnis.nichtLoesbar;

  if (nichtGeloest) {
    const thema = themaErkennen(eingabe, state.fach, klasse);
    if (thema) { zeigeThemenHilfe(thema, eingabe, klasse, ergebnis.nichtLoesbar); return; }

    if (ergebnis.nichtLoesbar) {
      ziel.innerHTML = `<div class="scan-block">
        <h3>Fast — so kann ich es noch nicht rechnen</h3>
        <p class="scan-intro">${escapeHtml(ergebnis.nichtLoesbar)}</p>
      </div>`;
    } else {
      const themenListe = (THEMEN_INDEX[state.fach] || [])
        .filter(t => t.k <= klasse).map(t => t.name).join(' · ');
      ziel.innerHTML = `<div class="scan-block">
        <h3>Damit kann ich dir nicht helfen</h3>
        <p class="scan-intro">${escapeHtml(ergebnis.nichtErkannt)}</p>
        <p class="scan-hint-note">Zu diesen Themen kann ich dir etwas zeigen:<br>
        <b>${escapeHtml(themenListe)}</b><br>Tippe einfach eins davon ein.</p>
      </div>`;
    }
    return;
  }

  eigene = { ergebnis, punkteVergeben: false };

  /* Aufgaben mit zwei Ergebnissen (Kreis: Fläche und Umfang) lassen sich
     nicht mit einem Feld abfragen — dort geht es direkt zum Lösungsweg. */
  if (!ergebnis.antwort) {
    zeigeTippsUndWeg('Bei dieser Aufgabe gibt es mehrere Ergebnisse — schau dir den Weg direkt an.');
    return;
  }

  document.getElementById('antwortBereich').hidden = false;
  document.getElementById('wegSofortBtn').hidden = false;
  document.getElementById('beispielBereich').hidden = true;
  document.getElementById('eigeneBtn').textContent = 'Ergebnis prüfen';
  document.getElementById('eigeneAntwort').value = '';
  document.getElementById('eigeneAntwort').focus();
}

/** Vergleicht die Eingabe des Kindes mit der berechneten Antwort. */
function antwortStimmt(eingabe, ergebnis) {
  const norm = t => String(t).toLowerCase().replace(/\s/g, '')
    .replace(/,/g, '.').replace(/[−–—]/g, '-').replace(/[·×]/g, '*')
    .replace(/^x=/, '').replace(/^c=/, '').replace(/^ergebnis:?/, '');

  const e = norm(eingabe);
  if (!e) return false;
  const kandidaten = [ergebnis.antwort, ...(ergebnis.antwortAlternativen || [])]
    .filter(Boolean).map(norm);

  if (kandidaten.includes(e)) return true;

  const eZahl = parseFloat(e);
  if (!Number.isNaN(eZahl) && /^-?\d*\.?\d+$/.test(e)) {
    return kandidaten.some(k => {
      const z = parseFloat(k);
      return !Number.isNaN(z) && Math.abs(z - eZahl) < 0.005;
    });
  }
  return false;
}

/** Schritt 2: eigenes Ergebnis prüfen. */
function antwortPruefen() {
  if (!eigene.ergebnis) return;
  const eingabe = document.getElementById('eigeneAntwort').value.trim();
  const rueck = document.getElementById('antwortFeedback');

  if (!eingabe) {
    rueck.innerHTML = `<div class="feedback-box no"><strong>Trag erst dein Ergebnis ein.</strong>
      <span class="explain">Wenn du nicht weiterkommst, klick auf „Ich weiß nicht weiter".</span></div>`;
    return;
  }

  if (antwortStimmt(eingabe, eigene.ergebnis)) {
    if (!eigene.punkteVergeben) {
      merkeErgebnis(state.fach, true);
      eigene.punkteVergeben = true;
    }
    rueck.innerHTML = `<div class="feedback-box ok">
      <strong>${pick(['Richtig! 👏', 'Genau! ✅', 'Perfekt! 🎯', 'Sehr gut! 🌟'])}</strong>
      <span class="explain">${escapeHtml(eigene.ergebnis.ergebnis)} — das stimmt.
      Du kannst dir den Weg trotzdem ansehen, wenn du magst.</span></div>
      <div class="quiz-actions" style="margin-top:12px">
        <button class="btn-ghost" onclick="zeigeTippsUndWeg()">Lösungsweg ansehen</button>
        <button class="btn-ghost" onclick="eigeneVorbereiten()">Neue Aufgabe</button>
      </div>`;
    return;
  }

  rueck.innerHTML = `<div class="feedback-box no">
    <strong>Noch nicht richtig.</strong>
    <span class="explain">Schau dir die Tipps unten an und probier es nochmal —
    dein Ergebnis kannst du einfach überschreiben.</span></div>`;
  zeigeTippsUndWeg();
}

/** Zeigt Tipps und Lösungsweg — nach einem Fehlversuch oder auf Wunsch. */
function zeigeTippsUndWeg(hinweis) {
  const d = eigene.ergebnis;
  if (!d) return;
  const ziel = document.getElementById('eigeneErgebnis');
  tippZaehler = 0;

  const tipps = d.tipps.map((t, i) => `
    <div class="tipp" id="tipp-${i}" hidden><b>Tipp ${i + 1}</b>${escapeHtml(t)}</div>`).join('');

  const schritte = d.schritte.map((s, i) => `
    <div class="schritt">
      <div class="schritt-nr">${i + 1}</div>
      <div class="schritt-text"><b>${escapeHtml(s.titel)}</b><span>${escapeHtml(s.erklaerung)}</span></div>
    </div>`).join('');

  const uebung = d.uebungsthema
    ? `<div class="scan-block">
         <h3>Jetzt selbst üben</h3>
         <p class="scan-hint-note">Aufgaben vom selben Typ — so viele du willst, immer neu.</p>
         <button class="btn-primary" onclick="zumUebungsthema('${d.uebungsthema.fach}','${d.uebungsthema.thema}')">
           ${escapeHtml(d.thema)} üben</button>
       </div>` : '';

  ziel.innerHTML = `
    ${hinweis ? `<p class="scan-hint-note">${escapeHtml(hinweis)}</p>` : ''}
    <div class="scan-block">
      <h3>Tipps</h3>
      <p class="scan-hint-note">Deck immer nur so viel auf, wie du brauchst — probier es nach jedem Tipp nochmal selbst.</p>
      ${tipps}
      <button class="btn-primary" id="tippBtn" onclick="naechsterTipp()">Ersten Tipp zeigen</button>
    </div>

    <div class="scan-block">
      <h3>Lösungsweg</h3>
      <p class="scan-hint-note">Schau hier erst rein, wenn du mit den Tipps nicht weiterkommst.</p>
      <button class="btn-ghost" id="wegBtn" onclick="loesungswegZeigen()">Lösungsweg anzeigen</button>
      <div id="wegInhalt" hidden style="margin-top:16px">
        ${schritte}
        <div class="ergebnis-box">Ergebnis: ${escapeHtml(d.ergebnis)}</div>
      </div>
    </div>

    ${uebung}`;

  ziel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/** Der Knopf wechselt seine Bedeutung: erst Aufgabe, dann Prüfen. */
function eigeneHauptknopf() {
  if (eigene.ergebnis && eigene.ergebnis.antwort) antwortPruefen();
  else aufgabeUebernehmen();
}

/** Zeigt Erklärung und Übungsangebot zu einem erkannten Thema. */
function zeigeThemenHilfe(thema, eingabe, klasse, warnungWennNichtLoesbar) {
  const ziel = document.getElementById('eigeneErgebnis');
  const erklaerung = lernblockFinden(state.fach, thema.lernTitel, klasse);

  const warnung = warnungWennNichtLoesbar
    ? `<div class="tipp" style="margin-bottom:16px"><b>Hinweis</b>${escapeHtml(warnungWennNichtLoesbar)}</div>`
    : '';

  const uebungKnopf = thema.uebung
    ? `<button class="btn-primary" onclick="zumUebungsthema('${state.fach}','${thema.uebung}')">
         ${escapeHtml(thema.name)} üben</button>`
    : `<p class="scan-hint-note">Zu diesem Thema gibt es keine automatischen Übungsaufgaben —
       hier hilft dir die Erklärung oben weiter.</p>`;

  ziel.innerHTML = `
    ${warnung}
    <div class="scan-block">
      <h3>Dein Thema</h3>
      <div class="erkannt-box">
        <span class="label">${escapeHtml(faecher[state.fach].name)}</span>
        ${escapeHtml(thema.name)}
      </div>
    </div>

    ${erklaerung ? `<div class="scan-block">
      <h3>Das musst du dazu wissen</h3>
      ${erklaerung}
    </div>` : ''}

    <div class="scan-block">
      <h3>Jetzt selbst üben</h3>
      <p class="scan-hint-note">Aufgaben zu genau diesem Thema — so viele du willst, immer neu.</p>
      ${uebungKnopf}
    </div>`;

  ziel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function naechsterTipp() {
  const tipp = document.getElementById(`tipp-${tippZaehler}`);
  if (!tipp) return;
  tipp.hidden = false;
  tippZaehler++;

  const btn = document.getElementById('tippBtn');
  const naechster = document.getElementById(`tipp-${tippZaehler}`);
  if (naechster) btn.textContent = `Nächsten Tipp zeigen (${tippZaehler + 1} von 3)`;
  else btn.hidden = true;
}

function loesungswegZeigen() {
  document.getElementById('wegInhalt').hidden = false;
  document.getElementById('wegBtn').hidden = true;
}

/** Springt direkt in die passenden Übungsaufgaben. */
function zumUebungsthema(fachKey, themaId) {
  const fach = faecher[fachKey];
  if (!fach) return;
  oeffneFach(fachKey);
  const themaTab = [...document.querySelectorAll('.tab')]
    .find(t => {
      const passend = fach.themen.find(x => x.id === themaId);
      return passend && t.textContent === passend.label;
    });
  if (themaTab) themaTab.click();
}

/* ============================================================
   START
   ============================================================ */

/* Muss zur Zahl hinter script.js?v= in der index.html passen. */
const APP_VERSION = 14;
const LOESER_ERWARTET = 7;

/* Sichtbare Versionsanzeige + Selbstprüfung.
   Ohne das scheitert eine veraltete Datei stillschweigend: Der Löser fehlt,
   jede Eingabe landet bei "kann ich nicht" — und niemand weiß, warum. */
function versionPruefen() {
  const fuss = document.querySelector('footer p');
  const loeserDa = typeof aufgabeLoesen === 'function';
  const loeserV = typeof LOESER_VERSION !== 'undefined' ? LOESER_VERSION : 0;

  if (!loeserDa || loeserV !== LOESER_ERWARTET) {
    const banner = document.createElement('div');
    banner.className = 'version-warnung';
    banner.innerHTML = `<b>Der Browser zeigt eine veraltete Fassung.</b>
      Lade die Seite neu und halte dabei die Umschalttaste gedrückt
      (Windows: <b>Strg + F5</b>, Mac: <b>Cmd + Umschalt + R</b>).
      <span class="version-detail">Erwartet: Löser ${LOESER_ERWARTET} · geladen: ${loeserDa ? loeserV : 'fehlt ganz'}</span>`;
    document.querySelector('main').prepend(banner);
  }

  if (fuss) {
    fuss.innerHTML += `<br><span class="version-zeile">Version ${APP_VERSION}.${loeserV}</span>`;
  }
}

document.getElementById('eigeneBtn').addEventListener('click', eigeneHauptknopf);
document.getElementById('wegSofortBtn').addEventListener('click', () => zeigeTippsUndWeg());
document.getElementById('eigeneEingabe').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); eigeneHauptknopf(); }
});
document.getElementById('eigeneAntwort').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); antwortPruefen(); }
});

versionPruefen();
zeichneProfile();
zeichnePinPad();
