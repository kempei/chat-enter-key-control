// URLマッチングのプロパティベーステスト
// Feature: chat-enter-key-control, Property 7: マッチするURLパターンでスクリプトが注入される
// 検証対象: 要件 3.5

import { describe, test, beforeEach, expect } from 'vitest';
import * as fc from 'fast-check';
import { matchesPattern, matchesAnyActivePattern } from '../background.js';

describe('URLマッチングのプロパティテスト', () => {
  /**
   * プロパティ 7: マッチするURLパターンでスクリプトが注入される
   * 
   * 任意のURLとアクティブなURLパターンリストについて、
   * URLがいずれかのパターンにマッチする場合、コンテンツスクリプトが注入される
   * 
   * 検証対象: 要件 3.5
   */
  test('プロパティ 7: URLマッチング - 有効なパターンにマッチするURLは正しく判定される', async () => {
    await fc.assert(
      fc.property(
        // URLとパターンのペアを生成（マッチするように）
        fc.record({
          protocol: fc.constantFrom('http', 'https'),
          domain: fc.domain(),
          path: fc.constantFrom('/', '/chat', '/messages', '/path/to/page')
        }),
        ({ protocol, domain, path }) => {
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
          
          // URLがパターンにマッチすることを確認
          const result = matchesAnyActivePattern(url, patterns);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 7: URLマッチング - 無効なパターンはマッチしない', async () => {
    await fc.assert(
      fc.property(
        // URLとパターンのペアを生成
        fc.record({
          protocol: fc.constantFrom('http', 'https'),
          domain: fc.domain(),
          path: fc.constantFrom('/', '/chat', '/messages')
        }),
        ({ protocol, domain, path }) => {
          const url = `${protocol}://${domain}${path}`;
          
          // 無効なパターンを作成
          const patterns = [
            {
              id: '1',
              pattern: `*://${domain}/*`,
              enabled: false, // 無効
              createdAt: Date.now()
            }
          ];
          
          // URLがパターンにマッチしないことを確認
          const result = matchesAnyActivePattern(url, patterns);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 7: URLマッチング - 複数のパターンのいずれかにマッチする', async () => {
    await fc.assert(
      fc.property(
        // 複数のドメインとURLを生成
        fc.tuple(
          fc.array(fc.domain(), { minLength: 2, maxLength: 5 }),
          fc.constantFrom('http', 'https'),
          fc.constantFrom('/', '/chat', '/messages')
        ),
        ([domains, protocol, path]) => {
          // ランダムに1つのドメインを選択してURLを作成
          const selectedDomain = domains[Math.floor(Math.random() * domains.length)];
          const url = `${protocol}://${selectedDomain}${path}`;
          
          // すべてのドメインに対してパターンを作成（すべて有効）
          const patterns = domains.map((domain, index) => ({
            id: `${index}`,
            pattern: `*://${domain}/*`,
            enabled: true,
            createdAt: Date.now()
          }));
          
          // URLがいずれかのパターンにマッチすることを確認
          const result = matchesAnyActivePattern(url, patterns);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 7: URLマッチング - マッチしないURLは正しく判定される', async () => {
    await fc.assert(
      fc.property(
        // 2つの異なるドメインを生成
        fc.tuple(
          fc.domain(),
          fc.domain(),
          fc.constantFrom('http', 'https'),
          fc.constantFrom('/', '/chat', '/messages')
        ).filter(([domain1, domain2]) => domain1 !== domain2), // 異なるドメインのみ
        ([domain1, domain2, protocol, path]) => {
          // domain1のURLを作成
          const url = `${protocol}://${domain1}${path}`;
          
          // domain2のパターンを作成（マッチしないはず）
          const patterns = [
            {
              id: '1',
              pattern: `*://${domain2}/*`,
              enabled: true,
              createdAt: Date.now()
            }
          ];
          
          // URLがパターンにマッチしないことを確認
          const result = matchesAnyActivePattern(url, patterns);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 7: URLマッチング - ワイルドカードパターンが正しく機能する', async () => {
    await fc.assert(
      fc.property(
        // URLを生成
        fc.record({
          protocol: fc.constantFrom('http', 'https'),
          subdomain: fc.constantFrom('www', 'app', 'api', 'chat'),
          domain: fc.domain(),
          path: fc.constantFrom('/', '/chat', '/messages', '/path/to/page')
        }),
        ({ protocol, subdomain, domain, path }) => {
          const url = `${protocol}://${subdomain}.${domain}${path}`;
          
          // サブドメインワイルドカードパターンを作成
          const patterns = [
            {
              id: '1',
              pattern: `*://*.${domain}/*`,
              enabled: true,
              createdAt: Date.now()
            }
          ];
          
          // URLがパターンにマッチすることを確認
          const result = matchesAnyActivePattern(url, patterns);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 7: URLマッチング - <all_urls>パターンはすべてのURLにマッチする', async () => {
    await fc.assert(
      fc.property(
        // 任意のURLを生成
        fc.webUrl(),
        (url) => {
          // <all_urls>パターンを作成
          const patterns = [
            {
              id: '1',
              pattern: '<all_urls>',
              enabled: true,
              createdAt: Date.now()
            }
          ];
          
          // URLがパターンにマッチすることを確認
          const result = matchesAnyActivePattern(url, patterns);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 7: URLマッチング - プロトコルワイルドカードが正しく機能する', async () => {
    await fc.assert(
      fc.property(
        // URLを生成
        fc.record({
          protocol: fc.constantFrom('http', 'https'),
          domain: fc.domain(),
          path: fc.constantFrom('/', '/chat', '/messages')
        }),
        ({ protocol, domain, path }) => {
          const url = `${protocol}://${domain}${path}`;
          
          // プロトコルワイルドカードパターンを作成
          const patterns = [
            {
              id: '1',
              pattern: `*://${domain}/*`,
              enabled: true,
              createdAt: Date.now()
            }
          ];
          
          // URLがパターンにマッチすることを確認
          const result = matchesAnyActivePattern(url, patterns);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 7: URLマッチング - パスワイルドカードが正しく機能する', async () => {
    await fc.assert(
      fc.property(
        // URLを生成
        fc.record({
          protocol: fc.constantFrom('http', 'https'),
          domain: fc.domain(),
          path: fc.oneof(
            fc.constant('/'),
            fc.constant('/chat'),
            fc.constant('/messages/123'),
            fc.constant('/path/to/deep/page')
          )
        }),
        ({ protocol, domain, path }) => {
          const url = `${protocol}://${domain}${path}`;
          
          // パスワイルドカードパターンを作成
          const patterns = [
            {
              id: '1',
              pattern: `${protocol}://${domain}/*`,
              enabled: true,
              createdAt: Date.now()
            }
          ];
          
          // URLがパターンにマッチすることを確認
          const result = matchesAnyActivePattern(url, patterns);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 7: URLマッチング - 有効と無効のパターンが混在する場合', async () => {
    await fc.assert(
      fc.property(
        // URLとパターンを生成
        fc.record({
          protocol: fc.constantFrom('http', 'https'),
          domain: fc.domain(),
          path: fc.constantFrom('/', '/chat', '/messages')
        }),
        ({ protocol, domain, path }) => {
          const url = `${protocol}://${domain}${path}`;
          
          // 有効と無効のパターンを混在させる
          const patterns = [
            {
              id: '1',
              pattern: `*://${domain}/*`,
              enabled: false, // 無効
              createdAt: Date.now()
            },
            {
              id: '2',
              pattern: `*://${domain}/*`,
              enabled: true, // 有効
              createdAt: Date.now()
            }
          ];
          
          // URLが有効なパターンにマッチすることを確認
          const result = matchesAnyActivePattern(url, patterns);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 7: URLマッチング - 空のパターンリストはマッチしない', async () => {
    await fc.assert(
      fc.property(
        // 任意のURLを生成
        fc.webUrl(),
        (url) => {
          // 空のパターンリスト
          const patterns = [];
          
          // URLがマッチしないことを確認
          const result = matchesAnyActivePattern(url, patterns);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 7: URLマッチング - 特定のパスパターンが正しく機能する', async () => {
    await fc.assert(
      fc.property(
        // URLを生成
        fc.record({
          protocol: fc.constantFrom('http', 'https'),
          domain: fc.domain(),
          specificPath: fc.constantFrom('/chat', '/messages', '/api')
        }),
        ({ protocol, domain, specificPath }) => {
          const url = `${protocol}://${domain}${specificPath}/subpath`;
          
          // 特定のパスパターンを作成
          const patterns = [
            {
              id: '1',
              pattern: `${protocol}://${domain}${specificPath}/*`,
              enabled: true,
              createdAt: Date.now()
            }
          ];
          
          // URLがパターンにマッチすることを確認
          const result = matchesAnyActivePattern(url, patterns);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 7: URLマッチング - マッチング判定の一貫性', async () => {
    await fc.assert(
      fc.property(
        // URLとパターンを生成
        fc.record({
          protocol: fc.constantFrom('http', 'https'),
          domain: fc.domain(),
          path: fc.constantFrom('/', '/chat', '/messages')
        }),
        ({ protocol, domain, path }) => {
          const url = `${protocol}://${domain}${path}`;
          
          const patterns = [
            {
              id: '1',
              pattern: `*://${domain}/*`,
              enabled: true,
              createdAt: Date.now()
            }
          ];
          
          // 同じ入力で複数回呼び出しても同じ結果が返ることを確認
          const result1 = matchesAnyActivePattern(url, patterns);
          const result2 = matchesAnyActivePattern(url, patterns);
          const result3 = matchesAnyActivePattern(url, patterns);
          
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
          expect(result1).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
