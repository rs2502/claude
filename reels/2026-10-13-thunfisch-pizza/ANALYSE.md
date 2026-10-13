# Reel-Analyse: Thunfisch-Pizza (KI-Clip)

Quelle: `318731bd-1013.mov` · 7,46 s · 24 fps · 1080x1950 · H.264 · Ton: AAC-Spur vorhanden, aber **komplett stumm (−91 dB)**

Ergebnis: `thunfisch-pizza_fx_sfx.mp4` (1080x1920, 48 kHz Stereo, −14,9 LUFS / −1 dBTP)

## Schnittliste (12 Shots, per `scdet` ermittelt)

| Shot | Frames | Zeit | Inhalt |
|---|---|---|---|
| A | 0–14 | 0:00.00 | Hook: Thunfisch, Schinken, Zwiebeln, Käse regnen auf die Tomaten-Spirale |
| B | 15–24 | 0:00.63 | Flash-Forward: fertige Pizza, Makro |
| C | 25–41 | 0:01.04 | Pizzabäcker lächelt, schlägt Mehl auf den Teig |
| D | 42–51 | 0:01.75 | Hände drücken den Teig flach (Top-Shot) |
| E | 52–68 | 0:02.17 | Kelle zieht Tomatensoße als Spirale |
| F | 69–90 | 0:02.88 | Mozzarella rieselt |
| G | 91–98 | 0:03.79 | Toppings fallen (Schinken, Zwiebeln, Thunfisch) |
| H | 99–112 | 0:04.13 | Thunfisch wird auf den Käse gelegt |
| I | 113–131 | 0:04.71 | Pizza auf der Schaufel, "Italia"-Shirt |
| J | 132–151 | 0:05.50 | Ab in den Ofen |
| K | 152–161 | 0:06.33 | Fertige Pizza, Makro |
| L | 162–178 | 0:06.75 | Pizzabäcker präsentiert die fertige Pizza |

Schnittrhythmus: alle 0,3–0,9 s. Das ist für Food-Reels genau richtig.

## Was gut ist

- Der Hook arbeitet ab Frame 1: Bewegung, Fülle, Food-Porn. Kein Standbild, kein Intro.
- Der Flash-Forward in Shot B ("so sieht's am Ende aus") gibt einen Grund, dranzubleiben.
- 7,5 s sind ideal für Loops. Ende und Anfang zeigen beide die Pizza, der Loop funktioniert also.
- Look und Licht sind konsistent: warm, Profi-Küche.

## Was fehlt oder stört

1. **Kein Ton.** Das ist der größte Hebel. Food-Reels leben von ASMR (Mehl, Soße, Ofen, Brutzeln), und stumme Reels verlieren bei Watch-Time und Reichweite. → Ist jetzt gelöst.
2. **Kontinuitätsfehler (typisch KI):** In A und G fällt *Schinken* auf die Pizza, die fertige Pizza in B, K und L ist aber reine Thunfisch-Zwiebel ohne Schinken. G zeigt Toppings auf Soße *ohne* Käse, obwohl F den Käse schon draufgelegt hat. Wer genau hinschaut, kommentiert das. Wenn das egal ist: lassen, Kommentare sind Reichweite. Sonst: G kürzen oder ersetzen.
3. **1080x1950 statt 1080x1920:** Das ist kein Standardformat, Instagram skaliert oder schneidet selbst. → Im Ergebnis auf 1080x1920 zugeschnitten (je 15 px oben und unten).
4. **Kein Text-Hook / keine Einblendung:** Viele schauen zuerst ohne Ton. Ein kurzer Overlay (z. B. "Thunfisch-Pizza in 7 Sekunden") in den ersten 1,5 s würde helfen. Bewusst *nicht* eingebaut, weil der Text vom Kanal abhängt.
5. **Kein Ende / kein CTA:** Der Clip endet ohne Abschluss. Das ist für den Loop okay. → Der Ding-Sound plus Lichtreflex auf der Pizza machen jetzt einen klaren "Fertig"-Moment.

## AFX (Visual Effects), eingebaut

| Effekt | Wo |
|---|---|
| Color Grade: leichte S-Kurve für mehr Kontrast, Farben farbneutral zum Original (BT.709) | ganzes Reel |
| Vignette + feines Film-Grain | ganzes Reel |
| Punch-in-Zoom (7–12 %, ease-out über 6 Frames) | auf jedem Schnitt |
| Langsamer Push-in innerhalb jedes Shots (2,5 %, im Finale 6 %) | jeder Shot |
| Weißer Flash + RGB-Split (Chromatic Aberration) | 0:00, B (0:00.63), G (0:03.79), K (0:06.33) |
| Camera-Shake | Hook-Einschlag, Teig drücken, Toppings-Drop, Thunfisch, Finale |
| Zoom-Blur-Transition (rein in den Ofen) | I → J (0:05.38–0:05.63) |
| Ofen-Glow mit Flackern (neutraler Bloom, keine Farbverschiebung) | J |
| Leichter Glow | K + L |
| Light-Sweep / Glanzreflex über die Pizza | L (0:06.88–0:07.38) |
| Weiß-Ramp in den letzten 3 Frames → nahtloser Loop in den Flash bei 0:00 | Ende |

## SFX (Sound Effects), eingebaut

Alle Sounds sind prozedural synthetisiert (keine Samples, also keine Lizenzfragen). Stems liegen in `audio/`.

| Zeit | Shot | Sounds |
|---|---|---|
| 0:00.00 | A | Sub-Boom-Impact, Down-Whoosh, 6 "Plops" bei der Landung (0:00.30–0:00.56) |
| 0:00.63 | B | Whoosh-in, kleiner Boom, Brutzeln |
| 0:01.04 | C | Whoosh, Mehl-"Puff", Hand-Thud |
| 0:01.75 | D | 2× Teig-Thud, kleiner Mehl-Puff |
| 0:02.17 | E | Swish, nasses Soßen-Squelch mit Bläschen |
| 0:02.88 | F | Käse-Rieseln (Granular-Sprinkle) |
| 0:03.79 | G | Down-Whoosh, Impact, 4 Plops |
| 0:04.13 | H | 2 weiche Plops (Thunfisch) |
| 0:04.71 | I | Whoosh, Holzschaufel-Scrape |
| 0:05.50 | J | Großer Whoosh (synchron zum Zoom-Blur), tiefer Boom, Ofenfeuer (Rauschen + Knistern) |
| 0:06.33 | K | Boom, Brutzeln |
| 0:06.80 | L | "Ding" (Glocke), Shimmer zum Glanzreflex, High-Riser in den Loop |
| durchgehend | – | leiser Küchen-Raumton |

Mix: leichter Hall (0,7 s, 14 %), Soft-Clip, −14,9 LUFS integriert, −1,0 dBTP. Das passt zur Lautheit von Instagram.

**Tipp beim Posten:** Leg in Instagram einen Trend-Sound leise darunter (10–20 %) und lass den Originalton auf 100 %. So bekommst du den Reichweiten-Boost vom Trend-Audio und behältst die SFX.

## Neu rendern

```bash
python3 fx_video.py input.mov fx_silent.mp4
python3 sfx_audio.py audio
ffmpeg -i fx_silent.mp4 -i audio/sfx_mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest thunfisch-pizza_fx_sfx.mp4
```

Benötigt: `ffmpeg`, `numpy`, `scipy`, `opencv-python-headless`. Timings stehen als Frame-Konstanten oben in `fx_video.py` (`CUTS`, `FLASH_CUTS`, `SHAKES`) und in `build()` in `sfx_audio.py`.
