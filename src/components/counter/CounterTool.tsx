"use client";

import { useRef, useState } from "react";
import { useCounterStore, COUNTER_PRESETS, MAX_COUNTERS, type KnittingCounter } from "@/store/counterStore";

/** Cycled per counter so multiple counters (段数/色1/色2…) stay visually distinct.
 *  Written as literal strings (not built from a template) so Tailwind's static
 *  scanner can see and generate the active: variants. */
const ACCENT_CLASSES = [
  "bg-[#5BC8AC] active:bg-[#3FA88C]", // ターコイズ
  "bg-[#F18D9E] active:bg-[#D96B7D]", // ピンクチューリップ
  "bg-[#E6D72A] active:bg-[#C3B724]", // カナリアイエロー
  "bg-[#98DBC6] active:bg-[#81BAA8]", // アクアマリン
] as const;

function formatLastUpdated(ms: number | null) {
  if (ms === null) return "まだカウントしていません";
  const d = new Date(ms);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `最終更新 ${h}:${m}`;
}

export function CounterTool() {
  const counters = useCounterStore((s) => s.counters);
  const addCounter = useCounterStore((s) => s.addCounter);
  const removeCounter = useCounterStore((s) => s.removeCounter);
  const renameCounter = useCounterStore((s) => s.renameCounter);
  const increment = useCounterStore((s) => s.increment);
  const decrement = useCounterStore((s) => s.decrement);
  const resetOne = useCounterStore((s) => s.resetOne);
  const resetAll = useCounterStore((s) => s.resetAll);

  const [confirmingResetAll, setConfirmingResetAll] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const atMax = counters.length >= MAX_COUNTERS;

  function handleResetAllClick() {
    if (!confirmingResetAll) {
      setConfirmingResetAll(true);
      confirmTimerRef.current = setTimeout(() => setConfirmingResetAll(false), 3000);
      return;
    }
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    setConfirmingResetAll(false);
    resetAll();
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 sm:px-0" style={{ WebkitTapHighlightColor: "transparent" }}>
      <h1 className="text-2xl font-bold" style={{ color: "#3D6B5C" }}>
        カウンター
      </h1>
      <p className="mt-1 text-sm leading-relaxed" style={{ color: "#7FA99A" }}>
        カウンターは最大{MAX_COUNTERS}個まで増やせます。名前は自由に変更できます（例：段数、目数、●●色 など）。
      </p>

      <p className="mt-3 rounded-lg px-3 py-2.5 text-xs leading-relaxed" style={{ backgroundColor: "#FFF7EC", color: "#8a7150" }}>
        カウントはこの端末のブラウザ内だけに保存されます。ログインしていても、別の端末やブラウザで開いた場合は引き継がれませんのでご注意ください。
      </p>

      <div
        className="my-5 h-1.5 rounded-full opacity-70"
        style={{
          backgroundImage: "repeating-linear-gradient(-45deg, #CDEBE1, #CDEBE1 4px, transparent 4px, transparent 10px)",
        }}
      />

      <div className="flex flex-col gap-4">
        {counters.map((counter, i) => (
          <CounterCard
            key={counter.id}
            counter={counter}
            accentClass={ACCENT_CLASSES[i % ACCENT_CLASSES.length]}
            onRename={(name) => renameCounter(counter.id, name)}
            onIncrement={() => increment(counter.id)}
            onDecrement={() => decrement(counter.id)}
            onReset={() => resetOne(counter.id)}
            // The first counter always stays, so only later ones get a delete button.
            onDelete={i === 0 ? undefined : () => removeCounter(counter.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addCounter}
        disabled={atMax}
        className="mt-5 w-full rounded-2xl border-[1.5px] border-dashed bg-white px-4 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        style={{ borderColor: "#CDEBE1", color: "#3D6B5C" }}
      >
        {atMax ? "これ以上は追加できません（最大8個）" : "＋ カウンターを追加"}
      </button>

      <div className="mt-12 flex justify-center border-t pt-6" style={{ borderColor: "#CDEBE1" }}>
        <button
          type="button"
          id="reset-all-btn"
          onTouchStart={() => {}}
          onClick={handleResetAllClick}
          className="flex min-h-[52px] min-w-[190px] flex-col items-center justify-center gap-0.5 rounded-xl border px-5 py-3 text-center text-sm font-semibold"
          style={
            confirmingResetAll
              ? { backgroundColor: "#FBF6D8", color: "#9A7F12", borderColor: "#E6D72A" }
              : { backgroundColor: "#FDEEF1", color: "#D96B7D", borderColor: "#F18D9E" }
          }
        >
          {confirmingResetAll ? (
            <>
              <span>本当にリセットしますか？</span>
              <span className="text-[10px] opacity-80">※取り消せません</span>
            </>
          ) : (
            "すべてリセット"
          )}
        </button>
      </div>

      <p className="mt-6 text-center text-[11px] leading-relaxed" style={{ color: "#7FA99A" }}>
        個別のリセットは各カウンター内の「リセット」から可能です。
      </p>
    </div>
  );
}

function CounterCard({
  counter,
  accentClass,
  onRename,
  onIncrement,
  onDecrement,
  onReset,
  onDelete,
}: {
  counter: KnittingCounter;
  accentClass: string;
  onRename: (name: string) => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onReset: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white p-4" style={{ border: "1px solid #CDEBE1" }}>
      <div className="flex items-start gap-2">
        <input
          value={counter.name}
          onChange={(e) => onRename(e.target.value)}
          maxLength={12}
          className="w-full min-w-0 flex-1 border-b border-dashed border-[#CDEBE1] bg-transparent pb-1.5 text-[15px] font-semibold outline-none focus:border-[#E6D72A]"
          style={{ color: "#3D6B5C" }}
        />
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="shrink-0 whitespace-nowrap p-1 text-[11px]"
            style={{ color: "#9AA5A2" }}
          >
            削除
          </button>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {COUNTER_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onRename(preset)}
            className="rounded-full border px-2.5 py-1 text-xs active:bg-[#CDEBE1]"
            style={{ borderColor: "#CDEBE1", backgroundColor: "#EAF7F2", color: "#7FA99A" }}
          >
            {preset}
          </button>
        ))}
      </div>

      <button
        type="button"
        onTouchStart={() => {}}
        onClick={onIncrement}
        className={`mt-3 flex w-full select-none flex-col items-center gap-0.5 rounded-2xl py-5 ${accentClass}`}
      >
        <span className="text-[42px] leading-none font-bold tabular-nums" style={{ color: "#1F3B36" }}>
          {counter.count}
        </span>
        <span className="text-[11px] opacity-70" style={{ color: "#1F3B36" }}>
          タップで+1
        </span>
      </button>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onDecrement}
          className="rounded-xl border px-4 py-2 text-xs active:bg-[#CDEBE1]"
          style={{ borderColor: "#CDEBE1", color: "#7FA99A" }}
        >
          −1
        </button>
        <span className="text-[11px]" style={{ color: "#7FA99A" }}>
          {formatLastUpdated(counter.lastUpdated)}
        </span>
      </div>

      <div className="mt-1.5 flex justify-end">
        <button
          type="button"
          onClick={onReset}
          className="p-1 text-[11px] underline underline-offset-2"
          style={{ color: "#7FA99A" }}
        >
          リセット
        </button>
      </div>
    </div>
  );
}
