# FTP-Ordner für Gästemenü und Menü-Studio

Lade beide Ordner aus diesem Paket nebeneinander nach `/default-website/`:

- `menue/` → Gästemenü `https://www.damimmo.de/menue/` (die Zusatzkarte liegt unter `/menue/karte.html`)
- `menue-studio/` → Editor `https://www.damimmo.de/menue-studio/`

Die Gästeseite `index.html` liest nur **Aperitivo** und den **Mittagstisch** aus `menu.json`.
Alles andere der Extra Karte erscheint nur auf `karte.html`.

## Voraussetzungen auf dem Server

- **PHP 8.0 oder neuer** (`publish.php` nutzt `mixed`, `str_starts_with`, `catch` ohne Variable).
- PHP muss in **`menue/`** schreiben dürfen (dort liegt `menu.json`) und in **`menue-studio/`**
  (dort legt `publish.php` den Ordner `backups/` an).
- Apache mit `.htaccess` (für die Sperren unten). Bei nginx die Regeln dort nachbilden:
  Zugriff auf Dateien mit führendem Punkt und auf `/menue-studio/backups/` verbieten.

## Veröffentlichungsschlüssel einrichten

Erzeuge lokal einen zufälligen Schlüssel aus 64 Hex-Zeichen:

```sh
openssl rand -hex 32
```

Öffne `publisher-secret.example.php` aus `menue-studio/`, ersetze den Platzhalter durch den
Schlüssel und speichere eine Kopie als `.publish-secret.php` im selben Ordner. Die Datei muss mit `<?php`
beginnen und den Schlüssel in einfachen Anführungszeichen zurückgeben. Die Beispiel-Datei bleibt lokal.
Manche FTP-Programme zeigen Dateien mit Punkt am Anfang nicht an – "versteckte Dateien anzeigen" einschalten.

Im Studio wird der Schlüssel beim Veröffentlichen abgefragt. Das FTP-Passwort ist dafür nicht geeignet.

## Was beim Veröffentlichen passiert

- `publish.php` schreibt `../menue/menu.json` (atomar) und stellt die Sprache immer auf Deutsch.
- Vorher wird die bisherige Karte als `menue-studio/backups/menu-<Zeitstempel>.json` gesichert
  (die letzten 30 bleiben). Der Ordner ist per `.htaccess` gesperrt.
- Hat zwischenzeitlich jemand anderes veröffentlicht, lehnt der Server mit `stale_menu` ab, statt still zu überschreiben.
- Hintergrundbilder müssen in **`menue/bilder/`** liegen (dort liest sie die Gästeseite).

## Neue Dateien

Eigene Hintergründe zusätzlich in `HINTERGRUENDE` in `menue-studio/app.js` eintragen – die Galerie
liest den Ordner nicht selbst aus.

Wörterbuch und Symbole (`woerterbuch.js`, `symbole.js`) liegen in **beiden** Ordnern und müssen gleich bleiben.
