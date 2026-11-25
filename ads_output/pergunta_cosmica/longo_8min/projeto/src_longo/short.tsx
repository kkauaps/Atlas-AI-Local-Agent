import React from "react";
import { AbsoluteFill, OffthreadVideo, Audio, staticFile, useCurrentFrame, interpolate, Sequence, Img } from "remotion";
import { theme, FPS } from "./theme";
import { useFonts } from "./core";
import { cl } from "./cl";
const S: React.CSSProperties = { fontFamily: theme.fonts.display, fontWeight: 900, color: "#fff", textAlign: "center", letterSpacing: "-0.02em" };
// skip the 3.4s countdown sting: start the clip right before narration
export const SKIP = 3.3;
export const shortDur = (clipSec: number) => Math.round((clipSec - SKIP + 3.2) * FPS);
export const Short: React.FC<{ clip: string; n: number; hook: string; hook2: string; clipSec: number }> = ({ clip, n, hook, hook2, clipSec }) => {
  useFonts();
  const f = useCurrentFrame();
  const mainEnd = Math.round((clipSec - SKIP) * FPS);
  const endP = interpolate(f, [mainEnd - 6, mainEnd + 10], [0, 1], cl);
  const hookP = interpolate(f, [0, 12], [0, 1], cl);
  return (
    <AbsoluteFill style={{ background: "#03040A" }}>
      <AbsoluteFill style={{ filter: "blur(40px) brightness(0.45)", transform: "scale(1.25)" }}>
        <OffthreadVideo src={staticFile(clip)} startFrom={Math.round(SKIP * FPS)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: 640, width: 1080, height: 608, boxShadow: "0 30px 80px rgba(0,0,0,.7)", opacity: 1 - endP }}>
        <OffthreadVideo src={staticFile(clip)} startFrom={Math.round(SKIP * FPS)} style={{ width: 1080, height: 608 }} />
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 250, opacity: hookP, transform: `translateY(${(1 - hookP) * 30}px)` }}>
        <div style={{ ...S, fontSize: 40, color: theme.colors.primary }}>COISAS QUE PARECEM MENTIRA · #{n}</div>
        <div style={{ ...S, fontSize: 78, lineHeight: 1.02, marginTop: 14, textShadow: "0 8px 30px rgba(0,0,0,.8)" }}>{hook}</div>
        <div style={{ ...S, fontSize: 78, lineHeight: 1.02, color: theme.colors.primary, textShadow: "0 8px 30px rgba(0,0,0,.8)" }}>{hook2}</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1340, display: "flex", justifyContent: "center", opacity: 1 - endP }}>
        <div style={{ ...S, fontSize: 34, padding: "14px 30px", borderRadius: 18, background: "rgba(0,0,0,.5)", border: "2px solid rgba(255,255,255,.2)" }}>📺 VÍDEO COMPLETO NO CANAL</div>
      </div>
      {endP > 0 && <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", display: "flex", flexDirection: "column", gap: 34, opacity: endP }}>
        <div style={{ width: 300, height: 300, borderRadius: "50%", overflow: "hidden", border: `6px solid ${theme.colors.primary}`, boxShadow: `0 0 80px ${theme.colors.glow}` }}><Img src={staticFile("longo/logo.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
        <div style={{ ...S, fontSize: 72 }}>PERGUNTA CÓSMICA</div>
        <div style={{ ...S, fontSize: 46, color: theme.colors.primary }}>AS 8 COISAS COMPLETAS<br />NO VÍDEO DO CANAL 👆</div>
      </AbsoluteFill>}
      <Sequence from={0}><Audio src={staticFile("longo/music_long.wav")} volume={(fr) => interpolate(fr, [0, 15, mainEnd, mainEnd + 20, mainEnd + 90], [0, 0.09, 0.09, 0.28, 0], cl)} /></Sequence>
    </AbsoluteFill>
  );
};
