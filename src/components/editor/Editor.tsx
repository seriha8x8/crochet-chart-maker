"use client";

import { Toolbar } from "@/components/editor/Toolbar";
import { SymbolPalette } from "@/components/editor/SymbolPalette";
import { LayerPanel } from "@/components/editor/LayerPanel";
import { Canvas } from "@/components/editor/Canvas";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { useKeyboardShortcuts } from "@/components/editor/useKeyboardShortcuts";
import { CloudSyncControl } from "@/components/editor/CloudSyncControl";

export function Editor() {
  useKeyboardShortcuts();

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-white text-neutral-900">
      <Toolbar />
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-56 shrink-0 flex-col overflow-y-auto border-r border-neutral-200">
          <SymbolPalette />
          <LayerPanel />
          <div className="mt-auto border-t border-neutral-200 p-3">
            <CloudSyncControl />
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <Canvas />
        </main>
        <aside className="w-64 shrink-0 overflow-y-auto border-l border-neutral-200">
          <PropertiesPanel />
        </aside>
      </div>
    </div>
  );
}
