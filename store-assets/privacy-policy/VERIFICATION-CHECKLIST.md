# プライバシーポリシーURL検証チェックリスト

このチェックリストを使用して、プライバシーポリシーのURLが正しく公開され、Chrome Web Storeの審査要件を満たしていることを確認してください。

## 公開前のチェック

### GitHubリポジトリの設定

- [ ] GitHubリポジトリが作成されている
- [ ] リポジトリが公開（Public）に設定されている
- [ ] プライバシーポリシーファイルがリポジトリにプッシュされている
- [ ] ファイルパスが正しい（`store-assets/privacy-policy/privacy-policy-ja.md` と `privacy-policy-en.md`）

### GitHub Pagesの設定（GitHub Pagesを使用する場合）

- [ ] GitHub Pagesが有効化されている
- [ ] ソースが正しく設定されている（mainブランチ、/docsフォルダ）
- [ ] プライバシーポリシーファイルが`docs/`ディレクトリにコピーされている
- [ ] GitHub Pagesのビルドが完了している（数分かかる場合がある）

## URLアクセスの確認

### 基本的なアクセス確認

- [ ] ブラウザでプライバシーポリシーのURL（日本語版）を開ける
- [ ] ブラウザでプライバシーポリシーのURL（英語版）を開ける
- [ ] 内容が正しく表示されている
- [ ] 文字化けがない
- [ ] レイアウトが崩れていない

### HTTPSプロトコルの確認

- [ ] URLが`https://`で始まっている
- [ ] ブラウザのアドレスバーに鍵マークが表示されている
- [ ] SSL証明書のエラーが表示されない
- [ ] 混合コンテンツの警告が表示されない

### アクセス権限の確認

- [ ] ログインなしでアクセスできる
- [ ] シークレットモード（プライベートブラウジング）でアクセスできる
- [ ] 異なるブラウザ（Chrome、Firefox、Safariなど）でアクセスできる
- [ ] 異なるデバイス（PC、スマートフォンなど）でアクセスできる

## 内容の確認

### 必須項目の確認

- [ ] データ収集の説明が含まれている
- [ ] データ保存場所と方法が説明されている
- [ ] データの使用目的が明記されている
- [ ] 第三者へのデータ共有の有無が明記されている
- [ ] ユーザーの権利（データの削除、アクセス）が説明されている
- [ ] 連絡先情報が含まれている

### Chrome Web Store要件の確認

- [ ] プライバシーポリシーがChrome Web Storeの要件を満たしている
- [ ] 収集するデータの種類が明確に記載されている
- [ ] 権限の使用理由が説明されている
- [ ] 外部サーバーへのデータ送信の有無が明記されている

### 多言語対応の確認

- [ ] 日本語版と英語版の両方が用意されている
- [ ] 両方のバージョンの内容が対応している
- [ ] 翻訳が正確である
- [ ] 専門用語が適切に翻訳されている

## manifest.jsonの確認（オプション）

- [ ] `homepage_url`フィールドが追加されている（オプション）
- [ ] URLが正しい
- [ ] manifest.jsonの構文エラーがない

## Chrome Web Store Developer Dashboardでの設定

### プライバシーポリシーURLの入力

- [ ] Chrome Web Store Developer Dashboardにログインしている
- [ ] 拡張機能の編集ページを開いている
- [ ] 「プライバシー」セクションに移動している
- [ ] プライバシーポリシーのURLを入力している
- [ ] URLが正しいことを確認している

### プライバシー設定の入力

- [ ] データ収集の説明を入力している
- [ ] 収集するデータの種類を選択している
- [ ] データの使用目的を説明している
- [ ] 第三者へのデータ共有がないことを明記している
- [ ] 権限の使用理由を説明している

## 最終確認

### URLの動作確認

- [ ] プライバシーポリシーのURLをコピーしてブラウザで開く
- [ ] 内容が最新であることを確認
- [ ] リンクが切れていないことを確認
- [ ] 404エラーが表示されないことを確認

### 審査前の最終チェック

- [ ] すべてのチェック項目が完了している
- [ ] プライバシーポリシーのURLが正しく公開されている
- [ ] HTTPSでアクセス可能である
- [ ] Chrome Web Store Developer Dashboardに入力されている
- [ ] 審査申請の準備が整っている

## トラブルシューティング

### URLにアクセスできない場合

1. リポジトリが公開（Public）になっているか確認
2. ファイルパスが正しいか確認
3. GitHub Pagesのビルドが完了しているか確認（数分待つ）
4. URLのスペルミスがないか確認

### 404エラーが表示される場合

1. ファイルが正しいパスに配置されているか確認
2. ファイル名が正しいか確認（大文字小文字に注意）
3. ブランチ名が正しいか確認（mainまたはmaster）
4. GitHub Pagesの設定が正しいか確認

### HTTPSでアクセスできない場合

1. GitHub PagesまたはGitHubリポジトリを使用しているか確認
2. カスタムドメインを使用している場合、SSL証明書が設定されているか確認
3. 混合コンテンツ（HTTPとHTTPSの混在）がないか確認

### Chrome Web Storeの審査で却下された場合

1. プライバシーポリシーのURLが正しいか再確認
2. 内容がChrome Web Storeの要件を満たしているか確認
3. 審査担当者からのフィードバックを確認
4. 必要に応じて内容を修正して再申請

## 参考情報

### 公開URLの例

**GitHub Pages:**
- 日本語版: `https://[username].github.io/[repository]/privacy-policy-ja`
- 英語版: `https://[username].github.io/[repository]/privacy-policy-en`

**GitHubリポジトリの直接リンク:**
- 日本語版: `https://github.com/[username]/[repository]/blob/main/store-assets/privacy-policy/privacy-policy-ja.md`
- 英語版: `https://github.com/[username]/[repository]/blob/main/store-assets/privacy-policy/privacy-policy-en.md`

### 関連ドキュメント

- `PUBLISHING.md`: プライバシーポリシーの公開方法の詳細
- `URL-TEMPLATE.md`: URLテンプレートと設定例
- Chrome Web Store Developer Program Policies: https://developer.chrome.com/docs/webstore/program-policies/
- Chrome Web Store Privacy Requirements: https://developer.chrome.com/docs/webstore/user_data/

## 完了

すべてのチェック項目が完了したら、このチェックリストを保存し、Chrome Web Storeの審査申請に進んでください。

審査中に追加情報を求められた場合は、このチェックリストを参照して、すべての要件が満たされていることを確認してください。

