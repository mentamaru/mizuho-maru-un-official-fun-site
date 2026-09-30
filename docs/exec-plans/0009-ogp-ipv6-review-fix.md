# ExecPlan 0009 — PR #36 IPv6判定と通信説明のレビュー修正

## Scope

レビュー5348466548の3指摘に対応する。既存の「公開宛先のみ」という仕様へ実装を合わせ、通信説明を訂正する。Generated Data・依存関係・CSPは変更しない。

## Decisions

- IPv6の共通判定を、通常のglobal unicast 2000::/3を許可し、特殊用途の2001::/23・2001:db8::/32・2002::/16・3fff::/20を除外する保守的な判定へ変更する。
- IANA特殊用途レジストリを確認: https://www.iana.org/assignments/iana-ipv6-special-registry/
- multicast、site-local、IPv4互換・mapped・変換用アドレスを含む範囲外は拒否。特殊用途の一部到達可能なアドレスもOGP用途では許可しない。
- 圧縮表記の空グループを詰めない。::2001:4860などを公開アドレスと誤認しない。
- 取得処理ではURLのIPv6角括弧を外してIP判定し、リテラルをDNS resolverへ渡さない。
- SPECは静的ビルド時のサーバー側無通信と、ブラウザー側の画像取得/DNS/redirectを区別する。
- 完了済み0008は当初の記録を保持し、誤解を招いた説明について追記で訂正する。

## Verification

- Red: 追加44ケース中30件が修正前に失敗。指摘の3種類、別表記、DNS応答混在、redirect、通常の公開IPv6を対象とする。
- npm run test:unit -- tests/unit/ogp-ipv6.test.ts: Green、44件成功。
- npm run lint / npm run typecheck: 成功。型エラー0、既存Zod非推奨hint 4件。
- npm run test:unit: 13 files / 111件成功。SSRF・Security Headerテストを含む。
- npm run build: 7 pages、成功。
- npm run test:e2e: 既存Astro開発サーバー（4321）のlock検知により開始前に失敗。
- npx playwright test --config .astro/review-check/playwright.config.ts: 21件成功。一時設定で既存webServer commandに --ignore-lock を追加し、専用44321ポートで並行起動。既存開発サーバーの停止・置換はしていない。初回はsandboxのlisten EPERMで開始前に失敗し、権限付き再実行で成功。一時設定はgitignore対象。
- npm audit --omit=dev: 脆弱性0件。
- git diff --check: 成功。Generated Data / dependency manifest / lockfile差分なし。

## Outcome

3指摘への修正完了。依存追加なし。通常の公開IPv6は維持し、特殊用途のアドレスは保守的に拒否する。外部配信元のDNS・redirectの将来的な変更まで保証しない点は継続する。次の手順はPR CI・再レビュー確認。
