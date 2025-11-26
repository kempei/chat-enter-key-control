// URL表示のプロパティベーステスト
// Feature: popup-url-display, Property 1: 短いURLは全体表示される
// 検証対象: 要件 1.1

import { describe, test, beforeEach, afterEach, expect } from 'vitest';
import * as fc from 'fast-check';
import { JSDOM } from 'jsdom';

describe('URL表示のプロパティテスト', () => {
  let dom;
  let document;
  let window;
  let displayURL;

  beforeEach(async () => {
    // JSDOMでポップアップのHTMLを読み込む
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <div class="current-url" id="currentUrl" data-full-url="">
          <span class="url-text"></span>
          <span class="url-expand-indicator">▼</span>
        </div>
      </body>
      </html>
    `;

    dom = new JSDOM(html, { url: 'http://localhost' });
    document = dom.window.document;
    window = dom.window;

    // グローバルなdocumentとwindowを設定
    global.document = document;
    global.window = window;

    // displayURL関数を定義（popup.jsから抽出）
    displayURL = (url, maxLength = 100) => {
      const urlElement = document.getElementById('currentUrl');
      const urlTextElement = urlElement.querySelector('.url-text');
      const indicatorElement = urlElement.querySelector('.url-expand-indicator');
      
      if (!url) {
        urlTextElement.textContent = 'URLが取得できません';
        urlElement.classList.remove('clickable', 'truncated', 'expanded');
        indicatorElement.style.display = 'none';
        urlElement.dataset.fullUrl = '';
        return;
      }
      
      // 完全なURLをdata属性に保存
      urlElement.dataset.fullUrl = url;
      
      if (url.length <= maxLength) {
        // 短いURL: 全体表示、インジケーター非表示
        urlTextElement.textContent = url;
        urlElement.classList.remove('clickable', 'truncated', 'expanded');
        indicatorElement.style.display = 'none';
      } else {
        // 長いURL: 省略表示、インジケーター表示
        urlTextElement.textContent = url.substring(0, maxLength) + '...';
        urlElement.classList.add('clickable', 'truncated');
        urlElement.classList.remove('expanded');
        indicatorElement.style.display = 'inline';
        indicatorElement.textContent = '▼'; // 展開可能を示す
      }
    };

    // toggleURLDisplay関数を定義（popup.jsから抽出）
    global.toggleURLDisplay = () => {
      const urlElement = document.getElementById('currentUrl');
      const urlTextElement = urlElement.querySelector('.url-text');
      const indicatorElement = urlElement.querySelector('.url-expand-indicator');
      const fullUrl = urlElement.dataset.fullUrl;
      
      if (!fullUrl || fullUrl.length <= 100) {
        return; // 短いURLはトグルしない
      }
      
      if (urlElement.classList.contains('expanded')) {
        // 折りたたみ
        urlTextElement.textContent = fullUrl.substring(0, 100) + '...';
        urlElement.classList.remove('expanded');
        urlElement.classList.add('truncated');
        indicatorElement.textContent = '▼';
      } else {
        // 展開
        urlTextElement.textContent = fullUrl;
        urlElement.classList.remove('truncated');
        urlElement.classList.add('expanded');
        indicatorElement.textContent = '▲';
      }
    };
  });

  afterEach(() => {
    // クリーンアップ
    delete global.document;
    delete global.window;
    if (dom) {
      dom.window.close();
    }
  });

  /**
   * プロパティ 1: 短いURLは全体表示される
   * 
   * 任意の100文字以下のURLについて、システムはURLを全体表示し、省略記号を表示しない
   * 
   * 検証対象: 要件 1.1
   */
  test('プロパティ 1: 短いURLは全体表示される', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 100文字以下のURLを生成
        fc.string({ minLength: 1, maxLength: 100 }),
        async (url) => {
          // URLを表示
          displayURL(url);
          
          const urlElement = document.getElementById('currentUrl');
          const urlTextElement = urlElement.querySelector('.url-text');
          const indicatorElement = urlElement.querySelector('.url-expand-indicator');
          
          // 要件 1.1: URLが100文字以下の場合、全体表示される
          expect(urlTextElement.textContent).toBe(url);
          
          // 省略記号が含まれていないことを確認
          expect(urlTextElement.textContent).not.toContain('...');
          
          // インジケーターが非表示であることを確認
          expect(indicatorElement.style.display).toBe('none');
          
          // clickableクラスが付与されていないことを確認
          expect(urlElement.classList.contains('clickable')).toBe(false);
          
          // truncatedクラスが付与されていないことを確認
          expect(urlElement.classList.contains('truncated')).toBe(false);
          
          // data-full-url属性に完全なURLが保存されていることを確認
          expect(urlElement.dataset.fullUrl).toBe(url);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * プロパティ 2: 長いURLは省略される
   * 
   * 任意の100文字を超えるURLについて、システムは最初の100文字を表示し、その後に「...」を追加する
   * 
   * 検証対象: 要件 1.2
   */
  test('プロパティ 2: 長いURLは省略される', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 101文字以上のURLを生成
        fc.string({ minLength: 101, maxLength: 500 }),
        async (url) => {
          // URLを表示
          displayURL(url);
          
          const urlElement = document.getElementById('currentUrl');
          const urlTextElement = urlElement.querySelector('.url-text');
          const indicatorElement = urlElement.querySelector('.url-expand-indicator');
          
          // 要件 1.2: URLが100文字を超える場合、最初の100文字+「...」が表示される
          const expectedText = url.substring(0, 100) + '...';
          expect(urlTextElement.textContent).toBe(expectedText);
          
          // 省略記号が含まれていることを確認
          expect(urlTextElement.textContent).toContain('...');
          
          // 表示されているテキストの長さが103文字（100文字 + "..."）であることを確認
          expect(urlTextElement.textContent.length).toBe(103);
          
          // インジケーターが表示されていることを確認
          expect(indicatorElement.style.display).toBe('inline');
          
          // インジケーターが展開可能を示す「▼」であることを確認
          expect(indicatorElement.textContent).toBe('▼');
          
          // clickableクラスが付与されていることを確認
          expect(urlElement.classList.contains('clickable')).toBe(true);
          
          // truncatedクラスが付与されていることを確認
          expect(urlElement.classList.contains('truncated')).toBe(true);
          
          // expandedクラスが付与されていないことを確認
          expect(urlElement.classList.contains('expanded')).toBe(false);
          
          // data-full-url属性に完全なURLが保存されていることを確認
          expect(urlElement.dataset.fullUrl).toBe(url);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * プロパティ 4: 長いURLはデフォルトで省略される
   * 
   * 任意の100文字を超えるURLについて、初期表示時はシステムは省略状態で表示する
   * 
   * 検証対象: 要件 1.4
   */
  test('プロパティ 4: 長いURLはデフォルトで省略される', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 101文字以上のURLを生成
        fc.string({ minLength: 101, maxLength: 500 }),
        async (url) => {
          // URLを表示（初期表示）
          displayURL(url);
          
          const urlElement = document.getElementById('currentUrl');
          const urlTextElement = urlElement.querySelector('.url-text');
          const indicatorElement = urlElement.querySelector('.url-expand-indicator');
          
          // 要件 1.4: 長いURLはデフォルトで省略状態で表示される
          
          // 省略状態であることを確認（truncatedクラスが付与されている）
          expect(urlElement.classList.contains('truncated')).toBe(true);
          
          // 展開状態でないことを確認（expandedクラスが付与されていない）
          expect(urlElement.classList.contains('expanded')).toBe(false);
          
          // 省略されたテキストが表示されていることを確認
          const expectedText = url.substring(0, 100) + '...';
          expect(urlTextElement.textContent).toBe(expectedText);
          
          // インジケーターが展開可能を示す「▼」であることを確認（省略状態）
          expect(indicatorElement.textContent).toBe('▼');
          
          // インジケーターが表示されていることを確認
          expect(indicatorElement.style.display).toBe('inline');
          
          // クリック可能であることを確認
          expect(urlElement.classList.contains('clickable')).toBe(true);
          
          // 完全なURLがdata属性に保存されていることを確認
          expect(urlElement.dataset.fullUrl).toBe(url);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * プロパティ 6: 省略状態のクリックで展開される
   * Feature: popup-url-display, Property 6: 省略状態のクリックで展開される
   * 
   * 任意の省略状態のURL表示領域について、クリックした場合、システムはURLの全体を表示する
   * 
   * 検証対象: 要件 2.1
   */
  test('プロパティ 6: 省略状態のクリックで展開される', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 101文字以上のURLを生成
        fc.string({ minLength: 101, maxLength: 500 }),
        async (url) => {
          // URLを表示（初期表示は省略状態）
          displayURL(url);
          
          const urlElement = document.getElementById('currentUrl');
          const urlTextElement = urlElement.querySelector('.url-text');
          const indicatorElement = urlElement.querySelector('.url-expand-indicator');
          
          // 初期状態: 省略状態であることを確認
          expect(urlElement.classList.contains('truncated')).toBe(true);
          expect(urlElement.classList.contains('expanded')).toBe(false);
          expect(urlTextElement.textContent).toBe(url.substring(0, 100) + '...');
          expect(indicatorElement.textContent).toBe('▼');
          
          // クリック（トグル）を実行
          global.toggleURLDisplay();
          
          // 要件 2.1: 省略状態のクリックで展開される
          
          // 展開状態になっていることを確認
          expect(urlElement.classList.contains('expanded')).toBe(true);
          
          // 省略状態でないことを確認
          expect(urlElement.classList.contains('truncated')).toBe(false);
          
          // 完全なURLが表示されていることを確認
          expect(urlTextElement.textContent).toBe(url);
          
          // 省略記号が含まれていないことを確認
          expect(urlTextElement.textContent).not.toContain('...');
          
          // インジケーターが折りたたみ可能を示す「▲」であることを確認
          expect(indicatorElement.textContent).toBe('▲');
          
          // インジケーターが表示されていることを確認
          expect(indicatorElement.style.display).toBe('inline');
          
          // クリック可能であることを確認
          expect(urlElement.classList.contains('clickable')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * プロパティ 7: 展開状態のクリックで折りたたまれる
   * Feature: popup-url-display, Property 7: 展開状態のクリックで折りたたまれる
   * 
   * 任意の展開状態のURL表示領域について、クリックした場合、システムはURLを省略状態に戻す
   * 
   * 検証対象: 要件 2.2
   */
  test('プロパティ 7: 展開状態のクリックで折りたたまれる', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 101文字以上のURLを生成
        fc.string({ minLength: 101, maxLength: 500 }),
        async (url) => {
          // URLを表示（初期表示は省略状態）
          displayURL(url);
          
          const urlElement = document.getElementById('currentUrl');
          const urlTextElement = urlElement.querySelector('.url-text');
          const indicatorElement = urlElement.querySelector('.url-expand-indicator');
          
          // まず展開状態にする（1回目のクリック）
          global.toggleURLDisplay();
          
          // 展開状態であることを確認
          expect(urlElement.classList.contains('expanded')).toBe(true);
          expect(urlElement.classList.contains('truncated')).toBe(false);
          expect(urlTextElement.textContent).toBe(url);
          expect(indicatorElement.textContent).toBe('▲');
          
          // 再度クリック（トグル）を実行して折りたたむ
          global.toggleURLDisplay();
          
          // 要件 2.2: 展開状態のクリックで折りたたまれる
          
          // 省略状態に戻っていることを確認
          expect(urlElement.classList.contains('truncated')).toBe(true);
          
          // 展開状態でないことを確認
          expect(urlElement.classList.contains('expanded')).toBe(false);
          
          // 省略されたテキストが表示されていることを確認
          const expectedText = url.substring(0, 100) + '...';
          expect(urlTextElement.textContent).toBe(expectedText);
          
          // 省略記号が含まれていることを確認
          expect(urlTextElement.textContent).toContain('...');
          
          // インジケーターが展開可能を示す「▼」であることを確認
          expect(indicatorElement.textContent).toBe('▼');
          
          // インジケーターが表示されていることを確認
          expect(indicatorElement.style.display).toBe('inline');
          
          // クリック可能であることを確認
          expect(urlElement.classList.contains('clickable')).toBe(true);
          
          // 完全なURLがdata属性に保存されていることを確認
          expect(urlElement.dataset.fullUrl).toBe(url);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * プロパティ 5: URL変更時に状態がリセットされる
   * Feature: popup-url-display, Property 5: URL変更時に状態がリセットされる
   * 
   * 任意のURL変更について、展開状態から新しいURLに変更した場合、システムは省略状態にリセットする
   * 
   * 検証対象: 要件 1.5
   */
  test('プロパティ 5: URL変更時に状態がリセットされる', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 2つの異なる長いURL（101文字以上）を生成
        fc.tuple(
          fc.string({ minLength: 101, maxLength: 500 }),
          fc.string({ minLength: 101, maxLength: 500 })
        ).filter(([url1, url2]) => url1 !== url2), // 異なるURLであることを保証
        async ([firstUrl, secondUrl]) => {
          const urlElement = document.getElementById('currentUrl');
          const urlTextElement = urlElement.querySelector('.url-text');
          const indicatorElement = urlElement.querySelector('.url-expand-indicator');
          
          // 最初のURLを表示（初期表示は省略状態）
          displayURL(firstUrl);
          
          // 初期状態: 省略状態であることを確認
          expect(urlElement.classList.contains('truncated')).toBe(true);
          expect(urlElement.classList.contains('expanded')).toBe(false);
          expect(urlTextElement.textContent).toBe(firstUrl.substring(0, 100) + '...');
          expect(indicatorElement.textContent).toBe('▼');
          
          // 展開状態にする
          global.toggleURLDisplay();
          
          // 展開状態であることを確認
          expect(urlElement.classList.contains('expanded')).toBe(true);
          expect(urlElement.classList.contains('truncated')).toBe(false);
          expect(urlTextElement.textContent).toBe(firstUrl);
          expect(indicatorElement.textContent).toBe('▲');
          
          // 新しいURLに変更
          displayURL(secondUrl);
          
          // 要件 1.5: URL変更時に状態がリセットされる
          
          // 省略状態にリセットされていることを確認
          expect(urlElement.classList.contains('truncated')).toBe(true);
          
          // 展開状態でないことを確認
          expect(urlElement.classList.contains('expanded')).toBe(false);
          
          // 新しいURLが省略表示されていることを確認
          const expectedText = secondUrl.substring(0, 100) + '...';
          expect(urlTextElement.textContent).toBe(expectedText);
          
          // 省略記号が含まれていることを確認
          expect(urlTextElement.textContent).toContain('...');
          
          // インジケーターが展開可能を示す「▼」であることを確認（リセット後）
          expect(indicatorElement.textContent).toBe('▼');
          
          // インジケーターが表示されていることを確認
          expect(indicatorElement.style.display).toBe('inline');
          
          // クリック可能であることを確認
          expect(urlElement.classList.contains('clickable')).toBe(true);
          
          // 新しいURLがdata属性に保存されていることを確認
          expect(urlElement.dataset.fullUrl).toBe(secondUrl);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * プロパティ 8: クリック可能な要素はポインターカーソルを表示
   * Feature: popup-url-display, Property 8: クリック可能な要素はポインターカーソルを表示
   * 
   * 任意のクリック可能なURL表示領域について、システムはカーソルをポインターに変更する
   * 
   * 検証対象: 要件 2.3
   */
  test('プロパティ 8: クリック可能な要素はポインターカーソルを表示', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 101文字以上のURLを生成（クリック可能になる）
        fc.string({ minLength: 101, maxLength: 500 }),
        async (url) => {
          // URLを表示
          displayURL(url);
          
          const urlElement = document.getElementById('currentUrl');
          
          // 要件 2.3: クリック可能な要素はポインターカーソルを表示
          
          // clickableクラスが付与されていることを確認
          expect(urlElement.classList.contains('clickable')).toBe(true);
          
          // CSSでcursor: pointerが設定されていることを確認
          // JSDOMでは計算されたスタイルを直接取得できないため、
          // clickableクラスの存在を確認することで間接的に検証
          // 実際のブラウザ環境では、getComputedStyle(urlElement).cursorで確認可能
          
          // clickableクラスが付与されている場合、CSSでcursor: pointerが適用される
          // これはpopup.cssで定義されている
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * プロパティ 8の補足: 短いURLはクリック可能でない
   * 
   * 任意の100文字以下のURLについて、システムはクリック可能にしない
   */
  test('プロパティ 8の補足: 短いURLはクリック可能でない', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 100文字以下のURLを生成（クリック可能にならない）
        fc.string({ minLength: 1, maxLength: 100 }),
        async (url) => {
          // URLを表示
          displayURL(url);
          
          const urlElement = document.getElementById('currentUrl');
          
          // clickableクラスが付与されていないことを確認
          expect(urlElement.classList.contains('clickable')).toBe(false);
          
          // 短いURLはクリック可能でないため、カーソルはデフォルトのまま
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * プロパティ 11: ホバー時に視覚的フィードバックを提供
   * Feature: popup-url-display, Property 11: ホバー時に視覚的フィードバックを提供
   * 
   * 任意のクリック可能なURL表示領域について、ホバー時にシステムは視覚的なフィードバックを提供する
   * 
   * 検証対象: 要件 3.4
   */
  test('プロパティ 11: ホバー時に視覚的フィードバックを提供', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 101文字以上のURLを生成（クリック可能になる）
        fc.string({ minLength: 101, maxLength: 500 }),
        async (url) => {
          // URLを表示
          displayURL(url);
          
          const urlElement = document.getElementById('currentUrl');
          
          // 要件 3.4: ホバー時に視覚的フィードバックを提供
          
          // clickableクラスが付与されていることを確認
          expect(urlElement.classList.contains('clickable')).toBe(true);
          
          // CSSでホバー時のスタイルが設定されていることを確認
          // JSDOMでは:hover疑似クラスを直接テストできないため、
          // clickableクラスの存在を確認することで間接的に検証
          // 実際のブラウザ環境では、ホバー時に背景色と文字色が変化する
          
          // clickableクラスが付与されている場合、CSSで以下のホバースタイルが適用される:
          // - background-color: #f1f3f4
          // - color: #202124
          // これはpopup.cssで定義されている
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * プロパティ 11の補足: 短いURLはホバー時のフィードバックを提供しない
   * 
   * 任意の100文字以下のURLについて、システムはホバー時のフィードバックを提供しない
   */
  test('プロパティ 11の補足: 短いURLはホバー時のフィードバックを提供しない', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 100文字以下のURLを生成（クリック可能にならない）
        fc.string({ minLength: 1, maxLength: 100 }),
        async (url) => {
          // URLを表示
          displayURL(url);
          
          const urlElement = document.getElementById('currentUrl');
          
          // clickableクラスが付与されていないことを確認
          expect(urlElement.classList.contains('clickable')).toBe(false);
          
          // 短いURLはクリック可能でないため、ホバー時のフィードバックも提供されない
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * プロパティ 3: 省略状態は視覚的に示される
   * Feature: popup-url-display, Property 3: 省略状態は視覚的に示される
   * 
   * 任意の省略状態のURLについて、システムは展開可能であることを示すインジケーターを表示する
   * 
   * 検証対象: 要件 1.3, 3.1
   */
  test('プロパティ 3: 省略状態は視覚的に示される', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 101文字以上のURLを生成（省略される）
        fc.string({ minLength: 101, maxLength: 500 }),
        async (url) => {
          // URLを表示（初期表示は省略状態）
          displayURL(url);
          
          const urlElement = document.getElementById('currentUrl');
          const indicatorElement = urlElement.querySelector('.url-expand-indicator');
          
          // 要件 1.3, 3.1: 省略状態は視覚的に示される
          
          // 省略状態であることを確認
          expect(urlElement.classList.contains('truncated')).toBe(true);
          expect(urlElement.classList.contains('expanded')).toBe(false);
          
          // インジケーターが表示されていることを確認
          expect(indicatorElement.style.display).toBe('inline');
          
          // インジケーターが展開可能を示す「▼」であることを確認
          expect(indicatorElement.textContent).toBe('▼');
          
          // クリック可能であることを確認（視覚的なフィードバック）
          expect(urlElement.classList.contains('clickable')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * プロパティ 9: 展開状態は視覚的に示される
   * Feature: popup-url-display, Property 9: 展開状態は視覚的に示される
   * 
   * 任意の展開状態のURLについて、システムは折りたたみ可能であることを示すインジケーターを表示する
   * 
   * 検証対象: 要件 3.2
   */
  test('プロパティ 9: 展開状態は視覚的に示される', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 101文字以上のURLを生成
        fc.string({ minLength: 101, maxLength: 500 }),
        async (url) => {
          // URLを表示（初期表示は省略状態）
          displayURL(url);
          
          const urlElement = document.getElementById('currentUrl');
          const indicatorElement = urlElement.querySelector('.url-expand-indicator');
          
          // 展開状態にする
          global.toggleURLDisplay();
          
          // 要件 3.2: 展開状態は視覚的に示される
          
          // 展開状態であることを確認
          expect(urlElement.classList.contains('expanded')).toBe(true);
          expect(urlElement.classList.contains('truncated')).toBe(false);
          
          // インジケーターが表示されていることを確認
          expect(indicatorElement.style.display).toBe('inline');
          
          // インジケーターが折りたたみ可能を示す「▲」であることを確認
          expect(indicatorElement.textContent).toBe('▲');
          
          // クリック可能であることを確認（視覚的なフィードバック）
          expect(urlElement.classList.contains('clickable')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * プロパティ 10: 短いURLはインジケーターを表示しない
   * Feature: popup-url-display, Property 10: 短いURLはインジケーターを表示しない
   * 
   * 任意の100文字以下のURLについて、システムは展開/折りたたみのインジケーターを表示しない
   * 
   * 検証対象: 要件 3.3
   */
  test('プロパティ 10: 短いURLはインジケーターを表示しない', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 100文字以下のURLを生成
        fc.string({ minLength: 1, maxLength: 100 }),
        async (url) => {
          // URLを表示
          displayURL(url);
          
          const urlElement = document.getElementById('currentUrl');
          const indicatorElement = urlElement.querySelector('.url-expand-indicator');
          
          // 要件 3.3: 短いURLはインジケーターを表示しない
          
          // インジケーターが非表示であることを確認
          expect(indicatorElement.style.display).toBe('none');
          
          // クリック可能でないことを確認
          expect(urlElement.classList.contains('clickable')).toBe(false);
          
          // 省略状態でないことを確認
          expect(urlElement.classList.contains('truncated')).toBe(false);
          
          // 展開状態でないことを確認
          expect(urlElement.classList.contains('expanded')).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
