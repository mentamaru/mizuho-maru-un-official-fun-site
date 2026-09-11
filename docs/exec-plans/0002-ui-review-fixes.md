# ExecPlan 0002 — UI検証指摘とSNS表示の修正

## Goal / Status

SPECに対するデザイン・UI/UX検証で判明した不備を修正する。
UI修正とローカル検証は完了。外部SNSの実表示には下記の制限が残る。
既存の `0001-initial.md` は当時の記録として保持する。

## Scope

- White Base、紫・緑のアクセント、文字組み、コントラスト、タッチ・キーボード操作。
- メインタブと補助ページ間の導線、元情報リンク、日付の出自表示。
- X / Instagramの遅延埋め込みと外部リンク。
- 問い合わせ先の後日設定、ローカルとVercelのSecurity Header整合。

## Implementation / Decisions

- ページとFooterを白背景に統一。紫は操作・リンク、緑はロゴ・見出し等のアクセントに使用。Primaryを `#903B80` に調整。
- daisyUI 5に合わせ `tabs-boxed` を `tabs-box` に修正。選択状態・Focus・44px以上の操作領域・本文スキップリンク・文章用CSSを整備。
- 補助ページのナビゲーションはトップの各タブへのリンク。URL hashに対応し、パネルのキーボードフォーカスと見出し構造を改善。
- 元情報リンクを日本語化。公開日未確認の場合は収集日であることを明示し、日付表示をAsia/Tokyoに統一。
- 関連SNSの各Platformを開いたときだけ埋め込みを開始。同一ページでタブへ戻っても再取得しない。
- XはAPIキー不要の公式プロフィールタイムライン埋め込み。取得ボタンを廃止し、タイムアウトと失敗後の再試行を実装。
- Instagramはユーザー指定の `marumaru_mizuho` を「イベント情報」として登録し、プロフィールを埋め込む。外側のスクロール制限は設けず、560pxのiframeを表示する。
- 両SNSともアカウント名を外部プロフィールリンクにし、重複する「〜で見る」ボタンと通常時の説明を削除。`data/social.yml` の任意の `description` を紹介文として表示する。紹介文が未設定なら表示しない。
- Xの読み込み中・失敗時の状態通知を維持。成功時は案内文を消し、失敗時にはアカウント名のリンクと再試行へ案内する。
- 問い合わせはユーザーの指定により仮状態。`PUBLIC_CONTACT_URL` に有効なURLを設定してビルドするとフォームへのリンクを表示する。
- 実際のX iframeの通信先に基づき `syndication.twitter.com` をCSPのframe-src / child-srcへ追加。他のOriginを一括許可しない。
- Security Headersを共通化し、Astro開発時はmiddleware、Vercel配信時はvercel.jsonで適用する。
- Dependency追加なし。SPECの許容範囲内のためSPEC変更なし。

## TDD / Verification

日付fallbackの表示とSNS自動読み込みについて、修正前に失敗するテストを実行した。
最終UI変更後の実行結果（2026-09-11）：

| Command | Result |
| --- | --- |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS、38 files、error / warningなし |
| `npm run test:unit` | PASS、7 files / 23 tests |
| `npm run build` | PASS、静的4ページ |
| `npm run test:e2e` | PASS、10 tests、外部X実接続の1 testは通常実行ではskip |
| `VERIFY_LIVE_X=1 npm run test:e2e -- tests/e2e/social-live.spec.ts` | 実接続確認時にFAIL、X側がHTTP 429。表示成功とは扱わない |
| `curl -sI http://127.0.0.1:4321/` | CSP / Permissions-Policy / Referrer-Policy / X-Content-Type-Optionsを確認 |

E2EはSNS応答を模擬して遅延読み込み・再試行・アカウントリンク・タブ操作・375px / 1280pxでの横はみ出しを確認する。
375px / 1280pxのスクリーンショットで白背景とアクセントを確認した（SNS紹介文整理より前の確認）。
Instagram実表示はユーザーから表示できたとの報告あり。こちらのE2Eは実サービス内の投稿内容までは保証しない。
Security Headers整合の単体テストはPASS。今回、脆弱性監査・Secretスキャン・Lighthouse・スマートフォン実機検証は未実施。

## Changed Files

- `src/components/{Header,Footer,Navigation,LatestNews,RelatedInfo,SocialFeed}.astro`
- `src/layouts/Layout.astro`、`src/pages/{index,contact,operator}.astro`、`src/styles/global.css`
- `src/lib/{content,site-data,social,social-loader,security}.ts`、`src/middleware.ts`
- `data/social.yml`、`astro.config.mjs`、`vercel.json`
- `tests/unit/{site-data,social-loader,security}.test.ts`、`tests/e2e/{site,social-live}.spec.ts`

## Known Issues / Remaining Work

- X側の429制限により実タイムラインの正常表示は未確認。サイト側は失敗表示・再試行・プロフィールリンクを提供する。
- Instagramプロフィールの内容・高さは外部サービスに依存する。最新3投稿の自動取得は未実装。対象アカウントと連携できないことを確認済みで、プロフィール埋め込みだけから取得できるとは扱わない。
- 問い合わせURLは後日設定。本人未確認のプロフィール情報や架空のフォームは作成していない。
- 次の確認はVercel PreviewでのSNS/CSP・実機表示、フォームURL設定後のリンク確認。

## Record Handling

別セッションの作業中は `/private/tmp/mizuho-ui-execplan.md` に記録し、ユーザーの指示を受けて本ExecPlanへ整理した。
別セッションのData Pipeline、README、ENV設定、初期ExecPlanの変更はこの作業で上書きしていない。
この作業ではコミット・デプロイを行っていない。
