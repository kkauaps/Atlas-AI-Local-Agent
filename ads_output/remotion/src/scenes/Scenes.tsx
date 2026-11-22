import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig, Easing } from "remotion";
import { theme } from "../theme";
import { wordFrame } from "../time";
import { Enter, Breathe, Pill, Check, Cross, useSpring } from "../components/Motion";
import { BgMesh, Bokeh, Snow, Flash } from "../components/Layers";
import { Sequence } from "remotion";
import { BlurBg, Card } from "../components/Media";
import { segStart } from "../time";

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const H: React.CSSProperties = { fontFamily: theme.fonts.display, fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.0, color: theme.colors.text, textAlign: "center" };
const Col: React.FC<{ children: React.ReactNode; top?: number; gap?: number }> = ({ children, top = 260, gap = 24 }) => (
  <AbsoluteFill style={{ alignItems: "center", paddingTop: top, gap, flexDirection: "column", display: "flex" }}>{children}</AbsoluteFill>
);
type P = { start: number };
const W = (seg: number, w: string, start: number, nth = 0) => wordFrame(seg, w, nth) - start;

/* 0 — HOOK: real footage */
export const Hook: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const shot = W(0, "foto", start);
  const br = useSpring(4, theme.spring.snappy);
  return (
    <AbsoluteFill>
      <BlurBg src="vid/gancho.mp4" video />
      <Card src="vid/gancho.mp4" video top={190} h={1010} zoomFrom={1.04} zoomTo={1.14} panX={0} pos="48% 40%">
        <div style={{ position: "absolute", top: 36, left: 40, display: "flex", alignItems: "center", gap: 12, fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 36, color: "#fff", opacity: br }}>
          <div style={{ width: 26, height: 26, borderRadius: 13, background: theme.colors.accent, opacity: Math.floor(f / 12) % 2 ? 0.3 : 1 }} /> REC
        </div>
        {[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([dx, dy], i) => (
          <div key={i} style={{ position: "absolute", width: 90, height: 90, left: dx > 0 ? 28 : undefined, right: dx < 0 ? 28 : undefined, top: dy > 0 ? 90 : undefined, bottom: dy < 0 ? 28 : undefined,
            borderLeft: dx > 0 ? "6px solid #fff" : undefined, borderRight: dx < 0 ? "6px solid #fff" : undefined, borderTop: dy > 0 ? "6px solid #fff" : undefined, borderBottom: dy < 0 ? "6px solid #fff" : undefined,
            transform: `translate(${-dx * 40 * (1 - br)}px, ${-dy * 40 * (1 - br)}px)`, opacity: br * 0.9, borderRadius: 4 }} />
        ))}
      </Card>
      <Col top={1010} gap={0}>
        <Enter delay={W(0, "foge", start) - 3} cfg={theme.spring.snappy}><div style={{ ...H, fontSize: 140, textShadow: "0 10px 40px rgba(0,0,0,.9)" }}>VOCÊ FOGE</div></Enter>
        <Enter delay={W(0, "camera", start) - 3} cfg={theme.spring.bouncy}><div style={{ ...H, fontSize: 124, color: theme.colors.primary, textShadow: `0 0 50px ${theme.colors.glow}, 0 10px 40px rgba(0,0,0,.9)` }}>DA CÂMERA?</div></Enter>
      </Col>
      <Flash at={shot + 2} len={10} />
    </AbsoluteFill>
  );
};

/* 1 — PAIN */
export const Pain: React.FC<P> = ({ start }) => {
  const items: [string, number][] = [["Foto só de cima", W(1, "foto", start)], ["Mão no queixo", W(1, "mao", start)], ["Apaga metade das fotos", W(1, "apaga", start)], ["A papada aparece", W(1, "papada", start)]];
  return (
    <AbsoluteFill>
      <BlurBg src="img/triste.jpg" />
      <Card src="img/triste.jpg" top={150} h={730} pos="52% 40%" zoomFrom={1.0} zoomTo={1.12} panX={-15}>
        <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 34 }}>
          <Enter delay={4}><div style={{ ...H, fontSize: 78, textShadow: "0 8px 30px rgba(0,0,0,.9)" }}>TODO FIM DE ANO</div></Enter>
          <Enter delay={8}><div style={{ ...H, fontSize: 78, color: theme.colors.primary, textShadow: "0 8px 30px rgba(0,0,0,.9)" }}>É IGUAL:</div></Enter>
        </AbsoluteFill>
      </Card>
      <AbsoluteFill style={{ top: 915, alignItems: "center", display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map(([s, d], i) => (
          <Enter key={i} delay={d - 3} x={i % 2 ? 140 : -140} y={0} cfg={theme.spring.snappy}>
            <Breathe amt={0.008} speed={18 + i * 3}>
              <div style={{ display: "flex", alignItems: "center", gap: 22, width: 900, whiteSpace: "nowrap", boxSizing: "border-box", padding: "16px 28px", borderRadius: 26, background: "rgba(0,0,0,0.5)", border: `2px solid ${theme.colors.cardBorder}`, boxShadow: "0 24px 50px -20px rgba(0,0,0,.7)", fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 46, color: theme.colors.text }}>
                <Cross size={52} />{s}
              </div>
            </Breathe>
          </Enter>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 2 — TURN */
export const Turn: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const zoom = interpolate(f, [0, 120], [1, 1.06], { ...cl, easing: theme.ease.inOut });
  return (
    <AbsoluteFill>
      <BgMesh a={theme.colors.accent} b={theme.colors.primary} base="#3A0712" />
      <Bokeh count={18} />
      <Snow />
      <Col top={420} gap={6}>
        <div style={{ transform: `scale(${zoom})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <Enter delay={W(2, "esse", start) - 3}><div style={{ ...H, fontSize: 110 }}>E SE ESSE</div></Enter>
          <Enter delay={W(2, "natal", start) - 3} cfg={theme.spring.bouncy} from={0.5}><div style={{ ...H, fontSize: 250, color: theme.colors.primary, textShadow: `0 0 80px ${theme.colors.glow}, 0 0 160px rgba(245,184,61,.25)` }}>NATAL</div></Enter>
          <Enter delay={W(2, "diferente", start) - 4}><div style={{ ...H, fontSize: 96 }}>FOSSE DIFERENTE?</div></Enter>
          <div style={{ height: 50 }} />
          <Enter delay={W(2, "tempo", start) - 6} cfg={theme.spring.bouncy}><Pill bg={theme.colors.accent} color="#fff" size={64} rotate={-2}>E AINDA DÁ TEMPO!</Pill></Enter>
        </div>
      </Col>
    </AbsoluteFill>
  );
};

/* 3 — REVEAL + BENEFITS */
const Rays: React.FC<{ delay: number }> = ({ delay }) => {
  const f = useCurrentFrame();
  const s = useSpring(delay, theme.spring.bouncy);
  return (
    <div style={{ position: "absolute", left: 540, top: 600, transform: `rotate(${interpolate(s, [0, 1], [-120, 0]) + f * 0.25}deg) scale(${s})` }}>
      {Array.from({ length: 16 }).map((_, i) => {
        const p = useSpring(delay + i * 1.2, theme.spring.snappy);
        return <div key={i} style={{ position: "absolute", width: 14, height: 380 * p, left: -7, top: 0, background: `linear-gradient(${theme.colors.primary}, transparent)`, borderRadius: 10, transformOrigin: "50% 0%", transform: `rotate(${(360 / 16) * i}deg) translateY(150px)`, opacity: 0.55 }} />;
      })}
    </div>
  );
};
export const Reveal: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const logo = W(3, "metodo", start);
  const s4 = segStart(4) - start;
  const sp = useSpring(s4 - 4, theme.spring.smooth);
  const B: [string, string][] = [["Programa de 30 dias", "trinta"], ["Exercícios faciais guiados", "exercicios"], ["Só 10 minutos por dia", "dez"], ["Feito em casa", "feitos"], ["Sem agulha e sem cirurgia", "agulha"]];
  return (
    <AbsoluteFill>
      <BgMesh a="#4A0B1C" b={theme.colors.primary} />
      <AbsoluteFill style={{ opacity: interpolate(sp, [0, 1], [0, 1], cl) }}><BlurBg src="img/sofa.jpg" /></AbsoluteFill>
      <Snow count={50} />
      <div style={{ opacity: 1 - sp }}><Rays delay={logo + 4} /></div>
      <AbsoluteFill style={{ transform: `translateY(${-205 * sp}px) scale(${1 - 0.52 * sp})`, transformOrigin: "50% 300px" }}>
        <Col top={300} gap={0}>
          <Enter delay={2}><div style={{ ...H, fontSize: 64, fontWeight: 800, color: theme.colors.textDim }}>Conheça o</div></Enter>
          <Enter delay={logo - 2}><div style={{ ...H, fontSize: 120 }}>MÉTODO</div></Enter>
          <Enter delay={logo + 4} cfg={theme.spring.bouncy} from={0.3}>
            <Breathe amt={0.02}><div style={{ ...H, fontSize: 330, color: theme.colors.primary, textShadow: `0 0 70px ${theme.colors.glow}, 0 12px 0 #8A4B00`, marginTop: -30 }}>4D</div></Breathe>
          </Enter>
          <Enter delay={logo + 14}><Pill bg="#fff" color={theme.colors.ink} size={50}>para redução de papada</Pill></Enter>
        </Col>
      </AbsoluteFill>
      {f > s4 - 6 && <Card src="img/sofa.jpg" top={470} h={600} delay={s4} pos="58% 50%" zoomFrom={1.02} zoomTo={1.14} panX={-25} />}
      <AbsoluteFill style={{ top: 1095, alignItems: "center" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, width: 1000 }}>
          {B.map(([s, w], i) => (
            <Enter key={i} delay={W(4, w, start) - 3} y={30} from={0.7} cfg={theme.spring.bouncy}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 22px", borderRadius: 999, background: "rgba(0,0,0,0.6)", border: `2px solid ${theme.colors.cardBorder}`, fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 36, color: "#fff", whiteSpace: "nowrap" }}>
                <Check size={40} />{s}
              </div>
            </Enter>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 4 — PROFILE MORPH */
const AFTER = [[150,100],[300,40],[430,90],[470,230],[465,280],[522,362],[470,388],[482,420],[466,446],[480,472],[462,505],[478,560],[440,612],[380,628],[325,645],[315,760],[322,920],[130,920],[150,650],[100,450],[110,250]];
const BEFORE = [[150,100],[300,40],[430,90],[470,230],[465,280],[522,362],[470,388],[482,420],[466,446],[480,472],[462,505],[474,568],[458,642],[405,712],[345,735],[322,800],[330,920],[120,920],[140,650],[95,450],[105,250]];
const pathFrom = (pts: number[][], closed = true, from = 0, to = pts.length) => {
  const L = pts.length; let d = "";
  for (let i = from; i < (closed ? L : to - 1); i++) {
    const p0 = pts[(i - 1 + L) % L], p1 = pts[i], p2 = pts[(i + 1) % L], p3 = pts[(i + 2) % L];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    if (i === from) d += `M${p1[0]},${p1[1]} `;
    d += `C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]} `;
  }
  return d + (closed ? "Z" : "");
};
const Morph: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const a = 8, b = Math.round(dur * 0.55);
  let m = interpolate(f, [a, b], [0, 1], { ...cl, easing: theme.ease.inOut });
  let day = Math.max(1, Math.round(interpolate(f, [a, b], [1, 30], { ...cl, easing: Easing.bezier(0.45, 0, 0.55, 1) })));
  const flick = f > b + 12 ? Math.floor((f - b - 12) / 12) % 2 : 1;
  if (f > b + 12) { m = flick; day = flick ? 30 : 1; }
  const pts = AFTER.map((p, i) => [BEFORE[i][0] + (p[0] - BEFORE[i][0]) * m, BEFORE[i][1] + (p[1] - BEFORE[i][1]) * m]);
  const label = day <= 1 ? "ANTES" : day >= 30 ? "DEPOIS" : "EVOLUINDO";
  const lc = day <= 1 ? "#fff" : day >= 30 ? theme.colors.green : theme.colors.primary;
  const enter = useSpring(0, theme.spring.smooth);
  return (
    <AbsoluteFill>
      <BgMesh a="#0E2A4A" b={theme.colors.green} base="#07101E" />
      <Col top={230} gap={6}>
        <Enter delay={2}><div style={{ ...H, fontSize: 58, color: theme.colors.primary }}>30 DIAS DE MÉTODO 4D</div></Enter>
        <Enter delay={6}><div style={{ ...H, fontSize: 150, fontVariantNumeric: "tabular-nums" }}>DIA {day}</div></Enter>
        <div style={{ width: 760, height: 26, borderRadius: 13, background: "rgba(255,255,255,0.15)", overflow: "hidden", marginTop: 10 }}>
          <div style={{ width: `${(day / 30) * 100}%`, height: "100%", background: theme.colors.green, borderRadius: 13, boxShadow: `0 0 30px ${theme.colors.green}` }} />
        </div>
      </Col>
      <div style={{ position: "absolute", left: 290, top: 600, width: 480, transform: `translateY(${(1 - enter) * 80}px) scale(${0.9 + enter * 0.1})`, opacity: enter }}>
        <svg viewBox="0 0 600 940" width={480} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F6C7A8" /><stop offset="1" stopColor="#D9967A" /></linearGradient>
            <filter id="glow"><feGaussianBlur stdDeviation="10" /></filter>
          </defs>
          <path d={pathFrom(pts)} fill="none" stroke={m > 0.9 ? theme.colors.green : "#7FA7FF"} strokeWidth={24} filter="url(#glow)" opacity={0.8} />
          <path d={pathFrom(pts)} fill="url(#skin)" stroke="#fff" strokeWidth={5} />
          <path d={pathFrom(pts, false, 11, 16)} fill="none" stroke={theme.colors.green} strokeWidth={12} strokeLinecap="round" opacity={interpolate(m, [0.5, 1], [0, 1], cl)} />
        </svg>
      </div>
      <AbsoluteFill style={{ top: 1345, alignItems: "center" }}>
        <Pill bg={lc} color={theme.colors.ink} size={64}>{label}</Pill>
      </AbsoluteFill>
      <AbsoluteFill style={{ top: 1840, alignItems: "center" }}><div style={{ fontFamily: theme.fonts.display, fontWeight: 600, fontSize: 24, color: "rgba(255,255,255,.7)" }}>*Ilustração. Resultados variam de pessoa para pessoa.</div></AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Profile: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame(); const { durationInFrames: dur } = useVideoConfig();
  const cut = W(5, "contorno", start) - 4;
  const out = interpolate(f, [cut - 4, cut + 4], [1, 0], { ...cl, easing: theme.ease.in });
  return (
    <AbsoluteFill>
      {f < cut + 6 && (
        <AbsoluteFill style={{ opacity: out }}>
          <BlurBg src="img/banheiro.jpg" />
          <Card src="img/banheiro.jpg" top={170} h={1000} pos="50% 35%" zoomFrom={1.0} zoomTo={1.12} panX={20} />
          <Col top={1200} gap={10}>
            <Enter delay={W(5, "musculatura", start) - 3} cfg={theme.spring.bouncy}><Pill bg={theme.colors.primary} color={theme.colors.ink} size={62} glow>ROSTO + PESCOÇO</Pill></Enter>
          </Col>
        </AbsoluteFill>
      )}
      <Sequence from={cut}><Morph dur={dur - cut} /></Sequence>
    </AbsoluteFill>
  );
};

/* 5 — CALENDAR */
export const Calendar: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const t0 = W(6, "trinta", start) - 4;
  const end = W(6, "natal", start);
  const step = (end - t0) / 30;
  const star = useSpring(end - 2, theme.spring.bouncy);
  return (
    <AbsoluteFill>
      <BgMesh a="#0B5A33" b={theme.colors.primary} base="#04170E" />
      <Snow count={60} />
      <Col top={220} gap={8}>
        <Enter delay={2}><div style={{ ...H, fontSize: 112 }}>COMECE HOJE</div></Enter>
        <Enter delay={W(6, "completa", start) - 3}><div style={{ ...H, fontSize: 56, fontWeight: 800, color: theme.colors.textDim }}>e complete os 30 dias</div></Enter>
        <Enter delay={W(6, "antes", start) - 3} cfg={theme.spring.bouncy}><Pill bg={theme.colors.primary} color={theme.colors.ink} size={84} glow>ANTES DO NATAL</Pill></Enter>
      </Col>
      <div style={{ position: "absolute", top: 660, left: 105, display: "grid", gridTemplateColumns: "repeat(6, 130px)", gap: 14 }}>
        {Array.from({ length: 30 }).map((_, i) => {
          const d = t0 + i * step;
          const p = interpolate(f, [d, d + 6], [0, 1], { ...cl, easing: theme.ease.out });
          return (
            <div key={i} style={{ width: 130, height: 110, borderRadius: 22, background: p > 0.5 ? theme.colors.green : "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 40, color: "#fff", transform: `scale(${1 + Math.sin(p * Math.PI) * 0.15})` }}>
              {p > 0.5 ? <svg width="56" height="56" viewBox="0 0 40 40"><path d="M10 21l7 7 13-15" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg> : i + 1}
            </div>
          );
        })}
      </div>
      <AbsoluteFill style={{ top: 1305, alignItems: "center" }} data-x="star">
        <div style={{ transform: `scale(${star}) rotate(${(1 - star) * -20}deg)`, opacity: star }}>
          <Pill bg={theme.colors.accent} color="#fff" size={64}>NATAL: 25/12</Pill>
        </div>
      </AbsoluteFill>
      <Sequence from={W(6, "chega", start) - 4}><Confident start={start} /></Sequence>
    </AbsoluteFill>
  );
};

const Confident: React.FC<P> = ({ start }) => {
  const p = useSpring(0, theme.spring.smooth);
  return (
    <AbsoluteFill style={{ opacity: interpolate(p, [0, 0.4], [0, 1], cl) }}>
      <BlurBg src="img/confiante.jpg" />
      <Card src="img/confiante.jpg" top={170} h={1030} pos="50% 30%" zoomFrom={1.0} zoomTo={1.1} panX={0} />
      <Col top={1235} gap={10}>
        <Enter delay={6} cfg={theme.spring.bouncy}><Pill bg={theme.colors.primary} color={theme.colors.ink} size={56} glow>CONFIANÇA NA CEIA</Pill></Enter>
      </Col>
    </AbsoluteFill>
  );
};

/* 6 — OFFER */
export const Offer: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const box = useSpring(4, theme.spring.bouncy);
  const lid = useSpring(W(7, "condicao", start) - 4, theme.spring.bouncy);
  const urgent = W(7, "tempo", start);
  const pulse = 1 + Math.max(0, Math.sin((f - urgent) / 4)) * 0.06;
  return (
    <AbsoluteFill>
      <BgMesh a={theme.colors.accent} b={theme.colors.primary} base="#2A0610" />
      <Bokeh count={16} />
      <Snow count={70} />
      <Col top={220} gap={10}>
        <Enter delay={W(7, "entrar", start) - 3} cfg={theme.spring.bouncy}><div style={{ ...H, fontSize: 160 }}>OFERTA</div></Enter>
        <Enter delay={W(7, "especial", start) - 3}><Pill bg={theme.colors.primary} color={theme.colors.ink} size={74} glow>ESPECIAL DE NATAL</Pill></Enter>
      </Col>
      <div style={{ position: "absolute", left: 340, top: 760, width: 400, height: 420, transform: `scale(${box}) translateY(${Math.sin(f / 14) * 8}px)` }}>
        <div style={{ position: "absolute", left: 20, top: 140, width: 360, height: 280, borderRadius: 18, background: "linear-gradient(160deg,#1FA463,#0C6B3D)", boxShadow: "0 40px 80px -20px rgba(0,0,0,.6)" }} />
        <div style={{ position: "absolute", left: 175, top: 140, width: 50, height: 280, background: theme.colors.primary }} />
        <div style={{ position: "absolute", left: 0, top: 80 - lid * 90, width: 400, height: 80, borderRadius: 14, background: "linear-gradient(160deg,#27C278,#148A50)", transform: `rotate(${-lid * 14}deg)`, transformOrigin: "10% 100%" }}>
          <div style={{ position: "absolute", left: 175, top: 0, width: 50, height: 80, background: theme.colors.primary }} />
          <div style={{ position: "absolute", left: 105, top: -70, width: 90, height: 70, borderRadius: "50%", border: `16px solid ${theme.colors.primary}` }} />
          <div style={{ position: "absolute", left: 205, top: -70, width: 90, height: 70, borderRadius: "50%", border: `16px solid ${theme.colors.primary}` }} />
        </div>
        <div style={{ position: "absolute", left: 200, top: 140, width: 2, height: 2, boxShadow: `0 0 ${lid * 160}px ${lid * 70}px rgba(255,214,120,.55)` }} />
      </div>
      <AbsoluteFill style={{ top: 1260, alignItems: "center" }}>
        <Enter delay={urgent - 3} cfg={theme.spring.bouncy}>
          <div style={{ transform: `scale(${pulse})` }}><Pill bg="#000" color="#fff" size={60}>POR TEMPO LIMITADO</Pill></div>
        </Enter>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 7 — CTA */
export const CTA: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const btn = W(8, "toca", start);
  const glow = 0.6 + 0.4 * Math.sin(f / 8);
  return (
    <AbsoluteFill>
      <BlurBg src="vid/final.mp4" video rate={0.6} />
      <Col top={120} gap={4}>
        <Enter delay={4} cfg={theme.spring.bouncy}><div style={{ ...H, fontSize: 112, color: theme.colors.primary, textShadow: `0 0 60px ${theme.colors.glow}` }}>MÉTODO 4D</div></Enter>
        <Enter delay={9}><div style={{ ...H, fontSize: 50, fontWeight: 800 }}>seu rosto pronto pro Natal*</div></Enter>
      </Col>
      <Card src="vid/final.mp4" video rate={0.6} top={360} h={620} delay={2} zoomFrom={1.0} zoomTo={1.08} panX={0} />
      <AbsoluteFill style={{ top: 1020, alignItems: "center" }}>
        <Enter delay={btn - 3} cfg={theme.spring.bouncy} from={0.5}>
          <Breathe amt={0.035} speed={7}>
            <div style={{ background: theme.colors.primary, color: theme.colors.ink, fontFamily: theme.fonts.display, fontWeight: 900, fontSize: 64, padding: "34px 56px", borderRadius: 999, whiteSpace: "nowrap", boxShadow: `0 0 ${60 * glow}px ${theme.colors.glow}, 0 0 ${140 * glow}px rgba(245,184,61,.3)` }}>TOQUE EM SAIBA MAIS</div>
          </Breathe>
        </Enter>
      </AbsoluteFill>
      <AbsoluteFill style={{ top: 1205, alignItems: "center" }}>
        <Enter delay={W(8, "embaixo", start) - 3}>
          <svg width="120" height="170" viewBox="0 0 160 230" style={{ transform: `translateY(${Math.abs(Math.sin(f / 7)) * 24}px)` }}>
            {[0, 1, 2].map((k) => <path key={k} d={`M20 ${30 + k * 65} L80 ${85 + k * 65} L140 ${30 + k * 65}`} stroke="#fff" strokeWidth="18" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.4 + k * 0.3} />)}
          </svg>
        </Enter>
      </AbsoluteFill>
      <AbsoluteFill style={{ top: 1840, alignItems: "center" }}><div style={{ fontFamily: theme.fonts.display, fontWeight: 600, fontSize: 24, color: "rgba(255,255,255,.75)" }}>*Resultados variam de pessoa para pessoa. Imagens ilustrativas geradas por IA.</div></AbsoluteFill>
    </AbsoluteFill>
  );
};
