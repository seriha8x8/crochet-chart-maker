import { SYMBOL_DEFS } from "@/lib/symbols/definitions";
import type { SymbolType } from "@/types/chart";

interface SymbolShapeProps {
  type: SymbolType;
  stroke?: string;
  strokeWidth?: number;
}

/**
 * Renders a symbol pointing "up": foot at (0,0), head at (0,-height).
 * Caller applies translate(x,y) rotate(rotation) around this origin.
 */
export function SymbolShape({ type, stroke = "#2a211d", strokeWidth = 1.6 }: SymbolShapeProps) {
  const height = SYMBOL_DEFS[type].height;
  const common = { stroke, strokeWidth, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (type) {
    case "ring": {
      const r = 9;
      return (
        <g>
          <circle cx={0} cy={0} r={r} {...common} />
          <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontSize={9} fill={stroke} stroke="none">
            わ
          </text>
        </g>
      );
    }
    case "chain": {
      const cy = -height / 2;
      return <ellipse cx={0} cy={cy} rx={7.5} ry={5} {...common} />;
    }
    case "slipStitch": {
      const cy = -height / 2;
      return <circle cx={0} cy={cy} r={3} fill={stroke} stroke="none" />;
    }
    case "singleCrochet": {
      const s = 6;
      const cy = -height / 2;
      return (
        <g {...common}>
          <line x1={-s} y1={cy - s} x2={s} y2={cy + s} />
          <line x1={s} y1={cy - s} x2={-s} y2={cy + s} />
        </g>
      );
    }
    case "halfDouble": {
      const topW = 5;
      return (
        <g {...common}>
          <line x1={0} y1={0} x2={0} y2={-height} />
          <line x1={-topW} y1={-height} x2={topW} y2={-height} />
        </g>
      );
    }
    case "double": {
      const topW = 5;
      const midY = -height * 0.55;
      const slashLen = 5;
      return (
        <g {...common}>
          <line x1={0} y1={0} x2={0} y2={-height} />
          <line x1={-topW} y1={-height} x2={topW} y2={-height} />
          <line x1={-slashLen / 2} y1={midY + slashLen / 2} x2={slashLen / 2} y2={midY - slashLen / 2} />
        </g>
      );
    }
    case "triple": {
      const topW = 5;
      const mid1 = -height * 0.45;
      const mid2 = -height * 0.65;
      const slashLen = 5;
      return (
        <g {...common}>
          <line x1={0} y1={0} x2={0} y2={-height} />
          <line x1={-topW} y1={-height} x2={topW} y2={-height} />
          <line x1={-slashLen / 2} y1={mid1 + slashLen / 2} x2={slashLen / 2} y2={mid1 - slashLen / 2} />
          <line x1={-slashLen / 2} y1={mid2 + slashLen / 2} x2={slashLen / 2} y2={mid2 - slashLen / 2} />
        </g>
      );
    }
    default:
      return null;
  }
}
