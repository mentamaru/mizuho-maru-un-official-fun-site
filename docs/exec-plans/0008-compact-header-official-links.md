# ExecPlan 0008 — ヘッダー省スペース化と公式リンク集

## Goal / Status

375pxで本文へ早く到達できるヘッダーと、全幅を利用する公式リンク集を実装する。実装・検証完了。

## Baseline / Scope

- origin/mainを取得し、ce99f64からfeat/compact-header-official-linksを作成。
- 既存の未追跡 .DS_Store と tests/.DS_Store は保持。
- Header、Navigation、LinkList、関連CSS、E2E、SPECのみを対象とする。
- データ、ニュースカード、依存関係、CSPは変更しない。

## Plan / Decisions

1. SPECを現在形で更新し、本計画を作成。
2. Playwrightで375px / 1280pxの変更前画像とヘッダー高さを記録。
3. 省スペース・横スクロール・キーボード選択可視性・リンク全体操作のE2Eを先行追加しRedを確認。
4. ヘッダー装飾を除去。メインナビゲーション専用CSSを用い、SNS内タブへ変更を波及させない。
5. 選択タブの矩形とナビゲーションの表示範囲の差分だけscrollLeftを調整。縦方向へ作用するscrollIntoViewは使用しない。
6. リンク集をカテゴリごとの全幅リストに変更。単一アンカー内に名称・説明・装飾SVGを配置。
7. lint、typecheck、unit、build、E2E、Security検証と変更後画像の視認。

## Verification environment

アプリ内ブラウザは接続先なし。Playwright Chromiumを使用する。既存の4321番listenerを再利用せず、PLAYWRIGHT_PORTで専用ポートを選択し、reuseExistingServerをfalseにして既存プロセスの誤検証を防止する。サンドボックス内ではサーバーbindとChromium起動が拒否されたため、許可された実行環境で再実行する。

## Results / Remaining

| Command / Check | Result |
| --- | --- |
| `git fetch origin main` / `git switch -c feat/compact-header-official-links origin/main` | 成功、既存未追跡ファイル保持 |
| `PLAYWRIGHT_PORT=4398 npm run test:e2e -- tests/e2e/compact-layout.spec.ts`（実装前） | 期待どおり4失敗・1成功。ヘッダー高さと説明文を含むリンク操作範囲でRed |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS、0 errors / 0 warnings / 既存Zod非推奨hint 5件 |
| `npm run test:unit` | PASS、12 files / 56 tests。Security Header整合テスト含む |
| `npm run build` | PASS、静的7ページ |
| `PLAYWRIGHT_PORT=4398 npm run test:e2e`（最終） | PASS、25 tests |
| `git diff --check` | PASS |
| `npm run preview -- --host 127.0.0.1 --port 4397` + Playwright Chromium | ビルド済みページの375px / 1280px表示画像を取得・視認 |

### UI結果

- ヘッダー高さ: 375px幅で477 → 113.5px（約76%減）、1280px幅で261 → 124px（約52%減）。本文が初期画面で見えやすくなった。
- 375pxで次のタブ名が部分表示されるよう横余白を調整。初回Green検証では次項目の余白だけが切れていたため、テストを弱めずCSSを修正した。
- 375px / 1280pxで全体の横はみ出しなし。左右キーによる循環選択・選択タブの可視性・縦位置保持を確認。
- 5タブすべてのタッチ、ハッシュ直接表示、補助ページからの移動を確認。既存SNS遅延読み込みE2Eも成功。
- リンク4件はHuman-managed YAMLを直接参照して名称・URL・説明・掲載順・rel・別タブ属性を検証。行全幅とTabキー操作、装飾SVGのaria-hiddenを確認。
- 最終画像: `test-results/layout-after/home-{375,1280}.png` と `links-{375,1280}.png`。変更前は `/tmp/mizuho-layout-before/` に保存（画像はGit管理外）。

### Security / Known issues

- CSP、Security Header、依存関係、Human-managed / Generated Dataに変更なし。新しい依存関係なし。
- 開発サーバーでは既存Vercel Analyticsが `https://va.vercel-scripts.com/v1/script.debug.js` を読み込もうとして既存CSPに拒否される。Layout・Security設定はorigin/mainと同一であり、インストール済みAnalyticsの開発用URLと一致することを確認。
- CSP E2Eはこの正確な既知URLの拒否だけを添付記録し、それ以外の違反がないことを検証する。CSP緩和やAnalytics変更は行わない。最初のSecurity E2Eはこの既知事象で失敗し、記録を明示した最終実行は成功。
- アプリ内ブラウザは利用不可。Playwright Chromiumによる確認であり、実機スマートフォン・Safariでの操作は未確認。
- 未実装の要求機能なし。推奨次手順は実機で横スワイプを確認後、差分レビューとPR作成。開発用AnalyticsのCSP拒否は別途検討する。
