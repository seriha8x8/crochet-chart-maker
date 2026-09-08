"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function YarnLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (data.user) router.replace("/yarn/yarns");
      })
      .catch(() => {
        // Network hiccup: just stay on the login form.
      });
  }, [router]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase が設定されていません。");
      return;
    }

    setError(null);
    setMessage(null);
    setPending(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(error.message);
          return;
        }
        router.replace("/yarn/yarns");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/yarn/yarns` },
        });
        if (error) {
          setError(error.message);
          return;
        }
        if (!data.session) {
          setMessage("確認メールを送信しました。メール内のリンクから登録を完了してください。");
          return;
        }
        router.replace("/yarn/yarns");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <h1 className="text-2xl font-semibold">毛糸管理アプリ</h1>
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6 rounded-lg border border-stone-200 p-8">
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            className={`flex-1 rounded-md px-3 py-2 font-medium ${
              mode === "signin" ? "bg-rose-600 text-white" : "bg-pink-100 text-stone-700"
            }`}
            onClick={() => {
              setMode("signin");
              setError(null);
              setMessage(null);
            }}
          >
            ログイン
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md px-3 py-2 font-medium ${
              mode === "signup" ? "bg-rose-600 text-white" : "bg-pink-100 text-stone-700"
            }`}
            onClick={() => {
              setMode("signup");
              setError(null);
              setMessage(null);
            }}
          >
            新規登録
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            メールアドレス
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-stone-300 px-3 py-2 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            パスワード
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-stone-300 px-3 py-2 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {pending ? "処理中..." : mode === "signin" ? "ログイン" : "アカウント作成"}
          </button>
        </form>
      </div>
    </div>
  );
}
