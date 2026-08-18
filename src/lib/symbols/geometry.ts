import { SYMBOL_DEFS } from "@/lib/symbols/definitions";
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

export function getHeadPoint(symbol: Pick<ChartSymbol, "x" | "y" | "rotation" | "type">): Point {
  const height = SYMBOL_DEFS[symbol.type].height;
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

/** Angle in degrees, 0 = up (-y direction), clockwise positive, matching symbol rotation convention. */
export function angleOnCircle(angleDeg: number, radius: number, center: Point): Point {
  const rad = angleDeg * DEG2RAD;
  return {
    x: center.x + radius * Math.sin(rad),
    y: center.y - radius * Math.cos(rad),
  };
}
