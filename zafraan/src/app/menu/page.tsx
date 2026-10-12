import type { Metadata } from "next";
import { media, menu, site } from "@/lib/content";
import { MaskImage } from "@/components/motion/MaskImage";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Folio } from "@/components/ui/SectionHead";
import { ButtonLink } from "@/components/ui/Button";
import { Footer } from "@/components/chrome/Footer";

export const metadata: Metadata = {
  title: "Speisekarte",
  description: "Die Speisekarte des Ristorante Pizzeria Italia in Bruchhausen-Vilsen: Pizza, Pasta, Fisch, Fleisch, Salate und Dolci.",
  alternates: { canonical: "/menu" },
};

export default function MenuPage() {
  return (
    <>
      <main id="main" className="relative pt-[calc(var(--header-h)+6rem)]">
        <header className="container-editorial grid-editorial gap-y-10 pb-16">
          <div className="col-span-12 lg:col-span-7">
            <Folio no="—" label="Cucina Italiana" className="mb-10" />
            <SplitReveal as="h1" by="chars" play delay={0.9} className="display text-[clamp(3.6rem,10vw,10rem)]">
              Speisekarte.
            </SplitReveal>
          </div>
          <p className="col-span-12 self-end text-[1.0625rem] leading-[1.75] text-ink-soft lg:col-span-4 lg:col-start-9">
            Alle Gerichte werden frisch zubereitet, die Wartezeit beträgt ca. 15–25 Minuten. Alle Preise in € inkl. MwSt.
          </p>
        </header>

        {/* Sprungmarken zu den Kategorien — auf dem Handy wischbar */}
        <nav aria-label="Kategorien" className="container-editorial mb-20">
          <ul className="-mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] pb-2 lg:flex-wrap">
            {menu.map((c, i) => (
              <li key={c.course} className="shrink-0">
                <a href={`#course-${i}`} className="block rounded-full px-4 py-2 text-[0.8125rem] ring-1 ring-inset ring-ink/15 transition-colors duration-500 hover:bg-ink hover:text-canvas">
                  {c.course}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="container-editorial grid-editorial gap-y-24 pb-32">
          <div className="col-span-12 max-lg:hidden lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
            <MaskImage src={media.image(4)} alt="Ein Gericht aus dem Ristorante Pizzeria Italia." sizes="30vw" className="aspect-[3/4] w-full rounded-[2px] shadow-soft" priority />
          </div>
          <div className="col-span-12 lg:col-span-7 lg:col-start-6">
            {menu.map((section, s) => (
              <section key={section.course} id={`course-${s}`} className="mb-20 scroll-mt-28 last:mb-0" aria-labelledby={`course-title-${s}`}>
                <div className="mb-8 flex items-baseline justify-between border-b border-ink pb-4">
                  <h2 id={`course-title-${s}`} className="display-italic text-[clamp(1.8rem,3vw,2.6rem)]">
                    {section.course}
                  </h2>
                  <span className="folio text-ink-mute">{String(s + 1).padStart(2, "0")}</span>
                </div>
                {section.note && <p className="mb-4 text-[0.8125rem] text-ink-mute">{section.note}</p>}
                <ul className="divide-y divide-line">
                  {section.dishes.map((d) => (
                    <li key={d.name} className="grid grid-cols-[1fr_auto] gap-x-8 py-5 transition-[padding] duration-700 ease-[var(--ease-editorial)] hover:pl-3">
                      <h3 className="display text-[clamp(1.35rem,2.2vw,1.9rem)] leading-tight">{d.name}</h3>
                      {d.price ? (
                        <p className="display row-span-2 self-start text-[1.25rem] tabular-nums">
                          {d.price}
                          <span className="ml-1 text-[0.7em] text-ink-mute">€</span>
                        </p>
                      ) : (
                        <span />
                      )}
                      {d.note && <p className="mt-1.5 max-w-[32rem] text-[0.9375rem] text-ink-soft">{d.note}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <p className="mt-16 border-t border-line pt-6 text-[0.875rem] text-ink-soft">
              <strong className="font-medium text-ink">Allergene:</strong> Bei Allergien & Unverträglichkeiten sprechen Sie bitte unser Personal an.
            </p>
            <div className="mt-14 flex flex-wrap gap-5">
              <ButtonLink href={site.reserveUrl}>Tisch reservieren</ButtonLink>
              <ButtonLink href="/" variant="ghost">
                Zurück zur Startseite
              </ButtonLink>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
