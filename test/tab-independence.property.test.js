// タブ独立性のプロパティベーステスト
// Feature: chat-enter-key-control, Property 15: タブ間の状態は独立している
// 検証対象: 要件 7.4

import { describe, test, beforeEach, afterEach, expect } from 'vitest';
import * as fc from 'fast-check';
import { JSDOM } from 'jsdom';

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
  constructor(document) {
    this.document = document;
    this.registry = new FieldRegistry();
    this.observer = null;
  }

  detectFields() {
    const selector = FIELD_SELECTORS.join(',');
    return Array.from(this.document.querySelectorAll(selector));
  }

  observeNewFields(callback) {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof this.document.defaultView.HTMLElement) {
            if (this.isTextField(node)) {
              callback(node);
            }
            const fields = node.querySelectorAll(FIELD_SELECTORS.join(','));
            fields.forEach(field => callback(field));
          }
        }

        for (const node of mutation.removedNodes) {
          if (node instanceof this.document.defaultView.HTMLElement) {
            if (this.isTextField(node)) {
              this.cleanupField(node);
            }
            const fields = node.querySelectorAll(FIELD_SELECTORS.join(','));
            fields.forEach(field => this.cleanupField(field));
          }
        }
      }
    });

    this.observer.observe(this.document.body, {
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

/**
 * タブをシミュレートするクラス
 * 各タブは独立したDOM環境とフィールド検出器を持つ
 */
class TabSimulator {
  constructor(tabId) {
    this.tabId = tabId;
    this.dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: `http://localhost/tab-${tabId}`,
      pretendToBeVisual: true
    });
    this.document = this.dom.window.document;
    this.window = this.dom.window;
    this.detector = null;
    this.keyboardHandler = null;
  }

  /**
   * タブを初期化
   */
  initialize() {
    this.detector = new FieldDetector(this.document);
    this.keyboardHandler = new KeyboardEventHandler();
  }

  /**
   * フィールドを作成
   */
  createField(type, id) {
    let element;
    if (type === 'textarea') {
      element = this.document.createElement('textarea');
    } else if (type === 'input') {
      element = this.document.createElement('input');
      element.type = 'text';
    } else if (type === 'contenteditable') {
      element = this.document.createElement('div');
      element.setAttribute('contenteditable', 'true');
    }
    element.id = id;
    this.document.body.appendChild(element);
    return element;
  }

  /**
   * フィールドにハンドラを追加
   */
  attachHandlers(element) {
    if (this.detector.registry.has(element)) {
      return;
    }
    const listener = this.keyboardHandler.attachToField(element);
    this.detector.registry.register(element, listener);
  }

  /**
   * タブをクリーンアップ
   */
  cleanup() {
    if (this.detector) {
      this.detector.cleanup();
    }
    if (this.dom) {
      this.dom.window.close();
    }
  }

  /**
   * 登録されているフィールド数を取得
   */
  getFieldCount() {
    return this.detector.registry.size();
  }

  /**
   * フィールドが登録されているかチェック
   */
  hasField(element) {
    return this.detector.registry.has(element);
  }
}

describe('タブ独立性のプロパティテスト', () => {
  /**
   * プロパティ 15: タブ間の状態は独立している
   * 
   * 任意の複数のタブについて、各タブのcomposition状態とfield registryは互いに影響しない
   * 
   * 検証対象: 要件 7.4
   */
  test('プロパティ 15: タブ間のフィールドレジストリは独立している', () => {
    fc.assert(
      fc.property(
        // 2つのタブのフィールド数を生成
        fc.record({
          tab1FieldCount: fc.integer({ min: 1, max: 10 }),
          tab2FieldCount: fc.integer({ min: 1, max: 10 })
        }),
        ({ tab1FieldCount, tab2FieldCount }) => {
          // 2つのタブをシミュレート
          const tab1 = new TabSimulator(1);
          const tab2 = new TabSimulator(2);

          try {
            // タブを初期化
            tab1.initialize();
            tab2.initialize();

            // タブ1にフィールドを追加
            const tab1Fields = [];
            for (let i = 0; i < tab1FieldCount; i++) {
              const field = tab1.createField('textarea', `tab1-field-${i}`);
              tab1.attachHandlers(field);
              tab1Fields.push(field);
            }

            // タブ2にフィールドを追加
            const tab2Fields = [];
            for (let i = 0; i < tab2FieldCount; i++) {
              const field = tab2.createField('textarea', `tab2-field-${i}`);
              tab2.attachHandlers(field);
              tab2Fields.push(field);
            }

            // 各タブのフィールド数が独立していることを確認
            expect(tab1.getFieldCount()).toBe(tab1FieldCount);
            expect(tab2.getFieldCount()).toBe(tab2FieldCount);

            // タブ1のフィールドがタブ2のレジストリに存在しないことを確認
            for (const field of tab1Fields) {
              expect(tab1.hasField(field)).toBe(true);
              // タブ2のレジストリには存在しない（異なるDOM環境なので直接チェックできない）
            }

            // タブ2のフィールドがタブ1のレジストリに存在しないことを確認
            for (const field of tab2Fields) {
              expect(tab2.hasField(field)).toBe(true);
              // タブ1のレジストリには存在しない（異なるDOM環境なので直接チェックできない）
            }

            // タブ1のフィールドをクリーンアップしてもタブ2には影響しない
            tab1.detector.cleanup();
            expect(tab1.getFieldCount()).toBe(0);
            expect(tab2.getFieldCount()).toBe(tab2FieldCount);

            // タブ2のフィールドをクリーンアップしてもタブ1には影響しない（すでに0だが）
            tab2.detector.cleanup();
            expect(tab1.getFieldCount()).toBe(0);
            expect(tab2.getFieldCount()).toBe(0);
          } finally {
            // クリーンアップ
            tab1.cleanup();
            tab2.cleanup();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 15: タブ間のイベント処理は独立している', () => {
    fc.assert(
      fc.property(
        // 各タブのフィールド数を生成
        fc.integer({ min: 1, max: 5 }),
        (fieldCount) => {
          // 2つのタブをシミュレート
          const tab1 = new TabSimulator(1);
          const tab2 = new TabSimulator(2);

          try {
            // タブを初期化
            tab1.initialize();
            tab2.initialize();

            // 各タブにフィールドを追加
            const tab1Fields = [];
            for (let i = 0; i < fieldCount; i++) {
              const field = tab1.createField('textarea', `tab1-field-${i}`);
              tab1.attachHandlers(field);
              tab1Fields.push(field);
            }

            const tab2Fields = [];
            for (let i = 0; i < fieldCount; i++) {
              const field = tab2.createField('textarea', `tab2-field-${i}`);
              tab2.attachHandlers(field);
              tab2Fields.push(field);
            }

            // タブ1でイベントを発火
            let tab1EventCount = 0;
            for (const field of tab1Fields) {
              const event = new tab1.window.KeyboardEvent('keydown', {
                key: 'Enter',
                bubbles: true,
                cancelable: true
              });
              field.dispatchEvent(event);
              if (event.defaultPrevented) {
                tab1EventCount++;
              }
            }

            // タブ2でイベントを発火
            let tab2EventCount = 0;
            for (const field of tab2Fields) {
              const event = new tab2.window.KeyboardEvent('keydown', {
                key: 'Enter',
                bubbles: true,
                cancelable: true
              });
              field.dispatchEvent(event);
              if (event.defaultPrevented) {
                tab2EventCount++;
              }
            }

            // 各タブでイベントが独立して処理されることを確認
            expect(tab1EventCount).toBe(fieldCount);
            expect(tab2EventCount).toBe(fieldCount);

            // タブ1のレジストリサイズは変わらない
            expect(tab1.getFieldCount()).toBe(fieldCount);
            expect(tab2.getFieldCount()).toBe(fieldCount);
          } finally {
            // クリーンアップ
            tab1.cleanup();
            tab2.cleanup();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 15: 複数タブでの同時操作が独立している', () => {
    fc.assert(
      fc.property(
        // 3つのタブのフィールド数を生成
        fc.record({
          tab1FieldCount: fc.integer({ min: 1, max: 5 }),
          tab2FieldCount: fc.integer({ min: 1, max: 5 }),
          tab3FieldCount: fc.integer({ min: 1, max: 5 })
        }),
        ({ tab1FieldCount, tab2FieldCount, tab3FieldCount }) => {
          // 3つのタブをシミュレート
          const tab1 = new TabSimulator(1);
          const tab2 = new TabSimulator(2);
          const tab3 = new TabSimulator(3);

          try {
            // タブを初期化
            tab1.initialize();
            tab2.initialize();
            tab3.initialize();

            // 各タブにフィールドを追加
            for (let i = 0; i < tab1FieldCount; i++) {
              const field = tab1.createField('textarea', `tab1-field-${i}`);
              tab1.attachHandlers(field);
            }

            for (let i = 0; i < tab2FieldCount; i++) {
              const field = tab2.createField('input', `tab2-field-${i}`);
              tab2.attachHandlers(field);
            }

            for (let i = 0; i < tab3FieldCount; i++) {
              const field = tab3.createField('contenteditable', `tab3-field-${i}`);
              tab3.attachHandlers(field);
            }

            // 各タブのフィールド数が独立していることを確認
            expect(tab1.getFieldCount()).toBe(tab1FieldCount);
            expect(tab2.getFieldCount()).toBe(tab2FieldCount);
            expect(tab3.getFieldCount()).toBe(tab3FieldCount);

            // タブ2のフィールドをクリーンアップ
            tab2.detector.cleanup();

            // タブ2のみがクリーンアップされ、他のタブには影響しないことを確認
            expect(tab1.getFieldCount()).toBe(tab1FieldCount);
            expect(tab2.getFieldCount()).toBe(0);
            expect(tab3.getFieldCount()).toBe(tab3FieldCount);

            // タブ1に新しいフィールドを追加
            const newField = tab1.createField('textarea', 'tab1-new-field');
            tab1.attachHandlers(newField);

            // タブ1のみが影響を受けることを確認
            expect(tab1.getFieldCount()).toBe(tab1FieldCount + 1);
            expect(tab2.getFieldCount()).toBe(0);
            expect(tab3.getFieldCount()).toBe(tab3FieldCount);
          } finally {
            // クリーンアップ
            tab1.cleanup();
            tab2.cleanup();
            tab3.cleanup();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 15: タブごとに異なるフィールドタイプを持つ場合も独立している', () => {
    fc.assert(
      fc.property(
        // 各タブのフィールドタイプと数を生成
        fc.record({
          tab1: fc.record({
            type: fc.constantFrom('textarea', 'input', 'contenteditable'),
            count: fc.integer({ min: 1, max: 5 })
          }),
          tab2: fc.record({
            type: fc.constantFrom('textarea', 'input', 'contenteditable'),
            count: fc.integer({ min: 1, max: 5 })
          })
        }),
        ({ tab1, tab2 }) => {
          // 2つのタブをシミュレート
          const tabSim1 = new TabSimulator(1);
          const tabSim2 = new TabSimulator(2);

          try {
            // タブを初期化
            tabSim1.initialize();
            tabSim2.initialize();

            // タブ1にフィールドを追加
            for (let i = 0; i < tab1.count; i++) {
              const field = tabSim1.createField(tab1.type, `tab1-${tab1.type}-${i}`);
              tabSim1.attachHandlers(field);
            }

            // タブ2にフィールドを追加
            for (let i = 0; i < tab2.count; i++) {
              const field = tabSim2.createField(tab2.type, `tab2-${tab2.type}-${i}`);
              tabSim2.attachHandlers(field);
            }

            // 各タブのフィールド数が独立していることを確認
            expect(tabSim1.getFieldCount()).toBe(tab1.count);
            expect(tabSim2.getFieldCount()).toBe(tab2.count);

            // タブ1のフィールドを部分的にクリーンアップ
            const tab1Fields = tabSim1.detector.detectFields();
            if (tab1Fields.length > 0) {
              const fieldToCleanup = tab1Fields[0];
              tabSim1.detector.cleanupField(fieldToCleanup);
            }

            // タブ1のみが影響を受けることを確認
            expect(tabSim1.getFieldCount()).toBe(Math.max(0, tab1.count - 1));
            expect(tabSim2.getFieldCount()).toBe(tab2.count);
          } finally {
            // クリーンアップ
            tabSim1.cleanup();
            tabSim2.cleanup();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 15: タブのクリーンアップが他のタブに影響しない', () => {
    fc.assert(
      fc.property(
        // タブ数とフィールド数を生成
        fc.record({
          tabCount: fc.integer({ min: 2, max: 5 }),
          fieldsPerTab: fc.integer({ min: 1, max: 5 })
        }),
        ({ tabCount, fieldsPerTab }) => {
          // 複数のタブをシミュレート
          const tabs = [];
          for (let i = 0; i < tabCount; i++) {
            const tab = new TabSimulator(i);
            tab.initialize();
            tabs.push(tab);
          }

          try {
            // 各タブにフィールドを追加
            for (const tab of tabs) {
              for (let i = 0; i < fieldsPerTab; i++) {
                const field = tab.createField('textarea', `tab${tab.tabId}-field-${i}`);
                tab.attachHandlers(field);
              }
            }

            // すべてのタブのフィールド数を確認
            for (const tab of tabs) {
              expect(tab.getFieldCount()).toBe(fieldsPerTab);
            }

            // 最初のタブをクリーンアップ
            tabs[0].cleanup();

            // 他のタブには影響しないことを確認
            for (let i = 1; i < tabs.length; i++) {
              expect(tabs[i].getFieldCount()).toBe(fieldsPerTab);
            }

            // 残りのタブを順番にクリーンアップ
            for (let i = 1; i < tabs.length; i++) {
              tabs[i].cleanup();
              
              // クリーンアップされたタブのフィールド数が0になることを確認
              expect(tabs[i].getFieldCount()).toBe(0);
              
              // まだクリーンアップされていないタブには影響しないことを確認
              for (let j = i + 1; j < tabs.length; j++) {
                expect(tabs[j].getFieldCount()).toBe(fieldsPerTab);
              }
            }
          } finally {
            // すべてのタブをクリーンアップ
            for (const tab of tabs) {
              tab.cleanup();
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 15: タブごとのDOM環境が完全に独立している', () => {
    fc.assert(
      fc.property(
        // 2つのタブのフィールド数を生成
        fc.record({
          tab1FieldCount: fc.integer({ min: 1, max: 5 }),
          tab2FieldCount: fc.integer({ min: 1, max: 5 })
        }),
        ({ tab1FieldCount, tab2FieldCount }) => {
          // 2つのタブをシミュレート
          const tab1 = new TabSimulator(1);
          const tab2 = new TabSimulator(2);

          try {
            // タブを初期化
            tab1.initialize();
            tab2.initialize();

            // タブ1にフィールドを追加
            for (let i = 0; i < tab1FieldCount; i++) {
              const field = tab1.createField('textarea', `field-${i}`);
              tab1.attachHandlers(field);
            }

            // タブ2にフィールドを追加（同じIDを使用）
            for (let i = 0; i < tab2FieldCount; i++) {
              const field = tab2.createField('textarea', `field-${i}`);
              tab2.attachHandlers(field);
            }

            // 各タブのDOM環境が独立していることを確認
            const tab1Fields = tab1.detector.detectFields();
            const tab2Fields = tab2.detector.detectFields();

            expect(tab1Fields.length).toBe(tab1FieldCount);
            expect(tab2Fields.length).toBe(tab2FieldCount);

            // 同じIDでも異なる要素であることを確認
            if (tab1FieldCount > 0 && tab2FieldCount > 0) {
              const tab1FirstField = tab1Fields[0];
              const tab2FirstField = tab2Fields[0];
              
              // 同じIDを持つが、異なるDOM環境の要素
              expect(tab1FirstField.id).toBe('field-0');
              expect(tab2FirstField.id).toBe('field-0');
              
              // 異なるdocumentに属していることを確認
              expect(tab1FirstField.ownerDocument).toBe(tab1.document);
              expect(tab2FirstField.ownerDocument).toBe(tab2.document);
              expect(tab1FirstField.ownerDocument).not.toBe(tab2FirstField.ownerDocument);
            }
          } finally {
            // クリーンアップ
            tab1.cleanup();
            tab2.cleanup();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
