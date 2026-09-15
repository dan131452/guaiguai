/* 1.html 照片墙上的「盛世美照」入口滑窗（B 版：精选 3 张横滑预览） */
(function () {
  const fab = document.getElementById('beautyFab');
  const sheet = document.getElementById('beautySheet');
  const mask = document.getElementById('beautySheetMask');
  const closeBtn = document.getElementById('beautySheetClose');
  const preview = document.getElementById('beautyPreview');
  const previewHint = document.getElementById('beautyPreviewHint');
  if (!fab || !sheet) return;

  let loaded = false;

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function renderPreview(list) {
    if (!preview) return;
    if (!list.length) {
      preview.innerHTML = '';
      if (previewHint) previewHint.hidden = false;
      return;
    }
    if (previewHint) previewHint.hidden = true;
    preview.innerHTML = list.slice(0, 3).map(t => {
      const url = (typeof sbPhotoUrl === 'function') ? sbPhotoUrl(t.image_path) : '';
      const cap = (t.caption && t.caption.trim()) || '';
      return '<a class="beauty-thumb" href="beauty.html" title="' + escapeHtml(cap) + '">' +
        '<img src="' + escapeHtml(url) + '" alt="" loading="lazy">' +
        (cap ? '<span class="beauty-thumb-cap">' + escapeHtml(cap) + '</span>' : '') +
        '</a>';
    }).join('');
  }

  function loadPreview() {
    if (loaded) return;
    if (!sbReady() || !sbLoggedIn()) {
      if (previewHint) {
        previewHint.textContent = '登录后可以在这里偷看最新 3 张美照 🐾';
        previewHint.hidden = false;
      }
      if (preview) preview.innerHTML = '';
      return;
    }
    loaded = true;
    sbListPhotos('beauty_photos')
      .then(list => renderPreview(list || []))
      .catch(() => {
        if (previewHint) {
          previewHint.textContent = '云端暂时连不上，点进去看看吧 🐾';
          previewHint.hidden = false;
        }
        if (preview) preview.innerHTML = '';
      });
  }

  function open() {
    sheet.hidden = false;
    loadPreview();
  }
  function close() { sheet.hidden = true; }

  fab.addEventListener('click', open);
  if (mask) mask.addEventListener('click', close);
  if (closeBtn) closeBtn.addEventListener('click', close);
  /* 下滑面板关闭（可选手势） */
  if (sheet) {
    let startY = null;
    sheet.addEventListener('touchstart', e => {
      if (e.target.closest('.beauty-preview')) return;
      startY = (e.touches && e.touches[0]) ? e.touches[0].clientY : null;
    }, { passive: true });
    sheet.addEventListener('touchend', e => {
      if (startY == null) return;
      const endY = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY : startY;
      if (endY - startY > 80) close();
      startY = null;
    }, { passive: true });
  }
})();
