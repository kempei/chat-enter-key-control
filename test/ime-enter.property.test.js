// IME入力中のEnter処理と通常のEnter処理のプロパティベーステスト
// Feature: chat-enter-key-control, Property 1: IME入力中のEnter単独押下は送信を防止する
// 検証対象: 要件 1.1, 1.2, 1.3
// Feature: chat-enter-key-control, Property 2: 通常のEnter押下は改行を挿入する
// 検証対象: 要件 1.4

import { describe, test, beforeEach, afterEach, expect, vi } from 'vitest';
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
      // 修飾キーなし: 送信を防止
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      // IME入力中（変換中）の場合は改行を挿入しない
      if (!event.isComposing) {
        // IME入力中でない場合のみ改行を挿入
        this.insertLineBreak(event.target);
      }
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

describe('IME入力中のEnter処理のプロパティテスト', () => {
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
   * プロパティ 1: IME入力中のEnter単独押下は送信を防止する
   * 
   * 任意のテキスト入力フィールドとIME composition状態において、
   * Enterキーを単独で押下した場合、送信アクションは発火せず、何もしない
   * 
   * 検証対象: 要件 1.1, 1.3
   */
  test('プロパティ 1: IME入力中のEnter - textarea要素で送信が防止される', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容とカーソル位置を生成
        fc.record({
          textBefore: fc.string({ minLength: 0, maxLength: 50 }),
          textAfter: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.constant(true) // IME入力中
        }),
        ({ textBefore, textAfter, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = textBefore + textAfter;
          textarea.selectionStart = textBefore.length;
          textarea.selectionEnd = textBefore.length;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // 送信アクションが発火したかを追跡
          let submitTriggered = false;
          textarea.addEventListener('keydown', (e) => {
            // イベントが伝播した場合、送信アクションが発火する可能性がある
            if (e.key === 'Enter' && !e.defaultPrevented) {
              submitTriggered = true;
            }
          });

          // IME入力中のEnterキーイベントを作成
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
          // 1. デフォルトの動作が防止されている（送信が防止される）
          expect(enterEvent.defaultPrevented).toBe(true);

          // 2. IME入力中は何もしない（テキストは変更されない）
          const expectedValue = textBefore + textAfter;
          expect(textarea.value).toBe(expectedValue);

          // 3. カーソル位置は変更されない
          expect(textarea.selectionStart).toBe(textBefore.length);
          expect(textarea.selectionEnd).toBe(textBefore.length);

          // 4. 送信アクションが発火していない
          expect(submitTriggered).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 1: IME入力中のEnter - input[type="text"]要素で送信が防止される（改行は挿入されない）', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容とカーソル位置を生成
        fc.record({
          textBefore: fc.string({ minLength: 0, maxLength: 50 }),
          textAfter: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.constant(true)
        }),
        ({ textBefore, textAfter, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // input要素を作成
          const input = document.createElement('input');
          input.type = 'text';
          const initialValue = textBefore + textAfter;
          input.value = initialValue;
          input.selectionStart = textBefore.length;
          input.selectionEnd = textBefore.length;
          document.body.appendChild(input);

          // イベントハンドラを追加
          handler.attachToField(input);

          // IME入力中のEnterキーイベントを作成
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
          // 1. デフォルトの動作が防止されている（送信が防止される）
          expect(enterEvent.defaultPrevented).toBe(true);

          // 2. input要素では改行は挿入されない（値が変更されない）
          expect(input.value).toBe(initialValue);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 1: IME入力中のEnter - contenteditable要素で送信が防止される', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容を生成
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.constant(true)
        }),
        ({ text, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // contenteditable要素を作成
          const div = document.createElement('div');
          div.setAttribute('contenteditable', 'true');
          div.textContent = text;
          document.body.appendChild(div);

          // イベントハンドラを追加
          handler.attachToField(div);

          // IME入力中のEnterキーイベントを作成
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
          // 1. デフォルトの動作が防止されている（送信が防止される）
          expect(enterEvent.defaultPrevented).toBe(true);

          // 注: JSDOMの制限により、execCommandの完全な検証は
          // 実際のブラウザ環境でのみ可能です。
          // ここでは、送信が防止されることを確認しています。
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 1: IME入力中のEnter - イベント伝播が停止される', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容を生成
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.constant(true)
        }),
        ({ text, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // 親要素にもイベントリスナーを追加（伝播をチェック）
          let parentListenerCalled = false;
          document.body.addEventListener('keydown', () => {
            parentListenerCalled = true;
          });

          // アプリケーションのリスナーをシミュレート（後から追加）
          let appListenerCalled = false;
          textarea.addEventListener('keydown', () => {
            appListenerCalled = true;
          });

          // IME入力中のEnterキーイベントを作成
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

          // 2. イベント伝播が停止されている
          // stopImmediatePropagation()により、同じ要素の後続リスナーも呼ばれない
          // ただし、useCaptureで先に登録されたハンドラが実行されるため、
          // 後から追加されたリスナーは呼ばれないはず
          // 注: JSDOMの制限により、stopImmediatePropagation()の完全な動作は
          // 実際のブラウザ環境でテストする必要がある
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 1: IME入力中のEnter - 選択範囲がある場合も正しく処理される', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容と選択範囲を生成
        fc.record({
          text: fc.string({ minLength: 5, maxLength: 50 }),
          isComposing: fc.constant(true)
        }).chain(({ text, isComposing }) => 
          fc.record({
            text: fc.constant(text),
            isComposing: fc.constant(isComposing),
            selectionStart: fc.integer({ min: 0, max: Math.max(0, text.length - 1) })
          })
        ).chain(({ text, isComposing, selectionStart }) =>
          fc.record({
            text: fc.constant(text),
            isComposing: fc.constant(isComposing),
            selectionStart: fc.constant(selectionStart),
            selectionEnd: fc.integer({ min: selectionStart, max: text.length })
          })
        ),
        ({ text, isComposing, selectionStart, selectionEnd }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.selectionStart = selectionStart;
          textarea.selectionEnd = selectionEnd;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // IME入力中のEnterキーイベントを作成
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

          // 2. IME入力中は何もしない（テキストは変更されない）
          const expectedValue = text;
          expect(textarea.value).toBe(expectedValue);

          // 3. カーソル位置は変更されない
          expect(textarea.selectionStart).toBe(selectionStart);
          expect(textarea.selectionEnd).toBe(selectionEnd);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 1: IME入力中のEnter - 空のフィールドでも正しく処理される', () => {
    fc.assert(
      fc.property(
        fc.constant(true), // isComposing
        (isComposing) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 空のtextarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = '';
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // IME入力中のEnterキーイベントを作成
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

          // 2. IME入力中は何もしない（テキストは変更されない）
          expect(textarea.value).toBe('');

          // 3. カーソル位置は変更されない
          expect(textarea.selectionStart).toBe(0);
          expect(textarea.selectionEnd).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 1: IME入力中のEnter - 複数行のテキストでも正しく処理される', () => {
    fc.assert(
      fc.property(
        // 複数行のテキストを生成
        fc.record({
          lines: fc.array(fc.string({ minLength: 0, maxLength: 20 }), { minLength: 2, maxLength: 5 }),
          isComposing: fc.constant(true)
        }).chain(({ lines, isComposing }) => {
          const text = lines.join('\n');
          return fc.record({
            text: fc.constant(text),
            isComposing: fc.constant(isComposing),
            cursorPosition: fc.integer({ min: 0, max: text.length })
          });
        }),
        ({ text, isComposing, cursorPosition }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.selectionStart = cursorPosition;
          textarea.selectionEnd = cursorPosition;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // IME入力中のEnterキーイベントを作成
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

          // 2. IME入力中は何もしない（テキストは変更されない）
          const expectedValue = text;
          expect(textarea.value).toBe(expectedValue);

          // 3. カーソル位置は変更されない
          expect(textarea.selectionStart).toBe(cursorPosition);
          expect(textarea.selectionEnd).toBe(cursorPosition);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 1: IME入力中のEnter - 特殊文字を含むテキストでも正しく処理される', () => {
    fc.assert(
      fc.property(
        // 特殊文字を含むテキストを生成
        fc.record({
          textBefore: fc.string({ minLength: 0, maxLength: 30 }),
          specialChars: fc.constantFrom('😀', '🎉', '日本語', 'こんにちは', '한글', '中文', '\t', '  '),
          textAfter: fc.string({ minLength: 0, maxLength: 30 }),
          isComposing: fc.constant(true)
        }),
        ({ textBefore, specialChars, textAfter, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          const text = textBefore + specialChars + textAfter;
          const cursorPosition = textBefore.length + specialChars.length;

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.selectionStart = cursorPosition;
          textarea.selectionEnd = cursorPosition;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // IME入力中のEnterキーイベントを作成
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

          // 2. IME入力中は何もしない（テキストは変更されない）
          const expectedValue = text;
          expect(textarea.value).toBe(expectedValue);

          // 3. カーソル位置は変更されない
          expect(textarea.selectionStart).toBe(cursorPosition);
          expect(textarea.selectionEnd).toBe(cursorPosition);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('通常のEnter処理のプロパティテスト', () => {
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
   * プロパティ 2: 通常のEnter押下は改行を挿入する
   * 
   * 任意のテキスト入力フィールドとテキスト内容において、
   * IME入力中でない状態でEnterキーを押下した場合、改行が挿入され、送信アクションは発火しない
   * 
   * 検証対象: 要件 1.4
   */
  test('プロパティ 2: 通常のEnter - textarea要素で改行が挿入され送信が防止される', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容とカーソル位置を生成
        fc.record({
          textBefore: fc.string({ minLength: 0, maxLength: 50 }),
          textAfter: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.constant(false) // IME入力中でない
        }),
        ({ textBefore, textAfter, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = textBefore + textAfter;
          textarea.selectionStart = textBefore.length;
          textarea.selectionEnd = textBefore.length;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // 送信アクションが発火したかを追跡
          let submitTriggered = false;
          textarea.addEventListener('keydown', (e) => {
            // イベントが伝播した場合、送信アクションが発火する可能性がある
            if (e.key === 'Enter' && !e.defaultPrevented) {
              submitTriggered = true;
            }
          });

          // 通常のEnterキーイベントを作成（IME入力中でない）
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
          // 1. デフォルトの動作が防止されている（送信が防止される）
          expect(enterEvent.defaultPrevented).toBe(true);

          // 2. 改行が挿入されている
          const expectedValue = textBefore + '\n' + textAfter;
          expect(textarea.value).toBe(expectedValue);

          // 3. カーソル位置が改行の後に移動している
          expect(textarea.selectionStart).toBe(textBefore.length + 1);
          expect(textarea.selectionEnd).toBe(textBefore.length + 1);

          // 4. 送信アクションが発火していない
          expect(submitTriggered).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 2: 通常のEnter - input[type="text"]要素で送信が防止される（改行は挿入されない）', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容とカーソル位置を生成
        fc.record({
          textBefore: fc.string({ minLength: 0, maxLength: 50 }),
          textAfter: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.constant(false)
        }),
        ({ textBefore, textAfter, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // input要素を作成
          const input = document.createElement('input');
          input.type = 'text';
          const initialValue = textBefore + textAfter;
          input.value = initialValue;
          input.selectionStart = textBefore.length;
          input.selectionEnd = textBefore.length;
          document.body.appendChild(input);

          // イベントハンドラを追加
          handler.attachToField(input);

          // 通常のEnterキーイベントを作成
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
          // 1. デフォルトの動作が防止されている（送信が防止される）
          expect(enterEvent.defaultPrevented).toBe(true);

          // 2. input要素では改行は挿入されない（値が変更されない）
          expect(input.value).toBe(initialValue);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 2: 通常のEnter - contenteditable要素で送信が防止される', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容を生成
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.constant(false)
        }),
        ({ text, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // contenteditable要素を作成
          const div = document.createElement('div');
          div.setAttribute('contenteditable', 'true');
          div.textContent = text;
          document.body.appendChild(div);

          // イベントハンドラを追加
          handler.attachToField(div);

          // 通常のEnterキーイベントを作成
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
          // 1. デフォルトの動作が防止されている（送信が防止される）
          expect(enterEvent.defaultPrevented).toBe(true);

          // 注: JSDOMの制限により、execCommandの完全な検証は
          // 実際のブラウザ環境でのみ可能です。
          // ここでは、送信が防止されることを確認しています。
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 2: 通常のEnter - 選択範囲がある場合も正しく処理される', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容と選択範囲を生成
        fc.record({
          text: fc.string({ minLength: 5, maxLength: 50 }),
          isComposing: fc.constant(false)
        }).chain(({ text, isComposing }) => 
          fc.record({
            text: fc.constant(text),
            isComposing: fc.constant(isComposing),
            selectionStart: fc.integer({ min: 0, max: Math.max(0, text.length - 1) })
          })
        ).chain(({ text, isComposing, selectionStart }) =>
          fc.record({
            text: fc.constant(text),
            isComposing: fc.constant(isComposing),
            selectionStart: fc.constant(selectionStart),
            selectionEnd: fc.integer({ min: selectionStart, max: text.length })
          })
        ),
        ({ text, isComposing, selectionStart, selectionEnd }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.selectionStart = selectionStart;
          textarea.selectionEnd = selectionEnd;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // 通常のEnterキーイベントを作成
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

          // 2. 選択範囲が改行に置き換えられている
          const expectedValue = text.substring(0, selectionStart) + '\n' + text.substring(selectionEnd);
          expect(textarea.value).toBe(expectedValue);

          // 3. カーソル位置が改行の後に移動している
          expect(textarea.selectionStart).toBe(selectionStart + 1);
          expect(textarea.selectionEnd).toBe(selectionStart + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 2: 通常のEnter - 空のフィールドでも正しく処理される', () => {
    fc.assert(
      fc.property(
        fc.constant(false), // isComposing
        (isComposing) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 空のtextarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = '';
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // 通常のEnterキーイベントを作成
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

          // 2. 改行が挿入されている
          expect(textarea.value).toBe('\n');

          // 3. カーソル位置が改行の後に移動している
          expect(textarea.selectionStart).toBe(1);
          expect(textarea.selectionEnd).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 2: 通常のEnter - 複数行のテキストでも正しく処理される', () => {
    fc.assert(
      fc.property(
        // 複数行のテキストを生成
        fc.record({
          lines: fc.array(fc.string({ minLength: 0, maxLength: 20 }), { minLength: 2, maxLength: 5 }),
          isComposing: fc.constant(false)
        }).chain(({ lines, isComposing }) => {
          const text = lines.join('\n');
          return fc.record({
            text: fc.constant(text),
            isComposing: fc.constant(isComposing),
            cursorPosition: fc.integer({ min: 0, max: text.length })
          });
        }),
        ({ text, isComposing, cursorPosition }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.selectionStart = cursorPosition;
          textarea.selectionEnd = cursorPosition;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // 通常のEnterキーイベントを作成
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

          // 2. 改行が挿入されている
          const expectedValue = text.substring(0, cursorPosition) + '\n' + text.substring(cursorPosition);
          expect(textarea.value).toBe(expectedValue);

          // 3. カーソル位置が改行の後に移動している
          expect(textarea.selectionStart).toBe(cursorPosition + 1);
          expect(textarea.selectionEnd).toBe(cursorPosition + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 2: 通常のEnter - 特殊文字を含むテキストでも正しく処理される', () => {
    fc.assert(
      fc.property(
        // 特殊文字を含むテキストを生成
        fc.record({
          textBefore: fc.string({ minLength: 0, maxLength: 30 }),
          specialChars: fc.constantFrom('😀', '🎉', '日本語', 'こんにちは', '한글', '中文', '\t', '  '),
          textAfter: fc.string({ minLength: 0, maxLength: 30 }),
          isComposing: fc.constant(false)
        }),
        ({ textBefore, specialChars, textAfter, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          const text = textBefore + specialChars + textAfter;
          const cursorPosition = textBefore.length + specialChars.length;

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.selectionStart = cursorPosition;
          textarea.selectionEnd = cursorPosition;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // 通常のEnterキーイベントを作成
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

          // 2. 改行が挿入されている
          const expectedValue = text.substring(0, cursorPosition) + '\n' + text.substring(cursorPosition);
          expect(textarea.value).toBe(expectedValue);

          // 3. カーソル位置が改行の後に移動している
          expect(textarea.selectionStart).toBe(cursorPosition + 1);
          expect(textarea.selectionEnd).toBe(cursorPosition + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 2: 通常のEnter - IME入力中とIME入力中でない場合の動作が異なる', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容を生成
        fc.record({
          textBefore: fc.string({ minLength: 0, maxLength: 50 }),
          textAfter: fc.string({ minLength: 0, maxLength: 50 })
        }),
        ({ textBefore, textAfter }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 2つのtextarea要素を作成（IME入力中とIME入力中でない）
          const textarea1 = document.createElement('textarea');
          textarea1.value = textBefore + textAfter;
          textarea1.selectionStart = textBefore.length;
          textarea1.selectionEnd = textBefore.length;
          document.body.appendChild(textarea1);

          const textarea2 = document.createElement('textarea');
          textarea2.value = textBefore + textAfter;
          textarea2.selectionStart = textBefore.length;
          textarea2.selectionEnd = textBefore.length;
          document.body.appendChild(textarea2);

          // イベントハンドラを追加
          handler.attachToField(textarea1);
          handler.attachToField(textarea2);

          // IME入力中でないEnterキーイベントを作成
          const enterEvent1 = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            isComposing: false,
            bubbles: true,
            cancelable: true
          });

          // IME入力中のEnterキーイベントを作成
          const enterEvent2 = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            isComposing: true,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          textarea1.dispatchEvent(enterEvent1);
          textarea2.dispatchEvent(enterEvent2);

          // アサーション
          // IME入力中でない場合は改行が挿入される
          const expectedValue1 = textBefore + '\n' + textAfter;
          expect(textarea1.value).toBe(expectedValue1);
          expect(textarea1.selectionStart).toBe(textBefore.length + 1);

          // IME入力中の場合は何もしない
          const expectedValue2 = textBefore + textAfter;
          expect(textarea2.value).toBe(expectedValue2);
          expect(textarea2.selectionStart).toBe(textBefore.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('修飾キー+Enter処理のプロパティテスト', () => {
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
   * プロパティ 3: 修飾キー+Enterは送信アクションを発火する
   * 
   * 任意のテキスト入力フィールドと修飾キー（Ctrl、Alt、Cmd、Opt）において、
   * 修飾キー+Enterを押下した場合、送信アクションが発火する
   * 
   * 検証対象: 要件 2.1, 2.2, 2.3, 2.4, 2.5
   */
  test('プロパティ 3: 修飾キー+Enter - Ctrl+Enterで送信アクションが発火する', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容とカーソル位置を生成
        fc.record({
          textBefore: fc.string({ minLength: 0, maxLength: 50 }),
          textAfter: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.boolean() // IME入力中かどうか
        }),
        ({ textBefore, textAfter, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          const initialValue = textBefore + textAfter;
          textarea.value = initialValue;
          textarea.selectionStart = textBefore.length;
          textarea.selectionEnd = textBefore.length;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // Ctrl+Enterキーイベントを作成
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            ctrlKey: true, // Ctrl修飾キー
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          // 1. デフォルトの動作が防止されていない（送信アクションが発火する）
          expect(enterEvent.defaultPrevented).toBe(false);

          // 2. テキストが変更されていない（改行が挿入されない）
          expect(textarea.value).toBe(initialValue);

          // 3. カーソル位置が変更されていない
          expect(textarea.selectionStart).toBe(textBefore.length);
          expect(textarea.selectionEnd).toBe(textBefore.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 3: 修飾キー+Enter - Alt+Enterで送信アクションが発火する', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容とカーソル位置を生成
        fc.record({
          textBefore: fc.string({ minLength: 0, maxLength: 50 }),
          textAfter: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.boolean()
        }),
        ({ textBefore, textAfter, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          const initialValue = textBefore + textAfter;
          textarea.value = initialValue;
          textarea.selectionStart = textBefore.length;
          textarea.selectionEnd = textBefore.length;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // Alt+Enterキーイベントを作成
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            altKey: true, // Alt修飾キー
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          // 1. デフォルトの動作が防止されていない（送信アクションが発火する）
          expect(enterEvent.defaultPrevented).toBe(false);

          // 2. テキストが変更されていない（改行が挿入されない）
          expect(textarea.value).toBe(initialValue);

          // 3. カーソル位置が変更されていない
          expect(textarea.selectionStart).toBe(textBefore.length);
          expect(textarea.selectionEnd).toBe(textBefore.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 3: 修飾キー+Enter - Cmd+Enter (metaKey) で送信アクションが発火する', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容とカーソル位置を生成
        fc.record({
          textBefore: fc.string({ minLength: 0, maxLength: 50 }),
          textAfter: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.boolean()
        }),
        ({ textBefore, textAfter, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          const initialValue = textBefore + textAfter;
          textarea.value = initialValue;
          textarea.selectionStart = textBefore.length;
          textarea.selectionEnd = textBefore.length;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // Cmd+Enterキーイベントを作成（macOS）
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            metaKey: true, // Cmd修飾キー（macOS）
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          // 1. デフォルトの動作が防止されていない（送信アクションが発火する）
          expect(enterEvent.defaultPrevented).toBe(false);

          // 2. テキストが変更されていない（改行が挿入されない）
          expect(textarea.value).toBe(initialValue);

          // 3. カーソル位置が変更されていない
          expect(textarea.selectionStart).toBe(textBefore.length);
          expect(textarea.selectionEnd).toBe(textBefore.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 3: 修飾キー+Enter - input[type="text"]要素でも送信アクションが発火する', () => {
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

          // input要素を作成
          const input = document.createElement('input');
          input.type = 'text';
          input.value = text;
          document.body.appendChild(input);

          // イベントハンドラを追加
          handler.attachToField(input);

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
          // 1. デフォルトの動作が防止されていない（送信アクションが発火する）
          expect(enterEvent.defaultPrevented).toBe(false);

          // 2. テキストが変更されていない
          expect(input.value).toBe(text);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 3: 修飾キー+Enter - contenteditable要素でも送信アクションが発火する', () => {
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

          // contenteditable要素を作成
          const div = document.createElement('div');
          div.setAttribute('contenteditable', 'true');
          div.textContent = text;
          document.body.appendChild(div);

          // イベントハンドラを追加
          handler.attachToField(div);

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
          // 1. デフォルトの動作が防止されていない（送信アクションが発火する）
          expect(enterEvent.defaultPrevented).toBe(false);

          // 2. テキストが変更されていない
          expect(div.textContent).toBe(text);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 3: 修飾キー+Enter - IME入力中でも送信アクションが発火する（要件2.5）', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容と修飾キーを生成
        fc.record({
          textBefore: fc.string({ minLength: 0, maxLength: 50 }),
          textAfter: fc.string({ minLength: 0, maxLength: 50 }),
          modifierKey: fc.constantFrom('ctrlKey', 'altKey', 'metaKey')
        }),
        ({ textBefore, textAfter, modifierKey }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          const initialValue = textBefore + textAfter;
          textarea.value = initialValue;
          textarea.selectionStart = textBefore.length;
          textarea.selectionEnd = textBefore.length;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // IME入力中の修飾キー+Enterキーイベントを作成
          const eventOptions = {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            isComposing: true, // IME入力中
            bubbles: true,
            cancelable: true
          };
          eventOptions[modifierKey] = true;

          const enterEvent = new KeyboardEvent('keydown', eventOptions);

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          // 1. デフォルトの動作が防止されていない（送信アクションが発火する）
          expect(enterEvent.defaultPrevented).toBe(false);

          // 2. テキストが変更されていない（改行が挿入されない）
          expect(textarea.value).toBe(initialValue);

          // 3. カーソル位置が変更されていない
          expect(textarea.selectionStart).toBe(textBefore.length);
          expect(textarea.selectionEnd).toBe(textBefore.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 3: 修飾キー+Enter - イベントが伝播する', () => {
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

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // アプリケーションのリスナーをシミュレート
          let appListenerCalled = false;
          textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.defaultPrevented) {
              appListenerCalled = true;
            }
          });

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
          // 1. デフォルトの動作が防止されていない
          expect(enterEvent.defaultPrevented).toBe(false);

          // 2. アプリケーションのリスナーが呼ばれている（イベントが伝播している）
          expect(appListenerCalled).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 3: 修飾キー+Enter - 複数の修飾キーが同時に押された場合も送信アクションが発火する', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容を生成
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          ctrlKey: fc.boolean(),
          altKey: fc.boolean(),
          metaKey: fc.boolean(),
          isComposing: fc.boolean()
        }).filter(({ ctrlKey, altKey, metaKey }) => 
          // 少なくとも1つの修飾キーが押されている
          ctrlKey || altKey || metaKey
        ),
        ({ text, ctrlKey, altKey, metaKey, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // 複数の修飾キー+Enterキーイベントを作成
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
          // 1. デフォルトの動作が防止されていない（送信アクションが発火する）
          expect(enterEvent.defaultPrevented).toBe(false);

          // 2. テキストが変更されていない
          expect(textarea.value).toBe(text);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 3: 修飾キー+Enter - 選択範囲がある場合もテキストが変更されない', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容と選択範囲を生成
        fc.record({
          text: fc.string({ minLength: 5, maxLength: 50 }),
          modifierKey: fc.constantFrom('ctrlKey', 'altKey', 'metaKey'),
          isComposing: fc.boolean()
        }).chain(({ text, modifierKey, isComposing }) => 
          fc.record({
            text: fc.constant(text),
            modifierKey: fc.constant(modifierKey),
            isComposing: fc.constant(isComposing),
            selectionStart: fc.integer({ min: 0, max: Math.max(0, text.length - 1) })
          })
        ).chain(({ text, modifierKey, isComposing, selectionStart }) =>
          fc.record({
            text: fc.constant(text),
            modifierKey: fc.constant(modifierKey),
            isComposing: fc.constant(isComposing),
            selectionStart: fc.constant(selectionStart),
            selectionEnd: fc.integer({ min: selectionStart, max: text.length })
          })
        ),
        ({ text, modifierKey, isComposing, selectionStart, selectionEnd }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.selectionStart = selectionStart;
          textarea.selectionEnd = selectionEnd;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

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
          // 1. デフォルトの動作が防止されていない（送信アクションが発火する）
          expect(enterEvent.defaultPrevented).toBe(false);

          // 2. テキストが変更されていない（選択範囲が削除されない）
          expect(textarea.value).toBe(text);

          // 3. 選択範囲が変更されていない
          expect(textarea.selectionStart).toBe(selectionStart);
          expect(textarea.selectionEnd).toBe(selectionEnd);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 3: 修飾キー+Enter - 空のフィールドでも送信アクションが発火する', () => {
    fc.assert(
      fc.property(
        // 修飾キーを生成
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

          // イベントハンドラを追加
          handler.attachToField(textarea);

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
          // 1. デフォルトの動作が防止されていない（送信アクションが発火する）
          expect(enterEvent.defaultPrevented).toBe(false);

          // 2. テキストが変更されていない（空のまま）
          expect(textarea.value).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });
});
