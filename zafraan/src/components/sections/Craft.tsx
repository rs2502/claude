"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap, MQ } from "@/lib/gsap";
import { craftSteps, media } from "@/lib/content";
import { useScrubVideo } from "@/hooks/useScrubVideo";
import { useMood } from "@/hooks/useMood";
import { ScrubVideo } from "@/components/motion/ScrubVideo";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { MaskImage } from "@/components/motion/MaskImage";
import { Folio } from "@/components/ui/SectionHead";
import { useIsMobile } from "@/hooks/useMedia";

/**
 * A timeline you scroll through sideways. The film on the left is the
 * kitchen clock; the track on the right is the method. Both are bound to
 * the same scroll window so the hands and the words never disagree.
 */
export function Craft() {
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const fillV = useRef<HTMLSpanElement>(null);
  const isMobile = useIsMobile();
  const counter = useRef<HTMLSpanElement>(null);

  useMood(section, "craft");
  useScrubVideo({ video, trigger: section, src: media.video(4), start: "top top", end: "bottom bottom", stillAt: 0.5, enabled: !isMobile });

  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(MQ.desktop + ", " + MQ.tablet, () => {
      const el = track.current!;
      const distance = () => el.scrollWidth - el.parentElement!.clientWidth;
      const ticks = gsap.utils.toArray<HTMLElement>("[data-tick]", section.current);
      let last = -1;

      const move = gsap.to(el, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.9,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (fill.current) fill.current.style.transform = `scaleX(${self.progress})`;
            const i = Math.min(craftSteps.length - 1, Math.floor(self.progress * craftSteps.length));
            if (i !== last) {
              last = i;
              ticks.forEach((t, k) => t.toggleAttribute("data-active", k <= i));
              if (counter.current) counter.current.textContent = craftSteps[i].no;
            }
          },
        },
      });

      // Each panel choreographs itself as it crosses the frame.
      gsap.utils.toArray<HTMLElement>("[data-step]", section.current).forEach((panel) => {
        const base = { trigger: panel, containerAnimation: move, scrub: 0.8 };
        gsap.fromTo(
          panel.querySelector("[data-step-image]"),
          { clipPath: "inset(0% 0% 0% 100%)" },
          { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { ...base, start: "left 95%", end: "left 45%" } },
        );
        gsap.fromTo(
          panel.querySelector("[data-step-image] > div"),
          { scale: 1.3, xPercent: 8 },
          { scale: 1, xPercent: 0, ease: "none", scrollTrigger: { ...base, start: "left 95%", end: "right 30%" } },
        );
        gsap.fromTo(
          panel.querySelectorAll("[data-step-line]"),
          { autoAlpha: 0, y: 22 },
          { autoAlpha: 1, y: 0, stagger: 0.12, ease: "power2.out", scrollTrigger: { ...base, start: "left 85%", end: "left 40%" } },
        );
        gsap.fromTo(
          panel.querySelector("[data-step-no]"),
          { yPercent: 40 },
          { yPercent: -20, ease: "none", scrollTrigger: { ...base, start: "left right", end: "right left" } },
        );
      });
    });

    mm.add(MQ.mobile, () => {
      gsap.fromTo(fillV.current, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: "[data-mobile-steps]", start: "top 70%", end: "bottom 70%", scrub: true } });
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={section} id="craft" tabIndex={-1} aria-labelledby="craft-title" className="relative bg-canvas md:h-[520vh] motion-reduce:h-auto">
      {/* ---------- Desktop / tablet: sideways timeline ---------- */}
      <div className="sticky top-0 hidden h-svh overflow-hidden md:block motion-reduce:hidden">
        <div className="container-editorial grid h-full grid-cols-12 gap-x-8 pb-28 pt-[calc(var(--header-h)+2rem)]">
          <div className="relative col-span-4 flex flex-col">
            <Folio no="05" label="Das Handwerk" className="mb-6" />
            <SplitReveal as="h2" by="words" id="craft-title" className="display mb-8 text-[clamp(2.2rem,3.8vw,4rem)]" start="top 70%" end="top 5%" trigger="#craft">
              Fünf Schritte zur perfekten Pizza.
            </SplitReveal>
            <div className="relative mx-auto aspect-[9/16] min-h-0 max-w-full flex-1 overflow-hidden rounded-[3px] bg-paper shadow-lift" data-cursor="image" data-cursor-label="Ansehen">
              <ScrubVideo ref={video} label="Hände bereiten in der Küche eine Pizza zu." />
              <div className="absolute bottom-4 left-4 flex items-baseline gap-2 rounded-full bg-canvas/95 px-4 py-1.5 shadow-soft">
                <span className="folio text-ink-mute">Schritt</span>
                <span ref={counter} className="display text-lg tabular-nums">01</span>
              </div>
            </div>
          </div>

          <div className="relative col-span-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_7%,#000_100%)]">
            <div ref={track} className="flex h-full w-max gap-[4vw] pl-[4vw] pr-[6vw] pt-10 will-change-transform">
              {craftSteps.map((s) => (
                <article key={s.no} data-step className="relative flex h-full w-[min(34vw,30rem)] flex-col justify-end">
                  <span data-step-no aria-hidden className="display pointer-events-none absolute -top-8 right-0 text-[clamp(7rem,12vw,12rem)] leading-none text-ink/[0.07]">
                    {s.no}
                  </span>
                  <div data-step-image className="relative mb-8 aspect-[5/4] w-full overflow-hidden rounded-[2px] bg-paper shadow-soft" data-cursor="image" data-cursor-label="Probieren">
                    <div className="absolute inset-0">
                      <Image src={media.image(s.image)} alt="" fill sizes="34vw" className="object-cover" />
                    </div>
                  </div>
                  <p data-step-line className="eyebrow mb-3 flex items-center gap-3 text-ink-mute">
                    <span className="folio">{s.no}</span>
                    <span className="h-px w-6 bg-current opacity-50" />
                    {s.duration}
                  </p>
                  <h3 data-step-line className="display text-[clamp(2.4rem,3.6vw,3.75rem)]">
                    {s.title} <span className="display-italic text-[0.55em] text-ink-soft">{s.it}</span>
                  </h3>
                  <p data-step-line className="mt-4 max-w-[26rem] text-[0.975rem] leading-[1.7] text-ink-soft">
                    {s.body}
                  </p>
                  <p data-step-line className="mt-6">
                    <span className="inline-flex items-center gap-2 rounded-full bg-paper px-3.5 py-1.5 text-[0.75rem] text-ink">
                      <span className="h-1.5 w-1.5 rounded-full bg-saffron" />
                      {s.ingredient}
                    </span>
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* Horizontal progress — a ruler with five stations */}
        <div className="container-editorial absolute inset-x-0 bottom-10" aria-hidden>
          <div className="relative h-px bg-line">
            <span ref={fill} className="absolute inset-0 origin-left bg-ink" style={{ transform: "scaleX(0)" }} />
          </div>
          <ol className="mt-4 grid grid-cols-5">
            {craftSteps.map((s) => (
              <li key={s.no} data-tick className="group flex items-baseline gap-2 text-ink-mute transition-colors duration-500 data-[active]:text-ink">
                <span className="folio">{s.no}</span>
                <span className="text-[0.8125rem]">{s.title}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* ---------- Phones + reduced motion: a vertical method ---------- */}
      <div className="container-editorial py-24 md:hidden motion-reduce:block">
        <Folio no="05" label="Das Handwerk" className="mb-6" />
        <h2 className="display mb-10 text-[2.6rem]">Fünf Schritte zur perfekten Pizza.</h2>
        <div className="relative mb-14 aspect-[9/16] overflow-hidden rounded-[2px] bg-paper shadow-soft md:hidden">
          {/* Mobile film reuses the same scrub via its own element */}
          <MobileFilm enabled={isMobile} />
        </div>
        <ol data-mobile-steps className="relative space-y-16 pl-8">
          <span aria-hidden className="absolute left-0 top-0 h-full w-px bg-line">
            <span ref={fillV} className="absolute inset-0 origin-top bg-ink md:hidden" />
          </span>
          {craftSteps.map((s) => (
            <li key={s.no} className="relative">
              <span aria-hidden className="absolute -left-8 top-2 h-2 w-2 -translate-x-1/2 rounded-full bg-ink" />
              <p className="eyebrow mb-3 text-ink-mute">
                {s.no} · {s.duration}
              </p>
              <h3 className="display text-[2.25rem]">
                {s.title} <span className="display-italic text-[0.55em] text-ink-soft">{s.it}</span>
              </h3>
              <p className="mt-3 text-[0.95rem] leading-[1.7] text-ink-soft">{s.body}</p>
              <MaskImage src={media.image(s.image)} alt="" sizes="90vw" className="mt-6 aspect-[5/4] w-full rounded-[2px]" from="left" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** On phones the film lives in the vertical flow and scrubs with it. */
function MobileFilm({ enabled }: { enabled: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  useScrubVideo({ video, trigger: wrap, src: media.video(4), start: "top 80%", end: "bottom 20%", enabled });
  return (
    <div ref={wrap} className="absolute inset-0">
      <ScrubVideo ref={video} />
    </div>
  );
}
