"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type WindParticlesProps = {
count?: number;
area?: [number, number, number];
speed?: number;
direction?: [number, number, number];
noise?: number;
noiseSpeed?: number;
size?: number;
color?: string;
opacity?: number;
position?: [number, number, number];
};

export function WindParticles({
count = 1500,
area = [60, 12, 60],
speed = 6,
direction = [-1, 0, 0],
noise = 1.2,
noiseSpeed = 0.4,
size = 3.0,
color = "#9aceff",
opacity = 0.6,
position = [0, 0, 0],
}: WindParticlesProps) {
const materialRef = useRef<THREE.ShaderMaterial>(null!);

const dir = useMemo(
() => new THREE.Vector3(...direction).normalize(),
[direction]
);

const geometry = useMemo(() => {
const [w, h, d] = area;
const positions = new Float32Array(count * 3);
const seeds = new Float32Array(count);
const speeds = new Float32Array(count);

for (let i = 0; i < count; i++) {
  const i3 = i * 3;
  positions[i3 + 0] = (Math.random() - 0.5) * w;
  positions[i3 + 1] = (Math.random() - 0.5) * h;
  positions[i3 + 2] = (Math.random() - 0.5) * d;

  seeds[i] = Math.random() * 1000.0;
  speeds[i] = 0.8 + Math.random() * 0.4;
}

const geo = new THREE.BufferGeometry();
geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
geo.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1));
geo.setAttribute("aSpeed", new THREE.Float32BufferAttribute(speeds, 1));
return geo;
}, [count, area]);

const uniforms = useMemo(
() => ({
uTime: { value: 0 },
uSpeed: { value: speed },
uDir: { value: dir },
uWidth: { value: area[0] },
uNoiseAmp: { value: noise },
uNoiseSpeed: { value: noiseSpeed },
uSize: { value: size },
uColor: { value: new THREE.Color(color) },
uOpacity: { value: opacity },
uPR: {
value:
typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1,
},
}),
[speed, dir, area, noise, noiseSpeed, size, color, opacity]
);

useFrame((_, delta) => {
if (!materialRef.current) return;
materialRef.current.uniforms.uTime.value += delta;
});

return (
<group position={position}>
<points geometry={geometry} frustumCulled={false}>
<shaderMaterial
ref={materialRef}
transparent
depthWrite={false}
blending={THREE.AdditiveBlending}
uniforms={uniforms}
vertexShader={/* glsl */ `
uniform float uTime;
uniform float uSpeed;
uniform vec3 uDir;
uniform float uWidth;
uniform float uNoiseAmp;
uniform float uNoiseSpeed;
uniform float uSize;
uniform float uPR;

        attribute float aSeed;
        attribute float aSpeed;

        void main() {
          vec3 pos = position;
          vec3 dir = normalize(uDir);

          float v = aSpeed * uSpeed;
          float shift = uTime * v;

          float t0 = dot(pos, dir);
          float t = t0 + shift;
          float halfW = uWidth * 0.5;
          float cycles = floor((t + halfW) / uWidth);
          t = t - cycles * uWidth;
          float dt = t - t0;
          pos += dir * dt;

          float ny =
            (sin(aSeed * 6.12 + uTime * uNoiseSpeed) * 0.5 +
             sin(aSeed * 9.77 + uTime * uNoiseSpeed * 1.5) * 0.5) * uNoiseAmp;

          float nz =
            (cos(aSeed * 4.12 + uTime * uNoiseSpeed * 1.2) * 0.5 +
             sin(aSeed * 3.55 + uTime * uNoiseSpeed * 0.8) * 0.5) * uNoiseAmp;

          pos.y += ny;
          pos.z += nz;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float dist = -mvPosition.z;
          float pointSize = uSize * (300.0 / max(dist, 0.0001));
          gl_PointSize = max(1.0, pointSize) * uPR;
        }
      `}
      fragmentShader={/* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;

        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          uv.x *= 0.6;
          float d = length(uv);
          float alpha = smoothstep(0.5, 0.0, 0.5 - d);
          gl_FragColor = vec4(uColor, alpha * uOpacity);
          if (gl_FragColor.a <= 0.001) discard;
        }
      `}
    />
  </points>
</group>
);
}