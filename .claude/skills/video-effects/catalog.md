# Effect catalog (both engines, duplicates removed)

21 effects from engine **R** (Remotion, `~/claude-video-effects`) + 46 from engine **P** (Python,
`~/claude-effects-py`) = **67 effects**. The frame is always 1080 × 1920; times are seconds in the
finished, cut video.

## Duplicates: one entry each

These five were in both packs. The catalog lists the R version (better cut-out, header row, captions).
Use the P twin only on the quick route (no full edit), or when the user explicitly wants that look.

| Effect (R `kind`) | P twin (`fx`) | Difference |
|---|---|---|
| `orbit` | `orbit` | P can circle the user's own reels (`images`), R circles six icons |
| `text` (Text behind me) | `backdrop-word` | P drops the word in, with `font` bold/serif |
| `magazine` (Magazine cover) | `cover-star` | P has an `editorial` look (`look=editorial`) |
| `snap` (Snap zoom) | `lean-in` | P zoom adjustable (`zoom`, max 2) |
| `phone` (Phone mock-up) | `reel-frame` | P is a flat reel card instead of a phone |

## Related, but different: both kept

Pick by the look the user describes.

| R | P | How they differ |
|---|---|---|
| `checks` (pills above the head) | `check-pills` | P: grid-paper room, reel boards behind, cursor clicks the pills |
| `checklist` (ticks off all numbered effects) | `todo`, `task-list` | `todo`: card beside the head with your own items; `task-list`: Claude task list under the chin |
| `headlines` (news bands fly in) | `headline-wall`, `match-cut` | P: headlines pile up + total / news pages cut on one word |
| `curve` (glowing curve behind you) | `liquid-glass-graph`, `over-the-shoulder-zoom` | P: glass card with a real number counting up |
| `portal` (camera flies into a circle) | `rabbit-hole` | P: frame tunnels into itself, spinning |
| `viewfinder` (REC, zoom 1x → 2x) | `locked-on` | P: corner brackets lock onto the face, camera follows |
| `zoomcut` (blur zoom, flash) | `slow-push` | P: slow cinematic push with background blur |
| `broll` (editing program slides up) | `timeline`, `broll-split` | P: film grade with timeline and REC / B-roll on top, you below |
| `studio` (lamps flicker on) | `spotlight`, `led-sign` | P: lights go out, you stay lit / LED sign types itself |

## Engine R: the 21 effects (+ intro)

Entered in `~/claude-video-effects/src/project.ts`:

```ts
effects: {
  total: 3,
  cues: [
    { kind: "greenscreen", from: 2.4, to: 4.6, nr: 1, name: "Green screen", at: 0.6, src: "city.jpg" },
    { kind: "glass", from: 4.6, to: 6.2, nr: 2, name: "Glass break", at: 0.4, face: { x: 560, y: 840 }, src: "my-video-glass.jpg" },
    { kind: "text", from: 6.2, to: 8.9, nr: 3, name: "Text behind me", at: 0.3, word: "AI", plate: "room.jpg" },
  ],
},
```

| Field | Meaning |
|---|---|
| `kind` | effect from the table below |
| `from`, `to` | window in seconds; the effect covers the whole window |
| `nr`, `name` | header row (red number, name, progress bars up to `total`). `nr: 0` = no header |
| `at` | trigger word in seconds from `from` |
| `face` | face centre in pixels, default `{ x: 540, y: 820 }`. Always measure and set it on every cue |
| `src` | image in `public/` (photo, empty room, still) |
| `plate` | empty room in `public/`, shown behind the cut-out instead of the camera frame |
| `word` | `text`: the word behind you (default "WOW"). `magazine`: masthead (default "COVER"). `checklist`: closing line |
| `lines` | text lines, depending on the effect |
| `prompt` | `chat`: the message in the speech bubble |
| `badge` | `magazine`: sticker text (default "NEW"). `chat`: chip next to the name |
| `avatar` | `phone`: profile picture in `public/` |
| `handle` | `phone`: account name (default "yourname") |

Each effect runs only in its own window. Between two effects the previous header stays up. "Cut-out" =
needs `cutout` in `project.ts` ([matting.md](matting.md)); without it the effect runs without the
standing-in-front trick.

| kind | Name | What happens on screen | Ingredients | Texts |
|---|---|---|---|---|
| `preview` | (intro) | all effect names pop up above the head | | `nr: 0`; names come from the other R cues |
| `greenscreen` | Green screen | studio green behind you, on `at` a circle opens a photo | Cut-out, photo `src` | |
| `magazine` | Magazine cover | cover shoot, masthead behind the head, text column, sticker, barcode | Cut-out | `word`, `lines` [kicker, big number, title, subtitle], `badge` |
| `chat` | Chat takeover | the frame shrinks into a chat attachment, reply "On it." with three checks | | `prompt`, `lines` three steps, `badge` |
| `curve` | Growth curve | dark grid, a glowing curve shoots up behind you | Cut-out | `lines` [bottom, top]; no made-up numbers |
| `glass` | Glass break | cracks over a still, 84 shards fall, the video plays underneath | still `src` | `at` ≈ 0.4 |
| `orbit` | Orbit | six icons circle at head height, passing behind you | Cut-out, `face` | |
| `dolly` | Dolly zoom | you keep your size, the empty room contracts | Cut-out, `src` or `plate`, `face` | |
| `paper` | Paper cutout | golden paper surface, you with a white edge, star, circle, bar | Cut-out | |
| `headlines` | Headline storm | five breaking-news bands fly in and run behind you | Cut-out, better with `plate` | `lines` up to five |
| `phone` | Phone mock-up | the frame shrinks into a phone with a Reels-style interface | | `handle`, `avatar` |
| `snap` | Snap zoom | jump to 1.62× in 0.13 s | `face` | |
| `studio` | Studio reveal | dark studio, on `at` the lamps flicker on, ON AIR lights up | Cut-out, photo `src` | `at` on "light" |
| `liquid` | Liquid glass | a distorting glass lens glides over the face | `face` | |
| `portal` | Zoom portal | circle with the live frame top left, the camera flies into it | | `at` on the word |
| `broll` | B-roll overlay | an editing program slides up, a clip drops onto the track | | `at` on "B-roll" |
| `text` | Text behind me | a giant word behind you, you in front of it | Cut-out, `plate` | `word` |
| `viewfinder` | Digital zoom | viewfinder with REC, timecode, zoom 1.0x → 2.0x | `face` | `at` on the word |
| `frame` | Frame escape | the frame becomes a tilted card, your head climbs over its edge | Cut-out, `face` | |
| `zoomcut` | Zoom cut | blurred zoom in, flash, back out | `face` | |
| `checks` | Check pop | up to four pills with check marks above the head | | `lines` |
| `checklist` | Checklist | all numbered effects get ticked off, a counter runs along | | `word` closing line |

`theme` in `project.ts` overrides colours (`theme: { accent: "#7c3aed", deep: "#1e1b4b" }`, fields in
`src/effects/theme.tsx`). Font Montserrat is included; another via `theme.font` and a `FontFace` in
`src/fonts.ts`. `liquid` uses `public/lens-map.png` (ships ready-made).

## Engine P: the 46 effects

Plan entry `{"fx": "<name>", "start": s, "end": s, "text": "...", ...}`; options go into the same object
(or `--opt key=value` for a single effect). Lists are joined with `|`. All options are optional.

| `fx` | What it does | Options |
|---|---|---|
| `noise` | reels pile up behind your head, one every quarter second | `images` (folder), `size` |
| `lineup` | numbered tiles fan out in an arc above your head | `text` (tile names) |
| `locked-on` | corner brackets snap onto your face, the camera follows | `zoom` (1.35), `text` (tag) |
| `spotlight` | kills the lights, keeps you lit | `text` (glowing word behind), `color`, `push`, `look=sparkle` (golden rays, glitter) |
| `the-bill` | prints your instructions like a receipt above your head | `text` (lines) |
| `moody` | colour grade | `grade` (`moody`, `bw`, `warm`, `cool`, `pop`) |
| `swipe` | before/after slider sweeps across you | `grade` (after look) |
| `todo` | checklist card beside your head ticks off | `text` (items), `ticks` (seconds), `title` |
| `comment-box` | Instagram comment bar types a word and posts it | `text` (default EFFECTS) |
| `tap` | Follow button pops up and flips to Following | `at`, `x`, `y` (0 to 1), `color` |
| `pause-point` | freeze frame, hand-drawn arrow points at you | `text`, `color`, `label_x` |
| `uninstall` | glitchy uninstall bar breaks the frame apart | `text` |
| `shortcut-rain` | keyboard keys rain down behind you | `text` (keys), `count` |
| `reject-stamp` | big red stamp slams onto the screen | `text`, `color`, `angle`, `y` |
| `countdown-flip` | 3, 2, 1 flip clock above your head | `from` |
| `rabbit-hole` | the frame tunnels into itself, spinning | `ratio`, `speed`, `spin` |
| `scribble` | marker doodles draw themselves around you | `text`, `color` |
| `glass-widgets` | frosted glass widgets float around your head | `text` (big number), `name`, `handle`, `look=simple` |
| `red-collage` | black-and-white you, giant red word behind, three lines slam in | `text`, `lines`, `tag` |
| `split-headline` | headline card slides down, pushes you to the bottom half | `text` (lines), `hl`, `pill` |
| `pastel-word` | lavender room, giant word behind you, profile card gets followed | `text`, `name`, `handle` |
| `check-pills` | grid-paper room, reel boards behind, cursor clicks blue pills | `text` (pills), `images` |
| `timeline` | dark red film grade, editing timeline, REC timecode, playhead | `text`, `sub`, `tc` |
| `headline-box` | punch-in with a two-line headline, second line in a white box | `text` (lines), `zoom` |
| `profile-wall` | your reels grid fills the wall behind you, counter ticks up | `images`, `count`, `label` |
| `tier-list` | tier list drops in, an item flies into S tier | `title`, `item`, `others` |
| `broll-split` | B-roll on top with a price-tag sticker, you below | `images`, `text` (tag) |
| `phone-fan` | your reels fan out like a hand of phones under a headline | `images`, `text` (lines) |
| `dot-reveal` | your shot builds out of glowing dots, then snaps to full | `color`, `cell` |
| `headline-wall` | your headlines pile up behind your head, then a total pops in | `text` (`headline::meta\|…`), `total`, `label` |
| `task-list` | task list under your chin, each step spins, then ticks green. **Call it as `"fx": "checklist"`** (name clash with R) | `text` (`step::meta\|…`), `title` |
| `liquid-glass-graph` | liquid glass card under your chin, graph climbs, number counts up | `text`, `from`, `to` (e.g. `197K`), `color`, `look=bento` (smoked screen behind + bento tiles; `donut`, `kpi`, `bars`) |
| `carousel-spin` | your reels spin around you in a 3D carousel | `images`, `count`, `size`, `turns` |
| `match-cut` | news pages cut on one word, locked in a red box behind your head | `text`, `color` |
| `apple-toggles` | iPhone settings card flips its switches on, tucked behind your head | `text` (rows), `ticks`, `color`, `pos=below` (under the chin), `overlap`, `zoom` |
| `led-sign` | the lights drop, a glowing LED sign types itself behind you | `text` (lines), `color`, `push` |
| `slow-push` | slow push-in to your face, room melts out of focus | `zoom` (1.6), `blur` |
| `over-the-shoulder-zoom` | camera pushes into one corner, glass graph beside your head, then the other corner with a second graph | `text` (two labels), `to` (two numbers), `zoom` (2.0) |
| `messages` | iMessage notifications pop in and stack up | `text` (messages), `title`, `y` |
| `place-in-grid` | you shrink into the centre of your 3x3 grid, 8 reels pop in around you with view counts | `images`, `views` (9 counts) |
| `tape-label` | yellow tape with your line lands on your chest | `text` |
| `select-resize` | blue selection box grabs your number, a cursor drags it bigger | `text` (2X) |
| `wave-trim` | panel shows your voice, the silence on both ends collapses | |
| `huge-strike` | huge serif word wipes in behind your head, a red line crosses it out | `text`, `at` (0.6) |
| `crayon-write` | red crayon writes your word behind your head, underlines it | `text` |
| `fan-build` | your reel covers deal into a fan behind your head | `images`, `count` (13) |

P aliases also work: `bill`, `to-do`, `follow`, `stamp`, `countdown`, `rain`, `pause` (and `cover` =
`cover-star`, the P twin of `magazine`).
