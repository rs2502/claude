import { loadFont } from "@remotion/fonts";
import * as data from "./font-data";

// Schriften (alle SIL Open Font License) stecken als Base64 in font-data.ts: kein Nachladen beim Rendern,
// das unter Last sonst hängen kann. Neu erzeugen nach Änderungen in public/fonts: node scripts/embed-fonts.mjs
const load = (family: string, url: string, weight: string) => {
  loadFont({ family, url, weight, format: "woff2" }).catch((err) => {
    throw new Error(`Schrift ${family} lädt nicht: ${err}`);
  });
  return family;
};

export const sans = load("Inter", data.inter, "400 900");
export const mono = load("JetBrains Mono", data.jetbrainsMono, "400 700");
export const masthead = load("Playfair Display", data.playfairDisplay, "700 900");
export const bodySerif = load("Source Serif 4", data.sourceSerif4, "400 700");
export const displaySerif = load("Instrument Serif", data.instrumentSerif, "400");
