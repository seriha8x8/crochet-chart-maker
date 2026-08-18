"use client";

import { useState } from "react";
import { useChartStore } from "@/store/chartStore";

export function LayerPanel() {
  const layers = useChartStore((s) => s.layers);
  const activeLayerId = useChartStore((s) => s.activeLayerId);
  const setActiveLayer = useChartStore((s) => s.setActiveLayer);
  const addLayer = useChartStore((s) => s.addLayer);
  const renameLayer = useChartStore((s) => s.renameLayer);
  const toggleLayerVisibility = useChartStore((s) => s.toggleLayerVisibility);
  const removeLayer = useChartStore((s) => s.removeLayer);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  return (
    <div className="flex flex-col gap-1 border-t border-peach/40 p-3">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-ink/50">レイヤー</h2>
        <button
          className="rounded px-1.5 py-0.5 text-xs text-pink hover:bg-pink/10"
          onClick={() => addLayer(`レイヤー${layers.length + 1}`)}
        >
          + 追加
        </button>
      </div>
      <ul className="flex flex-col gap-0.5">
        {[...layers]
          .sort((a, b) => a.order - b.order)
          .map((layer) => (
            <li
              key={layer.id}
              className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm ${
                layer.id === activeLayerId ? "bg-peach/25" : "hover:bg-cream/60"
              }`}
              onClick={() => setActiveLayer(layer.id)}
            >
              <button
                className="shrink-0 text-xs"
                title={layer.visible ? "表示中" : "非表示"}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerVisibility(layer.id);
                }}
              >
                {layer.visible ? "👁" : "🚫"}
              </button>
              {editingId === layer.id ? (
                <input
                  autoFocus
                  className="flex-1 rounded border border-pink/50 px-1 py-0.5 text-xs"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={() => {
                    renameLayer(layer.id, draftName || layer.name);
                    setEditingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      renameLayer(layer.id, draftName || layer.name);
                      setEditingId(null);
                    }
                  }}
                />
              ) : (
                <span
                  className="flex-1 truncate"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingId(layer.id);
                    setDraftName(layer.name);
                  }}
                >
                  {layer.name}
                </span>
              )}
              {layers.length > 1 && (
                <button
                  className="shrink-0 rounded px-1 text-xs text-ink/30 hover:bg-red-50 hover:text-red-500"
                  title="レイヤーを削除"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLayer(layer.id);
                  }}
                >
                  ✕
                </button>
              )}
            </li>
          ))}
      </ul>
      <p className="mt-1 text-[11px] text-ink/40">クリックでアクティブ化・ダブルクリックで名称変更</p>
    </div>
  );
}
