"use client";

import { useChartStore } from "@/store/chartStore";
import { SYMBOL_DEFS, SYMBOL_ORDER, getSymbolHeight } from "@/lib/symbols/definitions";
import { SymbolShape } from "@/components/editor/SymbolShape";

const ICON_PAD = 4;

/** A fixed 26x26 viewBox clipped every symbol taller/wider than the smallest ones once
 *  stitch heights started varying a lot (e.g. triple crochet is over 2x a chain). Each
 *  symbol instead gets its own viewBox sized to its actual foot-to-head span (plus a
 *  little padding), so the glyph always fits — bigger stitches just render a bit smaller
 *  within the same 26x26 icon box rather than spilling out of it. */
function paletteViewBox(type: (typeof SYMBOL_ORDER)[number]): string {
  const def = SYMBOL_DEFS[type];
  if (type === "ring") {
    const r = 9 + ICON_PAD;
    return `${-r} ${-r} ${r * 2} ${r * 2}`;
  }
  const height = getSymbolHeight({ type, baseStitch: "double" });
  const viewW = def.width + ICON_PAD * 2;
  const viewH = height + ICON_PAD * 2;
  return `${-viewW / 2} ${-viewH + ICON_PAD} ${viewW} ${viewH}`;
}

export function SymbolPalette() {
  const placementTool = useChartStore((s) => s.placementTool);
  const setPlacementTool = useChartStore((s) => s.setPlacementTool);
  const clearSelection = useChartStore((s) => s.clearSelection);

  return (
    <div className="flex flex-col gap-1 p-3">
      <h2 className="mb-1 text-xs font-semibold text-ink/50">記号パレット</h2>
      <button
        className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm ${
          placementTool === null ? "border-pink bg-pink/10 text-pink" : "border-transparent text-ink hover:bg-cream/60"
        }`}
        onClick={() => {
          setPlacementTool(null);
        }}
      >
        <span className="flex h-6 w-6 items-center justify-center text-base">↖</span>
        選択ツール
      </button>
      <div className="mt-1 grid grid-cols-1 gap-1">
        {SYMBOL_ORDER.map((type) => {
          const def = SYMBOL_DEFS[type];
          const active = placementTool === type;
          return (
            <button
              key={type}
              className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm transition ${
                active ? "border-pink bg-pink/10 text-pink" : "border-transparent text-ink hover:bg-cream/60"
              }`}
              onClick={() => {
                clearSelection();
                setPlacementTool(active ? null : type);
              }}
            >
              <svg width={26} height={26} viewBox={paletteViewBox(type)}>
                <SymbolShape type={type} stroke={active ? "#f57799" : "#2a211d"} />
              </svg>
              <span>{def.label}</span>
            </button>
          );
        })}
      </div>
      {placementTool && (
        <p className="mt-2 text-xs text-ink/50">
          キャンバスをクリックして配置。もう一度ツールを押すか選択ツールに戻ると終了します。
        </p>
      )}
    </div>
  );
}
