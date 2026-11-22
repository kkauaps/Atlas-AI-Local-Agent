import { WORDS, SEGS, VOICE_END } from "./timing";
import { theme } from "./theme";
export const FPS = 30;
export const sec = (s: number) => Math.round(s * FPS);
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
// absolute frame where a word (first match within a segment) starts being spoken
export const wordFrame = (seg: number, w: string, nth = 0) => {
  const list = WORDS.filter((x) => x.seg === seg && norm(x.w) === norm(w));
  const hit = list[nth] ?? list[0];
  if (!hit) throw new Error(`word not found: ${seg} ${w}`);
  return sec(hit.s + theme.voOffset);
};
export const segStart = (i: number) => sec(SEGS[i].start + theme.voOffset);
// scene i covers voice segments; cuts land 6 frames before the first word
export const SCENE_SEGS = [0, 1, 2, 3, 5, 6, 7, 8];
export const TOTAL = sec(VOICE_END + theme.voOffset + theme.tail);
export const CUTS = [0, ...SCENE_SEGS.slice(1).map((s) => segStart(s) - 6), TOTAL];
