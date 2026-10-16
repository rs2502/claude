import { loadFont } from "@remotion/fonts";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const fonts: [string, string, "normal" | "italic", string][] = [
  ["Playfair Display", "pf700", "normal", "700"],
  ["Playfair Display", "pf900", "normal", "900"],
  ["Playfair Display", "pf700i", "italic", "700"],
  ["Inter", "in400", "normal", "400"],
  ["Inter", "in600", "normal", "600"],
  ["Inter", "in700", "normal", "700"],
];
fonts.forEach(([family, file, style, weight]) =>
  loadFont({
    family,
    url: staticFile(`fonts/${file}.woff2`),
    style,
    weight,
  }),
);
const serif = "'Playfair Display', Georgia, serif";
const serifItalic = serif;
const sans = "Inter, sans-serif";

// Farben der Website
const C = {
  cream: "#f7f1e8",
  paper: "#fffdf9",
  terra: "#bb5631",
  ink: "#211a15",
  muted: "#7a6d63",
  gold: "#c9a24a",
  night: "#1a120d",
};

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const useIn = (delay: number, dur = 20) => {
  const frame = useCurrentFrame();
  return interpolate(frame - delay, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
};

const Rise: React.FC<{
  delay?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, children, style }) => {
  const p = useIn(delay);
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${(1 - p) * 40}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Kicker: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color = C.terra,
}) => (
  <div
    style={{
      fontFamily: sans,
      fontWeight: 700,
      fontSize: 26,
      letterSpacing: 6,
      textTransform: "uppercase",
      color,
      display: "flex",
      alignItems: "center",
      gap: 20,
    }}
  >
    <div style={{ width: 60, height: 3, background: color }} />
    {children}
  </div>
);

const Em: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color = C.terra,
}) => (
  <span style={{ fontFamily: serifItalic, fontStyle: "italic", color }}>
    {children}
  </span>
);

const H: React.FC<{
  children: React.ReactNode;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ children, size = 110, color = C.ink, style }) => (
  <div
    style={{
      fontFamily: serif,
      fontWeight: 900,
      fontSize: size,
      lineHeight: 1.08,
      color,
      ...style,
    }}
  >
    {children}
  </div>
);

const Photo: React.FC<{
  src: string;
  w: number;
  h: number;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ src, w, h, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14 } });
  const zoom = interpolate(frame, [0, 300], [1.05, 1.18]);
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 28,
        overflow: "hidden",
        boxShadow: "0 30px 60px rgba(33,26,21,0.18)",
        opacity: s,
        transform: `scale(${0.85 + s * 0.15})`,
        background: C.paper,
        ...style,
      }}
    >
      <Img
        src={staticFile(`img/${src}.png`)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${zoom})`,
        }}
      />
    </div>
  );
};

const Stage: React.FC<{
  children: React.ReactNode;
  bg?: string;
  style?: React.CSSProperties;
}> = ({ children, bg = C.cream, style }) => (
  <AbsoluteFill
    style={{
      background: bg,
      padding: "0 160px",
      justifyContent: "center",
      ...style,
    }}
  >
    {children}
  </AbsoluteFill>
);

/* ---------- Szenen ---------- */

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, 150], [1.15, 1.3]);
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <AbsoluteFill style={{ transform: `scale(${z})`, opacity: 0.45 }}>
        <Img
          src={staticFile("img/pasta.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(6px)" }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(26,18,13,0.35), rgba(26,18,13,0.9))",
        }}
      />
      <Stage bg="transparent" style={{ alignItems: "center", textAlign: "center" }}>
        <Rise delay={5}>
          <H size={130} color={C.paper}>
            Lust auf <Em color={C.gold}>echtes</Em> Italien?
          </H>
        </Rise>
        <Rise delay={45} style={{ marginTop: 40 }}>
          <div style={{ fontFamily: sans, fontSize: 48, color: C.cream, opacity: 0.85 }}>
            Ganz ohne Flugticket.
          </div>
        </Rise>
      </Stage>
    </AbsoluteFill>
  );
};

const Strike: React.FC<{ text: string; delay: number }> = ({ text, delay }) => {
  const p = useIn(delay, 15);
  const line = useIn(delay + 20, 15);
  return (
    <div
      style={{
        position: "relative",
        opacity: interpolate(line, [0, 1], [p, 0.35]),
        transform: `translateX(${(1 - p) * -60}px)`,
        fontFamily: serif,
        fontWeight: 700,
        fontSize: 96,
        color: C.ink,
        width: "fit-content",
      }}
    >
      {text}
      <div
        style={{
          position: "absolute",
          left: -10,
          top: "52%",
          height: 10,
          borderRadius: 5,
          width: `calc(${line * 100}% + 20px)`,
          background: C.terra,
        }}
      />
    </div>
  );
};

const Problem: React.FC = () => (
  <Stage>
    <Rise>
      <Kicker>Kennen Sie das?</Kicker>
    </Rise>
    <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 24 }}>
      <Strike text="Tiefkühlpizza." delay={15} />
      <Strike text="Lauwarmer Lieferdienst." delay={45} />
      <Strike text="Jedes Mal dasselbe." delay={75} />
    </div>
    <Rise delay={120} style={{ marginTop: 60 }}>
      <H size={72}>
        Sie verdienen <Em>mehr.</Em>
      </H>
    </Rise>
  </Stage>
);

const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 5, fps, config: { damping: 12 } });
  return (
    <Stage style={{ alignItems: "center", textAlign: "center" }}>
      <div
        style={{
          fontFamily: sans,
          fontSize: 40,
          letterSpacing: 14,
          color: C.gold,
          opacity: s,
        }}
      >
        ★ ★ ★
      </div>
      <div style={{ transform: `scale(${0.8 + s * 0.2})`, opacity: s, marginTop: 20 }}>
        <H size={120}>
          Ristorante Pizzeria <Em>Italia</Em>
        </H>
      </div>
      <Rise delay={35} style={{ marginTop: 40 }}>
        <div style={{ fontFamily: sans, fontSize: 44, color: C.muted }}>
          Echte italienische <Em>Lebensfreude</Em> in Bruchhausen-Vilsen.
        </div>
      </Rise>
      <Rise delay={65} style={{ marginTop: 30 }}>
        <div style={{ fontFamily: sans, fontSize: 36, color: C.ink }}>
          Frisch gekocht · herzlich serviert · Geschmack Italiens
        </div>
      </Rise>
    </Stage>
  );
};

const pillars = [
  { icon: "🌿", t: "Frische Qualität", d: "Täglich frische, sorgfältig ausgewählte Zutaten." },
  { icon: "👨‍🍳", t: "Kreative Küche", d: "Pasta, Pizza aus dem Ofen, Fleisch vom Grill & frischer Fisch." },
  { icon: "🍷", t: "Herzlicher Service", d: "Aufmerksam und persönlich – vom ersten Moment an." },
];

const Pillars: React.FC = () => (
  <Stage>
    <Rise>
      <Kicker>Warum Italia?</Kicker>
    </Rise>
    <Rise delay={8} style={{ marginTop: 24 }}>
      <H size={80}>
        Qualität, Kreativität & <Em>herzlicher Service</Em>
      </H>
    </Rise>
    <div style={{ display: "flex", gap: 40, marginTop: 70 }}>
      {pillars.map((p, i) => (
        <Rise key={p.t} delay={40 + i * 25} style={{ flex: 1 }}>
          <div
            style={{
              background: C.paper,
              borderRadius: 32,
              padding: 50,
              height: "100%",
              boxSizing: "border-box",
              boxShadow: "0 25px 50px rgba(33,26,21,0.08)",
            }}
          >
            <div style={{ fontSize: 70 }}>{p.icon}</div>
            <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 48, color: C.ink, marginTop: 20 }}>
              {p.t}
            </div>
            <div style={{ fontFamily: sans, fontSize: 30, color: C.muted, marginTop: 16, lineHeight: 1.4 }}>
              {p.d}
            </div>
          </div>
        </Rise>
      ))}
    </div>
  </Stage>
);

const dishes = [
  { src: "pizza", label: "Pizza" },
  { src: "pasta", label: "Pasta" },
  { src: "spaghetti", label: "Für Kinder" },
  { src: "contorni", label: "Contorni" },
  { src: "dolci", label: "Dolci" },
  { src: "caffe", label: "Caffè" },
];

const Counter: React.FC<{ to: number; delay: number }> = ({ to, delay }) => {
  const p = useIn(delay, 45);
  return <>{Math.round(p * to)}</>;
};

const Menu: React.FC = () => (
  <Stage style={{ flexDirection: "row", alignItems: "center", gap: 90 }}>
    <div style={{ width: 620 }}>
      <Rise>
        <Kicker>Die Speisekarte</Kicker>
      </Rise>
      <Rise delay={8} style={{ marginTop: 24 }}>
        <H size={190} color={C.terra} style={{ lineHeight: 1 }}>
          <Counter to={126} delay={10} />
        </H>
        <H size={70}>Gerichte in 14 Kategorien</H>
      </Rise>
      <Rise delay={60} style={{ marginTop: 36 }}>
        <div style={{ fontFamily: sans, fontSize: 32, color: C.muted, lineHeight: 1.5 }}>
          Von Antipasti über 21 Pizzen und 20 Pastagerichte bis zu Fisch, Fleisch, Dolci und Wein.
        </div>
      </Rise>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 280px)", gap: 30 }}>
      {dishes.map((d, i) => (
        <div key={d.src} style={{ position: "relative" }}>
          <Photo src={d.src} w={280} h={230} delay={25 + i * 10} />
          <Rise delay={35 + i * 10}>
            <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 32, color: C.ink, marginTop: 14 }}>
              {d.label}
            </div>
          </Rise>
        </div>
      ))}
    </div>
  </Stage>
);

const Special: React.FC = () => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, 180], [1.0, 1.12]);
  return (
    <AbsoluteFill style={{ background: C.night, flexDirection: "row", alignItems: "center", padding: "0 160px", gap: 100 }}>
      <div style={{ width: 760, height: 600, borderRadius: 36, overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.5)" }}>
        <Img
          src={staticFile("img/muscheln.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z})` }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <Rise>
          <Kicker color={C.gold}>Menue Speciale</Kicker>
        </Rise>
        <Rise delay={10} style={{ marginTop: 24 }}>
          <H size={100} color={C.paper}>
            Herbst-<Em color={C.gold}>Spezialitäten</Em>
          </H>
        </Rise>
        <Rise delay={40} style={{ marginTop: 36 }}>
          <div style={{ fontFamily: sans, fontSize: 38, color: C.cream, lineHeight: 1.45 }}>
            Frische Muscheln – in Weißweinsoße oder Tomatensoße.
            <br />
            16 Gerichte auf der aktuellen Herbstkarte.
          </div>
        </Rise>
      </div>
    </AbsoluteFill>
  );
};

const events = ["Hochzeit", "Geburtstag", "Firmenfeier", "Jubiläum", "Catering"];

const Events: React.FC = () => (
  <Stage bg={C.terra} style={{ alignItems: "center", textAlign: "center" }}>
    <Rise>
      <H size={120} color={C.paper}>
        Mit uns feiern Sie <Em color={C.paper}>richtig.</Em>
      </H>
    </Rise>
    <div style={{ display: "flex", gap: 24, marginTop: 70, flexWrap: "wrap", justifyContent: "center" }}>
      {events.map((e, i) => (
        <Rise key={e} delay={30 + i * 12}>
          <div
            style={{
              fontFamily: sans,
              fontWeight: 600,
              fontSize: 38,
              color: C.terra,
              background: C.paper,
              padding: "20px 44px",
              borderRadius: 999,
            }}
          >
            {e}
          </div>
        </Rise>
      ))}
    </div>
    <Rise delay={110} style={{ marginTop: 60 }}>
      <div style={{ fontFamily: sans, fontSize: 38, color: C.cream }}>
        Ihr Event wird zu einem kulinarischen Erlebnis.
      </div>
    </Rise>
  </Stage>
);

const hours = [
  ["Montag", "11:30–14:30 · 17:30–22:30"],
  ["Di & Mi", "Ruhetag"],
  ["Do – Sa", "11:30–14:30 · 17:30–22:30"],
  ["Sonntag", "11:30–14:00 · 17:00–22:00"],
];

const Info: React.FC = () => (
  <Stage style={{ flexDirection: "row", alignItems: "center", gap: 80 }}>
    <div style={{ flex: 1 }}>
      <Rise>
        <Kicker>Besuchen Sie uns</Kicker>
      </Rise>
      <Rise delay={8} style={{ marginTop: 24 }}>
        <H size={96}>
          Öffnungszeiten & <Em>Kontakt</Em>
        </H>
      </Rise>
      <Rise delay={30} style={{ marginTop: 40 }}>
        <div style={{ fontFamily: sans, fontSize: 40, color: C.ink, lineHeight: 1.6 }}>
          📍 Engelbergplatz 4<br />
          <span style={{ paddingLeft: 58 }}>27305 Bruchhausen-Vilsen</span>
          <br />
          📞 <b style={{ color: C.terra }}>04252 4597</b>
        </div>
      </Rise>
    </div>
    <Rise delay={20} style={{ width: 780 }}>
      <div style={{ background: C.paper, borderRadius: 32, padding: "40px 56px", boxShadow: "0 25px 50px rgba(33,26,21,0.08)" }}>
        {hours.map(([d, t], i) => (
          <Rise key={d} delay={35 + i * 10}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: sans,
                fontSize: 34,
                padding: "22px 0",
                borderBottom: i < hours.length - 1 ? `2px dashed ${C.cream}` : "none",
              }}
            >
              <b style={{ color: C.ink }}>{d}</b>
              <span style={{ color: t === "Ruhetag" ? C.muted : C.ink }}>{t}</span>
            </div>
          </Rise>
        ))}
      </div>
    </Rise>
  </Stage>
);

const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = 1 + Math.sin((frame / fps) * Math.PI * 2 * 0.8) * 0.03 * useIn(50);
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <AbsoluteFill style={{ opacity: 0.25 }}>
        <Img
          src={staticFile("img/vini.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(10px)" }}
        />
      </AbsoluteFill>
      <Stage bg="transparent" style={{ alignItems: "center", textAlign: "center" }}>
        <Rise>
          <H size={124} color={C.paper}>
            Ihr Tisch <Em color={C.gold}>wartet.</Em>
          </H>
        </Rise>
        <Rise delay={20} style={{ marginTop: 30 }}>
          <div style={{ fontFamily: sans, fontSize: 40, color: C.cream }}>
            Jetzt reservieren – online oder telefonisch.
          </div>
        </Rise>
        <Rise delay={45} style={{ marginTop: 60 }}>
          <div
            style={{
              transform: `scale(${pulse})`,
              background: C.terra,
              color: C.paper,
              fontFamily: sans,
              fontWeight: 700,
              fontSize: 52,
              padding: "32px 80px",
              borderRadius: 999,
              boxShadow: "0 20px 50px rgba(187,86,49,0.5)",
            }}
          >
            📞 04252 4597
          </div>
        </Rise>
        <Rise delay={70} style={{ marginTop: 50 }}>
          <div style={{ fontFamily: sans, fontSize: 34, color: C.gold, letterSpacing: 2 }}>
            www.ristorante-pizzeria-italia.com
          </div>
        </Rise>
      </Stage>
    </AbsoluteFill>
  );
};

/* ---------- Ablauf ---------- */

export const SCENES: { C: React.FC; d: number }[] = [
  { C: Hook, d: 150 },
  { C: Problem, d: 190 },
  { C: Reveal, d: 180 },
  { C: Pillars, d: 260 },
  { C: Menu, d: 300 },
  { C: Special, d: 200 },
  { C: Events, d: 210 },
  { C: Info, d: 220 },
  { C: Cta, d: 240 },
];
export const T = 15;
export const VSL_DURATION =
  SCENES.reduce((a, s) => a + s.d, 0) - T * (SCENES.length - 1);

export const Vsl: React.FC = () => (
  <TransitionSeries>
    {SCENES.flatMap(({ C: Scene, d }, i) => {
      const seq = (
        <TransitionSeries.Sequence key={`s${i}`} durationInFrames={d}>
          <Scene />
        </TransitionSeries.Sequence>
      );
      if (i === 0) return [seq];
      return [
        <TransitionSeries.Transition
          key={`t${i}`}
          presentation={i % 3 === 0 ? slide({ direction: "from-right" }) : fade()}
          timing={linearTiming({ durationInFrames: T })}
        />,
        seq,
      ];
    })}
  </TransitionSeries>
);
