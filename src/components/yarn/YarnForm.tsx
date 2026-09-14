"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { Yarn, YarnPlan } from "@/lib/yarn/types";
import type { YarnFields, PhotoChange } from "@/lib/yarn/data";
import { UpgradeRequiredError, listManufacturers } from "@/lib/yarn/data";
import { YARN_COLORS, YARN_MATERIALS, KNITTING_NEEDLE_SIZES, CROCHET_HOOK_SIZES } from "@/lib/yarn/constants";
import { PhotoField } from "@/components/yarn/PhotoField";
import { UpgradeModal } from "@/components/yarn/UpgradeModal";
import { CheckboxChips } from "@/components/yarn/CheckboxChips";
import { ColorSwatchChips } from "@/components/yarn/ColorSwatchChips";

const fieldClass =
  "rounded-md border border-stone-300 px-3 py-2 focus:border-[#5BC8AC] focus:outline-none focus:ring-2 focus:ring-[#5BC8AC33]";

type SubmitResult = { createdName: string } | { saved: true };

export function YarnForm({
  userId,
  yarn,
  photoUrl,
  plan,
  onSubmit,
}: {
  userId: string;
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
  const [manufacturerOptions, setManufacturerOptions] = useState<string[]>([]);
  // Tracks edits since the last successful save, so an already-saved yarn's button can show
  // "保存済み" (and stay disabled) until something actually changes again.
  const [dirty, setDirty] = useState(false);
  const isEditingExisting = Boolean(yarn);
  const showSaved = isEditingExisting && !dirty && !pending;

  useEffect(() => {
    let cancelled = false;
    listManufacturers(userId)
      .then((names) => {
        if (!cancelled) setManufacturerOptions(names);
      })
      .catch(() => {
        // Suggestions are a nicety — a fetch failure shouldn't block the rest of the form.
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

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
      color: data.getAll("color").map(String),
      manufacturer: String(data.get("manufacturer") ?? "").trim() || null,
      material: data.getAll("material").map(String),
      thickness: data.getAll("thickness").map(String),
      stock_count: Math.max(0, Number(data.get("stock_count") ?? 0) || 0),
    };

    setPending(true);
    setError(null);
    try {
      const result = await onSubmit(fields, { removePhoto, file: photoFile });
      setDirty(false);
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
      <form
        onSubmit={handleSubmit}
        onChange={() => setDirty(true)}
        className="flex max-w-lg flex-col gap-5"
      >
        <label className="flex flex-col gap-1 text-sm">
          名前
          <input name="name" required defaultValue={yarn?.name} className={fieldClass} />
        </label>

        <fieldset className="flex flex-col gap-1.5 text-sm">
          <legend className="mb-0.5">色（複数選択可。段染めなどは複数選んでください）</legend>
          <ColorSwatchChips name="color" options={YARN_COLORS} defaultValues={yarn?.color ?? []} />
        </fieldset>

        <label className="flex flex-col gap-1 text-sm">
          メーカー／ショップ
          <input
            name="manufacturer"
            list="manufacturer-options"
            defaultValue={yarn?.manufacturer ?? ""}
            className={fieldClass}
            placeholder="入力すると過去の候補も出てきます"
          />
          <datalist id="manufacturer-options">
            {manufacturerOptions.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </label>

        <fieldset className="flex flex-col gap-1.5 text-sm">
          <legend className="mb-0.5">素材（複数選択可）</legend>
          <CheckboxChips name="material" options={[...YARN_MATERIALS]} defaultValues={yarn?.material ?? []} />
        </fieldset>

        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-0.5">太さ（複数選択可）</legend>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-stone-500">棒針</span>
            <CheckboxChips
              name="thickness"
              options={KNITTING_NEEDLE_SIZES}
              defaultValues={yarn?.thickness ?? []}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-stone-500">かぎ針</span>
            <CheckboxChips
              name="thickness"
              options={CROCHET_HOOK_SIZES}
              defaultValues={yarn?.thickness ?? []}
            />
          </div>
        </fieldset>

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
          disabled={pending || showSaved}
          className="flex items-center justify-center gap-1.5 rounded-md bg-[#5BC8AC] px-4 py-2 font-medium text-white hover:bg-[#46A68D] disabled:opacity-50 disabled:hover:bg-[#5BC8AC]"
        >
          {pending ? (
            "保存中..."
          ) : showSaved ? (
            <>
              <CheckIcon />
              保存済み
            </>
          ) : (
            "保存"
          )}
        </button>
      </form>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7.5l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
