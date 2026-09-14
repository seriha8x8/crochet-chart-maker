"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { YarnPublicShell, useOptionalYarnUser } from "@/components/yarn/AuthGate";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getPhotoUrl } from "@/lib/yarn/photos";
import { listYarns, type YarnFacets } from "@/lib/yarn/data";
import { YARN_COLORS, YARN_MATERIALS, KNITTING_NEEDLE_SIZES, CROCHET_HOOK_SIZES, thicknessLabel } from "@/lib/yarn/constants";
import { CheckboxChips } from "@/components/yarn/CheckboxChips";
import { ColorSwatchChips } from "@/components/yarn/ColorSwatchChips";
import type { Yarn } from "@/lib/yarn/types";

const selectClass =
  "rounded-md border border-stone-300 px-2 py-1.5 text-sm focus:border-[#5BC8AC] focus:outline-none focus:ring-2 focus:ring-[#5BC8AC33]";

const EMPTY_FACETS: YarnFacets = { manufacturer: [] };

function YarnsListContent() {
  const user = useOptionalYarnUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const manufacturer = searchParams.get("manufacturer") ?? "";
  const color = searchParams.getAll("color");
  const material = searchParams.getAll("material");
  const thickness = searchParams.getAll("thickness");
  // Arrays from getAll() are a fresh reference every render — join into a stable string
  // for the effect's dependency list so it doesn't refetch on every unrelated re-render.
  const colorKey = color.join(",");
  const materialKey = material.join(",");
  const thicknessKey = thickness.join(",");

  const [yarns, setYarns] = useState<Yarn[] | null>(null);
  const [facets, setFacets] = useState<YarnFacets>(EMPTY_FACETS);
  const [error, setError] = useState<string | null>(null);
  // Closed by default so the filter form doesn't push the list down — but if a filter
  // is already applied (e.g. from a link or a page reload), open it so it's not hidden.
  const [filtersOpen, setFiltersOpen] = useState(
    () => q.length > 0 || manufacturer.length > 0 || color.length > 0 || material.length > 0 || thickness.length > 0,
  );
  const activeFilterCount =
    (q ? 1 : 0) + (manufacturer ? 1 : 0) + color.length + material.length + thickness.length;

  useEffect(() => {
    // Still resolving the browser session — wait rather than flashing the empty state.
    if (user === undefined) return;
    // Signed-out visitors have nothing registered yet — skip the fetch (there's no user id
    // to query with) and just show the empty state instead of spinning forever.
    if (user === null) {
      Promise.resolve().then(() => setYarns([]));
      return;
    }
    let cancelled = false;
    listYarns(user.id, { q, color, manufacturer, material, thickness })
      .then((result) => {
        if (cancelled) return;
        setYarns(result.yarns);
        setFacets(result.facets);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "読み込みに失敗しました");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- colorKey/materialKey/thicknessKey stand in for color/material/thickness
  }, [user, q, manufacturer, colorKey, materialKey, thicknessKey]);

  function submitFilters(formData: FormData) {
    const params = new URLSearchParams();
    const qVal = String(formData.get("q") ?? "").trim();
    if (qVal) params.set("q", qVal);
    const manufacturerVal = String(formData.get("manufacturer") ?? "").trim();
    if (manufacturerVal) params.set("manufacturer", manufacturerVal);
    for (const v of formData.getAll("color")) params.append("color", String(v));
    for (const v of formData.getAll("material")) params.append("material", String(v));
    for (const v of formData.getAll("thickness")) params.append("thickness", String(v));
    router.push(params.size > 0 ? `/yarn/yarns?${params}` : "/yarn/yarns");
  }

  const supabase = getSupabaseClient();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="border-l-4 border-[#5BC8AC] pl-3 text-xl font-semibold">毛糸一覧</h1>
        <Link
          href="/yarn/yarns/new"
          className="rounded-md bg-[#5BC8AC] px-4 py-2 text-sm font-medium text-white hover:bg-[#46A68D]"
        >
          + 毛糸を登録
        </Link>
      </div>

      {user && (
        <div className="rounded-lg border border-[#5BC8AC26] bg-white">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-[#3D6B5C]"
            aria-expanded={filtersOpen}
          >
            <span>
              検索・絞り込み
              {activeFilterCount > 0 && (
                <span className="ml-1.5 rounded-full bg-[#EAF7F2] px-2 py-0.5 text-xs font-medium text-[#2f6f61]">
                  {activeFilterCount}件指定中
                </span>
              )}
            </span>
            <ChevronIcon open={filtersOpen} />
          </button>

          {filtersOpen && (
            <form
              className="flex flex-col gap-4 border-t border-[#5BC8AC26] p-4"
              onSubmit={(e) => {
                e.preventDefault();
                submitFilters(new FormData(e.currentTarget));
              }}
            >
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1 text-xs text-stone-500">
                  フリーワード検索
                  <input type="text" name="q" defaultValue={q} placeholder="名前・メーカー名" className={selectClass} />
                </label>
                <label className="flex flex-col gap-1 text-xs text-stone-500">
                  メーカー
                  <select name="manufacturer" defaultValue={manufacturer} className={selectClass}>
                    <option value="">すべて</option>
                    {facets.manufacturer.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <fieldset className="flex flex-col gap-1.5 text-xs text-stone-500">
                <legend className="mb-0.5">色（複数選択可）</legend>
                <ColorSwatchChips name="color" options={YARN_COLORS} defaultValues={color} />
              </fieldset>

              <fieldset className="flex flex-col gap-1.5 text-xs text-stone-500">
                <legend className="mb-0.5">素材（複数選択可）</legend>
                <CheckboxChips name="material" options={[...YARN_MATERIALS]} defaultValues={material} />
              </fieldset>

              <fieldset className="flex flex-col gap-2 text-xs text-stone-500">
                <legend className="mb-0.5">太さ（複数選択可）</legend>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">棒針</span>
                  <CheckboxChips name="thickness" options={KNITTING_NEEDLE_SIZES} defaultValues={thickness} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">かぎ針</span>
                  <CheckboxChips name="thickness" options={CROCHET_HOOK_SIZES} defaultValues={thickness} />
                </div>
              </fieldset>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="rounded-md border border-[#F18D9E] px-3 py-1.5 text-sm text-stone-700 hover:bg-[#FCE7EA]"
                >
                  絞り込む
                </button>
                <Link href="/yarn/yarns" className="text-sm text-[#5BC8AC] underline">
                  リセット
                </Link>
              </div>
            </form>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {yarns === null ? (
        <p className="text-sm text-stone-500">読み込み中…</p>
      ) : yarns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#5BC8AC66] bg-white p-6 text-center text-sm text-stone-500">
          {user ? (
            <p>該当する毛糸がありません。</p>
          ) : (
            <>
              <p>まだ毛糸は登録されていません。</p>
              <p className="mt-1">
                「+ 毛糸を登録」を押すと、ログインまたは新規登録の画面に進みます。
              </p>
            </>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {yarns.map((yarn) => (
            <li key={yarn.id}>
              <Link
                href={`/yarn/yarns/detail?id=${yarn.id}`}
                className="flex flex-col gap-2 rounded-lg border border-[#5BC8AC26] bg-white p-4 hover:border-[#5BC8AC66] hover:bg-[#D8F0E8]/70"
              >
                {yarn.photo_url && supabase ? (
                  // eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer available
                  <img
                    src={getPhotoUrl(supabase, yarn.photo_url) ?? undefined}
                    alt={yarn.name}
                    className="h-32 w-full rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center rounded-md bg-[#D8F0E8] text-xs text-stone-400">
                    写真なし
                  </div>
                )}
                <span className="font-medium">{yarn.name}</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    ...yarn.color,
                    ...(yarn.manufacturer ? [yarn.manufacturer] : []),
                    ...yarn.material,
                    ...yarn.thickness.map(thicknessLabel),
                  ].map((tag, i) => (
                    <span key={`${tag}-${i}`} className="rounded-full bg-[#D8F0E8] px-2 py-0.5 text-xs text-stone-700">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="w-fit rounded-full bg-[#FCE7EA] px-2 py-0.5 text-xs font-medium text-[#B2536D]">
                  在庫: {yarn.stock_count}玉
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function YarnsPage() {
  return (
    <YarnPublicShell>
      <Suspense fallback={<p className="px-4 py-10 text-center text-sm text-stone-500">読み込み中…</p>}>
        <YarnsListContent />
      </Suspense>
    </YarnPublicShell>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="shrink-0 transition-transform"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <path d="M4 6l4 4 4-4" stroke="#5BC8AC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
