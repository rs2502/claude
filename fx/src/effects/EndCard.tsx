import React from "react";
import { AbsoluteFill } from "remotion";
import { displaySerif, sans } from "../fonts";
import { Base, FxProps } from "../lib/layers";
import { DEFAULT_FACE, backOut, easeInOut, mix, p, useTime } from "../lib/util";

export type EndCardProps = FxProps & {
  line?: string;
  name?: string;
  phone?: string;
  /** Streifen über der Karte, z. B. Landesfarben. */
  stripe?: string[];
};

/** Endcard: das Video schrumpft in ein Fenster oben, darunter eine große Karte mit Satz, Name und Telefon (Safe-Zone bis y 1500). */
export const EndCard: React.FC<EndCardProps> = ({
  video,
  trimBefore = 0,
  face = DEFAULT_FACE,
  line = "Lasst euch überraschen!",
  name = "Ristorante Pizzeria Italia",
  phone = "04252 4597",
  stripe = ["#009246", "#f1f2f1", "#ce2b37"],
}) => {
  const t = useTime();
  const k = p(t, 0, 0.45, easeInOut);
  const card = p(t, 0.2, 0.6, backOut);
  // Fenster oben: 860 breit, 760 hoch, Gesicht im oberen Drittel des Fensters.
  const win = { x: 110, y: 300, w: 860, h: 760 };
  const s = mix(1, 0.86, k);
  const tx = mix(0, win.x + win.w / 2 - face.x * s, k);
  const ty = mix(0, win.y + win.h * 0.3 - face.y * s, k);
  const clip = {
    l: mix(0, win.x, k),
    tp: mix(0, win.y, k),
    r: mix(1080, win.x + win.w, k),
    b: mix(1920, win.y + win.h, k),
  };
  return (
    <AbsoluteFill style={{ background: "#111" }}>
      <AbsoluteFill style={{ filter: "blur(30px) brightness(0.45)", transform: "scale(1.15)", opacity: k }}>
        <Base src={video} trimBefore={trimBefore} />
      </AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(${clip.tp}px ${1080 - clip.r}px ${1920 - clip.b}px ${clip.l}px round ${36 * k}px)` }}>
        <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${s})` }}>
          <Base src={video} trimBefore={trimBefore} />
        </AbsoluteFill>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: 1100,
          height: 390,
          borderRadius: 36,
          overflow: "hidden",
          background: "#fbf8f1",
          boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
          opacity: p(t, 0.2, 0.35),
          transform: `translateY(${(1 - card) * 220}px)`,
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", height: 16 }}>
          {stripe.map((c) => (
            <div key={c} style={{ flex: 1, background: c }} />
          ))}
        </div>
        <div style={{ fontFamily: displaySerif, fontSize: 92, color: "#141414", marginTop: 34, lineHeight: 1 }}>{line}</div>
        <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 54, color: "#ce2b37", marginTop: 34, letterSpacing: "-0.01em" }}>{name}</div>
        <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 64, color: "#141414", marginTop: 16, opacity: p(t, 0.45, 0.65) }}>☎ {phone}</div>
      </div>
    </AbsoluteFill>
  );
};
