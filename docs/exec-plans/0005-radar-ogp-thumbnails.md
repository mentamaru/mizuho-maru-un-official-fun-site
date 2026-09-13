# ExecPlan 0005 — レーダー OGP サムネイル

## Goal

みずほまるレーダーのトップ表示と一覧で、各元情報ページの OGP 画像をサムネイルとして表示する。

## Scope

- 収集時に主な情報元から `og:image` を解決し、HTTPS URLだけを `thumbnailUrl` として月別レーダーデータへ保存する。
- トップのレーダーカードと `/radar/` 一覧カードで、保存済みの画像を `loading="lazy"` で表示する。
- 既存レーダーデータを更新し、OGP 未設定または取得失敗は `null` として本文表示を維持する。
- OGP HTML 抽出と URL 解決の単体テスト、一覧表示のE2Eを追加する。

## Non-scope

- 第三者画像ファイルのRepositoryへの保存、画像プロキシ、CMS、SSR、汎用クローラー。
- OGP 未設定ページへの代替画像の生成。

## Verification

lint、typecheck、unit test、build、Playwright、既存security testを実行する。
