"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { YarnAppHeader } from "@/components/yarn/YarnAppHeader";

/** undefined = auth state not resolved yet, null = signed out. */
const YarnUserContext = createContext<User | null | undefined>(undefined);

export function useYarnUser(): User {
  const user = useContext(YarnUserContext);
  if (!user) throw new Error("useYarnUser must be used within RequireYarnUser");
  return user;
}

/** For pages that render for signed-out visitors too (see YarnPublicShell) and need to
 *  branch on auth state themselves instead of being redirected. */
export function useOptionalYarnUser(): User | null | undefined {
  return useContext(YarnUserContext);
}

/** Client-side equivalent of the old proxy.ts redirect: since this app ships as a
 *  static export there's no middleware, so each page resolves the browser Supabase
 *  session itself. */
function useYarnAuthState() {
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

  return user;
}

/** Hard-gates a page behind login: signed-out visitors are redirected to /yarn/login.
 *  Use for pages that only make sense once signed in (registering/editing something). */
export function RequireYarnUser({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useYarnAuthState();

  useEffect(() => {
    if (user === null) router.replace("/yarn/login");
  }, [user, router]);

  if (!user) {
    return <p className="px-4 py-10 text-center text-sm text-stone-500">読み込み中…</p>;
  }

  return (
    <YarnUserContext.Provider value={user}>
      <YarnAppHeader />
      {children}
    </YarnUserContext.Provider>
  );
}

/** Like RequireYarnUser, but never redirects — signed-out visitors still see the page
 *  (via useOptionalYarnUser) so browsing doesn't require an account. Only actions that
 *  actually need one (registering a yarn, etc.) route through RequireYarnUser pages. */
export function YarnPublicShell({ children }: { children: ReactNode }) {
  const user = useYarnAuthState();

  return (
    <YarnUserContext.Provider value={user}>
      <YarnAppHeader />
      {children}
    </YarnUserContext.Provider>
  );
}
