# ExecPlan 0005 — レーダー OGP サムネイル

## Goal

みずほまるレーダーのトップ表示と一覧で、各元情報ページの OGP 画像をサムネイルとして表示する。

## Scope

- 収集時に主な情報元から `og:image` を解決し、公開IPへ解決できるHTTPS URLで、画像として正常に取得できたものだけを `thumbnailUrl` として月別レーダーデータへ保存する。
- トップのレーダーカードと `/radar/` 一覧カードで、保存済みの画像を `loading="lazy"` で表示する。
- 既存レーダーデータは変更しない。OGP 未設定・取得失敗・不正な宛先では画像情報を追加せず本文表示を維持する。
- OGP HTML 抽出と URL 解決の単体テスト、一覧表示のE2Eを追加する。

## Non-scope

- 第三者画像ファイルのRepositoryへの保存、画像プロキシ、CMS、SSR、汎用クローラー。
- OGP 未設定ページへの代替画像の生成。

## Verification

lint、typecheck、unit test、build、Playwright、既存security testを実行する。
