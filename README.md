# かぎ針編み図メーカー

固定グリッドではなく自由配置でかぎ針編みの編み図を作れるWebアプリ（MVP）。

## 主な機能

- 記号パレットからの自由配置キャンバス（鎖編み・細編み・長編み・中長編み・長々編み・引き抜き編み・輪編みの7種）
- 鎖編みはじまり／輪はじまりのガイド線表示
- ドラッグ中のスマートガイド（X/Y位置の軽いスナップ）
- 記号の自由回転（ハンドルドラッグ／±15°・±90°ボタン）
- 輪の等分配置（一周360°、または任意角度の弧を「記号数+1」の隙間で等分）
- 前段との接続（「目に編む」「束に編む」で自動位置スナップ、クリックで親記号をハイライト）
- コピー＆ペースト（Ctrl/Cmd+C/V）、Shiftクリック・ドラッグ矩形による複数選択
- レイヤー機能（名前・表示/非表示）
- PNG画像書き出し

## 開発

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開いてください。ブラウザのlocalStorageに自動保存されるため、追加設定なしでそのまま使えます。

## クラウド保存（任意・Supabase）

`.env.example` を `.env.local` にコピーし、Supabaseプロジェクトの URL / anon key を設定すると、メールのマジックリンクでサインインしてクラウドに保存・読み込みができるようになります。

```bash
cp .env.example .env.local
```

テーブル定義は `supabase/schema.sql` にあります（既存プロジェクトと衝突しないよう `chart_` プレフィックス、RLSで本人のデータのみアクセス可能）。SupabaseのSQL Editorで実行してください。

未設定の場合は自動的にlocalStorageのみで動作します。

## デプロイ（Cloudflare Workers / Pages）

サーバー機能（APIルート・サーバーアクション・middleware）を使わないクライアント完結型アプリのため、`next.config.ts` で静的書き出し（`output: "export"`）を行い、生成された `out/` ディレクトリをそのまま配信します。

Cloudflareの「Workers & Pages」からGit連携で作成すると、静的サイトでも新しい **Workers Static Assets** 方式でデプロイされることがあります（classic Pagesの後継）。そのため、`wrangler.jsonc` に `assets.directory` として `out` を指定しています。ダッシュボード側では以下を設定してください：

| 項目 | 値 |
| --- | --- |
| ビルドコマンド | `npm run build` |
| デプロイコマンド | （デフォルトのまま。`wrangler.jsonc` を自動で見つけて `out/` を配信します） |
| ルートディレクトリ | `/`（リポジトリ直下） |

classic Pages（Connect to Git → Pagesプロジェクト）で作った場合は、ビルド出力ディレクトリに `out` を指定するだけで `wrangler.jsonc` は不要です。

Supabase連携を使う場合は、Cloudflareのプロジェクト設定の環境変数に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定してください（ビルド時に埋め込まれるため、Production/Preview両方に設定が必要です）。未設定でもlocalStorageのみで動作します。

ローカルで書き出し結果を確認する場合：

```bash
npm run build
npx serve out
```

## 技術構成

Next.js (App Router) / React / TypeScript / Tailwind CSS / Zustand / Supabase（任意）
