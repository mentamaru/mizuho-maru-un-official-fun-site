# ExecPlan v2-0007 — サムネイルなし記事の仮画像表示

Issue: https://github.com/mentamaru/mizuho-maru-un-official-fun-site/issues/74

## 目的・調査 (2026-11-19)

公式情報・レーダー・最新情報で `thumbnailUrl` が未設定・不正・読み込み失敗の場合、画像を表示せず、カードの体裁が不揃いだった。画像表示が5箇所（最新情報、公式トップ/一覧、レーダートップ/一覧）に重複していた。

## 計画

- SPECの「画像なしで表示」を「同一オリジンの仮画像を表示」へ現在形で更新する。
- 本Repositoryで作成した中立的なSVG `public/images/news-placeholder.svg` を追加する。使用色はSPECのパレット（Soft Background・Soft Pink・Light Purple・Leaf Green）のみ。キャラクター画像・第三者画像は含めない。
- 共通コンポーネント `NewsThumbnail.astro` を追加し、5箇所を置き換える。保存済みURLの検証（`savedThumbnailUrl`）、`loading="lazy"`、`referrerpolicy="no-referrer"`、`alt=""`、比率1.91:1は維持する。読み込み失敗時は1回だけ仮画像へ差し替える。
- 先にE2Eを更新して失敗を確認し（Red）、実装して成功させる（Green）。依存追加なし。データ形式は変更しない。

## 検証・実施結果

- Red: E2E更新後、latest・radarの2件が失敗することを確認済み。
- 仮画像の配色: 指示によりLeaf Greenを追加（丘のシルエットと山の線）。レンダリングして確認済み。
- Green: `npm run lint` 成功。`npm run typecheck` 0 errors / 0 warnings / 既存4 hints。`npm run test:unit` 138件成功。`npm run build` 7ページ成功。`npx playwright test` 33件成功。
- E2E: 最新情報の画像なし・不正URL・読み込み失敗の3件が仮画像になること、公式・レーダー一覧の全カードに画像があることを検証。
- Security: 依存追加・CSP変更なし（仮画像は同一オリジンで `img-src 'self'` 内）。npm audit等の追加スキャンは未実行。
- 未実施: 実データでの本番表示確認。Approve / Mergeは未実施。
