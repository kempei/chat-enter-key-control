# 設計書

## 概要

Chat Enter Key Control拡張機能をChrome Web Storeで公式リリースするための設計書です。本設計では、プライバシーポリシーの作成、ストアリスティングコンテンツの準備、画像素材の作成、manifest.jsonの最適化、リリースパッケージの作成、および審査対応の戦略を定義します。

Chrome Web Storeの審査基準とベストプラクティスに準拠し、ユーザーに信頼性の高い拡張機能を提供することを目指します。

## アーキテクチャ

### 全体構成

Chrome Web Storeリリースプロセスは、以下のフェーズで構成されます：

```
準備フェーズ
├── プライバシーポリシー作成
├── ストアリスティングコンテンツ作成
├── 画像素材作成
└── manifest.json最適化

パッケージングフェーズ
├── ファイル選定
├── ZIP作成
└── サイズ確認

申請フェーズ
├── デベロッパーアカウント作成
├── リスティング設定
├── パッケージアップロード
└── 審査申請

運用フェーズ
├── 審査対応
├── ユーザーサポート
└── アップデート管理
```

### ディレクトリ構造

```
.
├── store-assets/              # ストア用素材（新規作成）
│   ├── screenshots/           # スクリーンショット
│   │   ├── ja/               # 日本語版
│   │   └── en/               # 英語版
│   ├── promotional/          # プロモーション画像
│   │   ├── tile-small.png    # 440x280
│   │   └── tile-large.png    # 1400x560（オプション）
│   ├── descriptions/         # 説明文
│   │   ├── summary-ja.txt    # 日本語要約
│   │   ├── summary-en.txt    # 英語要約
│   │   ├── detailed-ja.md    # 日本語詳細
│   │   └── detailed-en.md    # 英語詳細
│   └── privacy-policy/       # プライバシーポリシー
│       ├── privacy-policy-ja.md
│       └── privacy-policy-en.md
├── release/                  # リリースパッケージ（新規作成）
│   └── chat-enter-key-control-v1.0.0.zip
└── [既存のファイル]
```

## コンポーネントとインターフェース

### 1. プライバシーポリシー

**目的**: ユーザーデータの取り扱いを明確に説明し、Chrome Web Storeの審査要件を満たす

**構成要素**:
- データ収集の説明
- データ保存場所と方法
- データの使用目的
- 第三者共有の有無
- ユーザーの権利
- 連絡先情報

**公開方法**:
- GitHub Pagesでホスティング、またはリポジトリ内のファイルへの直接リンク
- manifest.jsonまたはストアリスティングでURLを提供

### 2. ストアリスティングコンテンツ

**簡潔な要約（Summary）**:
- 最大132文字
- 拡張機能の主要な価値提案を簡潔に説明
- 日本語版と英語版を用意

**詳細説明（Detailed Description）**:
- 推奨500-1000文字
- 主な機能のリスト
- 使用方法の説明
- 対象ユーザー
- 技術的な特徴
- 日本語版と英語版を用意

**検索キーワード**:
- 日本語: IME、日本語入力、Enter、誤送信、チャット、ChatGPT、Slack
- 英語: IME, Japanese input, Enter key, chat, messaging, ChatGPT, Slack

### 3. スクリーンショット

**必須スクリーンショット（3-5枚）**:
1. ポップアップUI全体（URLパターン管理）
2. 送信キー設定画面
3. ChatGPTでの動作例
4. URLパターンの追加/削除操作
5. 設定のインポート/エクスポート機能（オプション）

**仕様**:
- 解像度: 1280x800ピクセルまたは640x400ピクセル
- フォーマット: PNG（推奨）またはJPEG
- 日本語版と英語版を用意
- 説明キャプションを追加

### 4. プロモーション画像

**小タイル（必須）**:
- サイズ: 440x280ピクセル
- 内容: 拡張機能のロゴ + 主要機能の簡潔な説明
- 日本語版と英語版を用意

**大タイル（オプション）**:
- サイズ: 1400x560ピクセル
- 内容: より詳細な機能説明やビジュアル
- 日本語版と英語版を用意

### 5. manifest.json最適化

**現在の状態**:
```json
{
  "manifest_version": 3,
  "name": "Chat Enter Key Control",
  "version": "1.0.0",
  "description": "日本語入力時のEnterキー誤送信を防止し、Ctrl+EnterやAlt+Enterでメッセージを送信できるようにします",
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["<all_urls>"]
}
```

**最適化ポイント**:
- `description`: 132文字以内に収める（現在は適切）
- `host_permissions`: `<all_urls>`の使用理由を審査時に説明
- `homepage_url`: GitHubリポジトリのURLを追加（オプション）
- 国際化対応: `_locales`ディレクトリで多言語対応（将来的な改善）

### 6. リリースパッケージ

**含めるファイル**:
- manifest.json
- background.js
- content.js
- popup.html
- popup.css
- popup.js
- error-handler.js
- icons/ (icon16.png, icon48.png, icon128.png)

**除外するファイル**:
- node_modules/
- test/
- .git/
- .kiro/
- docs/
- README.md
- package.json
- package-lock.json
- vitest.config.js
- playwright.config.js
- generate-icons.js
- store-assets/
- release/

**パッケージング手順**:
1. 必要なファイルを一時ディレクトリにコピー
2. ZIPファイルを作成
3. サイズを確認（推奨5MB以下）
4. 動作確認（ローカルでインストールテスト）

## データモデル

### プライバシーポリシーの構造

```markdown
# プライバシーポリシー

## 1. データ収集
- 収集するデータ: URLパターン、送信キー設定
- 収集方法: ユーザーがポップアップUIで設定

## 2. データ保存
- 保存場所: chrome.storage.sync（ブラウザのローカルストレージ）
- 保存期間: ユーザーが削除するまで

## 3. データ使用
- 使用目的: 拡張機能の動作設定のみ
- 入力内容の収集: なし

## 4. 第三者共有
- 第三者へのデータ共有: なし
- 外部サーバーへの送信: なし

## 5. ユーザーの権利
- データの削除: ポップアップUIから削除可能
- データのエクスポート: JSON形式でエクスポート可能

## 6. 連絡先
- GitHub Issues: [リポジトリURL]
```

### ストアリスティングの構造

```yaml
summary:
  ja: "日本語入力時のEnterキー誤送信を防止。Ctrl+Enterで送信。ChatGPT、Slackなどで使用可能。"
  en: "Prevent accidental message sending during Japanese IME input. Send with Ctrl+Enter. Works with ChatGPT, Slack, etc."

detailed_description:
  sections:
    - overview: 拡張機能の概要
    - features: 主な機能のリスト
    - usage: 使用方法
    - supported_sites: 対応サイト
    - privacy: プライバシーとセキュリティ

category: "Productivity"
languages: ["ja", "en"]
support_url: "https://github.com/[username]/chat-enter-key-control"
```

## 正確性プロパティ

*プロパティとは、システムのすべての有効な実行において真であるべき特性や動作のことです。これは、人間が読める仕様と機械で検証可能な正確性保証の橋渡しとなります。*

### プロパティ1: プライバシーポリシーの完全性

*すべての*プライバシーポリシー文書について、Chrome Web Storeの必須項目（データ収集、保存、使用、共有、ユーザーの権利）がすべて含まれていること

**検証方法**: 要件1.1

### プロパティ2: 説明文の長さ制約

*すべての*簡潔な要約について、文字数が132文字以内であること

**検証方法**: 要件2.4

### プロパティ3: スクリーンショットの解像度

*すべての*スクリーンショットについて、解像度が1280x800ピクセルまたは640x400ピクセルであること

**検証方法**: 要件3.2

### プロパティ4: プロモーション画像のサイズ

*すべての*小タイル画像について、サイズが440x280ピクセルであること

**検証方法**: 要件3.4

### プロパティ5: リリースパッケージのファイル構成

*すべての*リリースパッケージについて、必須ファイル（manifest.json、background.js、content.js、popup.html、popup.css、popup.js、icons/）が含まれており、不要なファイル（node_modules/、test/、.git/など）が含まれていないこと

**検証方法**: 要件7.1、7.2

### プロパティ6: manifest.jsonの必須フィールド

*すべての*manifest.jsonについて、必須フィールド（name、version、description、icons、manifest_version）が含まれていること

**検証方法**: 要件4.1

### プロパティ7: 多言語対応の一貫性

*すべての*ストアリスティングコンテンツについて、日本語版と英語版の両方が存在し、内容が対応していること

**検証方法**: 要件2.2、3.6

### プロパティ8: プライバシーポリシーのアクセス可能性

*すべての*プライバシーポリシーについて、一般にアクセス可能なURL（HTTPSプロトコル）で提供されていること

**検証方法**: 要件1.2

## エラーハンドリング

### 1. パッケージング時のエラー

**エラー**: 必須ファイルが見つからない

**対応**:
- ファイルリストを確認
- 不足しているファイルを特定
- エラーメッセージを表示して処理を中断

**エラー**: パッケージサイズが大きすぎる

**対応**:
- ファイルサイズを確認
- 不要なファイルが含まれていないか確認
- 画像ファイルを最適化

### 2. 審査時のエラー

**エラー**: プライバシーポリシーが見つからない

**対応**:
- プライバシーポリシーのURLを確認
- URLがアクセス可能か確認
- manifest.jsonまたはストアリスティングでURLを提供

**エラー**: 権限の使用理由が不明確

**対応**:
- `host_permissions`の使用理由を説明
- 必要最小限の権限のみを要求していることを説明
- 代替案がない理由を説明

**エラー**: コードが難読化されている

**対応**:
- コードが難読化されていないことを確認
- ソースコードをそのまま提供
- ビルドプロセスがない場合はその旨を説明

### 3. リリース後のエラー

**エラー**: ユーザーからバグ報告

**対応**:
- GitHub Issuesで報告を受け付け
- 再現手順を確認
- 修正版をリリース

**エラー**: 低評価レビュー

**対応**:
- レビュー内容を確認
- 問題を特定して修正
- レビューに返信して対応状況を説明

## テスト戦略

### 1. ユニットテスト

Chrome Web Storeリリースに関するユニットテストは、主にファイル検証とデータ検証に焦点を当てます。

**テスト対象**:
- プライバシーポリシーの必須項目チェック
- 説明文の文字数チェック
- 画像ファイルの解像度チェック
- manifest.jsonの必須フィールドチェック
- リリースパッケージのファイル構成チェック

**テストフレームワーク**: Vitest

**テストファイル**: `test/store-release.test.js`

### 2. プロパティベーステスト

プロパティベーステストは、ランダムな入力に対して正確性プロパティが保持されることを検証します。

**テストライブラリ**: fast-check

**テスト対象**:
- 説明文の長さ制約（プロパティ2）
- 多言語対応の一貫性（プロパティ7）

**テストファイル**: `test/store-release.property.test.js`

**設定**: 各プロパティテストは最低100回の反復を実行

### 3. 手動テスト

**テスト項目**:
1. リリースパッケージのローカルインストール
   - ZIPファイルを解凍
   - chrome://extensions/で「パッケージ化されていない拡張機能を読み込む」
   - 動作確認
2. スクリーンショットの視覚的確認
   - 画像が鮮明か
   - 説明が分かりやすいか
   - 日本語版と英語版の対応
3. プライバシーポリシーの確認
   - URLがアクセス可能か
   - 内容が正確か
   - 日本語版と英語版の対応
4. ストアリスティングの確認
   - 説明文が魅力的か
   - 検索キーワードが適切か
   - カテゴリが正しいか

### 4. 審査前チェックリスト

- [ ] プライバシーポリシーが公開されている
- [ ] スクリーンショットが3-5枚用意されている
- [ ] プロモーション画像（小タイル）が用意されている
- [ ] 説明文（日本語・英語）が用意されている
- [ ] manifest.jsonが最適化されている
- [ ] リリースパッケージが作成されている
- [ ] ローカルでの動作確認が完了している
- [ ] すべてのテストが通過している
- [ ] デベロッパーアカウントが作成されている
- [ ] 登録料（5ドル）が支払われている

## 実装の詳細

### 1. プライバシーポリシーの作成

**ファイル**:
- `store-assets/privacy-policy/privacy-policy-ja.md`
- `store-assets/privacy-policy/privacy-policy-en.md`

**公開方法**:
- GitHub Pagesを使用する場合: `docs/`ディレクトリに配置してGitHub Pagesを有効化
- 直接リンクを使用する場合: GitHubリポジトリの`raw`URLを使用

**URL例**:
- GitHub Pages: `https://[username].github.io/chat-enter-key-control/privacy-policy-ja.html`
- 直接リンク: `https://raw.githubusercontent.com/[username]/chat-enter-key-control/main/store-assets/privacy-policy/privacy-policy-ja.md`

### 2. スクリーンショットの作成

**ツール**:
- ブラウザの開発者ツール（デバイスモード）
- スクリーンショットツール（macOS: Cmd+Shift+4、Windows: Snipping Tool）
- 画像編集ツール（必要に応じて）

**手順**:
1. 拡張機能をインストール
2. 対象サイト（ChatGPT、Slackなど）を開く
3. ポップアップを開く
4. スクリーンショットを撮影
5. 必要に応じて注釈を追加
6. 1280x800ピクセルにリサイズ
7. PNG形式で保存

### 3. プロモーション画像の作成

**ツール**:
- 画像編集ソフト（Figma、Canva、Photoshopなど）
- 既存のアイコン（icons/icon.svg）を活用

**デザイン要素**:
- 拡張機能のロゴ
- 主要機能の簡潔な説明
- 視覚的に魅力的な配色
- 日本語版と英語版のテキスト

### 4. 説明文の作成

**日本語版の要約（132文字以内）**:
```
日本語入力時のEnterキー誤送信を防止。Ctrl+Enterで送信。ChatGPT、Slackなどで使用可能。URLパターンで有効化サイトを管理。
```

**英語版の要約（132文字以内）**:
```
Prevent accidental message sending during Japanese IME input. Send with Ctrl+Enter. Works with ChatGPT, Slack, etc.
```

**詳細説明の構成**:
1. 概要（問題と解決策）
2. 主な機能
   - IME入力中のEnter防止
   - 送信キーのカスタマイズ
   - URLパターン管理
   - 設定の永続化
3. 使用方法
4. 対応サイト
5. プライバシーとセキュリティ

### 5. リリースパッケージの作成

**スクリプト**: `scripts/create-release-package.sh`（新規作成）

```bash
#!/bin/bash

VERSION="1.0.0"
PACKAGE_NAME="chat-enter-key-control-v${VERSION}"
RELEASE_DIR="release"
TEMP_DIR="${RELEASE_DIR}/temp"

# 一時ディレクトリを作成
mkdir -p "${TEMP_DIR}"

# 必要なファイルをコピー
cp manifest.json "${TEMP_DIR}/"
cp background.js "${TEMP_DIR}/"
cp content.js "${TEMP_DIR}/"
cp popup.html "${TEMP_DIR}/"
cp popup.css "${TEMP_DIR}/"
cp popup.js "${TEMP_DIR}/"
cp error-handler.js "${TEMP_DIR}/"
cp -r icons "${TEMP_DIR}/"

# ZIPファイルを作成
cd "${TEMP_DIR}"
zip -r "../${PACKAGE_NAME}.zip" .
cd ../..

# 一時ディレクトリを削除
rm -rf "${TEMP_DIR}"

echo "リリースパッケージを作成しました: ${RELEASE_DIR}/${PACKAGE_NAME}.zip"
```

### 6. デベロッパーダッシュボードでの設定

**手順**:
1. Chrome Web Store Developer Dashboardにアクセス
2. 「新しいアイテム」をクリック
3. ZIPファイルをアップロード
4. ストアリスティング情報を入力
   - 説明文（日本語・英語）
   - スクリーンショット
   - プロモーション画像
   - カテゴリ
   - 言語
   - プライバシーポリシーURL
   - サポートURL
5. 配布設定
   - 公開範囲: 公開
   - 地域: すべての地域
6. プライバシー設定
   - データ収集の説明
   - 権限の使用理由
7. 審査申請

## セキュリティとプライバシー

### 1. データ収集の最小化

拡張機能は以下のデータのみを収集します：
- URLパターン（ユーザーが設定）
- 送信キー設定（ユーザーが選択）

以下のデータは収集しません：
- ユーザーの入力内容
- 閲覧履歴
- 個人情報

### 2. データ保存の安全性

- すべてのデータは`chrome.storage.sync`に保存
- ローカルストレージのみ使用（外部サーバーへの送信なし）
- ユーザーがいつでも削除可能

### 3. 権限の最小化

**現在の権限**:
- `storage`: 設定の保存に必要
- `activeTab`: 現在のタブ情報の取得に必要
- `host_permissions: <all_urls>`: すべてのサイトでContent Scriptを実行するために必要

**権限の使用理由**:
- `<all_urls>`: ユーザーが任意のサイトで拡張機能を使用できるようにするため
- 代替案: 特定のサイトのみを対象とすることも可能だが、ユーザーの柔軟性が失われる

### 4. コードの透明性

- すべてのコードはGitHubで公開
- 難読化なし
- 外部ライブラリの読み込みなし

## パフォーマンス

### 1. パッケージサイズ

**目標**: 5MB以下

**現在の推定サイズ**:
- manifest.json: 1KB
- background.js: 10KB
- content.js: 15KB
- popup.html: 2KB
- popup.css: 3KB
- popup.js: 20KB
- error-handler.js: 2KB
- icons/: 50KB
- **合計**: 約100KB

**最適化**:
- 不要なコメントの削除（オプション）
- 画像の最適化（既に最適化済み）

### 2. 審査時間

**通常の審査時間**: 数日〜数週間

**審査を早めるためのポイント**:
- すべての必須項目を正確に記入
- プライバシーポリシーを明確に提供
- 権限の使用理由を説明
- 高品質なスクリーンショットとプロモーション画像

## 国際化

### 1. 現在の対応

- 日本語: 主要言語
- 英語: 副次言語

### 2. 将来的な改善

**`_locales`ディレクトリの使用**:

```
_locales/
├── ja/
│   └── messages.json
└── en/
    └── messages.json
```

**manifest.jsonでの使用**:
```json
{
  "name": "__MSG_extensionName__",
  "description": "__MSG_extensionDescription__"
}
```

**messages.jsonの例**:
```json
{
  "extensionName": {
    "message": "Chat Enter Key Control"
  },
  "extensionDescription": {
    "message": "日本語入力時のEnterキー誤送信を防止"
  }
}
```

## 運用とメンテナンス

### 1. バージョン管理

**セマンティックバージョニング**: `MAJOR.MINOR.PATCH`

- **MAJOR**: 互換性のない変更
- **MINOR**: 後方互換性のある機能追加
- **PATCH**: 後方互換性のあるバグ修正

**現在のバージョン**: 1.0.0

### 2. アップデート戦略

**アップデートの頻度**:
- バグ修正: 必要に応じて
- 機能追加: 四半期ごと
- セキュリティ修正: 即座に

**アップデート手順**:
1. コードを修正
2. バージョン番号を更新（manifest.json、package.json）
3. テストを実行
4. リリースパッケージを作成
5. Chrome Web Store Developer Dashboardでアップロード
6. 変更内容を説明
7. 審査申請

### 3. ユーザーサポート

**サポートチャネル**:
- GitHub Issues: バグ報告、機能リクエスト
- README.md: 使用方法、FAQ
- docs/: 詳細なドキュメント

**レビュー対応**:
- 定期的にChrome Web Storeのレビューを確認
- 問題を報告しているレビューに返信
- 改善提案を検討

### 4. 統計情報の確認

**Chrome Web Store Developer Dashboard**:
- インストール数
- アクティブユーザー数
- 評価とレビュー
- クラッシュレポート

**分析**:
- 人気のある機能を特定
- 問題のある領域を特定
- 改善の優先順位を決定

## まとめ

本設計書では、Chat Enter Key Control拡張機能をChrome Web Storeで公式リリースするための包括的な計画を定義しました。プライバシーポリシーの作成、ストアリスティングコンテンツの準備、画像素材の作成、manifest.jsonの最適化、リリースパッケージの作成、審査対応、および運用戦略をカバーしています。

次のステップは、実装計画（tasks.md）の作成です。
