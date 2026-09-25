# DJ Bernd – Exploded-View-Reel (2-Kanal-DJ-Controller)

| Datei | Inhalt |
| --- | --- |
| `dj_bernd_exploded.blend` | Szene, 1080×1920, 30 fps, Frames 1–450, EEVEE, Kamera `CAM_Reel` |
| `dj_bernd_exploded_preview.mp4` | EEVEE-Preview (540×960, 8 Samples – headless CPU-Render) |
| `build_dj_bernd_exploded.py` | Baut die komplette Szene reproduzierbar aus Primitiven |
| `render_preview.py` | Headless-Preview-Render, ändert die .blend nicht |

## Aufbau

Collections unter `DJ_Controller`: `01_Gehaeuse` (Unterschale, Deckplatte, Gummifüße),
`02_Platine` (Platine, Chips, USB, Steckerleisten), `03_Jogwheels` (je Platter aus gebürstetem Alu, Ring, Mittelkappe),
`04_Mixer` (Crossfader, 2 Linefader, 2×3 EQ-Potis, Schlitze), `05_Pads_Tasten` (2×8 Pads, Play/Cue),
`06_Display`, `07_Schrauben`. Dazu `RIG_Controls`, `Kamera`, `Licht_Studio`. Keine Logos.

## Explosion steuern (keine Bakes)

Empty **`CTRL_Explode`** → Object Properties → Custom Properties:

- `explode_width` – Abstand pro Schicht in m (Standard 0.075) = **Explosionsweite**
- `explode_amount` – globaler Multiplikator 0–1
- `layer_1` … `layer_6` – Fortschritt je Schicht, **keyframed** (Graph Editor → Timing/Easing ändern)

Schichten: 1 Platine · 2 Deckplatte · 3 Platter/Schienen/Display · 4 Ringe/Pads/Tasten ·
5 Kappen/Potis/Mittelkappen · 6 Schrauben (drehen sich heraus). Jedes Teil hat `explode_layer`/`explode_offset`.
Die Explosion läuft über einfache Driver auf **Delta Location Z**, die normale Location bleibt also frei editierbar.

## Timing (Timeline-Marker)

- **0–2 s Hook**: Pads pulsieren mit 120 BPM, die Kamera fährt schnell heran (Expo-Ease)
- **2–9 s Explosion**: von oben nach unten gestaffelt (Schrauben zuerst), Orbit über `CAM_Orbit`
- **9–13 s Zusammenbau**: von unten nach oben, Snap (Expo-in + 4 mm Rebound), Pads blitzen bei jedem Einrasten auf (am stärksten, wenn die Pad-Schicht sitzt)
- **13–15 s Endframe von oben**: Controller oben im Bild, das untere Drittel ist frei für „DJ Bernd“

Kamerapfad: `CAM_Orbit` (Rotation Z + Location), `CAM_Reel` (lokale Distanz/Höhe) und `CAM_Target` (Track-To + DOF-Fokus) sind alle keyframed.

## Final rendern

In Blender einfach `Render → Render Animation` (100 %, 64 Samples, H.264).
Headless: `blender -b dj_bernd_exploded.blend --python render_preview.py -- 100 64`

## Umgebung (Cloud-Session)

Blender-Binary nicht verfügbar (blender.org durch Netzwerk-Policy gesperrt, apt nur 4.0).
Stattdessen: offizielles `bpy`-4.5.14-LTS-Wheel + CLI-Shim `~/.higgsfield/bin/blender`,
Node 24 + `fnf-blender-mcp@0.2.2` unter `~/.higgsfield/blender-mcp`. `doctor`, `bl_health`,
`bl_get_scene_summary` grün. Die Szene wurde über `bl_execute`/`bl_save_project`/`bl_render` gebaut.
