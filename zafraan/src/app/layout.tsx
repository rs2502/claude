import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { BASE, site } from "@/lib/content";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Header } from "@/components/chrome/Header";
import { Cursor } from "@/components/chrome/Cursor";
import { Loader } from "@/components/chrome/Loader";
import { PageCurtain } from "@/components/chrome/PageCurtain";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} · Bruchhausen-Vilsen`, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} · Bruchhausen-Vilsen`,
    description: site.description,
    locale: "de_DE",
    images: [{ url: `${BASE}/media/image-1.jpeg`, alt: "Ristorante Pizzeria Italia in Bruchhausen-Vilsen" }],
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  // Die Testfassung im Unterordner soll nicht bei Google auftauchen.
  ...(BASE ? { robots: { index: false, follow: false } } : {}),
};

export const viewport: Viewport = {
  themeColor: "#fafaf8",
  colorScheme: "light",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: site.name,
  description: site.description,
  url: site.url,
  telephone: "+49 4252 4597",
  email: site.email,
  servesCuisine: ["Italienisch", "Pizza", "Pasta"],
  priceRange: "€€",
  hasMenu: `${site.url}/menu`,
  acceptsReservations: true,
  image: `${site.url}/media/image-1.jpeg`,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    postalCode: site.address.postcode,
    addressCountry: site.address.country,
  },
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Thursday", "Friday", "Saturday"], opens: "11:30", closes: "14:30" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Thursday", "Friday", "Saturday"], opens: "17:30", closes: "22:30" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "11:30", closes: "14:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "17:00", closes: "22:00" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className={`${fraunces.variable} ${inter.variable}`}>
      <head>
        <noscript>
          <style>{`[data-loader]{display:none!important}`}</style>
        </noscript>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="bg-canvas text-ink">
        <SmoothScroll>
          <Loader />
          <Header />
          {children}
          <PageCurtain />
          <Cursor />
          <div aria-hidden className="paper-grain" />
        </SmoothScroll>
      </body>
    </html>
  );
}
