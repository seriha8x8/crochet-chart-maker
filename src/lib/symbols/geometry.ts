import { getSymbolHeight } from "@/lib/symbols/definitions";
import type { ChartSymbol } from "@/types/chart";

export interface Point {
  x: number;
  y: number;
}

const DEG2RAD = Math.PI / 180;

/** Rotate a local point (relative to foot, "up" = -y) by rotation degrees (clockwise) and translate to world foot position. */
export function localToWorld(symbol: Pick<ChartSymbol, "x" | "y" | "rotation">, local: Point): Point {
  const rad = symbol.rotation * DEG2RAD;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: symbol.x + local.x * cos - local.y * sin,
    y: symbol.y + local.x * sin + local.y * cos,
  };
}

export function getFootPoint(symbol: Pick<ChartSymbol, "x" | "y">): Point {
  return { x: symbol.x, y: symbol.y };
}

export function getHeadPoint(symbol: Pick<ChartSymbol, "x" | "y" | "rotation" | "type" | "baseStitch">): Point {
  const height = getSymbolHeight(symbol);
  return localToWorld(symbol, { x: 0, y: -height });
}

export function centroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  const sum = points.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / points.length, y: sum.y / points.length };
}

/** Local x-spacing (px) between adjacent legs in the decrease visual. */
const LEG_STEP = 6;
/** Local x-spacing (px) between adjacent heads in the increase visual — wider than LEG_STEP
 *  since it has to visually separate two whole glyphs (head decoration included), not just legs. */
const HEAD_FAN_STEP = 9;

export interface ConnectionOffsets {
  /** Local foot x-offsets (y=0) to draw legs from, all converging to the (possibly offset) head. */
  feet: number[];
  /** Local x-offset of the head (and its decoration: crossbar, X, slash marks) from center. */
  headOffset: number;
}

const IDENTITY_OFFSETS: ConnectionOffsets = { feet: [0], headOffset: 0 };

/**
 * How a symbol's leg(s) and head should be offset from the plain centered form, reflecting
 * how it's connected to the previous round:
 * - 2+ parents (decrease, e.g. 2目一度): one leg per parent, symmetric around 0, all
 *   converging to the symbol's own single (centered) head.
 * - 1 parent shared with sibling symbols (increase, e.g. 2目編み入れる): every sibling
 *   snaps to the exact same point (the parent's connection point) since they're genuinely
 *   worked into the same stitch, so the leg stays centered — but the head (where the
 *   viewer needs to see and count distinct stitches) fans sideways from its neighbors.
 *   Purely cosmetic; doesn't affect the symbol's actual x/y.
 * - otherwise: identity (unchanged original single centered leg and head).
 */
export function computeConnectionOffsets(
  symbol: Pick<ChartSymbol, "id" | "parentIds" | "attachType">,
  allSymbols: Pick<ChartSymbol, "id" | "parentIds" | "attachType">[],
): ConnectionOffsets {
  const n = symbol.parentIds.length;
  if (n >= 2) {
    const feet = Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * LEG_STEP);
    return { feet, headOffset: 0 };
  }
  if (n === 1) {
    const parentId = symbol.parentIds[0];
    const siblings = allSymbols.filter(
      (s) => s.parentIds.length === 1 && s.parentIds[0] === parentId && s.attachType === symbol.attachType,
    );
    if (siblings.length > 1) {
      const idx = siblings.findIndex((s) => s.id === symbol.id);
      if (idx >= 0) return { feet: [0], headOffset: (idx - (siblings.length - 1) / 2) * HEAD_FAN_STEP };
    }
  }
  return IDENTITY_OFFSETS;
}

/** Angle in degrees, 0 = up (-y direction), clockwise positive, matching symbol rotation convention. */
export function angleOnCircle(angleDeg: number, radius: number, center: Point): Point {
  const rad = angleDeg * DEG2RAD;
  return {
    x: center.x + radius * Math.sin(rad),
    y: center.y - radius * Math.cos(rad),
  };
}
