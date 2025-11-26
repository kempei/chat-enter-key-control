// Content Script for Chat Enter Key Control

/**
 * テキスト入力フィールドを検出するためのセレクタ
 */
const FIELD_SELECTORS = [
  'textarea',
  'input[type="text"]',
  '[contenteditable="true"]',
  '[contenteditable=""]'
];

/**
 * フィールドレジストリ
 * 検出されたフィールドとそのイベントリスナーを管理
 */
class FieldRegistry {
  constructor() {
    // フィールド要素をキーとして、イベントリスナーを値として保持
    this.fields = new Map();
  }

  /**
   * フィールドを登録
   * @param {HTMLElement} element - 登録するフィールド要素
   * @param {EventListener} listener - 登録するイベントリスナー
   */
  register(element, listener) {
    if (!this.fields.has(element)) {
      this.fields.set(element, listener);
    }
  }

  /**
   * フィールドの登録を解除
   * @param {HTMLElement} element - 解除するフィールド要素
   */
  unregister(element) {
    try {
      const listener = this.fields.get(element);
      if (listener) {
        element.removeEventListener('keydown', listener, true);
        this.fields.delete(element);
      }
    } catch (error) {
      console.error('Chat Enter Key Control: イベントリスナーの削除中にエラーが発生しました', error);
      // エラーが発生してもMapからは削除する
      this.fields.delete(element);
    }
  }

  /**
   * フィールドが登録済みかチェック
   * @param {HTMLElement} element - チェックするフィールド要素
   * @returns {boolean} 登録済みの場合true
   */
  has(element) {
    return this.fields.has(element);
  }

  /**
   * すべてのフィールドをクリーンアップ
   */
  clear() {
    for (const [element, listener] of this.fields.entries()) {
      element.removeEventListener('keydown', listener, true);
    }
    this.fields.clear();
  }
}

/**
 * テキストフィールド検出器
 */
class FieldDetector {
  constructor() {
    this.registry = new FieldRegistry();
    this.observer = null;
  }

  /**
   * 現在のDOMからすべてのテキスト入力フィールドを検出
   * @returns {HTMLElement[]} 検出されたフィールドの配列
   */
  detectFields() {
    const selector = FIELD_SELECTORS.join(',');
    return Array.from(document.querySelectorAll(selector));
  }

  /**
   * 新しいフィールドが追加されたときのコールバックを設定し、監視を開始
   * @param {Function} callback - フィールドが検出されたときに呼ばれるコールバック関数
   */
  observeNewFields(callback) {
    try {
      // MutationObserverで動的に追加される要素を監視
      this.observer = new MutationObserver((mutations) => {
        try {
          for (const mutation of mutations) {
            // 追加されたノードをチェック
            for (const node of mutation.addedNodes) {
              if (node instanceof HTMLElement) {
                // ノード自体がフィールドかチェック
                if (this.isTextField(node)) {
                  callback(node);
                }
                // 子要素にフィールドがあるかチェック
                try {
                  const fields = node.querySelectorAll(FIELD_SELECTORS.join(','));
                  fields.forEach(field => callback(field));
                } catch (queryError) {
                  console.warn('Chat Enter Key Control: フィールド検索中にエラーが発生しました', queryError);
                }
              }
            }

            // 削除されたノードをチェックしてクリーンアップ
            for (const node of mutation.removedNodes) {
              if (node instanceof HTMLElement) {
                // ノード自体がフィールドかチェック
                if (this.isTextField(node)) {
                  this.cleanupField(node);
                }
                // 子要素にフィールドがあるかチェック
                try {
                  const fields = node.querySelectorAll(FIELD_SELECTORS.join(','));
                  fields.forEach(field => this.cleanupField(field));
                } catch (queryError) {
                  console.warn('Chat Enter Key Control: フィールド検索中にエラーが発生しました', queryError);
                }
              }
            }
          }
        } catch (mutationError) {
          console.error('Chat Enter Key Control: Mutation処理中にエラーが発生しました', mutationError);
        }
      });

      // body全体を監視（子要素の追加・削除を検知）
      if (document.body) {
        this.observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      } else {
        console.error('Chat Enter Key Control: document.bodyが存在しません');
      }
    } catch (error) {
      console.error('Chat Enter Key Control: MutationObserverの初期化中にエラーが発生しました', error);
    }
  }

  /**
   * 要素がテキストフィールドかどうかをチェック
   * @param {HTMLElement} element - チェックする要素
   * @returns {boolean} テキストフィールドの場合true
   */
  isTextField(element) {
    return element.matches(FIELD_SELECTORS.join(','));
  }

  /**
   * フィールドのクリーンアップ（イベントリスナーの削除）
   * @param {HTMLElement} element - クリーンアップするフィールド要素
   */
  cleanupField(element) {
    try {
      if (!element || !(element instanceof HTMLElement)) {
        console.warn('Chat Enter Key Control: 無効な要素のクリーンアップが試みられました');
        return;
      }
      this.registry.unregister(element);
    } catch (error) {
      console.error('Chat Enter Key Control: フィールドクリーンアップ中にエラーが発生しました', error);
    }
  }

  /**
   * 監視を停止
   */
  stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * すべてのフィールドをクリーンアップして監視を停止
   */
  cleanup() {
    this.stopObserving();
    this.registry.clear();
  }
}

/**
 * キーボードイベントハンドラ
 */
class KeyboardEventHandler {
  constructor() {
    // 送信キー設定をキャッシュ（デフォルトはCmd+Enter）
    this.sendKeyConfig = { modifier: 'cmd' };
    // 送信キー設定を取得
    this.loadSendKeyConfig();
  }

  /**
   * 送信キー設定を取得
   */
  async loadSendKeyConfig() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SEND_KEY_CONFIG' });
      if (response && response.config) {
        this.sendKeyConfig = response.config;
      }
    } catch (error) {
      console.warn('Chat Enter Key Control: 送信キー設定の取得に失敗しました。デフォルト設定を使用します。', error);
      // デフォルト設定を使用
      this.sendKeyConfig = { modifier: 'cmd' };
    }
  }

  /**
   * イベントが設定された送信キーと一致するかチェック
   * @param {KeyboardEvent} event - キーボードイベント
   * @param {Object} config - 送信キー設定
   * @returns {boolean} 送信キーと一致する場合true
   */
  checkSendKeyMatch(event, config) {
    if (!config || !config.modifier) {
      // 設定がない場合はデフォルト（Cmd+Enter）
      return event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey;
    }

    switch (config.modifier) {
      case 'ctrl':
        return event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey;
      case 'alt':
        return event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
      case 'cmd':
        return event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey;
      case 'opt':
        // MacではaltKeyがOptionキー
        return event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
      case 'shift':
        return event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey;
      case 'none':
        // Enterのみ（修飾キーなし）
        return !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey;
      default:
        return false;
    }
  }

  /**
   * テキストフィールドにkeydownイベントリスナーを追加
   * @param {HTMLElement} element - イベントリスナーを追加する要素
   * @returns {EventListener} 追加されたイベントリスナー
   */
  attachToField(element) {
    const listener = (event) => this.handleKeyDown(event);
    // useCaptureをtrueにして、早期にイベントをキャッチ
    element.addEventListener('keydown', listener, true);
    return listener;
  }

  /**
   * keydownイベントを処理
   * @param {KeyboardEvent} event - キーボードイベント
   */
  handleKeyDown(event) {
    // Enterキー以外は無視
    if (event.key !== 'Enter') {
      return;
    }

    // 設定された送信キーと一致するかチェック
    const matchesSendKey = this.checkSendKeyMatch(event, this.sendKeyConfig);

    if (!matchesSendKey) {
      // 送信キーと一致しない: 送信を防止
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      // IME入力中（変換中）の場合は改行を挿入しない
      // isComposingがtrueの場合、IMEが変換処理を行っているため、
      // 改行挿入はせずに送信防止のみ行う
      if (!event.isComposing) {
        // IME入力中でない場合のみ改行を挿入
        this.insertLineBreak(event.target);
      }
    } else {
      // 送信キーと一致: 送信動作を許可
      // ただしIME入力中は送信を防止（要件9.6）
      if (event.isComposing) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
      // IME入力中でなければ何もせず、元のアプリケーションの動作に任せる
    }
  }

  /**
   * テキストフィールドに改行を挿入
   * @param {HTMLElement} element - 改行を挿入する要素
   */
  insertLineBreak(element) {
    try {
      // 要素の検証
      if (!element || !(element instanceof HTMLElement)) {
        console.error('Chat Enter Key Control: 無効な要素です');
        return;
      }
      
      if (element.isContentEditable) {
        // contenteditable要素の場合
        // execCommandを使用して改行を挿入（カーソル位置を自動的に保持）
        const success = document.execCommand('insertLineBreak');
        if (!success) {
          console.warn('Chat Enter Key Control: execCommandが失敗しました。フォールバック処理を試みます。');
          // フォールバック: 改行文字を挿入
          document.execCommand('insertText', false, '\n');
        }
      } else if (element.tagName === 'TEXTAREA') {
        // textarea要素の場合のみ改行を挿入
        this.insertLineBreakInTextarea(element);
      }
      // input[type="text"]要素の場合は何もしない
      // （単一行入力なので改行を挿入できない。送信防止のみ）
    } catch (error) {
      console.error('Chat Enter Key Control: 改行挿入中にエラーが発生しました', error);
      // エラーが発生しても、送信は既に防止されているので、処理を続行
    }
  }

  /**
   * textarea要素に改行を挿入
   * @param {HTMLTextAreaElement} textarea - 改行を挿入するtextarea要素
   */
  insertLineBreakInTextarea(textarea) {
    try {
      // 要素の検証
      if (!textarea || textarea.tagName !== 'TEXTAREA') {
        console.error('Chat Enter Key Control: 無効なtextarea要素です');
        return;
      }
      
      // 読み取り専用または無効な要素はスキップ
      if (textarea.readOnly || textarea.disabled) {
        console.warn('Chat Enter Key Control: 読み取り専用または無効なtextarea要素です');
        return;
      }
      
      // 現在のカーソル位置を取得
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      // カーソル位置に改行を挿入
      const newValue = value.substring(0, start) + '\n' + value.substring(end);
      textarea.value = newValue;

      // カーソル位置を改行の後に移動（カーソル位置を保持）
      const newCursorPosition = start + 1;
      textarea.selectionStart = newCursorPosition;
      textarea.selectionEnd = newCursorPosition;

      // inputイベントを発火（Reactなどのフレームワークとの互換性のため）
      try {
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        textarea.dispatchEvent(inputEvent);
      } catch (eventError) {
        console.warn('Chat Enter Key Control: inputイベントの発火に失敗しました', eventError);
      }

      // changeイベントも発火（一部のアプリケーションとの互換性のため）
      try {
        const changeEvent = new Event('change', { bubbles: true, cancelable: true });
        textarea.dispatchEvent(changeEvent);
      } catch (eventError) {
        console.warn('Chat Enter Key Control: changeイベントの発火に失敗しました', eventError);
      }
    } catch (error) {
      console.error('Chat Enter Key Control: textarea改行挿入中にエラーが発生しました', error);
    }
  }
}

// グローバルなフィールド検出器インスタンス
const fieldDetector = new FieldDetector();

// グローバルなキーボードイベントハンドラインスタンス
const keyboardHandler = new KeyboardEventHandler();

/**
 * テキストフィールドにイベントハンドラを追加
 * @param {HTMLElement} element - イベントハンドラを追加するフィールド要素
 */
function attachHandlers(element) {
  // すでに登録済みの場合はスキップ
  if (fieldDetector.registry.has(element)) {
    return;
  }

  // キーボードイベントハンドラを追加
  const listener = keyboardHandler.attachToField(element);

  // レジストリに登録
  fieldDetector.registry.register(element, listener);
}

/**
 * 初期化処理
 */
function initialize() {
  try {
    // 既存のフィールドを検出してハンドラを追加
    const fields = fieldDetector.detectFields();
    fields.forEach(field => attachHandlers(field));

    // 新しいフィールドの監視を開始
    fieldDetector.observeNewFields((field) => {
      attachHandlers(field);
    });

    console.log('Chat Enter Key Control: Initialized');
  } catch (error) {
    console.error('Chat Enter Key Control: 初期化中にエラーが発生しました', error);
  }
}

/**
 * クリーンアップ処理
 * ページアンロード時やスクリプト無効化時に呼ばれる
 */
function cleanup() {
  try {
    fieldDetector.cleanup();
    console.log('Chat Enter Key Control: Cleaned up');
  } catch (error) {
    console.error('Chat Enter Key Control: クリーンアップ中にエラーが発生しました', error);
  }
}

// ページロード時に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// ページアンロード時にクリーンアップ
// beforeunloadイベントでクリーンアップを実行
window.addEventListener('beforeunload', cleanup);

// pagehideイベントでもクリーンアップを実行（bfcache対応）
window.addEventListener('pagehide', cleanup);

// Background Scriptからの送信キー設定更新メッセージを受信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SEND_KEY_CONFIG_UPDATED') {
    // 送信キー設定を更新
    keyboardHandler.sendKeyConfig = message.config;
    console.log('Chat Enter Key Control: 送信キー設定が更新されました', message.config);
    sendResponse({ success: true });
  }
});

console.log('Chat Enter Key Control: Content script loaded');

// テスト用のエクスポート（テスト環境でのみ使用）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FieldRegistry,
    FieldDetector,
    KeyboardEventHandler,
    attachHandlers,
    initialize,
    cleanup,
    fieldDetector,
    keyboardHandler
  };
}
