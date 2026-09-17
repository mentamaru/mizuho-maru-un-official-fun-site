# ExecPlan v2-0003 — Google Search Consoleファイル確認

## Goal / Status

Google Search ConsoleのHTMLファイル確認を行えるよう、指定された確認ファイルをサイトの公開ルートに継続して配置する。

実装とローカル検証は完了。Search Console上での所有権確認は本番デプロイ後に行う。

## Scope

- `google089697851ef8fe43.html` を公開ルートへ配置する。
- 指定URLで確認文字列が配信されることをE2Eで検証する。

## Verification

| Check | Result |
| --- | --- |
| E2E（実装前） | FAIL。確認ファイルURLは404 |
| lint / typecheck / unit test / build | PASS |
| 確認ファイルE2E（実装後） | PASS。全19 E2E tests |

## Non-goals

- Google Search Consoleの外部アカウント操作、所有権確認ボタンの実行、sitemap送信は扱わない。
- 確認完了後もファイルは削除しない。
