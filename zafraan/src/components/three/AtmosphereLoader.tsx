"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Atmosphere = dynamic(() => import("./Atmosphere"), { ssr: false });

/** Three.js is code-split and only fetched after first paint, when motion is welcome. */
export function AtmosphereLoader() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = "requestIdleCallback" in window ? requestIdleCallback(() => setReady(true), { timeout: 1500 }) : setTimeout(() => setReady(true), 600);
    return () => ("cancelIdleCallback" in window ? cancelIdleCallback(id as number) : clearTimeout(id as number));
  }, []);
  return ready ? <Atmosphere /> : null;
}
