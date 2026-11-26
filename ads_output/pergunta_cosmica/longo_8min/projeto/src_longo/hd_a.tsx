import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { theme } from "./theme";
import { useBlock, Sfx, sec } from "./core";
import { useAbsSpring } from "./ui";
import { cl } from "./cl";
import { useV, Stage, StarField, Nebula, Glow, Points, StarBody, Shock, HoloBody, rng, V3 } from "./hd";
import { Atom3D, EarthHD, MoonHD, GalaxyHD, Ray } from "./hd3d";
import { win, Layer, E, Title, Tag, burst, F } from "./b2hd";

/* ---------- shared 2D overlays ---------- */
export const Counter: React.FC<{ at: number; label: string; value: string; color?: string; x?: number; y?: number; size?: number }> = ({ at, label, value, color = theme.colors.primary, x: x0 = 1540, y: y0 = 470, size = 76 }) => {
  const v = useV(); const x = v ? 540 : x0, y = v ? 1230 : y0;
  const p = useAbsSpring(at, 0, theme.spring.bouncy);
  return <div style={{ position: "absolute", left: x - 260, top: y - 90, width: 520, textAlign: "center", opacity: Math.min(1, p * 1.5), transform: `scale(${0.7 + 0.3 * p})` }}>
    <div style={{ padding: "18px 26px", borderRadius: 26, background: "rgba(5,8,20,.62)", border: `3px solid ${color}`, boxShadow: `0 0 50px ${color}66`, backdropFilter: "blur(8px)" }}>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 30, color: "#cbd5e1", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontFamily: F, fontWeight: 900, fontSize: size, color, fontVariantNumeric: "tabular-nums", lineHeight: 1.05, textShadow: `0 0 30px ${color}88` }}>{value}</div>
    </div></div>;
};
export const Label: React.FC<{ at: number; x: number; y: number; color?: string; children: React.ReactNode; size?: number }> = ({ at, x, y, color = theme.colors.primary, children, size = 44 }) => {
  const p = useAbsSpring(at, 0, theme.spring.bouncy);
  return <div style={{ position: "absolute", left: x, top: y, whiteSpace: "nowrap", opacity: Math.min(1, p * 1.5), transform: `scale(${0.7 + 0.3 * p})`, transformOrigin: "left center", fontFamily: F, fontWeight: 900, fontSize: size, color: "#0b0b12", background: color, padding: "10px 26px", borderRadius: 16, boxShadow: `0 0 40px ${color}88` }}>{children}</div>;
};
const shakeAt = (t: number, f: number, a: number, amp = 0.15) => { const k = Math.max(0, 1 - (t - a) / 0.9); return t > a ? [Math.sin(f * 2.3) * amp * k, Math.cos(f * 1.7) * amp * k] : [0, 0]; };
const fmt = (n: number) => Math.round(n).toLocaleString("pt-BR");

/* atom lattice (a "surface" made of atoms) */
const Lattice: React.FC<{ y: number; t: number; color: number[]; seed: number; cols?: number; rows?: number; gap?: number }> = ({ y, t, color, seed, cols = 7, rows = 2, gap = 1.25 }) => (
  <group position={[0, y, 0]}>{Array.from({ length: cols * rows }).map((_, i) => { const cx = (i % cols - (cols - 1) / 2) * gap, cz = (Math.floor(i / cols) - (rows - 1) / 2) * gap;
    return <Atom3D key={i} pos={[cx, Math.sin(t * 2 + i) * 0.02, cz]} t={t + i} r={0.5} seed={seed + i} cloud={color} electrons={2} glow={0.8} />; })}</group>
);

/* ================= INTRO ================= */
export const IntroHD: React.FC = () => {
  const { t, w, W } = useBlock("intro"); const f = useCurrentFrame();
  const a = win(t, 0, w("nunca") - 0.25), b = win(t, w("nunca") - 0.25, w("passado") - 0.6), c = win(t, w("passado") - 0.6, w("feito") - 0.3), d = win(t, w("feito") - 0.3, w("proximos") - 0.2), e = win(t, w("proximos") - 0.2, 999);
  const boom = E(t, w("feito") - 0.1, w("estrelas") + 1.2);
  const bp = burst(7000, 5, boom, 1, 12, [[1, 0.8, 0.4], [1, 0.45, 0.35], [0.7, 0.55, 1], [0.5, 0.85, 1]], 0.8);
  const close = Math.min(0.55, Math.max(0, t - w("nunca")) * 0.35);
  return (
    <AbsoluteFill>
      <Layer o={a}>
        <Stage pos={[0, 0, 40 - t * 6]} tgt={[0, 0, -40]} fov={58} roll={t * 0.04}><StarField n={12000} size={0.6} /><Nebula seed={21} z={-80} opacity={0.5} /></Stage>
        <Title at={sec(0.6)} lines={["TUDO O QUE VOCÊ SABE", "SOBRE A REALIDADE…"]} top={330} size={104} />
        <Tag at={W("errado") - 4} bottom={260} color="#F87171">…ESTÁ UM POUCO ERRADO</Tag>
      </Layer>
      <Layer o={b}>
        <Stage pos={[0, 0.3, 6.5]} tgt={[0, 0, 0]} fov={40}>
          <StarField n={5000} size={0.4} /><ambientLight intensity={0.5} /><pointLight position={[0, 3, 4]} intensity={40} />
          <Atom3D pos={[-1.75 + close, 0, 0]} t={t} r={1.2} seed={1} />
          <Atom3D pos={[1.75 - close, 0, 0]} t={t} r={1.2} seed={2} cloud={[0.75, 0.55, 1]} />
          <Glow pos={[0, 0, 0.3]} size={1.2 + 0.2 * Math.sin(f / 4)} color="#fbbf24" opacity={0.5 + 0.3 * Math.sin(f / 5)} />
        </Stage>
        <Title at={W("nunca") - 3} lines={["VOCÊ NUNCA", "TOCOU EM NADA"]} top={70} size={96} />
      </Layer>
      <Layer o={c}>
        <Stage pos={[0, 0, 8]} tgt={[0, 0, -10]} fov={55}>
          <StarField n={9000} size={0.55} /><Nebula seed={4} colors={["#2563eb", "#7c3aed"]} z={-60} opacity={0.4} />
          {Array.from({ length: 9 }).map((_, i) => { const R = rng(i + 30); const s: V3 = [(R() - 0.5) * 20, (R() - 0.5) * 10, -30]; const ph = ((t * 0.5 + R()) % 1);
            return <group key={i}><Glow pos={s} size={2.2} color="#fde68a" /><Ray a={s} b={[s[0] * 0.05, s[1] * 0.05, 7]} p={ph} size={0.7} /></group>; })}
        </Stage>
        <Title at={W("passado") - 10} lines={["VOCÊ ESTÁ VENDO", "O PASSADO"]} top={70} size={96} />
      </Layer>
      <Layer o={d}>
        <Stage pos={[0, 0.5, 14 - boom * 3]} tgt={[0, 0, 0]} fov={50}>
          <StarField n={6000} size={0.45} />
          {boom < 0.02 && <StarBody r={1.6 * (1 - E(t, w("feito") - 0.6, w("feito") - 0.1, Easing.in(Easing.cubic)) * 0.8)} t={t} heat={1.6 + E(t, w("feito") - 0.6, w("feito") - 0.1) * 2} />}
          <Glow size={0.5 + boom * 34} color="#ffffff" opacity={boom > 0 ? Math.max(0, 1 - boom * 1.5) : 0} />
          {boom > 0 && <Points pos={bp.pos} col={bp.col} size={0.11} />}
          <Shock p={boom} r={18} /><Shock p={Math.max(0, boom - 0.1)} r={14} color="#f97316" tilt={0.9} />
        </Stage>
        <Title at={W("feito") - 4} lines={["VOCÊ É FEITO", "DE ESTRELAS"]} top={70} size={96} />
      </Layer>
      <Layer o={e}>
        <Stage pos={[0, 6, 7.5]} tgt={[0, 0, 0]} fov={50}><StarField n={6000} size={0.45} /><GalaxyHD t={t} n={20000} r={5} /></Stage>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,.15), rgba(0,0,0,.55))" }} />
        {(() => { const p = useAbsSpring(W("proximos") - 2, 0, theme.spring.bouncy); return <div style={{ position: "absolute", left: 0, right: 0, top: 170, textAlign: "center", opacity: p, transform: `scale(${0.6 + 0.4 * p})` }}>
          <div style={{ fontFamily: F, fontWeight: 900, fontSize: 260, color: theme.colors.primary, lineHeight: 0.9, textShadow: `0 0 90px ${theme.colors.glow}` }}>8</div></div>; })()}
        <Title at={W("oito") - 2} lines={["COISAS SOBRE A REALIDADE", "QUE PARECEM MENTIRA"]} top={470} size={84} />
        <Tag at={W("numero") - 4} bottom={150}>E A #1 VAI MUDAR O JEITO QUE VOCÊ OLHA PRO CÉU</Tag>
      </Layer>
      <Sfx at={W("nunca") - 3} src="swoosh.wav" vol={0.2} />
      <Sfx at={W("passado") - 3} src="swoosh.wav" vol={0.2} />
      <Sfx at={W("feito") - 25} src="riser.wav" vol={0.2} />
      <Sfx at={W("feito") - 2} src="impact.wav" vol={0.32} />
      <Sfx at={W("proximos") - 2} src="impact.wav" vol={0.22} />
    </AbsoluteFill>
  );
};

/* ================= #8 YOU NEVER TOUCHED ANYTHING ================= */
export const B8HD: React.FC = () => {
  const { t, w, W } = useBlock("b8"); const f = useCurrentFrame();
  const P1 = win(t, 3.0, w("atomos") - 0.2), P2 = win(t, w("atomos") - 0.2, w("quando") - 0.2), P3 = win(t, w("quando") - 0.2, w("toque") - 0.8),
    P4 = win(t, w("toque") - 0.8, w("mesma") - 0.2), P5 = win(t, w("mesma") - 0.2, w("seja") - 0.4), P6 = win(t, w("seja") - 0.4, 999);
  const desc = E(t, w("quando"), w("repelem"), Easing.inOut(Easing.cubic));
  const sh = shakeAt(t, f, w("repelem"), 0.12);
  const mag = 1.1 + Math.sin(Math.min(1, E(t, w("ima"), w("empurrar") + 0.4)) * Math.PI / 2) * 1.0;
  const zoomIn = E(t, w("toque") - 0.6, w("bilionesimo"), Easing.inOut(Easing.cubic));
  const arcs = (y0: number, y1: number, n: number, on: number) => Array.from({ length: n }).map((_, i) => { const R = rng(i * 7 + Math.floor(f / 2));
    const x = -3.6 + i * (7.2 / (n - 1)); return Array.from({ length: 6 }).map((__, k) => { const y = y0 + (y1 - y0) * (k / 5); return <Glow key={`${i}-${k}`} pos={[x + (R() - 0.5) * 0.25, y, 0.4]} size={0.32} color="#a5f3fc" opacity={on * (0.5 + R() * 0.5)} />; }); });
  return (
    <AbsoluteFill>
      <Layer o={P1}>
        <Stage pos={[0, 1.5 - t * 0.05, 5.6 - t * 0.12]} tgt={[0, -0.3, 0]} fov={45}>
          <StarField n={4000} size={0.4} /><ambientLight intensity={0.5} /><pointLight position={[0, 4, 4]} intensity={60} />
          <Lattice y={-0.4} t={t} color={[0.5, 0.75, 1]} seed={10} />
        </Stage>
        <Title at={sec(3.2)} lines={["PELO MENOS NÃO", "DO JEITO QUE VOCÊ IMAGINA"]} top={70} size={80} />
      </Layer>
      <Layer o={P2}>
        <Stage pos={[0, 0.3, 4.2 - (t - w("atomos")) * 0.1]} tgt={[0, 0, 0]} fov={42}>
          <StarField n={4000} size={0.4} /><ambientLight intensity={0.5} /><pointLight position={[2, 3, 4]} intensity={50} />
          <Atom3D t={t} r={1.6} seed={3} electrons={4} />
          {t > w("negativa") - 0.3 && Array.from({ length: 6 }).map((_, i) => { const a = i * 1.047 + t * 0.6; return <Glow key={i} pos={[Math.cos(a) * 2.1, Math.sin(a) * 1.3, 0.4]} size={0.5} color="#22d3ee" opacity={0.8} />; })}
        </Stage>
        <Title at={W("atomos") - 3} lines={["TUDO É FEITO DE ÁTOMOS"]} top={70} size={84} />
        <Tag at={W("negativa") - 4} color="#22D3EE">ELÉTRONS POR FORA: CARGA NEGATIVA (−)</Tag>
      </Layer>
      <Layer o={P3}>
        <Stage pos={[6.5 + sh[0], 0.6 + sh[1], 7]} tgt={[0, 0.2, 0]} fov={42}>
          <StarField n={4000} size={0.4} /><ambientLight intensity={0.5} /><pointLight position={[0, 4, 4]} intensity={60} />
          <Lattice y={-1.2} t={t} color={[0.95, 0.7, 0.35]} seed={20} rows={1} />
          <Lattice y={3.2 - desc * 2.9} t={t} color={[0.45, 0.8, 1]} seed={40} rows={1} />
          {arcs(-0.7, 0.0 + (1 - desc) * 2.9, 7, E(t, w("repelem") - 0.2, w("repelem") + 0.2))}
        </Stage>
        <Label at={W("pele") - 4} x={130} y={330} color="#7DD3FC">SUA PELE</Label>
        <Label at={W("mesa", 1) - 4} x={130} y={740} color="#FDBA74">A MESA</Label>
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
          {[-1, 1].map((s) => <group key={s} position={[s * mag, 0, 0]} rotation={[0.2, s * 0.3, 0]}>
            <mesh position={[s * -0.55, 0, 0]}><boxGeometry args={[1.1, 0.8, 0.8]} /><meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.4} /></mesh>
            <mesh position={[s * 0.55, 0, 0]}><boxGeometry args={[1.1, 0.8, 0.8]} /><meshStandardMaterial color="#2563eb" roughness={0.3} metalness={0.4} /></mesh></group>)}
          {Array.from({ length: 8 }).map((_, i) => { const y = (i - 3.5) * 0.28; const bend = 0.6 + Math.abs(y); return Array.from({ length: 10 }).map((__, k) => { const x = (k / 9 - 0.5) * 2 * (mag - 0.1); return <Glow key={`${i}-${k}`} pos={[x, y * (1 + bend * (1 - Math.abs(x) / mag) * 0.6), 0.5]} size={0.16} color="#fbbf24" opacity={0.6} />; }); })}
        </Stage>
        <Title at={W("mesma") - 3} lines={["A MESMA FORÇA", "QUE EMPURRA ÍMÃS"]} top={70} size={86} />
        <Tag at={W("objetos") - 4} color="#F87171">SEM ELA, NADA SERIA SÓLIDO</Tag>
      </Layer>
      <Layer o={P6}>
        <Stage pos={[3.2, 1.4, 5.2]} tgt={[0, 0.3, 0]} fov={42}>
          <StarField n={3000} size={0.35} /><ambientLight intensity={0.6} /><directionalLight position={[3, 4, 5]} intensity={2} />
          <group position={[0, -1, 0]}>
            <mesh position={[0, 0.5, 0]}><boxGeometry args={[1.3, 0.12, 1.2]} /><meshStandardMaterial color="#92400e" roughness={0.6} /></mesh>
            <mesh position={[0, 1.2, -0.55]}><boxGeometry args={[1.3, 1.3, 0.1]} /><meshStandardMaterial color="#92400e" roughness={0.6} /></mesh>
            {[[-0.55, -0.5], [0.55, -0.5], [-0.55, 0.5], [0.55, 0.5]].map(([x, z], i) => <mesh key={i} position={[x, 0, z]}><boxGeometry args={[0.1, 1, 0.1]} /><meshStandardMaterial color="#78350f" /></mesh>)}
          </group>
          <HoloBody color="#7dd3fc" seated pos={[0, -0.12 + Math.sin(t * 2) * 0.015, -0.25]} scale={0.62} />
          <mesh position={[0, -0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.2, 1.1]} /><meshBasicMaterial color="#fbbf24" transparent opacity={0.25 + 0.15 * Math.sin(f / 4)} toneMapped={false} /></mesh>
        </Stage>
        <Title at={W("cadeira") - 4} lines={["TECNICAMENTE, VOCÊ", "ESTÁ FLUTUANDO"]} top={70} size={86} />
        <Tag at={W("zero") - 6}>A DISTÂNCIA NUNCA CHEGA A ZERO</Tag>
      </Layer>
      <Sfx at={W("atomos") - 3} src="swoosh.wav" vol={0.18} />
      <Sfx at={W("repelem") - 2} src="impact.wav" vol={0.26} />
      <Sfx at={W("ima") - 3} src="swoosh.wav" vol={0.18} />
      <Sfx at={W("flutuando") - 3} src="sparkle.wav" vol={0.2} />
    </AbsoluteFill>
  );
};

/* ================= #7 SEEING THE PAST ================= */
export const B7HD: React.FC = () => {
  const { t, w, W } = useBlock("b7"); const f = useCurrentFrame();
  const L1 = win(t, 3.0, w("lua") - 0.2), L2 = win(t, w("lua") - 0.2, w("sol") - 0.2), L3 = win(t, w("sol") - 0.2, w("estrelas") - 0.3), L4 = win(t, w("estrelas") - 0.3, w("pessoa") - 0.3),
    L5 = win(t, w("pessoa") - 0.3, w("astronomos") - 0.3), L6 = win(t, w("astronomos") - 0.3, w("olhar") - 0.3), L7 = win(t, w("olhar") - 0.3, 999);
  const pm = E(t, w("lua") + 0.2, w("segundo") + 0.6, Easing.linear);
  const ps = E(t, w("sol") + 0.1, w("estrelas") - 0.4, Easing.linear); const sunSec = Math.round(ps * 500);
  const nova = E(t, w("explodisse") - 0.05, w("explodisse") + 2);
  const np = burst(5000, 71, nova, 0.5, 6, [[1, 0.9, 0.6], [1, 0.5, 0.3], [0.7, 0.6, 1]]);
  const deep = E(t, w("astronomos"), w("olhar"), Easing.inOut(Easing.quad));
  const tilt = E(t, w("olhar") - 0.2, w("olhar") + 2.5, Easing.inOut(Easing.cubic));
  return (
    <AbsoluteFill>
      <Layer o={L1}>
        <Stage pos={[0, 0, 10]} tgt={[0, 0, 0]} fov={50}>
          <StarField n={9000} size={0.5} /><Nebula seed={8} colors={["#1d4ed8", "#f59e0b"]} z={-60} opacity={0.35} />
          {Array.from({ length: 6 }).map((_, i) => <Ray key={i} a={[-14, -3 + i * 1.2, -2]} b={[14, -3 + i * 1.2 + 0.5, -2]} p={((t * 0.45 + i * 0.17) % 1.1)} len={0.25} size={0.6} />)}
        </Stage>
        <Title at={W("luz") - 4} lines={["A LUZ LEVA TEMPO", "PRA VIAJAR"]} top={80} size={92} />
        <Tag at={W("viajar") - 2}>~300.000 KM POR SEGUNDO</Tag>
      </Layer>
      <Layer o={L2}>
        <Stage pos={[0, 0.8, 10]} tgt={[0, 0, 0]} fov={40}>
          <StarField n={6000} size={0.45} /><ambientLight intensity={0.12} /><directionalLight position={[6, 2, 4]} intensity={3} />
          <EarthHD pos={[-3.4, 0, 0]} r={1.5} spin={t * 0.2} /><MoonHD pos={[3.8, 0.3, 0]} r={0.42} spin={t * 0.1} />
          <Ray a={[3.3, 0.3, 0]} b={[-1.8, 0, 0]} p={pm} size={0.6} />
        </Stage>
        <Title at={W("lua") - 4} lines={["LUZ DA LUA → VOCÊ"]} top={80} size={84} />
        <Counter at={W("lua")} label="ATRASO" value={`${(pm * 1.3).toFixed(1).replace(".", ",")} s`} x={960} y={850} />
      </Layer>
      <Layer o={L3}>
        <Stage pos={[0, 0.6, 12]} tgt={[0, 0, 0]} fov={42}>
          <StarField n={6000} size={0.45} /><ambientLight intensity={0.08} /><pointLight position={[-5, 0, 0]} intensity={200} decay={1.2} />
          <StarBody pos={[-5, 0, 0]} r={2.2} t={t} /><EarthHD pos={[5.2, 0, 0]} r={0.5} spin={t * 0.2} />
          <Ray a={[-2.6, 0, 0]} b={[4.6, 0, 0]} p={ps} size={0.6} />
        </Stage>
        <Title at={W("sol") - 4} lines={["LUZ DO SOL → VOCÊ"]} top={80} size={84} />
        <Counter at={W("sol")} label="ATRASO" value={`${Math.floor(sunSec / 60)} min ${String(sunSec % 60).padStart(2, "0")} s`} x={960} y={850} />
      </Layer>
      <Layer o={L4}>
        <Stage pos={[0, 0, 8 - (t - w("estrelas")) * 0.3]} tgt={[1.5, 0.8, -10]} fov={50}>
          <StarField n={14000} size={0.6} /><Nebula seed={14} z={-70} opacity={0.45} />
          {nova < 0.02 && <StarBody pos={[3, 1.6, -8]} r={0.45} t={t} a="#93c5fd" b="#e0f2fe" heat={1.8} />}
          <Glow pos={[3, 1.6, -8]} size={nova * 12} color="#fff" opacity={nova > 0 ? 1 - nova : 0} />
          {nova > 0 && <group position={[3, 1.6, -8]}><Points pos={np.pos} col={np.col} size={0.09} /></group>}
          <Shock p={nova} r={7} pos={[3, 1.6, -8]} />
        </Stage>
        <Title at={W("estrelas") - 4} lines={["A LUZ DAS ESTRELAS", "É ANTIGA"]} top={80} size={88} />
        <Tag at={W("seculos") - 8} color="#FB923C">SE EXPLODISSE HOJE: SÓ VERÍAMOS DAQUI A SÉCULOS</Tag>
      </Layer>
      <Layer o={L5}>
        <Stage pos={[0, 0.9, 5.6]} tgt={[0, 0.6, 0]} fov={45}>
          <StarField n={4000} size={0.4} /><Nebula seed={18} colors={["#0891b2", "#7c3aed"]} z={-40} opacity={0.3} />
          <HoloBody color="#7dd3fc" pos={[-1.7, -0.6, 0]} spin={Math.PI / 2} /><HoloBody color="#c4b5fd" pos={[1.7, -0.6, 0]} spin={-Math.PI / 2} />
          {Array.from({ length: 5 }).map((_, i) => <Ray key={i} a={[1.3, 1.0, 0]} b={[-1.3, 1.0, 0]} p={((t * 0.9 + i * 0.2) % 1)} size={0.25} len={0.15} />)}
        </Stage>
        <Title at={W("pessoa") - 4} lines={["ATÉ QUEM ESTÁ", "NA SUA FRENTE"]} top={80} size={88} />
        <Tag at={W("bilionesimos") - 4}>~0,000000003 s DE ATRASO</Tag>
      </Layer>
      <Layer o={L6}>
        <Stage pos={[0, 0, 10 - deep * 14]} tgt={[0, 0, -40]} fov={55}>
          <StarField n={6000} size={0.45} />
          {Array.from({ length: 60 }).map((_, i) => { const R = rng(i + 500); const p: V3 = [(R() - 0.5) * 30, (R() - 0.5) * 16, -5 - R() * 50]; const col = ["#fde68a", "#fca5a5", "#c4b5fd", "#93c5fd"][i % 4];
            return <group key={i} position={p} rotation={[R() * 3, R() * 3, 0]}><Glow size={0.9 + R() * 1.6} color={col} opacity={0.9} /><mesh scale={[1, 0.25, 1]}><sphereGeometry args={[0.35 + R() * 0.5, 16, 12]} /><meshBasicMaterial color={col} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh></group>; })}
        </Stage>
        <div style={{ position: "absolute", left: 90, top: 300, opacity: E(t, w("webb") - 0.2, w("webb") + 0.3) }}>
          <svg width="300" height="270" viewBox="0 0 220 200">{[[110, 40], [70, 64], [150, 64], [70, 112], [150, 112], [110, 136], [110, 88]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 24} l21 12 v24 l-21 12 l-21 -12 v-24Z`} fill="url(#gold)" stroke="#fde68a" strokeWidth={2} />)}
            <defs><linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fde68a" /><stop offset="1" stopColor="#b45309" /></linearGradient></defs></svg>
          <div style={{ fontFamily: F, fontWeight: 900, fontSize: 40, color: theme.colors.primary, textAlign: "center" }}>JAMES WEBB</div></div>
        <Title at={W("astronomos") - 4} lines={["MAIS LONGE =", "MAIS ANTIGO"]} top={80} size={88} />
        <Tag at={W("treze") - 4}>GALÁXIAS COMO ERAM HÁ +13 BILHÕES DE ANOS</Tag>
      </Layer>
      <Layer o={L7}>
        <Stage pos={[0, 0, 0]} tgt={[0, -2 + tilt * 12, -20]} fov={60}><StarField n={16000} size={0.7} /><Nebula seed={30} z={-60} opacity={0.5} /></Stage>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, transform: `translateY(${tilt * 420}px)` }}>
          <path d="M0 860 Q 480 780 960 840 T 1920 820 L1920 1080 L0 1080Z" fill="#02030a" />
          <g transform="translate(960 800)" fill="#02030a"><circle cx={0} cy={-150} r={40} /><path d="M-50 -110 h100 l20 120 h-140Z" /><rect x={-40} y={0} width={30} height={80} /><rect x={10} y={0} width={30} height={80} /></g>
        </svg>
        <Title at={W("olhar") - 3} lines={["OLHAR PRO CÉU", "É OLHAR PRO PASSADO"]} top={120} size={96} />
      </Layer>
      <Sfx at={W("lua") - 3} src="swoosh.wav" vol={0.18} />
      <Sfx at={W("sol") - 3} src="swoosh.wav" vol={0.18} />
      <Sfx at={W("explodisse") - 2} src="impact.wav" vol={0.28} />
      <Sfx at={W("webb") - 4} src="sparkle.wav" vol={0.18} />
      <Sfx at={W("olhar") - 4} src="sparkle.wav" vol={0.2} />
    </AbsoluteFill>
  );
};

/* ================= #6 FASTER THAN A PLANE ================= */
export const B6HD: React.FC = () => {
  const { t, w, W } = useBlock("b6"); const f = useCurrentFrame();
  const M1 = win(t, 3.0, w("terra") - 0.2), M2 = win(t, w("terra") - 0.2, w("ao") - 0.2), M3 = win(t, w("ao") - 0.2, w("sistema") - 0.2), M4 = win(t, w("sistema") - 0.2, w("sente") - 0.8),
    M5 = win(t, w("sente") - 0.8, w("galileu") - 0.3), M6 = win(t, w("galileu") - 0.3, w("incomoda") - 0.4), M7 = win(t, w("incomoda") - 0.4, 999);
  const cnt = (a: number, b: number, to: number) => fmt(interpolate(t, [a, b], [0, to], { ...cl, easing: Easing.out(Easing.cubic) }));
  const brake = E(t, w("freada") - 0.6, w("freada") + 0.2);
  const orbitA = t * 0.6;
  return (
    <AbsoluteFill>
      <Layer o={M1}>
        <Stage pos={[0, 0.5, 4.2]} tgt={[0, 0, 0]} fov={45}>
          <StarField n={5000} size={0.4} /><ambientLight intensity={0.2} /><directionalLight position={[4, 2, 4]} intensity={2.6} />
          <EarthHD pos={[0, -2.4, 0]} r={2.4} spin={t * 0.15} tilt={0.2} />
        </Stage>
        <Title at={sec(3.2)} lines={["VOCÊ ESTÁ MAIS RÁPIDO", "QUE UM AVIÃO"]} top={70} size={86} />
        <Counter at={W("aviao") - 2} label="AVIÃO" value="~900 km/h" color="#cbd5e1" x={560} y={560} size={64} />
        <Counter at={W("aviao") + 6} label="VOCÊ, AGORA" value="+1.500 km/h" x={1360} y={560} size={64} />
      </Layer>
      <Layer o={M2}>
        <Stage pos={[0, 0.3, 5.4]} tgt={[0, 0, 0]} fov={40}>
          <StarField n={5000} size={0.4} /><ambientLight intensity={0.15} /><directionalLight position={[4, 2, 5]} intensity={2.6} />
          <EarthHD r={1.7} spin={-1.7 + t * 0.6} tilt={0.3} />
        </Stage>
        <Title at={W("gira") - 4} lines={["A TERRA GIRA"]} top={80} size={92} />
        <Counter at={W("brasil") - 4} label="NO BRASIL" value={`${cnt(w("brasil"), w("hora"), 1500)} km/h`} x={1500} y={520} />
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
        <Stage pos={[0, 1.2, 5.5]} tgt={[0, 0.4, 0]} fov={45}>
          <StarField n={4000} size={0.4} /><Nebula seed={40} colors={["#0891b2", "#16a34a"]} z={-40} opacity={0.3} />
          <HoloBody color="#7dd3fc" pos={[0, -0.6, 0]} spin={t * 0.3} />
          {Array.from({ length: 14 }).map((_, i) => { const x = ((i * 1.1 + t * 2.2) % 15) - 7.5; return <mesh key={i} position={[x, -1.62, -0.5 + (i % 3) * 0.6]}><boxGeometry args={[0.6, 0.02, 0.1]} /><meshBasicMaterial color="#fbbf24" toneMapped={false} /></mesh>; })}
          {Array.from({ length: 8 }).map((_, i) => { const x = ((i * 2.1 + t * 2.2) % 16) - 8; return <Glow key={i} pos={[x, 1.6 + (i % 3) * 0.4, -3]} size={1.5} color="#e0f2fe" opacity={0.35} />; })}
        </Stage>
        <Title at={W("sente") - 4} lines={["POR QUE VOCÊ", "NÃO SENTE NADA?"]} top={70} size={88} />
        <Tag at={W("junto") - 4} bottom={260} color="#22D3EE">TUDO SE MOVE JUNTO COM VOCÊ</Tag>
        <Tag at={W("percebe") - 4} bottom={150}>O CORPO SÓ SENTE MUDANÇAS DE VELOCIDADE</Tag>
      </Layer>
      <Layer o={M6}>
        <AbsoluteFill style={{ background: "linear-gradient(#0b2a4a, #071a33 60%, #052036)" }} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <defs><linearGradient id="hull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9a3412" /><stop offset="1" stopColor="#431407" /></linearGradient><linearGradient id="sail" x1="0" x2="1"><stop offset="0" stopColor="#fff7ed" /><stop offset="1" stopColor="#e7e5e4" /></linearGradient></defs>
          {Array.from({ length: 6 }).map((_, i) => <path key={i} d={`M0 ${780 + i * 45} Q 240 ${760 + i * 45 + Math.sin(t * 2 + i) * 12} 480 ${780 + i * 45} T 960 ${780 + i * 45} T 1440 ${780 + i * 45} T 1920 ${780 + i * 45}`} stroke={`rgba(147,197,253,${0.45 - i * 0.05})`} strokeWidth={5} fill="none" transform={`translate(${-((f * 2 + i * 60) % 480)} 0)`} />)}
          <g transform={`translate(960 ${720 + Math.sin(t * 1.5) * 5})`}>
            <path d="M-460 0 L460 0 L370 120 L-370 120Z" fill="url(#hull)" /><rect x={-380} y={-210} width={760} height={210} rx={12} fill="#a16207" />
            <rect x={-350} y={-190} width={700} height={170} rx={10} fill="#fef3c7" />
            <circle cx={-150} cy={-130 + ((t * 120) % 95)} r={16} fill="#dc2626" /><g transform="translate(-210 -100)"><circle cx={0} cy={-28} r={22} fill="#E9C3A1" /><rect x={-22} y={-6} width={44} height={76} rx={16} fill="#1e3a8a" /></g>
            <ellipse cx={160} cy={-70} rx={66} ry={44} fill="rgba(56,189,248,.45)" stroke="#0369a1" strokeWidth={4} /><path d={`M${140 + Math.sin(t * 3) * 22} -70 l22 -9 v18Z`} fill="#f97316" />
            <rect x={-7} y={-500} width={14} height={290} fill="#78350f" /><path d="M7 -490 Q 230 -380 7 -230Z" fill="url(#sail)" />
          </g>
        </svg>
        <Title at={W("galileu") - 3} lines={["O NAVIO DE GALILEU", "1632"]} top={70} size={84} />
        <Tag at={W("parado") - 4}>LÁ DENTRO, NÃO DÁ PRA SABER SE ESTÁ PARADO</Tag>
      </Layer>
      <Layer o={M7}>
        <AbsoluteFill style={{ background: "linear-gradient(#1e1b4b, #0f172a)" }} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <rect x={0} y={780} width={1920} height={300} fill="#111827" />{Array.from({ length: 8 }).map((_, i) => <rect key={i} x={((i * 280 - f * 24 * (1 - brake)) % 2240 + 2240) % 2240 - 160} y={900} width={150} height={14} rx={7} fill="#FBBF24" />)}
          <g transform={`translate(820 ${630 + brake * 8}) rotate(${brake * 2.5})`}>
            <path d="M0 150 L0 70 Q 70 -10 220 -10 L380 -10 Q 470 0 500 80 L530 150Z" fill="#dc2626" /><rect x={200} y={10} width={160} height={66} rx={12} fill="#bae6fd" />
            <circle cx={110} cy={150} r={48} fill="#111" stroke="#9ca3af" strokeWidth={8} /><circle cx={420} cy={150} r={48} fill="#111" stroke="#9ca3af" strokeWidth={8} />
            <g transform={`translate(280 46) rotate(${brake * 28})`}><circle cx={0} cy={-22} r={18} fill="#E9C3A1" /></g>
          </g>
          {brake > 0.3 && [0, 1, 2].map((i) => <path key={i} d={`M${760 - i * 50} ${700 + i * 30} h-140`} stroke="#fde68a" strokeWidth={8} strokeLinecap="round" opacity={brake} />)}
        </svg>
        <Title at={W("incomoda") - 4} lines={["SÓ INCOMODA QUANDO", "MUDA DE REPENTE"]} top={70} size={88} />
      </Layer>
      <Sfx at={W("gira") - 3} src="swoosh.wav" vol={0.18} />
      <Sfx at={W("ao") - 3} src="swoosh.wav" vol={0.18} />
      <Sfx at={W("sistema") - 3} src="riser.wav" vol={0.16} />
      <Sfx at={W("freada") - 2} src="impact.wav" vol={0.22} />
    </AbsoluteFill>
  );
};
