# Reel-Analyse: Thunfisch-Pizza (KI-Clip)

Quelle: `318731bd-1013.mov` · 7,46 s · 24 fps · 1080x1950 · H.264 · Ton: AAC-Spur vorhanden, aber **komplett stumm (−91 dB)**

Ergebnis (v2): `thunfisch-pizza_fx_sfx.mp4` · 7,79 s · 1080x1920 · BT.709 · 48 kHz Stereo · −13,9 LUFS / −3,1 dBTP

## Quell-Shots (per `scdet` ermittelt)

| Shot | Frames | Inhalt |
|---|---|---|
| A | 0–14 | Hook: Thunfisch, Schinken, Zwiebeln, Käse regnen auf die Tomaten-Spirale |
| B | 15–24 | Flash-Forward: fertige Pizza, Makro |
| C | 25–41 | Pizzabäcker lächelt, schlägt Mehl auf den Teig |
| D | 42–51 | Hände drücken den Teig flach |
| E | 52–68 | Kelle zieht Tomatensoße als Spirale |
| F | 69–90 | Mozzarella rieselt |
| G | 91–98 | Toppings mit Schinken fallen auf Soße ohne Käse (**rausgeschnitten**) |
| H | 99–112 | Thunfisch wird auf den Käse gelegt |
| I | 113–131 | Pizza auf der Schaufel |
| J | 132–151 | Ab in den Ofen |
| K | 152–161 | Fertige Pizza, Makro |
| L | 162–178 | Pizzabäcker präsentiert die fertige Pizza |

## Neuer Schnitt (v2, aus `timeline.py`)

| Shot | Start | Tempo |
|---|---|---|
| A | 0:00.00 | Zeitlupe, bremst von ~0,9x auf ~0,3x ab (Bewegungs-Interpolation, 4x) |
| B | 0:01.08 | normal |
| C | 0:01.50 | normal |
| D | 0:02.21 | normal |
| E | 0:02.63 | normal |
| F | 0:03.33 | normal |
| H | 0:04.25 | normal |
| I | 0:04.83 | normal |
| J | 0:05.63 | Zeitraffer, beschleunigt von ~0,7x auf ~2,1x |
| K | 0:06.21 | normal |
| L | 0:06.63 | Zeitlupe, die zum Stillstand kommt |

## Was gut ist

- Der Hook arbeitet ab Frame 1: Bewegung, Fülle, Food-Porn.
- Der Flash-Forward in Shot B gibt einen Grund, dranzubleiben.
- Unter 8 s, Anfang und Ende zeigen die Pizza, der Loop funktioniert.

## Was im Original fehlte oder störte, und was jetzt gemacht ist

1. **Kein Ton** → SFX + eigener Beat.
2. **Kontinuitätsfehler (KI):** Shot G (Schinken auf Soße ohne Käse) ist raus. **Offen:** Im Hook (A) fällt weiterhin Schinken. Der Shot ist zu stark, um ihn zu streichen. Wenn das stört, müsste der Schinken per KI-Video-Edit entfernt werden.
3. **1080x1950** → auf 1080x1920 zugeschnitten.
4. **Kein Text-Hook** → „DIE UNTERSCHÄTZTESTE PIZZA?“ (0:00.04–0:01.83).
5. **Keine Orientierung** → Schritt-Labels: 1 Teig, 2 Tomatensoße, 3 Mozzarella, 4 Thunfisch, 5 Ab in den Ofen, „Fertig.“

## AFX (Visual Effects)

| Effekt | Wo |
|---|---|
| Leichte S-Kurve, Farben neutral zum Original (BT.709) | ganzes Reel |
| Vignette + feines Film-Grain | ganzes Reel |
| Punch-in-Zoom (7–12 %, ease-out) | jeder Schnitt |
| Langsamer Push-in in jedem Shot (2,5 %, im Finale 6 %) | jeder Shot |
| Weißer Flash + RGB-Split | 0:00, B, K |
| Camera-Shake | Hook, Teig, Thunfisch, Ofen, Finale |
| Speed-Ramps (Zeitlupe / Zeitraffer) | A, J, L |
| Zoom-Blur-Transition in den Ofen | I → J |
| Ofen-Glow mit Flackern (neutraler Bloom) | J |
| Light-Sweep über die fertige Pizza | L |
| Text-Hook mit Pop-in (Overshoot), Labels mit Slide-in/-out | siehe oben |
| Weiß-Ramp in den letzten 3 Frames → nahtloser Loop | Ende |

Texte: Inter Display Black. Alles liegt im sicheren Bereich (y 230–1440, rechts frei für die Instagram-Buttons).

## SFX + Musik

Alles prozedural synthetisiert, keine Samples, keine Lizenzfragen. Stems in `audio/`.

**Musik:** Beat mit 128 BPM in a-Moll (Am–F–C–G): Kick, Clap, Hi-Hats, Bass, Mandolinen-Tremolo (Karplus-Strong). Snare-Wirbel als Fill am Ende von Takt 3, **der Ofen-Shot landet exakt auf dem Downbeat von Takt 4** (5,625 s). Der Beat stoppt auf Schlag 14 (6,56 s), das Finale gehört Ding und Brutzeln. Die Musik wird unter den großen Impacts geduckt (Side-Chain).

| Zeit | Shot | Sounds |
|---|---|---|
| 0:00.00 | A | Sub-Boom, Down-Whoosh, 7 Plops über die Zeitlupe verteilt |
| 0:01.08 | B | Whoosh-in, Boom, Brutzeln |
| 0:01.50 | C | Whoosh, Mehl-Puff, Hand-Thud |
| 0:02.21 | D | 2× Teig-Thud, Mehl-Puff |
| 0:02.63 | E | Swish, Soßen-Squelch mit Bläschen |
| 0:03.33 | F | Käse-Rieseln |
| 0:04.25 | H | Whoosh, 2 Plops |
| 0:04.83 | I | Whoosh, Holzschaufel-Scrape |
| 0:05.63 | J | Großer Whoosh, Boom, Ofenfeuer |
| 0:06.21 | K | Boom, Brutzeln |
| 0:06.67 | L | Ding, Shimmer zum Glanzreflex, Riser in den Loop |
| durchgehend | – | leiser Küchen-Raumton |

ElevenLabs-Sounds und -Musik wurden versucht, sind aber an **0 Credits** im ElevenLabs-Konto gescheitert (nichts abgebucht). Das Flow-Projekt „Thunfisch-Pizza Reel – SFX + Beat“ mit den Prompts liegt bei ElevenLabs. Mit Credits kann man es dort neu starten.

**Tipp beim Posten:** Lass den Originalton auf 100 %. Wenn du einen Trend-Sound nutzen willst, nur sehr leise (10 %), weil schon ein Beat drin ist.

## Neu rendern

```bash
ffmpeg -i input.mov -vf "minterpolate=fps=96:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=fdiff:scd_threshold=8" -crf 12 src96.mp4
python3 fx_video.py src96.mp4 fx_silent.mp4
python3 sfx_audio.py audio
ffmpeg -i fx_silent.mp4 -i audio/sfx_mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest thunfisch-pizza_fx_sfx.mp4
```

Benötigt: `ffmpeg`, `numpy`, `scipy`, `opencv-python-headless`, `Pillow`, Schrift Inter Display Black. Schnitt, Tempo, Labels und Hook-Text stehen in `timeline.py`. Effekte stehen in `fx_video.py`, Sounds und Beat in `sfx_audio.py`.
