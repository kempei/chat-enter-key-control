# 設計書

## 概要

chat-enter-key-control は、Webベースのチャットアプリケーションにおいて、Enterキーの動作を制御するChrome拡張機能です。日本語入力（IME）使用時の漢字変換確定でEnterキーを押した際に誤ってメッセージが送信されてしまう問題を解決します。

主な機能：
- IME入力中のEnterキー押下時に送信を防止
- カスタマイズ可能な送信キー（Ctrl+Enter、Alt+Enter、Cmd+Enter、Opt+Enter、Shift+Enter、Enterから1つを選択）
- デフォルトの送信キーはCmd+Enter
- URLパターンによる対象サイトの管理
- テキスト入力フィールドの自動検出
- 設定の永続化

## アーキテクチャ

Chrome拡張機能は以下のコンポーネントで構成されます：

```
┌─────────────────────────────────────────────────────────────┐
│                        Background Script                      │
│  - URL pattern management                                     │
│  - Storage operations                                         │
│  - Icon state management                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Message passing
                              │
┌─────────────────────────────────────────────────────────────┐
│                        Content Script                         │
│  - Text field detection (MutationObserver)                   │
│  - Keyboard event interception                               │
│  - IME composition state tracking                            │
│  - Event handler injection                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ DOM manipulation
                              │
┌─────────────────────────────────────────────────────────────┐
│                        Target Web Page                        │
│  - Chat application                                          │
│  - Text input fields                                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        Popup UI                              │
│  - URL pattern list                                          │
│  - Add/Remove/Toggle controls                                │
│  - Current page status                                       │
│  - Quick domain toggle                                       │
└─────────────────────────────────────────────────────────────┘
```

## コンポーネントとインターフェース

### 1. Manifest (manifest.json)

Chrome拡張機能の設定ファイル。Manifest V3を使用します。

```json
{
  "manifest_version": 3,
  "name": "Chat Enter Key Control",
  "version": "1.0.0",
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "run_at": "document_idle"
  }],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  }
}
```

### 2. Background Script (background.js)

バックグラウンドで動作し、ストレージ管理とアイコン状態を制御します。

**主要な機能:**
- URLパターンの保存・読み込み
- アクティブなタブのURL確認
- 拡張機能アイコンの状態更新

**インターフェース:**
```typescript
interface URLPattern {
  id: string;
  pattern: string;
  enabled: boolean;
  createdAt: number;
}

type SendKeyOption = 'ctrl' | 'alt' | 'cmd' | 'opt' | 'shift' | 'none';

interface SendKeyConfig {
  modifier: SendKeyOption;
}

interface StorageData {
  patterns: URLPattern[];
  sendKeyConfig?: SendKeyConfig;
}

// Message types
type MessageType = 
  | { type: 'GET_PATTERNS' }
  | { type: 'ADD_PATTERN', pattern: string }
  | { type: 'REMOVE_PATTERN', id: string }
  | { type: 'TOGGLE_PATTERN', id: string }
  | { type: 'CHECK_CURRENT_URL', url: string }
  | { type: 'GET_SEND_KEY_CONFIG' }
  | { type: 'SET_SEND_KEY_CONFIG', config: SendKeyConfig };
```

### 3. Content Script (content.js)

対象ページに注入され、キーボードイベントを制御します。

**主要な機能:**
- テキスト入力フィールドの検出（textarea、input[type="text"]、contenteditable要素）
- MutationObserverによる動的要素の監視
- キーボードイベントのインターセプト
- IME composition状態の追跡

**インターフェース:**
```typescript
interface KeyboardEventHandler {
  handleKeyDown(event: KeyboardEvent): void;
}

interface FieldDetector {
  detectFields(): HTMLElement[];
  observeNewFields(callback: (element: HTMLElement) => void): void;
  cleanupField(element: HTMLElement): void;
}
```

### 4. Popup UI (popup.html, popup.js)

ユーザーが設定を管理するためのポップアップインターフェース。

**主要な機能:**
- URLパターンのリスト表示
- パターンの追加・削除・トグル
- 現在のページのマッチング状態表示
- 現在のドメインの簡易トグル
- 送信キーの選択UI（ドロップダウン形式）
- 選択可能な送信キー: Ctrl+Enter、Alt+Enter、Cmd+Enter、Opt+Enter、Shift+Enter、Enter

## データモデル

### URLPattern

```typescript
interface URLPattern {
  id: string;              // ユニークID（UUID）
  pattern: string;         // URLマッチングパターン（例: "*://chat.example.com/*"）
  enabled: boolean;        // 有効/無効フラグ
  createdAt: number;       // 作成日時（Unix timestamp）
}
```

### SendKeyConfig

```typescript
type SendKeyOption = 'ctrl' | 'alt' | 'cmd' | 'opt' | 'shift' | 'none';

interface SendKeyConfig {
  modifier: SendKeyOption;  // 送信キーの修飾キー（'none'はEnterのみ）
}
```

### StorageData

```typescript
interface StorageData {
  patterns: URLPattern[];
  sendKeyConfig?: SendKeyConfig;  // 未設定の場合はデフォルト（Cmd+Enter）を使用
}
```

### FieldRegistry

```typescript
interface FieldRegistry {
  fields: Map<HTMLElement, EventListener>;  // 登録されたフィールドとkeydownリスナー
}
```

## 正確性プロパティ

*プロパティとは、システムのすべての有効な実行において真であるべき特性や動作のことです。本質的には、システムが何をすべきかについての形式的な記述です。プロパティは、人間が読める仕様と機械で検証可能な正確性の保証との橋渡しとなります。*

### プロパティ 1: IME入力中のEnter単独押下は送信を防止する

*任意の* テキスト入力フィールドとIME composition状態において、Enterキーを単独で押下した場合、送信アクションは発火せず、テキスト内容は変更されない
**検証対象: 要件 1.1, 1.2, 1.3**

### プロパティ 2: 通常のEnter押下は改行を挿入する

*任意の* テキスト入力フィールドとテキスト内容において、IME入力中でない状態でEnterキーを押下した場合、改行が挿入され、送信アクションは発火しない
**検証対象: 要件 1.4**

### プロパティ 3: 設定された送信キーは送信アクションを発火する

*任意の* テキスト入力フィールドと設定された送信キーにおいて、その送信キーを押下した場合、送信アクションが発火する
**検証対象: 要件 2.1, 9.3**

### プロパティ 19: 設定と異なる修飾キーは改行を挿入する

*任意の* テキスト入力フィールドと送信キー設定において、設定と異なる修飾キー+Enterを押下した場合、改行が挿入され送信アクションは発火しない
**検証対象: 要件 2.2, 9.4**

### プロパティ 20: 送信キー設定のラウンドトリップ

*任意の* 送信キー設定について、保存してから読み込んだ場合、同じ設定が取得できる
**検証対象: 要件 9.7, 9.8**

### プロパティ 21: Enterのみ設定時のIME保護

*任意の* テキスト入力フィールドにおいて、送信キーが「Enterのみ」に設定されている場合でも、IME入力中のEnter押下では送信アクションは発火しない
**検証対象: 要件 9.6**

### プロパティ 4: URLパターンのラウンドトリップ

*任意の* URLパターンについて、追加してから読み込んだ場合、同じパターンが取得できる
**検証対象: 要件 3.2, 6.1, 6.2**

### プロパティ 5: URLパターンの削除は状態を変更する

*任意の* URLパターンリストとパターンIDについて、パターンを削除した場合、そのパターンはリストに存在しなくなる
**検証対象: 要件 3.3**

### プロパティ 6: URLパターンのトグルは状態を反転する

*任意の* URLパターンについて、トグルを実行した場合、enabled状態が反転する
**検証対象: 要件 3.4**

### プロパティ 7: マッチするURLパターンでスクリプトが注入される

*任意の* URLとアクティブなURLパターンリストについて、URLがいずれかのパターンにマッチする場合、コンテンツスクリプトが注入される
**検証対象: 要件 3.5**

### プロパティ 8: すべてのテキスト入力フィールドが検出される

*任意の* DOM構造において、すべてのテキスト入力フィールド（textarea、input[type="text"]、contenteditable要素）が検出され、Enter key controlが適用される
**検証対象: 要件 4.1, 4.4, 4.5**

### プロパティ 9: フィールド削除時にリスナーがクリーンアップされる

*任意の* 登録されたテキスト入力フィールドについて、そのフィールドがDOMから削除された場合、関連するイベントリスナーがクリーンアップされる
**検証対象: 要件 4.3**

### プロパティ 10: 送信ボタンのクリックは妨げられない

*任意の* 送信ボタンとクリックイベントについて、ボタンをクリックした場合、送信アクションは正常に実行される
**検証対象: 要件 5.1**

### プロパティ 11: 修飾キーなしのEnterイベントは伝播しない

*任意の* テキスト入力フィールドとEnterキーイベントについて、修飾キーが押されていない場合、イベントはアプリケーションのリスナーに伝播しない
**検証対象: 要件 5.3**

### プロパティ 12: 修飾キー付きイベントは伝播する

*任意の* テキスト入力フィールドと修飾キー付きキーボードイベントについて、イベントはアプリケーションのリスナーに伝播する
**検証対象: 要件 5.4**

### プロパティ 13: 設定変更は即座に永続化される

*任意の* URLパターンの変更（追加、削除、トグル）について、変更は即座にChrome storageに保存される
**検証対象: 要件 6.3**

### プロパティ 14: 設定のエクスポートはすべてのパターンを含む

*任意の* URLパターンリストについて、エクスポートされたJSONファイルにはすべてのパターンが含まれる
**検証対象: 要件 6.5**

### プロパティ 15: タブ間の状態は独立している

*任意の* 複数のタブについて、各タブのcomposition状態とfield registryは互いに影響しない
**検証対象: 要件 7.4**

### プロパティ 16: アクティブ状態に応じたアイコン表示

*任意の* ページURLとURLパターンリストについて、URLがアクティブなパターンにマッチする場合はアクティブアイコンが、マッチしない場合は非アクティブアイコンが表示される
**検証対象: 要件 8.1, 8.2**

### プロパティ 17: ポップアップは現在のページ状態を表示する

*任意の* 現在のページURLとURLパターンリストについて、ポップアップを開いた場合、URLがパターンにマッチするかどうかの情報が表示される
**検証対象: 要件 8.3, 8.4**

### プロパティ 18: ポップアップからドメインをトグルできる

*任意の* 現在のドメインについて、ポップアップのトグルを使用してそのドメインの有効/無効を切り替えられる
**検証対象: 要件 8.5**

## エラーハンドリング

### ストレージエラー

- Chrome storage APIの失敗時には、ユーザーにエラーメッセージを表示
- フォールバック: メモリ内の一時的な設定を使用
- エラーログをconsoleに出力

### DOM操作エラー

- テキストフィールドが削除された場合、イベントリスナーを安全にクリーンアップ
- 無効な要素への操作を試みた場合、エラーをキャッチして無視

### イベント処理エラー

- キーボードイベントの処理中にエラーが発生した場合、デフォルトの動作を許可
- エラーログをconsoleに出力

### URLパターンマッチングエラー

- 無効なパターンが指定された場合、エラーメッセージを表示
- パターンの検証を追加（正規表現の妥当性チェック）

## テスト戦略

### ユニットテスト

以下の機能に対してユニットテストを実装します：

1. **URLパターンマッチング**
   - 特定のURLパターンが正しくマッチするか
   - ワイルドカードパターンの動作
   - エッジケース（空文字列、特殊文字など）

2. **ストレージ操作**
   - パターンの保存と読み込み
   - エラーハンドリング

3. **イベントハンドラ**
   - 特定のキーボードイベントの処理
   - IME composition状態の追跡

### プロパティベーステスト

プロパティベーステストには **fast-check**（JavaScript/TypeScript用）を使用します。各テストは最低100回の反復を実行します。

各プロパティベーステストには、設計書の正確性プロパティを参照するコメントを付けます：
- フォーマット: `// Feature: chat-enter-key-control, Property {番号}: {プロパティテキスト}`

実装するプロパティベーステスト：

1. **プロパティ 1-3**: キーボードイベント処理
   - ランダムなテキスト内容、カーソル位置、IME状態を生成
   - Enterキーと修飾キーの組み合わせをテスト
   - 送信アクションの発火と改行挿入を検証

2. **プロパティ 4-7**: URLパターン管理
   - ランダムなURLパターンを生成
   - 追加、削除、トグル、マッチング操作をテスト
   - ストレージのラウンドトリップを検証

3. **プロパティ 8-9**: フィールド検出とクリーンアップ
   - ランダムなDOM構造を生成
   - すべてのフィールドタイプの検出を検証
   - リスナーのクリーンアップを検証

4. **プロパティ 10-12**: イベント伝播
   - ランダムなイベントとリスナーを生成
   - イベント伝播の制御を検証

5. **プロパティ 13-14**: 設定の永続化
   - ランダムな設定変更を生成
   - 即座の保存とエクスポートを検証

6. **プロパティ 15-18**: UI状態管理
   - ランダムなタブ状態とURLを生成
   - アイコン表示とポップアップ機能を検証

### 統合テスト

実際のChrome環境でのテスト：

1. **実際のチャットアプリケーションでのテスト**
   - ChatGPT、Slack、Discord などの実際のサイトで動作確認
   - 日本語入力での動作確認

2. **ブラウザ再起動後の設定復元**
   - 設定を保存してブラウザを再起動
   - 設定が正しく復元されることを確認

3. **複数タブでの動作**
   - 複数のタブで同時に拡張機能を使用
   - タブ間の独立性を確認

### パフォーマンステスト

1. **初期化時間**: 100ms以内
2. **イベント処理時間**: 10ms以内
3. **多数のフィールド**: 100個のフィールドでもUIラグなし

## 実装の詳細

### IME Composition状態の追跡

KeyboardEventの`isComposing`プロパティを使用することで、compositionイベントの追跡は不要です。

```typescript
// isComposingプロパティで直接判定可能
element.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.isComposing) {
    // IME入力中でない場合の処理
  }
});
```

この方法の利点：
- 状態管理が不要
- イベントリスナーが少なくて済む
- ブラウザネイティブの判定を使用するため信頼性が高い

### キーボードイベントのインターセプト

送信キー設定に基づいてEnterキーの動作を制御：
- `keydown`イベントでEnterキーをキャプチャ
- IME入力中（`isComposing`プロパティ）をチェック
- 設定された送信キーと一致するかで動作を分岐

```typescript
// 送信キー設定を取得（デフォルトはCmd+Enter）
const sendKeyConfig = await getSendKeyConfig(); // { modifier: 'cmd' }

element.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    // 設定された送信キーと一致するかチェック
    const matchesSendKey = checkSendKeyMatch(e, sendKeyConfig);
    
    if (!matchesSendKey) {
      // 送信キーと一致しない: 送信を防止
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      // IME入力中でない場合のみ改行を挿入
      if (!e.isComposing) {
        if ((e.target as HTMLElement).isContentEditable) {
          document.execCommand('insertLineBreak');
        } else {
          insertLineBreak(e.target as HTMLElement);
        }
      }
    } else {
      // 送信キーと一致: 送信動作を許可
      // ただしIME入力中は送信を防止
      if (e.isComposing) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
      // IME入力中でなければ何もせず、元のアプリケーションの動作に任せる
    }
  }
}, true); // useCapture = true で早期にキャッチ

function checkSendKeyMatch(e: KeyboardEvent, config: SendKeyConfig): boolean {
  switch (config.modifier) {
    case 'ctrl': return e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey;
    case 'alt': return e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey;
    case 'cmd': return e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey;
    case 'opt': return e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey; // MacではaltKey
    case 'shift': return e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey;
    case 'none': return !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey;
    default: return false;
  }
}
```

**重要な実装ポイント:**
1. `e.isComposing`プロパティを使用してIME入力中を判定
2. 送信キー設定と完全一致する場合のみ送信を許可（他の修飾キーが押されていないことも確認）
3. IME入力中は、送信キーが押されていても送信を防止
4. `stopImmediatePropagation()`で他のリスナーへの伝播を完全にブロック
5. contenteditable要素には`document.execCommand('insertLineBreak')`を使用

### テキストフィールドの検出

```typescript
const selectors = [
  'textarea',
  'input[type="text"]',
  '[contenteditable="true"]',
  '[contenteditable=""]'
];

function detectFields(): HTMLElement[] {
  return Array.from(document.querySelectorAll(selectors.join(',')));
}

// MutationObserverで動的要素を監視
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node instanceof HTMLElement) {
        if (node.matches(selectors.join(','))) {
          attachHandlers(node);
        }
        // 子要素もチェック
        const fields = node.querySelectorAll(selectors.join(','));
        fields.forEach(field => attachHandlers(field as HTMLElement));
      }
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
```

### URLパターンマッチング

Chrome拡張機能の標準的なマッチパターンを使用：
- `*://example.com/*` - example.comのすべてのページ
- `*://*.example.com/*` - example.comのすべてのサブドメイン
- `<all_urls>` - すべてのURL

```typescript
function matchesPattern(url: string, pattern: string): boolean {
  const regex = patternToRegex(pattern);
  return regex.test(url);
}

function patternToRegex(pattern: string): RegExp {
  // Chrome match patternを正規表現に変換
  let regex = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '\\?');
  return new RegExp(`^${regex}$`);
}
```

## 技術的制約

### 対象範囲の制限

本システムは、Chrome拡張機能のセキュリティモデルにより、以下の制約があります：

#### 対象となるページ

- **通常のWebページ**: `http://`、`https://` スキームのページ
- **Webページ内のテキストフィールド**: textarea、input[type="text"]、contenteditable要素

#### 対象外となるページ

以下のコンテキストでは、Content Scriptを注入できないため、本システムの機能が適用されません：

1. **他の拡張機能のUI**
   - Chrome Side Panel APIを使用したサイドパネル（例：Amazon Quick Suite）
   - 拡張機能のポップアップウィンドウ
   - 拡張機能の設定ページ（`chrome-extension://` スキーム）

2. **特殊なChromeページ**
   - `chrome://` スキームのページ（設定、履歴など）
   - `chrome-extension://` スキームのページ

#### 制約の技術的背景

Chrome拡張機能のセキュリティモデルでは、以下の理由により制約が存在します：

1. **拡張機能間の分離**: 各拡張機能は独立したコンテキストで動作し、互いにアクセスできません
2. **Content Script注入の制限**: `manifest.json`の`content_scripts.matches`は、`http://`と`https://`スキームのみをサポートします
3. **セキュリティポリシー**: 他の拡張機能のDOMやイベントにアクセスすることは、セキュリティ上の理由で禁止されています

#### 実装への影響

- **フィールド検出**: `content.js`は通常のWebページ上のテキストフィールドのみを検出します
- **イベントインターセプト**: 他の拡張機能のUIで発生するキーボードイベントはキャプチャできません
- **URLパターンマッチング**: `chrome-extension://`スキームのURLはマッチング対象外です

#### ユーザーへの案内

ドキュメントやREADMEで、以下の点をユーザーに明示する必要があります：

- 本拡張機能は通常のWebページ上でのみ動作します
- 他の拡張機能のサイドパネルやポップアップ内では動作しません
- 該当する場合は、対象拡張機能の開発者に機能追加を依頼することを推奨します

## セキュリティ考慮事項

1. **Content Security Policy (CSP)**: inline scriptを使用せず、外部ファイルのみを使用
2. **権限の最小化**: 必要最小限の権限のみを要求
3. **XSS対策**: ユーザー入力を適切にサニタイズ
4. **イベントリスナーの分離**: 既存のページのイベントリスナーと干渉しないようにする

## 今後の拡張可能性

1. **複数修飾キーの組み合わせ**: Ctrl+Shift+Enterなど、複数の修飾キーの組み合わせをサポート
2. **フィールドセレクタのカスタマイズ**: サイトごとに異なるセレクタを指定可能に
3. **統計情報**: 誤送信を防いだ回数などの統計を表示
4. **同期**: Chrome syncを使用して複数デバイス間で設定を同期
