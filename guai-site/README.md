# 妻爱吾 🐾 — 给爱的人的纪念日 App

一套"无框架前端 + Supabase 云端"的情侣纪念应用:在一起天数、周年倒计时、云端照片墙、随手记小事、可在线编辑的信。两个人各自登录,看到同一份数据;可以装成手机 App(安卓 PWA / APK),断网也能打开。

---

## 一、功能总览

四个页面,底部 Tab 导航切换:

| 页面 | 内容 | 能否在线编辑 |
|---|---|---|
| `index.html` 首页 | 在一起天数实时计时、1 周年/100 天倒计时、**为什么是 7.25**、情话轮播 | ✏️ 7.25 的故事登录后可编辑 |
| `1.html` 照片墙 | 云端照片九宫格、点开看大图、删除、右下角 📷 上传(手机调起相册/相机) | ✅ 上传/删除 |
| `2.html` 我们的小事 | 时间线:记一笔(日期+文字+照片)、删除 | ✅ 记录/删除 |
| `3.html` 一封信 | 给她的信 | ✏️ 登录后整封可编辑 |

通用能力:

- **登录门禁**:打开先对暗号(账号 `wangrong`),账号密码存 Supabase Auth 服务端,网页代码里看不到;云数据只有登录后才能读写(RLS)。
- **离线可用**:Service Worker 缓存页面,断网显示最近内容。
- **一键安装**:安卓 Chrome 打开会浮出"📲 把 App 装到桌面",装成全屏 WebAPK。
- **图片自动压缩**:上传前压到长边 1600px,省流量省存储。

## 二、架构与技术栈

```
┌──────────────────────────────────────────────┐
│  guai-site(纯静态网站,零构建零依赖)              │
│  HTML/CSS/JS 多页面 + PWA(manifest + SW)        │
├──────────────────────────────────────────────┤
│  js/db.js —— fetch 直连 Supabase REST          │
│  登录(JWT) / 表读写 / 照片上传压缩               │
├──────────────────────────────────────────────┤
│  Supabase(后端即服务,免运维)                    │
│  Auth 账号 · Postgres+RLS · Storage 照片桶      │
└──────────────────────────────────────────────┘
         ▲
         │ 同一份网站
   guai-app(Capacitor 安卓壳,打成 APK)
```

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | 原生 HTML5 / CSS3 / ES6+ | 无框架、无打包,一个 `main.js` 按元素守卫服务全部 4 页 |
| PWA | manifest + Service Worker + beforeinstallprompt | network-first 缓存:联网拿最新,断网回退 |
| 后端 | Supabase(Auth / PostgREST / Storage) | 三张表:`moments` 小事、`photos` 照片墙、`settings` 可编辑内容;RLS 限登录用户 |
| 安卓 | Capacitor(WebView 壳) | `guai-app/`,`webDir` 直接指向本目录,appName 已设为"妻爱吾" |
| 工具 | Git + Node 脚本 | 图标生成用纯 Node(zlib 手写 PNG 编码),安卓图标用 sharp |

**数据三层降级**:云端 → localStorage 缓存 → `js/config.js` 兜底文案,断网或未配置时页面不空。

## 三、目录结构

```
guai-site/
├── index.html / 1.html / 2.html / 3.html   ← 四个页面
├── css/style.css                           ← 全部样式
├── js/
│   ├── config.js        ★ 配置区:纪念日/昵称/情话/兜底内容/Supabase 密钥
│   ├── db.js            ← 云端数据层(登录、增删查、上传压缩)
│   ├── main.js          ← 页面逻辑(四页共用)
│   └── register-sw.js   ← SW 注册 + 安卓一键安装
├── sw.js                ← Service Worker
├── manifest.json        ← PWA 清单(App 名/图标)
├── supabase-setup.sql   ★ 云端建表脚本(可重复执行)
├── icons/ + scripts/    ← 图标与生成脚本
├── photos/              ← 本地照片兜底(未登录时照片墙显示)
└── README.md / CHANGELOG.md

../guai-app/             ← Capacitor 安卓工程(独立目录,打 APK 用)
```

## 四、快速开始(本地预览)

```bash
cd guai-site
python -m http.server 8137        # 或 npx serve .
# 浏览器打开 http://localhost:8137
```

> 双击 index.html 也能看,但登录、云端数据要在 http 环境下才完整。

## 五、Supabase 配置(只需一次,已完成可跳过)

1. 注册 [supabase.com](https://supabase.com) → New project(区域选 Singapore)。
2. SQL Editor 里整个粘贴 `supabase-setup.sql` → RUN(自动建 `moments` / `photos` / `settings` 三张表、RLS 策略和照片桶;可重复执行不丢数据)。
3. **建登录账号**:Authentication → Users → Add user,邮箱 `wangrong@guai.site`(= `config.js` 里 `account` + `emailSuffix`),密码自定,勾选 **Auto Confirm User**。
4. Project Settings → API,把 URL 和 anon key 填进 `js/config.js` 的 `CONFIG.supabase`。

## 六、部署与安装

**部署网站(PWA)**:静态托管任选——GitHub Pages / Cloudflare Pages(国内推荐后者)。push 后自动生效;Service Worker 是 network-first,她下次打开就是新版,大改后建议把 `sw.js` 里 `CACHE` 版本号 +1。

**安装到手机**:安卓 Chrome 打开网址 → 点"📲 把 App 装到桌面"(或菜单 → 安装应用),得到全屏无地址栏的 App 图标。

**打包安卓 APK**:`guai-app/` 是 Capacitor 工程(appName"妻爱吾")。网站有改动后:

```bash
cd guai-app
npx cap sync android        # 把 ../guai-site 同步进安卓工程
# Android Studio 打开 guai-app/android → Build APK
```

## 七、日常维护

**平时记录(不碰代码)**:登录后在 2 页记小事/传照片、1 页管理照片墙、首页和 3 页点 ✏️ 改 7.25 故事和信。

**改静态内容(要改代码)**,对照表:

| 想改什么 | 改哪里 |
|---|---|
| 在一起的日期、昵称 | `js/config.js` 的 `startDate` / `her` / `me` |
| 情话列表 | `config.js` 的 `quotes` 数组加一行 |
| 未登录时显示的兜底内容 | `config.js` 的 `why725` / `timeline` / `letter` |
| 页面文案/结构 | 对应 `*.html` |
| 样式 | `css/style.css` |
| 云端接口 | `js/db.js`;页面逻辑 `js/main.js` |
| 数据库表/权限 | `supabase-setup.sql`,改完去 SQL Editor 重跑 |

**改密码 / 加账号**:Supabase → Authentication → Users 里重置或新增(新账号邮箱要符合 `账号名@guai.site` 的拼法)。

**备份**:Supabase Dashboard → Table Editor 导出 CSV;Storage 里下载照片原件。数据都在云端,换手机重装登录即恢复。

## 八、常见问题

| 现象 | 处理 |
|---|---|
| 登录提示账号或密码不对 | 检查 Users 里邮箱是否 `wangrong@guai.site`、是否勾了 Auto Confirm |
| 保存/读取报 HTTP 4xx | SQL 没跑全,重跑一遍 `supabase-setup.sql` |
| 照片传成功但不显示 | Storage → `moments` 桶需为 public |
| 改了代码手机上没更新 | 刷新一次;或 bump `sw.js` 的 `CACHE` 版本号 |
| 想看本地效果但没有登录框 | 正常:没填 Supabase 配置时自动降级为本地模式 |

## 九、隐私与安全

- 密码只存 Supabase 服务端,前端只拿临时 token(1 小时过期自动续期)。
- 三张表 RLS 限制"仅登录用户读写";照片桶公开读但文件名是随机 UUID,猜不到。
- `anon key` 是公开密钥,进仓库没问题;但仓库建议保持私有(信、情话等静态内容本身无登录保护)。
- 网址不要发给外人;密码定期在 Supabase 后台换。

---

made with ❤️ · 版本记录见 [CHANGELOG.md](CHANGELOG.md) · 许可协议 [MIT](../LICENSE)
