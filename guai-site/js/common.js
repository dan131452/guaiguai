/* =====================================================
   全站共用：工具、登录门禁、备份、推送订阅
   页面各自逻辑在 home.js / photos.js / moments.js / letter.js / report.js，
   它们通过 QIAIWU.onUnlock / onLock / onLocal 挂钩，本文件统一调度。
   ===================================================== */

/* ---------- 通用：套用称呼 ---------- */
['her1','her2','her3','her4'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = CONFIG.her; });
const meEl = document.getElementById('me1'); if(meEl) meEl.textContent = CONFIG.me;

/* ---------- 页面钩子（页面脚本注册，本文件按登录状态调用） ---------- */
const QIAIWU = {
  _h: { unlock: [], lock: [], local: [] },
  onUnlock(fn) { this._h.unlock.push(fn); },   /* 登录成功后（含刷新页面已登录） */
  onLock(fn)   { this._h.lock.push(fn); },     /* 登出/未登录上锁 */
  onLocal(fn)  { this._h.local.push(fn); },    /* 未配置云端时的本地数据兜底 */
  run(name)    { this._h[name].forEach(fn => { try { fn(); } catch (e) { console.warn('QIAIWU hook', e); } }); }
};

/* ---------- 通用工具 ---------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

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
/* 时间线日期 2026-07-25 → 2026.07.25（非标准输入原样返回） */
function fmtTlDate(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) return d || '';
  const [y, m, day] = d.split('-');
  return y + '.' + m + '.' + day;
}

/* ---------- 纪念日基础信息（全部从 CONFIG.startDate 派生） ---------- */
const DAY = 86400000;
const startDateObj = new Date(CONFIG.startDate);
const START = startDateObj.getTime();
const startYear = startDateObj.getFullYear();
const ANN_M = startDateObj.getMonth();
const ANN_D = startDateObj.getDate();
function nextAnniversary(){
  const now = new Date();
  let d = new Date(now.getFullYear(), ANN_M, ANN_D);
  if (now > d) d = new Date(now.getFullYear() + 1, ANN_M, ANN_D);
  return d;
}

/* 一次性写死的页面日期（首页徽章 / 各页页脚） */
const badgeEl = document.getElementById('badgeText');
if (badgeEl) badgeEl.textContent = '🐾 ' + fmtDate(startDateObj) + ' · 我们在一起啦';
const sinceDateEl = document.getElementById('sinceDate');
if (sinceDateEl) sinceDateEl.textContent = fmtDateCN(startDateObj);
const footDateEl = document.getElementById('startDateF');
if (footDateEl) footDateEl.textContent = fmtDate(startDateObj);

/* base64url → Uint8Array（Push 订阅的 applicationServerKey 要求二进制） */
function base64urlToUint8Array(s) {
  const pad4 = '='.repeat((4 - s.length % 4) % 4).replace(/-/g, '+');
  const b64 = (s + pad4).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

/* ---------- 登录门禁：配置了 Supabase 就要先对暗号 ---------- */
const loginOverlay = document.getElementById('loginOverlay');
const loginUser = document.getElementById('loginUser');
const loginPass = document.getElementById('loginPass');
const loginGo = document.getElementById('loginGo');
const loginTip = document.getElementById('loginTip');
const logoutBtn = document.getElementById('logoutBtn');
const exportBtn = document.getElementById('exportBtn');
const pushBtn = document.getElementById('pushBtn');

function unlockApp() {
  document.body.classList.remove('locked');
  if (loginOverlay) loginOverlay.hidden = true;
  if (logoutBtn) logoutBtn.hidden = false;
  if (exportBtn) exportBtn.hidden = false;
  refreshPushBtn();
  QIAIWU.run('unlock');
}

function lockApp() {
  document.body.classList.add('locked');
  if (loginOverlay) loginOverlay.hidden = false;
  if (logoutBtn) logoutBtn.hidden = true;
  if (exportBtn) exportBtn.hidden = true;
  if (pushBtn) pushBtn.hidden = true;
  if (loginUser && CONFIG.supabase.account && !loginUser.value) loginUser.value = CONFIG.supabase.account;
  if (loginPass) loginPass.value = '';
  QIAIWU.run('lock');
}

function initAuthGate() {
  if (!sbReady()) { QIAIWU.run('local'); return; }   /* 未配置云端：本地模式，不上锁 */
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

/* ---------- Web Push 订阅（"ta记了一件小事"互拍提醒） ----------
   仅浏览器/PWA 环境支持；Capacitor APK 的 WebView 没有 Push API，
   APK 侧的纪念日提醒走 reminders.js 的本地通知，互不冲突。 */
const PUSH_VAPID_PUBLIC = (CONFIG.supabase && CONFIG.supabase.vapidPublicKey) || '';

function pushSupported() {
  return !!(window.PushManager && window.Notification && window.serviceWorker && !window.Capacitor);
}

function refreshPushBtn() {
  if (!pushBtn) return;
  if (!sbReady() || !sbLoggedIn() || !pushSupported() || !PUSH_VAPID_PUBLIC) { pushBtn.hidden = true; return; }
  pushBtn.hidden = false;
  pushBtn.disabled = false;
  pushBtn.textContent = localStorage.getItem('qiaiwu-push-endpoint') ? '🔔 推送已开启' : '🔔 开启互拍提醒';
}

if (pushBtn) {
  pushBtn.addEventListener('click', async () => {
    if (!pushSupported()) { alert('这个环境不支持网页推送（APK 里用不了，请用浏览器打开网站开启）🐾'); return; }
    let owner = localStorage.getItem('qiaiwu-push-owner') || '';
    if (!owner) {
      owner = (prompt('这部手机是谁的呀？决定推送里怎么称呼（填 ' + CONFIG.me + ' 或 ' + CONFIG.her + '）', CONFIG.me) || '').trim();
      if (!owner) return;
      localStorage.setItem('qiaiwu-push-owner', owner);
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { alert('没有拿到通知权限，开不了推送哦 🐾'); return; }
      pushBtn.disabled = true;
      pushBtn.textContent = '正在开启…';
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64urlToUint8Array(PUSH_VAPID_PUBLIC)
        });
      }
      const j = sub.toJSON();
      await sbSaveSubscription({ endpoint: sub.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, owner: owner });
      localStorage.setItem('qiaiwu-push-endpoint', sub.endpoint);
    } catch (err) {
      alert('开启失败：' + err.message);
    } finally {
      refreshPushBtn();
    }
  });
}

/* 页面脚本注册完钩子后再跑门禁（scripts 在 body 末尾同步执行，早于 DOMContentLoaded） */
document.addEventListener('DOMContentLoaded', initAuthGate);
refreshPushBtn();   /* 立即先隐藏，避免闪现 */

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
