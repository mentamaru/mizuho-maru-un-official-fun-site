# ExecPlan 0003 — みずほまるレーダー

## 背景と目的

東京都瑞穂町の公式キャラクター「みずほまる」について、RSSに限らない現在性のある公開Web情報を定期調査し、元情報へ案内する静的サイト機能「みずほまるレーダー」を追加する。OpenAIは候補の探索・要約を担うがSource of Truthにはせず、実際にWeb Searchが返した情報源、厳格なデータ検証、限定されたGit差分を通過した場合だけ公開する。

今回のExecPlan作成では実装・SPEC更新・依存関係更新・API呼び出しを行わない。実装フェーズはSPECを先に現在仕様へ更新し、本計画と同一PRで完結する。

## スコープ

- OpenAI公式JavaScript/TypeScript SDK（`openai`）とResponses APIのWeb Searchを用いた定期レーダー収集。
- `workflow_dispatch` と定期実行、検証成功時のmain自動反映。
- Git管理する重点確認サイト設定、外部Markdownプロンプト、月別レーダーJSON、スキーマ・照合・重複排除。
- トップページのレーダー、既存「最新情報」への自然な統合、レーダー一覧ページと年月絞り込み。
- 単体・E2E・CI/安全性テスト。

## 非スコープ

- CMS、手動記事登録フォーム、手動入力をそのままレーダー記事にする経路。
- 独自の汎用crawler、多数のサイト別parser、SNSの無差別scraping。
- Backend、DB、認証、SSR、画像転載、OpenAI APIの通常unit testでの実呼び出し。
- 既存RSS/要約/手動投入経路の廃止またはレーダーへの置換。

## 現状調査結果

- 現在のスタックはAstro 7 / TypeScript / Tailwind CSS + daisyUI / Vitest / Playwright、Node `>=22.22.3`。`yaml` と `tsx` は既存依存であり、YAML読込の追加ライブラリは不要。`openai` は未導入で、実装時に唯一追加する本番依存とする。
- `data/sources.yml`、`data/social.yml`、`data/links.yml` はHuman-managed、`data/generated/items.json` と `summaries.json` はGenerated Data。既存レーダーはこの区分を守り、新設の `data/radar/*.json` のみをレーダー自動処理の書込先にする。
- `src/lib/site-data.ts` がJSON/YAMLをビルド時に読み、`src/pages/index.astro` は `LatestNews.astro` に `getLatestItems()` の3件を渡す。既存「最新情報」は `publishedAt`、なければ`collectedAt`で並べる。レーダーはこのモデルと混ぜず、専用型・専用loaderを追加する。
- 現在トップはタブ型の「最新情報 / 関連情報 / 関連SNS / リンク集」で、独立ページは `about`、`contact`、`operator` のみ。新しい一覧は `/radar/` を追加し、トップではレーダーを最新情報タブ内の独立sectionとして表示する。既存4タブは変更しない。
- RSS収集・要約・手動投入は各workflowで毎日cron/`workflow_dispatch`を持ち、`peter-evans/create-pull-request`によりPRを作る。CIはpush mainとPRでlint、typecheck、unit、build、Playwrightを実行する。VercelはGitHub連携で静的deployする。
- `ci.yml` はTakumi Guardを含む。`security.yml` はDependency ReviewとCodeQL。実装時のレーダーworkflowもactionのpin/供給網確認、最小権限、既存のNode/npm/Takumi Guard方針を踏襲する。
- git remoteは `mentamaru/mizuho-maru-un-official-fun-site`、作業branchは `feat/openapi-serach`。ローカルに未コミット差分はなかった。GitHub CLIは環境に存在せず、ネットワークDNSも利用不能だったため、branch protection/rulesetの実設定は今回確認不能だった。

## 決定済み事項を実装へ落とす方針

1. GitHub Actionsが、重点確認サイトとWeb全体の両方を対象にResponses API + Web Searchを一回実行する。重点確認サイトはallowlistではない。
2. 返答はStructured Outputsで候補配列とし、必ず「独立ニュース1件 = 配列要素1件」とする。1回で複数候補を受け入れる。
3. TypeScriptがモデル出力をZodで再検証し、実際のWeb Search response annotation/resourceに存在する正規化URLと `source.url`・各`researchSources[].url` を照合する。照合不能な候補は捨てる。
4. 新規候補だけを実行日のAsia/Tokyo時刻で決めた `discoveredAt` の月の `data/radar/YYYY-MM.json` に追加する。出来事の日付は保存先を決めない。
5. 新規0件はファイルにもGitにも触れず正常終了する。1件でも検証失敗ならfail-closedでpushしない。

## 提案アーキテクチャ

### ファイル配置と責務

```text
prompts/collect-latest.md                 # 調査方針のみ（テンプレート）
data/research-sources.yml                 # Human-managed: required/openWeb
data/radar/YYYY-MM.json                   # Generated: discoveredAt月ごとの配列
scripts/collect-radar.ts                  # 実行のcompositionと限定保存
scripts/verify-radar-changes.ts           # Git差分allowlist検査
src/lib/radar.ts                          # 型、Zod、loader、並び替え、fingerprint、重複
src/lib/radar-collector.ts                # prompt展開、OpenAI境界、response source抽出・照合
src/components/RadarNews.astro            # トップ用最新数件
src/components/RadarList.astro            # 一覧/年月filter用
src/pages/radar/index.astro               # レーダー一覧
.github/workflows/radar.yml               # 定期・手動収集と限定main更新
tests/unit/radar*.test.ts
tests/e2e/radar.spec.ts
```

`radar-collector.ts` のOpenAI呼出しは小さなinterface（例: `RadarSearchClient.collect(input)`）の実装に閉じ込め、unit testでは固定responseを返すfakeを注入する。SDK実装だけが`openai`をimportする。既存の`src/lib/url.ts`を共通URL正規化の基礎として再利用し、レーダー固有の制約（URL最大長、credentialなし、fragment除去等）は明示的なラッパーで追加する。

### OpenAI Responses API / Web Search

実装開始時にOpenAI公式ドキュメントで、当時有効なResponses API、Web Search tool、Structured Outputsの正確なパラメータ、responseのcitation/source annotation構造、対応モデルを確認して固定する。独自HTTP実装はしない。`OPENAI_API_KEY`だけを環境からSDKへ渡す。候補JSONはstrictなJSON schema/Zod schemaと接続し、テキストのURL主張だけを証拠にしない。

候補ごとに、Web Searchが実際に返したsource URL集合へ、正規化した主情報元URLが含まれ、かつ`researchSources`の全URLが同集合に含まれることを要求する。titleはresponse source metadataから取れればそれを優先して照合する。source集合が取れないresponse、URLが1件でも不正な候補、citation不一致の候補は掲載しない。モデルが0件を返すことは成功である。

### 重点確認サイト

新設 `data/research-sources.yml` は既存`yaml`でparseし、次を初期内容とする。

```yaml
required:
  - name: 瑞穂町公式サイト
    url: https://www.town.mizuho.tokyo.jp/
openWeb:
  enabled: true
```

Zodでunknown key拒否、重複URL拒否、非HTTP(S) URL拒否、空白名拒否を行う。`required`はプロンプト中へ列挙する「必ず重点確認する」対象であり、Open Web検索を禁止しない。将来はこのYAMLの編集だけで追加・削除できる。

### プロンプト管理

`prompts/collect-latest.md`へ下記のデフォルト全文をそのまま保持する。TypeScriptはファイルを読んで `{{START_DATE}}`、`{{END_DATE}}`、`{{REQUIRED_SOURCES}}`、および既掲載情報の専用プレースホルダーを安全に一回ずつ展開する。未置換・未知プレースホルダー、空の重点情報源はエラーにする。既掲載情報はid、title、date/dateType、正規化source URL、fingerprintだけをサイズ上限付きで渡し、AIの補助的重複回避に使う。最終判定はTypeScriptで行う。

```text
あなたは、東京都瑞穂町の公式キャラクター
「みずほまる」に関する最新情報の調査担当です。

指定された調査期間を中心に、Web上から
「みずほまる」に関する現在性のある新しい情報を調査してください。

調査期間：
{{START_DATE}} ～ {{END_DATE}}

以下のサイトは重点的に確認してください。

{{REQUIRED_SOURCES}}

ただし、検索対象をこれらのサイトだけに限定してはいけません。
Web全体も自由に検索し、企業、店舗、団体、イベントサイト、
メディア、その他の公開Webページから関連情報を探してください。

特に以下の情報を探してください。

- 新しいグッズ・商品
- 販売開始・販売情報
- イベント
- みずほまるの出演
- コラボレーション
- メディア掲載
- 放送
- キャンペーン
- 募集
- その他、みずほまるに関する新しい話題

ページの公開日だけを基準に機械的に除外しないでください。

以前に公開されたページであっても、
調査期間付近にイベント開催、販売開始、出演、放送、募集、
更新などの新しい動きがある場合は候補にしてください。

一方、以前から存在している情報が単に検索結果へ
再登場しただけの場合は、新しい情報として扱わないでください。

各候補について、その情報を直接確認できる元情報を確認してください。

検索結果の説明文だけを根拠にせず、
可能な限り元ページの内容を確認してください。

日付、場所、価格、イベント内容、販売情報など、
情報源に書かれていない事実を推測で補完しないでください。

同じ出来事について複数の情報源がある場合は、
可能な限り最も直接的・一次情報に近い情報源を
主な情報元として選んでください。

「瑞穂丸」など、同名・類似名の別の人物、船舶、店舗、
商品等を「みずほまる」と誤認しないでください。

対象は東京都瑞穂町の公式キャラクター
「みずほまる」です。

既に掲載済みとして渡された情報と同じ内容を、
新情報として再度追加しないでください。

該当する新情報が見つからない場合は、
無理に情報を生成せず、空の結果を返してください。

重要：
1つの独立したニュース・出来事につき、
必ず1つの掲載候補として出力してください。

1回の調査で複数のニュースを発見した場合は、
それぞれを別々の候補として出力してください。

複数の独立した出来事を
「今週のみずほまる情報まとめ」のような
1件のニュースへ統合しないでください。

同じWebページに複数の独立した新しい出来事が掲載されている場合も、
内容として別ニュースであれば別々の候補として扱ってください。

逆に、同じ1つの出来事について複数の情報源が存在する場合は、
複数ニュースとして重複させず1件として扱ってください。

各情報について、短く読みやすいタイトルと、
2～3文程度の簡潔な日本語要約を作成してください。

要約は親しみやすく読みやすい文章にしてください。
ただし、過度にキャラクター風・広告風の表現にはしないでください。

正確な詳細については利用者が元情報を確認できることを前提とし、
元情報へのリンクを必ず保持できる情報だけを掲載候補にしてください。
```

上記は指定された初期デフォルト本文として改変しない。Structured Outputsとの接続に必要な技術的追記としてのみ、テンプレート末尾に「既に掲載済みの識別情報は以下です。内容が同じ候補を返さないでください。`{{EXISTING_ITEMS}}`」を追加する。これは本文中の「既に掲載済みとして渡された情報」の実データを与えるためであり、調査方針は変更しない。

## データモデル、Schema、重複処理

各月ファイルはJSON配列で、1要素を1独立ニュースとする。`date`はISOの日付（`YYYY-MM-DD`）または日付が元情報で確認できない場合の`null`、`dateType`は`other`とする。これにより推測日を保存しない。`discoveredAt`は実行時のISO 8601 offset付きAsia/Tokyo timestampで必須とする。

初期enumは `category: event | appearance | goods | sale | collaboration | media | broadcast | campaign | recruitment | other`、`dateType: published | updated | event | sale | broadcast | other` とする。`appearance`は出演、`goods`は商品そのもの、`sale`は販売開始・販売情報を表示上も区別するための追加値である。分類不能なものは`other`に落とす。将来のカテゴリfilter追加に安全な識別子である。

```json
[
  {
    "id": "radar-7f665d18c43b0e16",
    "title": "みずほまるが○○イベントに登場",
    "summary": "みずほまるが○○イベントに登場します。詳しい開催内容は公式案内をご確認ください。",
    "category": "event",
    "date": "2026-10-20",
    "dateType": "event",
    "discoveredAt": "2026-09-11T06:03:12+09:00",
    "source": { "name": "○○イベント公式", "url": "https://example.jp/event" },
    "researchSources": [
      { "title": "○○イベントのお知らせ", "url": "https://example.jp/event" },
      { "title": "瑞穂町イベント情報", "url": "https://example.jp/mizuho" }
    ]
  }
]
```

Zodの候補・永続化schemaはstrict objectとし、必須値、enum、trim後の非空、title/summary/source名/sourceタイトルの文字数上限、summaryの2〜3文を機械的に強制しない代わりの妥当な最小/最大長、URLのhttp(s)・最大長、日付形式と実在日、offset付き日時、`researchSources`の1件以上かつ上限、重複research URL、未知fieldを検査する。JSONファイルの読込時にも同じ永続schemaを完全検証する。IDはcrypto SHA-256の先頭hexを使い、fingerprintから決定的に生成する。

fingerprintはURL単独にせず、`normalize(source.url)`、`date ?? ''`、`dateType`、`category`、Unicode正規化・小文字化・連続空白圧縮した`title`をNUL区切りで結合しSHA-256化する。既存全月のfingerprintと今回batch内のfingerprintの両方で重複を落とす。同一source URLでも日付、種別または内容が異なる独立ニュースは保持できる。一方、同じ出来事の表記ゆれは、同じ正規化タイトルを持つ安定キーとして重複除去する。衝突/曖昧さは掲載しない。

## 保存、GitHub Actions、自動main反映

`scripts/collect-radar.ts` は次の順に動く。

```text
Asia/Tokyoの実行時刻と調査期間を決定
→ settings/prompt/既存全月データを検証して読む
→ OpenAI Responses API + Web Search
→ Structured Output parse
→ response実sourceとのURL照合
→ URL正規化・fingerprint・既存/今回batch重複排除
→ 0件なら終了（書込なし）
→ discoveredAt月の1ファイルだけを読み/作成・追記
→ 月ファイル全体をschema再検証
→ 保存
```

`radar.yml` は毎週木曜日のJST 13:17頃（`17 4 * * 4`）のscheduleと`workflow_dispatch`を持つ。GitHub Actionsのscheduleは遅延し得るため、実時間はworkflow実行時に採番する。手動実行も同じ収集処理のみで、入力欄を持たない。

workflowはcheckout、Takumi Guard、Node 22、`npm ci`、`npm run collect:radar`、差分なしなら後続commitをskip、差分ありなら許可ファイル検査、lint、typecheck、unit、build、Playwrightを順に実行する。成功後に限定したbot identityで `data/radar/YYYY-MM.json` のみをコミットし、`git push origin HEAD:main` で直接mainへ反映する。コミット直前にも `verify-radar-changes` を再実行し、想定月以外、未追跡ファイル、削除、renameを拒否する。Actionsの実行中にgitが意図せず変更したlockfile等も失敗にする。

permissionsはjob/workflowで `contents: write`（pushに必要）、Takumi Guard利用のため既存と同じ`id-token: write`だけにし、`pull-requests: write`は付与しない。Secretは`OPENAI_API_KEY`のみ。PATは導入しない。`GITHUB_TOKEN`を利用する。workflowはconcurrency groupを設定し、同時実行による同月JSON競合をcancelではなくqueue（`cancel-in-progress: false`）する。

mainへの直接pushには、GitHub branch protection/rulesetが`github-actions[bot]`のdirect pushを許可するか、適切なbypass権限を持つ必要がある。実装開始前にリポジトリ管理者がRulesets/branch protectionを確認し、上記最小権限の`GITHUB_TOKEN`での限定bot pushを許可する設定にする。これが許可されない設定なら、決定済みの「人間のPR承認なしでmainへ自動反映」と両立する別のGitHub App/bypass設定を管理者が選ぶ必要がある。保護を無効化して回避しない。

## 変更可能ファイル制限とfail-closed

許可パスは実行日から厳密に導いた単一の `data/radar/YYYY-MM.json` のみ。新月はその1ファイルの追加を許容し、既存月はその1ファイルの変更を許容する。workflowの差分有無判定は`git status --porcelain`でtracked・untrackedの両方を検出し、その後に`git diff --name-status` と`git ls-files --others --exclude-standard`をbase checkoutと比較する。追加・変更・削除・renameのいずれもこの厳密パス以外なら失敗する。`src/**`、`.github/**`、`scripts/**`、`prompts/**`、SPEC、AGENTS、package/lock、`data/research-sources.yml`、既存Generated Dataは通常レーダー実行で変更不能である。

API/Web Search/Structured Outputs/schema/source照合/URL/fingerprint/保存後schema/許可ファイル/テスト/typecheck/buildのどれかが失敗・不明なら、pushしない。破損しかけた対象ファイルはcommitせずjobをfailにする。0件は正常・空commitなし。「今週は情報なし」要素も作らない。

## UI

### トップページ

`getLatestRadarItems(3)`を `discoveredAt DESC`で明示的にsortして、既存「最新情報」タブ内に「みずほまるレーダー」sectionとしてカード3件と`/radar/`への導線を出す。カードは「AIがWeb上を定期的に調査し、みずほまるに関する新しい話題を紹介しています。内容はAIによる要約です。詳しくは元情報をご確認ください。」と同趣旨の短い注記、発見日、出来事日（`date`がある場合はdateTypeに応じて開催日/発売日/放送日等）、category、title、plain-text summary、source linkを示す。

既存「最新情報」は3枠を、既存item最大2件 + レーダー最大1件の混在へ変更する。両データを表示用の共通unionへ変換し、既存は従来の並べ替え、レーダーは`discoveredAt`、最終表示は利用可能な表示日時のDESCで整列する。レーダー由来には「レーダー」badgeを付け、同一`source.url`を正規化して既存`originalUrl`と照合し、同じURLの項目は既存itemを優先して1回だけ表示する。これにより専用sectionでの表示は意図的に維持しつつ、同じカードが「最新情報」内に重複するのを避ける。0件なら既存最新情報の3件を保ち、レーダーsectionは「現在掲載できる新着はありません」とは表示せずsection自体を非表示にする。

### 一覧と年月絞り込み

`/radar/`は全月JSONを検証して読み、常に`discoveredAt DESC`で表示する。年月候補は`discoveredAt`のAsia/Tokyo年月から生成する。初期値「すべて」と年月選択（既存Astro +標準Web APIのclient-side filter、JavaScript無効時は全件表示）を提供し、選択年月に一致する要素だけを即時表示する。category属性を各カード/DOMに保持し、将来のカテゴリfilterを足せるが初期UIには追加しない。各カードは発見日、出来事日、main source、researchSources（重複なし・元ページtitle付きリンク）を安全な外部リンクとして表示する。

AI textはAstroの通常テキスト挿入のみを使い、`set:html`を用いない。リンクは検証済みhttp(s) URLだけ、`target="_blank"`時は`rel="noreferrer"`を維持する。

## SPEC変更予定（実装フェーズ）

今回SPECは変更しない。実装フェーズ開始時に、現在形の仕様として以下を更新する。

- Purpose/Information Pipelineに「みずほまるレーダー」を別経路として追加し、OpenAI Responses API + Web Search、デフォルト調査方針、重点確認サイトを規定する。既存15.2の「AI自身に自由なWeb Searchをさせない」はRSS要約経路に限定した記述へ正確にし、レーダー経路だけの明示的例外を現在仕様として記載する。
- Data Ownershipに`data/research-sources.yml`をHuman-managed、`data/radar/YYYY-MM.json`をGeneratedとして追加する。
- 1ニュース1要素、月別JSON、完全なデータモデル、source/researchSources、`discoveredAt`、`discoveredAt DESC`、年月filter、トップの専用sectionと既存最新情報への混在規則を追加する。
- 自動main反映、単一月ファイルだけの書込制限、fail-closed、0件正常終了、`OPENAI_API_KEY`最小secretとActions最小権限を追加する。
- SNS無差別scraping禁止を保持し、レーダーがWeb Searchを使うことはSNS crawler採用を意味しないと明記する。

## テスト計画

Red → Green → Refactorで、API境界はfake responseを使う。

- prompt templateの全変数展開、未置換/未知変数拒否、重点サイトYAMLのstrict validation。
- Structured Output候補の必須値・enum・URL・日付・日時・長さ・配列件数・空文字・unknown field拒否。
- 1ニュース1要素、1 responseから複数保存、同一source URLで別イベントを保持。
- OpenAI response annotationからのsource抽出、主source/researchSources照合、不正URL/未確認URLの候補除外。
- URL正規化、fingerprintの安定性、既存全月/同一batch重複排除、URLのみでは重複にしないこと。
- discoveredAtのAsia/Tokyo月選択、イベント日で保存月が変わらないこと、月ファイルの読込/作成/全体schema検証。
- `discoveredAt DESC`、0件でwriteなし、許可月以外の変更・untracked/rename/delete拒否。
- AI生成文字列がHTMLとして実行されず安全に表示されること。
- トップのレーダー3件・注記・一覧導線、既存最新情報との2+1統合・source URL重複の抑止。
- `/radar/`一覧、年月filter、source/researchSources link、375px/desktopのoverflowとキーボード操作。
- CIと同じ`lint`、`typecheck`、unit、build、Playwright。実装PRではsecurity workflow/Dependency Review/CodeQLも確認し、外部OpenAIは通常testで呼ばない。

## 実装手順

1. 管理者がmain protection/rulesetとVercelのmain deployment連携を確認し、限定bot direct pushの前提を整える。OpenAI公式docsでAPI仕様とモデルを確認する。
2. SPECを現在仕様へ更新し、`openai`を公式npm registryから追加してlockfileを更新する。Dependency Review対象にする。
3. prompt/YAMLとRadarの型・Zod schema・URL/fingerprint・load/save・差分検査を、失敗テストから実装する。
4. SDK adapterとfakeを実装し、source annotation照合を含む`collect-radar.ts`を実装する。
5. 月別data loader、トップ専用section/最新情報統合、`/radar/`と年月filterを実装し、E2Eを追加する。
6. `radar.yml`を追加し、限定file検査、concurrency、0 diff skip、最小権限のmain pushを実装する。branch protection下のtest branchまたはGitHub管理画面で実行経路を検証する。
7. 全検証とGit diff監査を実行し、SPEC・実装・workflow・表示の整合を確認する。

## 検証方法と完了条件

実装後に実行する最低限のコマンドは `npm run lint`、`npm run typecheck`、`npm run test:unit`、`npm run build`、`npm run test:e2e`。レーダーworkflowのdry fixture/fakeで0件、新規複数件、未許可差分、citation不一致を確認し、実APIを呼ぶ検証はSecretを持つ手動workflowで必要最小限に一度だけ行う。Vercel Previewでトップ/一覧/外部link/CSPを確認する。

完了は、決定済みフローを満たし、0件が非変更で終了し、1回の検索の複数独立ニュースが実行月ファイルへ安全に追加され、source照合不能・検証不能・許可以外差分がmainへ到達せず、表示が`discoveredAt DESC`と年月filterを満たす状態とする。

## リスクと対策

- モデルの幻覚・citation混同: strict schema、実response source集合照合、fail-closed、元情報リンクで軽減する。
- API仕様・モデル変更: 実装時の公式docs確認、SDK adapter分離、mock testで軽減する。
- Web Searchが古い結果を返す: promptの現在性規則、既掲載fingerprint、TypeScript重複除去で軽減する。
- 同時workflow競合: concurrency queueと月単位許可パスで軽減する。
- schedule遅延/失敗: 実行時timestamp、`workflow_dispatch`の同一処理、0件正常扱いで軽減する。
- main保護がbot pushを拒否: 実装前の管理者設定確認を必須とし、保護解除やPAT回避をしない。

## 本当に未決定の事項

1. GitHubの現在のbranch protection/rulesetが、最小権限`GITHUB_TOKEN`の`github-actions[bot]`による限定direct pushを許可するか。今回の環境ではGitHub CLI未導入かつDNS利用不能で確認できなかったため、リポジトリ管理者による確認・必要なbypass設定が必要である。
2. 上記が許可されない場合に、組織/リポジトリ管理者がどのGitHubネイティブなbypass権限・App運用を承認するか。これは「PR承認なしの自動main反映」を保護設定と両立させるための管理判断である。

## 実装後の決定記録

- 利用者の指示により、トップのmain navigationには「最新情報」の直後に「みずほまるレーダー」タブを置く。レーダーが0件でも、このタブでは機能説明と空状態を必ず表示する。
