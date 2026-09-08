"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RequireYarnUser, useYarnUser } from "@/components/yarn/AuthGate";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getPhotoUrl } from "@/lib/yarn/photos";
import { listYarns, type YarnFacets } from "@/lib/yarn/data";
import type { Yarn } from "@/lib/yarn/types";

const selectClass =
  "rounded-md border border-stone-300 px-2 py-1.5 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200";

const FILTER_KEYS = ["q", "color", "manufacturer", "material", "thickness"] as const;

const EMPTY_FACETS: YarnFacets = { color: [], manufacturer: [], material: [], thickness: [] };

function YarnsListContent() {
  const user = useYarnUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const color = searchParams.get("color") ?? "";
  const manufacturer = searchParams.get("manufacturer") ?? "";
  const material = searchParams.get("material") ?? "";
  const thickness = searchParams.get("thickness") ?? "";

  const [yarns, setYarns] = useState<Yarn[] | null>(null);
  const [facets, setFacets] = useState<YarnFacets>(EMPTY_FACETS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, [user.id, q, color, manufacturer, material, thickness]);

  function submitFilters(formData: FormData) {
    const params = new URLSearchParams();
    for (const key of FILTER_KEYS) {
      const value = String(formData.get(key) ?? "").trim();
      if (value) params.set(key, value);
    }
    router.push(params.size > 0 ? `/yarn/yarns?${params}` : "/yarn/yarns");
  }

  const supabase = getSupabaseClient();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="border-l-4 border-rose-400 pl-3 text-xl font-semibold">毛糸一覧</h1>
        <Link
          href="/yarn/yarns/new"
          className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          + 毛糸を登録
        </Link>
      </div>

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          submitFilters(new FormData(e.currentTarget));
        }}
      >
        <label className="flex flex-col gap-1 text-xs text-stone-500">
          フリーワード検索
          <input type="text" name="q" defaultValue={q} placeholder="名前・メーカー名" className={selectClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-stone-500">
          色
          <select name="color" defaultValue={color} className={selectClass}>
            <option value="">すべて</option>
            {facets.color.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
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
        <label className="flex flex-col gap-1 text-xs text-stone-500">
          素材
          <select name="material" defaultValue={material} className={selectClass}>
            <option value="">すべて</option>
            {facets.material.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-stone-500">
          太さ
          <select name="thickness" defaultValue={thickness} className={selectClass}>
            <option value="">すべて</option>
            {facets.thickness.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md border border-pink-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-pink-50"
        >
          絞り込む
        </button>
        <Link href="/yarn/yarns" className="text-sm text-rose-600 underline">
          リセット
        </Link>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {yarns === null ? (
        <p className="text-sm text-stone-500">読み込み中…</p>
      ) : yarns.length === 0 ? (
        <p className="text-sm text-stone-500">該当する毛糸がありません。</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {yarns.map((yarn) => (
            <li key={yarn.id}>
              <Link
                href={`/yarn/yarns/detail?id=${yarn.id}`}
                className="flex flex-col gap-2 rounded-lg border border-rose-100 p-4 hover:border-rose-300 hover:bg-rose-50/70"
              >
                {yarn.photo_url && supabase ? (
                  // eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer available
                  <img
                    src={getPhotoUrl(supabase, yarn.photo_url) ?? undefined}
                    alt={yarn.name}
                    className="h-32 w-full rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center rounded-md bg-pink-50 text-xs text-stone-400">
                    写真なし
                  </div>
                )}
                <span className="font-medium">{yarn.name}</span>
                <div className="flex flex-wrap gap-1">
                  {[yarn.color, yarn.manufacturer, yarn.material, yarn.thickness]
                    .filter(Boolean)
                    .map((tag) => (
                      <span key={tag} className="rounded-full bg-pink-100 px-2 py-0.5 text-xs text-stone-700">
                        {tag}
                      </span>
                    ))}
                </div>
                <span className="w-fit rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
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
    <RequireYarnUser>
      <Suspense fallback={<p className="px-4 py-10 text-center text-sm text-stone-500">読み込み中…</p>}>
        <YarnsListContent />
      </Suspense>
    </RequireYarnUser>
  );
}
