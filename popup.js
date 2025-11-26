// Popup script for Chat Enter Key Control
// 要件: 3.1, 3.2, 3.3, 3.4, 8.3, 8.4, 8.5

console.log('Chat Enter Key Control: Popup script loaded');

// ========================================
// DOM要素の取得
// ========================================

const elements = {
  // 現在のページ状態
  statusIndicator: document.getElementById('statusIndicator'),
  statusIcon: document.getElementById('statusIcon'),
  statusText: document.getElementById('statusText'),
  currentUrl: document.getElementById('currentUrl'),
  quickToggleSection: document.getElementById('quickToggleSection'),
  quickToggleBtn: document.getElementById('quickToggleBtn'),
  
  // パターン追加フォーム
  patternInput: document.getElementById('patternInput'),
  addBtn: document.getElementById('addBtn'),
  errorMessage: document.getElementById('errorMessage'),
  
  // パターンリスト
  patternsList: document.getElementById('patternsList'),
  emptyState: document.getElementById('emptyState'),
  
  // インポート/エクスポート
  exportBtn: document.getElementById('exportBtn'),
  importBtn: document.getElementById('importBtn'),
  importFileInput: document.getElementById('importFileInput')
};

// ========================================
// 状態管理
// ========================================

let currentTab = null;
let patterns = [];
let currentDomainPattern = null;
let sendKeyConfig = null;

/**
 * URL表示の状態を管理
 * @typedef {Object} URLDisplayState
 * @property {string} fullUrl - 完全なURL
 * @property {boolean} isTruncated - URLが省略されているか（100文字超）
 * @property {boolean} isExpanded - 現在展開されているか
 */
let urlDisplayState = {
  fullUrl: '',
  isTruncated: false,
  isExpanded: false
};

// ========================================
// ユーティリティ関数
// ========================================

/**
 * URLからドメインパターンを生成
 * @param {string} url - URL
 * @returns {string|null} ドメインパターン、失敗時はnull
 */
function getDomainPattern(url) {
  try {
    // URLの検証
    if (!url || typeof url !== 'string') {
      console.error('無効なURL:', url);
      return null;
    }
    
    const urlObj = new URL(url);
    
    // chrome-extension:// などの特殊なスキームはスキップ
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      console.warn('サポートされていないプロトコル:', urlObj.protocol);
      return null;
    }
    
    return `*://${urlObj.hostname}/*`;
  } catch (error) {
    console.error('URLの解析に失敗しました:', error);
    return null;
  }
}

/**
 * エラーメッセージを表示
 * @param {string} message - エラーメッセージ
 */
function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.style.display = 'block';
  setTimeout(() => {
    elements.errorMessage.style.display = 'none';
  }, 5000);
}

/**
 * 日付をフォーマット
 * @param {number} timestamp - Unix timestamp
 * @returns {string} フォーマットされた日付
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ========================================
// Background Scriptとの通信
// ========================================

/**
 * Background Scriptにメッセージを送信
 * @param {Object} message - 送信するメッセージ
 * @returns {Promise<Object>} レスポンス
 */
async function sendMessage(message) {
  return new Promise((resolve, reject) => {
    try {
      // メッセージの検証
      if (!message || typeof message !== 'object') {
        reject(new Error('無効なメッセージ形式です'));
        return;
      }
      
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('メッセージ送信エラー:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message || 'メッセージ送信に失敗しました'));
        } else if (!response) {
          reject(new Error('レスポンスが空です'));
        } else {
          resolve(response);
        }
      });
    } catch (error) {
      console.error('メッセージ送信中に例外が発生しました:', error);
      reject(error);
    }
  });
}

/**
 * すべてのパターンを取得
 * @returns {Promise<Array>} パターンの配列
 */
async function getPatterns() {
  const response = await sendMessage({ type: 'GET_PATTERNS' });
  if (response.success) {
    return response.patterns;
  } else {
    throw new Error(response.error || 'パターンの取得に失敗しました');
  }
}

/**
 * パターンを追加
 * @param {string} pattern - 追加するパターン
 * @returns {Promise<Object>} 追加されたパターン
 */
async function addPattern(pattern) {
  const response = await sendMessage({ type: 'ADD_PATTERN', pattern });
  if (response.success) {
    return response.pattern;
  } else {
    throw new Error(response.error || 'パターンの追加に失敗しました');
  }
}

/**
 * パターンを削除
 * @param {string} id - 削除するパターンのID
 * @returns {Promise<void>}
 */
async function removePattern(id) {
  const response = await sendMessage({ type: 'REMOVE_PATTERN', id });
  if (!response.success) {
    throw new Error(response.error || 'パターンの削除に失敗しました');
  }
}

/**
 * パターンをトグル
 * @param {string} id - トグルするパターンのID
 * @returns {Promise<void>}
 */
async function togglePattern(id) {
  const response = await sendMessage({ type: 'TOGGLE_PATTERN', id });
  if (!response.success) {
    throw new Error(response.error || 'パターンのトグルに失敗しました');
  }
}

/**
 * 設定をエクスポート
 * @returns {Promise<string>} JSON形式の設定データ
 */
async function exportSettings() {
  const response = await sendMessage({ type: 'EXPORT_SETTINGS' });
  if (response.success) {
    return response.data;
  } else {
    throw new Error(response.error || '設定のエクスポートに失敗しました');
  }
}

/**
 * 設定をインポート
 * @param {string} jsonData - JSON形式の設定データ
 * @returns {Promise<void>}
 */
async function importSettings(jsonData) {
  const response = await sendMessage({ type: 'IMPORT_SETTINGS', data: jsonData });
  if (!response.success) {
    throw new Error(response.error || '設定のインポートに失敗しました');
  }
}

/**
 * 送信キー設定を取得
 * @returns {Promise<Object>} 送信キー設定
 */
async function getSendKeyConfig() {
  const response = await sendMessage({ type: 'GET_SEND_KEY_CONFIG' });
  if (response.success) {
    return response.config;
  } else {
    throw new Error(response.error || '送信キー設定の取得に失敗しました');
  }
}

/**
 * 送信キー設定を保存
 * @param {Object} config - 送信キー設定
 * @returns {Promise<void>}
 */
async function setSendKeyConfig(config) {
  const response = await sendMessage({ type: 'SET_SEND_KEY_CONFIG', config });
  if (!response.success) {
    throw new Error(response.error || '送信キー設定の保存に失敗しました');
  }
}

// ========================================
// UI更新関数
// ========================================

/**
 * URL表示状態をリセット
 * 要件: 1.5
 */
function resetURLDisplayState() {
  urlDisplayState = {
    fullUrl: '',
    isTruncated: false,
    isExpanded: false
  };
}

/**
 * URLを省略形式で表示
 * @param {string} url - 表示するURL
 * @param {number} maxLength - 最大文字数（デフォルト: 100）
 */
function displayURL(url, maxLength = 100) {
  try {
    const urlElement = document.getElementById('currentUrl');
    
    // DOM要素が見つからない場合のエラーハンドリング
    if (!urlElement) {
      console.error('URL表示要素が見つかりません: #currentUrl');
      return;
    }
    
    const urlTextElement = urlElement.querySelector('.url-text');
    const indicatorElement = urlElement.querySelector('.url-expand-indicator');
    
    // 子要素が見つからない場合のエラーハンドリング
    if (!urlTextElement) {
      console.error('URLテキスト要素が見つかりません: .url-text');
      return;
    }
    
    if (!indicatorElement) {
      console.error('インジケーター要素が見つかりません: .url-expand-indicator');
      return;
    }
    
    // URL変更時に状態をリセット（要件: 1.5）
    if (urlDisplayState.fullUrl !== url) {
      resetURLDisplayState();
    }
    
    // URLが空または無効な場合のエラーハンドリング
    if (!url || typeof url !== 'string') {
      urlTextElement.textContent = 'URLが取得できません';
      urlElement.classList.remove('clickable', 'truncated', 'expanded');
      indicatorElement.style.display = 'none';
      urlElement.dataset.fullUrl = '';
      urlElement.removeAttribute('tabindex');
      urlElement.removeAttribute('role');
      urlElement.removeAttribute('aria-expanded');
      urlDisplayState.fullUrl = '';
      urlDisplayState.isTruncated = false;
      urlDisplayState.isExpanded = false;
      return;
    }
    
    // 完全なURLをdata属性と状態に保存
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
      urlDisplayState.isTruncated = false;
      urlDisplayState.isExpanded = false;
    } else {
      // 長いURL: 省略表示、インジケーター表示
      urlTextElement.textContent = url.substring(0, maxLength) + '...';
      urlElement.classList.add('clickable', 'truncated');
      urlElement.classList.remove('expanded');
      indicatorElement.style.display = 'inline';
      indicatorElement.textContent = '▼'; // 展開可能を示す
      // アクセシビリティ属性を追加（要件: 2.1, 2.2）
      urlElement.setAttribute('tabindex', '0');
      urlElement.setAttribute('role', 'button');
      urlElement.setAttribute('aria-expanded', 'false');
      urlElement.setAttribute('aria-label', 'URLを展開');
      urlDisplayState.isTruncated = true;
      urlDisplayState.isExpanded = false;
    }
  } catch (error) {
    console.error('URL表示中にエラーが発生しました:', error);
  }
}

/**
 * URL表示のトグル（展開/折りたたみ）
 * 要件: 2.1, 2.2
 */
function toggleURLDisplay() {
  try {
    const urlElement = document.getElementById('currentUrl');
    
    // DOM要素が見つからない場合のエラーハンドリング
    if (!urlElement) {
      console.error('URL表示要素が見つかりません: #currentUrl');
      return;
    }
    
    const urlTextElement = urlElement.querySelector('.url-text');
    const indicatorElement = urlElement.querySelector('.url-expand-indicator');
    
    // 子要素が見つからない場合のエラーハンドリング
    if (!urlTextElement) {
      console.error('URLテキスト要素が見つかりません: .url-text');
      return;
    }
    
    if (!indicatorElement) {
      console.error('インジケーター要素が見つかりません: .url-expand-indicator');
      return;
    }
    
    const fullUrl = urlElement.dataset.fullUrl;
    
    // URLが空または短い場合はトグルしない
    if (!fullUrl || fullUrl.length <= 100) {
      return;
    }
    
    if (urlElement.classList.contains('expanded')) {
      // 折りたたみ
      urlTextElement.textContent = fullUrl.substring(0, 100) + '...';
      urlElement.classList.remove('expanded');
      urlElement.classList.add('truncated');
      indicatorElement.textContent = '▼';
      // aria-expanded属性を更新（要件: 2.1, 2.2）
      urlElement.setAttribute('aria-expanded', 'false');
      urlElement.setAttribute('aria-label', 'URLを展開');
      urlDisplayState.isExpanded = false;
    } else {
      // 展開
      urlTextElement.textContent = fullUrl;
      urlElement.classList.remove('truncated');
      urlElement.classList.add('expanded');
      indicatorElement.textContent = '▲';
      // aria-expanded属性を更新（要件: 2.1, 2.2）
      urlElement.setAttribute('aria-expanded', 'true');
      urlElement.setAttribute('aria-label', 'URLを折りたたむ');
      urlDisplayState.isExpanded = true;
    }
  } catch (error) {
    console.error('URLトグル中にエラーが発生しました:', error);
  }
}

/**
 * 現在のページの状態を更新
 * @param {Object} tab - タブ情報
 * @param {Array} patterns - パターンの配列
 */
function updateCurrentPageStatus(tab, patterns) {
  try {
    // DOM要素の存在確認
    if (!elements.statusText || !elements.statusIcon || !elements.quickToggleSection) {
      console.error('必要なDOM要素が見つかりません');
      return;
    }
    
    // タブ情報が無効な場合のエラーハンドリング
    if (!tab || !tab.url) {
      elements.statusText.textContent = 'ページ情報を取得できません';
      elements.statusIcon.className = 'status-icon inactive';
      elements.statusText.className = 'status-text inactive';
      displayURL(''); // 空のURLを表示
      elements.quickToggleSection.style.display = 'none';
      return;
    }

    // URLを表示（新機能）
    displayURL(tab.url);

    // パターンの配列が無効な場合のエラーハンドリング
    if (!Array.isArray(patterns)) {
      console.error('パターンが配列ではありません:', patterns);
      patterns = [];
    }

    // パターンマッチングをチェック
    const matchingPatterns = patterns.filter(p => {
      if (!p.enabled) return false;
      try {
        const regex = patternToRegex(p.pattern);
        return regex.test(tab.url);
      } catch (error) {
        console.error('パターンマッチングエラー:', error);
        return false;
      }
    });

    const isActive = matchingPatterns.length > 0;

    // ステータスを更新
    if (isActive) {
      elements.statusIcon.className = 'status-icon active';
      elements.statusText.className = 'status-text active';
      elements.statusText.textContent = '有効';
    } else {
      elements.statusIcon.className = 'status-icon inactive';
      elements.statusText.className = 'status-text inactive';
      elements.statusText.textContent = '無効';
    }

    // 簡易トグルボタンを表示/非表示
    const domainPattern = getDomainPattern(tab.url);
    if (domainPattern) {
      currentDomainPattern = domainPattern;
      const existingPattern = patterns.find(p => p.pattern === domainPattern);
      
      if (existingPattern) {
        // 既存のパターンがある場合は非表示
        elements.quickToggleSection.style.display = 'none';
      } else {
        // 既存のパターンがない場合は表示
        elements.quickToggleSection.style.display = 'block';
        if (elements.quickToggleBtn) {
          elements.quickToggleBtn.textContent = 'このドメインを有効化';
        }
      }
    } else {
      elements.quickToggleSection.style.display = 'none';
    }
  } catch (error) {
    console.error('ページ状態の更新中にエラーが発生しました:', error);
  }
}

/**
 * パターンリストを更新
 * @param {Array} patterns - パターンの配列
 */
function updatePatternsList(patterns) {
  try {
    // DOM要素の存在確認
    if (!elements.patternsList || !elements.emptyState) {
      console.error('パターンリスト要素が見つかりません');
      return;
    }
    
    // パターンの配列が無効な場合のエラーハンドリング
    if (!Array.isArray(patterns)) {
      console.error('パターンが配列ではありません:', patterns);
      patterns = [];
    }
    
    // パターンがない場合
    if (patterns.length === 0) {
      elements.patternsList.innerHTML = '';
      elements.emptyState.style.display = 'block';
      return;
    }

    elements.emptyState.style.display = 'none';

    // パターンを作成日時の降順でソート
    const sortedPatterns = [...patterns].sort((a, b) => b.createdAt - a.createdAt);

    // パターンリストを生成
    elements.patternsList.innerHTML = sortedPatterns.map(pattern => `
      <div class="pattern-item ${pattern.enabled ? '' : 'disabled'}" data-id="${pattern.id}">
        <div class="pattern-toggle">
          <div class="toggle-switch ${pattern.enabled ? 'active' : ''}" data-id="${pattern.id}">
          </div>
        </div>
        <div class="pattern-info">
          <div class="pattern-text">${escapeHtml(pattern.pattern)}</div>
          <div class="pattern-meta">追加日時: ${formatDate(pattern.createdAt)}</div>
        </div>
        <div class="pattern-actions">
          <button class="btn-icon btn-delete" data-id="${pattern.id}" title="削除">
            🗑️
          </button>
        </div>
      </div>
    `).join('');

    // イベントリスナーを追加
    attachPatternListeners();
  } catch (error) {
    console.error('パターンリストの更新中にエラーが発生しました:', error);
  }
}

/**
 * 送信キー設定UIを更新
 * @param {Object} config - 送信キー設定
 */
function updateSendKeyConfigUI(config) {
  try {
    // デフォルト値はcmd
    const modifier = config?.modifier || 'cmd';
    
    // ドロップダウンを更新
    const sendKeySelect = document.getElementById('sendKeySelect');
    if (sendKeySelect) {
      sendKeySelect.value = modifier;
    } else {
      console.error('送信キー設定要素が見つかりません: #sendKeySelect');
    }
  } catch (error) {
    console.error('送信キー設定UIの更新中にエラーが発生しました:', error);
  }
}

/**
 * HTMLエスケープ
 * @param {string} text - エスケープするテキスト
 * @returns {string} エスケープされたテキスト
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * パターンリストのイベントリスナーを追加
 */
function attachPatternListeners() {
  // トグルスイッチ
  document.querySelectorAll('.toggle-switch').forEach(toggle => {
    toggle.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      try {
        await togglePattern(id);
        await refreshUI();
      } catch (error) {
        console.error('パターンのトグルに失敗しました:', error);
        showError('パターンのトグルに失敗しました');
      }
    });
  });

  // 削除ボタン
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      if (confirm('このパターンを削除しますか？')) {
        try {
          await removePattern(id);
          await refreshUI();
        } catch (error) {
          console.error('パターンの削除に失敗しました:', error);
          showError('パターンの削除に失敗しました');
        }
      }
    });
  });
}

/**
 * Chrome match patternを正規表現に変換（background.jsと同じロジック）
 * @param {string} pattern - Chrome match pattern
 * @returns {RegExp} 変換された正規表現
 */
function patternToRegex(pattern) {
  if (pattern === '<all_urls>') {
    return /^(https?|file|ftp):\/\/.*/;
  }

  let regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');

  return new RegExp(`^${regexStr}$`);
}

/**
 * UIを更新
 */
async function refreshUI() {
  try {
    // パターンを取得
    try {
      patterns = await getPatterns();
    } catch (error) {
      console.error('パターンの取得に失敗しました:', error);
      patterns = [];
      showError('パターンの取得に失敗しました');
    }
    
    // 送信キー設定を取得
    try {
      sendKeyConfig = await getSendKeyConfig();
    } catch (error) {
      console.error('送信キー設定の取得に失敗しました:', error);
      sendKeyConfig = { modifier: 'cmd' }; // デフォルト値を使用
    }
    
    // 現在のタブ情報を取得
    let tab = null;
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      tab = tabs[0];
      currentTab = tab;
    } catch (error) {
      console.error('タブ情報の取得に失敗しました:', error);
      showError('タブ情報の取得に失敗しました');
    }
    
    // UIを更新
    updateCurrentPageStatus(tab, patterns);
    updatePatternsList(patterns);
    updateSendKeyConfigUI(sendKeyConfig);
  } catch (error) {
    console.error('UIの更新に失敗しました:', error);
    showError('UIの更新に失敗しました');
  }
}

// ========================================
// イベントハンドラ
// ========================================

/**
 * パターン追加ボタンのクリックハンドラ
 */
if (elements.addBtn && elements.patternInput) {
  elements.addBtn.addEventListener('click', async () => {
    try {
      const pattern = elements.patternInput.value.trim();
      
      if (!pattern) {
        showError('パターンを入力してください');
        return;
      }

      // 簡単なバリデーション
      if (!pattern.includes('://') && pattern !== '<all_urls>') {
        showError('無効なパターン形式です。例: *://example.com/*');
        return;
      }

      try {
        await addPattern(pattern);
        elements.patternInput.value = '';
        await refreshUI();
      } catch (error) {
        console.error('パターンの追加に失敗しました:', error);
        showError(error.message || 'パターンの追加に失敗しました');
      }
    } catch (error) {
      console.error('パターン追加ハンドラーでエラーが発生しました:', error);
    }
  });
} else {
  console.error('パターン追加ボタンまたは入力フィールドが見つかりません');
}

/**
 * Enterキーでパターンを追加
 */
if (elements.patternInput && elements.addBtn) {
  elements.patternInput.addEventListener('keypress', (e) => {
    try {
      if (e.key === 'Enter') {
        elements.addBtn.click();
      }
    } catch (error) {
      console.error('Enterキーハンドラーでエラーが発生しました:', error);
    }
  });
} else {
  console.error('パターン入力フィールドまたは追加ボタンが見つかりません');
}

/**
 * 簡易トグルボタンのクリックハンドラ
 */
if (elements.quickToggleBtn) {
  elements.quickToggleBtn.addEventListener('click', async () => {
    try {
      if (!currentDomainPattern) return;

      try {
        await addPattern(currentDomainPattern);
        await refreshUI();
      } catch (error) {
        console.error('ドメインの追加に失敗しました:', error);
        showError('ドメインの追加に失敗しました');
      }
    } catch (error) {
      console.error('簡易トグルハンドラーでエラーが発生しました:', error);
    }
  });
} else {
  console.error('簡易トグルボタンが見つかりません');
}

/**
 * エクスポートボタンのクリックハンドラ
 */
if (elements.exportBtn) {
  elements.exportBtn.addEventListener('click', async () => {
    try {
      const jsonData = await exportSettings();
      
      // ファイルとしてダウンロード
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-enter-key-control-settings-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('設定のエクスポートに失敗しました:', error);
      showError('設定のエクスポートに失敗しました');
    }
  });
} else {
  console.error('エクスポートボタンが見つかりません');
}

/**
 * インポートボタンのクリックハンドラ
 */
if (elements.importBtn && elements.importFileInput) {
  elements.importBtn.addEventListener('click', () => {
    try {
      elements.importFileInput.click();
    } catch (error) {
      console.error('インポートボタンハンドラーでエラーが発生しました:', error);
    }
  });
} else {
  console.error('インポートボタンまたはファイル入力が見つかりません');
}

/**
 * ファイル選択のハンドラ
 */
if (elements.importFileInput) {
  elements.importFileInput.addEventListener('change', async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        await importSettings(text);
        await refreshUI();
        
        // ファイル入力をリセット
        elements.importFileInput.value = '';
      } catch (error) {
        console.error('設定のインポートに失敗しました:', error);
        showError(error.message || '設定のインポートに失敗しました');
      }
    } catch (error) {
      console.error('ファイル選択ハンドラーでエラーが発生しました:', error);
    }
  });
} else {
  console.error('ファイル入力要素が見つかりません');
}

/**
 * 送信キー設定のドロップダウン変更ハンドラ
 */
const sendKeySelect = document.getElementById('sendKeySelect');
if (sendKeySelect) {
  sendKeySelect.addEventListener('change', async (e) => {
    try {
      const modifier = e.target.value;
      
      try {
        await setSendKeyConfig({ modifier });
        sendKeyConfig = { modifier };
        
        // 成功メッセージを表示（オプション）
        console.log('送信キー設定を保存しました:', modifier);
      } catch (error) {
        console.error('送信キー設定の保存に失敗しました:', error);
        showError('送信キー設定の保存に失敗しました');
        
        // エラー時は元の設定に戻す
        await refreshUI();
      }
    } catch (error) {
      console.error('送信キー設定ハンドラーでエラーが発生しました:', error);
    }
  });
} else {
  console.error('送信キー設定要素が見つかりません: #sendKeySelect');
}

// ========================================
// 初期化
// ========================================

/**
 * ポップアップの初期化
 */
async function initialize() {
  try {
    await refreshUI();
    
    // URL表示領域のクリックイベントリスナーを追加
    const urlElement = document.getElementById('currentUrl');
    if (urlElement) {
      // クリックイベント
      urlElement.addEventListener('click', () => {
        if (urlElement.classList.contains('clickable')) {
          toggleURLDisplay();
        }
      });
      
      // キーボードイベント（Enterキーでトグル）（要件: 2.1, 2.2）
      urlElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && urlElement.classList.contains('clickable')) {
          e.preventDefault();
          toggleURLDisplay();
        }
      });
    } else {
      console.error('URL表示要素が見つかりません: #currentUrl');
    }
  } catch (error) {
    console.error('初期化に失敗しました:', error);
    // DOM要素が存在する場合のみエラーメッセージを表示
    if (elements.patternsList) {
      elements.patternsList.innerHTML = '<div class="error-message">初期化に失敗しました</div>';
    }
  }
}

// ポップアップが開かれたときに初期化
if (typeof window !== 'undefined') {
  initialize();
}

// テスト用にエクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    displayURL,
    toggleURLDisplay,
    resetURLDisplayState,
    urlDisplayState,
    updateCurrentPageStatus,
    updatePatternsList,
    updateSendKeyConfigUI,
    patternToRegex,
    getDomainPattern,
    refreshUI,
    getSendKeyConfig,
    setSendKeyConfig
  };
}
