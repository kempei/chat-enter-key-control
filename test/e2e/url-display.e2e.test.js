/**
 * URL表示機能 E2Eテスト
 * 
 * 実際のChrome拡張機能環境でのURL表示機能の統合テスト
 * 
 * テスト対象:
 * - 様々な長さのURLの表示
 * - 展開/折りたたみの動作
 * - トランジションアニメーション
 * - インジケーターの視認性
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 拡張機能のパス
const extensionPath = path.join(__dirname, '..', '..');

test.describe('URL表示機能の統合テスト', () => {
  let context;
  let page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();

    // ポップアップのHTMLを読み込む
    const popupPath = path.join(extensionPath, 'popup.html');
    await page.goto(`file://${popupPath}`);

    // ポップアップのスクリプトが初期化されるまで待機
    await page.waitForTimeout(500);
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('短いURL（100文字以下）は全体表示され、インジケーターが表示されない', async () => {
    // 短いURLをシミュレート
    const shortUrl = 'https://example.com/short';
    
    await page.evaluate((url) => {
      // displayURL関数を直接呼び出し
      if (typeof displayURL === 'function') {
        displayURL(url);
      }
    }, shortUrl);

    // URL表示領域を取得
    const urlElement = page.locator('#currentUrl');
    const urlText = page.locator('.url-text');
    const indicator = page.locator('.url-expand-indicator');

    // URLが全体表示されることを確認
    await expect(urlText).toHaveText(shortUrl);

    // インジケーターが表示されないことを確認
    await expect(indicator).not.toBeVisible();

    // clickableクラスが付与されていないことを確認
    await expect(urlElement).not.toHaveClass(/clickable/);
  });

  test('長いURL（100文字超）は省略表示され、インジケーターが表示される', async () => {
    // 長いURLをシミュレート（120文字）
    const longUrl = 'https://example.com/' + 'a'.repeat(101);
    
    await page.evaluate((url) => {
      if (typeof displayURL === 'function') {
        displayURL(url);
      }
    }, longUrl);

    // URL表示領域を取得
    const urlElement = page.locator('#currentUrl');
    const urlText = page.locator('.url-text');
    const indicator = page.locator('.url-expand-indicator');

    // 最初の100文字 + "..." が表示されることを確認
    const expectedText = longUrl.substring(0, 100) + '...';
    await expect(urlText).toHaveText(expectedText);

    // インジケーターが表示されることを確認
    await expect(indicator).toBeVisible();
    await expect(indicator).toHaveText('▼');

    // clickableとtruncatedクラスが付与されていることを確認
    await expect(urlElement).toHaveClass(/clickable/);
    await expect(urlElement).toHaveClass(/truncated/);
  });

  test('長いURLをクリックすると展開される', async () => {
    // 長いURLをシミュレート
    const longUrl = 'https://example.com/' + 'b'.repeat(101);
    
    await page.evaluate((url) => {
      if (typeof displayURL === 'function') {
        displayURL(url);
      }
    }, longUrl);

    const urlElement = page.locator('#currentUrl');
    const urlText = page.locator('.url-text');
    const indicator = page.locator('.url-expand-indicator');

    // 初期状態: 省略表示
    const expectedTruncated = longUrl.substring(0, 100) + '...';
    await expect(urlText).toHaveText(expectedTruncated);
    await expect(indicator).toHaveText('▼');

    // クリックして展開
    await urlElement.click();

    // 展開後: 完全なURLが表示される
    await expect(urlText).toHaveText(longUrl);
    await expect(indicator).toHaveText('▲');
    await expect(urlElement).toHaveClass(/expanded/);
    await expect(urlElement).not.toHaveClass(/truncated/);
  });

  test('展開されたURLをクリックすると折りたたまれる', async () => {
    // 長いURLをシミュレート
    const longUrl = 'https://example.com/' + 'c'.repeat(101);
    
    await page.evaluate((url) => {
      if (typeof displayURL === 'function') {
        displayURL(url);
      }
    }, longUrl);

    const urlElement = page.locator('#currentUrl');
    const urlText = page.locator('.url-text');
    const indicator = page.locator('.url-expand-indicator');

    // クリックして展開
    await urlElement.click();
    await expect(urlText).toHaveText(longUrl);

    // もう一度クリックして折りたたみ
    await urlElement.click();

    // 折りたたみ後: 省略表示に戻る
    const expectedTruncated = longUrl.substring(0, 100) + '...';
    await expect(urlText).toHaveText(expectedTruncated);
    await expect(indicator).toHaveText('▼');
    await expect(urlElement).toHaveClass(/truncated/);
    await expect(urlElement).not.toHaveClass(/expanded/);
  });

  test('境界値: ちょうど100文字のURLは全体表示される', async () => {
    // 100文字ちょうどのURL
    const url100 = 'https://example.com/' + 'f'.repeat(80); // 合計100文字
    
    await page.evaluate((url) => {
      if (typeof displayURL === 'function') {
        displayURL(url);
      }
    }, url100);

    const urlElement = page.locator('#currentUrl');
    const urlText = page.locator('.url-text');
    const indicator = page.locator('.url-expand-indicator');

    // URLが全体表示されることを確認
    await expect(urlText).toHaveText(url100);

    // インジケーターが表示されないことを確認
    await expect(indicator).not.toBeVisible();

    // clickableクラスが付与されていないことを確認
    await expect(urlElement).not.toHaveClass(/clickable/);
  });

  test('境界値: 101文字のURLは省略表示される', async () => {
    // 101文字のURL
    const url101 = 'https://example.com/' + 'g'.repeat(81); // 合計101文字
    
    await page.evaluate((url) => {
      if (typeof displayURL === 'function') {
        displayURL(url);
      }
    }, url101);

    const urlElement = page.locator('#currentUrl');
    const urlText = page.locator('.url-text');
    const indicator = page.locator('.url-expand-indicator');

    // 最初の100文字 + "..." が表示されることを確認
    const expectedText = url101.substring(0, 100) + '...';
    await expect(urlText).toHaveText(expectedText);

    // インジケーターが表示されることを確認
    await expect(indicator).toBeVisible();

    // clickableクラスが付与されていることを確認
    await expect(urlElement).toHaveClass(/clickable/);
  });

  test('非常に長いURL（500文字）でも正しく動作する', async () => {
    // 500文字のURL
    const url500 = 'https://example.com/' + 'h'.repeat(481);
    
    await page.evaluate((url) => {
      if (typeof displayURL === 'function') {
        displayURL(url);
      }
    }, url500);

    const urlElement = page.locator('#currentUrl');
    const urlText = page.locator('.url-text');

    // 省略表示
    const expectedTruncated = url500.substring(0, 100) + '...';
    await expect(urlText).toHaveText(expectedTruncated);

    // クリックして展開
    await urlElement.click();

    // 完全なURLが表示される
    await expect(urlText).toHaveText(url500);
  });

  test('ホバー時にポインターカーソルが表示される', async () => {
    // 長いURLをシミュレート
    const longUrl = 'https://example.com/' + 'd'.repeat(101);
    
    await page.evaluate((url) => {
      if (typeof displayURL === 'function') {
        displayURL(url);
      }
    }, longUrl);

    const urlElement = page.locator('#currentUrl');

    // カーソルスタイルを確認
    const cursor = await urlElement.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });

    expect(cursor).toBe('pointer');
  });

  test('トランジションアニメーションが設定されている', async () => {
    // 長いURLをシミュレート
    const longUrl = 'https://example.com/' + 'e'.repeat(101);
    
    await page.evaluate((url) => {
      if (typeof displayURL === 'function') {
        displayURL(url);
      }
    }, longUrl);

    const urlText = page.locator('.url-text');

    // トランジションプロパティを確認
    const transition = await urlText.evaluate((el) => {
      return window.getComputedStyle(el).transition;
    });

    // トランジションが設定されていることを確認（具体的な値は環境によって異なる可能性がある）
    expect(transition).toBeTruthy();
    expect(transition).not.toBe('all 0s ease 0s');
  });

  test('URL変更時に状態がリセットされる', async () => {
    // 最初の長いURL
    const url1 = 'https://example.com/first/' + 'x'.repeat(90);
    
    await page.evaluate((url) => {
      if (typeof displayURL === 'function') {
        displayURL(url);
      }
    }, url1);

    const urlElement = page.locator('#currentUrl');
    const urlText = page.locator('.url-text');
    const indicator = page.locator('.url-expand-indicator');

    // 展開
    await urlElement.click();
    await expect(urlText).toHaveText(url1);
    await expect(urlElement).toHaveClass(/expanded/);

    // 別のURLに変更
    const url2 = 'https://example.com/second/' + 'y'.repeat(89);
    
    await page.evaluate((url) => {
      if (typeof displayURL === 'function') {
        displayURL(url);
      }
    }, url2);

    // 状態がリセットされて省略表示になることを確認
    const expectedTruncated = url2.substring(0, 100) + '...';
    await expect(urlText).toHaveText(expectedTruncated);
    await expect(indicator).toHaveText('▼');
    await expect(urlElement).toHaveClass(/truncated/);
    await expect(urlElement).not.toHaveClass(/expanded/);
  });

  test('空のURLの場合はエラーメッセージが表示される', async () => {
    await page.evaluate(() => {
      if (typeof displayURL === 'function') {
        displayURL('');
      }
    });

    const urlText = page.locator('.url-text');
    const indicator = page.locator('.url-expand-indicator');

    // エラーメッセージが表示されることを確認
    await expect(urlText).toHaveText('URLが取得できません');

    // インジケーターが表示されないことを確認
    await expect(indicator).not.toBeVisible();
  });
});
