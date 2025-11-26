// イベント伝播制御のプロパティベーステスト
// Feature: chat-enter-key-control, Property 11: 修飾キーなしのEnterイベントは伝播しない
// Feature: chat-enter-key-control, Property 12: 修飾キー付きイベントは伝播する
// 検証対象: 要件 5.3, 5.4

import { describe, test, beforeEach, afterEach, expect } from 'vitest';
import * as fc from 'fast-check';
import { JSDOM } from 'jsdom';

/**
 * キーボードイベントハンドラ（content.jsから）
 */
class KeyboardEventHandler {
  attachToField(element) {
    const listener = (event) => this.handleKeyDown(event);
    element.addEventListener('keydown', listener, true);
    return listener;
  }

  handleKeyDown(event) {
    if (event.key !== 'Enter') {
      return;
    }

    const hasModifier = event.ctrlKey || event.altKey || event.metaKey;

    if (!hasModifier) {
      // 修飾キーなし: 送信を防止、改行を挿入
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      this.insertLineBreak(event.target);
    }
  }

  insertLineBreak(element) {
    if (element.isContentEditable) {
      document.execCommand('insertLineBreak');
    } else if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;

      element.value = value.substring(0, start) + '\n' + value.substring(end);
      element.selectionStart = element.selectionEnd = start + 1;

      const inputEvent = new Event('input', { bubbles: true, cancelable: true });
      element.dispatchEvent(inputEvent);
    }
  }
}

describe('イベント伝播制御のプロパティテスト', () => {
  let dom;
  let handler;

  beforeEach(() => {
    // 各テストの前に新しいDOM環境を作成
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true
    });
    global.document = dom.window.document;
    global.window = dom.window;
    global.HTMLElement = dom.window.HTMLElement;
    global.KeyboardEvent = dom.window.KeyboardEvent;
    global.Event = dom.window.Event;

    handler = new KeyboardEventHandler();
  });

  afterEach(() => {
    if (dom) {
      dom.window.close();
    }
  });

  /**
   * プロパティ 11: 修飾キーなしのEnterイベントは伝播しない
   * 
   * 任意のテキスト入力フィールドとEnterキーイベントについて、
   * 修飾キーが押されていない場合、イベントはアプリケーションのリスナーに伝播しない
   * 
   * 検証対象: 要件 5.3
   */
  test('プロパティ 11: 修飾キーなしのEnter - textarea要素でイベントが伝播しない', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容とIME状態を生成
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.boolean()
        }),
        ({ text, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);

          // 拡張機能のイベントハンドラを追加（useCaptureでキャプチャフェーズ）
          handler.attachToField(textarea);

          // アプリケーションのリスナーをシミュレート（バブリングフェーズ）
          let appListenerCalled = false;
          textarea.addEventListener('keydown', (e) => {
            appListenerCalled = true;
          }, false); // useCaptureをfalseにしてバブリングフェーズで登録

          // 親要素にもリスナーを追加（伝播をチェック）
          let parentListenerCalled = false;
          document.body.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              parentListenerCalled = true;
            }
          }, false);

          // 修飾キーなしのEnterキーイベントを作成
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          // 1. デフォルトの動作が防止されている
          expect(enterEvent.defaultPrevented).toBe(true);

          // 2. アプリケーションのリスナーが呼ばれていない（イベントが伝播していない）
          // stopImmediatePropagation()により、同じ要素の後続リスナーも呼ばれない
          expect(appListenerCalled).toBe(false);

          // 3. 親要素のリスナーも呼ばれていない（stopPropagation()により）
          expect(parentListenerCalled).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 11: 修飾キーなしのEnter - input要素でイベントが伝播しない', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容とIME状態を生成
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.boolean()
        }),
        ({ text, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // input要素を作成
          const input = document.createElement('input');
          input.type = 'text';
          input.value = text;
          document.body.appendChild(input);

          // 拡張機能のイベントハンドラを追加
          handler.attachToField(input);

          // アプリケーションのリスナーをシミュレート
          let appListenerCalled = false;
          input.addEventListener('keydown', (e) => {
            appListenerCalled = true;
          }, false);

          // 親要素にもリスナーを追加
          let parentListenerCalled = false;
          document.body.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              parentListenerCalled = true;
            }
          }, false);

          // 修飾キーなしのEnterキーイベントを作成
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          input.dispatchEvent(enterEvent);

          // アサーション
          // 1. デフォルトの動作が防止されている
          expect(enterEvent.defaultPrevented).toBe(true);

          // 2. アプリケーションのリスナーが呼ばれていない
          expect(appListenerCalled).toBe(false);

          // 3. 親要素のリスナーも呼ばれていない
          expect(parentListenerCalled).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 11: 修飾キーなしのEnter - contenteditable要素でイベントが伝播しない', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容とIME状態を生成
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.boolean()
        }),
        ({ text, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // contenteditable要素を作成
          const div = document.createElement('div');
          div.setAttribute('contenteditable', 'true');
          div.textContent = text;
          document.body.appendChild(div);

          // 拡張機能のイベントハンドラを追加
          handler.attachToField(div);

          // アプリケーションのリスナーをシミュレート
          let appListenerCalled = false;
          div.addEventListener('keydown', (e) => {
            appListenerCalled = true;
          }, false);

          // 親要素にもリスナーを追加
          let parentListenerCalled = false;
          document.body.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              parentListenerCalled = true;
            }
          }, false);

          // 修飾キーなしのEnterキーイベントを作成
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          div.dispatchEvent(enterEvent);

          // アサーション
          // 1. デフォルトの動作が防止されている
          expect(enterEvent.defaultPrevented).toBe(true);

          // 2. アプリケーションのリスナーが呼ばれていない
          expect(appListenerCalled).toBe(false);

          // 3. 親要素のリスナーも呼ばれていない
          expect(parentListenerCalled).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 11: 修飾キーなしのEnter - 複数のアプリケーションリスナーがある場合もすべて呼ばれない', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容とIME状態を生成
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.boolean()
        }),
        ({ text, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);

          // 拡張機能のイベントハンドラを追加
          handler.attachToField(textarea);

          // 複数のアプリケーションリスナーをシミュレート
          let appListener1Called = false;
          let appListener2Called = false;
          let appListener3Called = false;

          textarea.addEventListener('keydown', (e) => {
            appListener1Called = true;
          }, false);

          textarea.addEventListener('keydown', (e) => {
            appListener2Called = true;
          }, false);

          textarea.addEventListener('keydown', (e) => {
            appListener3Called = true;
          }, false);

          // 修飾キーなしのEnterキーイベントを作成
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          // stopImmediatePropagation()により、すべてのアプリケーションリスナーが呼ばれない
          expect(appListener1Called).toBe(false);
          expect(appListener2Called).toBe(false);
          expect(appListener3Called).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 11: 修飾キーなしのEnter - 他のキーイベントは伝播する', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容と他のキーを生成
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          key: fc.constantFrom('a', 'b', 'Space', 'Backspace', 'Delete', 'ArrowUp', 'ArrowDown')
        }),
        ({ text, key }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);

          // 拡張機能のイベントハンドラを追加
          handler.attachToField(textarea);

          // アプリケーションのリスナーをシミュレート
          let appListenerCalled = false;
          textarea.addEventListener('keydown', (e) => {
            appListenerCalled = true;
          }, false);

          // Enterキー以外のキーイベントを作成
          const keyEvent = new KeyboardEvent('keydown', {
            key: key,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          textarea.dispatchEvent(keyEvent);

          // アサーション
          // Enterキー以外のイベントは伝播する
          expect(appListenerCalled).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 11: 修飾キー付きのEnter - イベントが伝播する（対照テスト）', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容と修飾キーを生成
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          modifierKey: fc.constantFrom('ctrlKey', 'altKey', 'metaKey'),
          isComposing: fc.boolean()
        }),
        ({ text, modifierKey, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);

          // 拡張機能のイベントハンドラを追加
          handler.attachToField(textarea);

          // アプリケーションのリスナーをシミュレート
          let appListenerCalled = false;
          textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              appListenerCalled = true;
            }
          }, false);

          // 親要素にもリスナーを追加
          let parentListenerCalled = false;
          document.body.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              parentListenerCalled = true;
            }
          }, false);

          // 修飾キー+Enterキーイベントを作成
          const eventOptions = {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          };
          eventOptions[modifierKey] = true;

          const enterEvent = new KeyboardEvent('keydown', eventOptions);

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          // 修飾キー付きの場合、イベントは伝播する
          expect(appListenerCalled).toBe(true);
          expect(parentListenerCalled).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 11: 修飾キーなしのEnter - ネストされた要素でもイベントが伝播しない', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容とIME状態を生成
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.boolean()
        }),
        ({ text, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // ネストされた構造を作成
          const container = document.createElement('div');
          const form = document.createElement('form');
          const textarea = document.createElement('textarea');
          textarea.value = text;

          form.appendChild(textarea);
          container.appendChild(form);
          document.body.appendChild(container);

          // 拡張機能のイベントハンドラを追加
          handler.attachToField(textarea);

          // 各レベルにリスナーを追加
          let textareaListenerCalled = false;
          let formListenerCalled = false;
          let containerListenerCalled = false;
          let bodyListenerCalled = false;

          textarea.addEventListener('keydown', (e) => {
            textareaListenerCalled = true;
          }, false);

          form.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              formListenerCalled = true;
            }
          }, false);

          container.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              containerListenerCalled = true;
            }
          }, false);

          document.body.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              bodyListenerCalled = true;
            }
          }, false);

          // 修飾キーなしのEnterキーイベントを作成
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          // すべてのレベルでリスナーが呼ばれていない
          expect(textareaListenerCalled).toBe(false);
          expect(formListenerCalled).toBe(false);
          expect(containerListenerCalled).toBe(false);
          expect(bodyListenerCalled).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 11: 修飾キーなしのEnter - 空のフィールドでもイベントが伝播しない', () => {
    fc.assert(
      fc.property(
        // IME状態を生成
        fc.boolean(),
        (isComposing) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 空のtextarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = '';
          document.body.appendChild(textarea);

          // 拡張機能のイベントハンドラを追加
          handler.attachToField(textarea);

          // アプリケーションのリスナーをシミュレート
          let appListenerCalled = false;
          textarea.addEventListener('keydown', (e) => {
            appListenerCalled = true;
          }, false);

          // 修飾キーなしのEnterキーイベントを作成
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          expect(appListenerCalled).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * プロパティ 12: 修飾キー付きイベントは伝播する
   * 
   * 任意のテキスト入力フィールドと修飾キー付きキーボードイベントについて、
   * イベントはアプリケーションのリスナーに伝播する
   * 
   * 検証対象: 要件 5.4
   */
  test('プロパティ 12: 修飾キー付きEnter - textarea要素でイベントが伝播する', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容、修飾キー、IME状態を生成
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          modifierKey: fc.constantFrom('ctrlKey', 'altKey', 'metaKey'),
          isComposing: fc.boolean()
        }),
        ({ text, modifierKey, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);

          // 拡張機能のイベントハンドラを追加
          handler.attachToField(textarea);

          // アプリケーションのリスナーをシミュレート
          let appListenerCalled = false;
          let receivedEvent = null;
          textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              appListenerCalled = true;
              receivedEvent = e;
            }
          }, false);

          // 親要素にもリスナーを追加
          let parentListenerCalled = false;
          document.body.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              parentListenerCalled = true;
            }
          }, false);

          // 修飾キー+Enterキーイベントを作成
          const eventOptions = {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          };
          eventOptions[modifierKey] = true;

          const enterEvent = new KeyboardEvent('keydown', eventOptions);

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          // 1. アプリケーションのリスナーが呼ばれている
          expect(appListenerCalled).toBe(true);

          // 2. 親要素のリスナーも呼ばれている（イベントが伝播している）
          expect(parentListenerCalled).toBe(true);

          // 3. イベントの修飾キーが保持されている
          expect(receivedEvent).not.toBeNull();
          if (receivedEvent) {
            expect(receivedEvent[modifierKey]).toBe(true);
          }

          // 4. デフォルトの動作は防止されていない（アプリケーションが処理できる）
          expect(enterEvent.defaultPrevented).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 12: 修飾キー付きEnter - input要素でイベントが伝播する', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容、修飾キー、IME状態を生成
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          modifierKey: fc.constantFrom('ctrlKey', 'altKey', 'metaKey'),
          isComposing: fc.boolean()
        }),
        ({ text, modifierKey, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // input要素を作成
          const input = document.createElement('input');
          input.type = 'text';
          input.value = text;
          document.body.appendChild(input);

          // 拡張機能のイベントハンドラを追加
          handler.attachToField(input);

          // アプリケーションのリスナーをシミュレート
          let appListenerCalled = false;
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              appListenerCalled = true;
            }
          }, false);

          // 親要素にもリスナーを追加
          let parentListenerCalled = false;
          document.body.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              parentListenerCalled = true;
            }
          }, false);

          // 修飾キー+Enterキーイベントを作成
          const eventOptions = {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          };
          eventOptions[modifierKey] = true;

          const enterEvent = new KeyboardEvent('keydown', eventOptions);

          // イベントを発火
          input.dispatchEvent(enterEvent);

          // アサーション
          expect(appListenerCalled).toBe(true);
          expect(parentListenerCalled).toBe(true);
          expect(enterEvent.defaultPrevented).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 12: 修飾キー付きEnter - contenteditable要素でイベントが伝播する', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容、修飾キー、IME状態を生成
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          modifierKey: fc.constantFrom('ctrlKey', 'altKey', 'metaKey'),
          isComposing: fc.boolean()
        }),
        ({ text, modifierKey, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // contenteditable要素を作成
          const div = document.createElement('div');
          div.setAttribute('contenteditable', 'true');
          div.textContent = text;
          document.body.appendChild(div);

          // 拡張機能のイベントハンドラを追加
          handler.attachToField(div);

          // アプリケーションのリスナーをシミュレート
          let appListenerCalled = false;
          div.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              appListenerCalled = true;
            }
          }, false);

          // 親要素にもリスナーを追加
          let parentListenerCalled = false;
          document.body.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              parentListenerCalled = true;
            }
          }, false);

          // 修飾キー+Enterキーイベントを作成
          const eventOptions = {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          };
          eventOptions[modifierKey] = true;

          const enterEvent = new KeyboardEvent('keydown', eventOptions);

          // イベントを発火
          div.dispatchEvent(enterEvent);

          // アサーション
          expect(appListenerCalled).toBe(true);
          expect(parentListenerCalled).toBe(true);
          expect(enterEvent.defaultPrevented).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 12: 修飾キー付きEnter - 複数のアプリケーションリスナーがすべて呼ばれる', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容、修飾キー、IME状態を生成
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          modifierKey: fc.constantFrom('ctrlKey', 'altKey', 'metaKey'),
          isComposing: fc.boolean()
        }),
        ({ text, modifierKey, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);

          // 拡張機能のイベントハンドラを追加
          handler.attachToField(textarea);

          // 複数のアプリケーションリスナーをシミュレート
          let appListener1Called = false;
          let appListener2Called = false;
          let appListener3Called = false;

          textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              appListener1Called = true;
            }
          }, false);

          textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              appListener2Called = true;
            }
          }, false);

          textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              appListener3Called = true;
            }
          }, false);

          // 修飾キー+Enterキーイベントを作成
          const eventOptions = {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          };
          eventOptions[modifierKey] = true;

          const enterEvent = new KeyboardEvent('keydown', eventOptions);

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          // すべてのアプリケーションリスナーが呼ばれる
          expect(appListener1Called).toBe(true);
          expect(appListener2Called).toBe(true);
          expect(appListener3Called).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 12: 修飾キー付きEnter - ネストされた要素でもイベントが伝播する', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容、修飾キー、IME状態を生成
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          modifierKey: fc.constantFrom('ctrlKey', 'altKey', 'metaKey'),
          isComposing: fc.boolean()
        }),
        ({ text, modifierKey, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // ネストされた構造を作成
          const container = document.createElement('div');
          const form = document.createElement('form');
          const textarea = document.createElement('textarea');
          textarea.value = text;

          form.appendChild(textarea);
          container.appendChild(form);
          document.body.appendChild(container);

          // 拡張機能のイベントハンドラを追加
          handler.attachToField(textarea);

          // 各レベルにリスナーを追加
          let textareaListenerCalled = false;
          let formListenerCalled = false;
          let containerListenerCalled = false;
          let bodyListenerCalled = false;

          textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              textareaListenerCalled = true;
            }
          }, false);

          form.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              formListenerCalled = true;
            }
          }, false);

          container.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              containerListenerCalled = true;
            }
          }, false);

          document.body.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              bodyListenerCalled = true;
            }
          }, false);

          // 修飾キー+Enterキーイベントを作成
          const eventOptions = {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          };
          eventOptions[modifierKey] = true;

          const enterEvent = new KeyboardEvent('keydown', eventOptions);

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          // すべてのレベルでリスナーが呼ばれる
          expect(textareaListenerCalled).toBe(true);
          expect(formListenerCalled).toBe(true);
          expect(containerListenerCalled).toBe(true);
          expect(bodyListenerCalled).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 12: 修飾キー付きEnter - 複数の修飾キーの組み合わせでもイベントが伝播する', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容とIME状態を生成
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          ctrlKey: fc.boolean(),
          altKey: fc.boolean(),
          metaKey: fc.boolean(),
          isComposing: fc.boolean()
        }).filter(({ ctrlKey, altKey, metaKey }) => ctrlKey || altKey || metaKey), // 少なくとも1つの修飾キーが必要
        ({ text, ctrlKey, altKey, metaKey, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);

          // 拡張機能のイベントハンドラを追加
          handler.attachToField(textarea);

          // アプリケーションのリスナーをシミュレート
          let appListenerCalled = false;
          textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              appListenerCalled = true;
            }
          }, false);

          // 修飾キー+Enterキーイベントを作成
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            ctrlKey: ctrlKey,
            altKey: altKey,
            metaKey: metaKey,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          // 修飾キーの組み合わせに関わらず、イベントは伝播する
          expect(appListenerCalled).toBe(true);
          expect(enterEvent.defaultPrevented).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 12: 修飾キー付きEnter - 空のフィールドでもイベントが伝播する', () => {
    fc.assert(
      fc.property(
        // 修飾キーとIME状態を生成
        fc.record({
          modifierKey: fc.constantFrom('ctrlKey', 'altKey', 'metaKey'),
          isComposing: fc.boolean()
        }),
        ({ modifierKey, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 空のtextarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = '';
          document.body.appendChild(textarea);

          // 拡張機能のイベントハンドラを追加
          handler.attachToField(textarea);

          // アプリケーションのリスナーをシミュレート
          let appListenerCalled = false;
          textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              appListenerCalled = true;
            }
          }, false);

          // 修飾キー+Enterキーイベントを作成
          const eventOptions = {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          };
          eventOptions[modifierKey] = true;

          const enterEvent = new KeyboardEvent('keydown', eventOptions);

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          expect(appListenerCalled).toBe(true);
          expect(enterEvent.defaultPrevented).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 12: 修飾キー付きEnter - キャプチャフェーズのリスナーも呼ばれる', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容、修飾キー、IME状態を生成
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          modifierKey: fc.constantFrom('ctrlKey', 'altKey', 'metaKey'),
          isComposing: fc.boolean()
        }),
        ({ text, modifierKey, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);

          // 拡張機能のイベントハンドラを追加
          handler.attachToField(textarea);

          // キャプチャフェーズとバブリングフェーズのリスナーを追加
          let captureListenerCalled = false;
          let bubbleListenerCalled = false;

          document.body.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              captureListenerCalled = true;
            }
          }, true); // キャプチャフェーズ

          textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              bubbleListenerCalled = true;
            }
          }, false); // バブリングフェーズ

          // 修飾キー+Enterキーイベントを作成
          const eventOptions = {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          };
          eventOptions[modifierKey] = true;

          const enterEvent = new KeyboardEvent('keydown', eventOptions);

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          // キャプチャフェーズとバブリングフェーズの両方のリスナーが呼ばれる
          expect(captureListenerCalled).toBe(true);
          expect(bubbleListenerCalled).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
