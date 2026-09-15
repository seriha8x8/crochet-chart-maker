/** A curated set of Japanese color names common in yarn/fashion shopping, each with a
 *  representative hex. A generated palette color (from 配色マッチング) is matched to
 *  whichever of these is nearest (see nearestColorName below), and that name — never the
 *  raw hex — is what gets used to build the Rakuten search keyword ("○○ 毛糸"). Not shown
 *  to the user.
 *
 *  The "くすみ" (dusty/muted) entries below still sit at ~30-40% saturation — real muted
 *  tones, just not desaturated ones. A palette color that's genuinely low-saturation
 *  (roughly 8-20%) but still has a discernible hue has no close match at that saturation
 *  level, so it loses on distance to a plain gray (which sits at 0% saturation and can be
 *  closer in the saturation/hue plane than any of the more saturated named colors are) even
 *  though a human would call it a muted/grayish version of that hue, not gray. The
 *  "グレイッシュ/アッシュ/ローズ/セージグレー" entries fill that specific gap — don't
 *  remove them without covering the same low-saturation band some other way. */
const NAMED_COLORS: { name: string; hex: string }[] = [
  { name: "オフホワイト", hex: "#F5F1E8" },
  { name: "生成り", hex: "#EDE4D3" },
  { name: "ベージュ", hex: "#D8C3A5" },
  { name: "キャメル", hex: "#C19A6B" },
  { name: "ブラウン", hex: "#7B4B2A" },
  { name: "チョコレートブラウン", hex: "#4B2E1E" },
  { name: "テラコッタ", hex: "#CC6B49" },
  { name: "レンガ色", hex: "#9E4B3A" },
  { name: "コーラルピンク", hex: "#F08080" },
  { name: "くすみピンク", hex: "#D8A7A0" },
  { name: "ピンク", hex: "#F4A6C0" },
  { name: "ワインレッド", hex: "#722F37" },
  { name: "レッド", hex: "#D6524A" },
  { name: "オレンジ", hex: "#EF9448" },
  { name: "マスタードイエロー", hex: "#C9A227" },
  { name: "イエロー", hex: "#F2CB4E" },
  { name: "レモンイエロー", hex: "#F7E463" },
  { name: "オリーブ", hex: "#6B6B2A" },
  { name: "カーキ", hex: "#8A8360" },
  { name: "抹茶グリーン", hex: "#8AA05E" },
  { name: "グリーン", hex: "#6EA96E" },
  { name: "エメラルドグリーン", hex: "#2FA88A" },
  { name: "モスグリーン", hex: "#5C6E4A" },
  { name: "ミントグリーン", hex: "#98DBC6" },
  { name: "ターコイズ", hex: "#5BC8AC" },
  { name: "サックスブルー", hex: "#7BAEDC" },
  { name: "くすみブルー", hex: "#8FA9C0" },
  { name: "ネイビー", hex: "#233A5E" },
  { name: "ブルー", hex: "#4A7FC4" },
  { name: "水色", hex: "#8FCFEA" },
  { name: "ラベンダー", hex: "#B497D6" },
  { name: "パープル", hex: "#9A72B8" },
  { name: "モーブ", hex: "#9C7B8B" },
  { name: "グレイッシュラベンダー", hex: "#A79BB5" },
  { name: "アッシュブルー", hex: "#9CACC0" },
  { name: "ローズグレー", hex: "#BFA8A5" },
  { name: "セージグレー", hex: "#A8B0A0" },
  { name: "ライトグレー", hex: "#D6D6D6" },
  { name: "グレー", hex: "#8A8A8A" },
  { name: "チャコールグレー", hex: "#4A4A4A" },
  { name: "ブラック", hex: "#1F1F1F" },
  { name: "シルバー", hex: "#C7C7C7" },
  { name: "ゴールド", hex: "#C9A63C" },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return { h: 0, s: 0, l };
  const s = delta / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
  else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
  else h = 60 * ((rn - gn) / delta + 4);
  if (h < 0) h += 360;
  return { h, s, l };
}

/** Projects HSL onto a cylinder — saturation as radius, hue as angle, lightness as height —
 *  so distance naturally wraps hue (0°/360° are adjacent) and, crucially, treats saturation
 *  as a real axis. Plain RGB Euclidean distance pulled pale, low-saturation colors (e.g. a
 *  soft lavender like #D6BDDB) toward gray/silver just because their R/G/B channels happen
 *  to sit numerically close together, even though they read as clearly purple to the eye —
 *  a saturated and a desaturated color at the same hue can still be adjacent in raw RGB. */
function hslToCylinder(h: number, s: number, l: number): { x: number; y: number; z: number } {
  const rad = (h * Math.PI) / 180;
  return { x: s * Math.cos(rad), y: s * Math.sin(rad), z: l };
}

/** Nearest named color to `hex`, compared in the cylinder above — good enough for a fuzzy
 *  "what should we search for" mapping, no need for full perceptual color science here. */
export function nearestColorName(hex: string): string {
  const targetRgb = hexToRgb(hex);
  const targetHsl = rgbToHsl(targetRgb.r, targetRgb.g, targetRgb.b);
  const target = hslToCylinder(targetHsl.h, targetHsl.s, targetHsl.l);

  let best = NAMED_COLORS[0];
  let bestDist = Infinity;
  for (const candidate of NAMED_COLORS) {
    const rgb = hexToRgb(candidate.hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const point = hslToCylinder(hsl.h, hsl.s, hsl.l);
    const dist = (point.x - target.x) ** 2 + (point.y - target.y) ** 2 + (point.z - target.z) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }
  return best.name;
}
