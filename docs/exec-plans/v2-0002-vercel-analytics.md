# ExecPlan v2-0002 — Vercel Web Analytics導入

## Goal / Status

Vercel Web Analyticsを共通Layoutへ導入し、Production Deploy後のVisitor数とPage Viewを計測できるようにする。

実装とローカル検証は完了。Vercel上の実計測確認はデプロイ後に行う。

## Scope

- `@vercel/analytics` の導入。
- 全ページで共通利用するAstro Layoutへの`<Analytics />`配置。
- ComponentがLayoutから1回だけ出力されることのE2E検証。
- 現在仕様への計測利用の明記。

## Implementation / Decisions

- `@vercel/analytics/astro` の`Analytics` Componentを`src/layouts/Layout.astro`へ1回だけ配置する。
- 追加のClient Framework、Backend、Database、Cookie同意UIは導入しない。
- Analyticsのscriptと送信先は同一オリジンの`/_vercel/insights`を利用するため、既存のCSP `script-src 'self'` と `connect-src 'self'` を維持する。
- `SPEC.md`へProduction Deploy後のVisitor数・Page View計測と共通Layoutへの1回配置を明記する。

## TDD / Verification

共有Layoutで`vercel-analytics`要素が1件だけ出力されるE2Eを先に追加し、実装前の失敗を確認した。

| Command / Check | Result |
| --- | --- |
| Analytics E2E（実装前） | FAIL。`vercel-analytics`要素が0件 |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS、0 errors（既存のZod非推奨hint 5件） |
| `npm run test:unit` | PASS、12 files / 56 tests |
| `npm run test:e2e` | PASS、18 tests |
| `npm run build` | PASS、静的7ページ |
| `npm audit --omit=dev` | PASS、0 vulnerabilities |
| `git diff --check` | PASS |

## Risks / Non-goals

- Vercel Web Analyticsの有効化、デプロイ、実際のデータ受信確認はVercel Project上で行う。
- Content blockerによる計測の抑止や、Vercel側の集計反映時刻は本サイトから制御しない。
- カスタムイベント、個人識別を目的とする計測、追加の外部Analytics Serviceは今回扱わない。
