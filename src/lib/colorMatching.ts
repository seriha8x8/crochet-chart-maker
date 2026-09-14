export type HSL = { h: number; s: number; l: number };

export type BaseColor = { id: string; label: string; h: number; s: number; l: number };

export type SelectedColor = { id: string; label: string; h: number; s: number; l: number; hex?: string };

export type ColorScheme = "analogous" | "triadic" | "monochrome" | "complementary";

export type Mood = {
  id: string;
  label: string;
  scheme: ColorScheme;
  satRange: [number, number];
  lightRange: [number, number];
  hueSpread?: number;
  hueBias?: number;
  biasStrength?: number;
  neutralAnchorHue?: number;
};

export const BASE_COLORS: BaseColor[] = [
  { id: "red", label: "赤", h: 355, s: 62, l: 54 },
  { id: "orange", label: "オレンジ", h: 25, s: 78, l: 60 },
  { id: "yellow", label: "黄", h: 48, s: 72, l: 63 },
  { id: "yellowgreen", label: "黄緑", h: 78, s: 42, l: 53 },
  { id: "green", label: "緑", h: 140, s: 38, l: 42 },
  { id: "bluegreen", label: "青緑", h: 174, s: 40, l: 42 },
  { id: "blue", label: "青", h: 210, s: 50, l: 48 },
  { id: "purple", label: "紫", h: 268, s: 32, l: 46 },
  { id: "pink", label: "ピンク", h: 335, s: 55, l: 72 },
  { id: "beige", label: "ベージュ", h: 35, s: 32, l: 76 },
  { id: "brown", label: "茶", h: 25, s: 35, l: 35 },
  { id: "white", label: "白", h: 40, s: 12, l: 95 },
  { id: "gray", label: "グレー", h: 220, s: 8, l: 66 },
  { id: "black", label: "黒", h: 220, s: 10, l: 16 },
];

export const MOODS: Mood[] = [
  {
    id: "elegant",
    label: "エレガント",
    scheme: "analogous",
    hueSpread: 22,
    satRange: [20, 35],
    lightRange: [55, 75],
    hueBias: 305,
    biasStrength: 0.45,
    neutralAnchorHue: 300,
  },
  { id: "casual", label: "ポップ", scheme: "triadic", satRange: [65, 90], lightRange: [50, 65], neutralAnchorHue: 45 },
  { id: "chic", label: "シック", scheme: "monochrome", satRange: [15, 30], lightRange: [16, 48], neutralAnchorHue: 25 },
  {
    id: "clear",
    label: "クリア",
    scheme: "analogous",
    hueSpread: 20,
    satRange: [20, 40],
    lightRange: [65, 85],
    hueBias: 190,
    biasStrength: 0.45,
    neutralAnchorHue: 190,
  },
  {
    id: "natural",
    label: "ナチュラル",
    scheme: "analogous",
    hueSpread: 25,
    satRange: [25, 45],
    lightRange: [48, 70],
    neutralAnchorHue: 35,
  },
  {
    id: "modern",
    label: "モダン",
    scheme: "monochrome",
    satRange: [8, 22],
    lightRange: [15, 90],
    hueBias: 215,
    biasStrength: 0.5,
    neutralAnchorHue: 215,
  },
  {
    id: "romantic",
    label: "ロマンティック",
    scheme: "analogous",
    hueSpread: 18,
    satRange: [30, 50],
    lightRange: [78, 92],
    hueBias: 345,
    biasStrength: 0.35,
    neutralAnchorHue: 340,
  },
  {
    id: "retro",
    label: "レトロ",
    scheme: "analogous",
    hueSpread: 28,
    satRange: [30, 50],
    lightRange: [35, 55],
    hueBias: 30,
    biasStrength: 0.4,
    neutralAnchorHue: 30,
  },
];

export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function hexToHsl(hex: string): HSL {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function circularLerp(h1: number, h2: number, t: number): number {
  const diff = (((h2 - h1 + 540) % 360) - 180);
  return (((h1 + diff * t) % 360) + 360) % 360;
}

/** From a base color and a mood, derive 4 related colors (A/B/C/D) matching that mood's
 *  color scheme (analogous / triadic / monochrome). Ported as-is from the reference tool. */
export function genPalette(baseColor: HSL, mood: Mood): [HSL, HSL, HSL, HSL] {
  const satMid = (mood.satRange[0] + mood.satRange[1]) / 2;
  const lightMid = (mood.lightRange[0] + mood.lightRange[1]) / 2;
  const lightLow = mood.lightRange[0];
  const lightHigh = mood.lightRange[1];
  const isNeutral = baseColor.s < 18;

  let baseHue = isNeutral && mood.neutralAnchorHue !== undefined ? mood.neutralAnchorHue : baseColor.h;
  if (!isNeutral && mood.hueBias !== undefined) {
    baseHue = circularLerp(baseHue, mood.hueBias, mood.biasStrength !== undefined ? mood.biasStrength : 0.4);
  }

  if (mood.scheme === "monochrome") {
    return [
      { h: baseHue, s: satMid, l: lightLow },
      { h: baseHue, s: satMid - 8, l: lightHigh },
      { h: baseHue, s: satMid + 6, l: lightMid - 6 },
      { h: baseHue, s: satMid - 4, l: lightMid + 8 },
    ];
  }

  let offsets: number[];
  if (mood.scheme === "analogous") {
    const sp = mood.hueSpread || 25;
    offsets = [sp, -sp * 0.8, sp * 1.7, -sp * 1.5];
  } else if (mood.scheme === "triadic") {
    offsets = [120, 240, 90, 270];
  } else {
    offsets = [180, 150, 210, 30];
  }
  const sMods = [0, -6, 5, -3];
  const lMods = [5, -6, 8, -8];
  return offsets.map((off, i) => ({
    h: baseHue + off,
    s: satMid + sMods[i],
    l: lightMid + lMods[i],
  })) as [HSL, HSL, HSL, HSL];
}
