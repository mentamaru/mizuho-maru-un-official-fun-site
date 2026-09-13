# Social OGP fallback and Instagram default

## Goal

X公式プロフィールtimelineが独立したX Publish HTMLでも429を返すため、閲覧時のX widget通信をやめる。ホワイトリストのアカウントプロフィールURLから収集・キャッシュしたOGP画像を静的表示し、関連SNSの初期表示はInstagramにする。

## Design

- `scripts/collect-social-og.ts` は有効なXアカウントURLだけを取得し、`og:image`を`data/generated/social-og.json`へ保存する。
- 収集失敗時は既存キャッシュを失わない。ブラウザ実行時にはXへの通信をしない。
- Xカードはキャッシュ済み画像とアカウントへのリンクを表示する。個別投稿データは扱わない。
- Instagramを内側SNSタブの先頭・初期表示にする。

## Verification

- OGP抽出のunit test
- E2EでXタブ表示時にX widget/syndicationへのリクエストが0件であること
- lint、typecheck、unit、build、Playwright、dependency audit
