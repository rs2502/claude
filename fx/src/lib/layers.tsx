import React, { CSSProperties } from "react";
import { Img, OffthreadVideo, staticFile } from "remotion";
import { sans } from "../fonts";
import { Face } from "./util";

/** Gemeinsame Felder aller Effekte. Zeiten in Sekunden, Dateien relativ zu public/. */
export type FxProps = {
  video: string;
  /** Freigestellte Person (WebM mit Alpha), gleiche Länge wie `video`. */
  cutout?: string;
  /** Ab welchem Frame von `video` der Effekt startet (hält Video und Freisteller synchron). */
  trimBefore?: number;
  /** Dauer des Effekts in Sekunden. */
  dur: number;
  /** Gesichtsmitte in Pixeln (1080 × 1920). */
  face?: Face;
  /** Bilder für Wände, Karten und Kacheln (public/…). */
  tiles?: string[];
};

export const fill: CSSProperties = { position: "absolute", inset: 0 };

export const Base: React.FC<{ src: string; trimBefore?: number; style?: CSSProperties }> = ({
  src,
  trimBefore = 0,
  style,
}) => (
  <OffthreadVideo
    src={staticFile(src)}
    trimBefore={trimBefore}
    muted
    style={{ ...fill, width: "100%", height: "100%", objectFit: "cover", ...style }}
  />
);

export const Cutout: React.FC<{ src?: string; trimBefore?: number; style?: CSSProperties }> = ({
  src,
  trimBefore = 0,
  style,
}) =>
  src ? (
    <OffthreadVideo
      src={staticFile(src)}
      trimBefore={trimBefore}
      transparent
      muted
      style={{ ...fill, width: "100%", height: "100%", objectFit: "cover", ...style }}
    />
  ) : null;

export const TILE_TITLES = [
  "3 TIPPS", "WARUM?", "VORHER / NACHHER", "SO GEHT'S", "NEU", "FEHLER #1",
  "TOP 5", "DER TRICK", "SCHAU HIN", "10 JAHRE", "HACK", "LIVE", "BACKSTAGE", "PROFI",
];
const TINTS = ["#1d4ed8", "#b91c1c", "#0f766e", "#7c3aed", "#c2410c", "#111827"];

/** Thumbnail-Kachel: Bild aus `tiles` (oder Farbfläche) mit Titel. */
export const Tile: React.FC<{ i: number; tiles?: string[]; style?: CSSProperties; titleSize?: number }> = ({
  i,
  tiles,
  style,
  titleSize = 34,
}) => {
  const src = tiles && tiles.length ? tiles[i % tiles.length] : undefined;
  const tint = TINTS[i % TINTS.length];
  const title = TILE_TITLES[i % TILE_TITLES.length];
  return (
    <div
      style={{
        position: "absolute",
        overflow: "hidden",
        borderRadius: 14,
        background: `linear-gradient(160deg, ${tint}, #05070c)`,
        boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
        ...style,
      }}
    >
      {src ? <Img src={staticFile(src)} style={{ ...fill, width: "100%", height: "100%", objectFit: "cover" }} /> : null}
      <div style={{ ...fill, background: `linear-gradient(180deg, transparent 45%, ${tint}cc 100%)` }} />
      <div
        style={{
          position: "absolute",
          left: "8%",
          right: "8%",
          bottom: "8%",
          fontFamily: sans,
          fontWeight: 900,
          fontSize: titleSize,
          lineHeight: 1,
          color: "white",
          textShadow: "0 3px 10px rgba(0,0,0,0.6)",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </div>
    </div>
  );
};

/** Dunkelblauer Hintergrund mit Rasterlinien (Mosaic Drop, The Arena). */
export const GridBg: React.FC<{ style?: CSSProperties }> = ({ style }) => (
  <div
    style={{
      ...fill,
      background: "#071633",
      backgroundImage:
        "linear-gradient(rgba(90,150,255,0.16) 2px, transparent 2px), linear-gradient(90deg, rgba(90,150,255,0.16) 2px, transparent 2px)",
      backgroundSize: "72px 72px",
      ...style,
    }}
  />
);

/** Glas-Look für Liquid Glass. */
export const glass: CSSProperties = {
  // Leicht abgedunkelt, damit weiße Schrift auch vor hellem Hintergrund lesbar bleibt.
  background: "linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.05)), rgba(15,15,15,0.28)",
  backdropFilter: "blur(16px) saturate(170%) brightness(1.06)",
  WebkitBackdropFilter: "blur(16px) saturate(170%) brightness(1.06)",
  border: "2px solid rgba(255,255,255,0.5)",
  boxShadow:
    "inset 0 2px 1px rgba(255,255,255,0.7), inset 0 -12px 30px rgba(255,255,255,0.10), 0 24px 60px rgba(0,0,0,0.28)",
};

/** Claude-Stern als Icon. */
export const Spark: React.FC<{ size: number; color?: string }> = ({ size, color = "white" }) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100">
    {Array.from({ length: 12 }).map((_, k) => (
      <rect key={k} x={-5} y={-46} width={10} height={36} rx={5} fill={color} transform={`rotate(${k * 30})`} />
    ))}
  </svg>
);
