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

/** Mirrors functions/_lib/rakuten.ts's YarnProduct — duplicated rather than imported
 *  since that file ships in the separate Cloudflare Pages Functions build, not this app. */
type YarnProduct = { name: string; price: number; url: string; imageUrl: string | null; shopName: string };
type YarnSuggestions = Record<string, YarnProduct[]>;

function hexKey(hex: string): string {
  return hex.replace("#", "").toUpperCase();
}

export function ColorMatchingTool() {
  const [selectedColor, setSelectedColor] = useState<SelectedColor | null>(null);
  const [pickerHex, setPickerHex] = useState("#5BC8AC");
  const [pickerActive, setPickerActive] = useState(false);
  const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);
  const [result, setResult] = useState<{ base: SelectedColor; palette: [HSL, HSL, HSL, HSL] } | null>(null);

  const [suggestions, setSuggestions] = useState<YarnSuggestions | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (result) resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  // Look up "近い毛糸" for the 4 generated colors whenever a new palette is produced.
  useEffect(() => {
    if (!result) {
      Promise.resolve().then(() => setSuggestions(null));
      return;
    }
    let cancelled = false;
    Promise.resolve().then(() => {
      setSuggestionsLoading(true);
      setSuggestions(null);
    });
    const colors = result.palette.map((c) => hexKey(colorHex(c))).join(",");
    fetch(`/api/yarn-suggestions?colors=${colors}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("request failed"))))
      .then((data: { results: { hex: string; products: YarnProduct[] }[] }) => {
        if (cancelled) return;
        const map: YarnSuggestions = {};
        for (const r of data.results) map[r.hex] = r.products;
        setSuggestions(map);
      })
      .catch(() => {
        // Treated the same as "no products for this color" per color below, rather than
        // showing a scary error — the palette itself is still fully usable either way.
        if (!cancelled) setSuggestions({});
      })
      .finally(() => {
        if (!cancelled) setSuggestionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
              <span className="text-[11px]" style={selected ? { color: "#3D6B5C", fontWeight: 700 } : { color: "#7FA99A" }}>
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
        {result ? "この内容で配色を見る" : "配色を見る"}
      </button>

      {result && (
        <>
          <div
            className="my-6 h-1.5 rounded-full opacity-70"
            style={{
              backgroundImage: "repeating-linear-gradient(-45deg, #CDEBE1, #CDEBE1 4px, transparent 4px, transparent 10px)",
            }}
          />
          <div ref={resultsRef} className="flex flex-col gap-3 scroll-mt-4">
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
              <div className="flex flex-col gap-2.5">
                {result.palette.map((c, i) => {
                  const hex = colorHex(c);
                  const products = suggestions?.[hexKey(hex)];
                  return (
                    <div key={i} className="rounded-xl p-2.5" style={{ backgroundColor: "#EAF7F2", border: "1px solid #CDEBE1" }}>
                      <div className="mb-2 flex items-center gap-1.5">
                        <span
                          className="h-[14px] w-[14px] shrink-0 rounded-full"
                          style={{ backgroundColor: hex, border: "1px solid rgba(31,59,54,0.15)" }}
                        />
                        <span className="text-[10.5px]" style={{ color: "#7FA99A" }}>
                          {hex}に近い毛糸
                        </span>
                      </div>

                      {suggestionsLoading ? (
                        <p className="text-[11px]" style={{ color: "#7FA99A" }}>
                          検索中…
                        </p>
                      ) : !products || products.length === 0 ? (
                        <p className="text-[11px]" style={{ color: "#7FA99A" }}>
                          近い商品が見つかりませんでした
                        </p>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {products.map((p, pi) => (
                            <a
                              key={pi}
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer sponsored"
                              className="flex items-center gap-2 rounded-lg bg-white p-1.5 hover:bg-[#FCE7EA]"
                              style={{ border: "1px solid #CDEBE1" }}
                            >
                              {p.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element -- external Rakuten product image, not an optimizable local asset
                                <img src={p.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />
                              ) : (
                                <div className="h-12 w-12 shrink-0 rounded-md" style={{ backgroundColor: "#D8F0E8" }} />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-[11px] leading-snug" style={{ color: "#3D6B5C" }}>
                                  {p.name}
                                </p>
                                <p className="mt-0.5 text-[11px] font-bold" style={{ color: "#B2536D" }}>
                                  ¥{p.price.toLocaleString()}
                                </p>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] leading-relaxed" style={{ color: "#7FA99A" }}>
                商品情報は楽天市場の検索結果です。リンクは提携リンクを含みます。
              </p>
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
        </>
      )}
    </div>
  );
}
