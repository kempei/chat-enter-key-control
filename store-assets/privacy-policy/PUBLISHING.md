# プライバシーポリシーの公開方法

このドキュメントでは、Chrome Web Storeの審査に必要なプライバシーポリシーの公開方法を説明します。

## 公開方法の選択肢

### オプション1: GitHub Pages（推奨）

**メリット**:
- HTTPSで自動的にホスティングされる
- カスタムドメインが使用可能
- 見やすいHTML形式で表示できる
- Chrome Web Storeの審査で推奨される方法

**手順**:

1. GitHubリポジトリの設定を開く
2. 「Pages」セクションに移動
3. ソースを「main」ブランチの「/docs」フォルダに設定
4. プライバシーポリシーファイルを`docs/`ディレクトリに配置
5. Markdownファイルを自動的にHTMLに変換

**必要な作業**:
```bash
# docsディレクトリを作成（既に存在する場合はスキップ）
mkdir -p docs

# プライバシーポリシーをdocsにコピー
cp store-assets/privacy-policy/privacy-policy-ja.md docs/privacy-policy-ja.md
cp store-assets/privacy-policy/privacy-policy-en.md docs/privacy-policy-en.md
```

**公開URL**:
- 日本語版: `https://[username].github.io/[repository]/privacy-policy-ja`
- 英語版: `https://[username].github.io/[repository]/privacy-policy-en`

### オプション2: GitHubリポジトリの直接リンク

**メリット**:
- 追加の設定が不要
- すぐに利用可能
- HTTPSで自動的にアクセス可能

**デメリット**:
- Markdown形式のまま表示される（見た目が簡素）
- Chrome Web Storeの審査で追加の説明が必要な場合がある

**公開URL**:
- 日本語版: `https://raw.githubusercontent.com/[username]/[repository]/main/store-assets/privacy-policy/privacy-policy-ja.md`
- 英語版: `https://raw.githubusercontent.com/[username]/[repository]/main/store-assets/privacy-policy/privacy-policy-en.md`

または、GitHub上で表示される形式:
- 日本語版: `https://github.com/[username]/[repository]/blob/main/store-assets/privacy-policy/privacy-policy-ja.md`
- 英語版: `https://github.com/[username]/[repository]/blob/main/store-assets/privacy-policy/privacy-policy-en.md`

### オプション3: 独自のWebサーバー

**メリット**:
- 完全なコントロール
- カスタムデザインが可能

**デメリット**:
- サーバーの維持管理が必要
- コストがかかる場合がある

## 推奨される公開方法

**GitHub Pagesを推奨します**。理由は以下の通りです：

1. **無料**: GitHubアカウントがあれば無料で利用可能
2. **HTTPS**: 自動的にHTTPSでホスティングされる
3. **信頼性**: GitHubのインフラを利用するため、高い可用性
4. **審査対応**: Chrome Web Storeの審査で一般的に受け入れられる方法

## 次のステップ

### GitHub Pagesを使用する場合

1. **GitHubリポジトリを作成**（まだ作成していない場合）
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/[username]/[repository].git
   git push -u origin main
   ```

2. **GitHub Pagesを有効化**
   - GitHubリポジトリの「Settings」→「Pages」に移動
   - ソースを「main」ブランチの「/docs」フォルダに設定
   - 「Save」をクリック

3. **プライバシーポリシーをdocsにコピー**
   ```bash
   mkdir -p docs
   cp store-assets/privacy-policy/privacy-policy-ja.md docs/privacy-policy-ja.md
   cp store-assets/privacy-policy/privacy-policy-en.md docs/privacy-policy-en.md
   git add docs/
   git commit -m "Add privacy policy for GitHub Pages"
   git push
   ```

4. **URLを確認**
   - GitHub Pagesの設定ページで公開URLを確認
   - 通常は `https://[username].github.io/[repository]/privacy-policy-ja` の形式

5. **manifest.jsonまたはストアリスティングに追加**
   - Chrome Web Store Developer Dashboardで、プライバシーポリシーのURLを入力

### GitHubリポジトリの直接リンクを使用する場合

1. **GitHubリポジトリを作成**（まだ作成していない場合）
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/[username]/[repository].git
   git push -u origin main
   ```

2. **URLを確認**
   - リポジトリのURLを確認
   - プライバシーポリシーファイルのパスを確認

3. **公開URLを生成**
   - GitHub上での表示: `https://github.com/[username]/[repository]/blob/main/store-assets/privacy-policy/privacy-policy-ja.md`
   - Raw形式: `https://raw.githubusercontent.com/[username]/[repository]/main/store-assets/privacy-policy/privacy-policy-ja.md`

4. **manifest.jsonまたはストアリスティングに追加**
   - Chrome Web Store Developer Dashboardで、プライバシーポリシーのURLを入力

## URLの確認方法

公開後、以下の方法でURLが正しくアクセス可能か確認してください：

1. **ブラウザでURLを開く**
   - プライバシーポリシーのURLをブラウザのアドレスバーに入力
   - 内容が正しく表示されることを確認

2. **HTTPSプロトコルの確認**
   - URLが `https://` で始まることを確認
   - ブラウザのアドレスバーに鍵マークが表示されることを確認

3. **アクセス権限の確認**
   - シークレットモード（プライベートブラウジング）でURLを開く
   - ログインなしでアクセスできることを確認

## トラブルシューティング

### GitHub Pagesが有効にならない

- リポジトリが公開（Public）になっているか確認
- ソースの設定が正しいか確認（mainブランチ、/docsフォルダ）
- 数分待ってから再度アクセス（反映に時間がかかる場合がある）

### URLにアクセスできない

- URLのスペルミスがないか確認
- リポジトリが公開（Public）になっているか確認
- ファイルが正しいパスに配置されているか確認

### Chrome Web Storeの審査で却下された

- プライバシーポリシーのURLが正しいか確認
- HTTPSでアクセス可能か確認
- 内容がChrome Web Storeの要件を満たしているか確認
- 必要に応じて、審査担当者に追加情報を提供

## 参考リンク

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Chrome Web Store Developer Program Policies](https://developer.chrome.com/docs/webstore/program-policies/)
- [Chrome Web Store Privacy Requirements](https://developer.chrome.com/docs/webstore/user_data/)

