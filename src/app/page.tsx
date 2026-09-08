import { SiteHeader } from "@/components/SiteHeader";

const TOOLS = [
  {
    key: "editor",
    title: "編み図メーカー",
    description: "かぎ針編みの編み図を作成",
    buttonLabel: "編み図を作ってみる",
    href: "/editor",
    iconBg: "#D8F0E8",
    iconColor: "#5BC8AC",
    icon: <ChartIcon />,
  },
  {
    key: "yarn",
    title: "毛糸管理",
    description: "手持ちの毛糸を色や素材で整理",
    buttonLabel: "毛糸を整理する",
    href: "/yarn/yarns",
    iconBg: "#FCE7EA",
    iconColor: "#F18D9E",
    icon: <YarnIcon />,
  },
  {
    key: "videos",
    title: "編み方動画",
    description: "基本から応用まで動画で解説",
    buttonLabel: "編み方を見る",
    href: "/videos",
    iconBg: "#FDF6D8",
    iconColor: "#D4C220",
    icon: <PlayIcon />,
  },
] as const;

const SNS_LINKS = [
  {
    key: "youtube",
    label: "YouTube",
    href: "https://www.youtube.com/@rii_amimono",
    src: "/yt_icon_red_digital.png",
    sizeClass: "h-16 w-16",
  },
  {
    key: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/rii_amimono/",
    src: "/Instagram_Glyph_Gradient.png",
    sizeClass: "h-12 w-12",
  },
  {
    key: "tiktok",
    label: "TikTok",
    href: "https://www.tiktok.com/@rii_amimono",
    src: "/TikTok_Icon_Black_Circle.png",
    sizeClass: "h-12 w-12",
  },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-dvh" style={{ backgroundColor: "#EAF7F2" }}>
      <SiteHeader current="home" />

      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-8">
        <section className="flex flex-col items-center gap-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer available */}
          <img
            src="/image0.jpeg"
            alt="rii's crochet tools"
            className="h-24 w-24 rounded-full object-cover"
            style={{ border: "3px solid #5BC8AC" }}
          />
          <h1 className="text-3xl font-bold" style={{ color: "#3D6B5C" }}>
            rii&apos;s crochet tools
          </h1>
          <p className="text-base" style={{ color: "#7FA99A" }}>
            編み物がもっと楽しくなる！編み物好きのための便利ツール
          </p>
        </section>

        <section className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {TOOLS.map((tool) => (
            <div
              key={tool.key}
              className="flex flex-col items-center gap-4 rounded-2xl p-8 text-center"
              style={{ backgroundColor: "#FFFFFF", border: "1px solid #CDEBE1" }}
            >
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: tool.iconBg, color: tool.iconColor }}
              >
                {tool.icon}
              </div>
              <h2 className="text-lg font-semibold" style={{ color: "#3D6B5C" }}>
                {tool.title}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "#7FA99A" }}>
                {tool.description}
              </p>
              <a
                href={tool.href}
                className="mt-2 whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: tool.iconColor }}
              >
                {tool.buttonLabel}
              </a>
            </div>
          ))}
        </section>

        <section className="mt-20 flex flex-col items-center gap-6">
          <h2 className="text-lg font-semibold" style={{ color: "#3D6B5C" }}>
            ＼ SNSも更新中 ／
          </h2>
          <div className="flex items-center gap-9">
            {SNS_LINKS.map((sns) => (
              <a
                key={sns.key}
                href={sns.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={sns.label}
                className={`flex items-center justify-center transition hover:opacity-80 ${sns.sizeClass}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer available */}
                <img src={sns.src} alt={sns.label} className="h-full w-full object-contain" />
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function ChartIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="5" y="5" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 11.3H23M5 17.7H23M11.3 5V23M17.7 5V23"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function YarnIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6 11c4 2 8 2 12 0M5.5 14.5c5 2.5 11.5 2.5 17 0M6 18c4-2 8-2 12 0"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 10l5.5 4-5.5 4v-8z" fill="currentColor" />
    </svg>
  );
}

