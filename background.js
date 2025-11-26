// Background Script for Chat Enter Key Control

console.log('Chat Enter Key Control: Background script loaded');

// ========================================
// ストレージ管理モジュール
// 要件: 3.2, 6.1, 6.2, 6.3
// ========================================

/**
 * URLパターンのデータ構造
 * @typedef {Object} URLPattern
 * @property {string} id - ユニークID（UUID）
 * @property {string} pattern - URLマッチングパターン
 * @property {boolean} enabled - 有効/無効フラグ
 * @property {number} createdAt - 作成日時（Unix timestamp）
 */

/**
 * 送信キーオプション
 * @typedef {'ctrl' | 'alt' | 'cmd' | 'opt' | 'shift' | 'none'} SendKeyOption
 */

/**
 * 送信キー設定
 * @typedef {Object} SendKeyConfig
 * @property {SendKeyOption} modifier - 送信キーの修飾キー（'none'はEnterのみ）
 */

/**
 * ストレージデータの構造
 * @typedef {Object} StorageData
 * @property {URLPattern[]} patterns - URLパターンの配列
 * @property {SendKeyConfig} [sendKeyConfig] - 送信キー設定（未設定の場合はデフォルト）
 */

/**
 * 簡易的なUUID生成関数
 * @returns {string} UUID文字列
 */
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * すべてのURLパターンを取得
 * @returns {Promise<URLPattern[]>} URLパターンの配列
 */
async function getPatterns() {
  try {
    const result = await chrome.storage.sync.get('patterns');
    return result.patterns || [];
  } catch (error) {
    console.error('パターンの取得に失敗しました:', error);
    // ストレージエラーの詳細をログに記録
    if (error.message) {
      console.error('エラー詳細:', error.message);
    }
    // エラーを再スローして呼び出し元で処理できるようにする
    throw new Error(`ストレージからのパターン取得に失敗しました: ${error.message || '不明なエラー'}`);
  }
}

/**
 * URLパターンを保存
 * @param {URLPattern[]} patterns - 保存するURLパターンの配列
 * @returns {Promise<void>}
 */
async function savePatterns(patterns) {
  try {
    // パターンの配列が有効かチェック
    if (!Array.isArray(patterns)) {
      throw new Error('パターンは配列である必要があります');
    }
    
    await chrome.storage.sync.set({ patterns });
  } catch (error) {
    console.error('パターンの保存に失敗しました:', error);
    
    // ストレージ容量超過エラーのチェック
    if (error.message && error.message.includes('QUOTA_BYTES')) {
      throw new Error('ストレージ容量が不足しています。不要なパターンを削除してください。');
    }
    
    throw new Error(`ストレージへのパターン保存に失敗しました: ${error.message || '不明なエラー'}`);
  }
}

/**
 * URLパターンを検証
 * @param {string} pattern - 検証するURLパターン
 * @returns {Object} { valid: boolean, error: string }
 */
function validatePattern(pattern) {
  // 空文字列チェック
  if (!pattern || typeof pattern !== 'string') {
    return { valid: false, error: 'パターンは空でない文字列である必要があります' };
  }
  
  // 空白のみのチェック
  if (pattern.trim().length === 0) {
    return { valid: false, error: 'パターンは空白のみで構成できません' };
  }
  
  // <all_urls>は特別なパターンとして許可
  if (pattern === '<all_urls>') {
    return { valid: true };
  }
  
  // 基本的なパターン形式チェック（scheme://host/path）
  if (!pattern.includes('://')) {
    return { valid: false, error: 'パターンには "://" が含まれている必要があります（例: *://example.com/*）' };
  }
  
  // スキーム部分のチェック
  const schemeMatch = pattern.match(/^([^:]+):\/\//);
  if (!schemeMatch) {
    return { valid: false, error: '無効なスキーム形式です' };
  }
  
  const scheme = schemeMatch[1];
  const validSchemes = ['*', 'http', 'https', 'file', 'ftp'];
  if (!validSchemes.includes(scheme)) {
    return { valid: false, error: `無効なスキームです。使用可能: ${validSchemes.join(', ')}` };
  }
  
  // ホスト部分のチェック
  const hostMatch = pattern.match(/:\/\/([^\/]+)/);
  if (!hostMatch || !hostMatch[1]) {
    return { valid: false, error: 'ホスト部分が必要です' };
  }
  
  // パス部分のチェック
  if (!pattern.includes('/', pattern.indexOf('://') + 3)) {
    return { valid: false, error: 'パス部分が必要です（例: /*）' };
  }
  
  // 正規表現への変換を試みる
  try {
    patternToRegex(pattern);
  } catch (error) {
    return { valid: false, error: `パターンを正規表現に変換できません: ${error.message}` };
  }
  
  return { valid: true };
}

/**
 * 新しいURLパターンを追加
 * @param {string} pattern - 追加するURLパターン
 * @returns {Promise<URLPattern>} 追加されたURLパターン
 */
async function addPattern(pattern) {
  try {
    // パターンの検証
    const validation = validatePattern(pattern);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    const patterns = await getPatterns();
    
    // 重複チェック
    const isDuplicate = patterns.some(p => p.pattern === pattern);
    if (isDuplicate) {
      throw new Error('このパターンは既に登録されています');
    }
    
    const newPattern = {
      id: generateId(),
      pattern: pattern,
      enabled: true,
      createdAt: Date.now()
    };
    patterns.push(newPattern);
    await savePatterns(patterns);
    return newPattern;
  } catch (error) {
    console.error('パターンの追加に失敗しました:', error);
    throw error;
  }
}

/**
 * URLパターンを削除
 * @param {string} id - 削除するパターンのID
 * @returns {Promise<void>}
 */
async function removePattern(id) {
  try {
    // IDの検証
    if (!id || typeof id !== 'string') {
      throw new Error('無効なパターンIDです');
    }
    
    const patterns = await getPatterns();
    const initialLength = patterns.length;
    const filteredPatterns = patterns.filter(p => p.id !== id);
    
    // パターンが見つからなかった場合
    if (filteredPatterns.length === initialLength) {
      console.warn(`パターンID ${id} が見つかりませんでした`);
      // エラーにはせず、警告のみ（既に削除されている可能性がある）
    }
    
    await savePatterns(filteredPatterns);
  } catch (error) {
    console.error('パターンの削除に失敗しました:', error);
    throw error;
  }
}

/**
 * URLパターンの有効/無効を切り替え
 * @param {string} id - トグルするパターンのID
 * @returns {Promise<void>}
 */
async function togglePattern(id) {
  try {
    // IDの検証
    if (!id || typeof id !== 'string') {
      throw new Error('無効なパターンIDです');
    }
    
    const patterns = await getPatterns();
    const pattern = patterns.find(p => p.id === id);
    
    if (!pattern) {
      throw new Error(`パターンID ${id} が見つかりません`);
    }
    
    pattern.enabled = !pattern.enabled;
    await savePatterns(patterns);
  } catch (error) {
    console.error('パターンのトグルに失敗しました:', error);
    throw error;
  }
}

/**
 * デフォルトの送信キー設定を取得
 * @returns {SendKeyConfig} デフォルト設定（Cmd+Enter）
 */
function getDefaultSendKeyConfig() {
  return { modifier: 'cmd' };
}

/**
 * 送信キー設定を取得
 * @returns {Promise<SendKeyConfig>} 送信キー設定
 */
async function getSendKeyConfig() {
  try {
    const result = await chrome.storage.sync.get('sendKeyConfig');
    // 未設定の場合はデフォルト値を返す
    return result.sendKeyConfig || getDefaultSendKeyConfig();
  } catch (error) {
    console.error('送信キー設定の取得に失敗しました:', error);
    // エラー時もデフォルト値を返す
    return getDefaultSendKeyConfig();
  }
}

/**
 * 送信キー設定を保存
 * @param {SendKeyConfig} config - 保存する送信キー設定
 * @returns {Promise<void>}
 */
async function saveSendKeyConfig(config) {
  try {
    // 設定の検証
    if (!config || typeof config !== 'object') {
      throw new Error('送信キー設定は有効なオブジェクトである必要があります');
    }
    
    const validModifiers = ['ctrl', 'alt', 'cmd', 'opt', 'shift', 'none'];
    if (!validModifiers.includes(config.modifier)) {
      throw new Error(`無効な修飾キーです。使用可能: ${validModifiers.join(', ')}`);
    }
    
    await chrome.storage.sync.set({ sendKeyConfig: config });
  } catch (error) {
    console.error('送信キー設定の保存に失敗しました:', error);
    throw new Error(`送信キー設定の保存に失敗しました: ${error.message || '不明なエラー'}`);
  }
}

/**
 * すべてのタブのContent Scriptに送信キー設定を配信
 * @param {SendKeyConfig} config - 配信する送信キー設定
 * @returns {Promise<void>}
 */
async function broadcastSendKeyConfigToAllTabs(config) {
  try {
    // すべてのタブを取得
    const tabs = await chrome.tabs.query({});
    
    // 各タブのContent Scriptにメッセージを送信
    for (const tab of tabs) {
      // タブIDとURLが有効な場合のみ送信
      if (tab.id && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'SEND_KEY_CONFIG_UPDATED',
            config: config
          });
        } catch (error) {
          // Content Scriptが注入されていないタブではエラーが発生するが、
          // これは正常な動作なので警告のみ出力
          console.warn(`タブ ${tab.id} への設定配信に失敗しました:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('送信キー設定の配信に失敗しました:', error);
    // エラーが発生しても設定の保存は成功しているので、エラーをスローしない
  }
}

/**
 * すべての設定をエクスポート
 * @returns {Promise<string>} JSON形式の設定データ
 */
async function exportSettings() {
  try {
    const patterns = await getPatterns();
    const sendKeyConfig = await getSendKeyConfig();
    return JSON.stringify({ patterns, sendKeyConfig }, null, 2);
  } catch (error) {
    console.error('設定のエクスポートに失敗しました:', error);
    throw error;
  }
}

/**
 * 設定をインポート
 * @param {string} jsonData - JSON形式の設定データ
 * @returns {Promise<void>}
 */
async function importSettings(jsonData) {
  try {
    // JSON文字列の検証
    if (!jsonData || typeof jsonData !== 'string') {
      throw new Error('無効なデータ形式です。JSON文字列が必要です。');
    }
    
    // JSONパース
    let data;
    try {
      data = JSON.parse(jsonData);
    } catch (parseError) {
      throw new Error(`JSONの解析に失敗しました: ${parseError.message}`);
    }
    
    // データ構造の検証
    if (!data || typeof data !== 'object') {
      throw new Error('無効な設定データ形式です。オブジェクトが必要です。');
    }
    
    if (!data.patterns || !Array.isArray(data.patterns)) {
      throw new Error('無効な設定データ形式です。patterns配列が必要です。');
    }
    
    // 各パターンの検証
    for (let i = 0; i < data.patterns.length; i++) {
      const pattern = data.patterns[i];
      
      if (!pattern || typeof pattern !== 'object') {
        throw new Error(`パターン ${i + 1} が無効です: オブジェクトが必要です`);
      }
      
      if (!pattern.id || typeof pattern.id !== 'string') {
        throw new Error(`パターン ${i + 1} が無効です: 有効なIDが必要です`);
      }
      
      if (!pattern.pattern || typeof pattern.pattern !== 'string') {
        throw new Error(`パターン ${i + 1} が無効です: 有効なパターン文字列が必要です`);
      }
      
      if (typeof pattern.enabled !== 'boolean') {
        throw new Error(`パターン ${i + 1} が無効です: enabledはboolean型が必要です`);
      }
      
      if (typeof pattern.createdAt !== 'number') {
        throw new Error(`パターン ${i + 1} が無効です: createdAtは数値が必要です`);
      }
      
      // パターンの形式検証
      const validation = validatePattern(pattern.pattern);
      if (!validation.valid) {
        throw new Error(`パターン ${i + 1} が無効です: ${validation.error}`);
      }
    }
    
    // 送信キー設定の検証（オプショナル）
    if (data.sendKeyConfig) {
      if (typeof data.sendKeyConfig !== 'object') {
        throw new Error('無効な送信キー設定形式です。オブジェクトが必要です。');
      }
      
      const validModifiers = ['ctrl', 'alt', 'cmd', 'opt', 'shift', 'none'];
      if (!validModifiers.includes(data.sendKeyConfig.modifier)) {
        throw new Error(`無効な修飾キーです。使用可能: ${validModifiers.join(', ')}`);
      }
    }
    
    await savePatterns(data.patterns);
    
    // 送信キー設定が含まれている場合は保存
    if (data.sendKeyConfig) {
      await saveSendKeyConfig(data.sendKeyConfig);
    }
  } catch (error) {
    console.error('設定のインポートに失敗しました:', error);
    throw error;
  }
}

// ========================================
// URLパターンマッチング機能
// 要件: 3.5
// ========================================

/**
 * Chrome match patternを正規表現に変換
 * @param {string} pattern - Chrome match pattern（例: "*://example.com/*"）
 * @returns {RegExp} 変換された正規表現
 */
function patternToRegex(pattern) {
  // <all_urls>は特別なパターンで、すべてのURLにマッチ
  if (pattern === '<all_urls>') {
    return /^(https?|file|ftp):\/\/.*/;
  }

  // パターンをエスケープして正規表現に変換
  let regexStr = pattern
    // 特殊文字をエスケープ（*と?は後で処理）
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    // *を.*に変換（任意の文字列）
    .replace(/\*/g, '.*')
    // ?を.に変換（任意の1文字）
    .replace(/\?/g, '.');

  // 先頭と末尾にアンカーを追加
  return new RegExp(`^${regexStr}$`);
}

/**
 * URLが指定されたパターンにマッチするか判定
 * @param {string} url - チェックするURL
 * @param {string} pattern - Chrome match pattern
 * @returns {boolean} マッチする場合true
 */
function matchesPattern(url, pattern) {
  try {
    const regex = patternToRegex(pattern);
    return regex.test(url);
  } catch (error) {
    console.error('パターンマッチングエラー:', error);
    return false;
  }
}

/**
 * URLが有効なパターンのいずれかにマッチするか判定
 * @param {string} url - チェックするURL
 * @param {URLPattern[]} patterns - URLパターンの配列
 * @returns {boolean} 有効なパターンにマッチする場合true
 */
function matchesAnyActivePattern(url, patterns) {
  return patterns.some(p => p.enabled && matchesPattern(url, p.pattern));
}

// ========================================
// メッセージハンドラ
// 要件: 3.2, 3.3, 3.4
// ========================================

/**
 * メッセージハンドラ
 * ポップアップやコンテンツスクリプトからのメッセージを処理
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 非同期処理を行うため、trueを返す
  handleMessage(message, sender).then(sendResponse);
  return true;
});

/**
 * メッセージを処理する非同期関数
 * @param {Object} message - 受信したメッセージ
 * @param {Object} sender - メッセージの送信者情報
 * @returns {Promise<Object>} レスポンスオブジェクト
 */
async function handleMessage(message, sender) {
  try {
    switch (message.type) {
      case 'GET_PATTERNS':
        // すべてのパターンを取得
        const patterns = await getPatterns();
        return { success: true, patterns };

      case 'ADD_PATTERN':
        // 新しいパターンを追加
        if (!message.pattern) {
          return { success: false, error: 'パターンが指定されていません' };
        }
        const newPattern = await addPattern(message.pattern);
        // アイコン状態を更新
        await updateAllTabIcons();
        return { success: true, pattern: newPattern };

      case 'REMOVE_PATTERN':
        // パターンを削除
        if (!message.id) {
          return { success: false, error: 'IDが指定されていません' };
        }
        await removePattern(message.id);
        // アイコン状態を更新
        await updateAllTabIcons();
        return { success: true };

      case 'TOGGLE_PATTERN':
        // パターンの有効/無効を切り替え
        if (!message.id) {
          return { success: false, error: 'IDが指定されていません' };
        }
        await togglePattern(message.id);
        // アイコン状態を更新
        await updateAllTabIcons();
        return { success: true };

      case 'CHECK_CURRENT_URL':
        // 現在のURLがパターンにマッチするか確認
        if (!message.url) {
          return { success: false, error: 'URLが指定されていません' };
        }
        const allPatterns = await getPatterns();
        const isActive = matchesAnyActivePattern(message.url, allPatterns);
        return { success: true, isActive };

      case 'EXPORT_SETTINGS':
        // 設定をエクスポート
        const jsonData = await exportSettings();
        return { success: true, data: jsonData };

      case 'IMPORT_SETTINGS':
        // 設定をインポート
        if (!message.data) {
          return { success: false, error: 'データが指定されていません' };
        }
        await importSettings(message.data);
        // アイコン状態を更新
        await updateAllTabIcons();
        return { success: true };

      case 'GET_SEND_KEY_CONFIG':
        // 送信キー設定を取得
        const sendKeyConfig = await getSendKeyConfig();
        return { success: true, config: sendKeyConfig };

      case 'SET_SEND_KEY_CONFIG':
        // 送信キー設定を保存
        if (!message.config) {
          return { success: false, error: '設定が指定されていません' };
        }
        await saveSendKeyConfig(message.config);
        // すべてのContent Scriptに設定変更を通知
        await broadcastSendKeyConfigToAllTabs(message.config);
        return { success: true };

      default:
        return { success: false, error: '不明なメッセージタイプです' };
    }
  } catch (error) {
    console.error('メッセージ処理エラー:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// アイコン状態管理
// 要件: 8.1, 8.2
// ========================================

/**
 * 指定されたタブのアイコン状態を更新
 * @param {number} tabId - タブID
 * @param {string} url - タブのURL
 * @returns {Promise<void>}
 */
async function updateTabIcon(tabId, url) {
  try {
    const patterns = await getPatterns();
    const isActive = matchesAnyActivePattern(url, patterns);

    // アイコンのパスを設定（アクティブ/非アクティブ）
    const iconPath = isActive ? {
      16: 'icons/icon16.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png'
    } : {
      16: 'icons/icon16.png',  // 非アクティブ用のアイコンも同じものを使用
      48: 'icons/icon48.png',  // 実際には別のグレーアイコンなどを用意することも可能
      128: 'icons/icon128.png'
    };

    await chrome.action.setIcon({ tabId, path: iconPath });

    // タイトルを設定（ツールチップ）
    const title = isActive 
      ? 'Chat Enter Key Control: 有効' 
      : 'Chat Enter Key Control: 無効';
    await chrome.action.setTitle({ tabId, title });

  } catch (error) {
    console.error('アイコン状態の更新に失敗しました:', error);
  }
}

/**
 * すべてのタブのアイコン状態を更新
 * @returns {Promise<void>}
 */
async function updateAllTabIcons() {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url) {
        await updateTabIcon(tab.id, tab.url);
      }
    }
  } catch (error) {
    console.error('すべてのタブのアイコン更新に失敗しました:', error);
  }
}

/**
 * アクティブタブのURL確認とアイコン更新
 * @returns {Promise<Object>} タブ情報とマッチング状態
 */
async function checkActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      return { success: false, error: 'アクティブなタブが見つかりません' };
    }

    const patterns = await getPatterns();
    const isActive = matchesAnyActivePattern(tab.url, patterns);

    // アイコンを更新
    await updateTabIcon(tab.id, tab.url);

    return {
      success: true,
      url: tab.url,
      isActive,
      patterns: patterns.filter(p => p.enabled && matchesPattern(tab.url, p.pattern))
    };
  } catch (error) {
    console.error('アクティブタブの確認に失敗しました:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// イベントリスナー
// ========================================

// タブが更新されたときにアイコンを更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // URLが変更されたときのみ更新
  if (changeInfo.url && tab.url) {
    updateTabIcon(tabId, tab.url);
  }
});

// タブがアクティブになったときにアイコンを更新
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      await updateTabIcon(activeInfo.tabId, tab.url);
    }
  } catch (error) {
    console.error('タブアクティブ化時のアイコン更新に失敗しました:', error);
  }
});

// 拡張機能がインストールまたは更新されたときに初期化
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Chat Enter Key Control: 拡張機能がインストールされました');
  // すべてのタブのアイコンを更新
  await updateAllTabIcons();
});

// 起動時にすべてのタブのアイコンを更新
chrome.runtime.onStartup.addListener(async () => {
  console.log('Chat Enter Key Control: ブラウザが起動しました');
  await updateAllTabIcons();
});

// テスト用にエクスポート（Node.js環境でのみ）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateId,
    getPatterns,
    savePatterns,
    addPattern,
    removePattern,
    togglePattern,
    exportSettings,
    importSettings,
    patternToRegex,
    matchesPattern,
    matchesAnyActivePattern,
    handleMessage,
    updateTabIcon,
    updateAllTabIcons,
    checkActiveTab,
    getDefaultSendKeyConfig,
    getSendKeyConfig,
    saveSendKeyConfig,
    broadcastSendKeyConfigToAllTabs
  };
}
