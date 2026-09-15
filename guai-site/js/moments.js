/* =====================================================
   2.html 我们的小事：时间线、记一笔/编辑、按人筛选、删除、回复
   （fmtTlDate 在 common.js）
   ===================================================== */
const tl = document.getElementById('timeline');
/* 当前时间线数据（云端成功加载后缓存），编辑/筛选都要用 */
let momentsList = [];
/* 按人筛选：'' = 全部 */
let currentFilter = '';
/* momentId → replies[]（云端加载后缓存） */
const repliesByMoment = {};
/* 正在输入回复的小事 id */
let openReplyFor = null;
/* 回复时选的人（与表单顶部「是谁记的」分开，默认溶宝） */
let replyAuthor = CONFIG.me;

function repliesHtml(momentId) {
  const list = repliesByMoment[momentId] || [];
  if (!list.length && openReplyFor !== momentId) return '';
  let html = '<div class="tl-replies">';
  list.forEach(r => {
    html += '<div class="tl-reply">' +
      (r.author ? '<span class="tl-reply-who">' + esc(r.author) + '</span>' : '') +
      '<span class="tl-reply-text">' + esc(r.text) + '</span>' +
      (r.id ? '<button class="tl-reply-del" type="button" title="删除回复" data-reply-id="' + esc(r.id) + '">✕</button>' : '') +
      '</div>';
  });
  html += '</div>';
  return html;
}

function replyFormHtml(momentId) {
  if (openReplyFor !== momentId) return '';
  const meBtn = '<button class="author-btn' + (replyAuthor === CONFIG.me ? ' active' : '') +
    '" type="button" data-reply-who="' + esc(CONFIG.me) + '">' + esc(CONFIG.me) + '</button>';
  const herBtn = '<button class="author-btn' + (replyAuthor === CONFIG.her ? ' active' : '') +
    '" type="button" data-reply-who="' + esc(CONFIG.her) + '">' + esc(CONFIG.her) + '</button>';
  return '<div class="tl-reply-form" data-moment-id="' + esc(momentId) + '">' +
    '<div class="tl-reply-who-row"><span class="author-label">谁在回复</span>' + meBtn + herBtn + '</div>' +
    '<input class="rec-input tl-reply-input" type="text" maxlength="200" placeholder="回复这条小事…">' +
    '<div class="tl-reply-actions">' +
    '<button class="btn tl-reply-save" type="button">发送 🐾</button>' +
    '<button class="btn btn-plain tl-reply-cancel" type="button">取消</button>' +
    '</div></div>';
}

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
    const replyBtn = t.id
      ? '<button class="tl-reply-btn" type="button" data-id="' + esc(t.id) + '">💬 回复' +
        ((repliesByMoment[t.id] || []).length ? '（' + repliesByMoment[t.id].length + '）' : '') +
        '</button>'
      : '';
    item.innerHTML =
      '<div class="tl-dot">🐾</div>' +
      '<div class="tl-card">' + actHtml +
      '<h3>' + esc(fmtTlDate(t.happened_on || t.date)) + authorTag + '</h3>' +
      (t.text ? '<p>' + esc(t.text) + '</p>' : '') +
      imgHtml +
      replyBtn +
      repliesHtml(t.id) +
      replyFormHtml(t.id) +
      '</div>';
    tl.appendChild(item);
  });
}

const MOMENTS_CACHE = 'moments-cache-v1';
const SEED_AUTHOR = '溶宝';
const seedItems = CONFIG.timeline.map(t => ({ date: t.date, text: t.text, author: SEED_AUTHOR }));

function loadRepliesForList(list) {
  if (!sbReady() || !sbLoggedIn()) return Promise.resolve();
  const ids = (list || []).map(t => t.id).filter(Boolean);
  if (!ids.length) return Promise.resolve();
  return Promise.all(ids.map(id =>
    sbListReplies(id)
      .then(rs => { repliesByMoment[id] = rs; })
      .catch(() => { /* 单条拉失败不影响整页 */ })
  )).then(() => { if (tl) renderTimeline(momentsList); });
}

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
      return loadRepliesForList(list);
    })
    .catch(err => {
      const tlSub = document.getElementById('tlSub');
      if (tlSub && !document.querySelector('.tl-item')) {
        tlSub.textContent = '⚠️ 云端暂时连不上（' + err.message + '），先展示本地内容';
      }
      if (!document.querySelector('.tl-item')) { momentsList = seedItems; renderTimeline(seedItems); }
    });
}

/* ---------- 记一笔表单（也承担"编辑已有记录"的职责） ---------- */
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
  recDate.value = todayStr();

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

  /* 按人筛选（时间线下方小按钮） */
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
    if (formTip) formTip.textContent = '';
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
        /* 新记的小事推送给另一半（编辑不推） */
        if (!editingId && sbReady()) {
          sbNotifyPush(selectedAuthor, text || '发了一张照片 📷').catch(() => {});
        }
      })
      .catch(err => tip(err.message + '，没保存上，再试一次？', true))
      .finally(() => { recSave.disabled = false; });
  });

  /* 时间线卡片上的 ✎ 编辑 / ✕ 删除 / 💬 回复 */
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
      if (formTip) { formTip.textContent = '正在编辑这条小事，改完点"保存修改"'; formTip.classList.remove('err'); }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const delBtn = e.target.closest('.tl-del');
    if (delBtn) {
      if (!confirm('确定删掉这条小事吗？删了就找不回来啦')) return;
      delBtn.disabled = true;
      sbDeleteMoment(delBtn.dataset.id, delBtn.dataset.img || null)
        .then(() => { delete repliesByMoment[delBtn.dataset.id]; loadMoments(); })
        .catch(err => { delBtn.disabled = false; alert('删除失败：' + err.message); });
      return;
    }
    const replyBtn = e.target.closest('.tl-reply-btn');
    if (replyBtn) {
      const id = replyBtn.dataset.id;
      openReplyFor = (openReplyFor === id) ? null : id;
      renderTimeline(momentsList);
      if (openReplyFor) {
        const input = tl.querySelector('.tl-reply-input');
        if (input) input.focus();
      }
      return;
    }
    const replyWho = e.target.closest('[data-reply-who]');
    if (replyWho) {
      replyAuthor = replyWho.dataset.replyWho;
      renderTimeline(momentsList);
      const input = tl.querySelector('.tl-reply-input');
      if (input) input.focus();
      return;
    }
    const replyDel = e.target.closest('.tl-reply-del');
    if (replyDel) {
      if (!confirm('删掉这条回复吗？')) return;
      replyDel.disabled = true;
      sbDeleteReply(replyDel.dataset.replyId)
        .then(() => loadMoments())
        .catch(err => { replyDel.disabled = false; alert('删除失败：' + err.message); });
      return;
    }
    const replyCancel = e.target.closest('.tl-reply-cancel');
    if (replyCancel) {
      openReplyFor = null;
      renderTimeline(momentsList);
      return;
    }
    const replySave = e.target.closest('.tl-reply-save');
    if (replySave) {
      const form = replySave.closest('.tl-reply-form');
      const id = form && form.dataset.momentId;
      const input = form && form.querySelector('.tl-reply-input');
      const text = input ? input.value.trim() : '';
      if (!id) return;
      if (!text) { if (input) input.focus(); return; }
      if (!sbReady() || !sbLoggedIn()) { alert('先登录再回复哦 🐾'); return; }
      replySave.disabled = true;
      sbAddReply(id, replyAuthor, text)
        .then(() => { openReplyFor = null; return loadMoments(); })
        .catch(err => { replySave.disabled = false; alert('回复失败：' + err.message); });
      return;
    }
  });

  /* 时间线照片点开大图（只看不删，可下载；openPhotoModal 在 photos.js） */
  tl.addEventListener('click', e => {
    const img = e.target.closest('.tl-photo');
    if (!img) return;
    if (typeof openPhotoModal === 'function') openPhotoModal({ src: img.src, manage: false });
  });
}

/* ---------- 登录状态联动 ---------- */
QIAIWU.onUnlock(loadMoments);
QIAIWU.onLocal(loadMoments);
