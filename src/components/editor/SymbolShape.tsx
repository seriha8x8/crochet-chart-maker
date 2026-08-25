import type { ReactNode } from "react";
import { SYMBOL_DEFS, getSymbolHeight } from "@/lib/symbols/definitions";
import type { BobbleBaseStitch, SymbolType } from "@/types/chart";

interface SymbolShapeProps {
  type: SymbolType;
  stroke?: string;
  strokeWidth?: number;
  /**
   * Local x-offsets (y=0, or -HOOK_R when hookMark is set) to draw this symbol's leg(s)
   * from instead of the default single centered leg — see computeConnectionOffsets in
   * lib/symbols/geometry.ts for how this represents a decrease (multiple legs into one
   * head). Defaults to a single centered leg, i.e. unchanged.
   */
  feetOffsets?: number[];
  /**
   * Local x-offset of the head (and its decoration) from center, representing an
   * increase — see computeConnectionOffsets. Defaults to 0, i.e. unchanged.
   */
  headOffset?: number;
  /** Draws the foot as a loop curling out for a "引き上げる" (pull-up) connection. */
  hookMark?: "front" | "back";
  /** Number of loops/legs drawn inside a bobble or puff stitch. Defaults to 3. */
  loopCount?: number;
  /** Which stitch a bobble/puff's legs are decorated as (crossbar, +slashes). Defaults to "double". */
  baseStitch?: BobbleBaseStitch;
}

/** Crossbar (+ slashes for double/triple) at the top of one bobble/puff leg, matching the
 *  decoration on the standalone halfDouble/double/triple symbols. topY is where this leg's
 *  own top sits (its "head"); slash spacing scales off the leg's full span, 0 to topY. */
function legDecoration(x: number, topY: number, baseStitch: BobbleBaseStitch, key: string) {
  const topW = 2.6;
  const slashLen = 3;
  const elems = [<line key={`${key}-top`} x1={x - topW} y1={topY} x2={x + topW} y2={topY} />];
  if (baseStitch === "double" || baseStitch === "triple") {
    const midY = topY * 0.7;
    elems.push(
      <line key={`${key}-s1`} x1={x - slashLen / 2} y1={midY + slashLen / 2} x2={x + slashLen / 2} y2={midY - slashLen / 2} />,
    );
  }
  if (baseStitch === "triple") {
    const midY2 = topY * 0.55;
    elems.push(
      <line key={`${key}-s2`} x1={x - slashLen / 2} y1={midY2 + slashLen / 2} x2={x + slashLen / 2} y2={midY2 - slashLen / 2} />,
    );
  }
  return elems;
}

const HOOK_R = 4.9; // 65% of the previous 7.5 — the loop was reading too large

/**
 * Renders a symbol pointing "up": foot at (0,0), head at (0,-height).
 * Caller applies translate(x,y) rotate(rotation) around this origin.
 */
export function SymbolShape({
  type,
  stroke = "#2a211d",
  strokeWidth = 1.6,
  feetOffsets = [0],
  headOffset = 0,
  hookMark,
  loopCount = 3,
  baseStitch = "double",
}: SymbolShapeProps) {
  const height = getSymbolHeight({ type, baseStitch });
  const common = { stroke, strokeWidth, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const feetChanged = feetOffsets.length > 1 || feetOffsets[0] !== 0 || headOffset !== 0;
  // When hooking around a post (front/back-post stitch), the leg itself keeps 95% of the
  // stitch's normal length — it only stops 5% short of the foot point (0,0) — and the "C"
  // hook is drawn hanging from there, dipping below the y=0 row baseline into the row
  // below (where the post it hooks around actually is), rather than being squeezed to fit
  // above the baseline.
  const legFootY = hookMark ? -height * 0.05 : 0;

  let shape: ReactNode;

  switch (type) {
    case "ring": {
      const r = 9;
      shape = (
        <g>
          <circle cx={0} cy={0} r={r} {...common} />
          <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontSize={9} fill={stroke} stroke="none">
            わ
          </text>
        </g>
      );
      break;
    }
    case "chain": {
      const cy = -height / 2;
      shape = <ellipse cx={0} cy={cy} rx={7.5} ry={5} {...common} />;
      break;
    }
    case "slipStitch": {
      const cy = -height / 2;
      shape = <circle cx={0} cy={cy} r={3} fill={stroke} stroke="none" />;
      break;
    }
    case "singleCrochet": {
      const s = 6;
      const cy = -height / 2;
      shape = (
        <g {...common}>
          <line x1={headOffset - s} y1={cy - s} x2={headOffset + s} y2={cy + s} />
          <line x1={headOffset + s} y1={cy - s} x2={headOffset - s} y2={cy + s} />
          {(feetChanged || hookMark) &&
            feetOffsets.map((fx) => <line key={fx} x1={fx} y1={legFootY} x2={headOffset} y2={cy} />)}
        </g>
      );
      break;
    }
    case "halfDouble": {
      const topW = 5;
      shape = (
        <g {...common}>
          {feetOffsets.map((fx) => (
            <line key={fx} x1={fx} y1={legFootY} x2={headOffset} y2={-height} />
          ))}
          <line x1={headOffset - topW} y1={-height} x2={headOffset + topW} y2={-height} />
        </g>
      );
      break;
    }
    case "double": {
      const topW = 5;
      const midY = -height * 0.55;
      const slashLen = 5;
      shape = (
        <g {...common}>
          {feetOffsets.map((fx) => (
            <line key={fx} x1={fx} y1={legFootY} x2={headOffset} y2={-height} />
          ))}
          <line x1={headOffset - topW} y1={-height} x2={headOffset + topW} y2={-height} />
          <line
            x1={headOffset - slashLen / 2}
            y1={midY + slashLen / 2}
            x2={headOffset + slashLen / 2}
            y2={midY - slashLen / 2}
          />
        </g>
      );
      break;
    }
    case "triple": {
      const topW = 5;
      const mid1 = -height * 0.45;
      const mid2 = -height * 0.65;
      const slashLen = 5;
      shape = (
        <g {...common}>
          {feetOffsets.map((fx) => (
            <line key={fx} x1={fx} y1={legFootY} x2={headOffset} y2={-height} />
          ))}
          <line x1={headOffset - topW} y1={-height} x2={headOffset + topW} y2={-height} />
          <line
            x1={headOffset - slashLen / 2}
            y1={mid1 + slashLen / 2}
            x2={headOffset + slashLen / 2}
            y2={mid1 - slashLen / 2}
          />
          <line
            x1={headOffset - slashLen / 2}
            y1={mid2 + slashLen / 2}
            x2={headOffset + slashLen / 2}
            y2={mid2 - slashLen / 2}
          />
        </g>
      );
      break;
    }
    case "picot": {
      // 3 chain stitches (drawn as the same oval as the standalone chain symbol), worked
      // one after another — not radiating from one shared point: the 1st heads up-left
      // (↖) from the base, the 2nd continues from the 1st's tip running parallel to the
      // previous row, and the 3rd continues from there heading back down-left (↙) toward
      // the base, closed by a slip stitch (a dot) there.
      const chainRx = 7.5; // same radii as the standalone chain symbol's ellipse
      const chainRy = 5;
      const chainLen = height * 0.55;
      const dirPoint = (deg: number) => {
        const rad = (deg * Math.PI) / 180;
        return { x: Math.sin(rad), y: -Math.cos(rad) };
      };
      const p0 = { x: 0, y: 0 };
      const d1 = dirPoint(-45); // ↖
      const p1 = { x: p0.x + chainLen * d1.x, y: p0.y + chainLen * d1.y };
      const d2 = dirPoint(90); // parallel to the previous row
      const p2 = { x: p1.x + chainLen * d2.x, y: p1.y + chainLen * d2.y };
      shape = (
        <g {...common}>
          <g transform={`translate(${p0.x},${p0.y}) rotate(-45)`}>
            <ellipse cx={0} cy={-chainLen / 2} rx={chainRx} ry={chainRy} />
          </g>
          <g transform={`translate(${p1.x},${p1.y}) rotate(90)`}>
            <ellipse cx={0} cy={-chainLen / 2} rx={chainRx} ry={chainRy} />
          </g>
          <g transform={`translate(${p2.x},${p2.y}) rotate(225)`}>
            <ellipse cx={0} cy={-chainLen / 2} rx={chainRx} ry={chainRy} />
          </g>
          <circle cx={0} cy={0} r={2.2} fill={stroke} stroke="none" />
        </g>
      );
      break;
    }
    case "bobble": {
      // Lens/almond outline (pointed at both foot and head): the outline's own 2 curves
      // ARE the first 2 legs, with a curved interior line per stitch beyond that — so a
      // 2-loop bobble is just the plain leaf shape, not the leaf plus 2 redundant sticks.
      // legXs are evenly spaced and the outline's own curves terminate exactly at the
      // outermost two, instead of always converging back to center — otherwise the outer
      // legs' decoration sits at a different spot than where their curve actually ends,
      // and the gap next to them reads as uneven next to the interior legs' even spacing.
      const n = Math.max(2, loopCount);
      const interiorCount = n - 2;
      const bw = 4.5 + interiorCount * 1.6;
      const step = (2 * bw) / (n - 1);
      const legXs = Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * step);
      const interiorXs = legXs.slice(1, -1);
      const topL = legXs[0];
      const topR = legXs[n - 1];
      shape = (
        <g {...common}>
          <path
            d={`M 0,0 C ${topL * 0.9},${-height * 0.15} ${topL},${-height * 0.7} ${topL},${-height} L ${topR},${-height} C ${topR},${-height * 0.7} ${topR * 0.9},${-height * 0.15} 0,0 Z`}
          />
          {interiorXs.map((lx) => (
            <path key={lx} d={`M 0,0 Q ${lx * 0.4},${-height * 0.6} ${lx},${-height}`} />
          ))}
          {legXs.map((lx) => legDecoration(lx, -height, baseStitch, `leg${lx}`))}
        </g>
      );
      break;
    }
    case "puff": {
      // Open-top "vase" outline (flat rim at the head, pointed at the foot): same logic as
      // bobble — the outline's own 2 side curves are the first 2 legs, terminating exactly
      // at the outermost of the evenly-spaced legXs (which also sets the rim's width).
      const n = Math.max(2, loopCount);
      const interiorCount = n - 2;
      const bw = 5.5 + interiorCount * 1.6;
      const rimRy = 3;
      const step = (2 * bw) / (n - 1);
      const legXs = Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * step);
      const interiorXs = legXs.slice(1, -1);
      shape = (
        <g {...common}>
          <path
            d={`M ${-bw},${-height} C ${-bw * 1.15},${-height * 0.5} ${-bw * 0.25},${-height * 0.05} 0,0 C ${bw * 0.25},${-height * 0.05} ${bw * 1.15},${-height * 0.5} ${bw},${-height}`}
          />
          <ellipse cx={0} cy={-height} rx={bw} ry={rimRy} />
          {interiorXs.map((lx) => (
            <path key={lx} d={`M 0,0 Q ${lx * 0.4},${-height * 0.6} ${lx},${-height + rimRy}`} />
          ))}
          {legXs.map((lx) => legDecoration(lx, -height + rimRy, baseStitch, `leg${lx}`))}
        </g>
      );
      break;
    }
    case "yarnJoin": {
      const tw = SYMBOL_DEFS[type].width / 2;
      shape = <path d={`M ${-tw},${-height} L ${tw},${-height} L 0,0 Z`} {...common} />;
      break;
    }
    case "yarnCut": {
      const tw = SYMBOL_DEFS[type].width / 2;
      shape = <path d={`M ${-tw},${-height} L ${tw},${-height} L 0,0 Z`} fill={stroke} stroke="none" />;
      break;
    }
    default:
      shape = null;
  }

  if (!hookMark) return shape;

  // An open "C" hook hanging from the leg's end, like the base of a real front/back-post
  // stitch symbol (hooked around the post in the row below rather than piercing its
  // head). The arc's path literally STARTS at (0, legFootY) — the leg's own end point —
  // instead of merely passing near it, so the two strokes share a vertex and always read
  // as one continuous mark, however the two are rendered. From there it sweeps almost a
  // full turn (leaving a small gap as the hook's open mouth) around a circle hanging
  // below that point; front curls counterclockwise (toward the left) and back curls
  // clockwise (toward the right), so the two attach types are mirror images of each other.
  const dir = hookMark === "front" ? -1 : 1;
  const center = { x: 0, y: legFootY + HOOK_R };
  const gapDeg = 70; // width of the open mouth, left at the end of the sweep
  const angleToPoint = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: center.x + HOOK_R * Math.sin(rad), y: center.y - HOOK_R * Math.cos(rad) };
  };
  const start = angleToPoint(0); // = (0, legFootY): exactly where the leg ends
  const end = angleToPoint(dir * (360 - gapDeg));
  const sweepFlag = dir > 0 ? 1 : 0;
  return (
    <>
      {shape}
      <path
        d={`M ${start.x},${start.y} A ${HOOK_R},${HOOK_R} 0 1,${sweepFlag} ${end.x},${end.y}`}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </>
  );
}
