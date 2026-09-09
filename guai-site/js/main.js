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

/* ---------- 首页：情话轮播 ---------- */
const quoteEl = document.getElementById('quote');
if (quoteEl) {
  let qi = -1;
  function nextQuote(){
    let next;
    do { next = Math.floor(Math.random() * CONFIG.quotes.length); } while (next === qi && CONFIG.quotes.length > 1);
    qi = next;
    quoteEl.classList.add('fade');
    setTimeout(() => { quoteEl.textContent = CONFIG.quotes[qi]; quoteEl.classList.remove('fade'); }, 350);
  }
  nextQuote();
  const quoteBtn = document.getElementById('quoteBtn');
  if (quoteBtn) quoteBtn.addEventListener('click', nextQuote);
}

/* ---------- 1.html：照片墙 ---------- */
const grid = document.getElementById('photoGrid');
if (grid) {
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
function renderTimeline(items) {
  if (!tl) return;
  tl.innerHTML = '';
  items.forEach(t => {
    const item = document.createElement('div');
    item.className = 'tl-item';
    const imgHtml = t.image_path
      ? '<img class="tl-photo" loading="lazy" src="' + esc(t.__imgUrl || sbPhotoUrl(t.image_path)) + '" alt="">'
      : '';
    const delHtml = t.id
      ? '<button class="tl-del" type="button" title="删除这条" data-id="' + esc(t.id) + '" data-img="' + esc(t.image_path || '') + '">✕</button>'
      : '';
    item.innerHTML =
      '<div class="tl-dot">🐾</div>' +
      '<div class="tl-card">' + delHtml +
      '<h3>' + esc(fmtTlDate(t.happened_on || t.date)) + '</h3>' +
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
    renderTimeline(seedItems);
    return;
  }
  /* 先展示上次的缓存，立刻有内容；再拉云端最新 */
  try {
    const cached = JSON.parse(localStorage.getItem(MOMENTS_CACHE) || 'null');
    if (cached && cached.length) renderTimeline(cached);
  } catch (e) { /* 缓存坏了就忽略 */ }

  sbListMoments()
    .then(list => {
      renderTimeline(list);
      try { localStorage.setItem(MOMENTS_CACHE, JSON.stringify(list)); } catch (e) {}
    })
    .catch(err => {
      const tlSub = document.getElementById('tlSub');
      if (tlSub && !document.querySelector('.tl-item')) {
        tlSub.textContent = '⚠️ 云端暂时连不上（' + err.message + '），先展示本地内容';
      }
      if (!document.querySelector('.tl-item')) renderTimeline(seedItems);
    });
}

/* 2.html：记一笔表单 */
const formTip = document.getElementById('formTip');
const recDate = document.getElementById('recDate');
const recText = document.getElementById('recText');
const recPhoto = document.getElementById('recPhoto');
const photoName = document.getElementById('photoName');
const photoPreview = document.getElementById('photoPreview');
const recSave = document.getElementById('recSave');

if (recDate) {
  /* 日期默认今天 */
  (function () {
    const n = new Date();
    recDate.value = n.getFullYear() + '-' + pad(n.getMonth() + 1) + '-' + pad(n.getDate());
  })();

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
    if (!text && !pickedFile) { tip('写点什么或者选张照片再记呀 🐾', true); return; }
    if (!recDate.value) { tip('选一下日期哦', true); return; }

    recSave.disabled = true;
    tip(pickedFile ? '正在上传照片…' : '正在保存…');

    (pickedFile ? sbUploadPhoto(pickedFile) : Promise.resolve(null))
      .then(imagePath => sbAddMoment({
        happened_on: recDate.value,
        text: text,
        image_path: imagePath
      }))
      .then(() => {
        recText.value = '';
        recPhoto.value = '';
        pickedFile = null;
        photoName.textContent = '';
        photoPreview.hidden = true;
        photoPreview.src = '';
        tip('记好啦 🐾❤️');
        loadMoments();
      })
      .catch(err => tip(err.message + '，没保存上，再试一次？', true))
      .finally(() => { recSave.disabled = false; });
  });

  /* 删除某条记录（点卡片右上角的 ✕） */
  tl.addEventListener('click', e => {
    const btn = e.target.closest('.tl-del');
    if (!btn) return;
    if (!confirm('确定删掉这条小事吗？删了就找不回来啦')) return;
    btn.disabled = true;
    sbDeleteMoment(btn.dataset.id, btn.dataset.img || null)
      .then(() => loadMoments())
      .catch(err => { btn.disabled = false; alert('删除失败：' + err.message); });
  });
}

/* ---------- 3.html：给乖乖的信 ---------- */
const letterEl = document.getElementById('letter');
if (letterEl) letterEl.textContent = CONFIG.letter;

/* ---------- 登录门禁：配置了 Supabase 就要先对暗号 ---------- */
const loginOverlay = document.getElementById('loginOverlay');
const loginUser = document.getElementById('loginUser');
const loginPass = document.getElementById('loginPass');
const loginGo = document.getElementById('loginGo');
const loginTip = document.getElementById('loginTip');
const logoutBtn = document.getElementById('logoutBtn');

function unlockApp() {
  document.body.classList.remove('locked');
  if (loginOverlay) loginOverlay.hidden = true;
  if (logoutBtn) logoutBtn.hidden = false;
  showWhyEdit(true);
  refreshWhyFromCloud();
  loadMoments();
}

function lockApp() {
  document.body.classList.add('locked');
  if (loginOverlay) loginOverlay.hidden = false;
  if (logoutBtn) logoutBtn.hidden = true;
  showWhyEdit(false);
  if (loginUser && CONFIG.supabase.account && !loginUser.value) loginUser.value = CONFIG.supabase.account;
  if (loginPass) loginPass.value = '';
}

function initAuthGate() {
  if (!sbReady()) { loadMoments(); return; }   /* 未配置云端：本地模式，不上锁 */
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
