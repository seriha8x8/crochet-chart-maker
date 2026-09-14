/** Standard color categories for 毛糸 (yarn) — multi-select, since a single skein can span
 *  several colors (段染め / gradient-dyed yarn). */
export const YARN_COLORS = [
  "白",
  "生成り",
  "ベージュ",
  "黄",
  "オレンジ",
  "赤",
  "ピンク",
  "紫",
  "青",
  "水色",
  "緑",
  "茶",
  "グレー",
  "黒",
  "ミックス・段染め",
  "その他",
] as const;

/** Standard yarn materials — multi-select, for blended yarns (e.g. wool + acrylic). */
export const YARN_MATERIALS = [
  "ウール",
  "コットン",
  "アクリル",
  "麻・リネン",
  "シルク",
  "モヘア",
  "アルパカ",
  "カシミヤ",
  "ポリエステル",
  "ナイロン",
  "混紡",
  "その他",
] as const;

export interface ThicknessOption {
  value: string;
  label: string;
}

/** 棒針 (straight/circular knitting needle) sizes: 号数 → mm, matching the standard JIS
 *  size chart. Sizes beyond 15号 only have an mm rating, no 号 number. */
export const KNITTING_NEEDLE_SIZES: ThicknessOption[] = [
  { value: "knit-3.0", label: "3mm(3号)" },
  { value: "knit-3.3", label: "3.3mm(4号)" },
  { value: "knit-3.6", label: "3.6mm(5号)" },
  { value: "knit-3.9", label: "3.9mm(6号)" },
  { value: "knit-4.2", label: "4.2mm(7号)" },
  { value: "knit-4.5", label: "4.5mm(8号)" },
  { value: "knit-4.8", label: "4.8mm(9号)" },
  { value: "knit-5.1", label: "5.1mm(10号)" },
  { value: "knit-5.4", label: "5.4mm(11号)" },
  { value: "knit-5.7", label: "5.7mm(12号)" },
  { value: "knit-6.0", label: "6mm(13号)" },
  { value: "knit-6.3", label: "6.3mm(14号)" },
  { value: "knit-6.6", label: "6.6mm(15号)" },
  { value: "knit-7", label: "7mm" },
  { value: "knit-8", label: "8mm" },
  { value: "knit-9", label: "9mm" },
  { value: "knit-10", label: "10mm" },
  { value: "knit-11", label: "11mm" },
  { value: "knit-12", label: "12mm" },
  { value: "knit-15", label: "15mm" },
];

/** かぎ針 (crochet hook) sizes: 号数 → mm. Sizes beyond 10/0号 only have an mm rating. */
export const CROCHET_HOOK_SIZES: ThicknessOption[] = [
  { value: "crochet-2.0", label: "2.0mm(2/0号)" },
  { value: "crochet-2.3", label: "2.3mm(3/0号)" },
  { value: "crochet-2.5", label: "2.5mm(4/0号)" },
  { value: "crochet-3.0", label: "3.0mm(5/0号)" },
  { value: "crochet-3.5", label: "3.5mm(6/0号)" },
  { value: "crochet-4.0", label: "4.0mm(7/0号)" },
  { value: "crochet-4.5", label: "4.5mm(7.5/0号)" },
  { value: "crochet-5.0", label: "5.0mm(8/0号)" },
  { value: "crochet-5.5", label: "5.5mm(9/0号)" },
  { value: "crochet-6.0", label: "6.0mm(10/0号)" },
  { value: "crochet-7", label: "7mm" },
  { value: "crochet-8", label: "8mm" },
  { value: "crochet-10", label: "10mm" },
  { value: "crochet-12", label: "12mm" },
  { value: "crochet-15", label: "15mm" },
  { value: "crochet-20", label: "20mm" },
];

const THICKNESS_LABEL_BY_VALUE = new Map(
  [...KNITTING_NEEDLE_SIZES, ...CROCHET_HOOK_SIZES].map((o) => [o.value, o.label]),
);

/** Old free-text values (from before this became a fixed option list) won't match any
 *  known value/label — fall back to showing the raw stored string rather than hiding it. */
export function thicknessLabel(value: string): string {
  return THICKNESS_LABEL_BY_VALUE.get(value) ?? value;
}
