"use client";

import { useState } from "react";
import { useChartStore } from "@/store/chartStore";
import { SYMBOL_DEFS, SYMBOL_ORDER } from "@/lib/symbols/definitions";
import { computeRoundArray } from "@/lib/symbols/roundArray";
import type { SymbolType } from "@/types/chart";

export function RoundArrayDialog({ onClose }: { onClose: () => void }) {
  const guide = useChartStore((s) => s.guide);
  const addSymbolsBatch = useChartStore((s) => s.addSymbolsBatch);

  const [type, setType] = useState<SymbolType>("double");
  const [count, setCount] = useState(12);
  const [isFullCircle, setIsFullCircle] = useState(true);
  const [startAngle, setStartAngle] = useState(0);
  const [arcRange, setArcRange] = useState(180);
  const [radius, setRadius] = useState(guide.ring.ringSpacing * 2);
  const [centerX, setCenterX] = useState(guide.ring.centerX);
  const [centerY, setCenterY] = useState(guide.ring.centerY);

  const preview = computeRoundArray({
    count,
    isFullCircle,
    startAngle,
    arcRange,
    radius,
    center: { x: centerX, y: centerY },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-[380px] rounded-lg bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-sm font-semibold text-neutral-700">輪の等分配置</h2>

        <div className="flex flex-col gap-3 text-sm">
          <label className="flex flex-col gap-1">
            記号の種類
            <select
              className="rounded border border-neutral-300 px-2 py-1"
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
            記号数
            <input
              type="number"
              min={1}
              className="rounded border border-neutral-300 px-2 py-1"
              value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5">
              <input type="radio" checked={isFullCircle} onChange={() => setIsFullCircle(true)} />
              一周（360°）
            </label>
            <label className="flex items-center gap-1.5">
              <input type="radio" checked={!isFullCircle} onChange={() => setIsFullCircle(false)} />
              弧（任意角度）
            </label>
          </div>

          {!isFullCircle && (
            <label className="flex flex-col gap-1">
              弧の角度範囲
              <input
                type="number"
                className="rounded border border-neutral-300 px-2 py-1"
                value={arcRange}
                onChange={(e) => setArcRange(Number(e.target.value) || 0)}
              />
            </label>
          )}

          <label className="flex flex-col gap-1">
            開始角度（0°=真上、時計回り）
            <input
              type="number"
              className="rounded border border-neutral-300 px-2 py-1"
              value={startAngle}
              onChange={(e) => setStartAngle(Number(e.target.value) || 0)}
            />
          </label>

          <label className="flex flex-col gap-1">
            半径
            <input
              type="number"
              className="rounded border border-neutral-300 px-2 py-1"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value) || 0)}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              中心 X
              <input
                type="number"
                className="rounded border border-neutral-300 px-2 py-1"
                value={centerX}
                onChange={(e) => setCenterX(Number(e.target.value) || 0)}
              />
            </label>
            <label className="flex flex-col gap-1">
              中心 Y
              <input
                type="number"
                className="rounded border border-neutral-300 px-2 py-1"
                value={centerY}
                onChange={(e) => setCenterY(Number(e.target.value) || 0)}
              />
            </label>
          </div>

          <p className="text-[11px] text-neutral-400">
            {isFullCircle
              ? "360°を記号数で単純に等分します。"
              : "両端に少し余白を残し、記号数+1個の隙間で等分します。"}
          </p>

          <svg viewBox="0 0 120 120" className="h-28 w-28 self-center rounded border border-neutral-100 bg-neutral-50">
            <g transform={`translate(${60 - centerX * (100 / Math.max(radius * 2.4, 1))},${
              60 - centerY * (100 / Math.max(radius * 2.4, 1))
            }) scale(${100 / Math.max(radius * 2.4, 1)})`}>
              <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="#c7d2fe" strokeWidth={1} />
              {preview.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={4} fill="#2563eb" />
              ))}
            </g>
          </svg>

          <div className="mt-1 flex justify-end gap-2">
            <button className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100" onClick={onClose}>
              キャンセル
            </button>
            <button
              className="rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
              onClick={() => {
                addSymbolsBatch(preview.map((p) => ({ type, x: p.x, y: p.y, rotation: p.rotation })));
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
