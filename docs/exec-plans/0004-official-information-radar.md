# ExecPlan 0004 — 公式情報

## 背景と目的

「関連情報」と既存の公式リンク集を、瑞穂町の公式情報を見つけやすい一つの領域へ再編する。瑞穂町文化情報RSSから、タイトルに「みずほまる」を含む記事またはcategoryが「みずほまる情報」の記事だけを毎週取得し、AIを介さず月別JSONへ追加する。

## スコープ

- トップの「公式情報」タブ（最新3件、一覧、公式リンク集）と `/official/` 一覧ページ。
- `https://www.town.mizuho.tokyo.jp/bunka/news.xml` のみを使うRSS収集、タイトル/categoryによる厳密な対象判定、URL単位の重複排除。RSS以外はリンク集だけで案内する。
- 月別 `data/official/YYYY-MM.json`、毎週木曜日JSTのGitHub Actions、レーダーと同じ限定差分検証・検証後main更新。
- タブ名称、SPEC、単体/E2Eテストの更新。

## 非スコープ

- AI要約、OpenAI API、RSS以外のスクレイピング、既存レーダーの変更。
- CMS、DB、認証、SSR、リンク先本文の転載。

## ActionsでのRSS取得・照合手順

workflowは毎週木曜日のJST 13:17頃（UTC cron `17 4 * * 4`）および `workflow_dispatch` で起動する。取得元は `https://www.town.mizuho.tokyo.jp/bunka/news.xml` のみであり、OpenAI API、AI要約、Web検索、RSS以外のHTTP取得は行わない。

1. checkout、Takumi Guard、Node 22、`npm ci` を実行する。
2. `collect:official` はRSSを一度だけ取得する。HTTP成功以外、XML解析不能、JSON読込不能は処理を継続せず失敗にする。既存データを空で上書きしない。
3. XMLのRSS itemごとにtitle、link、pubDate（なければisoDate）、description、categoryを抽出する。HTMLを含むtitle/category/descriptionは表示用のプレーンテキストへ正規化し、HTTP(S)ではないlinkは破棄する。
4. titleに完全な文字列「みずほまる」を含む、またはcategoryのいずれかが前後空白を除いて完全に「みずほまる情報」であるitemだけを候補にする。descriptionだけの一致、類義語、AIによる推測は対象にしない。
5. 候補のURLを既存の共通URL正規化処理で絶対HTTP(S) URLにし、そのURLのSHA-256先頭16文字から安定した `official-...` IDを作る。保存するcategoryはRSSの先頭category、categoryがない場合は `みずほまる情報` とする。
6. `data/official/YYYY-MM.json` を含む全ての既存月別JSONを読み、正規化済みOriginal URLをキーに候補と照合する。同じURLが過去月・実行月・同一RSS内に存在すれば追加しない。titleや公開日の変更だけで別記事を作らず、元URLが異なる記事のみを新規とする。
7. 新規候補が0件なら書込みをせず成功終了する。1件以上なら実行時刻のAsia/Tokyo年月の `data/official/YYYY-MM.json` だけを作成または追記する。公開日では保存先月を決めない。
8. workflowはGitのtracked/untracked差分を検査し、実行月の単一JSON以外の変更があれば失敗する。その後lint、typecheck、unit test、build、Playwrightを実行する。
9. すべて成功した場合だけ同じ差分検査を再実行し、GitHub Actions botで該当JSONのみをcommitしてmainへpushする。新規0件、取得失敗、検証失敗ではcommit/pushを行わない。

既存の収集済みデータは本変更で削除する。以後の既存照合対象は `data/official/` のJSONだけとし、`data/sources.yml`、`data/links.yml`、SNS設定、レーダーデータは照合対象にも自動書込み対象にも含めない。

## 実施手順

1. SPECを現在の公式情報仕様へ更新し、RSS項目からcategoryを安全に取得できる単体テストを追加する。
2. 既存の収集済みデータを削除する。公式情報の型、loader、月別保存、RSS対象判定、収集スクリプト、限定差分検証を実装する。新しいGenerated Data領域だけを自動処理対象にする。
3. 公式情報表示コンポーネントと一覧ページを追加し、既存リンク集を公式情報タブへ統合する。
4. 毎週木曜日に実行するworkflowを追加する。permissions・Takumi Guard・検証・main更新はレーダーworkflowと同等にするが、Secretは使用しない。
5. lint、typecheck、unit test、build、Playwright、既存security checkを実行し、RSS取得自体はネットワーク依存のためCI workflowへ委ねる。

## 完了条件

- 公式情報タブで最新3件、一覧リンク、公式リンク集をこの順に表示する。
- RSSの対象条件以外を保存せず、既存URLを重複追加しない。
- 新規0件ではファイル変更・commitを行わず、新規時も実行月の単一JSON以外をActionsが変更できない。
- 必須のローカル検証が成功する。
