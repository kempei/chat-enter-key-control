# プライバシーポリシー公開設定の検証チェックリスト

## 完了済みタスク

- [x] プライバシーポリシーファイルをdocs/ディレクトリにコピー
- [x] Jekyll front matterを追加してHTML表示を最適化
- [x] _config.ymlファイルを作成してJekyll設定を構成
- [x] index.mdファイルを作成してナビゲーションを提供
- [x] 実際のGitHubユーザー名とリポジトリ名に更新
- [x] GitHubリポジトリにコミット・プッシュ

## 次に必要な手動設定

### GitHub Pages設定（要手動実行）

1. **GitHubリポジトリにアクセス**
   - https://github.com/kempei/chat-enter-key-control

2. **Settings > Pagesに移動**
   - リポジトリの「Settings」タブをクリック
   - 左サイドバーの「Pages」をクリック

3. **ソース設定**
   - Source: "Deploy from a branch"を選択
   - Branch: "main"を選択
   - Folder: "/docs"を選択
   - 「Save」をクリック

4. **公開URL確認**
   - 設定後、数分待つ
   - 「Your site is published at https://kempei.github.io/chat-enter-key-control/」のメッセージを確認

## URL検証テスト

### 手動確認項目

1. **日本語版プライバシーポリシー**
   - URL: https://kempei.github.io/chat-enter-key-control/privacy-policy-ja
   - [ ] HTTPSでアクセス可能
   - [ ] ログイン不要でアクセス可能
   - [ ] 内容が正しく表示される
   - [ ] HTML形式で見やすく表示される

2. **英語版プライバシーポリシー**
   - URL: https://kempei.github.io/chat-enter-key-control/privacy-policy-en
   - [ ] HTTPSでアクセス可能
   - [ ] ログイン不要でアクセス可能
   - [ ] 内容が正しく表示される
   - [ ] HTML形式で見やすく表示される

3. **インデックスページ**
   - URL: https://kempei.github.io/chat-enter-key-control/
   - [ ] HTTPSでアクセス可能
   - [ ] プライバシーポリシーへのリンクが機能する
   - [ ] ナビゲーションが正しく表示される

### ブラウザテスト

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### シークレットモードテスト

- [ ] Chrome（シークレットモード）
- [ ] Firefox（プライベートブラウジング）

## Chrome Web Store設定準備

### 使用するURL

**プライバシーポリシーURL（日本語版）**:
```
https://kempei.github.io/chat-enter-key-control/privacy-policy-ja
```

**プライバシーポリシーURL（英語版）**:
```
https://kempei.github.io/chat-enter-key-control/privacy-policy-en
```

**サポートURL**:
```
https://github.com/kempei/chat-enter-key-control/issues
```

**ホームページURL**:
```
https://github.com/kempei/chat-enter-key-control
```

## 完了確認

- [ ] GitHub Pages設定完了
- [ ] 全URLの動作確認完了
- [ ] Chrome Web Store用URL準備完了
- [ ] タスク2完了マーク

## 注意事項

1. **GitHub Pages反映時間**: 設定後、反映まで最大10分程度かかる場合があります
2. **リポジトリ公開設定**: リポジトリがPublicである必要があります
3. **ファイル更新**: プライバシーポリシーを更新した場合は、docs/内のファイルも更新が必要です
4. **Jekyll処理**: .mdファイルは自動的に.htmlとしてアクセス可能になります（拡張子なしでもアクセス可能）

## トラブルシューティング

### GitHub Pagesが有効にならない場合

1. リポジトリがPublicになっているか確認
2. docsディレクトリにファイルが存在するか確認
3. _config.ymlファイルが正しく配置されているか確認
4. 数分待ってから再度確認

### URLにアクセスできない場合

1. GitHub Pagesの設定を再確認
2. ブラウザのキャッシュをクリア
3. 別のブラウザで試行
4. シークレットモードで試行

### Chrome Web Store審査で問題が発生した場合

1. プライバシーポリシーの内容を再確認
2. URLが正しくHTTPSでアクセス可能か確認
3. 必要に応じて審査担当者に詳細を説明