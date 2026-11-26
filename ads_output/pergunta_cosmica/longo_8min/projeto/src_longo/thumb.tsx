import React from "react";
import { AbsoluteFill } from "remotion";
import { Stage, StarField, Glow, Nebula, V3 } from "./hd";
import { EarthHD, latLon, faceSpin } from "./hd3d";
import { WoodTable, Hand, SoftShadow } from "./touch";
import { Env, Rig, Human } from "./real";
import { AssetGate, COMMON_ASSETS } from "./assets";
import { useFonts } from "./core";
import { F } from "./b2hd";
import * as THREE from "three";

const HAND = { rot: [0, 0.35, Math.PI / 2 - 0.75] as V3, curl: [0.15, 1.45, 1.55, 1.6], thumb: 0.9 };
const stroke = (w: number, c = "#000") => ({ WebkitTextStroke: `${w}px ${c}`, paintOrder: "stroke fill" as any, textShadow: `0 ${w}px ${w * 3}px rgba(0,0,0,.85)` });

const Words: React.FC<{ lines: { t: string; c: string; s: number }[]; right: number; top: number; align?: "right" | "left" }> = ({ lines, right, top, align = "right" }) => (
  <div style={{ position: "absolute", right, top, textAlign: align, fontFamily: F, fontWeight: 900, lineHeight: 0.92, letterSpacing: "-0.03em" }}>
    {lines.map((l, i) => <div key={i} style={{ fontSize: l.s, color: l.c, ...stroke(Math.round(l.s / 12)) }}>{l.t}</div>)}
  </div>
);

export const Thumb: React.FC<{ v: number }> = ({ v }) => {
  useFonts();
  const BR = latLon(-15, -47, 1.7);
  return <AbsoluteFill style={{ background: "#000" }}><AssetGate files={COMMON_ASSETS}>
    {v === 0 && <>
      <Stage pos={[1.05, 0.42, 1.25]} tgt={[-0.42, 0.3, 0.05]} fov={30}>
        <Env file="venice_sunset_1k.hdr" intensity={0.6} bgIntensity={0.35} rot={1.4} blur={0.2} />
        <Rig key_={[0.6, 4, 1.2]} keyColor="#fff0dc" keyI={2.6} rim={[-2.5, 1.2, -2]} rimColor="#66d9ff" rimI={6} fillColor="#ffe8d0" fillI={0.6} target={[0, 0.2, 0]} area={1.5} catcher={0} />
        <WoodTable y={0} size={[16, 14]} />
        <SoftShadow pos={[-0.3, 0.003, 0.05]} sx={1.1} sz={0.6} opacity={0.5} />
        <Hand tipTo={[0, 0.06, 0]} rot={HAND.rot} curl={HAND.curl} thumb={HAND.thumb} scale={10} />
        {Array.from({ length: 6 }).map((_, i) => <Glow key={i} pos={[0, 0.008 + i * 0.009, 0]} size={0.16} color="#38bdf8" opacity={1} />)}
        <Glow pos={[0, 0.03, 0]} size={0.5} color="#0ea5e9" opacity={0.8} />
        <Glow pos={[0, 0.03, 0]} size={0.18} color="#ffffff" opacity={0.9} />
      </Stage>
      {/* red circle + arrow on the gap */}
      <svg width="1280" height="720" style={{ position: "absolute", left: 0, top: 0 }}>
        <ellipse cx="908" cy="622" rx="70" ry="46" fill="none" stroke="#ff2a2a" strokeWidth="11" />
        <path d="M 430 662 Q 640 690 812 640" fill="none" stroke="#ff2a2a" strokeWidth="13" strokeLinecap="round" />
        <path d="M 838 628 L 806 660 L 798 624 Z" fill="#ff2a2a" />
      </svg>
      <div style={{ position: "absolute", left: 30, top: 630, fontFamily: F, fontWeight: 900, fontSize: 44, color: "#7dd3fc", ...stroke(5) }}>0,000000001 m</div>
      <Words right={40} top={70} lines={[{ t: "VOCÊ", c: "#ffffff", s: 96 }, { t: "NUNCA", c: "#ffffff", s: 96 }, { t: "TOCOU", c: "#FFD23F", s: 150 }, { t: "EM NADA", c: "#ffffff", s: 96 }]} />
    </>}
    {v === 1 && <>
      <Stage pos={[0.26, 1.83, 0.3]} tgt={[0.05, 1.79, -0.02]} fov={42} bg="#02040a">
        <StarField n={7000} size={0.6} /><Nebula seed={40} colors={["#0891b2", "#7c3aed"]} z={-40} opacity={0.55} />
        <ambientLight intensity={0.3} /><directionalLight position={[3, 4, 4]} intensity={3.4} color="#fff1dc" /><directionalLight position={[-2, 3, -4]} intensity={6} color="#7fb6ff" />
        <group quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(...BR).applyAxisAngle(new THREE.Vector3(0, 1, 0), faceSpin(BR)).normalize(), new THREE.Vector3(0, 1, 0))}>
          <EarthHD r={1.7} spin={faceSpin(BR)} tilt={0} tex="longo/earth_atmos_2048.jpg" />
        </group>
        <Human pos={[0, 1.705, 0]} scale={0.09} rot={[0, 0.75, 0]} time={0.4} anim="walk" look={0.35} />
      </Stage>
      <Words right={40} top={60} lines={[{ t: "VOCÊ ESTÁ A", c: "#ffffff", s: 70 }, { t: "1.600", c: "#FFD23F", s: 190 }, { t: "KM/H", c: "#FFD23F", s: 120 }, { t: "AGORA", c: "#ffffff", s: 90 }]} />
    </>}
  </AssetGate></AbsoluteFill>;
};
