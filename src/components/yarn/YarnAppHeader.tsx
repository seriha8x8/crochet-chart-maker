"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function YarnAppHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[#5BC8AC33]">
      <div className="h-1 bg-gradient-to-r from-[#5BC8AC] via-[#98DBC6] to-[#F18D9E]" />
      <div className="mx-auto flex max-w-4xl items-center px-4 py-3">
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
      </div>
    </header>
  );
}
