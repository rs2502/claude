"use client";

import { useEffect, useRef } from "react";
import { gsap, MQ } from "@/lib/gsap";
import { media, sauces, type Sauce } from "@/lib/content";
import { useMood } from "@/hooks/useMood";
import Image from "next/image";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { TiltCard } from "@/components/ui/TiltCard";
import { Folio } from "@/components/ui/SectionHead";
import { PLATE } from "@/lib/plate";
import { cn } from "@/lib/utils";

/* Desktop composition: each card has its own column, height and drift rate. */
const layout = [
  { left: "8%", top: "44%", speed: 1.0 },
  { left: "29%", top: "62%", speed: 1.35 },
  { left: "56%", top: "34%", speed: 0.8 },
  { left: "75%", top: "56%", speed: 1.15 },
];

function Drop({ tone }: { tone: string }) {
  return (
    <svg viewBox="0 0 40 48" className="h-12 w-10" aria-hidden>
      <path d="M20 2.5C26 13 34 21.5 34 31a14 14 0 0 1-28 0C6 21.5 14 13 20 2.5z" fill={tone} />
      <path d="M13.5 30.5c.4 4 3 6.6 6.4 7.2" stroke="#fff" strokeOpacity=".55" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function SauceCard({ s, i }: { s: Sauce; i: number }) {
  return (
    <TiltCard className="rounded-[4px]">
      <article className="w-[17.5rem] rounded-[4px] bg-canvas p-6 shadow-lift">
        <div className="flex items-start justify-between">
          <Drop tone={s.tone} />
          <span className="folio text-ink-mute">0{i + 1}</span>
        </div>
        <p className="eyebrow mt-6 text-ink-mute">{s.it}</p>
        <h3 className="display mt-1 text-[1.85rem] leading-[1]">{s.name}</h3>
        <p className="mt-3 text-[0.875rem] leading-relaxed text-ink-soft">{s.notes}</p>
        <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-[0.75rem]">
          <span className="text-ink-mute">
            Zu <span className="text-ink">{s.pairs}</span>
          </span>
          <span className="flex gap-1" aria-label={`Schärfe ${s.heat} von 3`}>
            {[0, 1, 2].map((k) => (
              <span key={k} className={k < s.heat ? "h-1.5 w-1.5 rounded-full bg-chili" : "h-1.5 w-1.5 rounded-full bg-ink/15"} />
            ))}
          </span>
        </div>
      </article>
    </TiltCard>
  );
}

export function Sauces() {
  const section = useRef<HTMLElement>(null);
  const photo = useRef<HTMLDivElement>(null);

  useMood(section, "sauces");

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(MQ.motion, () => {
      gsap.fromTo(photo.current, { yPercent: -4, scale: 1.08 }, { yPercent: 4, scale: 1, ease: "none", scrollTrigger: { trigger: section.current, start: "top bottom", end: "bottom top", scrub: true } });
    });
    mm.add(MQ.desktop + ", " + MQ.tablet, () => {
      gsap.utils.toArray<HTMLElement>("[data-sauce]", section.current).forEach((el, i) => {
        const sp = layout[i].speed;
        gsap.fromTo(
          el,
          { y: () => innerHeight * 0.55 * sp, autoAlpha: 0 },
          {
            y: () => -innerHeight * 0.35 * sp,
            autoAlpha: 1,
            ease: "none",
            scrollTrigger: { trigger: section.current, start: "top 30%", end: "bottom bottom", scrub: 1.2, invalidateOnRefresh: true },
          },
        );
        // A slow sway, as if floating on the sauce beneath.
        gsap.fromTo(el, { rotate: i % 2 ? 2.5 : -2.5 }, { rotate: i % 2 ? -1.5 : 1.5, ease: "none", scrollTrigger: { trigger: section.current, start: "top bottom", end: "bottom top", scrub: true } });
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={section} id="sauces" tabIndex={-1} aria-labelledby="sauces-title" className="relative h-[320vh] max-md:h-auto motion-reduce:h-auto">
      <div className="sticky top-0 h-svh overflow-hidden bg-paper max-md:relative max-md:h-auto max-md:min-h-svh motion-reduce:relative motion-reduce:h-auto">
        <div className={cn(PLATE, "md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2")}>
          <div ref={photo} className="absolute -inset-[6%] will-change-transform">
            <Image src={media.image(2)} alt="Ein Gericht mit Sauce aus dem Ristorante Italia." fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
        </div>

        <div className="container-editorial pointer-events-none relative z-10 pt-[calc(var(--header-h)+2.5rem)] max-md:pt-28">
          <div className="inline-block rounded-[3px] bg-canvas/90 p-6 pr-10 shadow-soft">
            <Folio no="06" label="Unsere Saucen" className="mb-5" />
            <SplitReveal as="h2" by="words" id="sauces-title" className="display max-w-[12ch] text-[clamp(2.2rem,4.2vw,4.4rem)]" start="top 75%" end="top 10%" trigger="#sauces">
              Vier Saucen, mit Liebe gerührt.
            </SplitReveal>
          </div>
        </div>

        <ul className="absolute inset-0 z-10 max-md:hidden motion-reduce:hidden">
          {sauces.map((s, i) => (
            <li key={s.id} data-sauce className="absolute" style={{ left: layout[i].left, top: layout[i].top }}>
              <SauceCard s={s} i={i} />
            </li>
          ))}
        </ul>

        {/* Phones & reduced motion: a swipeable tray */}
        <ul className="relative z-10 mt-16 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--gutter)] pb-14 md:hidden motion-reduce:flex" aria-label="Saucen">
          {sauces.map((s, i) => (
            <li key={s.id} className="shrink-0 snap-center">
              <SauceCard s={s} i={i} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
