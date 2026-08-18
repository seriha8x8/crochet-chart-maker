import { angleOnCircle, type Point } from "@/lib/symbols/geometry";

export interface RoundArrayInput {
  count: number;
  /** true = full 360° circle, false = arc between startAngle and startAngle+arcRange */
  isFullCircle: boolean;
  startAngle: number;
  arcRange: number;
  radius: number;
  center: Point;
}

export interface RoundArrayResult {
  x: number;
  y: number;
  rotation: number;
}

/**
 * Full circle: count symbols equally divide 360°.
 * Arc: (count + 1) gaps so both ends keep a margin (symbols never sit exactly on the arc edges).
 */
export function computeRoundArray(input: RoundArrayInput): RoundArrayResult[] {
  const { count, isFullCircle, startAngle, arcRange, radius, center } = input;
  if (count <= 0) return [];

  const results: RoundArrayResult[] = [];
  if (isFullCircle) {
    const step = 360 / count;
    for (let i = 0; i < count; i++) {
      const angle = startAngle + i * step;
      const p = angleOnCircle(angle, radius, center);
      results.push({ x: p.x, y: p.y, rotation: angle });
    }
  } else {
    const step = arcRange / (count + 1);
    for (let i = 1; i <= count; i++) {
      const angle = startAngle + i * step;
      const p = angleOnCircle(angle, radius, center);
      results.push({ x: p.x, y: p.y, rotation: angle });
    }
  }
  return results;
}
