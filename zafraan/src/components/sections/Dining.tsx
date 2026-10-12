import { site } from "@/lib/content";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Folio } from "@/components/ui/SectionHead";

// Alle Zahlen stammen aus der Speisekarte und den Öffnungszeiten.
const facts = [
  { k: "120+", v: "Gerichte auf der Karte" },
  { k: "21", v: "Pizzen aus dem Ofen" },
  { k: "5", v: "Tage pro Woche geöffnet" },
];

export function Dining() {
  return (
    <section id="dining" aria-labelledby="dining-title" className="relative">
      {/* Großer Kapiteltitel, reine Typografie */}
      <div className="relative overflow-hidden py-[clamp(7rem,18vh,14rem)]">
        <div className="container-editorial relative z-10 flex h-full flex-col justify-center">
          <div>
            <Folio no="07" label="Feiern" className="mb-8" />
            <h2 id="dining-title" className="display relative z-10 text-[clamp(3.4rem,10.5vw,12rem)] leading-[0.86] text-ink">
              <SplitReveal as="span" by="chars" className="block" start="top 95%" end="top 45%" stagger={0.03}>
                Mit uns feiern
              </SplitReveal>
              <SplitReveal as="span" by="chars" className="display-italic block pl-[12vw]" start="top 95%" end="top 40%" stagger={0.03}>
                Sie richtig.
              </SplitReveal>
            </h2>
          </div>
        </div>
      </div>

      <div className="container-editorial grid-editorial border-t border-line pb-[clamp(5rem,14vh,10rem)] pt-12">
        <p className="col-span-12 mb-10 max-w-[34rem] text-[1.0625rem] leading-[1.75] text-ink-soft md:col-span-5">
          Hochzeit, Geburtstag, Firmenfeier, Jubiläum oder Catering — mit uns wird Ihr Event zu einem kulinarischen Erlebnis.
          <a href={`mailto:${site.email}`} className="link-grow mt-6 block w-fit text-ink" data-cursor="link">
            Anfrage senden →
          </a>
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
