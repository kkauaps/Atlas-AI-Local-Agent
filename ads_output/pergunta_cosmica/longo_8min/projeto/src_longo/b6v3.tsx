import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { Water } from "three/examples/jsm/objects/Water.js";
import { useBlock, Sfx, sec } from "./core";
import { cl } from "./cl";
import { Stage, StarField, Nebula, Glow, StarBody, Shock, rng, V3 } from "./hd";
import { EarthHD, GalaxyHD, latLon, faceSpin } from "./hd3d";
import { SoftShadow } from "./touch";
import { win, Layer, E, Title, Tag } from "./b2hd";
import { Counter, Label } from "./hd_a";
import { Env, Human, Car, Rig, hand, add } from "./real";
import { asset, AssetGate } from "./assets";

const shakeK = (t: number, a: number) => (t > a - 0.3 ? Math.max(0, 1 - (t - a + 0.3) / 0.9) : 0);
const fmt = (n: number) => Math.round(n).toLocaleString("pt-BR");
export const B6_ASSETS = ["Michelle.glb", "Xbot.glb", "ferrari.glb", "waternormals.jpg", "pedestrian_overpass_1k.hdr", "blouberg_sunrise_2_1k.hdr", "venice_sunset_1k.hdr"];

/* real ocean surface (three.js Water) */
const Ocean: React.FC<{ t: number; sun: V3 }> = ({ t, sun }) => {
  const water = useMemo(() => { const n = asset<THREE.Texture>("waternormals.jpg"); n.wrapS = n.wrapT = THREE.RepeatWrapping;
    return new Water(new THREE.PlaneGeometry(400, 400), { textureWidth: 512, textureHeight: 512, waterNormals: n, sunDirection: new THREE.Vector3(...sun).normalize(), sunColor: 0xffe2b8, waterColor: 0x062a40, distortionScale: 3.7, fog: false }); }, []);
  water.rotation.x = -Math.PI / 2; (water.material as THREE.ShaderMaterial).uniforms.time.value = t * 0.6;
  return <primitive object={water} />;
};
/* wooden sailing ship hull (lathe-free, beveled) */
const Ship: React.FC<{ t: number; children?: React.ReactNode }> = ({ t, children }) => {
  const wood = useMemo(() => { const d = asset<THREE.Texture>("hardwood2_diffuse.jpg").clone(); d.wrapS = d.wrapT = THREE.RepeatWrapping; d.repeat.set(3, 1); d.colorSpace = THREE.SRGBColorSpace; d.needsUpdate = true; return d; }, []);
  const hull = useMemo(() => { const s = new THREE.Shape(); s.moveTo(-3, 0.9); s.lineTo(3.2, 0.9); s.quadraticCurveTo(3.5, 0.5, 2.6, -0.2); s.lineTo(-2.6, -0.2); s.quadraticCurveTo(-3.1, 0.2, -3, 0.9);
    const g = new THREE.ExtrudeGeometry(s, { depth: 1.8, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.12, bevelSegments: 4 }); g.translate(0, 0, -0.9); return g; }, []);
  const sailGeo = useMemo(() => { const g = new THREE.PlaneGeometry(2.4, 2.4, 16, 16); const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) / 1.2, y = p.getY(i) / 1.2; p.setZ(i, 0.38 * (1 - x * x) * (1 - 0.6 * y * y)); } g.computeVertexNormals(); return g; }, []);
  return <group position={[0, 0.2 + Math.sin(t * 1.4) * 0.05, 0]} rotation={[Math.sin(t * 0.9) * 0.02, 0, Math.sin(t * 1.1) * 0.018]}>
    <mesh geometry={hull} castShadow receiveShadow><meshStandardMaterial map={wood} color="#6b4428" roughness={0.75} /></mesh>
    <mesh position={[0.1, 0.93, 0]} receiveShadow><boxGeometry args={[6.1, 0.06, 2.1]} /><meshStandardMaterial map={wood} color="#c79a6a" roughness={0.7} /></mesh>
    {[-1, 1].map((z) => <mesh key={z} position={[0.1, 1.15, z * 1.08]}><boxGeometry args={[6.1, 0.08, 0.08]} /><meshStandardMaterial color="#4a2e1a" roughness={0.8} /></mesh>)}
    {Array.from({ length: 13 }).map((_, i) => [-1, 1].map((z) => <mesh key={`${i}${z}`} position={[-2.9 + i * 0.5, 1.04, z * 1.08]}><boxGeometry args={[0.05, 0.22, 0.05]} /><meshStandardMaterial color="#4a2e1a" /></mesh>))}
    <mesh position={[1.2, 3.1, 0]}><cylinderGeometry args={[0.07, 0.09, 4.4, 16]} /><meshStandardMaterial color="#5b3a1a" roughness={0.8} /></mesh>
    <mesh position={[1.2, 4.6, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.04, 0.04, 2.6, 10]} /><meshStandardMaterial color="#5b3a1a" /></mesh>
    <mesh position={[1.2, 3.35, 0.06]} geometry={sailGeo}><meshStandardMaterial color="#efe6d2" roughness={0.95} side={THREE.DoubleSide} /></mesh>
    {children}
  </group>;
};

export const B6V3: React.FC = () => {
  const { t, w, W } = useBlock("b6"); const f = useCurrentFrame();
  const M1 = win(t, 3.0, w("terra") - 0.2), M2 = win(t, w("terra") - 0.2, w("ao") - 0.2), M3 = win(t, w("ao") - 0.2, w("sistema") - 0.2), M4 = win(t, w("sistema") - 0.2, w("sente") - 0.8),
    M5 = win(t, w("sente") - 0.8, w("galileu") - 0.3), M6 = win(t, w("galileu") - 0.3, w("incomoda") - 0.4), M7 = win(t, w("incomoda") - 0.4, 999);
  const cnt = (a: number, b: number, to: number) => fmt(interpolate(t, [a, b], [0, to], { ...cl, easing: Easing.out(Easing.cubic) }));
  const brake = E(t, w("freada") - 0.6, w("freada") + 0.2);
  const orbitA = t * 0.6;
  const roadX = (() => { const tb = w("freada") - 0.6; const v = 9; return t < tb ? t * v : tb * v + v * 0.8 * (1 - Math.pow(1 - Math.min(1, (t - tb) / 0.8), 2)); })();
  const cup = E(t, w("freada") - 0.6, w("freada") + 0.1, Easing.out(Easing.quad));
  const out1 = E(t, w("terra") - 1.2, w("terra") - 0.1, Easing.in(Easing.cubic));
  const pull = E(t, w("terra") - 0.25, w("brasil") - 0.3, Easing.inOut(Easing.cubic));
  const lerpE = (a: number, b: number, p: number) => a * Math.pow(b / a, p);
  const BR = latLon(-15, -47, 1.7); const BRp = BR.map((v) => v * 1.03) as V3;
  // const city = useMemo(() => { const R = rng(66); return Array.from({ length: 26 }).map(() => [(R() - 0.5) * 40, -10 - R() * 25, 1 + R() * 2.5, 2 + R() * 9]); }, []);
  // const tiny = useMemo(() => { const R = rng(67); return Array.from({ length: 22 }).map((_, i) => [i * 0.29 + R() * 0.1, (R() - 0.5) * 1.4, 0.3 + R() * 0.8]); }, []);
  return (
    <AbsoluteFill><AssetGate files={[...B6_ASSETS, "hardwood2_diffuse.jpg"]}>
      <Layer o={M1}>
        {(() => { const arrive = E(t, 3.0, 5.4, Easing.inOut(Easing.sin)), stop = E(t, 4.9, 5.6, Easing.inOut(Easing.sin)); const hx = -2.8 * (1 - arrive);
          const lookUp = E(t, w("aviao") - 1.0, w("aviao") + 0.2, Easing.inOut(Easing.sin)) * (1 - out1);
          const dolly = E(t, 3, w("terra") - 1.2, Easing.inOut(Easing.sin));
          return <Stage pos={add([1.5 + hx * 0.35 - out1 * 0.5, 1.2 + out1 * 2.2, 4.3 - dolly * 0.9 + out1 * 3], hand(t))} tgt={[hx * 0.55, 1.1 + out1 * 0.9 + lookUp * 0.25, 0]} fov={38} shadows post bloom={0.35}>
            <Env file="venice_sunset_1k.hdr" intensity={0.9} rot={-0.6} />
            <Rig key_={[3, 3.5, 3]} keyColor="#ffd9b0" keyI={1.6} rim={[-4, 2.2, -5]} rimColor="#ff9a4a" rimI={5} fillI={0.2} target={[hx, 0.9, 0]} area={3.5} catcher={0.5} />
            <Human pos={[hx, 0, 0]} rot={[0, Math.PI / 2 * (1 - stop) + 0.3 * stop, 0]} time={t} anim="walk" anim2="idle" mix={stop} look={lookUp * 0.7} yaw={-0.35 * lookUp} />
            <group position={[-34 + (t - 3) * 5.5, 13, -45]} rotation={[0, 0, 0.04]}>
              <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.32, 0.22, 5, 20]} /><meshStandardMaterial color="#e5e7eb" metalness={0.5} roughness={0.35} /></mesh>
              <mesh position={[0.2, 0, 0]}><boxGeometry args={[1.0, 0.06, 5.2]} /><meshStandardMaterial color="#d1d5db" metalness={0.5} roughness={0.35} /></mesh>
              <mesh position={[-2.2, 0.6, 0]}><boxGeometry args={[0.6, 1.1, 0.06]} /><meshStandardMaterial color="#d1d5db" /></mesh>
              <Glow pos={[0.2, 0, 2.6]} size={0.9} color="#ef4444" opacity={0.5 + 0.5 * Math.sin(f / 3)} /><Glow pos={[0.2, 0, -2.6]} size={0.9} color="#22c55e" opacity={0.5 + 0.5 * Math.sin(f / 3)} />
            </group>
          </Stage>; })()}
        <Title at={sec(3.2)} lines={["VOCÊ ESTÁ MAIS RÁPIDO", "QUE UM AVIÃO"]} top={70} size={86} />
        <Counter at={W("aviao") - 2} label="AVIÃO" value="~900 km/h" color="#cbd5e1" x={420} y={560} size={64} />
        <Counter at={W("aviao") + 6} label="VOCÊ, PARADO AÍ" value="+1.500 km/h" x={1500} y={560} size={64} />
      </Layer>
      <Layer o={M2}>
        <Stage pos={[0, BR[1] * 1.0, lerpE(2.06, 5.6, pull)]} tgt={[0, BR[1] * (1 - pull), 0]} fov={40}>
          <StarField n={5000} size={0.4} /><ambientLight intensity={0.7} /><directionalLight position={[2, 1.5, 6]} intensity={3.4} />
          <EarthHD r={1.7} spin={faceSpin(BR) + (t - w("terra")) * 0.1} tilt={0} tex="longo/earth_atmos_2048.jpg">
            <Glow pos={BRp} size={0.16 + 0.05 * Math.sin(f / 4)} color="#fbbf24" opacity={1} />
            <Glow pos={BRp} size={0.45} color="#fbbf24" opacity={0.35} />
          </EarthHD>
        </Stage>
        <Title at={W("gira") - 4} lines={["A TERRA GIRA"]} top={80} size={92} />
        <Label at={W("brasil") - 6} x={1010} y={640} color="#FBBF24">📍 VOCÊ, NO BRASIL</Label>
        <Counter at={W("brasil") - 4} label="VELOCIDADE DE ROTAÇÃO" value={`${cnt(w("brasil"), w("hora"), 1500)} km/h`} x={1500} y={420} />
      </Layer>
      <Layer o={M3}>
        <Stage pos={[0, 6.5, 9]} tgt={[0, 0, 0]} fov={42}>
          <StarField n={5000} size={0.4} /><ambientLight intensity={0.05} /><pointLight intensity={220} decay={1.2} />
          <StarBody r={1.2} t={t} />
          <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[4.97, 5.03, 200]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.25} side={THREE.DoubleSide} /></mesh>
          {Array.from({ length: 40 }).map((_, i) => { const a = orbitA - i * 0.025; return <Glow key={i} pos={[Math.cos(a) * 5, 0, Math.sin(a) * 5]} size={0.4 * (1 - i / 40)} color="#22d3ee" opacity={1 - i / 40} />; })}
          <EarthHD pos={[Math.cos(orbitA) * 5, 0, Math.sin(orbitA) * 5]} r={0.42} spin={t} tilt={0.3} />
        </Stage>
        <Title at={W("ao") - 3} lines={["EM VOLTA DO SOL"]} top={80} size={92} />
        <Counter at={W("viaja") - 4} label="ÓRBITA DA TERRA" value={`${cnt(w("viaja"), w("hora", 1), 107000)} km/h`} color="#22D3EE" x={1520} y={520} />
      </Layer>
      <Layer o={M4}>
        <Stage pos={[0, 5.5, 7]} tgt={[0, 0, 0]} fov={50}>
          <StarField n={5000} size={0.4} /><GalaxyHD t={t} n={22000} r={5} />
          {(() => { const a = 3.2 * 1.6 + t * 0.25 * (1.4 / (0.4 + 3.2 / 5)); const p: V3 = [Math.cos(a) * 3.2, 0.05, Math.sin(a) * 3.2]; return <><Glow pos={p} size={0.9 + 0.2 * Math.sin(f / 4)} color="#fbbf24" /><Shock p={((t * 0.8) % 1)} r={1.4} pos={p} tilt={Math.PI / 2} /></>; })()}
        </Stage>
        <Title at={W("sistema") - 3} lines={["E O SISTEMA SOLAR,", "NA GALÁXIA"]} top={70} size={84} />
        <Counter at={W("galaxia") - 4} label="EM VOLTA DA VIA LÁCTEA" value={`${cnt(w("galaxia"), w("hora", 2), 800000)}+ km/h`} color="#C4B5FD" x={1520} y={560} />
      </Layer>
      <Layer o={M5}>
        <Stage pos={(() => { const a = -0.5 + (t - w("sente")) * 0.09, r = 1.25 + (t - w("sente")) * 0.06; return add([Math.sin(a) * r, 2.12 + (t - w("sente")) * 0.03, Math.cos(a) * r], hand(t, 0.5)); })()} tgt={[0, 1.86, 0]} fov={40} bg="#02040a" post bloom={0.6}>
          <group rotation={[0, 0, (t - w("sente")) * 0.2]}><StarField n={6000} size={0.5} /></group><Nebula seed={40} colors={["#0891b2", "#4c1d95"]} z={-40} opacity={0.3} />
          <ambientLight intensity={0.25} /><directionalLight position={[3, 4, 4]} intensity={3.2} color="#fff1dc" /><directionalLight position={[-2, 3, -4]} intensity={4} color="#7fb6ff" />
          <group quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(...BR).applyAxisAngle(new THREE.Vector3(0, 1, 0), faceSpin(BR)).normalize(), new THREE.Vector3(0, 1, 0))}>
            <EarthHD r={1.7} spin={faceSpin(BR)} tilt={0} tex="longo/earth_atmos_2048.jpg" />
          </group>
          <Human pos={[0, 1.705, 0]} scale={0.085} rot={[0, 0.3, 0]} time={t} anim="idle" look={-0.15 + 0.35 * E(t, w("sente"), w("sente") + 1.5, Easing.inOut(Easing.sin))} yaw={0.4 * Math.sin((t - w("sente")) * 0.6)} />
        </Stage>
        <Title at={W("sente") - 4} lines={["POR QUE VOCÊ", "NÃO SENTE NADA?"]} top={70} size={88} />
        <Tag at={W("junto") - 4} bottom={260} color="#22D3EE">O CHÃO, O AR E OS PRÉDIOS VÃO JUNTO COM VOCÊ</Tag>
        <Tag at={W("percebe") - 4} bottom={150}>O CORPO SÓ SENTE MUDANÇAS DE VELOCIDADE</Tag>
      </Layer>
      <Layer o={M6}>
        <Stage pos={add([2.6 - (t - w("galileu")) * 0.35, 2.3 + Math.sin(t * 0.7) * 0.08, 6.6 - (t - w("galileu")) * 0.15], hand(t))} tgt={[-0.6, 1.7, 0]} fov={40} shadows post bloom={0.4}>
          <Env file="blouberg_sunrise_2_1k.hdr" intensity={1} rot={1.2} bgIntensity={0.85} />
          <Rig key_={[3, 5, 4]} keyColor="#fff0dc" keyI={1.5} rim={[-5, 3, -6]} rimColor="#ffc078" rimI={4.5} fillI={0.25} target={[-0.6, 1.4, 0]} area={4} catcher={0} />
          <Ocean t={t} sun={[-5, 2, -6]} />
          <Ship t={t}>
            <Human pos={[-1.2, 0.96, 0.1]} rot={[0, 0.7, 0]} scale={0.95} time={t} anim="idle" anim2="agree" mix={E(t, w("parado") - 0.6, w("parado"), Easing.inOut(Easing.sin))} look={0.35} yaw={0.45} />
            <mesh castShadow position={[-0.45, 0.96 + 1.1 - ((t * 0.8) % 1) * ((t * 0.8) % 1) * 1.05, 0.25]}><sphereGeometry args={[0.07, 24, 16]} /><meshStandardMaterial color="#c81e1e" roughness={0.35} /></mesh>
          </Ship>
        </Stage>
        <Title at={W("galileu") - 3} lines={["O NAVIO DE GALILEU", "1632"]} top={70} size={84} />
        <Tag at={W("parado") - 4}>LÁ DENTRO, NÃO DÁ PRA SABER SE ESTÁ PARADO</Tag>
      </Layer>
      <Layer o={M7}>
        <Stage pos={add([1.2 + brake * 0.6 + Math.sin(t * 0.5) * 0.2, 1.05, 5.6 - brake * 0.5], add(hand(t, 1.5), [shakeK(t, w("freada")) * Math.sin(f * 2.1) * 0.05, shakeK(t, w("freada")) * Math.cos(f * 1.7) * 0.04, 0]))} tgt={[0.3 + brake * 0.4, 0.55, 0]} fov={38} post bloom={0.5}>
          <Env file="pedestrian_overpass_1k.hdr" intensity={1.1} rot={0.4} />
          <Rig key_={[2, 6, 3]} keyColor="#fff4e6" keyI={1.8} rim={[-6, 2, -4]} rimColor="#cfe3ff" rimI={3} fillI={0.2} target={[0, 0.5, 0]} area={4} catcher={0} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[200, 9]} /><meshStandardMaterial color="#2b2d31" roughness={0.92} /></mesh>
          {Array.from({ length: 16 }).map((_, i) => { const x = (((i * 4 - roadX) % 64) + 64) % 64 - 32; return <mesh key={i} position={[x, 0.004, -1.6]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2, 0.14]} /><meshStandardMaterial color="#e8e2c8" roughness={0.6} /></mesh>; })}
          {[-4.3, 4.3].map((z) => <mesh key={z} position={[0, 0.06, z]}><boxGeometry args={[200, 0.12, 0.3]} /><meshStandardMaterial color="#9ca3af" roughness={0.8} /></mesh>)}
          {brake > 0.15 && [0.8, -0.8].map((z, k) => <mesh key={k} position={[-1.5 - 1.4 * brake, 0.005, z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.8 * brake, 0.22]} /><meshBasicMaterial color="#050505" transparent opacity={0.55} /></mesh>)}
          <SoftShadow pos={[0, 0.006, 0]} sx={4.8} sz={2.3} opacity={0.6} />
          <group rotation={[0, 0, -brake * (1 - brake) * 0.12]}>
            <Car rot={[0, Math.PI / 2, 0]} wheelSpin={roadX * 2.9} brake={brake} />
          </group>
        </Stage>
        <Title at={W("incomoda") - 4} lines={["SÓ INCOMODA QUANDO", "MUDA DE REPENTE"]} top={70} size={88} />
      </Layer>
      <Sfx at={sec(3)} src="v3/city.mp3" vol={0.22} dur={W("terra") - sec(3)} />
      <Sfx at={sec(3.6)} src="v3/jet.mp3" vol={0.2} dur={210} />
      <Sfx at={W("terra") - 22} src="v3/whoosh_space.mp3" vol={0.3} dur={90} />
      <Sfx at={W("terra")} src="v3/space_drone.mp3" vol={0.16} dur={450} />
      <Sfx at={W("terra") + 440} src="v3/space_drone.mp3" vol={0.16} dur={Math.max(1, W("galileu") - 9 - W("terra") - 440)} />
      <Sfx at={W("galileu") - 9} src="v3/ocean.mp3" vol={0.24} dur={W("incomoda") - W("galileu") + 6} />
      <Sfx at={W("freada") - 33} src="v3/car_brake.mp3" vol={0.32} dur={150} />
    </AssetGate></AbsoluteFill>
  );
};
