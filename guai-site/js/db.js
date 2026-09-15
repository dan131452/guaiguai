/* =====================================================
   Supabase 云端接入（账号登录版）
   直接用 fetch 调 Supabase REST API，不引入任何依赖，
   保持 file:// 下也能打开（未配置时自动降级为本地内容）。
   配置见 js/config.js 的 CONFIG.supabase，
   建表/建账号步骤见 supabase-setup.sql 和 README。
   ===================================================== */

const SB_SESSION_KEY = 'sb-session-v1';

/* ---------- Supabase 配置是否已填写 ---------- */
function sbReady() {
  const s = CONFIG.supabase || {};
  return !!(s.url && s.anonKey);
}

function sbBase() {
  return CONFIG.supabase.url.replace(/\/+$/, '');
}

/* ---------- 登录会话（存 localStorage，token 过期自动刷新） ---------- */
function sbSession() {
  try { return JSON.parse(localStorage.getItem(SB_SESSION_KEY) || 'null'); }
  catch (e) { return null; }
}

function sbSaveSession(data) {
  localStorage.setItem(SB_SESSION_KEY, JSON.stringify({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() / 1000 + (data.expires_in || 3600)
  }));
}

function sbClearSession() {
  localStorage.removeItem(SB_SESSION_KEY);
}

/* 是否处于有效登录态（token 还能用 30 秒以上） */
function sbLoggedIn() {
  const s = sbSession();
  return !!(s && s.access_token && s.expires_at > Date.now() / 1000 + 30);
}

/* ---------- 登录：账号 wangrong → 邮箱 wangrong@xxx 走 Supabase Auth ---------- */
function sbLogin(account, password) {
  const email = (account || '').trim() + (CONFIG.supabase.emailSuffix || '');
  const url = sbBase() + '/auth/v1/token?grant_type=password';
  return fetch(url, {
    method: 'POST',
    headers: { 'apikey': CONFIG.supabase.anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: password })
  }).then(resp =>
    resp.json().then(data => {
      if (!resp.ok) {
        const msg = data.error_description || data.error || data.msg || '';
        throw new Error(msg.indexOf('Invalid login') > -1 ? '账号或密码不对哦 🐾' : ('登录失败：' + msg));
      }
      sbSaveSession(data);
      return true;
    })
  );
}

function sbLogout() {
  const s = sbSession();
  sbClearSession();
  if (s && s.access_token) {
    /* 服务端注销，失败也不影响本地登出 */
    fetch(sbBase() + '/auth/v1/logout', {
      method: 'POST',
      headers: { 'apikey': CONFIG.supabase.anonKey, 'Authorization': 'Bearer ' + s.access_token }
    }).catch(() => {});
  }
}

/* token 快过期时用 refresh_token 续期（默认 1 小时有效） */
function sbRefreshSession() {
  const s = sbSession();
  if (!s || !s.refresh_token) return Promise.reject(new Error('未登录'));
  const url = sbBase() + '/auth/v1/token?grant_type=refresh_token';
  return fetch(url, {
    method: 'POST',
    headers: { 'apikey': CONFIG.supabase.anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: s.refresh_token })
  }).then(resp =>
    resp.json().then(data => {
      if (!resp.ok) { sbClearSession(); throw new Error('登录已过期，请重新登录'); }
      sbSaveSession(data);
    })
  );
}

/* 所有云端请求前调用：过期就续期 */
async function sbEnsureFresh() {
  const s = sbSession();
  if (s && s.expires_at && s.expires_at < Date.now() / 1000 + 60) {
    await sbRefreshSession();
  }
}

/* ---------- 公共请求头（带登录 token，配合数据库 RLS 校验） ---------- */
function sbHeaders(extra) {
  const s = sbSession();
  const h = {
    'apikey': CONFIG.supabase.anonKey,
    'Authorization': 'Bearer ' + ((s && s.access_token) ? s.access_token : CONFIG.supabase.anonKey)
  };
  return Object.assign(h, extra || {});
}

/* ---------- 读取所有记录（按日期倒序） ---------- */
async function sbListMoments() {
  await sbEnsureFresh();
  const url = sbBase() + '/rest/v1/moments?select=id,happened_on,text,author,image_path,created_at&order=happened_on.desc,created_at.desc';
  return fetch(url, { headers: sbHeaders() }).then(resp => {
    if (!resp.ok) throw new Error('读取失败 HTTP ' + resp.status);
    return resp.json();
  });
}

/* ---------- 照片墙：独立 photos 表（与小事 moments 表分开） ---------- */
async function sbListPhotos() {
  await sbEnsureFresh();
  const url = sbBase() + '/rest/v1/photos?select=id,image_path,caption,created_at&order=created_at.desc';
  return fetch(url, { headers: sbHeaders() }).then(resp => {
    if (!resp.ok) throw new Error('读取失败 HTTP ' + resp.status);
    return resp.json();
  });
}

async function sbAddPhoto(imagePath, caption) {
  await sbEnsureFresh();
  const url = sbBase() + '/rest/v1/photos';
  return fetch(url, {
    method: 'POST',
    headers: sbHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
    body: JSON.stringify({ image_path: imagePath, caption: caption || '' })
  }).then(resp => {
    if (!resp.ok) throw new Error('照片记录保存失败 HTTP ' + resp.status);
    return true;
  });
}

async function sbDeletePhotoRecord(id, imagePath) {
  await sbEnsureFresh();
  const url = sbBase() + '/rest/v1/photos?id=eq.' + encodeURIComponent(id);
  const jobs = [fetch(url, { method: 'DELETE', headers: sbHeaders() })];
  if (imagePath) jobs.push(sbDeletePhoto(imagePath));
  return Promise.all(jobs).then(rs => {
    if (!rs[0].ok) throw new Error('删除失败 HTTP ' + rs[0].status);
    return true;
  });
}

/* ---------- 新增一条记录 ---------- */
async function sbAddMoment(item) {
  await sbEnsureFresh();
  const url = sbBase() + '/rest/v1/moments';
  return fetch(url, {
    method: 'POST',
    headers: sbHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
    body: JSON.stringify(item)
  }).then(resp => {
    if (!resp.ok) throw new Error('保存失败 HTTP ' + resp.status);
    return true;
  });
}

/* ---------- 删除记录（顺带删云端照片） ---------- */
async function sbDeleteMoment(id, imagePath) {
  await sbEnsureFresh();
  const url = sbBase() + '/rest/v1/moments?id=eq.' + encodeURIComponent(id);
  const jobs = [fetch(url, { method: 'DELETE', headers: sbHeaders() })];
  if (imagePath) jobs.push(sbDeletePhoto(imagePath));
  return Promise.all(jobs).then(rs => {
    if (!rs[0].ok) throw new Error('删除失败 HTTP ' + rs[0].status);
    return true;
  });
}

/* ---------- 备份导出：三张表全量拉取 ---------- */
async function sbListSettings() {
  await sbEnsureFresh();
  const url = sbBase() + '/rest/v1/settings?select=key,value,updated_at&order=key.asc';
  return fetch(url, { headers: sbHeaders() }).then(resp => {
    if (!resp.ok) throw new Error('读取失败 HTTP ' + resp.status);
    return resp.json();
  });
}

/* ---------- 照片说明（photos.caption） ---------- */
async function sbUpdatePhotoCaption(id, caption) {
  await sbEnsureFresh();
  const url = sbBase() + '/rest/v1/photos?id=eq.' + encodeURIComponent(id);
  return fetch(url, {
    method: 'PATCH',
    headers: sbHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
    body: JSON.stringify({ caption: caption })
  }).then(resp => {
    if (!resp.ok) throw new Error('保存说明失败 HTTP ' + resp.status);
    return true;
  });
}

/* ---------- 编辑一条小事（文字/日期/作者/换照片；image_path 传 null 表示不动） ---------- */
async function sbUpdateMoment(id, changes) {
  await sbEnsureFresh();
  const url = sbBase() + '/rest/v1/moments?id=eq.' + encodeURIComponent(id);
  return fetch(url, {
    method: 'PATCH',
    headers: sbHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
    body: JSON.stringify(changes)
  }).then(resp => {
    if (!resp.ok) throw new Error('更新失败 HTTP ' + resp.status);
    return true;
  });
}

/* ---------- 小事回复（moment_replies） ---------- */
async function sbListReplies(momentId) {
  await sbEnsureFresh();
  const url = sbBase() + '/rest/v1/moment_replies?select=id,moment_id,author,text,created_at&moment_id=eq.' +
    encodeURIComponent(momentId) + '&order=created_at.asc';
  return fetch(url, { headers: sbHeaders() }).then(resp => {
    if (!resp.ok) throw new Error('读取回复失败 HTTP ' + resp.status);
    return resp.json();
  });
}

async function sbAddReply(momentId, author, text) {
  await sbEnsureFresh();
  const url = sbBase() + '/rest/v1/moment_replies';
  return fetch(url, {
    method: 'POST',
    headers: sbHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
    body: JSON.stringify({ moment_id: momentId, author: author || '', text: text || '' })
  }).then(resp => {
    if (!resp.ok) throw new Error('回复保存失败 HTTP ' + resp.status);
    return true;
  });
}

async function sbDeleteReply(id) {
  await sbEnsureFresh();
  const url = sbBase() + '/rest/v1/moment_replies?id=eq.' + encodeURIComponent(id);
  return fetch(url, { method: 'DELETE', headers: sbHeaders() }).then(resp => {
    if (!resp.ok) throw new Error('删除回复失败 HTTP ' + resp.status);
    return true;
  });
}

/* ---------- 上传照片（先压缩，随机文件名） ---------- */
async function sbUploadPhoto(file) {
  await sbEnsureFresh();
  return compressImage(file).then(blob => {
    const ext = (blob && blob.type === 'image/png') ? 'png' : 'jpg';
    const uid = (crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now() + '-' + Math.random().toString(36).slice(2, 10);
    const path = 'moments/' + uid + '.' + ext;
    const url = sbBase() + '/storage/v1/object/' + CONFIG.supabase.bucket + '/' + path;
    return fetch(url, {
      method: 'POST',
      headers: sbHeaders({ 'Content-Type': blob.type, 'x-upsert': 'false' }),
      body: blob
    }).then(resp => {
      if (!resp.ok) throw new Error('照片上传失败 HTTP ' + resp.status);
      return path;
    });
  });
}

async function sbDeletePhoto(path) {
  await sbEnsureFresh();
  const url = sbBase() + '/storage/v1/object/' + CONFIG.supabase.bucket + '/' + path;
  return fetch(url, { method: 'DELETE', headers: sbHeaders() });
}

/* ---------- 页面可编辑内容（settings 键值表，如"为什么是 7.25"） ---------- */
async function sbGetSetting(key) {
  await sbEnsureFresh();
  const url = sbBase() + '/rest/v1/settings?select=value&key=eq.' + encodeURIComponent(key);
  return fetch(url, { headers: sbHeaders() }).then(resp => {
    if (!resp.ok) throw new Error('读取失败 HTTP ' + resp.status);
    return resp.json();
  }).then(rows => (rows && rows.length) ? rows[0].value : null);
}

async function sbSetSetting(key, value) {
  await sbEnsureFresh();
  const url = sbBase() + '/rest/v1/settings?on_conflict=key';
  return fetch(url, {
    method: 'POST',
    headers: sbHeaders({ 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' }),
    body: JSON.stringify({ key: key, value: value, updated_at: new Date().toISOString() })
  }).then(resp => {
    if (!resp.ok) throw new Error('保存失败 HTTP ' + resp.status);
    return true;
  });
}

/* ---------- Web Push：订阅保存 + 新小事通知 ----------
   订阅存 push_subscriptions 表（endpoint 唯一，重复开启自动覆盖）；
   实际推送由 Supabase Edge Function notify-moment 完成。 */
async function sbSaveSubscription(sub) {
  await sbEnsureFresh();
  const url = sbBase() + '/rest/v1/push_subscriptions?on_conflict=endpoint';
  return fetch(url, {
    method: 'POST',
    headers: sbHeaders({ 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' }),
    body: JSON.stringify({
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
      owner: sub.owner,
      updated_at: new Date().toISOString()
    })
  }).then(resp => {
    if (!resp.ok) throw new Error('订阅保存失败 HTTP ' + resp.status);
    return true;
  });
}

/* 通知另一半："xx 记了一件小事"。函数未部署时静默失败，不影响记录 */
async function sbNotifyPush(author, text) {
  await sbEnsureFresh();
  const s = sbSession();
  const url = sbBase() + '/functions/v1/notify-moment';
  return fetch(url, {
    method: 'POST',
    headers: sbHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + ((s && s.access_token) ? s.access_token : CONFIG.supabase.anonKey)
    }),
    body: JSON.stringify({ author: author, text: text || '' })
  }).then(resp => {
    if (!resp.ok) throw new Error('推送触发失败 HTTP ' + resp.status);
    return true;
  });
}

/* 照片公开访问地址（bucket 设为 public） */
function sbPhotoUrl(imagePath) {
  if (!imagePath) return '';
  return sbBase() + '/storage/v1/object/public/' + CONFIG.supabase.bucket + '/' + imagePath;
}

/* ---------- 图片压缩：长边压到 1600px、JPEG 质量 0.85 ----------
   手机原片动辄 5~10MB，先压再传省流量也省存储。
   GIF（动图）直接原样上传，避免压成静止图。 */
function compressImage(file) {
  if (file.type === 'image/gif') return Promise.resolve(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const MAX = 1600;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          URL.revokeObjectURL(objUrl);
          resolve(blob && blob.size < file.size ? blob : file);
        }, 'image/jpeg', 0.85);
      } catch (err) {
        URL.revokeObjectURL(objUrl);
        resolve(file);   /* 压缩失败就用原图 */
      }
    };
    img.onerror = () => { URL.revokeObjectURL(objUrl); reject(new Error('图片读取失败')); };
    img.src = objUrl;
  });
}
