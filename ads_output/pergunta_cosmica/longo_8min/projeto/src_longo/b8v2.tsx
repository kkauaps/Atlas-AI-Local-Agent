import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { theme } from "./theme";
import { useBlock, Sfx, sec } from "./core";
import { cl } from "./cl";
import { Stage, StarField, Glow, Points, HoloBody, rng, V3 } from "./hd";
import { Atom3D } from "./hd3d";
import { win, Layer, E, Title, Tag, F } from "./b2hd";
import { Label, Lattice, shakeAt } from "./hd_a";
import { WoodTable, Hand, SoftShadow } from "./touch";
import { Env, Rig, Chair, hand, add } from "./real";

const lerpExp = (a: number, b: number, p: number) => a * Math.pow(b / a, p);
const HAND = { rot: [0, 0.35, Math.PI / 2 - 0.75] as V3, curl: [0.15, 1.45, 1.55, 1.6], thumb: 0.9 };

/* warm "real world" set: wood table, fog, bokeh */
const RealSet: React.FC<{ children?: React.ReactNode }> = ({ children }) => (<>
  <Env file="royal_esplanade_1k.hdr" intensity={0.8} bgIntensity={0.6} rot={1.4} blur={0.12} />
  <Rig key_={[2, 4, 2.5]} keyColor="#fff0dc" keyI={1.8} rim={[-2.5, 1.8, -3]} rimColor="#ffcf9a" rimI={3} fillI={0.2} target={[0, 0.3, 0]} area={1.8} catcher={0} />
  <WoodTable y={0} size={[16, 14]} />
  {children}
</>);

/* scale readout (top-right) */
const UNITS: [number, string][] = [[-2, "cm"], [-3, "mm"], [-6, "µm"], [-9, "nm"]];
const ScaleHUD: React.FC<{ s: number; o: number }> = ({ s, o }) => {
  if (o <= 0.01) return null;
  const [ue, un] = UNITS.find(([e]) => s >= e) ?? UNITS[UNITS.length - 1];
  const v = Math.pow(10, s - ue); const k = Math.pow(10, Math.floor(Math.log10(v))); const nice = Math.max(1, Math.round(v / k)) * k;
  const txt = (nice >= 1 ? String(Math.round(nice)) : nice.toFixed(Math.min(3, -Math.floor(Math.log10(nice))))).replace(".", ",");
  const zoom = Math.max(1, Math.round(-1 - s));
  return <div style={{ position: "absolute", right: 70, bottom: 190, opacity: o, fontFamily: F, color: "#fff", textAlign: "right", textShadow: "0 4px 20px rgba(0,0,0,.9)" }}>
    <div style={{ fontWeight: 800, fontSize: 26, letterSpacing: "0.12em", color: "#cbd5e1" }}>ESCALA</div>
    <div style={{ fontWeight: 900, fontSize: 64, lineHeight: 1, color: theme.colors.primary, fontVariantNumeric: "tabular-nums" }}>{txt} {un}</div>
    <div style={{ marginTop: 10, marginLeft: "auto", width: 220, height: 8, borderRadius: 4, background: "linear-gradient(90deg, rgba(255,255,255,.15), #fff)" }} />
    <div style={{ marginTop: 8, fontWeight: 800, fontSize: 24, color: "#94a3b8" }}>ZOOM ×10<sup>{zoom}</sup></div>
  </div>;
};

export const B8V2: React.FC = () => {
  const { t, w, W } = useBlock("b8"); const f = useCurrentFrame();
  // timeline
  const zA = w("tudo") - 0.15, zB = zA + 1.55, zC = zB + 0.35, zD = w("negativa") - 0.1, apA = w("quando") - 0.25, apB = w("eletrons", 1) - 0.35;
  const P1 = win(t, 3.0, zB + 0.15, 0.3), P2 = win(t, zB - 0.05, apA, 0.3), P3a = win(t, apA, apB, 0.3), P3 = win(t, apB, w("toque") - 0.8),
    P4 = win(t, w("toque") - 0.8, w("mesma") - 0.2), P5 = win(t, w("mesma") - 0.2, w("seja") - 0.4), P6 = win(t, w("seja") - 0.4, 999);

  /* --- P1: hand comes down and touches the table, then the camera dives into the contact point --- */
  const down = E(t, 3.2, w("imagina") + 0.4, Easing.inOut(Easing.cubic));
  const tipY = 0.07 + (1 - down) * 0.75;
  const dive = E(t, zA, zB, Easing.in(Easing.cubic));
  const DIR = new THREE.Vector3(1.2, 0.55, 3.4).normalize();
  const contact = new THREE.Vector3(0, 0.05, 0);
  const d1 = interpolate(t, [3.0, zA], [4.6, 3.6], cl) * Math.pow(0.06, dive);
  const cam1 = contact.clone().add(DIR.clone().multiplyScalar(d1)).add(new THREE.Vector3(-0.5 * (1 - dive), 0.9 * (1 - dive), 0));
  const tgt1 = new THREE.Vector3(-0.5 * (1 - dive), 0.62 * (1 - dive) + 0.05, 0);

  /* --- P2: atom lattice (skin above, wood below), dive to one atom --- */
  const lat = useMemo(() => { const R = rng(808); const pos: number[] = [], col: number[] = [];
    for (let L = 0; L < 2; L++) for (let r = 0; r < 4; r++) for (let ix = -11; ix <= 11; ix++) for (let iz = -7; iz <= 7; iz++) {
      if (L === 0 && r === 0 && ix === 0 && iz === 0) continue; // focus atom drawn in full detail
      const cx = ix * 1.15 + (r % 2) * 0.57, cy = L === 0 ? 0.62 + r * 1.15 : -0.62 - r * 1.15, cz = iz * 1.15 + (r % 2) * 0.57;
      const c = L === 0 ? [0.5, 0.75, 1] : [1, 0.68, 0.35];
      for (let k = 0; k < 70; k++) { const u = R() * 2 - 1, th = R() * 6.283, q = Math.sqrt(1 - u * u), d = 0.12 + Math.pow(R(), 0.6) * 0.36; pos.push(cx + q * Math.cos(th) * d, cy + u * d, cz + q * Math.sin(th) * d); const b = 0.25 + R() * 0.5; col.push(c[0] * b, c[1] * b, c[2] * b); }
      pos.push(cx, cy, cz); col.push(1.6, 1.2, 1.1); }
    return { pos: new Float32Array(pos), col: new Float32Array(col) }; }, []);
  const dive2 = E(t, zB, zD, Easing.out(Easing.cubic));
  const focus = new THREE.Vector3(0, 0.62, 0);
  const d2 = lerpExp(60, 2.4, dive2);
  const cam2 = focus.clone().add(DIR.clone().multiplyScalar(d2));
  const charge = E(t, w("negativa") - 0.3, w("negativa") + 0.4);
  // scale readout (log10 metres): 10 cm -> 0.1 nm
  const s = t < zB ? interpolate(t, [3.0, zA, zB], [-0.8, -1, -2.8], cl) : interpolate(dive2, [0, 1], [-4.2, -10], cl);
  const flash = interpolate(t, [zB - 0.25, zB, zB + 0.35], [0, 1, 0], cl);

  /* --- P3a: real hand approaching the table again (close-up) --- */
  const ap = E(t, apA + 0.1, w("mesa") + 0.3, Easing.inOut(Easing.cubic));
  const tip3 = 0.07 + 0.9 * (1 - ap) + 0.05;
  const field = E(t, w("mesa") - 0.2, w("mesa") + 0.6);
  const flash2 = interpolate(t, [apB - 0.2, apB, apB + 0.3], [0, 1, 0], cl);

  /* --- P3: atoms of skin vs table repel (unchanged idea, cleaner timing) --- */
  const desc = E(t, apB, w("repelem"), Easing.inOut(Easing.cubic));
  const sh = shakeAt(t, f, w("repelem"), 0.12);
  const mag = 1.1 + Math.sin(Math.min(1, E(t, w("ima"), w("empurrar") + 0.4)) * Math.PI / 2) * 1.0;
  const zoomIn = E(t, w("toque") - 0.6, w("bilionesimo"), Easing.inOut(Easing.cubic));
  const arcs = (y0: number, y1: number, n: number, on: number) => Array.from({ length: n }).map((_, i) => { const R = rng(i * 7 + Math.floor(f / 2));
    const x = -3.6 + i * (7.2 / (n - 1)); return Array.from({ length: 6 }).map((__, k) => { const y = y0 + (y1 - y0) * (k / 5); return <Glow key={`${i}-${k}`} pos={[x + (R() - 0.5) * 0.25, y, 0.4]} size={0.32} color="#a5f3fc" opacity={on * (0.5 + R() * 0.5)} />; }); });

  return (
    <AbsoluteFill>
      <Layer o={P1}>
        <Stage pos={add(cam1.toArray() as V3, hand(t, 0.4))} tgt={tgt1.toArray() as V3} fov={38} shadows post bloom={0.4}>
          <RealSet>
            <SoftShadow pos={[-0.35, 0.004, 0]} sx={1.4 + (1 - down) * 0.8} sz={0.9 + (1 - down) * 0.5} opacity={0.25 + 0.35 * down} />
            <Hand tipTo={[0, tipY, 0]} rot={HAND.rot} curl={HAND.curl} thumb={HAND.thumb} scale={10} />
          </RealSet>
        </Stage>
        <Title at={sec(3.2)} lines={["VOCÊ NUNCA TOCOU EM NADA", "(PELO MENOS NÃO DO JEITO QUE IMAGINA)"]} top={70} size={70} />
      </Layer>
      <Layer o={P2}>
        <Stage pos={cam2.toArray() as V3} tgt={focus.toArray() as V3} fov={42} bg="#03040c">
          <StarField n={2000} size={0.3} opacity={0.5} />
          <Points pos={lat.pos} col={lat.col} size={0.1} />
          <Atom3D pos={focus.toArray() as V3} t={t} r={0.5} seed={3} electrons={4} glow={0.4 + 0.6 * dive2} />
          {charge > 0 && Array.from({ length: 8 }).map((_, i) => { const a = i * 0.785 + t * 0.7; return <Glow key={i} pos={[Math.cos(a) * 0.62, 0.62 + Math.sin(a) * 0.62, 0.2]} size={0.28} color="#22d3ee" opacity={0.9 * charge} />; })}
          <Glow pos={[0, 0, 0]} size={8} color="#ffffff" opacity={0.05} />
        </Stage>
        <Title at={W("atomos") - 3} lines={["TUDO É FEITO DE ÁTOMOS"]} top={70} size={84} />
        {charge > 0 && <div style={{ position: "absolute", left: 0, right: 0, top: 420, display: "flex", justifyContent: "center", gap: 520, opacity: charge, fontFamily: F, fontWeight: 900, fontSize: 120, color: "#22D3EE", textShadow: "0 0 40px #22D3EE" }}><span>−</span><span>−</span></div>}
        <Tag at={W("negativa") - 4} color="#22D3EE">ELÉTRONS POR FORA: CARGA NEGATIVA (−)</Tag>
      </Layer>
      <ScaleHUD s={s} o={Math.min(P1 * E(t, zA - 0.3, zA), 1) + P2} />
      <Layer o={P3a}>
        <Stage pos={add([2.5 + Math.sin(t * 0.3) * 0.15, 1.15, 2.7], hand(t, 0.4))} tgt={[-0.3, 0.72, 0]} fov={36} shadows post bloom={0.5}>
          <RealSet>
            <SoftShadow pos={[-0.25, 0.004, 0]} sx={1.2} sz={0.8} opacity={0.25 + 0.3 * ap} />
            <Hand tipTo={[0, tip3, 0]} rot={HAND.rot} curl={HAND.curl} thumb={HAND.thumb} scale={10} />
            {field > 0 && <>
              {Array.from({ length: 9 }).map((_, i) => { const y = 0.01 + (tip3 - 0.08) * (i / 8); return <Glow key={i} pos={[0, y, 0]} size={0.16 + 0.04 * Math.sin(f / 2 + i)} color="#7dd3fc" opacity={field * 0.8} />; })}
              <Glow pos={[0, 0.02, 0]} size={0.9} color="#38bdf8" opacity={field * 0.55} />
            </>}
          </RealSet>
        </Stage>
        <Title at={W("quando") - 3} lines={["QUANDO SUA MÃO", "CHEGA PERTO DA MESA…"]} top={70} size={80} />
      </Layer>
      <Layer o={P3}>
        <Stage pos={[6.5 + sh[0], 0.6 + sh[1], 7]} tgt={[0, 0.2, 0]} fov={42}>
          <StarField n={4000} size={0.4} /><ambientLight intensity={0.5} /><pointLight position={[0, 4, 4]} intensity={60} />
          <Lattice y={-1.2} t={t} color={[0.95, 0.7, 0.35]} seed={20} rows={1} />
          <Lattice y={3.2 - desc * 2.9} t={t} color={[0.45, 0.8, 1]} seed={40} rows={1} />
          {arcs(-0.7, 0.0 + (1 - desc) * 2.9, 7, E(t, w("repelem") - 0.2, w("repelem") + 0.2))}
        </Stage>
        <Label at={W("pele") - 4} x={130} y={330} color="#7DD3FC">ÁTOMOS DA SUA PELE</Label>
        <Label at={W("mesa", 1) - 4} x={130} y={740} color="#FDBA74">ÁTOMOS DA MESA</Label>
        <Title at={W("repelem") - 4} lines={["SE REPELEM COM", "FORÇA ENORME"]} top={70} size={84} color2="#22D3EE" />
      </Layer>
      <Layer o={P4}>
        <Stage pos={[0, 0, 7 - zoomIn * 4.6]} tgt={[0, 0, 0]} fov={42}>
          <StarField n={3000} size={0.35} /><ambientLight intensity={0.5} /><pointLight position={[0, 3, 4]} intensity={50} />
          <Atom3D pos={[0, 1.2, 0]} t={t} r={1} seed={5} /><Atom3D pos={[0, -1.2, 0]} t={t} r={1} seed={6} cloud={[0.95, 0.7, 0.35]} />
          {Array.from({ length: 10 }).map((_, i) => <Glow key={i} pos={[(i - 4.5) * 0.18, 0, 0.6]} size={0.25} color="#a5f3fc" opacity={0.4 + 0.4 * Math.sin(f / 3 + i)} />)}
        </Stage>
        <Title at={W("toque") - 4} lines={["O \"TOQUE\" É", "REPULSÃO ELÉTRICA"]} top={70} size={86} />
        <Tag at={W("bilionesimo") - 4}>A MENOS DE 1 BILIONÉSIMO DE METRO</Tag>
      </Layer>
      <Layer o={P5}>
        <Stage pos={[0, 1.2, 8]} tgt={[0, 0, 0]} fov={42}>
          <StarField n={3000} size={0.35} /><ambientLight intensity={0.6} /><directionalLight position={[3, 4, 5]} intensity={2.2} />
          {[-1, 1].map((sg) => <group key={sg} position={[sg * mag, 0, 0]} rotation={[0.2, sg * 0.3, 0]}>
            <mesh position={[sg * -0.55, 0, 0]}><boxGeometry args={[1.1, 0.8, 0.8]} /><meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.4} /></mesh>
            <mesh position={[sg * 0.55, 0, 0]}><boxGeometry args={[1.1, 0.8, 0.8]} /><meshStandardMaterial color="#2563eb" roughness={0.3} metalness={0.4} /></mesh></group>)}
          {Array.from({ length: 8 }).map((_, i) => { const y = (i - 3.5) * 0.28; const bend = 0.6 + Math.abs(y); return Array.from({ length: 10 }).map((__, k) => { const x = (k / 9 - 0.5) * 2 * (mag - 0.1); return <Glow key={`${i}-${k}`} pos={[x, y * (1 + bend * (1 - Math.abs(x) / mag) * 0.6), 0.5]} size={0.16} color="#fbbf24" opacity={0.6} />; }); })}
        </Stage>
        <Title at={W("mesma") - 3} lines={["A MESMA FORÇA", "QUE EMPURRA ÍMÃS"]} top={70} size={86} />
        <Tag at={W("objetos") - 4} color="#F87171">SEM ELA, NADA SERIA SÓLIDO</Tag>
      </Layer>
      <Layer o={P6}>
        <Stage pos={add([3.2 * Math.cos((t - w("cadeira")) * 0.08) , 1.4, 5.2], hand(t, 0.5))} tgt={[0, 0.0, 0]} fov={40} shadows post bloom={0.5}>
          <Env file="royal_esplanade_1k.hdr" intensity={0.8} bgIntensity={0.7} rot={2.2} blur={0.05} />
          <Rig key_={[2.5, 4, 3]} keyColor="#ffe2c0" keyI={1.6} rim={[-2.5, 2.5, -4]} rimColor="#9ec5ff" rimI={3} fillI={0.2} target={[0, -0.5, 0]} area={2.5} catcher={0} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow><planeGeometry args={[30, 30]} /><shadowMaterial opacity={0.5} transparent /></mesh>
          <Chair pos={[0, -1, -0.05]} rot={[0, 0, 0]} scale={1.65} />
          <HoloBody color="#7dd3fc" seated pos={[0, -0.04 + Math.max(0, Math.sin(t * 1.6)) * 0.012, 0.1]} scale={0.62} />
          <mesh position={[0, -0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.2, 1.1]} /><meshBasicMaterial color="#fbbf24" transparent opacity={0.25 + 0.15 * Math.sin(f / 4)} toneMapped={false} /></mesh>
        </Stage>
        <Title at={W("cadeira") - 4} lines={["TECNICAMENTE, VOCÊ", "ESTÁ FLUTUANDO"]} top={70} size={86} />
        <Tag at={W("zero") - 6}>A DISTÂNCIA NUNCA CHEGA A ZERO</Tag>
      </Layer>
      {(flash > 0.01 || flash2 > 0.01) && <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, #ffffff, #a5f3fc 40%, rgba(0,0,0,0) 80%)", opacity: Math.max(flash, flash2) * 0.85, mixBlendMode: "screen" }} />}
      <Sfx at={sec(3)} src="v3/lobby.mp3" vol={0.16} dur={Math.max(1, sec(zA) - sec(3))} />
      <Sfx at={sec(w("imagina") + 0.3)} src="v3/tap.mp3" vol={0.35} dur={45} />
      <Sfx at={sec(zA) - 10} src="v3/whoosh_space.mp3" vol={0.24} dur={90} />
      <Sfx at={sec(zB) - 4} src="v3/micro.mp3" vol={0.18} dur={240} />
      <Sfx at={sec(apB) - 6} src="v3/lobby.mp3" vol={0.14} dur={300} />
      <Sfx at={W("repelem") - 6} src="v3/hum.mp3" vol={0.22} dur={150} />
      <Sfx at={W("ima") - 4} src="v3/magnet.mp3" vol={0.3} dur={90} />
      <Sfx at={W("cadeira") - 10} src="v3/chair.mp3" vol={0.26} dur={120} />
      <Sfx at={W("flutuando") - 6} src="v3/shimmer.mp3" vol={0.2} dur={100} />
    </AbsoluteFill>
  );
};
