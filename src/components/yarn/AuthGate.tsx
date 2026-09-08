"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { YarnAppHeader } from "@/components/yarn/YarnAppHeader";

const YarnUserContext = createContext<User | null>(null);

export function useYarnUser(): User {
  const user = useContext(YarnUserContext);
  if (!user) throw new Error("useYarnUser must be used within RequireYarnUser");
  return user;
}

/** Client-side equivalent of the old proxy.ts redirect: since this app ships as a
 *  static export there's no middleware, so each protected page waits for the browser
 *  Supabase session to resolve and sends signed-out visitors to /yarn/login itself. */
export function RequireYarnUser({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      Promise.resolve().then(() => setUser(null));
      return;
    }
    supabase.auth
      .getUser()
      .then(({ data }) => {
        setUser(data.user ?? null);
      })
      .catch(() => {
        // A network hiccup here shouldn't leave the page stuck on "loading" forever —
        // fall back to treating the visitor as signed out, same as the onAuthStateChange path.
        setUser(null);
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user === null) router.replace("/yarn/login");
  }, [user, router]);

  if (!user) {
    return <p className="px-4 py-10 text-center text-sm text-stone-500">読み込み中…</p>;
  }

  return (
    <YarnUserContext.Provider value={user}>
      <YarnAppHeader user={user} />
      {children}
    </YarnUserContext.Provider>
  );
}
