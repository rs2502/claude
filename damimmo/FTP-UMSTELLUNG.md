# FTP-Ordner für Gästemenü und Menü-Studio

Lade beide Ordner aus diesem Paket nebeneinander nach `/default-website/`:

- `menue/` → Gästemenü `https://www.damimmo.de/menue/`
- `menue-studio/` → Editor `https://www.damimmo.de/menue-studio/`

Das Studio veröffentlicht die bearbeitete `menu.json` im Ordner `menue/`.

## Veröffentlichungsschlüssel einrichten

Erzeuge lokal einen zufälligen Schlüssel aus 64 Hex-Zeichen, zum Beispiel im Terminal:

```sh
openssl rand -hex 32
```

Öffne die Datei `publisher-secret.example.php` aus `menue-studio/`, ersetze den Platzhalter durch den Schlüssel und speichere eine Kopie mit dem Namen `.publish-secret.php` im selben Ordner. Die PHP-Datei muss mit `<?php` beginnen und den Schlüssel in einfachen Anführungszeichen zurückgeben. Lade nur `.publish-secret.php` und die übrigen Studio-Dateien nach `/default-website/menue-studio/` hoch. Die Beispiel-Datei kann lokal bleiben.

Im Studio wird der Schlüssel beim Veröffentlichen abgefragt. Das FTP-Passwort ist dafür nicht geeignet.

PHP muss im Studio-Verzeichnis aktiv sein und in den öffentlichen Ordner `menue/` schreiben dürfen. Die ursprüngliche Gästeseite liest Aperitivo und Mittagstisch aus `menu.json`; die Zusatzkarte liegt unter `/menue/karte.html`.
