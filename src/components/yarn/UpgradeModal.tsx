"use client";

export function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-lg bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">有料プランは準備中です</h2>
        <p className="mt-2 text-sm text-stone-600">
          無料プランでは写真は1枚までです。2枚目以降の写真を保存するには有料プランへのアップグレードが必要です。有料プランは現在準備中です。
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
