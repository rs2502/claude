import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { bodySerif, sans } from "../fonts";
import { Base, FxProps } from "../lib/layers";
import { backOut, easeIn, p, useTime } from "../lib/util";

export type ProfileWallProps = FxProps & {
  /** Karten: rundes Bild, Name, Zeile darunter. Werden links und rechts neben der Person gestapelt. */
  profiles?: { name: string; line?: string; image?: string }[];
  /** Freie Spalten links und rechts (Person steht in der Mitte). */
  columns?: { left: number; right: number; width: number };
  top?: number;
};

/** Profile Wall: Profilkarten ploppen gestaffelt links und rechts neben der Person auf, z. B. Team oder Gerichte. */
export const ProfileWall: React.FC<ProfileWallProps> = ({
  video,
  trimBefore = 0,
  dur,
  profiles = [
    { name: "Anna", line: "Service" },
    { name: "Marco", line: "Küche" },
    { name: "Luca", line: "Pizza" },
    { name: "Sofia", line: "Bar" },
  ],
  columns = { left: 40, right: 760, width: 290 },
  top = 420,
}) => {
  const t = useTime();
  const out = p(t, dur - 0.3, dur, easeIn);
  const perCol = Math.ceil(profiles.length / 2);
  const gap = 30;
  const h = Math.min(330, (1480 - top - gap * (perCol - 1)) / perCol);
  return (
    <AbsoluteFill>
      <Base src={video} trimBefore={trimBefore} />
      {profiles.map((pr, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const a = 0.1 + i * 0.16;
        const k = p(t, a, a + 0.4, backOut);
        const x = col === 0 ? columns.left : columns.right;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: top + row * (h + gap),
              width: columns.width,
              height: h,
              borderRadius: 28,
              background: "#fbf8f1",
              boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              opacity: Math.min(p(t, a, a + 0.12), 1 - out),
              transform: `translateX(${(1 - k) * (col === 0 ? -260 : 260)}px) rotate(${(1 - k) * (col === 0 ? -8 : 8)}deg) scale(${0.85 + 0.15 * k})`,
            }}
          >
            <div style={{ width: h * 0.48, height: h * 0.48, borderRadius: "50%", overflow: "hidden", background: "#d9d2c3", border: "5px solid white", boxShadow: "0 6px 16px rgba(0,0,0,0.2)" }}>
              {pr.image ? <Img src={staticFile(pr.image)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 78%" }} /> : null}
            </div>
            <div style={{ fontFamily: bodySerif, fontWeight: 700, fontSize: 34, color: "#151515", textAlign: "center", lineHeight: 1.05, padding: "0 14px" }}>{pr.name}</div>
            {pr.line ? <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 28, color: "#c8102e" }}>{pr.line}</div> : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
