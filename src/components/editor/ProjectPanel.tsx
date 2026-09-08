"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  deleteCloudProject,
  getProfilePlan,
  listCloudProjects,
  loadCloudProject,
  renameCloudProject,
  saveNewCloudProject,
  setProfilePlanForTesting,
  updateCloudProject,
  FREE_PLAN_PROJECT_LIMIT,
  ProjectLimitError,
  type CloudProjectSummary,
  type Plan,
} from "@/lib/supabase/cloudSync";
import { useChartStore } from "@/store/chartStore";

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Only one project switcher is ever shown: the local (this-browser) list while signed out,
 *  the account's cloud list once signed in — never both, so there's no "which list is this"
 *  confusion between two separately-saved sets of projects. */
export function ProjectPanel() {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [cloudProjects, setCloudProjects] = useState<CloudProjectSummary[]>([]);
  const [currentCloudProjectId, setCurrentCloudProjectId] = useState<string | null>(null);
  const [isRecovery, setIsRecovery] = useState(false);
  const plan = useChartStore((s) => s.plan);
  const setPlan = useChartStore((s) => s.setPlan);
  const resetProject = useChartStore((s) => s.resetProject);

  const refreshAccount = useCallback(
    async (u: User) => {
      const [fetchedPlan, projects] = await Promise.all([getProfilePlan(u.id), listCloudProjects(u.id)]);
      setPlan(fetchedPlan);
      setCloudProjects(projects);
    },
    [setPlan],
  );

  useEffect(() => {
    if (!configured) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (data.user) refreshAccount(data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      // Clicking a password-reset email link signs the browser in transiently just so
      // updateUser({ password }) can be called — that's not "really" being logged in, so
      // this takes over the whole panel with a "set a new password" form instead of
      // showing the normal (now technically authenticated) project view underneath it.
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
      if (session?.user) {
        refreshAccount(session.user);
      } else {
        setPlan(null);
        setCloudProjects([]);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [configured, setPlan, refreshAccount]);

  if (isRecovery) {
    return (
      <div className="flex flex-col gap-1.5 border-b border-peach/40 p-3">
        <h2 className="text-xs font-semibold text-ink/50">新しいパスワードを設定</h2>
        <PasswordRecoveryForm onDone={() => setIsRecovery(false)} />
      </div>
    );
  }

  // A free-plan user at their cloud save limit can't create a 4th project even
  // temporarily/unsaved — otherwise the limit is really "3 saved + 1 free-floating extra",
  // not an actual cap. Signed-out (local) users have no limit, so this never applies there.
  const atProjectLimit = !!user && plan !== "premium" && cloudProjects.length >= FREE_PLAN_PROJECT_LIMIT;

  return (
    <div className="flex flex-col gap-1.5 border-b border-peach/40 p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-ink/50">プロジェクト</h2>
        <button
          className="text-[11px] text-pink hover:underline disabled:cursor-not-allowed disabled:text-ink/30 disabled:no-underline"
          disabled={atProjectLimit}
          title={atProjectLimit ? `無料プランは保存${FREE_PLAN_PROJECT_LIMIT}つまでのため、新しく始めることはできません。既存のプロジェクトを削除するか、プレミアムにアップグレードしてください。` : undefined}
          onClick={() => {
            if (!confirm("新しい編み図を始めます。今のキャンバスの内容は消えますが、保存済みのものはそのまま残ります。よろしいですか？")) return;
            resetProject();
            setCurrentCloudProjectId(null);
          }}
        >
          ＋ 新規作成
        </button>
      </div>
      {user ? (
        <CloudProjectSection
          user={user}
          cloudProjects={cloudProjects}
          onRefresh={refreshAccount}
          currentCloudProjectId={currentCloudProjectId}
          setCurrentCloudProjectId={setCurrentCloudProjectId}
          atProjectLimit={atProjectLimit}
        />
      ) : (
        <LocalProjectSection />
      )}
      {configured && <AccountLine user={user} />}
    </div>
  );
}

function LocalProjectSection() {
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
    <>
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
    </>
  );
}

function CloudProjectSection({
  user,
  cloudProjects,
  onRefresh,
  currentCloudProjectId,
  setCurrentCloudProjectId,
  atProjectLimit,
}: {
  user: User;
  cloudProjects: CloudProjectSummary[];
  onRefresh: (user: User) => Promise<void>;
  currentCloudProjectId: string | null;
  setCurrentCloudProjectId: (id: string | null) => void;
  atProjectLimit: boolean;
}) {
  const plan = useChartStore((s) => s.plan);
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const refresh = useCallback(
    async (u: User) => {
      try {
        await onRefresh(u);
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "アカウント情報の取得に失敗しました");
      }
    },
    [onRefresh],
  );

  const currentProject = cloudProjects.find((p) => p.id === currentCloudProjectId) ?? null;
  const currentContent = () => {
    const { symbols, layers, guide } = useChartStore.getState();
    return { symbols, layers, guide };
  };

  const saveAsNew = async (name: string) => {
    setStatus("保存中…");
    try {
      const saved = await saveNewCloudProject(user.id, plan ?? "free", { name, ...currentContent() });
      setCurrentCloudProjectId(saved.id);
      setShowSaveAs(false);
      await refresh(user);
      setStatus("保存しました");
    } catch (e) {
      if (e instanceof ProjectLimitError) {
        setStatus(`無料プランは保存${FREE_PLAN_PROJECT_LIMIT}つまでです。プレミアムにアップグレードすると無制限に保存できます。`);
      } else {
        setStatus(e instanceof Error ? e.message : "保存に失敗しました");
      }
    }
  };

  return (
    <>
      {cloudProjects.length > 0 ? (
        <select
          className="w-full truncate rounded-md border border-peach/60 bg-white px-2 py-1 text-sm text-ink"
          value={currentCloudProjectId ?? ""}
          onChange={async (e) => {
            const id = e.target.value;
            if (!id) return;
            setStatus("読み込み中…");
            try {
              const project = await loadCloudProject(user.id, id);
              if (project) {
                useChartStore.setState({
                  symbols: project.symbols,
                  layers: project.layers.length > 0 ? project.layers : useChartStore.getState().layers,
                  guide: project.guide,
                  selectedIds: [],
                });
                setCurrentCloudProjectId(id);
                setStatus(null);
              }
            } catch (err) {
              setStatus(err instanceof Error ? err.message : "読み込みに失敗しました");
            }
          }}
        >
          {!currentProject && <option value="">未保存の作品</option>}
          {cloudProjects.map((p) => (
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
              onBlur={async () => {
                setIsRenaming(false);
                if (renameDraft.trim() && currentProject) {
                  try {
                    await renameCloudProject(user.id, currentProject.id, renameDraft.trim());
                    await refresh(user);
                  } catch (err) {
                    setStatus(err instanceof Error ? err.message : "名前の変更に失敗しました");
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
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
                onClick={async () => {
                  if (!confirm(`「${currentProject.name}」を削除します。よろしいですか？`)) return;
                  try {
                    await deleteCloudProject(user.id, currentProject.id);
                    setCurrentCloudProjectId(null);
                    await refresh(user);
                  } catch (err) {
                    setStatus(err instanceof Error ? err.message : "削除に失敗しました");
                  }
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
          className="flex-1 rounded-md border border-peach/60 px-2 py-1 text-ink hover:bg-cream/60 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!currentProject}
          onClick={async () => {
            if (!currentProject) return;
            setStatus("保存中…");
            try {
              await updateCloudProject(user.id, currentProject.id, { name: currentProject.name, ...currentContent() });
              await refresh(user);
              setStatus("保存しました");
            } catch (err) {
              setStatus(err instanceof Error ? err.message : "保存に失敗しました");
            }
          }}
        >
          保存
        </button>
        <button
          className="flex-1 rounded-md border border-peach/60 px-2 py-1 text-ink hover:bg-cream/60 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={atProjectLimit}
          title={atProjectLimit ? `無料プランは保存${FREE_PLAN_PROJECT_LIMIT}つまでです。` : undefined}
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
            onKeyDown={async (e) => {
              if (e.key === "Enter" && draftName.trim()) {
                await saveAsNew(draftName.trim());
              } else if (e.key === "Escape") {
                setShowSaveAs(false);
              }
            }}
          />
          <button
            className="rounded bg-pink px-2 py-1 text-xs text-white hover:bg-salmon"
            onClick={() => draftName.trim() && saveAsNew(draftName.trim())}
          >
            保存
          </button>
        </div>
      )}

      {plan !== "premium" && (
        <p className="text-[11px] leading-relaxed text-ink/40">
          無料プランは保存{FREE_PLAN_PROJECT_LIMIT}つまでです。
        </p>
      )}
      {status && <p className="text-[11px] text-ink/50">{status}</p>}
    </>
  );
}

type AuthMode = "signin" | "signup" | "forgot";

function AccountLine({ user }: { user: User | null }) {
  const plan = useChartStore((s) => s.plan);
  const setPlan = useChartStore((s) => s.setPlan);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!user) {
    const submit = async () => {
      const supabase = getSupabaseClient();
      if (!supabase || !email) return;
      setStatus(null);
      setInfo(null);
      if (mode === "forgot") {
        setStatus("送信中…");
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        setStatus(error ? error.message : null);
        if (!error) setInfo("パスワード再設定用のメールを送信しました。メール内のリンクから新しいパスワードを設定してください。");
        return;
      }
      if (!password) return;
      setStatus(mode === "signup" ? "登録中…" : "ログイン中…");
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        setStatus(error ? error.message : null);
        if (!error) setInfo("確認メールを送信しました。メール内のリンクをクリックすると登録が完了します。");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setStatus(error ? error.message : null);
      }
    };

    return (
      <div className="mt-1 flex flex-col gap-1 border-t border-peach/40 pt-2 text-[11px]">
        <div className="flex gap-2 text-ink/50">
          <button
            className={mode === "signin" ? "font-semibold text-ink" : "hover:underline"}
            onClick={() => {
              setMode("signin");
              setStatus(null);
              setInfo(null);
            }}
          >
            ログイン
          </button>
          <button
            className={mode === "signup" ? "font-semibold text-ink" : "hover:underline"}
            onClick={() => {
              setMode("signup");
              setStatus(null);
              setInfo(null);
            }}
          >
            新規登録
          </button>
        </div>
        {info ? (
          <p className="text-ink/50">{info}</p>
        ) : (
          <>
            <input
              type="email"
              placeholder="you@example.com"
              className="rounded border border-peach/60 px-2 py-1 text-ink"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {mode !== "forgot" && (
              <input
                type="password"
                placeholder="パスワード"
                className="rounded border border-peach/60 px-2 py-1 text-ink"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            )}
            <button className="rounded bg-pink px-2 py-1 text-white hover:bg-salmon" onClick={submit}>
              {mode === "signup" ? "登録する" : mode === "forgot" ? "再設定メールを送る" : "ログイン"}
            </button>
            {mode === "signin" && (
              <button className="self-start text-ink/40 hover:underline" onClick={() => setMode("forgot")}>
                パスワードをお忘れですか？
              </button>
            )}
            {mode === "forgot" && (
              <button className="self-start text-ink/40 hover:underline" onClick={() => setMode("signin")}>
                ログインに戻る
              </button>
            )}
          </>
        )}
        {status && <p className="text-red-500">{status}</p>}
      </div>
    );
  }

  return (
    <div className="mt-1 flex flex-col gap-1 border-t border-peach/40 pt-2 text-[11px]">
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-ink/50">{user.email}</span>
        <button
          className="shrink-0 text-ink/40 hover:underline"
          onClick={async () => {
            const supabase = getSupabaseClient();
            await supabase?.auth.signOut();
          }}
        >
          サインアウト
        </button>
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className="text-ink/70">
          プラン: <span className="font-semibold">{plan === "premium" ? "プレミアム" : "無料"}</span>
        </span>
        <button
          className="shrink-0 text-purple-700 underline hover:text-purple-900"
          title="決済機能はまだないため、テスト用に手動で切り替えられます"
          onClick={async () => {
            setStatus(null);
            try {
              await setProfilePlanForTesting(user.id, plan === "premium" ? "free" : "premium");
              setPlan(plan === "premium" ? ("free" as Plan) : ("premium" as Plan));
            } catch (e) {
              setStatus(e instanceof Error ? e.message : "プランの切り替えに失敗しました");
            }
          }}
        >
          {plan === "premium" ? "無料に戻す（テスト）" : "プレミアムにする（テスト）"}
        </button>
      </div>
      {status && <p className="text-ink/50">{status}</p>}
    </div>
  );
}

function PasswordRecoveryForm({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const submit = async () => {
    const supabase = getSupabaseClient();
    if (!supabase || password.length < 6) {
      setStatus("6文字以上のパスワードを入力してください。");
      return;
    }
    setStatus("変更中…");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus(error.message);
      return;
    }
    onDone();
  };

  return (
    <div className="flex flex-col gap-1 text-xs">
      <input
        type="password"
        placeholder="新しいパスワード（6文字以上）"
        className="rounded border border-peach/60 px-2 py-1 text-ink"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <button className="rounded bg-pink px-2 py-1 text-white hover:bg-salmon" onClick={submit}>
        変更する
      </button>
      {status && <p className="text-[11px] text-red-500">{status}</p>}
    </div>
  );
}
