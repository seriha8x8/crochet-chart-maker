"use client";

import { useEffect } from "react";
import { useChartStore } from "@/store/chartStore";

export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (isEditable) return;

      const store = useChartStore.getState();
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "c") {
        e.preventDefault();
        store.copySelection();
      } else if (mod && e.key.toLowerCase() === "v") {
        e.preventDefault();
        store.pasteClipboard();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (store.selectedIds.length > 0) {
          e.preventDefault();
          store.deleteSymbols(store.selectedIds);
        }
      } else if (e.key === "Escape") {
        store.cancelParentLink();
        store.setPlacementTool(null);
        store.clearSelection();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
