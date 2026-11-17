import React from "react";
import { AbsoluteFill } from "remotion";
import { sans } from "../fonts";
import { Base, FxProps, Spark, glass } from "../lib/layers";
import { backOut, easeIn, easeInOut, mix, p, useTime } from "../lib/util";

export type LiquidGlassProps = FxProps & {
  main?: string;
  cardTitle?: string;
  cardSub?: string;
  badge?: string;
  /** y-Mitte der großen Glasleiste. */
  y?: number;
};

/** 09 Liquid Glass: Glaselemente mit Lichtbrechung wachsen aus einem Tropfen zu Leiste, Karte und Badge. */
export const LiquidGlass: React.FC<LiquidGlassProps> = ({
  video,
  trimBefore = 0,
  dur,
  main = "17 Video-Effekte auf Steroiden.",
  cardTitle = "10 Jahre",
  cardSub = "als Video-Editor",
  badge = "Made by Claude",
  y = 1180,
}) => {
  const t = useTime();
  const out = p(t, dur - 0.3, dur, easeIn);
  const drop = p(t, 0, 0.25, backOut);
  const widen = p(t, 0.2, 0.7, easeInOut);
  const w = mix(130, 900, widen);
  const textIn = p(t, 0.55, 0.8);
  const card = p(t, 0.6, 0.95, backOut);
  const pill = p(t, 0.8, 1.15, backOut);
  return (
    <AbsoluteFill>
      <Base src={video} trimBefore={trimBefore} />
      <AbsoluteFill style={{ opacity: 1 - out, filter: `blur(${out * 8}px)` }}>
        <div
          style={{
            ...glass,
            position: "absolute",
            left: 540 - w / 2,
            top: y - 65,
            width: w,
            height: 130,
            borderRadius: 65,
            transform: `scale(${drop})`,
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: "0 0 auto",
              marginLeft: 22,
              width: 86,
              height: 86,
              borderRadius: 24,
              background: "#d97757",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
            }}
          >
            <Spark size={56} />
          </div>
          <div
            style={{
              marginLeft: 26,
              whiteSpace: "nowrap",
              fontFamily: sans,
              fontWeight: 600,
              fontSize: 42,
              color: "white",
              textShadow: "0 2px 10px rgba(0,0,0,0.35)",
              opacity: textIn,
              transform: `translateX(${(1 - textIn) * 20}px)`,
            }}
          >
            {main}
          </div>
        </div>
        <div
          style={{
            ...glass,
            position: "absolute",
            left: 60,
            top: 330,
            width: 330,
            padding: "26px 30px",
            borderRadius: 32,
            opacity: p(t, 0.6, 0.75),
            transform: `scale(${card})`,
            transformOrigin: "0 0",
            fontFamily: sans,
            color: "white",
            textShadow: "0 2px 8px rgba(0,0,0,0.35)",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 44 }}>{cardTitle}</div>
          <div style={{ fontWeight: 500, fontSize: 26, opacity: 0.85, marginTop: 4 }}>{cardSub}</div>
        </div>
        <div
          style={{
            ...glass,
            position: "absolute",
            right: 50,
            top: y + 140,
            height: 92,
            padding: "0 30px 0 16px",
            borderRadius: 46,
            display: "flex",
            alignItems: "center",
            gap: 16,
            opacity: p(t, 0.8, 0.95),
            transform: `translateX(${(1 - pill) * 120}px)`,
            fontFamily: sans,
            fontWeight: 600,
            fontSize: 34,
            color: "white",
            textShadow: "0 2px 8px rgba(0,0,0,0.35)",
          }}
        >
          <div style={{ width: 60, height: 60, borderRadius: 18, background: "#d97757", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Spark size={38} />
          </div>
          {badge}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
