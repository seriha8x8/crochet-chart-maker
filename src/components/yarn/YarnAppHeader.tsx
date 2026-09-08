"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";

export function YarnAppHeader({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-[#5BC8AC33]">
      <div className="h-1 bg-gradient-to-r from-[#5BC8AC] via-[#98DBC6] to-[#F18D9E]" />
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link
            href="/yarn/yarns"
            className={pathname.startsWith("/yarn/yarns") ? "text-[#5BC8AC]" : "hover:text-[#5BC8AC]"}
          >
            毛糸一覧
          </Link>
          <Link
            href="/yarn/projects"
            className={pathname.startsWith("/yarn/projects") ? "text-[#5BC8AC]" : "hover:text-[#5BC8AC]"}
          >
            作品メモ
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm text-stone-500">
          <span className="hidden sm:inline">{user.email}</span>
          <button
            type="button"
            className="hover:underline"
            onClick={async () => {
              const supabase = getSupabaseClient();
              await supabase?.auth.signOut();
            }}
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>
  );
}
