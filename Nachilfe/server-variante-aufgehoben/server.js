#!/usr/bin/env node
/**
 * reinart — Nachhilfe fürs Gymnasium.
 *
 * Kleiner Node-Server: liefert das Frontend aus und schickt abfotografierte
 * Aufgaben an die Claude API (Bilderkennung + strukturierte JSON-Antwort).
 *
 * Reihenfolge der API-Key-Suche:
 *   1. Feld `apiKey` im Request (im Browser eingegeben)
 *   2. Umgebungsvariable ANTHROPIC_API_KEY
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const auth = require('./auth');

const PORT = process.env.PORT || 8746;
const PUBLIC_DIR = __dirname;
const MODEL = 'claude-opus-4-8';
const MAX_BODY_BYTES = 25 * 1024 * 1024; // Fotos werden als base64 groß

/* Wie viele Scans darf ein Kind pro Tag? Deckt echten Lernbedarf ab und
   begrenzt gleichzeitig, was ein einzelnes Konto kosten kann. */
const SCANS_PRO_TAG = Number(process.env.SCANS_PRO_TAG || 10);

/* Notbremse für die ganze App — unabhängig davon, wie viele Konten es gibt. */
const SCANS_GESAMT_PRO_TAG = Number(process.env.SCANS_GESAMT_PRO_TAG || 200);
let gesamtZaehler = { tag: '', anzahl: 0 };

function gesamtLimitPruefen() {
  const heute = new Date().toISOString().slice(0, 10);
  if (gesamtZaehler.tag !== heute) gesamtZaehler = { tag: heute, anzahl: 0 };
  if (gesamtZaehler.anzahl >= SCANS_GESAMT_PRO_TAG) {
    throw Object.assign(
      new Error('Das Tageslimit der App ist erreicht. Bitte versuche es morgen wieder.'),
      { statusCode: 429 }
    );
  }
  gesamtZaehler.anzahl++;
}

/* ============================================================
   ANTWORT-SCHEMA
   Erzwingt, dass die Antwort immer dieselbe Struktur hat:
   erst Tipps, dann Lösungsweg, dann eigene Testaufgaben.
   ============================================================ */

const SCHEMA = {
  type: 'object',
  properties: {
    lesbar: {
      type: 'boolean',
      description: 'false, wenn auf dem Foto keine Schulaufgabe erkennbar oder die Schrift unlesbar ist'
    },
    hinweisWennUnlesbar: {
      type: 'string',
      description: 'Wenn lesbar=false: freundlicher Hinweis an den Schüler, was er besser machen soll. Sonst leerer String.'
    },
    fach: { type: 'string', description: 'Erkanntes Fach, z. B. Mathe' },
    thema: { type: 'string', description: 'Konkretes Thema, z. B. Lineare Gleichungen' },
    aufgabenstellung: {
      type: 'string',
      description: 'Die erkannte Aufgabe in eigenen Worten sauber abgetippt'
    },
    tipps: {
      type: 'array',
      description: 'Genau 3 Tipps, die stufenweise mehr verraten. Tipp 1 nur der Ansatz, Tipp 3 fast die Lösung. Niemals das Endergebnis nennen.',
      items: { type: 'string' }
    },
    loesungsweg: {
      type: 'array',
      description: 'Der vollständige Rechenweg in 2 bis 6 Schritten',
      items: {
        type: 'object',
        properties: {
          titel: { type: 'string', description: 'Kurzer Titel des Schritts' },
          erklaerung: { type: 'string', description: 'Was in diesem Schritt passiert und warum' }
        },
        required: ['titel', 'erklaerung'],
        additionalProperties: false
      }
    },
    ergebnis: { type: 'string', description: 'Das Endergebnis, kurz und mit Einheit' },
    testaufgaben: {
      type: 'array',
      description: 'Genau 3 neue Aufgaben vom selben Typ mit anderen Zahlen/Inhalten, um zu prüfen ob der Schüler es verstanden hat. Aufsteigende Schwierigkeit.',
      items: {
        type: 'object',
        properties: {
          frage: { type: 'string' },
          loesung: { type: 'string', description: 'Nur das Ergebnis, kurz' },
          erklaerung: { type: 'string', description: 'Kurzer Rechenweg zur Kontrolle' }
        },
        required: ['frage', 'loesung', 'erklaerung'],
        additionalProperties: false
      }
    }
  },
  required: [
    'lesbar', 'hinweisWennUnlesbar', 'fach', 'thema', 'aufgabenstellung',
    'tipps', 'loesungsweg', 'ergebnis', 'testaufgaben'
  ],
  additionalProperties: false
};

function systemPrompt(klasse, fach) {
  return `Du bist reinart, ein geduldiger Nachhilfelehrer an einem deutschen Gymnasium.
Du hilfst einem Schüler der ${klasse}. Klasse${fach ? `, Fach ${fach}` : ''}.

So arbeitest du:
- Du sprichst den Schüler mit "du" an, freundlich und ermutigend, ohne herablassend zu sein.
- Deine Sprache passt zur ${klasse}. Klasse: kurze Sätze, keine unnötigen Fachbegriffe.
  Wenn ein Fachbegriff nötig ist, erklärst du ihn beim ersten Mal.
- Die drei Tipps bauen aufeinander auf. Tipp 1 nennt nur, worum es geht und welche
  Regel gilt. Tipp 2 zeigt den ersten Rechenschritt. Tipp 3 führt bis kurz vor das
  Ergebnis. Kein Tipp verrät jemals das Endergebnis — der Schüler soll selbst darauf kommen.
- Der Lösungsweg ist erst der zweite Schritt. Dort rechnest du vollständig vor und
  erklärst bei jedem Schritt das Warum, nicht nur das Was.
- Die drei Testaufgaben prüfen genau dieselbe Fähigkeit mit anderen Zahlen oder
  Inhalten. Sie werden schrittweise etwas schwerer. Erfinde sie selbst — schreibe
  niemals Aufgaben aus einem Schulbuch ab.
- Rechne sorgfältig und prüfe dein Ergebnis nach, bevor du antwortest.

Wenn auf dem Foto keine Schulaufgabe zu erkennen ist oder die Schrift zu unscharf ist,
setzt du lesbar auf false und schreibst in hinweisWennUnlesbar freundlich, was der
Schüler besser machen kann (z. B. näher ran, mehr Licht, Blatt gerade halten).`;
}

/* ============================================================
   CLAUDE-AUFRUF
   ============================================================ */

async function analysiereAufgabe({ apiKey, imageBase64, mediaType, klasse, fach, frage }) {
  const client = new Anthropic({ apiKey });

  const inhalt = [
    { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
    {
      type: 'text',
      text: frage && frage.trim()
        ? `Hier ist meine Aufgabe. Zusätzlich von mir: ${frage.trim()}`
        : 'Hier ist meine Aufgabe. Bitte hilf mir.'
    }
  ];

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system: systemPrompt(klasse, fach),
    output_config: {
      effort: 'high',
      format: { type: 'json_schema', schema: SCHEMA }
    },
    messages: [{ role: 'user', content: inhalt }]
  });

  if (response.stop_reason === 'refusal') {
    throw Object.assign(
      new Error('Die Anfrage wurde aus Sicherheitsgründen abgelehnt. Bitte fotografiere eine normale Schulaufgabe.'),
      { statusCode: 422 }
    );
  }
  if (response.stop_reason === 'max_tokens') {
    throw Object.assign(
      new Error('Die Antwort wurde abgeschnitten. Versuche es mit einer einzelnen Aufgabe statt einer ganzen Seite.'),
      { statusCode: 502 }
    );
  }

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock) {
    throw Object.assign(new Error('Claude hat keine verwertbare Antwort geliefert.'), { statusCode: 502 });
  }

  return JSON.parse(textBlock.text);
}

/* ============================================================
   HTTP
   ============================================================ */

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store'
  });
  res.end(payload);
}

function leseBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Das Foto ist zu groß (maximal 25 MB).'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('Ungültige Anfrage.'), { statusCode: 400 }));
      }
    });
    req.on('error', reject);
  });
}

/* Ausdrückliche Positivliste statt Sperrliste: Es wird ausschließlich
   ausgeliefert, was hier steht. Damit können benutzer.json, auth.js,
   package.json oder node_modules gar nicht erst nach außen gelangen —
   auch dann nicht, wenn später neue Dateien im Ordner landen. */
const AUSLIEFERBAR = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
  '/script.js': ['script.js', 'text/javascript; charset=utf-8']
};

function serveStatic(req, res) {
  const pfad = req.url.split('?')[0];
  const eintrag = AUSLIEFERBAR[pfad];

  if (!eintrag) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Nicht gefunden');
    return;
  }

  fs.readFile(path.join(PUBLIC_DIR, eintrag[0]), (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Nicht gefunden');
      return;
    }
    res.writeHead(200, {
      'Content-Type': eintrag[1],
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy':
        "default-src 'none'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'"
    });
    res.end(data);
  });
}

/* ============================================================
   SITZUNGS-COOKIE
   ============================================================ */

const COOKIE_NAME = 'reinart_sitzung';

function cookieLesen(req, name) {
  const roh = req.headers.cookie;
  if (!roh) return null;
  for (const teil of roh.split(';')) {
    const i = teil.indexOf('=');
    if (i < 0) continue;
    if (teil.slice(0, i).trim() === name) return decodeURIComponent(teil.slice(i + 1).trim());
  }
  return null;
}

function cookieSetzen(res, token, sicher) {
  const teile = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',              // für JavaScript im Browser unsichtbar
    'SameSite=Strict',       // wird bei fremden Seiten nicht mitgeschickt (CSRF)
    `Max-Age=${12 * 60 * 60}`
  ];
  if (sicher) teile.push('Secure');
  res.setHeader('Set-Cookie', teile.join('; '));
}

function cookieLoeschen(res) {
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
}

function istHttps(req) {
  return req.headers['x-forwarded-proto'] === 'https' || Boolean(req.socket.encrypted);
}

function ipVon(req) {
  const weiter = req.headers['x-forwarded-for'];
  if (typeof weiter === 'string' && weiter.length) return weiter.split(',')[0].trim();
  return req.socket.remoteAddress || 'unbekannt';
}

/** Liefert den angemeldeten Benutzer oder wirft 401. */
function benutzerAusAnfrage(req) {
  const benutzer = auth.sitzungLesen(cookieLesen(req, COOKIE_NAME));
  if (!benutzer) {
    throw Object.assign(new Error('Bitte melde dich an.'), { statusCode: 401 });
  }
  return benutzer;
}

const server = http.createServer(async (req, res) => {
  const pfad = req.url.split('?')[0];

  /* ---------- Anmelden ---------- */
  if (req.method === 'POST' && pfad === '/api/anmelden') {
    try {
      const body = await leseBody(req);
      const { token, benutzer } = auth.anmelden(body.name, body.passwort, ipVon(req));
      cookieSetzen(res, token, istHttps(req));
      sendJson(res, 200, { benutzer });
    } catch (err) {
      sendJson(res, err.statusCode || 500, { fehler: err.message });
    }
    return;
  }

  /* ---------- Abmelden ---------- */
  if (req.method === 'POST' && pfad === '/api/abmelden') {
    auth.sitzungBeenden(cookieLesen(req, COOKIE_NAME));
    cookieLoeschen(res);
    sendJson(res, 200, { ok: true });
    return;
  }

  /* ---------- Wer bin ich? ---------- */
  if (req.method === 'GET' && pfad === '/api/ich') {
    try {
      const b = benutzerAusAnfrage(req);
      const heute = new Date().toISOString().slice(0, 10);
      sendJson(res, 200, {
        benutzer: auth.oeffentlich(b),
        scansUebrig: SCANS_PRO_TAG - (b.scanTag === heute ? b.scansHeute : 0),
        scansProTag: SCANS_PRO_TAG
      });
    } catch (err) {
      sendJson(res, err.statusCode || 500, { fehler: err.message });
    }
    return;
  }

  /* ---------- Eigenes Passwort ändern ---------- */
  if (req.method === 'POST' && pfad === '/api/passwort-aendern') {
    try {
      const b = benutzerAusAnfrage(req);
      const body = await leseBody(req);
      if (!auth.passwortPruefen(String(body.alt || ''), b.passwortHash)) {
        throw Object.assign(new Error('Das alte Passwort stimmt nicht.'), { statusCode: 401 });
      }
      auth.passwortSetzen(b.name, String(body.neu || ''));
      cookieLoeschen(res); // Passwortwechsel meldet überall ab
      sendJson(res, 200, { ok: true });
    } catch (err) {
      sendJson(res, err.statusCode || 500, { fehler: err.message });
    }
    return;
  }

  if (req.method === 'GET' && pfad === '/api/status') {
    sendJson(res, 200, { schluesselVorhanden: Boolean(process.env.ANTHROPIC_API_KEY), modell: MODEL });
    return;
  }

  /* ---------- Aufgabe scannen — nur mit Konto ---------- */
  if (req.method === 'POST' && pfad === '/api/aufgabe-scannen') {
    try {
      const benutzer = benutzerAusAnfrage(req);   // ohne Anmeldung: 401
      const body = await leseBody(req);

      /* Der Schlüssel kommt ausschließlich vom Server. Ihn vom Browser
         schicken zu lassen wäre bei mehreren Nutzern nicht vertretbar. */
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw Object.assign(
          new Error('Auf dem Server ist kein API-Schlüssel hinterlegt. Bitte ANTHROPIC_API_KEY setzen.'),
          { statusCode: 503 }
        );
      }
      if (!body.imageBase64 || !body.mediaType) {
        throw Object.assign(new Error('Es wurde kein Foto übertragen.'), { statusCode: 400 });
      }
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(body.mediaType)) {
        throw Object.assign(new Error('Dieses Bildformat wird nicht unterstützt.'), { statusCode: 400 });
      }

      /* Erst die Limits, dann der teure Aufruf. Reihenfolge ist wichtig:
         Gesamtlimit zuerst, damit ein einzelnes Konto nicht sein Kontingent
         verbraucht, wenn die App ohnehin schon dicht ist. */
      gesamtLimitPruefen();
      const kontingent = auth.scanKontingentPruefen(benutzer.id, SCANS_PRO_TAG);

      const ergebnis = await analysiereAufgabe({
        apiKey,
        imageBase64: body.imageBase64,
        mediaType: body.mediaType,
        klasse: benutzer.klasse,          // aus dem Konto, nicht aus dem Browser
        fach: body.fach || '',
        frage: body.frage || ''
      });

      sendJson(res, 200, { ...ergebnis, scansUebrig: kontingent.uebrig });
    } catch (err) {
      // Typisierte SDK-Fehler in verständliche deutsche Meldungen übersetzen
      let status = err.statusCode || 500;
      let message = err.message || 'Unbekannter Fehler.';

      if (err instanceof Anthropic.AuthenticationError) {
        status = 401;
        message = 'Der API-Schlüssel wurde nicht akzeptiert. Bitte prüfe ihn.';
      } else if (err instanceof Anthropic.RateLimitError) {
        status = 429;
        message = 'Zu viele Anfragen auf einmal. Warte kurz und versuche es nochmal.';
      } else if (err instanceof Anthropic.APIConnectionError) {
        status = 503;
        message = 'Keine Verbindung zur Claude API. Ist das Internet erreichbar?';
      } else if (err instanceof Anthropic.APIError) {
        status = err.status || 502;
        message = `Die Claude API meldet einen Fehler: ${err.message}`;
      }

      console.error('[scan]', err);
      sendJson(res, status, { fehler: message });
    }
    return;
  }

  if (req.method === 'GET') {
    serveStatic(req, res);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Methode nicht erlaubt');
});

server.listen(PORT, '127.0.0.1', () => {
  const konten = auth.ladeAlle().length;
  console.log(`\nreinart läuft auf http://127.0.0.1:${PORT}`);
  console.log(process.env.ANTHROPIC_API_KEY
    ? '  API-Schlüssel: aus der Umgebung geladen'
    : '  API-Schlüssel: FEHLT — Scan ist deaktiviert (ANTHROPIC_API_KEY setzen)');
  console.log(`  Limits: ${SCANS_PRO_TAG} Scans pro Konto und Tag, ${SCANS_GESAMT_PRO_TAG} insgesamt`);
  if (konten === 0) {
    console.log('\n  Noch keine Konten. Lege eins an:');
    console.log('      node benutzer.js anlegen Jonte 5\n');
  } else {
    console.log(`  Konten: ${konten}\n`);
  }
});
