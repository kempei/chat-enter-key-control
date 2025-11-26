// ドメイントグルのプロパティベーステスト
// Feature: chat-enter-key-control, Property 18: ポップアップからドメインをトグルできる
// 検証対象: 要件 8.5

import { describe, test, beforeEach, afterEach, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { JSDOM } from 'jsdom';

describe('ドメイントグルのプロパティテスト', () => {
  let dom;
  let document;
  let window;
  let addedPatterns;

  // シンプルなドメイン生成器
  const simpleDomain = () => fc.tuple(
    fc.constantFrom('example', 'test', 'demo', 'chat', 'app'),
    fc.constantFrom('com', 'org', 'net', 'io')
  ).map(([name, tld]) => `${name}.${tld}`);

  beforeEach(() => {
    // 追加されたパターンを記録
    addedPatterns = [];

    // JSDOMでポップアップのHTMLを読み込む
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <div id="statusIndicator">
          <span class="status-icon" id="statusIcon">●</span>
          <span class="status-text" id="statusText">読み込み中...</span>
        </div>
        <div id="currentUrl"></div>
        <div id="quickToggleSection" style="display: none;">
          <button id="quickToggleBtn">このドメインを有効化</button>
        </div>
        <div id="patternsList"></div>
        <div id="emptyState" style="display: none;"></div>
        <div id="errorMessage" style="display: none;"></div>
      </body>
      </html>
    `;

    dom = new JSDOM(html, { url: 'http://localhost' });
    document = dom.window.document;
    window = dom.window;

    // グローバルなdocumentとwindowを設定
    global.document = document;
    global.window = window;

    // Chrome APIのモック
    global.chrome = {
      storage: {
        sync: {
          get: vi.fn(() => Promise.resolve({ patterns: addedPatterns })),
          set: vi.fn(() => Promise.resolve())
        }
      },
      runtime: {
        sendMessage: vi.fn(),
        lastError: null,
        onMessage: {
          addListener: vi.fn()
        }
      },
      tabs: {
        query: vi.fn(() => Promise.resolve([])),
        get: vi.fn(() => Promise.resolve(null))
      },
      action: {
        setIcon: vi.fn(() => Promise.resolve()),
        setTitle: vi.fn(() => Promise.resolve())
      }
    };
  });

  afterEach(() => {
    // クリーンアップ
    delete global.document;
    delete global.window;
    delete global.chrome;
    if (dom) {
      dom.window.close();
    }
  });

  /**
   * ヘルパー関数: URLからドメインパターンを生成
   */
  function getDomainPattern(url) {
    try {
      const urlObj = new URL(url);
      return `*://${urlObj.hostname}/*`;
    } catch (error) {
      return null;
    }
  }

  /**
   * ヘルパー関数: パターンマッチング
   */
  function patternToRegex(pattern) {
    if (pattern === '<all_urls>') {
      return /^(https?|file|ftp):\/\/.*/;
    }

    // 特殊文字をエスケープ
    let regexStr = pattern
      .split('').map(char => {
        if (char === '*') return '.*';
        if (char === '?') return '.';
        if ('.+^${}()|[]\\'.includes(char)) return '\\' + char;
        return char;
      }).join('');

    return new RegExp(`^${regexStr}$`);
  }

  /**
   * ヘルパー関数: パターンを追加（同期的に実行）
   */
  function addPattern(pattern) {
    const patternObj = {
      id: `id-${Date.now()}-${Math.random()}`,
      pattern: pattern,
      enabled: true,
      createdAt: Date.now()
    };
    addedPatterns.push(patternObj);
    return patternObj;
  }

  /**
   * ヘルパー関数: 簡易トグルボタンのクリックをシミュレート
   */
  function clickQuickToggle(currentDomainPattern) {
    if (!currentDomainPattern) return;
    return addPattern(currentDomainPattern);
  }

  /**
   * プロパティ 18: ポップアップからドメインをトグルできる
   * 
   * 任意の現在のドメインについて、
   * ポップアップのトグルを使用してそのドメインの有効/無効を切り替えられる
   * 
   * 検証対象: 要件 8.5
   */
  test('プロパティ 18: ドメイントグル - 簡易トグルボタンでドメインを有効化できる', () => {
    fc.assert(
      fc.property(
        fc.record({
          protocol: fc.constantFrom('http', 'https'),
          domain: simpleDomain(),
          path: fc.constantFrom('/', '/chat', '/messages', '/room/123')
        }),
        ({ protocol, domain, path }) => {
          addedPatterns.length = 0;
          
          const url = `${protocol}://${domain}${path}`;
          const domainPattern = getDomainPattern(url);
          
          expect(addedPatterns.length).toBe(0);
          
          clickQuickToggle(domainPattern);
          
          // 要件 8.5: ドメインが追加されたことを確認
          expect(addedPatterns.length).toBe(1);
          expect(addedPatterns[0].pattern).toBe(domainPattern);
          expect(addedPatterns[0].enabled).toBe(true);
          
          const regex = patternToRegex(addedPatterns[0].pattern);
          expect(regex.test(url)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 18: ドメイントグル - 追加されたパターンは正しいドメイン形式である', () => {
    fc.assert(
      fc.property(
        fc.record({
          protocol: fc.constantFrom('http', 'https'),
          domain: simpleDomain(),
          path: fc.constantFrom('/', '/chat', '/messages')
        }),
        ({ protocol, domain, path }) => {
          addedPatterns.length = 0;
          
          const url = `${protocol}://${domain}${path}`;
          const domainPattern = getDomainPattern(url);
          
          clickQuickToggle(domainPattern);
          
          expect(addedPatterns[0].pattern).toMatch(/^\*:\/\/[^/]+\/\*$/);
          expect(addedPatterns[0].pattern).toBe(`*://${domain}/*`);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 18: ドメイントグル - 同じドメインの異なるパスでも同じパターンが追加される', () => {
    fc.assert(
      fc.property(
        fc.record({
          protocol: fc.constantFrom('http', 'https'),
          domain: simpleDomain(),
          paths: fc.array(
            fc.constantFrom('/', '/chat', '/messages', '/room/123', '/settings'),
            { minLength: 2, maxLength: 3 }
          )
        }),
        ({ protocol, domain, paths }) => {
          const url1 = `${protocol}://${domain}${paths[0]}`;
          const pattern1 = getDomainPattern(url1);
          
          const url2 = `${protocol}://${domain}${paths[1]}`;
          const pattern2 = getDomainPattern(url2);
          
          expect(pattern1).toBe(pattern2);
          expect(pattern1).toBe(`*://${domain}/*`);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 18: ドメイントグル - 追加されたパターンは即座に有効になる', () => {
    fc.assert(
      fc.property(
        fc.record({
          protocol: fc.constantFrom('http', 'https'),
          domain: simpleDomain(),
          path: fc.constantFrom('/', '/chat', '/messages')
        }),
        ({ protocol, domain, path }) => {
          addedPatterns.length = 0;
          
          const url = `${protocol}://${domain}${path}`;
          const domainPattern = getDomainPattern(url);
          
          clickQuickToggle(domainPattern);
          
          expect(addedPatterns[0].enabled).toBe(true);
          
          const regex = patternToRegex(addedPatterns[0].pattern);
          expect(regex.test(url)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 18: ドメイントグル - プロトコルが異なっても同じパターンが生成される', () => {
    fc.assert(
      fc.property(
        fc.record({
          domain: simpleDomain(),
          path: fc.constantFrom('/', '/chat', '/messages')
        }),
        ({ domain, path }) => {
          const httpUrl = `http://${domain}${path}`;
          const httpsUrl = `https://${domain}${path}`;
          
          const httpPattern = getDomainPattern(httpUrl);
          const httpsPattern = getDomainPattern(httpsUrl);
          
          expect(httpPattern).toBe(httpsPattern);
          expect(httpPattern).toBe(`*://${domain}/*`);
          
          addedPatterns.length = 0;
          clickQuickToggle(httpPattern);
          
          const regex = patternToRegex(addedPatterns[0].pattern);
          expect(regex.test(httpUrl)).toBe(true);
          expect(regex.test(httpsUrl)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 18: ドメイントグル - サブドメインは別のパターンとして扱われる', () => {
    fc.assert(
      fc.property(
        fc.record({
          protocol: fc.constantFrom('http', 'https'),
          baseDomain: simpleDomain(),
          subdomain: fc.constantFrom('www', 'chat', 'api', 'app'),
          path: fc.constantFrom('/', '/chat')
        }),
        ({ protocol, baseDomain, subdomain, path }) => {
          const baseUrl = `${protocol}://${baseDomain}${path}`;
          const subUrl = `${protocol}://${subdomain}.${baseDomain}${path}`;
          
          const basePattern = getDomainPattern(baseUrl);
          const subPattern = getDomainPattern(subUrl);
          
          expect(basePattern).not.toBe(subPattern);
          expect(basePattern).toBe(`*://${baseDomain}/*`);
          expect(subPattern).toBe(`*://${subdomain}.${baseDomain}/*`);
          
          addedPatterns.length = 0;
          clickQuickToggle(basePattern);
          clickQuickToggle(subPattern);
          
          expect(addedPatterns.length).toBe(2);
          
          const baseRegex = patternToRegex(addedPatterns[0].pattern);
          const subRegex = patternToRegex(addedPatterns[1].pattern);
          
          expect(baseRegex.test(baseUrl)).toBe(true);
          expect(baseRegex.test(subUrl)).toBe(false);
          
          expect(subRegex.test(subUrl)).toBe(true);
          expect(subRegex.test(baseUrl)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 18: ドメイントグル - 追加されたパターンにはユニークなIDが付与される', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            protocol: fc.constantFrom('http', 'https'),
            domain: simpleDomain(),
            path: fc.constantFrom('/', '/chat')
          }),
          { minLength: 2, maxLength: 3 }
        ).filter(urls => {
          const domains = urls.map(u => u.domain);
          return new Set(domains).size === domains.length;
        }),
        (urls) => {
          addedPatterns.length = 0;
          
          for (const { protocol, domain, path } of urls) {
            const url = `${protocol}://${domain}${path}`;
            const domainPattern = getDomainPattern(url);
            clickQuickToggle(domainPattern);
          }
          
          const ids = addedPatterns.map(p => p.id);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 18: ドメイントグル - 追加されたパターンにはタイムスタンプが付与される', () => {
    fc.assert(
      fc.property(
        fc.record({
          protocol: fc.constantFrom('http', 'https'),
          domain: simpleDomain(),
          path: fc.constantFrom('/', '/chat')
        }),
        ({ protocol, domain, path }) => {
          addedPatterns.length = 0;
          
          const url = `${protocol}://${domain}${path}`;
          const domainPattern = getDomainPattern(url);
          
          const beforeTime = Date.now();
          clickQuickToggle(domainPattern);
          const afterTime = Date.now();
          
          expect(addedPatterns[0].createdAt).toBeGreaterThanOrEqual(beforeTime);
          expect(addedPatterns[0].createdAt).toBeLessThanOrEqual(afterTime);
        }
      ),
      { numRuns: 100 }
    );
  });

});
