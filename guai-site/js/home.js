/* =====================================================
   index.html 首页：天数倒计时、"为什么是 7.25"编辑、情话编辑
   ===================================================== */

/* ---------- 天数 & 倒计时 ---------- */
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

/* ---------- "为什么是 7.25"（登录后可在线编辑，存云端 settings 表） ---------- */
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

/* ---------- 情话轮播（登录后可在线编辑，存云端 settings 表） ---------- */
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

/* ---------- 登录状态联动 ---------- */
QIAIWU.onUnlock(() => {
  showWhyEdit(true);
  refreshWhyFromCloud();
  showQuoteEdit(true);
  refreshQuotesFromCloud();
});
QIAIWU.onLock(() => {
  showWhyEdit(false);
  showQuoteEdit(false);
});
