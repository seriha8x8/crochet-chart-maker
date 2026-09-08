"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { Project, Yarn, YarnPlan } from "@/lib/yarn/types";
import type { ProjectFields, YarnSelection, PhotoChange } from "@/lib/yarn/data";
import { UpgradeRequiredError } from "@/lib/yarn/data";
import { PhotoField } from "@/components/yarn/PhotoField";
import { UpgradeModal } from "@/components/yarn/UpgradeModal";
import { YarnPicker } from "@/components/yarn/YarnPicker";

const fieldClass =
  "rounded-md border border-stone-300 px-3 py-2 focus:border-[#5BC8AC] focus:outline-none focus:ring-2 focus:ring-[#5BC8AC33]";

type SubmitResult = { createdTitle: string } | { saved: true };

export function ProjectForm({
  project,
  photoUrl,
  plan,
  yarns,
  initialSelections,
  onSubmit,
}: {
  project?: Project;
  photoUrl: string | null;
  plan: YarnPlan;
  yarns: Yarn[];
  initialSelections: YarnSelection[];
  onSubmit: (
    fields: ProjectFields,
    selections: YarnSelection[],
    decrementStock: boolean,
    photo: PhotoChange,
  ) => Promise<SubmitResult>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [selections, setSelections] = useState<YarnSelection[]>(initialSelections);
  const [decrementStock, setDecrementStock] = useState(false);
  const [photoFieldKey, setPhotoFieldKey] = useState(0);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    if (!title) {
      setError("作品名は必須です");
      return;
    }
    const fields: ProjectFields = { title, made_on: String(data.get("made_on") ?? "").trim() || null };

    setPending(true);
    setError(null);
    try {
      const result = await onSubmit(fields, selections, decrementStock, { removePhoto, file: photoFile });
      if ("createdTitle" in result) {
        setSuccessMessage(`「${result.createdTitle}」を登録しました。続けて登録できます。`);
        form.reset();
        setSelections([]);
        setRemovePhoto(false);
        setPhotoFile(null);
        setPhotoFieldKey((k) => k + 1);
        setDecrementStock(false);
      } else {
        setSuccessMessage("保存しました");
      }
    } catch (err) {
      if (err instanceof UpgradeRequiredError) {
        setUpgradeOpen(true);
      } else {
        setError(err instanceof Error ? err.message : "保存に失敗しました");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {successMessage && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-[#5BC8AC66] bg-[#EAF7F2] px-4 py-3 text-sm text-[#2f6f61]">
          <span>{successMessage}</span>
          <Link href="/yarn/projects" className="whitespace-nowrap font-medium underline">
            一覧を見る
          </Link>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          作品名／メモ
          <input name="title" required defaultValue={project?.title} className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          作った日
          <input type="date" name="made_on" defaultValue={project?.made_on ?? ""} className={fieldClass} />
        </label>

        <YarnPicker yarns={yarns} selections={selections} onChange={setSelections} />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={decrementStock}
            onChange={(e) => setDecrementStock(e.target.checked)}
          />
          使用した毛糸の在庫数を自動で減らす
        </label>

        <PhotoField
          key={photoFieldKey}
          existingPhotoUrl={photoUrl}
          plan={plan}
          removePhoto={removePhoto}
          onRemovePhotoChange={setRemovePhoto}
          onFileChange={setPhotoFile}
          onAttemptBlocked={() => setUpgradeOpen(true)}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[#5BC8AC] px-4 py-2 font-medium text-white hover:bg-[#46A68D] disabled:opacity-50"
        >
          {pending ? "保存中..." : "保存"}
        </button>
      </form>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
}
