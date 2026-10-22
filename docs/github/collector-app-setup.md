# 収集専用Appの登録と検証

実装はPRでレビューする。準備中はprivateを維持する。ユーザー承認により実検証中だけ一時公開し、検証後は非公開へ戻す。プラン完了後に正式公開する。明示許可なしにMergeしない。

## 登録する内容

1. https://github.com/settings/apps/new を開く。
2. GitHub App name: `mizuho-maru-collector`（使用済みなら一意な接尾辞を付ける）。
3. Homepage URL: このRepositoryのGitHub URL。
4. WebhookのActiveをOFF。OAuth callback、ユーザー代理認証は不要。
5. Repository permissions: ContentsをRead and write。MetadataのReadは必須。その他の追加権限はなし。
6. インストール先はOnly on this account。作成後Install AppからOnly select repositoriesでこのRepositoryだけを選ぶ。
7. Client IDとApp IDを記録する。Ruleset用はApp IDで、Client IDとは異なる。
8. Generate a private keyで鍵を取得する。秘密鍵はチャットやGitへ貼らない。

## Secret保存先（一時公開時に設定）

`collector-publish` Environmentを作成し、selected deployment branchesのbranch `main`だけを許可する。両collect jobはこのEnvironmentを参照する。Required reviewersは設定しない。

Environment Variable `COLLECTOR_APP_CLIENT_ID` とSecret `COLLECTOR_APP_PRIVATE_KEY`を登録する。秘密鍵は安全なローカルファイルから `gh secret set COLLECTOR_APP_PRIVATE_KEY --env collector-publish --repo mentamaru/mizuho-maru-un-official-fun-site` の標準入力へ渡す。値を引数やチャットへ貼らない。Repository Secret方式には切り替えない。

検証後にprivateへ戻した期間は、現プランではこのEnvironmentを使用できない可能性がある。正式公開までの収集成功を保証しない。

## マージ前の実動作検証

AppとSecret未登録の状態で認証成功とは扱わない。登録後、実装ブランチの確認済みコードと専用Appで以下を実施し、結果をExecPlanへ記録する。

- Installation tokenの発行と対象Repository限定・Contents writeを確認する。
- 本番mainへの直接pushを試さず、最新mainと同じcommitを指す一時ブランチ `verification/collector-app-<一意な番号>` をApp認証で作成する。
- 同ブランチの参照を読み戻してSHA一致を確認し、作成した検証ブランチだけを削除する。mainや既存の他ブランチを操作しない。後続CI/Vercelが起動した場合は確認する。
- tokenを失効し、ログ・Git remote・Git configへ秘密値を残さない。
- これはAppの書き込み権限の検証であって、収集からmainへの反映やRuleset bypassの検証ではない。

一時ブランチの検証専用Workflowを恒久追加する必要はない。ローカルで安全にtokenを管理して実施するか、レビュー済みの一時Workflowを使う。Environment方式ではmain以外から本番Secretを取り出して制限を回避しない。

## マージ条件と本番確認

- 保存先を決定し、必要なEnvironment設定がある場合はYAMLへ反映する。
- App認証・検証ブランチのpush成功、ローカル必須検証成功、未検証事項を示して対象PRのMerge許可を得る。
- GitHub Free/privateのままではRulesetの強制・App例外は検証不能。Pro等へ変更した場合だけ、専用AppのIDで設定しGETで確認する。標準Actions App ID 15368は再利用しない。
- mainへのMerge後、通常の収集を手動実行しGenerated Dataの限定更新とCI/Deployを確認する。新規0件ならpush経路は未検証のままとする。
- Secret未設定でMergeすると、変更のある収集は認証段階で失敗する。設定未完了のままMergeしない。
