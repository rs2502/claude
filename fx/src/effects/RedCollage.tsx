import React from "react";
import { AbsoluteFill, Img, random, staticFile } from "remotion";
import { sans } from "../fonts";
import { Base, Cutout, FxProps } from "../lib/layers";
import { backOut, easeIn, p, useTime } from "../lib/util";

export type RedCollageProps = FxProps & {
  /** Bilder als ausgerissene Papierschnipsel um die Person (public/…). */
  images?: string[];
  /** Großes Wort auf Papierstreifen (leer = keins). */
  word?: string;
  red?: string;
};

// Feste Plätze für bis zu 6 Schnipsel: links/rechts der Person, oben und unten versetzt.
const SLOTS = [
  { x: 40, y: 330, w: 330, r: -8 },
  { x: 700, y: 380, w: 340, r: 7 },
  { x: 20, y: 820, w: 300, r: 5 },
  { x: 760, y: 860, w: 290, r: -6 },
  { x: 60, y: 1230, w: 300, r: -4 },
  { x: 720, y: 1260, w: 310, r: 9 },
];

/** Red Collage: roter Papiergrund mit Raster, die Person als Sticker mit weißem Rand, Bilder als Schnipsel drumherum. Braucht den Freisteller. */
export const RedCollage: React.FC<RedCollageProps> = ({
  video,
  cutout,
  trimBefore = 0,
  dur,
  images,
  tiles,
  word = "",
  red = "#d7262e",
}) => {
  const t = useTime();
  const pics = images?.length ? images : tiles ?? [];
  const k = Math.min(p(t, 0, 0.2), 1 - p(t, dur - 0.25, dur, easeIn));
  // Gerissene Kante: Zickzack-Polygon, je Schnipsel anders.
  const torn = (seed: number) => {
    const pts: string[] = [];
    const n = 14;
    for (let i = 0; i <= n; i++) pts.push(`${(i / n) * 100}% ${random(`t${seed}${i}`) * 4}%`);
    for (let i = 0; i <= n; i++) pts.push(`${100 - random(`r${seed}${i}`) * 3}% ${(i / n) * 100}%`);
    for (let i = n; i >= 0; i--) pts.push(`${(i / n) * 100}% ${100 - random(`b${seed}${i}`) * 4}%`);
    for (let i = n; i >= 0; i--) pts.push(`${random(`l${seed}${i}`) * 3}% ${(i / n) * 100}%`);
    return `polygon(${pts.join(",")})`;
  };
  return (
    <AbsoluteFill>
      <Base src={video} trimBefore={trimBefore} />
      <AbsoluteFill
        style={{
          opacity: k,
          background: red,
          backgroundImage: "radial-gradient(rgba(0,0,0,0.16) 3px, transparent 3.5px)",
          backgroundSize: "26px 26px",
        }}
      />
      {pics.slice(0, SLOTS.length).map((src, i) => {
        const s = SLOTS[i];
        const a = 0.08 + i * 0.09;
        const pop = p(t, a, a + 0.35, backOut);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: s.x,
              top: s.y,
              width: s.w,
              height: s.w * 1.25,
              padding: 12,
              background: "#fbf6ec",
              clipPath: torn(i),
              boxShadow: "0 16px 30px rgba(0,0,0,0.35)",
              transform: `rotate(${s.r + (1 - pop) * 20}deg) scale(${pop})`,
              opacity: Math.min(1, pop * 2) * k,
            }}
          >
            <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        );
      })}
      {/* Person als Sticker: weißer Rand per Schatten in vier Richtungen. */}
      <Cutout
        src={cutout}
        trimBefore={trimBefore}
        style={{
          filter: k > 0.01 ? "drop-shadow(8px 0 0 white) drop-shadow(-8px 0 0 white) drop-shadow(0 8px 0 white) drop-shadow(0 -8px 0 white) drop-shadow(0 24px 30px rgba(0,0,0,0.4))" : "none",
        }}
      />
      {/* Wortstreifen vor der Person, damit er ganz lesbar bleibt (liegt unter dem Gesicht). */}
      {word ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1500 - 190,
            display: "flex",
            justifyContent: "center",
            opacity: p(t, 0.45, 0.6) * k,
            transform: `rotate(-3deg) scale(${0.8 + 0.2 * p(t, 0.45, 0.75, backOut)})`,
          }}
        >
          <div style={{ background: "#141414", color: "#fbf6ec", fontFamily: sans, fontWeight: 900, fontSize: Math.min(120, 960 / (word.length * 0.62)), whiteSpace: "nowrap", padding: "6px 36px 14px", letterSpacing: "-0.02em" }}>
            {word}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
