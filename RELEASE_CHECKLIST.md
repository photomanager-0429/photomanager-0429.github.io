# Ver1.00.9 正式公開候補チェックリスト

## ファイル投入前

- [ ] ZIPの中身を新しい作業ブランチへすべてアップロード
- [ ] 意図しない `.github/workflows` が存在しないことを確認
- [ ] Pull Requestの変更ファイルを確認
- [ ] CodeQLとSecret scanningの結果を確認

## マージ後

- [ ] サイト表示が `Ver 1.00.9` になっている
- [ ] TOP、設定、メンバー選択、各一覧が開く
- [ ] 山本杏奈を含む最下部のメンバーまで操作できる
- [ ] メンバー画像の選択・位置変更・保存・再表示が動く
- [ ] 所持数、直筆、欲しい、推し設定が再読み込み後も残る
- [ ] バックアップJSONの書き出し・復元が動く
- [ ] オフライン起動と更新バナーが動く
- [ ] `2026.kokuritsu` に「キービジュアル衣装」が表示される

## GitHub設定

- [ ] Enforce HTTPS: ON
- [ ] CodeQL: 有効・初回スキャン完了
- [ ] Secret Protection: ON
- [ ] Push protection: ON
- [ ] Private vulnerability reporting: ON
- [ ] main Ruleset: Active
- [ ] このOrganizationに別のGitHub Pagesサイトがない

すべて確認できた時点で、Ver1.00.9を正式公開版として告知できます。
