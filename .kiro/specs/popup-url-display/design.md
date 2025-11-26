# 設計書

## 概要

popup-url-display は、Chat Enter Key Control拡張機能のポップアップUIにおいて、長いURLを見やすく表示するための機能です。URLが100文字を超える場合、最初の100文字のみを表示し、残りを省略記号（...）で省略します。ユーザーはクリックすることで全体を展開・折りたたみできます。

主な機能：
- 100文字を超えるURLの自動省略
- クリックによる展開・折りたたみのトグル
- 展開可能であることを示す視覚的インジケーター
- 滑らかなトランジションアニメーション
- URL変更時の状態リセット

## アーキテクチャ

この機能は既存のpopup.jsとpopup.cssに統合されます：

```
┌─────────────────────────────────────────────────────────────┐
│                        Popup UI (popup.html)                  │
│  - .current-url 要素（URL表示領域）                           │
│  - .url-expand-indicator 要素（展開インジケーター）          │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ DOM操作
                              │
┌─────────────────────────────────────────────────────────────┐
│                        Popup Script (popup.js)                │
│  - updateCurrentPageStatus() 関数の拡張                      │
│  - URL省略ロジック                                           │
│  - クリックイベントハンドラ                                   │
│  - 状態管理（省略/展開）                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ スタイル適用
                              │
┌─────────────────────────────────────────────────────────────┐
│                        Popup Styles (popup.css)               │
│  - .current-url のスタイル拡張                               │
│  - .url-truncated クラス（省略状態）                         │
│  - .url-expanded クラス（展開状態）                          │
│  - トランジションアニメーション                               │
└─────────────────────────────────────────────────────────────┘
```

## コンポーネントとインターフェース

### 1. HTML構造 (popup.html)

既存の`.current-url`要素を拡張します：

```html
<div class="current-url" id="currentUrl" data-full-url="">
  <!-- URLテキスト -->
  <span class="url-text"></span>
  <!-- 展開インジケーター（長いURLの場合のみ表示） -->
  <span class="url-expand-indicator">▼</span>
</div>
```

### 2. JavaScript機能 (popup.js)

**主要な機能:**
- URL省略ロジック
- クリックイベントハンドラ
- 状態管理（省略/展開）

**インターフェース:**
```typescript
interface URLDisplayState {
  fullUrl: string;
  isTruncated: boolean;
  isExpanded: boolean;
}

/**
 * URLを省略形式で表示
 * @param {string} url - 表示するURL
 * @param {number} maxLength - 最大文字数（デフォルト: 100）
 */
function displayURL(url: string, maxLength: number = 100): void;

/**
 * URL表示のトグル（展開/折りたたみ）
 */
function toggleURLDisplay(): void;

/**
 * URL表示状態をリセット
 */
function resetURLDisplay(): void;
```

### 3. CSS スタイル (popup.css)

**主要なクラス:**
- `.current-url`: 基本スタイル
- `.current-url.clickable`: クリック可能な状態
- `.current-url.truncated`: 省略状態
- `.current-url.expanded`: 展開状態
- `.url-expand-indicator`: 展開インジケーター

## データモデル

### URLDisplayState

```typescript
interface URLDisplayState {
  fullUrl: string;        // 完全なURL
  isTruncated: boolean;   // URLが省略されているか（100文字超）
  isExpanded: boolean;    // 現在展開されているか
}
```

## 正確性プロパティ

*プロパティとは、システムのすべての有効な実行において真であるべき特性や動作のことです。本質的には、システムが何をすべきかについての形式的な記述です。プロパティは、人間が読める仕様と機械で検証可能な正確性の保証との橋渡しとなります。*

### プロパティ 1: 短いURLは全体表示される

*任意の* 100文字以下のURLについて、システムはURLを全体表示し、省略記号を表示しない
**検証対象: 要件 1.1**

### プロパティ 2: 長いURLは省略される

*任意の* 100文字を超えるURLについて、システムは最初の100文字を表示し、その後に「...」を追加する
**検証対象: 要件 1.2**

### プロパティ 3: 省略状態は視覚的に示される

*任意の* 省略状態のURLについて、システムは展開可能であることを示すインジケーターを表示する
**検証対象: 要件 1.3, 3.1**

### プロパティ 4: 長いURLはデフォルトで省略される

*任意の* 100文字を超えるURLについて、初期表示時はシステムは省略状態で表示する
**検証対象: 要件 1.4**

### プロパティ 5: URL変更時に状態がリセットされる

*任意の* URL変更について、展開状態から新しいURLに変更した場合、システムは省略状態にリセットする
**検証対象: 要件 1.5**

### プロパティ 6: 省略状態のクリックで展開される

*任意の* 省略状態のURL表示領域について、クリックした場合、システムはURLの全体を表示する
**検証対象: 要件 2.1**

### プロパティ 7: 展開状態のクリックで折りたたまれる

*任意の* 展開状態のURL表示領域について、クリックした場合、システムはURLを省略状態に戻す
**検証対象: 要件 2.2**

### プロパティ 8: クリック可能な要素はポインターカーソルを表示

*任意の* クリック可能なURL表示領域について、システムはカーソルをポインターに変更する
**検証対象: 要件 2.3**

### プロパティ 9: 展開状態は視覚的に示される

*任意の* 展開状態のURLについて、システムは折りたたみ可能であることを示すインジケーターを表示する
**検証対象: 要件 3.2**

### プロパティ 10: 短いURLはインジケーターを表示しない

*任意の* 100文字以下のURLについて、システムは展開/折りたたみのインジケーターを表示しない
**検証対象: 要件 3.3**

### プロパティ 11: ホバー時に視覚的フィードバックを提供

*任意の* クリック可能なURL表示領域について、ホバー時にシステムは視覚的なフィードバックを提供する
**検証対象: 要件 3.4**

## エラーハンドリング

### URL取得エラー

- URLが取得できない場合、エラーメッセージを表示
- 空のURLの場合、「URLが取得できません」と表示

### DOM操作エラー

- 要素が見つからない場合、エラーをキャッチして無視
- エラーログをconsoleに出力

## テスト戦略

### ユニットテスト

以下の機能に対してユニットテストを実装します：

1. **URL省略ロジック**
   - 100文字以下のURLが全体表示されるか
   - 100文字を超えるURLが正しく省略されるか
   - 省略記号が正しく追加されるか

2. **状態管理**
   - 展開/折りたたみのトグルが正しく動作するか
   - URL変更時に状態がリセットされるか

3. **DOM操作**
   - クラスの追加/削除が正しく行われるか
   - インジケーターの表示/非表示が正しく制御されるか

### プロパティベーステスト

プロパティベーステストには **fast-check**（JavaScript/TypeScript用）を使用します。各テストは最低100回の反復を実行します。

各プロパティベーステストには、設計書の正確性プロパティを参照するコメントを付けます：
- フォーマット: `// Feature: popup-url-display, Property {番号}: {プロパティテキスト}`

実装するプロパティベーステスト：

1. **プロパティ 1-2**: URL長による表示制御
   - ランダムな長さのURLを生成
   - 100文字を境界として正しく処理されるか検証

2. **プロパティ 3-4**: 初期表示状態
   - ランダムなURLで初期状態を検証
   - 省略状態とインジケーターの表示を確認

3. **プロパティ 5**: 状態リセット
   - URL変更時の状態遷移を検証

4. **プロパティ 6-7**: トグル動作
   - クリックによる展開/折りたたみを検証
   - ラウンドトリップ的にテスト

5. **プロパティ 8-11**: UI表示とインタラクション
   - カーソルスタイル、インジケーター、ホバー効果を検証

### 統合テスト

実際のChrome環境でのテスト：

1. **実際のWebサイトでのテスト**
   - 様々な長さのURLを持つサイトで動作確認
   - 展開/折りたたみの動作確認

2. **UI/UXテスト**
   - トランジションアニメーションの滑らかさ
   - インジケーターの視認性

## 実装の詳細

### URL省略ロジック

```javascript
/**
 * URLを省略形式で表示
 * @param {string} url - 表示するURL
 * @param {number} maxLength - 最大文字数（デフォルト: 100）
 */
function displayURL(url, maxLength = 100) {
  const urlElement = document.getElementById('currentUrl');
  const urlTextElement = urlElement.querySelector('.url-text');
  const indicatorElement = urlElement.querySelector('.url-expand-indicator');
  
  if (!url) {
    urlTextElement.textContent = 'URLが取得できません';
    urlElement.classList.remove('clickable', 'truncated', 'expanded');
    indicatorElement.style.display = 'none';
    return;
  }
  
  // 完全なURLをdata属性に保存
  urlElement.dataset.fullUrl = url;
  
  if (url.length <= maxLength) {
    // 短いURL: 全体表示、インジケーター非表示
    urlTextElement.textContent = url;
    urlElement.classList.remove('clickable', 'truncated', 'expanded');
    indicatorElement.style.display = 'none';
  } else {
    // 長いURL: 省略表示、インジケーター表示
    urlTextElement.textContent = url.substring(0, maxLength) + '...';
    urlElement.classList.add('clickable', 'truncated');
    urlElement.classList.remove('expanded');
    indicatorElement.style.display = 'inline';
    indicatorElement.textContent = '▼'; // 展開可能を示す
  }
}
```

### トグル機能

```javascript
/**
 * URL表示のトグル（展開/折りたたみ）
 */
function toggleURLDisplay() {
  const urlElement = document.getElementById('currentUrl');
  const urlTextElement = urlElement.querySelector('.url-text');
  const indicatorElement = urlElement.querySelector('.url-expand-indicator');
  const fullUrl = urlElement.dataset.fullUrl;
  
  if (!fullUrl || fullUrl.length <= 100) {
    return; // 短いURLはトグルしない
  }
  
  if (urlElement.classList.contains('expanded')) {
    // 折りたたみ
    urlTextElement.textContent = fullUrl.substring(0, 100) + '...';
    urlElement.classList.remove('expanded');
    urlElement.classList.add('truncated');
    indicatorElement.textContent = '▼';
  } else {
    // 展開
    urlTextElement.textContent = fullUrl;
    urlElement.classList.remove('truncated');
    urlElement.classList.add('expanded');
    indicatorElement.textContent = '▲';
  }
}
```

### イベントリスナー

```javascript
// URL表示領域のクリックイベント
const urlElement = document.getElementById('currentUrl');
urlElement.addEventListener('click', (e) => {
  if (urlElement.classList.contains('clickable')) {
    toggleURLDisplay();
  }
});
```

### CSSスタイル

```css
/* 基本スタイル */
.current-url {
  font-size: 12px;
  color: #5f6368;
  word-break: break-all;
  margin-bottom: 8px;
  transition: background-color 0.2s, color 0.2s;
}

/* クリック可能な状態 */
.current-url.clickable {
  cursor: pointer;
  user-select: none;
}

.current-url.clickable:hover {
  background-color: #f1f3f4;
  color: #202124;
  border-radius: 4px;
  padding: 4px;
  margin: -4px;
  margin-bottom: 4px;
}

/* 展開インジケーター */
.url-expand-indicator {
  display: none;
  margin-left: 4px;
  font-size: 10px;
  color: #1a73e8;
  transition: transform 0.2s;
}

/* トランジションアニメーション */
.url-text {
  transition: all 0.3s ease-in-out;
}
```

## 既存コードへの統合

### popup.js の updateCurrentPageStatus() 関数を拡張

```javascript
function updateCurrentPageStatus(tab, patterns) {
  // ... 既存のコード ...
  
  // URLを表示（新機能）
  displayURL(tab.url);
  
  // ... 既存のコード ...
}
```

### popup.js の初期化処理に追加

```javascript
// URL表示領域のクリックイベントリスナーを追加
const urlElement = document.getElementById('currentUrl');
if (urlElement) {
  urlElement.addEventListener('click', () => {
    if (urlElement.classList.contains('clickable')) {
      toggleURLDisplay();
    }
  });
}
```

## パフォーマンス考慮事項

1. **文字列操作**: substring()は効率的な操作
2. **DOM操作**: クラスの追加/削除は最小限に抑える
3. **トランジション**: CSS transitionを使用して滑らかなアニメーション

## アクセシビリティ

1. **キーボード操作**: Enterキーでもトグルできるようにする
2. **スクリーンリーダー**: aria-expanded属性を追加
3. **視覚的フィードバック**: ホバー時とフォーカス時のスタイル

## 今後の拡張可能性

1. **カスタマイズ可能な文字数**: ユーザーが省略する文字数を設定可能に
2. **コピー機能**: 完全なURLをクリップボードにコピーするボタン
3. **ツールチップ**: ホバー時に完全なURLをツールチップで表示
