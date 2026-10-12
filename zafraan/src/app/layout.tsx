import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { site } from "@/lib/content";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Header } from "@/components/chrome/Header";
import { Cursor } from "@/components/chrome/Cursor";
import { Loader } from "@/components/chrome/Loader";
import { PageCurtain } from "@/components/chrome/PageCurtain";
import { AtmosphereLoader } from "@/components/three/AtmosphereLoader";

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
  title: { default: `${site.name} — ${site.tagline}`, template: `%s — ${site.name}` },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    images: [{ url: "/media/image-1.jpeg", width: 1600, height: 2000, alt: "The royal thali at Zafraan" }],
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
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
  telephone: site.phone,
  email: site.email,
  servesCuisine: ["Indian", "Awadhi", "Rajasthani"],
  priceRange: "££££",
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
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Wednesday", "Thursday", "Friday", "Saturday"], opens: "18:30", closes: "23:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "13:00", closes: "16:30" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
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
          <AtmosphereLoader />
          <Cursor />
          <div aria-hidden className="paper-grain" />
        </SmoothScroll>
      </body>
    </html>
  );
}
