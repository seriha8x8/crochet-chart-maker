"use client";

import { useMemo, useState } from "react";
import type { Yarn } from "@/lib/yarn/types";
import type { YarnSelection } from "@/lib/yarn/data";

export function YarnPicker({
  yarns,
  selections,
  onChange,
}: {
  yarns: Yarn[];
  selections: YarnSelection[];
  onChange: (selections: YarnSelection[]) => void;
}) {
  const [query, setQuery] = useState("");

  const yarnById = useMemo(() => new Map(yarns.map((y) => [y.id, y])), [yarns]);
  const selectedIds = useMemo(() => new Set(selections.map((s) => s.yarn_id)), [selections]);

  const candidates = yarns.filter((yarn) => {
    if (selectedIds.has(yarn.id)) return false;
    if (!query) return true;
    const haystack = `${yarn.name} ${yarn.manufacturer ?? ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  function addYarn(yarnId: string) {
    onChange([...selections, { yarn_id: yarnId, used_count: 1 }]);
  }

  function removeYarn(yarnId: string) {
    onChange(selections.filter((s) => s.yarn_id !== yarnId));
  }

  function setUsedCount(yarnId: string, count: number) {
    onChange(selections.map((s) => (s.yarn_id === yarnId ? { ...s, used_count: count } : s)));
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <span>使用した毛糸</span>

      {selections.length > 0 && (
        <ul className="flex flex-col gap-2">
          {selections.map((s) => {
            const yarn = yarnById.get(s.yarn_id);
            return (
              <li
                key={s.yarn_id}
                className="flex items-center justify-between gap-3 rounded-md border border-stone-200 bg-white px-3 py-2"
              >
                <span>{yarn?.name ?? "(削除済みの毛糸)"}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={s.used_count}
                    onChange={(e) => setUsedCount(s.yarn_id, Number(e.target.value) || 0)}
                    className="w-20 rounded-md border border-stone-300 px-2 py-1"
                  />
                  <span className="text-stone-500">玉</span>
                  <button type="button" onClick={() => removeYarn(s.yarn_id)} className="text-red-600 hover:underline">
                    削除
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <input
        type="text"
        placeholder="毛糸を検索"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="rounded-md border border-stone-300 px-3 py-2 focus:border-[#5BC8AC] focus:outline-none focus:ring-2 focus:ring-[#5BC8AC33]"
      />
      <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-md border border-stone-200 bg-white p-2">
        {candidates.length === 0 ? (
          <li className="px-2 py-1 text-stone-500">該当する毛糸がありません</li>
        ) : (
          candidates.map((yarn) => (
            <li key={yarn.id}>
              <button
                type="button"
                onClick={() => addYarn(yarn.id)}
                className="w-full rounded-md px-2 py-1 text-left hover:bg-stone-100"
              >
                {yarn.name}
                {yarn.manufacturer ? ` (${yarn.manufacturer})` : ""}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
