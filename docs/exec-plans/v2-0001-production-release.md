# ExecPlan v2-0001 — Vercel Production公開とSEO基盤

## Goal / Status

Vercel連携済みのGitHubリポジトリからPreview Deploymentを確認し、`https://mizuho-maru-un-official-fun-site.vercel.app/` をv2の正式URLとしてProduction公開する。

独自ドメインの取得・接続は今回の対象外とする。計画中。

## Scope

- Production URLをAstroの正式なSite URLとして設定し、canonical URLを安定して出力する。
- ProductionでOpen Graph・X Card・robots・sitemapを出力する。
- Vercel Previewを`noindex`とし、Production URLをPreviewのcanonicalとして出力しない。
- 実際に利用している外部Originだけを許可する既存CSPおよびSecurity Headerを維持・検証する。
- Vercel PreviewでSEO出力、Security Header、モバイル表示、外部iframeを検証する。

## Implementation / Decisions

- URLは`PUBLIC_SITE_URL`で上書き可能にし、未設定時のv2既定値はVercel Production URLとする。Secretは不要である。
- Layoutでtitle、description、canonical、Open Graph、X Cardを一元出力する。Previewでは`robots`を`noindex, nofollow`にし、canonicalとProduction向け共有URLを出力しない。
- Static Firstを維持し、robotsとsitemapは静的生成されるAstro endpointで提供する。SEOのためだけのBackendやDatabase、Dependencyは追加しない。
- OGP用に公式みずほまるArtworkや第三者画像は利用しない。画像を追加する必要が生じた場合も、権利確認済みの独自Assetに限定する。
- Security Headerは開発・Vercel配信で共通の定義を利用する。Headerを緩和して検証を通すことはしない。
- VercelのProduction Deployはmainへの反映後に行う。Previewで確認できないVercelダッシュボード設定、Search Console登録、sitemap送信は運営者の作業として切り分ける。

## TDD / Verification

- canonical、robots meta、Open Graph・X Card、およびrobots/sitemap endpointの期待値を先にテストへ追加する。
- Production相当とPreview相当の両方を検証し、Previewがindex対象にならないことを確認する。
- 実装後は`npm run lint`、`npm run typecheck`、`npm run test:unit`、`npm run build`、`npm run test:e2e`、dependency auditを実行する。
- Vercel PreviewではResponse Header、CSP violation、モバイル幅、SNS・地図iframeをNetworkで確認する。

## Risks / Non-goals

- 独自ドメインの取得・接続・リダイレクト・移行は扱わない。
- Search Consoleの所有権確認、登録、sitemap送信は外部アカウント操作のため、この変更だけでは完了しない。
- 検索エンジンのクロール・インデックス反映時期、Vercel・外部SNS・Google Mapsの可用性は保証しない。
- 本変更でAnalytics、Cookie同意、認証、SSR、Backendは導入しない。

## Verification Record

| Command / Check | Result |
| --- | --- |
| TDD（`tests/unit/site.test.ts`、実装前） | FAIL（`src/lib/site.ts` が未実装） |
| SEO / crawler unit test | PASS、3 files / 5 tests |
| Preview相当build（`VERCEL_ENV=preview npm run build`） | PASS。`noindex, nofollow`、robotsの`Disallow: /`、canonical／OGP／X Cardなし |
| lint | PASS |
| typecheck | PASS、0 errors（既存のZod非推奨hint 5件） |
| unit test | PASS、12 files / 56 tests |
| build | PASS、静的7ページ、`robots.txt`、`sitemap.xml` |
| E2E | PASS、17 tests |
| dependency audit | PASS、production dependencyは0 vulnerabilities |
| Vercel Preview確認 | 未実施。PR作成後に実Deploymentで確認する |
