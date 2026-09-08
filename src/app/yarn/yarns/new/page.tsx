"use client";

import { RequireYarnUser, useYarnUser } from "@/components/yarn/AuthGate";
import { useYarnPlan } from "@/components/yarn/useYarnPlan";
import { YarnForm } from "@/components/yarn/YarnForm";
import { createYarn } from "@/lib/yarn/data";

function NewYarnContent() {
  const user = useYarnUser();
  const plan = useYarnPlan(user.id);

  if (plan === undefined) {
    return <p className="px-4 py-10 text-center text-sm text-stone-500">読み込み中…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">毛糸を登録</h1>
      <YarnForm
        photoUrl={null}
        plan={plan}
        onSubmit={async (fields, photo) => {
          const yarn = await createYarn(user.id, fields, photo.file);
          return { createdName: yarn.name };
        }}
      />
    </div>
  );
}

export default function NewYarnPage() {
  return (
    <RequireYarnUser>
      <NewYarnContent />
    </RequireYarnUser>
  );
}
