import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { theme } from "./theme";
import { MAP } from "./mapdata";
import { cl } from "./cl";

/* Napoleon figure (stylized) */
export const Napo: React.FC<{ h: number; mode?: "color" | "shadow" | "grey"; crown?: number; breathe?: boolean }> = ({ h, mode = "color", crown = -1, breathe = true }) => {
  const f = useCurrentFrame();
  const dark = mode === "shadow" ? "#0b0b10" : mode === "grey" ? "#6b7280" : "#1E2F6B";
  const light = mode === "color" ? "#F5EFE0" : dark;
  const gold = mode === "color" ? theme.colors.primary : dark;
  const skin = mode === "color" ? "#E8C3A0" : dark;
  const hat = mode === "color" ? "#111114" : dark;
  const b = breathe ? Math.sin(f / 18) * 1.2 : 0;
  return (
    <svg width={h * 0.5} height={h} viewBox="0 0 200 400" style={{ overflow: "visible" }}>
      <ellipse cx="100" cy="392" rx="70" ry="8" fill="rgba(0,0,0,.35)" />
      <g transform={`translate(0 ${b * 0.3})`}>
        {/* legs */}
        <rect x="74" y="232" width="24" height="76" rx="6" fill={light} />
        <rect x="102" y="232" width="24" height="76" rx="6" fill={light} />
        <path d="M70 300 h30 v86 q-2 6 -14 6 h-18 q-4 0 -2 -10Z" fill={hat} />
        <path d="M100 300 h30 v80 q2 10 -2 10 h-18 q-12 0 -10 -6Z" fill={hat} />
        {/* coat */}
        <path d={`M60 114 L140 114 L152 236 Q146 270 130 300 L118 240 L82 240 L70 300 Q54 270 48 236Z`} fill={dark} />
        <path d="M90 114 L110 114 L114 238 L86 238Z" fill={light} />
        <rect x="84" y="196" width="32" height="10" fill={gold} opacity={0.9} />
        {/* arms */}
        <path d={`M62 122 Q38 ${180 + b} 56 ${246 + b}`} stroke={dark} strokeWidth="22" fill="none" strokeLinecap="round" />
        <path d={`M138 122 Q170 158 116 ${168 + b}`} stroke={dark} strokeWidth="22" fill="none" strokeLinecap="round" />
        <ellipse cx="60" cy="118" rx="18" ry="8" fill={gold} />
        <ellipse cx="140" cy="118" rx="18" ry="8" fill={gold} />
        {/* collar + head */}
        <rect x="86" y="98" width="28" height="18" rx="4" fill={dark} />
        <ellipse cx="100" cy="76" rx="23" ry="27" fill={skin} />
        {/* bicorne */}
        <path d="M24 58 Q100 -8 176 58 Q100 40 24 58Z" fill={hat} />
        <circle cx="128" cy="40" r="7" fill={mode === "color" ? "#2B4BA8" : dark} />
        <circle cx="128" cy="40" r="4.5" fill={mode === "color" ? "#fff" : dark} />
        <circle cx="128" cy="40" r="2" fill={mode === "color" ? "#C0392B" : dark} />
      </g>
      {crown >= 0 && (
        <g transform={`translate(0 ${-120 * (1 - crown)})`} opacity={Math.min(1, crown * 2)}>
          <path d="M68 6 L76 -24 L88 -6 L100 -30 L112 -6 L124 -24 L132 6Z" fill={theme.colors.primary} stroke="#8a6416" strokeWidth="2" />
          <circle cx="100" cy="-30" r="5" fill="#C0392B" /><circle cx="76" cy="-24" r="4" fill="#2B4BA8" /><circle cx="124" cy="-24" r="4" fill="#2B4BA8" />
        </g>
      )}
    </svg>
  );
};

/* Map */
type K = "eu" | "at";
export const MapSvg: React.FC<{ k: K; width: number; fills?: Record<string, [string, number]>; children?: React.ReactNode; zoom?: number; origin?: [number, number] }> = ({ k, width, fills = {}, children, zoom = 1, origin = [500, 400] }) => {
  const m = MAP[k] as any; const h = m.h as number;
  return (
    <svg width={width} height={(width * h) / 1000} viewBox={`0 0 1000 ${h}`} style={{ display: "block" }}>
      <defs>
        <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 10 L10 0" stroke="rgba(255,255,255,.05)" strokeWidth="2" /></pattern>
      </defs>
      <rect width="1000" height={h} fill={theme.colors.sea} />
      <rect width="1000" height={h} fill="url(#hatch)" />
      <g transform={`translate(${origin[0]} ${origin[1]}) scale(${zoom}) translate(${-origin[0]} ${-origin[1]})`}>
        {Object.entries(m.paths as Record<string, string>).map(([c, d]) => (
          <g key={c}>
            <path d={d} fill={theme.colors.land} stroke={theme.colors.landEdge} strokeWidth={1.2 / zoom} />
            {fills[c] && fills[c][1] > 0.005 && <path d={d} fill={fills[c][0]} opacity={fills[c][1]} stroke={theme.colors.landEdge} strokeWidth={1.2 / zoom} />}
          </g>
        ))}
        {children}
      </g>
    </svg>
  );
};
export const pt = (n: keyof typeof MAP.pts) => MAP.pts[n] as unknown as [number, number];

export const Arrow: React.FC<{ a: [number, number]; b: [number, number]; p: number; color?: string; w?: number; bend?: number; dash?: boolean }> = ({ a, b, p, color = theme.colors.red, w = 9, bend = 0.25, dash }) => {
  const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend, my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
  const d = `M${a[0]} ${a[1]} Q${mx} ${my} ${b[0]} ${b[1]}`;
  const tx = b[0] - mx, ty = b[1] - my, L = Math.hypot(tx, ty) || 1, ux = tx / L, uy = ty / L;
  return (
    <g>
      <path d={d} pathLength={1} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeDasharray={`${p} 1`} />
      {p > 0.97 && <path d={`M${b[0]} ${b[1]} L${b[0] - ux * 26 - uy * 16} ${b[1] - uy * 26 + ux * 16} L${b[0] - ux * 26 + uy * 16} ${b[1] - uy * 26 - ux * 16}Z`} fill={color} />}
    </g>
  );
};
export const bez = (a: [number, number], b: [number, number], bend: number, t: number): [number, number] => {
  const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend, my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
  const u = 1 - t; return [u * u * a[0] + 2 * u * t * mx + t * t * b[0], u * u * a[1] + 2 * u * t * my + t * t * b[1]];
};
export const Pin: React.FC<{ at: [number, number]; label?: string; color?: string; p: number; dx?: number; dy?: number; size?: number; zoom?: number }> = ({ at, label, color = theme.colors.primary, p, dx = 22, dy = -26, size = 30, zoom = 1 }) => {
  const f = useCurrentFrame();
  if (p <= 0.01) return null;
  const s = 1 / zoom; const pul = (f % 36) / 36;
  const w = (label?.length ?? 0) * size * 0.62 + 24;
  return (
    <g transform={`translate(${at[0]} ${at[1]}) scale(${s})`} opacity={Math.min(1, p * 1.5)}>
      <circle r={12 + 26 * pul} fill="none" stroke={color} strokeWidth={4} opacity={1 - pul} />
      <circle r={11 * p} fill={color} stroke="#fff" strokeWidth={3} />
      {label && (
        <g transform={`translate(${dx} ${dy}) scale(${0.7 + 0.3 * p})`}>
          <rect x={dx < 0 ? -w : 0} y={-size * 0.85} width={w} height={size * 1.3} rx={10} fill={color} />
          <text x={dx < 0 ? -w + 12 : 12} y={size * 0.25} fontFamily="Montserrat" fontWeight={900} fontSize={size} fill={theme.colors.ink}>{label}</text>
        </g>
      )}
    </g>
  );
};
export const Ship: React.FC<{ at: [number, number]; ang: number; s?: number }> = ({ at, ang, s = 1 }) => {
  const f = useCurrentFrame();
  return (
    <g transform={`translate(${at[0]} ${at[1]}) rotate(${ang * 0 + Math.sin(f / 6) * 4}) scale(${s})`}>
      <path d="M-26 6 L26 6 L18 18 L-18 18Z" fill="#5b3a1e" />
      <path d="M-2 6 L-2 -34" stroke="#3b2612" strokeWidth="3" />
      <path d="M0 -32 Q22 -16 0 0Z" fill="#F5EFE0" />
      <path d="M-4 -30 Q-24 -14 -4 2Z" fill="#E9E2D0" />
      <path d="M-2 -34 L12 -38 L-2 -42Z" fill="#16A34A" />
    </g>
  );
};
