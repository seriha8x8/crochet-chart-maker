"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  deleteCloudProject,
  getProfilePlan,
  listCloudProjects,
  loadCloudProject,
  saveNewCloudProject,
  setProfilePlanForTesting,
  updateCloudProject,
  FREE_PLAN_PROJECT_LIMIT,
  ProjectLimitError,
  type CloudProjectSummary,
} from "@/lib/supabase/cloudSync";
import { useChartStore } from "@/store/chartStore";

export function CloudSyncControl() {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [cloudProjects, setCloudProjects] = useState<CloudProjectSummary[]>([]);
  const [currentCloudProjectId, setCurrentCloudProjectId] = useState<string | null>(null);
  const plan = useChartStore((s) => s.plan);
  const setPlan = useChartStore((s) => s.setPlan);

  const refreshAccount = useCallback(async (u: User) => {
    try {
      const [fetchedPlan, projects] = await Promise.all([getProfilePlan(u.id), listCloudProjects(u.id)]);
      setPlan(fetchedPlan);
      setCloudProjects(projects);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "アカウント情報の取得に失敗しました");
    }
  }, [setPlan]);

  useEffect(() => {
    if (!configured) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (data.user) refreshAccount(data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        refreshAccount(session.user);
      } else {
        setPlan(null);
        setCloudProjects([]);
        setCurrentCloudProjectId(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [configured, setPlan, refreshAccount]);

  if (!configured) {
    return (
      <p className="text-[11px] leading-relaxed text-ink/40">
        編み図はこの端末のブラウザに自動保存されます。
      </p>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-1.5 text-xs">
        <span className="font-semibold text-ink/50">登録・ログイン</span>
        {magicLinkSent ? (
          <p className="text-ink/50">メールを確認してリンクをクリックしてください。</p>
        ) : (
          <>
            <input
              type="email"
              placeholder="you@example.com"
              className="rounded border border-peach/60 px-2 py-1 text-ink"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              className="rounded bg-pink px-2 py-1 text-white hover:bg-salmon"
              onClick={async () => {
                const supabase = getSupabaseClient();
                if (!supabase || !email) return;
                setStatus("送信中…");
                // This Supabase project is shared with another app, whose own URL is very
                // likely what's configured as the project's default Auth redirect — without
                // this, the magic link would send people there instead of back here.
                const { error } = await supabase.auth.signInWithOtp({
                  email,
                  options: { emailRedirectTo: window.location.origin },
                });
                setStatus(error ? error.message : null);
                if (!error) setMagicLinkSent(true);
              }}
            >
              マジックリンクを送信
            </button>
            <p className="text-[11px] leading-relaxed text-ink/40">
              初めてのメールアドレスは自動的に新規登録されます。
            </p>
          </>
        )}
        {status && <p className="text-red-500">{status}</p>}
      </div>
    );
  }

  const atProjectLimit = plan !== "premium" && cloudProjects.length >= FREE_PLAN_PROJECT_LIMIT;

  const currentContent = () => {
    const { symbols, layers, guide } = useChartStore.getState();
    return { symbols, layers, guide };
  };

  return (
    <div className="flex flex-col gap-2 text-xs">
      <span className="truncate text-ink/50">{user.email}</span>

      <div className="flex items-center justify-between rounded border border-peach/60 px-2 py-1.5">
        <span className="text-ink/70">
          プラン: <span className="font-semibold">{plan === "premium" ? "プレミアム" : "無料"}</span>
        </span>
        <button
          className="text-[11px] text-purple-700 underline hover:text-purple-900"
          title="決済機能はまだないため、テスト用に手動で切り替えられます"
          onClick={async () => {
            setStatus(null);
            try {
              await setProfilePlanForTesting(user.id, plan === "premium" ? "free" : "premium");
              await refreshAccount(user);
            } catch (e) {
              setStatus(e instanceof Error ? e.message : "プランの切り替えに失敗しました");
            }
          }}
        >
          {plan === "premium" ? "無料プランに戻す（テスト用）" : "プレミアムに切り替える（テスト用）"}
        </button>
      </div>
      {plan !== "premium" && (
        <p className="text-[11px] leading-relaxed text-ink/40">
          無料プランは編み図の保存が{FREE_PLAN_PROJECT_LIMIT}つまで、記号への色付けは利用できません。
        </p>
      )}

      <div className="flex flex-col gap-1">
        <span className="font-semibold text-ink/50">
          保存した編み図（{cloudProjects.length}
          {plan !== "premium" ? `/${FREE_PLAN_PROJECT_LIMIT}` : ""}）
        </span>
        {cloudProjects.length === 0 && <p className="text-ink/40">まだありません。</p>}
        {cloudProjects.map((p) => (
          <div
            key={p.id}
            className={`flex items-center justify-between gap-1 rounded border px-2 py-1 ${
              currentCloudProjectId === p.id ? "border-pink bg-cream/60" : "border-peach/60"
            }`}
          >
            <span className="truncate text-ink">{p.name}</span>
            <div className="flex shrink-0 gap-1">
              <button
                className="text-ink/60 hover:text-pink"
                onClick={async () => {
                  setStatus("読み込み中…");
                  try {
                    const project = await loadCloudProject(user.id, p.id);
                    if (project) {
                      useChartStore.setState({
                        symbols: project.symbols,
                        layers: project.layers.length > 0 ? project.layers : useChartStore.getState().layers,
                        guide: project.guide,
                        selectedIds: [],
                      });
                      setCurrentCloudProjectId(p.id);
                      setStatus("読み込みました");
                    }
                  } catch (e) {
                    setStatus(e instanceof Error ? e.message : "読み込みに失敗しました");
                  }
                }}
              >
                読み込み
              </button>
              <button
                className="text-ink/40 hover:text-red-500"
                onClick={async () => {
                  if (!confirm(`「${p.name}」を削除しますか？`)) return;
                  setStatus("削除中…");
                  try {
                    await deleteCloudProject(user.id, p.id);
                    if (currentCloudProjectId === p.id) setCurrentCloudProjectId(null);
                    await refreshAccount(user);
                    setStatus(null);
                  } catch (e) {
                    setStatus(e instanceof Error ? e.message : "削除に失敗しました");
                  }
                }}
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1">
        <button
          className="flex-1 rounded border border-peach/60 px-2 py-1 text-ink hover:bg-cream/60 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!currentCloudProjectId}
          onClick={async () => {
            if (!currentCloudProjectId) return;
            setStatus("保存中…");
            try {
              const existing = cloudProjects.find((p) => p.id === currentCloudProjectId);
              await updateCloudProject(user.id, currentCloudProjectId, {
                name: existing?.name ?? "無題の作品",
                ...currentContent(),
              });
              await refreshAccount(user);
              setStatus("保存しました");
            } catch (e) {
              setStatus(e instanceof Error ? e.message : "保存に失敗しました");
            }
          }}
        >
          上書き保存
        </button>
        <button
          className="flex-1 rounded border border-peach/60 px-2 py-1 text-ink hover:bg-cream/60 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={atProjectLimit}
          title={atProjectLimit ? "無料プランの保存上限に達しています" : undefined}
          onClick={async () => {
            const name = prompt("編み図の名前", "無題の作品");
            if (!name) return;
            setStatus("保存中…");
            try {
              const saved = await saveNewCloudProject(user.id, plan ?? "free", { name, ...currentContent() });
              setCurrentCloudProjectId(saved.id);
              await refreshAccount(user);
              setStatus("保存しました");
            } catch (e) {
              if (e instanceof ProjectLimitError) {
                setStatus(`無料プランは保存${FREE_PLAN_PROJECT_LIMIT}つまでです。プレミアムにアップグレードすると無制限に保存できます。`);
              } else {
                setStatus(e instanceof Error ? e.message : "保存に失敗しました");
              }
            }
          }}
        >
          新しく保存
        </button>
      </div>

      <button
        className="text-left text-ink/40 hover:underline"
        onClick={async () => {
          const supabase = getSupabaseClient();
          await supabase?.auth.signOut();
        }}
      >
        サインアウト
      </button>
      {status && <p className="text-ink/50">{status}</p>}
    </div>
  );
}
