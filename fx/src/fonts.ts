import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Schriften liegen in public/fonts (alle SIL Open Font License), damit das Rendern ohne Netz geht.
const load = (family: string, file: string, weight: string) => {
  loadFont({ family, url: staticFile(`fonts/${file}`), weight, format: "woff2" }).catch((err) => {
    throw new Error(`Schrift ${file} fehlt: ${err}`);
  });
  return family;
};

export const sans = load("Inter", "inter.woff2", "400 900");
export const mono = load("JetBrains Mono", "jetbrains-mono.woff2", "400 700");
export const masthead = load("Playfair Display", "playfair-display.woff2", "700 900");
export const bodySerif = load("Source Serif 4", "source-serif-4.woff2", "400 700");
export const displaySerif = load("Instrument Serif", "instrument-serif.woff2", "400");
