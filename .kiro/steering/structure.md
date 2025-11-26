# プロジェクト構造

## ディレクトリ構成

```
.
├── .kiro/                          # Kiro設定とステアリングルール
│   ├── specs/                      # 仕様ドキュメント
│   │   └── chat-enter-key-control/ # 機能仕様
│   │       ├── requirements.md     # 要件定義
│   │       ├── design.md           # 設計書
│   │       └── tasks.md            # 実装計画
│   └── steering/                   # ステアリングルール
├── icons/                          # 拡張機能アイコン
├── test/                           # テストファイル
│   ├── e2e/                        # E2Eテスト
│   ├── *.property.test.js          # プロパティベーステスト
│   ├── *.test.js                   # ユニットテスト
│   └── setup.js                    # テスト環境セットアップ
├── manifest.json                   # Chrome拡張機能マニフェスト
├── background.js                   # バックグラウンドスクリプト
├── content.js                      # コンテンツスクリプト
├── popup.html                      # ポップアップUI
├── popup.css                       # ポップアップスタイル
├── popup.js                        # ポップアップスクリプト
├── package.json                    # npm設定
├── vitest.config.js                # Vitestテスト設定
└── playwright.config.js            # Playwrightテスト設定
```

## コアファイル

### manifest.json
Chrome拡張機能の設定ファイル。パーミッション、スクリプト、アイコンを定義。

### background.js
Service Workerとして動作。以下の機能を提供:
- ストレージ管理（URLパターンのCRUD操作）
- URLパターンマッチング
- メッセージハンドラ（ポップアップとの通信）
- アイコン状態管理

### content.js
Webページに注入されるスクリプト。以下の機能を提供:
- テキストフィールドの自動検出（MutationObserver使用）
- キーボードイベントハンドリング
- IME入力中のEnterキー制御
- 修飾キー+Enterの送信動作

### popup.html / popup.css / popup.js
拡張機能のポップアップUI（今後実装予定）。

## アーキテクチャパターン

### クラスベース設計
- `FieldRegistry`: フィールドとイベントリスナーの管理
- `FieldDetector`: テキストフィールドの検出と監視
- `KeyboardEventHandler`: キーボードイベントの処理

### モジュール化
各機能を独立した関数として実装し、テスト可能性を確保。

### イベント駆動
- MutationObserverで動的なDOM変更を監視
- chrome.runtime.onMessageでメッセージング
- chrome.tabs.onUpdated/onActivatedでタブイベント監視

## テスト戦略

- **プロパティベーステスト**: fast-checkを使用してエッジケースを自動検証
- **ユニットテスト**: 個別関数の動作を検証
- **E2Eテスト**: Playwrightで実際のブラウザ環境をテスト

## コーディング規約

- **言語**: 日本語コメント、日本語ログメッセージ
- **命名**: 英語の変数名・関数名、日本語のコメント
- **JSDoc**: 関数にはJSDocコメントを記述
- **エラーハンドリング**: try-catchでエラーをキャッチし、console.errorでログ出力
