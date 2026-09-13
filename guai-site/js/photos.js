/* =====================================================
   1.html 照片墙：云端列表/上传/大图弹窗（说明/下载/删除）
   ===================================================== */
const grid = document.getElementById('photoGrid');
const photoUploadBtn = document.getElementById('photoUploadBtn');
const photoFileInput = document.getElementById('photoFileInput');
const photoUploadTip = document.getElementById('photoUploadTip');
const photoModal = document.getElementById('photoModal');
const photoModalImg = document.getElementById('photoModalImg');
const photoModalClose = document.getElementById('photoModalClose');
const photoModalDel = document.getElementById('photoModalDel');
const photoModalCap = document.getElementById('photoModalCap');
const photoModalCapSave = document.getElementById('photoModalCapSave');
const photoModalDl = document.getElementById('photoModalDl');
const photoModalTip = document.getElementById('photoModalTip');

function renderPhotoGridLocal() {
  if (!grid) return;
  grid.innerHTML = '';
  CONFIG.photos.forEach(p => {
    const fig = document.createElement('div');
    fig.className = 'photo';
    fig.innerHTML =
      '<img src="' + p.src + '" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
      '<div class="ph" style="display:none"><span>🐾</span><span>这里放我们的照片</span></div>' +
      '<div class="cap">' + p.caption + '</div>';
    grid.appendChild(fig);
  });
}

function renderPhotoGridCloud(photos) {
  if (!grid) return;
  grid.innerHTML = '';
  if (!photos.length) {
    if (photoUploadTip) photoUploadTip.textContent = '还没有照片哦，点右下角 📷 上传第一张吧 🐾';
    return;
  }
  if (photoUploadTip) photoUploadTip.textContent = '点照片可以看大图、写说明、下载、删除 · 点右下角 📷 上传新照片';
  photos.forEach(t => {
    const fig = document.createElement('div');
    fig.className = 'photo';
    const url = sbPhotoUrl(t.image_path);
    const cap = (t.caption && t.caption.trim()) || '我们的照片';
    fig.innerHTML =
      '<img src="' + esc(url) + '" alt="" loading="lazy" data-id="' + esc(t.id) + '" data-img="' + esc(t.image_path || '') + '">' +
      '<div class="cap">' + esc(cap) + '</div>';
    grid.appendChild(fig);
  });
}

let lastPhotosList = [];   /* 云端照片列表缓存，弹窗里写说明要用 */

function loadPhotos() {
  if (!grid) return;
  if (!sbReady() || !sbLoggedIn()) { lastPhotosList = []; renderPhotoGridLocal(); return; }
  renderPhotoGridCloud([]);
  sbListPhotos()
    .then(list => { lastPhotosList = list; renderPhotoGridCloud(list); })
    .catch(err => {
      lastPhotosList = [];
      if (photoUploadTip) photoUploadTip.textContent = '⚠️ 云端暂时连不上（' + err.message + '），先展示本地照片';
      renderPhotoGridLocal();
    });
}

/* 上传按钮 → 触发隐藏 file input */
if (photoUploadBtn && photoFileInput) {
  photoUploadBtn.addEventListener('click', () => photoFileInput.click());
}

if (photoFileInput) {
  photoFileInput.addEventListener('change', () => {
    const files = Array.from(photoFileInput.files || []);
    if (!files.length) return;
    if (!sbReady() || !sbLoggedIn()) { alert('先登录再上传哦 🐾'); photoFileInput.value = ''; return; }
    if (photoUploadBtn) photoUploadBtn.disabled = true;
    if (photoUploadTip) photoUploadTip.textContent = '正在上传 ' + files.length + ' 张照片…';

    Promise.all(files.map(f =>
      sbUploadPhoto(f).then(imagePath =>
        sbAddPhoto(imagePath, '')
      )
    ))
      .then(() => {
        if (photoUploadTip) photoUploadTip.textContent = '上传好啦 🐾❤️';
        loadPhotos();
      })
      .catch(err => { if (photoUploadTip) photoUploadTip.textContent = '上传失败：' + err.message + '，再试一次？'; })
      .finally(() => {
        if (photoUploadBtn) photoUploadBtn.disabled = false;
        photoFileInput.value = '';
      });
  });
}

/* ---------- 照片大图弹窗 ----------
   manage=true：照片墙的云端照片（可写说明、可删）
   manage=false：只看不删（时间线里的照片），保留下载 */
let currentModalPhoto = null;

function openPhotoModal(opts) {
  if (!photoModal || !photoModalImg) return;
  currentModalPhoto = opts.manage ? { id: opts.id, img: opts.path || '', caption: opts.caption || '' } : null;
  photoModalImg.src = opts.src;
  if (photoModalCap) {
    photoModalCap.hidden = !opts.manage;
    photoModalCap.value = opts.manage ? (opts.caption || '') : '';
  }
  if (photoModalCapSave) photoModalCapSave.hidden = !opts.manage;
  if (photoModalDel) photoModalDel.hidden = !opts.manage;
  if (photoModalDl) photoModalDl.hidden = false;
  if (photoModalTip) photoModalTip.textContent = '';
  photoModal.hidden = false;
}

/* 照片墙网格：点照片进弹窗（可管理） */
if (grid) {
  grid.addEventListener('click', e => {
    const img = e.target.closest('.photo img');
    if (!img || !img.dataset.id) return;
    const rec = (lastPhotosList || []).find(p => p.id === img.dataset.id);
    openPhotoModal({
      src: img.src,
      manage: true,
      id: img.dataset.id,
      path: img.dataset.img,
      caption: rec ? rec.caption : ''
    });
  });
}

if (photoModalClose) {
  photoModalClose.addEventListener('click', () => {
    if (photoModal) photoModal.hidden = true;
    if (photoModalImg) photoModalImg.src = '';
    currentModalPhoto = null;
  });
}

if (photoModal) {
  photoModal.addEventListener('click', e => { if (e.target === photoModal) photoModalClose.click(); });
}

/* 存照片说明 */
if (photoModalCapSave) {
  photoModalCapSave.addEventListener('click', () => {
    if (!currentModalPhoto) return;
    const val = (photoModalCap.value || '').trim();
    photoModalCapSave.disabled = true;
    sbUpdatePhotoCaption(currentModalPhoto.id, val)
      .then(() => {
        currentModalPhoto.caption = val;
        if (photoModalTip) photoModalTip.textContent = '说明存好啦 🐾';
        loadPhotos();
      })
      .catch(err => { if (photoModalTip) { photoModalTip.textContent = '没存上：' + err.message; photoModalTip.classList.add('err'); } })
      .finally(() => { photoModalCapSave.disabled = false; });
  });
}

/* 下载到本地：跨域直链的 download 属性不一定生效，用 fetch 转 blob 强制保存 */
if (photoModalDl) {
  photoModalDl.addEventListener('click', e => {
    e.preventDefault();
    const src = photoModalImg.src;
    if (!src) return;
    const old = photoModalDl.textContent;
    photoModalDl.textContent = '下载中…';
    fetch(src).then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.blob();
    }).then(b => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'qiaiwu-' + Date.now() + '.jpg';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      if (photoModalTip) photoModalTip.textContent = '已保存到你的下载文件夹啦 🐾';
    }).catch(() => {
      /* 拉不动就开新标签页，让用户长按保存 */
      window.open(src, '_blank');
    }).finally(() => { photoModalDl.textContent = old; });
  });
}

if (photoModalDel) {
  photoModalDel.addEventListener('click', () => {
    if (!currentModalPhoto) return;
    if (!confirm('确定删掉这张照片吗？删了就找不回来啦')) return;
    photoModalDel.disabled = true;
    sbDeletePhotoRecord(currentModalPhoto.id, currentModalPhoto.img || null)
      .then(() => { if (photoModal) photoModal.hidden = true; loadPhotos(); })
      .catch(err => { alert('删除失败：' + err.message); })
      .finally(() => { photoModalDel.disabled = false; });
  });
}

/* ---------- 登录状态联动 ---------- */
QIAIWU.onUnlock(loadPhotos);
QIAIWU.onLocal(loadPhotos);
