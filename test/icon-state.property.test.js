// アイコン状態のプロパティベーステスト
// Feature: chat-enter-key-control, Property 16: アクティブ状態に応じたアイコン表示
// 検証対象: 要件 8.1, 8.2

import { describe, test, beforeEach, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  updateTabIcon,
  updateAllTabIcons,
  savePatterns
} from '../background.js';

describe('アイコン状態のプロパティテスト', () => {
  // chrome.action APIのモック
  let actionSetIconCalls = [];
  let actionSetTitleCalls = [];
  let tabsQueryResult = [];
  let tabsGetResult = null;

  beforeEach(() => {
    // 各テストの前にストレージとモックをクリア
    chrome.storage.sync._reset();
    actionSetIconCalls = [];
    actionSetTitleCalls = [];
    tabsQueryResult = [];
    tabsGetResult = null;

    // chrome.action APIのモック
    if (!chrome.action) {
      chrome.action = {};
    }
    
    chrome.action.setIcon = vi.fn(async ({ tabId, path }) => {
      actionSetIconCalls.push({ tabId, path });
    });
    
    chrome.action.setTitle = vi.fn(async ({ tabId, title }) => {
      actionSetTitleCalls.push({ tabId, title });
    });

    // chrome.tabs APIのモック
    if (!chrome.tabs) {
      chrome.tabs = {};
    }
    
    chrome.tabs.query = vi.fn(async () => {
      return tabsQueryResult;
    });
    
    chrome.tabs.get = vi.fn(async (tabId) => {
      return tabsGetResult;
    });
  });

  /**
   * プロパティ 16: アクティブ状態に応じたアイコン表示
   * 
   * 任意のページURLとURLパターンリストについて、
   * URLがアクティブなパターンにマッチする場合はアクティブアイコンが、
   * マッチしない場合は非アクティブアイコンが表示される
   * 
   * 検証対象: 要件 8.1, 8.2
   */
  test('プロパティ 16: アイコン状態 - マッチするURLではアクティブアイコンが設定される', async () => {
    await fc.assert(
      fc.asyncProperty(
        // URLとタブIDを生成
        fc.record({
          protocol: fc.constantFrom('http', 'https'),
          domain: fc.domain(),
          path: fc.constantFrom('/', '/chat', '/messages'),
          tabId: fc.integer({ min: 1, max: 1000 })
        }),
        async ({ protocol, domain, path, tabId }) => {
          // 各反復の前にモックをクリア
          actionSetIconCalls = [];
          actionSetTitleCalls = [];
          chrome.storage.sync._reset();
          
          const url = `${protocol}://${domain}${path}`;
          
          // マッチするパターンを作成
          const patterns = [
            {
              id: '1',
              pattern: `*://${domain}/*`,
              enabled: true,
              createdAt: Date.now()
            }
          ];
          
          await savePatterns(patterns);
          
          // アイコンを更新
          await updateTabIcon(tabId, url);
          
          // setIconが呼ばれたことを確認
          expect(actionSetIconCalls.length).toBe(1);
          expect(actionSetIconCalls[0].tabId).toBe(tabId);
          expect(actionSetIconCalls[0].path).toBeDefined();
          
          // setTitleが呼ばれたことを確認
          expect(actionSetTitleCalls.length).toBe(1);
          expect(actionSetTitleCalls[0].tabId).toBe(tabId);
          expect(actionSetTitleCalls[0].title).toContain('有効');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 16: アイコン状態 - マッチしないURLでは非アクティブアイコンが設定される', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 2つの異なるドメインとタブIDを生成
        fc.tuple(
          fc.domain(),
          fc.domain(),
          fc.constantFrom('http', 'https'),
          fc.constantFrom('/', '/chat', '/messages'),
          fc.integer({ min: 1, max: 1000 })
        ).filter(([domain1, domain2]) => domain1 !== domain2),
        async ([domain1, domain2, protocol, path, tabId]) => {
          // 各反復の前にモックをクリア
          actionSetIconCalls = [];
          actionSetTitleCalls = [];
          chrome.storage.sync._reset();
          
          const url = `${protocol}://${domain1}${path}`;
          
          // domain2のパターンを作成（マッチしない）
          const patterns = [
            {
              id: '1',
              pattern: `*://${domain2}/*`,
              enabled: true,
              createdAt: Date.now()
            }
          ];
          
          await savePatterns(patterns);
          
          // アイコンを更新
          await updateTabIcon(tabId, url);
          
          // setIconが呼ばれたことを確認
          expect(actionSetIconCalls.length).toBe(1);
          expect(actionSetIconCalls[0].tabId).toBe(tabId);
          
          // setTitleが呼ばれたことを確認
          expect(actionSetTitleCalls.length).toBe(1);
          expect(actionSetTitleCalls[0].tabId).toBe(tabId);
          expect(actionSetTitleCalls[0].title).toContain('無効');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 16: アイコン状態 - 無効なパターンではアイコンが非アクティブになる', async () => {
    await fc.assert(
      fc.asyncProperty(
        // URLとタブIDを生成
        fc.record({
          protocol: fc.constantFrom('http', 'https'),
          domain: fc.domain(),
          path: fc.constantFrom('/', '/chat', '/messages'),
          tabId: fc.integer({ min: 1, max: 1000 })
        }),
        async ({ protocol, domain, path, tabId }) => {
          // 各反復の前にモックをクリア
          actionSetIconCalls = [];
          actionSetTitleCalls = [];
          chrome.storage.sync._reset();
          
          const url = `${protocol}://${domain}${path}`;
          
          // マッチするが無効なパターンを作成
          const patterns = [
            {
              id: '1',
              pattern: `*://${domain}/*`,
              enabled: false, // 無効
              createdAt: Date.now()
            }
          ];
          
          await savePatterns(patterns);
          
          // アイコンを更新
          await updateTabIcon(tabId, url);
          
          // setTitleが呼ばれたことを確認
          expect(actionSetTitleCalls.length).toBe(1);
          expect(actionSetTitleCalls[0].title).toContain('無効');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 16: アイコン状態 - 複数のタブで独立してアイコンが設定される', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 複数のタブ情報を生成
        fc.array(
          fc.record({
            tabId: fc.integer({ min: 1, max: 1000 }),
            protocol: fc.constantFrom('http', 'https'),
            domain: fc.domain(),
            path: fc.constantFrom('/', '/chat', '/messages')
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (tabs) => {
          // 各反復の前にモックをクリア
          actionSetIconCalls = [];
          actionSetTitleCalls = [];
          chrome.storage.sync._reset();
          
          // 最初のタブのドメインにマッチするパターンを作成
          const patterns = [
            {
              id: '1',
              pattern: `*://${tabs[0].domain}/*`,
              enabled: true,
              createdAt: Date.now()
            }
          ];
          
          await savePatterns(patterns);
          
          // すべてのタブのアイコンを更新
          for (const tab of tabs) {
            const url = `${tab.protocol}://${tab.domain}${tab.path}`;
            await updateTabIcon(tab.tabId, url);
          }
          
          // すべてのタブでsetIconとsetTitleが呼ばれたことを確認
          expect(actionSetIconCalls.length).toBe(tabs.length);
          expect(actionSetTitleCalls.length).toBe(tabs.length);
          
          // 各タブのアイコン状態が正しいことを確認
          for (let i = 0; i < tabs.length; i++) {
            expect(actionSetIconCalls[i].tabId).toBe(tabs[i].tabId);
            expect(actionSetTitleCalls[i].tabId).toBe(tabs[i].tabId);
            
            // 最初のタブはマッチするので有効、それ以外は無効
            if (tabs[i].domain === tabs[0].domain) {
              expect(actionSetTitleCalls[i].title).toContain('有効');
            } else {
              expect(actionSetTitleCalls[i].title).toContain('無効');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 16: アイコン状態 - すべてのタブのアイコンを一括更新できる', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 複数のタブ情報を生成
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            protocol: fc.constantFrom('http', 'https'),
            domain: fc.domain(),
            path: fc.constantFrom('/', '/chat', '/messages')
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (tabs) => {
          // 各反復の前にモックをクリア
          actionSetIconCalls = [];
          actionSetTitleCalls = [];
          chrome.storage.sync._reset();
          
          // タブ情報をモックに設定
          tabsQueryResult = tabs.map(tab => ({
            id: tab.id,
            url: `${tab.protocol}://${tab.domain}${tab.path}`
          }));
          
          // パターンを作成
          const patterns = [
            {
              id: '1',
              pattern: `*://${tabs[0].domain}/*`,
              enabled: true,
              createdAt: Date.now()
            }
          ];
          
          await savePatterns(patterns);
          
          // すべてのタブのアイコンを更新
          await updateAllTabIcons();
          
          // すべてのタブでsetIconとsetTitleが呼ばれたことを確認
          expect(actionSetIconCalls.length).toBe(tabs.length);
          expect(actionSetTitleCalls.length).toBe(tabs.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 16: アイコン状態 - パターン変更後にアイコンが更新される', async () => {
    await fc.assert(
      fc.asyncProperty(
        // URLとタブIDを生成
        fc.record({
          protocol: fc.constantFrom('http', 'https'),
          domain: fc.domain(),
          path: fc.constantFrom('/', '/chat', '/messages'),
          tabId: fc.integer({ min: 1, max: 1000 })
        }),
        async ({ protocol, domain, path, tabId }) => {
          // 各反復の前にモックをクリア
          actionSetIconCalls = [];
          actionSetTitleCalls = [];
          chrome.storage.sync._reset();
          
          const url = `${protocol}://${domain}${path}`;
          
          // 最初は空のパターン
          await savePatterns([]);
          await updateTabIcon(tabId, url);
          
          // 最初は無効
          expect(actionSetTitleCalls[0].title).toContain('無効');
          
          // モックをクリア
          actionSetIconCalls = [];
          actionSetTitleCalls = [];
          
          // マッチするパターンを追加
          const patterns = [
            {
              id: '1',
              pattern: `*://${domain}/*`,
              enabled: true,
              createdAt: Date.now()
            }
          ];
          
          await savePatterns(patterns);
          await updateTabIcon(tabId, url);
          
          // 今度は有効
          expect(actionSetTitleCalls[0].title).toContain('有効');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 16: アイコン状態 - 複数のパターンのいずれかにマッチすればアクティブになる', async () => {
    await fc.assert(
      fc.asyncProperty(
        // URLとタブIDを生成
        fc.record({
          protocol: fc.constantFrom('http', 'https'),
          domains: fc.array(fc.domain(), { minLength: 2, maxLength: 5 }),
          path: fc.constantFrom('/', '/chat', '/messages'),
          tabId: fc.integer({ min: 1, max: 1000 })
        }),
        async ({ protocol, domains, path, tabId }) => {
          // 各反復の前にモックをクリア
          actionSetIconCalls = [];
          actionSetTitleCalls = [];
          chrome.storage.sync._reset();
          
          // ランダムに1つのドメインを選択
          const selectedDomain = domains[Math.floor(Math.random() * domains.length)];
          const url = `${protocol}://${selectedDomain}${path}`;
          
          // すべてのドメインに対してパターンを作成
          const patterns = domains.map((domain, index) => ({
            id: `${index}`,
            pattern: `*://${domain}/*`,
            enabled: true,
            createdAt: Date.now()
          }));
          
          await savePatterns(patterns);
          await updateTabIcon(tabId, url);
          
          // いずれかのパターンにマッチするので有効
          expect(actionSetTitleCalls[0].title).toContain('有効');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 16: アイコン状態 - <all_urls>パターンではすべてのURLでアクティブになる', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 任意のURLとタブIDを生成
        fc.record({
          url: fc.webUrl(),
          tabId: fc.integer({ min: 1, max: 1000 })
        }),
        async ({ url, tabId }) => {
          // 各反復の前にモックをクリア
          actionSetIconCalls = [];
          actionSetTitleCalls = [];
          chrome.storage.sync._reset();
          
          // <all_urls>パターンを作成
          const patterns = [
            {
              id: '1',
              pattern: '<all_urls>',
              enabled: true,
              createdAt: Date.now()
            }
          ];
          
          await savePatterns(patterns);
          await updateTabIcon(tabId, url);
          
          // すべてのURLでアクティブ
          expect(actionSetTitleCalls[0].title).toContain('有効');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 16: アイコン状態 - 同じタブで複数回更新しても一貫性がある', async () => {
    await fc.assert(
      fc.asyncProperty(
        // URLとタブIDを生成
        fc.record({
          protocol: fc.constantFrom('http', 'https'),
          domain: fc.domain(),
          path: fc.constantFrom('/', '/chat', '/messages'),
          tabId: fc.integer({ min: 1, max: 1000 })
        }),
        async ({ protocol, domain, path, tabId }) => {
          // 各反復の前にモックをクリア
          chrome.storage.sync._reset();
          
          const url = `${protocol}://${domain}${path}`;
          
          // パターンを作成
          const patterns = [
            {
              id: '1',
              pattern: `*://${domain}/*`,
              enabled: true,
              createdAt: Date.now()
            }
          ];
          
          await savePatterns(patterns);
          
          // 複数回更新
          actionSetTitleCalls = [];
          await updateTabIcon(tabId, url);
          const firstTitle = actionSetTitleCalls[0].title;
          
          actionSetTitleCalls = [];
          await updateTabIcon(tabId, url);
          const secondTitle = actionSetTitleCalls[0].title;
          
          actionSetTitleCalls = [];
          await updateTabIcon(tabId, url);
          const thirdTitle = actionSetTitleCalls[0].title;
          
          // すべて同じタイトルであることを確認
          expect(firstTitle).toBe(secondTitle);
          expect(secondTitle).toBe(thirdTitle);
          expect(firstTitle).toContain('有効');
        }
      ),
      { numRuns: 100 }
    );
  });
});
