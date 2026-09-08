"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { Yarn, YarnPlan } from "@/lib/yarn/types";
import type { YarnFields, PhotoChange } from "@/lib/yarn/data";
import { UpgradeRequiredError } from "@/lib/yarn/data";
import { PhotoField } from "@/components/yarn/PhotoField";
import { UpgradeModal } from "@/components/yarn/UpgradeModal";

const fieldClass =
  "rounded-md border border-stone-300 px-3 py-2 focus:border-[#5BC8AC] focus:outline-none focus:ring-2 focus:ring-[#5BC8AC33]";

type SubmitResult = { createdName: string } | { saved: true };

export function YarnForm({
  yarn,
  photoUrl,
  plan,
  onSubmit,
}: {
  yarn?: Yarn;
  photoUrl: string | null;
  plan: YarnPlan;
  onSubmit: (fields: YarnFields, photo: PhotoChange) => Promise<SubmitResult>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
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
    const name = String(data.get("name") ?? "").trim();
    if (!name) {
      setError("名前は必須です");
      return;
    }

    const fields: YarnFields = {
      name,
      color: String(data.get("color") ?? "").trim() || null,
      manufacturer: String(data.get("manufacturer") ?? "").trim() || null,
      material: String(data.get("material") ?? "").trim() || null,
      thickness: String(data.get("thickness") ?? "").trim() || null,
      stock_count: Math.max(0, Number(data.get("stock_count") ?? 0) || 0),
    };

    setPending(true);
    setError(null);
    try {
      const result = await onSubmit(fields, { removePhoto, file: photoFile });
      if ("createdName" in result) {
        setSuccessMessage(`「${result.createdName}」を登録しました。続けて登録できます。`);
        form.reset();
        setRemovePhoto(false);
        setPhotoFile(null);
        setPhotoFieldKey((k) => k + 1);
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
          <Link href="/yarn/yarns" className="whitespace-nowrap font-medium underline">
            一覧を見る
          </Link>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          名前
          <input name="name" required defaultValue={yarn?.name} className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          色
          <input name="color" defaultValue={yarn?.color ?? ""} className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          メーカー／ショップ
          <input name="manufacturer" defaultValue={yarn?.manufacturer ?? ""} className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          素材
          <input name="material" defaultValue={yarn?.material ?? ""} className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          太さ
          <input name="thickness" defaultValue={yarn?.thickness ?? ""} className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          在庫数（玉）
          <input type="number" name="stock_count" min={0} defaultValue={yarn?.stock_count ?? 0} className={fieldClass} />
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
