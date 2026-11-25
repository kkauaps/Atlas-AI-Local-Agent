import React from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, random, staticFile, Img } from "remotion";
import { useLoader } from "@react-three/fiber";
import { theme } from "./theme";
import { useBlock, sec, Sfx } from "./core";
import { Canvas3D, Stars, Glow, V3 } from "./three";
import { Rise, Pill, useAbsSpring } from "./ui";
import { BgMesh } from "./components/Layers";
import { Atom } from "./blocks_a";
import { cl } from "./cl";

const S: React.CSSProperties = { fontFamily: theme.fonts.display, fontWeight: 900 };
const H: React.CSSProperties = { fontFamily: theme.fonts.display, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.0, color: "#fff", textShadow: "0 8px 30px rgba(0,0,0,.85)", textAlign: "center" };
const win = (t: number, a: number, b: number, fade = 0.35) => { const fd = Math.max(0.02, Math.min(fade, (b - a) / 2.2)); if (b - a < 0.08) return 0; return interpolate(t, [a - fd, a, b - fd, b], [0, 1, 1, 0], cl); };
const Fade: React.FC<{ o: number; children: React.ReactNode }> = ({ o, children }) => o > 0.003 ? <AbsoluteFill style={{ opacity: o, transform: `scale(${1 + (1 - o) * 0.06})` }}>{children}</AbsoluteFill> : null;
const Top: React.FC<{ children: React.ReactNode }> = ({ children }) => <AbsoluteFill style={{ top: 70, alignItems: "center" }}>{children}</AbsoluteFill>;
const Bottom: React.FC<{ children: React.ReactNode }> = ({ children }) => <div style={{ position: "absolute", left: 0, right: 0, bottom: 200, display: "flex", justifyContent: "center" }}>{children}</div>;
const Big: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({ children, size = 64, color = "#fff" }) => <div style={{ ...H, fontSize: size, color }}>{children}</div>;
const Card: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = theme.colors.primary, style }) => (
  <div style={{ padding: "14px 30px", borderRadius: 22, background: "rgba(0,0,0,.55)", border: `3px solid ${color}`, textAlign: "center", ...style }}>{children}</div>
);
const Planet: React.FC<{ tex: string; pos: V3; r: number; spin: number }> = ({ tex, pos, r, spin }) => {
  const [m] = useLoader(THREE.TextureLoader, [staticFile(tex)]);
  return <mesh position={pos} rotation={[0.3, spin, 0]}><sphereGeometry args={[r, 64, 64]} /><meshStandardMaterial map={m} roughness={0.9} /></mesh>;
};
const SunBall: React.FC<{ pos: V3; r: number; t: number; tint?: string }> = ({ pos, r, t, tint = "#ffffff" }) => {
  const [m] = useLoader(THREE.TextureLoader, [staticFile("longo/sun.jpg")]);
  return <group position={pos}><mesh rotation={[0, t * 0.1, 0]}><sphereGeometry args={[r, 64, 64]} /><meshBasicMaterial map={m} color={tint} /></mesh><Glow pos={[0, 0, 0]} size={r * 4.5} color="#fbbf24" /><Glow pos={[0, 0, 0]} size={r * 8} color="#f59e0b" opacity={0.35} /></group>;
};
const Elem: React.FC<{ sym: string; name: string; num: number; color: string; size?: number }> = ({ sym, name, num, color, size = 150 }) => (
  <div style={{ width: size, height: size, borderRadius: 18, background: `linear-gradient(160deg, ${color}, rgba(0,0,0,.35))`, border: "3px solid rgba(255,255,255,.6)", position: "relative", boxShadow: `0 0 40px ${color}88`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
    <div style={{ position: "absolute", left: 12, top: 8, ...S, fontSize: size * 0.15, color: "#fff" }}>{num}</div>
    <div style={{ ...S, fontSize: size * 0.42, color: "#fff", lineHeight: 1 }}>{sym}</div>
    <div style={{ ...S, fontSize: size * 0.12, color: "#fff", opacity: 0.9 }}>{name}</div>
  </div>
);
// simple person silhouette (svg group), centered at feet
const Person: React.FC<{ x: number; y: number; s?: number; fill?: string; stroke?: string }> = ({ x, y, s = 1, fill = "#0f172a", stroke = "rgba(255,255,255,.5)" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill} stroke={stroke} strokeWidth={3 / s}>
    <circle cx={0} cy={-330} r={45} />
    <path d="M-70 -270 Q0 -290 70 -270 L85 -110 Q60 -100 50 -110 L45 -180 L40 -10 L10 -10 L0 -120 L-10 -10 L-40 -10 L-45 -180 L-50 -110 Q-60 -100 -85 -110 Z" />
  </g>
);
const Clock: React.FC<{ x: number; y: number; r: number; a: number; color: string; label?: string }> = ({ x, y, r, a, color, label }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill="rgba(0,0,0,.6)" stroke={color} strokeWidth={6} />
    {Array.from({ length: 12 }).map((_, i) => { const q = (i / 12) * Math.PI * 2; return <line key={i} x1={Math.sin(q) * r * 0.8} y1={-Math.cos(q) * r * 0.8} x2={Math.sin(q) * r * 0.92} y2={-Math.cos(q) * r * 0.92} stroke="#fff" strokeWidth={3} />; })}
    <line x1={0} y1={0} x2={Math.sin(a) * r * 0.75} y2={-Math.cos(a) * r * 0.75} stroke={color} strokeWidth={6} strokeLinecap="round" />
    <line x1={0} y1={0} x2={Math.sin(a / 12) * r * 0.5} y2={-Math.cos(a / 12) * r * 0.5} stroke="#fff" strokeWidth={7} strokeLinecap="round" />
    <circle r={8} fill={color} />
    {label && <text y={r + 46} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={30} fill={color}>{label}</text>}
  </g>
);

/* ================= #5 YOU ARE ALMOST EMPTY ================= */
export const B5: React.FC = () => {
  const { t, w, W } = useBlock("b5"); const f = useCurrentFrame();
  const P1 = win(t, 3.1, w("nucleo") - 0.2), P2 = win(t, w("nucleo") - 0.2, w("entre") - 0.2), P3 = win(t, w("entre") - 0.2, w("desse") - 0.3),
    P4 = win(t, w("desse") - 0.3, w("so") - 0.2), P5 = win(t, w("so") - 0.2, w("tem") - 0.2), P6 = win(t, w("tem") - 0.2, 999);
  const zoom = interpolate(t, [3.1, w("nucleo") - 0.3], [0, 1], { ...cl, easing: Easing.inOut(Easing.cubic) });
  const shrink = interpolate(t, [w("caberia"), w("cubo") + 0.3], [0, 1], { ...cl, easing: Easing.inOut(Easing.cubic) });
  const tons = Math.round(interpolate(t, [w("pesaria"), w("toneladas") + 0.6], [0, 500], { ...cl, easing: Easing.out(Easing.cubic) }));
  const massP = interpolate(t, [w("guarda"), w("massa") + 0.3], [0, 1], { ...cl, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <Fade o={P1}>
        <Canvas3D pos={[0, 0, 3.4 - zoom * 1.6]} tgt={[0, 0, 0]} fov={45}>
          <Stars n={600} /><ambientLight intensity={0.6} />
          <Atom pos={[0, 0, 0]} t={t} r={1.1} e={4} />
        </Canvas3D>
        <Top><Rise at={W("atomo") - 4} start={0}><Big size={66}>UM ÁTOMO É QUASE TODO VAZIO</Big></Rise></Top>
        <Bottom><Rise at={W("espaco") - 4} start={0} cfg={theme.spring.bouncy}><Pill bg={theme.colors.primary} size={38} glow>~99,9999999% ESPAÇO VAZIO</Pill></Rise></Bottom>
      </Fade>
      <Fade o={P2}>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #0b3d1f 0%, #03140a 70%)" }} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <ellipse cx={960} cy={600} rx={860} ry={420} fill="#1f2937" stroke="#475569" strokeWidth={6} />
          {Array.from({ length: 9 }).map((_, i) => <ellipse key={i} cx={960} cy={600} rx={860 - i * 22} ry={420 - i * 11} fill="none" stroke={i % 2 ? "#334155" : "#3f4b5e"} strokeWidth={10} />)}
          <rect x={560} y={400} width={800} height={400} rx={30} fill="#15803d" stroke="#fff" strokeWidth={4} />
          <line x1={960} y1={400} x2={960} y2={800} stroke="#fff" strokeWidth={4} /><circle cx={960} cy={600} r={70} fill="none" stroke="#fff" strokeWidth={4} />
          {(() => { const p = useAbsSpring(W("formiga") - 2, 0, theme.spring.bouncy); return <g transform={`translate(960 600) scale(${p})`}><circle r={5} fill="#F87171" /><circle r={26} fill="none" stroke="#F87171" strokeWidth={3} /><text y={-40} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={30} fill="#FCA5A5">NÚCLEO = FORMIGA</text></g>; })()}
          {t > w("eletrons") - 0.2 && Array.from({ length: 3 }).map((_, i) => { const a = t * (0.9 + i * 0.25) + i * 2.1; const x = 960 + Math.cos(a) * 760, y = 600 + Math.sin(a) * 370;
            return <g key={i}><circle cx={x} cy={y} r={16} fill="#BAE6FD" /><circle cx={x} cy={y} r={34} fill="#22D3EE" opacity={0.3} /></g>; })}
        </svg>
        <Top><Rise at={W("nucleo") - 3} start={0}><Big size={58}>SE O NÚCLEO FOSSE UMA FORMIGA NO ESTÁDIO…</Big></Rise></Top>
        <Bottom><Rise at={W("arquibancadas") - 6} start={0} cfg={theme.spring.bouncy}><Pill bg="#22D3EE" size={36}>…OS ELÉTRONS ESTARIAM NAS ARQUIBANCADAS</Pill></Rise></Bottom>
      </Fade>
      <Fade o={P3}>
        <AbsoluteFill style={{ background: "#000" }} />
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <Rise at={W("entre") - 2} start={0}><Big size={70} color={theme.colors.textDim}>E ENTRE ELES…</Big></Rise>
          <div style={{ height: 30 }} />
          <Rise at={W("nada") - 2} start={0} cfg={theme.spring.bouncy}><div style={{ ...H, fontSize: 170, letterSpacing: "0.3em", opacity: 0.9, transform: `scale(${1 + (t - w("nada")) * 0.03})` }}>NADA</div></Rise>
        </AbsoluteFill>
      </Fade>
      <Fade o={P4}>
        <BgMesh a="#1e3a8a" b="#A78BFA" base={theme.colors.bg} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 220 }).map((_, i) => { const x0 = 100 + random(`px${i}`) * 1720, y0 = 330 + random(`py${i}`) * 560; const x = x0 + (960 - x0) * shrink, y = y0 + (640 - y0) * shrink; const s = 0.16 * (1 - shrink * 0.9);
            return shrink < 0.98 ? <Person key={i} x={x} y={y} s={s} fill={["#22D3EE", "#A78BFA", "#FBBF24", "#F87171"][i % 4]} stroke="none" /> : null; })}
          {shrink > 0.85 && (() => { const p = interpolate(shrink, [0.85, 1], [0, 1], cl); return <g transform={`translate(960 600) scale(${p})`}>
            <path d="M-60 -20 L0 -50 L60 -20 L0 10Z" fill="#ffffff" /><path d="M-60 -20 L0 10 L0 80 L-60 50Z" fill="#e2e8f0" /><path d="M60 -20 L0 10 L0 80 L60 50Z" fill="#cbd5e1" /></g>; })()}
        </svg>
        <Top><Rise at={W("humanidade") - 6} start={0}><Big size={56}>TODA A HUMANIDADE, SEM O ESPAÇO VAZIO…</Big></Rise></Top>
        <Bottom><Rise at={W("acucar") - 4} start={0} cfg={theme.spring.bouncy}><Pill bg="#fff" size={40}>= UM CUBO DE AÇÚCAR</Pill></Rise></Bottom>
      </Fade>
      <Fade o={P5}>
        <BgMesh a="#7f1d1d" b="#FBBF24" base={theme.colors.bg} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(960 ${560 + interpolate(t, [w("pesaria"), w("pesaria") + 0.6], [0, 60], cl)})`}>
            <path d="M-110 -30 L0 -85 L110 -30 L0 25Z" fill="#fff" /><path d="M-110 -30 L0 25 L0 150 L-110 95Z" fill="#e2e8f0" /><path d="M110 -30 L0 25 L0 150 L110 95Z" fill="#cbd5e1" />
          </g>
          <rect x={560} y={720} width={800} height={60} rx={14} fill="#334155" /><rect x={900} y={780} width={120} height={140} fill="#475569" />
          {interpolate(t, [w("pesaria"), w("pesaria") + 0.5], [0, 1], cl) > 0.5 && [0, 1, 2].map((i) => <path key={i} d={`M${700 + i * 260} 700 l-30 -40 m30 40 l30 -40`} stroke="#FBBF24" strokeWidth={6} fill="none" opacity={0.6 + 0.4 * Math.sin(f / 3 + i)} />)}
        </svg>
        <Top><Rise at={W("cubinho") - 4} start={0}><Big size={60}>SÓ QUE ESSE CUBINHO PESARIA…</Big></Rise></Top>
        <div style={{ position: "absolute", right: 140, top: 360 }}><Card><div style={{ ...S, fontSize: 26, color: theme.colors.textDim }}>PESO</div><div style={{ ...S, fontSize: 60, color: theme.colors.primary }}>{tons} MILHÕES</div><div style={{ ...S, fontSize: 30, color: "#fff" }}>DE TONELADAS</div></Card></div>
      </Fade>
      <Fade o={P6}>
        <Canvas3D pos={[0, 0, 3.2]} tgt={[0, 0, 0]} fov={45}>
          <Stars n={500} /><ambientLight intensity={0.6} />
          <Atom pos={[-0.9, 0, 0]} t={t} r={1.0} e={4} glow={1.4} />
          <Glow pos={[-0.9, 0, 0]} size={0.6 + 0.15 * Math.sin(f / 5)} color="#F87171" opacity={massP} />
        </Canvas3D>
        <Top><Rise at={W("nucleo", 1) - 4} start={0}><Big size={58}>O NÚCLEO GUARDA QUASE TODA A MASSA</Big></Rise></Top>
        <div style={{ position: "absolute", left: 1080, top: 330, width: 680 }}>
          <div style={{ ...S, fontSize: 30, color: "#FCA5A5", marginBottom: 8 }}>NÚCLEO</div>
          <div style={{ height: 60, borderRadius: 14, background: "rgba(255,255,255,.1)", overflow: "hidden" }}><div style={{ height: "100%", width: `${massP * 99.9}%`, background: "linear-gradient(90deg,#ef4444,#F87171)" }} /></div>
          <div style={{ ...S, fontSize: 46, color: "#fff", marginTop: 6 }}>{(massP * 99.9).toFixed(1).replace(".", ",")}% DA MASSA</div>
          <div style={{ height: 40 }} />
          <div style={{ ...S, fontSize: 30, color: "#BAE6FD", marginBottom: 8, opacity: interpolate(t, [w("resto"), w("resto") + 0.4], [0, 1], cl) }}>ELÉTRONS + MUITO, MUITO ESPAÇO</div>
          <div style={{ height: 60, borderRadius: 14, background: "rgba(255,255,255,.1)", overflow: "hidden", opacity: interpolate(t, [w("resto"), w("resto") + 0.4], [0, 1], cl) }}><div style={{ height: "100%", width: "1.5%", background: "#22D3EE" }} /></div>
        </div>
      </Fade>
      <Sfx at={W("formiga") - 2} src="sparkle.wav" vol={0.16} />
      <Sfx at={W("nada") - 3} src="impact.wav" vol={0.28} />
      <Sfx at={W("caberia") - 3} src="riser.wav" vol={0.2} />
      <Sfx at={W("pesaria")} src="impact.wav" vol={0.3} />
      <Sfx at={W("guarda") - 2} src="swoosh.wav" vol={0.16} />
    </AbsoluteFill>
  );
};

/* ================= #4 COLORS ARE IN YOUR HEAD ================= */
const hue = (nm: number) => `hsl(${interpolate(nm, [400, 700], [275, 0], cl)} 95% 58%)`;
export const B4: React.FC = () => {
  const { t, w, W } = useBlock("b4"); const f = useCurrentFrame();
  const C1 = win(t, 3.1, w("luz") - 0.2), C2 = win(t, w("luz") - 0.2, w("seus") - 0.2), C3 = win(t, w("seus") - 0.2, w("exemplo") - 0.3), C4 = win(t, w("exemplo") - 0.3, w("camaroes") - 0.3),
    C5 = win(t, w("camaroes") - 0.3, w("nem") - 0.2), C6 = win(t, w("nem") - 0.2, 999);
  const colorIn = interpolate(t, [w("existem", 1), w("cabeca") + 0.4], [0, 1], cl);
  const mix = interpolate(t, [w("recebe"), w("tempo") + 0.3], [0, 1], { ...cl, easing: Easing.inOut(Easing.cubic) });
  const shrimp = interpolate(t, [w("doze") - 0.3, w("cor", 2) + 0.3], [0, 1], cl);
  const dalt = interpolate(t, [w("daltonismo"), w("daltonismo") + 0.8], [0, 1], cl);
  return (
    <AbsoluteFill>
      <Fade o={C1}>
        <AbsoluteFill style={{ background: "#0b0b0f" }} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <defs><radialGradient id="brainc"><stop offset="0" stopColor="#F87171" /><stop offset="0.35" stopColor="#FBBF24" /><stop offset="0.6" stopColor="#4ADE80" /><stop offset="1" stopColor="#60A5FA" /></radialGradient></defs>
          {[[300, 560], [520, 700], [1450, 620], [1650, 520]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={70 + i * 10} fill={["#9ca3af", "#6b7280", "#d1d5db", "#4b5563"][i]} />)}
          <g transform="translate(960 640)">
            <path d="M-170 220 Q-200 40 -150 -80 Q-90 -230 40 -220 Q190 -205 200 -60 Q205 20 170 60 L190 120 L150 130 Q150 200 80 200 L60 260 Z" fill="#1f2937" stroke="#94a3b8" strokeWidth={4} />
            <circle cx={10} cy={-70} r={120} fill="url(#brainc)" opacity={colorIn} transform={`rotate(${f * 2} 10 -70)`} />
          </g>
          <text x={380} y={860} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={34} fill="#9ca3af">LÁ FORA: SÓ LUZ</text>
          <text x={1540} y={860} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={34} fill="#9ca3af">LÁ FORA: SÓ LUZ</text>
        </svg>
        <Top><Rise at={W("cores") - 4} start={0}><Big size={64}>AS CORES NÃO EXISTEM LÁ FORA</Big></Rise></Top>
        <Bottom><Rise at={W("cabeca") - 6} start={0} cfg={theme.spring.bouncy}><Pill bg={theme.colors.primary} size={38} glow>ELAS SÃO CRIADAS NA SUA CABEÇA</Pill></Rise></Bottom>
      </Fade>
      <Fade o={C2}>
        <AbsoluteFill style={{ background: "#05060d" }} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {[700, 550, 420].map((nm, i) => { const y = 380 + i * 170; const k = (2 * Math.PI) / (nm * 0.55); const pts = Array.from({ length: 200 }).map((_, j) => { const x = 160 + j * 8; return `${x},${y + Math.sin((x - f * 6) * k) * 50}`; }).join(" ");
            return <g key={nm}><polyline points={pts} fill="none" stroke={hue(nm)} strokeWidth={7} /><text x={1800} y={y + 12} textAnchor="end" fontFamily="Montserrat" fontWeight={900} fontSize={30} fill={hue(nm)}>{nm} nm</text></g>; })}
          <defs><linearGradient id="spec" x1="0" x2="1">{[400, 450, 500, 550, 600, 650, 700].map((nm, i) => <stop key={i} offset={i / 6} stopColor={hue(nm)} />)}</linearGradient></defs>
          <rect x={360} y={880} width={1200} height={40} rx={20} fill="url(#spec)" /><text x={360} y={960} fontFamily="Montserrat" fontWeight={800} fontSize={26} fill="#cbd5e1">400 nm</text><text x={1560} y={960} textAnchor="end" fontFamily="Montserrat" fontWeight={800} fontSize={26} fill="#cbd5e1">700 nm</text>
        </svg>
        <Top><Rise at={W("luz") - 3} start={0}><Big size={58}>LUZ = ENERGIA EM ONDAS DE TAMANHOS DIFERENTES</Big></Rise></Top>
      </Fade>
      <Fade o={C3}>
        <BgMesh a="#4c1d95" b="#22D3EE" base={theme.colors.bg} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <g transform="translate(330 600)"><ellipse rx={180} ry={110} fill="#f8fafc" /><circle r={80} fill="#2563eb" /><circle r={38} fill="#020617" /><circle cx={-20} cy={-20} r={12} fill="#fff" /></g>
          {[["L", "#F87171", 0], ["M", "#4ADE80", 1], ["S", "#60A5FA", 2]].map(([l, c, i]) => { const p = interpolate(t, [w("tres") + (i as number) * 0.25, w("tres") + (i as number) * 0.25 + 0.4], [0, 1], cl); const y = 440 + (i as number) * 160;
            return <g key={l as string} opacity={p}><path d={`M560 ${y + 30} q 30 -50 60 0 v 70 h -60 z`} fill={c as string} /><text x={590} y={y + 150} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={24} fill={c as string}>{l}</text>
              <path d={`M650 ${y + 60} C 900 ${y + 60}, 1000 600, ${1180} 600`} stroke={c as string} strokeWidth={6} fill="none" strokeDasharray="14 10" strokeDashoffset={-f * 3} /></g>; })}
          <g transform="translate(1380 600)" opacity={interpolate(t, [w("cerebro"), w("cerebro") + 0.4], [0, 1], cl)}>
            <path d="M-160 0 C -170 -120, -60 -170, 0 -140 C 60 -175, 170 -120, 160 0 C 175 100, 60 140, 0 120 C -60 140, -175 100, -160 0Z" fill="#f9a8d4" stroke="#be185d" strokeWidth={6} />
            <path d="M0 -140 V 120 M-100 -60 q 40 30 0 60 M 100 -60 q -40 30 0 60" stroke="#be185d" strokeWidth={5} fill="none" />
          </g>
          {[["VERMELHO", "#ef4444", w("vermelho")], ["VERDE", "#22c55e", w("verde")], ["AZUL", "#3b82f6", w("azul")]].map(([l, c, at], i) => { const p = interpolate(t, [(at as number) - 0.1, (at as number) + 0.25], [0, 1], cl);
            return <g key={i} opacity={p} transform={`translate(${1660} ${440 + i * 160}) scale(${0.6 + 0.4 * p})`}><circle r={56} fill={c as string} /><text y={92} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={24} fill="#fff">{l}</text></g>; })}
        </svg>
        <Top><Rise at={W("olhos") - 4} start={0}><Big size={56}>3 TIPOS DE SENSORES DE COR → O CÉREBRO MISTURA</Big></Rise></Top>
      </Fade>
      <Fade o={C4}>
        <AbsoluteFill style={{ background: "#05060d" }} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <defs><linearGradient id="rb" x1="0" x2="1">{[400, 450, 500, 550, 600, 650, 700].map((nm, i) => <stop key={i} offset={i / 6} stopColor={hue(nm)} />)}</linearGradient></defs>
          <path d="M260 760 A 700 560 0 0 1 1660 760" stroke="url(#rb)" strokeWidth={70} fill="none" opacity={1 - mix * 0.6} />
          {interpolate(t, [w("arcoiris"), w("arcoiris") + 0.4], [0, 1], cl) > 0 && <g opacity={interpolate(t, [w("arcoiris"), w("arcoiris") + 0.4], [0, 1], cl) * (1 - mix)}><circle cx={960} cy={470} r={70} fill="none" stroke="#ff00ff" strokeWidth={8} strokeDasharray="12 10" /><text x={960} y={495} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={80} fill="#ff00ff">?</text></g>}
          <g style={{ mixBlendMode: "screen" }} opacity={mix}>
            <circle cx={960 - 130 * (1 - mix * 0.55)} cy={560} r={190} fill="#ff0000" /><circle cx={960 + 130 * (1 - mix * 0.55)} cy={560} r={190} fill="#0000ff" />
          </g>
          {mix > 0.7 && <text x={960} y={575} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={50} fill="#fff" opacity={interpolate(mix, [0.7, 1], [0, 1], cl)}>MAGENTA</text>}
        </svg>
        <Top><Rise at={W("magenta") - 4} start={0}><Big size={58}>O MAGENTA NÃO ESTÁ NO ARCO-ÍRIS</Big></Rise></Top>
        <Bottom><Rise at={W("inventa") - 4} start={0} cfg={theme.spring.bouncy}><Pill bg="#ff00ff" color="#fff" size={36}>VERMELHO + AZUL → O CÉREBRO INVENTA</Pill></Rise></Bottom>
      </Fade>
      <Fade o={C5}>
        <BgMesh a="#0e7490" b="#F472B6" base={theme.colors.bg} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(560 600) rotate(${Math.sin(f / 20) * 3})`}>
            {Array.from({ length: 9 }).map((_, i) => <ellipse key={i} cx={-240 + i * 55} cy={Math.sin(i * 0.6) * 10} rx={52} ry={70 - Math.abs(i - 3) * 5} fill={`hsl(${140 + i * 25} 80% 55%)`} stroke="#0f172a" strokeWidth={4} />)}
            <path d="M260 0 l70 -40 v80Z" fill="#06b6d4" stroke="#0f172a" strokeWidth={4} />
            <circle cx={-300} cy={-90} r={30} fill="#f472b6" stroke="#0f172a" strokeWidth={4} /><circle cx={-240} cy={-100} r={30} fill="#facc15" stroke="#0f172a" strokeWidth={4} />
            <circle cx={-300} cy={-90} r={10} fill="#0f172a" /><circle cx={-240} cy={-100} r={10} fill="#0f172a" />
            {[-200, -120, -40, 40].map((x, i) => <path key={i} d={`M${x} 60 q 10 50 -10 80`} stroke="#fb923c" strokeWidth={8} fill="none" />)}
          </g>
          <g transform="translate(1120 380)">
            <text x={0} y={0} fontFamily="Montserrat" fontWeight={900} fontSize={34} fill="#fff">HUMANO</text>
            {Array.from({ length: 3 }).map((_, i) => <rect key={i} x={i * 44} y={20} width={34} height={70} rx={8} fill={["#F87171", "#4ADE80", "#60A5FA"][i]} />)}
            <text x={0} y={190} fontFamily="Montserrat" fontWeight={900} fontSize={34} fill="#fff">CAMARÃO LOUVA-A-DEUS</text>
            {Array.from({ length: 12 }).map((_, i) => { const p = interpolate(shrimp, [i / 12, (i + 1) / 12], [0, 1], cl); return <rect key={i} x={i * 44} y={210 + (1 - p) * 30} width={34} height={70} rx={8} fill={`hsl(${i * 30} 90% 60%)`} opacity={p} />; })}
          </g>
        </svg>
        <Top><Rise at={W("camaroes") - 4} start={0}><Big size={58}>O CAMARÃO LOUVA-A-DEUS</Big></Rise></Top>
        <Bottom><Rise at={W("receptores") - 4} start={0} cfg={theme.spring.bouncy}><Pill bg={theme.colors.primary} size={36} glow>+12 TIPOS DE RECEPTORES DE COR (NÓS: 3)</Pill></Rise></Bottom>
      </Fade>
      <Fade o={C6}>
        <BgMesh a="#14532d" b="#7f1d1d" base={theme.colors.bg} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {[0, 1].map((side) => <g key={side} transform={`translate(${side ? 1350 : 570} 520)`}>
            {Array.from({ length: 70 }).map((_, i) => { const a = random(`da${i}`) * Math.PI * 2, r = Math.sqrt(random(`dr${i}`)) * 230; const inFig = Math.abs(Math.cos(a) * r) < 60 || (Math.sin(a) * r < -110 && Math.sin(a) * r > -170);
              const c = inFig ? "#ef4444" : "#22c55e"; const cb = inFig ? "#a1a14a" : "#9a9a4c"; const col = side ? (dalt > 0.5 ? cb : c) : c;
              return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={14 + random(`ds${i}`) * 12} fill={col} />; })}
            <text y={285} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={32} fill="#fff">{side ? "DALTONISMO" : "VISÃO TÍPICA"}</text></g>)}
        </svg>
        <Top><Rise at={W("nem") - 3} start={0}><Big size={58}>NEM TODO MUNDO VÊ AS MESMAS CORES</Big></Rise></Top>
        <Bottom><Rise at={W("oito") - 4} start={0} cfg={theme.spring.bouncy}><Pill bg="#fff" size={36}>~8% DOS HOMENS TÊM DALTONISMO</Pill></Rise></Bottom>
      </Fade>
      <Sfx at={W("cabeca") - 3} src="sparkle.wav" vol={0.18} />
      <Sfx at={W("magenta") - 3} src="swoosh.wav" vol={0.16} />
      <Sfx at={W("inventa") - 2} src="sparkle.wav" vol={0.2} />
      <Sfx at={W("camaroes") - 3} src="swoosh.wav" vol={0.16} />
      <Sfx at={W("daltonismo") - 2} src="swoosh.wav" vol={0.16} />
    </AbsoluteFill>
  );
};

/* ================= #3 TIME RUNS FASTER IN YOUR HEAD ================= */
const BlackHole: React.FC<{ t: number }> = ({ t }) => (
  <group rotation={[0.35, 0, 0.12]}>
    <mesh><sphereGeometry args={[1, 48, 48]} /><meshBasicMaterial color="#000" /></mesh>
    {Array.from({ length: 900 }).map((_, i) => { const r = 1.35 + Math.pow(random(`bh${i}`), 1.6) * 2.4; const a = random(`ba${i}`) * Math.PI * 2 + t * (1.6 / r); const hot = 1 - (r - 1.35) / 2.4;
      return <mesh key={i} position={[Math.cos(a) * r, (random(`by${i}`) - 0.5) * 0.05, Math.sin(a) * r]}><sphereGeometry args={[0.022, 4, 4]} /><meshBasicMaterial color={hot > 0.6 ? "#fff7d6" : hot > 0.3 ? "#fbbf24" : "#f97316"} /></mesh>; })}
    <Glow pos={[0, 0, 0]} size={5} color="#f97316" opacity={0.35} />
  </group>
);
export const B3: React.FC = () => {
  const { t, w, W } = useBlock("b3"); const f = useCurrentFrame();
  const T1 = win(t, 3.1, w("einstein") - 0.2), T2 = win(t, w("einstein") - 0.2, w("seus", 1) - 0.2), T3 = win(t, w("seus", 1) - 0.2, w("mas") - 0.1),
    T4 = win(t, w("mas") - 0.1, w("perto", 2) - 0.2), T5 = win(t, w("perto", 2) - 0.2, w("satelites") - 0.4), T6 = win(t, w("satelites") - 0.4, 999);
  const dip = interpolate(t, [w("gravidade"), w("desacelera") + 0.6], [0, 1], { ...cl, easing: Easing.inOut(Easing.cubic) });
  const ruler = interpolate(t, [w("separados"), w("centimetros") + 0.3], [0, 1], { ...cl, easing: Easing.out(Easing.cubic) });
  const years = Math.round(interpolate(t, [w("equivale"), w("anos") + 0.3], [0, 7], cl));
  return (
    <AbsoluteFill>
      <Fade o={T1}>
        <BgMesh a="#1e3a8a" b="#22D3EE" base={theme.colors.bg} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <Person x={960} y={980} s={1.85} fill="#1e293b" stroke="#94a3b8" />
          <Clock x={1340} y={320} r={110} a={t * 4.0} color={theme.colors.primary} label="CABEÇA: MAIS RÁPIDO" />
          <Clock x={1340} y={720} r={110} a={t * 3.6} color="#22D3EE" label="PÉS: MAIS DEVAGAR" />
          <path d="M1060 320 H1210" stroke={theme.colors.primary} strokeWidth={5} strokeDasharray="10 8" /><path d="M1060 920 L1210 760" stroke="#22D3EE" strokeWidth={5} strokeDasharray="10 8" />
        </svg>
        <div style={{ position: "absolute", left: 90, top: 300, width: 640 }}><Rise at={sec(3.3)} start={0}><div style={{ ...H, fontSize: 64, textAlign: "left" }}>O TEMPO PASSA MAIS RÁPIDO NA SUA CABEÇA</div></Rise>
          <div style={{ height: 24 }} /><Rise at={W("pes") - 4} start={0}><div style={{ ...H, fontSize: 48, textAlign: "left", color: "#22D3EE" }}>DO QUE NOS SEUS PÉS</div></Rise></div>
      </Fade>
      <Fade o={T2}>
        <Canvas3D pos={[0, 4.2, 6.2]} tgt={[0, -0.6, 0]} fov={42}>
          <Stars n={1200} /><ambientLight intensity={0.5} /><directionalLight position={[3, 4, 5]} intensity={2.2} />
          {Array.from({ length: 21 }).map((_, i) => { const pts: THREE.Vector3[] = []; for (let j = 0; j <= 60; j++) { const x = -6 + j * 0.2, z = -6 + i * 0.6; const d = Math.sqrt(x * x + z * z); pts.push(new THREE.Vector3(x, -dip * 2.2 / (1 + d * d * 0.35), z)); }
            const g = new THREE.BufferGeometry().setFromPoints(pts); return <line key={`a${i}`}><primitive object={g} attach="geometry" /><lineBasicMaterial color="#22D3EE" transparent opacity={0.55} /></line>; })}
          {Array.from({ length: 21 }).map((_, i) => { const pts: THREE.Vector3[] = []; for (let j = 0; j <= 60; j++) { const z = -6 + j * 0.2, x = -6 + i * 0.6; const d = Math.sqrt(x * x + z * z); pts.push(new THREE.Vector3(x, -dip * 2.2 / (1 + d * d * 0.35), z)); }
            const g = new THREE.BufferGeometry().setFromPoints(pts); return <line key={`b${i}`}><primitive object={g} attach="geometry" /><lineBasicMaterial color="#22D3EE" transparent opacity={0.55} /></line>; })}
          <Planet tex="longo/earth_real.jpg" pos={[0, -dip * 1.4 + 0.2, 0]} r={0.9} spin={t * 0.3} />
        </Canvas3D>
        <Top><Rise at={W("gravidade") - 4} start={0}><Big size={60}>EINSTEIN: A GRAVIDADE DESACELERA O TEMPO</Big></Rise></Top>
        <Bottom><Rise at={W("devagar") - 6} start={0} cfg={theme.spring.bouncy}><Pill bg="#22D3EE" size={36}>MAIS PERTO DO CENTRO DA TERRA = TEMPO MAIS DEVAGAR</Pill></Rise></Bottom>
      </Fade>
      <Fade o={T3}>
        <BgMesh a="#312e81" b="#FBBF24" base={theme.colors.bg} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <rect x={0} y={960} width={1920} height={120} fill="#1f2937" />
          <Person x={600} y={960} s={1.6} fill="#1e293b" stroke="#94a3b8" />
          <text x={600} y={340} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={34} fill={theme.colors.primary}>⏱ MAIS RÁPIDO</text>
          <text x={600} y={1030} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={34} fill="#22D3EE">⏱ MAIS DEVAGAR</text>
        </svg>
        <div style={{ position: "absolute", left: 980, top: 300, width: 820 }}>
          <Rise at={W("envelhecem") - 4} start={0}><div style={{ ...H, fontSize: 54, textAlign: "left" }}>SEUS PÉS ENVELHECEM UM POUQUINHO MAIS DEVAGAR</div></Rise>
          <div style={{ height: 40 }} />
          <Rise at={W("diferenca") - 4} start={0}><Card color="#fff" style={{ textAlign: "left" }}><div style={{ ...S, fontSize: 28, color: theme.colors.textDim }}>DIFERENÇA NUMA VIDA INTEIRA</div><div style={{ ...S, fontSize: 50, color: theme.colors.primary }}>{"< 0,000001 s"}</div></Card></Rise>
          <div style={{ height: 30 }} />
          <Rise at={W("real") - 4} start={0} cfg={theme.spring.bouncy}><Pill bg="#4ADE80" size={40}>MAS É REAL</Pill></Rise>
        </div>
      </Fade>
      <Fade o={T4}>
        <AbsoluteFill style={{ background: "linear-gradient(#0f172a, #020617)" }} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <rect x={300} y={780} width={1320} height={30} fill="#334155" />
          {[[700, 780 - 0], [1220, 780 - 300 * ruler]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}>
            {i === 1 && <rect x={-90} y={0} width={180} height={300 * ruler} fill="#1e293b" />}
            <rect x={-110} y={-200} width={220} height={200} rx={16} fill="#1e293b" stroke={i ? theme.colors.primary : "#22D3EE"} strokeWidth={5} />
            <circle cx={0} cy={-110} r={56} fill="rgba(0,0,0,.6)" stroke={i ? theme.colors.primary : "#22D3EE"} strokeWidth={4} />
            <circle cx={0} cy={-110} r={10 + 4 * Math.sin(f / 3 + i)} fill={i ? theme.colors.primary : "#22D3EE"} />
            <text x={0} y={-30} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={22} fill="#fff">RELÓGIO ATÔMICO</text></g>)}
          {ruler > 0.05 && <g><line x1={1400} y1={780} x2={1400} y2={780 - 300 * ruler} stroke="#fff" strokeWidth={5} /><path d={`M1385 ${780 - 300 * ruler + 15} l15 -15 l15 15 M1385 765 l15 15 l15 -15`} stroke="#fff" strokeWidth={5} fill="none" />
            <text x={1430} y={780 - 150 * ruler} fontFamily="Montserrat" fontWeight={900} fontSize={44} fill="#fff">{Math.round(ruler * 30)} cm</text></g>}
        </svg>
        <Top><Rise at={W("dez") - 4} start={0}><Big size={60}>2010: O EFEITO FOI MEDIDO</Big></Rise></Top>
        <Bottom><Rise at={W("altura") - 4} start={0} cfg={theme.spring.bouncy}><Pill bg={theme.colors.primary} size={36} glow>O RELÓGIO DE CIMA ANDOU MAIS RÁPIDO</Pill></Rise></Bottom>
      </Fade>
      <Fade o={T5}>
        <Canvas3D pos={[0, 1.6, 7]} tgt={[0, 0, 0]} fov={45}>
          <Stars n={2500} /><ambientLight intensity={0.4} /><directionalLight position={[-4, 2, 5]} intensity={2} />
          <BlackHole t={t} />
        </Canvas3D>
        <Top><Rise at={W("buraco") - 4} start={0}><Big size={60}>PERTO DE UM BURACO NEGRO: GIGANTESCO</Big></Rise></Top>
        <div style={{ position: "absolute", left: 120, top: 380 }}><Rise at={W("interestelar") - 4} start={0}><Card><div style={{ ...S, fontSize: 28, color: theme.colors.textDim }}>INTERESTELAR</div><div style={{ ...S, fontSize: 54, color: "#fff" }}>1 HORA LÁ</div><div style={{ ...S, fontSize: 54, color: theme.colors.primary }}>= {years} ANOS AQUI</div></Card></Rise></div>
        <Bottom><Rise at={W("ficcao") - 4} start={0}><Pill bg="#fff" size={32}>FICÇÃO, MAS COM A MESMA FÍSICA</Pill></Rise></Bottom>
      </Fade>
      <Fade o={T6}>
        <Canvas3D pos={[0, 0.8, 6]} tgt={[0, 0, 0]} fov={42}>
          <Stars /><ambientLight intensity={0.35} /><directionalLight position={[3, 2, 5]} intensity={2.4} />
          <Planet tex="longo/earth_real.jpg" pos={[0, 0, 0]} r={1.4} spin={t * 0.25} />
          {Array.from({ length: 6 }).map((_, i) => { const a = t * 0.5 + i * (Math.PI / 3); const inc = i % 3 * 0.6; const p = new THREE.Vector3(Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4).applyAxisAngle(new THREE.Vector3(1, 0, 0), inc);
            return <group key={i} position={p.toArray() as V3}><mesh><boxGeometry args={[0.12, 0.12, 0.12]} /><meshStandardMaterial color="#e5e7eb" metalness={0.6} /></mesh><mesh position={[0.18, 0, 0]}><boxGeometry args={[0.22, 0.02, 0.1]} /><meshStandardMaterial color="#1d4ed8" /></mesh><mesh position={[-0.18, 0, 0]}><boxGeometry args={[0.22, 0.02, 0.1]} /><meshStandardMaterial color="#1d4ed8" /></mesh><Glow pos={[0, 0, 0]} size={0.4} color="#22D3EE" opacity={0.6} /></group>; })}
        </Canvas3D>
        <Top><Rise at={W("satelites") - 3} start={0}><Big size={60}>OS SATÉLITES DE GPS CORRIGEM ISSO</Big></Rise></Top>
        <Bottom><Rise at={W("dias") - 4} start={0} cfg={theme.spring.bouncy}><Pill bg={theme.colors.primary} size={38} glow>TODOS OS DIAS</Pill></Rise></Bottom>
      </Fade>
      <Sfx at={W("einstein") - 2} src="swoosh.wav" vol={0.16} />
      <Sfx at={W("real") - 2} src="impact.wav" vol={0.22} />
      <Sfx at={W("dez") - 3} src="sparkle.wav" vol={0.16} />
      <Sfx at={W("buraco") - 4} src="riser.wav" vol={0.2} />
      <Sfx at={W("satelites") - 3} src="swoosh.wav" vol={0.16} />
    </AbsoluteFill>
  );
};

/* ================= #2 STARDUST ================= */
export const B2: React.FC = () => {
  const { t, w, W } = useBlock("b2"); const f = useCurrentFrame();
  const S1 = win(t, 3.1, w("logo") - 0.2), S2 = win(t, w("logo") - 0.2, w("elementos") - 0.2), S3 = win(t, w("elementos") - 0.2, w("calcio") - 0.3),
    S4 = win(t, w("calcio") - 0.3, w("ouro") - 0.3), S5 = win(t, w("ouro") - 0.3, w("tirando") - 0.2), S6 = win(t, w("tirando") - 0.2, 999);
  const bang = interpolate(t, [w("big") - 0.2, w("bang") + 1.2], [0, 1], { ...cl, easing: Easing.out(Easing.cubic) });
  const nova = interpolate(t, [w("explosoes") - 0.1, w("gigantescas") + 1.0], [0, 1], { ...cl, easing: Easing.out(Easing.cubic) });
  const spiral = interpolate(t, [w("ouro"), w("colidiram") + 0.2], [0, 1], { ...cl, easing: Easing.in(Easing.quad) });
  const kilo = interpolate(t, [w("colidiram") + 0.1, w("colidiram") + 1.5], [0, 1], { ...cl, easing: Easing.out(Easing.cubic) });
  const form = interpolate(t, [w("quase") - 0.3, w("estrela", 0) + 0.3], [0, 1], { ...cl, easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill>
      <Fade o={S1}>
        <Canvas3D pos={[0, 0, 6 - t * 0.2]} tgt={[0, 0, -10]} fov={55}><Stars n={4000} size={0.22} /></Canvas3D>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><Rise at={sec(3.2)} start={0}><Big size={84}>VOCÊ É FEITO DE</Big><Big size={84} color={theme.colors.primary}>RESTOS DE ESTRELAS</Big></Rise></AbsoluteFill>
      </Fade>
      <Fade o={S2}>
        <Canvas3D pos={[0, 0, 6]} tgt={[0, 0, 0]} fov={50}>
          <Stars n={800} />
          <Glow pos={[0, 0, 0]} size={1 + bang * 14} color="#ffffff" opacity={1 - bang * 0.7} />
          <Glow pos={[0, 0, 0]} size={bang * 18} color="#a78bfa" opacity={bang * (1 - bang) * 2} />
        </Canvas3D>
        <Top><Rise at={W("big") - 4} start={0}><Big size={62}>LOGO DEPOIS DO BIG BANG…</Big></Rise></Top>
        <div style={{ position: "absolute", left: 0, right: 0, top: 440, display: "flex", justifyContent: "center", gap: 80 }}>
          <Rise at={W("hidrogenio") - 4} start={0} cfg={theme.spring.bouncy}><Elem sym="H" name="HIDROGÊNIO" num={1} color="#3b82f6" size={200} /></Rise>
          <Rise at={W("helio") - 4} start={0} cfg={theme.spring.bouncy}><Elem sym="He" name="HÉLIO" num={2} color="#a855f7" size={200} /></Rise>
        </div>
        <Bottom><Rise at={W("helio") + 6} start={0}><Pill bg="#fff" size={32}>E QUASE MAIS NADA</Pill></Rise></Bottom>
      </Fade>
      <Fade o={S3}>
        <Canvas3D pos={[0, 0, 7]} tgt={[0, 0, 0]} fov={45}>
          <Stars n={1500} /><ambientLight intensity={0.2} />
          {nova < 0.15 && <SunBall pos={[-2.6, 0, 0]} r={1.5 * (1 - nova * 3)} t={t} tint="#ffd9a8" />}
          <Glow pos={[-2.6, 0, 0]} size={2 + nova * 16} color="#fbbf24" opacity={nova > 0 ? 1 - nova * 0.5 : 0} />
          <Glow pos={[-2.6, 0, 0]} size={nova * 10} color="#ffffff" opacity={nova * (1 - nova) * 3} />
          {nova > 0 && Array.from({ length: 220 }).map((_, i) => { const d = new THREE.Vector3(random(`n${i}`) - 0.5, random(`m${i}`) - 0.5, random(`o${i}`) - 0.5).normalize().multiplyScalar(nova * (2 + random(`q${i}`) * 4));
            return <mesh key={i} position={[-2.6 + d.x, d.y, d.z]}><sphereGeometry args={[0.03, 6, 6]} /><meshBasicMaterial color={["#fbbf24", "#f87171", "#a78bfa", "#22d3ee"][i % 4]} transparent opacity={1 - nova * 0.4} /></mesh>; })}
        </Canvas3D>
        <Top><Rise at={W("fabricados") - 6} start={0}><Big size={58}>ELEMENTOS PESADOS: FABRICADOS DENTRO DE ESTRELAS</Big></Rise></Top>
        <div style={{ position: "absolute", left: 1060, top: 360, display: "flex", gap: 34 }}>
          <Rise at={W("carbono") - 3} start={0} cfg={theme.spring.bouncy}><Elem sym="C" name="CARBONO" num={6} color="#475569" /></Rise>
          <Rise at={W("oxigenio") - 3} start={0} cfg={theme.spring.bouncy}><Elem sym="O" name="OXIGÊNIO" num={8} color="#ef4444" /></Rise>
          <Rise at={W("ferro") - 3} start={0} cfg={theme.spring.bouncy}><Elem sym="Fe" name="FERRO" num={26} color="#b45309" /></Rise>
        </div>
        <Bottom><Rise at={W("explosoes") - 4} start={0} cfg={theme.spring.bouncy}><Pill bg="#F97316" size={36}>ESPALHADOS QUANDO AS ESTRELAS EXPLODIRAM</Pill></Rise></Bottom>
      </Fade>
      <Fade o={S4}>
        <BgMesh a="#4c1d95" b="#FBBF24" base={theme.colors.bg} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}><Person x={960} y={1010} s={2.2} fill="#1e1b4b" stroke="#c4b5fd" /></svg>
        {[["Ca", "CÁLCIO", 20, "#94a3b8", "DOS SEUS OSSOS", 560, 640, "calcio"], ["Fe", "FERRO", 26, "#b45309", "DO SEU SANGUE", 1240, 460, "sangue"], ["O", "OXIGÊNIO", 8, "#ef4444", "QUE VOCÊ RESPIRA", 1240, 760, "respira"]].map(([sym, name, num, c, lab, x, y, k], i) => (
          <div key={i} style={{ position: "absolute", left: (x as number) - 75, top: (y as number) - 75 }}><Rise at={W(k as string) - 6} start={0} cfg={theme.spring.bouncy}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, flexDirection: i === 0 ? "row-reverse" : "row" }}><Elem sym={sym as string} name={name as string} num={num as number} color={c as string} /><div style={{ ...S, fontSize: 32, color: "#fff", width: 260 }}>{lab}</div></div></Rise></div>))}
        <Top><Rise at={W("forjado") - 6} start={0}><Big size={56}>TUDO FORJADO EM ESTRELAS MAIS ANTIGAS QUE O SOL</Big></Rise></Top>
      </Fade>
      <Fade o={S5}>
        <Canvas3D pos={[0, 2.2, 6.5]} tgt={[0, 0, 0]} fov={45}>
          <Stars n={2000} />
          {kilo < 0.05 && [0, 1].map((i) => { const r = 2.2 * (1 - spiral * 0.98); const a = t * (2 + spiral * 14) + i * Math.PI; const p: V3 = [Math.cos(a) * r, 0, Math.sin(a) * r];
            return <group key={i}><mesh position={p}><sphereGeometry args={[0.22, 24, 24]} /><meshBasicMaterial color="#dbeafe" /></mesh><Glow pos={p} size={1.4} color="#60a5fa" /></group>; })}
          <Glow pos={[0, 0, 0]} size={kilo * 12} color="#fde68a" opacity={kilo > 0 ? 1 - kilo * 0.6 : 0} />
          <Glow pos={[0, 0, 0]} size={kilo * 6} color="#ffffff" opacity={kilo * (1 - kilo) * 3} />
          {kilo > 0 && Array.from({ length: 160 }).map((_, i) => { const d = new THREE.Vector3(random(`k${i}`) - 0.5, (random(`l${i}`) - 0.5) * 0.4, random(`j${i}`) - 0.5).normalize().multiplyScalar(kilo * (1.5 + random(`u${i}`) * 3));
            return <mesh key={i} position={d.toArray() as V3}><sphereGeometry args={[0.035, 6, 6]} /><meshBasicMaterial color={i % 2 ? "#fbbf24" : "#e5e7eb"} /></mesh>; })}
        </Canvas3D>
        <Top><Rise at={W("ouro") - 4} start={0}><Big size={58}>E O OURO? VEIO DE ESTRELAS DE NÊUTRONS COLIDINDO</Big></Rise></Top>
        <div style={{ position: "absolute", right: 140, top: 380, display: "flex", gap: 26 }}>
          <Rise at={W("colidiram") + 4} start={0} cfg={theme.spring.bouncy}><Elem sym="Au" name="OURO" num={79} color="#ca8a04" /></Rise>
          <Rise at={W("colidiram") + 10} start={0} cfg={theme.spring.bouncy}><Elem sym="Pt" name="PLATINA" num={78} color="#64748b" /></Rise>
        </div>
        <Bottom><Rise at={W("dezessete") - 4} start={0} cfg={theme.spring.bouncy}><Pill bg={theme.colors.primary} size={34} glow>2017: CIENTISTAS VIRAM UMA DESSAS COLISÕES</Pill></Rise></Bottom>
      </Fade>
      <Fade o={S6}>
        <Canvas3D pos={[0, 0, 7]} tgt={[0, 0, 0]} fov={45}>
          <Stars n={2500} />
          {Array.from({ length: 700 }).map((_, i) => {
            // target: person silhouette sampled points
            const u = random(`ps${i}`); let tx = 0, ty = 0;
            if (u < 0.18) { const a = random(`pa${i}`) * Math.PI * 2, r = Math.sqrt(random(`pr${i}`)) * 0.45; tx = Math.cos(a) * r; ty = 2.0 + Math.sin(a) * r; }
            else if (u < 0.6) { tx = (random(`pb${i}`) - 0.5) * 1.3; ty = 0.2 + random(`pc${i}`) * 1.4; }
            else if (u < 0.8) { const side = random(`pd${i}`) > 0.5 ? 1 : -1; tx = side * (0.75 + random(`pe${i}`) * 0.2); ty = 0.3 + random(`pf${i}`) * 1.2; }
            else { const side = random(`pg${i}`) > 0.5 ? 1 : -1; tx = side * (0.1 + random(`ph${i}`) * 0.4); ty = -2 + random(`pi${i}`) * 2.2; }
            const sx = (random(`sx${i}`) - 0.5) * 12, sy = (random(`sy${i}`) - 0.5) * 7, sz = (random(`sz${i}`) - 0.5) * 4;
            const p: V3 = [sx + (tx - sx) * form, sy + (ty - 0.1 - sy) * form, sz * (1 - form)];
            return <mesh key={i} position={p}><sphereGeometry args={[0.03, 6, 6]} /><meshBasicMaterial color={["#fde68a", "#fbbf24", "#c4b5fd", "#93c5fd"][i % 4]} /></mesh>; })}
          <Glow pos={[0, 0.4, 0]} size={4 * form} color="#fbbf24" opacity={0.25 * form} />
        </Canvas3D>
        <Top><Rise at={W("quase") - 4} start={0}><Big size={54}>QUASE TODO ÁTOMO DO SEU CORPO NASCEU NUMA ESTRELA</Big></Rise></Top>
        <Bottom><Rise at={W("poeira") - 4} start={0} cfg={theme.spring.bouncy}><Pill bg={theme.colors.primary} size={44} glow>VOCÊ É POEIRA DE ESTRELAS</Pill></Rise></Bottom>
      </Fade>
      <Sfx at={W("bang") - 3} src="impact.wav" vol={0.3} />
      <Sfx at={W("explosoes") - 2} src="impact.wav" vol={0.28} />
      <Sfx at={W("calcio") - 3} src="sparkle.wav" vol={0.16} />
      <Sfx at={W("colidiram") - 1} src="impact.wav" vol={0.3} />
      <Sfx at={W("poeira") - 4} src="sparkle.wav" vol={0.22} />
    </AbsoluteFill>
  );
};

/* ================= #1 95% UNKNOWN ================= */
const Galaxy: React.FC<{ t: number; fly?: number; n?: number; halo?: number }> = ({ t, fly = 0, n = 1100, halo = 0 }) => (
  <group>
    {Array.from({ length: n }).map((_, i) => { const arm = i % 2; const rr = 0.25 + (i / n) * 3.4; const a = rr * 1.4 + arm * Math.PI + t * 0.35 + (random(`g${i}`) - 0.5) * 0.6;
      const out = fly * (rr / 3.4) * (1 + random(`fo${i}`) * 3);
      return <mesh key={i} position={[Math.cos(a) * (rr + out), (random(`h${i}`) - 0.5) * 0.12, Math.sin(a) * (rr + out)]}><sphereGeometry args={[0.02, 4, 4]} /><meshBasicMaterial color={rr < 0.9 ? "#fde68a" : i % 4 ? "#c4b5fd" : "#93c5fd"} /></mesh>; })}
    <Glow pos={[0, 0, 0]} size={2.6} color="#fde68a" />
    {halo > 0 && <><Glow pos={[0, 0, 0]} size={11 * halo} color="#7c3aed" opacity={0.45 * halo} /><Glow pos={[0, 0, 0]} size={8 * halo} color="#a78bfa" opacity={0.3 * halo} /></>}
  </group>
);
export const B1: React.FC = () => {
  const { t, w, W } = useBlock("b1"); const f = useCurrentFrame();
  const U1 = win(t, 3.1, w("astronomos") - 0.2), U2 = win(t, w("astronomos") - 0.2, w("tem") - 0.2), U3 = win(t, w("tem") - 0.2, w("resto") - 0.2),
    U4 = win(t, w("resto") - 0.2, w("ideia") - 0.7), U5 = win(t, w("ideia") - 0.7, w("gente") - 0.2), U6 = win(t, w("gente") - 0.2, 999);
  const fly = interpolate(t, [w("deveriam"), w("desmanchar") + 0.8], [0, 1], { ...cl, easing: Easing.in(Easing.quad) });
  const halo = interpolate(t, [w("invisivel") - 0.2, w("escura") + 0.3], [0, 1], cl);
  const hold = interpolate(t, [w("segurando"), w("tudo", 1) + 0.6], [0, 1], cl);
  const exp = interpolate(t, [w("energia"), w("rapido", 1) + 1.5], [0, 1], { ...cl, easing: Easing.in(Easing.quad) });
  const pie = interpolate(t, [w("pizza") - 0.2, w("pizza") + 0.6], [0, 1], { ...cl, easing: Easing.out(Easing.cubic) });
  const pct = Math.round(interpolate(t, [w("cinco"), w("universo") + 0.2], [0, 5], cl));
  return (
    <AbsoluteFill>
      <Fade o={U1}>
        <Canvas3D pos={[0, 0, 6 - t * 0.15]} tgt={[0, 0, -20]} fov={55}>
          <Stars n={3000} size={0.22} />
          {Array.from({ length: 80 }).map((_, i) => { const p: V3 = [(random(`ux${i}`) - 0.5) * 16, (random(`uy${i}`) - 0.5) * 9, -4 - random(`uz${i}`) * 24];
            return <group key={i} position={p} rotation={[random(`ur${i}`) * 3, 0, random(`us${i}`)]}><mesh scale={[1, 0.3, 1]}><sphereGeometry args={[0.15 + random(`uq${i}`) * 0.25, 10, 8]} /><meshBasicMaterial color={["#fde68a", "#c4b5fd", "#93c5fd"][i % 3]} transparent opacity={0.8} /></mesh></group>; })}
        </Canvas3D>
        <Top><Rise at={sec(3.6)} start={0}><Big size={60}>TUDO O QUE VOCÊ JÁ VIU…</Big></Rise></Top>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><Rise at={W("cinco") - 4} start={0} cfg={theme.spring.bouncy}><div style={{ ...S, fontSize: 260, color: theme.colors.primary, textShadow: `0 0 80px ${theme.colors.glow}` }}>{pct}%</div></Rise></AbsoluteFill>
        <Bottom><Rise at={W("universo") - 4} start={0}><Pill bg="#fff" size={38}>DO UNIVERSO</Pill></Rise></Bottom>
      </Fade>
      <Fade o={U2}>
        <Canvas3D pos={[0, 4.6, 5.8]} tgt={[0, 0, 0]} fov={50}><Stars n={1500} /><Galaxy t={t} fly={fly} /></Canvas3D>
        <Top><Rise at={W("giram") - 4} start={0}><Big size={60}>AS GALÁXIAS GIRAM RÁPIDO DEMAIS</Big></Rise></Top>
        <Bottom><Rise at={W("desmanchar") - 6} start={0} cfg={theme.spring.bouncy}><Pill bg="#F87171" size={36}>COM A MASSA VISÍVEL, ELAS SE DESMANCHARIAM</Pill></Rise></Bottom>
      </Fade>
      <Fade o={U3}>
        <Canvas3D pos={[0, 5.5, 7.5]} tgt={[0, 0, 0]} fov={50}><Stars n={1500} /><Galaxy t={t} fly={1 - hold} halo={halo} /></Canvas3D>
        <Top><Rise at={W("invisivel") - 4} start={0}><Big size={58}>ALGO INVISÍVEL SEGURA TUDO</Big></Rise></Top>
        <div style={{ position: "absolute", right: 120, top: 400 }}><Rise at={W("materia") - 4} start={0} cfg={theme.spring.bouncy}><Card color="#A78BFA"><div style={{ ...S, fontSize: 30, color: "#fff" }}>MATÉRIA ESCURA</div><div style={{ ...S, fontSize: 80, color: "#A78BFA" }}>~27%</div></Card></Rise></div>
      </Fade>
      <Fade o={U4}>
        <Canvas3D pos={[0, 0, 10]} tgt={[0, 0, 0]} fov={50}>
          <Stars n={1000} />
          {Array.from({ length: 120 }).map((_, i) => { const b = new THREE.Vector3((random(`ex${i}`) - 0.5) * 8, (random(`ey${i}`) - 0.5) * 5, (random(`ez${i}`) - 0.5) * 6); const s = 1 + exp * 2.6;
            return <group key={i} position={b.multiplyScalar(s).toArray() as V3}><Glow pos={[0, 0, 0]} size={0.5} color={["#fde68a", "#c4b5fd", "#93c5fd"][i % 3]} /></group>; })}
        </Canvas3D>
        <Top><Rise at={W("energia") - 4} start={0}><Big size={58}>O UNIVERSO SE EXPANDE CADA VEZ MAIS RÁPIDO</Big></Rise></Top>
        <div style={{ position: "absolute", right: 120, top: 400 }}><Rise at={W("energia") - 2} start={0} cfg={theme.spring.bouncy}><Card color="#22D3EE"><div style={{ ...S, fontSize: 30, color: "#fff" }}>ENERGIA ESCURA</div><div style={{ ...S, fontSize: 80, color: "#22D3EE" }}>~68%</div></Card></Rise></div>
      </Fade>
      <Fade o={U5}>
        <BgMesh a="#7c2d12" b="#4c1d95" base={theme.colors.bg} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(800 600) rotate(${-90 + pie * 10})`}>
            <circle r={330} fill="#78350f" />
            <circle r={300} fill="#111827" stroke="#334155" strokeWidth={4} />
            {/* dark matter 27% and dark energy 68% */}
            {(() => { const arc = (a0: number, a1: number, r: number) => { const p0 = [Math.cos(a0) * r, Math.sin(a0) * r], p1 = [Math.cos(a1) * r, Math.sin(a1) * r]; return `M0 0 L${p0[0]} ${p0[1]} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p1[0]} ${p1[1]} Z`; };
              const A = (x: number) => x * Math.PI * 2 * pie;
              return <>
                <path d={arc(A(0.05), A(0.32), 300)} fill="#4c1d95" opacity={0.8} />
                <path d={arc(A(0.32), A(1), 300)} fill="#0e3a4a" opacity={0.85} />
                <g transform={`translate(${Math.cos(A(0.025)) * 40 * pie} ${Math.sin(A(0.025)) * 40 * pie})`}><path d={arc(0, A(0.05) + 0.0001, 300)} fill="#FBBF24" /></g>
              </>; })()}
            {Array.from({ length: 8 }).map((_, i) => <circle key={i} cx={Math.cos(i) * 180} cy={Math.sin(i * 1.7) * 160} r={22} fill="rgba(255,255,255,.06)" />)}
          </g>
        </svg>
        <div style={{ position: "absolute", left: 1220, top: 330, display: "flex", flexDirection: "column", gap: 26 }}>
          <Rise at={W("fatia") - 4} start={0}><div style={{ ...S, fontSize: 40, color: theme.colors.primary }}>■ 5% TUDO O QUE É VISÍVEL</div></Rise>
          <Rise at={W("resto", 1) - 4} start={0}><div style={{ ...S, fontSize: 40, color: "#A78BFA" }}>■ 27% MATÉRIA ESCURA</div></Rise>
          <Rise at={W("resto", 1) + 4} start={0}><div style={{ ...S, fontSize: 40, color: "#22D3EE" }}>■ 68% ENERGIA ESCURA</div></Rise>
          <Rise at={W("ninguem") - 4} start={0}><Pill bg="#fff" size={32}>NINGUÉM NUNCA VIU</Pill></Rise>
        </div>
        <Top><Rise at={W("pizza") - 6} start={0}><Big size={60}>SE O UNIVERSO FOSSE UMA PIZZA…</Big></Rise></Top>
      </Fade>
      <Fade o={U6}>
        <Canvas3D pos={[0, 0, 6]} tgt={[0, 0, -10]} fov={55}><Stars n={4000} size={0.24} /></Canvas3D>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", display: "flex", flexDirection: "column", gap: 10 }}>
          <Rise at={W("milhares") - 6} start={0}><Big size={52} color={theme.colors.textDim}>DEPOIS DE MILHARES DE ANOS DE CIÊNCIA…</Big></Rise>
          <Rise at={W("noventa") - 4} start={0} cfg={theme.spring.bouncy}><div style={{ ...S, fontSize: 240, color: theme.colors.primary, textShadow: `0 0 90px ${theme.colors.glow}`, lineHeight: 1 }}>95%</div></Rise>
          <Rise at={W("realidade") - 4} start={0}><Big size={60}>DA REALIDADE AINDA É UM MISTÉRIO</Big></Rise>
        </AbsoluteFill>
      </Fade>
      <Sfx at={W("cinco") - 3} src="impact.wav" vol={0.28} />
      <Sfx at={W("desmanchar") - 3} src="swoosh.wav" vol={0.18} />
      <Sfx at={W("materia") - 3} src="sparkle.wav" vol={0.18} />
      <Sfx at={W("energia") - 4} src="riser.wav" vol={0.2} />
      <Sfx at={W("pizza") - 2} src="swoosh.wav" vol={0.16} />
      <Sfx at={W("noventa") - 3} src="impact.wav" vol={0.32} />
    </AbsoluteFill>
  );
};

/* ================= OUTRO ================= */
const ITEMS = ["VOCÊ NUNCA TOCOU EM NADA", "VOCÊ ESTÁ VENDO O PASSADO", "VOCÊ ESTÁ MAIS RÁPIDO QUE UM AVIÃO", "VOCÊ É QUASE TODO VAZIO", "AS CORES ESTÃO NA SUA CABEÇA", "SUA CABEÇA ENVELHECE MAIS RÁPIDO", "VOCÊ É POEIRA DE ESTRELAS", "95% DO UNIVERSO É MISTÉRIO"];
export const Outro: React.FC = () => {
  const { t, w, W } = useBlock("outro"); const f = useCurrentFrame();
  const O1 = win(t, 0, w("se") - 0.3), O2 = win(t, w("se") - 0.3, w("me") - 0.3), O3 = win(t, w("me") - 0.3, 999);
  const logoP = useAbsSpring(W("se") - 2, 0, theme.spring.bouncy);
  const click = interpolate(t, [w("inscreve") + 0.2, w("inscreve") + 0.5], [0, 1], cl);
  return (
    <AbsoluteFill>
      <Fade o={O1}>
        <Canvas3D pos={[0, 0, 6 - t * 0.3]} tgt={[0, 0, -20]} fov={60}><Stars n={4000} size={0.22} /></Canvas3D>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", display: "flex", flexDirection: "column", gap: 20 }}>
          <Rise at={sec(0.6)} start={0}><Big size={78}>A REALIDADE É MUITO MAIS ESTRANHA</Big></Rise>
          <Rise at={W("vale") - 4} start={0}><Big size={60} color={theme.colors.primary}>CONTINUE PERGUNTANDO</Big></Rise>
        </AbsoluteFill>
      </Fade>
      <Fade o={O2}>
        <BgMesh a="#4c1d95" b="#FBBF24" base={theme.colors.bg} />
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", display: "flex", flexDirection: "column", gap: 36 }}>
          <div style={{ width: 300, height: 300, borderRadius: "50%", overflow: "hidden", border: `6px solid ${theme.colors.primary}`, boxShadow: `0 0 80px ${theme.colors.glow}`, transform: `scale(${logoP}) rotate(${(1 - logoP) * -120}deg)` }}><Img src={staticFile("longo/logo.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
          <div style={{ ...H, fontSize: 70, opacity: logoP }}>PERGUNTA CÓSMICA</div>
          <Rise at={W("inscreve") - 4} start={0} cfg={theme.spring.bouncy}><div style={{ padding: "18px 46px", borderRadius: 16, background: click > 0.5 ? "#334155" : "#dc2626", ...S, fontSize: 44, color: "#fff", transform: `scale(${1 - Math.sin(click * Math.PI) * 0.1})` }}>{click > 0.5 ? "✓ INSCRITO" : "INSCREVA-SE"}</div></Rise>
        </AbsoluteFill>
      </Fade>
      <Fade o={O3}>
        <BgMesh a="#1e3a8a" b="#A78BFA" base={theme.colors.bg} />
        <Top><Rise at={W("qual") - 4} start={0}><Big size={58}>QUAL DESSAS EXPLODIU SUA CABEÇA? 🤯</Big></Rise></Top>
        <div style={{ position: "absolute", left: 0, right: 0, top: 230, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px 40px", padding: "0 160px" }}>
          {ITEMS.map((it, i) => <Rise key={i} at={W("me") + i * 4} start={0}><div style={{ ...S, fontSize: 32, color: "#fff", padding: "16px 24px", borderRadius: 16, background: "rgba(0,0,0,.45)", border: "2px solid rgba(255,255,255,.18)" }}><span style={{ color: theme.colors.primary }}>#{8 - i} </span>{it}</div></Rise>)}
        </div>
        <Bottom><Rise at={W("comentarios") - 4} start={0}><Pill bg={theme.colors.primary} size={36} glow>COMENTA AQUI EMBAIXO 👇</Pill></Rise></Bottom>
      </Fade>
      <Sfx at={W("se") - 2} src="sparkle.wav" vol={0.2} />
      <Sfx at={W("inscreve") + 4} src="impact.wav" vol={0.18} />
    </AbsoluteFill>
  );
};
