/* =====================================================
   ★ 这里是整个网站的"设置区"，想改什么都在下面改 ★
   ===================================================== */
const CONFIG = {
  /* 1. 在一起的那一天（改成你们的纪念日） */
  startDate: '2026-07-25T00:00:00',

  /* 2. 称呼：her = 你叫她的昵称，me = 她叫你的昵称 */
  her: '烨航',
  me: '溶宝',

  /* 3. "为什么是 7.25"：写下那天发生的事（填一行文字即可，留空会显示提示） */
  why725: '',
  /* 4. 情话列表：想到新的就加一行，逗号隔开 */
  quotes: [
    '别人养小狗，我养了一个乖乖。',
    '你是我捡到的最好的小狗，也是我最想带回家的人。',
    '乖乖，今天也要开心哦，奖励一个亲亲。',
    '世界那么大，我的遛狗绳只牵你。',
    '你是我的软肋，也是我的小太阳。',
    '和你在一起，每天都是纪念日。',
    '汪汪！收到请回复：想我了吗？',
    '把我的小心心都给你，一根骨头都不留。',
    '有你在的地方，连风都是甜的。',
    '乖乖，别怕，我一直在。'
  ],

  /* 5. 照片墙：把照片命名为 1.jpg、2.jpg……放进 photos 文件夹，
        再在下面按顺序列出（没有照片时会显示小爪印占位） */
  photos: [
    { src: 'photos/1.jpg', caption: '我们的第 1 张照片' },
    { src: 'photos/2.jpg', caption: '第 2 张' },
    { src: 'photos/3.jpg', caption: '第 3 张' },
    { src: 'photos/4.jpg', caption: '第 4 张' },
    { src: 'photos/5.jpg', caption: '第 5 张' },
    { src: 'photos/6.jpg', caption: '第 6 张' }
  ],

  /* 6. 时间线：按时间顺序记下你们的小事
        ★ 填好下面的 supabase 配置后，"我们的小事"以云端记录为准（手机上直接记），
          这里的内容只在未配置/断网时作为兜底显示 */
  timeline: [
    { date: '2026.07.25', text: '我们在一起啦 🐾 这是故事的开始。' },
    { date: '（示例）2026.08.01', text: '【示例】在这里记下你们的小事，比如第一次一起吃饭、第一次约会……' },
    { date: '（示例）2026.08.16', text: '【示例】今天做完了给乖乖的纪念日网站，嘿嘿。' }
  ],

  /* 7. 给乖乖的信（用退行 \n 换行） */
  letter: '乖乖：\n\n见字如面呀。\n\n从 2026 年 7 月 25 日那天起，我的世界就多了一个小小的、软软的名字。别人都说我养了只小狗，可只有我知道，是你把我捡回了家。\n\n我会记得每一个和你有关的日子，会把我们的照片一张张存好，会把这个网站一直做下去——等到 1 周年、2 周年、10 周年的时候，我们都回来看今天写下的这些话。\n\n以后的日子还很长，我想牵着你的手，慢慢走。\n\n—— 爱你的宝宝 🐾',

/* 8. ★ Supabase 云同步配置（登录 + 手机上"记一笔"+ 传照片就靠它）
         1) 到 supabase.com 免费注册并新建一个项目
         2) 打开 supabase-setup.sql，在 SQL Editor 里运行（建表和权限）
         3) Supabase → Authentication → Users → Add user 建登录账号：
           邮箱填 wangrong@guai.site，密码填你们的密码，勾选 Auto Confirm User
           （邮箱 = 下面 account + emailSuffix，两边保持一致）
         4) 项目设置 → API，把 url 和 anonKey 复制过来 */
  supabase: {
    url: 'https://wwupbdkkvotqlihbujjx.supabase.co',                    /* 例如 'https://abcdxxxx.supabase.co' */
    anonKey: 'sb_publishable_D7yL8_0Dlu60_68XG1LQZQ_Ga8V2XY-',                /* 项目设置 → API → Project API keys → anon public */
    bucket: 'moments',          /* 照片存储桶名，和 SQL 里保持一致即可 */
    account: 'wangrong',        /* 登录账号（登录框会预填） */
    emailSuffix: '@guai.site',  /* 账号会拼成 wangrong@guai.site，要和 Supabase 里建的用户邮箱一致 */

    /* Web Push 推送用公钥（私钥在 vapid-keys.json，别提交仓库；
       要设成 Supabase Edge Function 的 secrets，见 README「互拍推送」） */
    vapidPublicKey: 'BPDVMM2Bqf0WlOff8-8BUN4DNt0xE5y9WK6aBwuTdP5f6JL6ufGT4_l4cAGGW4G70RUVkNpMshCr5X8FTmEmXn4'
  },

  /* 9. 她的生日（可选）：填了的话，App 里到生日当天 9 点会弹通知提醒你；
        格式 'MM-DD'（如 12-01 表示 12 月 1 日），空着就不提醒生日 */
  birthday: ''
};
/* =====================================================
   设置区结束，下面不用改啦
   ===================================================== */