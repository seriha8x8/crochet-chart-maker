"use client";

import { useEffect, useState } from "react";
import { RequireYarnUser, useYarnUser } from "@/components/yarn/AuthGate";
import { useYarnPlan } from "@/components/yarn/useYarnPlan";
import { ProjectForm } from "@/components/yarn/ProjectForm";
import { createProject, listYarnsForPicker } from "@/lib/yarn/data";
import type { Yarn } from "@/lib/yarn/types";

function NewProjectContent() {
  const user = useYarnUser();
  const plan = useYarnPlan(user.id);
  const [yarns, setYarns] = useState<Yarn[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    listYarnsForPicker(user.id).then((data) => {
      if (!cancelled) setYarns(data);
    });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  if (plan === undefined || yarns === null) {
    return <p className="px-4 py-10 text-center text-sm text-stone-500">読み込み中…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">作品メモを登録</h1>
      <ProjectForm
        photoUrl={null}
        plan={plan}
        yarns={yarns}
        initialSelections={[]}
        onSubmit={async (fields, selections, decrementStock, photo) => {
          const project = await createProject(user.id, fields, selections, decrementStock, photo.file);
          return { createdTitle: project.title };
        }}
      />
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <RequireYarnUser>
      <NewProjectContent />
    </RequireYarnUser>
  );
}
