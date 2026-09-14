import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface KnittingCounter {
  id: number;
  name: string;
  count: number;
  /** Epoch ms of the last +1/-1, or null if never counted (or just reset). */
  lastUpdated: number | null;
}

export const COUNTER_PRESETS = ["段数", "目数", "色1", "色2", "色3"] as const;
export const MAX_COUNTERS = 8;

interface CounterState {
  counters: KnittingCounter[];
  nextId: number;
  addCounter: () => void;
  renameCounter: (id: number, name: string) => void;
  increment: (id: number) => void;
  decrement: (id: number) => void;
  resetOne: (id: number) => void;
  resetAll: () => void;
}

export const useCounterStore = create<CounterState>()(
  persist(
    (set) => ({
      counters: [{ id: 1, name: "段数", count: 0, lastUpdated: null }],
      nextId: 2,

      addCounter: () =>
        set((s) =>
          s.counters.length >= MAX_COUNTERS
            ? s
            : {
                counters: [...s.counters, { id: s.nextId, name: "カウンター", count: 0, lastUpdated: null }],
                nextId: s.nextId + 1,
              },
        ),

      renameCounter: (id, name) =>
        set((s) => ({ counters: s.counters.map((c) => (c.id === id ? { ...c, name } : c)) })),

      increment: (id) =>
        set((s) => ({
          counters: s.counters.map((c) => (c.id === id ? { ...c, count: c.count + 1, lastUpdated: Date.now() } : c)),
        })),

      decrement: (id) =>
        set((s) => ({
          counters: s.counters.map((c) =>
            c.id === id ? { ...c, count: Math.max(0, c.count - 1), lastUpdated: Date.now() } : c,
          ),
        })),

      resetOne: (id) =>
        set((s) => ({ counters: s.counters.map((c) => (c.id === id ? { ...c, count: 0, lastUpdated: null } : c)) })),

      resetAll: () => set((s) => ({ counters: s.counters.map((c) => ({ ...c, count: 0, lastUpdated: null })) })),
    }),
    {
      name: "crochet-knitting-counter",
      partialize: (state) => ({ counters: state.counters, nextId: state.nextId }),
    },
  ),
);
