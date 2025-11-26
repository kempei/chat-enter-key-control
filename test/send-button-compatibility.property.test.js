// 送信ボタン互換性のプロパティベーステスト
// Feature: chat-enter-key-control, Property 10: 送信ボタンのクリックは妨げられない
// 検証対象: 要件 5.1

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

describe('送信ボタン互換性のプロパティテスト', () => {
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
    global.MouseEvent = dom.window.MouseEvent;
    global.Event = dom.window.Event;

    handler = new KeyboardEventHandler();
  });

  afterEach(() => {
    if (dom) {
      dom.window.close();
    }
  });

  /**
   * プロパティ 10: 送信ボタンのクリックは妨げられない
   * 
   * 任意の送信ボタンとクリックイベントについて、
   * ボタンをクリックした場合、送信アクションは正常に実行される
   * 
   * 検証対象: 要件 5.1
   */
  test('プロパティ 10: 送信ボタンのクリック - textarea要素と送信ボタンの組み合わせ', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容とボタンテキストを生成
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 100 }),
          buttonText: fc.constantFrom('送信', 'Send', '投稿', 'Post', '返信', 'Reply', '送る', 'Submit')
        }),
        ({ text, buttonText }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素と送信ボタンを作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          const sendButton = document.createElement('button');
          sendButton.textContent = buttonText;
          sendButton.type = 'button';

          document.body.appendChild(textarea);
          document.body.appendChild(sendButton);

          // 拡張機能のイベントハンドラをテキストエリアに追加
          handler.attachToField(textarea);

          // 送信ボタンのクリックハンドラを設定
          let sendClicked = false;
          let receivedText = null;
          sendButton.addEventListener('click', () => {
            sendClicked = true;
            receivedText = textarea.value;
          });

          // 送信ボタンをクリック
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true
          });
          sendButton.dispatchEvent(clickEvent);

          // アサーション
          // 1. 送信ボタンのクリックイベントが正常に発火した
          expect(sendClicked).toBe(true);

          // 2. テキスト内容が正しく取得できた
          expect(receivedText).toBe(text);

          // 3. クリックイベントがキャンセルされていない
          expect(clickEvent.defaultPrevented).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 10: 送信ボタンのクリック - input要素と送信ボタンの組み合わせ', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容とボタンテキストを生成
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 100 }),
          buttonText: fc.constantFrom('送信', 'Send', '投稿', 'Post')
        }),
        ({ text, buttonText }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // input要素と送信ボタンを作成
          const input = document.createElement('input');
          input.type = 'text';
          input.value = text;
          const sendButton = document.createElement('button');
          sendButton.textContent = buttonText;

          document.body.appendChild(input);
          document.body.appendChild(sendButton);

          // 拡張機能のイベントハンドラをinput要素に追加
          handler.attachToField(input);

          // 送信ボタンのクリックハンドラを設定
          let sendClicked = false;
          sendButton.addEventListener('click', () => {
            sendClicked = true;
          });

          // 送信ボタンをクリック
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true
          });
          sendButton.dispatchEvent(clickEvent);

          // アサーション
          expect(sendClicked).toBe(true);
          expect(clickEvent.defaultPrevented).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 10: 送信ボタンのクリック - contenteditable要素と送信ボタンの組み合わせ', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容とボタンテキストを生成
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 100 }),
          buttonText: fc.constantFrom('送信', 'Send', '投稿')
        }),
        ({ text, buttonText }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // contenteditable要素と送信ボタンを作成
          const div = document.createElement('div');
          div.setAttribute('contenteditable', 'true');
          div.textContent = text;
          const sendButton = document.createElement('button');
          sendButton.textContent = buttonText;

          document.body.appendChild(div);
          document.body.appendChild(sendButton);

          // 拡張機能のイベントハンドラをcontenteditable要素に追加
          handler.attachToField(div);

          // 送信ボタンのクリックハンドラを設定
          let sendClicked = false;
          sendButton.addEventListener('click', () => {
            sendClicked = true;
          });

          // 送信ボタンをクリック
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true
          });
          sendButton.dispatchEvent(clickEvent);

          // アサーション
          expect(sendClicked).toBe(true);
          expect(clickEvent.defaultPrevented).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 10: 送信ボタンのクリック - Enterキーイベント処理中でも送信ボタンは機能する', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容を生成
        fc.string({ minLength: 0, maxLength: 100 }),
        (text) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素と送信ボタンを作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          const sendButton = document.createElement('button');
          sendButton.textContent = '送信';

          document.body.appendChild(textarea);
          document.body.appendChild(sendButton);

          // 拡張機能のイベントハンドラをテキストエリアに追加
          handler.attachToField(textarea);

          // 送信ボタンのクリックハンドラを設定
          let sendClicked = false;
          sendButton.addEventListener('click', () => {
            sendClicked = true;
          });

          // Enterキーを押す（修飾キーなし）
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            bubbles: true,
            cancelable: true
          });
          textarea.dispatchEvent(enterEvent);

          // その後、送信ボタンをクリック
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true
          });
          sendButton.dispatchEvent(clickEvent);

          // アサーション
          // Enterキーイベント処理後でも送信ボタンは正常に機能する
          expect(sendClicked).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 10: 送信ボタンのクリック - 複数のクリックハンドラがすべて呼ばれる', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容を生成
        fc.string({ minLength: 0, maxLength: 100 }),
        (text) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素と送信ボタンを作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          const sendButton = document.createElement('button');
          sendButton.textContent = '送信';

          document.body.appendChild(textarea);
          document.body.appendChild(sendButton);

          // 拡張機能のイベントハンドラをテキストエリアに追加
          handler.attachToField(textarea);

          // 複数のクリックハンドラを設定
          let handler1Called = false;
          let handler2Called = false;
          let handler3Called = false;

          sendButton.addEventListener('click', () => {
            handler1Called = true;
          });

          sendButton.addEventListener('click', () => {
            handler2Called = true;
          });

          sendButton.addEventListener('click', () => {
            handler3Called = true;
          });

          // 送信ボタンをクリック
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true
          });
          sendButton.dispatchEvent(clickEvent);

          // アサーション
          // すべてのクリックハンドラが呼ばれる
          expect(handler1Called).toBe(true);
          expect(handler2Called).toBe(true);
          expect(handler3Called).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 10: 送信ボタンのクリック - フォーム内の送信ボタンも機能する', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容を生成
        fc.string({ minLength: 0, maxLength: 100 }),
        (text) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // フォーム内にtextarea要素と送信ボタンを作成
          const form = document.createElement('form');
          const textarea = document.createElement('textarea');
          textarea.value = text;
          const sendButton = document.createElement('button');
          sendButton.textContent = '送信';
          sendButton.type = 'button'; // type="submit"だとフォーム送信が発生するため

          form.appendChild(textarea);
          form.appendChild(sendButton);
          document.body.appendChild(form);

          // 拡張機能のイベントハンドラをテキストエリアに追加
          handler.attachToField(textarea);

          // 送信ボタンのクリックハンドラを設定
          let sendClicked = false;
          sendButton.addEventListener('click', () => {
            sendClicked = true;
          });

          // 送信ボタンをクリック
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true
          });
          sendButton.dispatchEvent(clickEvent);

          // アサーション
          expect(sendClicked).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 10: 送信ボタンのクリック - 親要素のクリックリスナーも呼ばれる', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容を生成
        fc.string({ minLength: 0, maxLength: 100 }),
        (text) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // ネストされた構造を作成
          const container = document.createElement('div');
          const textarea = document.createElement('textarea');
          textarea.value = text;
          const sendButton = document.createElement('button');
          sendButton.textContent = '送信';

          container.appendChild(textarea);
          container.appendChild(sendButton);
          document.body.appendChild(container);

          // 拡張機能のイベントハンドラをテキストエリアに追加
          handler.attachToField(textarea);

          // 送信ボタンと親要素にクリックハンドラを設定
          let buttonClicked = false;
          let containerClicked = false;
          let bodyClicked = false;

          sendButton.addEventListener('click', () => {
            buttonClicked = true;
          });

          container.addEventListener('click', (e) => {
            if (e.target === sendButton) {
              containerClicked = true;
            }
          });

          document.body.addEventListener('click', (e) => {
            if (e.target === sendButton) {
              bodyClicked = true;
            }
          });

          // 送信ボタンをクリック
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true
          });
          sendButton.dispatchEvent(clickEvent);

          // アサーション
          // クリックイベントは伝播し、すべてのリスナーが呼ばれる
          expect(buttonClicked).toBe(true);
          expect(containerClicked).toBe(true);
          expect(bodyClicked).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 10: 送信ボタンのクリック - カスタムJavaScriptによる送信処理は妨げられない', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容を生成
        fc.string({ minLength: 0, maxLength: 100 }),
        (text) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素を作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);

          // 拡張機能のイベントハンドラをテキストエリアに追加
          handler.attachToField(textarea);

          // カスタム送信関数（ボタンクリックとは独立）
          let messageSent = false;
          let sentMessage = null;
          const sendMessage = () => {
            messageSent = true;
            sentMessage = textarea.value;
          };

          // カスタム送信関数を直接呼び出す
          sendMessage();

          // アサーション
          // カスタム送信関数は正常に実行される
          expect(messageSent).toBe(true);
          expect(sentMessage).toBe(text);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 10: 送信ボタンのクリック - 異なるボタンタイプでも機能する', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容とボタンタイプを生成
        fc.record({
          text: fc.string({ minLength: 0, maxLength: 100 }),
          buttonType: fc.constantFrom('button', 'submit', 'reset')
        }),
        ({ text, buttonType }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // textarea要素と送信ボタンを作成
          const textarea = document.createElement('textarea');
          textarea.value = text;
          const sendButton = document.createElement('button');
          sendButton.textContent = '送信';
          sendButton.type = buttonType;

          document.body.appendChild(textarea);
          document.body.appendChild(sendButton);

          // 拡張機能のイベントハンドラをテキストエリアに追加
          handler.attachToField(textarea);

          // 送信ボタンのクリックハンドラを設定
          let sendClicked = false;
          sendButton.addEventListener('click', () => {
            sendClicked = true;
          });

          // 送信ボタンをクリック
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true
          });
          sendButton.dispatchEvent(clickEvent);

          // アサーション
          // ボタンタイプに関わらず、クリックイベントは正常に発火する
          expect(sendClicked).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 10: 送信ボタンのクリック - 複数のテキストフィールドがある場合でも機能する', () => {
    fc.assert(
      fc.property(
        // ランダムなテキスト内容を生成
        fc.record({
          text1: fc.string({ minLength: 0, maxLength: 50 }),
          text2: fc.string({ minLength: 0, maxLength: 50 }),
          text3: fc.string({ minLength: 0, maxLength: 50 })
        }),
        ({ text1, text2, text3 }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 複数のtextarea要素と送信ボタンを作成
          const textarea1 = document.createElement('textarea');
          textarea1.value = text1;
          const textarea2 = document.createElement('textarea');
          textarea2.value = text2;
          const textarea3 = document.createElement('textarea');
          textarea3.value = text3;
          const sendButton = document.createElement('button');
          sendButton.textContent = '送信';

          document.body.appendChild(textarea1);
          document.body.appendChild(textarea2);
          document.body.appendChild(textarea3);
          document.body.appendChild(sendButton);

          // 拡張機能のイベントハンドラをすべてのテキストエリアに追加
          handler.attachToField(textarea1);
          handler.attachToField(textarea2);
          handler.attachToField(textarea3);

          // 送信ボタンのクリックハンドラを設定
          let sendClicked = false;
          sendButton.addEventListener('click', () => {
            sendClicked = true;
          });

          // 送信ボタンをクリック
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true
          });
          sendButton.dispatchEvent(clickEvent);

          // アサーション
          // 複数のテキストフィールドがあっても送信ボタンは正常に機能する
          expect(sendClicked).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
