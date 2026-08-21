import type { SymbolType } from "@/types/chart";

export interface SymbolDef {
  type: SymbolType;
  label: string;
  shortLabel: string;
  /** distance from foot (0,0) to head (0,-height) in local units, pointing up */
  height: number;
  /** approximate visual width, used for palette preview / hit padding */
  width: number;
}

export const DEFAULT_SYMBOL_COLOR = "#2a211d";

export const SYMBOL_ORDER: SymbolType[] = [
  "ring",
  "chain",
  "slipStitch",
  "singleCrochet",
  "halfDouble",
  "double",
  "triple",
  "picot",
  "bobble",
  "puff",
];

/** Stitch types whose leg count / foot position can change with connection count (増減目). */
export const LEG_VARIABLE_TYPES: SymbolType[] = ["singleCrochet", "halfDouble", "double", "triple"];

export const SYMBOL_DEFS: Record<SymbolType, SymbolDef> = {
  ring: {
    type: "ring",
    label: "輪編み（わ）",
    shortLabel: "わ",
    height: 0,
    width: 22,
  },
  chain: {
    type: "chain",
    label: "鎖編み",
    shortLabel: "鎖",
    height: 14,
    width: 12,
  },
  slipStitch: {
    type: "slipStitch",
    label: "引き抜き編み",
    shortLabel: "引抜",
    height: 8,
    width: 8,
  },
  singleCrochet: {
    type: "singleCrochet",
    label: "細編み",
    shortLabel: "細編",
    height: 14,
    width: 14,
  },
  halfDouble: {
    type: "halfDouble",
    label: "中長編み",
    shortLabel: "中長",
    height: 20,
    width: 12,
  },
  double: {
    type: "double",
    label: "長編み",
    shortLabel: "長編",
    height: 26,
    width: 12,
  },
  triple: {
    type: "triple",
    label: "長々編み",
    shortLabel: "長々",
    height: 32,
    width: 12,
  },
  picot: {
    type: "picot",
    label: "ピコット",
    shortLabel: "ピコ",
    height: 14,
    width: 14,
  },
  bobble: {
    type: "bobble",
    label: "玉編み",
    shortLabel: "玉",
    height: 18,
    width: 16,
  },
  puff: {
    type: "puff",
    label: "パフコーン編み",
    shortLabel: "パフ",
    height: 20,
    width: 20,
  },
};
