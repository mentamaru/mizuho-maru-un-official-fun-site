# ExecPlan 0009 — 記事の囲いを除去

## Goal / Review

前回のヘッダー・公式リンク集改善を保持し、最新情報・レーダー・公式情報の記事も枠なしへ統一する。

レビュー上の問題は、枠だけを外すとカード用paddingが残ってスマホの本文幅を狭めること、記事同士の境界が失われること、元情報ボタンの塗りが強いこと。一覧ページでは画像が全幅に広がり、記事へ到達するまでの縦幅も大きい。

## Decisions

- ニュース専用CSSで外枠・角丸・影とカード用paddingを除去。SNS等へ波及させない。
- トップのPC3列は維持。縦並びの記事間のみ薄い区切り線を置く。
- フィルターで非表示の記事は区切り判定から除外し、先頭の表示記事に線を出さない。
- 元情報は下線付きリンク、44px以上の操作領域とfocusを維持。
- 一覧の画像はPCでは幅15remまでの左列、本文は右列。画像なしは全幅。
- 記事見出しの階層、画像のlazy load、本文、データ、URL、情報源、フィルターは維持。
- SPECに現在の表示仕様を追記。完了済みExecPlanは変更しない。

## Verification / Status

実装・検証完了。

| Command / Check | Result |
| --- | --- |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS、0 errors / 0 warnings / 既存hint 5件 |
| `npm run test:unit` | PASS、12 files / 56 tests |
| `npm run build` | PASS、7ページ |
| `PLAYWRIGHT_PORT=4398 npm run test:e2e` | PASS、25 tests |
| `git diff --check` | PASS |
| ビルド済みページをPlaywrightで確認 | 375px / 1280px、3タブ・2一覧で記事の枠・影なし、全体横はみ出しなし、フィルター後の先頭記事に区切り線なし |

初回E2Eは既存Astro開発サーバーのロックで起動失敗。既存プロセスは停止せず、Playwrightの起動コマンドへ `--ignore-lock` を追加して専用ポートで並行起動し再実行した。既存サーバーの再利用は禁止したまま。

画像は `test-results/news-review/` に保存して視認。Security Header / CSP回帰テストも成功（前回記録したAnalytics開発スクリプトの既知CSP拒否のみ例外記録）。CSP、依存関係、データ変更なし。実機スマホ・Safariは未確認。未実装なし。次は表示レビュー後にPRへまとめる。

単純なマークアップ・CSS変更のため実装をなぞるUnit Testは追加しない。
