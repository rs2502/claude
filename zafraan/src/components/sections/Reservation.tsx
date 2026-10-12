import { site } from "@/lib/content";
import { MoodZone } from "@/components/motion/MoodZone";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Folio } from "@/components/ui/SectionHead";
import { ButtonLink } from "@/components/ui/Button";

export function Reservation() {
  return (
    <section id="reserve" tabIndex={-1} aria-labelledby="reserve-title" className="relative py-[clamp(9rem,26vh,18rem)]">
      <MoodZone mood="reserve" />
      <div className="container-editorial grid-editorial gap-y-20">
        <div className="col-span-12 lg:col-span-6">
          <Folio no="08" label="Reservierung" className="mb-10" />
          <SplitReveal as="h2" by="chars" id="reserve-title" className="display text-[clamp(3.4rem,8vw,8.5rem)]" start="top 90%" end="top 40%" stagger={0.025}>
            Tisch reservieren.
          </SplitReveal>
          <p className="mt-12 max-w-[28rem] text-[1.0625rem] leading-relaxed text-ink-soft">
            Wir freuen uns auf Ihren Besuch. Reservieren Sie bequem online oder telefonisch.
          </p>
          <div className="mt-12 flex flex-wrap items-center gap-5">
            <ButtonLink href={site.reserveUrl}>Online reservieren</ButtonLink>
            <ButtonLink href={site.phoneHref} variant="ghost">
              {site.phone} anrufen
            </ButtonLink>
          </div>
        </div>

        <div className="col-span-12 grid gap-12 sm:grid-cols-2 lg:col-span-5 lg:col-start-8 lg:grid-cols-1 lg:pt-28">
          <div>
            <p className="eyebrow mb-5 text-ink-mute">Öffnungszeiten</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 border-t border-line pt-5 text-[0.9375rem]">
              {site.hours.map((h) => (
                <div key={h.days} className="contents">
                  <dt className="text-ink-soft">{h.days}</dt>
                  <dd className="tabular-nums text-ink">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <p className="eyebrow mb-5 text-ink-mute">Adresse</p>
            <address className="border-t border-line pt-5 text-[0.9375rem] not-italic leading-relaxed text-ink">
              {site.address.street}
              <br />
              {site.address.postcode} {site.address.city}
            </address>
            <a href={site.routeUrl} target="_blank" rel="noopener" className="link-grow mt-4 inline-block text-[0.9375rem]">
              Route starten →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
