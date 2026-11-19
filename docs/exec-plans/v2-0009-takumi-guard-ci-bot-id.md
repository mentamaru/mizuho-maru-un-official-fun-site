# ExecPlan v2-0009 — CIでTakumi Guard Bot IDを有効化・SAST（Semgrep）/ Trivy追加

## 目的・調査 (2026-11-19)

Takumi Guardの動作確認で、CI（`ci.yml`）のログに `No bot-id provided — running in anonymous mode (Tier A blocking)` が出ていた。ブロックは有効だが、監査ログ・Dashboardが使えていなかった。

- Repository Variable `TAKUMI_GUARD_BOT_ID` を運営者が登録済み（Secretではなく Variable。Bot IDは公開の参照キー）。
- Bot ID使用時はOIDC認証のため `id-token: write` が必要で、認証失敗時はActionがエラー終了する。`official.yml` / `radar.yml` には付与済みだが、`ci.yml` は `contents: read` のみだった。
- Fork / Dependabot起点のPRではOIDC tokenが発行されないため、そのままではRequired CheckのCIが失敗しうる。

## 計画

- `ci.yml` に `id-token: write` のみ追加する（他のWrite権限は追加しない）。
- Fork PR・Dependabot PRではBot IDを空にして匿名モード（ブロックのみ）で実行し、CIを失敗させない。push / 同一リポジトリのPRではBot IDを渡す。
- SPEC §28の権限記述とREADMEの「認証失敗時は縮退」という記述を現在の挙動へ更新する。
- 簡易SAST（Semgrep OSS）を `security.yml` に `semgrep` jobとして追加する。CodeQLに加えて高速な第二のSASTとする。公式Docker image `semgrep/semgrep:1.136.0` をコンテナjobで実行し、`p/default` / `p/security-audit` / `p/owasp-top-ten` / `p/javascript` / `p/typescript` を `--error`・`--metrics=off` で実行する。Secret・ログイン・アプリ連携は不要で、権限は `contents: read`。
- `p/default` の検出対応として、全workflowの第三者Actionを可変タグからcommit SHA固定（末尾に `# v7` 等のバージョンコメント）へ変更する。タグ書き換えによる供給網攻撃への対策。更新はDependabot（github-actions）が担う。
- Dependabot（npm / github-actions）に `cooldown: default-days: 7` を追加する。新規公開から7日待って更新PRを出し、侵害された直後のバージョンを取り込むリスクを下げる（セキュリティ更新は対象外）。当初は3日の想定だったが、`p/default` のルールが7日を要求するため7日とした（週次更新のため運用上の遅延は小さい）。
- `scripts/collect.ts` / `scripts/collect-social-og.ts` の `console.warn` がテンプレート文字列を第一引数にしていた（format string注意の検出）ため、`%s` 形式へ修正する。出力内容は同じ。
- Trivyを `security.yml` に `trivy` jobとして追加する。`trivy fs` で `vuln,secret,misconfig` を検査し、`HIGH,CRITICAL`・`--ignore-unfixed`・dev依存を含めて検出時は失敗させる。
- 2026-03にtrivy-action / setup-trivyのタグ書き換えとTrivy v0.69.4の侵害があった（CVE-2026-33634）ため、第三者Actionは使わず、`ghcr.io/aquasecurity/trivy:0.76.2` をdigest（`sha256:8f6bb947…`）固定で `docker run` する。0.76.2は侵害対象外のバージョン。更新は手動でバージョンとdigestを同時に変更する。
- Trivyの脆弱性DB取得は実行時にネットワークへ依存する（一時的な取得失敗でjobが失敗する可能性）。
- npm依存追加なし。Actionは同一メジャー（v7等）のまま、commit SHA固定へ変更。

## 検証・実施結果

- Semgrep 1.136.0 をローカル（一時venv）で実行: 追加ルールセット適用後の初回は21件（Actionの可変タグ17・Dependabot cooldown 2・format string 2）。上記の対応後は115ファイル・278ルール・検出0件。
- Trivy 0.76.2（GitHub Releaseのchecksum検証済みバイナリ）をローカルで同条件実行: package-lock.json の脆弱性0件、Secret / 設定ミス検出なし。CI用のdocker image実行はローカルにDockerデーモンがなく未実行（PRのCIで確認）。
- ローカル: lint 成功、typecheck 0 errors / 0 warnings / 既存4 hints、unit 138件成功、build 7ページ成功。E2EはPRのCIで実行する（ローカル未実行）。
- PRのCI: `verify`（E2E 33件含む）・`semgrep`・`trivy`・`codeql`・`dependency-review` 成功。Takumi Guardは `Authenticated as bot … (Tier C)` で認証され、匿名モードの通知は出なくなった。
- Ruleset `main-required-checks`（GitHub Actions発行元・最新main追従）のRequired Checkへ `semgrep` と `trivy` を追加した（運営者の指示により2026-11-19にAPIで更新。既存の `verify` / `dependency-review` / `codeql` と収集用Appの例外は変更なし）。
- 未検証: Dependabot / Fork起点PRでの匿名モードへのフォールバック（実際のPRが発生するまで確認不可）。Shisho Cloud Dashboardでの表示は運営者が確認する。
