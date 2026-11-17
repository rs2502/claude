# fx – 16 Reel-Effekte

Nachbau der Effekte aus Reinhards Vorlage-Reel als Remotion-Komponenten, für den Skill `automatisch`
(`.claude/skills/automatisch/SKILL.md`, Abschnitt 4a und 7).

Teardown · Mosaic Drop · Halo · Match Cut · The Dealer · Hall of Fame · Rabbit Hole · Billboard ·
Liquid Glass · Prompt Drop · The Arena · Headline · Split Stage · Frosted · Color Pop · Reveal Bar

```bash
npm install
npm run studio                 # im Browser ansehen und anpassen
npm run demo                   # alle 16 hintereinander → out/demo.mp4 (braucht public/test.mp4)
npx remotion render src/index.ts Edit out/<name>-fx.mp4 --props=.cache/plan.json --timeout=120000
```

| Ordner | Inhalt |
|---|---|
| `src/effects/` | ein Effekt pro Datei, Register mit Dauer und Freisteller-Bedarf in `index.ts` |
| `src/Edit.tsx` | ganzes Video mit Ton, Effekte als Cues (`fx`, `from`, `dur`, `props`) |
| `scripts/` | `make-tiles.sh` (Kacheln aus dem Video), `setup-rvm.sh` + `make-cutout.sh` (Freisteller), `stills.mjs` (Kontrollbilder) |
| `public/` | eigenes Material (bleibt lokal, nicht im Git); `public/fonts/` liegt bei |

Schriften: Inter, JetBrains Mono, Playfair Display, Source Serif 4, Instrument Serif (alle SIL Open Font
License 1.1). Freisteller: RobustVideoMatting (GPL-3.0), wird von `setup-rvm.sh` separat geladen.
`make-cutout.sh` und `rvm-alpha.py` stammen aus github.com/KenoMedien/claude-video-effects (MIT).
