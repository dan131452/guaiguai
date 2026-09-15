/* 1.html 照片墙上的「盛世美照」入口滑窗 */
(function () {
  const fab = document.getElementById('beautyFab');
  const sheet = document.getElementById('beautySheet');
  const mask = document.getElementById('beautySheetMask');
  const closeBtn = document.getElementById('beautySheetClose');
  if (!fab || !sheet) return;

  function open() { sheet.hidden = false; }
  function close() { sheet.hidden = true; }

  fab.addEventListener('click', open);
  if (mask) mask.addEventListener('click', close);
  if (closeBtn) closeBtn.addEventListener('click', close);
  sheet.querySelectorAll('a[href="beauty.html"]').forEach(a => {
    a.addEventListener('click', () => { /* 跳转即可，不必拦截 */ });
  });
})();
