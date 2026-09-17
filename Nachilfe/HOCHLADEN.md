# reinart bei Strato hochladen

## Diese vier Dateien hochladen

```
index.html
styles.css
script.js
loeser.js
```

Mehr nicht. Zusammen rund 108 KB.

**Nicht hochladen:** den Ordner `server-variante-aufgehoben/` — der enthält die
frühere Scan-Version mit Server und wird auf Strato-Webhosting ohnehin nicht
ausgeführt (dort läuft kein Node.js).

## So geht's

1. Bei Strato einloggen → **Webspace-Verwaltung** → **FTP-Zugang** (oder den
   Datei-Manager im Kundenbereich nutzen, dann brauchst du kein FTP-Programm).
2. Mit einem FTP-Programm verbinden (z. B. FileZilla, kostenlos):
   - Server, Benutzername und Passwort stehen in deinem Strato-Kundenbereich
   - Verschlüsselung: **FTP über TLS** wählen, nicht unverschlüsselt
3. In den Ordner wechseln, der im Web sichtbar ist. Bei Strato heißt er meist
   `/` oder enthält bereits eine `index.html`.
4. Die vier Dateien hineinkopieren.
5. Im Browser deine Adresse aufrufen — fertig.

Willst du reinart lieber in einem Unterordner (z. B. `deine-adresse.de/lernen`),
lege den Ordner an und lade die vier Dateien dort hinein. Die Datei-Verweise
sind relativ, das funktioniert in jedem Unterordner.

## Immer ALLE vier Dateien hochladen

Das ist die häufigste Fehlerquelle: Wenn du nur `index.html` und `script.js`
hochlädst, aber `loeser.js` vergisst, funktioniert das Rechnen nicht mehr —
ohne jede Fehlermeldung. Lade im Zweifel immer alle vier hoch.

## Woran du erkennst, dass alles aktuell ist

Ganz unten auf der Seite steht eine **Versionsnummer**, z. B. `Version 13.6`.
Die erste Zahl ist `script.js`, die zweite `loeser.js`.

Passt etwas nicht zusammen, erscheint oben auf der Seite ein **roter Kasten**
mit dem Hinweis, dass eine veraltete Fassung geladen wurde. Dann hilft ein
erzwungenes Neuladen:

- **Windows:** `Strg` + `F5`
- **Mac:** `Cmd` + `Umschalt` + `R`
- **iPhone/iPad:** Einstellungen → Safari → Verlauf und Websitedaten löschen

## Nach einer Änderung

Browser halten alte Dateien fest. Wenn du etwas änderst, erhöhe in `index.html`
die Nummer hinter `?v=` der geänderten Datei:

```html
<link rel="stylesheet" href="styles.css?v=10">
<script src="loeser.js?v=6"></script>
<script src="script.js?v=13"></script>
```

Änderst du `loeser.js`, musst du **drei** Stellen gleich halten, sonst schlägt
die Selbstprüfung Alarm:

1. `?v=` in `index.html`
2. `const LOESER_VERSION` oben im Rechenteil von `loeser.js`
3. `const LOESER_ERWARTET` unten in `script.js`

## Profile ändern

Die drei Profile stehen oben in `script.js`:

```js
const profile = [
  { id: 'jonte', name: 'Jonte', klasse: 5, avatar: '🦊', standardPin: '1111' },
  { id: 'bent',  name: 'Bent',  klasse: 8, avatar: '🦅', standardPin: '2222' },
  { id: 'gast',  name: 'Gast',  klasse: 8, avatar: '🦉', standardPin: '0000' }
];
```

Name, Klassenstufe (5 bis 13), Tier und Start-PIN kannst du frei ändern. Die
Klassenstufe steuert, welche Fächer und Themen erscheinen und wie schwer die
Aufgaben sind.

**Die PIN ist kein echter Schutz** — sie steht im Quelltext und trennt nur die
Geschwister voneinander. Das reicht hier, weil dahinter nichts liegt außer dem
eigenen Punktestand.

## Was die App kostet

Nichts. Sie läuft vollständig im Browser des Nutzers: keine Server-Logik, keine
Datenbank, keine Verbindung nach außen. Egal ob 3 oder 3000 Leute sie benutzen —
es fallen nur deine normalen Strato-Gebühren an, die du ohnehin zahlst.

## Datenschutz

Es verlässt nichts das Gerät. Punktestände liegen im lokalen Speicher des
Browsers, Aufgaben werden auf dem Gerät gerechnet. Damit brauchst du keine
Einwilligung für Datenverarbeitung.

**Trotzdem:** Sobald die Seite öffentlich erreichbar ist, gilt in Deutschland die
Impressumspflicht, und Strato speichert serverseitig Zugriffsprotokolle mit
IP-Adressen. Ein Impressum und eine kurze Datenschutzerklärung gehören also
dazu. Das ist keine Rechtsberatung — im Zweifel kurz prüfen lassen.
