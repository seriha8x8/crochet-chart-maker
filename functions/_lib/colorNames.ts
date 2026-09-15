/** A curated set of Japanese color names common in yarn/fashion shopping, each with a
 *  representative hex. A generated palette color (from 配色マッチング) is matched to
 *  whichever of these is nearest in RGB space, and that name — never the raw hex — is
 *  what gets used to build the Rakuten search keyword ("○○ 毛糸"). Not shown to the user. */
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

/** Nearest named color to `hex` by plain Euclidean RGB distance — good enough for a
 *  fuzzy "what should we search for" mapping, no need for perceptual color science here. */
export function nearestColorName(hex: string): string {
  const target = hexToRgb(hex);
  let best = NAMED_COLORS[0];
  let bestDist = Infinity;
  for (const candidate of NAMED_COLORS) {
    const rgb = hexToRgb(candidate.hex);
    const dist = (rgb.r - target.r) ** 2 + (rgb.g - target.g) ** 2 + (rgb.b - target.b) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }
  return best.name;
}
