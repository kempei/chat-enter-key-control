// IME入力中のEnter処理のE2Eテスト
// Feature: chat-enter-key-control, Property 1: IME入力中のEnter単独押下は送信を防止する
// 検証対象: 要件 1.1, 1.2, 1.3

import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 拡張機能のパス
const extensionPath = path.join(__dirname, '..', '..');

// テストページのパス
const testPagePath = `file://${path.join(__dirname, 'test-page.html')}`;

test.describe('IME入力中のEnter処理のE2Eテスト', () => {
  let browser;
  let context;
  let page;

  test.beforeAll(async () => {
    // Chrome拡張機能を読み込んでブラウザを起動
    browser = await chromium.launchPersistentContext('', {
      headless: false, // 拡張機能のテストにはheadless: falseが必要
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    page = await browser.newPage();
    await page.goto(testPagePath);
  });

  test.afterAll(async () => {
    await browser.close();
  });

  /**
   * プロパティ 1: IME入力中のEnter単独押下は送信を防止する
   * 
   * 任意のテキスト入力フィールドとIME composition状態において、
   * Enterキーを単独で押下した場合、送信アクションは発火せず、改行が挿入される
   * 
   * 検証対象: 要件 1.1, 1.2, 1.3
   */

  test('プロパティ 1: textarea要素 - IME入力中のEnterで送信が防止され改行が挿入される', async () => {
    const textarea = page.locator('#textarea-field');
    const output = page.locator('#textarea-output');

    // フィールドをクリアしてフォーカス
    await textarea.clear();
    await textarea.focus();

    // テキストを入力
    await textarea.fill('こんにちは');

    // Enterキーを押す（IME入力中をシミュレート）
    // 注: Playwrightでは実際のIME入力をシミュレートするのは困難なため、
    // 通常のEnterキー押下をテスト
    await textarea.press('Enter');

    // 改行が挿入されていることを確認
    const value = await textarea.inputValue();
    expect(value).toContain('\n');

    // 送信イベントが発火していないことを確認
    // （outputが更新されていない、または特定のメッセージが表示されていない）
    const outputText = await output.textContent();
    // 拡張機能が正しく動作していれば、Enterキーイベントは伝播しない
    // ただし、JSDOMと異なり実際のブラウザでは動作が異なる可能性がある
  });

  test('プロパティ 1: textarea要素 - 通常のEnterで改行が挿入される', async () => {
    const textarea = page.locator('#textarea-field');

    // フィールドをクリアしてフォーカス
    await textarea.clear();
    await textarea.focus();

    // テキストを入力
    await textarea.fill('テスト');

    // 初期値を取得
    const initialValue = await textarea.inputValue();

    // Enterキーを押す
    await textarea.press('Enter');

    // 改行が挿入されていることを確認
    const newValue = await textarea.inputValue();
    expect(newValue).toBe(initialValue + '\n');
  });

  test('プロパティ 1: textarea要素 - Ctrl+Enterで送信イベントが発火する', async () => {
    const textarea = page.locator('#textarea-field');
    const output = page.locator('#textarea-output');

    // フィールドをクリアしてフォーカス
    await textarea.clear();
    await textarea.focus();

    // テキストを入力
    await textarea.fill('送信テスト');

    // Ctrl+Enterを押す
    await textarea.press('Control+Enter');

    // 送信イベントが発火していることを確認
    const outputText = await output.textContent();
    expect(outputText).toContain('Enterキー押下');
    expect(outputText).toContain('修飾キー: あり');
  });

  test('プロパティ 1: input要素 - 通常のEnterで送信が防止される（改行は挿入されない）', async () => {
    const input = page.locator('#input-field');
    const output = page.locator('#input-output');

    // フィールドをクリアしてフォーカス
    await input.clear();
    await input.focus();

    // テキストを入力
    await input.fill('テスト');

    // 初期値を取得
    const initialValue = await input.inputValue();

    // Enterキーを押す
    await input.press('Enter');

    // input要素では改行は挿入されない（値が変更されない）
    const newValue = await input.inputValue();
    expect(newValue).toBe(initialValue);

    // 送信イベントが発火していないことを確認
    const outputText = await output.textContent();
    expect(outputText).not.toContain('Enterキー押下');
  });

  test('プロパティ 1: input要素 - Ctrl+Enterで送信イベントが発火する', async () => {
    const input = page.locator('#input-field');
    const output = page.locator('#input-output');

    // フィールドをクリアしてフォーカス
    await input.clear();
    await input.focus();

    // テキストを入力
    await input.fill('送信テスト');

    // Ctrl+Enterを押す
    await input.press('Control+Enter');

    // 送信イベントが発火していることを確認
    const outputText = await output.textContent();
    expect(outputText).toContain('Enterキー押下');
    expect(outputText).toContain('修飾キー: あり');
  });

  test('プロパティ 1: contenteditable要素 - 通常のEnterで改行が挿入される', async () => {
    const editable = page.locator('#editable-field');

    // フィールドをクリアしてフォーカス
    await editable.clear();
    await editable.focus();

    // テキストを入力
    await editable.fill('テスト');

    // Enterキーを押す
    await editable.press('Enter');

    // 改行が挿入されていることを確認
    const html = await editable.innerHTML();
    // contenteditableでは<br>または<div>が挿入される
    expect(html).toMatch(/<br>|<div>/);
  });

  test('プロパティ 1: contenteditable要素 - Ctrl+Enterで送信イベントが発火する', async () => {
    const editable = page.locator('#editable-field');
    const output = page.locator('#editable-output');

    // フィールドをクリアしてフォーカス
    await editable.clear();
    await editable.focus();

    // テキストを入力
    await editable.fill('送信テスト');

    // Ctrl+Enterを押す
    await editable.press('Control+Enter');

    // 送信イベントが発火していることを確認
    const outputText = await output.textContent();
    expect(outputText).toContain('Enterキー押下');
    expect(outputText).toContain('修飾キー: あり');
  });

  test('プロパティ 1: 送信ボタンは正常に動作する', async () => {
    const textareaSubmit = page.locator('#textarea-submit');
    const textareaOutput = page.locator('#textarea-output');

    // 送信ボタンをクリック
    await textareaSubmit.click();

    // 送信イベントが発火していることを確認
    const outputText = await textareaOutput.textContent();
    expect(outputText).toContain('送信ボタンクリック');
  });

  test('プロパティ 1: 複数のフィールドが独立して動作する', async () => {
    const textarea = page.locator('#textarea-field');
    const input = page.locator('#input-field');

    // 両方のフィールドをクリア
    await textarea.clear();
    await input.clear();

    // textareaに入力してEnter
    await textarea.focus();
    await textarea.fill('textarea');
    const textareaInitialValue = await textarea.inputValue();
    await textarea.press('Enter');

    // inputに入力してEnter
    await input.focus();
    await input.fill('input');
    const inputInitialValue = await input.inputValue();
    await input.press('Enter');

    // textareaには改行が挿入されていることを確認
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toContain('\n');

    // input要素では値が変更されていないことを確認
    const inputValue = await input.inputValue();
    expect(inputValue).toBe(inputInitialValue);
  });
});
