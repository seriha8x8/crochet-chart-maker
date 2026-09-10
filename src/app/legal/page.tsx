import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "利用規約・プライバシーポリシー - rii's crochet tools",
};

const heading = "text-xl font-bold";
const subheading = "mt-8 text-base font-bold";
const body = "mt-2 leading-relaxed text-stone-700";
const list = "mt-2 list-disc space-y-1 pl-5 leading-relaxed text-stone-700";

export default function LegalPage() {
  return (
    <div className="min-h-dvh" style={{ backgroundColor: "#EAF7F2" }}>
      <SiteHeader current="home" />

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-8">
        <article className="rounded-2xl bg-white p-8 sm:p-12" style={{ border: "1px solid #CDEBE1" }}>
          <h1 className={heading} style={{ color: "#3D6B5C" }}>
            プライバシーポリシー
          </h1>
          <p className={body}>
            ウェブサイト「rii&apos;s crochet tools」（以下、「本サービス」といいます。）の運営者（以下、「当方」といいます。）は、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下、「本ポリシー」といいます。）を定めます。
          </p>

          <h2 className={subheading} style={{ color: "#3D6B5C" }}>
            1. 取得する情報
          </h2>
          <p className={body}>本サービスでは、会員登録機能をご利用いただく際に、以下の情報を取得します。</p>
          <ul className={list}>
            <li>メールアドレス</li>
            <li>パスワード（暗号化して保管し、当方が内容を閲覧することはできません）</li>
            <li>本サービス内で登録いただいた編み図データ、毛糸の登録情報等</li>
          </ul>

          <h2 className={subheading} style={{ color: "#3D6B5C" }}>
            2. 利用目的
          </h2>
          <p className={body}>取得した情報は、以下の目的で利用します。</p>
          <ul className={list}>
            <li>本サービスの提供・運営のため</li>
            <li>ユーザー認証・本人確認のため</li>
            <li>本サービスに関する重要なお知らせをお伝えするため</li>
            <li>不正利用の防止のため</li>
          </ul>

          <h2 className={subheading} style={{ color: "#3D6B5C" }}>
            3. 第三者提供について
          </h2>
          <p className={body}>
            当方は、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
          </p>

          <h2 className={subheading} style={{ color: "#3D6B5C" }}>
            4. 広告配信・Cookie（クッキー）について
          </h2>
          <p className={body}>
            本サービスでは、第三者配信の広告サービス「Google AdSense」を利用しています。Google
            AdSenseは、ユーザーの興味・関心に応じた広告を表示するためにCookieを使用することがあります。
          </p>
          <p className={body}>
            Cookieを無効にする方法や、Googleがどのように情報を利用するかについては、以下のページをご確認ください。
          </p>
          <ul className={list}>
            <li>
              Google広告に関するポリシーと規約：
              <a
                href="https://policies.google.com/technologies/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: "#5BC8AC" }}
              >
                https://policies.google.com/technologies/ads
              </a>
            </li>
            <li>Googleの広告設定ページからパーソナライズ広告を無効にできます</li>
          </ul>

          <h2 className={subheading} style={{ color: "#3D6B5C" }}>
            5. アクセス解析ツールについて
          </h2>
          <p className={body}>
            本サービスでは、サービス改善のためアクセス解析ツールを使用する場合があります。取得される情報に個人を特定する情報は含まれません。
          </p>

          <h2 className={subheading} style={{ color: "#3D6B5C" }}>
            6. 情報の管理
          </h2>
          <p className={body}>
            取得した情報は、適切なセキュリティ対策を講じたデータベース（Supabase）にて安全に管理します。
          </p>

          <h2 className={subheading} style={{ color: "#3D6B5C" }}>
            7. 開示・訂正・削除について
          </h2>
          <p className={body}>
            ユーザーご本人からの、登録情報の開示・訂正・削除のご要望には、本人確認の上、合理的な範囲で速やかに対応いたします。ご希望の場合は下記お問い合わせ先までご連絡ください。
          </p>

          <h2 className={subheading} style={{ color: "#3D6B5C" }}>
            8. 本ポリシーの変更について
          </h2>
          <p className={body}>
            本ポリシーの内容は、必要に応じて予告なく変更することがあります。変更後のポリシーは、本サービス上に掲載した時点から効力を生じるものとします。
          </p>

          <h2 className={subheading} style={{ color: "#3D6B5C" }}>
            9. お問い合わせ窓口
          </h2>
          <p className={body}>本ポリシーに関するお問い合わせは、以下の窓口までお願いいたします。</p>
          <p className={body}>
            <a href="mailto:epanoui.2020@gmail.com" className="underline" style={{ color: "#5BC8AC" }}>
              epanoui.2020@gmail.com
            </a>
          </p>
          <p className={`${body} text-sm text-stone-500`}>制定日：2026年9月8日</p>

          <h2 className={subheading} style={{ color: "#3D6B5C" }}>
            広告・アフィリエイトプログラムに関する表記
          </h2>
          <p className={body}>
            当サイト「rii&apos;s crochet tools」は、Google
            AdSenseを利用して第三者配信の広告を掲載しています。
          </p>
          <p className={body}>
            また、当サイトで紹介している商品（毛糸など）の一部には、アフィリエイトプログラムを利用しているものが含まれます。アフィリエイトリンク経由で商品が購入された場合、当方に紹介料が支払われることがあります。紹介する商品は、実際に良いと感じたもの・おすすめしたいものを基準に選定しており、紹介料の有無が紹介内容やおすすめ度に影響することはありません。
          </p>
          <p className={body}>これらの広告収益は、サイトの運営・維持費用に充てさせていただいております。</p>

          <h2 className={subheading} style={{ color: "#3D6B5C" }}>
            免責事項
          </h2>
          <ul className={list}>
            <li>
              当サイトに掲載する編み方・編み図等の情報については、正確性・完全性を保証するものではありません。実際の制作にあたっては、ご自身の判断と責任においてご利用ください。
            </li>
            <li>当サイトの情報を利用したことにより生じたいかなる損害についても、当方は一切の責任を負いかねます。</li>
            <li>
              当サイトから他のウェブサイトへのリンクについて、リンク先サイトの内容・安全性等について当方は保証・責任を負いません。
            </li>
            <li>当サイトの内容は、予告なく変更・中断・終了する場合があります。あらかじめご了承ください。</li>
          </ul>

          <h2 className={subheading} style={{ color: "#3D6B5C" }}>
            編み図画像の書き出しについて
          </h2>
          <p className={body}>編み図メーカーで作成した編み図は、PNG画像として書き出すことができます。</p>
          <ul className={list}>
            <li>無料プランでの書き出し画像には、「Created with rii&apos;s crochet tools」という透かし（ウォーターマーク）が入ります。</li>
            <li>有料のプレミアムプラン（準備中）をご利用いただくと、透かしなしで書き出せるようになります。</li>
            <li>画像編集ソフト等を用いて、透かしを除去・改変する行為はご遠慮ください。</li>
          </ul>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
