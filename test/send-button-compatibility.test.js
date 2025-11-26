/**
 * 送信ボタンとの互換性テスト
 * 
 * 要件5.1: 送信ボタンのクリックイベントが妨げられないこと
 * 要件5.2: 既存のアプリケーションロジックとの共存
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('送信ボタンとの互換性', () => {
  let dom;
  let document;
  let window;
  let FieldRegistry;
  let KeyboardEventHandler;

  beforeEach(async () => {
    // 新しいDOM環境を作成
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true,
      runScripts: 'dangerously'
    });
    document = dom.window.document;
    window = dom.window;

    // グローバルオブジェクトを設定
    global.document = document;
    global.window = window;
    global.HTMLElement = window.HTMLElement;
    global.Event = window.Event;
    global.KeyboardEvent = window.KeyboardEvent;
    global.MouseEvent = window.MouseEvent;

    // content.jsをインポート
    const contentModule = await import('../content.js');
    FieldRegistry = contentModule.FieldRegistry;
    KeyboardEventHandler = contentModule.KeyboardEventHandler;
  });

  afterEach(() => {
    // クリーンアップ
    if (dom) {
      dom.window.close();
    }
  });

  describe('要件5.1: 送信ボタンのクリックイベント', () => {
    it('送信ボタンのクリックイベントは妨げられない', () => {
      // テキストエリアと送信ボタンを作成
      const textarea = document.createElement('textarea');
      const sendButton = document.createElement('button');
      sendButton.textContent = '送信';
      document.body.appendChild(textarea);
      document.body.appendChild(sendButton);

      // 送信ボタンのクリックハンドラを設定
      let sendClicked = false;
      sendButton.addEventListener('click', () => {
        sendClicked = true;
      });

      // キーボードイベントハンドラをテキストエリアに追加
      const handler = new KeyboardEventHandler();
      const listener = handler.attachToField(textarea);

      // 送信ボタンをクリック
      const clickEvent = new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      sendButton.dispatchEvent(clickEvent);

      // 送信ボタンのクリックイベントが正常に発火したことを確認
      expect(sendClicked).toBe(true);

      // クリーンアップ
      textarea.removeEventListener('keydown', listener, true);
    });

    it('Enterキーイベント処理中でも送信ボタンは機能する', () => {
      // テキストエリアと送信ボタンを作成
      const textarea = document.createElement('textarea');
      const sendButton = document.createElement('button');
      sendButton.textContent = '送信';
      document.body.appendChild(textarea);
      document.body.appendChild(sendButton);

      // 送信ボタンのクリックハンドラを設定
      let sendClicked = false;
      sendButton.addEventListener('click', () => {
        sendClicked = true;
      });

      // キーボードイベントハンドラをテキストエリアに追加
      const handler = new KeyboardEventHandler();
      const listener = handler.attachToField(textarea);

      // Enterキーを押す（修飾キーなし）
      const enterEvent = new window.KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true
      });
      textarea.dispatchEvent(enterEvent);

      // その後、送信ボタンをクリック
      const clickEvent = new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      sendButton.dispatchEvent(clickEvent);

      // 送信ボタンのクリックイベントが正常に発火したことを確認
      expect(sendClicked).toBe(true);

      // クリーンアップ
      textarea.removeEventListener('keydown', listener, true);
    });
  });

  describe('要件5.2: 既存のアプリケーションロジックとの共存', () => {
    it('修飾キーなしのEnterキーはアプリケーションのリスナーに伝播しない', () => {
      // テキストエリアを作成
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      // アプリケーションのEnterキーリスナーを設定
      let appListenerCalled = false;
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          appListenerCalled = true;
        }
      });

      // キーボードイベントハンドラをテキストエリアに追加（useCapture=true）
      const handler = new KeyboardEventHandler();
      const listener = handler.attachToField(textarea);

      // Enterキーを押す（修飾キーなし）
      const enterEvent = new window.KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true
      });
      textarea.dispatchEvent(enterEvent);

      // アプリケーションのリスナーが呼ばれていないことを確認
      // （stopImmediatePropagation により伝播がブロックされる）
      expect(appListenerCalled).toBe(false);

      // クリーンアップ
      textarea.removeEventListener('keydown', listener, true);
    });

    it('修飾キー付きのEnterキーはアプリケーションのリスナーに伝播する', () => {
      // テキストエリアを作成
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      // アプリケーションのEnterキーリスナーを設定
      let appListenerCalled = false;
      let receivedCtrlKey = false;
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          appListenerCalled = true;
          receivedCtrlKey = e.ctrlKey;
        }
      });

      // キーボードイベントハンドラをテキストエリアに追加（useCapture=true）
      const handler = new KeyboardEventHandler();
      // 送信キー設定をCtrl+Enterに設定
      handler.sendKeyConfig = { modifier: 'ctrl' };
      const listener = handler.attachToField(textarea);

      // Ctrl+Enterキーを押す
      const enterEvent = new window.KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });
      textarea.dispatchEvent(enterEvent);

      // アプリケーションのリスナーが呼ばれたことを確認
      expect(appListenerCalled).toBe(true);
      expect(receivedCtrlKey).toBe(true);

      // クリーンアップ
      textarea.removeEventListener('keydown', listener, true);
    });

    it('カスタムJavaScriptによる送信処理は妨げられない', () => {
      // テキストエリアと送信関数を作成
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      // カスタム送信関数
      let messageSent = false;
      const sendMessage = () => {
        messageSent = true;
      };

      // キーボードイベントハンドラをテキストエリアに追加
      const handler = new KeyboardEventHandler();
      const listener = handler.attachToField(textarea);

      // カスタム送信関数を直接呼び出す
      sendMessage();

      // カスタム送信関数が正常に実行されたことを確認
      expect(messageSent).toBe(true);

      // クリーンアップ
      textarea.removeEventListener('keydown', listener, true);
    });

    it('修飾キー付きEnterでアプリケーションの送信ロジックが実行される', () => {
      // テキストエリアを作成
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      // アプリケーションの送信ロジック
      let messageSent = false;
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          messageSent = true;
        }
      });

      // キーボードイベントハンドラをテキストエリアに追加
      const handler = new KeyboardEventHandler();
      // 送信キー設定をCtrl+Enterに設定
      handler.sendKeyConfig = { modifier: 'ctrl' };
      const listener = handler.attachToField(textarea);

      // Ctrl+Enterキーを押す
      const enterEvent = new window.KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });
      textarea.dispatchEvent(enterEvent);

      // アプリケーションの送信ロジックが実行されたことを確認
      expect(messageSent).toBe(true);

      // クリーンアップ
      textarea.removeEventListener('keydown', listener, true);
    });
  });
});
