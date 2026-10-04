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

## Antworten

Nach jedem Commit/Push immer die genauen GitHub-Links angeben (Branch und jede
geänderte/neue Datei), z. B.
`https://github.com/rs2502/claude/blob/<branch>/<pfad>`.
