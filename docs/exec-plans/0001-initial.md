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

## Progress

実装開始後、このSectionを継続的に更新する。

- リポジトリ初期状態を確認し、既存ファイルが `README.md` のみであることを確認した。
- GitHub Actions の現状を確認し、現時点では Copilot 実行Workflowのみが存在し、ジョブログ取得は 404 で未提供だった。
- Astro + TypeScript + Tailwind CSS + daisyUI の基盤、主要UI、データファイル、スクリプト、テスト、Workflow を追加した。
- lint / typecheck / unit test / build / Playwright / secret scan / parallel validation を実行した。
- parallel validation の指摘に基づき、収集IDの安定化、日付fallback、SNSタブのキーボード操作、E2E URL判定を修正した。

## Findings

実装中に判明した重要事項を記録する。

- `create-astro` のテンプレート取得は GitHub tarball 取得時に 403 となり、この環境では自動Scaffoldを最後まで完了できなかった。そのため `npm init` 後に Astro 標準構成を手動で補完した。
- `@astrojs/check` は TypeScript 7 系を受け付けず、互換範囲である TypeScript 5.9.3 へ調整した。
- 瑞穂町ドメインへの直接 fetch はこの環境で名前解決できなかったため、Human-managed Data には確認済みURLのみを記録し、収集Scriptは失敗時に既存Generated Dataを保持する構成とした。

## Decisions

SPECを変更しない範囲の実装上の重要判断を記録する。

仕様変更が必要な場合はSPEC変更として扱う。

- 最新情報の初期表示は、推測した公開日を使わず `publishedAt` が未確認のSeed Dataに `collectedAt` を表示する方式にした。
- 関連SNSは fake account を避けるため、確認できた X アカウントのみを Whitelist に登録し、Instagram は準備中UIとした。
- AI Summary Workflow は、外部AI未設定でも Source のみを入力として短文要約を生成・検証できる deterministic 実装をベースラインとした。

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
