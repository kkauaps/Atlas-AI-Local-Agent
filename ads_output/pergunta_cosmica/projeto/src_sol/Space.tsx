import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate, staticFile, Easing } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { wordT, segT } from "./time";

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eio = Easing.bezier(0.65, 0, 0.35, 1);
const R = 6; // orbit radius

// key times (seconds)
export const K = {
  vanish: wordT(0, "agora") + 0.25,
  s1: segT(1), s2: segT(2), s3: segT(3),
  dark: wordT(4, "escuridao"), moonOff: wordT(4, "apagaria"),
  s5: segT(5), s6: segT(6), year: wordT(6, "ano"), s7: segT(7), s9: segT(9),
};
const W_ORB = 0.015;
const thD = Math.PI / 2; // earth angle at dark
const earthAt = (t: number): THREE.Vector3 => {
  if (t <= K.dark) { const th = thD + W_ORB * (t - K.dark); return new THREE.Vector3(R * Math.cos(th), 0, R * Math.sin(th)); }
  const p = new THREE.Vector3(R * Math.cos(thD), 0, R * Math.sin(thD));
  const tan = new THREE.Vector3(-Math.sin(thD), 0, Math.cos(thD)); // direction of motion (+theta)
  const dt = t - K.dark;
  const v = interpolate(t, [K.dark, K.s5, K.s5 + 2], [0.3, 0.6, 1.6], cl);
  return p.add(tan.multiplyScalar(dt * v));
};

const glowTex = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d")!; const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,240,200,1)"); gr.addColorStop(0.2, "rgba(255,200,90,0.8)"); gr.addColorStop(0.5, "rgba(255,140,30,0.25)"); gr.addColorStop(1, "rgba(255,120,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c);
})();

const Stars: React.FC = () => {
  const geo = useMemo(() => {
    const n = 2500, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(60 + Math.random() * 40); p.set([v.x, v.y, v.z], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3)); return g;
  }, []);
  return <points geometry={geo}><pointsMaterial size={0.14} color="#ffffff" sizeAttenuation transparent opacity={0.85} /></points>;
};

const Scene: React.FC<{ t: number }> = ({ t }) => {
  const [earthTex, frozenTex, cloudTex, moonTex, sunTex] = useLoader(THREE.TextureLoader, [staticFile("sol/tex/earth.jpg"), staticFile("sol/tex/earth_frozen.jpg"), staticFile("sol/tex/clouds.png"), staticFile("sol/tex/moon.jpg"), staticFile("sol/tex/sun.jpg")]);
  const vanishP = interpolate(t, [K.vanish - 0.15, K.vanish + 0.25], [0, 1], { ...cl, easing: Easing.in(Easing.cubic) });
  const sunScale = vanishP < 1 ? 1.6 * (1 + 0.15 * Math.sin(vanishP * Math.PI)) * (1 - vanishP) : 0;
  const lightOn = t < K.dark ? 1 : interpolate(t, [K.dark, K.dark + 0.35], [1, 0], cl);
  const moonLight = t < K.moonOff ? lightOn : 0;
  const frontR = interpolate(t, [K.vanish, K.dark], [0, R], cl);
  const frontVis = t > K.vanish && t < K.dark + 0.4 ? interpolate(t, [K.dark, K.dark + 0.4], [1, 0], cl) : 0;
  const gravVis = interpolate(t, [K.s3, K.s3 + 0.6, K.dark - 0.3, K.dark], [0, 1, 1, 0], cl);
  const frost = interpolate(t, [K.s6 + 0.5, K.year + 0.8], [0, 1], { ...cl, easing: eio });
  const starlight = interpolate(t, [K.dark + 0.4, K.s5, K.s6, K.s6 + 2], [0.18, 0.25, 0.28, 0.75], cl);
  const e = earthAt(t);
  const spin = t * 0.12;
  const moonA = t * 0.5;
  const m = new THREE.Vector3(e.x + Math.cos(moonA) * 1.6, 0.2, e.z + Math.sin(moonA) * 1.6);
  const trailOn = interpolate(t, [K.s5, K.s5 + 0.8], [0, 1], cl) * interpolate(t, [K.s6 + 1, K.s6 + 2], [1, 0], cl);

  // camera choreography
  const { camera } = { camera: null as any };
  return (
    <>
      <Stars />
      <ambientLight intensity={starlight} color="#9cc7ff" />
      <pointLight position={[0, 0, 0]} intensity={220 * lightOn} decay={1.2} color="#fff1d6" />
      <directionalLight position={[e.x + 4, 5, e.z + 8]} intensity={starlight * 1.8} color="#e0efff" />
      {/* sun */}
      {sunScale > 0 && (
        <group scale={sunScale}>
          <mesh rotation={[0, t * 0.1, 0]}><sphereGeometry args={[1, 64, 64]} /><meshBasicMaterial map={sunTex} /></mesh>
          {glowTex && <sprite scale={[4.2, 4.2, 1]}><spriteMaterial map={glowTex} blending={THREE.AdditiveBlending} depthWrite={false} transparent /></sprite>}
          {glowTex && <sprite scale={[8 + Math.sin(t * 3) * 0.3, 8 + Math.sin(t * 3) * 0.3, 1]}><spriteMaterial map={glowTex} blending={THREE.AdditiveBlending} depthWrite={false} transparent opacity={0.5} /></sprite>}
        </group>
      )}
      {/* light wavefront */}
      {frontVis > 0 && frontR > 0.05 && (
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <mesh><ringGeometry args={[Math.max(0.01, frontR - 0.12), frontR, 160]} /><meshBasicMaterial color="#FFD27A" transparent opacity={0.95 * frontVis} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
          <mesh><ringGeometry args={[Math.max(0.01, frontR - 0.6), frontR, 160]} /><meshBasicMaterial color="#FFB020" transparent opacity={0.25 * frontVis} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
          {[0.35, 0.7].map((d, i) => frontR - d > 0.05 && (
            <mesh key={i}><ringGeometry args={[frontR - d - 0.05, frontR - d, 160]} /><meshBasicMaterial color="#A78BFA" transparent opacity={0.8 * gravVis * frontVis} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
          ))}
        </group>
      )}
      {/* ghost orbit + straight path */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh><ringGeometry args={[R - 0.015, R + 0.015, 256]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.18 * Math.max(trailOn, interpolate(t, [K.s1, K.s1 + 1, K.dark, K.dark + 0.5], [0, 1, 1, 0.2], cl))} side={THREE.DoubleSide} /></mesh>
      </group>
      {trailOn > 0 && (() => {
        const a = earthAt(K.dark), b = earthAt(t);
        const mid = a.clone().add(b).multiplyScalar(0.5); const len = a.distanceTo(b);
        const ang = Math.atan2(b.z - a.z, b.x - a.x);
        return <mesh position={[mid.x, 0, mid.z]} rotation={[-Math.PI / 2, 0, -ang]}><planeGeometry args={[len, 0.05]} /><meshBasicMaterial color="#38BDF8" transparent opacity={0.8 * trailOn} side={THREE.DoubleSide} /></mesh>;
      })()}
      {/* earth */}
      <group position={e}>
        <mesh rotation={[0.41, spin, 0]}><sphereGeometry args={[0.8, 64, 64]} /><meshStandardMaterial map={earthTex} roughness={0.9} metalness={0} /></mesh>
        <mesh rotation={[0.41, spin, 0]} scale={1.003}><sphereGeometry args={[0.8, 64, 64]} /><meshStandardMaterial map={frozenTex} roughness={0.6} transparent opacity={frost} /></mesh>
        <mesh rotation={[0.41, spin * 1.15, 0]} scale={1.02}><sphereGeometry args={[0.8, 64, 64]} /><meshStandardMaterial map={cloudTex} transparent opacity={0.7 * (1 - frost)} depthWrite={false} /></mesh>
        <mesh scale={1.12}><sphereGeometry args={[0.8, 48, 48]} /><meshBasicMaterial color={frost > 0.5 ? "#9fd8ff" : "#4ea8ff"} transparent opacity={0.1 + 0.08 * lightOn} side={THREE.BackSide} blending={THREE.AdditiveBlending} /></mesh>
      </group>
      {/* moon */}
      <mesh position={m}><sphereGeometry args={[0.22, 32, 32]} /><meshStandardMaterial map={moonTex} emissive="#000" roughness={1} /></mesh>
      <pointLight position={[m.x, 0, m.z]} intensity={0} />
    </>
  );
};

const CamRig: React.FC<{ t: number }> = ({ t }) => {
  // handled via ThreeCanvas camera prop update below
  return null;
};

export const camAt = (t: number) => {
  const e = earthAt(t);
  // keyframes: [time, position, target]
  type KF = [number, [number, number, number], [number, number, number]];
  const kf: KF[] = [
    [0, [1.7, 1.3, 11.5], [0.7, 0.3, 0]],
    [K.vanish + 0.6, [1.7, 1.5, 12], [0.7, 0.3, 0]],
    [K.s1 + 1.5, [0.6, 13, 13.5], [0.4, 0, 2.4]],
    [K.s3, [0.6, 14, 13.5], [0.4, 0, 2.6]],
    [K.dark - 1, [0.4, 13, 13], [0.4, 0, 2.8]],
  ];
  if (t < K.dark - 1) {
    let i = 0; while (i < kf.length - 1 && t > kf[i + 1][0]) i++;
    const a = kf[i], b = kf[Math.min(i + 1, kf.length - 1)];
    const p = a === b ? 1 : eio(Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0]))));
    const lerp = (x: number[], y: number[]) => x.map((v, k) => v + (y[k] - v) * p) as [number, number, number];
    return { pos: lerp(a[1], b[1]), tgt: lerp(a[2], b[2]) };
  }
  // follow earth
  const far: [number, number, number] = [0.4, 13, 13];
  const farT: [number, number, number] = [0.4, 0, 2.8];
  const followP = eio(Math.min(1, Math.max(0, (t - (K.s5 - 0.5)) / 2.5)));
  const closeP = eio(Math.min(1, Math.max(0, (t - K.s6) / 3)));
  const outP = eio(Math.min(1, Math.max(0, (t - K.s9) / 3)));
  const off = new THREE.Vector3(1.2, 3.6, 6.5).lerp(new THREE.Vector3(0.3, 0.6, 3.6), closeP).lerp(new THREE.Vector3(0.3, 0.5, 7.2), outP);
  const fpos = e.clone().add(off);
  const pos = new THREE.Vector3(...far).lerp(fpos, followP);
  const tgt = new THREE.Vector3(...farT).lerp(e.clone().add(new THREE.Vector3(0, 0.15 * outP, 0)), followP);
  return { pos: pos.toArray() as [number, number, number], tgt: tgt.toArray() as [number, number, number] };
};

const CameraCtl: React.FC<{ t: number }> = ({ t }) => {
  const { pos, tgt } = camAt(t);
  return <perspectiveCamera makeDefault position={pos} fov={46} near={0.05} far={300} ref={(c: THREE.PerspectiveCamera | null) => { if (c) { c.position.set(...pos); c.lookAt(...tgt); c.updateProjectionMatrix(); } }} />;
};

export const Space: React.FC = () => {
  const f = useCurrentFrame(); const { fps, width, height } = useVideoConfig();
  const t = f / fps;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: width / 2, height: height / 2, transform: "scale(2)", transformOrigin: "0 0" }}>
    <ThreeCanvas width={width / 2} height={height / 2} gl={{ antialias: true }}>
      <color attach="background" args={["#02030a"]} />
      <React.Suspense fallback={null}>
        <CameraCtlFixed t={t} />
        <Scene t={t} />
      </React.Suspense>
    </ThreeCanvas>
    </div>
  );
};

import { useThree } from "@react-three/fiber";
const CameraCtlFixed: React.FC<{ t: number }> = ({ t }) => {
  const { camera } = useThree();
  const { pos, tgt } = camAt(t);
  const c = camera as THREE.PerspectiveCamera;
  c.fov = 46; c.near = 0.05; c.far = 300;
  c.position.set(...pos); c.lookAt(...tgt); c.updateProjectionMatrix();
  return null;
};
