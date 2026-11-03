# CLAUDE.md

## Instagram skills (`.claude/skills/ig-*`)

The skills read `~/.claude/instagram/voice.md`. In this repo the voice file lives
at `.claude/instagram/voice.md` (channel @reinartsworld, presenter "Nova"). Before
running any `ig-*` skill, copy it into place if it is missing:

```bash
mkdir -p ~/.claude/instagram && cp -n .claude/instagram/voice.md .claude/instagram/log.md ~/.claude/instagram/
```

When the voice file or `log.md` changes, update the repo copy in `.claude/instagram/` and commit it.
Approved reel scripts are kept in `.claude/instagram/reels/`.

## Arbeitsweise mit dem Nutzer

- Immer komplette, vollständige Angaben machen: volle Download-Links (direkt
  ladbar, z. B. `https://github.com/rs2502/claude/raw/<branch>/<pfad>`, vorher
  prüfen, dass sie funktionieren) und genaue Schritt-für-Schritt-Anleitungen:
  welche Datei, wohin genau auf dem Webspace, unter welchem Dateinamen.
- Antworten auf Deutsch.
- Website ristorante-pizzeria-italia.com: Die Startseite liegt auf dem Webspace
  unter `/start/startseite.html` (Schriften in `/start/fonts/`). Vor Änderungen
  prüfen, ob die vom Nutzer gelieferte Datei der Live-Version entspricht.
