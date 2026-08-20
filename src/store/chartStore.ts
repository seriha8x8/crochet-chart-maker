import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type {
  AttachType,
  ChartSymbol,
  GuideState,
  Layer,
  SymbolType,
} from "@/types/chart";
import { getFootPoint, getHeadPoint, centroid, type Point } from "@/lib/symbols/geometry";

const DEFAULT_LAYER_ID = uuid();

const DEFAULT_GUIDE: GuideState = {
  type: "chain",
  chain: { y: 420, startX: 80, length: 500, stitchSpacing: 20 },
  ring: { centerX: 400, centerY: 300, ringCount: 4, ringSpacing: 34 },
};

const MAX_HISTORY = 50;

interface HistorySnapshot {
  symbols: ChartSymbol[];
  layers: Layer[];
}

interface ArrayDefaults {
  type: SymbolType;
  count: number;
}

const DEFAULT_ARRAY_DEFAULTS: { round: ArrayDefaults; straight: ArrayDefaults } = {
  round: { type: "double", count: 12 },
  straight: { type: "chain", count: 10 },
};

export interface SavedProject {
  id: string;
  name: string;
  symbols: ChartSymbol[];
  layers: Layer[];
  guide: GuideState;
  updatedAt: string;
}

interface ChartState {
  symbols: ChartSymbol[];
  layers: Layer[];
  activeLayerId: string;
  selectedIds: string[];
  placementTool: SymbolType | null;
  guide: GuideState;
  clipboard: ChartSymbol[];
  highlightIds: string[];
  parentLinkTargetId: string | null;
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  arrayDefaults: { round: ArrayDefaults; straight: ArrayDefaults };
  projects: SavedProject[];
  currentProjectId: string | null;

  saveProjectAs: (name: string) => void;
  saveCurrentProject: () => void;
  loadProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;

  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  setPlacementTool: (type: SymbolType | null) => void;
  placeSymbolAt: (x: number, y: number) => void;
  updateSymbol: (id: string, patch: Partial<ChartSymbol>) => void;
  moveSymbols: (ids: string[], dx: number, dy: number) => void;
  deleteSymbols: (ids: string[]) => void;
  rotateSymbols: (ids: string[], deltaDeg: number) => void;
  orbitGroup: (ids: string[], deltaDeg: number, pivot: Point) => void;
  duplicateMirrored: (ids: string[], axis: "horizontal" | "vertical") => void;
  setRotation: (id: string, deg: number) => void;

  selectOnly: (id: string) => void;
  toggleSelect: (id: string) => void;
  setSelection: (ids: string[]) => void;
  clearSelection: () => void;

  groupSelection: () => void;
  ungroupSelection: () => void;

  addLayer: (name: string) => void;
  renameLayer: (id: string, name: string) => void;
  toggleLayerVisibility: (id: string) => void;
  removeLayer: (id: string) => void;
  setActiveLayer: (id: string) => void;

  copySelection: () => void;
  pasteClipboard: () => void;

  setGuide: (guide: Partial<GuideState>) => void;

  addSymbolsBatch: (
    symbols: Array<{ type: SymbolType; x: number; y: number; rotation: number }>,
  ) => void;

  setArrayDefaults: (kind: "round" | "straight", patch: ArrayDefaults) => void;

  startParentLink: (symbolId: string) => void;
  cancelParentLink: () => void;
  toggleParent: (parentId: string) => void;
  setAttachType: (symbolId: string, attachType: AttachType) => void;
  applyAttachSnap: (symbolId: string) => void;

  setHighlightFromSymbol: (symbolId: string | null) => void;

  resetProject: () => void;
}

function snapSymbolToParents(symbol: ChartSymbol, allSymbols: ChartSymbol[]): ChartSymbol {
  if (symbol.parentIds.length === 0) return symbol;
  const parents = allSymbols.filter((s) => symbol.parentIds.includes(s.id));
  if (parents.length === 0) return symbol;

  if (symbol.attachType === "stitch") {
    const target = centroid(parents.map((p) => getHeadPoint(p)));
    return { ...symbol, x: target.x, y: target.y };
  } else {
    const target = centroid(parents.map((p) => getFootPoint(p)));
    return { ...symbol, x: target.x, y: target.y };
  }
}

export const useChartStore = create<ChartState>()(
  persist(
    (set, get) => ({
      symbols: [],
      layers: [{ id: DEFAULT_LAYER_ID, name: "レイヤー1", visible: true, order: 0 }],
      activeLayerId: DEFAULT_LAYER_ID,
      selectedIds: [],
      placementTool: null,
      guide: DEFAULT_GUIDE,
      clipboard: [],
      highlightIds: [],
      parentLinkTargetId: null,
      past: [],
      future: [],
      arrayDefaults: DEFAULT_ARRAY_DEFAULTS,
      projects: [],
      currentProjectId: null,

      saveProjectAs: (name) => {
        const { symbols, layers, guide, projects } = get();
        const newProject: SavedProject = {
          id: uuid(),
          name,
          symbols,
          layers,
          guide,
          updatedAt: new Date().toISOString(),
        };
        set({ projects: [...projects, newProject], currentProjectId: newProject.id });
      },
      saveCurrentProject: () => {
        const { symbols, layers, guide, projects, currentProjectId } = get();
        if (!currentProjectId || !projects.some((p) => p.id === currentProjectId)) {
          get().saveProjectAs("無題の作品");
          return;
        }
        set({
          projects: projects.map((p) =>
            p.id === currentProjectId
              ? { ...p, symbols, layers, guide, updatedAt: new Date().toISOString() }
              : p,
          ),
        });
      },
      loadProject: (id) => {
        const project = get().projects.find((p) => p.id === id);
        if (!project) return;
        set({
          symbols: project.symbols,
          layers: project.layers,
          guide: project.guide,
          currentProjectId: id,
          selectedIds: [],
          highlightIds: [],
          parentLinkTargetId: null,
          placementTool: null,
          past: [],
          future: [],
        });
      },
      renameProject: (id, name) =>
        set({ projects: get().projects.map((p) => (p.id === id ? { ...p, name } : p)) }),
      deleteProject: (id) => {
        const remaining = get().projects.filter((p) => p.id !== id);
        set({
          projects: remaining,
          currentProjectId: get().currentProjectId === id ? null : get().currentProjectId,
        });
      },

      // Snapshots {symbols, layers} only — selection/guide/UI state aren't undo-worthy content.
      // Call this once per discrete edit, not on every event of a continuous gesture (drag/typing).
      pushHistory: () => {
        const { symbols, layers, past } = get();
        set({ past: [...past, { symbols, layers }].slice(-MAX_HISTORY), future: [] });
      },
      undo: () => {
        const { past, future, symbols, layers } = get();
        if (past.length === 0) return;
        const previous = past[past.length - 1];
        set({
          symbols: previous.symbols,
          layers: previous.layers,
          past: past.slice(0, -1),
          future: [...future, { symbols, layers }],
          selectedIds: [],
          highlightIds: [],
          parentLinkTargetId: null,
        });
      },
      redo: () => {
        const { past, future, symbols, layers } = get();
        if (future.length === 0) return;
        const next = future[future.length - 1];
        set({
          symbols: next.symbols,
          layers: next.layers,
          future: future.slice(0, -1),
          past: [...past, { symbols, layers }],
          selectedIds: [],
          highlightIds: [],
          parentLinkTargetId: null,
        });
      },

      setPlacementTool: (type) => set({ placementTool: type, parentLinkTargetId: null }),

      placeSymbolAt: (x, y) => {
        const { placementTool, activeLayerId, symbols } = get();
        if (!placementTool) return;
        get().pushHistory();
        const newSymbol: ChartSymbol = {
          id: uuid(),
          type: placementTool,
          x,
          y,
          rotation: 0,
          layerId: activeLayerId,
          parentIds: [],
          attachType: "stitch",
          groupId: null,
        };
        set({ symbols: [...symbols, newSymbol], selectedIds: [newSymbol.id] });
      },

      updateSymbol: (id, patch) =>
        set({ symbols: get().symbols.map((s) => (s.id === id ? { ...s, ...patch } : s)) }),

      // No internal pushHistory: used for both discrete arrow-key nudges and (in principle)
      // continuous gestures, so callers push history themselves when a new gesture starts.
      moveSymbols: (ids, dx, dy) => {
        set({
          symbols: get().symbols.map((s) =>
            ids.includes(s.id) ? { ...s, x: s.x + dx, y: s.y + dy } : s,
          ),
        });
      },

      deleteSymbols: (ids) => {
        get().pushHistory();
        const idSet = new Set(ids);
        set({
          symbols: get()
            .symbols.filter((s) => !idSet.has(s.id))
            .map((s) => ({ ...s, parentIds: s.parentIds.filter((p) => !idSet.has(p)) })),
          selectedIds: get().selectedIds.filter((id) => !idSet.has(id)),
        });
      },

      rotateSymbols: (ids, deltaDeg) => {
        get().pushHistory();
        set({
          symbols: get().symbols.map((s) =>
            ids.includes(s.id) ? { ...s, rotation: (s.rotation + deltaDeg + 360) % 360 } : s,
          ),
        });
      },

      // Rigid-body rotation: orbits each symbol's position around `pivot` by deltaDeg
      // AND spins its own rotation by the same amount, so a horizontal row rotated 90°
      // comes out as a vertical column of upright symbols — the whole cluster turns as
      // one object. No internal pushHistory: continuous-drag safe, like moveSymbols.
      orbitGroup: (ids, deltaDeg, pivot) => {
        const rad = (deltaDeg * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const idSet = new Set(ids);
        set({
          symbols: get().symbols.map((s) => {
            if (!idSet.has(s.id)) return s;
            const dx = s.x - pivot.x;
            const dy = s.y - pivot.y;
            return {
              ...s,
              x: pivot.x + dx * cos - dy * sin,
              y: pivot.y + dx * sin + dy * cos,
              rotation: (s.rotation + deltaDeg + 360) % 360,
            };
          }),
        });
      },

      // Mirrors the selection across the edge of its own bounding box (right edge for
      // a horizontal flip, bottom edge for vertical) and adds the result as a new,
      // separately draggable group — build one half of a symmetric motif, mirror it,
      // and the other half appears already lined up (drag it if the seam side is
      // backwards). Each symbol's own rotation is reflected too, not just its position.
      duplicateMirrored: (ids, axis) => {
        const { symbols, activeLayerId } = get();
        const selected = symbols.filter((s) => ids.includes(s.id));
        if (selected.length === 0) return;

        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const s of selected) {
          for (const p of [getFootPoint(s), getHeadPoint(s)]) {
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
          }
        }

        get().pushHistory();
        const groupId = selected.length > 1 ? uuid() : null;
        const mirrored: ChartSymbol[] = selected.map((s) =>
          axis === "horizontal"
            ? {
                ...s,
                id: uuid(),
                x: 2 * maxX - s.x,
                rotation: (360 - s.rotation) % 360,
                layerId: activeLayerId,
                parentIds: [],
                groupId,
              }
            : {
                ...s,
                id: uuid(),
                y: 2 * maxY - s.y,
                rotation: (180 - s.rotation + 360) % 360,
                layerId: activeLayerId,
                parentIds: [],
                groupId,
              },
        );
        set({ symbols: [...symbols, ...mirrored], selectedIds: mirrored.map((s) => s.id) });
      },

      setRotation: (id, deg) =>
        set({
          symbols: get().symbols.map((s) =>
            s.id === id ? { ...s, rotation: ((deg % 360) + 360) % 360 } : s,
          ),
        }),

      selectOnly: (id) => set({ selectedIds: [id] }),
      toggleSelect: (id) =>
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((s) => s !== id)
            : [...state.selectedIds, id],
        })),
      setSelection: (ids) => set({ selectedIds: ids }),
      clearSelection: () => set({ selectedIds: [], highlightIds: [] }),

      groupSelection: () => {
        const { selectedIds } = get();
        if (selectedIds.length < 2) return;
        get().pushHistory();
        const groupId = uuid();
        const idSet = new Set(selectedIds);
        set({
          symbols: get().symbols.map((s) => (idSet.has(s.id) ? { ...s, groupId } : s)),
        });
      },
      ungroupSelection: () => {
        const { selectedIds, symbols } = get();
        const groupIds = new Set(
          symbols.filter((s) => selectedIds.includes(s.id) && s.groupId).map((s) => s.groupId),
        );
        if (groupIds.size === 0) return;
        get().pushHistory();
        set({
          symbols: get().symbols.map((s) => (s.groupId && groupIds.has(s.groupId) ? { ...s, groupId: null } : s)),
        });
      },

      addLayer: (name) => {
        get().pushHistory();
        const layers = get().layers;
        const newLayer: Layer = { id: uuid(), name, visible: true, order: layers.length };
        set({ layers: [...layers, newLayer], activeLayerId: newLayer.id });
      },
      renameLayer: (id, name) => {
        get().pushHistory();
        set({ layers: get().layers.map((l) => (l.id === id ? { ...l, name } : l)) });
      },
      toggleLayerVisibility: (id) => {
        get().pushHistory();
        set({ layers: get().layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)) });
      },
      removeLayer: (id) => {
        const layers = get().layers;
        if (layers.length <= 1) return;
        get().pushHistory();
        const remaining = layers.filter((l) => l.id !== id);
        const fallback = remaining[0].id;
        set({
          layers: remaining,
          symbols: get().symbols.map((s) => (s.layerId === id ? { ...s, layerId: fallback } : s)),
          activeLayerId: get().activeLayerId === id ? fallback : get().activeLayerId,
        });
      },
      setActiveLayer: (id) => set({ activeLayerId: id }),

      copySelection: () => {
        const { symbols, selectedIds } = get();
        const selected = symbols.filter((s) => selectedIds.includes(s.id));
        set({ clipboard: selected });
      },
      pasteClipboard: () => {
        const { clipboard, activeLayerId, symbols } = get();
        if (clipboard.length === 0) return;
        get().pushHistory();
        const idMap = new Map<string, string>();
        clipboard.forEach((s) => idMap.set(s.id, uuid()));
        const groupIdMap = new Map<string, string>();
        const offset = 24;
        const pasted: ChartSymbol[] = clipboard.map((s) => {
          let newGroupId: string | null = null;
          if (s.groupId) {
            if (!groupIdMap.has(s.groupId)) groupIdMap.set(s.groupId, uuid());
            newGroupId = groupIdMap.get(s.groupId)!;
          }
          return {
            ...s,
            id: idMap.get(s.id)!,
            x: s.x,
            y: s.y - offset,
            layerId: activeLayerId,
            parentIds: s.parentIds.filter((p) => idMap.has(p)).map((p) => idMap.get(p)!),
            groupId: newGroupId,
          };
        });
        set({ symbols: [...symbols, ...pasted], selectedIds: pasted.map((s) => s.id) });
      },

      setGuide: (patch) => set({ guide: { ...get().guide, ...patch } }),

      addSymbolsBatch: (items) => {
        get().pushHistory();
        const { activeLayerId, symbols } = get();
        // Batch placements (round array, straight fill, drag-to-fill) are grouped
        // automatically, since they're conceptually one placement the user will likely
        // want to reselect, move, or (eventually) rotate together as a unit.
        const groupId = items.length > 1 ? uuid() : null;
        const created: ChartSymbol[] = items.map((item) => ({
          id: uuid(),
          type: item.type,
          x: item.x,
          y: item.y,
          rotation: item.rotation,
          layerId: activeLayerId,
          parentIds: [],
          attachType: "stitch",
          groupId,
        }));
        set({ symbols: [...symbols, ...created], selectedIds: created.map((s) => s.id) });
      },

      setArrayDefaults: (kind, patch) =>
        set({ arrayDefaults: { ...get().arrayDefaults, [kind]: patch } }),

      // pushHistory happens once here, covering the whole link session (every toggle +
      // the final snap), so undo reverts the entire "pick parents" gesture in one step.
      startParentLink: (symbolId) => {
        get().pushHistory();
        set({ parentLinkTargetId: symbolId });
      },
      cancelParentLink: () => set({ parentLinkTargetId: null }),
      toggleParent: (parentId) => {
        const { parentLinkTargetId, symbols } = get();
        if (!parentLinkTargetId || parentLinkTargetId === parentId) return;
        set({
          symbols: symbols.map((s) => {
            if (s.id !== parentLinkTargetId) return s;
            const has = s.parentIds.includes(parentId);
            const parentIds = has
              ? s.parentIds.filter((p) => p !== parentId)
              : [...s.parentIds, parentId];
            return { ...s, parentIds };
          }),
        });
      },
      setAttachType: (symbolId, attachType) => {
        get().pushHistory();
        set({ symbols: get().symbols.map((s) => (s.id === symbolId ? { ...s, attachType } : s)) });
      },
      applyAttachSnap: (symbolId) => {
        const { symbols } = get();
        const target = symbols.find((s) => s.id === symbolId);
        if (!target) return;
        const snapped = snapSymbolToParents(target, symbols);
        set({ symbols: symbols.map((s) => (s.id === symbolId ? snapped : s)) });
      },

      setHighlightFromSymbol: (symbolId) => {
        if (!symbolId) {
          set({ highlightIds: [] });
          return;
        }
        const symbol = get().symbols.find((s) => s.id === symbolId);
        set({ highlightIds: symbol ? symbol.parentIds : [] });
      },

      resetProject: () => {
        get().pushHistory();
        set({
          symbols: [],
          layers: [{ id: DEFAULT_LAYER_ID, name: "レイヤー1", visible: true, order: 0 }],
          activeLayerId: DEFAULT_LAYER_ID,
          selectedIds: [],
          clipboard: [],
          highlightIds: [],
          guide: DEFAULT_GUIDE,
          // Detach from whatever project was loaded, so a later "保存" doesn't silently
          // overwrite it with this blank canvas — the user has to explicitly save-as again.
          currentProjectId: null,
        });
      },
    }),
    {
      name: "crochet-chart-project",
      partialize: (state) => ({
        symbols: state.symbols,
        layers: state.layers,
        activeLayerId: state.activeLayerId,
        guide: state.guide,
        arrayDefaults: state.arrayDefaults,
        projects: state.projects,
        currentProjectId: state.currentProjectId,
      }),
    },
  ),
);
