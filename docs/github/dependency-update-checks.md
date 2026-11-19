# 依存更新 PR の確認と Security 再実行

Dependabot の version update / security update と手動の依存更新は、通常の `pull_request` CI で検証する。bot 除外や path 除外はない。

- `CI / verify`: `npm ci`、Chromium 導入、lint、typecheck、unit test、build、Playwright。
- `Security / dependency-review`: PR が導入する既知の脆弱な依存の検査。
- `Security / codeql`: JavaScript / TypeScript の静的解析と結果登録。

`main-required-checks.ruleset.json` はこの3チェックを GitHub Actions 発行元に限定し、最新 main への追従を要求する。Owner Review は別ルールで必須。収集専用 App の例外は Workflow・パス単位ではないため、既存の差分検証・テスト・最小権限を維持する。

## 公開後の再実行

1. PR の Checks から失敗した Security の Details を開く（または Actions → Security → 対象の実行）。
2. `Re-run jobs` → `Re-run failed jobs` を選ぶ。成功済みもやり直す場合は `Re-run all jobs`。
3. `dependency-review` と `codeql` 両方の成功を確認する。

CLI: `gh run rerun RUN_ID --failed --repo mentamaru/mizuho-maru-un-official-fun-site`

再実行は元の commit / ref を使い、原則初回実行から30日以内に可能。最新 main との組合せを検証するには PR の Update branch 等でブランチを更新し、新しい CI を実行する。再実行だけで最新 main の検証になったと判断しない。既存 Security は PR / main push / 週次起動であり、workflow_dispatch はない。

`Code scanning is not enabled` / `Dependency review is not supported` は設定・公開状態を調べる。脆弱性検出やテスト失敗なら原因を修正し、チェック無効化や権限拡大で通さない。既存 CodeQL は Advanced setup のため Default setup を重ねて有効化しない。

## 検証範囲とレビュー

unit test は収集・検証・データ変換・セキュリティ処理等、Playwright は画面表示・タブ・絞り込み・SNS遅延読み込み・375px表示等を確認する。build は静的生成を確認する。E2E は開発サーバーと fixture を使うため、本番配信物や Vercel の実レスポンスヘッダー、実際の外部APIとの互換性を完全には保証しない。

OpenAI SDK 等の本番依存を更新する場合は、変更内容と既存テストの範囲をレビューし、必要なら信頼できる環境で実APIを確認する。Dependabot / fork PR に API Secret を渡さない。複数 PR が同じパッケージを更新する場合は重複を確認し、1件ずつ承認・マージした後、残りを最新 main に更新して再検証する。自動承認・自動マージは行わない。

## 公式資料

- https://docs.github.com/en/actions/how-tos/manage-workflow-runs/re-run-workflows-and-jobs
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
