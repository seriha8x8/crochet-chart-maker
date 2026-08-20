"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { loadProjectFromCloud, saveProjectToCloud } from "@/lib/supabase/cloudSync";
import { useChartStore } from "@/store/chartStore";

export function CloudSyncControl() {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  useEffect(() => {
    if (!configured) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [configured]);

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
        <span className="font-semibold text-ink/50">クラウド保存にサインイン</span>
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
                const { error } = await supabase.auth.signInWithOtp({ email });
                setStatus(error ? error.message : null);
                if (!error) setMagicLinkSent(true);
              }}
            >
              マジックリンクを送信
            </button>
          </>
        )}
        {status && <p className="text-red-500">{status}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 text-xs">
      <span className="truncate text-ink/50">{user.email}</span>
      <div className="flex gap-1">
        <button
          className="flex-1 rounded border border-peach/60 px-2 py-1 text-ink hover:bg-cream/60"
          onClick={async () => {
            setStatus("保存中…");
            try {
              const { symbols, layers, guide } = useChartStore.getState();
              await saveProjectToCloud(user.id, { symbols, layers, guide });
              setStatus("保存しました");
            } catch (e) {
              setStatus(e instanceof Error ? e.message : "保存に失敗しました");
            }
          }}
        >
          保存
        </button>
        <button
          className="flex-1 rounded border border-peach/60 px-2 py-1 text-ink hover:bg-cream/60"
          onClick={async () => {
            setStatus("読み込み中…");
            try {
              const project = await loadProjectFromCloud(user.id);
              if (project) {
                useChartStore.setState({
                  symbols: project.symbols,
                  layers: project.layers.length > 0 ? project.layers : useChartStore.getState().layers,
                  guide: project.guide,
                  selectedIds: [],
                });
                setStatus("読み込みました");
              } else {
                setStatus("保存データがありません");
              }
            } catch (e) {
              setStatus(e instanceof Error ? e.message : "読み込みに失敗しました");
            }
          }}
        >
          読み込み
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
