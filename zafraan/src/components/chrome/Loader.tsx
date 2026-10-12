"use client";

import { animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { experience } from "@/lib/store";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const EASE_CURTAIN = [0.76, 0, 0.24, 1] as const;
const WORD = "Zafraan";

/**
 * Loading is real: the counter reports fonts + the hero film's buffer, eased
 * so it never jumps. On completion a window opens in the paper — first a
 * small framed plate onto the hero film, then the whole page — so the
 * loader literally becomes the hero.
 */
export function Loader() {
  const [done, setDone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const aperture = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const chrome = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  // Tiny drifting spice specks, 2D canvas — cheaper than booting WebGL here.
  useEffect(() => {
    const c = canvas.current;
    if (!c || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = c.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const resize = () => {
      c.width = innerWidth * dpr;
      c.height = innerHeight * dpr;
    };
    resize();
    const tones = ["156,59,38", "200,134,47", "217,164,65", "111,122,79", "43,35,32"];
    const specks = Array.from({ length: 46 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: (Math.random() ** 2 * 2.2 + 0.5) * dpr,
      vx: (Math.random() - 0.5) * 0.00012,
      vy: -(Math.random() * 0.00022 + 0.00005),
      a: Math.random() * 0.45 + 0.15,
      t: tones[(Math.random() * tones.length) | 0],
      p: Math.random() * Math.PI * 2,
    }));
    let raf = 0;
    const draw = (now: number) => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const s of specks) {
        s.x += s.vx + Math.sin(now * 0.0004 + s.p) * 0.00008;
        s.y += s.vy;
        if (s.y < -0.02) s.y = 1.02;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${s.t},${s.a})`;
        ctx.ellipse(s.x * c.width, s.y * c.height, s.r, s.r * 0.7, s.p + now * 0.0003, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const started = performance.now();
    const minDuration = reduce ? 300 : 2200;
    let fonts = 0;
    let film = 0;
    let shown = 0;
    let raf = 0;
    let finished = false;

    document.fonts.ready.then(() => (fonts = 1));
    const hero = document.querySelector<HTMLVideoElement>("video[data-hero]");
    const readFilm = () => {
      if (!hero || !hero.duration) return;
      if (hero.readyState >= 4) film = 1;
      else if (hero.buffered.length) film = Math.min(1, hero.buffered.end(hero.buffered.length - 1) / hero.duration);
    };
    const giveUp = () => (film = 1);
    hero?.addEventListener("progress", readFilm);
    hero?.addEventListener("canplaythrough", giveUp);
    hero?.addEventListener("error", giveUp);
    if (!hero) film = 1;
    const ceiling = setTimeout(giveUp, 7000); // never hold a visitor hostage

    const loop = (now: number) => {
      readFilm();
      const time = Math.min(1, (now - started) / minDuration);
      const real = fonts * 0.2 + film * 0.8;
      const goal = Math.min(real, time) * 100;
      shown += (goal - shown) * 0.08;
      if (goal >= 100 && shown > 99.5) shown = 100;
      if (counter.current) counter.current.textContent = String(Math.floor(shown)).padStart(3, "0");
      if (bar.current) bar.current.style.transform = `scaleX(${shown / 100})`;
      if (shown === 100 && !finished) {
        finished = true;
        exit(reduce);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    async function exit(reduceMotion: boolean) {
      const r = root.current!;
      const a = aperture.current!;
      if (reduceMotion) {
        await animate(r, { opacity: 0 }, { duration: 0.4 });
        experience.set({ loaded: true });
        setDone(true);
        return;
      }
      const letters = r.querySelectorAll<HTMLElement>("[data-letter]");
      letters.forEach((el, i) =>
        animate(el, { y: ["0%", "-110%"] }, { duration: 0.9, delay: i * 0.035, ease: EASE_CURTAIN }),
      );
      r.querySelectorAll<HTMLElement>("[data-fade]").forEach((el) => animate(el, { opacity: 0 }, { duration: 0.7, delay: 0.3 }));
      // 1. A framed plate opens onto the film.
      const plateW = Math.min(innerWidth * 0.34, 520);
      const plateH = plateW * 1.25;
      a.style.opacity = "1";
      await animate(a, { width: [0, plateW], height: [0, plateH] }, { duration: 1.1, delay: 0.45, ease: EASE_OUT });
      // 2. The plate becomes the page.
      experience.set({ loaded: true });
      await animate(
        a,
        { width: innerWidth + 4, height: innerHeight + 4, borderRadius: ["2px", "0px"] },
        { duration: 1.25, ease: EASE_CURTAIN },
      );
      setDone(true);
    }

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(ceiling);
      hero?.removeEventListener("progress", readFilm);
      hero?.removeEventListener("canplaythrough", giveUp);
      hero?.removeEventListener("error", giveUp);
    };
  }, []);

  if (done) return null;

  return (
    <div ref={root} data-loader role="status" aria-live="polite" aria-label="Loading Zafraan" className="fixed inset-0 z-[100] overflow-hidden">
      {/* The aperture: transparent, its enormous shadow is the paper. */}
      <div
        ref={aperture}
        aria-hidden
        className="absolute left-1/2 top-1/2 h-0 w-0 -translate-x-1/2 -translate-y-1/2 rounded-[2px]"
        style={{ boxShadow: "0 0 0 200vmax var(--color-paper)" }}
      />
      <div data-fade aria-hidden className="paper-fibre pointer-events-none absolute inset-0 opacity-70 mix-blend-multiply" />
      <canvas data-fade ref={canvas} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />

      <div data-fade ref={chrome} className="container-editorial absolute inset-0 flex flex-col justify-between py-8 text-ink">
        <div className="flex items-start justify-between">
          <span className="eyebrow">House of Indian Gastronomy</span>
          <span className="eyebrow hidden sm:block">Vol. IV — The Royal Thali</span>
        </div>
        <div className="flex items-end justify-between gap-8">
          <p className="max-w-[18rem] text-[0.8125rem] leading-relaxed text-ink-soft">
            Sixteen courses, composed one ingredient at a time. Setting the table…
          </p>
          <div className="flex flex-col items-end gap-3">
            <span className="display text-[clamp(4rem,11vw,10rem)] leading-none tabular-nums">
              <span ref={counter}>000</span>
              <span className="display-italic text-[0.35em] align-top">%</span>
            </span>
            <span className="block h-px w-40 origin-left bg-line">
              <span ref={bar} className="block h-px w-full origin-left scale-x-0 bg-ink" />
            </span>
          </div>
        </div>
      </div>

      <h1 aria-hidden className="display pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[clamp(4.5rem,15vw,15rem)] text-ink">
        {WORD.split("").map((ch, i) => (
          <span key={i} className="inline-block overflow-clip pb-[0.06em] align-bottom">
            <span data-letter className="inline-block" style={{ fontStyle: i === 0 ? "italic" : undefined }}>
              {ch}
            </span>
          </span>
        ))}
      </h1>
    </div>
  );
}
