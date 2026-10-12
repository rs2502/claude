"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { gsap, MQ } from "@/lib/gsap";
import { ingredients, media } from "@/lib/content";
import { useScrubVideo } from "@/hooks/useScrubVideo";
import { useMood } from "@/hooks/useMood";
import { ScrubVideo } from "@/components/motion/ScrubVideo";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Folio } from "@/components/ui/SectionHead";
import { Glyph } from "@/components/ui/Glyph";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMedia";

const centre = ingredients.find((i) => i.id === "turmeric")!;
const ring = ingredients.filter((i) => i.id !== "turmeric");
// Spokes from the centre + a loose ring, like a star chart.
const edges: [string, string][] = [
  ...ring.map((i) => [centre.id, i.id] as [string, string]),
  ...ring.map((i, k) => [i.id, ring[(k + 1) % ring.length].id] as [string, string]),
];
const byId = Object.fromEntries(ingredients.map((i) => [i.id, i]));

export function Ingredients() {
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const videoMobile = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();
  const [active, setActive] = useState("saffron");
  const current = byId[active];

  useMood(section, "ingredients");
  // Desktop: the film is a plate behind the star chart. Phones: full-bleed backdrop.
  useScrubVideo({ video, trigger: section, src: media.video(3), start: "top bottom", end: "bottom top", stillAt: 0.5, enabled: !isMobile });
  useScrubVideo({ video: videoMobile, trigger: section, src: media.video(3), start: "top bottom", end: "bottom top", stillAt: 0.5, enabled: isMobile });

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(MQ.desktop + ", " + MQ.tablet, () => {
      const st = { trigger: section.current, start: "top 60%", end: "top -40%", scrub: 0.8 };
      gsap.fromTo("[data-edge]", { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "none", stagger: 0.03, scrollTrigger: st });
      gsap.fromTo("[data-node]", { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, ease: "power2.out", stagger: 0.06, scrollTrigger: { ...st, end: "top 0%" } });
      // Each star drifts at its own depth while the chapter scrolls by.
      gsap.utils.toArray<HTMLElement>("[data-float]").forEach((el, i) => {
        gsap.fromTo(el, { y: 18 + (i % 3) * 14 }, { y: -(18 + (i % 3) * 14), ease: "none", scrollTrigger: { trigger: section.current, start: "top bottom", end: "bottom top", scrub: true } });
      });
      gsap.fromTo("[data-ingredient-card]", { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, ease: "power2.out", scrollTrigger: { trigger: section.current, start: "top 40%", end: "top 0%", scrub: 0.8 } });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={section} id="ingredients" tabIndex={-1} aria-labelledby="ingredients-title" className="relative h-[230vh] max-md:h-auto motion-reduce:h-auto">
      <div className="sticky top-0 h-svh overflow-hidden bg-paper max-md:relative max-md:h-auto max-md:min-h-svh motion-reduce:relative motion-reduce:h-auto">
        <div className="absolute inset-0 md:hidden">
          <ScrubVideo ref={videoMobile} className="opacity-60" />
          <div aria-hidden className="absolute inset-0 bg-canvas/60" />
        </div>

        <div className="container-editorial grid-editorial relative z-10 h-full items-center gap-y-12 pt-[var(--header-h)] max-md:py-28">
          <div className="col-span-12 md:col-span-5 lg:col-span-4">
            <Folio no="04" label="The pantry" className="mb-8" />
            <SplitReveal as="h2" by="words" id="ingredients-title" className="display mb-8 text-[clamp(2.4rem,4.6vw,4.75rem)]" start="top 80%" end="top 20%" trigger="#ingredients">
              Eight spices, sourced by name.
            </SplitReveal>
            <p className="mb-10 max-w-[30rem] text-[1rem] leading-[1.75] text-ink-soft">
              Every jar in our pantry has an address. Hover a star to read where it grows and what it is asked to do.
            </p>

            <div data-ingredient-card className="relative min-h-[14rem] max-md:hidden">
              <AnimatePresence mode="wait">
                <motion.article
                  key={current.id}
                  initial={{ opacity: 0, y: 14, filter: "blur(2px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(2px)" }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-[3px] bg-canvas p-7 shadow-soft"
                  aria-live="polite"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="eyebrow text-ink-mute">{current.hindi}</p>
                      <h3 className="display mt-2 text-[2rem]">{current.name}</h3>
                    </div>
                    <Glyph kind={current.glyph} className="h-10 w-10 text-saffron" />
                  </div>
                  <p className="mt-5 text-[0.9375rem] leading-relaxed text-ink-soft">{current.note}</p>
                  <p className="mt-6 flex items-center gap-3 border-t border-line pt-4 text-[0.75rem] text-ink-mute">
                    <span className="eyebrow text-[0.6rem]">Origin</span>
                    {current.origin}
                  </p>
                </motion.article>
              </AnimatePresence>
            </div>
          </div>

          {/* The constellation */}
          <div className="relative col-span-12 mx-auto aspect-square w-full max-w-[min(42rem,78vh)] max-md:hidden md:col-span-7 lg:col-span-7 lg:col-start-6">
            <div aria-hidden className="absolute left-1/2 top-1/2 aspect-[9/16] h-[112%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[3px] bg-paper shadow-lift">
              <ScrubVideo ref={video} />
              <div className="absolute inset-0 bg-canvas/20" />
            </div>
            <svg aria-hidden className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100">
              {edges.map(([a, b]) => {
                const A = byId[a].at;
                const B = byId[b].at;
                const lit = a === active || b === active;
                return (
                  <line
                    key={a + b}
                    data-edge
                    x1={A.x}
                    y1={A.y}
                    x2={B.x}
                    y2={B.y}
                    pathLength={1}
                    strokeDasharray="1 1"
                    stroke="#2b2320"
                    strokeWidth={lit ? 0.22 : 0.16}
                    strokeOpacity={lit ? 0.6 : 0.2}
                    style={{ transition: "stroke-opacity .6s, stroke-width .6s" }}
                  />
                );
              })}
            </svg>
            <ul>
              {ingredients.map((ing) => (
                <li key={ing.id} data-float className="absolute" style={{ left: `${ing.at.x}%`, top: `${ing.at.y}%` }}>
                  <div data-node className="-translate-x-1/2 -translate-y-1/2">
                    <motion.button
                      type="button"
                      onMouseEnter={() => setActive(ing.id)}
                      onFocus={() => setActive(ing.id)}
                      aria-pressed={active === ing.id}
                      aria-label={`${ing.name}, from ${ing.origin}`}
                      className="group flex flex-col items-center gap-3"
                      whileHover="hover"
                      whileFocus="hover"
                    >
                      <motion.span
                        variants={{ hover: { rotate: 22, scale: 1.08, y: -4 } }}
                        transition={{ type: "spring", stiffness: 160, damping: 14, mass: 0.8 }}
                        className={cn(
                          "grid place-items-center rounded-full bg-canvas shadow-soft transition-shadow duration-500 group-hover:shadow-lift",
                          ing.id === centre.id ? "h-24 w-24" : "h-16 w-16",
                          active === ing.id && "ring-1 ring-saffron/60",
                        )}
                      >
                        <Glyph kind={ing.glyph} className={cn(ing.id === centre.id ? "h-10 w-10" : "h-7 w-7", active === ing.id ? "text-saffron" : "text-ink")} />
                      </motion.span>
                      <span className="display-italic whitespace-nowrap rounded-full bg-canvas/85 px-2.5 py-0.5 text-[0.95rem]">{ing.name}</span>
                    </motion.button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Phones: a swipeable shelf of cards instead of a chart. */}
          <ul className="col-span-12 -mx-[var(--gutter)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--gutter)] pb-4 md:hidden" aria-label="Spices">
            {ingredients.map((ing) => (
              <li key={ing.id} className="w-[78%] shrink-0 snap-center rounded-[3px] bg-canvas p-6 shadow-soft">
                <Glyph kind={ing.glyph} className="h-9 w-9 text-saffron" />
                <p className="eyebrow mt-5 text-ink-mute">{ing.hindi}</p>
                <h3 className="display mt-1 text-[1.75rem]">{ing.name}</h3>
                <p className="mt-3 text-[0.875rem] leading-relaxed text-ink-soft">{ing.note}</p>
                <p className="mt-4 border-t border-line pt-3 text-[0.75rem] text-ink-mute">{ing.origin}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
