# ExecPlan v2-0009 — レーダーのイベントカレンダー（トップページ）

Issue: なし（Pull Requestで管理する）

## 目的・調査 (2026-11-19)

みずほまるレーダーに登録された「イベント」「出演・登場」を、トップページで月表示カレンダーとして見られるようにする。「いつ・どこにみずほまるが来るか」を一覧より直感的に把握できるようにするのが狙い。

要望（2026-11-19）: ①`appearance`（出演・登場）も含める ②タグごとに色分けする ③「今日」はビルド時の日付ではなく静的サイトのままブラウザー側で取得する ④使えるならカレンダーライブラリーを使う。

現状の調査結果:

- レーダーのイベントは `data/radar/YYYY-MM.json` の `tags` と `startDate` / `endDate`（終了日を含む暦日、終了日不明は `null`）で表現されている。旧データは `tags` / `startDate` を持たず、`category` または `dateType: event` の `date` を開始日として扱う（[RadarMetadata.astro](../../src/components/RadarMetadata.astro) と同じ互換ルール）。
- 現在のデータは15件中6件が `event` タグ付き（うち4件が `appearance` も併記）。すべて開催日あり。同一イベントに複数記事（例: 産業まつり3件）が紐づく。
- **SPEC §34 は「月表示カレンダーは対象外」と明記している。** 本件は仕様変更であり、SPECを現在形へ更新する（旧仕様を履歴として残さない）。
- **SPEC §4 / AGENTS.md は「Dependency追加前に既存機能で実現できないか確認」「Supply Chain Riskを考慮」を求める。** 追加要望④を受け、下記「ライブラリ選定」で比較した。
- CSPは `style-src 'self' 'unsafe-inline'` / `script-src 'self' 'unsafe-inline'`（[security.ts](../../src/lib/security.ts)、`vercel.json`）。ライブラリの動的スタイル注入は現行CSPの範囲内で動くため、**CSPは緩和しない**。
- `src/pages/index.astro` は「最新情報」パネルに `LatestNews` と `CharacterIntro` を持つ。メインタブは増やさない。
- データ形式・収集Workflow・プロンプト・Secretは変更しない。

## ライブラリ選定（2026-11-19 時点・実測）

| 候補 | 判定 | 根拠 |
|---|---|---|
| **FullCalendar 6.1.22**（`@fullcalendar/core` + `@fullcalendar/daygrid`）+ `ja` ロケール | **採用** | MIT。フレームワーク非依存で、複数日イベントのバー・日別マーク・`+件数`・前後月移動の制限（`validRange`）・`now` 指定・日本語ロケール・イベント別CSSクラスを標準で備える。内部でpreact 10を同梱するが利用側でReact等の追加は不要。実測バンドル 192KB（minify）/ **約59KB gzip**。`npm audit` 0件。最終公開 2026-10 でメンテナンスされている。 |
| vanilla-calendar-pro 3.4.0 | 不採用（代替案） | MIT・依存0・約18KB gzip と軽いが、日付ピッカー指向でイベントバーや複数日表示を持たず、結局イベント描画を自作することになる。FullCalendarが問題になった場合の撤退先。 |
| Schedule-X 4.x | 不採用 | preact・signals・temporal-polyfillのpeer依存が必要で、展開後約1MB。 |
| FullCalendar 7.x | 不採用 | 新メジャーで `temporal-polyfill` と `@full-ui/headless-calendar` のpeer依存が増え、daygridが6.x系のままで足並みが揃っていない。安定後に別途検討する。 |
| 自作（標準Web API） | 不採用 | 前版の計画。ライブラリ利用の要望があり、期間バー・ロケール・アクセシビリティの自作コストが大きいため。ただしロジック（対象判定・日付変換）は自作する。 |

追加するDependency: `@fullcalendar/core@6.1.22`、`@fullcalendar/daygrid@6.1.22`（推移的にpreact 10.12.1）。プレミアム（有償）プラグインは使わない。

採用ライブラリの詳細（2026-11-19 確認）:

- リポジトリ: https://github.com/fullcalendar/fullcalendar （MIT、★約2.1万、archivedではない、最終push 2026-11-12、メンテナー arshaw）。公式サイト https://fullcalendar.io 、月表示 https://fullcalendar.io/docs/month-view
- npm: https://www.npmjs.com/package/@fullcalendar/core / https://www.npmjs.com/package/@fullcalendar/daygrid （6.1.22は2026-10-16公開）。install / postinstall scriptなし。
- 推移的依存: preact（https://github.com/preactjs/preact 、MIT）のみ。
- 代替候補: https://github.com/uvarov-frontend/vanilla-calendar-pro 、https://github.com/schedule-x/schedule-x 。

Supply Chain対策: 公式パッケージのみ・2パッケージに限定、`package-lock.json` で固定、導入後に `npm audit` と `npm ls` を確認、install scriptを持たないこと（`npm view <pkg> scripts`）を確認、既存のDependabot運用に載せる。

## 方針（確定事項）

- **掲載対象**: タグに `event` または `appearance` を含み（旧データは `category` が `event` / `appearance`、または `dateType === 'event'` を `event` とみなす）、開始日が確定できるレーダー項目のみ。開始日が不明（`null`）の項目は推測せず載せない。`sale` / `broadcast` など他タグ単独の項目は対象外（その日付は開催日ではなく販売日・放送日のため）。`appearance` のみで `startDate` が `null` の項目も、公開日などで代用せず載せない。
- **期間**: `startDate` 〜 `endDate`（含む）の全日。`endDate` が `null` は開始日のみ。FullCalendarへは終日イベントとして渡し、終了日は**排他的**（`endDate` の翌日）へ変換する。
- **配置**: トップの「最新情報」パネル、最新情報の記事群の下・「みずほまるとは？」の上。新しいタブ・ページは追加しない。
- **タグの色分け**: 対象タグは `event`（イベント）と `appearance`（出演・登場）。`event` はMizuho Purple、`appearance` はLeaf Greenのアクセントとする（紫とピンクは区別しにくいため、Greenを「必要に応じたAccent」として控えめに使う）。両タグを持つ項目は **`appearance` の色を優先**し、グリフ・バッジは両方表示する。色だけに依存せず、イベントのグリフ（`event`＝●、`appearance`＝◆）と、色＋日本語ラベルの凡例を併記する（色覚多様性・コントラスト対応）。色はdaisyUIテーマトークン / CSS変数（FullCalendarの `--fc-*` 変数を上書き）で定義し、コード内に色コードを直書きしない。コントラストを確認し、不足する場合はSPECの許す範囲で近似色を微調整する。ラベルは `radarTagLabels` を共通利用する。
- **表示**: `dayGridMonth`、日曜始まり、`ja` ロケール、6週固定（`fixedWeekCount: true`）。ヘッダーは「前月 / 翌月 / 今月」と年月タイトルのみ。Googleカレンダーの月表示に近づけ、PC・モバイルとも日付をまたぐ**期間バーに記号とタイトルを表示**する（2026-11-19の追加要望。当初案のモバイル点表示は撤回）。モバイルはタイトルを最大2行・小さい文字で表示する。**月をまたぐイベント**は、表示月の前後の月の日付（6週固定のため翌月の最初の週など）にもバーを連続して描画し、継続側に ◀ / ▶ を付ける。1日に4件以上ある場合は `dayMaxEvents: 3` で「他n件」。`stickyHeaderDates` は無効（ページスクロール時の曜日行の重なり防止）。
- **日・イベントの選択**: 日セルまたはイベントを選ぶと、カレンダー下の詳細領域（`aria-live="polite"`）に当日（またはそのイベント）の一覧（タイトル・**概要**・開催期間・タグバッジ・元情報リンク）を表示する。概要はレーダーのAI要約で、その旨を説明文に明記する。イベントの `url` による直接遷移は行わず、詳細領域のリンクで遷移させる（モバイルでの誤タップ防止）。
- **「今日」の扱い**: ビルドは週次でビルド時の日付は古くなる。静的サイトのまま、ブラウザー側で `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' })` により現在時刻をAsia/Tokyoの暦日文字列にして取得する（サーバー・API不要）。この値をFullCalendarの `now` に渡して「今日」の強調と `initialDate` に使う。今日の月が表示可能範囲外なら最も近い月を初期表示にする。表示可能範囲（`validRange`）は「掲載対象イベントを含む最初の月〜最後の月」とし、空の月を延々と辿らせない。
- **Static First / 遅延読み込み**: ライブラリは動的 `import()` で別チャンクにし、カレンダー領域がビューポート近くに来たとき（`IntersectionObserver`）に読み込む。初期表示（最新情報）をブロックしない。静的HTMLには、月ごとにまとめた**イベント一覧（`<ul>`）を常に出力**し、JS無効・読み込み失敗時・支援技術向けのフォールバックにする。カレンダー描画に成功したら、一覧は詳細領域の役割に統合する（二重表示にしない）。
- **元情報の保持**: 詳細・一覧のリンクは `source.url`（Original URL）で `rel="noopener noreferrer"`。AI要約（概要）は詳細・一覧にのみ表示し、カレンダーのバーにはタイトルだけを出す。
- **データ所有**: 読み取り専用。`data/radar` を書き換えない。
- **i18n**: FullCalendarのロケールは動的importで `ja` を読み込む（将来 `en-US` はロケールを切替えるだけで済む構成にする）。ボタン文言・凡例・「+n件」は `src/lib/content.ts` の文言辞書へ寄せる。v1は `ja-JP`、過剰設計はしない。
- **デザイン**: White Base。ブランドカラーは今日の強調・選択日・イベントの色・ボタン・フォーカスのアクセントのみ。SPEC §12 のColor Paletteのトークンを使用。枠・影を増やしすぎない。

## 実装設計

### 純粋ロジック `src/lib/calendar.ts`（新規・TDD）

ライブラリに任せない、検証すべき判定・変換だけを切り出す。

- `toCalendarEvents(items: RadarItem[]): CalendarEvent[]` — 掲載対象の判定と、`{ id, title, summary, start, end, endExclusive, tags, colorTag, sourceUrl, sourceName }` への正規化（`startDate` 昇順 → `title`）。`tags` は元の `tags` のうち `event` / `appearance` のみ（旧データは互換ルールで補完）。`colorTag` は `appearance` 優先。
- `monthsInRange(range): string[]` — 範囲内の全月（YYYY-MM）。静的一覧の月別セクション用（空の月も含む）。
- `todayInTokyo(now: number): string` — Asia/Tokyoの暦日文字列。ブラウザー側スクリプトと単体テストで共通利用する。
- `calendarRange(events): { start: string; end: string } | null` — `validRange` 用。最初のイベント月初〜最後のイベント月の翌月初。イベント0件は `null`。
- `pickInitialDate(range, today): string` — 今日が範囲内なら今日、範囲外なら最も近い端の月。
- `eventsOnDate(events, date)` — 詳細領域用の日別抽出（期間内の全日で該当）。
- 日付は暦日文字列と `Date.UTC` だけで扱い、ローカルTZに依存しない。

### UI

- `src/components/EventCalendar.astro`（新規）: 見出し、凡例（色＋グリフ＋日本語ラベル）、カレンダーのマウント要素、月別の静的イベント一覧、詳細領域を出力する。イベントは `data-` 属性のJSONで渡す（実行されないデータなのでCSP影響なし）。
- クライアントスクリプト（`src/` 配下のTypeScript、Astroがバンドル）: 動的importで `@fullcalendar/core` / `daygrid` / `ja` を読み込み、`now`・`initialDate`・`validRange`・`eventContent`（グリフ付きタイトル。DOM APIで生成しHTMLとして解釈しない）・`eventClick`（詳細更新）・`dayCellDidMount`（日セルのクリック。`dateClick` は追加プラグイン `@fullcalendar/interaction` が必要なため使わず、標準DOMイベントで実現）を設定する。イベントの色は `classNames`（`fc-tag-event` / `fc-tag-appearance`）で付ける。読み込み失敗時は静的一覧のまま維持する。ページ全体の縦位置を不必要に変更しない。
- スタイル: 色・フォーカス・今日の強調はテーマトークンと `--fc-*` 変数で上書きし、FullCalendarの既定の青を残さない。日セルの高さ・ボタンのタップ領域は44px以上、375px幅でページ全体の横スクロールを出さない。`prefers-reduced-motion` を尊重する。
- 表示対象が0件の場合はカレンダーセクション自体を出力しない（既定）。
- `index.astro` で `loadRadarItems()` から `toCalendarEvents` を作り渡す。レーダー一覧・個別ページには追加しない。

## 計画

1. **SPEC更新**: §34の「月表示カレンダーは対象外」を削除し、トップのイベントカレンダー（掲載対象 event / appearance、色分け・グリフ・凡例、ブラウザー側のAsia/Tokyo日付取得、期間の扱い、表示範囲、日選択と詳細、フォールバック一覧、元URL維持、データ非変更）を現在形で追記する。§4 / §11 に、カレンダーはFullCalendarを遅延読み込みで利用する旨を追記する。§5 / §6 の最新情報パネル構成にカレンダーの位置を1文追記する。
2. **Red**: `tests/unit/calendar.test.ts` を先に追加し、失敗を確認する。
3. **Green（ロジック）**: `src/lib/calendar.ts` を実装して単体テストを成功させる。
4. **Dependency追加**: `npm i @fullcalendar/core@6.1.22 @fullcalendar/daygrid@6.1.22` → `npm audit` / `npm ls` / install script確認。
5. **Red → Green（UI）**: `tests/e2e/calendar.spec.ts` を追加し失敗を確認 → `EventCalendar.astro`・スクリプト・スタイルを実装 → 成功させる。実データの時間経過で不安定にならないよう、Playwrightの `page.clock` で日付を固定する。
6. **Refactor**: 開始日の互換ルールが [RadarMetadata.astro](../../src/components/RadarMetadata.astro) と重複するなら共通関数に寄せる（挙動は変えない）。
7. **検証**: 下記コマンドを実行し、375px / 1280px で目視確認する。Lighthouseで初期表示（LCP・TBT）がカレンダー追加で悪化しないこと、別チャンクが遅延読み込みされることを確認する。

## テスト計画

### Unit（`tests/unit/calendar.test.ts`）

- `event` または `appearance` を持つ項目が対象。`sale` のみ・`broadcast` のみ・`other` のみは対象外。
- `tags` / `colorTag`: `[event, appearance]` は両方・色は `appearance`、`event` + `campaign` は `event` のみ、`appearance` 単独は `appearance`。`summary` を保持する。
- `startDate: null` は対象外（`appearance` のみの場合も含む）。
- 旧データ（`tags` なし）: `category: event` / `appearance`、または `dateType: event` で開始日 = `date`。`dateType: published` / `updated` の旧データは対象外。
- 終了日の排他的変換: 単日 / 複数日 / `endDate: null` / 月跨ぎ / 年跨ぎ / うるう日。
- `calendarRange` / `pickInitialDate`: 今日が範囲内・範囲より前・範囲より後・イベント0件。
- `todayInTokyo`: UTC 14:59 / 15:00 前後の日付境界。
- `eventsOnDate`: 期間内の全日で該当し、同日複数件の順序が安定している。

### E2E（`tests/e2e/calendar.spec.ts`）

- 最新情報パネルにカレンダーが遅延描画され、固定日付の月が初期表示される。
- 前月 / 翌月 / 今月ボタンで月が切り替わり、ページ全体のリロードがなく、範囲外の月へ移動できない。
- `event` と `appearance` で別の色クラス・グリフになり、凡例が表示される。両タグの項目は `appearance` の色で両グリフを持つ。
- 固定した日付で「今日」が正しい日に強調される（UTC 15:00 前後でもずれない）。
- 日・イベントを選ぶと詳細領域に概要・元情報リンク・タグ・期間が表示される。リンクは `rel="noopener noreferrer"`。バーにタイトルが375px・1280pxの両方で表示される。月をまたぐイベントが前後の月で連続したバーになり、継続側が `fc-event-start` / `fc-event-end` で区別される。
- 375px幅でページ全体に横スクロールが出ない。ボタン・日セルのタップ領域が44px以上。
- JavaScript無効・ライブラリ読み込み失敗（ルートをブロック）でも静的イベント一覧が表示される。
- CSP違反のconsole errorが出ない（CSPは緩和しない）。
- 既存E2E（タブ切替・URLハッシュ・SNS遅延読み込み・横はみ出し）が回帰しない。
- 基本的なアクセシビリティ（見出し構造・ボタン名・フォーカス可視）。axe等は導入済みなら適用し、未導入なら新規導入しない。

## 検証コマンド

`npm run lint` / `npm run typecheck` / `npm run test:unit` / `npm run build` / `npx playwright test`（または `npm test`）。加えて、`npm audit`、`npm ls`、CSP・Security Headerの既存E2E、Lighthouse（性能）。未実行のコマンドはPASSと報告しない。

## リスク・判断事項

- **バンドルサイズ**: 約59KB gzipの追加。動的importと遅延読み込みで初期表示をブロックしない。SPEC §14「Performanceを理由に必要なRich UIを削らない」に沿う。Lighthouseで悪化が許容できなければ vanilla-calendar-pro への切替または自作へ撤退する。
- **FullCalendarのスタイル**: ライブラリ既定スタイルを実行時に注入する。現行CSP（`style-src 'unsafe-inline'`）内で動作する想定だが、E2EでCSP違反がないことを確認する。CSPは緩和しない。
- **FullCalendar 7系への移行**: 将来の課題。今回は6.1系に固定し、Dependabotのメジャー更新はレビューで判断する。
- **掲載タグの範囲**: `event` と `appearance` のみ。販売・放送日などを含めたい場合は別途仕様化する。タグ→色・グリフ・ラベルの対応は1箇所の定義にまとめ、拡張しやすくする。
- **両タグ項目の色**: `appearance` を優先する（`event` 併記が多く、「出演」を目立たせたい想定）。優先を逆にしたい場合は定義1箇所の変更で済む。
- **同一イベントの複数記事**: 別エントリとして並ぶ（例: 産業まつり3件）。記事の同一性判定が曖昧なため重複排除しない。
- **ビルド頻度**: 新しいイベントはレーダー更新（毎週木曜）後のビルドで反映される。「今日」の強調だけはブラウザー側でリアルタイムに更新される。
- **SPEC変更**: §34の対象外記述の撤回と新規仕様追加、§4 / §11 のDependency記述。SPECは現在形のみで更新する。

## 範囲外

- 外部カレンダー連携（iCal / Googleカレンダー登録・ICS配信）。
- 週表示・リスト表示の切替、年表示。FullCalendarの有償プラグイン。
- 公式RSS・手動情報・SNS由来のイベントの掲載（開催日フィールドがないため）。
- 収集プロンプト・スキーマ・Workflow・既存データの変更。
- バックエンド、DB。

## Status

実装・ローカル検証完了（2026-11-19）。ブランチ: `feat/radar-event-calendar`（origin/main から作成。コミット・Push・PR作成は未実施）。

## 実施結果（2026-11-19）

- **Red → Green**: `tests/unit/calendar.test.ts` を先に追加し、モジュール未実装で失敗することを確認してから `src/lib/calendar.ts` を実装（22件成功）。E2Eは `tests/e2e/calendar.spec.ts` を先に追加し、コンポーネント未実装で失敗することを確認してから実装。
- **追加要望の反映**: 実装中に「日をまたぐバーにタイトル・概要を表示、月またぎも連続表示、Googleカレンダーに近づける」要望を受け、モバイル点表示を撤回してタイトル付きバー（最大2行）へ変更し、概要（AI要約）を詳細に追加、`fixedWeekCount: true` で月またぎの継続を描画、SPEC §35 を更新。
- **検証コマンド（すべて実行・成功）**: `npm run lint` 成功 / `npm run typecheck` 0 errors・0 warnings・既存4 hints / `npm run test:unit` 16ファイル160件成功 / `npm run build` 7ページ成功 / `npx playwright test` 51件成功（うちカレンダー18件）/ `npm audit` 0 vulnerabilities。
- **バンドル**: FullCalendar（core 約51KB・daygrid 約7.6KB・ja 0.3KB gzip）は別チャンク。ページ側のスクリプトは約3.3KB gzip。クライアントのバンドルにNode依存（`node:dns` 等）が含まれないことを確認。そのため `radarTags` / `radarTagLabels` / `categories` を `src/lib/radar-tags.ts` に分離（`radar.ts` から再エクスポートして既存の参照は不変）。
- **目視確認**: 375px・1280px で固定日付（2026-11-19）のスクリーンショットを確認。月またぎイベント（10/30〜11/2）が10月表示で11/1〜2へ継続すること、タイトルが表示されること、実データのトップでの表示を確認。曜日行がスクロールで重なる問題を `stickyHeaderDates: false` で解消。
- **E2Eの工夫**: `page.clock.setFixedTime` で日付を固定。ライブラリ読み込みをブロックしても静的一覧が残ること、JS無効、CSP違反なし、375px横はみ出しなし、タップ領域44px以上、`<img onerror>` を含むタイトルがテキストとして表示されることを検証。
- **Security**: CSP・Workflow権限の変更なし。追加Dependencyは `@fullcalendar/core@6.1.22`、`@fullcalendar/daygrid@6.1.22`、推移的な `preact@10.12.1` のみ（install scriptなし、lockfileに3パッケージのみ追加、`npm audit` 0件）。イベントタイトルはDOM APIで挿入し `innerHTML` を使わない。元情報URLは `toAbsoluteHttpUrl` で検証したものだけ出力。
- **SPEC変更**: §34から「月表示カレンダーは対象外」を削除、§35「イベントカレンダー」を新設、§4 にFullCalendar利用、§34末尾の最新情報パネル構成にカレンダーの位置を追記。

## 未実施・既知の課題

- Lighthouse（性能）は未実行。計画ではカレンダー追加による初期表示への影響確認を予定していたが、遅延読み込みの別チャンクであることの確認までに留まる。
- 実機スマホ・Safariでの確認、実データでの本番表示確認は未実施。
- FullCalendar既定では日セル自体がキーボードフォーカス対象でない。イベントバーは `eventInteractive` でフォーカス可能、詳細一覧のリンクとボタンはキーボード操作可能。日セルのキーボード選択は将来の課題。
- 同一イベントの複数記事は別バーで並ぶ（重複排除していない）。
- Playwright実行にはブラウザー（`npx playwright install chromium`）が必要だった。
- **Approve / Mergeは未実施。**

## レビュー対応（2026-11-19）

- Copilotレビュー指摘: 隣月の日付に描かれたバー（例: 9月表示の10/6〜10の「観光フェア」）を選ぶと、表示月（9月）の一覧だけを有効にしていたため詳細が空になった。
- 対応: `monthForEvent`（`src/lib/calendar.ts`）を追加し、選択したイベントが表示月に重なる場合は表示月、重ならない隣月のバーの場合はイベントの開始月の一覧を有効にする。
- テスト: 単体テスト2件と、9月表示で10月のバーを選ぶとそのイベントの概要・元情報リンクが表示されるE2Eを先に追加して失敗（詳細0件）を確認してから修正。lint成功 / typecheck 0 errors / unit 162件 / build 7ページ / Playwright 52件成功。
