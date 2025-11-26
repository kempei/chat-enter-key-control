/**
 * URL表示のアクセシビリティテスト
 * 要件: 2.1, 2.2, 3.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

describe('URL表示のアクセシビリティ', () => {
  let dom;
  let document;
  let displayURL;
  let toggleURLDisplay;
  let urlDisplayState;

  beforeEach(() => {
    // DOMを初期化
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div class="current-url" id="currentUrl" data-full-url="">
            <span class="url-text"></span>
            <span class="url-expand-indicator">▼</span>
          </div>
        </body>
      </html>
    `);
    document = dom.window.document;
    global.document = document;
    global.console = {
      error: () => {},
      log: () => {},
      warn: () => {}
    };

    // URL表示状態を管理
    urlDisplayState = {
      fullUrl: '',
      isTruncated: false,
      isExpanded: false
    };

    // displayURL関数を定義（popup.jsから抽出、アクセシビリティ機能を含む）
    displayURL = (url, maxLength = 100) => {
      const urlElement = document.getElementById('currentUrl');
      const urlTextElement = urlElement.querySelector('.url-text');
      const indicatorElement = urlElement.querySelector('.url-expand-indicator');
      
      // URL変更時に状態をリセット
      if (urlDisplayState.fullUrl !== url) {
        urlDisplayState = {
          fullUrl: '',
          isTruncated: false,
          isExpanded: false
        };
      }
      
      if (!url || typeof url !== 'string') {
        urlTextElement.textContent = 'URLが取得できません';
        urlElement.classList.remove('clickable', 'truncated', 'expanded');
        indicatorElement.style.display = 'none';
        urlElement.dataset.fullUrl = '';
        urlElement.removeAttribute('tabindex');
        urlElement.removeAttribute('role');
        urlElement.removeAttribute('aria-expanded');
        urlElement.removeAttribute('aria-label');
        urlDisplayState.fullUrl = '';
        urlDisplayState.isTruncated = false;
        urlDisplayState.isExpanded = false;
        return;
      }
      
      urlElement.dataset.fullUrl = url;
      urlDisplayState.fullUrl = url;
      
      if (url.length <= maxLength) {
        // 短いURL: 全体表示、インジケーター非表示
        urlTextElement.textContent = url;
        urlElement.classList.remove('clickable', 'truncated', 'expanded');
        indicatorElement.style.display = 'none';
        urlElement.removeAttribute('tabindex');
        urlElement.removeAttribute('role');
        urlElement.removeAttribute('aria-expanded');
        urlElement.removeAttribute('aria-label');
        urlDisplayState.isTruncated = false;
        urlDisplayState.isExpanded = false;
      } else {
        // 長いURL: 省略表示、インジケーター表示
        urlTextElement.textContent = url.substring(0, maxLength) + '...';
        urlElement.classList.add('clickable', 'truncated');
        urlElement.classList.remove('expanded');
        indicatorElement.style.display = 'inline';
        indicatorElement.textContent = '▼';
        // アクセシビリティ属性を追加
        urlElement.setAttribute('tabindex', '0');
        urlElement.setAttribute('role', 'button');
        urlElement.setAttribute('aria-expanded', 'false');
        urlElement.setAttribute('aria-label', 'URLを展開');
        urlDisplayState.isTruncated = true;
        urlDisplayState.isExpanded = false;
      }
    };

    // toggleURLDisplay関数を定義（popup.jsから抽出、アクセシビリティ機能を含む）
    toggleURLDisplay = () => {
      const urlElement = document.getElementById('currentUrl');
      const urlTextElement = urlElement.querySelector('.url-text');
      const indicatorElement = urlElement.querySelector('.url-expand-indicator');
      const fullUrl = urlElement.dataset.fullUrl;
      
      if (!fullUrl || fullUrl.length <= 100) {
        return;
      }
      
      if (urlElement.classList.contains('expanded')) {
        // 折りたたみ
        urlTextElement.textContent = fullUrl.substring(0, 100) + '...';
        urlElement.classList.remove('expanded');
        urlElement.classList.add('truncated');
        indicatorElement.textContent = '▼';
        // aria-expanded属性を更新
        urlElement.setAttribute('aria-expanded', 'false');
        urlElement.setAttribute('aria-label', 'URLを展開');
        urlDisplayState.isExpanded = false;
      } else {
        // 展開
        urlTextElement.textContent = fullUrl;
        urlElement.classList.remove('truncated');
        urlElement.classList.add('expanded');
        indicatorElement.textContent = '▲';
        // aria-expanded属性を更新
        urlElement.setAttribute('aria-expanded', 'true');
        urlElement.setAttribute('aria-label', 'URLを折りたたむ');
        urlDisplayState.isExpanded = true;
      }
    };
  });

  describe('キーボードアクセシビリティ', () => {
    it('長いURLの場合、tabindex属性が設定される', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(200);
      displayURL(longUrl);

      const urlElement = document.getElementById('currentUrl');
      expect(urlElement.getAttribute('tabindex')).toBe('0');
    });

    it('短いURLの場合、tabindex属性が設定されない', () => {
      const shortUrl = 'https://example.com/';
      displayURL(shortUrl);

      const urlElement = document.getElementById('currentUrl');
      expect(urlElement.hasAttribute('tabindex')).toBe(false);
    });

    it('長いURLの場合、role="button"が設定される', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(200);
      displayURL(longUrl);

      const urlElement = document.getElementById('currentUrl');
      expect(urlElement.getAttribute('role')).toBe('button');
    });

    it('短いURLの場合、role属性が設定されない', () => {
      const shortUrl = 'https://example.com/';
      displayURL(shortUrl);

      const urlElement = document.getElementById('currentUrl');
      expect(urlElement.hasAttribute('role')).toBe(false);
    });
  });

  describe('aria-expanded属性', () => {
    it('省略状態の場合、aria-expanded="false"が設定される', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(200);
      displayURL(longUrl);

      const urlElement = document.getElementById('currentUrl');
      expect(urlElement.getAttribute('aria-expanded')).toBe('false');
    });

    it('展開状態の場合、aria-expanded="true"が設定される', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(200);
      displayURL(longUrl);
      toggleURLDisplay();

      const urlElement = document.getElementById('currentUrl');
      expect(urlElement.getAttribute('aria-expanded')).toBe('true');
    });

    it('折りたたみ後、aria-expanded="false"に戻る', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(200);
      displayURL(longUrl);
      toggleURLDisplay(); // 展開
      toggleURLDisplay(); // 折りたたみ

      const urlElement = document.getElementById('currentUrl');
      expect(urlElement.getAttribute('aria-expanded')).toBe('false');
    });

    it('短いURLの場合、aria-expanded属性が設定されない', () => {
      const shortUrl = 'https://example.com/';
      displayURL(shortUrl);

      const urlElement = document.getElementById('currentUrl');
      expect(urlElement.hasAttribute('aria-expanded')).toBe(false);
    });
  });

  describe('aria-label属性', () => {
    it('省略状態の場合、適切なaria-labelが設定される', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(200);
      displayURL(longUrl);

      const urlElement = document.getElementById('currentUrl');
      expect(urlElement.getAttribute('aria-label')).toBe('URLを展開');
    });

    it('展開状態の場合、適切なaria-labelが設定される', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(200);
      displayURL(longUrl);
      toggleURLDisplay();

      const urlElement = document.getElementById('currentUrl');
      expect(urlElement.getAttribute('aria-label')).toBe('URLを折りたたむ');
    });

    it('折りたたみ後、aria-labelが元に戻る', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(200);
      displayURL(longUrl);
      toggleURLDisplay(); // 展開
      toggleURLDisplay(); // 折りたたみ

      const urlElement = document.getElementById('currentUrl');
      expect(urlElement.getAttribute('aria-label')).toBe('URLを展開');
    });
  });

  describe('URL変更時のアクセシビリティ属性のリセット', () => {
    it('URLが変更されると、アクセシビリティ属性が再設定される', () => {
      const longUrl1 = 'https://example.com/' + 'a'.repeat(200);
      const longUrl2 = 'https://different.com/' + 'b'.repeat(200);
      
      displayURL(longUrl1);
      toggleURLDisplay(); // 展開
      
      // URL変更
      displayURL(longUrl2);
      
      const urlElement = document.getElementById('currentUrl');
      // 新しいURLは省略状態で表示される
      expect(urlElement.getAttribute('aria-expanded')).toBe('false');
      expect(urlElement.getAttribute('aria-label')).toBe('URLを展開');
    });

    it('長いURLから短いURLに変更すると、アクセシビリティ属性が削除される', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(200);
      const shortUrl = 'https://example.com/';
      
      displayURL(longUrl);
      
      // 短いURLに変更
      displayURL(shortUrl);
      
      const urlElement = document.getElementById('currentUrl');
      expect(urlElement.hasAttribute('tabindex')).toBe(false);
      expect(urlElement.hasAttribute('role')).toBe(false);
      expect(urlElement.hasAttribute('aria-expanded')).toBe(false);
      expect(urlElement.hasAttribute('aria-label')).toBe(false);
    });
  });

  describe('エラーケースのアクセシビリティ', () => {
    it('URLが空の場合、アクセシビリティ属性が削除される', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(200);
      displayURL(longUrl);
      
      // 空のURLに変更
      displayURL('');
      
      const urlElement = document.getElementById('currentUrl');
      expect(urlElement.hasAttribute('tabindex')).toBe(false);
      expect(urlElement.hasAttribute('role')).toBe(false);
      expect(urlElement.hasAttribute('aria-expanded')).toBe(false);
      expect(urlElement.hasAttribute('aria-label')).toBe(false);
    });

    it('URLがnullの場合、アクセシビリティ属性が削除される', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(200);
      displayURL(longUrl);
      
      // nullのURLに変更
      displayURL(null);
      
      const urlElement = document.getElementById('currentUrl');
      expect(urlElement.hasAttribute('tabindex')).toBe(false);
      expect(urlElement.hasAttribute('role')).toBe(false);
      expect(urlElement.hasAttribute('aria-expanded')).toBe(false);
      expect(urlElement.hasAttribute('aria-label')).toBe(false);
    });
  });
});
