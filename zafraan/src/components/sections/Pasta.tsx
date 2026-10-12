"use client";

import { useEffect, useRef } from "react";
import { gsap, MQ } from "@/lib/gsap";
import { media, pastaShapes } from "@/lib/content";
import { useScrubVideo } from "@/hooks/useScrubVideo";
import { useMood } from "@/hooks/useMood";
import { ScrubVideo } from "@/components/motion/ScrubVideo";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Folio } from "@/components/ui/SectionHead";

/**
 * Der Pasta-Film (Querformat) läuft mit dem Scrollen. Jede Nudelsorte, die
 * durchs Bild fliegt, bekommt ihren Namen und die passenden Gerichte von der
 * Karte — eingeblendet genau in dem Moment, in dem sie zu sehen ist.
 */
export function Pasta() {
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const fill = useRef<HTMLSpanElement>(null);

  useMood(section, "pasta");
  useScrubVideo({
    video,
    trigger: section,
    src: media.video(2),
    start: "top top",
    end: "bottom bottom",
    stillAt: 0.45,
    onProgress: (p) => {
      if (fill.current) fill.current.style.transform = `scaleX(${p})`;
    },
  });

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(MQ.motion, () => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: section.current, start: "top top", end: "bottom bottom", scrub: 0.6 },
      });
      tl.set({}, {}, 1); // Zeitleiste = gesamte Scrollstrecke
      pastaShapes.forEach((s) => {
        const [a, b] = s.window;
        const el = section.current!.querySelector(`[data-shape="${s.id}"]`);
        const tick = section.current!.querySelector(`[data-tick="${s.id}"]`);
        const letters = el?.querySelectorAll("[data-letter]");
        tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.02 }, a)
          .fromTo(letters ?? [], { yPercent: 110 }, { yPercent: 0, stagger: 0.006, duration: 0.05, ease: "power3.out" }, a)
          .fromTo(el?.querySelector("[data-dishes]") ?? {}, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.05 }, a + 0.04)
          .to(el, { autoAlpha: 0, y: -10, duration: 0.04 }, b)
          .fromTo(tick, { color: "#8f847d" }, { color: "#2b2320", duration: 0.02 }, a);
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={section} id="pasta" aria-labelledby="pasta-title" className="relative h-[420vh] max-md:h-[300vh] motion-reduce:h-auto">
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden motion-reduce:relative motion-reduce:py-24">
        <div className="container-editorial relative">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <Folio no="03" label="Unsere Pasta" className="mb-5" />
              <SplitReveal as="h2" by="words" id="pasta-title" className="display text-[clamp(2.2rem,4.4vw,4.4rem)]" start="top 70%" end="top 10%" trigger="#pasta">
                Zwanzig Pastagerichte.
              </SplitReveal>
            </div>
            <p className="max-w-[22rem] text-[0.9375rem] leading-relaxed text-ink-soft">
              Von Spaghetti bis Tortellini — scrollen Sie langsam und sehen Sie, welche Nudel in welchem Gericht steckt.
            </p>
          </div>

          {/* Die Bildtafel im Querformat */}
          <div className="relative mx-auto aspect-video max-h-[58svh] w-full overflow-hidden rounded-[3px] bg-ink shadow-lift">
            <ScrubVideo ref={video} label="Spaghetti, Penne und Tortellini schweben nacheinander durch das Bild." />

            {/* Der Name der Nudel, unten links auf dem Film */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-[clamp(1rem,3vw,2.5rem)] motion-reduce:hidden" aria-hidden>
              {pastaShapes.map((s) => (
                <div key={s.id} data-shape={s.id} className="invisible absolute bottom-[clamp(1rem,3vw,2.5rem)] left-[clamp(1rem,3vw,2.5rem)] right-[clamp(1rem,3vw,2.5rem)] text-canvas">
                  <p className="eyebrow mb-2 text-canvas/60">{s.it}</p>
                  <p className="display overflow-clip pb-[0.06em] text-[clamp(2.4rem,6vw,6rem)] leading-none">
                    {s.name.split("").map((ch, i) => (
                      <span key={i} data-letter className="inline-block">
                        {ch}
                      </span>
                    ))}
                  </p>
                  <p data-dishes className="mt-3 max-w-[40rem] text-[clamp(0.8rem,1.1vw,0.95rem)] text-canvas/80">
                    {s.dishes}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Fortschritt: drei Stationen */}
          <div className="mt-6" aria-hidden>
            <div className="relative h-px bg-line">
              <span ref={fill} className="absolute inset-0 origin-left bg-ink" style={{ transform: "scaleX(0)" }} />
            </div>
            <ol className="mt-3 grid grid-cols-3">
              {pastaShapes.map((s, i) => (
                <li key={s.id} data-tick={s.id} className="flex items-baseline gap-2 text-ink-mute">
                  <span className="folio">0{i + 1}</span>
                  <span className="text-[0.8125rem]">{s.name}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Für Screenreader und reduzierte Bewegung */}
      <ul className="sr-only motion-reduce:not-sr-only motion-reduce:container-editorial motion-reduce:grid motion-reduce:gap-6 motion-reduce:pb-16 motion-reduce:md:grid-cols-3">
        {pastaShapes.map((s) => (
          <li key={s.id}>
            <p className="display text-2xl">{s.name}</p>
            <p className="text-sm text-ink-soft">{s.dishes}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
