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

/** Inverse of localToWorld: a world point expressed relative to this symbol's own foot and
 *  rotation (foot at (0,0), up = -y) — e.g. where one of its parents actually sits, in this
 *  symbol's own local frame, so a leg can be drawn reaching exactly to it. */
export function worldToLocal(symbol: Pick<ChartSymbol, "x" | "y" | "rotation">, world: Point): Point {
  const dx = world.x - symbol.x;
  const dy = world.y - symbol.y;
  const rad = -symbol.rotation * DEG2RAD;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { x: dx * cos - dy * sin, y: dx * sin + dy * cos };
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

/** Local x-spacing (px) between adjacent heads in the increase visual. */
const HEAD_FAN_STEP = 9;

export interface ConnectionOffsets {
  /** Local foot points to draw legs from, all converging to the (possibly offset) head. For a
   *  decrease (2+ parents) these are each parent's own real connection point, transformed into
   *  this symbol's local frame — so the leg actually stretches to reach it (distance and angle
   *  included, not just a fixed cosmetic x-spread), which matters once rows aren't evenly/
   *  flatly spaced (3D/sculptural work). Otherwise a single (0,0). */
  feet: Point[];
  /** Local x-offset of the head (and its decoration: crossbar, X, slash marks) from center. */
  headOffset: number;
  /** This symbol's 0-based position among its increase siblings, and how many there are —
   *  only set for the increase case (1 shared parent, 2+ siblings). singleCrochet uses this
   *  to draw one shared "V + ×" glyph for a N-into-1 increase instead of separate,
   *  overlapping symbols; undefined for every other case. */
  siblingIndex?: number;
  siblingCount?: number;
}

const IDENTITY_OFFSETS: ConnectionOffsets = { feet: [{ x: 0, y: 0 }], headOffset: 0 };

/**
 * How a symbol's leg(s) and head should be offset from the plain centered form, reflecting
 * how it's connected to the previous round:
 * - 2+ parents (decrease, e.g. 2目一度): one leg per parent, each stretching from this
 *   symbol's own (already-snapped) position out to that parent's real connection point —
 *   converging to the symbol's own single (centered) head. Not just a fixed cosmetic
 *   x-spread, so it still looks right once rows aren't evenly/flatly spaced (3D/sculptural
 *   work): a parent that's unusually far, close, or off to a diagonal gets a leg that
 *   actually reaches it.
 * - 1 parent shared with sibling symbols (increase, e.g. 2目編み入れる): every sibling
 *   snaps to the exact same point (the parent's connection point) since they're genuinely
 *   worked into the same stitch, so the leg stays centered — but the head (where the
 *   viewer needs to see and count distinct stitches) fans sideways from its neighbors.
 *   Purely cosmetic; doesn't affect the symbol's actual x/y.
 * - otherwise: identity (unchanged original single centered leg and head).
 */
export function computeConnectionOffsets(
  symbol: Pick<ChartSymbol, "id" | "x" | "y" | "rotation" | "parentIds" | "attachType">,
  allSymbols: Pick<ChartSymbol, "id" | "x" | "y" | "rotation" | "type" | "baseStitch" | "parentIds" | "attachType">[],
): ConnectionOffsets {
  const n = symbol.parentIds.length;
  if (n >= 2) {
    const parents = symbol.parentIds
      .map((id) => allSymbols.find((s) => s.id === id))
      .filter((p): p is (typeof allSymbols)[number] => p !== undefined);
    const feet = parents.map((p) =>
      worldToLocal(symbol, symbol.attachType === "stitch" ? getHeadPoint(p) : getFootPoint(p)),
    );
    return { feet: feet.length > 0 ? feet : [{ x: 0, y: 0 }], headOffset: 0 };
  }
  if (n === 1) {
    const parentId = symbol.parentIds[0];
    const siblings = allSymbols.filter(
      (s) => s.parentIds.length === 1 && s.parentIds[0] === parentId && s.attachType === symbol.attachType,
    );
    if (siblings.length > 1) {
      const idx = siblings.findIndex((s) => s.id === symbol.id);
      if (idx >= 0)
        return {
          feet: [{ x: 0, y: 0 }],
          headOffset: (idx - (siblings.length - 1) / 2) * HEAD_FAN_STEP,
          siblingIndex: idx,
          siblingCount: siblings.length,
        };
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
