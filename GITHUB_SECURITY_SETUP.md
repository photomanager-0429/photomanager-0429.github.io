# GitHub公開設定チェックリスト

## アカウント

- GitHubアカウントにパスキーまたは2段階認証を設定する
- リカバリーコードを安全な場所へ保管する
- 不要なGitHub Apps、Personal Access Token、SSHキーを削除する

## Organization / Repository access

- OrganizationのOwnerは必要最小限にする
- 外部コラボレーターを追加しない
- RepositoryのWrite / Maintain / Admin権限を不要な人へ付与しない

## Pages

- Settings → Pages → Enforce HTTPS を有効にする
- 公開元を main ブランチの /root に固定する

## Ruleset（main）

- Restrict deletions: ON
- Block force pushes: ON
- Require a pull request before merging: ON
- Required approvals: 一人運用なら0、信頼できる共同管理者がいるなら1
- CodeQLを有効にした後、可能であればCode scanning resultsを必須にする

## Security

- Settings → Security → Advanced Security → Private vulnerability reporting: Enable
- Code scanning → CodeQL default setup: Enable（JavaScript/TypeScript）
- Secret scanning / Push protection: 利用可能な項目を有効にする
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
- 公開後にサイトのバージョン表示と主要画面を確認する
