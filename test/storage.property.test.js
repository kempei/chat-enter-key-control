// ストレージ操作のプロパティベーステスト
// Feature: chat-enter-key-control, Property 4: URLパターンのラウンドトリップ
// 検証対象: 要件 3.2, 6.1, 6.2

import { describe, test, beforeEach, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  addPattern,
  getPatterns,
  savePatterns,
  removePattern,
  togglePattern,
  exportSettings,
  importSettings,
  getSendKeyConfig,
  saveSendKeyConfig,
  getDefaultSendKeyConfig
} from '../background.js';

describe('ストレージ操作のプロパティテスト', () => {
  beforeEach(() => {
    // 各テストの前にストレージをクリア
    chrome.storage.sync._reset();
  });

  /**
   * プロパティ 4: URLパターンのラウンドトリップ
   * 
   * 任意のURLパターンについて、追加してから読み込んだ場合、
   * 同じパターンが取得できる
   * 
   * 検証対象: 要件 3.2, 6.1, 6.2
   */
  test('プロパティ 4: URLパターンのラウンドトリップ - 追加したパターンは正しく取得できる', async () => {
    await fc.assert(
      fc.asyncProperty(
        // URLパターンの生成器
        fc.oneof(
          // 標準的なURLパターン
          fc.webUrl().map(url => `*://${new URL(url).hostname}/*`),
          // ワイルドカードパターン
          fc.domain().map(domain => `*://*.${domain}/*`),
          // 特定のプロトコル
          fc.record({
            protocol: fc.constantFrom('http', 'https'),
            domain: fc.domain(),
            path: fc.constantFrom('/*', '/chat/*', '/messages/*')
          }).map(({ protocol, domain, path }) => `${protocol}://${domain}${path}`),
          // 特殊なパターン
          fc.constantFrom(
            '<all_urls>',
            '*://*/*',
            'https://*/*'
          )
        ),
        async (pattern) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // パターンを追加
          const addedPattern = await addPattern(pattern);
          
          // パターンを取得
          const patterns = await getPatterns();
          
          // 追加したパターンが存在することを確認
          const foundPattern = patterns.find(p => p.id === addedPattern.id);
          
          // アサーション
          expect(foundPattern).toBeDefined();
          expect(foundPattern.pattern).toBe(pattern);
          expect(foundPattern.enabled).toBe(true);
          expect(foundPattern.id).toBe(addedPattern.id);
          expect(foundPattern.createdAt).toBe(addedPattern.createdAt);
        }
      ),
      { numRuns: 100 } // 最低100回の反復
    );
  });

  test('プロパティ 4: URLパターンのラウンドトリップ - 複数のパターンを追加して取得できる', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 複数のURLパターンの配列を生成
        fc.array(
          fc.oneof(
            fc.webUrl().map(url => `*://${new URL(url).hostname}/*`),
            fc.domain().map(domain => `*://*.${domain}/*`)
          ),
          { minLength: 1, maxLength: 10 }
        ),
        async (patternStrings) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // すべてのパターンを追加
          const addedPatterns = [];
          for (const patternString of patternStrings) {
            const added = await addPattern(patternString);
            addedPatterns.push(added);
          }
          
          // パターンを取得
          const retrievedPatterns = await getPatterns();
          
          // すべての追加したパターンが存在することを確認
          for (const addedPattern of addedPatterns) {
            const found = retrievedPatterns.find(p => p.id === addedPattern.id);
            expect(found).toBeDefined();
            expect(found.pattern).toBe(addedPattern.pattern);
            expect(found.enabled).toBe(addedPattern.enabled);
            expect(found.createdAt).toBe(addedPattern.createdAt);
          }
          
          // 取得したパターンの数が正しいことを確認
          expect(retrievedPatterns.length).toBe(addedPatterns.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 4: URLパターンのラウンドトリップ - 直接保存したパターンも正しく取得できる', async () => {
    await fc.assert(
      fc.asyncProperty(
        // URLパターンオブジェクトの配列を生成
        fc.array(
          fc.record({
            id: fc.uuid(),
            pattern: fc.oneof(
              fc.webUrl().map(url => `*://${new URL(url).hostname}/*`),
              fc.domain().map(domain => `*://*.${domain}/*`)
            ),
            enabled: fc.boolean(),
            createdAt: fc.integer({ min: 0, max: Date.now() })
          }),
          { minLength: 0, maxLength: 10 }
        ),
        async (patterns) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // パターンを直接保存
          await savePatterns(patterns);
          
          // パターンを取得
          const retrievedPatterns = await getPatterns();
          
          // 保存したパターンと取得したパターンが一致することを確認
          expect(retrievedPatterns).toEqual(patterns);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * プロパティ 5: URLパターンの削除は状態を変更する
   * 
   * 任意のURLパターンリストとパターンIDについて、
   * パターンを削除した場合、そのパターンはリストに存在しなくなる
   * 
   * 検証対象: 要件 3.3
   */
  test('プロパティ 5: URLパターンの削除 - 削除したパターンはリストに存在しない', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 少なくとも1つのパターンを含む配列を生成
        fc.array(
          fc.record({
            id: fc.uuid(),
            pattern: fc.oneof(
              fc.webUrl().map(url => `*://${new URL(url).hostname}/*`),
              fc.domain().map(domain => `*://*.${domain}/*`)
            ),
            enabled: fc.boolean(),
            createdAt: fc.integer({ min: 0, max: Date.now() })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (patterns) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // パターンを保存
          await savePatterns(patterns);
          
          // ランダムに1つのパターンを選択して削除
          const patternToRemove = patterns[Math.floor(Math.random() * patterns.length)];
          await removePattern(patternToRemove.id);
          
          // パターンを取得
          const retrievedPatterns = await getPatterns();
          
          // 削除したパターンが存在しないことを確認
          const foundPattern = retrievedPatterns.find(p => p.id === patternToRemove.id);
          expect(foundPattern).toBeUndefined();
          
          // 残りのパターンが正しく存在することを確認
          const expectedPatterns = patterns.filter(p => p.id !== patternToRemove.id);
          expect(retrievedPatterns.length).toBe(expectedPatterns.length);
          
          // すべての残りのパターンが存在することを確認
          for (const expectedPattern of expectedPatterns) {
            const found = retrievedPatterns.find(p => p.id === expectedPattern.id);
            expect(found).toBeDefined();
            expect(found).toEqual(expectedPattern);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 5: URLパターンの削除 - 存在しないIDを削除してもエラーにならない', async () => {
    await fc.assert(
      fc.asyncProperty(
        // パターンの配列と存在しないIDを生成
        fc.tuple(
          fc.array(
            fc.record({
              id: fc.uuid(),
              pattern: fc.oneof(
                fc.webUrl().map(url => `*://${new URL(url).hostname}/*`),
                fc.domain().map(domain => `*://*.${domain}/*`)
              ),
              enabled: fc.boolean(),
              createdAt: fc.integer({ min: 0, max: Date.now() })
            }),
            { minLength: 0, maxLength: 10 }
          ),
          fc.uuid() // 存在しないID
        ),
        async ([patterns, nonExistentId]) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // パターンを保存
          await savePatterns(patterns);
          
          // 存在しないIDを削除（エラーにならないことを確認）
          await expect(removePattern(nonExistentId)).resolves.not.toThrow();
          
          // パターンを取得
          const retrievedPatterns = await getPatterns();
          
          // すべてのパターンが変更されていないことを確認
          expect(retrievedPatterns).toEqual(patterns);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 5: URLパターンの削除 - すべてのパターンを削除できる', async () => {
    await fc.assert(
      fc.asyncProperty(
        // パターンの配列を生成
        fc.array(
          fc.record({
            id: fc.uuid(),
            pattern: fc.oneof(
              fc.webUrl().map(url => `*://${new URL(url).hostname}/*`),
              fc.domain().map(domain => `*://*.${domain}/*`)
            ),
            enabled: fc.boolean(),
            createdAt: fc.integer({ min: 0, max: Date.now() })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (patterns) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // パターンを保存
          await savePatterns(patterns);
          
          // すべてのパターンを削除
          for (const pattern of patterns) {
            await removePattern(pattern.id);
          }
          
          // パターンを取得
          const retrievedPatterns = await getPatterns();
          
          // すべてのパターンが削除されていることを確認
          expect(retrievedPatterns).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * プロパティ 6: URLパターンのトグルは状態を反転する
   * 
   * 任意のURLパターンについて、トグルを実行した場合、
   * enabled状態が反転する
   * 
   * 検証対象: 要件 3.4
   */
  test('プロパティ 6: URLパターンのトグル - トグルすると状態が反転する', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 少なくとも1つのパターンを含む配列を生成
        fc.array(
          fc.record({
            id: fc.uuid(),
            pattern: fc.oneof(
              fc.webUrl().map(url => `*://${new URL(url).hostname}/*`),
              fc.domain().map(domain => `*://*.${domain}/*`)
            ),
            enabled: fc.boolean(),
            createdAt: fc.integer({ min: 0, max: Date.now() })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (patterns) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // パターンを保存
          await savePatterns(patterns);
          
          // ランダムに1つのパターンを選択してトグル
          const patternToToggle = patterns[Math.floor(Math.random() * patterns.length)];
          const originalEnabledState = patternToToggle.enabled;
          
          // トグルを実行
          await togglePattern(patternToToggle.id);
          
          // パターンを取得
          const retrievedPatterns = await getPatterns();
          
          // トグルしたパターンを見つける
          const toggledPattern = retrievedPatterns.find(p => p.id === patternToToggle.id);
          
          // enabled状態が反転していることを確認
          expect(toggledPattern).toBeDefined();
          expect(toggledPattern.enabled).toBe(!originalEnabledState);
          
          // 他のフィールドは変更されていないことを確認
          expect(toggledPattern.id).toBe(patternToToggle.id);
          expect(toggledPattern.pattern).toBe(patternToToggle.pattern);
          expect(toggledPattern.createdAt).toBe(patternToToggle.createdAt);
          
          // 他のパターンは変更されていないことを確認
          for (const originalPattern of patterns) {
            if (originalPattern.id !== patternToToggle.id) {
              const unchangedPattern = retrievedPatterns.find(p => p.id === originalPattern.id);
              expect(unchangedPattern).toEqual(originalPattern);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 6: URLパターンのトグル - 2回トグルすると元の状態に戻る', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 少なくとも1つのパターンを含む配列を生成
        fc.array(
          fc.record({
            id: fc.uuid(),
            pattern: fc.oneof(
              fc.webUrl().map(url => `*://${new URL(url).hostname}/*`),
              fc.domain().map(domain => `*://*.${domain}/*`)
            ),
            enabled: fc.boolean(),
            createdAt: fc.integer({ min: 0, max: Date.now() })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (patterns) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // パターンを保存
          await savePatterns(patterns);
          
          // ランダムに1つのパターンを選択
          const patternToToggle = patterns[Math.floor(Math.random() * patterns.length)];
          const originalEnabledState = patternToToggle.enabled;
          
          // 2回トグルを実行
          await togglePattern(patternToToggle.id);
          await togglePattern(patternToToggle.id);
          
          // パターンを取得
          const retrievedPatterns = await getPatterns();
          
          // トグルしたパターンを見つける
          const toggledPattern = retrievedPatterns.find(p => p.id === patternToToggle.id);
          
          // enabled状態が元に戻っていることを確認
          expect(toggledPattern).toBeDefined();
          expect(toggledPattern.enabled).toBe(originalEnabledState);
          
          // すべてのフィールドが元の状態と同じことを確認
          expect(toggledPattern).toEqual(patternToToggle);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 6: URLパターンのトグル - 存在しないIDをトグルしてもエラーにならない', async () => {
    await fc.assert(
      fc.asyncProperty(
        // パターンの配列と存在しないIDを生成
        fc.tuple(
          fc.array(
            fc.record({
              id: fc.uuid(),
              pattern: fc.oneof(
                fc.webUrl().map(url => `*://${new URL(url).hostname}/*`),
                fc.domain().map(domain => `*://*.${domain}/*`)
              ),
              enabled: fc.boolean(),
              createdAt: fc.integer({ min: 0, max: Date.now() })
            }),
            { minLength: 0, maxLength: 10 }
          ),
          fc.uuid() // 存在しないID
        ),
        async ([patterns, nonExistentId]) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // パターンを保存
          await savePatterns(patterns);
          
          // 存在しないIDをトグル（エラーになることを確認）
          // エラーハンドリングの改善により、存在しないIDのトグルはエラーをスローする
          await expect(togglePattern(nonExistentId)).rejects.toThrow();
          
          // パターンを取得
          const retrievedPatterns = await getPatterns();
          
          // すべてのパターンが変更されていないことを確認
          expect(retrievedPatterns).toEqual(patterns);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 6: URLパターンのトグル - 複数のパターンを個別にトグルできる', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 少なくとも2つのパターンを含む配列を生成
        fc.array(
          fc.record({
            id: fc.uuid(),
            pattern: fc.oneof(
              fc.webUrl().map(url => `*://${new URL(url).hostname}/*`),
              fc.domain().map(domain => `*://*.${domain}/*`)
            ),
            enabled: fc.boolean(),
            createdAt: fc.integer({ min: 0, max: Date.now() })
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (patterns) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // パターンを保存
          await savePatterns(patterns);
          
          // 各パターンの元の状態を記録
          const originalStates = new Map(patterns.map(p => [p.id, p.enabled]));
          
          // すべてのパターンをトグル
          for (const pattern of patterns) {
            await togglePattern(pattern.id);
          }
          
          // パターンを取得
          const retrievedPatterns = await getPatterns();
          
          // すべてのパターンの状態が反転していることを確認
          for (const pattern of patterns) {
            const toggledPattern = retrievedPatterns.find(p => p.id === pattern.id);
            expect(toggledPattern).toBeDefined();
            expect(toggledPattern.enabled).toBe(!originalStates.get(pattern.id));
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * プロパティ 13: 設定変更は即座に永続化される
   * 
   * 任意のURLパターンの変更（追加、削除、トグル）について、
   * 変更は即座にChrome storageに保存される
   * 
   * 検証対象: 要件 6.3
   */
  test('プロパティ 13: 設定永続化 - パターン追加後に即座にストレージから取得できる', async () => {
    await fc.assert(
      fc.asyncProperty(
        // URLパターンの生成器（シンプルなパターンを使用）
        fc.constantFrom(
          '*://example.com/*',
          '*://test.com/*',
          '*://*.github.com/*',
          'https://chat.openai.com/*',
          '*://slack.com/*',
          '*://discord.com/*',
          'https://*.google.com/*'
        ),
        async (pattern) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // パターンを追加
          const addedPattern = await addPattern(pattern);
          
          // Chrome storageから直接取得（getPatterns関数を使わずに）
          const storageResult = await chrome.storage.sync.get('patterns');
          const storedPatterns = storageResult.patterns || [];
          
          // 追加したパターンがストレージに存在することを確認
          const foundPattern = storedPatterns.find(p => p.id === addedPattern.id);
          
          // アサーション
          expect(foundPattern).toBeDefined();
          expect(foundPattern.pattern).toBe(pattern);
          expect(foundPattern.enabled).toBe(true);
          expect(foundPattern.id).toBe(addedPattern.id);
          expect(foundPattern.createdAt).toBe(addedPattern.createdAt);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 13: 設定永続化 - パターン削除後に即座にストレージから削除される', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 少なくとも1つのパターンを含む配列を生成（シンプルなパターンを使用）
        fc.array(
          fc.record({
            id: fc.uuid(),
            pattern: fc.constantFrom(
              '*://example.com/*',
              '*://test.com/*',
              '*://*.github.com/*',
              'https://chat.openai.com/*',
              '*://slack.com/*'
            ),
            enabled: fc.boolean(),
            createdAt: fc.integer({ min: 0, max: Date.now() })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (patterns) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // パターンを保存
          await savePatterns(patterns);
          
          // ランダムに1つのパターンを選択して削除
          const patternToRemove = patterns[Math.floor(Math.random() * patterns.length)];
          await removePattern(patternToRemove.id);
          
          // Chrome storageから直接取得（getPatterns関数を使わずに）
          const storageResult = await chrome.storage.sync.get('patterns');
          const storedPatterns = storageResult.patterns || [];
          
          // 削除したパターンがストレージに存在しないことを確認
          const foundPattern = storedPatterns.find(p => p.id === patternToRemove.id);
          expect(foundPattern).toBeUndefined();
          
          // 残りのパターンが正しく存在することを確認
          const expectedPatterns = patterns.filter(p => p.id !== patternToRemove.id);
          expect(storedPatterns.length).toBe(expectedPatterns.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 13: 設定永続化 - パターントグル後に即座にストレージに反映される', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 少なくとも1つのパターンを含む配列を生成（シンプルなパターンを使用）
        fc.array(
          fc.record({
            id: fc.uuid(),
            pattern: fc.constantFrom(
              '*://example.com/*',
              '*://test.com/*',
              '*://*.github.com/*',
              'https://chat.openai.com/*',
              '*://slack.com/*'
            ),
            enabled: fc.boolean(),
            createdAt: fc.integer({ min: 0, max: Date.now() })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (patterns) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // パターンを保存
          await savePatterns(patterns);
          
          // ランダムに1つのパターンを選択してトグル
          const patternToToggle = patterns[Math.floor(Math.random() * patterns.length)];
          const originalEnabledState = patternToToggle.enabled;
          
          // トグルを実行
          await togglePattern(patternToToggle.id);
          
          // Chrome storageから直接取得（getPatterns関数を使わずに）
          const storageResult = await chrome.storage.sync.get('patterns');
          const storedPatterns = storageResult.patterns || [];
          
          // トグルしたパターンを見つける
          const toggledPattern = storedPatterns.find(p => p.id === patternToToggle.id);
          
          // enabled状態が反転していることを確認
          expect(toggledPattern).toBeDefined();
          expect(toggledPattern.enabled).toBe(!originalEnabledState);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 13: 設定永続化 - 複数の変更が順次永続化される', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 複数のパターンを生成（シンプルなパターンを使用）
        // uniqueArrayを使用して重複を防ぐ
        fc.uniqueArray(
          fc.constantFrom(
            '*://example.com/*',
            '*://test.com/*',
            '*://*.github.com/*',
            'https://chat.openai.com/*',
            '*://slack.com/*',
            '*://discord.com/*'
          ),
          { minLength: 2, maxLength: 4 }
        ),
        async (patternStrings) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // 複数のパターンを順次追加
          const addedPatterns = [];
          for (const patternString of patternStrings) {
            const added = await addPattern(patternString);
            addedPatterns.push(added);
            
            // 各追加後にストレージを確認
            const storageResult = await chrome.storage.sync.get('patterns');
            const storedPatterns = storageResult.patterns || [];
            
            // 追加したパターンがすべてストレージに存在することを確認
            expect(storedPatterns.length).toBe(addedPatterns.length);
            for (const addedPattern of addedPatterns) {
              const found = storedPatterns.find(p => p.id === addedPattern.id);
              expect(found).toBeDefined();
            }
          }
          
          // 最初のパターンをトグル
          await togglePattern(addedPatterns[0].id);
          
          // ストレージを確認
          let storageResult = await chrome.storage.sync.get('patterns');
          let storedPatterns = storageResult.patterns || [];
          let toggledPattern = storedPatterns.find(p => p.id === addedPatterns[0].id);
          expect(toggledPattern.enabled).toBe(false);
          
          // 最後のパターンを削除
          await removePattern(addedPatterns[addedPatterns.length - 1].id);
          
          // ストレージを確認
          storageResult = await chrome.storage.sync.get('patterns');
          storedPatterns = storageResult.patterns || [];
          expect(storedPatterns.length).toBe(addedPatterns.length - 1);
          
          const deletedPattern = storedPatterns.find(
            p => p.id === addedPatterns[addedPatterns.length - 1].id
          );
          expect(deletedPattern).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 13: 設定永続化 - 変更後のストレージ内容が正確である', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 新しいパターンを生成（シンプルなパターンを使用）
        fc.constantFrom(
          '*://newsite.com/*',
          '*://*.newdomain.com/*',
          'https://slack.com/*',
          '*://discord.com/*'
        ),
        async (newPatternString) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // 固定の初期パターンを作成（重複を避けるため）
          const timestamp = Date.now();
          const initialPatterns = [
            {
              id: `test-id-1-${timestamp}`,
              pattern: '*://example.com/*',
              enabled: true,
              createdAt: timestamp - 1000
            },
            {
              id: `test-id-2-${timestamp}`,
              pattern: '*://test.com/*',
              enabled: false,
              createdAt: timestamp - 2000
            }
          ];
          
          // 初期パターンを保存
          await savePatterns(initialPatterns);
          
          // 保存後のストレージを確認
          let storageResult = await chrome.storage.sync.get('patterns');
          let storedPatterns = storageResult.patterns || [];
          expect(storedPatterns.length).toBe(2);
          
          // 新しいパターンを追加
          const newPattern = await addPattern(newPatternString);
          
          // Chrome storageから直接取得
          storageResult = await chrome.storage.sync.get('patterns');
          storedPatterns = storageResult.patterns || [];
          
          // ストレージの内容が正確であることを確認
          expect(storedPatterns.length).toBe(3);
          
          // すべての初期パターンが存在することを確認
          for (const initialPattern of initialPatterns) {
            const found = storedPatterns.find(p => p.id === initialPattern.id);
            expect(found).toEqual(initialPattern);
          }
          
          // 新しいパターンが存在することを確認
          const foundNewPattern = storedPatterns.find(p => p.id === newPattern.id);
          expect(foundNewPattern).toBeDefined();
          expect(foundNewPattern.pattern).toBe(newPatternString);
          expect(foundNewPattern.enabled).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * プロパティ 14: 設定のエクスポートはすべてのパターンを含む
   * 
   * 任意のURLパターンリストについて、
   * エクスポートされたJSONファイルにはすべてのパターンが含まれる
   * 
   * 検証対象: 要件 6.5
   */
  test('プロパティ 14: 設定エクスポート - エクスポートされたJSONにすべてのパターンが含まれる', async () => {
    await fc.assert(
      fc.asyncProperty(
        // URLパターンの配列を生成
        fc.array(
          fc.record({
            id: fc.uuid(),
            pattern: fc.oneof(
              fc.webUrl().map(url => `*://${new URL(url).hostname}/*`),
              fc.domain().map(domain => `*://*.${domain}/*`),
              fc.constantFrom(
                '<all_urls>',
                '*://*/*',
                'https://*/*'
              )
            ),
            enabled: fc.boolean(),
            createdAt: fc.integer({ min: 0, max: Date.now() })
          }),
          { minLength: 0, maxLength: 20 }
        ),
        async (patterns) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // パターンを保存
          await savePatterns(patterns);
          
          // 設定をエクスポート
          const exportedJson = await exportSettings();
          
          // JSONをパース
          const exportedData = JSON.parse(exportedJson);
          
          // エクスポートされたデータにpatternsプロパティが存在することを確認
          expect(exportedData).toHaveProperty('patterns');
          expect(Array.isArray(exportedData.patterns)).toBe(true);
          
          // エクスポートされたパターンの数が正しいことを確認
          expect(exportedData.patterns.length).toBe(patterns.length);
          
          // すべてのパターンがエクスポートされたデータに含まれることを確認
          for (const pattern of patterns) {
            const foundPattern = exportedData.patterns.find(p => p.id === pattern.id);
            expect(foundPattern).toBeDefined();
            expect(foundPattern).toEqual(pattern);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 14: 設定エクスポート - 空のパターンリストも正しくエクスポートされる', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant([]), // 空の配列
        async (patterns) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // 空のパターンを保存
          await savePatterns(patterns);
          
          // 設定をエクスポート
          const exportedJson = await exportSettings();
          
          // JSONをパース
          const exportedData = JSON.parse(exportedJson);
          
          // エクスポートされたデータが空の配列であることを確認
          expect(exportedData.patterns).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 14: 設定エクスポート - エクスポートされたJSONは有効なJSON形式である', async () => {
    await fc.assert(
      fc.asyncProperty(
        // URLパターンの配列を生成
        fc.array(
          fc.record({
            id: fc.uuid(),
            pattern: fc.oneof(
              fc.webUrl().map(url => `*://${new URL(url).hostname}/*`),
              fc.domain().map(domain => `*://*.${domain}/*`)
            ),
            enabled: fc.boolean(),
            createdAt: fc.integer({ min: 0, max: Date.now() })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (patterns) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // パターンを保存
          await savePatterns(patterns);
          
          // 設定をエクスポート
          const exportedJson = await exportSettings();
          
          // JSONとして正しくパースできることを確認（エラーが発生しない）
          expect(() => JSON.parse(exportedJson)).not.toThrow();
          
          // パースされたデータが元のデータと一致することを確認
          const exportedData = JSON.parse(exportedJson);
          expect(exportedData.patterns).toEqual(patterns);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 14: 設定エクスポート - すべてのフィールドが保持される', async () => {
    await fc.assert(
      fc.asyncProperty(
        // URLパターンの配列を生成
        fc.array(
          fc.record({
            id: fc.uuid(),
            pattern: fc.oneof(
              fc.webUrl().map(url => `*://${new URL(url).hostname}/*`),
              fc.domain().map(domain => `*://*.${domain}/*`)
            ),
            enabled: fc.boolean(),
            createdAt: fc.integer({ min: 0, max: Date.now() })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (patterns) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // パターンを保存
          await savePatterns(patterns);
          
          // 設定をエクスポート
          const exportedJson = await exportSettings();
          
          // JSONをパース
          const exportedData = JSON.parse(exportedJson);
          
          // すべてのパターンのすべてのフィールドが保持されていることを確認
          for (const pattern of patterns) {
            const foundPattern = exportedData.patterns.find(p => p.id === pattern.id);
            
            // すべてのフィールドが存在することを確認
            expect(foundPattern).toHaveProperty('id');
            expect(foundPattern).toHaveProperty('pattern');
            expect(foundPattern).toHaveProperty('enabled');
            expect(foundPattern).toHaveProperty('createdAt');
            
            // フィールドの値が正しいことを確認
            expect(foundPattern.id).toBe(pattern.id);
            expect(foundPattern.pattern).toBe(pattern.pattern);
            expect(foundPattern.enabled).toBe(pattern.enabled);
            expect(foundPattern.createdAt).toBe(pattern.createdAt);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 14: 設定エクスポート - 有効/無効の状態も正しくエクスポートされる', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 有効なパターンと無効なパターンを含む配列を生成
        fc.tuple(
          fc.array(
            fc.record({
              id: fc.uuid(),
              pattern: fc.oneof(
                fc.webUrl().map(url => `*://${new URL(url).hostname}/*`),
                fc.domain().map(domain => `*://*.${domain}/*`)
              ),
              enabled: fc.constant(true), // 有効なパターン
              createdAt: fc.integer({ min: 0, max: Date.now() })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.array(
            fc.record({
              id: fc.uuid(),
              pattern: fc.oneof(
                fc.webUrl().map(url => `*://${new URL(url).hostname}/*`),
                fc.domain().map(domain => `*://*.${domain}/*`)
              ),
              enabled: fc.constant(false), // 無効なパターン
              createdAt: fc.integer({ min: 0, max: Date.now() })
            }),
            { minLength: 1, maxLength: 5 }
          )
        ),
        async ([enabledPatterns, disabledPatterns]) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // すべてのパターンを結合
          const allPatterns = [...enabledPatterns, ...disabledPatterns];
          
          // パターンを保存
          await savePatterns(allPatterns);
          
          // 設定をエクスポート
          const exportedJson = await exportSettings();
          
          // JSONをパース
          const exportedData = JSON.parse(exportedJson);
          
          // 有効なパターンの数を確認
          const exportedEnabledCount = exportedData.patterns.filter(p => p.enabled).length;
          expect(exportedEnabledCount).toBe(enabledPatterns.length);
          
          // 無効なパターンの数を確認
          const exportedDisabledCount = exportedData.patterns.filter(p => !p.enabled).length;
          expect(exportedDisabledCount).toBe(disabledPatterns.length);
          
          // すべての有効なパターンが正しくエクスポートされていることを確認
          for (const pattern of enabledPatterns) {
            const found = exportedData.patterns.find(p => p.id === pattern.id);
            expect(found).toBeDefined();
            expect(found.enabled).toBe(true);
          }
          
          // すべての無効なパターンが正しくエクスポートされていることを確認
          for (const pattern of disabledPatterns) {
            const found = exportedData.patterns.find(p => p.id === pattern.id);
            expect(found).toBeDefined();
            expect(found.enabled).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 14: 設定エクスポート - エクスポート後もストレージの内容は変更されない', async () => {
    await fc.assert(
      fc.asyncProperty(
        // URLパターンの配列を生成
        fc.array(
          fc.record({
            id: fc.uuid(),
            pattern: fc.oneof(
              fc.webUrl().map(url => `*://${new URL(url).hostname}/*`),
              fc.domain().map(domain => `*://*.${domain}/*`)
            ),
            enabled: fc.boolean(),
            createdAt: fc.integer({ min: 0, max: Date.now() })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (patterns) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // パターンを保存
          await savePatterns(patterns);
          
          // エクスポート前のパターンを取得
          const patternsBeforeExport = await getPatterns();
          
          // 設定をエクスポート
          await exportSettings();
          
          // エクスポート後のパターンを取得
          const patternsAfterExport = await getPatterns();
          
          // エクスポート前後でストレージの内容が変更されていないことを確認
          expect(patternsAfterExport).toEqual(patternsBeforeExport);
          expect(patternsAfterExport).toEqual(patterns);
        }
      ),
      { numRuns: 100 }
    );
  });
});
 
 /**
   * インポート機能のテスト
   * 
   * 設定のインポート機能が正しく動作することを確認
   * 
   * 検証対象: 要件 6.5
   */
  test('設定インポート - 有効なJSONデータをインポートできる', async () => {
    await fc.assert(
      fc.asyncProperty(
        // URLパターンの配列を生成
        fc.array(
          fc.record({
            id: fc.uuid(),
            pattern: fc.oneof(
              fc.webUrl().map(url => `*://${new URL(url).hostname}/*`),
              fc.domain().map(domain => `*://*.${domain}/*`),
              fc.constantFrom(
                '*://example.com/*',
                '*://test.com/*',
                '*://*.github.com/*'
              )
            ),
            enabled: fc.boolean(),
            createdAt: fc.integer({ min: 0, max: Date.now() })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (patterns) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // JSONデータを作成
          const jsonData = JSON.stringify({ patterns });
          
          // インポートを実行
          await importSettings(jsonData);
          
          // インポート後のパターンを取得
          const importedPatterns = await getPatterns();
          
          // インポートされたパターンが元のパターンと一致することを確認
          expect(importedPatterns).toEqual(patterns);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('設定インポート - エクスポートしたデータをインポートできる（ラウンドトリップ）', async () => {
    await fc.assert(
      fc.asyncProperty(
        // URLパターンの配列を生成
        fc.array(
          fc.record({
            id: fc.uuid(),
            pattern: fc.oneof(
              fc.webUrl().map(url => `*://${new URL(url).hostname}/*`),
              fc.domain().map(domain => `*://*.${domain}/*`)
            ),
            enabled: fc.boolean(),
            createdAt: fc.integer({ min: 0, max: Date.now() })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (patterns) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // パターンを保存
          await savePatterns(patterns);
          
          // エクスポート
          const exportedJson = await exportSettings();
          
          // ストレージをクリア
          chrome.storage.sync._reset();
          
          // インポート
          await importSettings(exportedJson);
          
          // インポート後のパターンを取得
          const importedPatterns = await getPatterns();
          
          // インポートされたパターンが元のパターンと一致することを確認
          expect(importedPatterns).toEqual(patterns);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('設定インポート - 無効なJSONデータはエラーになる', async () => {
    // 各反復の前にストレージをクリア
    chrome.storage.sync._reset();
    
    // 無効なJSONデータ
    const invalidJson = 'これは無効なJSONです';
    
    // インポートがエラーになることを確認
    await expect(importSettings(invalidJson)).rejects.toThrow();
  });

  test('設定インポート - patternsプロパティがないデータはエラーになる', async () => {
    // 各反復の前にストレージをクリア
    chrome.storage.sync._reset();
    
    // patternsプロパティがないJSONデータ
    const jsonData = JSON.stringify({ other: 'data' });
    
    // インポートがエラーになることを確認
    await expect(importSettings(jsonData)).rejects.toThrow();
  });

  test('設定インポート - 空のパターンリストをインポートできる', async () => {
    // 各反復の前にストレージをクリア
    chrome.storage.sync._reset();
    
    // 空のパターンリストのJSONデータ
    const jsonData = JSON.stringify({ patterns: [] });
    
    // インポートを実行
    await importSettings(jsonData);
    
    // インポート後のパターンを取得
    const importedPatterns = await getPatterns();
    
    // 空の配列であることを確認
    expect(importedPatterns).toEqual([]);
  });

  test('設定インポート - 無効なパターン形式はエラーになる', async () => {
    // 各反復の前にストレージをクリア
    chrome.storage.sync._reset();
    
    // 無効なパターン形式を含むJSONデータ
    const jsonData = JSON.stringify({
      patterns: [
        {
          id: 'test-id',
          pattern: 'invalid-pattern', // 無効なパターン（://が含まれていない）
          enabled: true,
          createdAt: Date.now()
        }
      ]
    });
    
    // インポートがエラーになることを確認
    await expect(importSettings(jsonData)).rejects.toThrow();
  });

  test('設定インポート - 既存のパターンは上書きされる', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 2つの異なるパターン配列を生成
        fc.tuple(
          fc.array(
            fc.record({
              id: fc.uuid(),
              pattern: fc.constantFrom(
                '*://example.com/*',
                '*://test.com/*'
              ),
              enabled: fc.boolean(),
              createdAt: fc.integer({ min: 0, max: Date.now() })
            }),
            { minLength: 1, maxLength: 3 }
          ),
          fc.array(
            fc.record({
              id: fc.uuid(),
              pattern: fc.constantFrom(
                '*://newsite.com/*',
                '*://another.com/*'
              ),
              enabled: fc.boolean(),
              createdAt: fc.integer({ min: 0, max: Date.now() })
            }),
            { minLength: 1, maxLength: 3 }
          )
        ),
        async ([initialPatterns, newPatterns]) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // 初期パターンを保存
          await savePatterns(initialPatterns);
          
          // 新しいパターンをインポート
          const jsonData = JSON.stringify({ patterns: newPatterns });
          await importSettings(jsonData);
          
          // インポート後のパターンを取得
          const importedPatterns = await getPatterns();
          
          // 新しいパターンのみが存在することを確認（初期パターンは上書きされる）
          expect(importedPatterns).toEqual(newPatterns);
          expect(importedPatterns.length).toBe(newPatterns.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * プロパティ 20: 送信キー設定のラウンドトリップ
   * 
   * 任意の送信キー設定について、保存してから読み込んだ場合、
   * 同じ設定が取得できる
   * 
   * 検証対象: 要件 9.7, 9.8
   */
  test('プロパティ 20: 送信キー設定のラウンドトリップ - 保存した設定は正しく取得できる', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 送信キー設定の生成器
        fc.record({
          modifier: fc.constantFrom('ctrl', 'alt', 'cmd', 'opt', 'shift', 'none')
        }),
        async (config) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // 設定を保存
          await saveSendKeyConfig(config);
          
          // 設定を取得
          const retrievedConfig = await getSendKeyConfig();
          
          // 保存した設定と取得した設定が一致することを確認
          expect(retrievedConfig).toEqual(config);
          expect(retrievedConfig.modifier).toBe(config.modifier);
        }
      ),
      { numRuns: 100 } // 最低100回の反復
    );
  });

  test('プロパティ 20: 送信キー設定のラウンドトリップ - デフォルト値が正しく返される', async () => {
    // 各反復の前にストレージをクリア
    chrome.storage.sync._reset();
    
    // 設定を保存せずに取得
    const config = await getSendKeyConfig();
    
    // デフォルト値（Cmd+Enter）が返されることを確認
    expect(config).toEqual({ modifier: 'cmd' });
    expect(config.modifier).toBe('cmd');
  });

  test('プロパティ 20: 送信キー設定のラウンドトリップ - 複数回の保存と取得', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 複数の送信キー設定の配列を生成
        fc.array(
          fc.record({
            modifier: fc.constantFrom('ctrl', 'alt', 'cmd', 'opt', 'shift', 'none')
          }),
          { minLength: 2, maxLength: 6 }
        ),
        async (configs) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // 各設定を順次保存して取得
          for (const config of configs) {
            await saveSendKeyConfig(config);
            const retrievedConfig = await getSendKeyConfig();
            
            // 保存した設定と取得した設定が一致することを確認
            expect(retrievedConfig).toEqual(config);
          }
          
          // 最後の設定が保持されていることを確認
          const finalConfig = await getSendKeyConfig();
          expect(finalConfig).toEqual(configs[configs.length - 1]);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 20: 送信キー設定のラウンドトリップ - Chrome storageから直接取得できる', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 送信キー設定の生成器
        fc.record({
          modifier: fc.constantFrom('ctrl', 'alt', 'cmd', 'opt', 'shift', 'none')
        }),
        async (config) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // 設定を保存
          await saveSendKeyConfig(config);
          
          // Chrome storageから直接取得（getSendKeyConfig関数を使わずに）
          const storageResult = await chrome.storage.sync.get('sendKeyConfig');
          const storedConfig = storageResult.sendKeyConfig;
          
          // 保存した設定がストレージに存在することを確認
          expect(storedConfig).toBeDefined();
          expect(storedConfig).toEqual(config);
          expect(storedConfig.modifier).toBe(config.modifier);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 20: 送信キー設定のラウンドトリップ - エクスポートとインポートで設定が保持される', async () => {
    await fc.assert(
      fc.asyncProperty(
        // URLパターンと送信キー設定を生成
        fc.tuple(
          fc.array(
            fc.record({
              id: fc.uuid(),
              pattern: fc.constantFrom(
                '*://example.com/*',
                '*://test.com/*',
                '*://*.github.com/*'
              ),
              enabled: fc.boolean(),
              createdAt: fc.integer({ min: 0, max: Date.now() })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.record({
            modifier: fc.constantFrom('ctrl', 'alt', 'cmd', 'opt', 'shift', 'none')
          })
        ),
        async ([patterns, sendKeyConfig]) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // パターンと送信キー設定を保存
          await savePatterns(patterns);
          await saveSendKeyConfig(sendKeyConfig);
          
          // エクスポート
          const exportedJson = await exportSettings();
          
          // JSONをパース
          const exportedData = JSON.parse(exportedJson);
          
          // エクスポートされたデータに送信キー設定が含まれることを確認
          expect(exportedData).toHaveProperty('sendKeyConfig');
          expect(exportedData.sendKeyConfig).toEqual(sendKeyConfig);
          
          // ストレージをクリア
          chrome.storage.sync._reset();
          
          // インポート
          await importSettings(exportedJson);
          
          // インポート後の設定を取得
          const importedConfig = await getSendKeyConfig();
          const importedPatterns = await getPatterns();
          
          // インポートされた設定が元の設定と一致することを確認
          expect(importedConfig).toEqual(sendKeyConfig);
          expect(importedPatterns).toEqual(patterns);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 20: 送信キー設定のラウンドトリップ - 送信キー設定なしのエクスポート/インポート', async () => {
    await fc.assert(
      fc.asyncProperty(
        // URLパターンのみを生成
        fc.array(
          fc.record({
            id: fc.uuid(),
            pattern: fc.constantFrom(
              '*://example.com/*',
              '*://test.com/*'
            ),
            enabled: fc.boolean(),
            createdAt: fc.integer({ min: 0, max: Date.now() })
          }),
          { minLength: 1, maxLength: 3 }
        ),
        async (patterns) => {
          // 各反復の前にストレージをクリア
          chrome.storage.sync._reset();
          
          // パターンのみを保存（送信キー設定は保存しない）
          await savePatterns(patterns);
          
          // エクスポート
          const exportedJson = await exportSettings();
          
          // JSONをパース
          const exportedData = JSON.parse(exportedJson);
          
          // エクスポートされたデータに送信キー設定が含まれることを確認（デフォルト値）
          expect(exportedData).toHaveProperty('sendKeyConfig');
          expect(exportedData.sendKeyConfig).toEqual({ modifier: 'cmd' });
          
          // ストレージをクリア
          chrome.storage.sync._reset();
          
          // インポート
          await importSettings(exportedJson);
          
          // インポート後の設定を取得
          const importedConfig = await getSendKeyConfig();
          const importedPatterns = await getPatterns();
          
          // デフォルト値が設定されていることを確認
          expect(importedConfig).toEqual({ modifier: 'cmd' });
          expect(importedPatterns).toEqual(patterns);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('プロパティ 20: 送信キー設定のラウンドトリップ - 無効な修飾キーはエラーになる', async () => {
    // 各反復の前にストレージをクリア
    chrome.storage.sync._reset();
    
    // 無効な修飾キーを含む設定
    const invalidConfig = { modifier: 'invalid' };
    
    // 保存がエラーになることを確認
    await expect(saveSendKeyConfig(invalidConfig)).rejects.toThrow();
  });

  test('プロパティ 20: 送信キー設定のラウンドトリップ - すべての有効な修飾キーが保存できる', async () => {
    const validModifiers = ['ctrl', 'alt', 'cmd', 'opt', 'shift', 'none'];
    
    for (const modifier of validModifiers) {
      // 各反復の前にストレージをクリア
      chrome.storage.sync._reset();
      
      const config = { modifier };
      
      // 設定を保存
      await saveSendKeyConfig(config);
      
      // 設定を取得
      const retrievedConfig = await getSendKeyConfig();
      
      // 保存した設定と取得した設定が一致することを確認
      expect(retrievedConfig).toEqual(config);
      expect(retrievedConfig.modifier).toBe(modifier);
    }
  });
