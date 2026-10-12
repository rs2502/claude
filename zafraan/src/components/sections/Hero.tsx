"use client";

import { useEffect, useRef } from "react";
import { gsap, MQ } from "@/lib/gsap";
import { media } from "@/lib/content";
import { pointer, useExperience } from "@/lib/store";
import { useScrubVideo } from "@/hooks/useScrubVideo";
import { useMood } from "@/hooks/useMood";
import { ScrubVideo } from "@/components/motion/ScrubVideo";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { ButtonLink } from "@/components/ui/Button";
import { Arrow } from "@/components/ui/Arrow";
import { PLATE } from "@/lib/plate";
import { cn } from "@/lib/utils";

// Dish names drift around the film plate as the thali comes apart.
const plates = [
  { roman: "i.", name: "Pizza", x: "47%", y: "22%", at: 0.28 },
  { roman: "ii.", name: "Pasta", x: "84%", y: "12%", at: 0.38 },
  { roman: "iii.", name: "Carne", x: "85%", y: "80%", at: 0.48 },
  { roman: "iv.", name: "Pesce", x: "50%", y: "68%", at: 0.58 },
];

export function Hero() {
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const mediaLayer = useRef<HTMLDivElement>(null);
  const depthLayer = useRef<HTMLDivElement>(null);
  const type = useRef<HTMLDivElement>(null);
  const typeDepth = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLSpanElement>(null);
  const loaded = useExperience((s) => s.loaded);

  useMood(section, "hero");
  useScrubVideo({ video, trigger: section, src: media.video(1), eager: true, start: "top top", end: "bottom bottom", stillAt: 0.35 });

  // Entrance: the film settles from a slight over-scale as the loader opens.
  useEffect(() => {
    if (!loaded || !mediaLayer.current) return;
    gsap.fromTo(mediaLayer.current, { scale: 1.12 }, { scale: 1, duration: 2.4, ease: "expo.out" });
    gsap.fromTo("[data-hero-fade]", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1.4, ease: "expo.out", stagger: 0.08, delay: 0.7 });
  }, [loaded]);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add({ desktop: MQ.desktop, tablet: MQ.tablet, mobile: MQ.mobile }, (ctx) => {
      const { mobile } = ctx.conditions as { mobile: boolean };
      const trigger = { trigger: section.current, start: "top top", end: "bottom bottom", scrub: mobile ? 0.4 : 1 };

      // The thali expands: the film grows toward the viewer…
      gsap.to(depthLayer.current, { scale: mobile ? 1.08 : 1.18, ease: "none", scrollTrigger: trigger });
      // …while the type travels at a third of the speed and dissolves.
      gsap.to(type.current, { yPercent: -18, ease: "none", scrollTrigger: trigger });
      gsap.to(type.current, {
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: { ...trigger, start: "top top", end: "45% top" },
      });
      gsap.fromTo(cue.current, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: trigger });

      // Floating annotations name the plates as the thali comes apart.
      gsap.utils.toArray<HTMLElement>("[data-plate]").forEach((el) => {
        const at = Number(el.dataset.at);
        const tl = gsap.timeline({ scrollTrigger: trigger });
        tl.set(el, { autoAlpha: 0, y: 18 }, 0)
          .to(el, { autoAlpha: 1, y: 0, duration: 0.12, ease: "power2.out" }, at)
          .to(el, { y: -26, duration: 0.3, ease: "none" }, at + 0.12)
          .to(el, { autoAlpha: 0, duration: 0.1 }, 0.9);
      });

      if (mobile) return;
      // Pointer depth: film leans with the hand, type leans against it.
      const mx = gsap.quickTo(mediaLayer.current, "x", { duration: 1.4, ease: "power3.out" });
      const my = gsap.quickTo(mediaLayer.current, "y", { duration: 1.4, ease: "power3.out" });
      const tx = gsap.quickTo(typeDepth.current, "x", { duration: 1.6, ease: "power3.out" });
      const ty = gsap.quickTo(typeDepth.current, "y", { duration: 1.6, ease: "power3.out" });
      const follow = () => {
        mx(pointer.x * -16);
        my(pointer.y * -10);
        tx(pointer.x * 8);
        ty(pointer.y * 5);
      };
      gsap.ticker.add(follow);
      return () => gsap.ticker.remove(follow);
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={section} id="top" aria-labelledby="hero-title" className="relative h-[320vh] max-md:h-[220vh] motion-reduce:h-svh">
      <div className="sticky top-0 h-svh overflow-hidden bg-paper">
        <div ref={depthLayer} data-hero-plate className={cn(PLATE, "will-change-transform md:right-[7vw] md:top-1/2 md:-translate-y-1/2")}>
          <div ref={mediaLayer} className="absolute -inset-6 will-change-transform">
            <ScrubVideo ref={video} hero src={media.video(1)} label="Italienische Gerichte aus der Küche des Ristorante Italia, im Film." />
          </div>
        </div>
        {/* A single, functional veil — only where type needs to sit. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] md:hidden bg-[linear-gradient(to_top,rgb(250_250_248/0.82),rgb(250_250_248/0))]" />

        {plates.map((p) => (
          <div
            key={p.name}
            data-plate
            data-at={p.at}
            aria-hidden
            className="pointer-events-none absolute z-10 hidden items-baseline gap-2 opacity-0 md:flex"
            style={{ left: p.x, top: p.y }}
          >
            <span className="display-italic text-sm text-ink-soft">{p.roman}</span>
            <span className="rounded-full bg-canvas/90 px-3 py-1 text-[0.75rem] tracking-wide shadow-soft">{p.name}</span>
          </div>
        ))}

        <div ref={type} className="absolute inset-0 z-20 flex flex-col justify-end will-change-transform">
          <div ref={typeDepth} className="container-editorial grid-editorial items-end gap-y-10 pb-[clamp(2rem,6vh,4.5rem)]">
            <div className="col-span-12 md:col-span-7 lg:col-span-7">
              <p data-hero-fade className="eyebrow mb-6 flex items-center gap-3 text-ink-soft opacity-0">
                <span className="folio">No. 01</span>
                <span className="h-px w-10 bg-ink/40" />
                Cucina Italiana · Bruchhausen-Vilsen
              </p>
              <SplitReveal
                as="h1"
                by="chars"
                play={loaded}
                delay={0.55}
                stagger={0.03}
                className="display text-[clamp(3.6rem,8.2vw,9.5rem)] text-ink"
                id="hero-title"
              >
                Echte italienische Lebensfreude.
              </SplitReveal>
              <div className="mt-10 flex flex-col gap-8">
              <p data-hero-fade className="max-w-[26rem] text-[0.9375rem] leading-[1.7] text-ink-soft opacity-0">
                Frisch gekocht, herzlich serviert — und immer mit dem Geschmack Italiens. Mitten in Bruchhausen-Vilsen.
              </p>
              <div data-hero-fade className="flex flex-wrap items-center gap-5 opacity-0">
                <ButtonLink href="/#reserve">Tisch reservieren</ButtonLink>
                <ButtonLink href="/menu" variant="light">
                  Speisekarte ansehen
                </ButtonLink>
              </div>
              </div>
            </div>
          </div>
        </div>

        <div data-hero-fade aria-hidden className="absolute bottom-6 left-[46%] z-20 hidden -translate-x-1/2 flex-col items-center gap-3 opacity-0 lg:flex">
          <span className="eyebrow text-[0.6rem] text-ink-soft">Scrollen</span>
          <span className="relative block h-14 w-px bg-ink/15">
            <span ref={cue} className="absolute inset-0 origin-top bg-ink" />
          </span>
          <Arrow dir="down" className="text-ink/60" />
        </div>
      </div>
    </section>
  );
}
