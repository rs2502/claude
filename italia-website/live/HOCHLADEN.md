# Hochladen auf ristorante-pizzeria-italia.com

Per FTP in den Ordner `/start/` des Webspace laden:

| Aus diesem Paket | Ziel auf dem Server |
|---|---|
| `start/startseite.html` | `/start/startseite.html` (ersetzt die alte Datei) |
| `start/pizza-effekt/` (ganzer Ordner) | `/start/pizza-effekt/` |

`start/startseite.original.html` ist die bisherige Startseite als Sicherung. Die muss nicht hochgeladen werden. Falls etwas nicht passt, einfach diese Datei wieder als `startseite.html` hochladen.

## Was sich an der Startseite geändert hat

1. Im `<head>`: eine Zeile, die `pizza-effekt.css` lädt.
2. Der Bilder-Streifen (Marquee) zwischen „Qualität, Kreativität & herzlicher Service“ und „Mit uns feiern Sie richtig“ ist durch den Pizza-Abschnitt ersetzt.
3. Vor `</body>`: eine Zeile, die `pizza-effekt.js` lädt.

Alles andere (Intro, Öffnungszeiten-Balken, Feiern-Effekt, Öffnungsstatus) ist unverändert.

Nach dem Hochladen die Seite einmal mit Strg+F5 (Handy: Seite neu laden) aufrufen und durch den Pizza-Abschnitt scrollen.
