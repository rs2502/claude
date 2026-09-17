/**
 * reinart — Konten, Passwörter, Sitzungen.
 *
 * Bewusst ohne zusätzliche Pakete: Node bringt mit `crypto` alles mit, was
 * für eine saubere Passwortspeicherung nötig ist (scrypt + zufälliges Salz).
 *
 * Passwörter werden NIE im Klartext gespeichert und NIE geloggt.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/* Datenverzeichnis liegt bewusst NICHT im ausgelieferten Ordner —
   siehe Allowlist in server.js. Doppelte Absicherung. */
const DATEN_DIR = path.join(__dirname, 'daten');
const BENUTZER_DATEI = path.join(DATEN_DIR, 'benutzer.json');

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };
const SITZUNG_DAUER_MS = 12 * 60 * 60 * 1000;   // 12 Stunden
const MAX_FEHLVERSUCHE = 5;
const SPERRE_MS = 15 * 60 * 1000;               // 15 Minuten

/* ============================================================
   PASSWÖRTER
   ============================================================ */

function passwortHashen(passwort) {
  const salz = crypto.randomBytes(16);
  const hash = crypto.scryptSync(passwort.normalize('NFKC'), salz, SCRYPT.keylen, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salz.toString('base64')}$${hash.toString('base64')}`;
}

function passwortPruefen(passwort, gespeichert) {
  try {
    const [verfahren, N, r, p, salzB64, hashB64] = gespeichert.split('$');
    if (verfahren !== 'scrypt') return false;

    const salz = Buffer.from(salzB64, 'base64');
    const erwartet = Buffer.from(hashB64, 'base64');
    const berechnet = crypto.scryptSync(
      passwort.normalize('NFKC'), salz, erwartet.length,
      { N: Number(N), r: Number(r), p: Number(p) }
    );
    // Zeitkonstanter Vergleich — verrät über die Laufzeit nichts über das Passwort
    return crypto.timingSafeEqual(berechnet, erwartet);
  } catch {
    return false;
  }
}

/** Mindestanforderungen. Bewusst schlicht: Länge schlägt Sonderzeichen. */
function passwortSchwach(passwort) {
  if (typeof passwort !== 'string' || passwort.length < 8) {
    return 'Das Passwort muss mindestens 8 Zeichen lang sein.';
  }
  if (passwort.length > 200) return 'Das Passwort ist zu lang.';
  const zuEinfach = ['passwort', 'password', '12345678', 'qwertz', 'reinart'];
  if (zuEinfach.some(w => passwort.toLowerCase().includes(w))) {
    return 'Dieses Passwort ist zu leicht zu erraten. Denk dir etwas anderes aus.';
  }
  return null;
}

/** Eingabefehler sind Fehler des Aufrufers (400), keine Serverpannen (500). */
function eingabeFehler(text) {
  return Object.assign(new Error(text), { statusCode: 400 });
}

/* ============================================================
   BENUTZERSPEICHER (JSON-Datei, nur für den Besitzer lesbar)
   ============================================================ */

function ladeAlle() {
  try {
    return JSON.parse(fs.readFileSync(BENUTZER_DATEI, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

function speichereAlle(liste) {
  fs.mkdirSync(DATEN_DIR, { recursive: true, mode: 0o700 });
  const tmp = BENUTZER_DATEI + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(liste, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, BENUTZER_DATEI); // atomar — kein halb geschriebener Zustand
}

const normName = n => String(n || '').trim().toLowerCase();

function findeBenutzer(name) {
  return ladeAlle().find(b => normName(b.name) === normName(name)) || null;
}

function benutzerAnlegen({ name, passwort, klasse, rolle = 'kind' }) {
  const sauber = String(name || '').trim();
  if (!/^[\p{L}\p{N} _.-]{2,40}$/u.test(sauber)) {
    throw eingabeFehler('Der Name darf 2 bis 40 Zeichen haben (Buchstaben, Zahlen, Leer- und Bindestriche).');
  }
  const schwach = passwortSchwach(passwort);
  if (schwach) throw eingabeFehler(schwach);

  const k = Number(klasse);
  if (!Number.isInteger(k) || k < 5 || k > 13) {
    throw eingabeFehler('Die Klassenstufe muss zwischen 5 und 13 liegen.');
  }

  const alle = ladeAlle();
  if (alle.some(b => normName(b.name) === normName(sauber))) {
    throw eingabeFehler(`Ein Konto mit dem Namen "${sauber}" gibt es schon.`);
  }

  const benutzer = {
    id: crypto.randomUUID(),
    name: sauber,
    klasse: k,
    rolle,
    avatar: ['🦊', '🦅', '🦉', '🐺', '🦁', '🐢', '🦌'][alle.length % 7],
    passwortHash: passwortHashen(passwort),
    angelegtAm: new Date().toISOString(),
    scansHeute: 0,
    scanTag: ''
  };
  alle.push(benutzer);
  speichereAlle(alle);
  return oeffentlich(benutzer);
}

function passwortSetzen(name, neuesPasswort) {
  const schwach = passwortSchwach(neuesPasswort);
  if (schwach) throw eingabeFehler(schwach);

  const alle = ladeAlle();
  const b = alle.find(x => normName(x.name) === normName(name));
  if (!b) throw Object.assign(new Error(`Kein Konto mit dem Namen "${name}".`), { statusCode: 404 });

  b.passwortHash = passwortHashen(neuesPasswort);
  speichereAlle(alle);
  sitzungenVonBenutzerBeenden(b.id); // überall abmelden nach Passwortwechsel
}

function benutzerLoeschen(name) {
  const alle = ladeAlle();
  const b = alle.find(x => normName(x.name) === normName(name));
  if (!b) throw Object.assign(new Error(`Kein Konto mit dem Namen "${name}".`), { statusCode: 404 });
  speichereAlle(alle.filter(x => x.id !== b.id));
  sitzungenVonBenutzerBeenden(b.id);
}

/** Nur die Felder, die der Browser sehen darf — niemals der Hash. */
function oeffentlich(b) {
  return { id: b.id, name: b.name, klasse: b.klasse, rolle: b.rolle, avatar: b.avatar };
}

function alleOeffentlich() {
  return ladeAlle().map(oeffentlich);
}

/* ============================================================
   ANMELDUNG mit Bremse gegen Durchprobieren
   ============================================================ */

const fehlversuche = new Map(); // IP -> { anzahl, sperrBis }

function istGesperrt(ip) {
  const e = fehlversuche.get(ip);
  if (!e || !e.sperrBis) return 0;
  const rest = e.sperrBis - Date.now();
  if (rest <= 0) { fehlversuche.delete(ip); return 0; }
  return Math.ceil(rest / 60000); // verbleibende Minuten
}

function fehlversuchNotieren(ip) {
  const e = fehlversuche.get(ip) || { anzahl: 0, sperrBis: 0 };
  e.anzahl++;
  if (e.anzahl >= MAX_FEHLVERSUCHE) {
    e.sperrBis = Date.now() + SPERRE_MS;
    e.anzahl = 0;
  }
  fehlversuche.set(ip, e);
}

function anmelden(name, passwort, ip) {
  const gesperrt = istGesperrt(ip);
  if (gesperrt) {
    throw Object.assign(
      new Error(`Zu viele Fehlversuche. Bitte warte ${gesperrt} Minuten.`),
      { statusCode: 429 }
    );
  }

  const b = findeBenutzer(name);
  // Auch bei unbekanntem Namen rechnen wir einen Hash durch: sonst verrät die
  // Antwortzeit, welche Namen existieren.
  const hash = b ? b.passwortHash : passwortHashen('platzhalter-fuer-gleiche-laufzeit');
  const passt = passwortPruefen(String(passwort || ''), hash);

  if (!b || !passt) {
    fehlversuchNotieren(ip);
    throw Object.assign(
      new Error('Name oder Passwort stimmt nicht.'), // bewusst unspezifisch
      { statusCode: 401 }
    );
  }

  fehlversuche.delete(ip);
  return { token: sitzungAnlegen(b.id), benutzer: oeffentlich(b) };
}

/* ============================================================
   SITZUNGEN
   ============================================================ */

const sitzungen = new Map(); // token -> { benutzerId, ablauf }

function sitzungAnlegen(benutzerId) {
  const token = crypto.randomBytes(32).toString('base64url');
  sitzungen.set(token, { benutzerId, ablauf: Date.now() + SITZUNG_DAUER_MS });
  return token;
}

function sitzungLesen(token) {
  if (!token) return null;
  const s = sitzungen.get(token);
  if (!s) return null;
  if (s.ablauf < Date.now()) { sitzungen.delete(token); return null; }

  const b = ladeAlle().find(x => x.id === s.benutzerId);
  if (!b) { sitzungen.delete(token); return null; }
  return b;
}

function sitzungBeenden(token) {
  sitzungen.delete(token);
}

function sitzungenVonBenutzerBeenden(benutzerId) {
  for (const [token, s] of sitzungen) {
    if (s.benutzerId === benutzerId) sitzungen.delete(token);
  }
}

// Abgelaufene Sitzungen regelmäßig aufräumen
const aufraeumer = setInterval(() => {
  const jetzt = Date.now();
  for (const [token, s] of sitzungen) if (s.ablauf < jetzt) sitzungen.delete(token);
}, 10 * 60 * 1000);
aufraeumer.unref(); // hält den Prozess nicht am Leben

/* ============================================================
   SCAN-KONTINGENT pro Benutzer und Tag
   ============================================================ */

function scanKontingentPruefen(benutzerId, maxProTag) {
  const alle = ladeAlle();
  const b = alle.find(x => x.id === benutzerId);
  if (!b) throw Object.assign(new Error('Konto nicht gefunden.'), { statusCode: 401 });

  const heute = new Date().toISOString().slice(0, 10);
  if (b.scanTag !== heute) { b.scanTag = heute; b.scansHeute = 0; }

  if (b.scansHeute >= maxProTag) {
    throw Object.assign(
      new Error(`Du hast dein Tageslimit von ${maxProTag} Scans erreicht. Morgen geht es weiter — bis dahin kannst du die Übungsaufgaben nutzen.`),
      { statusCode: 429 }
    );
  }

  b.scansHeute++;
  speichereAlle(alle);
  return { verbraucht: b.scansHeute, uebrig: maxProTag - b.scansHeute };
}

module.exports = {
  passwortHashen, passwortPruefen, passwortSchwach,
  benutzerAnlegen, passwortSetzen, benutzerLoeschen,
  findeBenutzer, alleOeffentlich, oeffentlich, ladeAlle,
  anmelden, sitzungLesen, sitzungBeenden, sitzungenVonBenutzerBeenden,
  scanKontingentPruefen,
  BENUTZER_DATEI, DATEN_DIR
};
