# Ristorante Pizzeria Italia — scroll-directed website

Bruchhausen-Vilsen. Texts, menu, address and opening hours come from ristorante-pizzeria-italia.com; edit them in `src/lib/content.ts`.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · GSAP + ScrollTrigger · Lenis · Three.js / R3F / Drei · Framer Motion · SplitType

```bash
npm install
# put video-1.mp4, video-2.mp4 and image-1…4.jpeg in public/media (see public/media/README.md)
npm run encode:videos   # optional: re-wraps films with short GOPs for frame-accurate scrubbing
npm run dev
```

## How it is built

| Layer | Where | Notes |
|---|---|---|
| One clock | `components/motion/SmoothScroll.tsx` | Lenis is driven by GSAP's ticker, so scroll, ScrollTrigger and video seeks share one rAF. |
| Video scrubbing | `hooks/useScrubVideo.ts` | Scroll progress maps to `currentTime`; one seek in flight at a time; eased playhead; stepped scrub on coarse pointers; src attached only within one viewport; never `play()`s (except a muted iOS prime). |
| Atmosphere | `components/three/*` | A single fixed, code-split canvas: DOF-shaded dust + spice points, instanced herb leaves, rising steam, pointer parallax. Sections only change its *mood* (`MoodZone`, `useMood`). `PerformanceMonitor` drops DPR under load. |
| Type | `components/motion/SplitReveal.tsx` | SplitType lines become masks; words or letters rise, scrubbed to scroll. Re-splits on resize and after fonts load; screen readers get one sr-only copy. |
| Images | `components/motion/MaskImage.tsx` | clip-path aperture reveal + inner scale/drift, `next/image`. |
| Chrome | `components/chrome/*` | Real-progress loader that opens into the hero, curtain page transitions, magnetic buttons, custom cursor (fine pointers only), header that yields on scroll. |
| Reservation | `sections/Reservation.tsx` | Links to the existing online reservation portal and phone. |

Chapters: Hero (video 1: pasta with parmesan, 9:16) → Willkommen → Pasta shapes (video 2, 16:9, names synced to scroll) → Zutaten constellation → Handwerk timeline (horizontal) → Saucen (tilt cards) → Feiern (layered gallery); these use the photos → Reservierung. `/menu` is the full menu. Films are portrait (9:16): full-bleed on phones, framed plates from tablet up.

**Responsive.** Phones get their own compositions rather than stacked desktop layouts: caption cards in place of callouts, swipe shelves in place of the constellation and the floating sauce cards, a vertical method with its own film, shorter sticky runs, and stepped scrubbing.

**Accessibility.** Semantic landmarks, skip link, keyboard-reachable everything, visible focus, alt text and labelled films. `prefers-reduced-motion` turns off Lenis, WebGL and scrubbing (each film holds one still frame), collapses sticky runs, and shows the static versions of every annotated chapter.

**Media.** `public/media` is git-ignored, so serve the films from a CDN. Chromium builds without H.264 support cannot decode `.mp4`/H.264; production browsers can.
