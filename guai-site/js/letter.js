/* =====================================================
   3.html 给乖乖的信：展示 + 登录后在线编辑（云端 settings 表）
   ===================================================== */
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

/* ---------- 登录状态联动 ---------- */
QIAIWU.onUnlock(() => {
  showLetterEdit(true);
  refreshLetterFromCloud();
});
QIAIWU.onLock(() => {
  showLetterEdit(false);
});
