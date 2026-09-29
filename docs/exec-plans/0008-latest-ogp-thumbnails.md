# ExecPlan 0008 — 最新情報 OGP サムネイル

## Goal / Scope

最新情報で公式・レーダー・手動情報の保存済み thumbnailUrl を安全に引き継ぎ、HTTPS画像だけを遅延表示する。表示時の画像エラーでは画像を除去し、本文と元リンクを維持する。

## Review clarification (2026-09-29)

以下の当初記録の「表示時にはネットワーク/DNS取得を行わず」は、静的ビルド時のサーバー側保存URL検証だけを指す。ブラウザーの画像表示は別であり、遅延読み込み時には外部配信元へのDNS照会・画像取得・リダイレクト追跡が発生し得る。no-referrerは参照元の送信を抑えるが、外部通信自体はなくさない。当初の実施記録は保持し、レビュー修正の詳細は0009を参照する。

## Findings / Decisions

- 公式は data/official、レーダーは data/radar から読み込み。新規URLだけ既存 fetchOgpImage（DNS・redirect検証付き）を利用する収集経路を維持する。
- レーダー→最新情報変換で thumbnailUrl が欠落していた。
- 手動投入は scripts/submit-manual.ts → data/generated/items.json / summaries.json。既存 getLatestItems はトップから未使用。manual のみを最新情報に接続し、旧auto記事の混入を避ける。
- 手動経路では新たなOGP取得を追加せず、保存済み任意URLを扱う。画像データや既存Generated Dataを変更しない。
- 表示時にはネットワーク/DNS取得を行わず、HTTPS・資格情報・非公開リテラル宛先を検査する。実際のOGP取得は従来の fetchOgpImage に限定する。

## Steps

1. SPEC更新、回帰単体テストを追加してRedを確認。
2. 共通型、変換、表示と画像エラー処理を実装。
3. 独立したE2E fixtureで画像あり・なし・不正・失敗、モバイル表示を検証。
4. lint / typecheck / unit / build / Playwright / securityを実行、結果を記録。

## Results

- 完了: 共通LatestItem型とPortalItemの任意thumbnailUrl、レーダーからの引継ぎ、manual記事の集約を実装。
- 完了: 保存URLの同期検証は既存OGPモジュールのIP判定を再利用。公式・レーダーの読み込みでは不正な画像フィールドだけを除外し、記事を維持する。
- 完了: 最新カードにlazy画像、既存と同じ1.91:1比率、no-referrerを追加。errorイベントおよびイベント登録前の失敗済み画像を除去。
- Red: latest単体テストで9件失敗（レーダー画像欠落、不正画像URLの残存）を確認後、実装してGreen。
- npm ci: origin/mainで追加済みの依存関係を復元。新規Dependency・lockfile変更なし。
- npm run lint: PASS。
- npm run typecheck: PASS、0 errors / 0 warnings / 既存Zod APIの非推奨hint 4件。
- npm run test:unit: PASS、12 files / 67 tests。既存OGPのDNS・private redirect拒否とsecurity headerテストを含む。
- npm run build: PASS、7 pages。E2E専用fixtureは本番buildに含まれない。
- npm run test:e2e: PASS、21 tests。正常・未設定・不正・失敗画像、本文とリンク維持、375px幅を含む。
- Playwrightは専用44321ポート・reuseExistingServer=falseで起動。tests/fixturesのAstro設定だけがテストルートを追加する。画像のHTTP応答はテスト生成SVG/abortで完結する。
- npm audit --omit=dev: PASS、0 vulnerabilities（制限環境ではDNS失敗、許可された再実行で成功）。
- git diff --check: PASS。data/、package.json、package-lock.jsonの差分なし。
- 初回typecheck/build/E2Eは未インストールの既存@vercel/analytics依存で失敗。npm ci後の再実行は全成功。
- SPEC第6節を現在仕様に更新。既存の完了済みExecPlanは変更していない。

## Limitations / Next Step

- 保存URLの表示時検査はDNS照会をしない。外部画像配信元の将来のDNS・redirect変更まで保証するものではない。新規取得時のDNS/redirect検査は既存fetchOgpImageが担当する。
- 手動投入に新たなOGP取得やバックフィルは追加していない。保存済みthumbnailUrlがなければ画像なしとなる。
- 実装範囲の未完了なし。実機の画像表示・外部配信元の状況はPreviewで確認を推奨。
- 次の手順: 差分レビュー、PR作成、Preview確認。
