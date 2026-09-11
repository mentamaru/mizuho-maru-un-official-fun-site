# ExecPlan 0005 — マップタブとみずほまる関連地図の追加

## Goal / Status

トップページのメインナビゲーションに「マップ」タブを追加し、みずほまるグッズマップとみずほまるイベントマップを、説明文とともに表示する。

実装と静的検証は完了。Playwright E2Eはローカル開発サーバーがready前に終了する既存の実行環境問題により未完了。

## Scope

- 5番目のメインタブと対応パネルの追加。
- 2つのGoogle マイマップのアクセシブルでレスポンシブな埋め込み。
- 埋め込み先だけを許可するCSPの更新。
- タブ操作、地図の表示、モバイル幅での横はみ出しをE2Eで確認。

## Implementation / Decisions

- `SPEC.md` を現在仕様として更新し、マップタブの説明文、地図名、レスポンシブ表示、遅延読み込みを規定する。
- 地図UIは再利用可能なAstroコンポーネントへ分離し、見出しと `title` を付与する。
- iframeは `loading="lazy"`、固定の縦横比、幅100%を用いる。外部JavaScriptやDependencyは追加しない。
- ユーザー指定の訂正版Google マイマップID（グッズ: `1ZV5EpLJDfQTXTPZs6x1O5tqj8546h3I`、イベント: `1MORDRyzpqRKW5FQ0cB5FrqS_4VYqvag`）を使用する。
- 各地図の見出し下に、対象エリアを簡潔に説明する文を表示する。
- `www.google.com` だけを `frame-src` と `child-src` に追加し、開発時とVercel配信時のSecurity Headerを一致させる。
- 既存のタブ切り替え・URL hash・矢印キー操作をそのまま5タブに適用する。

## TDD / Verification

地図タブとiframe属性を検証するE2Eを先に追加して失敗を確認し、その後に実装する。実装後は `npm run lint`、`npm run typecheck`、`npm run test:unit`、`npm run build`、`npm run test:e2e` を実行する。Security Headerの単体テストと、375px / 1280pxでの横はみ出し確認を含める。

## Risks / Non-goals

- Google マイマップの地点データや外部サービス内の可用性・表示内容は本サイトの管理対象外。
- 地図を初期HTMLへ埋め込むため、ブラウザ依存の遅延読み込みのタイミングは保証しない。
- 地図の編集機能、独自地図データ、バックエンドは追加しない。

## Verification Record

| Command | Result |
| --- | --- |
| `npm run test:unit -- tests/unit/security.test.ts`（実装前） | FAIL（Google MapsのCSP許可先が未実装） |
| `npm run test:unit -- tests/unit/security.test.ts`（実装後） | PASS、1 test |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS、0 errors（既存のZod非推奨hint 4件） |
| `npm run test:unit` | PASS、9 files / 35 tests |
| `npm run build` | PASS、静的6ページ |
| `npm run test:e2e` | 未完了。Astro dev serverがready前にexit code 1で終了 |

E2E失敗時、ポート4321には応答しない既存のlistenerがあり、別ポート4322でもAstro dev serverは同じready前終了となった。既存プロセスを停止せず、テスト設定の恒久変更も行っていない。
