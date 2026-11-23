import { WORDS, SEGS, VOICE_END } from "./timing";
import { theme } from "./theme";
export const FPS = 30;
export const sec = (s: number) => Math.round(s * FPS);
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
export const wordT = (seg: number, w: string, nth = 0) => {
  const list = WORDS.filter((x) => x.seg === seg && norm(x.w) === norm(w));
  const hit = list[nth] ?? list[0];
  if (!hit) throw new Error(`word not found: ${seg} ${w}`);
  return hit.s + theme.voOffset;
};
export const wordFrame = (seg: number, w: string, nth = 0) => sec(wordT(seg, w, nth));
export const segT = (i: number) => SEGS[i].start + theme.voOffset;
export const segStart = (i: number) => sec(segT(i));
export const TOTAL = sec(VOICE_END + theme.voOffset + theme.tail);
