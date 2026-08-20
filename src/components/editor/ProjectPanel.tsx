"use client";

import { useState } from "react";
import { useChartStore } from "@/store/chartStore";

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function ProjectPanel() {
  const projects = useChartStore((s) => s.projects);
  const currentProjectId = useChartStore((s) => s.currentProjectId);
  const saveProjectAs = useChartStore((s) => s.saveProjectAs);
  const saveCurrentProject = useChartStore((s) => s.saveCurrentProject);
  const loadProject = useChartStore((s) => s.loadProject);
  const renameProject = useChartStore((s) => s.renameProject);
  const deleteProject = useChartStore((s) => s.deleteProject);

  const [showSaveAs, setShowSaveAs] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showList, setShowList] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const currentProject = projects.find((p) => p.id === currentProjectId) ?? null;
  const others = projects.filter((p) => p.id !== currentProjectId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const flashSaved = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  };

  return (
    <div className="flex flex-col gap-1.5 border-b border-peach/40 p-3">
      <h2 className="text-xs font-semibold text-ink/50">プロジェクト</h2>

      <div className="truncate text-sm font-medium text-ink">
        {currentProject ? currentProject.name : "未保存の作品"}
      </div>

      <div className="flex gap-1.5 text-xs">
        <button
          className="flex-1 rounded-md border border-peach/60 px-2 py-1 text-ink hover:bg-cream/60"
          onClick={() => {
            saveCurrentProject();
            flashSaved();
          }}
        >
          {savedFlash ? "保存しました" : "保存"}
        </button>
        <button
          className="flex-1 rounded-md border border-peach/60 px-2 py-1 text-ink hover:bg-cream/60"
          onClick={() => {
            setDraftName(currentProject ? `${currentProject.name}のコピー` : "無題の作品");
            setShowSaveAs(true);
          }}
        >
          名前を付けて保存
        </button>
      </div>

      {showSaveAs && (
        <div className="flex gap-1">
          <input
            autoFocus
            className="min-w-0 flex-1 rounded border border-pink/50 px-2 py-1 text-xs text-ink"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draftName.trim()) {
                saveProjectAs(draftName.trim());
                setShowSaveAs(false);
              } else if (e.key === "Escape") {
                setShowSaveAs(false);
              }
            }}
          />
          <button
            className="rounded bg-pink px-2 py-1 text-xs text-white hover:bg-salmon"
            onClick={() => {
              if (draftName.trim()) {
                saveProjectAs(draftName.trim());
                setShowSaveAs(false);
              }
            }}
          >
            保存
          </button>
        </div>
      )}

      {(currentProject ? others.length : projects.length) > 0 && (
        <div className="flex flex-col gap-1">
          <button
            className="self-start text-[11px] text-ink/40 hover:text-pink"
            onClick={() => setShowList((v) => !v)}
          >
            {showList ? "▾" : "▸"} 他の作品を開く（{currentProject ? others.length : projects.length}）
          </button>
          {showList && (
            <ul className="flex max-h-40 flex-col gap-0.5 overflow-auto">
              {(currentProject ? others : projects).map((p) => (
                <li
                  key={p.id}
                  className={`flex items-center gap-1 rounded px-1.5 py-1 text-xs hover:bg-cream/60 ${
                    p.id === currentProjectId ? "bg-peach/25" : ""
                  }`}
                >
                  {editingId === p.id ? (
                    <input
                      autoFocus
                      className="min-w-0 flex-1 rounded border border-pink/50 px-1 py-0.5"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => {
                        if (editingName.trim()) renameProject(p.id, editingName.trim());
                        setEditingId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (editingName.trim()) renameProject(p.id, editingName.trim());
                          setEditingId(null);
                        }
                      }}
                    />
                  ) : (
                    <button
                      className="min-w-0 flex-1 truncate text-left"
                      title="クリックして開く・ダブルクリックで名前変更"
                      onClick={() => loadProject(p.id)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingId(p.id);
                        setEditingName(p.name);
                      }}
                    >
                      {p.name}
                    </button>
                  )}
                  <span className="shrink-0 text-ink/30">{formatDate(p.updatedAt)}</span>
                  <button
                    className="shrink-0 text-ink/30 hover:text-red-500"
                    title="削除"
                    onClick={() => {
                      if (confirm(`「${p.name}」を削除します。よろしいですか？`)) deleteProject(p.id);
                    }}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
