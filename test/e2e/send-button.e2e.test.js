/**
 * 送信ボタンとの互換性 E2Eテスト
 * 
 * 要件5.1: 送信ボタンのクリックイベントが妨げられないこと
 * 要件5.2: 既存のアプリケーションロジックとの共存
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 拡張機能のパス
const extensionPath = path.join(__dirname, '..', '..');

test.describe('送信ボタンとの互換性', () => {
  let context;
  let page;

  test.beforeEach(async ({ browser }) => {
    // Chrome拡張機能を読み込んだコンテキストを作成
    context = await browser.newContext({
      // 拡張機能を読み込む（Chromiumのみ）
      // Note: Playwrightでは拡張機能のテストはChromiumでのみサポート
    });

    page = await context.newPage();

    // content.jsを手動で注入（テスト環境では拡張機能が自動注入されないため）
    await page.addInitScript({ path: path.join(extensionPath, 'content.js') });

    // テストページを開く
    const testPagePath = path.join(__dirname, 'test-page.html');
    await page.goto(`file://${testPagePath}`);

    // content.jsが初期化されるまで待機
    await page.waitForTimeout(500);
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('textareaの送信ボタンクリックは妨げられない', async () => {
    // textareaに入力
    await page.fill('#textarea-field', 'テストメッセージ');

    // 送信ボタンをクリック
    await page.click('#textarea-submit');

    // 送信イベントが発火したことを確認
    const output = await page.textContent('#textarea-output');
    expect(output).toContain('送信ボタンクリック');
  });

  test('inputの送信ボタンクリックは妨げられない', async () => {
    // inputに入力
    await page.fill('#input-field', 'テストメッセージ');

    // 送信ボタンをクリック
    await page.click('#input-submit');

    // 送信イベントが発火したことを確認
    const output = await page.textContent('#input-output');
    expect(output).toContain('送信ボタンクリック');
  });

  test('contenteditableの送信ボタンクリックは妨げられない', async () => {
    // contenteditableに入力
    await page.click('#editable-field');
    await page.keyboard.type('テストメッセージ');

    // 送信ボタンをクリック
    await page.click('#editable-submit');

    // 送信イベントが発火したことを確認
    const output = await page.textContent('#editable-output');
    expect(output).toContain('送信ボタンクリック');
  });

  test('Enterキー後でも送信ボタンは機能する', async () => {
    // textareaに入力
    await page.fill('#textarea-field', 'テストメッセージ');

    // Enterキーを押す（修飾キーなし）
    await page.press('#textarea-field', 'Enter');

    // 送信ボタンをクリック
    await page.click('#textarea-submit');

    // 送信イベントが発火したことを確認
    const output = await page.textContent('#textarea-output');
    expect(output).toContain('送信ボタンクリック');
  });

  test('修飾キー+Enterでアプリケーションのリスナーが呼ばれる', async () => {
    // textareaに入力
    await page.fill('#textarea-field', 'テストメッセージ');

    // Ctrl+Enterキーを押す
    await page.press('#textarea-field', 'Control+Enter');

    // アプリケーションのEnterキーリスナーが呼ばれたことを確認
    const output = await page.textContent('#textarea-output');
    expect(output).toContain('Enterキー押下');
    expect(output).toContain('修飾キー: あり');
  });

  test('修飾キーなしのEnterでアプリケーションのリスナーは呼ばれない', async () => {
    // textareaに入力
    await page.fill('#textarea-field', 'テストメッセージ');

    // 初期状態を確認
    let output = await page.textContent('#textarea-output');
    expect(output).toBe('イベントなし');

    // Enterキーを押す（修飾キーなし）
    await page.press('#textarea-field', 'Enter');

    // 少し待機
    await page.waitForTimeout(100);

    // アプリケーションのEnterキーリスナーが呼ばれていないことを確認
    output = await page.textContent('#textarea-output');
    expect(output).toBe('イベントなし');
  });
});
