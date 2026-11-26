import React, { useMemo } from "react";
import * as THREE from "three";
import { staticFile } from "remotion";
import { useLoader } from "@react-three/fiber";
import { Glow, Points, rng, V3, dotTex } from "./hd";

/* ---------- Atom: nucleon cluster + electron probability cloud + orbiting electrons ---------- */
export const Atom3D: React.FC<{ pos?: V3; t: number; r?: number; seed?: number; cloud?: number[]; glow?: number; electrons?: number }> = ({ pos = [0, 0, 0], t, r = 1, seed = 1, cloud = [0.35, 0.8, 1], glow = 1, electrons = 3 }) => {
  const nuc = useMemo(() => { const R = rng(seed * 13 + 5); return Array.from({ length: 14 }).map((_, i) => { const u = R() * 2 - 1, th = R() * 6.28, q = Math.sqrt(1 - u * u), d = r * 0.09 * Math.cbrt(R()); return { p: [q * Math.cos(th) * d, u * d, q * Math.sin(th) * d] as V3, pr: i % 2 === 0 }; }); }, [seed, r]);
  const cl = useMemo(() => { const R = rng(seed * 7 + 3); const n = 2600; const p = new Float32Array(n * 3), c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const u = R() * 2 - 1, th = R() * 6.28, q = Math.sqrt(1 - u * u); const d = r * (0.25 + Math.pow(R(), 0.55) * 0.85); p.set([q * Math.cos(th) * d, u * d, q * Math.sin(th) * d], i * 3); const b = 0.18 + R() * 0.35; c.set([cloud[0] * b, cloud[1] * b, cloud[2] * b], i * 3); }
    return { p, c }; }, [seed, r, cloud.join()]);
  return (
    <group position={pos} rotation={[0, t * 0.15, 0]}>
      {nuc.map((n, i) => <mesh key={i} position={n.p}><sphereGeometry args={[r * 0.06, 20, 20]} /><meshStandardMaterial color={n.pr ? "#ef4444" : "#60a5fa"} emissive={n.pr ? "#7f1d1d" : "#1e3a8a"} emissiveIntensity={0.8} roughness={0.35} metalness={0.2} /></mesh>)}
      <Glow size={r * 0.7} color="#fca5a5" opacity={0.6 * glow} />
      <Points pos={cl.p} col={cl.c} size={r * 0.05} />
      {Array.from({ length: electrons }).map((_, i) => { const tilt = new THREE.Euler(i * 1.05 + seed, i * 0.7 + seed * 0.5, 0);
        const trail = Array.from({ length: 22 }).map((__, k) => { const a = (t - k * 0.02) * (2.4 + i * 0.35) + i * 2.1 + seed; return new THREE.Vector3(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, 0).applyEuler(tilt).toArray() as V3; });
        return <group key={i}>{trail.map((p, k) => <Glow key={k} pos={p} size={r * (0.22 - k * 0.008)} color="#bae6fd" opacity={(1 - k / 22) * 0.9 * glow} />)}<mesh position={trail[0]}><sphereGeometry args={[r * 0.04, 12, 12]} /><meshBasicMaterial color="#ffffff" toneMapped={false} /></mesh></group>; })}
    </group>
  );
};

/* ---------- Earth with atmosphere rim ---------- */
const atmoVS = `varying vec3 vN; varying vec3 vV; void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`;
const atmoFS = `uniform vec3 uC; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(1.-max(dot(vN,vV),0.),3.2); gl_FragColor=vec4(uC*f*1.4, f*0.8); }`;
export const EarthHD: React.FC<{ pos?: V3; r?: number; spin: number; tilt?: number; tex?: string; atmo?: string; children?: React.ReactNode }> = ({ pos = [0, 0, 0], r = 1, spin, tilt = 0.4, tex = "longo/earth_real.jpg", atmo = "#60a5fa", children }) => {
  const [m] = useLoader(THREE.TextureLoader, [staticFile(tex)]);
  const am = useMemo(() => new THREE.ShaderMaterial({ vertexShader: atmoVS, fragmentShader: atmoFS, uniforms: { uC: { value: new THREE.Color(atmo) } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide, toneMapped: false }), [atmo]);
  const am2 = useMemo(() => new THREE.ShaderMaterial({ vertexShader: atmoVS, fragmentShader: atmoFS, uniforms: { uC: { value: new THREE.Color(atmo) } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), [atmo]);
  return <group position={pos} rotation={[tilt, 0, 0]}>
    <group rotation={[0, spin, 0]}><mesh><sphereGeometry args={[r, 96, 96]} /><meshStandardMaterial map={m} roughness={0.85} metalness={0.05} /></mesh>{children}</group>
    <mesh material={am2} scale={1.005}><sphereGeometry args={[r, 64, 64]} /></mesh>
    <mesh material={am} scale={1.045}><sphereGeometry args={[r, 64, 64]} /></mesh>
  </group>;
};
export const MoonHD: React.FC<{ pos?: V3; r?: number; spin: number }> = ({ pos = [0, 0, 0], r = 0.3, spin }) => {
  const [m] = useLoader(THREE.TextureLoader, [staticFile("longo/moon.jpg")]);
  return <mesh position={pos} rotation={[0, spin, 0]}><sphereGeometry args={[r, 64, 64]} /><meshStandardMaterial map={m} roughness={1} /></mesh>;
};

/* ---------- Spiral galaxy as point cloud ---------- */
export const GalaxyHD: React.FC<{ t: number; n?: number; r?: number; fly?: number; halo?: number; tiltX?: number; spinSpeed?: number }> = ({ t, n = 16000, r = 4, fly = 0, halo = 0, tiltX = 0, spinSpeed = 0.25 }) => {
  const base = useMemo(() => { const R = rng(4242); const d = new Float32Array(n * 4); const c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const arm = i % 3; const rr = Math.pow(R(), 1.4) * r; const a = rr * 1.6 + arm * (Math.PI * 2 / 3) + (R() - 0.5) * (0.9 - rr / r * 0.5); const y = (R() - 0.5) * 0.25 * (1 - rr / r) + (R() - 0.5) * 0.05;
      d.set([rr, a, y, 0.5 + R() * 2.5], i * 4); const core = rr < r * 0.22; const k = core ? [1, 0.85, 0.55] : R() < 0.2 ? [1, 0.55, 0.75] : R() < 0.5 ? [0.6, 0.75, 1] : [0.85, 0.8, 1]; const b = (core ? 1.1 : 0.55) * (0.5 + R());
      c.set([k[0] * b, k[1] * b, k[2] * b], i * 3); }
    return { d, c }; }, [n, r]);
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const rr = base.d[i * 4], a0 = base.d[i * 4 + 1], y = base.d[i * 4 + 2], fo = base.d[i * 4 + 3];
    const a = a0 + t * spinSpeed * (1.4 / (0.4 + rr / r)); const rad = rr + fly * (rr / r) * fo * 2.2; pos.set([Math.cos(a) * rad, y, Math.sin(a) * rad], i * 3); }
  return <group rotation={[tiltX, 0, 0]}>
    <Points pos={pos} col={base.c} size={0.05} />
    <Glow size={r * 0.9} color="#fde68a" opacity={0.85} /><Glow size={r * 1.8} color="#f59e0b" opacity={0.3} />
    {halo > 0 && <><Glow size={r * 5 * halo} color="#7c3aed" opacity={0.5 * halo} /><Glow size={r * 3.4 * halo} color="#a78bfa" opacity={0.35 * halo} /></>}
  </group>;
};

/* ---------- Black hole: accretion disk points + photon ring ---------- */
export const BlackHoleHD: React.FC<{ t: number; r?: number }> = ({ t, r = 1 }) => {
  const base = useMemo(() => { const R = rng(9191); const n = 14000; const d = new Float32Array(n * 3), c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const rr = r * (1.5 + Math.pow(R(), 1.8) * 3.2); d.set([rr, R() * 6.283, (R() - 0.5) * 0.06 * rr], i * 3); const hot = 1 - (rr - 1.5 * r) / (3.2 * r);
      const k = hot > 0.7 ? [1, 0.95, 0.85] : hot > 0.4 ? [1, 0.75, 0.35] : [1, 0.45, 0.15]; const b = 0.5 + hot * 1.3; c.set([k[0] * b, k[1] * b, k[2] * b], i * 3); }
    return { d, c }; }, [r]);
  const n = base.d.length / 3; const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const rr = base.d[i * 3]; const a = base.d[i * 3 + 1] + t * 1.8 * Math.pow(r / rr, 1.5); pos.set([Math.cos(a) * rr, base.d[i * 3 + 2], Math.sin(a) * rr], i * 3); }
  return <group rotation={[0.12, 0, 0.08]}>
    <Glow size={r * 4.2} color="#ff9a3c" opacity={0.45} />
    <Points pos={pos} col={base.c} size={0.05} />
    <mesh><sphereGeometry args={[r, 64, 64]} /><meshBasicMaterial color="#000000" /></mesh>
  </group>;
};

/* ---------- light ray (photon with long glowing trail) ---------- */
export const Ray: React.FC<{ a: V3; b: V3; p: number; color?: string; len?: number; size?: number }> = ({ a, b, p, color = "#fff7d6", len = 0.12, size = 0.5 }) => {
  if (p <= 0 || p >= 1.02) return null;
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  return <>{Array.from({ length: 16 }).map((_, k) => { const q = Math.max(0, Math.min(1, p - (k / 16) * len)); return <Glow key={k} pos={A.clone().lerp(B, q).toArray() as V3} size={size * (1 - k / 20)} color={color} opacity={1 - k / 16} />; })}</>;
};

/* ---------- glowing 3D text-free arrow (cone + cylinder) ---------- */
export const Arrow3D: React.FC<{ from: V3; to: V3; color?: string; w?: number }> = ({ from, to, color = "#fbbf24", w = 0.05 }) => {
  const A = new THREE.Vector3(...from), B = new THREE.Vector3(...to); const d = B.clone().sub(A); const L = d.length(); if (L < 0.01) return null;
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); const mid = A.clone().add(d.clone().multiplyScalar(0.5 - 0.12));
  return <group><mesh position={mid.toArray() as V3} quaternion={q}><cylinderGeometry args={[w, w, L * 0.76, 12]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
    <mesh position={A.clone().add(d.clone().multiplyScalar(0.88)).toArray() as V3} quaternion={q}><coneGeometry args={[w * 3, L * 0.24, 20]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh></group>;
};
export { dotTex };

/* lat/lon -> point on a three.js SphereGeometry of radius r */
export const latLon = (lat: number, lon: number, r: number): V3 => { const u = (lon + 180) / 360, v = (90 - lat) / 180; return [-Math.cos(2 * Math.PI * u) * Math.sin(Math.PI * v) * r, Math.cos(Math.PI * v) * r, Math.sin(2 * Math.PI * u) * Math.sin(Math.PI * v) * r]; };
export const faceSpin = (p: V3) => Math.atan2(-p[0], p[2]);
