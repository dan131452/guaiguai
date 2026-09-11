/* 给乖乖的纪念日网站 — Service Worker
   策略：network-first（联网优先拿最新版，断网回退缓存保证离线可用）
   隐私约定：/photos/ 下的照片一律不缓存，只走网络；
   Supabase 是跨域请求，本 Worker 不拦截 */
const CACHE = 'guai-kid-v7';
const PRECACHE = [
  './',
  './index.html',
  './1.html',
  './2.html',
  './3.html',
  './css/style.css',
  './js/config.js',
  './js/db.js',
  './js/main.js',
  './js/register-sw.js',
  './js/reminders.js',
  './manifest.json',
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