import React from "react";
import { AbsoluteFill } from "remotion";
import { bodySerif, mono, sans } from "../fonts";
import { Base, FxProps } from "../lib/layers";
import { backOut, easeIn, easeInOut, p, useTime } from "../lib/util";

export type DealerProps = FxProps & {
  cards?: { label: string; sub: string }[];
  /** Mitte der Kartenreihe (y in Pixeln). */
  y?: number;
  /** Wann jede Karte umdreht (Sekunden ab Effektstart), z. B. auf das Wort. Standard: kurz nacheinander. */
  flipAt?: number[];
};

const DEFAULT_CARDS = [
  { label: "Regeln", sub: "SAFE-ZONE" },
  { label: "Layouts", sub: "KURZ + LANG" },
  { label: "Vorlagen", sub: "20 STÜCK" },
  { label: "Techniken", sub: "10 JAHRE" },
];

const CW = 236;
const CH = 330;

/** 05 The Dealer: Karten werden ausgeteilt und nacheinander umgedreht. */
export const Dealer: React.FC<DealerProps> = ({ video, trimBefore = 0, dur, cards = DEFAULT_CARDS, y = 1470, flipAt }) => {
  const t = useTime();
  const n = cards.length;
  const out = p(t, dur - 0.3, dur, easeIn);
  return (
    <AbsoluteFill>
      <Base src={video} trimBefore={trimBefore} />
      <AbsoluteFill style={{ perspective: 1800 }}>
        {cards.map((c, i) => {
          const deal = p(t, 0.05 + i * 0.1, 0.45 + i * 0.1, backOut);
          const f = flipAt?.[i] ?? 0.75 + i * 0.28;
          const flip = p(t, f, f + 0.3, easeInOut);
          const tx = 540 + (i - (n - 1) / 2) * (CW + 14);
          const rot = (i - (n - 1) / 2) * 3;
          const x = 980 + (tx - 980) * deal;
          const yy = 2300 + (y - 2300) * deal + out * 700;
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
                transform: `rotate(${rot + (1 - deal) * 25}deg) rotateY(${180 - flip * 180}deg)`,
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
                  background: face ? "#f3f1ea" : "#121212",
                  border: face ? "none" : "2px solid #2a2a2a",
                  overflow: "hidden",
                }}
              >
                {face ? (
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
