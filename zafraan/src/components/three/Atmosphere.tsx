"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { experience, pointer } from "@/lib/store";
import { MOODS, type MoodSettings } from "./moods";
import { Specks } from "./Specks";
import { Herbs } from "./Herbs";
import { Steam } from "./Steam";

function Rig() {
  const { camera } = useThree();
  useFrame((_, delta) => {
    // Soft, weighted parallax — the room leans, it never swings.
    const k = 1 - Math.exp(-delta * 1.8);
    pointer.sx += (pointer.x - pointer.sx) * k;
    pointer.sy += (pointer.y - pointer.sy) * k;
    camera.position.x = pointer.sx * 0.55;
    camera.position.y = -pointer.sy * 0.35;
    camera.lookAt(0, 0, -2);
  });
  return null;
}

function Scene({ dense }: { dense: boolean }) {
  const mood = useRef<MoodSettings>({ ...MOODS.hero, dust: 0, spice: 0, herbs: 0, steam: 0 });
  const scroll = useRef(0);

  useEffect(() => {
    const apply = () => {
      const s = experience.get();
      mood.current = s.loaded ? MOODS[s.mood] : { ...MOODS.hero, herbs: 0, steam: 0, spice: 0, dust: 0 };
    };
    apply();
    const unsub = experience.subscribe(apply);
    const onScroll = () => (scroll.current = window.scrollY / window.innerHeight);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      unsub();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <fog attach="fog" args={["#fafaf8", 13, 28]} />
      <hemisphereLight args={["#fff6e8", "#d9cbb7", 1.1]} />
      <directionalLight position={[3, 5, 6]} intensity={1.4} color="#ffe9c7" />
      <Rig />
      <Steam count={dense ? 36 : 18} mood={mood} />
      <Specks count={dense ? 900 : 360} mood={mood} scroll={scroll} />
      <Herbs count={dense ? 14 : 6} mood={mood} scroll={scroll} />
    </>
  );
}

/**
 * One fixed WebGL layer for the whole page. Sections only change its mood;
 * nothing remounts while scrolling, so there are no hitches between chapters.
 */
export default function Atmosphere() {
  const [dpr, setDpr] = useState(1.5);
  const [dense] = useState(() => window.matchMedia("(min-width: 768px)").matches);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30">
      <Canvas
        dpr={[1, dpr]}
        camera={{ position: [0, 0, 10], fov: 35, near: 0.1, far: 40 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance", stencil: false, depth: true }}
        style={{ pointerEvents: "none" }}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
        <Scene dense={dense} />
      </Canvas>
    </div>
  );
}
