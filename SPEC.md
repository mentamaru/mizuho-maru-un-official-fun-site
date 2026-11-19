# 非公式みずほまる情報ポータル — Specification

## 1. この文書について

この `SPEC.md` は、本サイトの**現在有効な仕様を表すLiving Specification**である。

初期仕様を保存する歴史資料ではない。

現在の実装がどうあるべきかを示すSource of Truthとして扱う。

### 仕様変更

仕様変更を行う場合は、既存記述を新しい現在仕様へ更新する。

廃止された仕様を「旧仕様」「Legacy」「Deprecated」等としてSPEC内へ蓄積しない。

過去の仕様および変更理由は、

* Git History
* Pull Request
* ExecPlan

で確認する。

実装がSPECと異なるという理由だけでSPECを実装へ合わせてはならない。

実装上のBugなら実装をSPECへ合わせる。

非自明な仕様変更では原則として、

1. 現在のSPECを確認
2. SPECを新しい現在仕様へ更新
3. 新しいExecPlanを作成
4. Testを作成または更新
5. 実装
6. 実行検証
7. SPECと実装の整合確認
8. 同一PRでMerge

の順序で進める。

軽微なCSS調整、Copy修正、内部Refactoring等、SPECで規定されるBehaviorを変更しない作業ではSPEC更新を必須としない。

---

## 2. Purpose

東京都瑞穂町公式キャラクター「みずほまる」に関する公開情報を整理し、元情報を発見しやすくする非公式情報ポータルとする。

個人運営・非営利を前提とする。

瑞穂町公式サイト、企業サイト、店舗サイト、SNS等の代替を目的としない。

情報の全文転載ではなく、利用者をOriginal Sourceへ案内することを重視する。

---

## 3. Basic Principles

* Static First
* Mobile First
* Responsive Design
* 現代的でリッチなWeb UI
* Progressive Enhancement
* 不必要に重くしない
* 日本語の可読性を重視する
* Source Transparency
* AIをSource of Truthにしない
* SNSを無差別収集しない
* 公式/非公式を明確にする
* 不要なBackendを作らない
* 不要なDatabaseを作らない
* 不要なAuthenticationを作らない
* 不要なSSRを導入しない
* 過剰設計しない
* 将来的なInternationalizationを妨げない

極端な軽量HTMLサイトを目標とはしない。

現代的なSmartphoneおよびPC Browserで快適に利用でき、視覚的にも十分整った情報ポータルを目指す。

---

## 4. Technology

基本Technology Stack:

* Astro
* TypeScript
* Tailwind CSS
* daisyUI
* Vitest
* Playwright
* GitHub
* GitHub Actions
* Vercel
* Vercel Web Analytics

AstroによるStatic Generationを基本とする。

Vercel Web Analyticsを利用し、VercelへのProduction Deploy後にVisitor数とPage Viewを計測する。
計測Componentは共通Layoutに1回だけ配置する。

React / Vue / Svelte等のClient Frameworkを禁止するものではない。

ただし、Astroと標準Web APIで十分実現可能な機能のためだけに追加しない。

明確な必要性が発生した場合のみ検討する。

---

## 5. Main UI

サイトアクセス時は「最新情報」を初期表示する。

Main Navigationは以下の5領域とする。

1. 最新情報
2. みずほまるレーダー
3. 公式情報
4. 関連SNS
5. マップ

対応Browserではこれらをタブ形式のUIで切り替える。

タブ切り替えは高速かつ自然なものとし、ページ全体のReloadを毎回必要とする構成に限定しない。

ヘッダーはホームへのリンクを持つサイト名とナビゲーションで構成する。サイト名は可読性を保って自然に折り返し、スマートフォンで文字サイズと余白を抑える。装飾アイコン、非公式 / 非営利バッジ、説明文はヘッダーに表示しない。SEO用descriptionとフッターの非公式説明は維持する。

Main Navigationは枠・影のない1段の横スクロールタブとする。Mobileでは次の項目が一部見える表示で横方向の続きを示し、PCでは幅に応じて全項目を自然に表示する。横スクロールはナビゲーション内に限定する。各項目のタップ領域は44px以上とし、選択中はアクセント色と下線で示す。

左右矢印キーの循環選択・フォーカス移動とARIA属性を維持し、選択タブをナビゲーション内の見える位置へ移動する。その際にページの縦位置を不必要に変更しない。URLハッシュによる直接表示、補助ページから各タブへのリンク、SNS遅延読み込みを維持する。

---

## 6. 最新情報

アクセス時に最初に表示される主要Content。

以下を混在して表示可能とする。

* 公式RSS情報
* みずほまるレーダー情報
* 手動投入されたSNS/その他情報

初期表示は最新3件程度を想定する。

各Itemは最低限、

* Title
* Date
* Content / Source Type
* Short Summary
* Source
* Original URL

を持つ。

AI要約は原則2〜3文程度。

親しみやすく簡潔にするが、過度にキャラクター調にはしない。

最新情報はSNS等のExternal Serviceの読み込み完了を待たず表示できること。

公式・レーダー・手動情報の保存済み `thumbnailUrl` が安全なHTTPS URLの場合のみ、既存カードと同じ比率のOGPサムネイルを `loading="lazy"` で表示する。未設定・不正URL・画像読み込み失敗では、同一オリジンの仮画像 `/images/news-placeholder.svg`（装飾画像のため `alt=""`）を同じ比率で表示し、本文と元情報リンクを維持する。仮画像は本Repositoryで作成した中立的なSVG（Soft Background・Soft Pink・Light Purple・Leaf Greenのみ使用）であり、みずほまるキャラクター画像や第三者画像を含まず、外部通信を発生させない。静的ビルド時の保存URL検証ではサーバー側のDNS照会・HTTP通信・OGP再取得を行わず、第三者画像をRepositoryへ保存しない。遅延読み込みが始まると、利用者のブラウザーは外部画像配信元へ必要に応じてDNS照会と画像リクエストを行い、リダイレクトを追跡する場合がある。画像リクエストには `referrerpolicy="no-referrer"` を付けるが、外部配信元への通信自体をなくすものではない。公式・レーダーの新規収集は既存のSSRF対策済みOGP処理を利用し、手動情報では保存済み任意URLのみを扱う。手動情報はGenerated Dataの `publishMethod: manual` の記事と保存済み要約を集約し、公式・レーダーとURL重複排除・日付降順・最大3件の表示を行う。

---

## 7. 公式情報

瑞穂町の公式RSSから取得したみずほまる情報と、恒久的に参照したい公式リンクを掲載する領域。

タブ内は以下の順に表示する。

1. 最新3件の公式情報
2. 公式情報一覧へのリンク
3. 公式リンク集

公式情報一覧では年月絞り込みを提供する。記事全文を転載せず、Title、Published Date、Category、必要最小限のMetadata、Original URLを表示する。

---

## 8. 関連SNS

みずほまるに関連する公開SNS Account / Postを紹介する。

初期対象Platform:

* Instagram
* X

Instagram / XはTop-levelで別画面にせず、関連SNS内でFilter / Switch等によって切り替える。

各Accountの `description` は、何のAccountかを1文で伝える軽い説明とする。「みずほまるごとマルシェ」のInstagram / Xは「マルシェイベント「みずほまるごとマルシェ」の{Platform}アカウントです。」、「えきにしふりま」のInstagramは「箱根ケ崎駅西公有地で定期的に開催されているフリーマーケット「えきにしふりま」のInstagramアカウントです。」とする。

対象には、

* 企業
* 店舗
* Creator
* その他関連公開Account

を含められる。

これらは瑞穂町公式Accountとは限らない。

画面上に以下と同趣旨の説明を表示する。

「みずほまるに関連する企業・店舗・クリエイターなどの公開SNSを紹介しています。瑞穂町公式アカウントとは限りません。」

---

## 9. 公式リンク集

公式情報タブ内に、恒久的に参照したい瑞穂町の公式Source Directory / Bookmarkを掲載する。

「公式リンク集」の見出しの下に控えめなカテゴリ見出しと全幅のリストを置く。カテゴリや個々のリンクを装飾的な枠・角丸・影で囲まず、項目間だけ薄い区切り線を表示する。PCでは左にリンク名、右に説明文と外部リンクアイコンを配置し、Mobileではリンク名の下に説明文を配置する。

各項目全体を単一のリンクとし、ホバー・キーボードフォーカス時に淡い背景などで対象を示す。外部リンクは別タブで開き、安全なrel属性を付与する。装飾アイコンは読み上げ対象から除外する。Human-managed Dataの名称・URL・説明・掲載順を維持する。

---

## 10. マップ

「マップ」タブでは、みずほまるに関連する地図を紹介する。

タブ内には「みずほまる関連の地図です。主に東京都瑞穂町を中心に紹介しています。」と同趣旨の説明を表示する。

以下のGoogle マイマップを、それぞれ見出しとともに埋め込み表示する。

* みずほまるグッズマップ
* みずほまるイベントマップ

地図は画面幅に合わせて表示し、スマートフォンで横方向にはみ出さないようにする。外部地図の読み込みは初期表示を不必要に妨げないよう遅延読み込みを利用する。

---

## 11. Rich UI / JavaScript

JavaScriptの利用を過度に制限しない。

以下のようなユーザー体験向上のために適切に利用してよい。

* Tab Switching
* Filtering
* Search
* Expand / Collapse
* More Loading
* SNS Embed Lazy Loading
* Language Switching
* その他Interactive UI

目標はJavaScriptを使わないことではない。

必要なUI/UXを提供しつつ、不必要なJavaScriptやDependencyを増やさないことを目標とする。

JavaScript無効環境ですべてのInteractive Functionを再現することはv1要件としない。

---

## 12. Visual Design

基本デザインは**White Base**とする。

Content AreaやCardのBackgroundは原則として白または非常に淡いNeutral Colorを使用し、情報の読みやすさを最優先する。

「みずほまる」のキャラクターカラーは、画面全体を大きく塗るためではなく、Site Identityを示すBrand / Accent Colorとして使用する。

主な使用箇所:

* Link
* Active Tab
* Button
* Badge
* Heading Accent
* Selected State
* Border Accent
* Hover / Focus
* Footer

大面積の紫・Pink Backgroundを多用しない。

全体として、

**白を基調としたシンプルで読みやすい情報サイトに、みずほまるの色をポイントとして使用する**

Designとする。

過度に子供向け・玩具的・派手なDesignにはしない。

一方で、極端に装飾を排除したPlain HTML Siteにもせず、Spacing、Card、Typography、State、Navigation等によって現代的なWeb UIを構成する。

### 記事の表示

最新情報・みずほまるレーダー・公式情報の記事は、トップの各タブと一覧ページで装飾的な外枠・角丸・影を使用しない。タイトル・説明（一覧ページでは年月フィルターを含む）と記事群の間に薄い区切り線と余白を置く。記事の区別にも余白を用い、縦並びでは表示中の記事間に薄い区切り線を置く。トップはMobileで1列、PCで3列とする。記事内部のカード用余白を設けず、本文の横幅を確保する。

元情報への導線はアクセント色と下線付きのリンクで示し、44px以上の操作領域と明確なキーボードフォーカスを保つ。画像の遅延読み込み、メタデータ、要約、元情報URL、年月絞り込み、調査情報源の開閉は維持する。一覧の画像（仮画像を含む）はPCで幅を抑えて本文の横に配置する。

### Color Palette

みずほまる公式Artworkを参考にしたWeb UI用の初期近似色として以下を使用する。

これらは**瑞穂町が指定した公式Color Codeではない**。

* Mizuho Purple: `#B65AA5`
* Light Purple: `#D59AC9`
* Cyclamen Pink: `#E8A9C7`
* Soft Pink: `#F6DCE9`
* Leaf Green: `#16823B`
* Base White: `#FFFFFF`
* Soft Background: `#FFF9FC`
* Base Content: `#33252F`

実装時にはContrast / Accessibilityを確認し、必要に応じて近似色を微調整してよい。

公式な色指定が確認できた場合は、近似色より公式指定を優先する。

### Color Usage

Primary Purple / Pinkは主に、

* Link
* Active Tab
* Button
* Small Accent
* Badge
* Border
* Focus / Selected State

等に使用する。

GreenはPrimaryではなく、必要に応じたAccentとして控えめに使用する。

FooterではBrand Colorを比較的大きな面積で使用してよい。

Footer上のText / Linkは十分なContrastを確保する。

Status Colorである、

* info
* success
* warning
* error

については、Brand Colorへの統一より意味の識別性とAccessibilityを優先する。

daisyUIのTheme Tokenを利用し、Component単位で大量のColorをHardcodeしない。

---

## 13. Typography

日本語の可読性を最優先する。

本文は、長時間読んでも疲れにくく、字形を判別しやすいTypographyとする。

v1の本文Font Stackは以下を基本とする。

```css
font-family:
  "UD Digi Kyokasho N-R",
  "UD Digi Kyokasho NP-R",
  "Hiragino Kaku Gothic ProN",
  "Hiragino Sans",
  "Yu Gothic",
  "YuGothic",
  "Noto Sans JP",
  sans-serif;
```

利用端末にUDデジタル教科書体が存在する場合は優先して使用する。

存在しない場合は、OSで利用可能な読みやすい日本語Fontへ自然にFallbackする。

想定Fallbackには、

* Hiragino系
* Yu Gothic系
* Noto Sans JP
* Generic sans-serif

を含む。

特定Fontへ統一するためだけに、重量の大きな日本語Web Fontを全利用者へDownloadさせない。

v1ではGoogle Fonts等のExternal Web Fontを原則使用しない。

本文、最新情報、関連情報等の文章を読む領域では同じFont Familyを基本とする。

Heading / Navigation / Tab / Buttonについても原則として同じFont Familyを使用する。

Visual Hierarchyは主に、

* Font Size
* Font Weight
* Spacing
* Layout
* Color Accent

によって表現する。

装飾目的だけの別Fontを追加しない。

本文へ過度に細いFont Weightを使用しない。

日本語の読みやすさを考慮したFont SizeとLine Heightを設定する。

Smartphone実機でも可読性を確認する。

---

## 14. Performance

目標は、

**現代的でリッチなUIを維持しながら、不必要に重くしないWebサイト**

である。

一般的な現代のSmartphoneを通常利用環境として想定する。

極端に古いBrowserやJavaScript無効環境ですべての機能を再現することは要件としない。

以下を考慮する。

* 不要なDependencyを増やさない
* 不要なThird-party Scriptを読み込まない
* SNS等の重量級External ContentをLazy Loadする
* Imageを適切に最適化する
* width / height等でLayout Shiftを抑える
* 必要に応じてWebP / AVIF等を利用する
* 不要なWeb Fontを読み込まない
* 不要なAnimationを避ける
* `prefers-reduced-motion` を考慮する
* Mobile Performanceを継続的に確認する

Lighthouse Performance 90以上を目安とする。

ただし数値達成だけを目的として必要なUI/UXを削らない。

---

## 15. SNS Loading

Instagram / X等のExternal SNS Resourceは、サイト初期表示をBlockingしてはならない。

「関連SNS」を閲覧していない状態では、大量のSNS Script / Embedを読み込まない。

関連SNSを開いた後に必要なResourceをLazy Loadする。

必要に応じて個々の投稿に「投稿を表示」等の操作を設け、その後にEmbedをLoadしてよい。

Embedが失敗した場合でも、

* Account / Post Name
* External Link

等のFallbackを提供する。

SNS障害によってサイト本体を利用不能にしない。

---

## 16. Information Pipeline

情報取得・生成は3経路とする。

### 16.1 RSS / 公式情報収集

GitHub Actionsで自動実行する。

RSSが利用可能ならRSSを優先する。

適切な公式APIが利用可能ならAPIも利用できる。

Web Page取得が必要な場合は低頻度とする。

原則1日1回程度など、Source Siteへ不要な負荷を与えない。

以下を考慮する。

* Cache
* Diff
* Deduplication
* robots.txt
* Terms
* Source Site Load

全文収集を目的としたCrawlerを作らない。

「みずほまる」を基本Keywordとし、必要に応じて「瑞穂町」「東京都瑞穂町」等のContextを利用する。

「瑞穂丸」は無関係な同名対象が存在するため、安易なKeywordとして使用しない。

公式情報は `https://www.town.mizuho.tokyo.jp/bunka/news.xml` だけを毎週木曜日に取得する。タイトルに「みずほまる」を含む記事、またはRSS categoryが「みずほまる情報」の記事だけを対象とする。AIは使用しない。RSS以外のSourceは自動収集せず、公式リンク集として案内する。既存の収集済みデータは引き継がない。Generated Dataは `data/official/YYYY-MM.json` に収集時点のAsia/Tokyo年月で分割し、URLで重複排除する。主な情報元ページの `og:image` が、公開IPへ解決するHTTPS URLであり、リダイレクト先を含めて画像として取得できた場合のみ、任意の `thumbnailUrl` を保持して公式情報のトップ表示と一覧で遅延読み込みサムネイルを表示する。既存データは保持し、既存URLをOGP取得の対象にしない。OGP未設定・取得失敗・非公開宛先の記事に画像情報は追加せず、表示時は仮画像を使う。新規0件ではファイル変更・空commitを作らない。Actionsはレーダーと同じく、実行月の単一JSONのみを変更可能とする差分検証、lint、typecheck、unit test、build、E2E testの成功後にのみmainへ反映する。pushには収集専用GitHub AppのInstallation tokenを使用し、App秘密鍵をGitHub Actions Secretで管理する。個人用PATは使用しない。

### 16.2 AI Summary

情報収集とは別Workflowとする。

AIへ渡すのは、すでに収集された情報のみ。

AI自身に自由なWeb Searchをさせない。

AI Summary Rules:

* 2〜3文程度
* 親しみやすい
* 過度にキャラクター調にしない
* SourceにないFactを追加しない
* Dateを推測しない
* Locationを推測しない
* Priceを推測しない
* 確認できない情報をOfficial Announcement扱いしない
* Original URLを保持する

AIはEditing / Summary Layerであり、Discovery Sourceではない。

### 16.3 Manual SNS / Other Submission

SNSをBotで無差別収集しない。

GitHub Actions `workflow_dispatch` 等を利用して人間が情報を投入する。

想定Input:

* Source URL
* Screenshot
* Memo
* Metadata

AIは投入された情報のみを整理・要約する。

自由な追加調査を行わない。

原則として直接Production Dataを書き換えるより、人間がReview可能なPRを生成する方式を優先する。

対象例:

* Instagram
* X
* Shop Post
* Flyer
* その他自動収集で拾えない情報

### 16.4 みずほまるレーダー

OpenAI Responses APIのWeb Searchを用い、「みずほまる」の現在性のある公開Web情報を定期的に調査する。重点確認サイトは `data/research-sources.yml` でHuman-managedに管理し、allowlistにはしない。調査プロンプトは `prompts/collect-latest.md` に分離する。

`data/sources.yml` の有効な参照元および `data/social.yml` の有効なWhitelistアカウントも、重点確認設定と重複排除して調査コンテキストに含める。対象は瑞穂町公式キャラクター決定ページで定義された画像のキャラクター「みずほまる」とし、ポスター・チラシ・イベント告知画像での利用も、本文または一次情報で同定できる場合に確認対象とする。

候補はStructured Outputsで取得するが、AIをSource of Truthにはしない。TypeScriptでstrict schema、HTTP(S) URL、実際のWeb Search sourceとの照合、fingerprintによる重複排除を通過した候補だけを掲載する。不明・不正・source照合不能ならfail-closedで掲載しない。

データ単位は1回の実行ではなく、1つの独立ニュースにつき1要素とする。`data/radar/YYYY-MM.json` は `discoveredAt` のAsia/Tokyo年月で分割し、`id`、title、summary、category、tags、date、dateType、startDate、endDate、discoveredAt、source、researchSourcesを保持する。主な情報元ページの `og:image` が、公開IPへ解決するHTTPS URLであり、リダイレクト先を含めて画像として取得できた場合のみ、任意の `thumbnailUrl` を保持する。第三者画像をRepositoryへ保存・転載せず、レーダーのトップ表示と一覧では `thumbnailUrl` があるカードに遅延読み込みのサムネイルを表示する。OGP未設定・取得失敗・壊れた画像URL・非公開宛先の場合はデータを変更せず、表示時は仮画像を使う。表示は必ず `discoveredAt DESC` とし、レーダー一覧では年月絞り込みを提供する。

GitHub Actionsは毎週木曜日のJST 13:17頃の定期実行と `workflow_dispatch` を提供する。新情報が0件ならファイル変更・空commitをせず正常終了する。通常実行で書き込めるのは実行月の単一 `data/radar/YYYY-MM.json` のみとし、tracked・untrackedの両方を含むGit差分検査、lint、typecheck、test、buildがすべて成功した場合だけmainへ自動反映する。収集用の `OPENAI_API_KEY` とpush用の専用GitHub App秘密鍵をGitHub Actions Secretで管理する。個人用PATは使用しない。標準GITHUB_TOKENはContents readとし、全検証成功後に対象RepositoryのContents writeに絞ったInstallation tokenを発行する。main保護を利用できる場合は専用Appによる限定更新を許可する設定とする。

---

## 17. SNS Automated Collection Policy

Instagram / Xの一般公開画面をBotで無差別Scrapingしない。

サイトに表示されたSNS EmbedをScreenshot化して定期的にAI解析する方式も、Coreの自動収集手段として採用しない。

SNS情報はHuman-in-the-loopを基本とする。

---

## 18. Provenance

情報の出自を内部Dataに保持する。

最低限以下に相当する情報を保持できること。

```yaml
sourceType: official | instagram | x | shop | other
publishMethod: auto | manual
sourceUrl: https://...
publishedAt: ...
summary: ...
```

公開画面では内部実装の `auto/manual` より、

* 公式サイト
* SNS
* イベント
* グッズ

等、利用者に意味のあるLabelを優先する。

---

## 19. Source of Truth

Source of Truthは、

* RSS等から取得した元情報
* 登録済み公式Source
* Human-managed Source
* 人間が投入した元情報

である。

AI SummaryはSource of Truthではない。

AI Summaryによって元情報を上書きしない。

Source DataとGenerated Summaryを区別する。

利用者がOriginal Sourceへ移動できることを必須とする。

---

## 20. Data Ownership

Human-managed DataとGenerated Dataを分離する。

Human-managed:

* `data/sources.yml`
* `data/social.yml`
* `data/links.yml`

Generated:

* `data/generated/items.json`
* `data/generated/summaries.json`
* `data/generated/social-og.json`
* `data/official/YYYY-MM.json`

Automation / AIが理由なくHuman-managed Dataを書き換えてはならない。

---

## 21. SNS Whitelist

SNS AccountはWhitelist方式で管理する。

公開情報である以下はPublic Repository内の設定として保持可能。

* platform
* accountId
* displayName
* public profile URL
* category
* enabled

一般個人Accountについて、サイト表示に不要な個人情報を追加収集しない。

不要な、

* 本名
* Address
* Contact Information

等をRepositoryへ保存しない。

Secret / TokenはData Fileへ保存しない。

---

## 22. Responsive Design

Mobile First。

最低375px幅で確認する。

* ページ全体のHorizontal Scrollを発生させない（Main Navigation内の横スクロールは許可する）
* Navigationを破綻させない
* CardをViewportからはみ出させない
* 長いURL / Account NameでLayoutを壊さない
* Touch Targetを適切にする
* PCでは画面幅を適切に活用する

Mobileだからという理由だけでBrand Colorや必要なVisual Hierarchyを削除しない。

---

## 23. Accessibility

最低限、

* Semantic HTML
* Keyboard Navigation
* Visible Focus
* Heading Structure
* Link / Button distinction
* Image alt
* Color Contrast
* `prefers-reduced-motion`

を考慮する。

可能であればPlaywrightとaxe等を組み合わせた基本Accessibility Checkを導入する。

みずほまるの近似Brand Colorを使用する場合も、Color Contrastを優先する。

---

## 24. Internationalization

v1の表示言語は日本語とする。

Primary Locale:

`ja-JP`

将来的な多言語対応を想定する。

最初に追加する英語LocaleはAmerican Englishを優先する。

Preferred English Locale:

`en-US`

英語の、

* Spelling
* Vocabulary
* Date / Number Presentation
* UI Wording

等は、特別な理由がない限りAmerican Englishの慣習を使用する。

想定Locale:

* `ja-JP` — 初期・Default
* `en-US` — 将来追加する優先英語Locale

v1で `en-US` を実装すること自体は必須ではない。

将来のi18nを不必要に困難にしない。

* UI Stringを将来的にLocale単位で管理可能にする
* Content DataがLocaleを識別可能な設計を考慮する
* Astroのi18n機能等へ拡張可能にする
* Locale Routingを妨げるURL設計を避ける
* Component内へ大量の日本語文字列をHardcodeしない

ただし、将来のi18nだけを理由にv1を過剰に抽象化しない。

翻訳またはAI生成された他言語ContentもSource of Truthとはしない。

Original URLおよびOriginal Content Languageを保持できる設計とする。

---

## 25. Footer / Operator

Footerに以下への導線を置く。

* このサイトについて
* 運営者について
* お問い合わせ
* GitHub（説明ページ `/github` へ遷移する。説明ページは公開リポジトリ `https://github.com/mentamaru/mizuho-maru-un-official-fun-site` を案内し、このサイトを一緒に盛り上げてくださる方がいれば嬉しいという軽い呼びかけと、気になる点があればPull Requestを送ってほしい旨を述べ、リポジトリへ新しいタブで遷移するリンクを置く。Footerから直接リポジトリへは遷移させない）

ContactはGoogle Form等のExternal Formを利用可能。

本名やPersonal Email Addressの公開は必須ではない。

以下と同趣旨のDisclaimerを表示する。

「本サイトは個人が運営する非公式のみずほまる情報サイトです。瑞穂町および掲載している企業・団体等とは関係ありません。」

問い合わせでは、

* 掲載内容について
* 掲載・リンクの取り下げ
* 情報提供
* その他

等を受け付けられる構成を想定する。

FooterではみずほまるのBrand Colorを比較的大きな面積で使用してよい。

ただし十分なText Contrastを確保する。

---

## 26. Character Artwork / Rights

公式みずほまるArtworkを、

* Logo
* Header
* Hero
* Decoration
* Favicon
* OGP

等に直接使用する場合は、瑞穂町のCharacter Image利用条件および必要な申請・承認を確認する。

承認が確認できるまではPlaceholderを使用する。

第三者Article ImageやSNS ImageをRepositoryへ勝手にCopyしない。

Source Code Licenseと第三者Artwork / Contentの権利を混同しない。

キャラクターの色彩を参考にWeb UI Themeを作ることと、公式Artworkそのものを掲載することは別に扱う。

---

## 27. Security

Vercel / GitHubが提供するPlatform SecurityとApplication側Securityを区別する。

VercelへDeployしただけでSecurity対策済みとは判断しない。

### Vercel

Vercelが提供する範囲の、

* HTTPS / TLS
* CDN
* DDoS Mitigation
* Platform Firewall等

を利用する。

### Application Security Headers

最低限、

* Content-Security-Policy
* X-Content-Type-Options
* Referrer-Policy
* Permissions-Policy

を明示的に設定する。

CSPで安易に `*` を使用しない。

Instagram / X等、実際に必要なOriginのみ許可する。

このサイトで不要なCamera / Microphone / Geolocation等はPermissions-Policyで制限する。

CSP設定後、必要なSNS Embedが正常動作することも確認する。

---

## 28. GitHub Security

導入する。

* Dependabot
* Takumi Guard by GMO
* Dependency Review
* Semgrep（簡易SAST。公開Registryルール `p/default` / `p/security-audit` / `p/owasp-top-ten` / `p/javascript` / `p/typescript`、Metrics無効、検出時は失敗。Secret・アカウント連携不要）
* Trivy（`fs` スキャンで依存脆弱性・Secret・設定ミスを検査。HIGH以上かつ修正版ありで失敗。第三者Actionは使わず、公式imageをdigest固定で実行する）
* CodeQL
* GitHub Secret Scanning
* Push Protection（利用可能な範囲）
* Branch Protection / Ruleset

Public化前にもSecret漏洩を確認する。

GitHub ActionsはLeast Privilegeとする。第三者Actionはタグ書き換え対策としてcommit SHAで固定し（バージョンはコメントで併記）、Dependabotの `cooldown`（7日）で新規公開直後のバージョン取り込みを避ける。

基本Permission:

```yaml
permissions:
  contents: read
```

Write Permissionが必要なWorkflowだけ明示的に追加する。Takumi Guardの監査ログ連携（`TAKUMI_GUARD_BOT_ID`）を使うWorkflowは、OIDC認証のため `id-token: write` のみ追加する。OIDC tokenが発行されないFork / Dependabot起点のPRではBot IDを渡さず、匿名モード（ブロックのみ）で実行する。

Untrusted PR / ForkからSecretへアクセスできる構成を避ける。

対話AgentによるPRのApprove・Mergeには、対象PRについて運営者の明示的な許可を必要とする。実装・検証・PR作成の依頼だけではApprove・Mergeを許可したものと扱わず、mainへの直接Pushで承認を回避しない。公式情報・レーダーの定期収集Workflowによる検証済みの限定自動更新は継続する。

Public Repositoryのmainへの変更はPRを経由し、CODEOWNERSで全ファイルのOwnerを `@mentamaru` として、OwnerのApproveを必須とする。承認後に変更が追加された場合は再承認を必要とする。本人作成PRの自己承認不可に対応するため、運営者 `@mentamaru`（User ID: `108460338`）本人にのみPR経由のReview bypassを認める。管理者Role全体を例外にはしない。定期収集に使用する専用GitHub Appには通常pushの例外を認めるが、Dependabot等の更新PRはOwnerの承認対象とする。mainの削除・force push禁止は別Rulesetとし、Reviewの例外では回避できない。専用GitHub Appの例外はWorkflow単位・変更Path単位の制限ではないため、収集Workflowの差分検証と最小権限を維持し、Workflow変更もOwnerのレビュー対象とする。

---

## 29. Secrets

RepositoryへCommitしない。

* AI API Key
* Access Token
* OAuth Secret
* Vercel Credential
* Webhook Secret
* その他Credential

LocalではGitignoreされたEnvironment Fileを利用する。

GitHub ActionsではGitHub Secrets。

VercelではEnvironment Variables。

`.env.example` にはKey Nameのみ記載し、実値を入れない。

---

## 30. Testing / TDD

Logicは原則TDD。

Red → Green → Refactor。

特に対象:

* RSS Parsing
* Filtering
* Deduplication
* Date Handling
* Data Transformation
* AI Input Generation
* AI Output Validation
* Provenance

単純なAstro Markup / CSSへ機械的にUnit Testを追加しない。

100% Coverageを目的化しない。

Bug Fixでは可能な限り、

1. Reproducing Failing Test
2. Fix
3. PASS
4. Refactor

とする。

---

## 31. Execution Verification

Code Generationだけで完了扱いしない。

最低限実行する。

* lint
* typecheck
* unit test
* build

必要に応じて、

* Playwright
* Lighthouse
* Security Check

も実行する。

未実行のCommand / TestをPASSと報告しない。

---

## 32. Minimum E2E

最低限確認する。

* Top Page renders
* 最新情報が初期表示される
* 最新情報の初期Itemsが表示される
* 公式情報Tabを開ける
* 関連SNS Tabを開ける
* マップTabを開き、2つの地図を表示できる
* 公式情報から一覧と公式リンク集を開ける
* Tab Switchingが正常に動作する
* Original Source Linkが存在する
* 375pxでHorizontal Scrollが発生しない
* 関連SNSを開く前にInstagram / X Resourceが不要にLoadされない
* SNS表示後に必要なResourceがLoadされる
* Embed失敗時もExternal Linkが利用できる
* CSP / Security Headersによって通常画面が壊れない
* 意図しないCSP Violationが発生しない

---

## 33. Release

v2のGoalは、

**Vercel Productionで一般公開し、検索・SNS共有・Security Headerが適切に機能すること**

とする。

v2の正式URLは `https://mizuho-maru-un-official-fun-site.vercel.app/` とする。独自ドメインの取得・接続は今回の対象外とし、将来の変更で対応する。

Production公開前には、

* Git History Secret Check
* Personal Information Check
* License
* Copyright
* Character Artwork Permission
* CI
* Security
* Mobile Real Device
* CSP
* Security Headers
* SNS Lazy Loading
* Source Links
* Disclaimer
* Contact
* README
* SPEC

を確認する。


## 34. レーダーのタグ・日付と紹介

レーダーのタグは内部英語IDと日本語表示を分離し、event（イベント）、appearance（出演・登場）、goods（グッズ）、sale（販売情報）、collaboration（コラボ）、media（メディア掲載）、broadcast（放送）、campaign（キャンペーン）、recruitment（募集）、other（その他）、food（飲食・お菓子）、giveaway（配布・プレゼント）とする。1件に1〜12個の重複しないtagsを持つ。categoryは既存10種類の主分類として保持し、tagsに含める。otherは他タグと併用しない。最新情報・レーダータブ・一覧で共通の日本語タグを表示する。

新規収集候補はtags/startDate/endDateを必須（不明日付はnull）とし、保存済みデータの未設定フィールドは互換表示する。旧categoryをタグとして表示し、旧dateType eventのdateを開始日として扱う。元データ・ID・元情報URLは維持する。タグ・主分類だけの変更で同一記事を再登録しない。

startDate/endDateは開催期間の暦日（YYYY-MM-DD）で、終了日を含む。単日開催は同日、終了日不明はnull。開始日なしの終了日、存在しない日付、逆転期間を拒否する。公開日・更新日・販売開始日・放送日はdate/dateTypeで別に保持する。eventのdateはstartDateと一致させる。日付は一次情報で確認できるものだけを使用し、推測しない。月表示カレンダーは対象外。

discoveredAtは「レーダー登録日」と表示し、開催日等と分ける。最新情報でも登録日を公開日と表示しない。レーダー一覧の絞り込みは「登録年月」とし、登録日降順を維持する。

最新情報の記事群の下に「みずほまるとは？」を置き、東京都瑞穂町公式キャラクターであることと公式紹介ページへの導線を示す。メインタブは増やさない。Aboutはサイトの目的、掲載情報とAI要約、非公式・非営利、お問い合わせを短い見出しと本文で説明し、装飾枠・影を使わず読みやすい本文幅を確保する。
