import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

type V3 = [number, number, number];
const CamSet: React.FC<{ pos: V3; tgt: V3; fov: number }> = ({ pos, tgt, fov }) => {
  const { camera } = useThree(); const c = camera as THREE.PerspectiveCamera;
  c.fov = fov; c.near = 0.05; c.far = 100; c.position.set(...pos); c.lookAt(...tgt); c.updateProjectionMatrix();
  return null;
};
const NAVY = "#1F3A93", NAVY_D = "#16285f", CREAM = "#F3EBDD", GOLD = "#E3B341", BLACK = "#121214", SKIN = "#E9C3A1", RED = "#C0392B";
const std = (color: string, rough = 0.6, metal = 0) => <meshStandardMaterial color={color} roughness={rough} metalness={metal} />;

// placed between two points
const Limb: React.FC<{ a: V3; b: V3; r: number; color: string }> = ({ a, b, r, color }) => {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const mid = va.clone().add(vb).multiplyScalar(0.5), len = va.distanceTo(vb);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  return <mesh position={mid} quaternion={q}><capsuleGeometry args={[r, Math.max(0.01, len), 8, 16]} />{std(color)}</mesh>;
};

export const NapoleonModel: React.FC<{ crown?: number; breathe?: number; walk?: number; point?: number; pedestal?: boolean }> = ({ crown = -1, breathe = 0, walk = -1, point = 0, pedestal = true }) => {
  const b = Math.sin(breathe) * 0.008 + (walk >= 0 ? Math.abs(Math.sin(walk)) * 0.03 : 0);
  const sw = walk >= 0 ? Math.sin(walk) * 0.45 : 0;
  return (
    <group>
      {/* pedestal */}
      {pedestal && <mesh position={[0, -0.06, 0]}><cylinderGeometry args={[0.62, 0.68, 0.12, 48]} />{std("#2a2216", 0.4, 0.3)}</mesh>}
      {pedestal && <mesh position={[0, 0.005, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.62, 0.02, 12, 64]} />{std(GOLD, 0.25, 0.9)}</mesh>}
      {/* boots */}
      {[-0.13, 0.13].map((x, li) => (<group key={x} position={[0, 0.99, 0]} rotation={[(li ? 1 : -1) * sw, 0, 0]}><group position={[0, -0.99, 0]}>
        <mesh position={[x, 0.28, 0]}><cylinderGeometry args={[0.105, 0.115, 0.56, 24]} />{std(BLACK, 0.25, 0.2)}</mesh>
        <mesh position={[x, 0.04, 0.06]} scale={[1, 0.6, 1.6]}><sphereGeometry args={[0.11, 20, 12]} />{std(BLACK, 0.25, 0.2)}</mesh>
        <mesh position={[x, 0.56, 0]}><cylinderGeometry args={[0.13, 0.12, 0.08, 24]} />{std(BLACK, 0.3, 0.2)}</mesh>
        <mesh position={[x, 0.78, 0]}><cylinderGeometry args={[0.12, 0.11, 0.42, 24]} />{std(CREAM, 0.7)}</mesh>
      </group></group>))}
      <group position={[0, b, 0]}>
        {/* coat body */}
        <mesh position={[0, 1.33, 0]}><cylinderGeometry args={[0.28, 0.33, 0.78, 32]} />{std(NAVY, 0.55)}</mesh>
        {/* coat tails */}
        <mesh position={[0, 0.88, -0.17]} rotation={[0.12, 0, 0]}><boxGeometry args={[0.46, 0.38, 0.05]} />{std(NAVY_D, 0.6)}</mesh>
        {/* lapels + waistcoat */}
        <mesh position={[0, 1.3, 0.27]} rotation={[-0.08, 0, 0]}><boxGeometry args={[0.2, 0.62, 0.04]} />{std(CREAM, 0.7)}</mesh>
        {[-0.115, 0.115].map((x) => <mesh key={x} position={[x, 1.45, 0.25]} rotation={[-0.1, 0, x > 0 ? 0.25 : -0.25]}><boxGeometry args={[0.06, 0.4, 0.04]} />{std(RED, 0.6)}</mesh>)}
        {[1.5, 1.4, 1.3, 1.2].map((y) => <mesh key={y} position={[0.06, y, 0.3]}><sphereGeometry args={[0.018, 12, 8]} />{std(GOLD, 0.2, 0.9)}</mesh>)}
        <mesh position={[0, 1.0, 0.02]}><cylinderGeometry args={[0.335, 0.335, 0.06, 32]} />{std(CREAM, 0.6)}</mesh>
        {/* epaulettes */}
        {[-0.3, 0.3].map((x) => (<group key={x} position={[x, 1.7, 0]}>
          <mesh scale={[1, 0.35, 1]}><sphereGeometry args={[0.12, 24, 12]} />{std(GOLD, 0.25, 0.9)}</mesh>
          <mesh position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.11, 0.025, 8, 24]} />{std(GOLD, 0.3, 0.85)}</mesh>
        </group>))}
        {/* arms: right hand in waistcoat, left behind back */}
        {point > 0.01 ? (<>
          <Limb a={[0.32, 1.66, 0]} b={[0.36 + 0.06 * point, 1.32 + 0.38 * point, 0.12 + 0.3 * point]} r={0.075} color={NAVY} />
          <Limb a={[0.36 + 0.06 * point, 1.32 + 0.38 * point, 0.12 + 0.3 * point]} b={[0.06 + 0.4 * point, 1.38 + 0.42 * point, 0.3 + 0.42 * point]} r={0.07} color={NAVY} />
          <mesh position={[0.05 + 0.41 * point, 1.38 + 0.43 * point, 0.31 + 0.44 * point]}><sphereGeometry args={[0.055, 16, 12]} />{std(CREAM, 0.6)}</mesh>
        </>) : (<>
          <Limb a={[0.32, 1.66, 0]} b={[0.36, 1.32, 0.12]} r={0.075} color={NAVY} />
          <Limb a={[0.36, 1.32, 0.12]} b={[0.06, 1.38, 0.3]} r={0.07} color={NAVY} />
          <mesh position={[0.05, 1.38, 0.31]}><sphereGeometry args={[0.055, 16, 12]} />{std(CREAM, 0.6)}</mesh>
        </>)}
        <Limb a={[-0.32, 1.66, 0]} b={[-0.34, 1.3, -0.12]} r={0.075} color={NAVY} />
        <Limb a={[-0.34, 1.3, -0.12]} b={[-0.08, 1.12, -0.3]} r={0.07} color={NAVY} />
        {/* collar + head */}
        <mesh position={[0, 1.76, 0]}><cylinderGeometry args={[0.13, 0.15, 0.12, 24]} />{std(NAVY_D, 0.5)}</mesh>
        <mesh position={[0, 1.97, 0]} scale={[1, 1.12, 1]}><sphereGeometry args={[0.18, 32, 24]} />{std(SKIN, 0.75)}</mesh>
        <mesh position={[0, 1.96, 0.175]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.028, 0.06, 12]} />{std(SKIN, 0.75)}</mesh>
        {[-0.06, 0.06].map((x) => <mesh key={x} position={[x, 2.0, 0.158]}><sphereGeometry args={[0.018, 10, 8]} />{std("#1b1b1f", 0.3)}</mesh>)}
        <mesh position={[0, 2.03, -0.02]} scale={[1.05, 0.8, 1.05]}><sphereGeometry args={[0.18, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />{std("#3b2a1e", 0.8)}</mesh>
        {/* bicorne (worn sideways) */}
        <group position={[0, 2.12, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.55, 1, 0.95]} position={[0, -0.02, 0]}><cylinderGeometry args={[0.24, 0.24, 0.13, 40, 1, false, -Math.PI / 2, Math.PI]} />{std(BLACK, 0.45, 0.1)}</mesh>
          <mesh rotation={[0, 0, 0]} scale={[1.55, 0.95, 1]} position={[0, -0.02, 0]}><torusGeometry args={[0.24, 0.014, 8, 40, Math.PI]} />{std(GOLD, 0.3, 0.8)}</mesh>
          <mesh position={[0, -0.03, 0]} scale={[1, 0.5, 1]}><sphereGeometry args={[0.19, 24, 12]} />{std(BLACK, 0.5, 0.1)}</mesh>
          <mesh position={[0.2, 0.12, 0.07]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.045, 0.045, 0.012, 24]} />{std("#2B4BA8", 0.5)}</mesh>
          <mesh position={[0.2, 0.12, 0.077]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.03, 0.03, 0.012, 24]} />{std("#fff", 0.5)}</mesh>
          <mesh position={[0.2, 0.12, 0.084]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.015, 0.015, 0.012, 24]} />{std(RED, 0.5)}</mesh>
        </group>
      </group>
      {crown >= 0 && (
        <group position={[0, 2.38 + (1 - crown) * 1.4, 0]} rotation={[0, crown * Math.PI, 0]}>
          <mesh><cylinderGeometry args={[0.2, 0.18, 0.12, 32, 1, true]} /><meshStandardMaterial color={GOLD} roughness={0.2} metalness={0.95} side={THREE.DoubleSide} /></mesh>
          {Array.from({ length: 8 }).map((_, i) => { const a = (i / 8) * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * 0.19, 0.12, Math.sin(a) * 0.19]}><coneGeometry args={[0.035, 0.12, 8]} />{std(GOLD, 0.2, 0.95)}</mesh>; })}
          <mesh position={[0, 0.0, 0.2]}><sphereGeometry args={[0.03, 12, 8]} />{std(RED, 0.2, 0.3)}</mesh>
        </group>
      )}
    </group>
  );
};

export const Napo3D: React.FC<{ width?: number; height?: number; rotY?: number; crown?: number; camDist?: number; camY?: number; tgtY?: number; glow?: string }> = ({ width = 1080, height = 1920, rotY, crown = -1, camDist = 5.6, camY = 1.6, tgtY = 1.15, glow = "#E3B341" }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const ry = rotY ?? Math.sin(f / fps * 0.6) * 0.55 + 0.15;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: width / 2, height: height / 2, transform: "scale(2)", transformOrigin: "0 0" }}>
      <ThreeCanvas width={width / 2} height={height / 2} gl={{ antialias: true, alpha: true }}>
        <CamSet pos={[0, camY, camDist]} tgt={[0, tgtY, 0]} fov={34} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[2.5, 4, 4]} intensity={2.6} color="#fff1dc" />
        <directionalLight position={[-3, 2.5, -2]} intensity={1.6} color={glow} />
        <directionalLight position={[3, 1, -3]} intensity={1.0} color="#7aa2ff" />
        <pointLight position={[0, 0.6, 1.5]} intensity={1.5} color="#ffffff" />
        <group rotation={[0, ry, 0]}><NapoleonModel crown={crown} breathe={f / 14} /></group>
      </ThreeCanvas>
    </div>
  );
};

/* simple soldier (grenadier) */
export const Soldier: React.FC<{ walk: number; fallen?: number; flag?: boolean; t?: number }> = ({ walk, fallen = 0, flag, t = 0 }) => {
  const sw = Math.sin(walk) * 0.5 * (1 - fallen);
  return (
    <group rotation={[-fallen * Math.PI / 2, 0, 0]}>
      {[-0.1, 0.1].map((x, li) => (<group key={x} position={[0, 0.62, 0]} rotation={[(li ? 1 : -1) * sw, 0, 0]}>
        <mesh position={[x, -0.3, 0]}><cylinderGeometry args={[0.07, 0.065, 0.62, 12]} />{std(li ? "#EDE6D6" : "#E6DFCF", 0.7)}</mesh>
        <mesh position={[x, -0.57, 0.03]}><boxGeometry args={[0.12, 0.1, 0.2]} />{std(BLACK, 0.4)}</mesh>
      </group>))}
      <mesh position={[0, 0.95, 0]}><cylinderGeometry args={[0.19, 0.22, 0.62, 16]} />{std(NAVY, 0.6)}</mesh>
      <mesh position={[0, 0.95, 0.19]} rotation={[0, 0, 0.6]}><boxGeometry args={[0.06, 0.6, 0.02]} />{std("#fff", 0.6)}</mesh>
      <mesh position={[0, 0.95, 0.19]} rotation={[0, 0, -0.6]}><boxGeometry args={[0.06, 0.6, 0.02]} />{std("#fff", 0.6)}</mesh>
      <mesh position={[0, 1.36, 0]}><sphereGeometry args={[0.13, 16, 12]} />{std(SKIN, 0.8)}</mesh>
      <mesh position={[0, 1.56, 0]}><cylinderGeometry args={[0.14, 0.12, 0.3, 16]} />{std(BLACK, 0.5)}</mesh>
      <mesh position={[0.06, 1.66, 0.1]}><sphereGeometry args={[0.04, 8, 8]} />{std(RED, 0.5)}</mesh>
      {!flag && <mesh position={[0.22, 1.25, 0]} rotation={[0, 0, -0.15]}><cylinderGeometry args={[0.018, 0.018, 1.0, 8]} />{std("#5b3a1e", 0.6)}</mesh>}
      {flag && (<group position={[0.22, 1.2, 0]}>
        <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.02, 0.02, 1.8, 8]} />{std("#5b3a1e", 0.6)}</mesh>
        {["#2B4BA8", "#ffffff", RED].map((c, i) => <mesh key={c} position={[0.12 + i * 0.24, 1.15 + Math.sin(t * 6 + i) * 0.03, Math.sin(t * 5 + i * 0.8) * 0.06]}><boxGeometry args={[0.24, 0.48, 0.01]} />{std(c, 0.8)}</mesh>)}
      </group>)}
    </group>
  );
};
