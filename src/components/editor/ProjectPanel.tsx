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
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  const currentProject = projects.find((p) => p.id === currentProjectId) ?? null;
  const sortedProjects = [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const flashSaved = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  };

  const commitRename = () => {
    if (currentProject && renameDraft.trim()) renameProject(currentProject.id, renameDraft.trim());
    setIsRenaming(false);
  };

  return (
    <div className="flex flex-col gap-1.5 border-b border-peach/40 p-3">
      <h2 className="text-xs font-semibold text-ink/50">プロジェクト</h2>

      {sortedProjects.length > 0 ? (
        <select
          className="w-full truncate rounded-md border border-peach/60 bg-white px-2 py-1 text-sm text-ink"
          value={currentProjectId ?? ""}
          onChange={(e) => {
            if (e.target.value) loadProject(e.target.value);
          }}
        >
          {!currentProject && <option value="">未保存の作品</option>}
          {sortedProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}（{formatDate(p.updatedAt)}）
            </option>
          ))}
        </select>
      ) : (
        <div className="truncate text-sm font-medium text-ink">未保存の作品</div>
      )}

      {currentProject && (
        <div className="flex gap-1.5 text-xs">
          {isRenaming ? (
            <input
              autoFocus
              className="min-w-0 flex-1 rounded border border-pink/50 px-2 py-1 text-ink"
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                else if (e.key === "Escape") setIsRenaming(false);
              }}
            />
          ) : (
            <>
              <button
                className="flex-1 rounded-md border border-peach/60 px-2 py-1 text-ink hover:bg-cream/60"
                onClick={() => {
                  setRenameDraft(currentProject.name);
                  setIsRenaming(true);
                }}
              >
                名前を変更
              </button>
              <button
                className="rounded-md border border-red-200 px-2 py-1 text-red-600 hover:bg-red-50"
                onClick={() => {
                  if (confirm(`「${currentProject.name}」を削除します。よろしいですか？`)) deleteProject(currentProject.id);
                }}
              >
                削除
              </button>
            </>
          )}
        </div>
      )}

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
    </div>
  );
}
