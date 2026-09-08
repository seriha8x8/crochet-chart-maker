"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function YarnRootPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      router.replace("/yarn/login");
      return;
    }
    supabase.auth
      .getUser()
      .then(({ data }) => {
        router.replace(data.user ? "/yarn/yarns" : "/yarn/login");
      })
      .catch(() => {
        router.replace("/yarn/login");
      });
  }, [router]);

  return <p className="px-4 py-10 text-center text-sm text-stone-500">読み込み中…</p>;
}
