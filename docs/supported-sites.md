# 対応サイトリスト

このドキュメントでは、Chat Enter Key Control拡張機能が動作確認されているサイトと、推奨されるURLパターンを記載しています。

## 動作確認済みサイト

### チャットアプリケーション

#### ChatGPT

- **URL**: https://chat.openai.com/, https://chatgpt.com/
- **推奨パターン**: 
  - `*://chat.openai.com/*`
  - `*://chatgpt.com/*`
- **フィールドタイプ**: `<textarea>`
- **動作状況**: ✅ 完全動作
- **備考**: メインのテキスト入力エリアで動作します

#### Slack

- **URL**: https://*.slack.com/
- **推奨パターン**: `*://*.slack.com/*`
- **フィールドタイプ**: `[contenteditable]`
- **動作状況**: ✅ 完全動作
- **備考**: ワークスペースのサブドメインに対応するため、ワイルドカードを使用

#### Discord

- **URL**: https://discord.com/
- **推奨パターン**: `*://discord.com/*`
- **フィールドタイプ**: `[contenteditable]`
- **動作状況**: ✅ 完全動作
- **備考**: チャンネルのメッセージ入力欄で動作

#### Google Chat

- **URL**: https://chat.google.com/
- **推奨パターン**: `*://chat.google.com/*`
- **フィールドタイプ**: `[contenteditable]`
- **動作状況**: ✅ 完全動作
- **備考**: Google Workspaceのチャット機能

#### Microsoft Teams

- **URL**: https://teams.microsoft.com/
- **推奨パターン**: `*://teams.microsoft.com/*`
- **フィールドタイプ**: `[contenteditable]`
- **動作状況**: ✅ 完全動作
- **備考**: Webアプリ版で動作確認

### コラボレーションツール

#### Notion

- **URL**: https://*.notion.so/
- **推奨パターン**: `*://*.notion.so/*`
- **フィールドタイプ**: `[contenteditable]`
- **動作状況**: ✅ 完全動作
- **備考**: ページ編集、コメント入力で動作

#### GitHub

- **URL**: https://github.com/
- **推奨パターン**: `*://github.com/*`
- **フィールドタイプ**: `<textarea>`
- **動作状況**: ✅ 完全動作
- **備考**: Issue、PR、コメント入力欄で動作

#### GitLab

- **URL**: https://gitlab.com/
- **推奨パターン**: `*://gitlab.com/*`
- **フィールドタイプ**: `<textarea>`
- **動作状況**: ✅ 完全動作
- **備考**: Issue、MR、コメント入力欄で動作

### その他のサイト

#### Twitter / X

- **URL**: https://twitter.com/, https://x.com/
- **推奨パターン**: 
  - `*://twitter.com/*`
  - `*://x.com/*`
- **フィールドタイプ**: `[contenteditable]`
- **動作状況**: ✅ 完全動作
- **備考**: ツイート作成、返信入力で動作

#### Reddit

- **URL**: https://www.reddit.com/
- **推奨パターン**: `*://www.reddit.com/*`
- **フィールドタイプ**: `<textarea>`
- **動作状況**: ✅ 完全動作
- **備考**: コメント入力、投稿作成で動作

## URLパターンの書き方

### 基本的なパターン

```
*://example.com/*
```

- `*://` - HTTPとHTTPSの両方にマッチ
- `example.com` - ドメイン名
- `/*` - すべてのパス

### サブドメインを含む

```
*://*.example.com/*
```

- `*.` - すべてのサブドメインにマッチ
- 例: `app.example.com`, `chat.example.com`

### 特定のパスのみ

```
*://example.com/chat/*
```

- `/chat/*` - `/chat/`配下のすべてのページにマッチ

### HTTPSのみ

```
https://example.com/*
```

- `https://` - HTTPSのみにマッチ（HTTPは除外）

## 対応フィールドタイプ

拡張機能は以下のHTML要素を自動的に検出します：

### textarea要素

```html
<textarea></textarea>
```

最も一般的なテキスト入力フィールド。多くのサイトで使用されています。

### input要素

```html
<input type="text">
```

単一行のテキスト入力フィールド。一部のチャットアプリで使用されています。

### contenteditable要素

```html
<div contenteditable="true"></div>
<div contenteditable=""></div>
```

リッチテキストエディタで使用される要素。Slack、Discord、Notionなどで使用されています。

## 動的に追加されるフィールド

拡張機能はMutationObserverを使用して、ページ読み込み後に動的に追加されるフィールドも自動的に検出します。

検出までの時間: 通常500ミリ秒以内

## 既知の制限事項

### 対象外のコンテキスト

以下のコンテキストでは、Chrome拡張機能のセキュリティモデルにより動作しません：

- **他の拡張機能のUI**
  - Chrome Side Panel APIを使用したサイドパネル
  - 拡張機能のポップアップウィンドウ
  - 拡張機能の設定ページ
- **特殊なChromeページ**
  - `chrome://` スキームのページ
  - `chrome-extension://` スキームのページ

詳細は [README.md](../README.md#技術的制約) を参照してください。

## 統合テスト

実際のサイトでの動作確認方法については、[統合テストガイド](integration-testing-guide.md)を参照してください。

このガイドには、各サイトでの詳細なテスト手順とチェックリストが含まれています。

## サイトの追加リクエスト

動作しないサイトや、推奨パターンの追加リクエストは、GitHubのIssuesで受け付けています。

リクエスト時には以下の情報を含めてください：

- サイトのURL
- 使用しているフィールドタイプ（textarea、input、contenteditableなど）
- 動作しない場合の症状
- ブラウザコンソールのエラーメッセージ（あれば）

## 一括設定用パターンリスト

よく使用されるサイトのパターンをまとめたリストです。コピーして使用できます：

```json
{
  "patterns": [
    {
      "pattern": "*://chat.openai.com/*",
      "enabled": true
    },
    {
      "pattern": "*://chatgpt.com/*",
      "enabled": true
    },
    {
      "pattern": "*://*.slack.com/*",
      "enabled": true
    },
    {
      "pattern": "*://discord.com/*",
      "enabled": true
    },
    {
      "pattern": "*://chat.google.com/*",
      "enabled": true
    },
    {
      "pattern": "*://teams.microsoft.com/*",
      "enabled": true
    },
    {
      "pattern": "*://*.notion.so/*",
      "enabled": true
    },
    {
      "pattern": "*://github.com/*",
      "enabled": true
    },
    {
      "pattern": "*://gitlab.com/*",
      "enabled": true
    },
    {
      "pattern": "*://twitter.com/*",
      "enabled": true
    },
    {
      "pattern": "*://x.com/*",
      "enabled": true
    },
    {
      "pattern": "*://www.reddit.com/*",
      "enabled": true
    }
  ]
}
```

このJSONファイルを保存して、ポップアップの「設定をインポート」機能で読み込むことができます。
