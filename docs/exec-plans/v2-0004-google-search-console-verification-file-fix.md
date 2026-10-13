# ExecPlan v2-0004 — Google Search Console確認ファイルの不足修正

## Goal / Status

Google Search Consoleが要求する `google8419fdb84968a5df.html` を公開ルートに配置し、「所定の場所で確認ファイルが見つかりませんでした」というエラーの原因を解消する。

実装とローカル検証は完了。本番デプロイとSearch Console上での再確認は未実施。

## Context

既存の `public/google089697851ef8fe43.html` は今回要求されたファイル名と異なり、新しい確認URLは404を返していた。

完了済みの `v2-0003-google-search-console-verification.md` は当時の実施記録として保持する。既存の確認ファイルも維持する。

## Implementation

- [x] 指定URLのHTTPステータス・Content-Type・確認文字列を検証するE2Eテストを追加し、修正前の404を再現する。
- [x] `public/google8419fdb84968a5df.html` に `google-site-verification: google8419fdb84968a5df.html` を配置する。
- [x] 修正後のE2Eと必須チェックを実行し、ビルド成果物に同一内容のファイルが含まれることを確認する。
- [ ] 本番へデプロイし、公開URLで確認文字列が表示されることを確認する。
- [ ] Search ConsoleでHTMLファイル確認を再実行する。

## Verification

| Command / Check | Result |
| --- | --- |
| `npx playwright test tests/e2e/google-verification.spec.ts`（修正前） | FAIL。期待200に対し404を返し、不具合を再現 |
| 同上（修正後） | PASS。1件。HTTP 200、text/html、確認文字列の一致を確認 |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS。エラー0、既存の非推奨APIヒント4件 |
| `npm run test:unit` | PASS。14ファイル、132件。既存セキュリティテストを含む |
| `npm run build` | PASS |
| `cmp public/google8419fdb84968a5df.html dist/google8419fdb84968a5df.html` | PASS。公開用成果物と元ファイルが一致 |
| `git diff --check` | PASS |

E2Eは初回にサンドボックスのローカルポート待受制限で起動できなかったため、権限昇格で再実行した。E2E全件実行、依存関係監査、本番での所有権確認は今回行っていない。

## Scope / Known Issues

追加Dependency、SPEC変更、Security Header変更はない。SEO全般の変更や検索順位の改善を扱うものではなく、指定された所有権確認ファイルの配置修正とする。

ローカル検証で未解決の不具合はない。本番反映後の確認が残る。確認完了後もファイルを削除しない。

公開確認先: https://mizuho-maru-un-official-fun-site.vercel.app/google8419fdb84968a5df.html
