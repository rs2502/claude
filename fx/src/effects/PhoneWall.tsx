import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { Base, Cutout, FxProps } from "../lib/layers";
import { backOut, easeIn, p, useTime } from "../lib/util";

export type PhoneWallProps = FxProps & {
  /** Bilder in den Handys (public/…); werden wiederholt, bis die Wand voll ist. */
  images?: string[];
  bg?: string;
};

const PW = 250;
const PH = 520;

/** Phone Wall: hinter der Person steht eine schräge Wand aus Handys mit Inhalten, die langsam nach oben läuft. Braucht den Freisteller. */
export const PhoneWall: React.FC<PhoneWallProps> = ({ video, cutout, trimBefore = 0, dur, images, tiles, bg = "#101114" }) => {
  const t = useTime();
  const pics = images?.length ? images : tiles ?? [];
  const k = Math.min(p(t, 0, 0.25), 1 - p(t, dur - 0.25, dur, easeIn));
  const scroll = -t * 120;
  const cols = 5;
  const rows = 5;
  return (
    <AbsoluteFill>
      <Base src={video} trimBefore={trimBefore} />
      <AbsoluteFill style={{ background: bg, opacity: k, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 540, top: 960, transform: `rotate(-14deg) translateY(${scroll}px)` }}>
          {Array.from({ length: cols * rows }).map((_, i) => {
            const c = i % cols;
            const r = Math.floor(i / cols);
            const x = (c - (cols - 1) / 2) * (PW + 40);
            const y = (r - (rows - 1) / 2) * (PH + 40) + (c % 2 ? PH / 2 : 0);
            const d = 0.05 * (Math.abs(c - 2) + Math.abs(r - 2));
            const pop = p(t, d, d + 0.4, backOut);
            const src = pics.length ? pics[(i * 3) % pics.length] : undefined;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x - PW / 2,
                  top: y - PH / 2,
                  width: PW,
                  height: PH,
                  borderRadius: 40,
                  background: "#000",
                  border: "8px solid #2a2b30",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.55)",
                  overflow: "hidden",
                  transform: `scale(${pop})`,
                }}
              >
                {src ? <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                <div style={{ position: "absolute", top: 12, left: PW / 2 - 40, width: 64, height: 18, borderRadius: 9, background: "#000" }} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <Cutout src={cutout} trimBefore={trimBefore} style={{ filter: `drop-shadow(0 30px 60px rgba(0,0,0,${0.6 * k}))` }} />
    </AbsoluteFill>
  );
};
