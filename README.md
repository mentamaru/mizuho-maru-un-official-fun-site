# 非公式みずほまる情報ポータル

東京都瑞穂町公式キャラクター「みずほまる」に関する公開情報を整理し、元情報へ移動しやすくする個人運営・非公式・非営利の情報ポータルです。

> 本サイトは個人が運営する非公式のみずほまる情報サイトです。瑞穂町および掲載している企業・団体等とは関係ありません。

## Project Overview

- Astro による Static First 構成
- Tailwind CSS + daisyUI による White Base / Mizuho Accent UI
- 最新情報 / 関連情報 / 関連SNS / リンク集を 1 ページに整理
- Human-managed Data と Generated Data を分離
- RSS 収集、要約、手動投入のワークフローを GitHub Actions で分離

## Local Setup

```bash
npm install
npx playwright install --with-deps chromium
```

## Development Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Test Commands

```bash
npm run test:unit
npm run test:e2e
```

## Build

```bash
npm run build
npm run preview
```

## Environment Variables

`.env.example` にキー名のみを置いています。

- `AI_API_KEY`
- `AI_MODEL`
- `SUMMARY_PROVIDER`

## Data Directory

- `data/sources.yml` — 公式情報の参照元定義
- `data/social.yml` — SNS Whitelist
- `data/links.yml` — 恒久リンク集
- `data/generated/items.json` — 収集または手動投入された表示用アイテム
- `data/generated/summaries.json` — 要約結果

## データパイプライン

RSS/公式情報自動収集・AI要約生成・手動投入の簡易仕様は [ExecPlan 0001](./docs/exec-plans/0001-initial.md) の「Data Pipeline 簡易仕様」セクションに記録しています。

- `npm run collect` — RSS/公式情報自動収集
- `npm run summarize` — AI要約生成
- `npm run submit-manual` — 手動投入

自動収集（`collect.yml` / `summarize.yml`）は毎日1回のcronに加えて、GitHub Actionsの「Run workflow」（`workflow_dispatch`）からいつでも手動実行できます。サイト構築直後やRSS Feed未確認などで自動収集が動かない場合は、まずこの手動実行、または`submit-manual.yml`からの手動投入でデータを用意してください。

## GitHub Actions

- `ci.yml` — lint / typecheck / unit test / build / Playwright
- `security.yml` — Dependency Review / CodeQL
- `collect.yml` — 公式情報収集
- `summarize.yml` — 収集済み情報だけを要約
- `submit-manual.yml` — `workflow_dispatch` による手動投入

## Vercel Preview

Static 出力を前提にしており、`vercel.json` で Security Headers を設定しています。公開前に Preview Deployment と実機確認を行う想定です。

## Specification / Plan

- [SPEC.md](./SPEC.md)
- [ExecPlan 0001](./docs/exec-plans/0001-initial.md)

## License / Rights

- Source Code License と第三者コンテンツの権利は別です。
- みずほまる公式 Artwork は利用条件・承認確認前に同梱しません。
- 第三者記事画像や SNS 画像はリポジトリへ複製しません。
