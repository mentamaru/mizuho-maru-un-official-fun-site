# ExecPlan v2-0009 — CIでTakumi Guard Bot IDを有効化・簡易SAST（Semgrep）追加

## 目的・調査 (2026-11-19)

Takumi Guardの動作確認で、CI（`ci.yml`）のログに `No bot-id provided — running in anonymous mode (Tier A blocking)` が出ていた。ブロックは有効だが、監査ログ・Dashboardが使えていなかった。

- Repository Variable `TAKUMI_GUARD_BOT_ID` を運営者が登録済み（Secretではなく Variable。Bot IDは公開の参照キー）。
- Bot ID使用時はOIDC認証のため `id-token: write` が必要で、認証失敗時はActionがエラー終了する。`official.yml` / `radar.yml` には付与済みだが、`ci.yml` は `contents: read` のみだった。
- Fork / Dependabot起点のPRではOIDC tokenが発行されないため、そのままではRequired CheckのCIが失敗しうる。

## 計画

- `ci.yml` に `id-token: write` のみ追加する（他のWrite権限は追加しない）。
- Fork PR・Dependabot PRではBot IDを空にして匿名モード（ブロックのみ）で実行し、CIを失敗させない。push / 同一リポジトリのPRではBot IDを渡す。
- SPEC §28の権限記述とREADMEの「認証失敗時は縮退」という記述を現在の挙動へ更新する。
- 簡易SAST（Semgrep OSS）を `security.yml` に `semgrep` jobとして追加する。CodeQLに加えて高速な第二のSASTとする。公式Docker image `semgrep/semgrep:1.136.0` をコンテナjobで実行し、`p/javascript` / `p/typescript` / `p/security-audit` を `--error`・`--metrics=off` で実行する。Secret・ログイン・アプリ連携は不要で、権限は `contents: read`。
- `p/github-actions` ルールは、全Actionが可変タグ指定（例 `@v7`）のため全workflowで検出される。SHA固定はSupply Chain方針としての別判断とし、今回のルールセットには含めない。
- npm依存追加なし。Actionのバージョン変更なし。

## 検証・実施結果

- Semgrep 1.136.0 をローカル（一時venv）で上記ルールにて実行: 115ファイル・97ルール・検出0件。`p/github-actions` を加えると可変タグ検出が出ることを確認（上記のとおり対象外）。
- ローカル: lint 成功、typecheck 0 errors / 0 warnings / 既存4 hints、unit 138件成功、build 7ページ成功。E2EはPRのCIで実行する（ローカル未実行）。
- PRのCIログで `No bot-id provided` が出なくなり、Takumi Guardが認証されることを確認する。
- 未検証: Dependabot / Fork起点PRでの匿名モードへのフォールバック（実際のPRが発生するまで確認不可）。Shisho Cloud Dashboardでの表示は運営者が確認する。
