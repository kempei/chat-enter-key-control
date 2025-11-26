// 送信キー設定のプロパティベーステスト
// Feature: chat-enter-key-control, Property 3: 設定された送信キーは送信アクションを発火する
// 検証対象: 要件 2.1, 9.3
// Feature: chat-enter-key-control, Property 19: 設定と異なる修飾キーは改行を挿入する
// 検証対象: 要件 2.2, 9.4
// Feature: chat-enter-key-control, Property 21: Enterのみ設定時のIME保護
// 検証対象: 要件 9.6

import { describe, test, beforeEach, afterEach, expect } from 'vitest';
import * as fc from 'fast-check';
import { JSDOM } from 'jsdom';

/**
 * キーボードイベントハンドラ（content.jsから）
 */
class KeyboardEventHandler {
  constructor() {
    // 送信キー設定をキャッシュ（デフォルトはCmd+Enter）
    this.sendKeyConfig = { modifier: 'cmd' };
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

  attachToField(element) {
    const listener = (event) => this.handleKeyDown(event);
    element.addEventListener('keydown', listener, true);
    return listener;
  }

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

  insertLineBreak(element) {
    if (element.isContentEditable) {
      document.execCommand('insertLineBreak');
    } else if (element.tagName === 'TEXTAREA') {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;

      element.value = value.substring(0, start) + '\n' + value.substring(end);
      element.selectionStart = element.selectionEnd = start + 1;

      const inputEvent = new Event('input', { bubbles: true, cancelable: true });
      element.dispatchEvent(inputEvent);
    }
    // input[type="text"]要素の場合は何もしない
  }
}

describe('送信キー設定のプロパティテスト', () => {
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
   * プロパティ 3: 設定された送信キーは送信アクションを発火する
   * 
   * 任意のテキスト入力フィールドと設定された送信キーにおいて、
   * その送信キーを押下した場合、送信アクションが発火する
   * 
   * 検証対象: 要件 2.1, 9.3
   */
  test('プロパティ 3: Ctrl+Enterが設定されている場合、Ctrl+Enterで送信が許可される', () => {
    fc.assert(
      fc.property(
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.constant(false)
        }),
        ({ text, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 送信キー設定をCtrl+Enterに設定
          handler.sendKeyConfig = { modifier: 'ctrl' };

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // Ctrl+Enterキーイベントを作成
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            ctrlKey: true,
            altKey: false,
            metaKey: false,
            shiftKey: false,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          // 1. デフォルトの動作が防止されていない（送信が許可される）
          expect(enterEvent.defaultPrevented).toBe(false);

          // 2. テキストが変更されていない（改行が挿入されていない）
          expect(textarea.value).toBe(text);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 3: Alt+Enterが設定されている場合、Alt+Enterで送信が許可される', () => {
    fc.assert(
      fc.property(
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.constant(false)
        }),
        ({ text, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 送信キー設定をAlt+Enterに設定
          handler.sendKeyConfig = { modifier: 'alt' };

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // Alt+Enterキーイベントを作成
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            ctrlKey: false,
            altKey: true,
            metaKey: false,
            shiftKey: false,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          expect(enterEvent.defaultPrevented).toBe(false);
          expect(textarea.value).toBe(text);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 3: Cmd+Enterが設定されている場合、Cmd+Enterで送信が許可される', () => {
    fc.assert(
      fc.property(
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.constant(false)
        }),
        ({ text, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 送信キー設定をCmd+Enterに設定（デフォルト）
          handler.sendKeyConfig = { modifier: 'cmd' };

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // Cmd+Enterキーイベントを作成
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            ctrlKey: false,
            altKey: false,
            metaKey: true,
            shiftKey: false,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          expect(enterEvent.defaultPrevented).toBe(false);
          expect(textarea.value).toBe(text);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 3: Shift+Enterが設定されている場合、Shift+Enterで送信が許可される', () => {
    fc.assert(
      fc.property(
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.constant(false)
        }),
        ({ text, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 送信キー設定をShift+Enterに設定
          handler.sendKeyConfig = { modifier: 'shift' };

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // Shift+Enterキーイベントを作成
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            ctrlKey: false,
            altKey: false,
            metaKey: false,
            shiftKey: true,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          expect(enterEvent.defaultPrevented).toBe(false);
          expect(textarea.value).toBe(text);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 3: Enterのみが設定されている場合、Enterで送信が許可される', () => {
    fc.assert(
      fc.property(
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.constant(false)
        }),
        ({ text, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 送信キー設定をEnterのみに設定
          handler.sendKeyConfig = { modifier: 'none' };

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // Enterキーイベントを作成（修飾キーなし）
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            ctrlKey: false,
            altKey: false,
            metaKey: false,
            shiftKey: false,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          expect(enterEvent.defaultPrevented).toBe(false);
          expect(textarea.value).toBe(text);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * プロパティ 19: 設定と異なる修飾キーは改行を挿入する
   * 
   * 任意のテキスト入力フィールドと送信キー設定において、
   * 設定と異なる修飾キー+Enterを押下した場合、改行が挿入され送信アクションは発火しない
   * 
   * 検証対象: 要件 2.2, 9.4
   */
  test('プロパティ 19: Ctrl+Enterが設定されている場合、Alt+Enterで改行が挿入される', () => {
    fc.assert(
      fc.property(
        fc.record({
          textBefore: fc.string({ minLength: 0, maxLength: 50 }),
          textAfter: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.constant(false)
        }),
        ({ textBefore, textAfter, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 送信キー設定をCtrl+Enterに設定
          handler.sendKeyConfig = { modifier: 'ctrl' };

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = textBefore + textAfter;
          textarea.selectionStart = textBefore.length;
          textarea.selectionEnd = textBefore.length;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // Alt+Enterキーイベントを作成（設定と異なる）
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            ctrlKey: false,
            altKey: true,
            metaKey: false,
            shiftKey: false,
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
          const expectedValue = textBefore + '\n' + textAfter;
          expect(textarea.value).toBe(expectedValue);

          // 3. カーソル位置が改行の後に移動している
          expect(textarea.selectionStart).toBe(textBefore.length + 1);
          expect(textarea.selectionEnd).toBe(textBefore.length + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 19: Cmd+Enterが設定されている場合、Enterのみで改行が挿入される', () => {
    fc.assert(
      fc.property(
        fc.record({
          textBefore: fc.string({ minLength: 0, maxLength: 50 }),
          textAfter: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.constant(false)
        }),
        ({ textBefore, textAfter, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 送信キー設定をCmd+Enterに設定（デフォルト）
          handler.sendKeyConfig = { modifier: 'cmd' };

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = textBefore + textAfter;
          textarea.selectionStart = textBefore.length;
          textarea.selectionEnd = textBefore.length;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // Enterキーイベントを作成（修飾キーなし、設定と異なる）
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            ctrlKey: false,
            altKey: false,
            metaKey: false,
            shiftKey: false,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          expect(enterEvent.defaultPrevented).toBe(true);
          const expectedValue = textBefore + '\n' + textAfter;
          expect(textarea.value).toBe(expectedValue);
          expect(textarea.selectionStart).toBe(textBefore.length + 1);
          expect(textarea.selectionEnd).toBe(textBefore.length + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 19: Enterのみが設定されている場合、Ctrl+Enterで改行が挿入される', () => {
    fc.assert(
      fc.property(
        fc.record({
          textBefore: fc.string({ minLength: 0, maxLength: 50 }),
          textAfter: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.constant(false)
        }),
        ({ textBefore, textAfter, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 送信キー設定をEnterのみに設定
          handler.sendKeyConfig = { modifier: 'none' };

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = textBefore + textAfter;
          textarea.selectionStart = textBefore.length;
          textarea.selectionEnd = textBefore.length;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // Ctrl+Enterキーイベントを作成（設定と異なる）
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            ctrlKey: true,
            altKey: false,
            metaKey: false,
            shiftKey: false,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          expect(enterEvent.defaultPrevented).toBe(true);
          const expectedValue = textBefore + '\n' + textAfter;
          expect(textarea.value).toBe(expectedValue);
          expect(textarea.selectionStart).toBe(textBefore.length + 1);
          expect(textarea.selectionEnd).toBe(textBefore.length + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 19: 複数の修飾キーが同時に押された場合は改行が挿入される', () => {
    fc.assert(
      fc.property(
        fc.record({
          textBefore: fc.string({ minLength: 0, maxLength: 50 }),
          textAfter: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.constant(false)
        }),
        ({ textBefore, textAfter, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 送信キー設定をCmd+Enterに設定
          handler.sendKeyConfig = { modifier: 'cmd' };

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = textBefore + textAfter;
          textarea.selectionStart = textBefore.length;
          textarea.selectionEnd = textBefore.length;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // Cmd+Ctrl+Enterキーイベントを作成（複数の修飾キー）
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            ctrlKey: true,
            altKey: false,
            metaKey: true,
            shiftKey: false,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          // 複数の修飾キーが押されている場合は設定と一致しないため改行が挿入される
          expect(enterEvent.defaultPrevented).toBe(true);
          const expectedValue = textBefore + '\n' + textAfter;
          expect(textarea.value).toBe(expectedValue);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * プロパティ 21: Enterのみ設定時のIME保護
   * 
   * 任意のテキスト入力フィールドにおいて、送信キーが「Enterのみ」に設定されている場合でも、
   * IME入力中のEnter押下では送信アクションは発火しない
   * 
   * 検証対象: 要件 9.6
   */
  test('プロパティ 21: Enterのみ設定時、IME入力中のEnterで送信が防止される', () => {
    fc.assert(
      fc.property(
        fc.record({
          textBefore: fc.string({ minLength: 0, maxLength: 50 }),
          textAfter: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.constant(true) // IME入力中
        }),
        ({ textBefore, textAfter, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 送信キー設定をEnterのみに設定
          handler.sendKeyConfig = { modifier: 'none' };

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = textBefore + textAfter;
          textarea.selectionStart = textBefore.length;
          textarea.selectionEnd = textBefore.length;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // IME入力中のEnterキーイベントを作成
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            ctrlKey: false,
            altKey: false,
            metaKey: false,
            shiftKey: false,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          // 1. デフォルトの動作が防止されている（送信が防止される）
          expect(enterEvent.defaultPrevented).toBe(true);

          // 2. IME入力中なので改行は挿入されない（値は変更されない）
          const expectedValue = textBefore + textAfter;
          expect(textarea.value).toBe(expectedValue);

          // 3. カーソル位置は変更されない
          expect(textarea.selectionStart).toBe(textBefore.length);
          expect(textarea.selectionEnd).toBe(textBefore.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 21: Enterのみ設定時、IME入力中でなければEnterで送信が許可される', () => {
    fc.assert(
      fc.property(
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          isComposing: fc.constant(false) // IME入力中でない
        }),
        ({ text, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 送信キー設定をEnterのみに設定
          handler.sendKeyConfig = { modifier: 'none' };

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // Enterキーイベントを作成（IME入力中でない）
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            ctrlKey: false,
            altKey: false,
            metaKey: false,
            shiftKey: false,
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          // IME入力中でない場合は送信が許可される
          expect(enterEvent.defaultPrevented).toBe(false);
          expect(textarea.value).toBe(text);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 21: 他の送信キー設定でもIME入力中は送信が防止される', () => {
    fc.assert(
      fc.property(
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 50 }),
          modifier: fc.constantFrom('ctrl', 'alt', 'cmd', 'shift'),
          isComposing: fc.constant(true) // IME入力中
        }),
        ({ text, modifier, isComposing }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 送信キー設定を設定
          handler.sendKeyConfig = { modifier };

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);

          // イベントハンドラを追加
          handler.attachToField(textarea);

          // 設定された送信キーのイベントを作成（IME入力中）
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            ctrlKey: modifier === 'ctrl',
            altKey: modifier === 'alt',
            metaKey: modifier === 'cmd',
            shiftKey: modifier === 'shift',
            isComposing: isComposing,
            bubbles: true,
            cancelable: true
          });

          // イベントを発火
          textarea.dispatchEvent(enterEvent);

          // アサーション
          // IME入力中は送信キーが押されていても送信が防止される
          expect(enterEvent.defaultPrevented).toBe(true);
          expect(textarea.value).toBe(text);
        }
      ),
      { numRuns: 100 }
    );
  });
});
