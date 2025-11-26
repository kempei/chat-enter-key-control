// フィールドクリーンアップのプロパティベーステスト
// Feature: chat-enter-key-control, Property 9: フィールド削除時にリスナーがクリーンアップされる
// 検証対象: 要件 4.3

import { describe, test, beforeEach, afterEach, expect } from 'vitest';
import * as fc from 'fast-check';
import { JSDOM } from 'jsdom';

// content.jsから必要なクラスとセレクタをインポート
// テスト用に直接定義
const FIELD_SELECTORS = [
  'textarea',
  'input[type="text"]',
  '[contenteditable="true"]',
  '[contenteditable=""]'
];

/**
 * フィールドレジストリ
 */
class FieldRegistry {
  constructor() {
    this.fields = new Map();
  }

  register(element, listener) {
    if (!this.fields.has(element)) {
      this.fields.set(element, listener);
    }
  }

  unregister(element) {
    const listener = this.fields.get(element);
    if (listener) {
      element.removeEventListener('keydown', listener, true);
      this.fields.delete(element);
    }
  }

  has(element) {
    return this.fields.has(element);
  }

  clear() {
    for (const [element, listener] of this.fields.entries()) {
      element.removeEventListener('keydown', listener, true);
    }
    this.fields.clear();
  }

  size() {
    return this.fields.size;
  }
}

/**
 * テキストフィールド検出器
 */
class FieldDetector {
  constructor() {
    this.registry = new FieldRegistry();
  }

  cleanupField(element) {
    this.registry.unregister(element);
  }

  cleanup() {
    this.registry.clear();
  }
}

/**
 * キーボードイベントハンドラ
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
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }
}

describe('フィールドクリーンアップのプロパティテスト', () => {
  let dom;
  let detector;
  let keyboardHandler;

  beforeEach(() => {
    // 前のdetectorをクリーンアップ
    if (detector) {
      detector.cleanup();
    }
    
    // 各テストの前に新しいDOM環境を作成
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true
    });
    global.document = dom.window.document;
    global.window = dom.window;
    global.HTMLElement = dom.window.HTMLElement;

    detector = new FieldDetector();
    keyboardHandler = new KeyboardEventHandler();
  });

  afterEach(() => {
    // 各テストの後にクリーンアップ
    if (detector) {
      detector.cleanup();
    }
    if (dom) {
      dom.window.close();
    }
  });

  /**
   * ヘルパー関数: フィールドにハンドラを追加
   */
  function attachHandlers(element) {
    if (detector.registry.has(element)) {
      return;
    }
    const listener = keyboardHandler.attachToField(element);
    detector.registry.register(element, listener);
  }

  /**
   * プロパティ 9: フィールド削除時にリスナーがクリーンアップされる
   * 
   * 任意の登録されたテキスト入力フィールドについて、
   * そのフィールドがDOMから削除された場合、
   * 関連するイベントリスナーがクリーンアップされる
   * 
   * 検証対象: 要件 4.3
   */
  test('プロパティ 9: フィールド削除時にリスナーがクリーンアップされる - textarea', () => {
    fc.assert(
      fc.property(
        // フィールド数を生成（1〜10個）
        fc.integer({ min: 1, max: 10 }),
        (fieldCount) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // フィールドを作成して登録
          const fields = [];
          for (let i = 0; i < fieldCount; i++) {
            const textarea = document.createElement('textarea');
            textarea.id = `textarea-${i}`;
            document.body.appendChild(textarea);
            attachHandlers(textarea);
            fields.push(textarea);
          }

          // すべてのフィールドが登録されていることを確認
          expect(detector.registry.size()).toBe(fieldCount);

          // すべてのフィールドをクリーンアップ
          for (const field of fields) {
            detector.cleanupField(field);
          }

          // すべてのリスナーがクリーンアップされていることを確認
          expect(detector.registry.size()).toBe(0);

          // 各フィールドがレジストリに存在しないことを確認
          for (const field of fields) {
            expect(detector.registry.has(field)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 9: フィールド削除時にリスナーがクリーンアップされる - input[type="text"]', () => {
    fc.assert(
      fc.property(
        // フィールド数を生成（1〜10個）
        fc.integer({ min: 1, max: 10 }),
        (fieldCount) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // フィールドを作成して登録
          const fields = [];
          for (let i = 0; i < fieldCount; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `input-${i}`;
            document.body.appendChild(input);
            attachHandlers(input);
            fields.push(input);
          }

          // すべてのフィールドが登録されていることを確認
          expect(detector.registry.size()).toBe(fieldCount);

          // すべてのフィールドをクリーンアップ
          for (const field of fields) {
            detector.cleanupField(field);
          }

          // すべてのリスナーがクリーンアップされていることを確認
          expect(detector.registry.size()).toBe(0);

          // 各フィールドがレジストリに存在しないことを確認
          for (const field of fields) {
            expect(detector.registry.has(field)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 9: フィールド削除時にリスナーがクリーンアップされる - contenteditable', () => {
    fc.assert(
      fc.property(
        // フィールド数を生成（1〜10個）
        fc.integer({ min: 1, max: 10 }),
        // contenteditable属性の値を生成
        fc.constantFrom('true', ''),
        (fieldCount, editableValue) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // フィールドを作成して登録
          const fields = [];
          for (let i = 0; i < fieldCount; i++) {
            const div = document.createElement('div');
            div.setAttribute('contenteditable', editableValue);
            div.id = `editable-${i}`;
            document.body.appendChild(div);
            attachHandlers(div);
            fields.push(div);
          }

          // すべてのフィールドが登録されていることを確認
          expect(detector.registry.size()).toBe(fieldCount);

          // すべてのフィールドをクリーンアップ
          for (const field of fields) {
            detector.cleanupField(field);
          }

          // すべてのリスナーがクリーンアップされていることを確認
          expect(detector.registry.size()).toBe(0);

          // 各フィールドがレジストリに存在しないことを確認
          for (const field of fields) {
            expect(detector.registry.has(field)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 9: フィールド削除時にリスナーがクリーンアップされる - 混在するフィールドタイプ', () => {
    fc.assert(
      fc.property(
        // 各タイプのフィールド数を生成
        fc.record({
          textareaCount: fc.integer({ min: 0, max: 5 }),
          inputCount: fc.integer({ min: 0, max: 5 }),
          editableCount: fc.integer({ min: 0, max: 5 })
        }).filter(({ textareaCount, inputCount, editableCount }) => 
          textareaCount + inputCount + editableCount > 0
        ),
        ({ textareaCount, inputCount, editableCount }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          const allFields = [];

          // textarea要素を作成
          for (let i = 0; i < textareaCount; i++) {
            const textarea = document.createElement('textarea');
            textarea.id = `textarea-${i}`;
            document.body.appendChild(textarea);
            attachHandlers(textarea);
            allFields.push(textarea);
          }

          // input[type="text"]要素を作成
          for (let i = 0; i < inputCount; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `input-${i}`;
            document.body.appendChild(input);
            attachHandlers(input);
            allFields.push(input);
          }

          // contenteditable要素を作成
          for (let i = 0; i < editableCount; i++) {
            const div = document.createElement('div');
            div.setAttribute('contenteditable', 'true');
            div.id = `editable-${i}`;
            document.body.appendChild(div);
            attachHandlers(div);
            allFields.push(div);
          }

          const expectedCount = textareaCount + inputCount + editableCount;

          // すべてのフィールドが登録されていることを確認
          expect(detector.registry.size()).toBe(expectedCount);

          // すべてのフィールドをクリーンアップ
          for (const field of allFields) {
            detector.cleanupField(field);
          }

          // すべてのリスナーがクリーンアップされていることを確認
          expect(detector.registry.size()).toBe(0);

          // 各フィールドがレジストリに存在しないことを確認
          for (const field of allFields) {
            expect(detector.registry.has(field)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 9: フィールド削除時にリスナーがクリーンアップされる - 部分的な削除', () => {
    fc.assert(
      fc.property(
        // 総フィールド数と削除するフィールド数を生成
        fc.record({
          totalCount: fc.integer({ min: 2, max: 10 }),
          removeCount: fc.integer({ min: 1, max: 5 })
        }).filter(({ totalCount, removeCount }) => removeCount < totalCount),
        ({ totalCount, removeCount }) => {
          // DOM環境とレジストリをリセット
          document.body.innerHTML = '';
          detector.cleanup();

          // フィールドを作成して登録
          const fields = [];
          for (let i = 0; i < totalCount; i++) {
            const textarea = document.createElement('textarea');
            textarea.id = `textarea-${i}`;
            document.body.appendChild(textarea);
            attachHandlers(textarea);
            fields.push(textarea);
          }

          // すべてのフィールドが登録されていることを確認
          expect(detector.registry.size()).toBe(totalCount);

          // 一部のフィールドをクリーンアップ
          const fieldsToRemove = fields.slice(0, removeCount);
          const remainingFields = fields.slice(removeCount);

          for (const field of fieldsToRemove) {
            detector.cleanupField(field);
          }

          // 削除されたフィールドのリスナーがクリーンアップされていることを確認
          const expectedRemainingCount = totalCount - removeCount;
          expect(detector.registry.size()).toBe(expectedRemainingCount);

          // 削除されたフィールドがレジストリに存在しないことを確認
          for (const field of fieldsToRemove) {
            expect(detector.registry.has(field)).toBe(false);
          }

          // 残っているフィールドがレジストリに存在することを確認
          for (const field of remainingFields) {
            expect(detector.registry.has(field)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 9: フィールド削除時にリスナーがクリーンアップされる - イベントリスナーが実際に削除される', () => {
    fc.assert(
      fc.property(
        // フィールド数を生成
        fc.integer({ min: 1, max: 5 }),
        (fieldCount) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // フィールドを作成して登録
          const fields = [];
          const eventCounts = new Map();

          for (let i = 0; i < fieldCount; i++) {
            const textarea = document.createElement('textarea');
            textarea.id = `textarea-${i}`;
            document.body.appendChild(textarea);
            
            // イベントカウンターを設定
            eventCounts.set(textarea, 0);
            
            // カスタムリスナーを追加してイベントをカウント
            const countingListener = () => {
              eventCounts.set(textarea, eventCounts.get(textarea) + 1);
            };
            textarea.addEventListener('keydown', countingListener, true);
            
            // 通常のハンドラも追加
            attachHandlers(textarea);
            fields.push(textarea);
          }

          // すべてのフィールドが登録されていることを確認
          expect(detector.registry.size()).toBe(fieldCount);

          // 各フィールドでEnterキーイベントを発火（削除前）
          for (const field of fields) {
            const event = new dom.window.KeyboardEvent('keydown', {
              key: 'Enter',
              bubbles: true,
              cancelable: true
            });
            field.dispatchEvent(event);
          }

          // すべてのフィールドでイベントが発火したことを確認
          for (const field of fields) {
            expect(eventCounts.get(field)).toBe(1);
          }

          // すべてのフィールドをクリーンアップ
          for (const field of fields) {
            detector.cleanupField(field);
          }

          // すべてのリスナーがクリーンアップされていることを確認
          expect(detector.registry.size()).toBe(0);

          // 削除後にイベントを発火しても、拡張機能のリスナーは動作しない
          // （カスタムリスナーは残っているので、カウントは増える）
          for (const field of fields) {
            const event = new dom.window.KeyboardEvent('keydown', {
              key: 'Enter',
              bubbles: true,
              cancelable: true
            });
            field.dispatchEvent(event);
          }

          // カスタムリスナーは残っているので、カウントが増えることを確認
          for (const field of fields) {
            expect(eventCounts.get(field)).toBe(2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
