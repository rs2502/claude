import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { bodySerif, mono, sans } from "../fonts";
import { Base, FxProps } from "../lib/layers";
import { backOut, easeIn, easeInOut, p, useTime } from "../lib/util";

type Card = { label: string; sub?: string; image?: string };

export type DealerProps = FxProps & {
  /** `image` (public/…) ersetzt die Vorderseite komplett, z. B. eine fertige Gericht-Grafik. */
  cards?: Card[];
  /** Mitte der Kartenreihe (y in Pixeln). */
  y?: number;
  /** Wann jede Karte umdreht (Sekunden ab Effektstart), z. B. auf das Wort. Standard: kurz nacheinander. */
  flipAt?: number[];
  /** Jede umgedrehte Karte wird groß in die Mitte geholt, bis die nächste umdreht. */
  feature?: boolean;
  /** Größe und Mitte (y) der hervorgehobenen Karte. */
  featureScale?: number;
  featureY?: number;
};

const DEFAULT_CARDS: Card[] = [
  { label: "Regeln", sub: "SAFE-ZONE" },
  { label: "Layouts", sub: "KURZ + LANG" },
  { label: "Vorlagen", sub: "20 STÜCK" },
  { label: "Techniken", sub: "10 JAHRE" },
];

const CW = 236;
const CH = 330;

/** 05 The Dealer: Karten werden ausgeteilt und nacheinander umgedreht. */
export const Dealer: React.FC<DealerProps> = ({ video, trimBefore = 0, dur, cards = DEFAULT_CARDS, y = 1470, flipAt, feature = false, featureScale = 2.1, featureY }) => {
  const flips = cards.map((_, i) => flipAt?.[i] ?? 0.75 + i * 0.28);
  const fy = featureY ?? y - 330;
  const t = useTime();
  const n = cards.length;
  const out = p(t, dur - 0.3, dur, easeIn);
  return (
    <AbsoluteFill>
      <Base src={video} trimBefore={trimBefore} />
      <AbsoluteFill style={{ perspective: 1800 }}>
        {cards.map((c, i) => {
          const deal = p(t, 0.05 + i * 0.1, 0.45 + i * 0.1, backOut);
          const f = flips[i];
          const holdEnd = (flips[i + 1] ?? dur - 0.3) - 0.1;
          const g = feature ? Math.min(p(t, f + 0.2, f + 0.5, backOut), 1 - p(t, holdEnd - 0.3, holdEnd, easeInOut)) : 0;
          const flip = p(t, f, f + 0.3, easeInOut);
          const tx = 540 + (i - (n - 1) / 2) * (CW + 14);
          const rot = (i - (n - 1) / 2) * 3;
          const x = 980 + (tx - 980) * deal + (540 - tx) * g;
          const yy = 2300 + (y - 2300) * deal + out * 700 + (fy - y) * g;
          const face = flip > 0.5;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x - CW / 2,
                top: yy - CH / 2,
                width: CW,
                height: CH,
                zIndex: g > 0 ? 10 : i,
                transform: `rotate(${(rot + (1 - deal) * 25) * (1 - g)}deg) rotateY(${180 - flip * 180}deg) scale(${1 + (featureScale - 1) * g})`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 16,
                  boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
                  // Rückseite wird gespiegelt gezeichnet; Inhalt dreht sich mit.
                  transform: face ? "none" : "scaleX(-1)",
                  background: face ? (c.image ? "#000" : "#f3f1ea") : "#121212",
                  border: face ? "none" : "2px solid #2a2a2a",
                  overflow: "hidden",
                }}
              >
                {face && c.image ? (
                  // Eigene Grafik unverändert und vollständig zeigen (Titel und Preis stehen schon drauf).
                  <Img src={staticFile(c.image)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", background: "#000" }} />
                ) : face ? (
                  <>
                    <div style={{ position: "absolute", left: 18, top: 16, fontFamily: mono, fontSize: 18, color: "#2563eb" }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: bodySerif,
                        fontSize: 44,
                        color: "#151515",
                      }}
                    >
                      {c.label}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 18,
                        textAlign: "center",
                        fontFamily: mono,
                        fontSize: 15,
                        letterSpacing: "0.12em",
                        color: "#777",
                      }}
                    >
                      {c.sub}
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      left: CW / 2 - 34,
                      top: CH / 2 - 34,
                      width: 68,
                      height: 68,
                      borderRadius: 34,
                      border: "2px solid #3a3a3a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: sans,
                      fontWeight: 600,
                      fontSize: 22,
                      color: "#8a8a8a",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
