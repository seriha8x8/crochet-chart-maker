export interface SnapCandidate {
  id: string;
  x: number;
  y: number;
}

export interface SnapResult {
  x: number;
  y: number;
  guideX: number | null;
  guideY: number | null;
}

/**
 * Given a dragged point and a set of other symbols' foot points, find the closest
 * x/y alignment within threshold and softly snap to it, returning guide line
 * positions to render (in the same coordinate space as the points).
 */
export function computeSnap(
  point: { x: number; y: number },
  others: SnapCandidate[],
  threshold: number,
): SnapResult {
  let bestX: { dist: number; value: number } | null = null;
  let bestY: { dist: number; value: number } | null = null;

  for (const other of others) {
    const dx = Math.abs(other.x - point.x);
    if (dx <= threshold && (!bestX || dx < bestX.dist)) {
      bestX = { dist: dx, value: other.x };
    }
    const dy = Math.abs(other.y - point.y);
    if (dy <= threshold && (!bestY || dy < bestY.dist)) {
      bestY = { dist: dy, value: other.y };
    }
  }

  return {
    x: bestX ? bestX.value : point.x,
    y: bestY ? bestY.value : point.y,
    guideX: bestX ? bestX.value : null,
    guideY: bestY ? bestY.value : null,
  };
}
