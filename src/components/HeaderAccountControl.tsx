"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

type AuthMode = "signin" | "signup" | "forgot";

const inputClass =
  "rounded-md border px-2 py-1.5 text-sm text-[#2f2f2f] focus:outline-none focus:ring-2";

export function HeaderAccountControl() {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!configured) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    supabase.auth
      .getUser()
      .then(({ data }) => setUser(data.user ?? null))
      .catch(() => setUser(null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [configured]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (!configured || user === undefined) return null;

  if (!user) {
    return (
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-white"
          style={{ backgroundColor: "#5BC8AC" }}
        >
          ログイン
        </button>
        {open && <LoginPopover onClose={() => setOpen(false)} />}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-[#4a5b57]">
      <span className="hidden max-w-[12rem] truncate sm:inline">{user.email}</span>
      <button
        type="button"
        className="whitespace-nowrap rounded-md border px-2.5 py-1 text-xs hover:bg-white/60"
        style={{ borderColor: "#5BC8AC66" }}
        onClick={async () => {
          const supabase = getSupabaseClient();
          await supabase?.auth.signOut();
        }}
      >
        サインアウト
      </button>
    </div>
  );
}

function LoginPopover({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit() {
    const supabase = getSupabaseClient();
    if (!supabase || !email) return;
    setStatus(null);
    setInfo(null);

    if (mode === "forgot") {
      setPending(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setPending(false);
      if (error) {
        setStatus(error.message);
        return;
      }
      setInfo("パスワード再設定用のメールを送信しました。メール内のリンクから新しいパスワードを設定してください。");
      return;
    }

    if (!password) return;
    setPending(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/editor` },
      });
      setPending(false);
      if (error) {
        setStatus(error.message);
        return;
      }
      setInfo("確認メールを送信しました。メール内のリンクをクリックすると登録が完了します。");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    onClose();
  }

  return (
    <div
      className="absolute right-0 top-full z-30 mt-2 w-72 rounded-lg border bg-white p-4 shadow-lg"
      style={{ borderColor: "#5BC8AC33" }}
    >
      <div className="mb-3 flex gap-1.5 text-xs">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            className="flex-1 rounded-md px-2 py-1.5 font-medium"
            style={
              mode === m
                ? { backgroundColor: "#5BC8AC", color: "white" }
                : { backgroundColor: "#EAF7F2", color: "#4a5b57" }
            }
            onClick={() => {
              setMode(m);
              setStatus(null);
              setInfo(null);
            }}
          >
            {m === "signin" ? "ログイン" : "新規登録"}
          </button>
        ))}
      </div>

      {info ? (
        <p className="text-xs leading-relaxed text-[#4a5b57]">{info}</p>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            type="email"
            placeholder="you@example.com"
            className={inputClass}
            style={{ borderColor: "#5BC8AC66" }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {mode !== "forgot" && (
            <input
              type="password"
              placeholder="パスワード"
              className={inputClass}
              style={{ borderColor: "#5BC8AC66" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          )}
          <button
            type="button"
            disabled={pending}
            onClick={submit}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "#5BC8AC" }}
          >
            {pending ? "処理中…" : mode === "signup" ? "登録する" : mode === "forgot" ? "再設定メールを送る" : "ログイン"}
          </button>
          {mode === "signin" && (
            <button type="button" className="self-start text-xs text-[#5a6b66] hover:underline" onClick={() => setMode("forgot")}>
              パスワードをお忘れですか？
            </button>
          )}
          {mode === "forgot" && (
            <button type="button" className="self-start text-xs text-[#5a6b66] hover:underline" onClick={() => setMode("signin")}>
              ログインに戻る
            </button>
          )}
          {status && <p className="text-xs text-red-500">{status}</p>}
        </div>
      )}
    </div>
  );
}
