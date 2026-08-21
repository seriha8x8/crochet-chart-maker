"use client";

import { useChartStore } from "@/store/chartStore";
import { SYMBOL_DEFS, DEFAULT_SYMBOL_COLOR } from "@/lib/symbols/definitions";
import { centroid, getFootPoint } from "@/lib/symbols/geometry";
import type { AttachType } from "@/types/chart";

export function PropertiesPanel() {
  const symbols = useChartStore((s) => s.symbols);
  const selectedIds = useChartStore((s) => s.selectedIds);
  const parentLinkTargetId = useChartStore((s) => s.parentLinkTargetId);
  const startParentLink = useChartStore((s) => s.startParentLink);
  const cancelParentLink = useChartStore((s) => s.cancelParentLink);
  const applyAttachSnap = useChartStore((s) => s.applyAttachSnap);
  const setAttachType = useChartStore((s) => s.setAttachType);
  const setRotation = useChartStore((s) => s.setRotation);
  const setSymbolColor = useChartStore((s) => s.setSymbolColor);
  const rotateSymbols = useChartStore((s) => s.rotateSymbols);
  const orbitGroup = useChartStore((s) => s.orbitGroup);
  const pushHistory = useChartStore((s) => s.pushHistory);
  const deleteSymbols = useChartStore((s) => s.deleteSymbols);
  const toggleParent = useChartStore((s) => s.toggleParent);
  const groupSelection = useChartStore((s) => s.groupSelection);
  const ungroupSelection = useChartStore((s) => s.ungroupSelection);
  const duplicateMirrored = useChartStore((s) => s.duplicateMirrored);

  if (parentLinkTargetId) {
    const target = symbols.find((s) => s.id === parentLinkTargetId);
    if (!target) {
      cancelParentLink();
      return null;
    }
    return (
      <div className="flex flex-col gap-3 p-3">
        <h2 className="text-xs font-semibold text-ink/50">接続する記号を選択</h2>
        <p className="rounded-md bg-purple-50 p-2 text-xs text-purple-700">
          前段の記号をクリックして選択／解除してください（複数選択可）。
        </p>
        <div className="text-sm">
          選択中の親: <span className="font-medium">{target.parentIds.length}個</span>
        </div>
        <ul className="max-h-32 overflow-auto text-xs">
          {target.parentIds.map((pid) => {
            const p = symbols.find((s) => s.id === pid);
            if (!p) return null;
            return (
              <li key={pid} className="flex items-center justify-between rounded px-1 py-0.5 hover:bg-cream/60">
                <span>{SYMBOL_DEFS[p.type].label}</span>
                <button className="text-red-500" onClick={() => toggleParent(pid)}>
                  解除
                </button>
              </li>
            );
          })}
        </ul>
        <button
          className="rounded-md bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-700"
          onClick={() => {
            applyAttachSnap(target.id);
            cancelParentLink();
          }}
        >
          完了して位置をスナップ
        </button>
        <button className="rounded-md border border-peach/60 px-3 py-1.5 text-sm text-ink hover:bg-cream/60" onClick={cancelParentLink}>
          キャンセル
        </button>
      </div>
    );
  }

  if (selectedIds.length === 0) {
    return (
      <div className="p-3 text-xs text-ink/40">
        記号を選択するとプロパティが表示されます。
      </div>
    );
  }

  if (selectedIds.length > 1) {
    const selected = symbols.filter((s) => selectedIds.includes(s.id));
    const isOneGroup =
      selected.length > 0 &&
      !!selected[0].groupId &&
      selected.every((s) => s.groupId === selected[0].groupId);
    const rotateAsGroup = (deltaDeg: number) => {
      const pivot = centroid(selected.map(getFootPoint));
      pushHistory();
      orbitGroup(selectedIds, deltaDeg, pivot);
    };
    return (
      <div className="flex flex-col gap-3 p-3">
        <h2 className="text-xs font-semibold text-ink/50">{selectedIds.length}個選択中</h2>
        <p className="text-[11px] text-ink/40">かたまりの中心を軸に、位置も記号の向きもまとめて回転します。</p>
        <div className="flex gap-2">
          <button
            className="flex-1 rounded-md border border-peach/60 px-2 py-1.5 text-sm text-ink hover:bg-cream/60"
            onClick={() => rotateAsGroup(-15)}
          >
            ⟲ 15°
          </button>
          <button
            className="flex-1 rounded-md border border-peach/60 px-2 py-1.5 text-sm text-ink hover:bg-cream/60"
            onClick={() => rotateAsGroup(15)}
          >
            ⟳ 15°
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs text-ink/70">
          色
          <input
            type="color"
            className="h-7 w-7 cursor-pointer rounded border border-peach/60 p-0.5"
            value={selected[0].color ?? DEFAULT_SYMBOL_COLOR}
            onChange={(e) => setSymbolColor(selectedIds, e.target.value)}
          />
          <button
            className="text-[11px] text-ink/40 hover:text-pink"
            onClick={() => setSymbolColor(selectedIds, null)}
          >
            デフォルトに戻す
          </button>
        </label>

        {isOneGroup ? (
          <button
            className="rounded-md border border-peach/60 px-3 py-1.5 text-sm text-ink hover:bg-cream/60"
            onClick={ungroupSelection}
          >
            グループ解除
          </button>
        ) : (
          <button
            className="rounded-md border border-peach/60 px-3 py-1.5 text-sm text-ink hover:bg-cream/60"
            onClick={groupSelection}
          >
            グループ化
          </button>
        )}

        <div className="flex flex-col gap-1.5 rounded-md border border-peach/50 p-2">
          <span className="text-xs font-semibold text-ink/50">複製して反転</span>
          <p className="text-[11px] text-ink/40">半分作ったら反転して複製し、隣に自動で並べます。位置は後から調整できます。</p>
          <div className="flex gap-2">
            <button
              className="flex-1 rounded-md border border-peach/60 px-2 py-1.5 text-sm text-ink hover:bg-cream/60"
              onClick={() => duplicateMirrored(selectedIds, "horizontal")}
            >
              左右反転複製
            </button>
            <button
              className="flex-1 rounded-md border border-peach/60 px-2 py-1.5 text-sm text-ink hover:bg-cream/60"
              onClick={() => duplicateMirrored(selectedIds, "vertical")}
            >
              上下反転複製
            </button>
          </div>
        </div>

        <button
          className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          onClick={() => deleteSymbols(selectedIds)}
        >
          削除
        </button>
      </div>
    );
  }

  const symbol = symbols.find((s) => s.id === selectedIds[0]);
  if (!symbol) return null;
  const def = SYMBOL_DEFS[symbol.type];

  return (
    <div className="flex flex-col gap-3 p-3">
      <h2 className="text-xs font-semibold text-ink/50">記号プロパティ</h2>
      <div className="text-sm font-medium text-ink">{def.label}</div>

      <label className="flex flex-col gap-1 text-xs text-ink/70">
        回転角度
        <div className="flex items-center gap-1">
          <input
            type="number"
            className="w-full rounded border border-peach/60 px-2 py-1 text-sm text-ink"
            value={Math.round(symbol.rotation)}
            onChange={(e) => setRotation(symbol.id, Number(e.target.value) || 0)}
          />
          <span>°</span>
        </div>
        <div className="flex gap-1">
          <button className="flex-1 rounded border border-peach/60 py-1 text-ink hover:bg-cream/60" onClick={() => rotateSymbols([symbol.id], -90)}>
            -90°
          </button>
          <button className="flex-1 rounded border border-peach/60 py-1 text-ink hover:bg-cream/60" onClick={() => rotateSymbols([symbol.id], -15)}>
            -15°
          </button>
          <button className="flex-1 rounded border border-peach/60 py-1 text-ink hover:bg-cream/60" onClick={() => rotateSymbols([symbol.id], 15)}>
            +15°
          </button>
          <button className="flex-1 rounded border border-peach/60 py-1 text-ink hover:bg-cream/60" onClick={() => rotateSymbols([symbol.id], 90)}>
            +90°
          </button>
        </div>
      </label>

      <label className="flex items-center gap-2 text-xs text-ink/70">
        色
        <input
          type="color"
          className="h-7 w-7 cursor-pointer rounded border border-peach/60 p-0.5"
          value={symbol.color ?? DEFAULT_SYMBOL_COLOR}
          onChange={(e) => setSymbolColor([symbol.id], e.target.value)}
        />
        {symbol.color && (
          <button
            className="text-[11px] text-ink/40 hover:text-pink"
            onClick={() => setSymbolColor([symbol.id], null)}
          >
            デフォルトに戻す
          </button>
        )}
      </label>

      <div className="flex flex-col gap-1.5 rounded-md border border-peach/50 p-2">
        <span className="text-xs font-semibold text-ink/50">前段との接続</span>
        <div className="text-xs text-ink/70">
          親記号: <span className="font-medium">{symbol.parentIds.length}個</span>
        </div>
        <button
          className="rounded-md border border-purple-300 bg-purple-50 px-2 py-1 text-xs text-purple-700 hover:bg-purple-100"
          onClick={() => startParentLink(symbol.id)}
        >
          接続する記号を選択…
        </button>

        <div className="mt-1 flex flex-col gap-1 text-xs">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="attachType"
              className="accent-pink"
              checked={symbol.attachType === "stitch"}
              onChange={() => {
                setAttachType(symbol.id, "stitch" as AttachType);
                applyAttachSnap(symbol.id);
              }}
            />
            目に編む（頭の真上）
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="attachType"
              className="accent-pink"
              checked={symbol.attachType === "space"}
              onChange={() => {
                setAttachType(symbol.id, "space" as AttachType);
                applyAttachSnap(symbol.id);
              }}
            />
            束に編む（隙間の中央）
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="attachType"
              className="accent-pink"
              checked={symbol.attachType === "pullUpFront"}
              onChange={() => {
                setAttachType(symbol.id, "pullUpFront" as AttachType);
                applyAttachSnap(symbol.id);
              }}
            />
            引き上げる（表）
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="attachType"
              className="accent-pink"
              checked={symbol.attachType === "pullUpBack"}
              onChange={() => {
                setAttachType(symbol.id, "pullUpBack" as AttachType);
                applyAttachSnap(symbol.id);
              }}
            />
            引き上げる（裏）
          </label>
        </div>
      </div>

      <button
        className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
        onClick={() => deleteSymbols([symbol.id])}
      >
        削除
      </button>
    </div>
  );
}
