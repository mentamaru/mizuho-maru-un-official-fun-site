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
- `OPENAI_API_KEY` — みずほまるレーダーのOpenAI Responses API用

## Data Directory

- `data/sources.yml` — 公式リンクの参照元定義
- `data/social.yml` — SNS Whitelist
- `data/links.yml` — 恒久リンク集
- `data/official/YYYY-MM.json` — 公式RSSから収集した月別情報
- `data/research-sources.yml` — レーダーの重点確認サイト
- `data/radar/YYYY-MM.json` — レーダーが生成する月別ニュース

## データパイプライン

- `npm run collect:official` — 指定RSSから公式情報を収集
- `npm run collect:radar` — みずほまるレーダーを収集

公式情報（`official.yml`）は毎週木曜日の日本時間13:17頃に実行され、`workflow_dispatch` で同じRSS収集を手動実行できます。対象は指定RSSのタイトルに「みずほまる」を含む記事、またはcategoryが「みずほまる情報」の記事だけです。AIは使用せず、RSS以外は公式リンク集として案内します。結果が0件ならデータ変更・空commitを行いません。

レーダー（`radar.yml`）は毎週木曜日の日本時間13:17頃に実行され、`workflow_dispatch` で同じ収集処理を手動実行できます。結果が0件ならデータ変更・空commitを行いません。レーダーは `OPENAI_API_KEY` をRepository Secretとして必要とします。

## GitHub Actions

- `ci.yml` — lint / typecheck / unit test / build / Playwright
- `security.yml` — Dependency Review / Semgrep（簡易SAST、公開Registryルール・ログイン不要） / Trivy（依存脆弱性・Secret・設定ミスのfsスキャン） / CodeQL
- `official.yml` — 毎週木曜日の公式RSS収集、検証、mainへの限定反映
- `radar.yml` — 毎週木曜日のレーダー収集、検証、mainへの限定反映
- `tool-versions.yml` — 毎月1日にTrivy / Semgrepの固定バージョンを確認し、公開から7日以上経った新しい版があればIssueで通知（`issues: write` のみ追加）

### セキュリティツールの更新手順

Actionの更新（commit SHA固定）はDependabotが週次でPRにします。Dependabotが更新しない次の2つは、`tool-versions.yml` のIssueを受けて手動で更新します。

1. 公式のSecurity Advisory・リリースノートで、侵害や取り下げがないことを確認する。
2. `.github/workflows/security.yml` の `semgrep/semgrep:<版>` を更新する。
3. Trivyは `ghcr.io/aquasecurity/trivy:<版>@sha256:<digest>` の版とdigestを同時に更新する（digestは `docker buildx imagetools inspect ghcr.io/aquasecurity/trivy:<版>` 等で取得し、公式Releaseと一致することを確認する）。
4. ローカルまたはPRのCIで `semgrep` / `trivy` ジョブが成功することを確認する。

### GitHub Actions Secrets / Variables

通常CIに必須のRepository Secretはありません。レーダーworkflowには `OPENAI_API_KEY` が必要です。

- `TAKUMI_GUARD_BOT_ID`（**Secretではなく Variable**）: 全Workflowで [Takumi Guard by GMO](https://github.com/flatt-security/setup-takumi-guard-npm) の監査ログ・Dashboard機能を有効にするための任意のBot ID。
  - 取得先: [Shisho Cloud by GMO](https://cloud.shisho.dev)
  - 登録場所: リポジトリの Settings → Secrets and variables → Actions → **Variables** タブ → New repository variable → Name `TAKUMI_GUARD_BOT_ID`
  - 未設定でもnpm installのBlocking自体は有効なまま（匿名モード）CIは継続します。設定済みの場合、OIDC認証のため該当Workflowに `id-token: write` が必要で、認証に失敗するとActionはエラー終了します。
  - `ci.yml` はOIDC tokenが発行されないFork / Dependabot起点のPRではBot IDを渡さず、匿名モードで実行します。
- Vercel PreviewはGitHub Actions経由ではなくVercelのGitHub連携によりDeployされるため、Vercel用のSecretをGitHubリポジトリ側へ登録する必要はありません（VercelのProject Settings側でEnvironment Variablesを設定します）。
- `OPENAI_API_KEY`（**Repository Secret**）: `radar.yml` がOpenAI Responses API + Web Searchを呼び出すためのキー。登録場所は Settings → Secrets and variables → Actions → **Secrets** → New repository secret。Environment SecretではなくRepository Secretとして登録する。
- 将来外部AI Providerへ接続する場合は、`.env.example` に列挙した `AI_API_KEY` 等をLocalでは `.env`（Gitignore対象）、GitHub Actionsでは Settings → Secrets and variables → Actions → **Secrets** タブへ登録する想定です（v1では未使用のため登録不要）。

## Vercel Release

Static出力を前提にしており、`vercel.json` でSecurity Headersを設定しています。v2の正式URLは `https://mizuho-maru-un-official-fun-site.vercel.app/` です。Preview Deploymentは検索対象にせず、正式URLのcanonicalやSNS共有URLを出力しません。

`PUBLIC_SITE_URL` で正式URLを上書きできます。値にはHTTPS URLを設定します。VercelのPreview/Production環境では、Vercelが設定する`VERCEL_ENV`を利用します。Secretは不要です。

## Specification / Plan

- [SPEC.md](./SPEC.md)
- [ExecPlan 0001](./docs/exec-plans/0001-initial.md)
- [ExecPlan 0003](./docs/exec-plans/0003-mizuhomaru-radar.md)
- [ExecPlan 0004](./docs/exec-plans/0004-official-information-radar.md)
- [ExecPlan v2-0001](./docs/exec-plans/v2-0001-production-release.md)

## License / Rights

- 本Projectの自作Source Codeと付随する自作文書は [MIT License](./LICENSE) で提供します。著作権者表記は公開用ハンドル `mentamaru` とします。
- MIT Licenseは第三者のコンテンツや権利には適用されません。`data/` 内の収集記事・要約・SNS情報、外部リンク先の記事・画像、キャラクターArtwork・名称・商標、Dependencyの利用条件について、このLicenseは利用許諾を付与しません。各権利者の条件を確認してください。
- みずほまる公式 Artwork は利用条件・承認確認前に同梱しません。
- 第三者記事画像や SNS 画像はリポジトリへ複製しません。
