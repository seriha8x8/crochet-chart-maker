"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RequireYarnUser, useYarnUser } from "@/components/yarn/AuthGate";
import { useYarnPlan } from "@/components/yarn/useYarnPlan";
import { ProjectForm } from "@/components/yarn/ProjectForm";
import { DeleteButton } from "@/components/yarn/DeleteButton";
import {
  deleteProject,
  getProject,
  getProjectUsages,
  listYarnsForPicker,
  updateProject,
  type ProjectUsageRow,
} from "@/lib/yarn/data";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getPhotoUrl } from "@/lib/yarn/photos";
import type { Project, Yarn } from "@/lib/yarn/types";

function ProjectDetailContent() {
  const user = useYarnUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const plan = useYarnPlan(user.id);

  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [usages, setUsages] = useState<ProjectUsageRow[]>([]);
  const [yarns, setYarns] = useState<Yarn[]>([]);
  const [saveVersion, setSaveVersion] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    Promise.all([getProject(user.id, id), getProjectUsages(id), listYarnsForPicker(user.id)]).then(([p, u, y]) => {
      if (cancelled) return;
      setProject(p);
      setUsages(u);
      setYarns(y);
    });
    return () => {
      cancelled = true;
    };
  }, [user.id, id]);

  if (!id || project === null) {
    return <p className="px-4 py-10 text-center text-sm text-stone-500">作品メモが見つかりません。</p>;
  }
  if (project === undefined || plan === undefined) {
    return <p className="px-4 py-10 text-center text-sm text-stone-500">読み込み中…</p>;
  }

  const supabase = getSupabaseClient();
  const photoUrl = supabase ? getPhotoUrl(supabase, project.photo_url) : null;
  const initialSelections = usages.map((usage) => ({ yarn_id: usage.yarn?.id ?? "", used_count: usage.used_count }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{project.title}</h1>
        <DeleteButton
          confirmMessage="この作品メモを削除しますか？"
          onDelete={async () => {
            await deleteProject(user.id, project.id);
            router.push("/yarn/projects");
          }}
        />
      </div>

      <ProjectForm
        key={saveVersion}
        project={project}
        photoUrl={photoUrl}
        plan={plan}
        yarns={yarns}
        initialSelections={initialSelections}
        onSubmit={async (fields, selections, decrementStock, photo) => {
          await updateProject(user.id, project.id, fields, selections, decrementStock, photo, plan);
          const [freshProject, freshUsages] = await Promise.all([
            getProject(user.id, project.id),
            getProjectUsages(project.id),
          ]);
          setProject(freshProject);
          setUsages(freshUsages);
          setSaveVersion((v) => v + 1);
          return { saved: true };
        }}
      />

      <section className="flex flex-col gap-3">
        <h2 className="border-l-4 border-[#F18D9E] pl-3 text-lg font-semibold">使用した毛糸</h2>
        {usages.length === 0 ? (
          <p className="text-sm text-stone-500">使用した毛糸がありません。</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {usages.map((usage) => (
              <li key={usage.id}>
                <Link
                  href={`/yarn/yarns/detail?id=${usage.yarn?.id}`}
                  className="flex items-center justify-between rounded-md border border-[#5BC8AC26] bg-white px-4 py-3 hover:border-[#5BC8AC66] hover:bg-[#D8F0E8]/70"
                >
                  <span>
                    {usage.yarn?.name}
                    {usage.yarn?.manufacturer ? ` (${usage.yarn.manufacturer})` : ""}
                  </span>
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

export default function ProjectDetailPage() {
  return (
    <RequireYarnUser>
      <Suspense fallback={<p className="px-4 py-10 text-center text-sm text-stone-500">読み込み中…</p>}>
        <ProjectDetailContent />
      </Suspense>
    </RequireYarnUser>
  );
}
