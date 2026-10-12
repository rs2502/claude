"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import type { MoodSettings } from "./moods";

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vLife;
  varying float vSeed;
  void main() {
    // Each wisp is born low-centre, rises, widens and fades.
    float life = fract(uTime * (0.035 + aSeed * 0.03) + aSeed);
    vec3 p = position;
    p.y = mix(-3.2, 4.5, life);
    p.x += sin(life * 6.2831 + aSeed * 12.0) * (0.3 + life * 0.9);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (90.0 + life * 260.0) * uPixelRatio * (10.0 / -mv.z);
    vLife = life;
    vSeed = aSeed;
  }
`;

const fragment = /* glsl */ `
  uniform float uAmount;
  varying float vLife;
  varying float vSeed;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    // Lopsided gaussian so wisps never look like perfect discs.
    uv.x *= 1.0 + 0.35 * sin(vSeed * 20.0 + vLife * 3.0);
    float d = dot(uv, uv) * 4.0;
    float a = exp(-d * 3.2) * smoothstep(0.0, 0.18, vLife) * (1.0 - smoothstep(0.55, 1.0, vLife));
    a *= 0.07 * uAmount;
    if (a < 0.002) discard;
    gl_FragColor = vec4(1.0, 0.985, 0.96, a);
  }
`;

export function Steam({ count, mood }: { count: number; mood: React.RefObject<MoodSettings> }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos.set([(Math.random() - 0.5) * 4.5, 0, Math.random() * 3 - 1.5], i * 3);
      seed[i] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count]);

  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uAmount: { value: 0 }, uPixelRatio: { value: 1 } }), []);

  useFrame((state, delta) => {
    uniforms.uTime.value += delta;
    uniforms.uPixelRatio.value = state.viewport.dpr;
    const k = 1 - Math.exp(-delta * 1.2);
    uniforms.uAmount.value += ((mood.current?.steam ?? 0) - uniforms.uAmount.value) * k;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent depthWrite={false} />
    </points>
  );
}
