# Pizza-Effekt einbauen

Der Effekt ist ein eigener Abschnitt. Er verändert nichts am Rest der Seite: Alle Klassen beginnen mit `pzfx`, es wird keine Bibliothek geladen.

## Inhalt des Ordners

| Datei | Zweck |
|---|---|
| `pizza-effekt.css` | Aussehen des Abschnitts |
| `pizza-effekt.js` | Scroll-Animation |
| `img/` | 7 Bilder (Teig, Soße, Mozzarella, Margherita, Teller, Basilikum, Tomate), zusammen ca. 1,3 MB |
| `einbauen.html` | Der HTML-Baustein zum Kopieren |
| `demo.html` | Testseite, zeigt den Abschnitt zwischen zwei Platzhalter-Abschnitten |

## In 3 Schritten

1. **Hochladen:** Den ganzen Ordner `pizza-effekt` per FTP in den Ordner `/start/` des Webspace laden, also nach `/start/pizza-effekt/`.
2. **In `/start/startseite.html` einfügen:**
   - In den `<head>`: `<link rel="stylesheet" href="/start/pizza-effekt/pizza-effekt.css">`
   - Den Abschnitt aus `einbauen.html` (von `<section class="pzfx"` bis `</section>`) an die gewünschte Stelle kopieren. Empfehlung: anstelle des Bilder-Streifens zwischen „Qualität, Kreativität & herzlicher Service“ und „Mit uns feiern Sie richtig“.
   - Vor `</body>`: `<script src="/start/pizza-effekt/pizza-effekt.js" defer></script>`
3. **Testen:** Seite im Browser und auf dem Handy öffnen und durch den Abschnitt scrollen.

Liegt der Ordner woanders, müssen die Pfade `/start/pizza-effekt/` in den drei Stellen und in den Bildpfaden angepasst werden.

## Anpassen

- **Texte:** direkt in `einbauen.html` (Schritt 1 bis 4 und der Schluss mit den Buttons).
- **Farben:** oben in `pizza-effekt.css` (`--pzfx-accent`, `--pzfx-bg` …).
- **Tempo:** `.pzfx-track { height: 420vh; }` in der CSS. Mehr = langsamer, weniger = schneller.

## Wenn die Seite mit einem Baukasten gebaut ist

Bei Wix, Jimdo, WordPress & Co. geht es über einen „HTML/Code einbetten“-Block. CSS und JS dann direkt in den Block packen (`<style>…</style>` und `<script>…</script>`) und die Bilder in die Mediathek laden; die Bildpfade im Baustein entsprechend ersetzen. Manche Baukästen setzen eingebettetes HTML in einen iFrame; dann funktioniert der Scroll-Effekt dort nicht.
