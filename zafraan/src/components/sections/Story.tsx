import { media } from "@/lib/content";
import { MaskImage } from "@/components/motion/MaskImage";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Folio } from "@/components/ui/SectionHead";

/** Server-rendered chapter; only the reveals hydrate. */
export function Story() {
  return (
    <section id="story" tabIndex={-1} aria-labelledby="story-title" className="relative py-[clamp(7rem,18vh,14rem)]">
      <div className="container-editorial grid-editorial gap-y-16">
        <div className="relative col-span-12 md:col-span-6 lg:col-span-5">
          <MaskImage
            src={media.image(1)}
            alt="Ein Pastagericht aus dem Ristorante Pizzeria Italia."
            sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw"
            className="aspect-[4/5] w-full rounded-[2px] shadow-soft"
            from="bottom"
          />
          <p className="mt-4 flex justify-between text-[0.75rem] text-ink-mute">
            <span className="display-italic text-[0.9rem]">Piatto i.</span>
            <span>Frisch zubereitet, ca. 15–25 Min.</span>
          </p>
        </div>

        <div className="col-span-12 flex flex-col justify-center md:col-span-6 md:col-start-7 lg:col-span-6 lg:col-start-7">
          <Folio no="02" label="Willkommen" className="mb-10" />
          <SplitReveal as="h2" by="words" id="story-title" className="display mb-12 text-[clamp(2.6rem,5.6vw,5.75rem)]" start="top 85%" end="top 35%">
            Qualität, Kreativität & herzlicher Service.
          </SplitReveal>
          <div className="grid gap-8 text-[1.0625rem] leading-[1.75] text-ink-soft lg:grid-cols-2 lg:gap-10">
            <SplitReveal by="lines" start="top 90%" end="top 55%">
              Lassen Sie sich verwöhnen mit raffinierten Nudelgerichten, knusprigen Pizzen, gegrilltem Fleisch und frischem Fisch. Täglich frische, sorgfältig ausgewählte Zutaten sind die Basis unserer Küche.
            </SplitReveal>
            <SplitReveal by="lines" start="top 90%" end="top 55%">
              Und dazu ein Service, der aufmerksam und persönlich ist — damit Sie sich vom ersten Moment an wohlfühlen. Alle Gerichte werden frisch für Sie zubereitet.
            </SplitReveal>
          </div>
          <figure className="mt-16 border-t border-line pt-8">
            <SplitReveal as="blockquote" by="words" className="display-italic text-[clamp(1.6rem,2.4vw,2.25rem)] leading-[1.2] text-ink" start="top 92%" end="top 60%">
              „Buon appetito!“
            </SplitReveal>
            <figcaption className="eyebrow mt-5 text-ink-mute">Ihr Team vom Ristorante Italia</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
