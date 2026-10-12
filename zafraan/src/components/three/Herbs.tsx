"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { MoodSettings } from "./moods";

/** A coriander/curry leaf drawn as two beziers with a slight asymmetry. */
function leafGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.5);
  s.bezierCurveTo(0.34, -0.28, 0.3, 0.22, 0.02, 0.5);
  s.bezierCurveTo(-0.26, 0.26, -0.32, -0.24, 0, -0.5);
  const g = new THREE.ShapeGeometry(s, 12);
  // Cup the leaf so light rolls across it.
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    p.setZ(i, -x * x * 0.9 + Math.sin(y * 3.0) * 0.03);
  }
  g.computeVertexNormals();
  return g;
}

const GREENS = ["#5f6d3e", "#6f7a4f", "#7d8a52", "#4f5c33", "#8c9660"];

export function Herbs({ count, mood, scroll }: { count: number; mood: React.RefObject<MoodSettings>; scroll: React.RefObject<number> }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const geometry = useMemo(leafGeometry, []);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (Math.random() - 0.5) * 14,
        y: (Math.random() - 0.5) * 9,
        // Keep herbs near the focal plane: they are the "hero" particles.
        z: Math.random() * 5 - 4,
        s: 0.22 + Math.random() * 0.28,
        spin: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(0.35),
        phase: Math.random() * Math.PI * 2,
        speed: 0.06 + Math.random() * 0.08,
        i,
      })),
    [count],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    const m = mesh.current!;
    const c = new THREE.Color();
    seeds.forEach((s) => m.setColorAt(s.i, c.set(GREENS[s.i % GREENS.length])));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [seeds]);

  const presence = useRef(0);
  useFrame((state, delta) => {
    const m = mesh.current!;
    const t = state.clock.elapsedTime;
    const k = 1 - Math.exp(-delta * 1.4);
    presence.current += ((mood.current?.herbs ?? 0) - presence.current) * k;
    mat.current!.opacity = presence.current * 0.92;
    m.visible = presence.current > 0.01;
    if (!m.visible) return;

    const sc = scroll.current ?? 0;
    for (const s of seeds) {
      const depth = (s.z + 4) / 5;
      let y = s.y + t * s.speed + sc * (0.8 + depth * 1.6);
      y = ((((y + 5.5) % 11) + 11) % 11) - 5.5;
      dummy.position.set(s.x + Math.sin(t * 0.3 + s.phase) * 0.4, y, s.z);
      dummy.rotation.set(t * s.spin.x + s.phase, t * s.spin.y, Math.sin(t * 0.4 + s.phase) * 0.6 + s.spin.z);
      dummy.scale.setScalar(s.s * (0.85 + presence.current * 0.15));
      dummy.updateMatrix();
      m.setMatrixAt(s.i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, count]} frustumCulled={false}>
      <meshStandardMaterial ref={mat} side={THREE.DoubleSide} roughness={0.62} metalness={0} transparent opacity={0} depthWrite={false} />
    </instancedMesh>
  );
}
