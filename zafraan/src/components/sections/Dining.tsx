"use client";

import { useEffect, useRef } from "react";
import { gsap, MQ } from "@/lib/gsap";
import { media } from "@/lib/content";
import { useScrubVideo } from "@/hooks/useScrubVideo";
import { useMood } from "@/hooks/useMood";
import { ScrubVideo } from "@/components/motion/ScrubVideo";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { MaskImage } from "@/components/motion/MaskImage";
import { Folio } from "@/components/ui/SectionHead";
import { cn } from "@/lib/utils";

const gallery = [
  { n: 2 as const, alt: "Candle-lit table set with brass thalis and linen.", cls: "col-span-7 col-start-1 aspect-[4/5] z-10", speed: -6, caption: "The long table, 19:30" },
  { n: 3 as const, alt: "A cook pouring saffron milk over rice in a copper handi.", cls: "col-span-4 col-start-8 mt-[18vh] aspect-[3/4] z-20", speed: -16, caption: "Dum, unsealed" },
  { n: 4 as const, alt: "Close detail of kulfi with pistachio and rose on a silver plate.", cls: "col-span-5 col-start-5 -mt-[22vh] aspect-[5/4] z-30", speed: -26, caption: "To close" },
  { n: 1 as const, alt: "Overhead view of the sixteen-course royal thali.", cls: "col-span-3 col-start-10 -mt-[8vh] aspect-square z-20", speed: -36, caption: "Plate i." },
];

const facts = [
  { k: "12", v: "Seats, one table" },
  { k: "16", v: "Courses, unhurried" },
  { k: "1", v: "Sitting each night" },
];

export function Dining() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const filmLayer = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useMood(section, "dining");
  useScrubVideo({ video, trigger: stage, src: media.video(6), start: "top bottom", end: "bottom top", stillAt: 0.5 });

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(MQ.motion, () => {
      // Background parallax: the room drifts slower than the page and settles in scale.
      gsap.fromTo(
        filmLayer.current,
        { yPercent: -7, scale: 1.08 },
        { yPercent: 7, scale: 1, ease: "none", scrollTrigger: { trigger: stage.current, start: "top bottom", end: "bottom top", scrub: true } },
      );
      gsap.utils.toArray<HTMLElement>("[data-depth]", section.current).forEach((el) => {
        const d = Number(el.dataset.depth);
        gsap.fromTo(el, { yPercent: -d }, { yPercent: d, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={section} id="dining" aria-labelledby="dining-title" className="relative">
      {/* Full-bleed film with the chapter title set large over it */}
      <div ref={stage} className="relative h-[140svh] overflow-hidden bg-paper max-md:h-[100svh]">
        <div
          ref={filmLayer}
          className={cn(
            "absolute inset-x-0 -inset-y-[14%] overflow-hidden will-change-transform",
            "md:inset-auto md:right-[7vw] md:top-[12%] md:aspect-[9/16] md:h-[108svh] md:rounded-[3px] md:shadow-lift",
          )}
        >
          <ScrubVideo ref={video} label="The dining room at dusk: candlelight, brass, guests leaning in over the thali." />
        </div>
        <div className="container-editorial relative z-10 flex h-full flex-col justify-center">
          <div>
            <Folio no="07" label="The evening" className="mb-8 w-fit rounded-full bg-canvas/90 px-4 py-2 shadow-soft" />
            <h2 id="dining-title" className="display relative z-10 text-[clamp(4rem,10.5vw,12rem)] leading-[0.86] text-canvas [text-shadow:0_2px_40px_rgb(43_35_32/0.35)] md:text-ink md:[text-shadow:none]">
              <SplitReveal as="span" by="chars" className="block" start="top 95%" end="top 45%" stagger={0.03}>
                An evening,
              </SplitReveal>
              <SplitReveal as="span" by="chars" className="display-italic block pl-[12vw]" start="top 95%" end="top 40%" stagger={0.03}>
                composed.
              </SplitReveal>
            </h2>
          </div>
        </div>
      </div>

      {/* Overlapping gallery at four depths */}
      <div className="container-editorial grid-editorial relative py-[clamp(6rem,16vh,12rem)] max-md:flex max-md:flex-col max-md:gap-12">
        {gallery.map((g) => (
          <figure key={g.n} data-depth={g.speed} className={`${g.cls} relative max-md:aspect-[4/5] max-md:w-[86%] max-md:odd:self-start max-md:even:self-end`}>
            <MaskImage src={media.image(g.n)} alt={g.alt} sizes="(min-width: 768px) 45vw, 86vw" className="h-full w-full rounded-[2px] shadow-lift" from="center" drift={8} />
            <figcaption className="display-italic mt-3 text-[0.95rem] text-ink-soft">{g.caption}</figcaption>
          </figure>
        ))}
      </div>

      <div className="container-editorial grid-editorial border-t border-line pb-[clamp(5rem,14vh,10rem)] pt-12">
        <p className="col-span-12 mb-10 max-w-[34rem] text-[1.0625rem] leading-[1.75] text-ink-soft md:col-span-5">
          The room seats twelve around a single walnut table. Courses arrive in the order the old kitchens intended: light to rich, cool to warm, sour to sweet — and then, silence and tea.
        </p>
        <dl className="col-span-12 grid grid-cols-3 gap-6 md:col-span-6 md:col-start-7">
          {facts.map((f) => (
            <div key={f.k} className="flex flex-col-reverse border-l border-line pl-5">
              <dt className="eyebrow mt-2 text-ink-mute">{f.v}</dt>
              <dd className="display text-[clamp(3rem,6vw,5.5rem)] leading-none">{f.k}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
