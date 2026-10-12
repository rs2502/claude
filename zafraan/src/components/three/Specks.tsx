"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { MoodSettings } from "./moods";

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform float uFocus;
  uniform float uPixelRatio;
  uniform float uDust;
  uniform float uSpice;
  attribute float aSize;
  attribute float aSeed;
  attribute float aKind;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vBlur;
  varying float vKind;
  varying float vSeed;

  void main() {
    vec3 p = position;
    float depth01 = (p.z + 6.0) / 10.0;               // 0 far … 1 near
    // Drift upward like warm air; nearer motes travel faster (parallax).
    p.y += uTime * (0.05 + aSeed * 0.08) + uScroll * (0.6 + depth01 * 2.4);
    p.y = mod(p.y + 6.0, 12.0) - 6.0;
    p.x += sin(uTime * 0.21 + aSeed * 40.0) * (0.25 + depth01 * 0.35);
    p.z += cos(uTime * 0.17 + aSeed * 23.0) * 0.2;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    // Depth of field: distance from the focal plane widens and softens the mote.
    float focal = mix(-14.0, -7.0, uFocus);
    float blur = clamp(abs(mv.z - focal) / 6.0, 0.0, 1.0);
    vBlur = blur;
    gl_PointSize = aSize * uPixelRatio * (1.0 + blur * 5.0) * (10.0 / -mv.z);

    float gate = aKind > 0.5 ? uSpice : uDust;
    // Thin out by seed so density, not just opacity, follows the mood.
    float present = step(aSeed, gate);
    vAlpha = present * mix(1.0, 0.18, blur) * (aKind > 0.5 ? 0.85 : 0.5);
    vColor = aColor;
    vKind = aKind;
    vSeed = aSeed;
  }
`;

const fragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vBlur;
  varying float vKind;
  varying float vSeed;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    // Spice flakes are irregular; dust is round.
    if (vKind > 0.5) {
      float a = atan(uv.y, uv.x);
      r *= 1.0 + 0.22 * sin(a * 3.0 + vSeed * 30.0) + 0.12 * sin(a * 5.0 + vSeed * 11.0);
    }
    float edge = mix(0.08, 0.5, vBlur);
    float alpha = smoothstep(0.5, 0.5 - edge, r) * vAlpha;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

const DUST = ["#8f847d", "#b9ab9c", "#d8cbb8", "#6b5d55"];
const SPICE = ["#c8862f", "#9c3b26", "#d9a441", "#b4552c", "#6f7a4f", "#e0b25e"];

export function Specks({ count, mood, scroll }: { count: number; mood: React.RefObject<MoodSettings>; scroll: React.RefObject<number> }) {
  const mat = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const seed = new Float32Array(count);
    const kind = new Float32Array(count);
    const color = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const spice = i % 4 === 0;
      pos.set([(Math.random() - 0.5) * 18, (Math.random() - 0.5) * 12, Math.random() * 10 - 6], i * 3);
      seed[i] = Math.random();
      kind[i] = spice ? 1 : 0;
      size[i] = spice ? 2.2 + Math.random() * 3.2 : 0.9 + Math.random() * 1.6;
      c.set(spice ? SPICE[i % SPICE.length] : DUST[i % DUST.length]);
      color.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aKind", new THREE.BufferAttribute(kind, 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uFocus: { value: 0.5 },
      uDust: { value: 0 },
      uSpice: { value: 0 },
      uPixelRatio: { value: 1 },
    }),
    [],
  );

  useFrame((state, delta) => {
    const u = uniforms;
    const m = mood.current!;
    const k = 1 - Math.exp(-delta * 1.6); // frame-rate independent easing
    u.uTime.value += delta;
    u.uScroll.value = scroll.current ?? 0;
    u.uDust.value += (m.dust - u.uDust.value) * k;
    u.uSpice.value += (m.spice - u.uSpice.value) * k;
    u.uFocus.value += (m.focus - u.uFocus.value) * k;
    u.uPixelRatio.value = state.viewport.dpr;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}
