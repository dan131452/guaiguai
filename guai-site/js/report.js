/* =====================================================
   report.html 年度报告：统计今年记下的小事和照片，盲盒揭晓
   ===================================================== */
const giftWrap = document.getElementById('giftWrap');
const giftBox = document.getElementById('giftBox');
const giftTip = document.getElementById('giftTip');
const reportBody = document.getElementById('reportBody');

const THIS_YEAR = new Date().getFullYear();
let reportData = null;    /* { moments, photos, cloud } */

/* ---------- 统计 ---------- */
function buildReport(data) {
  const { moments, photos, cloud } = data;
  const mThisYear = moments.filter(m => String(m.happened_on || '').startsWith(String(THIS_YEAR)));
  const pThisYear = photos.filter(p => String(p.created_at || '').startsWith(String(THIS_YEAR)));
  const chars = mThisYear.reduce((s, m) => s + (m.text || '').length, 0);

  /* 按月分布 + 最勤快的月份 */
  const byMonth = Array(12).fill(0);
  mThisYear.forEach(m => {
    const mm = parseInt(String(m.happened_on || '').slice(5, 7), 10);
    if (mm >= 1 && mm <= 12) byMonth[mm - 1]++;
  });
  const maxMonth = Math.max.apply(null, byMonth);
  const topMonth = maxMonth > 0 ? byMonth.indexOf(maxMonth) + 1 : 0;

  /* 两人各记了多少 */
  const byAuthor = {};
  mThisYear.forEach(m => {
    const a = m.author || '（没署名）';
    byAuthor[a] = (byAuthor[a] || 0) + 1;
  });
  const authorLines = Object.keys(byAuthor).map(a =>
    '<div class="rp-row"><span>' + esc(a) + '</span><b>' + byAuthor[a] + ' 件</b></div>').join('');

  /* 第一笔和最近一笔 */
  const sorted = mThisYear.slice().sort((a, b) => String(a.happened_on).localeCompare(String(b.happened_on)));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const daysTogether = Math.max(0, Math.floor((Date.now() - START) / DAY));
  const ann = nextAnniversary();
  const annNo = ann.getFullYear() - startYear;

  return [
    { icon: '🐾', num: daysTogether, label: '在一起的总天数，一天都没浪费' },
    { icon: '💐', num: annNo, label: '马上要庆祝第 ' + annNo + ' 个周年（' + fmtDate(ann) + '）' },
    { icon: '✏️', num: mThisYear.length, label: THIS_YEAR + ' 年记下的小事' },
    { icon: '📷', num: pThisYear.length, label: THIS_YEAR + ' 年拍下/上传的照片' },
    { icon: '📝', num: chars, label: '为对方写下的字数' },
    { icon: topMonth ? '🏅' : '🌱', num: topMonth ? topMonth + ' 月' : '—', label: topMonth ? ('最勤快的月份（' + maxMonth + ' 件小事）') : '小事的季节还没到来' }
  ].concat(
    (first || last) ? [{
      icon: '🕰️',
      num: first ? fmtTlDate(first.happened_on) : '—',
      label: first ? ('今年的第一笔：' + (first.text || '（没写字）').slice(0, 30)) : ''
    }] : [],
    last ? [{
      icon: '💌',
      num: fmtTlDate(last.happened_on),
      label: '最近的一笔：' + (last.text || '（没写字）').slice(0, 30)
    }] : []
  ).concat(
    authorLines.length ? [] : []
  ).concat(cloud ? [] : [{ icon: '⚠️', num: '本地', label: '云端没连上，只统计了内置示例' }]).map(card => (
    '<div class="rp-card"><span class="rp-icon">' + card.icon + '</span>' +
    '<div class="rp-num">' + esc(String(card.num)) + '</div>' +
    '<div class="rp-label">' + esc(card.label) + '</div></div>'
  )).join('') +
  (authorLines.length ? '<div class="rp-card rp-wide"><span class="rp-icon">🤝</span><div class="rp-label">今年谁记得多：</div>' + authorLines + '</div>' : '');
}

function loadReport() {
  if (!reportBody) return;
  if (!sbReady() || !sbLoggedIn()) {
    giftTip.textContent = '登录后才能打开今年的报告哦 🐾';
    return;
  }
  giftTip.textContent = '正在从云端翻你们的记录…';
  Promise.all([sbListMoments(), sbListPhotos()])
    .then(([moments, photos]) => {
      reportData = { moments: moments || [], photos: photos || [], cloud: true };
      giftTip.textContent = '打包好了！点上面的盒子开箱 🎁';
    })
    .catch(err => {
      reportData = { moments: seedItemsLocal(), photos: [], cloud: false };
      giftTip.textContent = '云端连不上（' + err.message + '），先看本地版本';
    });
}

function seedItemsLocal() {
  return CONFIG.timeline.map(t => ({ happened_on: t.date, text: t.text }));
}

/* ---------- 盲盒开箱 ---------- */
if (giftBox) {
  giftBox.addEventListener('click', () => {
    if (!reportData) { giftTip.textContent = '数据还没打包好，等一下再点 🐾'; return; }
    giftBox.classList.add('open');
    const box = giftBox;
    setTimeout(() => {
      giftWrap.hidden = true;
      reportBody.innerHTML = '<h2 class="section-title">' + THIS_YEAR + ' 年报告</h2>' +
        '<div class="rp-grid">' + buildReport(reportData) + '</div>' +
        '<p class="sub">— 这一年辛苦啦，明年继续 🐾❤️ —</p>';
      reportBody.hidden = false;
      /* 冒一堆小心心庆祝 */
      for (let i = 0; i < 14; i++) {
        setTimeout(() => {
          const s = document.createElement('span');
          s.className = 'burst';
          s.textContent = ['♥', '🐾', '💛', '🌸'][i % 4];
          s.style.left = (20 + Math.random() * 60) + 'vw';
          s.style.top = (30 + Math.random() * 30) + 'vh';
          document.body.appendChild(s);
          setTimeout(() => s.remove(), 1400);
        }, i * 90);
      }
      void box;
    }, 650);
  });
}

/* ---------- 登录状态联动 ---------- */
QIAIWU.onUnlock(loadReport);
QIAIWU.onLock(() => { giftTip.textContent = '登录后才能打开今年的报告哦 🐾'; });
QIAIWU.onLocal(() => { giftTip.textContent = '配置好 Supabase 并登录后，这里会生成年度报告 🎁'; });
