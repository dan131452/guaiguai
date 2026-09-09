/* PWA 注册：仅在线环境（http/https）生效，file:// 下自动跳过 */
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.warn('Service Worker 注册失败（不影响网站使用）:', err);
    });
  });
}

/* ---------- 一键安装（安卓 Chrome 会触发 beforeinstallprompt） ---------- */
(function () {
  const btn = document.getElementById('installBtn');
  if (!btn) return;

  /* 已经是安装好的 App 在运行，就不用再提示 */
  if (window.matchMedia('(display-mode: standalone)').matches) return;

  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    btn.hidden = false;
  });

  btn.addEventListener('click', () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.finally(() => {
      deferredPrompt = null;
      btn.hidden = true;
    });
  });

  window.addEventListener('appinstalled', () => { btn.hidden = true; });
})();