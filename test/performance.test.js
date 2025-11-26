/**
 * パフォーマンステスト
 * 
 * 要件7.1: 初期化時間が100ms以内であることを確認
 * 要件7.3: イベント処理時間が10ms以内であることを確認
 * 要件7.5: 多数のフィールド（100個）でのパフォーマンス確認
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('パフォーマンステスト', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    // 新しいDOM環境を作成
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'https://example.com',
      runScripts: 'dangerously',
      resources: 'usable'
    });
    document = dom.window.document;
    window = dom.window;

    // グローバルオブジェクトを設定
    global.document = document;
    global.window = window;
    global.MutationObserver = window.MutationObserver;
  });

  afterEach(() => {
    // クリーンアップ
    if (dom) {
      dom.window.close();
    }
    vi.clearAllMocks();
  });

  describe('要件7.1: 初期化時間が100ms以内', () => {
    it('content.jsの初期化が100ms以内に完了すること', async () => {
      // 100個のテキストフィールドを作成
      for (let i = 0; i < 100; i++) {
        const textarea = document.createElement('textarea');
        textarea.id = `field-${i}`;
        document.body.appendChild(textarea);
      }

      const startTime = performance.now();

      // content.jsの初期化ロジックをシミュレート
      const fieldRegistry = new Map();
      const selectors = [
        'textarea',
        'input[type="text"]',
        '[contenteditable="true"]',
        '[contenteditable=""]'
      ];

      // フィールドを検出してイベントリスナーを登録
      const fields = document.querySelectorAll(selectors.join(','));
      fields.forEach(field => {
        const handler = (e) => {
          if (e.key === 'Enter' && !e.isComposing) {
            const hasModifier = e.ctrlKey || e.altKey || e.metaKey;
            if (!hasModifier) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
            }
          }
        };
        field.addEventListener('keydown', handler, true);
        fieldRegistry.set(field, handler);
      });

      // MutationObserverのセットアップ
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node instanceof window.HTMLElement) {
              if (node.matches && node.matches(selectors.join(','))) {
                const handler = (e) => {
                  if (e.key === 'Enter' && !e.isComposing) {
                    const hasModifier = e.ctrlKey || e.altKey || e.metaKey;
                    if (!hasModifier) {
                      e.preventDefault();
                      e.stopPropagation();
                      e.stopImmediatePropagation();
                    }
                  }
                };
                node.addEventListener('keydown', handler, true);
                fieldRegistry.set(node, handler);
              }
            }
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      const endTime = performance.now();
      const initTime = endTime - startTime;

      console.log(`初期化時間: ${initTime.toFixed(2)}ms`);
      expect(initTime).toBeLessThan(100);

      // クリーンアップ
      observer.disconnect();
      fieldRegistry.forEach((handler, field) => {
        field.removeEventListener('keydown', handler, true);
      });
    });
  });

  describe('要件7.3: イベント処理時間が10ms以内', () => {
    it('keydownイベントの処理が10ms以内に完了すること', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const handler = (e) => {
        if (e.key === 'Enter' && !e.isComposing) {
          const hasModifier = e.ctrlKey || e.altKey || e.metaKey;
          if (!hasModifier) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // 改行挿入のシミュレート
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const value = textarea.value;
            textarea.value = value.substring(0, start) + '\n' + value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 1;
          }
        }
      };

      textarea.addEventListener('keydown', handler, true);

      // 複数回イベントを発火してパフォーマンスを測定
      const iterations = 100;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();

        const event = new window.KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
          composed: true
        });

        textarea.dispatchEvent(event);

        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`平均イベント処理時間: ${avgTime.toFixed(2)}ms`);
      console.log(`最大イベント処理時間: ${maxTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(10);
      expect(maxTime).toBeLessThan(10);

      // クリーンアップ
      textarea.removeEventListener('keydown', handler, true);
    });

    it('修飾キー付きkeydownイベントの処理が10ms以内に完了すること', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const handler = (e) => {
        if (e.key === 'Enter' && !e.isComposing) {
          const hasModifier = e.ctrlKey || e.altKey || e.metaKey;
          if (!hasModifier) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          }
        }
      };

      textarea.addEventListener('keydown', handler, true);

      // 複数回イベントを発火してパフォーマンスを測定
      const iterations = 100;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();

        const event = new window.KeyboardEvent('keydown', {
          key: 'Enter',
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
          composed: true
        });

        textarea.dispatchEvent(event);

        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`平均イベント処理時間（修飾キー付き）: ${avgTime.toFixed(2)}ms`);
      console.log(`最大イベント処理時間（修飾キー付き）: ${maxTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(10);
      expect(maxTime).toBeLessThan(10);

      // クリーンアップ
      textarea.removeEventListener('keydown', handler, true);
    });
  });

  describe('要件7.5: 多数のフィールド（100個）でのパフォーマンス', () => {
    it('100個のフィールドでUIラグなく動作すること', () => {
      const fieldRegistry = new Map();
      const fields = [];

      // 100個のテキストフィールドを作成
      for (let i = 0; i < 100; i++) {
        const textarea = document.createElement('textarea');
        textarea.id = `field-${i}`;
        document.body.appendChild(textarea);
        fields.push(textarea);

        const handler = (e) => {
          if (e.key === 'Enter' && !e.isComposing) {
            const hasModifier = e.ctrlKey || e.altKey || e.metaKey;
            if (!hasModifier) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              
              // 改行挿入
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const value = textarea.value;
              textarea.value = value.substring(0, start) + '\n' + value.substring(end);
              textarea.selectionStart = textarea.selectionEnd = start + 1;
            }
          }
        };

        textarea.addEventListener('keydown', handler, true);
        fieldRegistry.set(textarea, handler);
      }

      // 各フィールドでイベントを発火してパフォーマンスを測定
      const startTime = performance.now();

      fields.forEach(field => {
        const event = new window.KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
          composed: true
        });
        field.dispatchEvent(event);
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`100個のフィールドでのイベント処理時間: ${totalTime.toFixed(2)}ms`);
      
      // 100個のフィールドでも合計100ms以内（1フィールドあたり1ms以内）
      expect(totalTime).toBeLessThan(100);

      // クリーンアップ
      fieldRegistry.forEach((handler, field) => {
        field.removeEventListener('keydown', handler, true);
      });
    });

    it('100個のフィールドの動的追加が500ms以内に完了すること', async () => {
      const fieldRegistry = new Map();
      const selectors = [
        'textarea',
        'input[type="text"]',
        '[contenteditable="true"]',
        '[contenteditable=""]'
      ];

      // MutationObserverのセットアップ
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node instanceof window.HTMLElement) {
              if (node.matches && node.matches(selectors.join(','))) {
                const handler = (e) => {
                  if (e.key === 'Enter' && !e.isComposing) {
                    const hasModifier = e.ctrlKey || e.altKey || e.metaKey;
                    if (!hasModifier) {
                      e.preventDefault();
                      e.stopPropagation();
                      e.stopImmediatePropagation();
                    }
                  }
                };
                node.addEventListener('keydown', handler, true);
                fieldRegistry.set(node, handler);
              }
            }
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      const startTime = performance.now();

      // 100個のフィールドを動的に追加
      for (let i = 0; i < 100; i++) {
        const textarea = document.createElement('textarea');
        textarea.id = `dynamic-field-${i}`;
        document.body.appendChild(textarea);
      }

      // MutationObserverの処理を待つ（次のマイクロタスクまで待機）
      await new Promise(resolve => setTimeout(resolve, 0));

      const endTime = performance.now();
      const addTime = endTime - startTime;

      console.log(`100個のフィールドの動的追加時間: ${addTime.toFixed(2)}ms`);
      console.log(`検出されたフィールド数: ${fieldRegistry.size}`);

      expect(addTime).toBeLessThan(500);
      expect(fieldRegistry.size).toBe(100);

      // クリーンアップ
      observer.disconnect();
      fieldRegistry.forEach((handler, field) => {
        field.removeEventListener('keydown', handler, true);
      });
    });
  });
});
