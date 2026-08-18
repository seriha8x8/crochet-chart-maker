"use client";

import { useChartStore } from "@/store/chartStore";
import { SYMBOL_DEFS, SYMBOL_ORDER } from "@/lib/symbols/definitions";
import { SymbolShape } from "@/components/editor/SymbolShape";

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
              <svg width={26} height={26} viewBox="-13 -22 26 26">
                <g transform="translate(0,0)">
                  <SymbolShape type={type} stroke={active ? "#f57799" : "#2a211d"} />
                </g>
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
