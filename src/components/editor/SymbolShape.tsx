import type { ReactNode } from "react";
import { SYMBOL_DEFS } from "@/lib/symbols/definitions";
import type { SymbolType } from "@/types/chart";

interface SymbolShapeProps {
  type: SymbolType;
  stroke?: string;
  strokeWidth?: number;
  /**
   * Local x-offsets (y=0) to draw this symbol's leg(s) from instead of the default
   * single centered leg — see computeConnectionOffsets in lib/symbols/geometry.ts for
   * how this represents a decrease (multiple legs into one head). Defaults to a single
   * centered leg, i.e. unchanged.
   */
  feetOffsets?: number[];
  /**
   * Local x-offset of the head (and its decoration) from center, representing an
   * increase — see computeConnectionOffsets. Defaults to 0, i.e. unchanged.
   */
  headOffset?: number;
  /** Draws a small hook mark at the foot for a "引き上げる" (pull-up) connection. */
  hookMark?: "front" | "back";
}

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
}: SymbolShapeProps) {
  const height = SYMBOL_DEFS[type].height;
  const common = { stroke, strokeWidth, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const feetChanged = feetOffsets.length > 1 || feetOffsets[0] !== 0 || headOffset !== 0;

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
          {feetChanged && feetOffsets.map((fx) => <line key={fx} x1={fx} y1={0} x2={headOffset} y2={cy} />)}
        </g>
      );
      break;
    }
    case "halfDouble": {
      const topW = 5;
      shape = (
        <g {...common}>
          {feetOffsets.map((fx) => (
            <line key={fx} x1={fx} y1={0} x2={headOffset} y2={-height} />
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
            <line key={fx} x1={fx} y1={0} x2={headOffset} y2={-height} />
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
            <line key={fx} x1={fx} y1={0} x2={headOffset} y2={-height} />
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
      // 3 small loops (chain-3) fanning from the base, with the closing slip stitch as a dot.
      const petalW = 3;
      const petalLen = height;
      const petalPath = `M 0,0 C ${-petalW},${-petalLen * 0.3} ${-petalW},${-petalLen * 0.75} 0,${-petalLen} C ${petalW},${-petalLen * 0.75} ${petalW},${-petalLen * 0.3} 0,0 Z`;
      shape = (
        <g {...common}>
          <g transform="rotate(-32)">
            <path d={petalPath} />
          </g>
          <path d={petalPath} />
          <g transform="rotate(32)">
            <path d={petalPath} />
          </g>
          <circle cx={0} cy={0} r={2.2} fill={stroke} stroke="none" />
        </g>
      );
      break;
    }
    case "bobble": {
      // Lens/almond outline (pointed at both foot and head) with a few loops inside.
      const bw = SYMBOL_DEFS[type].width / 2;
      const inset = 1.5;
      const loopXs = [-bw * 0.55, 0, bw * 0.55];
      shape = (
        <g {...common}>
          <path
            d={`M 0,0 C ${-bw},${-height * 0.15} ${-bw},${-height * 0.85} 0,${-height} C ${bw},${-height * 0.85} ${bw},${-height * 0.15} 0,0 Z`}
          />
          {loopXs.map((lx) => (
            <line key={lx} x1={lx} y1={-inset} x2={lx} y2={-height + inset} />
          ))}
        </g>
      );
      break;
    }
    case "puff": {
      // Open-top "vase" outline (flat rim at the head, pointed at the foot) with loops inside.
      const bw = SYMBOL_DEFS[type].width / 2;
      const rimRy = 3;
      const inset = 1.5;
      const loopXs = [-bw * 0.5, 0, bw * 0.5];
      shape = (
        <g {...common}>
          <path
            d={`M ${-bw},${-height} C ${-bw * 1.15},${-height * 0.5} ${-bw * 0.25},${-height * 0.05} 0,0 C ${bw * 0.25},${-height * 0.05} ${bw * 1.15},${-height * 0.5} ${bw},${-height}`}
          />
          <ellipse cx={0} cy={-height} rx={bw} ry={rimRy} />
          {loopXs.map((lx) => (
            <line key={lx} x1={lx} y1={-inset} x2={lx} y2={-height + rimRy} />
          ))}
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

  // A loop curling out from the foot, like the base of a real front/back-post stitch
  // symbol (hooked around the previous round's post rather than piercing its head).
  const dir = hookMark === "front" ? -1 : 1;
  const r = 4.5;
  return (
    <>
      {shape}
      <circle cx={dir * r} cy={0} r={r} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
    </>
  );
}
