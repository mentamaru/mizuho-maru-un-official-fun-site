# ExecPlan v2-0004 — Repository公開前のPrivacy・License整備

## Goal / Status

Repositoryの公開前に個人情報の露出を抑え、Source Codeの利用条件とSecretの誤投入防止を整える。2026-10-08開始、実施中。公開操作は本計画の準備完了後に判断する。

## Initial Findings（2026-10-08）

- ローカル全参照の142コミット中、個人メールをauthorに含むものが82件、人名をauthorに含むものが36件ある。個人メールはcommitterにも含まれる。
- 現在のローカルGit設定も個人メールを使用している。
- 個人情報の実値はこの計画や公開用mailmapに転記しない。
- package.jsonはMIT表記だがLICENSE本文がない。自作コードへのMIT適用と第三者コンテンツの除外を提案し、利用者の選択を確認する。
- .env.production等と.DS_Storeがignoreされていない。

## Steps

- [x] SPECと既存設定・ローカル履歴を確認する。
- [x] .env.*をignoreし、.env.exampleを例外として維持する。.DS_Storeもignoreする。
- [x] 今後のコミットをmentamaruとGitHub noreplyメールに統一する（このRepositoryのlocal設定のみ）。
- [x] ライセンスを決定し、LICENSEとREADMEの適用範囲を整える。2026-10-22、MIT採用を承認。
- [x] GitHubの最新refsを取得し、作業用の隔離コピーで履歴の匿名化を準備する。保護設定APIは契約上の制限で403。
- [x] author・committer・message・tag・fileに残る対象情報を確認し、Bot等の他者の帰属を保持する。
- [x] 隔離コピーの全127コミットでtree一致、全78 refsを維持、到達可能object内の対象個人情報ゼロを検証する。
- [x] 履歴置換の対象refsと影響を提示し、remote履歴の置換前に承認を得る。2026-10-22承認・反映済み。
- [ ] GitHub上のPR・Issue・Actionsログ・Artifacts・キャッシュ・プロフィール表示名、他のclone/worktreeの残存情報を確認する。
- [ ] Secret scanning・Push protection・main保護・外部PRのActions承認を確認する。
- [ ] 検証結果と残作業を記録する。

## Decisions / Risks

- .mailmapだけでは元のGit objectから個人情報を除去できないため、対策完了と扱わない。
- 履歴改変でcommit IDが変わり署名も維持できない可能性がある。既存clone/worktree、PR参照に影響するため、元の作業Repositoryで直接一括書き換えしない。
- Remote反映では取得時のrefを検証し、他の更新を上書きしない。不要なrefまで削除する無条件のmirror pushは使用しない。
- 旧履歴を含むバックアップは非公開で保管し、公開Repository内へ追加しない。
- 既存PR参照やGitHub上の過去表示、他者cloneまでforce pushだけで除去できるとは判断しない。
- 今後のGitHub Web操作に備え、プロフィール表示名とメールPrivacy設定も確認する。
- Human-managed Data、生成済み記事、元URL、既存の完了済みExecPlanを変更しない。
- Runtime Logic変更がないため新規Unit Testは追加せず、ignoreの正負確認と既存検証を実行する。

## Verification Record（2026-10-08）

| Command / Check | Result |
| --- | --- |
| `git check-ignore --no-index` の正負確認 | PASS: ignore対象6例・追跡可能3例 |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS: 0 errors / 0 warnings、既存Zod非推奨hint 4件 |
| `npm run test:unit` | PASS: 14 files / 131 tests |
| `npm run build` | PASS: 静的7ページ |
| `git diff --check` | PASS |
| `npm audit --omit=dev` | FAIL: High 4件 / Moderate 1件。devalue、http-cache-semantics、sharp、smol-toml、source-map-js。依存更新は未実施 |
| GitHub visibility | private |
| GitHub rulesets / main protection API | HTTP 403: 現在のPrivate Repository契約では利用制限。公開前後の設定手順確認が必要 |
| GitHub fork PR approval API | HTTP 422: Private Repositoryではこの設定を利用できない |
| GitHub default workflow permissions | read。ActionsによるPR承認は許可状態 |
| 隔離mirrorの匿名化 | git-filter-repo 2.47.0。127コミットのtree一致、78 refs維持、対象の氏名・個人メールの残存0 |
| E2E | 未実行: UI/Runtime変更なし |
| 専用Secret scanner / 過去Actionsログ監査 | 未実施 |

## Current Outcome / Remaining Work（2026-10-22）

- MIT採用と履歴修正はユーザー承認済み。LICENSE、READMEの権利分離、ignore補強を確定。
- GitHubの通常31 branchesは匿名化済み。ローカルbranchと別worktreeの共有参照も移行済み。元履歴はRepository外の非公開バックアップに保存。
- 到達可能なコミットの個人情報は修正したが、古いPR refsは残存。対象Actions履歴は削除済み、プロフィール表示名はmentamaruを確認済み。Repositoryはprivateのまま維持する。
- 45 PRに対応する50 PR refsは通常pushで削除できない。ユーザーはSupportが必要な古いPR参照の除去を見送る方針を選択した。旧参照・キャッシュから個人情報を含む旧コミットへ到達し得る点を残存リスクとして記録し、Support依頼は送信しない。
- 過去Actions 326件中311件のログを取得・検査。15件は取得不可。取得ログ中3件に人名が残存。別途実行メタデータ332件を確認し、241件に対象の氏名またはメールが残存。該当241件の削除はユーザー承認を受け、完了・検証済み（末尾の実施記録参照）。
- 取得したログ・メタデータと削除対象IDは非公開バックアップへ保存済み。
- Issue/PR本文45件、Issueコメント51件、Reviewコメント60件、45 PRのReview情報に対象個人情報の一致なし。添付や外部URL先の内容は未検査。
- GitHubプロフィール表示名はAPIで `mentamaru` を確認済み（ユーザー側で変更）。メールPrivacy設定2項目はユーザーが両方ONと回答済み。
- GitHub Actions artifactsは0。cacheは4（内容は未検査）。forkは0。
- Secret scanning・Push protection・main保護・外部PR承認の公開前後設定は残作業。前回APIではprivate契約制限があった。
- 脆弱性修正はpackage-lock.jsonのみ更新。package.jsonの直接依存追加なし。互換範囲の推移的依存・Vitest等を更新し、npm audit fixの最終監査は全依存0 vulnerabilities。
- SPEC変更なし。Human-managed Data・記事内容・元URLの変更なし。
- 次のStepは公開切り替えの判断と公開後の保護設定適用・検証。古いPR参照のSupport対応はユーザーの方針により対象外。Repositoryの公開切り替えは別途判断する。

## References

- https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
- https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address
- https://choosealicense.com/licenses/mit/


## 2026-10-22 — 承認後の実施

- ユーザーの承認に基づきMITを採用し、最新GitHub履歴を取り直して匿名化を実施。
- Remoteの135コミットについてtree一致、81 refs維持、対象個人情報の残存ゼロを確認。31 branchesへatomic push + 個別force-with-leaseで反映し、remote SHA一致を確認。
- 旧履歴はRepository外のアクセス制限付き永続バックアップへ保存した。公開用ファイルへ個人情報の実値を転記しない。
- ローカル152コミットについてもtree一致とremote対応表一致を確認。共有Git参照を移行し、別worktreeを含めた作業ファイルを保持。旧object/reflogは非公開ローカルに残り得る。
- 最新mainから `chore/public-repository-preparation` を作成し、ignore・License・README・本計画を引き継いだ。
- Gitleaks v8.30.1は公式配布のSHA-256を確認して実行。全refs指定のGitスキャンで検出0（ツール報告89コミット）。
- 最新の `npm audit --omit=dev` はHigh 5 / Moderate 1（前回対象にviteを追加）。互換範囲内の修正を `npm audit fix --ignore-scripts` で行い、lockfile差分と全検証を確認する。force更新は使用しない。
- GitHubのIssue・PRコメント・取得できたActionsログの監査を実施済み。Actions artifactsは0、cacheは4、forkは0。
- プロフィール表示名は人名のまま。アカウント全体への変更は未実施。
- GitHub PR refsとキャッシュ上の旧コミットは通常pushで除去できないため、Support依頼用の情報を準備する。問い合わせは未送信。

### Verification Record（2026-10-22）

| Command / Check | Result |
| --- | --- |
| GitHub全135コミットのtree比較・全81 refs比較 | PASS。個人情報以外のファイル内容変更なし |
| 31 branchesのatomic push / remote SHA照合 | PASS |
| ローカル152コミットのtree・対応表比較 / 参照移行 | PASS。到達可能なコミットの対象氏名・メールなし |
| `git check-ignore --no-index` の正負確認 | PASS: 除外6例・追跡可能3例 |
| `npm audit fix --ignore-scripts` | PASS: 0 vulnerabilities。force更新なし |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS: 0 errors / 0 warnings、既存Zod非推奨hint 4件 |
| `npm run test:unit` | PASS: 14 files / 132 tests |
| `npm run build` | PASS: 静的7ページ |
| `npm run test:e2e` | sandboxでlisten EPERM。制限外で同じコマンドを再実行し33件PASS |
| Gitleaks Git全refs検査 | PASS: 検出0。ツール報告89コミット |
| Gitleaks取得Actionsログ検査 | PASS: 約44.41MB、Secret検出0（個人情報検査とは別） |
| `git diff --check` | PASS |

署名は履歴変更により無効になるため保持しない。旧PR・旧commitのGitHubキャッシュ、他のclone、非公開バックアップやreflogからの完全消去は、この検証のPASSに含まない。

### 並行更新の統合

- mainへの通常push時に他の更新を検出して停止。Dependabot PR #43 / #44 / #45のマージ（fast-xml-parser・zod・daisyUI）を取り込み、他の作業を保持した。
- その3マージにGitHubプロフィールの人名が再混入していたため、3マージとその子コミットを追加匿名化。全4コミットのtree一致を確認した。
- `npm ci --ignore-scripts` と `npm audit` を実行し全依存0 vulnerabilities。統合後にlint・typecheck・unit 132件・build・E2E 33件を再実行してPASS。
- プロフィール表示名をmentamaruへ変更する件は、アカウント全体に影響するため別途承認待ち。過去Actions 241件の削除も承認待ち。監査後に発生した実行は、削除の実施時に再確認する。
- 公開準備の変更は検証済みmainに反映する。旧PR参照・旧Actions・プロフィールの残作業があるため、公開準備全体は未完了とする。

### Actions履歴削除と残存PR参照の扱い

- 2026-10-22、ユーザーが個人情報を含むActions履歴の削除を明示承認。古いPR参照はSupportが必要なら除去を見送る方針を受領。
- 削除直前に334実行を再検査し、対象241件を特定。全241件のメタデータに対象個人情報、うち3件の取得済みログに人名が一致した。
- 最新一覧・対象ID・取得可能な追加ログをRepository外の非公開バックアップへ保存。再取得不可ログは8件あり、すべてのログ内容を検査できたとは扱わない。
- 削除時は実行ID・完了状態・対象情報を再照合し、対象外の履歴は保持する。削除後のAPI一覧で対象IDとメタデータ中の対象個人情報の残存を検証する。
- GitHub表示名は `mentamaru` を確認。プロフィール変更はこちらでは実施していない。
- 先のmain CI（run 39726018076）は成功。Security（run 39726018180）はCode scanning未有効により結果アップロードが失敗。Security全体をPASSと扱わず、公開時の設定確認として残す。


### Actions削除の完了記録（2026-10-22）

- `gh api` 経由で対象241件の実行履歴を削除。全件成功。
- 削除後に全実行を再取得し、対象IDの残存0件、残る実行メタデータの対象氏名・個人メール一致0件を確認。
- 削除前334件 − 承認対象241件 = 残存93件。対象外93件のID集合が完全に一致することを検証し、対象外の履歴を保持した。
- 操作結果・削除前後のメタデータ・取得可能なログはRepository外の非公開バックアップへ保存した。削除対象IDや個人情報の実値を公開用文書へ転記しない。
- 古いPR参照の残存はユーザーの判断で許容し、Support依頼は見送る。GitHubから個人情報を完全に除去したとは扱わない。
- 今回のRepository変更は本ExecPlanのみ。SPEC・実装・Dependencyの変更なし。`git diff --check` はPASS。コード変更がないためlint・typecheck・unit・build・E2Eは再実行せず、直前の成功記録と区別する。
- 残作業はメールPrivacy・Code scanning / Secret scanning / Push protection / main保護等の設定確認。公開切り替えは未実施。


### 公開前に適用可能なGitHub保護設定（2026-10-22）

- ユーザーが `Keep my email addresses private` と `Block command line pushes that expose my email` を両方ONにしたと回答。本人確認として記録し、APIで確認したとは扱わない。
- Dependabot alertsはGETが404（disabled）だったため、`PUT /repos/{owner}/{repo}/vulnerability-alerts` で有効化し、GET成功を確認。
- Dependabot security updatesはdisabledからenabledへ変更。GETで `enabled: true, paused: false` を確認。既存の定期version updatesと合わせて利用する。
- Dependabotのopen alerts一覧は確認時点で0件。今後の解析完了や新規Advisoryによる検出を保証するものではない。
- Actionsのdefault workflow permissionsはreadを維持。不要なPR承認をtrueからfalseへ変更し、GETで確認。既存Collectorの明示的なcontents: writeは維持。
- Rulesets APIは403（Proまたはpublicが必要）、Code scanning APIは403（未有効）、Secret scanning alerts APIは404（disabled）。現在の個人所有・privateで利用できない機能は無理に有効化せず、課金・所有者移転・公開切り替えを行っていない。
- 変更はGitHubの上記設定と本ExecPlanのみ。Runtime・Dependency・SPEC変更なし。確認は各設定のGET、alerts一覧、`git diff --check` を使用。lint・typecheck・unit・buildの再実行は行っていない。

### 公開承認後に適用する設定（未実行）

1. `mentamaru/mizuho-maru-un-official-fun-site` をpublicへ変更。ユーザーが許容した旧PR参照の残存も公開範囲に含まれる。
2. Secret scanningとPush protectionを有効化し、APIで状態を確認。既存のAdvanced setup workflowでCodeQLを再実行し、結果アップロード成功とalertsを確認する。Default setupは重複導入しない。
3. mainに以下のRulesetを適用し、force pushとbranch削除を禁止する。既存Collectorの通常pushは維持。これは破壊的更新の防止であり、通常pushへのPR・CI必須化は含まない。
4. fork由来の外部貢献者によるActions実行を `all_external_contributors`（全外部貢献者の実行に承認が必要）へ設定する。
5. visibility・各保護設定・最新CI/Security・alertsを確認し、結果を記録する。有効化失敗やalertは未解決として報告し、Security checkを回避しない。

main Rulesetの適用予定payload:

```json
{
  "name": "main-protection",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/heads/main"], "exclude": [] } },
  "bypass_actors": [],
  "rules": [{ "type": "deletion" }, { "type": "non_fast_forward" }]
}
```

根拠:
- https://docs.github.com/en/code-security/reference/code-scanning/troubleshoot-analysis-errors/private-repository-enablement
- https://docs.github.com/en/code-security/how-tos/secure-your-secrets/detect-secret-leaks/enable-secret-scanning
- https://docs.github.com/en/rest/repos/rules
- https://docs.github.com/en/rest/actions/permissions
