# Hochladen auf ristorante-pizzeria-italia.com

Per FTP in den Ordner `/start/` des Webspace laden:

| Aus diesem Paket | Ziel auf dem Server |
|---|---|
| `start/startseite.html` | `/start/startseite.html` (ersetzt die alte Datei) |
| `start/pizza-effekt/` (ganzer Ordner) | `/start/pizza-effekt/` |
| `start/assets/hero-pizza.mp4`, `.webm`, `.jpg` | `/start/assets/` (zu den vorhandenen Dateien dazu) |

`start/startseite.original.html` ist die bisherige Startseite als Sicherung. Die muss nicht hochgeladen werden. Falls etwas nicht passt, einfach diese Datei wieder als `startseite.html` hochladen.

## Was sich an der Startseite geändert hat

1. Im `<head>`: eine Zeile, die `pizza-effekt.css` lädt.
2. Zwischen „Qualität, Kreativität & herzlicher Service“ und dem Bilder-Streifen steht der neue Pizza-Abschnitt. Der Bilder-Streifen bleibt erhalten.
3. Vor `</body>`: eine Zeile, die `pizza-effekt.js` lädt.

4. Im Hero: Statt des Fotos läuft ein kurzes, endlos laufendes Video (Margherita vor dem Holzofen). Dateien: `start/assets/hero-pizza.mp4`, `hero-pizza.webm` und das Standbild `hero-pizza.jpg`, das bei langsamer Verbindung und bei „Bewegung reduzieren“ angezeigt wird. Dein altes `dining.jpg` bleibt auf dem Server, wird aber nicht mehr genutzt.

Alles andere (Intro, Öffnungszeiten-Balken, Feiern-Effekt, Öffnungsstatus) ist unverändert.

Nach dem Hochladen die Seite einmal mit Strg+F5 (Handy: Seite neu laden) aufrufen und durch den Pizza-Abschnitt scrollen.
