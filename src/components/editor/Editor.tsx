"use client";

import { useEffect } from "react";
import { Toolbar } from "@/components/editor/Toolbar";
import { SymbolPalette } from "@/components/editor/SymbolPalette";
import { LayerPanel } from "@/components/editor/LayerPanel";
import { ProjectPanel } from "@/components/editor/ProjectPanel";
import { Canvas } from "@/components/editor/Canvas";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { useKeyboardShortcuts } from "@/components/editor/useKeyboardShortcuts";
import { useChartStore } from "@/store/chartStore";

export function Editor() {
  useKeyboardShortcuts();

  // One-time migration: users from before multi-project support have real chart data
  // sitting in the old single-slot fields with no entry in `projects` yet. Wrap it in a
  // named project on first load so it doesn't look orphaned once the switcher appears.
  useEffect(() => {
    const state = useChartStore.getState();
    if (state.projects.length === 0 && (state.symbols.length > 0 || state.layers.length > 1)) {
      state.saveProjectAs("マイ作品1");
    }
  }, []);

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-white text-ink">
      <Toolbar />
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-56 shrink-0 flex-col overflow-y-auto border-r border-peach/40 bg-white">
          <ProjectPanel />
          <SymbolPalette />
          <LayerPanel />
        </aside>
        <main className="min-w-0 flex-1">
          <Canvas />
        </main>
        <aside className="w-64 shrink-0 overflow-y-auto border-l border-peach/40 bg-white">
          <PropertiesPanel />
        </aside>
      </div>
    </div>
  );
}
