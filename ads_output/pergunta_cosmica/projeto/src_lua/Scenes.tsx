import React from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, random, Easing, Img, staticFile } from "remotion";
import { theme } from "./theme";
import { wordT, segT, sec } from "./time";
import { Canvas3D, Stars, Earth, MoonBody, MoonParticles, Glow, project, screenRadius, cl, V3 } from "./three";
import { H, Rise, Pill, Title, Callout, useAbsSpring } from "./ui";

type P = { start: number };
const useT = (start: number) => { const f = useCurrentFrame(); const { fps } = useVideoConfig(); return (f + start) / fps; };
const F = (s: number) => sec(s);
const eio = Easing.bezier(0.65, 0, 0.35, 1);

/* 0 — HOOK: Earth + Moon, moon dissolves */
export const Hook: React.FC<P> = ({ start }) => {
  const t = useT(start);
  const tv = wordT(0, "agora") + 0.2;
  const cam = { pos: [0.4 - t * 0.05, 0.3, 7.6 - t * 0.25] as V3, tgt: [0.15, 0.1, 0] as V3, fov: 42 };
  const earthP: V3 = [-0.5, -1.35, 0], moonP: V3 = [0.95, 0.95, -0.6];
  const dp = interpolate(t, [tv, tv + 1.6], [0, 1], cl);
  const moonScale = interpolate(t, [tv - 0.05, tv + 0.25], [1, 0], { ...cl, easing: Easing.in(Easing.cubic) });
  const flash = interpolate(t, [tv - 0.05, tv + 0.1, tv + 0.8], [0, 1, 0], cl);
  const e2 = project(earthP, cam.pos, cam.tgt, cam.fov), m2 = project(moonP, cam.pos, cam.tgt, cam.fov);
  const er = screenRadius(earthP, 1.2, cam.pos, cam.tgt, cam.fov), mr = screenRadius(moonP, 0.42, cam.pos, cam.tgt, cam.fov);
  return (
    <AbsoluteFill>
      <Canvas3D {...cam}>
        <Stars />
        <ambientLight intensity={0.08} />
        <directionalLight position={[6, 3, 5]} intensity={2.6} color="#fff4e0" />
        <Earth pos={earthP} r={1.2} spin={t * 0.15} />
        <MoonBody pos={moonP} r={0.42} spin={t * 0.1} scale={moonScale} />
        <MoonParticles pos={moonP} r={0.42} p={dp} />
        <Glow pos={moonP} size={2.4 + flash * 2} opacity={0.25 * moonScale + flash * 0.9} color="#e2e8f0" />
      </Canvas3D>
      <Title top={200}>
        <Rise at={F(0.3) + 2} start={start}><div style={{ ...H, fontSize: 116 }}>E SE A LUA</div></Rise>
        <Rise at={F(wordT(0, "desaparecesse")) - 2} start={start} cfg={theme.spring.bouncy}><div style={{ ...H, fontSize: 108, color: theme.colors.primary, textShadow: `0 0 50px ${theme.colors.glow}` }}>SUMISSE AGORA?</div></Rise>
      </Title>
      <Callout x={m2.x - mr * 0.7} y={m2.y + mr * 0.5} dx={-150} dy={70} text="LUA" at={F(0.4)} start={start} color="#E2E8F0" out={F(tv) - 4} />
      <Callout x={e2.x + er * 0.55} y={e2.y - er * 0.6} dx={140} dy={-60} text="TERRA" at={F(0.7)} start={start} color="#7DD3FC" />
    </AbsoluteFill>
  );
};

/* 1 — NIGHT: with moon vs without moon */
const NightPanel: React.FC<{ moon: boolean; t: number }> = ({ moon, t }) => {
  const W = 1000, Hh = 520;
  const stars = Array.from({ length: moon ? 40 : 140 }).map((_, i) => ({ x: random(`nx${i}`) * W, y: random(`ny${i}`) * Hh * 0.62, r: 0.8 + random(`nr${i}`) * (moon ? 1.4 : 2.4), tw: random(`nt${i}`) }));
  const sky = moon ? ["#16325c", "#0b1a33"] : ["#03050b", "#010204"];
  const k = moon ? 1 : 0.18;
  return (
    <svg width={W} height={Hh} viewBox={`0 0 ${W} ${Hh}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`sky${moon}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sky[0]} /><stop offset="1" stopColor={sky[1]} /></linearGradient>
        <radialGradient id={`mg${moon}`}><stop offset="0" stopColor="rgba(226,232,240,.55)" /><stop offset="1" stopColor="rgba(226,232,240,0)" /></radialGradient>
        <linearGradient id={`refl${moon}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(226,232,240,.7)" /><stop offset="1" stopColor="rgba(226,232,240,0)" /></linearGradient>
      </defs>
      <rect width={W} height={Hh} fill={`url(#sky${moon})`} />
      {stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={0.4 + 0.6 * Math.abs(Math.sin(t * 2 + s.tw * 10))} />)}
      {moon && <><circle cx={720} cy={120} r={150} fill={`url(#mg${moon})`} /><circle cx={720} cy={120} r={52} fill="#f1f5f9" /><circle cx={705} cy={108} r={10} fill="#cbd5e1" /><circle cx={738} cy={135} r={7} fill="#cbd5e1" /></>}
      <rect y={Hh * 0.66} width={W} height={Hh * 0.34} fill={moon ? "#0d2240" : "#020409"} />
      {moon && Array.from({ length: 9 }).map((_, i) => <rect key={i} x={690 + Math.sin(t * 3 + i) * 14 - (i * 6)} y={Hh * 0.68 + i * 17} width={60 + i * 12} height={5} rx={3} fill="#e2e8f0" opacity={0.75 - i * 0.07} />)}
      <path d={`M0 ${Hh * 0.7} Q 150 ${Hh * 0.48} 320 ${Hh * 0.62} T 560 ${Hh * 0.68} L560 ${Hh} L0 ${Hh}Z`} fill={moon ? "#071226" : "#000"} />
      <rect x={170} y={Hh * 0.5} width={90} height={70} fill={moon ? "#0b1a33" : "#020305"} /><path d={`M160 ${Hh * 0.5} L215 ${Hh * 0.42} L270 ${Hh * 0.5}Z`} fill={moon ? "#0b1a33" : "#020305"} />
      <rect x={200} y={Hh * 0.55} width={26} height={24} fill="#FBBF24" opacity={0.9} />
      <path d={`M0 ${Hh} L0 ${Hh * 0.8} Q 40 ${Hh * 0.74} 90 ${Hh * 0.8} L 90 ${Hh}Z`} fill="#000" opacity={0.6 * k + 0.4} />
    </svg>
  );
};
export const Night: React.FC<P> = ({ start }) => {
  const t = useT(start);
  const noite = F(wordT(1, "noite"));
  const split = useAbsSpring(noite - 4, start, theme.spring.smooth);
  const kb = interpolate(t, [segT(1), segT(2)], [1, 1.06], { ...cl, easing: eio });
  const card: React.CSSProperties = { position: "absolute", left: 40, width: 1000, height: 520, borderRadius: 34, overflow: "hidden", border: "2px solid rgba(255,255,255,0.16)", boxShadow: "0 40px 80px -30px rgba(0,0,0,.8)" };
  return (
    <AbsoluteFill style={{ background: "#03040a" }}>
      <Title top={130}>
        <Rise at={F(segT(1)) + 2} start={start}><div style={{ ...H, fontSize: 84 }}>A PRIMEIRA NOITE</div></Rise>
      </Title>
      <div style={{ ...card, top: 300 + (1 - split) * 260 }}>
        <div style={{ transform: `scale(${kb})`, transformOrigin: "70% 30%" }}><NightPanel moon t={t} /></div>
        <div style={{ position: "absolute", left: 24, top: 22 }}><Pill bg="#E2E8F0" size={40}>COM LUA</Pill></div>
      </div>
      <div style={{ ...card, top: 860, opacity: split, transform: `translateY(${(1 - split) * 120}px)` }}>
        <div style={{ transform: `scale(${kb})`, transformOrigin: "50% 40%" }}><NightPanel moon={false} t={t} /></div>
        <div style={{ position: "absolute", left: 24, top: 22 }}><Pill bg={theme.colors.primary} size={40} glow>SEM LUA</Pill></div>
        <div style={{ position: "absolute", right: 24, bottom: 22 }}><Rise at={F(wordT(1, "escura")) - 3} start={start} cfg={theme.spring.bouncy}><Pill bg="#fff" size={36}>MUITO MAIS ESCURA</Pill></Rise></div>
      </div>
    </AbsoluteFill>
  );
};

/* 2 — TIDES */
export const Tides: React.FC<P> = ({ start }) => {
  const t = useT(start);
  const cam = { pos: [0, 9.6, 5.6] as V3, tgt: [0, 0, 0.35] as V3, fov: 40 };
  const moonP: V3 = [0.25, 0, -2.75], sunDir = new THREE.Vector3(-1, 0, -0.55).normalize();
  const gone = wordT(2, "sem") ;
  const amp = interpolate(t, [gone + 0.2, gone + 1.6], [1, 0.33], { ...cl, easing: eio });
  const dirAng = interpolate(t, [gone + 0.2, gone + 1.6], [Math.atan2(-moonP[2], moonP[0]), Math.atan2(-sunDir.z, sunDir.x)], { ...cl, easing: eio });
  const ms = interpolate(t, [gone - 0.05, gone + 0.25], [1, 0], { ...cl, easing: Easing.in(Easing.cubic) });
  const dp = interpolate(t, [gone, gone + 1.4], [0, 1], cl);
  const pulse = 1 + 0.04 * Math.sin(t * 2.2) * amp;
  const bulge = 1 + 0.6 * amp * pulse;
  const R = 0.95;
  const tip: V3 = [Math.cos(dirAng) * R * 1.07 * bulge, 0.15, -Math.sin(dirAng) * R * 1.07 * bulge];
  const tip2 = project(tip, cam.pos, cam.tgt, cam.fov), m2 = project(moonP, cam.pos, cam.tgt, cam.fov);
  const sunP: V3 = [sunDir.x * 6, 0, sunDir.z * 6];
  const s2 = project(sunP, cam.pos, cam.tgt, cam.fov);
  const sunIn = interpolate(t, [gone + 0.6, gone + 1.4], [0, 1], cl);
  const barP = useAbsSpring(F(wordT(2, "terco")) - 10, start, theme.spring.smooth);
  return (
    <AbsoluteFill>
      <Canvas3D {...cam}>
        <Stars />
        <ambientLight intensity={0.25} />
        <directionalLight position={[3, 6, 4]} intensity={2.4} color="#fff4e0" />
        <Earth r={R} tilt={0} rx={-1.15} spin={t * 0.12} atmo={0.6} />
        <mesh rotation={[0, dirAng, 0]} scale={[bulge, 0.96, 1.0]}><sphereGeometry args={[R * 1.07, 64, 48]} /><meshStandardMaterial color="#38BDF8" emissive="#0EA5E9" emissiveIntensity={0.35} transparent opacity={0.5} roughness={0.2} depthWrite={false} /></mesh>
        <mesh rotation={[0, dirAng, 0]} scale={[bulge * 1.04, 1.0, 1.04]}><sphereGeometry args={[R * 1.07, 64, 48]} /><meshBasicMaterial color="#7DD3FC" transparent opacity={0.12} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
        <MoonBody pos={moonP} r={0.45} spin={t * 0.1} scale={ms} />
        <MoonParticles pos={moonP} r={0.45} p={dp} />
        <Glow pos={sunP} size={5.5} color="#FBBF24" opacity={sunIn} />
        <Glow pos={sunP} size={1.2} color="#fff7d6" opacity={sunIn} />
      </Canvas3D>
      <Title top={150}>
        <Rise at={F(segT(2)) + 2} start={start}><div style={{ ...H, fontSize: 96 }}>AS MARÉS</div></Rise>
      </Title>
      <Callout x={m2.x - 40} y={m2.y + 30} dx={-90} dy={110} text="LUA PUXA A ÁGUA" at={F(wordT(2, "puxa")) - 4} start={start} color="#E2E8F0" out={F(gone) - 6} size={34} />
      <Callout x={tip2.x} y={tip2.y} dx={amp > 0.6 ? 150 : 40} dy={amp > 0.6 ? 90 : 190} text={amp > 0.6 ? "MARÉ ALTA" : "MARÉ MENOR"} at={F(wordT(2, "mare", 1)) - 4} start={start} color={theme.colors.green} size={36} />
      {sunIn > 0.05 && <Callout x={Math.min(1040, Math.max(40, s2.x))} y={s2.y} dx={160} dy={-40} text="SÓ O SOL" at={F(gone + 0.9)} start={start} color={theme.colors.primary} size={36} />}
      {/* bar comparison */}
      <div style={{ position: "absolute", left: 140, top: 1190, width: 800, opacity: barP, transform: `translateY(${(1 - barP) * 40}px)` }}>
        {[["HOJE", 1, "#38BDF8"], ["SEM LUA", 0.33, theme.colors.primary]].map(([l, v, c]: any, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 16 }}>
            <div style={{ width: 210, fontFamily: theme.fonts.display, fontWeight: 900, fontSize: 36, color: "#fff", textAlign: "right" }}>{l}</div>
            <div style={{ flex: 1, height: 44, borderRadius: 22, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
              <div style={{ width: `${v * 100 * barP}%`, height: "100%", borderRadius: 22, background: c, boxShadow: `0 0 24px ${c}` }} />
            </div>
            <div style={{ width: 90, fontFamily: theme.fonts.display, fontWeight: 900, fontSize: 36, color: c }}>{i === 0 ? "100%" : "~⅓"}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* 3 — ANIMALS */
const Turtle = () => (<svg width="150" height="120" viewBox="0 0 150 120"><ellipse cx="75" cy="62" rx="46" ry="34" fill="#22C55E" /><path d="M45 62 Q75 30 105 62 Q75 92 45 62Z" fill="#15803D" /><circle cx="128" cy="58" r="13" fill="#4ADE80" /><ellipse cx="40" cy="30" rx="18" ry="8" fill="#4ADE80" transform="rotate(-35 40 30)" /><ellipse cx="40" cy="94" rx="18" ry="8" fill="#4ADE80" transform="rotate(35 40 94)" /><ellipse cx="108" cy="28" rx="16" ry="7" fill="#4ADE80" transform="rotate(30 108 28)" /><ellipse cx="108" cy="96" rx="16" ry="7" fill="#4ADE80" transform="rotate(-30 108 96)" /></svg>);
const Coral = () => (<svg width="150" height="120" viewBox="0 0 150 120"><path d="M75 118 L75 70 M75 80 L45 45 M45 45 L35 20 M45 45 L60 22 M75 70 L105 40 M105 40 L98 15 M105 40 L125 25 M75 60 L80 25" stroke="#FB7185" strokeWidth="12" strokeLinecap="round" fill="none" />{[[40,12],[62,14],[96,8],[128,18],[82,16]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="5" fill="#FDE68A" />)}</svg>);
const Fish = () => (<svg width="150" height="120" viewBox="0 0 150 120"><path d="M20 60 Q70 15 115 60 Q70 105 20 60Z" fill="#38BDF8" /><path d="M110 60 L145 32 L138 60 L145 88Z" fill="#0EA5E9" /><circle cx="42" cy="54" r="6" fill="#0B0B12" /><path d="M60 40 Q70 60 60 80" stroke="#0284C7" strokeWidth="4" fill="none" /></svg>);
export const Animals: React.FC<P> = ({ start }) => {
  const t = useT(start);
  const items: [React.FC, string, string, string][] = [
    [Turtle, "TARTARUGAS", "Filhotes se guiam pela luz da Lua até o mar", "tartarugas"],
    [Coral, "CORAIS", "Desova em massa sincronizada com a lua cheia", "corais"],
    [Fish, "PEIXES", "Muitos se reproduzem no ritmo das marés", "peixes"],
  ];
  const stamp = useAbsSpring(F(wordT(3, "reproduzir")) - 6, start, theme.spring.bouncy);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#0b2a4a 0%,#071a33 55%,#030a18 100%)" }}>
      {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ position: "absolute", left: 60 + i * 180 + Math.sin(t + i) * 20, top: -50, width: 70, height: 1300, background: "linear-gradient(180deg, rgba(125,211,252,.10), transparent)", transform: "skewX(-10deg)", filter: "blur(8px)" }} />)}
      {Array.from({ length: 40 }).map((_, i) => <div key={i} style={{ position: "absolute", left: random(`bx${i}`) * 1080, top: 1900 - ((t * (30 + random(`bs${i}`) * 60) + random(`by${i}`) * 1900) % 1900), width: 6 + random(`br${i}`) * 8, height: 6 + random(`br${i}`) * 8, borderRadius: "50%", border: "2px solid rgba(186,230,253,.35)" }} />)}
      <Title top={150}>
        <Rise at={F(segT(3)) + 2} start={start}><div style={{ ...H, fontSize: 80 }}>A VIDA SENTE</div></Rise>
        <Rise at={F(segT(3)) + 6} start={start}><div style={{ ...H, fontSize: 80, color: theme.colors.primary }}>A FALTA DA LUA</div></Rise>
      </Title>
      <div style={{ position: "absolute", top: 410, left: 50, display: "flex", flexDirection: "column", gap: 34 }}>
        {items.map(([Icon, name, desc, w], i) => (
          <Rise key={i} at={F(wordT(3, w)) - 4} start={start} cfg={theme.spring.bouncy} y={60}>
            <div style={{ display: "flex", alignItems: "center", gap: 26, width: 980, boxSizing: "border-box", padding: "30px 30px", borderRadius: 30, background: "rgba(255,255,255,0.07)", border: "2px solid rgba(255,255,255,0.14)", boxShadow: "0 30px 60px -25px rgba(0,0,0,.7)" }}>
              <div style={{ transform: `translateY(${Math.sin(t * 2 + i) * 5}px) rotate(${Math.sin(t * 1.5 + i) * 4}deg)` }}><Icon /></div>
              <div>
                <div style={{ fontFamily: theme.fonts.display, fontWeight: 900, fontSize: 58, color: "#fff" }}>{name}</div>
                <div style={{ fontFamily: theme.fonts.display, fontWeight: 600, fontSize: 34, color: theme.colors.textDim, marginTop: 6, maxWidth: 720, lineHeight: 1.2 }}>{desc}</div>
              </div>
            </div>
          </Rise>
        ))}
      </div>
      <AbsoluteFill style={{ top: 1270, alignItems: "center" }}>
        <div style={{ opacity: Math.min(1, stamp * 1.4), transform: `scale(${1.6 - 0.6 * stamp}) rotate(${-4 * stamp}deg)` }}><Pill bg={theme.colors.accent} color="#fff" size={52}>SEM LUA: RITMO PERDIDO</Pill></div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 4+5 — AXIS: stable with moon, chaotic without */
const Top: React.FC<{ wob: number; t: number }> = ({ wob, t }) => (
  <svg width="200" height="230" viewBox="0 0 200 230">
    <ellipse cx="100" cy="215" rx="60" ry="10" fill="rgba(0,0,0,.4)" />
    <g transform={`rotate(${wob} 100 210)`}>
      <path d="M100 210 L40 110 Q100 70 160 110Z" fill="#A78BFA" />
      <path d="M40 110 Q100 70 160 110 Q100 140 40 110Z" fill="#C4B5FD" />
      <path d={`M55 112 Q100 ${95 + Math.sin(t * 20) * 6} 145 112`} stroke="#7C3AED" strokeWidth="6" fill="none" />
      <rect x="94" y="45" width="12" height="55" rx="5" fill="#FBBF24" />
    </g>
  </svg>
);
export const Axis: React.FC<P> = ({ start }) => {
  const t = useT(start);
  const s5 = segT(5);
  const cam = { pos: [0.0, 0.5, 7.4] as V3, tgt: [0, 0.15, 0] as V3, fov: 44 };
  const R = 1.25;
  const moonA = t * 0.9;
  const moonP: V3 = [Math.cos(moonA) * 3.0, -0.25, Math.sin(moonA) * 3.0];
  const gone = s5 + 0.1;
  const ms = interpolate(t, [gone - 0.05, gone + 0.25], [1, 0], { ...cl, easing: Easing.in(Easing.cubic) });
  const dp = interpolate(t, [gone, gone + 1.4], [0, 1], cl);
  const chaosA = interpolate(t, [gone + 0.6, gone + 4.5], [0, 1], { ...cl, easing: eio });
  const tilt = 23.4 + chaosA * (20 * Math.sin((t - gone) * 2.1) + 9 * Math.sin((t - gone) * 4.7 + 1));
  const frost = interpolate(tilt, [33, 48], [0, 0.75], cl);
  const axisIn = interpolate(t, [segT(4) + 0.8, segT(4) + 1.8], [0, 1], cl);
  const c2 = project([0, 0, 0], cam.pos, cam.tgt, cam.fov);
  const rr = screenRadius([0, 0, 0], R, cam.pos, cam.tgt, cam.fov);
  const arcR = rr * 1.45;
  const a = (tilt * Math.PI) / 180;
  const tipX = c2.x + Math.sin(a) * arcR, tipY = c2.y - Math.cos(a) * arcR;
  const angleIn = useAbsSpring(F(wordT(4, "inclinacao")) - 4, start, theme.spring.smooth);
  const topIn = useAbsSpring(F(wordT(4, "piao")) - 8, start, theme.spring.bouncy);
  const wob = t < gone ? Math.sin(t * 3) * 3 : Math.sin(t * 3.3) * (3 + 26 * chaosA);
  const years = Math.floor(interpolate(t, [gone + 0.8, segT(6) - 0.3], [0, 50], cl));
  const seasonsAt = wordT(5, "estacoes");
  const seasonIn = useAbsSpring(F(seasonsAt) - 6, start, theme.spring.bouncy);
  const flip = Math.floor((t - seasonsAt) * 3) % 2 === 0;
  const stable = t < gone;
  return (
    <AbsoluteFill>
      <Canvas3D {...cam}>
        <Stars />
        <ambientLight intensity={0.22} />
        <directionalLight position={[5, 2, 5]} intensity={2.6} color="#fff4e0" />
        <Earth r={R} tilt={tilt} spin={t * 0.6} axis={axisIn} frost={frost} />
        <MoonBody pos={moonP} r={0.34} spin={t * 0.1} scale={ms} />
        <MoonParticles pos={moonP} r={0.34} p={dp} />
      </Canvas3D>
      {/* angle overlay */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: angleIn }}>
        <line x1={c2.x} y1={c2.y - rr * 1.75} x2={c2.x} y2={c2.y + rr * 1.75} stroke="rgba(255,255,255,.55)" strokeWidth={4} strokeDasharray="14 12" />
        <path d={`M ${c2.x} ${c2.y - arcR} A ${arcR} ${arcR} 0 0 ${tilt >= 0 ? 1 : 0} ${tipX} ${tipY}`} stroke={stable ? theme.colors.primary : "#F87171"} strokeWidth={8} fill="none" strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", left: c2.x + arcR * 0.55, top: c2.y - arcR * 1.12, opacity: angleIn, transform: `scale(${0.8 + 0.2 * angleIn})` }}>
        <span style={{ fontFamily: theme.fonts.display, fontWeight: 900, fontSize: 72, color: stable ? theme.colors.primary : "#F87171", textShadow: "0 6px 24px rgba(0,0,0,.9)", fontVariantNumeric: "tabular-nums" }}>{stable ? "23,4" : Math.round(tilt)}°</span>
      </div>
      <Title top={150}>
        {stable ? (
          <Rise at={F(segT(4)) + 2} start={start} out={F(gone) - 8}><div style={{ ...H, fontSize: 80 }}>O EIXO DA TERRA</div></Rise>
        ) : (
          <Rise at={F(gone)} start={start} cfg={theme.spring.bouncy}><div style={{ ...H, fontSize: 80, color: "#F87171" }}>SEM A LUA…</div></Rise>
        )}
      </Title>
      {stable && <AbsoluteFill style={{ top: 1260, alignItems: "center" }}><Rise at={F(wordT(4, "angulo")) - 4} start={start} cfg={theme.spring.bouncy} out={F(gone) - 8}><Pill bg={theme.colors.green} size={44}>COM LUA: ÂNGULO QUASE FIXO</Pill></Rise></AbsoluteFill>}
      {!stable && t > gone + 0.8 && (
        <AbsoluteFill style={{ top: 1260, alignItems: "center" }}>
          <Rise at={F(gone + 0.8)} start={start}><Pill bg="#fff" size={40}>+{years} MILHÕES DE ANOS</Pill></Rise>
        </AbsoluteFill>
      )}
      {/* spinning top inset */}
      <div style={{ position: "absolute", left: 40, top: 330, opacity: topIn, transform: `scale(${0.6 + 0.4 * topIn})`, transformOrigin: "0 0", padding: "16px 10px 6px", borderRadius: 26, background: "rgba(255,255,255,0.07)", border: "2px solid rgba(255,255,255,0.14)", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Top wob={wob} t={t} />
        <div style={{ fontFamily: theme.fonts.display, fontWeight: 900, fontSize: 28, color: stable ? theme.colors.green : "#F87171", marginTop: 2 }}>{stable ? "PIÃO ESTÁVEL" : "PIÃO BAMBO"}</div>
      </div>
      {/* seasons */}
      {!stable && seasonIn > 0.01 && (
        <div style={{ position: "absolute", right: 34, top: 1040, opacity: seasonIn, transform: `scale(${0.6 + 0.4 * seasonIn})`, transformOrigin: "100% 0", padding: "18px 22px", borderRadius: 26, background: "rgba(255,255,255,0.07)", border: "2px solid rgba(255,255,255,0.14)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <svg width="150" height="150" viewBox="0 0 100 100">{flip ? (<g><circle cx="50" cy="50" r="22" fill="#FBBF24" />{Array.from({ length: 8 }).map((_, i) => <line key={i} x1="50" y1="14" x2="50" y2="4" stroke="#FBBF24" strokeWidth="6" strokeLinecap="round" transform={`rotate(${i * 45} 50 50)`} />)}</g>) : (<g stroke="#BAE6FD" strokeWidth="6" strokeLinecap="round">{[0, 60, 120].map((r) => <g key={r} transform={`rotate(${r} 50 50)`}><line x1="50" y1="10" x2="50" y2="90" /><line x1="50" y1="22" x2="40" y2="14" /><line x1="50" y1="22" x2="60" y2="14" /><line x1="50" y1="78" x2="40" y2="86" /><line x1="50" y1="78" x2="60" y2="86" /></g>)}</g>)}</svg>
          <div style={{ fontFamily: theme.fonts.display, fontWeight: 900, fontSize: 28, color: "#fff" }}>ESTAÇÕES</div>
          <div style={{ fontFamily: theme.fonts.display, fontWeight: 900, fontSize: 28, color: "#F87171" }}>NO CAOS</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/* 6+7 — CONCLUSION + CTA */
export const Outro: React.FC<P & { cta: number }> = ({ start, cta }) => {
  const t = useT(start);
  const s6 = segT(6);
  const cam = { pos: [0.3 + (t - s6) * 0.04, 0.4, 7.4 - (t - s6) * 0.12] as V3, tgt: [0.1, 0.2, 0] as V3, fov: 44 };
  const earthP: V3 = [-0.25, -0.2, 0], moonP: V3 = [1.25, 1.75, -0.8];
  const back = interpolate(t, [s6 + 0.1, s6 + 1.6], [1, 0], { ...cl, easing: Easing.inOut(Easing.cubic) });
  const ms = interpolate(t, [s6 + 1.3, s6 + 1.8], [0, 1], { ...cl, easing: Easing.out(Easing.back(2)) });
  const f = useCurrentFrame();
  const inCta = f + start >= cta;
  const ctaP = useAbsSpring(cta, start, theme.spring.smooth);
  return (
    <AbsoluteFill>
      <Canvas3D {...cam}>
        <Stars />
        <ambientLight intensity={0.12} />
        <directionalLight position={[6, 3, 5]} intensity={2.6} color="#fff4e0" />
        <Earth pos={earthP} r={1.25} spin={t * 0.15} />
        <MoonParticles pos={moonP} r={0.42} p={back} />
        <MoonBody pos={moonP} r={0.42} spin={t * 0.1} scale={ms} />
        <Glow pos={moonP} size={2.6} opacity={0.3 * ms + (ms > 0 && ms < 1 ? 0.5 : 0)} color="#e2e8f0" />
      </Canvas3D>
      {!inCta && (
        <Title top={190}>
          <Rise at={F(wordT(6, "nao")) - 4} start={start} out={cta - 8}><div style={{ ...H, fontSize: 70 }}>A LUA NÃO É SÓ BONITA</div></Rise>
          <div style={{ height: 980 }} />
          <Rise at={F(wordT(6, "habitavel")) - 10} start={start} cfg={theme.spring.bouncy} out={cta - 8}><Pill bg={theme.colors.primary} size={50} glow>ELA MANTÉM A TERRA HABITÁVEL</Pill></Rise>
        </Title>
      )}
      {inCta && (
        <AbsoluteFill style={{ background: `rgba(2,3,10,${0.45 * ctaP})` }}>
          <Title top={250}>
            <div style={{ width: 210, height: 210, borderRadius: "50%", overflow: "hidden", border: "3px solid rgba(255,255,255,0.25)", boxShadow: "0 0 60px rgba(124,92,255,.55)", transform: `scale(${ctaP}) rotate(${(1 - ctaP) * -40}deg)`, marginBottom: 10 }}>
              <Img src={staticFile("lua/logo.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.45) translateY(1%)" }} />
            </div>
            <Rise at={cta + 5} start={start}><div style={{ ...H, fontSize: 46, fontWeight: 800, color: theme.colors.textDim }}>SEGUE O</div></Rise>
            <Rise at={cta + 9} start={start} cfg={theme.spring.bouncy}><div style={{ ...H, fontSize: 104 }}>PERGUNTA</div><div style={{ ...H, fontSize: 104, color: theme.colors.primary, textShadow: `0 0 50px ${theme.colors.glow}` }}>CÓSMICA</div></Rise>
            <Rise at={cta + 14} start={start}><div style={{ ...H, fontSize: 40, fontWeight: 800, color: theme.colors.textDim }}>pra mais curiosidades do universo</div></Rise>
            <div style={{ height: 70 }} />
            <Rise at={cta + 22} start={start} cfg={theme.spring.bouncy}>
              <div style={{ display: "flex", alignItems: "center", gap: 18, background: "#fff", color: theme.colors.ink, fontFamily: theme.fonts.display, fontWeight: 900, fontSize: 56, padding: "24px 52px", borderRadius: 999, boxShadow: "0 0 50px rgba(255,255,255,.35)", transform: `scale(${1 + Math.sin(f / 7) * 0.035})` }}>
                <svg width="44" height="44" viewBox="0 0 40 40"><path d="M20 6v28M6 20h28" stroke={theme.colors.ink} strokeWidth="6" strokeLinecap="round" /></svg>SEGUIR
              </div>
            </Rise>
          </Title>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
