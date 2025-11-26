# プライバシーポリシー公開設定 - 完了サマリー

## 完了した作業

タスク2「プライバシーポリシーの公開設定」が完了しました。

### 作成されたドキュメント

1. **PUBLISHING.md** - プライバシーポリシーの公開方法の詳細ガイド
   - GitHub Pagesでの公開方法（推奨）
   - GitHubリポジトリの直接リンクでの公開方法
   - 独自のWebサーバーでの公開方法
   - 各方法のメリット・デメリット
   - 詳細な手順とトラブルシューティング

2. **URL-TEMPLATE.md** - プライバシーポリシーURLのテンプレート
   - GitHub PagesのURLテンプレート
   - GitHubリポジトリの直接リンクのURLテンプレート
   - manifest.jsonへの追加方法
   - 実際の例

3. **VERIFICATION-CHECKLIST.md** - URL検証チェックリスト
   - 公開前のチェック項目
   - URLアクセスの確認項目
   - 内容の確認項目
   - Chrome Web Store Developer Dashboardでの設定項目
   - トラブルシューティング

4. **README.mdの更新** - プライバシーポリシーへのリンクを追加

## 推奨される公開方法

**GitHub Pages（推奨）**

理由：
- 無料で利用可能
- HTTPSで自動的にホスティング
- 見やすいHTML形式で表示
- Chrome Web Storeの審査で推奨される方法

## 次のステップ

### 1. GitHubリポジトリの作成（まだ作成していない場合）

```bash
# Gitリポジトリを初期化
git init

# すべてのファイルをステージング
git add .

# 初回コミット
git commit -m "Initial commit with privacy policy"

# GitHubリポジトリをリモートとして追加
git remote add origin https://github.com/[username]/[repository].git

# プッシュ
git push -u origin main
```

**注意**: `[username]`と`[repository]`を実際の値に置き換えてください。

### 2. 公開方法の選択

#### オプションA: GitHub Pagesを使用（推奨）

1. **GitHub Pagesを有効化**
   - GitHubリポジトリの「Settings」→「Pages」に移動
   - ソースを「main」ブランチの「/docs」フォルダに設定
   - 「Save」をクリック

2. **プライバシーポリシーをdocsにコピー**
   ```bash
   mkdir -p docs
   cp store-assets/privacy-policy/privacy-policy-ja.md docs/privacy-policy-ja.md
   cp store-assets/privacy-policy/privacy-policy-en.md docs/privacy-policy-en.md
   git add docs/
   git commit -m "Add privacy policy for GitHub Pages"
   git push
   ```

3. **URLを確認**
   - 日本語版: `https://[username].github.io/[repository]/privacy-policy-ja`
   - 英語版: `https://[username].github.io/[repository]/privacy-policy-en`

#### オプションB: GitHubリポジトリの直接リンクを使用

1. **URLを確認**
   - 日本語版: `https://github.com/[username]/[repository]/blob/main/store-assets/privacy-policy/privacy-policy-ja.md`
   - 英語版: `https://github.com/[username]/[repository]/blob/main/store-assets/privacy-policy/privacy-policy-en.md`

### 3. URLの検証

`VERIFICATION-CHECKLIST.md`を使用して、以下を確認してください：

- [ ] ブラウザでURLを開いて内容が表示されることを確認
- [ ] HTTPSでアクセス可能であることを確認
- [ ] シークレットモードでもアクセスできることを確認
- [ ] 日本語版と英語版の両方が正しく表示されることを確認

### 4. Chrome Web Store Developer Dashboardでの設定

1. Chrome Web Store Developer Dashboardにログイン
2. 拡張機能の編集ページを開く
3. 「プライバシー」セクションに移動
4. プライバシーポリシーのURLを入力
5. 保存

### 5. manifest.jsonの更新（オプション）

manifest.jsonに`homepage_url`を追加することもできます：

```json
{
  "manifest_version": 3,
  "name": "Chat Enter Key Control",
  "version": "1.0.0",
  "description": "日本語入力時のEnterキー誤送信を防止し、Ctrl+EnterやAlt+Enterでメッセージを送信できるようにします",
  "homepage_url": "https://github.com/[username]/[repository]",
  ...
}
```

## 確認事項

タスク2の要件を満たしていることを確認してください：

- [x] GitHub Pagesまたはリポジトリ内での公開方法を決定
  - → `PUBLISHING.md`で詳細な公開方法を文書化
  - → GitHub Pages（推奨）とGitHubリポジトリの直接リンクの2つの方法を提供

- [x] プライバシーポリシーのURLを確認
  - → `URL-TEMPLATE.md`でURLテンプレートを提供
  - → 実際のリポジトリ情報を入力すれば、すぐに使用可能

- [x] HTTPSでアクセス可能であることを確認
  - → `VERIFICATION-CHECKLIST.md`でHTTPS確認項目を提供
  - → GitHubとGitHub Pagesは自動的にHTTPSをサポート

## 参考ドキュメント

- `PUBLISHING.md` - 公開方法の詳細ガイド
- `URL-TEMPLATE.md` - URLテンプレート
- `VERIFICATION-CHECKLIST.md` - 検証チェックリスト
- `privacy-policy-ja.md` - 日本語版プライバシーポリシー
- `privacy-policy-en.md` - 英語版プライバシーポリシー

## トラブルシューティング

問題が発生した場合は、以下のドキュメントを参照してください：

- `PUBLISHING.md`の「トラブルシューティング」セクション
- `VERIFICATION-CHECKLIST.md`の「トラブルシューティング」セクション

## サポート

追加のサポートが必要な場合は、以下のリソースを参照してください：

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Chrome Web Store Developer Program Policies](https://developer.chrome.com/docs/webstore/program-policies/)
- [Chrome Web Store Privacy Requirements](https://developer.chrome.com/docs/webstore/user_data/)

