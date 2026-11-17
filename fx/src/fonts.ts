import * as data from "./font-data";

// Schriften (alle SIL Open Font License) stecken als Base64 in font-data.ts, kein Nachladen übers Netz.
// Ohne delayRender: eine Wartemarke beim Modulstart wurde beim Rendern nie freigegeben und brach
// nach Ablauf der Zeit ab. FontPreload.tsx zeichnet alle Schriften vorab unsichtbar.
// Neu erzeugen nach Änderungen in public/fonts: node scripts/embed-fonts.mjs
const faces: [string, string, string][] = [
  ["Inter", data.inter, "400 900"],
  ["JetBrains Mono", data.jetbrainsMono, "400 700"],
  ["Playfair Display", data.playfairDisplay, "700 900"],
  ["Source Serif 4", data.sourceSerif4, "400 700"],
  ["Instrument Serif", data.instrumentSerif, "400"],
];

if (typeof document !== "undefined" && !document.getElementById("fx-fonts")) {
  const style = document.createElement("style");
  style.id = "fx-fonts";
  style.textContent = faces
    .map(([family, url, weight]) => `@font-face{font-family:"${family}";src:url(${url}) format("woff2");font-weight:${weight};font-display:block;}`)
    .join("\n");
  document.head.appendChild(style);
}

export const sans = "Inter";
export const mono = "JetBrains Mono";
export const masthead = "Playfair Display";
export const bodySerif = "Source Serif 4";
export const displaySerif = "Instrument Serif";

export const ALL_FONTS = faces.map(([family]) => family);
