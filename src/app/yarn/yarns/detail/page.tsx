"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RequireYarnUser, useYarnUser } from "@/components/yarn/AuthGate";
import { useYarnPlan } from "@/components/yarn/useYarnPlan";
import { YarnForm } from "@/components/yarn/YarnForm";
import { DeleteButton } from "@/components/yarn/DeleteButton";
import { deleteYarn, getYarn, getYarnUsages, updateYarn, type YarnUsageRow } from "@/lib/yarn/data";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getPhotoUrl } from "@/lib/yarn/photos";
import type { Yarn } from "@/lib/yarn/types";

function YarnDetailContent() {
  const user = useYarnUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const plan = useYarnPlan(user.id);

  const [yarn, setYarn] = useState<Yarn | null | undefined>(undefined);
  const [usages, setUsages] = useState<YarnUsageRow[]>([]);
  const [saveVersion, setSaveVersion] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    Promise.all([getYarn(user.id, id), getYarnUsages(id)]).then(([y, u]) => {
      if (cancelled) return;
      setYarn(y);
      setUsages(u);
    });
    return () => {
      cancelled = true;
    };
  }, [user.id, id]);

  if (!id || yarn === null) {
    return <p className="px-4 py-10 text-center text-sm text-stone-500">毛糸が見つかりません。</p>;
  }
  if (yarn === undefined || plan === undefined) {
    return <p className="px-4 py-10 text-center text-sm text-stone-500">読み込み中…</p>;
  }

  const supabase = getSupabaseClient();
  const photoUrl = supabase ? getPhotoUrl(supabase, yarn.photo_url) : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{yarn.name}</h1>
        <DeleteButton
          confirmMessage="この毛糸を削除しますか？"
          onDelete={async () => {
            await deleteYarn(user.id, yarn.id);
            router.push("/yarn/yarns");
          }}
        />
      </div>

      <YarnForm
        key={saveVersion}
        yarn={yarn}
        photoUrl={photoUrl}
        plan={plan}
        onSubmit={async (fields, photo) => {
          await updateYarn(user.id, yarn.id, fields, photo, plan);
          const [freshYarn, freshUsages] = await Promise.all([getYarn(user.id, yarn.id), getYarnUsages(yarn.id)]);
          setYarn(freshYarn);
          setUsages(freshUsages);
          setSaveVersion((v) => v + 1);
          return { saved: true };
        }}
      />

      <section className="flex flex-col gap-3">
        <h2 className="border-l-4 border-[#F18D9E] pl-3 text-lg font-semibold">この毛糸を使った作品メモ</h2>
        {usages.length === 0 ? (
          <p className="text-sm text-stone-500">まだ作品メモがありません。</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {usages.map((usage) => (
              <li key={usage.id}>
                <Link
                  href={`/yarn/projects/detail?id=${usage.project?.id}`}
                  className="flex items-center justify-between rounded-md border border-[#5BC8AC26] bg-white px-4 py-3 hover:border-[#5BC8AC66] hover:bg-[#D8F0E8]/70"
                >
                  <span>{usage.project?.title}</span>
                  <span className="rounded-full bg-[#FCE7EA] px-2 py-0.5 text-xs font-medium text-[#B2536D]">
                    使用: {usage.used_count}玉
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function YarnDetailPage() {
  return (
    <RequireYarnUser>
      <Suspense fallback={<p className="px-4 py-10 text-center text-sm text-stone-500">読み込み中…</p>}>
        <YarnDetailContent />
      </Suspense>
    </RequireYarnUser>
  );
}
