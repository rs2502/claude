import type { Metadata } from "next";
import { media, menu } from "@/lib/content";
import { MaskImage } from "@/components/motion/MaskImage";
import { MoodZone } from "@/components/motion/MoodZone";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Folio } from "@/components/ui/SectionHead";
import { ButtonLink } from "@/components/ui/Button";
import { Footer } from "@/components/chrome/Footer";

export const metadata: Metadata = {
  title: "Menu",
  description: "The autumn menu at Zafraan: Ajwain samosa, Dal Zafraan, Nalli nihari and the sixteen-course Shahi thali.",
  alternates: { canonical: "/menu" },
};

export default function MenuPage() {
  return (
    <>
      <main id="main" className="relative pt-[calc(var(--header-h)+6rem)]">
        <MoodZone mood="story" />
        <header className="container-editorial grid-editorial gap-y-10 pb-24">
          <div className="col-span-12 lg:col-span-7">
            <Folio no="—" label="Autumn menu, 2026" className="mb-10" />
            <SplitReveal as="h1" by="chars" play delay={0.9} className="display text-[clamp(3.6rem,10vw,10rem)]">
              The menu.
            </SplitReveal>
          </div>
          <p className="col-span-12 self-end text-[1.0625rem] leading-[1.75] text-ink-soft lg:col-span-4 lg:col-start-9">
            À la carte from Wednesday to Saturday, alongside the Shahi thali. Prices in pounds; a discretionary 12.5% is added for the kitchen and floor.
          </p>
        </header>

        <div className="container-editorial grid-editorial gap-y-24 pb-32">
          <div className="col-span-12 lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
            <MaskImage src={media.image(4)} alt="Saffron kulfi with pistachio and rose petals." sizes="(min-width: 1024px) 30vw, 100vw" className="aspect-[3/4] w-full rounded-[2px] shadow-soft" priority />
          </div>
          <div className="col-span-12 lg:col-span-7 lg:col-start-6">
            {menu.map((section, s) => (
              <section key={section.course} className="mb-20 last:mb-0" aria-labelledby={`course-${s}`}>
                <div className="mb-8 flex items-baseline justify-between border-b border-ink pb-4">
                  <h2 id={`course-${s}`} className="display-italic text-[clamp(1.8rem,3vw,2.6rem)]">
                    {section.course}
                  </h2>
                  <span className="folio text-ink-mute">0{s + 1}</span>
                </div>
                <ul className="divide-y divide-line">
                  {section.dishes.map((d) => (
                    <li key={d.name} className="group grid grid-cols-[1fr_auto] gap-x-8 py-6 transition-[padding] duration-700 ease-[var(--ease-editorial)] hover:pl-3">
                      <h3 className="display text-[clamp(1.5rem,2.4vw,2.1rem)] leading-tight">{d.name}</h3>
                      <p className="display row-span-2 self-start text-[1.35rem] tabular-nums">
                        <span className="text-[0.7em] text-ink-mute">£</span>
                        {d.price}
                      </p>
                      <p className="mt-2 max-w-[32rem] text-[0.9375rem] text-ink-soft">{d.note}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <div className="mt-20 flex flex-wrap gap-5">
              <ButtonLink href="/#reserve">Reserve a table</ButtonLink>
              <ButtonLink href="/" variant="ghost">
                Back to the story
              </ButtonLink>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
