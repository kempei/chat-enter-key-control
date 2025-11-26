// URLパターンマッチング機能のテスト
// 要件: 3.5

import { describe, it, expect } from 'vitest';
import { patternToRegex, matchesPattern, matchesAnyActivePattern } from '../background.js';

describe('URLパターンマッチング', () => {
  describe('patternToRegex', () => {
    it('ワイルドカードパターンを正規表現に変換できる', () => {
      const regex = patternToRegex('*://example.com/*');
      expect(regex).toBeInstanceOf(RegExp);
    });

    it('<all_urls>パターンを処理できる', () => {
      const regex = patternToRegex('<all_urls>');
      expect(regex.test('https://example.com')).toBe(true);
      expect(regex.test('http://example.com')).toBe(true);
    });

    it('特殊文字を正しくエスケープする', () => {
      const regex = patternToRegex('https://example.com/path?query=value');
      expect(regex.test('https://example.com/path?query=value')).toBe(true);
    });
  });

  describe('matchesPattern', () => {
    it('完全一致するURLをマッチできる', () => {
      expect(matchesPattern('https://example.com/', 'https://example.com/')).toBe(true);
    });

    it('ワイルドカードでプロトコルをマッチできる', () => {
      expect(matchesPattern('https://example.com/', '*://example.com/')).toBe(true);
      expect(matchesPattern('http://example.com/', '*://example.com/')).toBe(true);
    });

    it('ワイルドカードでパスをマッチできる', () => {
      expect(matchesPattern('https://example.com/path/to/page', 'https://example.com/*')).toBe(true);
      expect(matchesPattern('https://example.com/', 'https://example.com/*')).toBe(true);
    });

    it('サブドメインのワイルドカードをマッチできる', () => {
      expect(matchesPattern('https://sub.example.com/', '*://*.example.com/')).toBe(true);
      expect(matchesPattern('https://deep.sub.example.com/', '*://*.example.com/')).toBe(true);
    });

    it('マッチしないURLを正しく判定できる', () => {
      expect(matchesPattern('https://other.com/', 'https://example.com/*')).toBe(false);
      expect(matchesPattern('https://example.com/', 'https://other.com/*')).toBe(false);
    });

    it('<all_urls>パターンですべてのURLにマッチする', () => {
      expect(matchesPattern('https://example.com/', '<all_urls>')).toBe(true);
      expect(matchesPattern('http://other.com/path', '<all_urls>')).toBe(true);
    });
  });

  describe('matchesAnyActivePattern', () => {
    it('有効なパターンにマッチする場合trueを返す', () => {
      const patterns = [
        { id: '1', pattern: 'https://example.com/*', enabled: true, createdAt: Date.now() },
        { id: '2', pattern: 'https://other.com/*', enabled: true, createdAt: Date.now() }
      ];
      expect(matchesAnyActivePattern('https://example.com/path', patterns)).toBe(true);
    });

    it('無効なパターンは無視される', () => {
      const patterns = [
        { id: '1', pattern: 'https://example.com/*', enabled: false, createdAt: Date.now() }
      ];
      expect(matchesAnyActivePattern('https://example.com/path', patterns)).toBe(false);
    });

    it('どのパターンにもマッチしない場合falseを返す', () => {
      const patterns = [
        { id: '1', pattern: 'https://example.com/*', enabled: true, createdAt: Date.now() }
      ];
      expect(matchesAnyActivePattern('https://other.com/path', patterns)).toBe(false);
    });

    it('複数のパターンのいずれかにマッチする', () => {
      const patterns = [
        { id: '1', pattern: 'https://example.com/*', enabled: true, createdAt: Date.now() },
        { id: '2', pattern: 'https://other.com/*', enabled: true, createdAt: Date.now() }
      ];
      expect(matchesAnyActivePattern('https://other.com/path', patterns)).toBe(true);
    });
  });
});
