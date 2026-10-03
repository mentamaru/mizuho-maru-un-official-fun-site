# ExecPlan 0010 — レーダーの複数タグ・日付と紹介文

## Scope
承認済みのレーダー収集Actionとフロントを対象にする。複数の日本語タグ、開催期間と登録日の分離、トップのキャラクター紹介、Aboutを実装する。スケジュール・権限・公式RSS・SNS収集は変更しない。

## Decisions
- 既存category/date/dateTypeとIDを維持し、tags/startDate/endDateを追加。保存済み旧データは読めるままにし、新規候補には新フィールドを必須とする。
- categoryは主分類として残す。タグは12種類の共通辞書、重複不可。重複判定はタグや主分類の変更だけで同一記事を再登録しない。
- 開催期間はイベント用の日付のみ。終了日不明はnull、単日は同日。旧event dateは開始日として表示し終了日は推測しない。
- 最新情報のレーダー登録日を公開日と表示しない。登録日降順・登録年月フィルターを維持。
- 元情報URL・既存ID・手動管理データを保持。依存追加なし。

## Steps
1. SPEC更新、日付・タグ・重複判定・最新情報の回帰テスト（Red）。
2. schema・収集prompt・表示実装（Green）。
3. lint / typecheck / unit / build / E2E・Security回帰を実行。

## Status
実装・ローカル検証完了。ブランチ: `feat/radar-tags-dates-about`。


## Results
- Red: 新規metadataテスト14件中4件失敗を確認後に実装。最終unitは14 files / 131 tests成功。
- `npm run lint`: PASS。
- `npm run typecheck`: PASS、0 errors / 0 warnings / 既存Zod APIの非推奨hint 4件。
- `npm run test:unit`: PASS、131件。
- `npm run build`: PASS、7ページ。テスト用routeはProduction buildに含まれない。
- `PLAYWRIGHT_PORT=4399 npm run test:e2e`: PASS、31件。初回はsandboxのlisten EPERMで起動できず、承認された権限で再実行。
- 375px / 1280pxで複数タグ・期間・登録日・紹介・About・登録年月選択をE2E確認。既存タブ・SNS遅延読み込み・横はみ出しのテストも成功。
- Security: URL/SSRFのunit、Security Header/CSPの既存E2E成功。既存Analytics開発スクリプトのCSP拒否は既存テストに記録される既知事項。CSP・Workflow権限の緩和なし。
- `git diff --check`: PASS。
- 収集JSON Schemaの既存date正規表現が過剰にescapeされていたため、startDate/endDateとともに数字の文字クラスへ修正し、ISO日付を受理するテストを追加。
- 紹介の参照先: https://www.town.mizuho.tokyo.jp/bunka/006/p008104.html （公式ページを確認）。

## Changed files
- `SPEC.md`、本ExecPlan。
- `src/lib/radar.ts`、`src/lib/radar-collector.ts`、`src/lib/latest.ts`、`prompts/collect-latest.md`。
- `src/components/RadarMetadata.astro`（新規）、`CharacterIntro.astro`（新規）、`LatestNews.astro`、`RadarNews.astro`。
- `src/pages/index.astro`、`src/pages/radar/index.astro`、`src/pages/about.astro`。
- `tests/unit/radar-metadata.test.ts`（新規）、`tests/unit/radar.test.ts`。
- `tests/e2e/radar-metadata.spec.ts`（新規）、`tests/fixtures/radar-metadata.astro`（新規）、`tests/fixtures/astro.config.mjs`。

## Limits / Next
- 依存追加なし。既存記事・Human-managedデータ・ID・元情報URL変更なし。複数タグは新規収集から有効、既存記事は元categoryの日本語表示へ互換対応。
- 月表示カレンダーは対象外。今回対象の未実装なし。
- in-app Browserが利用不可のため対話的な目視確認は未実施。Playwrightの自動表示検証は実施済み。実機スマホ・Safari未確認。
- OpenAI API実呼び出し、本番Action実行、deployは未実施。
- 作業開始前からあるルートとtestsの `.DS_Store` は未変更。
- 2026-10-03: PR作成に向けて差分を再確認。in-app Browserの利用可能な接続は0件で、目視確認は未完了。Draft PRとしてレビューに回す。
- 最新mainの追加は公式情報データのみで実装との競合なし。
- 次は目視レビュー後にPRをレビュー可能にし、マージ後に新規収集結果を確認する。
