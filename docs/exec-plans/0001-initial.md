# ExecPlan 0001 — Initial Implementation

## Goal

`SPEC.md` に定義されたv1を実装し、

* Local Development
* GitHub Private Repository
* Vercel Preview

で正常に検証できる状態にする。

Public Repository化、Production一般公開、Custom Domain公開はこのExecPlanのGoalに含めない。

## Scope

* Repository Foundation
* Astro + TypeScript
* Tailwind CSS + daisyUI
* White-based / Mizuho-colored Visual Theme
* Japanese-readable Typography
* Responsive Main UI
* 最新情報
* 関連情報
* 関連SNS
* リンク集
* RSS / 公式情報Data Pipeline
* AI Summary Pipeline
* Manual SNS / Other Submission Pipeline
* SNS Whitelist
* SNS Lazy Loading
* Vitest
* Playwright
* CI
* Security Baseline
* Vercel Preview

## Out of Scope

* GitHub Repository Public化
* Production一般公開
* Custom Domain本番運用
* `en-US` UIの実装
* 不要なBackend / Database / Authentication
* SNSの無差別自動収集
* 未承認のみずほまる公式Artworkの掲載

## Implementation Strategy

一度に全機能を実装しない。

以下の順序で段階的に実装する。

1. Foundation
2. Static UI Prototype
3. Data Model
4. RSS / Official Collection
5. AI Summary
6. SNS Whitelist / Embed
7. Manual Submission
8. CI / Security
9. Vercel Preview Verification

## TDD Strategy

以下のLogicを中心にRed → Green → Refactorで実装する。

* RSS Parser
* Filtering
* Deduplication
* Date Handling
* Data Transformation
* AI Input
* AI Output Validation
* Provenance

Markup / CSSへ過剰なUnit Testを作らない。

## UI Verification

以下を確認する。

* White Baseである
* Brand ColorがAccentとして使用される
* Purple / Pinkが大面積に過剰使用されていない
* Link / Active Tab等からBrand Identityが分かる
* FooterでBrand Colorを適切に使用している
* 指定Font Stackが適用されている
* 日本語本文がSmartphoneで読みやすい
* 375pxでHorizontal Scrollがない
* PCでも十分な余白と情報階層がある

## Verification

最低限:

* lint
* typecheck
* unit test
* build
* Playwright

必要に応じて:

* Accessibility Check
* Lighthouse
* Security Check

実際に実行した結果のみ記録する。

## Security Considerations

* SecretをCommitしない
* GitHub Actions Least Privilege
* Dependabot
* Takumi Guard
* Dependency Review
* CodeQL
* Secret Scanning / Push Protection
* Security Headers
* CSP
* SNS External Resource制限

## Data Pipeline 簡易仕様

SPEC 15章のRSS/公式情報収集・AI要約・手動投入について、v1で実装する簡易仕様を記録する。

### RSS / 公式情報自動収集

`data/sources.yml` の各Sourceは任意で `rssUrl` を持つ。

`rssUrl` が設定済みかつ `enabled: true` のSourceのみを収集対象とする。

`scripts/collect.ts` は対象SourceのRSSを取得し、`parseRss` でparse、`isRelevantItem` で「みずほまる」関連判定によるFilterを行い、`dedupeItems` / `sortNewestFirst` で整形して `data/generated/items.json` を更新する。

個別Sourceの取得・parse失敗時は当該Sourceのみをskipし、既存Generated Dataを保持してSiteを壊さない。

v1時点で確認済みの公式RSS Feed URLは無いため、全Sourceの `rssUrl` は未設定のままとし、自動収集は意図的にno-opとする。

`collect.yml` は `schedule`（毎日1回程度）に加えて `workflow_dispatch` を持つため、GitHub Actionsの「Run workflow」からいつでも手動実行できる。サイト構築直後やローカル環境等、自動収集が機能しない状況でも、この手動実行または後述の手動投入でデータを用意できるようにし、自動収集を基本としつつ手動での初期投入経路を確保する。

### AI要約生成

`scripts/summarize.ts` は収集・投入済みの `title` / `description` のみを入力とし、Web Searchや外部知識を追加しない。

v1では外部AI Providerを呼び出さず、`generateSummary` によるDeterministic（規則ベース）な2〜3文の要約のみを生成する。

`resolveSummaryProvider` は `SUMMARY_PROVIDER` を読み取るが、v1でサポートするProviderは `deterministic` のみとし、未設定・未対応の値は警告のうえでdeterministicへFallbackする。

`AI_API_KEY` / `AI_MODEL` は将来外部AI Providerへ接続する場合のためのPlaceholderとし、v1のコードからは参照しない。

`summarize.yml` も `schedule` に加えて `workflow_dispatch` を持ち、GitHub Actionsから手動実行できる。

### 手動投入

GitHub Actionsの `workflow_dispatch`（`submit-manual.yml`）から人間が `title` / `source_url` / `memo` / `source_type` を入力する。

`scripts/submit-manual.ts` は投入された情報のみを整理し、AIによる自由な追加調査は行わない。

生成結果は `peter-evans/create-pull-request` によりReview可能なPRとして提出し、直接Production Dataを書き換えない。

## Progress

実装開始後、このSectionを継続的に更新する。

- リポジトリ初期状態を確認し、既存ファイルが `README.md` のみであることを確認した。
- GitHub Actions の現状を確認し、現時点では Copilot 実行Workflowのみが存在し、ジョブログ取得は 404 で未提供だった。
- Astro + TypeScript + Tailwind CSS + daisyUI の基盤、主要UI、データファイル、スクリプト、テスト、Workflow を追加した。
- lint / typecheck / unit test / build / Playwright / secret scan / parallel validation を実行した。
- parallel validation の指摘に基づき、収集IDの安定化、日付fallback、SNSタブのキーボード操作、E2E URL判定を修正した。
- ヘッダーからサイトへの導線・冗長なHero文言・内部実装ラベルのUI露出を見直し、Main NavigationタブをSPECのタブUI要件を維持したままHeader内へ移動した。
- SPEC 15章のRSS収集 / AI要約 / 手動投入について簡易仕様を明文化し、`resolveSummaryProvider` によるProvider切替の土台と、収集no-op時の理由が分かるログ出力を追加し、README へ運用手順を追記した。
- 自動収集がサイト構築直後やローカル環境で機能しない場合に備え、`collect.yml` / `summarize.yml` に既存の `workflow_dispatch` を手動収集トリガーとして利用できることをREADME / ExecPlanへ明記した（新規Workflow追加は不要と判断）。
- X ProfileのSNS埋め込みを、Xの「X Publish」機能が生成する埋め込みコード（`platform.x.com/widgets.js` / `x.com`ドメイン）に合わせて更新した。`data/social.yml` の対象アカウントの `profileUrl` を `x.com` ドメインへ変更し、埋め込みScript読み込み先を `platform.x.com/widgets.js` へ切り替え、CSP（`src/lib/security.ts` / `vercel.json`）に `platform.x.com` を許可Originとして追加した（移行期の互換のため `platform.twitter.com` / `syndication.twitter.com` は残置）。

## Findings

実装中に判明した重要事項を記録する。

- `create-astro` のテンプレート取得は GitHub tarball 取得時に 403 となり、この環境では自動Scaffoldを最後まで完了できなかった。そのため `npm init` 後に Astro 標準構成を手動で補完した。
- `@astrojs/check` は TypeScript 7 系を受け付けず、互換範囲である TypeScript 5.9.3 へ調整した。
- 瑞穂町ドメインへの直接 fetch はこの環境で名前解決できなかったため、Human-managed Data には確認済みURLのみを記録し、収集Scriptは失敗時に既存Generated Dataを保持する構成とした。
- SPEC.md「5. Main UI」がMain Navigationのタブ形式UIを明示的に要求しており、Minimum E2Eにも `Tab Switching` 検証が含まれるため、タブ廃止案はSPEC違反であることを実装前に確認し、Header内へタブを移動する方針へ修正した。
- 瑞穂町ホームページのRSS配信案内ページ（`/tyosei/015/011/p002510.html`）はJavaScriptでSidebar/本文を描画する構成であり、この開発環境からの自動fetchでは実際のFeed URLを機械的に確認できなかった。
- 同一Working Directoryで並行セッションがSNS埋め込み・CSP共通化（`src/lib/security.ts` / `src/middleware.ts` / `src/lib/social-loader.ts` 等）を並行して実装しており、一部ファイル（`vercel.json` / `SocialFeed.astro` / テスト類）は行レベルで変更が混在したため、機械的に分離可能な範囲（`data/social.yml` / `src/lib/social.ts`）のみを分けてコミットし、残りは並行セッションの作業完了後にまとめてコミットした。

## Decisions

SPECを変更しない範囲の実装上の重要判断を記録する。

仕様変更が必要な場合はSPEC変更として扱う。

- 最新情報の初期表示は、推測した公開日を使わず `publishedAt` が未確認のSeed Dataに `collectedAt` を表示する方式にした。
- 関連SNSは fake account を避けるため、確認できた X アカウントのみを Whitelist に登録し、Instagram は準備中UIとした。
- AI Summary Workflow は、外部AI未設定でも Source のみを入力として短文要約を生成・検証できる deterministic 実装をベースラインとした。
- Main NavigationタブはSPEC通りHeader/Hero領域のいずれに置いてもタブ形式のUI自体は維持されるため、ユーザー導線改善のためHeader内へ配置する変更はSPEC違反に当たらないと判断した。
- 実Feed URLが確認できるまで `data/sources.yml` は `rssUrl` 未設定のまま運用し、RSS自動収集は意図的にno-op（既存Generated Data保持）とする。
- AI要約は外部AI Provider接続を行わず、v1はDeterministicな要約Generatorのみをサポートする。将来接続する場合に備え `SUMMARY_PROVIDER` 等のENV変数とFallback付きのProvider解決関数のみを用意する。
- 手動収集トリガーは新規Workflowを追加せず、`collect.yml` / `summarize.yml` に既存の `workflow_dispatch` を「基本は自動、動かない場合は手動実行」の入口として位置づけることにした。
- X埋め込みは、ユーザーがX Publishで生成した実際の埋め込みコードを基準に `platform.x.com` / `x.com` ドメインへ切り替え、`platform.twitter.com` 系は非破壊の互換Originとして残す方針にした（アカウント単位の設定は `data/social.yml` の `profileUrl` のみで完結する汎用実装を維持）。

## Verification Results

実際に実行したCommandとResultを記録する。

- `npm run test:unit` — PASS
- `npm run build` — PASS
- `npm run test:e2e` — PASS
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run collect` — PASS（RSS source なしのため既存 generated data を保持）
- `npm run summarize` — PASS
- `runtime-tools-secret_scanning`（変更ファイル）— PASS
- `parallel_validation` — 初回で 5 件の改善提案を確認し修正、再実行で最終確認予定
- `parallel_validation` 再実行 — Code Review の追加指摘を確認して修正済み / CodeQL はタイムアウト
- UI導線見直し後、`npm run lint` / `npm run typecheck` / `npm run test:unit`（17 tests）/ `npm run test:e2e`（3 tests）/ `npm run build` を再実行しPASSを確認した。
- Data Pipeline簡易仕様の実装後、`resolveSummaryProvider` 向けの単体テストを追加した `npm run test:unit`（20 tests）、`npm run lint`、`npm run typecheck`、`npm run build`、`npm run collect`（no-opログを確認）、`npm run summarize`（deterministic providerログを確認）を実行しPASSを確認した。
- X Publish対応後、`npm run lint` / `npm run typecheck`（38 files）/ `npm run test:unit`（7 files, 23 tests）/ `npm run build` / `npm run test:e2e`（10 tests PASS, 1 skip）を実行しPASSを確認した。

