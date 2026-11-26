import React, { useMemo } from "react";
import * as THREE from "three";
import { staticFile } from "remotion";
import { useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { clone as skClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { V3 } from "./hd";
import { asset } from "./assets";

/* ---------- HDRI image-based lighting (+ optional visible sky) ---------- */
export const Env: React.FC<{ file: string; bg?: boolean; intensity?: number; bgIntensity?: number; blur?: number; rot?: number }> = ({ file, bg = true, intensity = 1, bgIntensity = 1, blur = 0, rot = 0 }) => {
  const hdr = asset<THREE.DataTexture>(file);
  const { gl, scene } = useThree();
  const env = useMemo(() => { hdr.mapping = THREE.EquirectangularReflectionMapping; const pm = new THREE.PMREMGenerator(gl); const t = pm.fromEquirectangular(hdr).texture; pm.dispose(); return t; }, [hdr, gl]);
  scene.environment = env; (scene as any).environmentIntensity = intensity;
  (scene as any).environmentRotation = new THREE.Euler(0, rot, 0); (scene as any).backgroundRotation = new THREE.Euler(0, rot, 0);
  if (bg) { scene.background = hdr; scene.backgroundIntensity = bgIntensity; scene.backgroundBlurriness = blur; }
  return null;
};

/* ---------- realistic human (Ready Player Me avatar) driven by mixamo clips from Xbot ---------- */
export const Human: React.FC<{ pos?: V3; rot?: V3; scale?: number; anim?: string; anim2?: string; mix?: number; time: number; look?: number; yaw?: number; tint?: string }> = ({ pos = [0, 0, 0], rot = [0, 0, 0], scale = 1, anim = "idle", anim2, mix = 0, time, look = 0, yaw = 0, tint }) => {
  const av = asset("Michelle.glb"), xb = asset("Xbot.glb");
  const R = useMemo(() => {
    const s = skClone(av.scene) as THREE.Object3D; const src = skClone(xb.scene) as THREE.Object3D;
    s.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.frustumCulled = false; m.castShadow = true; } });
    const mixer = new THREE.AnimationMixer(src); const actions: Record<string, THREE.AnimationAction> = {};
    xb.animations.forEach((c) => { actions[c.name] = mixer.clipAction(new THREE.AnimationClip(c.name, c.duration, c.tracks.filter((t) => t.name.endsWith(".quaternion")))); });
    // world-space retarget data (both rigs in rest pose now)
    s.updateMatrixWorld(true); src.updateMatrixWorld(true);
    const bones: { t: THREE.Object3D; s: THREE.Object3D; sRestInv: THREE.Quaternion; tRest: THREE.Quaternion }[] = [];
    s.traverse((o) => { if (!(o as any).isBone) return; const so = src.getObjectByName(o.name); if (!so) return;
      bones.push({ t: o, s: so, sRestInv: so.getWorldQuaternion(new THREE.Quaternion()).invert(), tRest: o.getWorldQuaternion(new THREE.Quaternion()) }); });
    return { scene: s, src, mixer, actions, bones }; }, [av, xb]);
  const { scene, src, mixer, actions, bones } = R;
  Object.entries(actions).forEach(([k, a]) => { const wgt = k === anim ? 1 - (anim2 ? mix : 0) : k === anim2 ? mix : 0; if (wgt > 0) { a.play(); a.setEffectiveWeight(wgt); } else a.stop(); });
  mixer.setTime(time); src.updateMatrixWorld(true);
  { const world = new Map<THREE.Object3D, THREE.Quaternion>(); const sw = new THREE.Quaternion(), pw = new THREE.Quaternion();
    scene.updateMatrixWorld(true);
    for (const b of bones) { // traverse order = parents first
      b.s.getWorldQuaternion(sw); const tw = sw.clone().multiply(b.sRestInv).multiply(b.tRest);
      const par = b.t.parent!; const pq = world.get(par) ?? par.getWorldQuaternion(pw).clone();
      b.t.quaternion.copy(pq.clone().invert().multiply(tw)); world.set(b.t, tw); } }
  if (yaw) { const h = scene.getObjectByName("mixamorigHead"), nk = scene.getObjectByName("mixamorigNeck"); if (h) h.rotation.y += yaw * 0.6; if (nk) nk.rotation.y += yaw * 0.4; }
  if (look) { const h = scene.getObjectByName("mixamorigHead"), nk = scene.getObjectByName("mixamorigNeck"); if (h) h.rotation.x -= look * 0.6; if (nk) nk.rotation.x -= look * 0.4; }
  return <group position={pos} rotation={rot} scale={scale}><primitive object={scene} /></group>;
};

/* ---------- sports car (three.js ferrari example) ---------- */
export const Car: React.FC<{ pos?: V3; rot?: V3; scale?: number; color?: string; wheelSpin?: number; brake?: number }> = ({ pos = [0, 0, 0], rot = [0, 0, 0], scale = 1, color = "#b0101a", wheelSpin = 0, brake = 0 }) => {
  const g = asset("ferrari.glb");
  const { s, wheels, tlMat } = useMemo(() => { const s = g.scene.children[0].clone(true);
    const body = new THREE.MeshStandardMaterial({ color, metalness: 0.75, roughness: 0.22, envMapIntensity: 1.4 });
    const det = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.5 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x223040, metalness: 0.6, roughness: 0.05, transparent: true, opacity: 0.45 });
    const set = (n: string, m: THREE.Material) => { const o = s.getObjectByName(n) as THREE.Mesh; if (o) o.material = m; };
    set("body", body); ["rim_fl", "rim_fr", "rim_rr", "rim_rl", "trim"].forEach((n) => set(n, det)); set("glass", glass);
    const tl = s.getObjectByName("lights_red") as THREE.Mesh; const tlMat = new THREE.MeshStandardMaterial({ color: "#5a0a08", emissive: new THREE.Color("#ff1a0a"), emissiveIntensity: 0.4, roughness: 0.2 }); if (tl) tl.material = tlMat;
    const wheels = ["wheel_fl", "wheel_fr", "wheel_rl", "wheel_rr"].map((n) => s.getObjectByName(n)!).filter(Boolean);
    return { s, wheels, tlMat }; }, [g, color]);
  useMemo(() => s.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; }), [s]);
  wheels.forEach((w) => { w.rotation.x = wheelSpin; }); tlMat.emissiveIntensity = 0.4 + brake * 6;
  return <group position={pos} rotation={rot} scale={scale}><primitive object={s} />
  </group>;
};

/* ---------- velvet chair (Khronos SheenChair, CC-BY) ---------- */
export const Chair: React.FC<{ pos?: V3; rot?: V3; scale?: number }> = ({ pos = [0, 0, 0], rot = [0, 0, 0], scale = 1 }) => {
  const g = asset("SheenChair.glb");
  const s = useMemo(() => g.scene.clone(true), [g]);
  return <group position={pos} rotation={rot} scale={scale}><primitive object={s} /></group>;
};

/* cinematic 3-point rig: shadow-casting key, strong rim/back light, soft fill + shadow catcher floor */
export const Rig: React.FC<{ key_?: V3; keyColor?: string; keyI?: number; rim?: V3; rimColor?: string; rimI?: number; fillColor?: string; fillI?: number; target?: V3; area?: number; catcher?: number }> = ({ key_ = [4, 6, 4], keyColor = "#ffe2c0", keyI = 2.2, rim = [-3, 3, -4], rimColor = "#9ec5ff", rimI = 3, fillColor = "#b8c8ff", fillI = 0.25, target = [0, 0.9, 0], area = 4, catcher = 0.45 }) => {
  const tgt = useMemo(() => { const o = new THREE.Object3D(); o.position.set(...target); return o; }, [target[0], target[1], target[2]]);
  const { scene } = useThree();
  scene.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh || (o as any).__noShadow) return; const mt = m.material as THREE.Material; if (!mt || (mt as any).isMeshBasicMaterial || (mt as any).isShaderMaterial || (mt as any).isShadowMaterial || mt.transparent) return; m.castShadow = true; m.receiveShadow = true; });
  return <>
    <primitive object={tgt} />
    <directionalLight position={[target[0] + key_[0], target[1] + key_[1], target[2] + key_[2]]} target={tgt} intensity={keyI} color={keyColor} castShadow
      shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.0004} shadow-normalBias={0.02} shadow-radius={6}
      shadow-camera-left={-area} shadow-camera-right={area} shadow-camera-top={area} shadow-camera-bottom={-area} shadow-camera-near={0.5} shadow-camera-far={40} />
    <directionalLight position={[target[0] + rim[0], target[1] + rim[1], target[2] + rim[2]]} target={tgt} intensity={rimI} color={rimColor} />
    <hemisphereLight args={[fillColor, "#1a1410", fillI]} />
    {catcher > 0 && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[target[0], 0.002, target[2]]} receiveShadow><planeGeometry args={[area * 4, area * 4]} /><shadowMaterial opacity={catcher} transparent /></mesh>}
  </>;
};
/* subtle handheld camera drift */
export const hand = (t: number, amp = 1): V3 => [ (Math.sin(t * 0.9) * 0.6 + Math.sin(t * 2.3 + 1) * 0.25) * 0.03 * amp, (Math.sin(t * 1.3 + 2) * 0.6 + Math.sin(t * 3.1) * 0.2) * 0.02 * amp, 0 ];
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
