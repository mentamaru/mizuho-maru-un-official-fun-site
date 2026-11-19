# ExecPlan v2-0008 — 公開リポジトリのリンク掲載とマルシェSNSの説明文修正

## 背景と目的

GitHubリポジトリ `https://github.com/mentamaru/mizuho-maru-un-official-fun-site` はパブリックになったが、サイトの `/github` ページは「現在は非公開」と案内したままである。また、関連SNSの「みずほまるごとマルシェ」Instagram（`marumaru_mizuho`）の説明文「イベント情報はこちらのアカウントからご確認ください。」は、何のアカウントか分からず不適切である。

## スコープ

1. 公開リポジトリへのリンクを掲載する。
   - `/github` ページの文言を公開済みの案内に更新し、リポジトリへのリンクを置く。
   - フッターの「GitHub」リンクは説明ページ `/github` を経由させる（直接リポジトリへ遷移させない）。リポジトリへのリンクは `/github` ページ内に置き、新しいタブで開く。
   - 説明文は、サイトを一緒に盛り上げてくださる方がいれば嬉しいという軽い呼びかけと、気になる点があればPull Requestを送ってほしい旨の一文（開発者募集のような重い表現にはしない）を含める。
   - URLは `siteCopy` に1か所だけ定義する。
2. `data/social.yml` の `marumaru-mizuho-instagram` の `description` を、軽い説明文へ修正する。
   - 同じ運営の `marumaru-mizuho-x` の文言「マルシェイベントみずほまるごとマルシェのアカウントです」も不自然なため、同じ調子に揃える。
3. 追加依頼: 「えきにしふりま」（`ekinishifurima`）のInstagram説明文も、箱根ケ崎駅西公有地で定期開催されているフリーマーケットのアカウントと分かる文言へ修正する（情報源: 瑞穂ケーブルテレビ「のめっこ！みずほ」の紹介動画）。
4. SPEC・テストを現在の仕様に合わせる。

## 非スコープ

- Human-managedデータの `displayName` / `accountId` / `profileUrl` / `category` / `enabled` の変更。
- 上記以外のアカウント（瑞穂町広報X、hamakiya_4649）の説明文の変更。
- 新規依存・Backend・外部リソースの追加。CSPの変更。
- SNSの収集・埋め込み方式の変更。

## 実施手順

1. 本ExecPlanを作成する。
2. Red: E2Eテストを「公開済み文言・リポジトリへのリンク・フッター→`/github`・Instagram/Xの新説明文」へ更新し、失敗を確認する。
3. Green: `siteCopy.repositoryUrl`、`/github` ページ、フッター、`data/social.yml` を更新する。
4. SPECの該当記述（公開リポジトリ・関連SNS）を現在形に更新する。
5. lint / typecheck / unit / build / E2E を実行する。
6. 日本語のコミットメッセージでコミットし、PRを作成する。Approve / Merge はしない。

## 完了条件

- フッターから `/github` 説明ページを経由して公開リポジトリへ移動できる。
- マルシェのInstagram / Xの説明文が、何のアカウントかを短く伝える。
- 既存のテスト・ビルドが成功する。

## Status

実装・ローカル検証完了。ブランチ: `docs/public-repo-link-and-marche-description`。

## 検証・実施結果

- Red: 更新したE2E 2件（SNS説明文・GitHub案内）の失敗を確認後に実装。
- `npm run lint` PASS、`npm run typecheck` 0 errors / 0 warnings / 既存4 hints、`npm run test:unit` 138件PASS、`npm run build` 7ページPASS、`PLAYWRIGHT_PORT=4399 npm run test:e2e` 33件PASS。`git diff --check` PASS。
- Security: 依存追加・CSP・Workflow権限の変更なし。外部リンクは `rel="noopener noreferrer"`。
- 変更File: `SPEC.md`、本ExecPlan、`data/social.yml`、`src/lib/content.ts`、`src/components/Footer.astro`、`src/pages/github.astro`、`tests/e2e/site.spec.ts`。
- 未実施: 実機・ブラウザーでの目視確認、deploy。初回実装でフッターをリポジトリへの直リンクにしたが、説明ページを経由しないとの指摘を受け、フッターを `/github` へ戻した。説明文には、盛り上げてくれる方がいれば嬉しいという軽い呼びかけとPull Request依頼の一文を追加した（2026-11-19）。
