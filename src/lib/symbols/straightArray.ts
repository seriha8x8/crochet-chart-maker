import type { Point } from "@/lib/symbols/geometry";

export interface StraightArrayInput {
  count: number;
  start: Point;
  spacing: number;
  /** degrees, 0 = rightward (→), clockwise positive */
  angle: number;
}

export interface StraightArrayResult {
  x: number;
  y: number;
}

/** Evenly spaces `count` symbols along a straight line starting at `start`, one spacing apart. */
export function computeStraightArray(input: StraightArrayInput): StraightArrayResult[] {
  const { count, start, spacing, angle } = input;
  if (count <= 0) return [];
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const results: StraightArrayResult[] = [];
  for (let i = 0; i < count; i++) {
    results.push({ x: start.x + i * spacing * dx, y: start.y + i * spacing * dy });
  }
  return results;
}

/**
 * Evenly fills the straight span between two points (both endpoints included) using
 * roughly `spacing` between neighbors — the actual spacing is stretched slightly so the
 * last symbol lands exactly on `end`, for a "place the same symbol from here to here" drag.
 */
export function computeFillBetween(start: Point, end: Point, spacing: number): Point[] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.hypot(dx, dy);
  if (dist < spacing * 0.5) return [start];
  const count = Math.max(2, Math.round(dist / spacing) + 1);
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    points.push({ x: start.x + dx * t, y: start.y + dy * t });
  }
  return points;
}
