# 技術スタック

## プラットフォーム

- **Chrome Extension Manifest V3**: 最新のChrome拡張機能仕様
- **JavaScript (ES6+)**: モジュール構文を使用

## 主要ライブラリ

- **Chrome APIs**:
  - `chrome.storage.sync`: 設定の永続化
  - `chrome.runtime`: メッセージング、イベント管理
  - `chrome.tabs`: タブ情報の取得
  - `chrome.action`: 拡張機能アイコンの制御

## テストフレームワーク

- **Vitest**: ユニットテスト、プロパティベーステスト
- **fast-check**: プロパティベーステストのためのライブラリ
- **Playwright**: E2Eテスト（Chrome拡張機能のテスト）
- **jsdom**: DOM環境のシミュレーション

## 開発ツール

- **Node.js**: パッケージ管理とテスト実行
- **npm**: パッケージマネージャー

## コマンド

```bash
# ユニットテスト実行（1回のみ）
npm test

# ユニットテスト実行（ウォッチモード）
npm run test:watch

# E2Eテスト実行
npm run test:e2e

# E2EテストUI実行
npm run test:e2e:ui
```

## テスト実行時の注意事項

- **重要**: `npm test`コマンドは既に`--run`フラグを含んでいます
- テストファイルを指定する場合は、`npm test -- <ファイルパス>`の形式を使用してください
- **誤り**: `npm test -- <ファイルパス> --run` ← `--run`が重複してエラーになります
- **正しい**: `npm test -- <ファイルパス>` ← これが正しい形式です

### プロパティベーステスト（PBT）のステータス更新

- **重要**: タスク完了時に`updatePBTStatus`ツールを使用しないでください
- PBTタスクの完了は`taskStatus`ツールで`completed`にマークするだけで十分です
- `updatePBTStatus`ツールはテスト失敗時の反例を記録する場合にのみ使用します
- テストが成功した場合は、`taskStatus`で完了マークするだけでOKです

### テスト実行例

```bash
# 特定のテストファイルを実行
npm test -- test/ime-enter.property.test.js

# 複数のテストファイルを実行
npm test -- test/storage.property.test.js test/url-matching.property.test.js

# パターンマッチでテストを実行
npm test -- test/*.property.test.js
```

## ビルド

このプロジェクトはビルドステップを必要としない。ソースコードをそのままChromeに読み込んで使用する。

## インストール方法

1. `chrome://extensions/`を開く
2. デベロッパーモードを有効化
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. プロジェクトディレクトリを選択
