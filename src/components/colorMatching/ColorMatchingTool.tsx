"use client";

import { useEffect, useRef, useState } from "react";
import { BASE_COLORS, MOODS, genPalette, hslToHex, hexToHsl, type HSL, type SelectedColor } from "@/lib/colorMatching";

const PATTERN_INDEXES: [number, number][] = [
  [0, 1], // A, B
  [2, 3], // C, D
  [1, 3], // B, D
];

function colorHex(c: HSL & { hex?: string }): string {
  return c.hex ?? hslToHex(c.h, c.s, c.l);
}

export function ColorMatchingTool() {
  const [selectedColor, setSelectedColor] = useState<SelectedColor | null>(null);
  const [pickerHex, setPickerHex] = useState("#5BC8AC");
  const [pickerActive, setPickerActive] = useState(false);
  const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);
  const [result, setResult] = useState<{ base: SelectedColor; palette: [HSL, HSL, HSL, HSL] } | null>(null);

  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (result) resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  function selectBaseColor(c: (typeof BASE_COLORS)[number]) {
    setSelectedColor({ id: c.id, label: c.label, h: c.h, s: c.s, l: c.l });
    setPickerActive(false);
  }

  function handlePickerChange(hex: string) {
    setPickerHex(hex);
    const hsl = hexToHsl(hex);
    setSelectedColor({ id: "custom", label: hex, hex, ...hsl });
    setPickerActive(true);
  }

  const selectedMood = MOODS.find((m) => m.id === selectedMoodId) ?? null;
  const canGo = selectedColor !== null && selectedMood !== null;

  function handleGo() {
    if (!selectedColor || !selectedMood) return;
    setResult({ base: selectedColor, palette: genPalette(selectedColor, selectedMood) });
  }

  function handleRetry() {
    setResult(null);
    setSelectedColor(null);
    setSelectedMoodId(null);
    setPickerActive(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 sm:px-0" style={{ WebkitTapHighlightColor: "transparent" }}>
      <style>{`
        .cm-color-picker::-webkit-color-swatch-wrapper { padding: 0; border-radius: 50%; overflow: hidden; }
        .cm-color-picker::-webkit-color-swatch { border: 2px solid rgba(61,107,92,0.15); border-radius: 50%; }
      `}</style>

      <h1 className="text-2xl font-bold" style={{ color: "#3D6B5C" }}>
        配色マッチング
      </h1>
      <p className="mt-1 text-sm leading-relaxed" style={{ color: "#7FA99A" }}>
        お手持ちの毛糸に近い色と、仕上げたい雰囲気を選ぶと、合わせやすい3色の配色を3パターン提案します。
      </p>

      <div
        className="my-5 h-1.5 rounded-full opacity-70"
        style={{
          backgroundImage: "repeating-linear-gradient(-45deg, #CDEBE1, #CDEBE1 4px, transparent 4px, transparent 10px)",
        }}
      />

      {!result ? (
        <>
          <p className="mb-3 text-sm font-bold" style={{ color: "#3D6B5C" }}>
            ① お手持ちの毛糸に近い色を選んでください
          </p>
          <div className="mb-3.5 grid grid-cols-4 gap-3">
            {BASE_COLORS.map((c) => {
              const selected = !pickerActive && selectedColor?.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectBaseColor(c)}
                  className="flex flex-col items-center gap-1.5 rounded-xl p-1"
                >
                  <span
                    className="h-11 w-11 rounded-full"
                    style={{
                      backgroundColor: hslToHex(c.h, c.s, c.l),
                      border: selected ? "3px solid #3FA88C" : "2px solid rgba(31,59,54,0.12)",
                      boxShadow: selected ? "0 0 0 3px rgba(91,200,172,0.25)" : "none",
                    }}
                  />
                  <span
                    className="text-[11px]"
                    style={selected ? { color: "#3D6B5C", fontWeight: 700 } : { color: "#7FA99A" }}
                  >
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            className="mb-6 flex items-center gap-2.5 rounded-2xl px-3 py-2.5"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #CDEBE1" }}
          >
            <span className="text-xs" style={{ color: "#7FA99A" }}>
              またはカラーピッカーで選ぶ
            </span>
            <input
              type="color"
              value={pickerHex}
              onChange={(e) => handlePickerChange(e.target.value.toUpperCase())}
              className="cm-color-picker h-10 w-10 shrink-0 cursor-pointer rounded-full border-none bg-transparent p-0"
            />
            <span className="ml-auto text-xs font-bold" style={{ color: "#3D6B5C" }}>
              {pickerActive ? pickerHex : ""}
            </span>
          </div>

          <p className="mb-3 text-sm font-bold" style={{ color: "#3D6B5C" }}>
            ② 仕上げたい雰囲気を選んでください
          </p>
          <div className="mb-6 flex flex-wrap gap-2">
            {MOODS.map((m) => {
              const selected = m.id === selectedMoodId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMoodId(m.id)}
                  className="rounded-full px-4 py-2 text-sm"
                  style={
                    selected
                      ? { backgroundColor: "#5BC8AC", color: "#FFFFFF", border: "1px solid #3FA88C", fontWeight: 700 }
                      : { backgroundColor: "#FFFFFF", color: "#3D6B5C", border: "1px solid #CDEBE1" }
                  }
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!canGo}
            onClick={handleGo}
            className="w-full rounded-2xl py-4 text-[15px] font-bold disabled:cursor-default"
            style={canGo ? { backgroundColor: "#5BC8AC", color: "#FFFFFF" } : { backgroundColor: "#CDEBE1", color: "#7FA99A" }}
          >
            配色を見る
          </button>
        </>
      ) : (
        <div ref={resultsRef} className="flex flex-col gap-3">
          {PATTERN_INDEXES.map(([i1, i2], patternIndex) => (
            <div key={patternIndex} className="rounded-2xl bg-white p-4" style={{ border: "1px solid #CDEBE1" }}>
              <p className="mb-2.5 text-xs" style={{ color: "#7FA99A" }}>
                パターン{patternIndex + 1}
              </p>
              <div className="flex justify-center gap-4">
                {[result.base, result.palette[i1], result.palette[i2]].map((c, i) => (
                  <div key={i} className="flex w-[78px] flex-col items-center gap-1.5">
                    <span
                      className="h-[50px] w-[50px] rounded-full"
                      style={{ backgroundColor: colorHex(c), border: "2px solid rgba(31,59,54,0.1)" }}
                    />
                    <span className="text-xs font-bold" style={{ color: "#3D6B5C" }}>
                      {colorHex(c)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-1">
            <p className="mb-2.5 text-sm font-bold" style={{ color: "#7FA99A" }}>
              この配色に近い毛糸
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {result.palette.map((c, i) => {
                const hex = colorHex(c);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-xl px-2.5 py-2.5"
                    style={{ backgroundColor: "#EAF7F2", border: "1px dashed #CDEBE1" }}
                  >
                    <span
                      className="h-[22px] w-[22px] shrink-0 rounded-full"
                      style={{ backgroundColor: hex, border: "1px solid rgba(31,59,54,0.15)" }}
                    />
                    <span className="text-[10.5px] leading-snug" style={{ color: "#7FA99A" }}>
                      {hex}に近い毛糸を見る（準備中）
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-2 flex justify-center">
            <button
              type="button"
              onClick={handleRetry}
              className="p-1.5 text-xs underline underline-offset-2"
              style={{ color: "#7FA99A" }}
            >
              選び直す
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
