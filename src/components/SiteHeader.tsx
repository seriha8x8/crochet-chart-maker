import Link from "next/link";
import { HeaderAccountControl } from "@/components/HeaderAccountControl";

const NAV_LINKS = [
  { label: "編み方動画", href: "/videos", key: "videos" },
  { label: "編み図メーカー", href: "/editor", key: "editor" },
  { label: "毛糸管理", href: "/yarn/yarns", key: "yarn" },
] as const;

type NavKey = "home" | (typeof NAV_LINKS)[number]["key"];

export function SiteHeader({ current }: { current: NavKey }) {
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b px-4 py-3 sm:px-8"
      style={{ backgroundColor: "#EAF7F2", borderColor: "#5BC8AC33" }}
    >
      <Link href="/" className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer available */}
        <img
          src="/image0.jpeg"
          alt="rii's crochet tools"
          className="h-9 w-9 shrink-0 rounded-full object-cover"
          style={{ border: "1.5px solid #5BC8AC" }}
        />
        <span className="whitespace-nowrap text-base font-semibold text-[#2f6f61]">rii&apos;s crochet tools</span>
      </Link>
      <div className="flex items-center gap-4 sm:gap-6">
        <HeaderAccountControl />
        <nav className="flex gap-4 text-sm sm:gap-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="whitespace-nowrap"
              style={{ color: link.key === current ? "#5BC8AC" : "#5a6b66", fontWeight: link.key === current ? 600 : 400 }}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
