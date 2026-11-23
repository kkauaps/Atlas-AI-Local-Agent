import React from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, random, Easing, Img, staticFile } from "remotion";
import { theme } from "./theme";
import { wordT, segT, sec } from "./time";
import { cl } from "./cl";
import { H, Rise, Pill, Title, useAbsSpring, Callout } from "./ui";
import { Canvas3D, Stars, Earth, Glow, project, screenRadius, V3 } from "./three";
import { BgMesh } from "./components/Layers";
import { Shine } from "./fx";

type P = { start: number };
const useT = (start: number) => { const f = useCurrentFrame(); const { fps } = useVideoConfig(); return (f + start) / fps; };
const F = (s: number) => sec(s);
const W = (seg: number, w: string, n = 0) => F(wordT(seg, w, n));
const eio = Easing.bezier(0.65, 0, 0.35, 1);
const S: React.CSSProperties = { fontFamily: theme.fonts.display, fontWeight: 900 };

/* clock face SVG */
const Clock: React.FC<{ size: number; sec: number; color?: string; label?: string }> = ({ size, sec: s, color = "#fff", label }) => {
  const a = (s / 60) * Math.PI * 2, m = (s / 3600) * Math.PI * 2;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} viewBox="-100 -100 200 200">
        <circle r="92" fill="rgba(255,255,255,0.06)" stroke={color} strokeWidth="6" />
        {Array.from({ length: 12 }).map((_, i) => <line key={i} x1="0" y1="-80" x2="0" y2={i % 3 ? "-72" : "-64"} stroke={color} strokeWidth={i % 3 ? 3 : 6} transform={`rotate(${i * 30})`} />)}
        <line x1="0" y1="0" x2={Math.sin(m) * 46} y2={-Math.cos(m) * 46} stroke={color} strokeWidth="8" strokeLinecap="round" />
        <line x1="0" y1="10" x2={Math.sin(a) * 74} y2={-Math.cos(a) * 74} stroke={theme.colors.primary} strokeWidth="4" strokeLinecap="round" />
        <circle r="7" fill={theme.colors.primary} />
      </svg>
      {label && <div style={{ ...S, fontSize: 34, color }}>{label}</div>}
    </div>
  );
};

/* 0 — HOOK: time tunnel */
const Tunnel: React.FC<{ t: number }> = ({ t }) => {
  const rings = 26;
  return (
    <>
      <Stars n={1500} />
      {Array.from({ length: rings }).map((_, i) => {
        const z = -((i * 2.2 - t * 9) % (rings * 2.2));
        const hue = i % 2 ? "#A78BFA" : "#22D3EE";
        return (
          <group key={i} position={[0, 0, z]} rotation={[0, 0, t * 0.4 + i * 0.3]}>
            <mesh><torusGeometry args={[3, 0.04, 8, 96]} /><meshBasicMaterial color={hue} transparent opacity={0.85} /></mesh>
            {Array.from({ length: 12 }).map((_, k) => { const a = (k / 12) * Math.PI * 2; return <mesh key={k} position={[Math.cos(a) * 2.75, Math.sin(a) * 2.75, 0]} rotation={[0, 0, a]}><boxGeometry args={[k % 3 ? 0.18 : 0.36, 0.05, 0.05]} /><meshBasicMaterial color={theme.colors.primary} /></mesh>; })}
          </group>
        );
      })}
      <Glow pos={[0, 0, -40]} size={18} color="#ffffff" opacity={0.6} />
    </>
  );
};
export const Hook: React.FC<P> = ({ start }) => {
  const t = useT(start);
  return (
    <AbsoluteFill>
      <Canvas3D pos={[Math.sin(t) * 0.3, Math.cos(t * 0.8) * 0.3, 4]} tgt={[0, 0, -10]} fov={70}><Tunnel t={t} /></Canvas3D>
      <Title top={560}>
        <Rise at={2} start={start}><div style={{ ...H, fontSize: 104 }}>VIAJAR NO TEMPO</div></Rise>
        <Rise at={W(0, "possivel") - 3} start={start} cfg={theme.spring.bouncy}><Shine at={W(0, "possivel")} start={start}><div style={{ ...H, fontSize: 120, color: theme.colors.primary, textShadow: `0 0 50px ${theme.colors.glow}` }}>É POSSÍVEL</div></Shine></Rise>
        <div style={{ height: 30 }} />
        <Rise at={W(0, "gente") - 4} start={start}><Pill bg="#fff" size={40}>E TEM GENTE QUE JÁ FEZ ISSO</Pill></Rise>
      </Title>
    </AbsoluteFill>
  );
};

/* 1 — KRIKALEV: Earth + station + two clocks */
const Station: React.FC = () => (
  <group>
    <mesh><cylinderGeometry args={[0.06, 0.06, 0.32, 16]} /><meshStandardMaterial color="#e5e7eb" metalness={0.6} roughness={0.3} /></mesh>
    <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.025, 0.025, 0.9, 8]} /><meshStandardMaterial color="#9ca3af" /></mesh>
    {[-0.36, 0.36].map((x) => <mesh key={x} position={[x, 0, 0]}><boxGeometry args={[0.22, 0.005, 0.42]} /><meshStandardMaterial color="#1e40af" metalness={0.5} roughness={0.25} emissive="#1e3a8a" emissiveIntensity={0.3} /></mesh>)}
  </group>
);
export const Krikalev: React.FC<P> = ({ start }) => {
  const t = useT(start);
  const cam = { pos: [0, 1.4, 7.4] as V3, tgt: [0, -0.9, 0] as V3, fov: 42 };
  const a = t * 0.6;
  const st: V3 = [Math.cos(a) * 1.45, 0.3 + Math.sin(a) * 0.2, Math.sin(a) * 1.45];
  const s2 = project(st, cam.pos, cam.tgt, cam.fov);
  const dias = Math.round(interpolate(t, [wordT(1, "oitocentos") - 0.4, wordT(1, "dias") + 0.2], [0, 803], { ...cl, easing: Easing.out(Easing.cubic) }));
  const fut = wordT(1, "futuro");
  const diff = interpolate(t, [wordT(1, "velocidade"), fut], [0, 0.02], cl);
  const base = (t - segT(1)) * 6;
  const cp = useAbsSpring(W(1, "velocidade") - 6, start, theme.spring.smooth);
  return (
    <AbsoluteFill>
      <Canvas3D {...cam}>
        <Stars />
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 3, 4]} intensity={2.6} color="#fff4e0" />
        <Earth r={0.85} spin={t * 0.15} pos={[0, 0.1, 0]} />
        <group position={st} rotation={[0.3, -a, 0.2]} scale={0.75}><Station /></group>
        <Glow pos={st} size={0.5} color="#ffffff" opacity={0.5} />
        <mesh rotation={[Math.PI / 2 - 0.14, 0, 0]} position={[0, 0.3, 0]}><torusGeometry args={[1.45, 0.006, 6, 128]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.25} /></mesh>
      </Canvas3D>
      <Callout x={s2.x} y={s2.y} dx={s2.x > 540 ? -170 : 170} dy={-110} text="ESTAÇÃO ESPACIAL" at={W(1, "espaco") - 4} start={start} color="#E5E7EB" size={30} out={W(1, "velocidade") - 8} />
      <Title top={150}>
        <Rise at={W(1, "krikalev") - 4} start={start}><div style={{ ...H, fontSize: 76 }}>SERGEI KRIKALEV</div></Rise>
        <Rise at={W(1, "oitocentos") - 4} start={start} cfg={theme.spring.bouncy}><div style={{ ...S, fontSize: 64, color: theme.colors.primary, fontVariantNumeric: "tabular-nums" }}>{dias} DIAS NO ESPAÇO</div></Rise>
      </Title>
      <div style={{ position: "absolute", left: 60, right: 60, top: 1060, display: "flex", justifyContent: "space-around", opacity: cp, transform: `translateY(${(1 - cp) * 60}px)` }}>
        <Clock size={230} sec={base} label="NA TERRA" />
        <Clock size={230} sec={base - diff * 400} color="#22D3EE" label="KRIKALEV" />
      </div>
      <AbsoluteFill style={{ top: 1370, alignItems: "center" }}><Rise at={F(fut) - 4} start={start} cfg={theme.spring.bouncy}><Pill bg={theme.colors.primary} size={44} glow>+0,02 s NO FUTURO</Pill></Rise></AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 2 — RELATIVITY: slow clock when fast */
export const Relativity: React.FC<P> = ({ start }) => {
  const t = useT(start); const f = useCurrentFrame();
  const fast = interpolate(t, [wordT(2, "rapido") - 0.3, wordT(2, "rapido") + 0.5], [0, 1], { ...cl, easing: eio });
  const slow = interpolate(t, [wordT(2, "devagar") - 0.3, wordT(2, "devagar") + 0.3], [0, 1], cl);
  const base = (t - segT(2)) * 8;
  const rocketX = interpolate(fast, [0, 1], [0, 1]) * ((f * 22) % 1400) - 200;
  return (
    <AbsoluteFill>
      <BgMesh a="#4c1d95" b="#22D3EE" base={theme.colors.bg} />
      <Title top={150}>
        <Rise at={W(2, "relatividade") - 4} start={start}><div style={{ ...H, fontSize: 84 }}>RELATIVIDADE</div></Rise>
        <Rise at={W(2, "einstein") - 4} start={start}><Pill bg="#fff" size={36}>ALBERT EINSTEIN · 1905</Pill></Rise>
      </Title>
      {/* speed lines + rocket */}
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, height: 160, overflow: "hidden", opacity: fast }}>
        {Array.from({ length: 14 }).map((_, i) => <div key={i} style={{ position: "absolute", left: ((random(`l${i}`) * 1400 - f * 40) % 1400 + 1400) % 1400 - 200, top: 10 + random(`ly${i}`) * 140, width: 120 + random(`lw${i}`) * 200, height: 3, background: "linear-gradient(90deg, transparent, rgba(34,211,238,.8))" }} />)}
        <svg width="180" height="90" viewBox="0 0 180 90" style={{ position: "absolute", left: 450, top: 35 }}>
          <path d="M20 45 L130 20 Q175 45 130 70Z" fill="#E5E7EB" /><circle cx="120" cy="45" r="10" fill="#22D3EE" /><path d="M20 45 L0 25 L35 38Z M20 45 L0 65 L35 52Z" fill="#F87171" />
          <path d={`M20 45 L${-30 - Math.sin(f) * 10} 40 L${-30 - Math.sin(f) * 10} 50Z`} fill={theme.colors.primary} />
        </svg>
      </div>
      <div style={{ position: "absolute", left: 40, right: 40, top: 780, display: "flex", justifyContent: "space-around" }}>
        <Rise at={F(segT(2)) + 4} start={start}><Clock size={300} sec={base} label="PARADO" /></Rise>
        <Rise at={W(2, "rapido") - 4} start={start}><Clock size={300} sec={segT(2) * 0 + (wordT(2, "rapido") - segT(2)) * 8 + Math.max(0, t - wordT(2, "rapido")) * 8 * (1 - 0.75 * fast)} color="#22D3EE" label="EM ALTA VELOCIDADE" /></Rise>
      </div>
      <AbsoluteFill style={{ top: 1250, alignItems: "center" }}>
        <div style={{ opacity: slow, transform: `scale(${0.7 + 0.3 * slow})` }}><Pill bg={theme.colors.primary} size={42} glow>O TEMPO PASSA MAIS DEVAGAR</Pill></div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 3 — GPS */
export const GPS: React.FC<P> = ({ start }) => {
  const t = useT(start); const f = useCurrentFrame();
  const cam = { pos: [0, 0.8, 6.6] as V3, tgt: [0, 0.2, 0] as V3, fov: 44 };
  const sats = [0, 1, 2, 3].map((i) => { const a = t * 0.35 + i * (Math.PI / 2); const inc = 0.5 + i * 0.25; return [Math.cos(a) * 2.2, Math.sin(a) * Math.sin(inc) * 2.2 * 0.6 + 0.2, Math.sin(a) * 2.2 * Math.cos(inc)] as V3; });
  const ground: V3 = [0.35, 0.95, 0.8];
  const errKm = interpolate(t, [wordT(3, "sem") - 0.2, wordT(3, "dia") + 0.2], [0, 10], { ...cl, easing: Easing.in(Easing.quad) });
  const mp = useAbsSpring(W(3, "mapa") - 6, start, theme.spring.smooth);
  const g2 = project(ground, cam.pos, cam.tgt, cam.fov);
  return (
    <AbsoluteFill>
      <Canvas3D {...cam}>
        <Stars />
        <ambientLight intensity={0.25} />
        <directionalLight position={[5, 3, 4]} intensity={2.4} color="#fff4e0" />
        <Earth r={1.1} spin={t * 0.1} />
        {sats.map((p, i) => (
          <group key={i}>
            <group position={p} scale={0.55}><Station /></group>
            <Glow pos={p} size={0.6} color="#22D3EE" opacity={0.6 + 0.4 * Math.sin(f / 5 + i)} />
          </group>
        ))}
      </Canvas3D>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {sats.map((p, i) => { const q = project(p, cam.pos, cam.tgt, cam.fov); return <line key={i} x1={q.x} y1={q.y} x2={g2.x} y2={g2.y} stroke="#22D3EE" strokeWidth={3} strokeDasharray="10 10" strokeDashoffset={-f * 3} opacity={0.7} />; })}
        <circle cx={g2.x} cy={g2.y} r={12} fill={theme.colors.primary} />
      </svg>
      <Title top={150}>
        <Rise at={W(3, "gps") - 4} start={start}><div style={{ ...H, fontSize: 84 }}>O SEU GPS</div></Rise>
        <Rise at={W(3, "relogios") - 4} start={start}><Pill bg="#22D3EE" size={34}>RELÓGIOS CORRIGIDOS TODO DIA</Pill></Rise>
      </Title>
      {/* map card with drifting pin */}
      <div style={{ position: "absolute", left: 140, top: 1120, width: 800, height: 300, borderRadius: 28, overflow: "hidden", background: "#e8eef5", opacity: mp, transform: `translateY(${(1 - mp) * 60}px)`, boxShadow: "0 30px 60px -20px rgba(0,0,0,.8)" }}>
        <svg width="800" height="300">
          {Array.from({ length: 9 }).map((_, i) => <line key={i} x1={i * 100} y1={0} x2={i * 100 - 60} y2={300} stroke="#c7d2de" strokeWidth={14} />)}
          {Array.from({ length: 4 }).map((_, i) => <line key={i} x1={0} y1={i * 90 + 30} x2={800} y2={i * 90 + 10} stroke="#d5dde7" strokeWidth={10} />)}
          <path d="M60 230 Q 300 120 420 160" stroke="#3b82f6" strokeWidth={10} fill="none" strokeLinecap="round" />
          <circle cx={420} cy={160} r={14} fill="#3b82f6" stroke="#fff" strokeWidth={4} />
          <g transform={`translate(${420 + errKm * 30} ${160 - errKm * 6})`}><path d="M0 0 C -18 -26 -18 -48 0 -54 C 18 -48 18 -26 0 0Z" fill="#ef4444" /><circle cx={0} cy={-36} r={7} fill="#fff" /></g>
        </svg>
        <div style={{ position: "absolute", left: 20, top: 16, ...S, fontSize: 30, color: "#0f172a" }}>VOCÊ ESTÁ AQUI</div>
        <div style={{ position: "absolute", right: 20, bottom: 16, ...S, fontSize: 40, color: "#ef4444", fontVariantNumeric: "tabular-nums" }}>ERRO: {errKm.toFixed(1).replace(".", ",")} km</div>
      </div>
    </AbsoluteFill>
  );
};

/* 4 — 99.5% c: speedometer + calendars */
export const NearLight: React.FC<P> = ({ start }) => {
  const t = useT(start);
  const v = interpolate(t, [wordT(4, "nave") - 0.2, wordT(4, "luz")], [0, 99.5], { ...cl, easing: Easing.out(Easing.cubic) });
  const ang = -120 + (v / 100) * 240;
  const yrShip = Math.min(1, Math.max(0, interpolate(t, [wordT(4, "ano") - 0.2, wordT(4, "dez") + 0.6], [0, 1], cl)));
  const cal = useAbsSpring(W(4, "ano") - 6, start, theme.spring.smooth);
  return (
    <AbsoluteFill>
      <BgMesh a="#1e3a8a" b="#22D3EE" base={theme.colors.bg} />
      <Title top={150}><Rise at={F(segT(4)) + 2} start={start}><div style={{ ...H, fontSize: 76 }}>QUASE NA VELOCIDADE</div><div style={{ ...H, fontSize: 76, color: "#22D3EE" }}>DA LUZ</div></Rise></Title>
      <AbsoluteFill style={{ top: 470, alignItems: "center" }}>
        <svg width="620" height="400" viewBox="-160 -150 320 200">
          <path d="M-130 30 A140 140 0 1 1 130 30" stroke="rgba(255,255,255,.15)" strokeWidth="20" fill="none" strokeLinecap="round" />
          <path d="M-130 30 A140 140 0 1 1 130 30" stroke="#22D3EE" strokeWidth="20" fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${(v / 100) * 1} 1`} />
          <line x1="0" y1="0" x2={Math.sin((ang * Math.PI) / 180) * 110} y2={-Math.cos((ang * Math.PI) / 180) * 110} stroke={theme.colors.primary} strokeWidth="8" strokeLinecap="round" />
          <circle r="12" fill={theme.colors.primary} />
          <text x="0" y="50" textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize="44" fill="#fff">{v.toFixed(1).replace(".", ",")}%</text>
        </svg>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 70, right: 70, top: 960, display: "flex", justifyContent: "space-between", opacity: cal, transform: `translateY(${(1 - cal) * 60}px)` }}>
        {[["NA NAVE", 1, "#22D3EE"], ["NA TERRA", 10, theme.colors.primary]].map(([l, n, c]: any, i) => {
          const val = Math.max(i === 0 ? 0 : 0, Math.round(yrShip * n * 10) / 10);
          return (
            <div key={i} style={{ width: 420, borderRadius: 30, overflow: "hidden", background: "#fff", boxShadow: "0 30px 60px -20px rgba(0,0,0,.8)" }}>
              <div style={{ background: c, padding: "14px 0", textAlign: "center", ...S, fontSize: 34, color: theme.colors.ink }}>{l}</div>
              <div style={{ padding: "26px 0 30px", textAlign: "center" }}>
                <div style={{ ...S, fontSize: 130, color: theme.colors.ink, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{Math.floor(val)}</div>
                <div style={{ ...S, fontSize: 38, color: "#475569" }}>{Math.floor(val) === 1 ? "ANO" : "ANOS"}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* 5 — FUTURE YES, BACK? */
export const Problem: React.FC<P> = ({ start }) => {
  const t = useT(start); const f = useCurrentFrame();
  const fw = interpolate(t, [wordT(5, "futuro") - 0.3, wordT(5, "deixa")], [0, 1], { ...cl, easing: eio });
  const bk = interpolate(t, [wordT(5, "voltar") - 0.4, wordT(5, "voltar") + 0.6], [0, 1], { ...cl, easing: eio });
  const shake = bk > 0.95 ? Math.sin(f * 2) * 6 * Math.max(0, 1 - (t - wordT(5, "voltar") - 0.6) * 2) : 0;
  return (
    <AbsoluteFill>
      <BgMesh a="#14532d" b="#7f1d1d" base={theme.colors.bg} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <line x1={120} x2={960} y1={900} y2={900} stroke="rgba(255,255,255,.2)" strokeWidth={6} />
        <circle cx={540} cy={900} r={18} fill="#fff" /><text x={540} y={960} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={34} fill="#fff">HOJE</text>
        <path d={`M540 880 L${540 + 340 * fw} 880`} stroke={theme.colors.ok} strokeWidth={22} strokeLinecap="round" />
        {fw > 0.95 && <path d="M900 880 l-30 -26 v52Z" fill={theme.colors.ok} transform="translate(30 0)" />}
        <path d={`M540 930 Q 540 1060 ${540 - 300 * bk} 1060`} stroke={theme.colors.bad} strokeWidth={22} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray={`${bk} 1`} />
      </svg>
      <div style={{ position: "absolute", left: 600, top: 760, opacity: fw }}><Pill bg={theme.colors.ok} size={46}>FUTURO ✔</Pill></div>
      <div style={{ position: "absolute", left: 120 + shake, top: 1100, opacity: bk }}><Pill bg={theme.colors.bad} size={46}>PASSADO ?</Pill></div>
      <Title top={180}><Rise at={W(5, "problema") - 4} start={start} cfg={theme.spring.bouncy}><div style={{ ...H, fontSize: 84 }}>O PROBLEMA</div><div style={{ ...H, fontSize: 84, color: theme.colors.bad }}>É VOLTAR</div></Rise></Title>
    </AbsoluteFill>
  );
};

/* 6 — WORMHOLE 3D */
const Wormhole: React.FC<{ t: number }> = ({ t }) => {
  const geo = React.useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 60; i++) { const y = -3 + (i / 60) * 6; const r = 0.45 + 0.5 * y * y * 0.45; pts.push(new THREE.Vector2(Math.min(r, 3.2), y)); }
    return new THREE.LatheGeometry(pts, 64);
  }, []);
  return (
    <group rotation={[0, t * 0.25, 0]}>
      <mesh geometry={geo}><meshStandardMaterial color="#4c1d95" emissive="#7c3aed" emissiveIntensity={0.35} side={THREE.DoubleSide} transparent opacity={0.55} /></mesh>
      <mesh geometry={geo}><meshBasicMaterial color="#c4b5fd" wireframe transparent opacity={0.35} /></mesh>
      <Glow pos={[0, 0, 0]} size={2.4} color="#a78bfa" opacity={0.8} />
      {Array.from({ length: 30 }).map((_, i) => { const ph = ((t * 0.4 + random(`w${i}`)) % 1); const y = 3 - ph * 6; const r = 0.45 + 0.5 * y * y * 0.45; const a = random(`wa${i}`) * 6.28 + t; return <mesh key={i} position={[Math.cos(a) * r * 0.9, y, Math.sin(a) * r * 0.9]}><sphereGeometry args={[0.035, 8, 8]} /><meshBasicMaterial color="#fde68a" /></mesh>; })}
    </group>
  );
};
export const WormScene: React.FC<P> = ({ start }) => {
  const t = useT(start);
  return (
    <AbsoluteFill>
      <Canvas3D pos={[0, 2.4, 12.5]} tgt={[0, -0.3, 0]} fov={46}>
        <Stars />
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 4, 5]} intensity={2} />
        <Wormhole t={t} />
      </Canvas3D>
      <Title top={150}>
        <Rise at={W(6, "passado") - 4} start={start}><div style={{ ...H, fontSize: 64, color: theme.colors.textDim }}>UM ATALHO PRO PASSADO?</div></Rise>
        <Rise at={W(6, "buracos") - 4} start={start} cfg={theme.spring.bouncy}><div style={{ ...H, fontSize: 84, color: theme.colors.accent, textShadow: "0 0 40px rgba(167,139,250,.6)" }}>BURACO DE MINHOCA</div></Rise>
      </Title>
      <AbsoluteFill style={{ top: 1250, alignItems: "center", display: "flex", flexDirection: "column", gap: 12 }}>
        <Rise at={W(6, "exotica") - 4} start={start} cfg={theme.spring.bouncy}><Pill bg={theme.colors.primary} size={42} glow>PRECISA DE MATÉRIA EXÓTICA</Pill></Rise>
        <Rise at={W(6, "nunca") - 4} start={start}><Pill bg={theme.colors.bad} size={36}>NUNCA ENCONTRADA</Pill></Rise>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 7 — PARADOX */
export const Paradox: React.FC<P> = ({ start }) => {
  const t = useT(start); const f = useCurrentFrame();
  const loop = interpolate(t, [wordT(7, "voltasse") - 0.3, wordT(7, "impedisse")], [0, 1], { ...cl, easing: eio });
  const x = useAbsSpring(W(7, "nascimento") - 3, start, theme.spring.bouncy);
  const glitch = x > 0.3 && f % 9 < 2 ? 8 : 0;
  return (
    <AbsoluteFill>
      <BgMesh a="#7f1d1d" b="#4c1d95" base={theme.colors.bg} />
      <Title top={170}><Rise at={W(7, "paradoxos") - 4} start={start} cfg={theme.spring.bouncy}><div style={{ ...H, fontSize: 92, transform: `translateX(${glitch}px)`, textShadow: glitch ? "4px 0 #22D3EE, -4px 0 #F87171" : undefined }}>O PARADOXO</div></Rise></Title>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <line x1={100} x2={980} y1={900} y2={900} stroke="rgba(255,255,255,.25)" strokeWidth={6} />
        {[["NASCIMENTO", 260], ["HOJE", 820]].map(([l, xx]: any, i) => <g key={i}><circle cx={xx} cy={900} r={16} fill="#fff" /><text x={xx} y={960} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={30} fill="#fff">{l}</text></g>)}
        <path d="M820 880 C 820 640, 260 640, 260 880" stroke={theme.colors.accent} strokeWidth={14} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${loop} 1`} />
        {loop > 0.98 && <path d="M260 880 l-22 -34 h44Z" fill={theme.colors.accent} />}
        <g transform={`translate(260 900) scale(${x}) rotate(${(1 - x) * 90})`} opacity={x}><path d="M-60 -60 L60 60 M60 -60 L-60 60" stroke={theme.colors.bad} strokeWidth={18} strokeLinecap="round" /></g>
      </svg>
      <AbsoluteFill style={{ top: 1150, alignItems: "center" }}><Rise at={W(7, "nascimento")} start={start}><Pill bg="#fff" size={40}>VOCÊ NEM EXISTIRIA PRA VOLTAR</Pill></Rise></AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 8 — HAWKING PARTY */
export const Party: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const sp = useAbsSpring(F(segT(8)), start, theme.spring.smooth);
  const stamp = useAbsSpring(W(8, "depois") - 3, start, theme.spring.bouncy);
  const nobody = useAbsSpring(W(8, "ninguem") - 3, start, theme.spring.bouncy);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#1f1430,#0d0a18)" }}>
      <Title top={150}><Rise at={W(8, "hawking") - 4} start={start}><div style={{ ...H, fontSize: 80 }}>STEPHEN HAWKING</div></Rise><Rise at={W(8, "festa") - 4} start={start}><Pill bg="#fff" size={36}>A FESTA DE 2009</Pill></Rise></Title>
      <div style={{ position: "absolute", left: 60, right: 60, top: 470, height: 900, opacity: sp, transform: `scale(${0.92 + 0.08 * sp})` }}>
        {/* banner */}
        <div style={{ position: "absolute", left: 80, right: 80, top: 20, padding: "16px 0", textAlign: "center", background: "#fff7ed", border: "6px solid #f59e0b", borderRadius: 12, ...S, fontSize: 40, color: "#7c2d12", transform: `rotate(${Math.sin(f / 30) * 1.2}deg)` }}>WELCOME TIME TRAVELLERS</div>
        {/* balloons */}
        {[[40, "#f472b6"], [130, "#60a5fa"], [800, "#facc15"], [880, "#34d399"]].map(([x, c]: any, i) => (
          <div key={i} style={{ position: "absolute", left: x, top: 140 + Math.sin(f / 20 + i) * 10 }}><div style={{ width: 90, height: 110, borderRadius: "50%", background: c }} /><div style={{ width: 2, height: 160, background: "rgba(255,255,255,.5)", marginLeft: 44 }} /></div>
        ))}
        {/* table */}
        <div style={{ position: "absolute", left: 120, right: 120, top: 520, height: 40, background: "#f5f5f4", borderRadius: 8 }} />
        <div style={{ position: "absolute", left: 160, right: 160, top: 560, height: 160, background: "linear-gradient(#e7e5e4,#a8a29e)" }} />
        {[230, 380, 530, 680].map((x, i) => <svg key={i} width="40" height="90" viewBox="0 0 40 90" style={{ position: "absolute", left: x, top: 436 }}><path d="M8 0 h24 l-6 40 h-12Z" fill="rgba(255,255,255,.7)" /><path d="M10 6 h20 l-4 28 h-12Z" fill="#fde68a" /><rect x="18" y="40" width="4" height="36" fill="rgba(255,255,255,.7)" /><rect x="8" y="76" width="24" height="4" fill="rgba(255,255,255,.7)" /></svg>)}
        {/* empty chairs */}
        {[150, 400, 650].map((x, i) => <svg key={i} width="140" height="200" viewBox="0 0 140 200" style={{ position: "absolute", left: x, top: 650 }}><rect x="20" y="0" width="100" height="90" rx="10" fill="#7c2d12" /><rect x="10" y="90" width="120" height="20" rx="6" fill="#9a3412" /><rect x="20" y="110" width="10" height="80" fill="#7c2d12" /><rect x="110" y="110" width="10" height="80" fill="#7c2d12" /></svg>)}
      </div>
      <AbsoluteFill style={{ top: 980, alignItems: "center" }}>
        <div style={{ opacity: Math.min(1, stamp * 1.5), transform: `scale(${2 - stamp}) rotate(-10deg)`, border: `8px solid ${theme.colors.bad}`, borderRadius: 16, padding: "10px 26px", background: "rgba(255,247,237,.92)", ...S, fontSize: 52, color: theme.colors.bad, textAlign: "center", lineHeight: 1.1 }}>CONVITES ENVIADOS<br />DEPOIS DA FESTA</div>
      </AbsoluteFill>
      <AbsoluteFill style={{ top: 1290, alignItems: "center" }}><div style={{ opacity: nobody, transform: `scale(${0.6 + 0.4 * nobody})` }}><Pill bg={theme.colors.primary} size={48} glow>NINGUÉM APARECEU</Pill></div></AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 9 — VERDICT */
export const Verdict: React.FC<P> = ({ start }) => {
  const a = useAbsSpring(W(9, "futuro") - 3, start, theme.spring.bouncy);
  const b = useAbsSpring(W(9, "passado") - 3, start, theme.spring.bouncy);
  const card = (txt: string, ok: boolean, p: number) => (
    <div style={{ width: 860, padding: "40px 0", borderRadius: 40, textAlign: "center", background: ok ? "rgba(74,222,128,.15)" : "rgba(248,113,113,.15)", border: `4px solid ${ok ? theme.colors.ok : theme.colors.bad}`, opacity: Math.min(1, p * 1.4), transform: `scale(${0.7 + 0.3 * p})` }}>
      <div style={{ ...S, fontSize: 40, color: theme.colors.textDim }}>VIAGEM PRO</div>
      <div style={{ ...S, fontSize: 110, color: ok ? theme.colors.ok : theme.colors.bad }}>{txt} {ok ? "✔" : "✖"}</div>
    </div>
  );
  return (
    <AbsoluteFill>
      <BgMesh a="#14532d" b="#7f1d1d" base={theme.colors.bg} />
      <Title top={170}><Rise at={F(segT(9)) + 2} start={start}><div style={{ ...H, fontSize: 76 }}>POR ENQUANTO…</div></Rise></Title>
      <AbsoluteFill style={{ top: 480, alignItems: "center", display: "flex", flexDirection: "column", gap: 60 }}>
        {card("FUTURO", true, a)}
        {card("PASSADO", false, b)}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 10 — CTA */
export const CTA: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const c = F(segT(10)) - 4;
  const p = useAbsSpring(c, start, theme.spring.smooth);
  return (
    <AbsoluteFill>
      <BgMesh a="#4c1d95" b="#22D3EE" base={theme.colors.bg} />
      <Title top={330}>
        <div style={{ width: 230, height: 230, borderRadius: "50%", overflow: "hidden", border: "3px solid rgba(255,255,255,0.25)", boxShadow: "0 0 60px rgba(124,92,255,.55)", transform: `scale(${p}) rotate(${(1 - p) * -40}deg)`, marginBottom: 14 }}>
          <Img src={staticFile("tempo/logo.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.45) translateY(1%)" }} />
        </div>
        <Rise at={c + 5} start={start}><div style={{ ...S, fontSize: 46, color: theme.colors.textDim }}>SEGUE O</div></Rise>
        <Rise at={c + 9} start={start} cfg={theme.spring.bouncy}><div style={{ ...S, fontSize: 108, color: "#fff", textAlign: "center", lineHeight: 1 }}>PERGUNTA</div><div style={{ ...S, fontSize: 108, color: theme.colors.primary, textAlign: "center", lineHeight: 1, textShadow: `0 0 50px ${theme.colors.glow}` }}>CÓSMICA</div></Rise>
        <Rise at={c + 14} start={start}><div style={{ ...S, fontSize: 38, color: theme.colors.textDim }}>ciência, universo e história</div></Rise>
        <div style={{ height: 60 }} />
        <Rise at={c + 22} start={start} cfg={theme.spring.bouncy}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, background: "#fff", color: theme.colors.ink, ...S, fontSize: 56, padding: "24px 52px", borderRadius: 999, boxShadow: "0 0 50px rgba(255,255,255,.35)", transform: `scale(${1 + Math.sin(f / 7) * 0.035})` }}>
            <svg width="44" height="44" viewBox="0 0 40 40"><path d="M20 6v28M6 20h28" stroke={theme.colors.ink} strokeWidth="6" strokeLinecap="round" /></svg>SEGUIR
          </div>
        </Rise>
      </Title>
    </AbsoluteFill>
  );
};
