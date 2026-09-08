"use client";

import { useState, type ChangeEvent } from "react";
import type { YarnPlan } from "@/lib/yarn/types";

export function PhotoField({
  existingPhotoUrl,
  plan,
  removePhoto,
  onRemovePhotoChange,
  onFileChange,
  onAttemptBlocked,
}: {
  existingPhotoUrl: string | null;
  plan: YarnPlan;
  removePhoto: boolean;
  onRemovePhotoChange: (value: boolean) => void;
  onFileChange: (file: File | null) => void;
  onAttemptBlocked: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && existingPhotoUrl && !removePhoto && plan !== "premium") {
      e.target.value = "";
      setPreview(null);
      onFileChange(null);
      onAttemptBlocked();
      return;
    }
    setPreview(file ? URL.createObjectURL(file) : null);
    onFileChange(file);
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <span>写真（無料プランは1枚まで）</span>

      {existingPhotoUrl && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer available */}
          <img src={existingPhotoUrl} alt="" className="h-24 w-24 rounded-md border border-stone-200 object-cover" />
          <label className="flex items-center gap-2 text-stone-600">
            <input type="checkbox" checked={removePhoto} onChange={(e) => onRemovePhotoChange(e.target.checked)} />
            写真を削除する
          </label>
        </div>
      )}

      <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm" />
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not an optimizable asset
        <img src={preview} alt="" className="h-24 w-24 rounded-md border border-stone-200 object-cover" />
      )}
    </div>
  );
}
