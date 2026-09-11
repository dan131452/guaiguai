/* =====================================================
   纪念日提醒（仅 Capacitor 原生 App 内生效）
   在手机上排程 100 天 / 周年 / 生日 的本地通知，
   浏览器或未配置生日时自动跳过，不影响网页版。
   ===================================================== */
(function () {
  const cap = window.Capacitor;
  if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return;
  const LocalNotifications = cap.Plugins && cap.Plugins.LocalNotifications;
  if (!LocalNotifications) return;

  const DAY = 86400000;
  const pad = n => String(n).padStart(2, '0');
  const START = new Date(CONFIG.startDate).getTime();
  const startYear = new Date(CONFIG.startDate).getFullYear();

  /* 提醒时间统一设在当天 9:00 */
  function at9(date) {
    const d = new Date(date);
    d.setHours(9, 0, 0, 0);
    return d;
  }

  /* 下一个周年纪念日 */
  function nextAnniversary(now) {
    const s = new Date(CONFIG.startDate);
    const m = s.getMonth(), d = s.getDate();
    let a = new Date(now.getFullYear(), m, d);
    if (now > a) a = new Date(now.getFullYear() + 1, m, d);
    return a;
  }

  const now = new Date();
  const notifications = [];
  let nextId = 1;

  /* 1. 第 100 天纪念日（未过才提醒，一生只提醒这一次） */
  const d100 = at9(START + 100 * DAY);
  if (d100 > now) {
    notifications.push({ id: nextId++, title: '🐾 我们的第 100 天', body: '今天是在一起的第 100 天，早上睁开眼就看到你，真好。', at: d100 });
  }

  /* 2. 周年纪念日（每年提醒一次） */
  const ann = nextAnniversary(now);
  const annNo = ann.getFullYear() - startYear;
  notifications.push({ id: nextId++, title: '🐾 在一起 ' + annNo + ' 周年啦', body: '今天是我们的 ' + annNo + ' 周年纪念日，要去见乖乖呀。', at: at9(ann) });

  /* 3. 她的生日（config.js 填了 birthday 才提醒，格式 MM-DD） */
  const bd = CONFIG.birthday || '';
  if (/^\d{2}-\d{2}$/.test(bd)) {
    const [bm, bdd] = bd.split('-').map(Number);
    let b = new Date(now.getFullYear(), bm - 1, bdd);
    if (now > b) b = new Date(now.getFullYear() + 1, bm - 1, bdd);
    notifications.push({ id: nextId++, title: '🎂 乖乖的生日', body: '今天是她生日，记得第一时间祝她生日快乐！', at: at9(b) });
  }

  /* 排程前先清掉旧提醒，避免重复；失败不影响其它功能 */
  LocalNotifications.requestPermissions()
    .then(() => LocalNotifications.getPending())
    .then(pending => {
      const old = (pending && pending.notifications) || [];
      return Promise.all(old.map(n => LocalNotifications.cancel({ notifications: [{ id: n.id }] })));
    })
    .then(() => LocalNotifications.schedule({
      notifications: notifications.map(n => ({ id: n.id, title: n.title, body: n.body, schedule: { at: n.at } }))
    }))
    .catch(() => {});
})();