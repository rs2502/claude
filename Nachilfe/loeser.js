/* reinart — der lokale Aufgabenlöser.
 *
 * Läuft komplett im Browser. Keine Verbindung nach außen, keine Kosten.
 *
 * Er erkennt die häufigsten Aufgabentypen der Mittelstufe, rechnet sie
 * Schritt für Schritt vor und erzeugt passende Übungsaufgaben dazu.
 * Was er nicht erkennt, sagt er ehrlich — lieber ein klares "das kann ich
 * nicht" als eine erfundene Lösung.
 */

/* ---------- Hilfsmittel ---------- */

function zahl(txt) {
  return parseFloat(String(txt).replace(',', '.'));
}

/** Zahl schön ausgeben: 6 statt 6.00, 2,5 statt 2.5 (deutsches Komma). */
function fmt(n) {
  if (!isFinite(n)) return '—';
  const gerundet = Math.round(n * 10000) / 10000;
  return String(gerundet).replace('.', ',');
}

/** Versucht, eine Dezimalzahl als gekürzten Bruch darzustellen. */
function alsBruch(n) {
  if (Number.isInteger(n)) return null;
  for (let nenner = 2; nenner <= 64; nenner++) {
    const zaehler = n * nenner;
    if (Math.abs(zaehler - Math.round(zaehler)) < 1e-9) {
      const z = Math.round(zaehler);
      const t = ggtL(Math.abs(z), nenner);
      return `${z / t}/${nenner / t}`;
    }
  }
  return null;
}

function ggtL(a, b) { return b === 0 ? a : ggtL(b, a % b); }

/** Eingabe vereinheitlichen: Unicode-Minus, Malzeichen, Komma, Leerzeichen. */
function normalisiereEingabe(text) {
  return String(text)
    .replace(/[−–—]/g, '-')
    .replace(/[·×]/g, '*')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ============================================================
   1. LINEARE GLEICHUNGEN   ax + b = cx + d
   ============================================================ */

/** Wandelt "7x + 12" in { a: 7, b: 12 } um. */
function seiteParsen(text) {
  const t = text.replace(/\s/g, '').replace(/,/g, '.').replace(/\*/g, '');
  if (!t) return null;
  // Terme abtrennen, Vorzeichen bleibt am Term hängen
  const teile = t.match(/[+-]?[^+-]+/g);
  if (!teile) return null;

  let a = 0, b = 0;
  for (const teil of teile) {
    if (teil.includes('x')) {
      const koeff = teil.replace('x', '');
      if (koeff === '' || koeff === '+') a += 1;
      else if (koeff === '-') a -= 1;
      else {
        const w = parseFloat(koeff);
        if (!isFinite(w)) return null;
        a += w;
      }
    } else {
      const w = parseFloat(teil);
      if (!isFinite(w)) return null;
      b += w;
    }
  }
  return { a, b };
}

function loeseGleichung(eingabe) {
  const text = normalisiereEingabe(eingabe);
  if (!/x/i.test(text) || !text.includes('=')) return null;
  if (/[()]/.test(text)) {
    return {
      typ: 'gleichung',
      nichtLoesbar: 'Klammern kann ich noch nicht auflösen. Multipliziere die Klammer zuerst aus und gib die Aufgabe dann nochmal ein.'
    };
  }
  if (/x\s*\^?\s*2|x²/.test(text)) {
    return {
      typ: 'gleichung',
      nichtLoesbar: 'Das ist eine quadratische Gleichung (mit x²). Die kann ich noch nicht — dafür brauchst du die p-q-Formel.'
    };
  }

  const seiten = text.split('=');
  if (seiten.length !== 2) return null;

  const links = seiteParsen(seiten[0]);
  const rechts = seiteParsen(seiten[1]);
  if (!links || !rechts) return null;

  const aGes = links.a - rechts.a;   // x-Anteil, alles nach links
  const bGes = rechts.b - links.b;   // Zahlen, alles nach rechts

  if (aGes === 0) {
    return {
      typ: 'gleichung',
      nichtLoesbar: bGes === 0
        ? 'Diese Gleichung ist für jedes x wahr — sie hat unendlich viele Lösungen.'
        : 'Diese Gleichung hat keine Lösung: das x fällt weg und übrig bleibt eine falsche Aussage.'
    };
  }

  const x = bGes / aGes;
  const schritte = [];

  if (rechts.a !== 0) {
    schritte.push({
      titel: `${fmt(Math.abs(rechts.a))}x auf beiden Seiten ${rechts.a > 0 ? 'abziehen' : 'addieren'}`,
      erklaerung: `Alle x sollen auf eine Seite. Danach steht da: ${fmt(aGes)}x ${links.b >= 0 ? '+' : '-'} ${fmt(Math.abs(links.b))} = ${fmt(rechts.b)}.`
    });
  }
  if (links.b !== 0) {
    schritte.push({
      titel: `${fmt(Math.abs(links.b))} auf beiden Seiten ${links.b > 0 ? 'abziehen' : 'addieren'}`,
      erklaerung: `Jetzt sollen die Zahlen auf die andere Seite. Übrig bleibt: ${fmt(aGes)}x = ${fmt(bGes)}.`
    });
  }
  schritte.push({
    titel: `Durch ${fmt(aGes)} teilen`,
    erklaerung: `Vor dem x steht ${fmt(aGes)}, also teilst du beide Seiten dadurch: x = ${fmt(bGes)} : ${fmt(aGes)} = ${fmt(x)}.`
  });
  schritte.push({
    titel: 'Probe machen',
    erklaerung: `Setze ${fmt(x)} für x ein: ${fmt(links.a)}·${fmt(x)} ${links.b >= 0 ? '+' : '-'} ${fmt(Math.abs(links.b))} = ${fmt(links.a * x + links.b)}. Auf der rechten Seite steht ${fmt(rechts.a * x + rechts.b)}. Passt.`
  });

  const bruch = alsBruch(x);

  return {
    typ: 'gleichung',
    thema: 'Lineare Gleichung',
    aufgabe: text,
    tipps: [
      'Denk an die Waage: Was du auf der einen Seite machst, musst du auch auf der anderen machen. Nur dann bleibt die Gleichung richtig.',
      rechts.a !== 0
        ? 'Bring zuerst alle x auf eine Seite. Ziehe dazu auf beiden Seiten den kleineren x-Term ab.'
        : 'Schaff die Zahl weg, die auf derselben Seite wie das x steht — durch Plus oder Minus auf beiden Seiten.',
      `Am Ende steht ${fmt(aGes)}x = ${fmt(bGes)}. Jetzt nur noch durch die Zahl vor dem x teilen.`
    ],
    schritte,
    ergebnis: `x = ${fmt(x)}${bruch ? ` (als Bruch: ${bruch})` : ''}`,
    antwort: fmt(x),
    antwortAlternativen: [`x=${fmt(x)}`, bruch].filter(Boolean),
    uebungsthema: { fach: 'mathe', thema: 'mathe-gleichungen' }
  };
}

/* ============================================================
   2. PROZENTRECHNUNG
   ============================================================ */

function loeseProzent(eingabe) {
  const t = normalisiereEingabe(eingabe).toLowerCase();

  // a) "Wie viel sind 20 % von 250?"  → Prozentwert gesucht
  let m = t.match(/(\d+[.,]?\d*)\s*(?:%|prozent)\s*von\s*(\d+[.,]?\d*)/);
  if (m) {
    const satz = zahl(m[1]), grund = zahl(m[2]);
    const wert = grund * satz / 100;
    return {
      typ: 'prozent',
      thema: 'Prozentrechnung — Prozentwert',
      aufgabe: `${fmt(satz)} % von ${fmt(grund)}`,
      tipps: [
        'Gesucht ist der Prozentwert. Die Formel lautet: Prozentwert = Grundwert · Prozentsatz : 100.',
        `Rechne zuerst aus, wie viel 1 % ist: ${fmt(grund)} : 100 = ${fmt(grund / 100)}.`,
        `Davon brauchst du ${fmt(satz)} Stück — also ${fmt(grund / 100)} · ${fmt(satz)}.`
      ],
      schritte: [
        { titel: '1 % ausrechnen', erklaerung: `${fmt(grund)} : 100 = ${fmt(grund / 100)}` },
        { titel: `Mal ${fmt(satz)} nehmen`, erklaerung: `${fmt(grund / 100)} · ${fmt(satz)} = ${fmt(wert)}` }
      ],
      ergebnis: `${fmt(satz)} % von ${fmt(grund)} sind ${fmt(wert)}`,
      antwort: fmt(wert),
      uebungsthema: { fach: 'mathe', thema: 'mathe-prozent' }
    };
  }

  // b) "30 sind wie viel Prozent von 120?"  → Prozentsatz gesucht
  m = t.match(/(\d+[.,]?\d*)\s*(?:ist|sind)\s*wie\s*viel\s*(?:%|prozent)\s*von\s*(\d+[.,]?\d*)/);
  if (m) {
    const wert = zahl(m[1]), grund = zahl(m[2]);
    const satz = wert / grund * 100;
    return {
      typ: 'prozent',
      thema: 'Prozentrechnung — Prozentsatz',
      aufgabe: `${fmt(wert)} von ${fmt(grund)} in Prozent`,
      tipps: [
        'Gesucht ist der Prozentsatz. Formel: Prozentsatz = Prozentwert : Grundwert · 100.',
        `Der Grundwert ist das Ganze, hier ${fmt(grund)}. Teile den Anteil dadurch.`,
        `${fmt(wert)} : ${fmt(grund)} = ${fmt(wert / grund)} — das mal 100 ergibt die Prozent.`
      ],
      schritte: [
        { titel: 'Anteil ausrechnen', erklaerung: `${fmt(wert)} : ${fmt(grund)} = ${fmt(wert / grund)}` },
        { titel: 'Mal 100', erklaerung: `${fmt(wert / grund)} · 100 = ${fmt(satz)} %` }
      ],
      ergebnis: `${fmt(wert)} sind ${fmt(satz)} % von ${fmt(grund)}`,
      antwort: fmt(satz),
      antwortAlternativen: [`${fmt(satz)}%`],
      uebungsthema: { fach: 'mathe', thema: 'mathe-prozent' }
    };
  }

  // c) "45 sind 15 % von wie viel?"  → Grundwert gesucht
  m = t.match(/(\d+[.,]?\d*)\s*(?:ist|sind)\s*(\d+[.,]?\d*)\s*(?:%|prozent)\s*von\s*(?:wie\s*viel|welcher\s*zahl)?/);
  if (m) {
    const wert = zahl(m[1]), satz = zahl(m[2]);
    const grund = wert * 100 / satz;
    return {
      typ: 'prozent',
      thema: 'Prozentrechnung — Grundwert',
      aufgabe: `${fmt(wert)} sind ${fmt(satz)} % — wie groß ist das Ganze?`,
      tipps: [
        'Hier ist das Ganze gesucht. Formel: Grundwert = Prozentwert · 100 : Prozentsatz.',
        `Rechne erst aus, wie viel 1 % ist: ${fmt(wert)} : ${fmt(satz)} = ${fmt(wert / satz)}.`,
        'Ein Prozent mal 100 ergibt das Ganze.'
      ],
      schritte: [
        { titel: '1 % ausrechnen', erklaerung: `${fmt(wert)} : ${fmt(satz)} = ${fmt(wert / satz)}` },
        { titel: 'Mal 100', erklaerung: `${fmt(wert / satz)} · 100 = ${fmt(grund)}` },
        { titel: 'Probe', erklaerung: `${fmt(satz)} % von ${fmt(grund)} sind ${fmt(grund * satz / 100)}. Passt.` }
      ],
      ergebnis: `Der Grundwert ist ${fmt(grund)}`,
      antwort: fmt(grund),
      uebungsthema: { fach: 'mathe', thema: 'mathe-prozent' }
    };
  }

  return null;
}

/* ============================================================
   3. BRUCHRECHNUNG
   ============================================================ */

function loeseBruch(eingabe) {
  const t = normalisiereEingabe(eingabe).replace(/\s/g, '');
  const m = t.match(/^(\d+)\/(\d+)([+\-*:])(\d+)\/(\d+)=?$/);
  if (!m) return null;

  const [, z1s, n1s, op, z2s, n2s] = m;
  const z1 = +z1s, n1 = +n1s, z2 = +z2s, n2 = +n2s;
  if (n1 === 0 || n2 === 0) return { typ: 'bruch', nichtLoesbar: 'Ein Nenner darf nicht 0 sein.' };

  let z, n, schritte = [], tipps = [];

  if (op === '*') {
    z = z1 * z2; n = n1 * n2;
    tipps = [
      'Beim Multiplizieren brauchst du keinen gemeinsamen Nenner — das macht es einfacher als beim Addieren.',
      'Rechne Zähler mal Zähler und Nenner mal Nenner.',
      `Also oben ${z1}·${z2} und unten ${n1}·${n2}.`
    ];
    schritte.push({ titel: 'Zähler und Nenner multiplizieren', erklaerung: `(${z1}·${z2}) / (${n1}·${n2}) = ${z}/${n}` });
  } else if (op === ':') {
    z = z1 * n2; n = n1 * z2;
    tipps = [
      'Durch einen Bruch teilen heißt: mit seinem Kehrwert multiplizieren.',
      `Der Kehrwert von ${z2}/${n2} ist ${n2}/${z2} — Zähler und Nenner tauschen.`,
      `Also rechnest du ${z1}/${n1} · ${n2}/${z2}.`
    ];
    schritte.push({ titel: 'Mit dem Kehrwert multiplizieren', erklaerung: `${z1}/${n1} · ${n2}/${z2} = ${z}/${n}` });
  } else {
    const gn = n1 * n2 / ggtL(n1, n2);   // kleinstes gemeinsames Vielfaches
    const f1 = gn / n1, f2 = gn / n2;
    z = op === '+' ? z1 * f1 + z2 * f2 : z1 * f1 - z2 * f2;
    n = gn;
    tipps = [
      'Brüche kann man nur addieren oder subtrahieren, wenn sie denselben Nenner haben.',
      `Der kleinste gemeinsame Nenner von ${n1} und ${n2} ist ${gn}.`,
      `Erweitere beide Brüche darauf, dann rechnest du nur noch mit den Zählern.`
    ];
    schritte.push({ titel: 'Gemeinsamen Nenner finden', erklaerung: `Der kleinste gemeinsame Nenner von ${n1} und ${n2} ist ${gn}.` });
    schritte.push({ titel: 'Beide Brüche erweitern', erklaerung: `${z1}/${n1} = ${z1 * f1}/${gn} und ${z2}/${n2} = ${z2 * f2}/${gn}` });
    schritte.push({ titel: `Zähler ${op === '+' ? 'addieren' : 'subtrahieren'}`, erklaerung: `${z1 * f1} ${op} ${z2 * f2} = ${z}, der Nenner bleibt ${gn}.` });
  }

  const t2 = ggtL(Math.abs(z), Math.abs(n)) || 1;
  const zk = z / t2, nk = n / t2;
  if (t2 > 1) {
    schritte.push({ titel: 'Kürzen', erklaerung: `${z}/${n} lässt sich durch ${t2} kürzen: ${zk}/${nk}` });
  }

  return {
    typ: 'bruch',
    thema: 'Bruchrechnung',
    aufgabe: `${z1}/${n1} ${op === '*' ? '·' : op} ${z2}/${n2}`,
    tipps,
    schritte,
    ergebnis: nk === 1 ? `${zk}` : `${zk}/${nk}`,
    antwort: nk === 1 ? `${zk}` : `${zk}/${nk}`,
    antwortAlternativen: [`${z}/${n}`],
    uebungsthema: { fach: 'mathe', thema: 'mathe-brueche' }
  };
}

/* ============================================================
   4. BINOMISCHE FORMELN
   ============================================================ */

function loeseBinom(eingabe) {
  const t = normalisiereEingabe(eingabe).replace(/\s/g, '');
  const m = t.match(/^\((\d*)x([+-])(\d+)\)(?:²|\^2|\*\*2)=?$/);
  if (!m) return null;

  const a = m[1] === '' ? 1 : +m[1];
  const vz = m[2];
  const b = +m[3];
  const mitte = 2 * a * b;
  const aTeil = a === 1 ? 'x' : `${a}x`;
  const quad = a === 1 ? 'x²' : `${a * a}x²`;

  return {
    typ: 'binom',
    thema: `${vz === '+' ? 'Erste' : 'Zweite'} binomische Formel`,
    aufgabe: `(${aTeil} ${vz} ${b})²`,
    tipps: [
      `Das ist die ${vz === '+' ? 'erste' : 'zweite'} binomische Formel: (a ${vz} b)² = a² ${vz} 2ab + b².`,
      `Hier ist a = ${aTeil} und b = ${b}. Setze das in die Formel ein.`,
      `a² ist ${quad}, b² ist ${b * b}. Fehlt nur noch der mittlere Teil: 2 · ${a} · ${b}.`
    ],
    schritte: [
      { titel: 'a und b bestimmen', erklaerung: `a = ${aTeil}, b = ${b}` },
      { titel: 'a² berechnen', erklaerung: `(${aTeil})² = ${quad}` },
      { titel: '2ab berechnen', erklaerung: `2 · ${a} · ${b} = ${mitte}, also ${mitte}x` },
      { titel: 'b² berechnen', erklaerung: `${b}² = ${b * b}` }
    ],
    ergebnis: `${quad} ${vz} ${mitte}x + ${b * b}`,
    antwort: `${quad}${vz === '+' ? '+' : '-'}${mitte}x+${b * b}`,
    antwortAlternativen: [`${quad}${vz}${mitte}x+${b * b}`],
    uebungsthema: { fach: 'mathe', thema: 'mathe-binome' }
  };
}

/* ============================================================
   5. GEOMETRIE mit konkreten Werten
   ============================================================ */

function loeseGeometrie(eingabe) {
  const t = normalisiereEingabe(eingabe).toLowerCase();

  // Pythagoras: zwei Katheten gegeben
  let m = t.match(/(?:pythagoras|kathete[n]?|rechtwinklig)/) &&
          t.match(/a\s*=\s*(\d+[.,]?\d*).*?b\s*=\s*(\d+[.,]?\d*)/);
  if (m) {
    const a = zahl(m[1]), b = zahl(m[2]);
    const c = Math.sqrt(a * a + b * b);
    return {
      typ: 'geometrie', thema: 'Satz des Pythagoras',
      aufgabe: `Katheten a = ${fmt(a)}, b = ${fmt(b)} — Hypotenuse gesucht`,
      tipps: [
        'Im rechtwinkligen Dreieck gilt der Satz des Pythagoras: a² + b² = c².',
        'c ist die längste Seite, sie liegt dem rechten Winkel gegenüber.',
        `Rechne ${fmt(a)}² + ${fmt(b)}² aus und zieh danach die Wurzel.`
      ],
      schritte: [
        { titel: 'Quadrate berechnen', erklaerung: `${fmt(a)}² = ${fmt(a * a)} und ${fmt(b)}² = ${fmt(b * b)}` },
        { titel: 'Addieren', erklaerung: `${fmt(a * a)} + ${fmt(b * b)} = ${fmt(a * a + b * b)} — das ist c²` },
        { titel: 'Wurzel ziehen', erklaerung: `c = √${fmt(a * a + b * b)} ≈ ${fmt(c)}` }
      ],
      ergebnis: `c ≈ ${fmt(c)}`,
      antwort: fmt(c),
      uebungsthema: { fach: 'mathe', thema: 'mathe-geometrie' }
    };
  }

  // Kreis über den Radius
  m = t.match(/kreis|radius/) && t.match(/r\s*=\s*(\d+[.,]?\d*)|radius\s*(?:von\s*)?(\d+[.,]?\d*)/);
  if (m) {
    const r = zahl(m[1] || m[2]);
    const A = Math.PI * r * r, U = 2 * Math.PI * r;
    return {
      typ: 'geometrie', thema: 'Kreis',
      aufgabe: `Kreis mit Radius r = ${fmt(r)}`,
      tipps: [
        'Für den Kreis brauchst du zwei Formeln: Fläche A = π · r² und Umfang U = 2 · π · r.',
        'π ist ungefähr 3,14159. Der Radius geht in die Fläche quadriert ein.',
        `Rechne zuerst r² = ${fmt(r)}² = ${fmt(r * r)}.`
      ],
      schritte: [
        { titel: 'Radius quadrieren', erklaerung: `${fmt(r)}² = ${fmt(r * r)}` },
        { titel: 'Fläche berechnen', erklaerung: `A = π · ${fmt(r * r)} ≈ ${fmt(A)}` },
        { titel: 'Umfang berechnen', erklaerung: `U = 2 · π · ${fmt(r)} ≈ ${fmt(U)}` }
      ],
      ergebnis: `Fläche ≈ ${fmt(A)}, Umfang ≈ ${fmt(U)}`,
      antwort: null,
      uebungsthema: { fach: 'mathe', thema: 'mathe-geometrie' }
    };
  }

  // Rechteck
  m = t.match(/rechteck/) && t.match(/(\d+[.,]?\d*)\s*(?:cm|m|mm)?\s*(?:lang|mal|x|\*|und)\s*(\d+[.,]?\d*)/);
  if (m) {
    const a = zahl(m[1]), b = zahl(m[2]);
    return {
      typ: 'geometrie', thema: 'Rechteck',
      aufgabe: `Rechteck ${fmt(a)} mal ${fmt(b)}`,
      tipps: [
        'Beim Rechteck gibt es zwei Größen: die Fläche (wie viel Platz drin ist) und den Umfang (einmal rundherum).',
        'Fläche: A = Länge · Breite. Umfang: U = 2 · (Länge + Breite).',
        `Länge ist ${fmt(a)}, Breite ist ${fmt(b)}.`
      ],
      schritte: [
        { titel: 'Fläche', erklaerung: `A = ${fmt(a)} · ${fmt(b)} = ${fmt(a * b)}` },
        { titel: 'Umfang', erklaerung: `U = 2 · (${fmt(a)} + ${fmt(b)}) = 2 · ${fmt(a + b)} = ${fmt(2 * (a + b))}` }
      ],
      ergebnis: `Fläche = ${fmt(a * b)}, Umfang = ${fmt(2 * (a + b))}`,
      antwort: null,
      uebungsthema: { fach: 'mathe', thema: 'mathe-geometrie' }
    };
  }

  return null;
}

/* ============================================================
   6. RECHNEN — Grundrechenarten mit Punkt vor Strich
   Wird immer nur EIN Schritt ausgerechnet, genau wie im Heft.
   ============================================================ */

/* Muss zur Zahl hinter loeser.js?v= in der index.html passen.
   Weicht sie ab, lädt der Browser eine alte Fassung — siehe Fußzeile. */
const LOESER_VERSION = 7;

const OP_ZEICHEN = { '+': '+', '-': '−', '*': '·', '/': ':' };

function tokenisieren(text) {
  const t = text.replace(/\s/g, '')
    .replace(/,/g, '.')
    .replace(/[·×]/g, '*')
    .replace(/[÷:]/g, '/')
    .replace(/²/g, '^2').replace(/³/g, '^3')
    .replace(/[−–—]/g, '-');

  const tokens = [];
  let i = 0;
  while (i < t.length) {
    const c = t[i];
    if (/[\d.]/.test(c)) {
      let z = '';
      while (i < t.length && /[\d.]/.test(t[i])) z += t[i++];
      const w = parseFloat(z);
      if (!isFinite(w)) return null;
      tokens.push({ typ: 'zahl', wert: w });
    } else if ('+-*/^'.includes(c)) {
      tokens.push({ typ: 'op', wert: c }); i++;
    } else if (c === '(' || c === ')') {
      tokens.push({ typ: c }); i++;
    } else {
      return null;    // alles andere gehört nicht in eine Rechnung
    }
  }

  // Vorzeichen-Minus mit der folgenden Zahl verschmelzen: "-5 + 3", "3 · -2"
  const raus = [];
  for (let k = 0; k < tokens.length; k++) {
    const tok = tokens[k];
    const davor = raus[raus.length - 1];
    const istVorzeichen = tok.typ === 'op' && tok.wert === '-' &&
      (!davor || davor.typ === 'op' || davor.typ === '(') &&
      tokens[k + 1] && tokens[k + 1].typ === 'zahl';
    if (istVorzeichen) {
      raus.push({ typ: 'zahl', wert: -tokens[k + 1].wert });
      k++;
    } else {
      raus.push(tok);
    }
  }
  return raus;
}

function tokensZuText(tokens) {
  return tokens.map(t => {
    if (t.typ === 'zahl') return fmt(t.wert);
    if (t.typ === 'op') return ` ${OP_ZEICHEN[t.wert] || t.wert} `;
    return t.typ;
  }).join('').replace(/\s+/g, ' ').trim();
}

function rechne(a, op, b) {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b === 0 ? null : a / b;
    case '^': return Math.pow(a, b);
    default: return null;
  }
}

/** Führt genau eine Rechenoperation aus — die, die als Nächstes dran ist. */
function einRechenschritt(tokens) {
  // 1. Innerste Klammer zuerst
  let auf = -1;
  for (let i = 0; i < tokens.length; i++) if (tokens[i].typ === '(') auf = i;
  if (auf >= 0) {
    let zu = -1;
    for (let i = auf + 1; i < tokens.length; i++) if (tokens[i].typ === ')') { zu = i; break; }
    if (zu < 0) return { fehler: 'Da fehlt eine schließende Klammer.' };

    const innen = tokens.slice(auf + 1, zu);
    if (innen.length === 1 && innen[0].typ === 'zahl') {
      return {
        tokens: [...tokens.slice(0, auf), innen[0], ...tokens.slice(zu + 1)],
        grund: 'Die Klammer ist ausgerechnet und kann weg'
      };
    }

    const s = einRechenschritt(innen);
    if (s.fehler) return s;

    /* Ist die Klammer fertig, gleich mit auflösen — sonst stünde erst
       "(20) : 4" da und der nächste Schritt entfernte nur die Klammer. */
    const fertig = s.tokens.length === 1 && s.tokens[0].typ === 'zahl';
    return {
      tokens: fertig
        ? [...tokens.slice(0, auf), s.tokens[0], ...tokens.slice(zu + 1)]
        : [...tokens.slice(0, auf + 1), ...s.tokens, ...tokens.slice(zu)],
      grund: `Klammern zuerst — in der Klammer: ${s.operation || s.grund}`
    };
  }

  // 2. Potenz, 3. Punktrechnung, 4. Strichrechnung
  const stufen = [
    { ops: ['^'], grund: 'Potenzen kommen vor Punkt und Strich' },
    { ops: ['*', '/'], grund: 'Punkt vor Strich' },
    { ops: ['+', '-'], grund: 'zuletzt Plus und Minus, von links nach rechts' }
  ];

  for (const stufe of stufen) {
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].typ === 'op' && stufe.ops.includes(tokens[i].wert)) {
        const a = tokens[i - 1], b = tokens[i + 1];
        if (!a || a.typ !== 'zahl' || !b || b.typ !== 'zahl') {
          return { fehler: 'Die Rechnung ist nicht vollständig — da fehlt eine Zahl.' };
        }
        const wert = rechne(a.wert, tokens[i].wert, b.wert);
        if (wert === null) return { fehler: 'Durch null darf man nicht teilen.' };

        const zeichen = OP_ZEICHEN[tokens[i].wert] || tokens[i].wert;
        let operation = `${fmt(a.wert)} ${zeichen} ${fmt(b.wert)} = ${fmt(wert)}`;

        // Bei krummer Division den Rest zeigen — hilft in der Unterstufe
        if (tokens[i].wert === '/' && Number.isInteger(a.wert) && Number.isInteger(b.wert)
            && !Number.isInteger(wert)) {
          const ganz = Math.trunc(a.wert / b.wert);
          operation += ` (mit Rest: ${ganz} Rest ${Math.abs(a.wert - ganz * b.wert)})`;
        }

        return {
          tokens: [...tokens.slice(0, i - 1), { typ: 'zahl', wert }, ...tokens.slice(i + 2)],
          grund: `${stufe.grund}: ${operation}`,
          operation
        };
      }
    }
  }
  return { fehler: 'Ich finde keine Rechnung, die ich ausführen könnte.' };
}

function loeseRechnung(eingabe) {
  const text = normalisiereEingabe(eingabe).replace(/=\s*$/, '').trim();
  // Nur reine Rechnungen — sobald Buchstaben vorkommen, ist ein anderer Löser zuständig
  if (!/^[\d\s+\-*/^().,:·×÷²³−–—]+$/.test(text)) return null;
  if (!/[+\-*/^:·×÷²³]/.test(text)) return null;      // ohne Rechenzeichen nichts zu tun

  const tokens = tokenisieren(text);
  if (!tokens || tokens.length < 3) return null;

  const start = tokensZuText(tokens);
  const schritte = [];
  let aktuell = tokens;
  let schutz = 0;

  while (aktuell.length > 1 && schutz++ < 60) {
    const s = einRechenschritt(aktuell);
    if (s.fehler) return { typ: 'rechnung', nichtLoesbar: s.fehler };
    aktuell = s.tokens;
    const satz = s.grund.charAt(0).toUpperCase() + s.grund.slice(1);
    schritte.push({
      titel: tokensZuText(aktuell),
      erklaerung: satz.endsWith('.') ? satz : satz + '.'
    });
  }
  if (aktuell.length !== 1 || aktuell[0].typ !== 'zahl') return null;

  const wert = aktuell[0].wert;
  const bruch = alsBruch(wert);

  const hatKlammern = /[()]/.test(text);
  const hatPunkt = /[*/^:·×÷]/.test(text);
  const hatStrich = /[+\-−]/.test(text.slice(1));

  const tipps = [
    hatKlammern
      ? 'Bei mehreren Rechenzeichen gilt eine feste Reihenfolge: zuerst die Klammern, dann Punkt vor Strich, zuletzt Plus und Minus von links nach rechts.'
      : hatPunkt && hatStrich
        ? 'Hier stehen Punkt- und Strichrechnungen gemischt. Es gilt: Punkt vor Strich — Mal und Geteilt kommen zuerst dran.'
        : 'Wenn nur Plus und Minus (oder nur Mal und Geteilt) vorkommen, rechnest du einfach von links nach rechts.',
    schritte.length > 0
      ? `Fang mit diesem Schritt an: ${schritte[0].erklaerung}`
      : 'Rechne Schritt für Schritt.',
    schritte.length > 1
      ? `Danach steht da: ${schritte[0].titel}. Von dort machst du genauso weiter.`
      : 'Danach bist du schon fertig.'
  ];

  return {
    typ: 'rechnung',
    thema: hatKlammern || (hatPunkt && hatStrich) ? 'Rechenreihenfolge' : 'Grundrechenarten',
    aufgabe: start,
    tipps,
    schritte,
    ergebnis: `${fmt(wert)}${bruch ? ` (als Bruch: ${bruch})` : ''}`,
    antwort: fmt(wert),
    antwortAlternativen: [bruch].filter(Boolean),
    uebungsthema: { fach: 'mathe', thema: 'mathe-rechnen' }
  };
}

/* ============================================================
   7. PHYSIK — Formeln mit gegebenen Werten
   ============================================================ */

/** Sucht Angaben wie "s = 100 m", "U=12V", "m = 5 kg" heraus. */
function groessenLesen(text) {
  const gefunden = {};
  // Groß-/Kleinschreibung zählt: U ist Spannung, V ist Volumen, p ist Druck
  const re = /\b([sStTvVaAmMFfUuRrIiPpEeWw])\s*=\s*(-?\d+[.,]?\d*)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    gefunden[m[1]] = zahl(m[2]);
  }
  return gefunden;
}

/** Fallback: "100 m in 20 s" ohne Formelzeichen. */
function wegUndZeitAusText(text) {
  const weg = text.match(/(\d+[.,]?\d*)\s*(?:m|meter)\b/i);
  const zeit = text.match(/(\d+[.,]?\d*)\s*(?:s|sek|sekunden)\b/i);
  if (weg && zeit) return { s: zahl(weg[1]), t: zahl(zeit[1]) };
  return null;
}

const PHYSIK_FORMELN = [
  {
    braucht: ['s', 't'], name: 'Geschwindigkeit', formel: 'v = s : t', einheit: 'm/s',
    rechne: g => g.s / g.t,
    tipps: g => [
      'Gesucht ist die Geschwindigkeit. Sie sagt, welchen Weg ein Körper in einer bestimmten Zeit zurücklegt.',
      'Die Formel lautet v = s : t — also Weg geteilt durch Zeit.',
      `Setz ein: ${fmt(g.s)} m geteilt durch ${fmt(g.t)} s.`
    ],
    schritte: g => [
      { titel: 'Formel aufschreiben', erklaerung: 'v = s : t' },
      { titel: 'Werte einsetzen', erklaerung: `v = ${fmt(g.s)} m : ${fmt(g.t)} s` },
      { titel: 'Ausrechnen', erklaerung: `v = ${fmt(g.s / g.t)} m/s. In km/h sind das ${fmt(g.s / g.t * 3.6)} km/h (mal 3,6).` }
    ]
  },
  {
    braucht: ['m', 'a'], name: 'Kraft', formel: 'F = m · a', einheit: 'N',
    rechne: g => g.m * g.a,
    tipps: g => [
      'Gesucht ist die Kraft. Je schwerer ein Körper und je stärker er beschleunigt wird, desto größer ist sie.',
      'Zweites Newtonsches Gesetz: F = m · a — Masse mal Beschleunigung.',
      `Setz ein: ${fmt(g.m)} kg mal ${fmt(g.a)} m/s².`
    ],
    schritte: g => [
      { titel: 'Formel aufschreiben', erklaerung: 'F = m · a' },
      { titel: 'Werte einsetzen', erklaerung: `F = ${fmt(g.m)} kg · ${fmt(g.a)} m/s²` },
      { titel: 'Ausrechnen', erklaerung: `F = ${fmt(g.m * g.a)} N. Ein Newton ist die Kraft, die 1 kg mit 1 m/s² beschleunigt.` }
    ]
  },
  {
    braucht: ['U', 'R'], name: 'Stromstärke', formel: 'I = U : R', einheit: 'A',
    rechne: g => g.U / g.R,
    tipps: g => [
      'Gesucht ist die Stromstärke. Sie hängt von Spannung und Widerstand ab.',
      'Ohmsches Gesetz: U = R · I. Nach I umgestellt: I = U : R.',
      `Setz ein: ${fmt(g.U)} V geteilt durch ${fmt(g.R)} Ω.`
    ],
    schritte: g => [
      { titel: 'Formel umstellen', erklaerung: 'Aus U = R · I wird I = U : R' },
      { titel: 'Werte einsetzen', erklaerung: `I = ${fmt(g.U)} V : ${fmt(g.R)} Ω` },
      { titel: 'Ausrechnen', erklaerung: `I = ${fmt(g.U / g.R)} A. Merke: Je größer der Widerstand, desto kleiner der Strom.` }
    ]
  },
  {
    braucht: ['U', 'I'], name: 'Elektrische Leistung', formel: 'P = U · I', einheit: 'W',
    rechne: g => g.U * g.I,
    tipps: g => [
      'Gesucht ist die elektrische Leistung — wie viel Energie das Gerät pro Sekunde umsetzt.',
      'Die Formel lautet P = U · I — Spannung mal Stromstärke.',
      `Setz ein: ${fmt(g.U)} V mal ${fmt(g.I)} A.`
    ],
    schritte: g => [
      { titel: 'Formel aufschreiben', erklaerung: 'P = U · I' },
      { titel: 'Werte einsetzen', erklaerung: `P = ${fmt(g.U)} V · ${fmt(g.I)} A` },
      { titel: 'Ausrechnen', erklaerung: `P = ${fmt(g.U * g.I)} W` }
    ]
  },
  {
    braucht: ['P', 't'], name: 'Energie', formel: 'E = P · t', einheit: 'J',
    rechne: g => g.P * g.t,
    tipps: g => [
      'Gesucht ist die Energie. Sie ergibt sich daraus, wie stark und wie lange etwas arbeitet.',
      'Die Formel lautet E = P · t — Leistung mal Zeit.',
      `Setz ein: ${fmt(g.P)} W mal ${fmt(g.t)} s.`
    ],
    schritte: g => [
      { titel: 'Formel aufschreiben', erklaerung: 'E = P · t' },
      { titel: 'Werte einsetzen', erklaerung: `E = ${fmt(g.P)} W · ${fmt(g.t)} s` },
      { titel: 'Ausrechnen', erklaerung: `E = ${fmt(g.P * g.t)} J. 1 Joule ist eine Wattsekunde.` }
    ]
  },
  {
    braucht: ['F', 's'], name: 'Arbeit', formel: 'W = F · s', einheit: 'J',
    rechne: g => g.F * g.s,
    tipps: g => [
      'Gesucht ist die Arbeit. Sie wird verrichtet, wenn eine Kraft einen Körper ein Stück bewegt.',
      'Die Formel lautet W = F · s — Kraft mal Weg.',
      `Setz ein: ${fmt(g.F)} N mal ${fmt(g.s)} m.`
    ],
    schritte: g => [
      { titel: 'Formel aufschreiben', erklaerung: 'W = F · s' },
      { titel: 'Werte einsetzen', erklaerung: `W = ${fmt(g.F)} N · ${fmt(g.s)} m` },
      { titel: 'Ausrechnen', erklaerung: `W = ${fmt(g.F * g.s)} J` }
    ]
  },
  {
    braucht: ['m', 'V'], name: 'Dichte', formel: 'ρ = m : V', einheit: 'kg/m³',
    rechne: g => g.m / g.V,
    tipps: g => [
      'Gesucht ist die Dichte — sie sagt, wie viel Masse in einem bestimmten Volumen steckt.',
      'Die Formel lautet ρ = m : V — Masse geteilt durch Volumen.',
      `Setz ein: ${fmt(g.m)} geteilt durch ${fmt(g.V)}.`
    ],
    schritte: g => [
      { titel: 'Formel aufschreiben', erklaerung: 'ρ = m : V' },
      { titel: 'Werte einsetzen', erklaerung: `ρ = ${fmt(g.m)} : ${fmt(g.V)}` },
      { titel: 'Ausrechnen', erklaerung: `ρ = ${fmt(g.m / g.V)}` }
    ]
  }
];

function loesePhysik(eingabe) {
  const text = normalisiereEingabe(eingabe);
  let g = groessenLesen(text);

  // Ohne Formelzeichen: "100 m in 20 s"
  if (Object.keys(g).length < 2) {
    const ausText = wegUndZeitAusText(text);
    if (ausText) g = ausText;
  }
  if (Object.keys(g).length < 2) return null;

  for (const f of PHYSIK_FORMELN) {
    if (f.braucht.every(k => g[k] !== undefined)) {
      const wert = f.rechne(g);
      if (!isFinite(wert)) {
        return { typ: 'physik', nichtLoesbar: 'Mit diesen Werten geht die Rechnung nicht auf — teilst du vielleicht durch null?' };
      }
      return {
        typ: 'physik',
        thema: f.name,
        aufgabe: f.braucht.map(k => `${k} = ${fmt(g[k])}`).join(', '),
        tipps: f.tipps(g),
        schritte: f.schritte(g),
        ergebnis: `${f.formel.split('=')[0].trim()} = ${fmt(wert)} ${f.einheit}`,
        antwort: fmt(wert),
        uebungsthema: { fach: 'physik', thema: 'physik-rechnen' }
      };
    }
  }
  return null;
}

/* ============================================================
   ZENTRALE ERKENNUNG
   ============================================================ */

/* Reihenfolge zählt: loeseRechnung steht ganz hinten, damit "3/4 + 2/5"
   vorher beim Bruchlöser landet und als Bruch erklärt wird — nicht als
   0,75 + 0,4. */
const LOESER_PRO_FACH = {
  mathe:  [loeseGleichung, loeseProzent, loeseBruch, loeseBinom, loeseGeometrie, loeseRechnung],
  physik: [loesePhysik]
};

const KANN_ICH_NICHT = {
  mathe:
    'Diese Aufgabe kann ich nicht rechnen. In Mathe beherrsche ich das Rechnen mit Zahlen ' +
    '(auch Punkt vor Strich und Klammern), Gleichungen mit x, Prozentrechnung, Bruchrechnung, ' +
    'binomische Formeln und Geometrie mit konkreten Zahlen. ' +
    'Textaufgaben und quadratische Gleichungen gehören leider nicht dazu.',
  physik:
    'Diese Aufgabe kann ich nicht rechnen. In Physik beherrsche ich Geschwindigkeit, Kraft, ' +
    'Stromstärke, elektrische Leistung, Energie, Arbeit und Dichte — jeweils mit gegebenen Werten, ' +
    'zum Beispiel "s = 100, t = 20". Textaufgaben kann ich nicht.'
};

/**
 * Versucht, die eingetippte Aufgabe zu lösen — nur mit den Lösern,
 * die zum gewählten Fach gehören.
 */
function aufgabeLoesen(eingabe, fach = 'mathe') {
  const text = String(eingabe || '').trim();
  if (!text) return { nichtErkannt: 'Bitte tippe deine Aufgabe ein.' };
  if (text.length > 300) return { nichtErkannt: 'Das ist sehr lang. Gib bitte nur die eine Aufgabe ein.' };

  const loeser = LOESER_PRO_FACH[fach];
  if (!loeser) {
    return { nichtErkannt: 'Für dieses Fach kann ich keine Aufgaben durchrechnen.' };
  }

  for (const l of loeser) {
    try {
      const ergebnis = l(text);
      if (ergebnis) return ergebnis;
    } catch (e) {
      // Ein kaputter Löser darf nicht die ganze Erkennung lahmlegen
      console.warn('Löser fehlgeschlagen:', e);
    }
  }

  return { nichtErkannt: KANN_ICH_NICHT[fach] };
}
