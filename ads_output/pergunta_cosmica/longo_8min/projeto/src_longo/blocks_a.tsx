import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, random, staticFile, Img } from "remotion";
import { useLoader } from "@react-three/fiber";
import { theme, FPS } from "./theme";
import { useBlock, sec, Sfx } from "./core";
import { Canvas3D, Stars, Glow, project, V3 } from "./three";
import { Rise, Pill, useAbsSpring } from "./ui";
import { BgMesh } from "./components/Layers";
import { Shine } from "./fx";
import { cl } from "./cl";

const S: React.CSSProperties = { fontFamily: theme.fonts.display, fontWeight: 900 };
const H: React.CSSProperties = { fontFamily: theme.fonts.display, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.0, color: "#fff", textShadow: "0 8px 30px rgba(0,0,0,.85)" };
const eio = Easing.bezier(0.65, 0, 0.35, 1);
const win = (t: number, a: number, b: number, fade = 0.35) => { const fd = Math.max(0.02, Math.min(fade, (b - a) / 2.2)); if (b - a < 0.08) return 0; return interpolate(t, [a - fd, a, b - fd, b], [0, 1, 1, 0], cl); };
const Fade: React.FC<{ o: number; children: React.ReactNode; z?: number }> = ({ o, children, z = 0 }) => o > 0.003 ? <AbsoluteFill style={{ opacity: o, transform: `scale(${1 + (1 - o) * 0.06})`, zIndex: z }}>{children}</AbsoluteFill> : null;

/* ---------- 3D atom ---------- */
export const Atom: React.FC<{ pos: V3; t: number; r?: number; cloud?: string; e?: number; seed?: number; glow?: number }> = ({ pos, t, r = 0.5, cloud = "#22D3EE", e = 3, seed = 0, glow = 1 }) => (
  <group position={pos}>
    <mesh><sphereGeometry args={[r * 0.16, 24, 24]} /><meshStandardMaterial color="#F87171" emissive="#ef4444" emissiveIntensity={0.6} /></mesh>
    <mesh><sphereGeometry args={[r, 32, 32]} /><meshBasicMaterial color={cloud} transparent opacity={0.08 * glow} depthWrite={false} /></mesh>
    <Glow pos={[0, 0, 0]} size={r * 2.1} color={cloud} opacity={0.3 * glow} />
    {Array.from({ length: e }).map((_, i) => { const a = t * (2.2 + i * 0.4) + i * 2.1 + seed; const tilt = i * 1.05 + seed;
      const p = new THREE.Vector3(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78, 0).applyEuler(new THREE.Euler(tilt, tilt * 0.7, 0));
      return <group key={i}><mesh position={p}><sphereGeometry args={[r * 0.07, 12, 12]} /><meshBasicMaterial color="#E0F2FE" /></mesh><Glow pos={p.toArray() as V3} size={r * 0.45} color="#BAE6FD" opacity={0.9} /></group>; })}
  </group>
);

/* ================= INTRO ================= */
export const Intro: React.FC = () => {
  const { t, w, W } = useBlock("intro"); const f = useCurrentFrame();
  const a = win(t, 0, w("nunca") - 0.25), b = win(t, w("nunca") - 0.25, w("passado") - 0.75), c = win(t, w("passado") - 0.75, w("feito") - 0.3), d = win(t, w("feito") - 0.3, w("proximos") - 0.2), e = win(t, w("proximos") - 0.2, w("numero") - 0.3), g = interpolate(t, [w("numero") - 0.6, w("numero") - 0.3], [0, 1], cl);
  const burst = interpolate(t, [w("feito") - 0.1, w("estrelas") + 0.9], [0, 1], { ...cl, easing: Easing.out(Easing.cubic) });
  const titleP = useAbsSpring(W("proximos") - 2, 0, theme.spring.bouncy);
  return (
    <AbsoluteFill>
      {/* 0: "tudo o que você acha..." starfield push + glitch title */}
      <Fade o={a}>
        <Canvas3D pos={[0, 0, 6 - t * 0.8]} tgt={[0, 0, -20]} fov={60}><Stars n={3000} size={0.2} /></Canvas3D>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><div style={{ ...H, fontSize: 92, textAlign: "center", transform: f % 23 < 2 ? "translateX(6px)" : undefined, textShadow: f % 23 < 2 ? "4px 0 #22D3EE, -4px 0 #F87171" : H.textShadow }}>TUDO O QUE VOCÊ SABE<br />SOBRE A REALIDADE…</div></AbsoluteFill>
      </Fade>
      {/* 1: atoms approaching (never touch) */}
      <Fade o={b}>
        <Canvas3D pos={[0, 0.2, 4.2]} tgt={[0, 0, 0]} fov={40}>
          <Stars n={800} />
          <ambientLight intensity={0.6} />
          <Atom pos={[-1.15 + Math.min(0.32, (t - w("nunca")) * 0.25), 0, 0]} t={t} r={0.62} />
          <Atom pos={[1.15 - Math.min(0.32, (t - w("nunca")) * 0.25), 0, 0]} t={t} r={0.62} cloud="#A78BFA" seed={1.3} />
        </Canvas3D>
        <AbsoluteFill style={{ top: 120, alignItems: "center" }}><Rise at={W("nunca") - 3} start={0}><div style={{ ...H, fontSize: 70 }}>VOCÊ NUNCA TOCOU EM NADA</div></Rise></AbsoluteFill>
      </Fade>
      {/* 2: light from stars = past */}
      <Fade o={c}>
        <Canvas3D pos={[0, 0, 7]} tgt={[0, 0, 0]} fov={50}>
          <Stars n={2500} size={0.22} />
          {Array.from({ length: 7 }).map((_, i) => { const x = -6 + i * 2 + random(`sx${i}`); const y = -2 + random(`sy${i}`) * 4; const ph = ((t * 0.6 + random(`sp${i}`)) % 1);
            return <group key={i}><Glow pos={[x, y, -8]} size={1.4} color="#fde68a" /><mesh position={[x * (1 - ph * 0.6), y * (1 - ph * 0.6), -8 + ph * 12]}><sphereGeometry args={[0.04, 8, 8]} /><meshBasicMaterial color="#fff" /></mesh></group>; })}
        </Canvas3D>
        <AbsoluteFill style={{ top: 120, alignItems: "center" }}><Rise at={W("passado") - 18} start={0}><div style={{ ...H, fontSize: 70 }}>VOCÊ ESTÁ VENDO O PASSADO</div></Rise></AbsoluteFill>
      </Fade>
      {/* 3: supernova -> stardust */}
      <Fade o={d}>
        <Canvas3D pos={[0, 0, 6]} tgt={[0, 0, 0]} fov={50}>
          <Stars n={1500} />
          <Glow pos={[0, 0, 0]} size={2 + burst * 9} color="#fbbf24" opacity={1 - burst * 0.6} />
          <Glow pos={[0, 0, 0]} size={1 + burst * 3} color="#ffffff" opacity={1 - burst} />
          {Array.from({ length: 160 }).map((_, i) => { const dir = new THREE.Vector3(random(`b${i}`) - 0.5, random(`c${i}`) - 0.5, random(`d${i}`) - 0.5).normalize(); const dd = burst * (2 + random(`e${i}`) * 3);
            return <mesh key={i} position={dir.multiplyScalar(dd).toArray() as V3}><sphereGeometry args={[0.025 + random(`f${i}`) * 0.03, 6, 6]} /><meshBasicMaterial color={["#fbbf24", "#f87171", "#a78bfa", "#22d3ee"][i % 4]} transparent opacity={1 - burst * 0.5} /></mesh>; })}
        </Canvas3D>
        <AbsoluteFill style={{ top: 120, alignItems: "center" }}><Rise at={W("feito") - 4} start={0}><div style={{ ...H, fontSize: 70 }}>VOCÊ É FEITO DE ESTRELAS</div></Rise></AbsoluteFill>
      </Fade>
      {/* 4: title card */}
      <Fade o={e + g * 0}>
        <BgMesh a="#4c1d95" b="#FBBF24" base={theme.colors.bg} />
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ ...S, fontSize: 200, color: theme.colors.primary, lineHeight: 0.9, transform: `scale(${0.6 + 0.4 * titleP})`, opacity: titleP, textShadow: `0 0 80px ${theme.colors.glow}` }}>8</div>
          <div style={{ opacity: titleP, transform: `translateY(${(1 - titleP) * 30}px)`, textAlign: "center" }}><Shine at={W("proximos") + 6} start={0}><div style={{ ...H, fontSize: 78 }}>COISAS SOBRE A REALIDADE</div><div style={{ ...H, fontSize: 78, color: theme.colors.primary }}>QUE PARECEM MENTIRA</div></Shine></div>
          <Rise at={W("ciencia") - 3} start={0}><Pill bg="#fff" size={36}>MAS SÃO CIÊNCIA</Pill></Rise>
        </AbsoluteFill>
      </Fade>
      {/* 5: galaxy tease for #1 */}
      <Fade o={g}>
        <Canvas3D pos={[0, 3.5 - (t - w("numero")) * 0.3, 5]} tgt={[0, 0, 0]} fov={50}>
          <Stars n={1500} />
          {Array.from({ length: 900 }).map((_, i) => { const arm = i % 3; const rr = 0.2 + (i / 900) * 3.2; const a = rr * 1.6 + (arm * 2 * Math.PI) / 3 + t * 0.15 + (random(`g${i}`) - 0.5) * 0.5;
            return <mesh key={i} position={[Math.cos(a) * rr, (random(`h${i}`) - 0.5) * 0.15, Math.sin(a) * rr]}><sphereGeometry args={[0.02, 4, 4]} /><meshBasicMaterial color={rr < 0.8 ? "#fde68a" : i % 5 ? "#c4b5fd" : "#22d3ee"} /></mesh>; })}
          <Glow pos={[0, 0, 0]} size={2.4} color="#fde68a" opacity={0.9} />
        </Canvas3D>
        <AbsoluteFill style={{ top: 120, alignItems: "center" }}><Rise at={W("numero")} start={0}><div style={{ ...H, fontSize: 64 }}>E A Nº 1 VAI MUDAR</div><div style={{ ...H, fontSize: 64, color: theme.colors.primary }}>COMO VOCÊ VÊ O CÉU</div></Rise></AbsoluteFill>
      </Fade>
      <Sfx at={0} src="riser.wav" vol={0.15} />
      <Sfx at={W("nunca") - 4} src="swoosh.wav" vol={0.2} />
      <Sfx at={W("passado") - 4} src="swoosh.wav" vol={0.2} />
      <Sfx at={W("estrelas") - 18} src="impact.wav" vol={0.3} />
      <Sfx at={W("proximos") - 4} src="impact.wav" vol={0.35} />
      <Sfx at={W("proximos")} src="sparkle.wav" vol={0.2} />
      <Sfx at={W("numero") - 4} src="swoosh.wav" vol={0.2} />
    </AbsoluteFill>
  );
};

/* ================= #8 NEVER TOUCHED ================= */
export const B8: React.FC = () => {
  const { t, w, W } = useBlock("b8"); const f = useCurrentFrame();
  const sA = w("tudo") - 0.3, sB = w("quando") - 0.3, sC = w("sente") - 0.3, sD = w("mesma") - 0.3, sE = w("ou") - 0.3, end = w("zero") + 1.2;
  const A = win(t, 3.1, sB), B = win(t, sB, sD), Dm = win(t, sD, sE), E = win(t, sE, end + 2);
  // zoom levels for scene A/B
  const zoomP = interpolate(t, [sA, sB + 2.5], [0, 1], { ...cl, easing: eio });
  const scaleTxt = ["1 cm", "1 mm", "0,001 mm", "0,000001 mm"][Math.min(3, Math.floor(zoomP * 3.999))];
  const gap = interpolate(t, [sB, sB + 2.5], [1.8, 1.08], { ...cl, easing: Easing.out(Easing.cubic) });
  const wob = Math.sin(t * 9) * 0.015 * (t > sB + 2.5 ? 1 : 0);
  const rep = interpolate(t, [w("repelem") - 0.3, w("repelem") + 0.3], [0, 1], cl);
  const lattice = (y: number, col: string, seed: number) => Array.from({ length: 7 }).map((_, i) => <Atom key={`${y}${i}`} pos={[-3 + i, y, 0]} t={t + i * 0.3} r={0.42} cloud={col} seed={seed + i} e={2} />);
  return (
    <AbsoluteFill>
      <Fade o={A}>
        <BgMesh a="#0e7490" b="#4c1d95" base={theme.colors.bg} />
        <Canvas3D pos={[0, 0.4, 7 - zoomP * 2]} tgt={[0, 0, 0]} fov={40}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[2, 4, 5]} intensity={1.5} />
          {/* table surface made of atoms + fingertip lattice */}
          <group position={[0, -1.1, 0]}>{lattice(0, "#A78BFA", 1)}{lattice(-1, "#A78BFA", 3)}</group>
          <group position={[0, 1.6 - zoomP * 0.4, 0]}>{lattice(0, "#22D3EE", 5)}{lattice(1, "#22D3EE", 7)}</group>
        </Canvas3D>
        <AbsoluteFill style={{ top: 70, alignItems: "center" }}><Rise at={sec(3.2)} start={0}><div style={{ ...H, fontSize: 60 }}>TUDO É FEITO DE ÁTOMOS</div></Rise></AbsoluteFill>
        <div style={{ position: "absolute", left: 80, top: 300 }}><Rise at={W("eletrons") - 3} start={0}><Pill bg="#22D3EE" size={34}>ELÉTRONS: CARGA NEGATIVA (−)</Pill></Rise></div>
        <div style={{ position: "absolute", right: 80, bottom: 190, display: "flex", alignItems: "center", gap: 14 }}><div style={{ width: 160, height: 6, background: "#fff" }} /><div style={{ ...S, fontSize: 34, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{scaleTxt}</div></div>
      </Fade>
      <Fade o={B}>
        <BgMesh a="#0e7490" b="#7f1d1d" base={theme.colors.bg} />
        <Canvas3D pos={[0, 0, 6.2]} tgt={[0, 0, 0]} fov={40}>
          <ambientLight intensity={0.7} />
          <Atom pos={[-gap - wob, 0, 0]} t={t} r={0.85} cloud="#22D3EE" e={4} />
          <Atom pos={[gap + wob, 0, 0]} t={t} r={0.85} cloud="#A78BFA" e={4} seed={1.7} />
        </Canvas3D>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: rep }}>
          {Array.from({ length: 7 }).map((_, i) => { const yy = 540 + (i - 3) * 70; const bend = (i - 3) * 30; return <path key={i} d={`M960 ${yy} q ${-60 - Math.abs(bend)} ${bend * 0.4} -150 ${bend}`} stroke="#F87171" strokeWidth={5} fill="none" opacity={0.8 - Math.abs(i - 3) * 0.1} strokeDasharray="14 10" strokeDashoffset={-f * 2} />; })}
          {Array.from({ length: 7 }).map((_, i) => { const yy = 540 + (i - 3) * 70; const bend = (i - 3) * 30; return <path key={`r${i}`} d={`M960 ${yy} q ${60 + Math.abs(bend)} ${bend * 0.4} 150 ${bend}`} stroke="#F87171" strokeWidth={5} fill="none" opacity={0.8 - Math.abs(i - 3) * 0.1} strokeDasharray="14 10" strokeDashoffset={-f * 2} />; })}
          <text x={960 - 300} y={330} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={70} fill="#22D3EE">−</text>
          <text x={960 + 300} y={330} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={70} fill="#A78BFA">−</text>
        </svg>
        <AbsoluteFill style={{ top: 70, alignItems: "center" }}><Rise at={W("repelem") - 4} start={0} cfg={theme.spring.bouncy}><div style={{ ...H, fontSize: 64, color: "#F87171" }}>REPULSÃO ELÉTRICA</div></Rise></AbsoluteFill>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 200, display: "flex", justifyContent: "center" }}><Rise at={W("bilionesimo") - 4} start={0}><Pill bg={theme.colors.primary} size={36} glow>DISTÂNCIA: MENOS DE 0,000000001 m</Pill></Rise></div>
        <div style={{ position: "absolute", left: 120, top: 240 }}><Rise at={W("sente") - 3} start={0}><Pill bg="#fff" size={32}>O "TOQUE" = ESSA FORÇA</Pill></Rise></div>
      </Fade>
      <Fade o={Dm}>
        <BgMesh a="#7f1d1d" b="#1e3a8a" base={theme.colors.bg} />
        <AbsoluteFill style={{ top: 70, alignItems: "center" }}><Rise at={W("ima") - 4} start={0}><div style={{ ...H, fontSize: 60 }}>COMO DOIS ÍMÃS</div></Rise></AbsoluteFill>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {[-1, 1].map((sd) => { const x = 960 + sd * (230 + Math.sin(t * 4) * 12); return (
            <g key={sd} transform={`translate(${x} 540)`}>
              <rect x={-150} y={-70} width={150} height={140} rx={14} fill={sd < 0 ? "#2563eb" : "#dc2626"} /><rect x={0} y={-70} width={150} height={140} rx={14} fill={sd < 0 ? "#dc2626" : "#2563eb"} />
              <text x={-75} y={22} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={64} fill="#fff">{sd < 0 ? "S" : "N"}</text><text x={75} y={22} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={64} fill="#fff">{sd < 0 ? "N" : "S"}</text>
            </g>); })}
          {[-1, 1].map((sd) => <path key={sd} d={`M${960 + sd * 50} 540 l${sd * 40} -26 v52Z`} fill="#FBBF24" />)}
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 200, display: "flex", justifyContent: "center" }}><Rise at={W("solidos") - 4} start={0}><Pill bg="#fff" size={36}>SEM ISSO, NADA SERIA SÓLIDO</Pill></Rise></div>
      </Fade>
      <Fade o={E}>
        <BgMesh a="#4c1d95" b="#FBBF24" base={theme.colors.bg} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {/* chair */}
          <rect x={760} y={640} width={400} height={34} rx={10} fill="#7c2d12" /><rect x={1110} y={380} width={40} height={294} rx={10} fill="#7c2d12" />
          <rect x={780} y={674} width={26} height={230} fill="#7c2d12" /><rect x={1114} y={674} width={26} height={230} fill="#7c2d12" />
          {/* person */}
          <g transform={`translate(0 ${-8 - Math.sin(t * 3) * 3})`}>
            <rect x={840} y={590} width={250} height={44} rx={22} fill="#22D3EE" /><rect x={1000} y={400} width={80} height={200} rx={36} fill="#22D3EE" /><circle cx={1040} cy={350} r={52} fill="#E9C3A1" />
            <rect x={830} y={600} width={40} height={220} rx={18} fill="#1e3a8a" transform="rotate(8 850 600)" />
          </g>
          {/* magnifier on gap */}
          <circle cx={600} cy={420} r={150} fill="#0b1022" stroke={theme.colors.primary} strokeWidth={8} />
          <line x1={700} y1={530} x2={860} y2={630} stroke={theme.colors.primary} strokeWidth={8} />
          <rect x={470} y={430} width={260} height={50} fill="#7c2d12" /><rect x={470} y={330} width={260} height={50 + Math.sin(t * 3) * 3} fill="#22D3EE" />
          <text x={600} y={418} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={30} fill="#FBBF24">↕ ESPAÇO</text>
        </svg>
        <AbsoluteFill style={{ top: 70, alignItems: "center" }}><Rise at={W("cadeira") - 4} start={0}><div style={{ ...H, fontSize: 60 }}>VOCÊ ESTÁ FLUTUANDO</div></Rise></AbsoluteFill>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 200, display: "flex", justifyContent: "center" }}><Rise at={W("zero") - 4} start={0} cfg={theme.spring.bouncy}><Pill bg={theme.colors.primary} size={36} glow>A DISTÂNCIA NUNCA CHEGA A ZERO</Pill></Rise></div>
      </Fade>
      <Sfx at={W("repelem") - 3} src="impact.wav" vol={0.18} />
      <Sfx at={W("ima") - 3} src="pop.mp3" vol={0.2} />
      <Sfx at={W("flutuando") - 3} src="sparkle.wav" vol={0.18} />
    </AbsoluteFill>
  );
};
