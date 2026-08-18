"use client";

import { useState } from "react";
import { useChartStore } from "@/store/chartStore";
import { SYMBOL_DEFS, SYMBOL_ORDER } from "@/lib/symbols/definitions";
import { computeStraightArray } from "@/lib/symbols/straightArray";
import type { SymbolType } from "@/types/chart";

export function StraightArrayDialog({ onClose }: { onClose: () => void }) {
  const guide = useChartStore((s) => s.guide);
  const addSymbolsBatch = useChartStore((s) => s.addSymbolsBatch);

  const [type, setType] = useState<SymbolType>("chain");
  const [count, setCount] = useState(10);
  const [startX, setStartX] = useState(guide.chain.startX);
  const [startY, setStartY] = useState(guide.chain.y);
  const [spacing, setSpacing] = useState(guide.chain.stitchSpacing);
  const [angle, setAngle] = useState(0);

  const preview = computeStraightArray({
    count,
    start: { x: startX, y: startY },
    spacing,
    angle,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="w-[380px] rounded-lg bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-3 text-sm font-semibold text-ink">直線の均等配置</h2>

        <div className="flex flex-col gap-3 text-sm">
          <label className="flex flex-col gap-1">
            記号の種類
            <select
              className="rounded border border-peach/60 px-2 py-1 text-ink"
              value={type}
              onChange={(e) => setType(e.target.value as SymbolType)}
            >
              {SYMBOL_ORDER.filter((t) => t !== "ring").map((t) => (
                <option key={t} value={t}>
                  {SYMBOL_DEFS[t].label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            目数
            <input
              type="number"
              min={1}
              className="rounded border border-peach/60 px-2 py-1 text-ink"
              value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              開始位置 X
              <input
                type="number"
                className="rounded border border-peach/60 px-2 py-1 text-ink"
                value={startX}
                onChange={(e) => setStartX(Number(e.target.value) || 0)}
              />
            </label>
            <label className="flex flex-col gap-1">
              開始位置 Y
              <input
                type="number"
                className="rounded border border-peach/60 px-2 py-1 text-ink"
                value={startY}
                onChange={(e) => setStartY(Number(e.target.value) || 0)}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            間隔
            <input
              type="number"
              className="rounded border border-peach/60 px-2 py-1 text-ink"
              value={spacing}
              onChange={(e) => setSpacing(Number(e.target.value) || 1)}
            />
          </label>

          <label className="flex flex-col gap-1">
            方向（0°=右、時計回り）
            <input
              type="number"
              className="rounded border border-peach/60 px-2 py-1 text-ink"
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value) || 0)}
            />
          </label>

          <p className="text-[11px] text-ink/40">
            開始位置から一定間隔で{count}目を一直線に並べます。配置後も個別に微調整できます。
          </p>

          <svg viewBox="0 0 140 80" className="h-20 w-full rounded border border-peach/40 bg-cream/30">
            <g
              transform={`translate(${70 - (startX + ((count - 1) * spacing * Math.cos((angle * Math.PI) / 180)) / 2) * (110 / Math.max(count * spacing, 60))},${
                40 - (startY + ((count - 1) * spacing * Math.sin((angle * Math.PI) / 180)) / 2) * (110 / Math.max(count * spacing, 60))
              }) scale(${110 / Math.max(count * spacing, 60)})`}
            >
              {preview.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={4} fill="#f57799" />
              ))}
            </g>
          </svg>

          <div className="mt-1 flex justify-end gap-2">
            <button className="rounded-md border border-peach/60 px-3 py-1.5 text-ink hover:bg-cream/60" onClick={onClose}>
              キャンセル
            </button>
            <button
              className="rounded-md bg-pink px-3 py-1.5 text-white hover:bg-salmon"
              onClick={() => {
                addSymbolsBatch(preview.map((p) => ({ type, x: p.x, y: p.y, rotation: 0 })));
                onClose();
              }}
            >
              配置する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
