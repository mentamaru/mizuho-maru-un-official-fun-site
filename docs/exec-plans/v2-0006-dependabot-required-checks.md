# ExecPlan v2-0006 — Dependabot PR の検証必須化

Issue: https://github.com/mentamaru/mizuho-maru-un-official-fun-site/issues/68

## 目的・調査 (2026-11-17)

Dependabot PR 6件は既存 CI（lint / typecheck / unit / build / Playwright）成功。5件の Security は非公開時の機能利用不可で失敗していたため再実行した。main の実効ルールには required_status_checks がない。

## 計画

- SPEC に全 PR の必須チェックを規定する。
- 独立 Ruleset に verify / dependency-review / codeql、発行元 GitHub Actions、最新 main への追従を設定する。収集専用 App だけを例外とし、Owner Review と破壊的操作禁止を維持する。
- 再実行と依存更新レビューの手順・テスト範囲を文書化する。
- lint / typecheck / unit / build / E2E を実行し、GitHub 設定を適用・再取得する。
- PR を作成する。Approve / Merge は行わない。

## 検証・実施結果

- Security 再実行: #60 / #62 / #64 / #65 / #66 の dependency-review / codeql が全成功。#67 も既存実行が成功。
- Ruleset `main-required-checks` (ID 27436643) を active で適用。API再取得で3チェック、GitHub Actions ID 15368、strict=true、収集 App ID 5724378 のみの例外を確認。既存 Owner Review・削除/force push 禁止も実効ルールに残る。
- `npm run lint` 成功。`npm run typecheck` 0 errors / 0 warnings / 既存4 hints。`npm run test:unit` 138件成功。`npm run build` 7ページ成功。`npm run test:e2e` は sandbox の listen EPERM 後、通常環境で再実行し33件成功。既存ローカル依存を使用し npm ci は今回未実行。
- `git diff --check` 成功。ロジック変更・依存追加なし。設定のみの変更のため、テスト追加ではなくGitHub APIによる適用値の確認を行った。失敗チェックを持つPRのマージ試行は行っていない。
- Secret scanning / Push protection / Dependabot security updates は enabled。未解決 code scanning / secret scanning は各0件。Dependabot alerts は13件（high 4 / medium 6 / low 3）残る。更新PR未マージのため、チェック成功を脆弱性解消済みとは扱わない。
- 外部APIの実動作・本番配信の完全な検証は今回の対象外。既存E2Eの範囲と再実行手順を運用文書に記載した。Approve / Merge は未実施。
