import { Easing } from "remotion";
export const theme = {
  colors: {
    bg: "#12050A", bgAlt: "#2A0A14", primary: "#F5B83D", accent: "#E11D48",
    green: "#22C55E", text: "#FFF7ED", textDim: "#E7D3D8", ink: "#14060B",
    glow: "rgba(245,184,61,0.45)", card: "rgba(255,255,255,0.08)", cardBorder: "rgba(255,255,255,0.14)",
  },
  fonts: { display: "Montserrat" },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.83, 0, 0.17, 1),
    in: Easing.bezier(0.7, 0, 0.84, 0),
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
  },
  voOffset: 0.3, tail: 2.6,
} as const;
