import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { VideoCard, type VideoItem } from "@/components/videos/VideoCard";

export const metadata: Metadata = {
  title: "編み方動画 - rii's crochet tools",
};

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
      { title: "鎖編み", videoUrl: "https://youtu.be/xr9mzow3-pg" },
      { title: "細編み", videoUrl: null },
      { title: "中長編み", videoUrl: null },
      { title: "長編み", videoUrl: null },
      { title: "長々編み", videoUrl: null },
      { title: "引き抜き編み", videoUrl: "https://youtu.be/4PpZeDC9HNY" },
      { title: "鎖編みの作り目", videoUrl: "https://youtu.be/kMQgmsvPuEA" },
      { title: "輪の作り目", videoUrl: "https://youtu.be/oOaciJRtlw0" },
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

export default function VideosPage() {
  return (
    <div className="min-h-dvh" style={{ backgroundColor: "#EAF7F2" }}>
      <SiteHeader current="videos" />

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

      <SiteFooter />
    </div>
  );
}
