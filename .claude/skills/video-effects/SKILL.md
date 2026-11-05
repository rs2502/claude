---
name: video-effects
description: Edits a vertical talking-head video - cuts the pauses, captions every word and adds any of 68 video effects (green screen, magazine cover, glass break, orbit, dolly zoom, text behind me, frame escape, spotlight, glass widgets, timeline, editor, checklist, headline wall, comment box, phone fan, liquid glass graph, match-cut, iPhone toggles, LED sign, iMessage pop-ups and more) exactly where the person mentions them. Effects track the face and can sit behind the head. Use for "edit my video", "add the effects", "video effects", /effects, "text behind me", "green screen", "cut-out", when someone names one of the effects, or hands over a raw video with spoken effect cues.
---

# Video effects (two engines, one skill)

This skill combines two effect packs. Every effect exists only once in [catalog.md](catalog.md); the
column **Engine** says which pack renders it.

| Engine | Where | What it brings |
|---|---|---|
| **R** = Remotion | `~/claude-video-effects` (KenoMedien/claude-video-effects) | full edit: cut, captions, header row, 21 effects with a high-quality cut-out ([matting.md](matting.md)) |
| **P** = Python | `~/claude-effects-py` (Vibha-Ramprakash/claude-video-effects) | 47 more effects (46 + our own `editor` in `engine-p/fx_private.py`), quick, no cut-out step needed (face tracking and segmentation built in) |

## Step 0: set up (every time, before anything else)

Run `bash <this skill's folder>/bootstrap.sh` (the folder this SKILL.md is in; use its absolute path). It
downloads both engines at reviewed commits, installs their packages and prints `READY`. Once set up it
returns in a second; the first time takes a few minutes (tell the user). It works in cloud sessions, on a
Mac, on Linux and in WSL. If it stops with a `NEED_...` line, tell the user what is missing in one plain
sentence with the install command for their system, and install it only after they say yes.
`NEED_EGL` (Linux): `sudo apt install libegl1 libgles2`.

On claude.ai chat or anywhere without a shell, ffmpeg and Node, this skill cannot run: say so plainly.

Talk to the user simply and without jargon, in their language. They do not need to know any editing
software and never have to run commands themselves.

## Which route?

- **Only P effects, no cut and no captions wanted** → quick route (below), nothing else.
- **Otherwise** → full edit with engine R (steps 1 to 10). If the plan also contains P effects, run them
  afterwards as a second pass over the finished R video (step 11). Never the other way round: the R cut-out
  is computed from the source video, and P overlays baked in beforehand would show up in front of the head.

## Quick route (engine P only)

All commands in `~/claude-effects-py`.

1. **Set up:** step 0 did it. A `TypeError ... NoneType` from mediapipe when fx.py exits is harmless.
2. **Timing:** "on the word X" → `.venv/bin/python scripts/words.py <video>` gives word times. No timing
   given → whole clip or ask once. Short windows look best: 1.5 to 4 s per effect.
3. **Plan** next to the video as `<name>_effects.json`:
   ```json
   {"effects": [
     {"fx": "spotlight", "start": 3.2, "end": 6.0, "text": "FOCUS"},
     {"fx": "led-sign", "start": 14.0, "end": 16.3, "text": "OPEN|LATE"}
   ]}
   ```
4. **Check stills first:** `.venv/bin/python scripts/fx.py --plan <plan.json> <video> <folder>/check.png --still 4.5,15.2`
   (middle of each effect). Look at every PNG; fix text, timing or options when something covers the face,
   is cut off or unreadable.
5. **Render:** `.venv/bin/python scripts/fx.py --plan <plan.json> <video> <name>_effects.mp4` (keeps the
   audio, 1080p; `--width 2160` for 4K). A single effect needs no plan:
   `.venv/bin/python scripts/fx.py <fx> <video> <out.mp4> --start 3 --end 6 --text "..." --opt key=value`.

## Full edit (engine R)

All commands in `~/claude-video-effects`. Effects live in `src/effects/effects.tsx`; per video only
`src/project.ts` changes.

1. **Set up:** step 0 did it (Node, ffmpeg, `node_modules`, Chrome for rendering).

2. **Prepare the video.** Copy it into `public/` and convert to vertical 1080 × 1920 with a constant frame
   rate (phone videos often have a variable one, which shifts the effects):

   ```bash
   ffmpeg -i <input> -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" \
     -c:v libx264 -crf 18 -preset medium -c:a aac -b:a 192k public/<name>-raw.mp4
   ```

3. **Transcribe.** `node scripts/transcribe.mjs <name>-raw.mp4` writes word timestamps to
   `public/<name>-raw-captions.json`. The first run downloads whisper.cpp and the model (about 1.5 GB); tell
   the user beforehand. Never create `whisper.cpp/` by hand; if it exists without a built program, delete
   it and run again. Pass the language for accuracy, e.g. `node scripts/transcribe.mjs <name>-raw.mp4 de`.

4. **Cut.** Pauses over 0.5 s go, slips and repeated sentences go (keep the last attempt). Leave 0.08 s
   before and 0.15 s after each part. Summarise the cut in two or three sentences. Join only with the concat
   filter:

   ```bash
   ffmpeg -i public/<name>-raw.mp4 -filter_complex \
     "[0:v]trim=start=1.20:end=4.80,setpts=PTS-STARTPTS[v0];[0:a]atrim=start=1.20:end=4.80,asetpts=PTS-STARTPTS[a0]; \
      [0:v]trim=start=5.60:end=9.10,setpts=PTS-STARTPTS[v1];[0:a]atrim=start=5.60:end=9.10,asetpts=PTS-STARTPTS[a1]; \
      [v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]" \
     -map "[v]" -map "[a]" -c:v libx264 -crf 18 -c:a aac -b:a 192k public/<name>.mp4
   ```

   Transcribe the cut video again (`node scripts/transcribe.mjs <name>.mp4`); from here on all times refer
   to `<name>.mp4`. No cut wanted → use the raw version as `<name>.mp4`.

5. **Pick the effects.** Find where the user names or describes an effect ("now the picture shatters" =
   `glass`) and map it with the catalog, including P effects. One cue per effect: `from` just before the
   word, `to` at the next effect or after 2 to 3 s, `at` = seconds from `from` to the trigger word. Show the
   list as a short table: effect, engine, time, word.

6. **Gather the ingredients** (catalog, column Ingredients):
   - **Face centre** (`face`): `ffmpeg -ss <t> -i public/<name>.mp4 -frames:v 1 .cache/face.png`, look at it,
     read off the face centre in pixels and set it on every cue. On the same still read off the chin and set
     `captionsTop` about 40 px below it.
   - **Empty room** (`plate`, for `text`, `headlines`, `dolly`): two seconds filmed without the person, same
     camera position; otherwise ask, or remove the person from a still with an image tool.
   - **Photos** (`src` for `greenscreen`, `studio`): ask the user. Fallbacks: evening sky / dark room.
   - **Still for `glass`**: `ffmpeg -ss <from> -i public/<name>.mp4 -frames:v 1 public/<name>-glass.jpg`.

7. **Cut-out** as soon as an R effect marked "Cut-out" is used: follow [matting.md](matting.md). Takes five
   to ten times the video length; tell the user beforehand.

8. **Write `src/project.ts`:** `video`, `cutout`, `captionsFile`, `captionsTop`, `fps` and
   `durationInSeconds` (both via `ffprobe` from `<name>.mp4`), `effects` with `total`. `theme` changes
   colours (`src/effects/theme.tsx`). Texts in the language of the video. Then `npm run typecheck`.
   The header row (`nr`, `total`), `preview` and `checklist` only know R cues. If P effects come later,
   either count them in by hand (give them a cue-free number) or set `nr: 0`.

9. **Check stills:** `node scripts/stills.mjs .cache/stills <t1,t2,…>`, one time just after each trigger
   word. Done only when no text sits on the face, no person shows twice and there is no halo around the
   cut-out.

10. **Render:** `npx remotion render src/index.ts EffectsVideo out/<name>-effects.mp4`.

11. **P pass (only if the plan has P effects):** run the quick route steps 1, 3 to 5 in `~/claude-effects-py`
    with `~/claude-video-effects/out/<name>-effects.mp4` as input and the same times (R does not change the
    length). Output: `out/<name>-final.mp4`. In the still check also make sure P cards placed under the chin
    (`checklist`, `liquid-glass-graph`, `apple-toggles`, `tape-label`, `messages`) do not cover the
    captions; if they do, move them (`y`, `pos`) or shorten the window.

At the end tell the user where the file is, how long it is and which effects are in it, and remind them to
watch it before posting. For fine-tuning R effects mention `npm run studio`.

## Rules and pitfalls

- **Never put text, badges or numbers on the face.** R: align with `face`, captions start at `captionsTop`.
  P: move with `x`, `y` or shorten the text.
- **Camera effects first** when windows overlap (P runs effects in plan order: `locked-on`, `lean-in`,
  `spotlight`, `slow-push` before overlays). Zoom never past 2x.
- **One frame offset between video and cut-out** gives two heads: almost always the concat demuxer
  (`-f concat`). Use only the concat filter, and compute the cut-out from exactly the file in `video`.
- **Behind a cut-out that moves a lot, show the empty room** (`plate`).
- **Do not clip a rectangle around the head**; clean the matte itself (`scripts/make-cutout.sh`).
- **Landscape footage**: set `crop=1080:1920:<x>:0` when preparing if the person is not centred.
- **Always set the texts of P effects.** Their defaults are the pack author's own ("22 effects", "Claude edits
  my reels", "@vibha.in.progress", English headlines). Every P effect that shows text gets `text`, `title`,
  `name`, `handle`, `lines` etc. in the user's language and about their topic; never ship a default.
- **Head high in the frame** (face centre in the top third, little room above the hair): effects that draw
  above or behind the head (`crayon-write`, `the-bill`, `wave-trim`, `countdown-flip`, `lineup`,
  `apple-toggles`, `select-resize`) end up hidden behind it. Pick effects that use the sides or the lower
  half, or `pos=below` where an effect has it.
- **No emoji in P texts**: the bundled fonts have none, they render as empty boxes.
- **No sound effects.** Captions only through engine R. The P effects are starter versions; be honest about
  that if the user compares them to a reel they saw.
