import { Easing } from "remotion";
export const theme = {
  colors: {
    bg: "#03040A", bgAlt: "#0B1022", primary: "#FBBF24", accent: "#A78BFA", green: "#38BDF8",
    text: "#F8FAFC", textDim: "#CBD5E1", ink: "#0B0B12", glow: "rgba(251,191,36,0.45)", ice: "#7DD3FC",
    card: "rgba(255,255,255,0.08)", cardBorder: "rgba(255,255,255,0.16)",
  },
  fonts: { display: "Montserrat" },
  ease: { out: Easing.bezier(0.16, 1, 0.3, 1), inOut: Easing.bezier(0.83, 0, 0.17, 1), in: Easing.bezier(0.7, 0, 0.84, 0) },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
  },
  voOffset: 0.3, tail: 1.6,
} as const;
