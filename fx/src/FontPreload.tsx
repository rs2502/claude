import React from "react";
import { ALL_FONTS } from "./fonts";

/** Unsichtbarer Text in jeder Schrift, damit der Browser sie ab dem ersten Frame decodiert hat. */
export const FontPreload: React.FC = () => (
  <div style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}>
    {ALL_FONTS.map((f) => (
      <span key={f} style={{ fontFamily: f, fontWeight: 700 }}>
        Aa
      </span>
    ))}
  </div>
);
