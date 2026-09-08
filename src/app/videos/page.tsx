import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "編み方動画 - rii's crochet tools",
};

interface VideoItem {
  title: string;
  /** Filled in once each tutorial is filmed; null renders the "準備中" placeholder. */
  videoUrl: string | null;
}

interface VideoCategory {
  name: string;
  /** Thumbnail background for every card in this category. */
  thumbnailBg: string;
  items: VideoItem[];
}

const CATEGORIES: VideoCategory[] = [
  {
    name: "基本の編み方",
    thumbnailBg: "#D8F0E8",
    items: [
      { title: "鎖編み", videoUrl: null },
      { title: "細編み", videoUrl: null },
      { title: "中長編み", videoUrl: null },
      { title: "長編み", videoUrl: null },
      { title: "長々編み", videoUrl: null },
      { title: "引き抜き編み", videoUrl: null },
      { title: "鎖編みの作り目", videoUrl: null },
      { title: "輪の作り目", videoUrl: null },
    ],
  },
  {
    name: "増し目・減らし目",
    thumbnailBg: "#FCE7EA",
    items: [
      { title: "細編みの増し目", videoUrl: null },
      { title: "細編みの減らし目", videoUrl: null },
      { title: "中長編みの増し目", videoUrl: null },
      { title: "中長編みの減らし目", videoUrl: null },
      { title: "長編みの増し目", videoUrl: null },
      { title: "長編みの減らし目", videoUrl: null },
    ],
  },
  {
    name: "応用の編み方",
    thumbnailBg: "#FCE7EA",
    items: [
      { title: "表引き上げ編み", videoUrl: null },
      { title: "裏引き上げ編み", videoUrl: null },
      { title: "玉編み", videoUrl: null },
      { title: "パフコーン編み", videoUrl: null },
      { title: "ピコット編み", videoUrl: null },
    ],
  },
];

// TODO: point at the real yarn-management app once it's deployed alongside this one.
const NAV_LINKS = [
  { label: "編み方動画", href: "/videos", current: true },
  { label: "編み図メーカー", href: "/", current: false },
  { label: "毛糸管理", href: "#", current: false },
];

export default function VideosPage() {
  return (
    <div className="min-h-dvh" style={{ backgroundColor: "#EAF7F2" }}>
      <header
        className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b px-4 py-3 sm:px-8"
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
              key={link.label}
              href={link.href}
              className="whitespace-nowrap"
              style={{ color: link.current ? "#5BC8AC" : "#5a6b66", fontWeight: link.current ? 600 : 400 }}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        {CATEGORIES.map((category) => (
          <section key={category.name} className="mb-10 last:mb-0">
            <h2 className="mb-4 text-lg font-bold" style={{ color: "#5BC8AC" }}>
              {category.name}
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {category.items.map((item) => (
                <VideoCard key={item.title} item={item} thumbnailBg={category.thumbnailBg} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

function VideoCard({ item, thumbnailBg }: { item: VideoItem; thumbnailBg: string }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-white" style={{ borderColor: "#5BC8AC26" }}>
      <div className="relative aspect-video w-full" style={{ backgroundColor: thumbnailBg }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1" style={{ color: "#5BC8AC" }}>
          <PlayIcon />
          <span className="text-[11px] font-medium">準備中</span>
        </div>
      </div>
      {/* Fixed height so every card lines up regardless of how long its title is. */}
      <div className="flex min-h-[3rem] items-center px-3 py-2">
        <p className="line-clamp-2 text-sm font-medium text-[#2f2f2f]">{item.title}</p>
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <circle cx="17" cy="17" r="16" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
      <path d="M14 11l10 6-10 6V11z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
