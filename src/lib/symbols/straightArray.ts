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
