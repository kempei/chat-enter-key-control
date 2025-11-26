// テスト環境のセットアップ
// Chrome APIのモック

// ストレージデータを保持するオブジェクト
let storageData = {};

// メッセージリスナーを保持する配列
let messageListeners = [];

// グローバルなchrome APIのモック
global.chrome = {
  storage: {
    sync: {
      async get(keys) {
        if (typeof keys === 'string') {
          return { [keys]: storageData[keys] };
        }
        if (Array.isArray(keys)) {
          const result = {};
          keys.forEach(key => {
            if (storageData[key] !== undefined) {
              result[key] = storageData[key];
            }
          });
          return result;
        }
        return { ...storageData };
      },
      
      async set(items) {
        Object.assign(storageData, items);
      },
      
      async clear() {
        storageData = {};
      },
      
      // テスト用のヘルパーメソッド
      _reset() {
        storageData = {};
      }
    }
  },
  
  runtime: {
    onMessage: {
      addListener(listener) {
        messageListeners.push(listener);
      },
      removeListener(listener) {
        const index = messageListeners.indexOf(listener);
        if (index > -1) {
          messageListeners.splice(index, 1);
        }
      }
    },
    onInstalled: {
      addListener() {
        // テスト環境では何もしない
      }
    },
    onStartup: {
      addListener() {
        // テスト環境では何もしない
      }
    }
  },
  
  tabs: {
    async query() {
      return [];
    },
    async get() {
      return null;
    },
    onUpdated: {
      addListener() {
        // テスト環境では何もしない
      }
    },
    onActivated: {
      addListener() {
        // テスト環境では何もしない
      }
    }
  },
  
  action: {
    async setIcon() {
      // テスト環境では何もしない
    },
    async setTitle() {
      // テスト環境では何もしない
    }
  }
};
