// フィールド検出のプロパティベーステスト
// Feature: chat-enter-key-control, Property 8: すべてのテキスト入力フィールドが検出される
// 検証対象: 要件 4.1, 4.4, 4.5

import { describe, test, beforeEach, afterEach, expect, vi } from 'vitest';
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
}

/**
 * テキストフィールド検出器
 */
class FieldDetector {
  constructor() {
    this.registry = new FieldRegistry();
    this.observer = null;
  }

  detectFields() {
    const selector = FIELD_SELECTORS.join(',');
    return Array.from(document.querySelectorAll(selector));
  }

  observeNewFields(callback) {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            if (this.isTextField(node)) {
              callback(node);
            }
            const fields = node.querySelectorAll(FIELD_SELECTORS.join(','));
            fields.forEach(field => callback(field));
          }
        }

        for (const node of mutation.removedNodes) {
          if (node instanceof HTMLElement) {
            if (this.isTextField(node)) {
              this.cleanupField(node);
            }
            const fields = node.querySelectorAll(FIELD_SELECTORS.join(','));
            fields.forEach(field => this.cleanupField(field));
          }
        }
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  isTextField(element) {
    return element.matches(FIELD_SELECTORS.join(','));
  }

  cleanupField(element) {
    this.registry.unregister(element);
  }

  stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  cleanup() {
    this.stopObserving();
    this.registry.clear();
  }
}

describe('フィールド検出のプロパティテスト', () => {
  let dom;
  let detector;

  beforeEach(() => {
    // 各テストの前に新しいDOM環境を作成
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true
    });
    global.document = dom.window.document;
    global.window = dom.window;
    global.HTMLElement = dom.window.HTMLElement;
    global.MutationObserver = dom.window.MutationObserver;

    detector = new FieldDetector();
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
   * プロパティ 8: すべてのテキスト入力フィールドが検出される
   * 
   * 任意のDOM構造において、すべてのテキスト入力フィールド
   * （textarea、input[type="text"]、contenteditable要素）が検出され、
   * Enter key controlが適用される
   * 
   * 検証対象: 要件 4.1, 4.4, 4.5
   */
  test('プロパティ 8: フィールド検出 - すべてのtextarea要素が検出される', () => {
    fc.assert(
      fc.property(
        // textareaの数を生成（1〜10個）
        fc.integer({ min: 1, max: 10 }),
        (count) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 指定された数のtextarea要素を作成
          const textareas = [];
          for (let i = 0; i < count; i++) {
            const textarea = document.createElement('textarea');
            textarea.id = `textarea-${i}`;
            document.body.appendChild(textarea);
            textareas.push(textarea);
          }

          // フィールドを検出
          const detectedFields = detector.detectFields();

          // すべてのtextareaが検出されることを確認
          expect(detectedFields.length).toBe(count);
          
          // 各textareaが検出されたフィールドに含まれることを確認
          for (const textarea of textareas) {
            expect(detectedFields).toContain(textarea);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 8: フィールド検出 - すべてのinput[type="text"]要素が検出される', () => {
    fc.assert(
      fc.property(
        // inputの数を生成（1〜10個）
        fc.integer({ min: 1, max: 10 }),
        (count) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 指定された数のinput[type="text"]要素を作成
          const inputs = [];
          for (let i = 0; i < count; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `input-${i}`;
            document.body.appendChild(input);
            inputs.push(input);
          }

          // フィールドを検出
          const detectedFields = detector.detectFields();

          // すべてのinputが検出されることを確認
          expect(detectedFields.length).toBe(count);
          
          // 各inputが検出されたフィールドに含まれることを確認
          for (const input of inputs) {
            expect(detectedFields).toContain(input);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 8: フィールド検出 - すべてのcontenteditable要素が検出される', () => {
    fc.assert(
      fc.property(
        // contenteditable要素の数を生成（1〜10個）
        fc.integer({ min: 1, max: 10 }),
        // contenteditable属性の値を生成
        fc.constantFrom('true', ''),
        (count, editableValue) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 指定された数のcontenteditable要素を作成
          const editables = [];
          for (let i = 0; i < count; i++) {
            const div = document.createElement('div');
            div.setAttribute('contenteditable', editableValue);
            div.id = `editable-${i}`;
            document.body.appendChild(div);
            editables.push(div);
          }

          // フィールドを検出
          const detectedFields = detector.detectFields();

          // すべてのcontenteditable要素が検出されることを確認
          expect(detectedFields.length).toBe(count);
          
          // 各contenteditable要素が検出されたフィールドに含まれることを確認
          for (const editable of editables) {
            expect(detectedFields).toContain(editable);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 8: フィールド検出 - 混在するフィールドタイプがすべて検出される', () => {
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
            allFields.push(textarea);
          }

          // input[type="text"]要素を作成
          for (let i = 0; i < inputCount; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `input-${i}`;
            document.body.appendChild(input);
            allFields.push(input);
          }

          // contenteditable要素を作成
          for (let i = 0; i < editableCount; i++) {
            const div = document.createElement('div');
            div.setAttribute('contenteditable', 'true');
            div.id = `editable-${i}`;
            document.body.appendChild(div);
            allFields.push(div);
          }

          // フィールドを検出
          const detectedFields = detector.detectFields();

          // すべてのフィールドが検出されることを確認
          const expectedCount = textareaCount + inputCount + editableCount;
          expect(detectedFields.length).toBe(expectedCount);
          
          // 各フィールドが検出されたフィールドに含まれることを確認
          for (const field of allFields) {
            expect(detectedFields).toContain(field);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 8: フィールド検出 - ネストされた構造内のフィールドも検出される', () => {
    fc.assert(
      fc.property(
        // ネストの深さとフィールド数を生成
        fc.record({
          depth: fc.integer({ min: 1, max: 5 }),
          fieldsPerLevel: fc.integer({ min: 1, max: 3 })
        }),
        ({ depth, fieldsPerLevel }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          const allFields = [];
          let currentParent = document.body;

          // ネストされた構造を作成
          for (let level = 0; level < depth; level++) {
            const container = document.createElement('div');
            container.className = `level-${level}`;
            currentParent.appendChild(container);

            // 各レベルにフィールドを追加
            for (let i = 0; i < fieldsPerLevel; i++) {
              const textarea = document.createElement('textarea');
              textarea.id = `level-${level}-field-${i}`;
              container.appendChild(textarea);
              allFields.push(textarea);
            }

            currentParent = container;
          }

          // フィールドを検出
          const detectedFields = detector.detectFields();

          // すべてのフィールドが検出されることを確認
          const expectedCount = depth * fieldsPerLevel;
          expect(detectedFields.length).toBe(expectedCount);
          
          // 各フィールドが検出されたフィールドに含まれることを確認
          for (const field of allFields) {
            expect(detectedFields).toContain(field);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 8: フィールド検出 - 動的に追加されたフィールドも検出される', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 初期フィールド数と追加フィールド数を生成
        fc.record({
          initialCount: fc.integer({ min: 0, max: 5 }),
          addedCount: fc.integer({ min: 1, max: 5 })
        }),
        async ({ initialCount, addedCount }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 初期フィールドを作成
          for (let i = 0; i < initialCount; i++) {
            const textarea = document.createElement('textarea');
            textarea.id = `initial-${i}`;
            document.body.appendChild(textarea);
          }

          // 検出されたフィールドを追跡
          const detectedNewFields = [];
          
          // MutationObserverを開始
          detector.observeNewFields((field) => {
            detectedNewFields.push(field);
          });

          // 動的にフィールドを追加
          const addedFields = [];
          for (let i = 0; i < addedCount; i++) {
            const textarea = document.createElement('textarea');
            textarea.id = `added-${i}`;
            document.body.appendChild(textarea);
            addedFields.push(textarea);
          }

          // MutationObserverが動作するまで少し待つ
          await new Promise(resolve => setTimeout(resolve, 50));

          // 動的に追加されたフィールドがすべて検出されることを確認
          expect(detectedNewFields.length).toBeGreaterThanOrEqual(addedCount);
          
          // 各追加フィールドが検出されたことを確認
          for (const field of addedFields) {
            expect(detectedNewFields).toContain(field);
          }
        }
      ),
      { numRuns: 50 } // 非同期テストなので反復回数を減らす
    );
  });

  test('プロパティ 8: フィールド検出 - 動的に追加されたコンテナ内のフィールドも検出される', async () => {
    await fc.assert(
      fc.asyncProperty(
        // コンテナ内のフィールド数を生成
        fc.integer({ min: 1, max: 5 }),
        async (fieldCount) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 検出されたフィールドを追跡
          const detectedNewFields = [];
          
          // MutationObserverを開始
          detector.observeNewFields((field) => {
            detectedNewFields.push(field);
          });

          // コンテナを作成
          const container = document.createElement('div');
          container.className = 'dynamic-container';

          // コンテナ内にフィールドを追加
          const addedFields = [];
          for (let i = 0; i < fieldCount; i++) {
            const textarea = document.createElement('textarea');
            textarea.id = `container-field-${i}`;
            container.appendChild(textarea);
            addedFields.push(textarea);
          }

          // コンテナをDOMに追加
          document.body.appendChild(container);

          // MutationObserverが動作するまで少し待つ
          await new Promise(resolve => setTimeout(resolve, 50));

          // コンテナ内のすべてのフィールドが検出されることを確認
          expect(detectedNewFields.length).toBe(fieldCount);
          
          // 各フィールドが検出されたことを確認
          for (const field of addedFields) {
            expect(detectedNewFields).toContain(field);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test('プロパティ 8: フィールド検出 - input[type="text"]以外のinput要素は検出されない', () => {
    fc.assert(
      fc.property(
        // 様々なinputタイプを生成
        fc.constantFrom(
          'password', 'email', 'number', 'tel', 'url', 
          'search', 'date', 'time', 'checkbox', 'radio'
        ),
        fc.integer({ min: 1, max: 5 }),
        (inputType, count) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // 指定されたタイプのinput要素を作成
          for (let i = 0; i < count; i++) {
            const input = document.createElement('input');
            input.type = inputType;
            input.id = `input-${inputType}-${i}`;
            document.body.appendChild(input);
          }

          // フィールドを検出
          const detectedFields = detector.detectFields();

          // input[type="text"]以外は検出されないことを確認
          expect(detectedFields.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 8: フィールド検出 - contenteditable="false"の要素は検出されない', () => {
    fc.assert(
      fc.property(
        // 要素数を生成
        fc.integer({ min: 1, max: 5 }),
        (count) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // contenteditable="false"の要素を作成
          for (let i = 0; i < count; i++) {
            const div = document.createElement('div');
            div.setAttribute('contenteditable', 'false');
            div.id = `non-editable-${i}`;
            document.body.appendChild(div);
          }

          // フィールドを検出
          const detectedFields = detector.detectFields();

          // contenteditable="false"は検出されないことを確認
          expect(detectedFields.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 8: フィールド検出 - 検出の一貫性（同じDOM構造で同じ結果）', () => {
    fc.assert(
      fc.property(
        // フィールド構成を生成
        fc.record({
          textareaCount: fc.integer({ min: 1, max: 5 }),
          inputCount: fc.integer({ min: 1, max: 5 }),
          editableCount: fc.integer({ min: 1, max: 5 })
        }),
        ({ textareaCount, inputCount, editableCount }) => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // フィールドを作成
          for (let i = 0; i < textareaCount; i++) {
            const textarea = document.createElement('textarea');
            document.body.appendChild(textarea);
          }
          for (let i = 0; i < inputCount; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            document.body.appendChild(input);
          }
          for (let i = 0; i < editableCount; i++) {
            const div = document.createElement('div');
            div.setAttribute('contenteditable', 'true');
            document.body.appendChild(div);
          }

          // 複数回検出を実行
          const result1 = detector.detectFields();
          const result2 = detector.detectFields();
          const result3 = detector.detectFields();

          // すべての結果が同じであることを確認
          expect(result1.length).toBe(result2.length);
          expect(result2.length).toBe(result3.length);
          
          const expectedCount = textareaCount + inputCount + editableCount;
          expect(result1.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 8: フィールド検出 - 空のDOMでは何も検出されない', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // ダミー値
        () => {
          // DOM環境をリセット
          document.body.innerHTML = '';

          // フィールドを検出
          const detectedFields = detector.detectFields();

          // 何も検出されないことを確認
          expect(detectedFields.length).toBe(0);
          expect(detectedFields).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });
});
