import React from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useVideoConfig, random } from "remotion";
import { Map3D, toWorld, LAND_Y, K } from "./map3d";
import { NapoleonModel, Soldier } from "./napo3d";

type V3 = [number, number, number];
const CamSet: React.FC<{ pos: V3; tgt: V3; fov: number }> = ({ pos, tgt, fov }) => {
  const { camera } = useThree(); const c = camera as THREE.PerspectiveCamera;
  c.fov = fov; c.near = 0.02; c.far = 80; c.position.set(...pos); c.lookAt(...tgt); c.updateProjectionMatrix();
  return null;
};

// polyline path in map coords -> world sampler
export const makePath = (k: K, pts: [number, number][]) => {
  const w = pts.map((p) => new THREE.Vector3(...toWorld(k, p, LAND_Y)));
  const seg = w.slice(1).map((b, i) => b.distanceTo(w[i]));
  const L = seg.reduce((a, b) => a + b, 0);
  const at = (u: number) => {
    let d = Math.max(0, Math.min(1, u)) * L;
    for (let i = 0; i < seg.length; i++) { if (d <= seg[i] || i === seg.length - 1) { const a = w[i], b = w[i + 1]; const f = seg[i] ? Math.min(1, d / seg[i]) : 0; return { p: a.clone().lerp(b, f), dir: b.clone().sub(a).normalize() }; } d -= seg[i]; }
    return { p: w[w.length - 1], dir: new THREE.Vector3(1, 0, 0) };
  };
  return { at, L };
};

export const Army: React.FC<{ path: ReturnType<typeof makePath>; u: number; t: number; n?: number; scale?: number; walking: boolean; point?: number; fallenAt?: (i: number) => number; snowU?: (i: number) => number }> = ({ path, u, t, n = 24, scale = 0.085, walking, point = 0, fallenAt, snowU }) => {
  const lead = path.at(u);
  const yaw = Math.atan2(lead.dir.x, lead.dir.z);
  const du = 0.16 / path.L;
  return (
    <group>
      <group position={lead.p} rotation={[0, yaw, 0]} scale={scale * 1.25}>
        <NapoleonModel pedestal={false} walk={walking ? t * 9 : -1} point={point} breathe={t * 2} />
      </group>
      {Array.from({ length: n }).map((_, i) => {
        const row = Math.floor(i / 4) + 1, col = (i % 4) - 1.5;
        const fa = fallenAt ? fallenAt(i) : 0;
        const ui = snowU && fa > 0 ? snowU(i) : u;
        const q = path.at(ui - row * du * 1.1);
        const side = new THREE.Vector3(q.dir.z, 0, -q.dir.x).multiplyScalar(col * 0.11);
        const pos = q.p.clone().add(side);
        const y2 = Math.atan2(q.dir.x, q.dir.z);
        const flag = i === 1;
        return (
          <group key={i} position={pos} rotation={[0, y2, 0]} scale={scale}>
            <Soldier walk={walking ? t * 9 + (i % 2) * Math.PI : 0} fallen={fa} flag={flag} t={t} />
          </group>
        );
      })}
    </group>
  );
};

export const Board: React.FC<{ k: K; cam: { pos: V3; tgt: V3; fov: number }; fills?: Record<string, [string, number]>; snow?: number; snowSet?: string[]; children?: React.ReactNode; light?: number }> = ({ k, cam, fills, snow, snowSet, children, light = 1 }) => {
  const { width, height } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: width / 2, height: height / 2, transform: "scale(2)", transformOrigin: "0 0" }}>
      <ThreeCanvas width={width / 2} height={height / 2} gl={{ antialias: true }}>
        <color attach="background" args={["#0B1024"]} />
        <fog attach="fog" args={["#0B1024", 6, 14]} />
        <CamSet {...cam} />
        <ambientLight intensity={0.55 * light} />
        <directionalLight position={[-3, 6, 4]} intensity={2.4 * light} color="#fff1dc" />
        <directionalLight position={[4, 3, -3]} intensity={0.9} color="#7aa2ff" />
        <Map3D k={k} fills={fills} snow={snow} snowSet={snowSet} />
        {children}
      </ThreeCanvas>
    </div>
  );
};

export const SnowFall: React.FC<{ center: THREE.Vector3; t: number; n?: number; amt: number }> = ({ center, t, n = 260, amt }) => {
  const geo = React.useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3)); return g; }, [n]);
  const arr = geo.attributes.position.array as Float32Array;
  for (let i = 0; i < n; i++) {
    const sp = 0.25 + random(`v${i}`) * 0.4;
    arr[i * 3] = center.x + (random(`x${i}`) - 0.5) * 5 + Math.sin(t + i) * 0.1 - t * 0.15;
    arr[i * 3 + 1] = 2.2 - ((random(`y${i}`) * 2.2 + t * sp) % 2.2);
    arr[i * 3 + 2] = center.z + (random(`z${i}`) - 0.5) * 5;
  }
  geo.attributes.position.needsUpdate = true;
  return <points geometry={geo}><pointsMaterial size={0.035} color="#ffffff" transparent opacity={amt} depthWrite={false} /></points>;
};
