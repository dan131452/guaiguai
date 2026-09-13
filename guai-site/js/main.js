/* =====================================================
   四个页面共用的逻辑（index / 1 / 2 / 3）
   每个区块都会先检查页面上有没有对应元素，没有就跳过。
   ===================================================== */

/* ---------- 通用：套用称呼 ---------- */
['her1','her2','her3','her4'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = CONFIG.her; });
const meEl = document.getElementById('me1'); if(meEl) meEl.textContent = CONFIG.me;

/* ---------- "为什么是 7.25"（仅首页；登录后可在线编辑，存云端 settings 表） ---------- */
const whyEl = document.getElementById('why725');
const whyEditBtn = document.getElementById('whyEdit');
const WHY_KEY = 'why725';
let whyText = CONFIG.why725 || '';
let whyEditor = null;   /* 当前是否在编辑 */

function renderWhy() {
  if (whyEl) whyEl.textContent = whyText || '✨ 这里等你写下属于 7 月 25 日的小故事……';
}
renderWhy();

function showWhyEdit(show) { if (whyEditBtn) whyEditBtn.hidden = !show; }

function refreshWhyFromCloud() {
  if (!sbReady() || !sbLoggedIn()) return;
  sbGetSetting(WHY_KEY)
    .then(v => { if (v !== null) { whyText = v; renderWhy(); } })
    .catch(() => { /* 拉不到就用本地文案 */ });
}

function closeWhyEditor() { whyEl.innerHTML = ''; whyEditor = null; }

if (whyEditBtn) {
  whyEditBtn.addEventListener('click', () => {
    if (whyEditor) return;
    whyEl.innerHTML = '';
    const ta = document.createElement('textarea');
    ta.className = 'rec-input';
    ta.rows = 5;
    ta.maxLength = 1000;
    ta.placeholder = '那天发生了什么？把 7 月 25 日的故事写下来吧 🐾';
    ta.value = whyText;
    const row = document.createElement('div');
    row.className = 'form-photo-row';
    const save = document.createElement('button');
    save.className = 'btn'; save.type = 'button'; save.textContent = '保存 ✨';
    const cancel = document.createElement('button');
    cancel.className = 'btn'; cancel.type = 'button'; cancel.textContent = '取消';
    row.appendChild(save); row.appendChild(cancel);
    whyEl.appendChild(ta); whyEl.appendChild(row);
    whyEditor = true;

    cancel.addEventListener('click', () => { closeWhyEditor(); renderWhy(); });
    save.addEventListener('click', () => {
      const val = ta.value.trim();
      save.disabled = true; save.textContent = '保存中…';
      sbSetSetting(WHY_KEY, val)
        .then(() => { whyText = val; closeWhyEditor(); renderWhy(); })
        .catch(err => {
          alert('保存失败：' + err.message);
          save.disabled = false; save.textContent = '保存 ✨';
        });
    });
  });
}

/* ---------- 纪念日基础信息（全部从 CONFIG.startDate 派生） ---------- */
const DAY = 86400000;
const startDateObj = new Date(CONFIG.startDate);
const START = startDateObj.getTime();
const startYear = startDateObj.getFullYear();
const ANN_M = startDateObj.getMonth();   // 纪念日月份（0-11）
const ANN_D = startDateObj.getDate();    // 纪念日日号

function pad(n){ return String(n).padStart(2,'0'); }
/* 今天的 YYYY-MM-DD（date input 用） */
function todayStr(){
  const n = new Date();
  return n.getFullYear() + '-' + pad(n.getMonth() + 1) + '-' + pad(n.getDate());
}
/* 数字格式：2026.07.25 */
function fmtDate(d){ return d.getFullYear() + '.' + pad(d.getMonth()+1) + '.' + pad(d.getDate()); }
/* 中文格式：2026 年 7 月 25 日 */
function fmtDateCN(d){ return d.getFullYear() + ' 年 ' + (d.getMonth()+1) + ' 月 ' + d.getDate() + ' 日'; }

/* 下一个周年纪念日（跨年后自动 +1 周年，第几周年由 tick 计算） */
function nextAnniversary(){
  const now = new Date();
  let d = new Date(now.getFullYear(), ANN_M, ANN_D);
  if (now > d) d = new Date(now.getFullYear() + 1, ANN_M, ANN_D);
  return d;
}

/* 一次性写死的页面日期（各页脚注 / 首页徽章） */
const badgeEl = document.getElementById('badgeText');
if (badgeEl) badgeEl.textContent = '🐾 ' + fmtDate(startDateObj) + ' · 我们在一起啦';
const sinceDateEl = document.getElementById('sinceDate');
if (sinceDateEl) sinceDateEl.textContent = fmtDateCN(startDateObj);
const footDateEl = document.getElementById('startDateF');
if (footDateEl) footDateEl.textContent = fmtDate(startDateObj);

/* ---------- 首页：天数 & 倒计时 ---------- */
const daysEl = document.getElementById('days');
if (daysEl) {
  const d100Ms = START + 100 * DAY;   // 第 100 天纪念日
  const d100DateEl = document.getElementById('d100Date');
  if (d100DateEl) d100DateEl.textContent = fmtDate(new Date(d100Ms));

  function tick(){
    const now = new Date().getTime();
    const diff = now - START;
    if (diff < 0) return;
    const days = Math.floor(diff / DAY);
    const h = Math.floor(diff % DAY / 3600000);
    const m = Math.floor(diff % 3600000 / 60000);
    const s = Math.floor(diff % 60000 / 1000);

    document.getElementById('days').textContent = days;
    document.getElementById('exact').textContent = '我们已经在一起 ' + days + ' 天 ' + h + ' 小时 ' + m + ' 分钟 ' + s + ' 秒啦';

    /* 周年倒计时：动态显示是第几周年及其日期 */
    const ann = nextAnniversary();
    const adiff = ann.getTime() - now;
    document.getElementById('c1d').textContent = Math.floor(adiff / DAY);
    document.getElementById('c1t').textContent = pad(Math.floor(adiff % DAY / 3600000)) + ':' + pad(Math.floor(adiff % DAY % 3600000 / 60000)) + ':' + pad(Math.floor(adiff % 60000 / 1000));
    const annEl = document.getElementById('annN');
    if (annEl) annEl.textContent = ann.getFullYear() - startYear;
    const annDateEl = document.getElementById('annDate');
    if (annDateEl) annDateEl.textContent = fmtDate(ann);

    /* 100 天纪念日：未到显示倒计时；已过切换为"已度过"语义 */
    const c2lbl = document.getElementById('c2lbl');
    const d100diff = d100Ms - now;
    if (d100diff > 0) {
      document.getElementById('c2d').textContent = Math.ceil(d100diff / DAY);
      if (c2lbl) c2lbl.textContent = '距离 100 天纪念日';
      document.getElementById('c2t').textContent = '再坚持一下就到啦';
    } else {
      document.getElementById('c2d').textContent = days;
      if (c2lbl) c2lbl.textContent = '第 100 天纪念日已过';
      document.getElementById('c2t').textContent = '继续爱下去的第 ' + days + ' 天 ❤️';
    }

    document.getElementById('c3d').textContent = days;
    document.getElementById('c3t').textContent = '爱你第 ' + days + ' 天 ❤️';
  }
  tick();
  setInterval(tick, 1000);
}

/* ---------- 首页：情话轮播（登录后可在线编辑，存云端 settings 表） ---------- */
const quoteEl = document.getElementById('quote');
const quoteEditBtn = document.getElementById('quoteEdit');
const QUOTES_KEY = 'quotes';
let quotes = CONFIG.quotes.slice();
let quoteEditor = null;

function showQuoteEdit(show) { if (quoteEditBtn) quoteEditBtn.hidden = !show; }

function refreshQuotesFromCloud() {
  if (!sbReady() || !sbLoggedIn()) return;
  sbGetSetting(QUOTES_KEY)
    .then(str => {
      if (!str) return;
      try {
        const arr = JSON.parse(str);
        if (Array.isArray(arr) && arr.length) { quotes = arr; renderNextQuote(); }
      } catch (e) { /* 云端格式不对就继续用本地 */ }
    })
    .catch(() => { /* 拉不到就用本地文案 */ });
}

function renderNextQuote() {
  if (!quoteEl || !quotes.length) return;
  const i = Math.floor(Math.random() * quotes.length);
  quoteEl.classList.add('fade');
  setTimeout(() => { quoteEl.textContent = quotes[i]; quoteEl.classList.remove('fade'); }, 350);
}

if (quoteEl) {
  renderNextQuote();
  const quoteBtn = document.getElementById('quoteBtn');
  if (quoteBtn) quoteBtn.addEventListener('click', renderNextQuote);
}

if (quoteEditBtn) {
  quoteEditBtn.addEventListener('click', () => {
    if (quoteEditor) return;
    quoteEl.innerHTML = '';
    const ta = document.createElement('textarea');
    ta.className = 'rec-input';
    ta.rows = 6;
    ta.maxLength = 5000;
    ta.placeholder = '一句一行，写下想对' + CONFIG.her + '说的话 🐾';
    ta.value = quotes.join('\n');
    const row = document.createElement('div');
    row.className = 'form-photo-row';
    const save = document.createElement('button');
    save.className = 'btn'; save.type = 'button'; save.textContent = '保存 ✨';
    const cancel = document.createElement('button');
    cancel.className = 'btn'; cancel.type = 'button'; cancel.textContent = '取消';
    row.appendChild(save); row.appendChild(cancel);
    quoteEl.appendChild(ta); quoteEl.appendChild(row);
    quoteEditor = true;

    cancel.addEventListener('click', () => { quoteEl.innerHTML = ''; quoteEditor = null; renderNextQuote(); });
    save.addEventListener('click', () => {
      const lines = ta.value.split('\n').map(s => s.trim()).filter(Boolean);
      save.disabled = true; save.textContent = '保存中…';
      sbSetSetting(QUOTES_KEY, JSON.stringify(lines))
        .then(() => {
          quotes = lines.length ? lines : CONFIG.quotes.slice();
          quoteEl.innerHTML = ''; quoteEditor = null;
          renderNextQuote();
        })
        .catch(err => {
          alert('保存失败：' + err.message);
          save.disabled = false; save.textContent = '保存 ✨';
        });
    });
  });
}

/* ---------- 1.html：照片墙（云端优先，未配置/断网时兜底本地） ---------- */
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
  if (photoUploadTip) photoUploadTip.textContent = '点照片可以看大图、删除 · 点右下角 📷 上传新照片';
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

/* ---------- 2.html：时间线（优先云端记录，断网/未配置时兜底本地） ---------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

/* 日期统一显示为 2026.07.25；非标准日期（如示例文案）原样显示 */
function fmtTlDate(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) return d || '';
  const [y, m, day] = d.split('-');
  return y + '.' + m + '.' + day;
}

const tl = document.getElementById('timeline');
/* 当前时间线数据（云端成功加载后缓存），编辑/筛选都要用 */
let momentsList = [];
/* 按人筛选：'' = 全部 */
let currentFilter = '';

function renderTimeline(items) {
  if (!tl) return;
  const shown = currentFilter ? items.filter(t => (t.author || '') === currentFilter) : items;
  tl.innerHTML = '';
  if (!shown.length) {
    tl.innerHTML = '<p class="tl-empty">' + (currentFilter ? '这个人还没记过小事，等ta写第一笔吧 🐾' : '还没有记录，从上面记第一笔开始吧 🐾') + '</p>';
    return;
  }
  shown.forEach(t => {
    const item = document.createElement('div');
    item.className = 'tl-item';
    const imgHtml = t.image_path
      ? '<img class="tl-photo" loading="lazy" src="' + esc(t.__imgUrl || sbPhotoUrl(t.image_path)) + '" alt="">'
      : '';
    const actHtml = t.id
      ? '<button class="tl-edit" type="button" title="编辑这条" data-id="' + esc(t.id) + '">✎</button>' +
        '<button class="tl-del" type="button" title="删除这条" data-id="' + esc(t.id) + '" data-img="' + esc(t.image_path || '') + '">✕</button>'
      : '';
    const authorTag = t.author ? '<span class="tl-author">' + esc(t.author) + '</span>' : '';
    item.innerHTML =
      '<div class="tl-dot">🐾</div>' +
      '<div class="tl-card">' + actHtml +
      '<h3>' + esc(fmtTlDate(t.happened_on || t.date)) + authorTag + '</h3>' +
      (t.text ? '<p>' + esc(t.text) + '</p>' : '') +
      imgHtml + '</div>';
    tl.appendChild(item);
  });
}

const MOMENTS_CACHE = 'moments-cache-v1';
const seedItems = CONFIG.timeline.map(t => ({ date: t.date, text: t.text }));

function loadMoments() {
  if (!tl) return;
  if (!sbReady()) {
    momentsList = seedItems;
    renderTimeline(seedItems);
    return;
  }
  /* 先展示上次的缓存，立刻有内容；再拉云端最新 */
  try {
    const cached = JSON.parse(localStorage.getItem(MOMENTS_CACHE) || 'null');
    if (cached && cached.length) { momentsList = cached; renderTimeline(cached); }
  } catch (e) { /* 缓存坏了就忽略 */ }

  sbListMoments()
    .then(list => {
      momentsList = list;
      renderTimeline(list);
      try { localStorage.setItem(MOMENTS_CACHE, JSON.stringify(list)); } catch (e) {}
    })
    .catch(err => {
      const tlSub = document.getElementById('tlSub');
      if (tlSub && !document.querySelector('.tl-item')) {
        tlSub.textContent = '⚠️ 云端暂时连不上（' + err.message + '），先展示本地内容';
      }
      if (!document.querySelector('.tl-item')) { momentsList = seedItems; renderTimeline(seedItems); }
    });
}

/* 2.html：记一笔表单（也承担"编辑已有记录"的职责） */
const formTip = document.getElementById('formTip');
const recDate = document.getElementById('recDate');
const recText = document.getElementById('recText');
const recPhoto = document.getElementById('recPhoto');
const photoName = document.getElementById('photoName');
const photoPreview = document.getElementById('photoPreview');
const recSave = document.getElementById('recSave');
const recCancel = document.getElementById('recCancel');

if (recDate) {
  /* 日期默认今天 */
  (function () {
    const n = new Date();
    recDate.value = n.getFullYear() + '-' + pad(n.getMonth() + 1) + '-' + pad(n.getDate());
  })();

  /* author 选择按钮 */
  const authorMe = document.getElementById('authorMe');
  const authorHer = document.getElementById('authorHer');
  let selectedAuthor = CONFIG.me;
  if (authorMe) authorMe.textContent = CONFIG.me;
  if (authorHer) authorHer.textContent = CONFIG.her;
  function selectAuthor(name) {
    selectedAuthor = name;
    if (authorMe) authorMe.classList.toggle('active', name === CONFIG.me);
    if (authorHer) authorHer.classList.toggle('active', name === CONFIG.her);
  }
  if (authorMe) { authorMe.classList.add('active'); authorMe.addEventListener('click', () => selectAuthor(CONFIG.me)); }
  if (authorHer) { authorHer.addEventListener('click', () => selectAuthor(CONFIG.her)); }

  /* 按人筛选（时间线上方小按钮） */
  const filterAll = document.getElementById('filterAll');
  const filterMe = document.getElementById('filterMe');
  const filterHer = document.getElementById('filterHer');
  if (filterMe) filterMe.textContent = CONFIG.me;
  if (filterHer) filterHer.textContent = CONFIG.her;
  function applyFilter(f) {
    currentFilter = f;
    [[filterAll, ''], [filterMe, CONFIG.me], [filterHer, CONFIG.her]].forEach(([btn, val]) => {
      if (btn) btn.classList.toggle('active', val === f);
    });
    renderTimeline(momentsList);
  }
  if (filterAll) filterAll.addEventListener('click', () => applyFilter(''));
  if (filterMe) filterMe.addEventListener('click', () => applyFilter(CONFIG.me));
  if (filterHer) filterHer.addEventListener('click', () => applyFilter(CONFIG.her));

  /* 编辑状态：editingId 非空表示在改一条已有记录 */
  let editingId = null;
  let editingImg = null;   /* 原照片路径，换新照片成功后要删掉旧的 */
  function setEditMode(rec) {
    editingId = rec ? rec.id : null;
    editingImg = rec ? (rec.image_path || null) : null;
    if (recSave) recSave.textContent = rec ? '保存修改 ✨' : '记下来 🐾';
    if (recCancel) recCancel.hidden = !rec;
    if (rec && tip) tip('正在编辑这条小事，改完点"保存修改"');
    if (!rec && tip && formTip) { tip(''); formTip.classList.remove('err'); }
  }
  if (recCancel) recCancel.addEventListener('click', () => {
    recText.value = '';
    recPhoto.value = '';
    pickedFile = null;
    photoName.textContent = '';
    photoPreview.hidden = true;
    photoPreview.src = '';
    recDate.value = todayStr();
    selectAuthor(CONFIG.me);
    setEditMode(null);
  });

  if (!sbReady()) {
    recSave.disabled = true;
    recSave.textContent = '先在 config.js 填好 Supabase 配置 🐾';
    formTip.textContent = '配置方法见 README「云端记录怎么配置」；配置好后手机上就能直接记小事、传照片啦。';
  }

  let pickedFile = null;
  recPhoto.addEventListener('change', () => {
    pickedFile = recPhoto.files[0] || null;
    photoName.textContent = pickedFile ? pickedFile.name : '';
    if (pickedFile) {
      photoPreview.src = URL.createObjectURL(pickedFile);
      photoPreview.hidden = false;
    } else {
      photoPreview.hidden = true;
      photoPreview.src = '';
    }
  });

  function tip(msg, isErr) {
    formTip.textContent = msg;
    formTip.classList.toggle('err', !!isErr);
  }

  recSave.addEventListener('click', () => {
    const text = recText.value.trim();
    if (!text && !pickedFile && !editingImg) { tip('写点什么或者选张照片再记呀 🐾', true); return; }
    if (!recDate.value) { tip('选一下日期哦', true); return; }

    recSave.disabled = true;
    tip(pickedFile ? '正在上传照片…' : (editingId ? '正在保存修改…' : '正在保存…'));

    const newPhoto = pickedFile ? sbUploadPhoto(pickedFile) : Promise.resolve(undefined);
    newPhoto
      .then(imagePath => {
        if (editingId) {
          const changes = { happened_on: recDate.value, text: text, author: selectedAuthor };
          if (imagePath !== undefined) changes.image_path = imagePath;
          return sbUpdateMoment(editingId, changes).then(() => imagePath);
        }
        return sbAddMoment({
          happened_on: recDate.value,
          text: text,
          image_path: (imagePath === undefined ? null : imagePath),
          author: selectedAuthor
        }).then(() => imagePath);
      })
      .then(uploadedPath => {
        /* 编辑时换了新照片：旧的从存储桶里清掉 */
        if (editingId && uploadedPath !== undefined && editingImg && uploadedPath !== editingImg) {
          sbDeletePhoto(editingImg).catch(() => {});
        }
        recText.value = '';
        recPhoto.value = '';
        pickedFile = null;
        photoName.textContent = '';
        photoPreview.hidden = true;
        photoPreview.src = '';
        recDate.value = todayStr();
        selectAuthor(CONFIG.me);
        tip(editingId ? '改好啦 🐾❤️' : '记好啦 🐾❤️');
        setEditMode(null);
        loadMoments();
      })
      .catch(err => tip(err.message + '，没保存上，再试一次？', true))
      .finally(() => { recSave.disabled = false; });
  });

  /* 时间线卡片上的 ✎ 编辑 / ✕ 删除 */
  tl.addEventListener('click', e => {
    const editBtn = e.target.closest('.tl-edit');
    if (editBtn) {
      const rec = momentsList.find(t => t.id === editBtn.dataset.id);
      if (!rec) return;
      recDate.value = rec.happened_on || recDate.value;
      recText.value = rec.text || '';
      selectAuthor(rec.author || CONFIG.me);
      pickedFile = null;
      recPhoto.value = '';
      photoName.textContent = rec.image_path ? '(已有照片，选新图可替换)' : '';
      photoPreview.hidden = true;
      photoPreview.src = '';
      setEditMode(rec);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const btn = e.target.closest('.tl-del');
    if (!btn) return;
    if (!confirm('确定删掉这条小事吗？删了就找不回来啦')) return;
    btn.disabled = true;
    sbDeleteMoment(btn.dataset.id, btn.dataset.img || null)
      .then(() => loadMoments())
      .catch(err => { btn.disabled = false; alert('删除失败：' + err.message); });
  });

  /* 时间线照片点开大图（只看不删，可下载） */
  tl.addEventListener('click', e => {
    const img = e.target.closest('.tl-photo');
    if (!img) return;
    openPhotoModal({ src: img.src, manage: false });
  });
}

/* ---------- 3.html：给乖乖的信（登录后可在线编辑，存云端 settings 表） ---------- */
const letterEl = document.getElementById('letter');
const letterEditBtn = document.getElementById('letterEdit');
const LETTER_KEY = 'letter';
let letterText = CONFIG.letter || '';
let letterEditor = null;

function renderLetter() {
  if (letterEl) letterEl.textContent = letterText || '✨ 这里等你写给' + CONFIG.her + '的信……';
}
renderLetter();

function showLetterEdit(show) { if (letterEditBtn) letterEditBtn.hidden = !show; }

function refreshLetterFromCloud() {
  if (!sbReady() || !sbLoggedIn()) return;
  sbGetSetting(LETTER_KEY)
    .then(v => { if (v !== null) { letterText = v; renderLetter(); } })
    .catch(() => { /* 拉不到就用本地文案 */ });
}

function closeLetterEditor() { letterEl.innerHTML = ''; letterEditor = null; }

if (letterEditBtn) {
  letterEditBtn.addEventListener('click', () => {
    if (letterEditor) return;
    letterEl.innerHTML = '';
    const ta = document.createElement('textarea');
    ta.className = 'rec-input';
    ta.rows = 12;
    ta.maxLength = 5000;
    ta.placeholder = '写给' + CONFIG.her + '的话…… 🐾';
    ta.value = letterText;
    const row = document.createElement('div');
    row.className = 'form-photo-row';
    const save = document.createElement('button');
    save.className = 'btn'; save.type = 'button'; save.textContent = '保存 ✨';
    const cancel = document.createElement('button');
    cancel.className = 'btn'; cancel.type = 'button'; cancel.textContent = '取消';
    row.appendChild(save); row.appendChild(cancel);
    letterEl.appendChild(ta); letterEl.appendChild(row);
    letterEditor = true;

    cancel.addEventListener('click', () => { closeLetterEditor(); renderLetter(); });
    save.addEventListener('click', () => {
      const val = ta.value.trim();
      save.disabled = true; save.textContent = '保存中…';
      sbSetSetting(LETTER_KEY, val)
        .then(() => { letterText = val; closeLetterEditor(); renderLetter(); })
        .catch(err => {
          alert('保存失败：' + err.message);
          save.disabled = false; save.textContent = '保存 ✨';
        });
    });
  });
}

/* ---------- 登录门禁：配置了 Supabase 就要先对暗号 ---------- */
const loginOverlay = document.getElementById('loginOverlay');
const loginUser = document.getElementById('loginUser');
const loginPass = document.getElementById('loginPass');
const loginGo = document.getElementById('loginGo');
const loginTip = document.getElementById('loginTip');
const logoutBtn = document.getElementById('logoutBtn');
const exportBtn = document.getElementById('exportBtn');

/* ---------- 一键备份：三张表打包成 JSON 下载，每年纪念日记一份到网盘 ---------- */
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    if (!sbReady() || !sbLoggedIn()) { alert('先登录再备份哦 🐾'); return; }
    exportBtn.disabled = true;
    const oldText = exportBtn.textContent;
    exportBtn.textContent = '正在打包…';
    Promise.all([sbListMoments(), sbListPhotos(), sbListSettings()])
      .then(([moments, photos, settings]) => {
        const data = {
          app: '妻爱吾',
          exported_at: new Date().toISOString(),
          moments: moments,
          photos: photos,
          settings: settings,
          photo_urls: photos.map(p => sbPhotoUrl(p.image_path))   /* 照片直链清单，方便批量存原件 */
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        const n = new Date();
        a.href = URL.createObjectURL(blob);
        a.download = 'qiaiwu-backup-' + n.getFullYear() + pad(n.getMonth() + 1) + pad(n.getDate()) + '.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      })
      .catch(err => alert('备份失败：' + err.message))
      .finally(() => { exportBtn.disabled = false; exportBtn.textContent = oldText; });
  });
}

function unlockApp() {
  document.body.classList.remove('locked');
  if (loginOverlay) loginOverlay.hidden = true;
  if (logoutBtn) logoutBtn.hidden = false;
  if (exportBtn) exportBtn.hidden = false;
  showWhyEdit(true);
  refreshWhyFromCloud();
  showLetterEdit(true);
  refreshLetterFromCloud();
  showQuoteEdit(true);
  refreshQuotesFromCloud();
  loadMoments();
  loadPhotos();
}

function lockApp() {
  document.body.classList.add('locked');
  if (loginOverlay) loginOverlay.hidden = false;
  if (logoutBtn) logoutBtn.hidden = true;
  if (exportBtn) exportBtn.hidden = true;
  showWhyEdit(false);
  showLetterEdit(false);
  showQuoteEdit(false);
  if (loginUser && CONFIG.supabase.account && !loginUser.value) loginUser.value = CONFIG.supabase.account;
  if (loginPass) loginPass.value = '';
}

function initAuthGate() {
  if (!sbReady()) { loadMoments(); loadPhotos(); return; }   /* 未配置云端：本地模式，不上锁 */
  if (sbLoggedIn()) { unlockApp(); return; }
  lockApp();
}

if (loginGo) {
  loginGo.addEventListener('click', () => {
    const acc = loginUser.value.trim();
    if (!acc || !loginPass.value) {
      loginTip.textContent = '账号和密码都要填哦 🐾';
      loginTip.classList.add('err');
      return;
    }
    loginGo.disabled = true;
    loginTip.textContent = '正在对暗号…';
    loginTip.classList.remove('err');
    sbLogin(acc, loginPass.value)
      .then(() => { loginTip.textContent = ''; unlockApp(); })
      .catch(err => { loginTip.textContent = err.message; loginTip.classList.add('err'); })
      .finally(() => { loginGo.disabled = false; });
  });
  loginPass.addEventListener('keydown', e => { if (e.key === 'Enter') loginGo.click(); });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    sbLogout();
    if (sbReady()) lockApp();
    else location.reload();
  });
}

initAuthGate();

/* ---------- 点击冒小心心（所有页面） ---------- */
document.addEventListener('click', e => {
  const chars = ['♥', '🐾', '💛', '🌸'];
  const s = document.createElement('span');
  s.className = 'burst';
  s.textContent = chars[Math.floor(Math.random() * chars.length)];
  s.style.left = e.clientX + 'px';
  s.style.top = e.clientY + 'px';
  document.body.appendChild(s);
  setTimeout(() => s.remove(), 1400);
});
