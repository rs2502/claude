import { nav, site } from "@/lib/content";
import { TransitionLink } from "./TransitionLink";
import { SplitReveal } from "@/components/motion/SplitReveal";

export function Footer() {
  return (
    <footer className="paper-fibre relative overflow-hidden bg-paper pt-24">
      <div className="container-editorial grid-editorial gap-y-12 pb-16 text-[0.875rem]">
        <address className="col-span-6 not-italic leading-relaxed text-ink-soft md:col-span-3">
          <p className="eyebrow mb-4 text-ink-mute">Besuchen Sie uns</p>
          {site.address.street}
          <br />
          {site.address.postcode} {site.address.city}
        </address>
        <div className="col-span-6 md:col-span-3">
          <p className="eyebrow mb-4 text-ink-mute">Kontakt</p>
          <a href={site.phoneHref} className="link-grow">
            {site.phone}
          </a>
          <br />
          <a href={`mailto:${site.email}`} className="link-grow break-all text-ink-soft">
            {site.email}
          </a>
        </div>
        <nav aria-label="Fußzeile" className="col-span-12 md:col-span-4 md:col-start-9">
          <p className="eyebrow mb-4 text-ink-mute">Seiten</p>
          <ul className="grid grid-cols-2 gap-y-2">
            {nav.map((n) => (
              <li key={n.href}>
                <TransitionLink href={n.href} className="link-grow">
                  {n.label}
                </TransitionLink>
              </li>
            ))}
            <li>
              <a href={site.reserveUrl} target="_blank" rel="noopener" className="link-grow">
                Reservierung
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="container-editorial" aria-hidden>
        <SplitReveal as="p" by="chars" className="display select-none pb-[0.12em] text-[clamp(6rem,24vw,26rem)] leading-[0.85] tracking-[-0.05em]" start="top 100%" end="bottom 95%" stagger={0.04}>
          Italia
        </SplitReveal>
      </div>
      <div className="container-editorial flex flex-wrap justify-between gap-4 border-t border-line py-6 text-[0.75rem] text-ink-mute">
        <span>© {new Date().getFullYear()} {site.name} · {site.address.street} · {site.address.postcode} {site.address.city}</span>
        <span className="flex gap-5">
          <a href={site.imprintUrl} className="link-grow">Impressum</a>
          <a href={site.privacyUrl} className="link-grow">Datenschutz</a>
          <span>Abbildungen mit KI erstellt.</span>
        </span>
      </div>
    </footer>
  );
}
