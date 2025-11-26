# プライバシーポリシーURL設定テンプレート

このファイルには、Chrome Web Storeの審査申請時に使用するプライバシーポリシーのURLテンプレートが含まれています。

## 必要な情報

以下の情報を実際の値に置き換えてください：

- `[username]`: GitHubのユーザー名またはオーガニゼーション名
- `[repository]`: GitHubリポジトリ名（例: `chat-enter-key-control`）

## オプション1: GitHub Pages（推奨）

### 日本語版
```
https://[username].github.io/[repository]/privacy-policy-ja
```

### 英語版
```
https://[username].github.io/[repository]/privacy-policy-en
```

### manifest.jsonへの追加（オプション）

manifest.jsonに以下のフィールドを追加できます（オプション）：

```json
{
  "homepage_url": "https://github.com/[username]/[repository]"
}
```

## オプション2: GitHubリポジトリの直接リンク

### GitHub上での表示（推奨）

#### 日本語版
```
https://github.com/[username]/[repository]/blob/main/store-assets/privacy-policy/privacy-policy-ja.md
```

#### 英語版
```
https://github.com/[username]/[repository]/blob/main/store-assets/privacy-policy/privacy-policy-en.md
```

### Raw形式（代替案）

#### 日本語版
```
https://raw.githubusercontent.com/[username]/[repository]/main/store-assets/privacy-policy/privacy-policy-ja.md
```

#### 英語版
```
https://raw.githubusercontent.com/[username]/[repository]/main/store-assets/privacy-policy/privacy-policy-en.md
```

## Chrome Web Store Developer Dashboardでの設定

1. Chrome Web Store Developer Dashboardにログイン
2. 拡張機能の編集ページを開く
3. 「プライバシー」セクションに移動
4. 「プライバシーポリシー」フィールドに上記のURLを入力
5. 日本語版と英語版の両方のURLを提供することを推奨

## 確認事項

プライバシーポリシーのURLを設定する前に、以下を確認してください：

- [ ] GitHubリポジトリが公開（Public）になっている
- [ ] プライバシーポリシーファイルが正しいパスに配置されている
- [ ] URLがHTTPSでアクセス可能である
- [ ] ブラウザでURLを開いて内容が表示されることを確認
- [ ] シークレットモードでもアクセスできることを確認

## 例

実際のリポジトリが `https://github.com/example-user/chat-enter-key-control` の場合：

### GitHub Pages
- 日本語版: `https://example-user.github.io/chat-enter-key-control/privacy-policy-ja`
- 英語版: `https://example-user.github.io/chat-enter-key-control/privacy-policy-en`

### GitHubリポジトリの直接リンク
- 日本語版: `https://github.com/example-user/chat-enter-key-control/blob/main/store-assets/privacy-policy/privacy-policy-ja.md`
- 英語版: `https://github.com/example-user/chat-enter-key-control/blob/main/store-assets/privacy-policy/privacy-policy-en.md`

## 次のステップ

1. GitHubリポジトリを作成（まだ作成していない場合）
2. 公開方法を選択（GitHub Pagesまたは直接リンク）
3. URLを実際の値に置き換え
4. ブラウザでURLにアクセスして確認
5. Chrome Web Store Developer Dashboardに入力

詳細な手順は `PUBLISHING.md` を参照してください。

