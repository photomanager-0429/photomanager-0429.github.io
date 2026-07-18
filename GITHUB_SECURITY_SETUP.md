# GitHub正式公開チェックリスト

## アカウント

- GitHubアカウントにパスキーまたは2段階認証を設定する
- リカバリーコードを安全な場所へ保管する
- 不要なGitHub Apps、Personal Access Token、SSHキーを削除する
- Organizationで2段階認証を必須化できる場合は有効にする

## Organization / Repository access

- OrganizationのOwnerは必要最小限にする
- 外部コラボレーターを追加しない
- RepositoryのWrite / Maintain / Admin権限を不要な人へ付与しない
- **このOrganizationでは、本アプリ以外のGitHub Pagesサイトを公開しない**

同じ `photomanager-0429.github.io` オリジン配下に別のPagesサイトを公開すると、ブラウザ上では同一オリジンとして扱われるため、端末内保存データの分離が弱くなる可能性があります。

## Pages

- Settings → Pages → Enforce HTTPS を有効にする
- 公開元を main ブランチの /root に固定する
- 公開URLが `https://photomanager-0429.github.io/` であることを確認する

## Ruleset（main）

- Enforcement status: Active
- Target: Include default branch
- Restrict deletions: ON
- Block force pushes: ON
- Require a pull request before merging: ON
- Required approvals: 一人運用なら0、信頼できる共同管理者がいるなら1
- CodeQLを有効にした後、可能であればCode scanning resultsを必須にする

## Security

- Settings → Security → Advanced Security → Private vulnerability reporting: Enable
- Code scanning → CodeQL default setup: Enable（JavaScript/TypeScript）
- Secret Protection: Enable
- Push protection: Enable
- Access to alerts: 不要な人を追加しない
- Watch → Custom → Security alerts を有効にする

## Issues

- `.github/ISSUE_TEMPLATE`を削除しない
- セキュリティ脆弱性の詳細は公開Issueへ投稿させない
- バックアップJSON、設定画像、個人情報入りスクリーンショットを受け取らない
- 不審なリンクや添付ファイルを開かない

## 更新時

- 試作版で確認してから公開版へ反映する
- ZIPをアップロードする前にJavaScriptの構文確認を行う
- 意図しない `.github/workflows` が追加されていないか確認する
- Pull Requestの差分で `js/app.js`、`js/bootstrap.js`、`service-worker.js` を重点確認する
- 公開後にバージョン表示、設定、メンバー選択、画像保存、バックアップを確認する
