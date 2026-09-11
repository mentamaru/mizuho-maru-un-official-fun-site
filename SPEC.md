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

AstroによるStatic Generationを基本とする。

React / Vue / Svelte等のClient Frameworkを禁止するものではない。

ただし、Astroと標準Web APIで十分実現可能な機能のためだけに追加しない。

明確な必要性が発生した場合のみ検討する。

---

## 5. Main UI

サイトアクセス時は「最新情報」を初期表示する。

Main Navigationは以下の5領域とする。

1. 最新情報
2. みずほまるレーダー
3. 関連情報
4. 関連SNS
5. リンク集

対応Browserではこれらをタブ形式のUIで切り替える。

タブ切り替えは高速かつ自然なものとし、ページ全体のReloadを毎回必要とする構成に限定しない。

MobileではTouch操作しやすく、PCでは画面幅を適切に利用する。

---

## 6. 最新情報

アクセス時に最初に表示される主要Content。

以下を混在して表示可能とする。

* RSS/公式情報から生成されたAI要約
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

---

## 7. 関連情報

RSSおよび登録済みSourceから取得した元情報を閲覧する領域。

AI要約とは独立させる。

AIが最新情報として選択・要約しなかった情報も確認可能とする。

Source / Category単位で整理できる構造とする。

例:

* 瑞穂町

  * Item A
  * Item B
* みずほまる情報

  * Item C
  * Item D

原則として表示するのは、

* Title
* Published Date
* Category
* 必要最小限のMetadata
* Original URL

とする。

記事全文を転載しない。

---

## 8. 関連SNS

みずほまるに関連する公開SNS Account / Postを紹介する。

初期対象Platform:

* Instagram
* X

Instagram / XはTop-levelで別画面にせず、関連SNS内でFilter / Switch等によって切り替える。

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

## 9. リンク集

恒久的に参照したい関連Sourceを掲載する。

例:

* 瑞穂町 みずほまる情報
* 瑞穂町イベント情報
* 関連企業
* 商品販売元
* 店舗
* その他関連Page

関連情報とリンク集は役割を分ける。

関連情報:
取得した記事・News・Event等。

リンク集:
恒久的なSource Directory / Bookmark。

---

## 10. Rich UI / JavaScript

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

## 11. Visual Design

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

## 12. Typography

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

## 13. Performance

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

## 14. SNS Loading

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

## 15. Information Pipeline

情報取得・生成は3経路とする。

### 15.1 RSS / 公式情報収集

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

### 15.2 AI Summary

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

### 15.3 Manual SNS / Other Submission

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

### 15.4 みずほまるレーダー

OpenAI Responses APIのWeb Searchを用い、「みずほまる」の現在性のある公開Web情報を定期的に調査する。重点確認サイトは `data/research-sources.yml` でHuman-managedに管理し、allowlistにはしない。調査プロンプトは `prompts/collect-latest.md` に分離する。

`data/sources.yml` の有効な参照元および `data/social.yml` の有効なWhitelistアカウントも、重点確認設定と重複排除して調査コンテキストに含める。対象は瑞穂町公式キャラクター決定ページで定義された画像のキャラクター「みずほまる」とし、ポスター・チラシ・イベント告知画像での利用も、本文または一次情報で同定できる場合に確認対象とする。

候補はStructured Outputsで取得するが、AIをSource of Truthにはしない。TypeScriptでstrict schema、HTTP(S) URL、実際のWeb Search sourceとの照合、fingerprintによる重複排除を通過した候補だけを掲載する。不明・不正・source照合不能ならfail-closedで掲載しない。

データ単位は1回の実行ではなく、1つの独立ニュースにつき1要素とする。`data/radar/YYYY-MM.json` は `discoveredAt` のAsia/Tokyo年月で分割し、`id`、title、summary、category、date、dateType、discoveredAt、source、researchSourcesを保持する。表示は必ず `discoveredAt DESC` とし、レーダー一覧では年月絞り込みを提供する。

GitHub Actionsは毎週木曜日のJST 13:17頃の定期実行と `workflow_dispatch` を提供する。新情報が0件ならファイル変更・空commitをせず正常終了する。通常実行で書き込めるのは実行月の単一 `data/radar/YYYY-MM.json` のみとし、Git差分検査、lint、typecheck、test、buildがすべて成功した場合だけmainへ自動反映する。`OPENAI_API_KEY`以外のSecretやPATは不要とし、main保護導入時は最小権限のGitHub Actions botによるこの限定更新を許可する設定とする。

---

## 16. SNS Automated Collection Policy

Instagram / Xの一般公開画面をBotで無差別Scrapingしない。

サイトに表示されたSNS EmbedをScreenshot化して定期的にAI解析する方式も、Coreの自動収集手段として採用しない。

SNS情報はHuman-in-the-loopを基本とする。

---

## 17. Provenance

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

## 18. Source of Truth

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

## 19. Data Ownership

Human-managed DataとGenerated Dataを分離する。

Human-managed:

* `data/sources.yml`
* `data/social.yml`
* `data/links.yml`

Generated:

* `data/generated/items.json`
* `data/generated/summaries.json`

Automation / AIが理由なくHuman-managed Dataを書き換えてはならない。

---

## 20. SNS Whitelist

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

## 21. Responsive Design

Mobile First。

最低375px幅で確認する。

* Horizontal Scrollを発生させない
* Navigationを破綻させない
* CardをViewportからはみ出させない
* 長いURL / Account NameでLayoutを壊さない
* Touch Targetを適切にする
* PCでは画面幅を適切に活用する

Mobileだからという理由だけでBrand Colorや必要なVisual Hierarchyを削除しない。

---

## 22. Accessibility

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

## 23. Internationalization

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

## 24. Footer / Operator

Footerに以下への導線を置く。

* このサイトについて
* 運営者について
* お問い合わせ
* GitHub

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

## 25. Character Artwork / Rights

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

## 26. Security

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

## 27. GitHub Security

導入する。

* Dependabot
* Takumi Guard by GMO
* Dependency Review
* CodeQL
* GitHub Secret Scanning
* Push Protection（利用可能な範囲）
* Branch Protection / Ruleset

Public化前にもSecret漏洩を確認する。

GitHub ActionsはLeast Privilegeとする。

基本Permission:

```yaml
permissions:
  contents: read
```

Write Permissionが必要なWorkflowだけ明示的に追加する。

Untrusted PR / ForkからSecretへアクセスできる構成を避ける。

---

## 28. Secrets

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

## 29. Testing / TDD

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

## 30. Execution Verification

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

## 31. Minimum E2E

最低限確認する。

* Top Page renders
* 最新情報が初期表示される
* 最新情報の初期Itemsが表示される
* 関連情報Tabを開ける
* 関連SNS Tabを開ける
* リンク集Tabを開ける
* Tab Switchingが正常に動作する
* Original Source Linkが存在する
* 375pxでHorizontal Scrollが発生しない
* 関連SNSを開く前にInstagram / X Resourceが不要にLoadされない
* SNS表示後に必要なResourceがLoadされる
* Embed失敗時もExternal Linkが利用できる
* CSP / Security Headersによって通常画面が壊れない
* 意図しないCSP Violationが発生しない

---

## 32. Release

初期v1のGoalは、

**Local + GitHub Private Repository + Vercel Previewで正常動作すること**

とする。

Public Repository化およびProduction一般公開は別の変更として扱う。

Public化前には、

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
