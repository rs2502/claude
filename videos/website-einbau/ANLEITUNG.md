# Video auf ristorante-pizzeria-italia.com einbauen

Die Startseite liegt unter `/start/startseite.html`, ihre Bilder unter `/start/assets/`.

## 1. Dateien hochladen
Lade die drei Dateien aus dem Ordner `assets/` in den Ordner **`/start/assets/`** auf
deinem Webspace (per FTP-Programm wie FileZilla oder über den Dateimanager deines Hosters),
also dorthin, wo auch `dining.jpg` liegt:

- `italia-hero-web.mp4` (3,2 MB)
- `italia-hero-web.webm` (1,5 MB, wird von den meisten Browsern bevorzugt, lädt schneller)
- `italia-hero-poster.jpg` (Standbild, solange das Video lädt)

## 2. Code einfügen
Öffne `/start/startseite.html` in einem Texteditor (z. B. Notepad++ oder VS Code):

- **`1-html-einfuegen.html`**: Inhalt kopieren und einfügen direkt **vor** der Zeile
  `<!-- ÜBER UNS -->` (also hinter das `</section>` des Hero-Bereichs).
- **`2-css-einfuegen.css`**: Inhalt kopieren und einfügen ganz unten im `<style>`-Block,
  direkt **vor** `</style>`.

Speichern, wieder hochladen, fertig.

## Was passiert
- Das Video erscheint als breite Karte mit runden Ecken und Schatten direkt unter
  „Echte italienische Lebensfreude…“, im gleichen Stil wie deine anderen Karten.
- Es startet automatisch, stumm, in Schleife, auch auf dem Handy.
- Es blendet beim Scrollen weich ein (nutzt deine vorhandene `reveal`-Animation).
- Wer am Gerät „Bewegung reduzieren“ eingestellt hat, sieht nur das Standbild.

## Sicherung
Vor dem Bearbeiten eine Kopie von `startseite.html` anlegen. Falls etwas nicht passt,
einfach die Kopie zurück hochladen.
