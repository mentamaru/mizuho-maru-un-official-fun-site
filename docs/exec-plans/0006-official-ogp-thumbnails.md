# ExecPlan 0006 — 公式情報 OGP サムネイル

## Goal

公式情報のトップ表示と一覧で、記事のOGP画像を安全にサムネイル表示する。

## Scope

- 新規RSS記事の元ページから、既存の安全なOGP取得処理で有効な画像だけを任意の `thumbnailUrl` として記録する。
- 公式情報のトップカードと `/official/` 一覧カードで、保存済み画像を `loading="lazy"` で表示する。
- OGP未設定・取得失敗・非公開宛先は既存JSONを変更せず、画像なしで表示する。
- 型、収集、表示、単体・E2Eテストを更新する。

## Non-scope

- 第三者画像のRepository保存、画像プロキシ、RSS以外の収集、既存データのバックフィル。

## Verification

lint、typecheck、unit test、build、Playwright、既存security testを実行する。
