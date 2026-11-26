import React, { useMemo } from "react";
import * as THREE from "three";
import { staticFile } from "remotion";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as skClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { V3 } from "./hd";

/* ---------- realistic wooden table top ---------- */
export const WoodTable: React.FC<{ y?: number; size?: [number, number] }> = ({ y = 0, size = [14, 8] }) => {
  const [d, b, r] = useLoader(THREE.TextureLoader, [staticFile("longo/hardwood2_diffuse.jpg"), staticFile("longo/hardwood2_bump.jpg"), staticFile("longo/hardwood2_roughness.jpg")]);
  useMemo(() => { [d, b, r].forEach((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1); t.anisotropy = 2; }); d.colorSpace = THREE.SRGBColorSpace; }, [d, b, r]);
  return <group position={[0, y, 0]}>
    <mesh position={[0, -0.25, 0]} receiveShadow><boxGeometry args={[size[0], 0.5, size[1]]} /><meshLambertMaterial map={d} color="#9c7a5e" /></mesh>
  </group>;
};

/* soft contact shadow (fake, cheap) */
const shTex = (() => { if (typeof document === "undefined") return null; const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(0.5, "rgba(0,0,0,.55)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
export const SoftShadow: React.FC<{ pos: V3; sx: number; sz: number; opacity: number }> = ({ pos, sx, sz, opacity }) => (
  <mesh position={pos} rotation={[-Math.PI / 2, 0, 0]} scale={[sx, sz, 1]}><planeGeometry args={[1, 1]} /><meshBasicMaterial map={shTex} transparent opacity={opacity} depthWrite={false} /></mesh>
);

/* ---------- skinned hand (webxr generic-hand, MIT) with procedural finger curl ---------- */
const FINGERS = ["index-finger", "middle-finger", "ring-finger", "pinky-finger"];
const PH = ["phalanx-proximal", "phalanx-intermediate", "phalanx-distal", "tip"];
const localPos = (o: THREE.Object3D, root: THREE.Object3D) => { const v = o.position.clone(); let p = o.parent; while (p && p !== root) { p.updateMatrix(); v.applyMatrix4(p.matrix); p = p.parent; } return v; };
export const Hand: React.FC<{ pos?: V3; tipTo?: V3; rot?: V3; scale?: number; curl?: number[]; thumb?: number; color?: string; sleeve?: boolean }> = ({ pos = [0, 0, 0], tipTo, rot = [0, 0, 0], scale = 10, curl = [0.1, 0.25, 0.35, 0.45], thumb = 0.2, color = "#d69a7a", sleeve = true }) => {
  const gltf = useLoader(GLTFLoader, staticFile("longo/hand_right.glb"));
  const { scene, bones, rest } = useMemo(() => { const s = skClone(gltf.scene) as THREE.Object3D; const bones: Record<string, THREE.Object3D> = {}; s.traverse((o) => { if ((o as any).isBone || o.name) bones[o.name] = o; });
    const rest: Record<string, { p: THREE.Vector3; q: THREE.Quaternion }> = {}; Object.values(bones).forEach((b) => { rest[b.name] = { p: b.position.clone(), q: b.quaternion.clone() }; });
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.58, metalness: 0, emissive: new THREE.Color("#3a1408"), emissiveIntensity: 0.25 });
    s.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.material = mat; m.frustumCulled = false; (m.geometry as THREE.BufferGeometry).computeVertexNormals(); } });
    return { scene: s, bones, rest }; }, [gltf, color]);
  // reset to rest, then curl each finger chain around the hand's lateral axis
  Object.keys(rest).forEach((k) => { bones[k].position.copy(rest[k].p); bones[k].quaternion.copy(rest[k].q); });
  const lat = rest["pinky-finger-metacarpal"].p.clone().sub(rest["index-finger-metacarpal"].p).normalize();
  FINGERS.forEach((fn, fi) => { const a = curl[fi] ?? 0; const chain = PH.map((p) => bones[`${fn}-${p}`]);
    for (let k = 0; k < 3; k++) { const pivot = chain[k].position.clone(); const R = new THREE.Quaternion().setFromAxisAngle(lat, -a * (k === 0 ? 0.8 : 1.1));
      for (let j = k + 1; j < chain.length; j++) { chain[j].position.sub(pivot).applyQuaternion(R).add(pivot); chain[j].quaternion.premultiply(R); }
      chain[k].quaternion.premultiply(R); } });
  { const chain = ["thumb-phalanx-proximal", "thumb-phalanx-distal", "thumb-tip"].map((n) => bones[n]); const ax = new THREE.Vector3(0, 0, 1);
    for (let k = 0; k < 2; k++) { const pivot = chain[k].position.clone(); const R = new THREE.Quaternion().setFromAxisAngle(ax, thumb * 0.6);
      for (let j = k + 1; j < chain.length; j++) { chain[j].position.sub(pivot).applyQuaternion(R).add(pivot); chain[j].quaternion.premultiply(R); } chain[k].quaternion.premultiply(R); } }
  const tip = localPos(bones["index-finger-tip"], scene).add(new THREE.Vector3(0, 0, 0));
  const wrist = localPos(bones["wrist"], scene);
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot));
  const P = tipTo ? new THREE.Vector3(...tipTo).sub(tip.clone().multiplyScalar(scale).applyQuaternion(q)) : new THREE.Vector3(...pos);
  return <group position={P.toArray() as V3} quaternion={q} scale={scale}><primitive object={scene} />
    {sleeve && <group position={wrist.toArray() as V3}>
      <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.027, 0.025, 0.05, 32]} /><meshStandardMaterial color={color} roughness={0.58} /></mesh>
      <mesh position={[0, 0.17, 0]}><cylinderGeometry args={[0.038, 0.035, 0.24, 40]} /><meshStandardMaterial color="#1b2438" roughness={0.95} /></mesh>
      <mesh position={[0, 0.052, 0]}><torusGeometry args={[0.035, 0.005, 12, 40]} /><meshStandardMaterial color="#1b2438" roughness={0.95} /></mesh>
    </group>}
  </group>;
};
export const handTip = (scale: number) => new THREE.Vector3(0.02697, -0.11364, -0.01027).multiplyScalar(scale);

/* ---------- mannequin person (three.js Xbot, mixamo) with deterministic animation ---------- */
import { AnimationMixer } from "three";
import { Human } from "./real";
export const Person: React.FC<{ pos?: V3; rot?: V3; scale?: number; anim?: string; time: number; color?: string; opacity?: number; look?: number; anim2?: string; mix?: number; yaw?: number }> = ({ color, opacity, ...p }) => <Human {...p} />;
