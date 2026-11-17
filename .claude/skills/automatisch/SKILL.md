---
name: "automatisch"
description: "Voiceover-Video automatisch mit Motion Graphics, 16 fertigen Video-Effekten, Untertiteln und SFX versehen. Nutzen, wenn Reinhard ein Video mit Voiceover schickt und „automatisch“ sagt."
---

# Automatisch – Voiceover → passende Motion Graphics pro Szene

Reinhard schickt ein Video (meist 9:16) mit Voiceover, oft mit dem Sprechtext. Du hörst den Inhalt aus, teilst in Szenen und setzt zu jeder Szene das passende Element. Ergebnis: fertige Dateien, keine Anleitung. Antworten auf Deutsch, kurz.

## 1. Einlesen
- `ffprobe`: Dauer, Auflösung, fps, Audio, HDR (color_transfer smpte2084/arib-std-b67 → beim Extrahieren tonemappen: `zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=mobius:param=0.3:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p`).
- Bildschnitte: `ffmpeg -i in -vf "scale=160:-2,select='gt(scene,0.28)',showinfo" -f null -` → pts_time.
- Sprechpausen: `-af silencedetect=noise=-32dB:d=0.35`.
- Ein paar Frames ansehen (Gesichter, freie Flächen, Kunde/Produkt).

## 2. Text mit Zeitstempeln (Whisper)
Immer lokal mit Whisper transkribieren, kein ElevenLabs:

```bash
ffmpeg -y -i <video> -vn -ar 16000 -ac 1 .cache/<name>.wav
whisper .cache/<name>.wav --model medium --language de --word_timestamps True \
  --output_format json --output_dir .cache
```

- Wörter stehen in `segments[].words[]` mit `word`, `start`, `end` (Sekunden).
- `whisper` fehlt → `pip install openai-whisper`. Das Modell kommt beim ersten Lauf von `openaipublic.azureedge.net` (medium ≈ 1,5 GB) und liegt danach in `~/.cache/whisper`.
- Ohne GPU ist medium langsam (etwa 1–2× Videolänge). Bei Videos über 90 s oder Zeitdruck `--model small`.
- Hat Reinhard den Sprechtext mitgegeben: Zeitstempel von Whisper nehmen, Wörter aber durch seinen Text ersetzen (Wort für Wort abgleichen, Schreibweise und Namen aus seinem Text). Nur wenn Whisper scheitert: seine Wörter proportional zur Zeichenlänge auf die Sprechabschnitte (zwischen den Pausen) verteilen.

In Sätze teilen: Satzzeichen, Pause > 0,6 s oder max. 12 Wörter.

## 3. Szenenplan (das ist der Kern)
Pro Satz höchstens EIN Text/Grafik-Element, nicht jeden Satz belegen (Dichte nach Länge: ~ jeder 2. Satz). Inhaltlich wählen, nicht nur nach Schlüsselwort. Orientierung:
- Erster Satz → Hook groß oben (Kinetic/Papercut Big Letters), Schlüsselwort in Akzentfarbe. Hook darf keine Erwartung setzen.
- Zahl („seit 25 Jahren“, „3 Tipps“, Preis nur wenn gesagt) → Giant Number mit Hochzählen, `frosted` (Profilkarte zählt hoch) oder `color-pop`.
- Aufzählung/Tipp → Headline-Box „TIPP 1“ / Check-List, bei 2–5 Punkten `dealer`.
- Verneinung/Fehler → Stempel „NO GO“/„FALSCH“, stark: `/shatter`.
- Reservieren/Bestellen/Anrufen → Push-Nachricht / Prompt-Bar / `/liquid-glass`.
- „Schreibt in die Kommentare“ → Comment CTA / Comment Drop.
- Qualität/frisch/hausgemacht → Check-Pills.
- „Schaut mal“/Detail → `/magnifying-lens` oder `/spotlight`.
- Vorstellung Person → Lower Third / Name-Tag (nicht übers Gesicht), stark: `/head-pop-out`.
- Frage → Snap-Zoom.
- Betonte Wörter → Zoom-Punch, Shake leicht.
- Bildschnitte → Übergänge abwechselnd (`rabbit-hole`, `mosaic-drop`, `match-cut`, `reveal-bar`, Whip-Pan mit Motion-Blur, Glitch, Flash).
- Ende (letzte ~2,6 s) → `/screen-in-screen` + Endcard: voller Kundenname, Titel, Telefon ≥ 1 s sichtbar.
- Thema/ein starkes Wort → `billboard`; Kernsatz → `split-stage` oder `liquid-glass`; Zitat/CTA → `headline`; „so mache ich das“ → `prompt-drop` oder `teardown`; Erfahrung/viele Beispiele → `hall-of-fame`, `arena`, `halo`.
- Durchgehend wortgenaue Untertitel (Karaoke: aktives Wort in Akzentfarbe, Inter 800 / Anton), y ≈ 1300.

Zusätzlich die Effekte aus Abschnitt 4 einsetzen, wo sie inhaltlich passen, oder wenn Reinhard einen beim Namen nennt („mach Billboard bei …“). Zuerst die 16 fertigen (4a), die Ideen aus 4b nur auf Wunsch. Pro Video höchstens 4–5 große Effekte, keine zwei gleichen direkt hintereinander.

Keine erfundenen Fakten, Preise, Bewertungen, Angebote. Vor dem Rendern den Plan kurz als Tabelle (Zeit · Satz · Element) zeigen, wenn Reinhard da ist; sonst direkt rendern und Plan mitliefern.

## 4. Effekte

### 4a. Fertig gebaut: 16 Effekte in `fx/` (Remotion)
Nachgebaut nach Reinhards Vorlage-Reel. Projekt `fx/` im Repo, Effekt-Code in `fx/src/effects/`, Demo aller 16: `cd fx && npm run demo` → `out/demo.mp4`. „Cut-out“ = sieht nur mit Freisteller richtig aus (Abschnitt 5).

| Schlüssel | Effekt | Was passiert | Passt zu | Braucht | Felder (`props`) |
|---|---|---|---|---|---|
| `teardown` | Teardown | Bild kippt in 3D und zerfällt in beschriftete Ebenen (Hook-Karte, Freisteller, Wand, A-Roll, Ton) | Einstieg, „so ist das gebaut“ | (Cut-out besser) | `hookTitle`, `hookSub`, `layers[{title,sub}]` |
| `mosaic-drop` | Mosaic Drop | Raster-Hintergrund, Kacheln fallen von oben und füllen das Bild | Übergang, „so viele Videos“ | Kacheln | – |
| `halo` | Halo | Ring aus Karten dreht sich auf Kopfhöhe hinter der Person | Thema, Portfolio, Kunden | Cut-out, `face` | `count` |
| `match-cut` | Match Cut | Schnelle Textseiten, dasselbe Wort immer rot in der Mitte | ein Schlüsselwort betonen | – | `word`, `contexts[]`, `filler`, `pageDur` |
| `dealer` | The Dealer | Karten werden ausgeteilt und nacheinander umgedreht | Aufzählung (2–5 Punkte) | – | `cards[{label,sub}]`, `y` |
| `hall-of-fame` | Hall of Fame | Wand aus Thumbnails erscheint hinter der Person | Erfahrung, „hunderte Videos“ | Cut-out, Kacheln | – |
| `rabbit-hole` | Rabbit Hole | Monitor hinter der Person zeigt die nächste Szene, Kamera fliegt hinein | Übergang an Bildschnitt | Cut-out | `next`, `nextTrimBefore`, `nextFilter`, `screen{x,y,w,h}` |
| `billboard` | Billboard | Riesiges Wort auf Kopfhöhe hinter der Person | Thema, ein starkes Wort | Cut-out, `face` | `word` |
| `liquid-glass` | Liquid Glass | Glasleiste, Glaskarte und Badge wachsen aus einem Tropfen | Kernaussage + Absender | – | `main`, `cardTitle`, `cardSub`, `badge`, `y` |
| `prompt-drop` | Prompt Drop | Claude-Code-Terminal: Befehl wird getippt, Video läuft, Schritte haken sich ab | „So mache ich das“, KI, Ablauf | – | `user`, `prompt`, `file`, `steps[]` |
| `arena` | The Arena | Oben gebogener Rang aus Video-Karten, unten das Video | Social Proof, viele Beispiele | Kacheln | `count` |
| `headline` | Headline | Zeitungsseite, Stellen werden gelb/blau markiert und rot eingekreist | Zitat, Aussage, CTA | – | `paper`, `date`, `kicker`, `headline` (`[Kreis]`), `byline`, `body` (`[[g:…]]`, `[[b:…]]`, `[[r:…]]`) |
| `split-stage` | Split Stage | Oben Textkarte, unten Video, Kopf ragt in die Karte | Kernsatz, Hook | Cut-out, `face` | `text` |
| `frosted` | Frosted | Milchglas-Profilkarten, Zahlen zählen hoch | Zahlen (Jahre, Kunden, Effekte) | – | `name`, `avatar`, `stats[{value,unit,color}]`, `y` |
| `color-pop` | Color Pop | Hintergrund grau, Person farbig, großes Wort dahinter | Zahl/Wort mit Gewicht | Cut-out, `face` | `kicker`, `word` |
| `reveal-bar` | Reveal Bar | Bild wird grau, Lichtbalken bringt die Farbe zurück | Neuanfang, „vorher/nachher“ | – | – |

Der 17. Effekt der Vorlage („Backstage“) ist im Vorlage-Video nicht zu sehen und deshalb nicht gebaut.

Alltags-Bausteine (aus dem ersten Kundenvideo, Metro-Clip), gleiche Nutzung über `cues`:

| Schlüssel | Was passiert | Passt zu | Felder (`props`) |
|---|---|---|---|
| `kinetic-hook` | Wörter kleben als Papierstreifen ins Bild, das Hauptwort schlägt rot mit Wackler und Blitz ein | erster Satz, ohne Person im Bild oder darüber | `words[{text,at,hit}]` (Sekunden ab Cue-Start), `y`, `accent` |
| `magnifier` | Runde Lupe vergrößert die Stelle, auf die gezeigt wird | „das hier“, „schaut mal“ | `target{x,y}`, `at{x,y}` (Lupe woanders, wenn sie sonst aufs Gesicht käme), `radius`, `zoom` |
| `endcard` | Video schrumpft in ein Fenster oben, darunter große Karte mit Satz, Name und Telefon | letzte ~2 s | `line`, `name`, `phone`, `stripe[]` |

Bewährt: Hook → ein großes Wort hinter der Person (`color-pop`) → Lupe auf die gezeigte Ware → `endcard`, dazu Untertitel und SFX. Nicht nur 2–3 dezente Effekte setzen; zwischen zwei Effekten höchstens ~2 s ohne Element.

### 4b. Ideen (noch nicht gebaut)
Nur auf Reinhards Wunsch, dann als neue Komponente in `fx/src/effects/` nach dem Muster der fertigen bauen und in `fx/src/effects/index.ts` eintragen. „Cut-out“ = braucht die freigestellte Person.

| Nr. | Effekt | Was passiert | Passt zu | Braucht |
|---|---|---|---|---|
| 01 | `/grid-dive` | Bild zoomt heraus zu einem Raster aus vielen Kopien des Videos, Kamera taucht in eine Kachel und wieder auf Vollbild | Übergang, „viele Kunden“, „jeden Tag“ | – |
| 02 | `/title-orbit` | Titel kreist als Ring um den Kopf, hinten verdeckt von der Person | Thema/Titel nennen | Cut-out, `face` – **nur auf ausdrücklichen Wunsch** (siehe Regel „Kein Text-Ring-Kreisel“) |
| 03 | `/magnifying-lens` | Runde Lupe gleitet ins Bild, vergrößert darunter (Verzerrung + Glanzrand) | „Schaut mal“, Detail, Zutat | Zielpunkt |
| 04 | `/portal` | Kreisförmiges Fenster mit dem Live-Bild und leuchtenden Ringen, Kamera fliegt hinein | Übergang zu neuer Szene | – |
| 05 | `/clone-room` | Mehrere Kopien der Person stehen nebeneinander im Raum (versetzt, kleiner nach hinten) | „Alle“, „das ganze Team“, Übertreibung | Cut-out, leerer Raum |
| 06 | `/infinite-zoom` | Das Video steckt verkleinert im eigenen Bild (oben rechts), Kamera zoomt endlos hinein | „Immer wieder“, Rekursion, Wiederholung | – |
| 07 | `/cube-spin` | Bild wird zur Würfelseite, 3D-Drehung zur nächsten Szene | Übergang an Bildschnitt | zwei Szenen |
| 08 | `/liquid-glass` | Glasleiste (Home, Suche, Play, Profil) mit Lichtbrechung fährt unten ein | App, Bestellen, Online | – |
| 09 | `/screen-in-screen` | Video schrumpft mit Rand und Schatten in ein Fenster, Hintergrund bleibt sichtbar | Ende/Endcard, Zitat | – |
| 10 | `/frame-break` | Video in einem Rahmen, Rahmen zerbricht, Person ragt aus dem Bild heraus | Überraschung, „raus aus …“ | Cut-out |
| 11 | `/tile-tunnel` | Video klein in der Mitte eines Kachel-Tunnels in die Tiefe, Kamera fährt durch | Übergang, „tiefer eintauchen“ | – |
| 12 | `/depth-ui` | UI-Karten (Chat, Code, „fertig“-Badge) schweben vor UND hinter der Person | Technik, Software, KI, „ich zeig dir wie“ | Cut-out |
| 13 | `/vertigo` | Dolly-Zoom: Person bleibt gleich groß, Hintergrund zieht sich mit Speed-Lines zusammen | Schreck, Erkenntnis, „Moment mal“ | Cut-out, leerer Raum |
| 14 | `/phone-fan` | Video in einem Handy, weitere Handys fächern dahinter auf | Social Media, „auf Instagram“ | – |
| 15 | `/shatter` | Bild zerspringt in Scherben, die mit Drehung herausfliegen | Fehler, „vergiss das“, Bruch | Standbild |
| 16 | `/spotlight` | Alles wird dunkel, ein runder Lichtkegel liegt auf der Person/dem Detail | Betonung, Vorstellung | `face` (Cut-out besser) |
| 17 | `/timeline-reveal` | Schnittprogramm mit Timeline fährt ein, das Video läuft im Vorschaufenster | „So entsteht das“, Behind the Scenes | – |
| 18 | `/ribbon-wrap` | Textband wickelt sich schräg um die Person, vorne und hinten | Slogan, Motto, Aktion | Cut-out |
| 19 | `/zoom-through` | Schneller Zoom mit Motion-Blur durch ein Element (Karte, Fenster) in die nächste Szene | Übergang an Bildschnitt | – |
| 20 | `/head-pop-out` | Video in einem Rahmen unten, Kopf und Oberkörper ragen oben aus dem Rahmen | Vorstellung, Hook | Cut-out |

Zutaten:
- **`face`**: Standbild ansehen, Gesichtsmitte in Pixeln ablesen, pro Shot neu. Lupe, Spotlight, Orbit und Zooms richten sich daran aus; Texte nie darauf.
- **Leerer Raum** (`/clone-room`, `/vertigo`): Standbild ohne Person, falls im Material vorhanden; sonst Person mit Inpainting aus einem Standbild entfernen und gegen das echte Bild prüfen (Kanten müssen passen). Geht beides nicht → anderen Effekt wählen.
- **Standbild** (`/shatter`): `ffmpeg -ss <t> -i <video> -frames:v 1 .cache/still.png`.

## 5. Freistellen (Cut-out)
Nur wenn ein Effekt mit „Cut-out“ im Plan ist. RobustVideoMatting über `fx/`:

```bash
cd fx
bash scripts/setup-rvm.sh            # einmalig; nutzt vorhandenes PyTorch mit, sonst ≈ 2 GB
cp <video> public/<name>.mp4
bash scripts/make-cutout.sh <name>.mp4 mobilenetv3   # ohne GPU mobilenetv3, mit GPU resnet50
```

Ergebnis `public/<name>-cutout.webm` (VP9 mit Alpha; beim Lesen `-c:v libvpx-vp9` vor `-i`). Nur den Abschnitt freistellen, in dem der Effekt läuft (vorher mit `-ss/-to` ausschneiden), das spart viel Zeit. Ohne GPU dauert es ein Vielfaches der Clip-Länge – Reinhard vorher sagen. Danach Kanten an Haaren/Schultern auf hellem Grund prüfen; Halo → mehr `erosion` in `make-cutout.sh`.

## 6. Reinhards feste Regeln
- Safe-Zone: alle Texte/CTAs zwischen y 285 und 1500, x 60–960 (Instagram schneidet oben und unten ab).
- Keine Karten/Texte über Gesichtern – pro Shot Platz suchen.
- Kein Fast-Forward/„Gezappel“, Original-Tempo.
- Nicht zu viel Hintergrund-FX; lieber Papercut, Big Letters, saubere Animation. Kein Text-Ring-Kreisel (Orbit = 3D-Kamera-Schwenk).
- Ristorante Pizzeria Italia immer voll ausschreiben; Telefon 04252 4597; der Mann mit grauen Haaren, schwarzer Brille, Bart = Inhaber; Ghostface mit Pizza = Pizzabäcker. Bruchhausen-Vilsen nicht nennen.
- Einheitliches Color Grading (LAB-Mean/Std-Transfer + leichte S-Kurve, Teal/Orange-Split, Sättigung ×0,92).
- Bei Textfragen 3 Alternativen anbieten.

## 7. Rendern

### Fertige Effekte (4a) mit `fx/`
1. Video nach `fx/public/<name>.mp4` (1080×1920, 30 fps), bei Cut-out-Effekten Freisteller wie in Abschnitt 5.
2. Kacheln für Wände/Ringe aus dem eigenen Video: `bash scripts/make-tiles.sh <name>.mp4` → `public/tiles/01.jpg …`. Hat Reinhard eigene Thumbnails, die stattdessen nach `public/tiles/` legen.
3. Plan als JSON schreiben (`.cache/plan.json`), Zeiten in Sekunden, Texte auf Deutsch:
   ```json
   {
     "video": "<name>.mp4", "cutout": "<name>-cutout.webm",
     "face": { "x": 540, "y": 560 },
     "tiles": ["tiles/01.jpg", "tiles/02.jpg"],
     "fps": 30, "durationInSeconds": 41.2,
     "cues": [
       { "fx": "billboard", "from": 3.1, "props": { "word": "PIZZA" } },
       { "fx": "frosted", "from": 9.4, "props": { "name": "Ristorante Pizzeria Italia", "stats": [{ "value": 25, "unit": "Jahre", "color": "orange" }] } }
     ]
   }
   ```
   `dur` pro Cue nur setzen, wenn die empfohlene Dauer (`fx/src/effects/index.ts`) nicht passt.
   Untertitel kommen in denselben Plan: `"captions": { "words": [{ "text": "Extra-Karte,", "start": 3.46, "end": 4.26 }, …], "y": 1300, "hide": [[0, 2.4], [7.9, 11]] }` – Wörter aus Whisper (`segments[].words[]`), abgetrennte Silben wie „-Karte“ ans Wort davor hängen, unter Hook und Endcard ausblenden.
4. Standbilder prüfen: `node scripts/stills.mjs Edit .cache/stills <frame,frame,…> .cache/plan.json`.
5. Rendern: `npx remotion render src/index.ts Edit out/<name>-fx.mp4 --props=.cache/plan.json --timeout=120000`. Auf schwachen Rechnern `--concurrency=2`.
6. SFX aus dem Plan erzeugen und mischen:
   ```bash
   python3 scripts/sfx.py .cache/plan.json .cache/<name>-sfx.wav
   ffmpeg -i out/<name>-fx.mp4 -i .cache/<name>-sfx.wav -filter_complex "[1:a]volume=-10dB[s];[0:a][s]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart out/<Name>_Automatisch.mp4
   ```
7. Vor dem Senden das fertige Video als Kontaktbogen ansehen (`fps=3`, alle Bilder) – nicht nur Einzelbilder.

### Alles andere
- Frames 1080×1920 @30 fps extrahieren (cover-Skalierung), Overlays deterministisch aus Zeit t in HTML/Canvas zeichnen, mit Playwright Frame für Frame aufnehmen, ffmpeg libx264 CRF 18, yuv420p, faststart.
- Effekte, die das Videobild selbst verformen (Raster, Würfel, Tunnel, Scherben, Lupe, Zooms), in Canvas/WebGL mit dem jeweiligen Frame als Textur zeichnen; Cut-out-Frames als zweite Ebene darüber.
- SFX passend synthetisieren (numpy): Whoosh auf Übergänge, Pop/Click auf Texteinblendung, Hit auf Zoom-Punch, Ding auf Push, Stempel-Thump, Glasklirren auf `/shatter`. Mit Original-Ton mischen (Voiceover vorne, SFX ~ -10 dB darunter, alimiter).
- Fremde bekannte Musik nicht verwenden.

## 8. Lieferung
1. `<Name>_Automatisch.mp4` (mit Ton + SFX)
2. `<Name>_Automatisch_ohne_Musik.mp4`, falls Musik drin ist
3. Text-Overlay als ProRes 4444 MOV mit Alpha + Greenscreen-MP4 (kein WebM)
4. Kurzer Szenenplan + 1 Caption-Vorschlag
Vor dem Senden prüfen: Frames an jedem Element ansehen (Safe-Zone, Gesichter, Lesbarkeit, Tippfehler), Telefon-Dauer ≥ 1 s.
