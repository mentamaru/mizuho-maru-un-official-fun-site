# ExecPlan 0004 — SNS埋め込みのIntersection遅延ロードとX直列化

## Goal

関連SNSを開いた時点で全アカウントの外部埋め込みを開始する現状を改める。X公式 `https://platform.x.com/widgets.js` と `twitter.widgets.createTimeline(...)` は維持しつつ、可視範囲の少し手前にあるカードだけを読み込み、Xのタイムライン生成を常に1件ずつ直列化する。Instagramも同じ可視範囲基準でiframeを生成する。

## Scope

- `SocialFeed.astro` のSNS埋め込み起動を、カード単位のMutationObserverから共有IntersectionObserverへ置換する。
- 外側の「関連SNS」タブと内側のX/Instagramタブが両方表示中の場合だけ監視対象を登録する。
- `rootMargin: '300px'` を基準に、未ロード・未ロード中の対象だけを開始する。
- `data-loaded`、`data-loading`、X用の`data-queued`で重複開始を防ぎ、成功済み埋め込みはタブ復帰後も再利用する。
- Xはwidgets.jsを1回だけ共有ロードし、`createTimeline`呼出しをPromiseキューで直列化する。失敗後の再試行は既存の外部リンクと再試行UIを維持する。
- X / Instagramとも、開始前から最低高を持つローディングプレースホルダーを表示し、開始から成功または失敗までaria-liveな状態を提供する。
- 単体・E2Eテストを、初期状態での外部通信なし、プラットフォーム選択後の可視カードのみのロード、X直列化、再訪時の非再ロード、失敗時の再試行を確認する内容へ更新する。

## Non-scope

- X埋め込み方式の変更、直接の`syndication.twitter.com` iframe指定、X/Instagram APIや新規依存ライブラリの導入。
- SNSアカウントデータ、CSP許可Origin、外側/内側タブのアクセシビリティ仕様の変更。

## Implementation steps

1. 既存の`retryableLoader`とtimeoutの単体テストへ、失敗後も後続タスクを実行できる直列キューの失敗再開を追加し、REDを確認する。
2. `social-loader.ts` に小さな直列キューを実装する。
3. `SocialFeed.astro` に各埋め込みの固定高プレースホルダーと状態data属性を追加する。
4. 1つのIntersectionObserverを共有し、表示中のプラットフォームだけの未ロードカードをobserve/unobserveする。タブ切替は既存のrole、aria-selected、aria-controls、左右キー操作を保ったままこの同期処理を呼ぶ。
5. Xではキューに入れた時点でqueued/loadingを管理し、順番が来て初めてwidgets.jsと`createTimeline`を実行する。Instagramはiframe作成後のload/errorで状態を確定する。
6. E2Eを更新して、複数Xが同時に開始されないこと、Instagramがタブ表示時でも可視対象以外は生成しないこと、ローディングUIと再訪時の再利用を検証する。
7. lint、typecheck、unit test、build、Playwright、既存security checkを実行し、SPEC第14節との整合を確認する。

## Acceptance criteria

- 関連SNSを開く前はX widgets.js、X timeline、Instagram iframeの通信をしない。
- 各プラットフォームのタブを表示しても、IntersectionObserverの300px範囲に入ったカードだけが開始する。
- 同一ページ内で成功済みのカードはタブを往復しても再ロードしない。
- Xの`createTimeline`は前の呼出しの完了（成功・失敗を問わず）後にだけ次を開始する。
- すべてのSNSカードは空白にならず、開始中に指定の日本語ローディング表示を持つ。
- 依存追加なし。SPEC変更は不要（第14節の既存仕様を満たす不具合修正）。
