"use client";

import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Toolbar } from "@/components/editor/Toolbar";
import { SymbolPalette } from "@/components/editor/SymbolPalette";
import { LayerPanel } from "@/components/editor/LayerPanel";
import { ProjectPanel } from "@/components/editor/ProjectPanel";
import { Canvas } from "@/components/editor/Canvas";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { useKeyboardShortcuts } from "@/components/editor/useKeyboardShortcuts";
import { useChartStore } from "@/store/chartStore";
import { AdSlot, AD_SLOT_HORIZONTAL } from "@/components/AdSlot";

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
      <SiteHeader current="editor" />
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
        <aside className="flex w-64 shrink-0 flex-col border-l border-peach/40 bg-white">
          <div className="flex-1 overflow-y-auto">
            <PropertiesPanel />
          </div>
          <AdSlot slot={AD_SLOT_HORIZONTAL} className="border-t border-peach/40 p-2" />
        </aside>
      </div>
      <SiteFooter compact />
    </div>
  );
}
