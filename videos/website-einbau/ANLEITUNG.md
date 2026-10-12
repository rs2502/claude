# Video anstelle des Spaghetti-Fotos einbauen

Das Video ersetzt das Foto rechts oben auf der Startseite. Es hat dasselbe Hochformat (4:5),
dieselben runden Ecken und denselben Schatten, weil es dieselbe Klasse `hero-photo` nutzt.

## 1. Sicherung
Kopie von `/start/startseite.html` herunterladen und aufheben.

## 2. Drei Dateien hochladen
Aus dem Ordner `assets/` nach **`/start/assets/`** auf deinem Webspace (dort liegt auch `dining.jpg`):

- `italia-hero.mp4`
- `italia-hero.webm`
- `italia-hero-poster.jpg`

Dateinamen nicht ändern.

## 3. Eine Zeile austauschen
`/start/startseite.html` im Texteditor öffnen, die Zeile mit `dining.jpg` suchen
(Strg+F bzw. Cmd+F: `dining.jpg`) und die ganze `<img …>`-Zeile durch den Block aus
`zeile-ersetzen.html` ersetzen. Kein CSS nötig.

Falls du vorher schon den Video-Block unter dem Hero eingefügt hattest
(`<section class="film">…</section>` und die `.film`-CSS-Zeilen): beides wieder löschen.

## 4. Speichern und hochladen
Fertig. Das Video läuft automatisch, stumm, in Schleife, auch auf dem Handy.
