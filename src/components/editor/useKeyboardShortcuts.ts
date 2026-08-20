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

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) store.redo();
        else store.undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        store.redo();
      } else if (mod && e.key.toLowerCase() === "c") {
        e.preventDefault();
        store.copySelection();
      } else if (mod && e.key.toLowerCase() === "v") {
        e.preventDefault();
        store.pasteClipboard();
      } else if (mod && e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (e.shiftKey) store.ungroupSelection();
        else store.groupSelection();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (store.selectedIds.length > 0) {
          e.preventDefault();
          store.deleteSymbols(store.selectedIds);
        }
      } else if (e.key === "Escape") {
        store.cancelParentLink();
        store.setPlacementTool(null);
        store.clearSelection();
      } else if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      ) {
        if (store.selectedIds.length > 0) {
          e.preventDefault();
          // Coalesce a held-down key's auto-repeat into a single undo step: only the
          // first press of a nudge "session" snapshots history.
          if (!e.repeat) store.pushHistory();
          const step = e.shiftKey ? 10 : 1;
          const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
          const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
          store.moveSymbols(store.selectedIds, dx, dy);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
