const NAV_LINKS = [
  { label: "編み方動画", href: "/videos", key: "videos" },
  { label: "編み図メーカー", href: "/", key: "editor" },
  { label: "毛糸管理", href: "#", key: "yarn" },
] as const;

type NavKey = (typeof NAV_LINKS)[number]["key"];

export function SiteHeader({ current }: { current: NavKey }) {
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b px-4 py-3 sm:px-8"
      style={{ backgroundColor: "#EAF7F2", borderColor: "#5BC8AC33" }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: "#5BC8AC" }}
        >
          R
        </div>
        <span className="whitespace-nowrap text-base font-semibold text-[#2f6f61]">rii&apos;s crochet tools</span>
      </div>
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
    </header>
  );
}
