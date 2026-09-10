"use client";

import { useEffect, useState, type FormEvent } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Status = "checking" | "ready" | "no-token" | "done";

const inputClass = "rounded-md border px-3 py-2 focus:outline-none focus:ring-2";

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      Promise.resolve().then(() => setStatus("no-token"));
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      Promise.resolve().then(() => setStatus("no-token"));
      return;
    }

    // The reset-password email link carries a Supabase auth token in the URL; the browser
    // client parses it automatically on load and fires PASSWORD_RECOVERY once the resulting
    // (temporary) session is ready. That can happen before this listener attaches, so also
    // check for an already-established session as a fallback.
    let settled = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        settled = true;
        setStatus("ready");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (settled) return;
      if (data.session) {
        settled = true;
        setStatus("ready");
        return;
      }
      // Give the URL token a moment to finish parsing before concluding there isn't one.
      setTimeout(() => {
        if (!settled) setStatus("no-token");
      }, 1500);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください。");
      return;
    }
    if (password !== confirmPassword) {
      setError("パスワードが一致しません。");
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    setPending(true);
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (error) {
      setError(error.message);
      return;
    }
    setStatus("done");
  }

  return (
    <div className="flex min-h-dvh flex-col" style={{ backgroundColor: "#EAF7F2" }}>
      <SiteHeader current="home" />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold" style={{ color: "#3D6B5C" }}>
          パスワードの再設定
        </h1>

        {status === "checking" && <p style={{ color: "#7FA99A" }}>確認しています…</p>}

        {status === "no-token" && (
          <p className="text-sm leading-relaxed" style={{ color: "#7FA99A" }}>
            このページは、パスワード再設定メール内のリンクから開いてください。リンクの有効期限が切れている場合は、もう一度パスワード再設定メールを送信してください。
          </p>
        )}

        {status === "ready" && (
          <form
            onSubmit={submit}
            className="flex w-full flex-col gap-3 rounded-2xl bg-white p-8 text-left"
            style={{ border: "1px solid #CDEBE1" }}
          >
            <label className="flex flex-col gap-1 text-sm" style={{ color: "#3D6B5C" }}>
              新しいパスワード
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                style={{ borderColor: "#CDEBE1" }}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm" style={{ color: "#3D6B5C" }}>
              新しいパスワード（確認）
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                style={{ borderColor: "#CDEBE1" }}
              />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="mt-1 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "#5BC8AC" }}
            >
              {pending ? "更新中…" : "パスワードを更新する"}
            </button>
          </form>
        )}

        {status === "done" && (
          <div className="flex flex-col items-center gap-4">
            <p style={{ color: "#3D6B5C" }}>パスワードを更新しました。</p>
            <a
              href="/editor"
              className="rounded-md px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "#5BC8AC" }}
            >
              編み図メーカーへ戻る
            </a>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
