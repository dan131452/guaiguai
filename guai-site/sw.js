/* 妻爱吾 — Service Worker
   策略：页面/JS/CSS network-first（联网优先拿最新版，断网回退缓存保证离线可用）；
        fonts/ 字体文件 cache-first（字体基本不变，一次缓存长期离线可用）
   隐私约定：/photos/ 下的照片一律不缓存，只走网络；
   Supabase 是跨域请求，本 Worker 不拦截 */
const CACHE = 'guai-kid-v11';
const PRECACHE = [
  './',
  './index.html',
  './1.html',
  './2.html',
  './3.html',
  './report.html',
  './css/style.css',
  './js/config.js',
  './js/db.js',
  './js/common.js',
  './js/home.js',
  './js/photos.js',
  './js/moments.js',
  './js/letter.js',
  './js/report.js',
  './js/register-sw.js',
  './js/reminders.js',
  './manifest.json',
  './fonts/fonts.css',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;          /* 跨域(Supabase等)不拦 */
  if (url.pathname.includes('/photos/')) return;            /* 照片隐私，不缓存 */

  /* 字体文件 cache-first：内容不变，装进缓存后离线也能有手绘字体 */
  if (url.pathname.includes('/fonts/')) {
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fetch(e.request).then(resp => {
          if (resp && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return resp;
        })
      )
    );
    return;
  }

  /* 页面本身走 network-first：部署了新版本，刷新就能看到，不会被旧缓存卡住 */
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
        }
        return resp;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  /* 其余同源资源同样 network-first：优先拿到最新版，断网时回退缓存（离线仍可用） */
  e.respondWith(
    fetch(e.request).then(resp => {
      if (resp && resp.ok) {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return resp;
    }).catch(() =>
      caches.match(e.request).then(cached => cached || caches.match('./index.html'))
    )
  );
});

/* ---------- Web Push：收到"ta记了一件小事"的推送时弹通知 ---------- */
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (_) { data = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(data.title || '妻爱吾 🐾', {
    body: data.body || '',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    tag: 'qiaiwu-moment',
    data: { url: data.url || './2.html' }
  }));
});

/* 点通知跳到对应页面 */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin)) { c.navigate(url); return c.focus(); }
      }
      return self.clients.openWindow(url);
    })
  );
});