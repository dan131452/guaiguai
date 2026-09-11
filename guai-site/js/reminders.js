/* =====================================================
   纪念日提醒（仅 Capacitor 原生 App 内生效）
   在手机上排程 100 天 / 周年 / 生日 的本地通知，
   浏览器或未配置生日时自动跳过，不影响网页版。

   排程要点（踩过的坑）：
   1) schedule.at 必须晚于当前时间，否则插件直接丢弃 → 当天 9 点还没到
      就保留「今天」这一次，9 点已过才顺延到明年（否则纪念日当天早上
      打开 App，提醒会被误取消）。
   2) allowWhileIdle: true —— 不传这个参数时插件用 AlarmManager.set()
      （RTC、不唤醒、可被系统合并），手机在 Doze 里睡着时通知可能延迟
      很久才弹；传了就走 setAndAllowWhileIdle，Doze 也能准时唤醒。
   3) 通知小图标必须是「透明底单色」，否则整个方形图标会被渲染成白色
      色块 → 用 icons 脚本生成的 ic_stat_guai。
   4) 自定义 channelId 必须先 createChannel，否则 Android 8+ 直接丢弃。
   ===================================================== */
(function () {
  const cap = window.Capacitor;
  if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return;
  const LN = cap.Plugins && cap.Plugins.LocalNotifications;
  if (!LN) return;

  const DAY = 86400000;
  const CHANNEL = 'guai-reminder';
  const ICON = 'ic_stat_guai';
  const COLOR = '#FF8FAB';

  const START = new Date(CONFIG.startDate).getTime();
  const startYear = new Date(CONFIG.startDate).getFullYear();
  const now = new Date();

  /* 提醒时间统一设在当天 9:00 */
  function at9(y, m, d) {
    return new Date(y, m, d, 9, 0, 0, 0);
  }
  /* 下一个「每年 M 月 D 日 9:00」：今天 9 点还没到就算今天，过了才顺延到明年 */
  function nextYearly(m, d) {
    const thisYear = at9(now.getFullYear(), m, d);
    return thisYear > now ? thisYear : at9(now.getFullYear() + 1, m, d);
  }

  const list = [];
  let nextId = 1;

  /* 1. 第 100 天纪念日（未过才提醒，一生只提醒这一次） */
  const d100 = new Date(START + 100 * DAY);
  d100.setHours(9, 0, 0, 0);
  if (d100 > now) {
    list.push({ id: nextId++, title: '🐾 我们的第 100 天', body: '今天是在一起的第 100 天，早上睁开眼就看到你，真好。', at: d100 });
  }

  /* 2. 周年纪念日（每年提醒一次） */
  const s = new Date(CONFIG.startDate);
  const ann = nextYearly(s.getMonth(), s.getDate());
  const annNo = ann.getFullYear() - startYear;
  list.push({ id: nextId++, title: '🐾 在一起 ' + annNo + ' 周年啦', body: '今天是我们的 ' + annNo + ' 周年纪念日，要去见乖乖呀。', at: ann });

  /* 3. 她的生日（config.js 填了 birthday 才提醒，格式 MM-DD） */
  const bd = CONFIG.birthday || '';
  if (/^\d{2}-\d{2}$/.test(bd)) {
    const [bm, bdd] = bd.split('-').map(Number);
    list.push({ id: nextId++, title: '🎂 乖乖的生日', body: '今天是她生日，记得第一时间祝她生日快乐！', at: nextYearly(bm - 1, bdd) });
  }

  if (!list.length) return;

  /* 排程前先清掉旧提醒，避免重复；失败不影响其它功能 */
  LN.createChannel({ id: CHANNEL, name: '纪念日提醒', description: '100 天、周年和生日的提醒', importance: 4, visibility: 1, vibration: true })
    .catch(() => {})
    .then(() => LN.checkPermissions())
    .then(p => (p && p.display === 'granted') ? null : LN.requestPermissions().catch(() => {}))
    .then(() => LN.getPending())
    .then(pending => {
      const old = (pending && pending.notifications) || [];
      return Promise.all(old.map(n => LN.cancel({ notifications: [{ id: n.id }] })));
    })
    .then(() => LN.schedule({
      notifications: list.map(n => ({
        id: n.id,
        title: n.title,
        body: n.body,
        channelId: CHANNEL,
        smallIcon: ICON,
        iconColor: COLOR,
        schedule: { at: n.at, allowWhileIdle: true }
      }))
    }))
    .catch(() => {});
})();
