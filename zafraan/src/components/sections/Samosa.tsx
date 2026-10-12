"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, MQ } from "@/lib/gsap";
import { media, samosaCallouts } from "@/lib/content";
import { useScrubVideo } from "@/hooks/useScrubVideo";
import { useMood } from "@/hooks/useMood";
import { ScrubVideo } from "@/components/motion/ScrubVideo";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Folio } from "@/components/ui/SectionHead";

const LABEL_OFFSET = 15; // % of stage width between anchor and label

/**
 * Locked camera, scrubbed film, and annotations that behave like an Apple
 * exploded-hardware page: an anchor dot lands, a hairline draws out to the
 * margin, and the label settles at its end.
 */
export function Samosa() {
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  // Lines are drawn in real pixels so a 1px hairline stays 1px and dashes measure true.
  const [size, setSize] = useState({ w: 1440, h: 900 });

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useMood(section, "samosa");
  useScrubVideo({
    video,
    trigger: section,
    src: media.video(2),
    start: "top top",
    end: "bottom bottom",
    stillAt: 0.7,
    onProgress: (p) => {
      if (readout.current) readout.current.textContent = String(Math.round(p * 100)).padStart(2, "0");
    },
  });

  useEffect(() => {
    const mm = gsap.matchMedia();
    const scrollTrigger = () => ({ trigger: section.current, start: "top top", end: "bottom bottom", scrub: 0.6 });

    mm.add(MQ.desktop + ", " + MQ.tablet, () => {
      const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: scrollTrigger() });
      tl.set({}, {}, 1); // normalise timeline length to 1 = full scroll
      samosaCallouts.forEach((c) => {
        const [a, b] = c.window;
        const q = (s: string) => section.current!.querySelector(`[data-callout="${c.id}"] ${s}`);
        tl.fromTo(q("[data-dot]"), { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.03, ease: "back.out(2)" }, a)
          .fromTo(q("[data-line]"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.06, ease: "power2.inOut" }, a + 0.01)
          .fromTo(q("[data-label]"), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power2.out" }, a + 0.05)
          .to(q("[data-label]"), { autoAlpha: 0, y: -8, duration: 0.04 }, b)
          .to(q("[data-line]"), { strokeDashoffset: -1, duration: 0.05 }, b)
          .to(q("[data-dot]"), { scale: 0, autoAlpha: 0, duration: 0.03 }, b + 0.02);
      });
    });

    // Phones: one caption at a time, crossfading beneath the film.
    mm.add(MQ.mobile, () => {
      const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: scrollTrigger() });
      tl.set({}, {}, 1);
      const items = gsap.utils.toArray<HTMLElement>("[data-caption]", section.current);
      items.forEach((el, i) => {
        const a = samosaCallouts[i].window[0];
        const b = samosaCallouts[i + 1]?.window[0] ?? 0.95;
        tl.fromTo(el, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.04 }, a).to(el, { autoAlpha: 0, y: -8, duration: 0.03 }, b - 0.02);
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={section} id="samosa" aria-labelledby="samosa-title" className="relative h-[420vh] max-md:h-[260vh] motion-reduce:h-auto">
      <div className="sticky top-0 h-svh overflow-hidden bg-paper motion-reduce:relative">
        <ScrubVideo ref={video} label="A samosa slowly separating into its layers: pastry, potato, peas and whole spices suspended in air." />

        <div className="container-editorial pointer-events-none relative z-10 pt-[calc(var(--header-h)+2.5rem)]">
          <Folio no="03" label="Anatomy of a samosa" className="mb-6" />
          <SplitReveal as="h2" by="words" id="samosa-title" className="display max-w-[11ch] text-[clamp(2.4rem,5vw,5rem)]" start="top 70%" end="top 10%" trigger="#samosa">
            Forty grams, six decisions.
          </SplitReveal>
        </div>

        {/* Desktop/tablet annotations */}
        <div ref={stage} className="absolute inset-0 z-10 max-md:hidden motion-reduce:hidden" aria-hidden>
          {samosaCallouts.map((c) => {
            const dir = c.side === "left" ? -1 : 1;
            const lx = c.at.x + dir * LABEL_OFFSET;
            const ely = c.at.y - 5;
            const elx = c.at.x + dir * 4;
            return (
              <div key={c.id} data-callout={c.id} className="absolute inset-0">
                <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${size.w} ${size.h}`}>
                  <path
                    data-line
                    d={`M ${(c.at.x * size.w) / 100} ${(c.at.y * size.h) / 100} L ${(elx * size.w) / 100} ${(ely * size.h) / 100} L ${(lx * size.w) / 100} ${(ely * size.h) / 100}`}
                    pathLength={1}
                    strokeDasharray="1 1"
                    strokeDashoffset={1}
                    fill="none"
                    stroke="#2b2320"
                    strokeOpacity={0.55}
                    strokeWidth={1}
                  />
                </svg>
                <span
                  data-dot
                  className="absolute h-2.5 w-2.5 rounded-full bg-canvas opacity-0 ring-1 ring-ink/60"
                  style={{ left: `${c.at.x}%`, top: `${c.at.y}%`, translate: "-50% -50%" }}
                >
                  <span className="absolute inset-[3px] rounded-full bg-ink" />
                </span>
                <div
                  data-label
                  className="absolute w-[15rem] opacity-0"
                  style={{
                    left: `${lx}%`,
                    top: `${ely}%`,
                    translate: c.side === "left" ? "calc(-100% - 0.75rem) -50%" : "0.75rem -50%",
                    textAlign: c.side === "left" ? "right" : "left",
                  }}
                >
                  <p className="display-italic text-[1.35rem] leading-tight">{c.title}</p>
                  <p className="mt-1 text-[0.8125rem] leading-snug text-ink-soft">{c.note}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Phone captions */}
        <div className="absolute inset-x-[var(--gutter)] bottom-8 z-10 h-28 md:hidden motion-reduce:hidden" aria-hidden>
          {samosaCallouts.map((c, i) => (
            <div key={c.id} data-caption className="absolute inset-0 rounded-[3px] bg-canvas/95 p-5 opacity-0 shadow-soft">
              <p className="folio text-ink-mute">0{i + 1} / 0{samosaCallouts.length}</p>
              <p className="display-italic mt-1 text-[1.35rem] leading-tight">{c.title}</p>
              <p className="mt-1 text-[0.8125rem] text-ink-soft">{c.note}</p>
            </div>
          ))}
        </div>

        <div className="absolute bottom-8 right-[var(--gutter)] z-10 hidden items-baseline gap-3 md:flex motion-reduce:hidden" aria-hidden>
          <span className="eyebrow text-ink-mute">Disassembly</span>
          <span className="display text-[2.5rem] tabular-nums leading-none">
            <span ref={readout}>00</span>
            <span className="display-italic text-base">%</span>
          </span>
        </div>
      </div>

      {/* Accessible / reduced-motion version of the annotations */}
      <ol className="sr-only motion-reduce:not-sr-only motion-reduce:container-editorial motion-reduce:grid motion-reduce:gap-6 motion-reduce:py-16 motion-reduce:md:grid-cols-3">
        {samosaCallouts.map((c) => (
          <li key={c.id}>
            <p className="display-italic text-xl">{c.title}</p>
            <p className="text-sm text-ink-soft">{c.note}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
