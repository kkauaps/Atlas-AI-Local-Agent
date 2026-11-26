import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, random, staticFile, Img } from "remotion";
import { theme } from "./theme";
import { useBlock, Sfx, sec } from "./core";
import { useAbsSpring } from "./ui";
import { cl } from "./cl";
import { useV, Stage, StarField, Nebula, Glow, Points, StarBody, Shock, HoloBody, rng, V3 } from "./hd";
import { Atom3D, EarthHD, GalaxyHD, BlackHoleHD, Ray } from "./hd3d";
import { win, Layer, E, Title, Tag, burst, F } from "./b2hd";
import { Counter, Label } from "./hd_a";

const fmt = (n: number) => Math.round(n).toLocaleString("pt-BR");
const hue = (nm: number) => `hsl(${interpolate(nm, [400, 700], [275, 0], cl)} 95% 58%)`;
const BG: React.FC<{ seed?: number; colors?: string[]; t?: number }> = ({ seed = 1, colors, t = 0 }) => (
  <Stage pos={[Math.sin(t * 0.05) * 2, 0, 10]} tgt={[0, 0, -20]} fov={55}><StarField n={7000} size={0.5} /><Nebula seed={seed} colors={colors} z={-60} opacity={0.4} /></Stage>
);

/* ================= #5 YOU ARE ALMOST EMPTY ================= */
export const B5HD: React.FC = () => {
  const { t, w, W } = useBlock("b5"); const f = useCurrentFrame();
  const P1 = win(t, 3.0, w("nucleo") - 0.2), P2 = win(t, w("nucleo") - 0.2, w("entre") - 0.2), P3 = win(t, w("entre") - 0.2, w("desse") - 0.3),
    P4 = win(t, w("desse") - 0.3, w("so") - 0.2), P5 = win(t, w("so") - 0.2, w("tem") - 0.2), P6 = win(t, w("tem") - 0.2, 999);
  const zoom = E(t, 3.0, w("nucleo") - 0.3, Easing.inOut(Easing.cubic));
  const shrink = E(t, w("caberia"), w("cubo") + 0.3, Easing.inOut(Easing.cubic));
  const drop = E(t, w("pesaria") - 0.1, w("pesaria") + 0.4, Easing.in(Easing.quad));
  const tons = Math.round(interpolate(t, [w("pesaria"), w("toneladas") + 0.6], [0, 500], { ...cl, easing: Easing.out(Easing.cubic) }));
  const massP = E(t, w("guarda"), w("massa") + 0.3);
  const crowd = useMemo(() => { const R = rng(55); const n = 9000; const p = new Float32Array(n * 3), c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { p.set([(R() - 0.5) * 16, (R() - 0.5) * 7, (R() - 0.5) * 6], i * 3); const k = [[0.4, 0.85, 1], [0.75, 0.6, 1], [1, 0.8, 0.35], [1, 0.5, 0.5]][i % 4]; c.set(k, i * 3); } return { p, c }; }, []);
  const cp = new Float32Array(crowd.p.length); { const e = shrink; for (let i = 0; i < cp.length / 3; i++) { const R = random(`cc${i}`) - 0.5; cp[i * 3] = crowd.p[i * 3] * (1 - e) + R * 0.5 * e; cp[i * 3 + 1] = crowd.p[i * 3 + 1] * (1 - e) + (random(`cd${i}`) - 0.5) * 0.5 * e; cp[i * 3 + 2] = crowd.p[i * 3 + 2] * (1 - e) + (random(`ce${i}`) - 0.5) * 0.5 * e; } }
  return (
    <AbsoluteFill>
      <Layer o={P1}>
        <Stage pos={[0, 0.2, 6.5 - zoom * 4.2]} tgt={[0, 0, 0]} fov={45}>
          <StarField n={5000} size={0.4} /><ambientLight intensity={0.5} /><pointLight position={[2, 3, 4]} intensity={50} />
          <Atom3D t={t} r={1.8} seed={8} electrons={4} />
        </Stage>
        <Title at={W("atomo") - 4} lines={["UM ÁTOMO É", "QUASE TODO VAZIO"]} top={70} size={92} />
        <Tag at={W("espaco") - 4}>~99,9999999% ESPAÇO VAZIO</Tag>
      </Layer>
      <Layer o={P2}>
        <Stage pos={[Math.sin(t * 0.15) * 9, 6.5, Math.cos(t * 0.15) * 9]} tgt={[0, 0, 0]} fov={45}>
          <StarField n={4000} size={0.4} /><ambientLight intensity={0.6} /><directionalLight position={[4, 8, 4]} intensity={2} />
          <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[6, 4]} /><meshStandardMaterial color="#15803d" roughness={0.9} /></mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><ringGeometry args={[0.55, 0.6, 64]} /><meshBasicMaterial color="#ffffff" /></mesh>
          {Array.from({ length: 6 }).map((_, i) => <mesh key={i} position={[0, 0.25 + i * 0.32, 0]} scale={[1.55 + i * 0.13, 1, 1.25 + i * 0.13]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[2.6, 3.0, 96]} /><meshStandardMaterial color={i % 2 ? "#334155" : "#475569"} side={THREE.DoubleSide} roughness={0.8} /></mesh>)}
          <Glow pos={[0, 0.08, 0]} size={0.35 + 0.08 * Math.sin(f / 4)} color="#ef4444" opacity={E(t, w("formiga") - 0.2, w("formiga") + 0.2)} />
          {t > w("eletrons") - 0.3 && Array.from({ length: 3 }).map((_, i) => { const a = t * (0.9 + i * 0.25) + i * 2.1; const p: V3 = [Math.cos(a) * 4.6, 1.2 + i * 0.3, Math.sin(a) * 3.8]; return <group key={i}><Glow pos={p} size={0.9} color="#22d3ee" /><Glow pos={p} size={0.35} color="#ffffff" /></group>; })}
        </Stage>
        <Title at={W("nucleo") - 3} lines={["SE O NÚCLEO FOSSE UMA", "FORMIGA NO ESTÁDIO…"]} top={60} size={78} />
        <Tag at={W("arquibancadas") - 6} color="#22D3EE">…OS ELÉTRONS ESTARIAM NAS ARQUIBANCADAS</Tag>
      </Layer>
      <Layer o={P3}>
        <Stage pos={[0, 0, 8]} tgt={[0, 0, 0]} fov={50}><StarField n={2500} size={0.3} opacity={0.5} /></Stage>
        <Title at={W("entre") - 2} lines={["E ENTRE ELES…"]} top={300} size={72} />
        {(() => { const p = useAbsSpring(W("nada") - 2, 0, theme.spring.bouncy); return <div style={{ position: "absolute", left: 0, right: 0, top: 440, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 220, letterSpacing: "0.35em", color: "#fff", opacity: p, transform: `scale(${0.8 + 0.2 * p + Math.max(0, t - w("nada")) * 0.03})`, textShadow: "0 0 60px rgba(255,255,255,.35)" }}>NADA</div>; })()}
      </Layer>
      <Layer o={P4}>
        <Stage pos={[0, 1.2, 12 - shrink * 6]} tgt={[0, 0, 0]} fov={45}>
          <StarField n={4000} size={0.4} /><Nebula seed={22} colors={["#1d4ed8", "#7c3aed"]} z={-40} opacity={0.35} />
          <ambientLight intensity={0.6} /><directionalLight position={[3, 4, 5]} intensity={2.2} />
          <Points pos={cp} col={crowd.c} size={0.28} />
          {shrink > 0.8 && <mesh rotation={[0.5, t * 0.5, 0.3]} scale={interpolate(shrink, [0.8, 1], [0.01, 0.9], cl)}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#ffffff" emissive="#e0f2fe" emissiveIntensity={0.35} roughness={0.5} /></mesh>}
        </Stage>
        <Title at={W("humanidade") - 6} lines={["TODA A HUMANIDADE,", "SEM O ESPAÇO VAZIO…"]} top={70} size={86} />
        <Tag at={W("acucar") - 4} color="#ffffff">= UM CUBO DE AÇÚCAR</Tag>
      </Layer>
      <Layer o={P5}>
        <Stage pos={[2.4, 1.6, 6]} tgt={[0, 0.2, 0]} fov={45}>
          <StarField n={4000} size={0.4} /><ambientLight intensity={0.5} /><directionalLight position={[3, 5, 4]} intensity={2.4} />
          <mesh position={[0, -0.9 - drop * 0.25, 0]}><cylinderGeometry args={[1.6, 1.6, 0.12, 64]} /><meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.25} /></mesh>
          <mesh position={[0, -1.7, 0]}><cylinderGeometry args={[0.18, 0.4, 1.5, 32]} /><meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} /></mesh>
          <mesh position={[0, 2.6 - drop * 3.05, 0]} rotation={[0.3, t * 0.4, 0.2]}><boxGeometry args={[0.8, 0.8, 0.8]} /><meshStandardMaterial color="#ffffff" emissive="#e0f2fe" emissiveIntensity={0.3} /></mesh>
          <Shock p={E(t, w("pesaria") + 0.3, w("pesaria") + 1.6)} r={6} pos={[0, -0.8, 0]} tilt={Math.PI / 2} />
        </Stage>
        <Title at={W("cubinho") - 4} lines={["SÓ QUE ESSE CUBINHO", "PESARIA…"]} top={70} size={86} />
        <Counter at={W("pesaria")} label="PESO" value={`${tons} MILHÕES DE TONELADAS`} x={960} y={860} size={56} />
      </Layer>
      <Layer o={P6}>
        <Stage pos={[-1.6, 0.2, 4.4]} tgt={[-1.6, 0, 0]} fov={45}>
          <StarField n={4000} size={0.4} /><ambientLight intensity={0.6} /><pointLight position={[0, 3, 4]} intensity={40} />
          <Atom3D pos={[-2.6, 0, 0]} t={t} r={1.5} seed={9} electrons={4} />
          <Glow pos={[-2.6, 0, 0.3]} size={1 + 0.2 * Math.sin(f / 5)} color="#ef4444" opacity={massP} />
        </Stage>
        <Title at={W("nucleo", 1) - 4} lines={["O NÚCLEO GUARDA", "QUASE TODA A MASSA"]} top={70} size={86} />
        <div style={{ position: "absolute", left: 1020, top: 360, width: 760 }}>
          <div style={{ fontFamily: F, fontWeight: 900, fontSize: 36, color: "#FCA5A5", marginBottom: 10 }}>NÚCLEO</div>
          <div style={{ height: 70, borderRadius: 18, background: "rgba(255,255,255,.1)", overflow: "hidden" }}><div style={{ height: "100%", width: `${massP * 99.9}%`, background: "linear-gradient(90deg,#b91c1c,#F87171)", boxShadow: "0 0 30px #ef4444" }} /></div>
          <div style={{ fontFamily: F, fontWeight: 900, fontSize: 60, color: "#fff", marginTop: 8 }}>{(massP * 99.9).toFixed(1).replace(".", ",")}% DA MASSA</div>
          <div style={{ height: 36 }} />
          <div style={{ opacity: E(t, w("resto"), w("resto") + 0.4) }}>
            <div style={{ fontFamily: F, fontWeight: 900, fontSize: 34, color: "#BAE6FD", marginBottom: 10 }}>ELÉTRONS + MUITO, MUITO ESPAÇO</div>
            <div style={{ height: 70, borderRadius: 18, background: "rgba(255,255,255,.1)", overflow: "hidden" }}><div style={{ height: "100%", width: "1.5%", background: "#22D3EE" }} /></div>
          </div>
        </div>
      </Layer>
      <Sfx at={W("formiga") - 2} src="sparkle.wav" vol={0.16} />
      <Sfx at={W("nada") - 3} src="impact.wav" vol={0.26} />
      <Sfx at={W("caberia") - 3} src="riser.wav" vol={0.2} />
      <Sfx at={W("pesaria") + 8} src="impact.wav" vol={0.32} />
      <Sfx at={W("guarda") - 2} src="swoosh.wav" vol={0.16} />
    </AbsoluteFill>
  );
};

/* ================= #4 COLORS ================= */
export const B4HD: React.FC = () => {
  const { t, w, W } = useBlock("b4"); const f = useCurrentFrame();
  const C1 = win(t, 3.0, w("luz") - 0.2), C2 = win(t, w("luz") - 0.2, w("seus") - 0.2), C3 = win(t, w("seus") - 0.2, w("exemplo") - 0.3), C4 = win(t, w("exemplo") - 0.3, w("camaroes") - 0.3),
    C5 = win(t, w("camaroes") - 0.3, w("nem") - 0.2), C6 = win(t, w("nem") - 0.2, 999);
  const colorIn = E(t, w("existem", 1) - 0.2, w("cabeca") + 0.6, Easing.inOut(Easing.cubic));
  const mix = E(t, w("recebe"), w("tempo") + 0.3, Easing.inOut(Easing.cubic));
  const shrimp = E(t, w("doze") - 0.3, w("cor", 2) + 0.3, Easing.linear);
  const dalt = E(t, w("daltonismo") - 0.2, w("daltonismo") + 0.8);
  const balls = useMemo(() => { const R = rng(808); return Array.from({ length: 18 }).map((_, i) => ({ p: [(R() - 0.5) * 9, (R() - 0.5) * 4.5, (R() - 0.5) * 3] as V3, r: 0.25 + R() * 0.45, c: new THREE.Color().setHSL(R(), 0.85, 0.55) })); }, []);
  return (
    <AbsoluteFill>
      <Layer o={C1}>
        <Stage pos={[0, 0, 9]} tgt={[0, 0, 0]} fov={45}>
          <StarField n={3000} size={0.35} /><ambientLight intensity={0.6} /><directionalLight position={[3, 4, 5]} intensity={2.2} />
          {balls.map((b, i) => { const g = new THREE.Color(0.5, 0.5, 0.52).lerp(b.c, colorIn); return <mesh key={i} position={[b.p[0], b.p[1] + Math.sin(t + i) * 0.1, b.p[2]]}><sphereGeometry args={[b.r, 48, 48]} /><meshStandardMaterial color={g} roughness={0.35} metalness={0.1} emissive={g} emissiveIntensity={0.15 * colorIn} /></mesh>; })}
        </Stage>
        <Title at={W("cores") - 4} lines={["AS CORES NÃO EXISTEM", "LÁ FORA"]} top={70} size={90} />
        <Tag at={W("cabeca") - 6}>ELAS SÃO CRIADAS NA SUA CABEÇA</Tag>
      </Layer>
      <Layer o={C2}>
        <BG seed={31} colors={["#1d4ed8", "#7c3aed"]} t={t} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <defs><filter id="gw"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <linearGradient id="spec" x1="0" x2="1">{[400, 450, 500, 550, 600, 650, 700].map((nm, i) => <stop key={i} offset={i / 6} stopColor={hue(nm)} />)}</linearGradient></defs>
          {[700, 550, 420].map((nm, i) => { const y = 360 + i * 175; const k = (2 * Math.PI) / (nm * 0.55); const pts = Array.from({ length: 220 }).map((_, j) => { const x = 140 + j * 7.6; return `${x},${y + Math.sin((x - f * 7) * k) * 58}`; }).join(" ");
            return <g key={nm} filter="url(#gw)"><polyline points={pts} fill="none" stroke={hue(nm)} strokeWidth={9} strokeLinecap="round" /><text x={1800} y={y + 14} textAnchor="end" fontFamily="Montserrat" fontWeight={900} fontSize={36} fill={hue(nm)}>{nm} nm</text></g>; })}
          <rect x={360} y={890} width={1200} height={46} rx={23} fill="url(#spec)" />
        </svg>
        <Title at={W("luz") - 3} lines={["LUZ = ENERGIA EM ONDAS", "DE TAMANHOS DIFERENTES"]} top={60} size={78} />
      </Layer>
      <Layer o={C3}>
        <BG seed={33} colors={["#7c3aed", "#db2777"]} t={t} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <defs><radialGradient id="iris"><stop offset="0" stopColor="#1e3a8a" /><stop offset="0.6" stopColor="#2563eb" /><stop offset="1" stopColor="#0ea5e9" /></radialGradient>
            <filter id="gw2"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
          <g transform="translate(330 600)"><ellipse rx={200} ry={125} fill="#f8fafc" /><circle r={92} fill="url(#iris)" /><circle r={42} fill="#020617" /><circle cx={-24} cy={-24} r={14} fill="#fff" /></g>
          {[["L", "#F87171", 0], ["M", "#4ADE80", 1], ["S", "#60A5FA", 2]].map(([l, c, i]) => { const p = E(t, w("tres") + (i as number) * 0.25, w("tres") + (i as number) * 0.25 + 0.4); const y = 420 + (i as number) * 170;
            return <g key={l as string} opacity={p} filter="url(#gw2)"><path d={`M580 ${y + 30} q 35 -60 70 0 v 80 h -70 z`} fill={c as string} /><text x={615} y={y + 160} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={30} fill={c as string}>{l}</text>
              <path d={`M680 ${y + 70} C 920 ${y + 70}, 1010 600, ${1180} 600`} stroke={c as string} strokeWidth={8} fill="none" strokeDasharray="16 12" strokeDashoffset={-f * 3} /></g>; })}
          <g transform="translate(1390 600)" opacity={E(t, w("cerebro") - 0.2, w("cerebro") + 0.3)} filter="url(#gw2)">
            <path d="M-180 0 C -190 -135, -70 -190, 0 -158 C 70 -195, 190 -135, 180 0 C 195 112, 70 158, 0 135 C -70 158, -195 112, -180 0Z" fill="#f9a8d4" stroke="#be185d" strokeWidth={7} />
            <path d="M0 -158 V 135 M-110 -70 q 45 35 0 70 M 110 -70 q -45 35 0 70" stroke="#be185d" strokeWidth={6} fill="none" /></g>
          {[["VERMELHO", "#ef4444", w("vermelho")], ["VERDE", "#22c55e", w("verde")], ["AZUL", "#3b82f6", w("azul")]].map(([l, c, at], i) => { const p = E(t, (at as number) - 0.1, (at as number) + 0.25);
            return <g key={i} opacity={p} transform={`translate(${1690} ${420 + i * 170}) scale(${0.6 + 0.4 * p})`} filter="url(#gw2)"><circle r={62} fill={c as string} /><text y={100} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={28} fill="#fff">{l}</text></g>; })}
        </svg>
        <Title at={W("olhos") - 4} lines={["3 SENSORES DE COR →", "O CÉREBRO MISTURA"]} top={60} size={80} />
      </Layer>
      <Layer o={C4}>
        <BG seed={35} colors={["#4c1d95", "#be185d"]} t={t} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <defs><linearGradient id="rb" x1="0" x2="1">{[400, 450, 500, 550, 600, 650, 700].map((nm, i) => <stop key={i} offset={i / 6} stopColor={hue(nm)} />)}</linearGradient>
            <filter id="gw3"><feGaussianBlur stdDeviation="10" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
          <path d="M240 800 A 720 580 0 0 1 1680 800" stroke="url(#rb)" strokeWidth={84} fill="none" opacity={1 - mix * 0.65} filter="url(#gw3)" />
          {E(t, w("arcoiris"), w("arcoiris") + 0.4) > 0 && <g opacity={E(t, w("arcoiris"), w("arcoiris") + 0.4) * (1 - mix)}><circle cx={960} cy={520} r={84} fill="none" stroke="#ff00ff" strokeWidth={9} strokeDasharray="14 12" /><text x={960} y={552} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={96} fill="#ff00ff">?</text></g>}
          <g style={{ mixBlendMode: "screen" }} opacity={mix} filter="url(#gw3)"><circle cx={960 - 150 * (1 - mix * 0.55)} cy={600} r={210} fill="#ff0000" /><circle cx={960 + 150 * (1 - mix * 0.55)} cy={600} r={210} fill="#0000ff" /></g>
          {mix > 0.7 && <text x={960} y={620} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={60} fill="#fff" opacity={interpolate(mix, [0.7, 1], [0, 1], cl)}>MAGENTA</text>}
        </svg>
        <Title at={W("magenta") - 4} lines={["O MAGENTA NÃO ESTÁ", "NO ARCO-ÍRIS"]} top={60} size={84} color2="#ff4dff" />
        <Tag at={W("inventa") - 4} color="#ff4dff">VERMELHO + AZUL → O CÉREBRO INVENTA</Tag>
      </Layer>
      <Layer o={C5}>
        <BG seed={37} colors={["#0e7490", "#be185d"]} t={t} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(560 620) rotate(${Math.sin(f / 20) * 3}) scale(1.25)`}>
            {Array.from({ length: 9 }).map((_, i) => <ellipse key={i} cx={-240 + i * 55} cy={Math.sin(i * 0.6) * 10} rx={52} ry={70 - Math.abs(i - 3) * 5} fill={`hsl(${140 + i * 25} 80% 55%)`} stroke="#0f172a" strokeWidth={4} />)}
            <path d="M260 0 l70 -40 v80Z" fill="#06b6d4" stroke="#0f172a" strokeWidth={4} />
            <circle cx={-300} cy={-90} r={30} fill="#f472b6" stroke="#0f172a" strokeWidth={4} /><circle cx={-240} cy={-100} r={30} fill="#facc15" stroke="#0f172a" strokeWidth={4} />
            <circle cx={-300} cy={-90} r={10} fill="#0f172a" /><circle cx={-240} cy={-100} r={10} fill="#0f172a" />
            {[-200, -120, -40, 40].map((x, i) => <path key={i} d={`M${x} 60 q 10 50 -10 80`} stroke="#fb923c" strokeWidth={8} fill="none" />)}
          </g>
          <g transform="translate(1100 360)">
            <text x={0} y={0} fontFamily="Montserrat" fontWeight={900} fontSize={40} fill="#fff">HUMANO</text>
            {Array.from({ length: 3 }).map((_, i) => <rect key={i} x={i * 54} y={24} width={42} height={86} rx={10} fill={["#F87171", "#4ADE80", "#60A5FA"][i]} />)}
            <text x={0} y={220} fontFamily="Montserrat" fontWeight={900} fontSize={40} fill="#fff">CAMARÃO LOUVA-A-DEUS</text>
            {Array.from({ length: 12 }).map((_, i) => { const p = interpolate(shrimp, [i / 12, (i + 1) / 12], [0, 1], cl); return <rect key={i} x={i * 54} y={244 + (1 - p) * 30} width={42} height={86} rx={10} fill={`hsl(${i * 30} 90% 60%)`} opacity={p} />; })}
          </g>
        </svg>
        <Title at={W("camaroes") - 4} lines={["O CAMARÃO LOUVA-A-DEUS"]} top={70} size={84} />
        <Tag at={W("receptores") - 4}>+12 TIPOS DE RECEPTORES DE COR (NÓS: 3)</Tag>
      </Layer>
      <Layer o={C6}>
        <BG seed={39} colors={["#14532d", "#7f1d1d"]} t={t} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {[0, 1].map((side) => <g key={side} transform={`translate(${side ? 1360 : 560} 540)`}>
            <circle r={270} fill="rgba(0,0,0,.35)" />
            {Array.from({ length: 110 }).map((_, i) => { const a = random(`da${i}`) * Math.PI * 2, r = Math.sqrt(random(`dr${i}`)) * 250; const x = Math.cos(a) * r, y = Math.sin(a) * r; const inFig = (Math.abs(x) < 55 && y > -160 && y < 160) || (y < -100 && y > -160 && Math.abs(x) < 120);
              const c = inFig ? "#ef4444" : "#22c55e"; const cb = inFig ? "#a8a33f" : "#a39e45"; const col = side ? (dalt > 0.5 ? cb : c) : c;
              return <circle key={i} cx={x} cy={y} r={13 + random(`ds${i}`) * 12} fill={col} />; })}
            <text y={320} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={38} fill="#fff">{side ? "DALTONISMO" : "VISÃO TÍPICA"}</text></g>)}
        </svg>
        <Title at={W("nem") - 3} lines={["NEM TODO MUNDO VÊ", "AS MESMAS CORES"]} top={50} size={76} />
        <Label at={W("oito") - 4} x={640} y={210} size={40}>~8% DOS HOMENS TÊM DALTONISMO</Label>
      </Layer>
      <Sfx at={W("cabeca") - 3} src="sparkle.wav" vol={0.18} />
      <Sfx at={W("magenta") - 3} src="swoosh.wav" vol={0.16} />
      <Sfx at={W("inventa") - 2} src="sparkle.wav" vol={0.2} />
      <Sfx at={W("camaroes") - 3} src="swoosh.wav" vol={0.16} />
      <Sfx at={W("daltonismo") - 2} src="swoosh.wav" vol={0.16} />
    </AbsoluteFill>
  );
};

/* ================= #3 TIME ================= */
const Clock2D: React.FC<{ x: number; y: number; r: number; a: number; color: string; label: string }> = ({ x, y, r, a, color, label }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill="rgba(5,8,20,.7)" stroke={color} strokeWidth={7} style={{ filter: `drop-shadow(0 0 18px ${color})` }} />
    {Array.from({ length: 12 }).map((_, i) => { const q = (i / 12) * Math.PI * 2; return <line key={i} x1={Math.sin(q) * r * 0.8} y1={-Math.cos(q) * r * 0.8} x2={Math.sin(q) * r * 0.92} y2={-Math.cos(q) * r * 0.92} stroke="#fff" strokeWidth={4} />; })}
    <line x1={0} y1={0} x2={Math.sin(a) * r * 0.75} y2={-Math.cos(a) * r * 0.75} stroke={color} strokeWidth={7} strokeLinecap="round" />
    <line x1={0} y1={0} x2={Math.sin(a / 12) * r * 0.5} y2={-Math.cos(a / 12) * r * 0.5} stroke="#fff" strokeWidth={8} strokeLinecap="round" /><circle r={9} fill={color} />
    <text y={r + 52} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={34} fill={color}>{label}</text>
  </g>
);
export const B3HD: React.FC = () => {
  const { t, w, W } = useBlock("b3");
  const T1 = win(t, 3.0, w("einstein") - 0.2), T2 = win(t, w("einstein") - 0.2, w("seus", 1) - 0.2), T3 = win(t, w("seus", 1) - 0.2, w("mas") - 0.1),
    T4 = win(t, w("mas") - 0.1, w("perto", 2) - 0.2), T5 = win(t, w("perto", 2) - 0.2, w("satelites") - 0.4), T6 = win(t, w("satelites") - 0.4, 999);
  const dip = E(t, w("gravidade"), w("desacelera") + 0.8, Easing.inOut(Easing.cubic));
  const ruler = E(t, w("separados"), w("centimetros") + 0.3);
  const years = Math.round(interpolate(t, [w("equivale"), w("anos") + 0.3], [0, 7], cl));
  const grid = useMemo(() => { const lines: THREE.BufferGeometry[] = []; for (let i = 0; i < 25; i++) for (let dir = 0; dir < 2; dir++) { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(61 * 3), 3)); lines.push(g); } return lines; }, []);
  grid.forEach((g, idx) => { const i = Math.floor(idx / 2), dir = idx % 2; const arr = g.attributes.position.array as Float32Array;
    for (let j = 0; j <= 60; j++) { const a = -7 + j * (14 / 60), b = -7 + i * (14 / 24); const x = dir ? b : a, z = dir ? a : b; const d = Math.sqrt(x * x + z * z); arr.set([x, -dip * 2.6 / (1 + d * d * 0.3), z], j * 3); } g.attributes.position.needsUpdate = true; });
  return (
    <AbsoluteFill>
      <Layer o={T1}>
        <Stage pos={[0, 0.6, 5.2]} tgt={[0, 0.5, 0]} fov={45}>
          <StarField n={4000} size={0.4} /><Nebula seed={41} colors={["#1d4ed8", "#0891b2"]} z={-40} opacity={0.35} />
          <HoloBody color="#93c5fd" pos={[-0.9, -0.55, 0]} spin={t * 0.2} />
          <Glow pos={[-0.9, 1.1, 0]} size={0.9} color="#fbbf24" opacity={0.6} /><Glow pos={[-0.9, -1.35, 0]} size={0.8} color="#22d3ee" opacity={0.6} />
        </Stage>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <Clock2D x={1320} y={330} r={120} a={t * 4.0} color={theme.colors.primary} label="CABEÇA: MAIS RÁPIDO" />
          <Clock2D x={1320} y={720} r={120} a={t * 3.6} color="#22D3EE" label="PÉS: MAIS DEVAGAR" />
        </svg>
        <Title at={sec(3.3)} lines={["O TEMPO PASSA MAIS RÁPIDO", "NA SUA CABEÇA"]} top={50} size={76} />
      </Layer>
      <Layer o={T2}>
        <Stage pos={[0, 5, 7.5]} tgt={[0, -0.8, 0]} fov={42}>
          <StarField n={5000} size={0.4} /><ambientLight intensity={0.2} /><directionalLight position={[3, 4, 5]} intensity={2.6} />
          {grid.map((g, i) => <line key={i}><primitive object={g} attach="geometry" /><lineBasicMaterial color="#22D3EE" transparent opacity={0.55} toneMapped={false} /></line>)}
          <EarthHD pos={[0, -dip * 1.7 + 0.4, 0]} r={1.1} spin={t * 0.3} />
        </Stage>
        <Title at={W("gravidade") - 4} lines={["EINSTEIN: A GRAVIDADE", "DESACELERA O TEMPO"]} top={60} size={80} />
        <Tag at={W("devagar") - 6} color="#22D3EE">MAIS PERTO DO CENTRO = TEMPO MAIS DEVAGAR</Tag>
      </Layer>
      <Layer o={T3}>
        <Stage pos={[1.4, 0.5, 5]} tgt={[0.4, 0.3, 0]} fov={45}>
          <StarField n={4000} size={0.4} /><Nebula seed={43} colors={["#312e81", "#b45309"]} z={-40} opacity={0.35} />
          <HoloBody color="#93c5fd" pos={[-0.9, -0.7, 0]} />
          <Glow pos={[-0.9, 0.95, 0]} size={0.8} color="#fbbf24" opacity={0.7} /><Glow pos={[-0.9, -1.5, 0]} size={0.7} color="#22d3ee" opacity={0.7} />
        </Stage>
        <div style={{ position: "absolute", left: 960, top: 250, width: 860 }}>
          <Title at={W("envelhecem") - 4} lines={["SEUS PÉS ENVELHECEM", "MAIS DEVAGAR"]} top={0} size={64} />
        </div>
        <Counter at={W("diferenca") - 4} label="DIFERENÇA NUMA VIDA INTEIRA" value="< 0,000001 s" x={1390} y={640} size={66} />
        <Label at={W("real") - 4} x={1240} y={820} color="#4ADE80" size={52}>MAS É REAL</Label>
      </Layer>
      <Layer o={T4}>
        <BG seed={45} colors={["#1e3a8a", "#0f766e"]} t={t} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <rect x={300} y={800} width={1320} height={34} rx={10} fill="#334155" />
          {[[700, 800], [1220, 800 - 320 * ruler]].map(([x, y], i) => { const c = i ? theme.colors.primary : "#22D3EE"; return <g key={i} transform={`translate(${x} ${y})`}>
            {i === 1 && <rect x={-100} y={0} width={200} height={320 * ruler} fill="#1e293b" />}
            <rect x={-130} y={-230} width={260} height={230} rx={20} fill="#0f172a" stroke={c} strokeWidth={6} style={{ filter: `drop-shadow(0 0 20px ${c})` }} />
            <circle cx={0} cy={-125} r={64} fill="rgba(0,0,0,.6)" stroke={c} strokeWidth={5} /><circle cx={0} cy={-125} r={14 + 5 * Math.sin(t * 8 + i)} fill={c} />
            <text x={0} y={-30} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={26} fill="#fff">RELÓGIO ATÔMICO</text></g>; })}
          {ruler > 0.05 && <g><line x1={1420} y1={800} x2={1420} y2={800 - 320 * ruler} stroke="#fff" strokeWidth={6} /><text x={1450} y={800 - 160 * ruler} fontFamily="Montserrat" fontWeight={900} fontSize={54} fill="#fff">{Math.round(ruler * 30)} cm</text></g>}
        </svg>
        <Title at={W("dez") - 4} lines={["2010: O EFEITO", "FOI MEDIDO"]} top={60} size={84} />
        <Tag at={W("altura") - 4} bottom={140}>O RELÓGIO DE CIMA ANDOU MAIS RÁPIDO</Tag>
      </Layer>
      <Layer o={T5}>
        <Stage pos={[0, 3.4, 8.5 - (t - w("perto", 2)) * 0.15]} tgt={[0, -0.3, 0]} fov={45}>
          <StarField n={8000} size={0.5} /><Nebula seed={47} colors={["#7c2d12", "#4c1d95"]} z={-50} opacity={0.35} />
          <BlackHoleHD t={t} r={1.1} />
        </Stage>
        <Title at={W("buraco") - 4} lines={["PERTO DE UM BURACO NEGRO:", "GIGANTESCO"]} top={60} size={78} />
        <Counter at={W("interestelar") - 4} label="INTERESTELAR · 1 HORA LÁ" value={`= ${years} ANOS AQUI`} x={420} y={560} size={60} />
        <Tag at={W("ficcao") - 4} color="#ffffff">FICÇÃO, MAS COM A MESMA FÍSICA</Tag>
      </Layer>
      <Layer o={T6}>
        <Stage pos={[0, 1, 6.5]} tgt={[0, 0, 0]} fov={42}>
          <StarField n={5000} size={0.4} /><ambientLight intensity={0.15} /><directionalLight position={[3, 2, 5]} intensity={2.6} />
          <EarthHD r={1.6} spin={t * 0.25} tilt={0.3} />
          {Array.from({ length: 6 }).map((_, i) => { const a = t * 0.5 + i * (Math.PI / 3); const inc = (i % 3) * 0.6; const p = new THREE.Vector3(Math.cos(a) * 2.7, 0, Math.sin(a) * 2.7).applyAxisAngle(new THREE.Vector3(1, 0, 0), inc);
            return <group key={i} position={p.toArray() as V3} rotation={[0, a, 0]}><mesh><boxGeometry args={[0.14, 0.14, 0.14]} /><meshStandardMaterial color="#e5e7eb" metalness={0.7} roughness={0.3} /></mesh>
              <mesh position={[0.22, 0, 0]}><boxGeometry args={[0.26, 0.02, 0.12]} /><meshStandardMaterial color="#1d4ed8" metalness={0.4} /></mesh><mesh position={[-0.22, 0, 0]}><boxGeometry args={[0.26, 0.02, 0.12]} /><meshStandardMaterial color="#1d4ed8" metalness={0.4} /></mesh>
              <Glow size={0.5} color="#22d3ee" opacity={0.6} /></group>; })}
        </Stage>
        <Title at={W("satelites") - 3} lines={["OS SATÉLITES DE GPS", "CORRIGEM ISSO"]} top={60} size={84} />
        <Tag at={W("dias") - 4}>TODOS OS DIAS</Tag>
      </Layer>
      <Sfx at={W("einstein") - 2} src="swoosh.wav" vol={0.16} />
      <Sfx at={W("real") - 2} src="impact.wav" vol={0.2} />
      <Sfx at={W("dez") - 3} src="sparkle.wav" vol={0.16} />
      <Sfx at={W("buraco") - 4} src="riser.wav" vol={0.2} />
      <Sfx at={W("satelites") - 3} src="swoosh.wav" vol={0.16} />
    </AbsoluteFill>
  );
};

/* ================= #1 95% ================= */
export const B1HD: React.FC = () => {
  const { t, w, W } = useBlock("b1"); const f = useCurrentFrame(); const v = useV();
  const U1 = win(t, 3.0, w("astronomos") - 0.2), U2 = win(t, w("astronomos") - 0.2, w("tem") - 0.2), U3 = win(t, w("tem") - 0.2, w("resto") - 0.2),
    U4 = win(t, w("resto") - 0.2, w("ideia") - 0.7), U5 = win(t, w("ideia") - 0.7, w("gente") - 0.2), U6 = win(t, w("gente") - 0.2, 999);
  const fly = E(t, w("deveriam"), w("desmanchar") + 1.0, Easing.in(Easing.quad));
  const halo = E(t, w("invisivel") - 0.2, w("escura") + 0.3);
  const hold = E(t, w("segurando"), w("tudo", 1) + 0.8);
  const exp = E(t, w("energia"), w("rapido", 1) + 1.5, Easing.in(Easing.quad));
  const pie = E(t, w("pizza") - 0.2, w("pizza") + 0.7);
  const pct = Math.round(interpolate(t, [w("cinco"), w("universo") + 0.2], [0, 5], cl));
  const gal = useMemo(() => { const R = rng(1234); const n = 2500; const p = new Float32Array(n * 3), c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { p.set([(R() - 0.5) * 14, (R() - 0.5) * 8, (R() - 0.5) * 10], i * 3); const k = [[1, 0.85, 0.55], [0.7, 0.65, 1], [0.55, 0.75, 1]][i % 3]; const b = 0.6 + R(); c.set([k[0] * b, k[1] * b, k[2] * b], i * 3); } return { p, c }; }, []);
  const gp = new Float32Array(gal.p.length); const s = 1 + exp * 2.8; for (let i = 0; i < gp.length; i++) gp[i] = gal.p[i] * s;
  return (
    <AbsoluteFill>
      <Layer o={U1}>
        <Stage pos={[0, 0, 10 - t * 0.6]} tgt={[0, 0, -30]} fov={55}>
          <StarField n={9000} size={0.5} /><Nebula seed={51} z={-60} opacity={0.4} />
          {Array.from({ length: 40 }).map((_, i) => { const R = rng(i + 900); const p: V3 = [(R() - 0.5) * 26, (R() - 0.5) * 14, -6 - R() * 40]; const col = ["#fde68a", "#c4b5fd", "#93c5fd", "#fca5a5"][i % 4];
            return <group key={i} position={p}><Glow size={1 + R() * 2} color={col} opacity={0.9} /><Glow size={0.3} color="#fff" /></group>; })}
        </Stage>
        <Title at={sec(3.6)} lines={["TUDO O QUE VOCÊ JÁ VIU…"]} top={80} size={84} />
        {(() => { const p = useAbsSpring(W("cinco") - 4, 0, theme.spring.bouncy); return <div style={{ position: "absolute", left: 0, right: 0, top: v ? 640 : 300, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 300, color: theme.colors.primary, textShadow: `0 0 100px ${theme.colors.glow}`, opacity: p, transform: `scale(${0.6 + 0.4 * p})` }}>{pct}%</div>; })()}
        <Tag at={W("universo") - 4}>DO UNIVERSO</Tag>
      </Layer>
      <Layer o={U2}>
        <Stage pos={[0, 5.5, 7]} tgt={[0, 0, 0]} fov={50}><StarField n={5000} size={0.4} /><GalaxyHD t={t} n={20000} r={4.5} fly={fly} spinSpeed={0.4} /></Stage>
        <Title at={W("giram") - 4} lines={["AS GALÁXIAS GIRAM", "RÁPIDO DEMAIS"]} top={60} size={86} />
        <Tag at={W("desmanchar") - 6} color="#F87171">COM SÓ A MASSA VISÍVEL, ELAS SE DESMANCHARIAM</Tag>
      </Layer>
      <Layer o={U3}>
        <Stage pos={[0, 6, 8.5]} tgt={[0, 0, 0]} fov={50}><StarField n={5000} size={0.4} /><GalaxyHD t={t} n={20000} r={4.5} fly={1 - hold} halo={halo} spinSpeed={0.4} /></Stage>
        <Title at={W("invisivel") - 4} lines={["ALGO INVISÍVEL", "SEGURA TUDO"]} top={60} size={86} />
        <Counter at={W("materia") - 4} label="MATÉRIA ESCURA" value="~27%" color="#C4B5FD" x={1560} y={540} size={96} />
      </Layer>
      <Layer o={U4}>
        <Stage pos={[0, 0, 12]} tgt={[0, 0, 0]} fov={50}><StarField n={4000} size={0.4} /><Points pos={gp} col={gal.c} size={0.22} /></Stage>
        <Title at={W("energia") - 4} lines={["O UNIVERSO SE EXPANDE", "CADA VEZ MAIS RÁPIDO"]} top={60} size={80} />
        <Counter at={W("energia") - 2} label="ENERGIA ESCURA" value="~68%" color="#22D3EE" x={1560} y={540} size={96} />
      </Layer>
      <Layer o={U5}>
        <BG seed={53} colors={["#7c2d12", "#4c1d95"]} t={t} />
        <svg width={v ? 1080 : 1920} height={v ? 1920 : 1080} style={{ position: "absolute", inset: 0 }}>
          <defs><radialGradient id="crust"><stop offset="0.85" stopColor="#b45309" /><stop offset="1" stopColor="#78350f" /></radialGradient></defs>
          <g transform={v ? `translate(540 870) scale(0.72) rotate(${-90 + pie * 12})` : `translate(720 600) rotate(${-90 + pie * 12})`}>
            <circle r={370} fill="url(#crust)" /><circle r={335} fill="#0b1020" />
            {(() => { const arc = (a0: number, a1: number, r: number) => { const p0 = [Math.cos(a0) * r, Math.sin(a0) * r], p1 = [Math.cos(a1) * r, Math.sin(a1) * r]; return `M0 0 L${p0[0]} ${p0[1]} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p1[0]} ${p1[1]} Z`; };
              const A = (x: number) => x * Math.PI * 2 * pie;
              return <><path d={arc(A(0.05), A(0.32), 335)} fill="#5b21b6" /><path d={arc(A(0.32), A(1), 335)} fill="#0e4a5c" />
                <g transform={`translate(${Math.cos(A(0.025)) * 50 * pie} ${Math.sin(A(0.025)) * 50 * pie})`} style={{ filter: "drop-shadow(0 0 24px #fbbf24)" }}><path d={arc(0, A(0.05) + 0.0001, 335)} fill="#FBBF24" /></g></>; })()}
            {Array.from({ length: 10 }).map((_, i) => <text key={i} x={Math.cos(i * 0.9 + 2) * 200} y={Math.sin(i * 1.7) * 180} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={40} fill="rgba(255,255,255,.18)">?</text>)}
          </g>
        </svg>
        <div style={v ? { position: "absolute", left: 0, right: 0, top: 1170, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 } : { position: "absolute", left: 1200, top: 330, display: "flex", flexDirection: "column", gap: 30 }}>
          {[["5% TUDO O QUE É VISÍVEL", theme.colors.primary, W("fatia") - 4], ["27% MATÉRIA ESCURA", "#C4B5FD", W("resto", 1) - 4], ["68% ENERGIA ESCURA", "#22D3EE", W("resto", 1) + 4]].map(([txt, c, at], i) => { const p = useAbsSpring(at as number, 0, theme.spring.snappy);
            return <div key={i} style={{ fontFamily: F, fontWeight: 900, fontSize: v ? 44 : 48, color: c as string, opacity: p, transform: `translateX(${(1 - p) * 40}px)` }}>■ {txt as string}</div>; })}
        </div>
        <Title at={W("pizza") - 6} lines={["SE O UNIVERSO", "FOSSE UMA PIZZA…"]} top={50} size={80} />
        <Tag at={W("ninguem") - 4} color="#ffffff" bottom={120} hideV>O RESTO, NINGUÉM NUNCA VIU</Tag>
      </Layer>
      <Layer o={U6}>
        <Stage pos={[0, 0, 8 - (t - w("gente")) * 0.4]} tgt={[0, 0, -20]} fov={55}><StarField n={14000} size={0.6} /><Nebula seed={55} z={-60} opacity={0.5} /></Stage>
        <Title at={W("milhares") - 6} lines={["DEPOIS DE MILHARES", "DE ANOS DE CIÊNCIA…"]} top={110} size={70} />
        {(() => { const p = useAbsSpring(W("noventa") - 4, 0, theme.spring.bouncy); return <div style={{ position: "absolute", left: 0, right: 0, top: v ? 680 : 330, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 280, color: theme.colors.primary, textShadow: `0 0 100px ${theme.colors.glow}`, opacity: p, transform: `scale(${0.6 + 0.4 * p})`, lineHeight: 1 }}>95%</div>; })()}
        <Tag at={W("realidade") - 4} bottom={150} color="#ffffff">DA REALIDADE AINDA É UM MISTÉRIO</Tag>
      </Layer>
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
export const OutroHD: React.FC = () => {
  const { t, w, W } = useBlock("outro");
  const O1 = win(t, 0, w("se") - 0.3), O2 = win(t, w("se") - 0.3, w("me") - 0.3), O3 = win(t, w("me") - 0.3, 999);
  const logoP = useAbsSpring(W("se") - 2, 0, theme.spring.bouncy);
  const click = E(t, w("inscreve") + 0.2, w("inscreve") + 0.5);
  return (
    <AbsoluteFill>
      <Layer o={O1}>
        <Stage pos={[0, 0, 30 - t * 3]} tgt={[0, 0, -40]} fov={58}><StarField n={12000} size={0.6} /><Nebula seed={61} z={-70} opacity={0.5} /></Stage>
        <Title at={sec(0.6)} lines={["A REALIDADE É MUITO", "MAIS ESTRANHA"]} top={300} size={100} />
        <Tag at={W("vale") - 4} bottom={260}>CONTINUE PERGUNTANDO</Tag>
      </Layer>
      <Layer o={O2}>
        <Stage pos={[0, 5.5, 8]} tgt={[0, 0, 0]} fov={50}><StarField n={6000} size={0.45} /><GalaxyHD t={t} n={18000} r={5} /></Stage>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,.2), rgba(0,0,0,.6))" }} />
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", display: "flex", flexDirection: "column", gap: 36 }}>
          <div style={{ width: 320, height: 320, borderRadius: "50%", overflow: "hidden", border: `6px solid ${theme.colors.primary}`, boxShadow: `0 0 90px ${theme.colors.glow}`, transform: `scale(${logoP}) rotate(${(1 - logoP) * -120}deg)` }}><Img src={staticFile("longo/logo.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
          <div style={{ fontFamily: F, fontWeight: 900, fontSize: 84, color: "#fff", opacity: logoP, textShadow: "0 6px 30px rgba(0,0,0,.8)" }}>PERGUNTA CÓSMICA</div>
          {(() => { const p = useAbsSpring(W("inscreve") - 4, 0, theme.spring.bouncy); return <div style={{ opacity: p, transform: `scale(${(0.7 + 0.3 * p) * (1 - Math.sin(click * Math.PI) * 0.1)})`, padding: "20px 54px", borderRadius: 18, background: click > 0.5 ? "#334155" : "#dc2626", fontFamily: F, fontWeight: 900, fontSize: 52, color: "#fff", boxShadow: click > 0.5 ? "none" : "0 0 50px #dc262688" }}>{click > 0.5 ? "✓ INSCRITO" : "INSCREVA-SE"}</div>; })()}
        </AbsoluteFill>
      </Layer>
      <Layer o={O3}>
        <BG seed={63} colors={["#1e3a8a", "#7c3aed"]} t={t} />
        <Title at={W("qual") - 4} lines={["QUAL DESSAS EXPLODIU", "SUA CABEÇA? 🤯"]} top={40} size={70} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 250, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px 40px", padding: "0 130px" }}>
          {ITEMS.map((it, i) => { const p = useAbsSpring(W("me") + i * 4, 0, theme.spring.snappy); return <div key={i} style={{ opacity: p, transform: `translateY(${(1 - p) * 24}px)`, fontFamily: F, fontWeight: 900, fontSize: 36, color: "#fff", padding: "18px 26px", borderRadius: 18, background: "rgba(5,8,20,.6)", border: "2px solid rgba(255,255,255,.2)" }}><span style={{ color: theme.colors.primary }}>#{8 - i} </span>{it}</div>; })}
        </div>
        <Tag at={W("comentarios") - 4} bottom={180}>COMENTA AQUI EMBAIXO 👇</Tag>
      </Layer>
      <Sfx at={W("se") - 2} src="sparkle.wav" vol={0.2} />
      <Sfx at={W("inscreve") + 4} src="impact.wav" vol={0.16} />
    </AbsoluteFill>
  );
};
