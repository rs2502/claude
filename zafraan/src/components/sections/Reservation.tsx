import { site } from "@/lib/content";
import { MoodZone } from "@/components/motion/MoodZone";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Folio } from "@/components/ui/SectionHead";
import { ReservationForm } from "./ReservationForm";

export function Reservation() {
  return (
    <section id="reserve" tabIndex={-1} aria-labelledby="reserve-title" className="relative py-[clamp(9rem,26vh,18rem)]">
      <MoodZone mood="reserve" />
      <div className="container-editorial grid-editorial gap-y-20">
        <div className="col-span-12 lg:col-span-5">
          <Folio no="08" label="Reservations" className="mb-10" />
          <SplitReveal as="h2" by="chars" id="reserve-title" className="display text-[clamp(3.4rem,8vw,8.5rem)]" start="top 90%" end="top 40%" stagger={0.025}>
            Reserve a table.
          </SplitReveal>
          <div className="mt-14 grid max-w-[26rem] gap-6 text-[0.9375rem] leading-relaxed text-ink-soft">
            <p>One sitting each evening. We hold your table for the night, so there is never a second seating to make room for.</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 border-t border-line pt-6 text-[0.8125rem]">
              {site.hours.map((h) => (
                <div key={h.days} className="contents">
                  <dt className="text-ink-mute">{h.days}</dt>
                  <dd className="tabular-nums text-ink">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-6 lg:col-start-7 lg:pt-28">
          <ReservationForm />
        </div>
      </div>
    </section>
  );
}
