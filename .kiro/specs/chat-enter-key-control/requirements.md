# 要件定義書

## はじめに

本システムは、Webベースのチャットアプリケーションにおいて、Enterキーの動作を制御するChrome拡張機能です。日本語入力時の漢字変換確定でEnterキーを押した際に誤ってメッセージが送信されてしまう問題を解決し、ユーザーが意図的にキーボードショートカット（Ctrl+Enter、Alt+Enter、Cmd+Enter、Opt+Enter）を使用した場合のみメッセージを送信できるようにします。

## 用語集

- **System**: chat-enter-key-control Chrome拡張機能
- **User**: Chrome拡張機能を使用する人
- **Chat Application**: テキストボックスを持つWebベースのチャットアプリケーション
- **Text Input Field**: チャットメッセージを入力するテキストボックスまたはテキストエリア
- **IME**: Input Method Editor（日本語入力システムなど）
- **Composition Event**: IMEによる文字変換中に発生するブラウザイベント
- **Send Action**: チャットメッセージを送信する動作
- **Modifier Key**: Ctrl、Alt、Cmd（Command）、Opt（Option）、Shiftなどの修飾キー
- **Send Key Configuration**: ユーザーが選択した、メッセージ送信をトリガーする修飾キー+Enterの組み合わせ

## 技術的制約

本システムには以下の技術的制約があります：

### 対象範囲

- **対象**: 通常のWebページ（`http://`、`https://`スキーム）上のテキスト入力フィールド
- **対象外**: 他のChrome拡張機能が提供するUI（ポップアップ、サイドパネルなど）

### 制約の理由

Chrome拡張機能のセキュリティモデルにより、以下の制約があります：

1. **他の拡張機能のコンテキストへのアクセス不可**: 他の拡張機能のポップアップやサイドパネル（Chrome Side Panel API使用）にContent Scriptを注入できません
2. **chrome-extension:// スキームへの制限**: `chrome-extension://` スキームのページにはContent Scriptを注入できません
3. **拡張機能間の分離**: セキュリティ上の理由により、拡張機能は互いに独立したコンテキストで動作します

### 影響を受けるユースケース

以下のようなケースでは、本システムの機能が適用されません：

- Amazon Quick SuiteなどのChrome Side Panel APIを使用した拡張機能のサイドパネル内のテキストフィールド
- 他の拡張機能のポップアップウィンドウ内のテキストフィールド
- 拡張機能の設定ページ（`chrome-extension://` スキーム）内のテキストフィールド

### 回避策

上記の制約により影響を受ける場合、以下の対応を検討してください：

1. **対象拡張機能の開発者に機能追加を依頼**: 該当する拡張機能の開発者に、IME対応のEnterキー制御機能の追加を依頼する
2. **修飾キーの使用**: サイドパネルやポップアップ内では、修飾キー（Ctrl+Enter、Cmd+Enterなど）を使用してメッセージを送信する

## 要件

### 要件 1

**ユーザーストーリー:** ユーザーとして、日本語入力時にEnterキーで漢字変換を確定してもメッセージが送信されないようにしたい。これにより、意図しないメッセージ送信を防ぐことができる。

#### 受入基準

1. WHEN User presses Enter key during IME composition, THEN THE System SHALL prevent the Send Action from being triggered
2. WHEN User presses Enter key during IME composition, THEN THE System SHALL not modify the Text Input Field content
3. WHEN User completes IME composition with Enter key, THEN THE System SHALL maintain the current text content without triggering Send Action
4. WHEN User presses Enter key outside of IME composition, THEN THE System SHALL insert a line break into the Text Input Field
5. WHEN User presses Enter key with any Modifier Key during IME composition, THEN THE System SHALL prevent the Send Action from being triggered

### 要件 2

**ユーザーストーリー:** ユーザーとして、設定した送信キーでメッセージを送信したい。これにより、意図的な操作でのみメッセージを送信できる。

#### 受入基準

1. WHEN User presses the configured Send Key combination in the Text Input Field, THEN THE System SHALL trigger the Send Action
2. WHEN User presses Enter with a non-configured Modifier Key in the Text Input Field, THEN THE System SHALL insert a line break instead of triggering Send Action
3. WHEN User presses the configured Send Key combination during IME composition, THEN THE System SHALL complete the composition and trigger the Send Action
4. WHEN the default configuration is used, THEN THE System SHALL trigger Send Action with Cmd+Enter
5. WHEN User has not configured a Send Key, THEN THE System SHALL use Cmd+Enter as the default Send Key

### 要件 3

**ユーザーストーリー:** ユーザーとして、拡張機能を特定のチャットアプリケーションに対して有効化または無効化したい。これにより、必要なサイトでのみ機能を使用できる。

#### 受入基準

1. WHEN User opens the extension popup, THEN THE System SHALL display a list of configured Chat Applications
2. WHEN User adds a new URL pattern, THEN THE System SHALL store the pattern and apply the Enter key control to matching pages
3. WHEN User removes a URL pattern, THEN THE System SHALL delete the pattern and stop applying the Enter key control to previously matching pages
4. WHEN User toggles a URL pattern on or off, THEN THE System SHALL update the active state and apply or remove the Enter key control accordingly
5. WHEN a page loads that matches an active URL pattern, THEN THE System SHALL automatically inject the Enter key control script

### 要件 4

**ユーザーストーリー:** ユーザーとして、拡張機能がさまざまなチャットアプリケーションのテキスト入力フィールドを自動的に検出してほしい。これにより、手動設定なしで機能を使用できる。

#### 受入基準

1. WHEN a Chat Application page loads, THEN THE System SHALL identify all Text Input Fields using common selectors
2. WHEN new Text Input Fields are dynamically added to the page, THEN THE System SHALL detect and apply Enter key control to them within 500 milliseconds
3. WHEN a Text Input Field is removed from the page, THEN THE System SHALL clean up associated event listeners
4. WHEN multiple Text Input Fields exist on a page, THEN THE System SHALL apply Enter key control to all identified fields
5. WHEN a Text Input Field uses contenteditable attribute, THEN THE System SHALL apply Enter key control to it

### 要件 5

**ユーザーストーリー:** ユーザーとして、既存のチャットアプリケーションの送信ボタンが引き続き機能することを期待する。これにより、マウスクリックでの送信も可能である。

#### 受入基準

1. WHEN User clicks a send button in the Chat Application, THEN THE System SHALL allow the Send Action to proceed normally
2. WHEN the Chat Application uses custom JavaScript for sending messages, THEN THE System SHALL not interfere with that functionality
3. WHEN the Chat Application listens for Enter key events, THEN THE System SHALL prevent those listeners from receiving Enter key events without Modifier Keys
4. WHEN the Chat Application listens for Modifier Key combinations, THEN THE System SHALL allow those events to propagate to the application

### 要件 6

**ユーザーストーリー:** ユーザーとして、拡張機能の設定を保存して、ブラウザを再起動しても設定が維持されることを期待する。

#### 受入基準

1. WHEN User configures URL patterns, THEN THE System SHALL persist the configuration to Chrome storage
2. WHEN User reopens Chrome browser, THEN THE System SHALL restore all previously configured URL patterns
3. WHEN User modifies a URL pattern, THEN THE System SHALL update the stored configuration immediately
4. WHEN storage operations fail, THEN THE System SHALL display an error message to the User
5. WHEN User exports settings, THEN THE System SHALL generate a JSON file containing all URL patterns

### 要件 7

**ユーザーストーリー:** 開発者として、拡張機能がページのパフォーマンスに悪影響を与えないことを期待する。

#### 受入基準

1. WHEN the extension script runs, THEN THE System SHALL complete initialization within 100 milliseconds
2. WHEN monitoring for new Text Input Fields, THEN THE System SHALL use efficient DOM observation techniques
3. WHEN handling keyboard events, THEN THE System SHALL process events within 10 milliseconds
4. WHEN multiple tabs have the extension active, THEN THE System SHALL maintain independent state for each tab
5. WHEN a page has many Text Input Fields, THEN THE System SHALL handle all fields without causing UI lag

### 要件 8

**ユーザーストーリー:** ユーザーとして、拡張機能がどのサイトで動作しているかを視覚的に確認したい。

#### 受入基準

1. WHEN the extension is active on a page, THEN THE System SHALL display an active icon in the browser toolbar
2. WHEN the extension is inactive on a page, THEN THE System SHALL display an inactive icon in the browser toolbar
3. WHEN User clicks the extension icon, THEN THE System SHALL open a popup showing the current page status
4. WHEN the popup displays, THEN THE System SHALL show whether the current page matches any configured patterns
5. WHEN the popup displays, THEN THE System SHALL provide a quick toggle to enable or disable the extension for the current domain

### 要件 9

**ユーザーストーリー:** ユーザーとして、メッセージを送信するためのキーボードショートカットを1つ選択してカスタマイズしたい。これにより、自分の好みや習慣に合わせた操作ができる。

#### 受入基準

1. WHEN User opens the extension settings, THEN THE System SHALL display a list of available send key options (Ctrl+Enter, Alt+Enter, Cmd+Enter, Opt+Enter, Shift+Enter, Enter)
2. WHEN User selects one send key option from the list, THEN THE System SHALL update the send key configuration to use only that option
3. WHEN User presses the configured send key combination in the Text Input Field, THEN THE System SHALL trigger the Send Action
4. WHEN User presses Enter with a different modifier key combination, THEN THE System SHALL insert a line break instead of triggering Send Action
5. WHEN User selects "Enter" as the send key and presses Enter without modifier keys outside of IME composition, THEN THE System SHALL trigger the Send Action
6. WHEN User selects "Enter" as the send key and presses Enter during IME composition, THEN THE System SHALL prevent the Send Action and allow IME to complete composition
7. WHEN User saves the send key configuration, THEN THE System SHALL persist the configuration to Chrome storage
8. WHEN User reopens Chrome browser, THEN THE System SHALL restore the previously configured send key option
9. WHEN no custom send key is configured, THEN THE System SHALL use Cmd+Enter as the default send key
