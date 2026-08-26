import { forwardRef, useMemo } from "react";
import { useChartStore } from "@/store/chartStore";
import { SYMBOL_DEFS, DEFAULT_SYMBOL_COLOR, getSymbolHeight } from "@/lib/symbols/definitions";
import { SymbolShape } from "@/components/editor/SymbolShape";
import { getFootPoint, getHeadPoint, computeConnectionOffsets } from "@/lib/symbols/geometry";

const PADDING = 30;

export const ExportSvg = forwardRef<SVGSVGElement>(function ExportSvg(_props, ref) {
  const symbols = useChartStore((s) => s.symbols);
  const layers = useChartStore((s) => s.layers);

  const visibleLayerIds = new Set(layers.filter((l) => l.visible).map((l) => l.id));
  const visibleSymbols = symbols.filter((s) => visibleLayerIds.has(s.layerId));

  const bbox = useMemo(() => {
    if (visibleSymbols.length === 0) return { minX: 0, minY: 0, maxX: 400, maxY: 300 };
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const s of visibleSymbols) {
      const def = SYMBOL_DEFS[s.type];
      const pad = Math.max(def.width, getSymbolHeight(s), 16) / 2 + 4;
      for (const p of [getFootPoint(s), getHeadPoint(s)]) {
        minX = Math.min(minX, p.x - pad);
        minY = Math.min(minY, p.y - pad);
        maxX = Math.max(maxX, p.x + pad);
        maxY = Math.max(maxY, p.y + pad);
      }
    }
    return { minX, minY, maxX, maxY };
  }, [visibleSymbols]);

  const width = bbox.maxX - bbox.minX + PADDING * 2;
  const height = bbox.maxY - bbox.minY + PADDING * 2;
  const offsetX = -bbox.minX + PADDING;
  const offsetY = -bbox.minY + PADDING;

  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "fixed", left: -99999, top: -99999, pointerEvents: "none" }}
    >
      <rect x={0} y={0} width={width} height={height} fill="#ffffff" />
      <g transform={`translate(${offsetX},${offsetY})`}>
        {visibleSymbols.map((symbol) => {
          const connectionOffsets = computeConnectionOffsets(symbol, symbols);
          return (
            <g key={symbol.id} transform={`translate(${symbol.x},${symbol.y}) rotate(${symbol.rotation})`}>
              <SymbolShape
                type={symbol.type}
                stroke={symbol.color ?? DEFAULT_SYMBOL_COLOR}
                feetOffsets={connectionOffsets.feet}
                headOffset={connectionOffsets.headOffset}
                hookMark={
                  symbol.attachType === "pullUpFront" ? "front" : symbol.attachType === "pullUpBack" ? "back" : undefined
                }
                loopCount={symbol.loopCount}
                baseStitch={symbol.baseStitch}
                siblingIndex={connectionOffsets.siblingIndex}
                siblingCount={connectionOffsets.siblingCount}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
});
