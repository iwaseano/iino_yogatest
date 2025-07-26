// Service Worker for Serenity Yoga Studio
const CACHE_NAME = 'serenity-yoga-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/404.html',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=Dancing+Script:wght@400;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// インストール時の処理
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// フェッチイベントの処理
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // キャッシュにある場合はそれを返す
        if (response) {
          return response;
        }

        // キャッシュにない場合はネットワークから取得
        return fetch(event.request).then(
          function(response) {
            // レスポンスが有効でない場合は何もしない
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // レスポンスをクローンしてキャッシュに保存
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      }
    )
  );
});

// アクティベート時の処理（古いキャッシュの削除）
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// バックグラウンド同期（将来の実装のため）
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // オフライン時に保存されたデータを同期
  return new Promise((resolve) => {
    console.log('Background sync completed');
    resolve();
  });
}

// プッシュ通知（将来の実装のため）
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'ヨガクラスのリマインダー',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'yoga-reminder',
    actions: [
      {
        action: 'view',
        title: '詳細を見る'
      },
      {
        action: 'close',
        title: '閉じる'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Serenity Yoga Studio', options)
  );
});

// 通知クリック時の処理
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
