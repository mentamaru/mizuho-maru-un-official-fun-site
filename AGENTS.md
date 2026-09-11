# Agent Instructions

## Source of Truth

作業開始前に必ず `SPEC.md` を読むこと。

`SPEC.md` はProjectの現在有効な仕様を表すLiving Specificationである。

実装がSPECと異なるという理由だけでSPECを変更してはならない。

実装上のBugなら実装をSPECへ合わせる。

本当に仕様変更を行う場合のみSPECを現在形へ更新する。

SPEC内へ旧仕様を履歴として蓄積しない。

過去仕様はGit History / Pull Request / ExecPlanで確認する。

## ExecPlan

非自明なFeature / 仕様変更 / 大規模RefactoringではExecPlanを使用する。

完了済みExecPlanは当時の計画・実施記録として保持し、現在仕様に合わせて書き換えない。

新しい非自明な変更には新しいExecPlanを作成する。

軽微なCopy / CSS変更等ではExecPlanを必須としない。

## Development

Logicは原則TDDで実装する。

Red → Green → Refactor。

Bug Fixでは可能な限りBugを再現するFailing Testを先に追加する。

Testを通す目的だけでTestを不当に弱くしない。

100% Coverageを目的化しない。

## Verification

実装後は実際にCommandを実行する。

最低限:

* lint
* typecheck
* unit test
* build

必要に応じて:

* Playwright
* Lighthouse
* Security Check

未実行のCommandを「PASS」「確認済み」と報告しない。

## Architecture

このProjectは小規模な個人運営Siteである。

過剰設計しない。

Static Firstを維持する。

不要な、

* Backend
* Database
* Authentication
* SSR
* Microservice
* Layered Enterprise Architecture

を追加しない。

React / Vue / Svelte等を禁止はしないが、Astroと標準Web APIで十分なUIのためだけに追加しない。

Dependency追加前に既存機能で実現できないか確認する。

Performanceを理由に必要なRich UIを削らない。

現代的なSmartphone / PC向けの自然なUXを提供する。

## Design

White Baseを維持する。

みずほまるColorはAccentとして使用し、画面全体をPurple / Pinkで埋めない。

Brand Colorは主に、

* Link
* Active Tab
* Button
* Badge
* Border Accent
* Focus / Selected State
* Footer

へ使用する。

`SPEC.md` のColor PaletteをTheme Tokenとして使用する。

日本語の可読性を優先する。

本文Font Stackは `SPEC.md` で指定されたものを使用する。

v1ではFont統一のためだけに重量の大きなExternal Japanese Web Fontを追加しない。

## Data

Human-managed DataとGenerated Dataを区別する。

Automation / AIが理由なくHuman-managed Dataを書き換えてはならない。

AI SummaryをSource of Truthとして扱わない。

Original Source URLを失わない。

## SNS

SNSを無差別Scrapingしない。

WhitelistとManual Submissionを基本とする。

Instagram / X等の重量級External Resourceは初期表示をBlockingさせず、関連SNS利用時にLazy Loadする。

## Internationalization

v1は `ja-JP`。

将来の優先英語LocaleはAmerican English `en-US`。

将来のi18nを不必要に困難にするHardcodeを避ける。

ただしi18nのためだけにv1を過剰設計しない。

## Security

Security Checkを回避しない。

SecretをRepositoryへCommitしない。

GitHub ActionsはLeast Privilege。

CSP等を安易に緩和してTestを通さない。

Dependency追加時はSupply Chain Riskも考慮する。

## Completion Report

作業完了時には以下を報告する。

* 実装内容
* 変更File
* 追加Dependency
* 実行Command
* Test Result
* Build Result
* Security Result
* SPEC変更有無
* ExecPlan更新内容
* 未実装
* Known Issues
* 次の推奨Step
