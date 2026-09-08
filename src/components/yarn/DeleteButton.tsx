"use client";

export function DeleteButton({
  onDelete,
  confirmMessage,
  label = "削除",
}: {
  onDelete: () => void | Promise<void>;
  confirmMessage: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
      onClick={() => {
        if (confirm(confirmMessage)) void onDelete();
      }}
    >
      {label}
    </button>
  );
}
