"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { YarnPublicShell, useOptionalYarnUser } from "@/components/yarn/AuthGate";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getPhotoUrl } from "@/lib/yarn/photos";
import { listProjects } from "@/lib/yarn/data";
import { PROJECT_GENRES } from "@/lib/yarn/constants";
import type { Project } from "@/lib/yarn/types";

const selectClass =
  "rounded-md border border-stone-300 px-2 py-1.5 text-sm focus:border-[#5BC8AC] focus:outline-none focus:ring-2 focus:ring-[#5BC8AC33]";

function WorksListContent() {
  const user = useOptionalYarnUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const genre = searchParams.get("genre") ?? "";

  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Still resolving the browser session — wait rather than flashing the empty state.
    if (user === undefined) return;
    // Signed-out visitors have nothing registered yet — skip the fetch (there's no user id
    // to query with) and just show the empty state instead of spinning forever.
    if (user === null) {
      Promise.resolve().then(() => setProjects([]));
      return;
    }
    let cancelled = false;
    listProjects(user.id, { genre: genre || undefined })
      .then((data) => {
        if (!cancelled) setProjects(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "読み込みに失敗しました");
      });
    return () => {
      cancelled = true;
    };
  }, [user, genre]);

  function updateGenre(value: string) {
    router.push(value ? `/works?genre=${encodeURIComponent(value)}` : "/works");
  }

  const supabase = getSupabaseClient();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="border-l-4 border-[#5BC8AC] pl-3 text-xl font-semibold">作品一覧</h1>
        <Link
          href="/works/new"
          className="rounded-md bg-[#5BC8AC] px-4 py-2 text-sm font-medium text-white hover:bg-[#46A68D]"
        >
          + 作品メモを登録
        </Link>
      </div>

      {user && (
        <label className="flex w-fit flex-col gap-1 text-xs text-stone-500">
          ジャンルで絞り込む
          <select value={genre} onChange={(e) => updateGenre(e.target.value)} className={selectClass}>
            <option value="">すべて</option>
            {PROJECT_GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {projects === null ? (
        <p className="text-sm text-stone-500">読み込み中…</p>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#5BC8AC66] bg-white p-6 text-center text-sm text-stone-500">
          {user ? (
            <p>{genre ? "該当する作品メモがありません。" : "まだ作品メモがありません。"}</p>
          ) : (
            <>
              <p>まだ作品メモは登録されていません。</p>
              <p className="mt-1">
                「+ 作品メモを登録」を押すと、ログインまたは新規登録の画面に進みます。
              </p>
            </>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/works/detail?id=${project.id}`}
                className="flex flex-col gap-2 rounded-lg border border-[#5BC8AC26] bg-white p-4 hover:border-[#5BC8AC66] hover:bg-[#D8F0E8]/70"
              >
                {project.photo_url && supabase ? (
                  // eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer available
                  <img
                    src={getPhotoUrl(supabase, project.photo_url) ?? undefined}
                    alt={project.title}
                    className="h-32 w-full rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center rounded-md bg-[#D8F0E8] text-xs text-stone-400">
                    写真なし
                  </div>
                )}
                <span className="font-medium">{project.title}</span>
                <div className="flex flex-wrap gap-1">
                  {project.genre && (
                    <span className="w-fit rounded-full bg-[#FCE7EA] px-2 py-0.5 text-xs text-[#B2536D]">
                      {project.genre}
                    </span>
                  )}
                  {project.made_on && (
                    <span className="w-fit rounded-full bg-[#D8F0E8] px-2 py-0.5 text-xs text-stone-700">
                      {project.made_on}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function WorksPage() {
  return (
    <YarnPublicShell>
      <Suspense fallback={<p className="px-4 py-10 text-center text-sm text-stone-500">読み込み中…</p>}>
        <WorksListContent />
      </Suspense>
    </YarnPublicShell>
  );
}
