# Ristorante Pizzeria Italia – Tagliatelle mit Steinpilzen & Trüffel (Reel, 15 s)

Quelle: Video_125.mp4 (720x1280, 24 fps, ohne Sprache)

## Finale Version: Voice-over + Untertitel (`vo.ass`)
Stimme: ElevenLabs "Hans – Deep Warm German" (eleven_multilingual_v2), Take 2 (14,1 s), +0,3 s versetzt.
Originalton (Brutzeln) auf 35 % abgesenkt.

> Aromatische Steinpilze, scharf angebraten. Dazu feine Tagliatelle. Eine harmonische
> Kombination aus Waldaromen und Pasta. Und zum Schluss: edler Trüffel.
> Ristorante Pizzeria Italia. Buon appetito!

Endkarte ab 13,2 s: "Tagliatelle mit Steinpilzen & Trüffel" / RISTORANTE PIZZERIA ITALIA

## Alternative: nur Text-Overlays (`ov.ass`)

## Render
Schriften: Playfair Display, Montserrat (Google Fonts) in `~/.fonts`.
`grad.png` = dunkler Verlauf oben, 720x520.

    ffmpeg -i Video_125.mp4 -i vo.mp3 -loop 1 -i grad.png -filter_complex \
      "[0:v][2:v]overlay=0:0:shortest=1,ass=vo.ass[v];[1:a]adelay=300|300[vo];[0:a]volume=0.35[bg];[bg][vo]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]" \
      -map "[v]" -map "[a]" -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac out.mp4
