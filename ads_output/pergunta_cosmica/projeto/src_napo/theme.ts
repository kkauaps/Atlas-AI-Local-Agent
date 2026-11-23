import { Easing } from "remotion";
export const theme = {
  colors: {
    bg: "#0B1024", bgAlt: "#141B3A", primary: "#E3B341", accent: "#C0392B", green: "#16A34A",
    text: "#FBF7EE", textDim: "#D9CFB8", ink: "#14100A", glow: "rgba(227,179,65,0.45)",
    card: "rgba(255,255,255,0.07)", cardBorder: "rgba(255,255,255,0.16)",
    land: "#E7DCC2", landEdge: "#8B7651", sea: "#1A2A55", empire: "#2B4BA8", red: "#C0392B",
  },
  fonts: { display: "Montserrat", serif: "Playfair Display" },
  ease: { out: Easing.bezier(0.16, 1, 0.3, 1), inOut: Easing.bezier(0.83, 0, 0.17, 1), in: Easing.bezier(0.7, 0, 0.84, 0) },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
  },
  voOffset: 0.3, tail: 1.6,
} as const;
