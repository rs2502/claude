# Storyboard Studio v1.0

Statischer Prompt-Generator für den kompletten Weg vom Charakter bis zum fertigen Video.
Vier Dateien, kein Server, kein API-Key — läuft lokal per Doppelklick auf `index.html`
und genauso auf Strato (Ordner einfach hochladen).

## Ablauf

1. **Charakter-Sheet** — Figur beschreiben → Prompt für ein Turnaround-Blatt (4 Ansichten,
   neutrales Grau). Das erzeugte Bild ist deine Referenz für alles Weitere.
   Figur mit „In Bibliothek speichern" ablegen, dann steht sie in Tab 3 auf Knopfdruck bereit.
   Optional ein **Referenzbild hochladen** (ziehen, klicken oder mit ⌘V einfügen): der Prompt
   bekommt dann automatisch den Passus, dass das angehängte Bild verbindlich ist.
   Mit hinterlegtem API-Key füllt „Felder aus Bild ausfüllen" alle Felder automatisch aus dem Foto.
2. **Produkt-Sheet** — dasselbe für Produkte (Front, Rück, Seite, Detail), inklusive Upload
   und automatischer Bildanalyse.
3. **Storyboard** — Story, Stil, Dauer und Panelanzahl eintragen, „Gerüst erzeugen" klicken.
   Die Panels bekommen automatisch Story-Beats, Shot-Typen und Timecodes; du füllst nur
   die Beschreibungen aus. Ausgabe wahlweise:
   * **Bild-Prompt** — fertiger Prompt für GPT Image 2 & Co., inklusive Caption-Leisten,
     Panelnummern, Timecodes und Footer-Zeile als echter Text auf dem Blatt.
   * **KI-Auftrag** — wenn du die Panels nicht selbst schreiben willst: diesen Text in
     Claude oder ChatGPT einfügen, das Modell liefert die Panels und den fertigen Bild-Prompt.
   Über **Aufteilen in** lässt sich das Storyboard in 2 oder 3 Blätter zerlegen — für Videomodelle
   mit kurzem Zeitlimit. Jedes Blatt wird einzeln generiert, die Panelnummern und Timecodes laufen
   durch, und der Umschalter über der Ausgabe wechselt zwischen „Alle" und den einzelnen Blättern.
4. **Animationsfilm** — macht aus denselben Panels einen Videoprompt, entweder als ganzen
   Film oder als einzelne Shot-Prompts. Bei geteiltem Storyboard entsteht pro Blatt ein
   eigenes Segment mit eigener Länge und Anschluss-Anweisung an das vorherige Segment. Kamerabewegung wird aus dem Shot-Typ abgeleitet,
   Ton standardmäßig rein diegetisch, kein Text im Bild.

## Stil-Katalog

Die Stil-Felder in Tab 1–3 sind Auswahllisten: anklicken oder tippen, dann erscheinen die
hinterlegten Stile mit einer Vorschau ihrer Beschreibung.

**16 Bild-/Filmstile:** Pixar-Stil 3D · Disney 2D klassisch · Anime modern · Anime handgemalt ·
Stylized 3D malerisch · Comic / Graphic Novel · Cinematic Live Action · Stop Motion / Knete ·
Aquarell-Bilderbuch · Dark Fantasy · Retro Sci-Fi · Film Noir · Cel-Shaded Spiel ·
Scherenschnitt / Papercut · Pixel Art · Horror

**10 Produktstile:** Produktfoto realistisch · Luxus / Premium · Minimalistisch ·
Futuristischer Tech-Render · Cinematic Hero Shot · Stylized 3D · Explosionszeichnung ·
Blueprint / technisch · Vintage-Werbung · Makro-Detail

Hinter jedem Eintrag steckt eine ausformulierte englische Stilbeschreibung (Beleuchtung,
Oberflächen, Palette, Kameracharakter), die in den Prompt wandert — nicht nur das Schlagwort.
Eigene Formulierungen kannst du weiterhin eintippen, sie werden unverändert übernommen.

## Bild und Video erzeugen

Über jedem Prompt steht eine Leiste **„Bild erzeugen in:"** bzw. **„Video erzeugen in:"**.
Ein Klick kopiert den Prompt und öffnet den Dienst — bei ChatGPT steht der Prompt dank
`?q=`-Parameter direkt im Eingabefeld (bei sehr langen Storyboard-Prompts nur die Zwischenablage,
dort ⌘V). Referenzbild bzw. Storyboard-Blatt dort anhängen, absenden.

* Bild: ChatGPT, Gemini, Adobe Firefly, Whisk
* Video: Sora, Veo (Gemini), Kling, Runway

## Kostenlos: Beschreibung über einen Chat (kein API-Key)

In Tab 1 und 2 aufklappen: **„Kostenlos ohne API-Key: Beschreibung über einen Chat holen"**.

1. **„Auftrag kopieren & Claude öffnen"** — claude.ai öffnet sich in einem neuen Tab, der Auftrag
   steht per URL bereits im Eingabefeld (alternativ ChatGPT). Zusätzlich liegt er in der
   Zwischenablage, falls der Dienst den Parameter einmal ignoriert.
2. Dort nur noch **das Foto anhängen** und absenden.
3. Die JSON-Antwort kopieren, in der App unten einfügen, **„Antwort übernehmen"**.

Die Felder füllen sich exakt wie bei der automatischen Analyse. Code-Blöcke und Text drumherum
werden mitverarbeitet. Kostet nichts und funktioniert mit einem normalen Chat-Konto.

## Bildanalyse per API einrichten (optional, kostenpflichtig)

Drei Anbieter stehen zur Wahl (⚙ Bildanalyse → Anbieter):

* **Anthropic Claude** (Standard) — beschreibt auch Gesichtsmerkmale.
  Key: console.anthropic.com → API keys. Das Claude-Abo gilt dafür **nicht**, die API braucht
  eigenes Guthaben.
* **OpenAI** — beschreibt auch Gesichtsmerkmale. Key: platform.openai.com → API keys.
* **Google Gemini** — günstiger, blockiert aber laut Richtlinie das Beschreiben von Gesichtern
  realer Personen (`PROHIBITED_CONTENT`). Die App fragt dann automatisch ein zweites Mal ohne
  Gesichtsmerkmale und übernimmt Kleidung, Statur und Accessoires; das Gesicht trägst du selbst ein.

Jeder Anbieter hat seinen eigenen Key und sein eigenes Modell — der Umschalter merkt sich beides.


Ohne Key läuft alles wie beschrieben — das hochgeladene Bild dient dann nur als Referenz zum
Anhängen. Für das automatische Ausfüllen:

1. Key beim gewählten Anbieter erstellen.
2. In der App oben auf **⚙ Bildanalyse**, Anbieter wählen, Key einfügen, speichern.
3. **„Passendes Modell finden"** klicken. Google sperrt ältere Modelle für neu erstellte Keys
   (`This model is no longer available to new users`), und die Modell-Liste allein verrät das
   nicht. Der Button fragt die Liste ab, testet die Kandidaten mit einer Mini-Anfrage und trägt
   das erste ein, das tatsächlich antwortet. Weitere funktionierende Modelle stehen danach als
   Vorschlagsliste im Modellfeld. Funktioniert für beide Anbieter.

Der Key liegt ausschließlich im localStorage dieses Browsers, wird **nicht** in die Projekt-JSON
exportiert und geht direkt vom Browser an Google — es gibt keinen Zwischenserver. Standardmodell
ist `gemini-2.5-flash`, im selben Fenster änderbar. Bilder werden vor dem Speichern und Senden
auf max. 900 px verkleinert.

## Bedienung

* Alle Eingaben und Referenzbilder werden automatisch im Browser gespeichert (localStorage).
* Bilder lassen sich per Drag & Drop, Klick oder Einfügen aus der Zwischenablage hinzufügen
  (bis zu 4 pro Tab).
* **Export/Import** sichert ein Projekt als JSON — für Backups oder den Wechsel zwischen Rechnern.
* **Zurücksetzen** leert alle Felder, Panels und Referenzbilder; Charakter-Bibliothek und
  API-Key bleiben erhalten.
* **Felder leeren** (in Tab 1 und 2) räumt nur den jeweiligen Tab auf, ohne das Bild zu löschen.
* **Beispiel** lädt das komplette Musterprojekt „Walter & Rudi" mit 15 ausformulierten Panels —
  praktisch zum Anschauen, überschreibt aber die aktuellen Eingaben.
* Die App startet leer. Die Bildanalyse leert die betroffenen Felder vor dem Ausfüllen, es bleibt
  also nie etwas Altes stehen.

## Version pflegen

Die Versionsnummer steht oben im Kopf der App neben dem Titel (Tooltip zeigt das Datum) und wird
in jede exportierte Projektdatei geschrieben.

Beim Ändern nur **eine Stelle** anfassen: `APP_VERSION` ganz oben in `script.js`.

Um den Browser-Cache musst du dich nicht kümmern. Drei Mechanismen greifen ineinander:
CSS/JS bekommen bei jedem Aufruf einen frischen Zeitstempel, eine Rückkehr über den
Vor-/Zurück-Speicher (bfcache) löst automatisch ein Neuladen aus, und beim Start vergleicht die
App das Änderungsdatum von `index.html` auf dem Server mit der geladenen Fassung — ist die Seite
älter, lädt sie sich genau einmal selbst nach. `index.html` lädt `styles.css` und `script.js`
über einen kleinen Bootstrap-Schnipsel mit `?v=<Zeitstempel>` nach, dazu kommen
`no-store`-Metaangaben für die Seite selbst — jeder Aufruf holt also die aktuellen Dateien.
Der im Tooltip angezeigte Dateistand wird automatisch aus dem `Last-Modified`-Header von
`script.js` gelesen; `APP_DATE` dient nur als Rückfall, wenn die App per Doppelklick über
`file://` geöffnet wird.

## Lokal starten

Doppelklick auf `index.html` genügt. Alternativ mit Server:

```bash
python3 -m http.server 8750 --directory "/Users/reinhardschockemoehle/Documents/Claude/storyboard-studio"
```

In Claude Code ist der Server als `storyboard-studio` in `.claude/launch.json` eingetragen.

## Hinweis zur Bildgenerierung

15 Panels in einem Bild gehen an die Detailgrenze der Modelle. Wenn Gesichter in den kleinen
Panels ausfransen: Panelanzahl auf 5 stellen und drei Blätter nacheinander erzeugen
(Panels 1–5, 6–10, 11–15) — Charakter-Lock und Stilblock bleiben dabei identisch.
Das Charakter-Referenzblatt beim Generieren immer mit anhängen.
