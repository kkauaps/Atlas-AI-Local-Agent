import { cl } from "./cl";
export { cl };
import React, { useMemo } from "react";
import { staticFile, useVideoConfig, interpolate, Easing } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";


export type V3 = [number, number, number];
export const ASPECT = 1920 / 1080;

export const glowTex = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d")!; const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.55)"); gr.addColorStop(0.6, "rgba(255,255,255,0.12)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c);
})();

// project a world point to 1080x1920 screen px
export const project = (p: V3, pos: V3, tgt: V3, fov: number) => {
  const c = new THREE.PerspectiveCamera(fov, ASPECT, 0.05, 300);
  c.position.set(...pos); c.lookAt(...tgt); c.updateMatrixWorld(); c.updateProjectionMatrix();
  const v = new THREE.Vector3(...p).project(c);
  return { x: (v.x + 1) / 2 * 1920, y: (1 - v.y) / 2 * 1080, z: v.z };
};
export const screenRadius = (p: V3, r: number, pos: V3, tgt: V3, fov: number) => {
  const d = new THREE.Vector3(...p).distanceTo(new THREE.Vector3(...pos));
  return (r / (d * Math.tan((fov * Math.PI) / 360))) * 540;
};

const CamSet: React.FC<{ pos: V3; tgt: V3; fov: number }> = ({ pos, tgt, fov }) => {
  const { camera } = useThree(); const c = camera as THREE.PerspectiveCamera;
  c.fov = fov; c.near = 0.05; c.far = 300; c.position.set(...pos); c.lookAt(...tgt); c.updateProjectionMatrix();
  return null;
};

export const Canvas3D: React.FC<{ pos: V3; tgt: V3; fov: number; children: React.ReactNode; bg?: string }> = ({ pos, tgt, fov, children, bg = "#02030a" }) => {
  const { width, height } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: width / 2, height: height / 2, transform: "scale(2)", transformOrigin: "0 0" }}>
      <ThreeCanvas width={width / 2} height={height / 2} gl={{ antialias: true }}>
        <color attach="background" args={[bg]} />
        <React.Suspense fallback={null}><CamSet pos={pos} tgt={tgt} fov={fov} />{children}</React.Suspense>
      </ThreeCanvas>
    </div>
  );
};

export const Stars: React.FC<{ n?: number; size?: number }> = ({ n = 2500, size = 0.14 }) => {
  const geo = useMemo(() => {
    const p = new Float32Array(n * 3); let s = 7;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < n; i++) { const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, r = 60 + rnd() * 40, q = Math.sqrt(1 - u * u); p.set([r * q * Math.cos(th), r * u, r * q * Math.sin(th)], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3)); return g;
  }, [n]);
  return <points geometry={geo}><pointsMaterial size={size} color="#ffffff" sizeAttenuation transparent opacity={0.85} /></points>;
};

export const useTex = () => useLoader(THREE.TextureLoader, [staticFile("sol/tex/earth.jpg"), staticFile("sol/tex/earth_frozen.jpg"), staticFile("sol/tex/clouds.png"), staticFile("sol/tex/moon.jpg")]);

export const Earth: React.FC<{ pos?: V3; r?: number; tilt?: number; spin: number; frost?: number; axis?: number; atmo?: number; rx?: number }> = ({ pos = [0, 0, 0], r = 1, tilt = 23.4, spin, frost = 0, axis = 0, atmo = 1, rx = 0 }) => {
  const [earthTex, frozenTex, cloudTex] = useTex();
  return (
    <group position={pos} rotation={[rx, 0, (-tilt * Math.PI) / 180]}>
      <mesh rotation={[0, spin, 0]}><sphereGeometry args={[r, 64, 64]} /><meshStandardMaterial map={earthTex} roughness={0.9} /></mesh>
      {frost > 0.01 && <mesh rotation={[0, spin, 0]} scale={1.003}><sphereGeometry args={[r, 64, 64]} /><meshStandardMaterial map={frozenTex} transparent opacity={frost} roughness={0.6} /></mesh>}
      <mesh rotation={[0, spin * 1.15, 0]} scale={1.02}><sphereGeometry args={[r, 64, 64]} /><meshStandardMaterial map={cloudTex} transparent opacity={0.65 * (1 - frost)} depthWrite={false} /></mesh>
      <mesh scale={1.1}><sphereGeometry args={[r, 48, 48]} /><meshBasicMaterial color="#5aa9ff" transparent opacity={0.14 * atmo} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      {axis > 0.01 && (
        <>
          <mesh><cylinderGeometry args={[r * 0.025, r * 0.025, r * 3.2, 16]} /><meshBasicMaterial color="#ffffff" transparent opacity={axis} /></mesh>
          <mesh position={[0, r * 1.6, 0]}><sphereGeometry args={[r * 0.05, 16, 16]} /><meshBasicMaterial color="#FBBF24" transparent opacity={axis} /></mesh>
        </>
      )}
    </group>
  );
};

export const MoonBody: React.FC<{ pos: V3; r: number; spin?: number; opacity?: number; scale?: number }> = ({ pos, r, spin = 0, opacity = 1, scale = 1 }) => {
  const [, , , moonTex] = useTex();
  if (scale <= 0.001 || opacity <= 0.001) return null;
  return <mesh position={pos} rotation={[0, spin, 0]} scale={scale}><sphereGeometry args={[r, 48, 48]} /><meshStandardMaterial map={moonTex} roughness={1} transparent={opacity < 1} opacity={opacity} /></mesh>;
};

// particle dissolve (p: 0 solid -> 1 fully dispersed). reverse = assemble
export const MoonParticles: React.FC<{ pos: V3; r: number; p: number; n?: number }> = ({ pos, r, p, n = 1800 }) => {
  const base = useMemo(() => {
    const a: { d: THREE.Vector3; sp: number; j: THREE.Vector3 }[] = []; let s = 11;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < n; i++) {
      const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, q = Math.sqrt(1 - u * u);
      a.push({ d: new THREE.Vector3(q * Math.cos(th), u, q * Math.sin(th)), sp: 0.6 + rnd() * 2.4, j: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5) });
    }
    return a;
  }, [n]);
  const geo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3)); return g; }, [n]);
  if (p <= 0.001 || p >= 0.999) return null;
  const arr = geo.attributes.position.array as Float32Array;
  const e = Easing.out(Easing.cubic)(p);
  base.forEach((b, i) => {
    const dist = r * (1 + e * b.sp * 3);
    const v = b.d.clone().multiplyScalar(dist).add(b.j.clone().multiplyScalar(e * r * 1.5));
    arr[i * 3] = pos[0] + v.x; arr[i * 3 + 1] = pos[1] + v.y; arr[i * 3 + 2] = pos[2] + v.z;
  });
  geo.attributes.position.needsUpdate = true;
  return <points geometry={geo}><pointsMaterial size={r * 0.06} color="#e7e5e4" transparent opacity={(1 - p) * 0.95} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation /></points>;
};

export const Glow: React.FC<{ pos: V3; size: number; color?: string; opacity?: number }> = ({ pos, size, color = "#ffffff", opacity = 1 }) =>
  glowTex && opacity > 0.005 ? <sprite position={pos} scale={[size, size, 1]}><spriteMaterial map={glowTex} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} /></sprite> : null;
