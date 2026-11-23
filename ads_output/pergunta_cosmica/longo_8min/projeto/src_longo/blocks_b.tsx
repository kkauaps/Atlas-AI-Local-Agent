import React from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, random, staticFile } from "remotion";
import { useLoader } from "@react-three/fiber";
import { theme } from "./theme";
import { useBlock, sec, Sfx } from "./core";
import { Canvas3D, Stars, Glow, V3 } from "./three";
import { Rise, Pill, useAbsSpring } from "./ui";
import { BgMesh } from "./components/Layers";
import { cl } from "./cl";

const S: React.CSSProperties = { fontFamily: theme.fonts.display, fontWeight: 900 };
const H: React.CSSProperties = { fontFamily: theme.fonts.display, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.0, color: "#fff", textShadow: "0 8px 30px rgba(0,0,0,.85)" };
const eio = Easing.bezier(0.65, 0, 0.35, 1);
const win = (t: number, a: number, b: number, fade = 0.35) => { const fd = Math.max(0.02, Math.min(fade, (b - a) / 2.2)); if (b - a < 0.08) return 0; return interpolate(t, [a - fd, a, b - fd, b], [0, 1, 1, 0], cl); };
const Fade: React.FC<{ o: number; children: React.ReactNode }> = ({ o, children }) => o > 0.003 ? <AbsoluteFill style={{ opacity: o, transform: `scale(${1 + (1 - o) * 0.06})` }}>{children}</AbsoluteFill> : null;
const Top: React.FC<{ children: React.ReactNode }> = ({ children }) => <AbsoluteFill style={{ top: 70, alignItems: "center" }}>{children}</AbsoluteFill>;
const Bottom: React.FC<{ children: React.ReactNode }> = ({ children }) => <div style={{ position: "absolute", left: 0, right: 0, bottom: 200, display: "flex", justifyContent: "center" }}>{children}</div>;

const Planet: React.FC<{ tex: string; pos: V3; r: number; spin: number }> = ({ tex, pos, r, spin }) => {
  const [m] = useLoader(THREE.TextureLoader, [staticFile(tex)]);
  return <mesh position={pos} rotation={[0.3, spin, 0]}><sphereGeometry args={[r, 64, 64]} /><meshStandardMaterial map={m} roughness={0.9} /></mesh>;
};
const SunBall: React.FC<{ pos: V3; r: number; t: number }> = ({ pos, r, t }) => {
  const [m] = useLoader(THREE.TextureLoader, [staticFile("longo/sun.jpg")]);
  return <group position={pos}><mesh rotation={[0, t * 0.1, 0]}><sphereGeometry args={[r, 64, 64]} /><meshBasicMaterial map={m} /></mesh><Glow pos={[0, 0, 0]} size={r * 4.5} color="#fbbf24" /><Glow pos={[0, 0, 0]} size={r * 8} color="#f59e0b" opacity={0.35} /></group>;
};
const Photon: React.FC<{ a: V3; b: V3; p: number; color?: string }> = ({ a, b, p, color = "#fff7d6" }) => {
  if (p <= 0 || p >= 1) return null;
  const pos = new THREE.Vector3(...a).lerp(new THREE.Vector3(...b), p).toArray() as V3;
  const tail = new THREE.Vector3(...a).lerp(new THREE.Vector3(...b), Math.max(0, p - 0.08)).toArray() as V3;
  return <><Glow pos={pos} size={0.5} color={color} /><Glow pos={tail} size={0.3} color={color} opacity={0.5} /><mesh position={pos}><sphereGeometry args={[0.05, 12, 12]} /><meshBasicMaterial color="#fff" /></mesh></>;
};
const Timer: React.FC<{ txt: string; label: string; color?: string }> = ({ txt, label, color = theme.colors.primary }) => (
  <div style={{ padding: "14px 30px", borderRadius: 22, background: "rgba(0,0,0,.55)", border: `3px solid ${color}`, textAlign: "center" }}>
    <div style={{ ...S, fontSize: 26, color: theme.colors.textDim }}>{label}</div>
    <div style={{ ...S, fontSize: 64, color, fontVariantNumeric: "tabular-nums" }}>{txt}</div>
  </div>
);

/* ================= #7 SEEING THE PAST ================= */
export const B7: React.FC = () => {
  const { t, w, W } = useBlock("b7"); const f = useCurrentFrame();
  const L1 = win(t, 3.1, w("lua")), L2 = win(t, w("lua"), w("sol")), L3 = win(t, w("sol"), w("estrelas") - 0.2), L4 = win(t, w("estrelas") - 0.2, w("pessoa") - 0.2), L5 = win(t, w("pessoa") - 0.2, w("astronomos") - 0.2), L6 = win(t, w("astronomos") - 0.2, w("olhar") - 0.2), L7 = win(t, w("olhar") - 0.2, 999);
  const pm = interpolate(t, [w("lua") + 0.2, w("lua") + 2.2], [0, 1], cl);
  const ps = interpolate(t, [w("sol") + 0.1, w("estrelas") - 0.5], [0, 1], cl);
  const sunSec = Math.round(ps * 500);
  const boom = interpolate(t, [w("explodisse") - 0.1, w("explodisse") + 0.8], [0, 1], { ...cl, easing: Easing.out(Easing.cubic) });
  const pp = (t - w("pessoa")) % 1.2 / 1.2;
  const deep = interpolate(t, [w("astronomos"), w("olhar")], [0, 1], cl);
  return (
    <AbsoluteFill>
      <Fade o={L1}>
        <BgMesh a="#1e3a8a" b="#FBBF24" base={theme.colors.bg} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 5 }).map((_, i) => { const x = ((f * 38 + i * 420) % 2400) - 240; const y = 380 + i * 80; return <g key={i}><line x1={x - 380} y1={y} x2={x} y2={y} stroke="url(#lg)" strokeWidth={8} strokeLinecap="round" /><circle cx={x} cy={y} r={12} fill="#fff" /></g>; })}
          <defs><linearGradient id="lg"><stop offset="0" stopColor="rgba(251,191,36,0)" /><stop offset="1" stopColor="#FBBF24" /></linearGradient></defs>
        </svg>
        <Top><Rise at={W("luz") - 4} start={0}><div style={{ ...H, fontSize: 66 }}>A LUZ LEVA TEMPO PRA VIAJAR</div></Rise></Top>
        <Bottom><Rise at={W("viajar") - 2} start={0}><Pill bg={theme.colors.primary} size={38} glow>~300.000 km POR SEGUNDO</Pill></Rise></Bottom>
      </Fade>
      <Fade o={L2}>
        <Canvas3D pos={[0, 0.6, 9]} tgt={[0, 0, 0]} fov={40}>
          <Stars />
          <ambientLight intensity={0.3} /><directionalLight position={[-5, 2, 5]} intensity={2.4} />
          <Planet tex="longo/earth_real.jpg" pos={[-3.6, 0, 0]} r={1.2} spin={t * 0.2} />
          <Planet tex="longo/moon.jpg" pos={[3.6, 0, 0]} r={0.33} spin={t * 0.1} />
          <Photon a={[3.2, 0, 0]} b={[-2.4, 0, 0]} p={pm} />
        </Canvas3D>
        <Top><Rise at={W("lua") - 4} start={0}><div style={{ ...H, fontSize: 62 }}>LUZ DA LUA → VOCÊ</div></Rise></Top>
        <Bottom><Timer txt={`${(pm * 1.3).toFixed(1).replace(".", ",")} s`} label="ATRASO" /></Bottom>
      </Fade>
      <Fade o={L3}>
        <Canvas3D pos={[0, 0.4, 10]} tgt={[0, 0, 0]} fov={40}>
          <Stars />
          <ambientLight intensity={0.15} /><pointLight position={[-4.5, 0, 0]} intensity={120} decay={1.4} color="#fff1d6" />
          <SunBall pos={[-4.5, 0, 0]} r={1.4} t={t} />
          <Planet tex="longo/earth_real.jpg" pos={[4.4, 0, 0]} r={0.35} spin={t * 0.2} />
          <Photon a={[-3, 0, 0]} b={[4, 0, 0]} p={ps} />
        </Canvas3D>
        <Top><Rise at={W("sol") - 4} start={0}><div style={{ ...H, fontSize: 62 }}>LUZ DO SOL → VOCÊ</div></Rise></Top>
        <Bottom><Timer txt={`${Math.floor(sunSec / 60)} min ${String(sunSec % 60).padStart(2, "0")} s`} label="ATRASO" /></Bottom>
      </Fade>
      <Fade o={L4}>
        <Canvas3D pos={[0, 0, 8 - (t - w("estrelas")) * 0.4]} tgt={[0, 0, -10]} fov={55}>
          <Stars n={3500} size={0.22} />
          <Glow pos={[2.2, 1.2, -6]} size={1.4 + boom * 6} color={boom > 0 ? "#ffffff" : "#fde68a"} opacity={1 - boom * 0.3} />
          <Glow pos={[2.2, 1.2, -6]} size={boom * 12} color="#f97316" opacity={boom * (1 - boom) * 2} />
        </Canvas3D>
        <Top><Rise at={W("estrelas") - 4} start={0}><div style={{ ...H, fontSize: 60 }}>A LUZ DAS ESTRELAS É ANTIGA</div></Rise></Top>
        <div style={{ position: "absolute", left: 1240, top: 300 }}><Rise at={W("centenas") - 4} start={0}><Pill bg="#fff" size={32}>LUZ QUE SAIU HÁ SÉCULOS</Pill></Rise></div>
        <Bottom><Rise at={W("seculos") - 6} start={0} cfg={theme.spring.bouncy}><Pill bg="#F97316" size={36}>SE EXPLODISSE HOJE: SÓ VERÍAMOS DAQUI A SÉCULOS</Pill></Rise></Bottom>
      </Fade>
      <Fade o={L5}>
        <BgMesh a="#4c1d95" b="#22D3EE" base={theme.colors.bg} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {[[560, 1], [1360, -1]].map(([x, d], i) => <g key={i} transform={`translate(${x} 560) scale(${d} 1)`}><circle cx={0} cy={-170} r={70} fill="#E9C3A1" /><rect x={-80} y={-95} width={160} height={260} rx={70} fill={i ? "#A78BFA" : "#22D3EE"} /><circle cx={30} cy={-180} r={8} fill="#111" /></g>)}
          {Array.from({ length: 6 }).map((_, i) => { const p = (pp + i / 6) % 1; return <circle key={i} cx={1290 - p * 660} cy={400 + Math.sin(i) * 20} r={10} fill="#FDE68A" opacity={1 - p * 0.6} />; })}
        </svg>
        <Top><Rise at={W("pessoa") - 4} start={0}><div style={{ ...H, fontSize: 60 }}>ATÉ QUEM ESTÁ NA SUA FRENTE</div></Rise></Top>
        <Bottom><Rise at={W("bilionesimos") - 4} start={0}><Pill bg={theme.colors.primary} size={36} glow>~0,000000003 s DE ATRASO</Pill></Rise></Bottom>
      </Fade>
      <Fade o={L6}>
        <Canvas3D pos={[0, 0, 6 - deep * 4]} tgt={[0, 0, -20]} fov={55}>
          <Stars n={1200} />
          {Array.from({ length: 140 }).map((_, i) => { const p: V3 = [(random(`gx${i}`) - 0.5) * 14, (random(`gy${i}`) - 0.5) * 8, -2 - random(`gz${i}`) * 26];
            return <group key={i} position={p} rotation={[random(`r${i}`) * 3, random(`s${i}`) * 3, 0]}><mesh scale={[1, 0.35, 1]}><sphereGeometry args={[0.12 + random(`gs${i}`) * 0.2, 12, 8]} /><meshBasicMaterial color={["#fde68a", "#fca5a5", "#c4b5fd", "#93c5fd"][i % 4]} transparent opacity={0.85} /></mesh><Glow pos={[0, 0, 0]} size={0.6} color={["#fde68a", "#fca5a5", "#c4b5fd", "#93c5fd"][i % 4]} opacity={0.5} /></group>; })}
        </Canvas3D>
        <div style={{ position: "absolute", left: 90, top: 260 }}><Rise at={W("webb") - 6} start={0}>
          <svg width="220" height="200" viewBox="0 0 220 200">{[[110, 40], [70, 64], [150, 64], [70, 112], [150, 112], [110, 136], [110, 88]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 24} l21 12 v24 l-21 12 l-21 -12 v-24Z`} fill="#E3B341" stroke="#8a6416" strokeWidth={2} />)}</svg>
          <div style={{ ...S, fontSize: 32, color: theme.colors.primary }}>JAMES WEBB</div></Rise></div>
        <Top><Rise at={W("astronomos") - 4} start={0}><div style={{ ...H, fontSize: 56 }}>MAIS LONGE = MAIS ANTIGO</div></Rise></Top>
        <Bottom><Rise at={W("treze") - 4} start={0} cfg={theme.spring.bouncy}><Pill bg={theme.colors.primary} size={36} glow>GALÁXIAS DE +13 BILHÕES DE ANOS ATRÁS</Pill></Rise></Bottom>
      </Fade>
      <Fade o={L7}>
        <Canvas3D pos={[0, 0, 6]} tgt={[0, 2, -10]} fov={60}><Stars n={4000} size={0.25} /></Canvas3D>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <path d="M0 900 Q 480 820 960 880 T 1920 860 L1920 1080 L0 1080Z" fill="#05060d" />
          <g transform="translate(960 830)"><circle cx={0} cy={-150} r={40} fill="#05060d" /><path d="M-50 -110 h100 l20 120 h-140Z" fill="#05060d" /><rect x={-40} y={0} width={30} height={80} fill="#05060d" /><rect x={10} y={0} width={30} height={80} fill="#05060d" /></g>
        </svg>
        <Top><Rise at={W("olhar") - 3} start={0}><div style={{ ...H, fontSize: 64 }}>OLHAR PRO CÉU</div><div style={{ ...H, fontSize: 64, color: theme.colors.primary }}>É OLHAR PRO PASSADO</div></Rise></Top>
      </Fade>
      <Sfx at={W("lua") - 3} src="swoosh.wav" vol={0.18} />
      <Sfx at={W("sol") - 3} src="swoosh.wav" vol={0.18} />
      <Sfx at={W("explodisse") - 2} src="impact.wav" vol={0.25} />
      <Sfx at={W("webb") - 4} src="sparkle.wav" vol={0.18} />
      <Sfx at={W("olhar") - 4} src="sparkle.wav" vol={0.2} />
    </AbsoluteFill>
  );
};

/* ================= #6 FASTER THAN A PLANE ================= */
export const B6: React.FC = () => {
  const { t, w, W } = useBlock("b6"); const f = useCurrentFrame();
  const M1 = win(t, 3.1, w("terra")), M2 = win(t, w("terra"), w("ao")), M3 = win(t, w("ao"), w("sistema")), M4 = win(t, w("sistema"), w("sente") - 0.8), M5 = win(t, w("sente") - 0.8, w("galileu") - 0.2), M6 = win(t, w("galileu") - 0.2, w("incomoda") - 0.4), M7 = win(t, w("incomoda") - 0.4, 999);
  const cnt = (a: number, b: number, to: number) => Math.round(interpolate(t, [a, b], [0, to], { ...cl, easing: Easing.out(Easing.cubic) })).toLocaleString("pt-BR");
  const brake = interpolate(t, [w("freada") - 0.6, w("freada") + 0.2], [0, 1], cl);
  return (
    <AbsoluteFill>
      <Fade o={M1}>
        <BgMesh a="#0e7490" b="#FBBF24" base={theme.colors.bg} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(${((f * 9) % 2400) - 300} 420)`}><path d="M0 0 L160 -12 Q190 0 160 12 L0 10Z" fill="#E5E7EB" /><path d="M70 -6 L30 -70 L60 -70 L110 -6Z" fill="#CBD5E1" /><path d="M70 8 L30 72 L60 72 L110 8Z" fill="#CBD5E1" /><path d="M8 -4 L-10 -40 L8 -40 L24 -4Z" fill="#CBD5E1" /></g>
          <text x={500} y={560} fontFamily="Montserrat" fontWeight={900} fontSize={44} fill="#CBD5E1">AVIÃO: ~900 km/h</text>
          <text x={500} y={660} fontFamily="Montserrat" fontWeight={900} fontSize={60} fill={theme.colors.primary}>VOCÊ, AGORA: +1.500 km/h</text>
        </svg>
        <Top><Rise at={sec(3.2)} start={0}><div style={{ ...H, fontSize: 60 }}>VOCÊ ESTÁ EM ALTA VELOCIDADE</div></Rise></Top>
      </Fade>
      <Fade o={M2}>
        <Canvas3D pos={[0, 0.3, 4.4]} tgt={[0, 0, 0]} fov={40}>
          <Stars /><ambientLight intensity={0.35} /><directionalLight position={[3, 2, 5]} intensity={2.4} />
          <group rotation={[0.26, 0, 0]}><Planet tex="longo/earth_real.jpg" pos={[0, 0, 0]} r={1.3} spin={-1.6 + t * 0.6} /></group>
        </Canvas3D>
        <Top><Rise at={W("gira") - 4} start={0}><div style={{ ...H, fontSize: 60 }}>A TERRA GIRA</div></Rise></Top>
        <div style={{ position: "absolute", right: 120, top: 420 }}><Timer txt={`${cnt(w("brasil"), w("hora"), 1500)} km/h`} label="NO BRASIL" /></div>
      </Fade>
      <Fade o={M3}>
        <Canvas3D pos={[0, 5.5, 8]} tgt={[0, 0, 0]} fov={42}>
          <Stars /><ambientLight intensity={0.2} /><pointLight position={[0, 0, 0]} intensity={150} decay={1.4} />
          <SunBall pos={[0, 0, 0]} r={0.9} t={t} />
          <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[3.98, 4.02, 160]} /><meshBasicMaterial color="#fff" transparent opacity={0.25} side={THREE.DoubleSide} /></mesh>
          {(() => { const a = t * 0.7; return <Planet tex="longo/earth_real.jpg" pos={[Math.cos(a) * 4, 0, Math.sin(a) * 4]} r={0.32} spin={t} />; })()}
          {Array.from({ length: 24 }).map((_, i) => { const a = t * 0.7 - i * 0.04; return <mesh key={i} position={[Math.cos(a) * 4, 0, Math.sin(a) * 4]}><sphereGeometry args={[0.05 * (1 - i / 24), 8, 8]} /><meshBasicMaterial color="#22D3EE" transparent opacity={1 - i / 24} /></mesh>; })}
        </Canvas3D>
        <Top><Rise at={W("ao") - 3} start={0}><div style={{ ...H, fontSize: 60 }}>EM VOLTA DO SOL</div></Rise></Top>
        <div style={{ position: "absolute", right: 120, top: 420 }}><Timer txt={`${cnt(w("ao"), w("hora", 1), 107000)} km/h`} label="ÓRBITA DA TERRA" color="#22D3EE" /></div>
      </Fade>
      <Fade o={M4}>
        <Canvas3D pos={[0, 4.5, 5.5]} tgt={[0, 0, 0]} fov={50}>
          <Stars n={1500} />
          {Array.from({ length: 1100 }).map((_, i) => { const arm = i % 2; const rr = 0.25 + (i / 1100) * 3.6; const a = rr * 1.4 + arm * Math.PI + t * 0.12 + (random(`g${i}`) - 0.5) * 0.6;
            return <mesh key={i} position={[Math.cos(a) * rr, (random(`h${i}`) - 0.5) * 0.12, Math.sin(a) * rr]}><sphereGeometry args={[0.018, 4, 4]} /><meshBasicMaterial color={rr < 0.9 ? "#fde68a" : i % 4 ? "#c4b5fd" : "#93c5fd"} /></mesh>; })}
          <Glow pos={[0, 0, 0]} size={2.6} color="#fde68a" />
          {(() => { const a = 2.2 * 1.4 + t * 0.12 + 0.2; const p: V3 = [Math.cos(a) * 2.2, 0.05, Math.sin(a) * 2.2]; return <><Glow pos={p} size={0.5} color="#FBBF24" opacity={0.8 + 0.2 * Math.sin(f / 4)} /><mesh position={p}><sphereGeometry args={[0.05, 12, 12]} /><meshBasicMaterial color="#fff" /></mesh></>; })()}
        </Canvas3D>
        <Top><Rise at={W("sistema") - 3} start={0}><div style={{ ...H, fontSize: 56 }}>E O SISTEMA SOLAR, NA GALÁXIA</div></Rise></Top>
        <div style={{ position: "absolute", right: 120, top: 420 }}><Timer txt={`${cnt(w("sistema"), w("hora", 2), 800000)}+ km/h`} label="EM VOLTA DA VIA LÁCTEA" color={theme.colors.accent} /></div>
        <div style={{ position: "absolute", left: 1010, top: 560 }}><Pill bg="#FBBF24" size={26}>VOCÊ ESTÁ AQUI</Pill></div>
      </Fade>
      <Fade o={M5}>
        <BgMesh a="#14532d" b="#22D3EE" base={theme.colors.bg} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <rect x={0} y={760} width={1920} height={320} fill="#1f2937" />
          {[300, 700, 1300, 1600].map((x, i) => <rect key={i} x={x} y={420 + (i % 2) * 80} width={180} height={340 - (i % 2) * 80} fill="#334155" />)}
          <g transform="translate(960 600)"><circle cx={0} cy={-130} r={50} fill="#E9C3A1" /><rect x={-55} y={-80} width={110} height={180} rx={45} fill="#22D3EE" /><rect x={-45} y={95} width={35} height={70} fill="#1e3a8a" /><rect x={10} y={95} width={35} height={70} fill="#1e3a8a" /></g>
          {[200, 560, 960, 1360, 1720].map((x, i) => <path key={i} d={`M${x - 60} ${860 + (i % 2) * 70} h120 l-22 -16 m22 16 l-22 16`} stroke="#FBBF24" strokeWidth={8} fill="none" strokeLinecap="round" />)}
        </svg>
        <Top><Rise at={W("sente") - 4} start={0}><div style={{ ...H, fontSize: 60 }}>POR QUE VOCÊ NÃO SENTE?</div></Rise></Top>
        <div style={{ position: "absolute", left: 1200, top: 250 }}><Rise at={W("junto") - 4} start={0}><Pill bg={theme.colors.primary} size={32}>TUDO SE MOVE JUNTO</Pill></Rise></div>
        <Bottom><Rise at={W("percebe") - 4} start={0} cfg={theme.spring.bouncy}><Pill bg="#fff" size={36}>O CORPO SÓ SENTE MUDANÇAS DE VELOCIDADE</Pill></Rise></Bottom>
      </Fade>
      <Fade o={M6}>
        <AbsoluteFill style={{ background: "linear-gradient(#0b2a4a, #071a33 60%, #052036)" }} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 5 }).map((_, i) => <path key={i} d={`M0 ${760 + i * 40} Q 240 ${740 + i * 40 + Math.sin(t * 2 + i) * 10} 480 ${760 + i * 40} T 960 ${760 + i * 40} T 1440 ${760 + i * 40} T 1920 ${760 + i * 40}`} stroke="rgba(147,197,253,.35)" strokeWidth={4} fill="none" transform={`translate(${-((f * 2 + i * 60) % 480)} 0)`} />)}
          <g transform={`translate(960 ${700 + Math.sin(t * 1.5) * 4})`}>
            <path d="M-420 0 L420 0 L340 110 L-340 110Z" fill="#7c2d12" /><rect x={-360} y={-200} width={720} height={200} rx={10} fill="#a16207" />
            <rect x={-330} y={-180} width={660} height={160} rx={8} fill="#fef3c7" />
            <circle cx={-150} cy={-120 + ((t * 120) % 90)} r={14} fill="#dc2626" /><g transform="translate(-200 -100)"><circle cx={0} cy={-25} r={20} fill="#E9C3A1" /><rect x={-20} y={-5} width={40} height={70} rx={14} fill="#1e3a8a" /></g>
            <ellipse cx={150} cy={-60} rx={60} ry={40} fill="rgba(56,189,248,.45)" stroke="#0369a1" strokeWidth={4} /><path d={`M${130 + Math.sin(t * 3) * 20} -60 l20 -8 v16Z`} fill="#f97316" />
            <rect x={-6} y={-460} width={12} height={260} fill="#78350f" /><path d="M6 -450 Q 200 -360 6 -230Z" fill="#f5f5f4" />
          </g>
        </svg>
        <Top><Rise at={W("galileu") - 3} start={0}><div style={{ ...H, fontSize: 60 }}>O NAVIO DE GALILEU · 1632</div></Rise></Top>
        <Bottom><Rise at={W("parado") - 4} start={0}><Pill bg="#fff" size={34}>LÁ DENTRO, NÃO DÁ PRA SABER SE ESTÁ PARADO OU ANDANDO</Pill></Rise></Bottom>
      </Fade>
      <Fade o={M7}>
        <BgMesh a="#7f1d1d" b="#FBBF24" base={theme.colors.bg} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <rect x={0} y={780} width={1920} height={300} fill="#1f2937" />{Array.from({ length: 8 }).map((_, i) => <rect key={i} x={((i * 280 - f * 20 * (1 - brake)) % 2240 + 2240) % 2240 - 160} y={900} width={140} height={14} fill="#FBBF24" />)}
          <g transform={`translate(860 ${640 + brake * 6})`}>
            <path d="M0 140 L0 60 Q 60 -10 200 -10 L360 -10 Q 440 0 470 70 L500 140Z" fill="#dc2626" /><rect x={180} y={10} width={150} height={60} rx={10} fill="#bae6fd" />
            <g transform={`rotate(${brake * 22} 250 120)`}><circle cx={250} cy={30} r={22} fill="#E9C3A1" /><rect x={232} y={50} width={36} height={60} rx={12} fill="#1e3a8a" /></g>
            <circle cx={110} cy={150} r={46} fill="#111" /><circle cx={400} cy={150} r={46} fill="#111" />
          </g>
        </svg>
        <Top><Rise at={W("incomoda") - 4} start={0}><div style={{ ...H, fontSize: 60 }}>SÓ INCOMODA QUANDO MUDA</div></Rise></Top>
        <Bottom><Rise at={W("freada") - 4} start={0} cfg={theme.spring.bouncy}><Pill bg={theme.colors.bad} size={40}>FREADA = MUDANÇA DE VELOCIDADE</Pill></Rise></Bottom>
      </Fade>
      <Sfx at={sec(3.3)} src="swoosh.wav" vol={0.2} />
      <Sfx at={W("gira") - 3} src="swoosh.wav" vol={0.18} />
      <Sfx at={W("sistema") - 3} src="impact.wav" vol={0.2} />
      <Sfx at={W("galileu") - 3} src="sparkle.wav" vol={0.18} />
      <Sfx at={W("freada") - 4} src="impact.wav" vol={0.22} />
    </AbsoluteFill>
  );
};
