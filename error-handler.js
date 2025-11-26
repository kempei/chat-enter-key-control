// Error Handler Module for Chat Enter Key Control
// 要件: 6.4

/**
 * エラーハンドラークラス
 * アプリケーション全体のエラーハンドリングを統一的に管理
 */
class ErrorHandler {
  /**
   * ストレージエラーを処理
   * @param {Error} error - エラーオブジェクト
   * @param {string} operation - 実行していた操作
   * @returns {string} ユーザー向けエラーメッセージ
   */
  static handleStorageError(error, operation) {
    console.error(`ストレージエラー (${operation}):`, error);
    
    // ストレージ容量超過エラー
    if (error.message && error.message.includes('QUOTA_BYTES')) {
      return 'ストレージ容量が不足しています。不要なパターンを削除してください。';
    }
    
    // 同期エラー
    if (error.message && error.message.includes('QUOTA_BYTES_PER_ITEM')) {
      return '保存するデータが大きすぎます。パターン数を減らしてください。';
    }
    
    // 一般的なストレージエラー
    return `ストレージ操作に失敗しました: ${error.message || '不明なエラー'}`;
  }

  /**
   * DOM操作エラーを処理
   * @param {Error} error - エラーオブジェクト
   * @param {string} operation - 実行していた操作
   * @returns {string} ユーザー向けエラーメッセージ
   */
  static handleDOMError(error, operation) {
    console.error(`DOM操作エラー (${operation}):`, error);
    
    // 要素が見つからない
    if (error.name === 'NotFoundError') {
      return '要素が見つかりません。ページを再読み込みしてください。';
    }
    
    // 無効な操作
    if (error.name === 'InvalidStateError') {
      return 'DOM操作が無効な状態です。';
    }
    
    // 一般的なDOMエラー
    return `DOM操作に失敗しました: ${error.message || '不明なエラー'}`;
  }

  /**
   * イベント処理エラーを処理
   * @param {Error} error - エラーオブジェクト
   * @param {string} eventType - イベントタイプ
   */
  static handleEventError(error, eventType) {
    console.error(`イベント処理エラー (${eventType}):`, error);
    
    // イベント処理エラーは通常ユーザーに通知しない
    // ログに記録するのみ
  }

  /**
   * URLパターン検証エラーを処理
   * @param {string} pattern - 検証するパターン
   * @returns {Object} { valid: boolean, error: string }
   */
  static validateURLPattern(pattern) {
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
    
    return { valid: true };
  }

  /**
   * メッセージ送信エラーを処理
   * @param {Error} error - エラーオブジェクト
   * @returns {string} ユーザー向けエラーメッセージ
   */
  static handleMessageError(error) {
    console.error('メッセージ送信エラー:', error);
    
    // 拡張機能コンテキストが無効
    if (error.message && error.message.includes('Extension context invalidated')) {
      return '拡張機能が更新されました。ページを再読み込みしてください。';
    }
    
    // 受信者が存在しない
    if (error.message && error.message.includes('Receiving end does not exist')) {
      return 'バックグラウンドスクリプトと通信できません。拡張機能を再読み込みしてください。';
    }
    
    // 一般的なメッセージエラー
    return `通信エラー: ${error.message || '不明なエラー'}`;
  }

  /**
   * JSONパースエラーを処理
   * @param {Error} error - エラーオブジェクト
   * @returns {string} ユーザー向けエラーメッセージ
   */
  static handleJSONError(error) {
    console.error('JSON解析エラー:', error);
    
    return `JSONの解析に失敗しました: ${error.message || '不明なエラー'}。ファイル形式を確認してください。`;
  }

  /**
   * 一般的なエラーを処理
   * @param {Error} error - エラーオブジェクト
   * @param {string} context - エラーが発生したコンテキスト
   * @returns {string} ユーザー向けエラーメッセージ
   */
  static handleGenericError(error, context) {
    console.error(`エラー (${context}):`, error);
    
    return `エラーが発生しました (${context}): ${error.message || '不明なエラー'}`;
  }
}

// テスト用にエクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ErrorHandler };
}
