import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "使い方ガイド - rii's crochet tools",
};

const TOC = [
  { href: "#editor", label: "編み図メーカー" },
  { href: "#yarn", label: "毛糸管理" },
  { href: "#videos", label: "編み方動画" },
] as const;

export default function GuidePage() {
  return (
    <div className="min-h-dvh" style={{ backgroundColor: "#EAF7F2" }}>
      <SiteHeader current="home" />

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-8">
        <section className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-3xl font-bold" style={{ color: "#3D6B5C" }}>
            使い方ガイド
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#7FA99A" }}>
            各ツールでできることをかんたんにご紹介します。
          </p>
        </section>

        <nav className="mt-8 flex flex-wrap justify-center gap-3">
          {TOC.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium"
              style={{ backgroundColor: "#FFFFFF", color: "#3D6B5C", border: "1px solid #CDEBE1" }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <GuideSection id="editor" title="編み図メーカー" intro="かぎ針編みの編み図を、ブラウザ上で作成できるツールです。">
          <GuideImage src="/guide/toolbar.png" alt="編み図メーカーのツールバー" />

          <Feature title="ガイド線">
            鎖編みの作り目や輪の作り目の位置を示すガイド線を表示し、記号を置く目安にできます。ツールバーからオン/オフをいつでも切り替えられます。
          </Feature>

          <Feature title="記号配置" image="/guide/rotate-handle.png" imageAlt="記号を選択して表示される回転ハンドル">
            細編みや長編みなど、よく使う記号を記号パレットから選んでキャンバスに配置できます。配置した後も自由に移動でき、回転ハンドルをドラッグすれば向きも調整できます。
          </Feature>

          <Feature title="等分配置" image="/guide/round-array-dialog.png" imageAlt="輪の等分配置ダイアログ">
            輪や直線状に、記号を均等な間隔でまとめて自動配置できます。記号数や半径などを指定するだけで、輪編みの土台やコマの敷き詰めがすばやく作れます。
          </Feature>

          <Feature title="グループ化">
            複数の記号をまとめてグループ化すると、ひとかたまりとして移動・回転できるようになります。レイヤーを使えば記号を整理し、表示のオン/オフを切り替えることもできます。
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <GuideImage src="/guide/group-and-layers.png" alt="グループ化した記号の選択表示" className="sm:col-span-2" />
              <GuideImage src="/guide/layer-panel.png" alt="レイヤーパネル" />
            </div>
          </Feature>

          <Feature title="どの目に編むかを選択する機能" image="/guide/parent-link-panel.png" imageAlt="前段との接続を設定するパネル">
            記号ごとに「目に編む（頭の真上）」か「束に編む（隙間の中央）」かを選べます。また「接続する記号を選択」から、前段のどの記号（複数選択も可能）から出ているかを指定でき、増し目・減らし目の表現にも対応します。
          </Feature>

          <Feature title="画像書き出し">
            作成した編み図をPNG画像として書き出せます。保存しておいたり、SNSでシェアしたりするのに使えます。
          </Feature>

          <p className="mt-6 rounded-lg px-4 py-3 text-xs leading-relaxed" style={{ backgroundColor: "#FFF7EC", color: "#8a7150" }}>
            画面が小さいスマートフォンでは記号の配置や調整がしづらいため、編み図メーカーはPCでのご利用をおすすめしています。
          </p>
        </GuideSection>

        <GuideSection id="yarn" title="毛糸管理" intro="手持ちの毛糸をクラウドに登録して、色や素材、太さなどで整理できるツールです。">
          <Feature title="毛糸を登録">
            メーカーや色、素材、太さなどの情報とあわせて、手持ちの毛糸を登録できます。写真を添えて一覧に残すこともできます。
          </Feature>
          <Feature title="登録した毛糸を検索">
            色・素材・太さなどの条件で、登録した毛糸を絞り込み検索できます。作りたい作品に合う毛糸をすぐに見つけられます。
          </Feature>
          <Feature title="編んだ作品をメモする">
            使った毛糸と紐づけて、編んだ作品の記録をメモとして残せます。過去にどの毛糸で何を作ったかを振り返るのに便利です。
          </Feature>
        </GuideSection>

        <GuideSection id="videos" title="編み方動画" intro="基本の編み方から増し目・減らし目、応用の編み方まで、カテゴリ別に動画で解説しています。">
          <GuideImage src="/guide/videos-categories.png" alt="編み方動画のカテゴリ一覧" />
          <p className="mt-6 text-center text-sm font-medium leading-relaxed" style={{ color: "#3D6B5C" }}>
            カテゴリから気になる編み方を探して、動画を見て実践してみよう！
          </p>
        </GuideSection>
      </main>

      <SiteFooter />
    </div>
  );
}

function GuideSection({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-16 scroll-mt-20">
      <h2 className="text-xl font-bold" style={{ color: "#3D6B5C" }}>
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: "#7FA99A" }}>
        {intro}
      </p>
      <div className="mt-6 flex flex-col gap-6">{children}</div>
    </section>
  );
}

function Feature({
  title,
  image,
  imageAlt,
  children,
}: {
  title: string;
  image?: string;
  imageAlt?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-5" style={{ border: "1px solid #CDEBE1" }}>
      <h3 className="text-base font-semibold" style={{ color: "#3D6B5C" }}>
        {title}
      </h3>
      <div className="mt-1.5 text-sm leading-relaxed" style={{ color: "#5a6b66" }}>
        {children}
      </div>
      {image && <GuideImage src={image} alt={imageAlt ?? title} className="mt-3" />}
    </div>
  );
}

function GuideImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-lg ${className}`} style={{ border: "1px solid #CDEBE1" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer available */}
      <img src={src} alt={alt} className="w-full" />
    </div>
  );
}
