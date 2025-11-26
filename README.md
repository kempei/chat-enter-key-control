# Chat Enter Key Control

日本語入力時のEnterキー誤送信を防止するChrome拡張機能

## 概要

Webベースのチャットアプリケーション（ChatGPT、Slack、Discordなど）で、日本語入力時にEnterキーで漢字変換を確定した際に誤ってメッセージが送信されてしまう問題を解決します。

この拡張機能は、IME（日本語入力システム）使用中のEnterキー押下を検出し、メッセージ送信を防止して改行を挿入します。意図的にメッセージを送信したい場合は、Ctrl+EnterやCmd+Enterなどの修飾キーを使用します。

## 機能

- **IME入力中のEnter防止**: 日本語入力時のEnterキーで改行を挿入（送信を防止）
- **送信キーのカスタマイズ**: メッセージ送信に使用するキーを自由に選択可能
  - Ctrl+Enter、Alt+Enter、Cmd+Enter、Opt+Enter、Shift+Enter、Enterから1つを選択
  - デフォルトはCmd+Enter（macOS）/ Ctrl+Enter（Windows/Linux）
- **URLパターン管理**: 特定のサイトで機能を有効化/無効化
- **自動フィールド検出**: textarea、input、contenteditable要素を自動的に検出
- **動的要素対応**: MutationObserverで動的に追加されるフィールドも検出
- **設定の永続化**: chrome.storage.syncで設定を保存し、ブラウザ再起動後も維持
- **視覚的フィードバック**: 拡張機能アイコンで有効/無効状態を表示
- **設定のインポート/エクスポート**: JSON形式で設定をバックアップ・復元
- **長いURL表示の最適化**: ポップアップUIで長いURLを見やすく表示
  - 100文字を超えるURLは自動的に省略表示
  - クリックで全体表示と省略表示を切り替え可能
  - 展開可能なURLには視覚的なインジケーターを表示

## インストール方法

### 開発版のインストール

1. このリポジトリをクローンまたはダウンロード
2. Chromeで `chrome://extensions/` を開く
3. 右上の「デベロッパーモード」を有効化
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. このプロジェクトのディレクトリを選択

## プロジェクト構造

```
.
├── manifest.json          # Chrome拡張機能のマニフェストファイル
├── background.js          # バックグラウンドスクリプト
├── content.js            # コンテンツスクリプト
├── popup.html            # ポップアップUI
├── popup.css             # ポップアップスタイル
├── popup.js              # ポップアップスクリプト
├── icons/                # アイコンファイル
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── icon.svg
└── README.md
```

## 開発

このプロジェクトは仕様駆動開発（Spec-Driven Development）で開発されています。

### 仕様ドキュメント

- [要件定義](.kiro/specs/chat-enter-key-control/requirements.md) - システムの要件と受入基準
- [設計書](.kiro/specs/chat-enter-key-control/design.md) - アーキテクチャと正確性プロパティ
- [実装計画](.kiro/specs/chat-enter-key-control/tasks.md) - タスクリストと進捗状況

### テスト

プロジェクトには包括的なテストスイートが含まれています：

```bash
# ユニットテストとプロパティベーステストを実行
npm test

# 特定のテストファイルを実行
npm test -- test/ime-enter.property.test.js

# E2Eテストを実行
npm run test:e2e

# E2EテストをUIモードで実行
npm run test:e2e:ui
```

#### テストの種類

- **プロパティベーステスト**: fast-checkを使用して、ランダムな入力で正確性プロパティを検証
- **ユニットテスト**: 個別の関数やコンポーネントの動作を検証
- **E2Eテスト**: Playwrightを使用して、実際のブラウザ環境で動作を検証
- **統合テスト**: 実際のチャットアプリケーションでの手動テスト（[統合テストガイド](docs/integration-testing-guide.md)を参照）

### 技術スタック

- **Chrome Extension Manifest V3**: 最新のChrome拡張機能仕様
- **JavaScript (ES6+)**: モジュール構文を使用
- **Vitest**: ユニットテストとプロパティベーステスト
- **fast-check**: プロパティベーステストライブラリ
- **Playwright**: E2Eテスト
- **jsdom**: DOM環境のシミュレーション

### 貢献方法

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

プルリクエストを作成する前に：
- すべてのテストが通ることを確認 (`npm test`)
- コードが仕様に準拠していることを確認
- 新機能には適切なテストを追加

## 使用方法

### 基本的な使い方

1. **拡張機能のインストール**: 上記のインストール方法に従って拡張機能をインストール
2. **対象サイトを開く**: ChatGPTやSlackなどのチャットアプリケーションを開く
3. **ポップアップを開く**: ブラウザツールバーの拡張機能アイコンをクリック
4. **URLパターンを追加**:
   - 「URLパターンを追加」フィールドにパターンを入力（例：`*://chat.openai.com/*`）
   - 「追加」ボタンをクリック
   - または「現在のドメインを追加」ボタンで現在のサイトを簡単に追加
5. **送信キーを設定**（オプション）:
   - ポップアップの「送信キー設定」セクションで好みのキーを選択
   - デフォルトはCmd+Enter（macOS）/ Ctrl+Enter（Windows/Linux）
   - 選択肢：Ctrl+Enter、Alt+Enter、Cmd+Enter、Opt+Enter、Shift+Enter、Enter
6. **キーボード操作**:
   - **Enter**: 改行を挿入（送信キーが「Enter」以外の場合）
   - **設定した送信キー**: メッセージを送信
   - **IME入力中**: 送信キーが「Enter」でも、IME確定のEnterでは送信されません

### 送信キーの設定

拡張機能では、メッセージを送信するためのキーボードショートカットを1つ選択してカスタマイズできます。

#### 送信キーの選択方法

1. ポップアップを開く
2. 「送信キー設定」セクションを確認
3. ドロップダウンメニューから好みのキーを選択
4. 設定は自動的に保存され、すぐに反映されます

ドロップダウン形式により、コンパクトで見やすいUIを実現しています

#### 利用可能な送信キーオプション

| 送信キー | 説明 | 推奨環境 |
|---------|------|----------|
| **Ctrl+Enter** | Ctrlキー + Enterキー | Windows、Linux |
| **Alt+Enter** | Altキー + Enterキー | Windows、Linux |
| **Cmd+Enter** | Commandキー + Enterキー | macOS（デフォルト） |
| **Opt+Enter** | Optionキー + Enterキー | macOS |
| **Shift+Enter** | Shiftキー + Enterキー | すべてのOS |
| **Enter** | Enterキーのみ | すべてのOS（上級者向け） |

#### 各送信キーの特徴

**Ctrl+Enter / Cmd+Enter（推奨）**
- 最も一般的な送信キー
- 多くのチャットアプリケーションで標準的に使用されている
- 誤送信のリスクが低い
- デフォルト設定

**Alt+Enter / Opt+Enter**
- Ctrl/Cmdキーと競合する場合の代替案
- 一部のアプリケーションで特殊な機能に割り当てられている場合がある

**Shift+Enter**
- 一部のチャットアプリケーションでは改行に使用されている
- 既存の動作と競合する可能性があるため注意が必要

**Enter（上級者向け）**
- Enterキーのみで送信
- IME入力中は自動的に保護されるため、日本語入力時の誤送信は防止されます
- 通常の英語入力時はEnterキーで即座に送信されます
- 改行を挿入したい場合は、他の送信キーを選択してください

#### IME入力中の保護

**重要**: どの送信キーを選択しても、IME入力中（日本語入力中）のEnterキー押下では送信されません。

- 送信キーを「Enter」に設定した場合でも、IME入力中は送信を防止
- 漢字変換の確定でEnterキーを押しても、メッセージは送信されません
- IME確定後、再度Enterキーを押すと送信されます（送信キーが「Enter」の場合）

#### 送信キー設定の変更

送信キー設定は、以下の場合に変更を検討してください：

1. **既存のキーバインディングと競合する場合**
   - 使用しているチャットアプリケーションが同じキーを別の機能に使用している
   - 他の拡張機能やOSのショートカットと競合している

2. **操作性を向上させたい場合**
   - より押しやすいキーの組み合わせに変更したい
   - 使い慣れたキーバインディングに合わせたい

3. **Enterキーで即座に送信したい場合**
   - 英語のみで使用し、改行が不要な場合
   - IME保護機能を活用して、日本語入力時のみ誤送信を防止したい場合

### URLパターンの管理

#### パターンの形式

Chrome拡張機能の標準的なマッチパターンを使用します：

- `*://example.com/*` - example.comのすべてのページ
- `*://*.example.com/*` - example.comのすべてのサブドメイン
- `https://example.com/*` - HTTPSのみ
- `*://example.com/chat/*` - 特定のパス配下のみ

#### パターンの有効化/無効化

- パターンリストの各項目にあるトグルスイッチで、個別に有効/無効を切り替え可能
- 無効化したパターンは削除せずに一時的に機能を停止できます

#### パターンの削除

- パターンリストの各項目にある「削除」ボタンをクリック
- 削除したパターンは復元できないため、再度追加が必要です

### 設定のバックアップと復元

#### エクスポート

1. ポップアップを開く
2. 「設定をエクスポート」ボタンをクリック
3. JSON形式のファイルがダウンロードされます

#### インポート

1. ポップアップを開く
2. 「設定をインポート」ボタンをクリック
3. 以前エクスポートしたJSONファイルを選択
4. 既存の設定は上書きされます

### アイコンの状態表示

- **カラーアイコン**: 現在のページで拡張機能が有効
- **グレーアイコン**: 現在のページで拡張機能が無効

### URL表示機能

ポップアップUIには、現在のタブのURLが表示されます。長いURLの場合、見やすく表示するための機能が提供されています。

#### 自動省略表示

- **100文字以下のURL**: 全体が表示されます
- **100文字を超えるURL**: 最初の100文字のみが表示され、残りは「...」で省略されます
- 省略されたURLには展開インジケーター（▼）が表示されます

#### 展開と折りたたみ

長いURLをクリックすることで、全体表示と省略表示を切り替えることができます：

1. **省略状態のURLをクリック**: 全体が展開表示されます
   - インジケーターが▲に変わります
   - ホバー時に視覚的なフィードバックが表示されます
2. **展開状態のURLをクリック**: 再び省略表示に戻ります
   - インジケーターが▼に戻ります

#### キーボード操作

- **Enterキー**: URLにフォーカスがある状態でEnterキーを押すと、展開/折りたたみを切り替えられます
- アクセシビリティに配慮した設計で、キーボードのみでも操作可能です

#### URL変更時の動作

- タブを切り替えたり、ページを移動したりしてURLが変更されると、表示状態は自動的に省略状態にリセットされます

詳細な使用方法は [ポップアップUI使用ガイド](docs/popup-ui-usage.md) を参照してください。

## 対応サイト

URLパターンを設定することで、任意のWebサイトで使用できます。

### 動作確認済みサイト

以下のサイトで動作確認を行っています：

| サイト | URLパターン | 備考 |
|--------|-------------|------|
| ChatGPT | `*://chat.openai.com/*` | テキストエリアで動作 |
| ChatGPT | `*://chatgpt.com/*` | 新ドメインにも対応 |
| Slack | `*://*.slack.com/*` | メッセージ入力欄で動作 |
| Discord | `*://discord.com/*` | チャット入力欄で動作 |
| Google Chat | `*://chat.google.com/*` | メッセージ入力欄で動作 |
| Microsoft Teams | `*://teams.microsoft.com/*` | チャット入力欄で動作 |
| Notion | `*://*.notion.so/*` | contenteditable要素で動作 |
| GitHub | `*://github.com/*` | コメント入力欄で動作 |

### 推奨URLパターン

よく使用されるサイトの推奨パターン：

```
*://chat.openai.com/*
*://chatgpt.com/*
*://*.slack.com/*
*://discord.com/*
*://chat.google.com/*
*://teams.microsoft.com/*
*://*.notion.so/*
*://github.com/*
```

### 対応フィールドタイプ

以下のHTML要素を自動的に検出します：

- `<textarea>` - 標準的なテキストエリア
- `<input type="text">` - テキスト入力フィールド
- `[contenteditable="true"]` - contenteditable属性を持つ要素
- `[contenteditable=""]` - contenteditable属性が空の要素

詳細は [対応サイトリスト](docs/supported-sites.md) を参照してください。

## 技術的制約

### 対象範囲

本拡張機能は、**通常のWebページ（`http://`、`https://`スキーム）上のテキスト入力フィールド**でのみ動作します。

### 対象外

以下のコンテキストでは、Chrome拡張機能のセキュリティモデルにより、本機能は動作しません：

- **他の拡張機能のUI**
  - Chrome Side Panel APIを使用したサイドパネル（例：Amazon Quick Suite）
  - 拡張機能のポップアップウィンドウ
  - 拡張機能の設定ページ
- **特殊なChromeページ**
  - `chrome://` スキームのページ（設定、履歴など）
  - `chrome-extension://` スキームのページ

### 理由

Chrome拡張機能は、セキュリティ上の理由により、他の拡張機能のコンテキストにContent Scriptを注入できません。各拡張機能は独立したコンテキストで動作し、互いにアクセスできないように設計されています。

### 回避策

他の拡張機能のサイドパネルやポップアップ内でIME対応のEnterキー制御が必要な場合：

1. **対象拡張機能の開発者に機能追加を依頼**: 該当する拡張機能の開発者に、IME対応のEnterキー制御機能の追加を依頼してください
2. **修飾キーの使用**: サイドパネルやポップアップ内では、修飾キー（Ctrl+Enter、Cmd+Enterなど）を使用してメッセージを送信してください

## トラブルシューティング

### 拡張機能が動作しない

**症状**: Enterキーを押してもメッセージが送信されてしまう

**解決方法**:
1. 拡張機能アイコンを確認（グレーの場合は無効）
2. ポップアップを開いて、現在のサイトのURLパターンが追加されているか確認
3. URLパターンが有効（トグルがON）になっているか確認
4. ページをリロードして再試行

### 特定のサイトで動作しない

**症状**: 一部のサイトでのみ動作しない

**解決方法**:
1. URLパターンが正しいか確認（ワイルドカード `*` の位置に注意）
2. サイトが動的にフィールドを生成している場合、少し待ってから入力
3. ブラウザのコンソール（F12）でエラーメッセージを確認
4. 他の拡張機能との競合を確認（一時的に無効化して試す）

### 設定した送信キーで送信できない

**症状**: 設定した送信キー（Ctrl+EnterやCmd+Enterなど）を押してもメッセージが送信されない

**原因**: 対象サイトが該当の送信キーをサポートしていない、または他の機能に割り当てられている可能性があります

**解決方法**:
1. ポップアップで現在の送信キー設定を確認
2. 別の送信キーに変更してみる（例：Ctrl+Enter → Shift+Enter）
3. サイトの送信ボタンをクリックして送信
4. サイトの設定で該当のキーバインディングが有効になっているか確認
5. ブラウザのコンソール（F12）でエラーメッセージを確認

### 送信キーが期待通りに動作しない

**症状**: 送信キーを変更したが、以前の設定で動作する、または動作が不安定

**解決方法**:
1. ページをリロード（F5）して設定を再読み込み
2. ポップアップで送信キー設定が正しく保存されているか確認
3. 拡張機能を一度無効化してから再度有効化
4. ブラウザを再起動

### 改行が挿入されない

**症状**: Enterキーを押しても改行が挿入されない

**解決方法**:
1. テキストフィールドが正しく検出されているか確認
2. contenteditable要素の場合、サイト独自のスクリプトが干渉している可能性
3. ブラウザのコンソールでエラーメッセージを確認

### 設定が保存されない

**症状**: ブラウザを再起動すると設定が消える

**解決方法**:
1. Chrome Syncが有効になっているか確認
2. ストレージの容量制限に達していないか確認
3. 拡張機能を再インストール

### パフォーマンスの問題

**症状**: ページの動作が遅くなる

**解決方法**:
1. 不要なURLパターンを削除または無効化
2. 他の拡張機能との競合を確認
3. ブラウザのタスクマネージャー（Shift+Esc）でリソース使用状況を確認

### URL表示が正しく動作しない

**症状**: ポップアップでURLが表示されない、または展開/折りたたみができない

**解決方法**:
1. ポップアップを閉じて再度開く
2. ページをリロードしてから再試行
3. 拡張機能を再読み込み（chrome://extensions/で「再読み込み」ボタンをクリック）
4. ブラウザのコンソール（F12）でエラーメッセージを確認

**症状**: URLが省略されない、または常に省略される

**解決方法**:
1. URLの長さを確認（100文字が境界）
2. ブラウザのズーム設定を確認（100%推奨）
3. ポップアップのサイズを確認

### その他の問題

上記で解決しない場合は、以下の情報を添えてGitHubのIssuesで報告してください：

- 使用しているブラウザとバージョン
- 対象サイトのURL
- 再現手順
- ブラウザコンソールのエラーメッセージ（あれば）

詳細なトラブルシューティングガイドは [トラブルシューティング](docs/troubleshooting.md) を参照してください。

## よくある質問（FAQ）

### Q: 拡張機能は無料ですか？

A: はい、完全に無料でオープンソースです。

### Q: プライバシーは保護されますか？

A: はい。拡張機能は以下のことを行いません：
- 入力内容の収集
- 外部サーバーへのデータ送信
- トラッキング

すべてのデータはローカル（chrome.storage.sync）に保存されます。

### Q: 他のブラウザでも使えますか？

A: Chrome拡張機能として開発されていますが、Chromiumベースのブラウザ（Microsoft Edge、Brave、Operaなど）でも動作する可能性があります。

### Q: モバイルでも使えますか？

A: いいえ。Chrome拡張機能はデスクトップ版のChromeでのみ動作します。

### Q: 設定を複数のデバイスで同期できますか？

A: はい。Chrome Syncを有効にすると、設定が自動的に同期されます。

### Q: 特定のサイトだけで無効化できますか？

A: はい。ポップアップでURLパターンのトグルスイッチをOFFにすることで、特定のサイトで無効化できます。

### Q: 送信キーをカスタマイズできますか？

A: はい。ポップアップの「送信キー設定」から、以下のオプションを選択できます：
- Ctrl+Enter（Windows/Linux推奨）
- Alt+Enter
- Cmd+Enter（macOS推奨、デフォルト）
- Opt+Enter
- Shift+Enter
- Enter（上級者向け）

### Q: 送信キーを「Enter」に設定すると、改行はどうなりますか？

A: 送信キーを「Enter」に設定した場合：
- **IME入力中**: Enterキーで漢字変換を確定（送信されません）
- **IME確定後**: Enterキーでメッセージを送信
- **改行の挿入**: 改行が必要な場合は、他の送信キー（Ctrl+Enterなど）を選択してください

### Q: 複数の送信キーを同時に設定できますか？

A: いいえ。現在のバージョンでは、1つの送信キーのみを選択できます。これにより、キーバインディングの競合を防ぎ、操作を明確にしています。

### Q: ポップアップに表示されるURLが長すぎて見づらいです

A: 100文字を超えるURLは自動的に省略表示されます。省略されたURLをクリックすると、全体を表示できます。再度クリックすると省略表示に戻ります。

### Q: URL表示の省略文字数を変更できますか？

A: 現在のバージョンでは、100文字で固定されています。将来のバージョンでカスタマイズ可能にすることを検討しています。

### Q: URLをコピーしたいのですが？

A: 現在のバージョンでは、URLテキストを選択してコピーできます。将来のバージョンでワンクリックコピー機能の追加を検討しています。

## プライバシーポリシー

本拡張機能のプライバシーポリシーは以下で確認できます：

- [日本語版](store-assets/privacy-policy/privacy-policy-ja.md)
- [English Version](store-assets/privacy-policy/privacy-policy-en.md)

プライバシーポリシーの公開方法については、[公開ガイド](store-assets/privacy-policy/PUBLISHING.md)を参照してください。

## ライセンス

MIT License

Copyright (c) 2024 Chat Enter Key Control

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 貢献

バグ報告や機能リクエストは、GitHubのIssuesでお願いします。

プルリクエストも歓迎します！貢献方法については、上記の「開発」セクションを参照してください。

## サポート

問題が発生した場合は、以下のリソースを参照してください：

- [トラブルシューティングガイド](docs/troubleshooting.md)
- [対応サイトリスト](docs/supported-sites.md)
- [ポップアップUI使用ガイド](docs/popup-ui-usage.md)
- [送信ボタン互換性](docs/send-button-compatibility.md)
- [統合テストガイド](docs/integration-testing-guide.md)
- [URL表示機能の統合テスト](docs/url-display-integration-test.md)
- [URL表示機能のテストサマリー](docs/url-display-test-summary.md)

## 謝辞

このプロジェクトは、日本語入力時のEnterキー誤送信問題を解決するために開発されました。

仕様駆動開発（Spec-Driven Development）とプロパティベーステスト（Property-Based Testing）を採用し、高品質なソフトウェアの実現を目指しています。
