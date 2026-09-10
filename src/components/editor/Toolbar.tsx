"use client";

import { useRef, useState } from "react";
import { useChartStore } from "@/store/chartStore";
import { downloadSvgAsPng } from "@/lib/export/svgToPng";
import { RoundArrayDialog } from "@/components/editor/RoundArrayDialog";
import { StraightArrayDialog } from "@/components/editor/StraightArrayDialog";
import { ExportSvg } from "@/components/editor/ExportSvg";
import type { GuideType } from "@/types/chart";

export function Toolbar() {
  const guide = useChartStore((s) => s.guide);
  const setGuide = useChartStore((s) => s.setGuide);
  const canvasBackground = useChartStore((s) => s.canvasBackground);
  const setCanvasBackground = useChartStore((s) => s.setCanvasBackground);
  const resetProject = useChartStore((s) => s.resetProject);
  const undo = useChartStore((s) => s.undo);
  const redo = useChartStore((s) => s.redo);
  const canUndo = useChartStore((s) => s.past.length > 0);
  const canRedo = useChartStore((s) => s.future.length > 0);
  const plan = useChartStore((s) => s.plan);
  const isPremium = plan === "premium";

  const [showGuidePopover, setShowGuidePopover] = useState(false);
  const [showRoundDialog, setShowRoundDialog] = useState(false);
  const [showStraightDialog, setShowStraightDialog] = useState(false);
  const exportRef = useRef<SVGSVGElement>(null);

  return (
    <div className="flex h-12 items-center justify-end border-b border-peach/40 bg-white px-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            className="rounded-md border border-peach/60 px-2.5 py-1.5 text-sm text-ink hover:bg-cream/60 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
            onClick={undo}
            disabled={!canUndo}
            title="元に戻す (Ctrl/Cmd+Z)"
          >
            ↶
          </button>
          <button
            className="rounded-md border border-peach/60 px-2.5 py-1.5 text-sm text-ink hover:bg-cream/60 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
            onClick={redo}
            disabled={!canRedo}
            title="やり直す (Ctrl/Cmd+Shift+Z)"
          >
            ↷
          </button>
        </div>

        <div className="relative">
          <button
            className="rounded-md border border-peach/60 px-3 py-1.5 text-sm text-ink hover:bg-cream/60"
            onClick={() => setShowGuidePopover((v) => !v)}
          >
            ガイド: {guide.type === "none" ? "なし" : guide.type === "chain" ? "鎖編みはじまり" : "輪はじまり"}
          </button>
          {showGuidePopover && (
            <div className="absolute right-0 top-full z-40 mt-1 w-64 rounded-md border border-peach/50 bg-white p-3 text-sm shadow-lg">
              <div className="mb-2 flex flex-col gap-1">
                {(["none", "chain", "ring"] as GuideType[]).map((t) => (
                  <label key={t} className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      className="accent-pink"
                      checked={guide.type === t}
                      onChange={() => setGuide({ type: t })}
                    />
                    {t === "none" ? "なし" : t === "chain" ? "鎖編みはじまり（直線）" : "輪はじまり（同心円）"}
                  </label>
                ))}
              </div>
              {guide.type === "chain" && (
                <div className="flex flex-col gap-1 border-t border-peach/30 pt-2 text-xs">
                  <label className="flex items-center justify-between gap-2">
                    長さ
                    <input
                      type="number"
                      className="w-20 rounded border border-peach/50 px-1 py-0.5"
                      value={guide.chain.length}
                      onChange={(e) => setGuide({ chain: { ...guide.chain, length: Number(e.target.value) || 0 } })}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2">
                    間隔
                    <input
                      type="number"
                      className="w-20 rounded border border-peach/50 px-1 py-0.5"
                      value={guide.chain.stitchSpacing}
                      onChange={(e) =>
                        setGuide({ chain: { ...guide.chain, stitchSpacing: Number(e.target.value) || 1 } })
                      }
                    />
                  </label>
                </div>
              )}
              {guide.type === "ring" && (
                <div className="flex flex-col gap-1 border-t border-peach/30 pt-2 text-xs">
                  <label className="flex items-center justify-between gap-2">
                    輪の数
                    <input
                      type="number"
                      className="w-20 rounded border border-peach/50 px-1 py-0.5"
                      value={guide.ring.ringCount}
                      onChange={(e) => setGuide({ ring: { ...guide.ring, ringCount: Number(e.target.value) || 1 } })}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2">
                    間隔（半径）
                    <input
                      type="number"
                      className="w-20 rounded border border-peach/50 px-1 py-0.5"
                      value={guide.ring.ringSpacing}
                      onChange={(e) => setGuide({ ring: { ...guide.ring, ringSpacing: Number(e.target.value) || 1 } })}
                    />
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          className="rounded-md border border-peach/60 px-3 py-1.5 text-sm text-ink hover:bg-cream/60"
          onClick={() => setCanvasBackground(canvasBackground === "dark" ? "light" : "dark")}
          title="配色の見え方を確認するためのキャンバス背景切り替え"
        >
          背景: {canvasBackground === "dark" ? "ダークグレー" : "白"}
        </button>

        <button
          className="rounded-md border border-peach/60 px-3 py-1.5 text-sm text-ink hover:bg-cream/60"
          onClick={() => setShowStraightDialog(true)}
        >
          直線の均等配置…
        </button>

        <button
          className="rounded-md border border-peach/60 px-3 py-1.5 text-sm text-ink hover:bg-cream/60"
          onClick={() => setShowRoundDialog(true)}
        >
          輪の等分配置…
        </button>

        <div className="flex flex-col items-center gap-0.5">
          <button
            className="rounded-md bg-pink px-3 py-1.5 text-sm text-white hover:bg-salmon"
            onClick={() => {
              if (exportRef.current) downloadSvgAsPng(exportRef.current, "crochet-chart.png", 2, !isPremium);
            }}
          >
            PNG書き出し
          </button>
          {!isPremium && (
            <span className="whitespace-nowrap text-[10px] text-ink/40" title="プレミアムプラン※準備中で透かしなしに">
              透かし入り
            </span>
          )}
        </div>

        <button
          className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          onClick={() => {
            if (confirm("編み図を初期化します。よろしいですか？")) resetProject();
          }}
        >
          初期化
        </button>
      </div>

      {showRoundDialog && <RoundArrayDialog onClose={() => setShowRoundDialog(false)} />}
      {showStraightDialog && <StraightArrayDialog onClose={() => setShowStraightDialog(false)} />}
      <ExportSvg ref={exportRef} />
    </div>
  );
}
