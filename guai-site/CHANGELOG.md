# 更新日志

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 格式，版本号遵循语义化版本。

## [Unreleased]
- 待添加：1 周年纪念版（2027.07.25）

### ✨ 新增（2026-09-15 · 盛世美照）
- **盛世美照**：照片墙右下角 🐱 小滑窗入口 → `beauty.html` 专属相册（上传/大图/说明/下载/删除），云端表 `beauty_photos`
- **滑窗 B 版**：入口半屏内横滑展示最新 3 张美照，可下滑关闭；未登录/无图时显示提示

### 🛠 修复（2026-09-15 · 回复作者/首页称呼/安卓相册）
- **回复可选人**：小事回复表单新增「溶宝 / 烨航」选择，不再跟发布人绑死
- **首页称呼**：副标题与倒计时文案统一为「溶宝」
- **安卓存相册**：新增 `GallerySaver` 原生插件，App 内下载直接写进系统相册 `图片/妻爱吾`；小事页也加载大图弹窗，两边都能下载

### ✨ 新增 / 🛠 变更（2026-09-14 · 称呼与照片说明/回复）
- **首页称呼**：主标题改为「和王溶老婆在一起的每一天」（天数仍按纪念日实时计算）
- **照片说明**：大图下方展示已存说明；新增「删说明」；未写说明的照片墙不再显示占位文案
- **照片下载**：优先走系统 Web Share（手机上更易存进相册），失败再退回 blob 下载 / 新标签长按保存
- **小事回复**：时间线卡片支持 💬 回复与删除回复（`moment_replies` 表）；须在 Supabase SQL Editor 重跑 `supabase-setup.sql`（含 moments/photos 的 update 策略与回复表）

### ✨ 新增（2026-09-13 · 报告页/互拍推送/工程健康）
- **年度报告页**：新增 report.html + 底部导航第 5 个入口「🎁 报告」；登录后从云端统计今年的小事数、照片数、字数、最勤快月份、两人各自记了几笔、第一笔与最近一笔，盲盒点开才揭晓（冒小心心庆祝）
- **互拍推送（Web Push）**：记录成功后调用 Edge Function `notify-moment`，给对方浏览器弹"xx 记了一件小事 🐾"；页脚「🔔 开启互拍提醒」完成订阅（push_subscriptions 表，endpoint 唯一自动覆盖）；APK 的 WebView 不支持 Web Push，该环境自动隐藏入口，APK 继续用本地纪念日提醒
- **生成 VAPID 密钥**（scripts 内联 node crypto），公钥进 config.js，私钥 vapid-keys.json 已加入 .gitignore 绝不入库
- **代码拆分**：640 行的 main.js 拆为 common.js（工具/登录门禁/备份/推送订阅 + QIAIWU 钩子）与 home.js / photos.js / moments.js / letter.js / report.js 五个页面脚本，每页只加载自己需要的
- **jsdom 冒烟测试**：tests/smoke.test.cjs 用 stub 模拟 Supabase，五页各走一遍「登录 → 解锁 → 云端渲染」，共 50 项断言（含盲盒开箱、照片渲染、作者/筛选按钮、编辑按钮显隐）
- **CI**：新增 .github/workflows/smoke-test.yml，push/PR 触碰 guai-site/** 时自动跑冒烟测试
- supabase-setup.sql 新增 push_subscriptions 表及 RLS（可重复执行）；sw.js v9 预缓存全部新脚本与 report.html，并新增 push/notificationclick 事件处理

### ✨ 新增（2026-09-13 · 体验完善与数据安全）
- **字体本地化**：站酷快乐体 / 马善政完整字体（woff）与「妻爱吾」三字子集（woff2）下载至 fonts/，生成 fonts/fonts.css，四个页面移除 Google Fonts 在线引用——国内网络不再退化成系统字体；scripts/fetch-fonts.cjs 一键重新下载
- **Service Worker v8**：fonts/ 目录改为 cache-first（字体一次缓存长期离线可用），预缓存列表加入 fonts/fonts.css
- **一键备份**：登录后页脚出现「💾 导出备份」，把 moments / photos / settings 三张表打包成 JSON 下载（含照片直链清单）
- **照片说明**：大图弹窗里可以给照片写一句话（photos.caption），照片墙上直接显示
- **照片下载**：大图弹窗新增「⬇️ 下载」，fetch 转 blob 强制保存到本地；时间线里的照片点击也能看大图（只读 + 可下载）
- **小事可编辑**：时间线卡片新增 ✎，点开把内容装回表单，支持改文字/日期/作者/换照片（换照片自动清理旧图），带「取消编辑」
- **按人筛选**：时间线上方 全部/溶宝/烨航 三个筛选项
- **称呼更新**：宝宝 → 溶宝，乖乖 → 烨航（config.js；提醒文案同步改为动态称呼）
- **Supabase 保活**：新增 ../.github/workflows/supabase-keepalive.yml，每周一自动 ping REST 端点，防止免费项目 7 天无活动被暂停

### 🛠 修复（2026-09-11 · 通知可靠性）
- **通知可能严重延迟**：排程时补上 `allowWhileIdle: true`。此前插件走 `AlarmManager.set()`（RTC、不唤醒、可被系统合并），手机进入 Doze 睡眠后 9 点提醒可能拖到很晚才弹；现在走 `setAndAllowWhileIdle`，Doze 下也能准时唤醒
- **纪念日当天早上会丢提醒**：原逻辑用「今天 0 点」和当前时间比大小，纪念日当天 0 点后打开 App 就会把提醒顺延到明年，当天 9 点那次被取消；改为「当天 9 点还没到就算今天」
- **通知图标是一坨白色方块**：新增 `guai-app/scripts/generate-notification-icon.cjs` 生成透明底白色爪印 `ic_stat_guai`（mdpi~xxxhdpi 五档，3x3 超采样抗锯齿），通知改用该小图标 + 品牌色 `#FF8FAB`
- 新增通知渠道「纪念日提醒」（`guai-reminder`），可在系统设置里单独控制提醒的响铃/震动；此前挂在默认 `Default` 渠道下
- 权限请求改为先 `checkPermissions()`，已授权就不再重复弹窗
- `sw.js` 预缓存列表补上 `js/reminders.js`（离线冷启动时也能挂上提醒），`CACHE` 版本号 v6 → v7

### ✨ 新增（2026-09-11 · 双人云写日记升级）
- 照片墙改为云端上传：新建独立 `photos` 表（与小事 `moments` 分开存储），页面右下角 📷 直接选图上传（手机调起相册/相机），点击照片看大图、删除
- 「一封信」支持在线编辑：登录后卡片 ✏️ 打开编辑器，保存进云端 `settings` 键（`letter`）
- 「小事」新增"谁记的"作者标识：记一笔时选择 宝宝/乖乖，时间线每条记录显示作者徽章（`moments.author` 列）
- `supabase-setup.sql` 新增 `photos` 表及 RLS 策略；`moments` 表新增 `author` 列（可重复执行）

### 🔧 品牌统一与安卓打包
- 全站品牌统一为「妻爱吾」：手机桌面名（app_name / title_activity_main）、4 页登录标题、PWA manifest、页面 title、iOS 桌面名
- 登录标题「妻爱吾」使用思源宋体（Noto Serif SC，"妻"字笔画纤细清晰）
- App 图标改为白底粉色猫爪（源文件 `1.webp`，`guai-app/scripts/convert-icon.cjs` 用 sharp 生成）
- Capacitor 安卓工程首版 APK 构建成功：`guai-app/android/app/build/outputs/apk/debug/app-debug.apk`

### ✨ 新增（云端记录 · 方案 B）
- "为什么是 7.25"支持在线编辑：登录后卡片右上角 ✏️ 打开编辑器，保存进云端 `settings` 键值表，未配置/未登录时回退 `CONFIG.why725`
- `supabase-setup.sql` 新增 `settings` 表（key/value），可重复运行
- 新增登录功能：打开网站先对暗号，账号/密码走 Supabase Auth 服务端校验（token 本地保存、自动续期，页脚可退出）
- 云数据库 RLS 从"共享口令"升级为"仅登录用户可读写"，`supabase-setup.sql` 可重复运行自动替换旧策略
- 新增安卓一键安装：捕获 `beforeinstallprompt`，页面浮出"📲 把 App 装到桌面"按钮，点了直接安装成 WebAPK
- 新增 `supabase-setup.sql`：一条 RUN 建好记录表 `moments` + 照片存储桶，RLS 校验小口令
- 新增 `js/db.js`：用 fetch 直连 Supabase REST（零依赖），读取/新增/删除记录、照片上传
- "我们的小事"新增**记一笔**表单：选日期、写文字、导入照片（手机调起相册/相机），保存即上云，两人共享
- 时间线优先显示云端记录，断网回退最近缓存，再回退本地 `CONFIG.timeline`
- 照片上传前自动压缩（长边 1600px / JPEG 0.85，动图跳过），省流量省存储
- 每条云端记录可删除（✕），连照片一起删
- `config.js` 新增 `CONFIG.supabase` 配置区（url / anonKey / bucket / pass）

### 🛠 修复
- Service Worker 改为 network-first：部署新版本后手机刷新即可看到，不再被旧缓存卡住；断网仍可离线打开
- 时间线渲染改用 HTML 转义，用户输入的内容不会再有注入风险

### ✨ 新增（PWA 手机 App 化）
- 新增 `manifest.json`，支持"添加到主屏幕"成为全屏 App
- 新增 `sw.js` Service Worker：站点资源离线缓存（照片 `/photos/` 豁免，保护隐私）
- 新增 `js/register-sw.js` 注册脚本，`file://` 与 `localhost` 下自动跳过
- 新增 `icons/` 爪印图标（192/512/maskable），由 `scripts/generate-icons.cjs` 生成
- 更新 README：新增 PWA 手机 App 化安装说明

### 🛠 修复
- 页面所有日期（徽章、开始日期、周年、100 天、页脚）改为从 `CONFIG.startDate` 动态派生，改纪念日只动一处
- 周年倒计时动态显示"第 N 周年"及对应日期（跨年自动 +1）
- 100 天纪念日卡片在日期过后自动切换为"已度过"语义
- `why725` 统一为字符串，留空时页面显示友好提示文案
- 修复周年/100 天卡片处 `span` 标签错位导致的重复文本显示

## [1.1.0] - 2026-09-08

### 🔧 重构
- 项目规范化：初始化 Git 仓库
- 新增 `.gitignore`，照片等隐私文件剔除出版本管理
- 样式拆分为 `css/style.css`
- 配置区拆分为 `js/config.js`，以后改内容只动这个文件
- 页面逻辑拆分为 `js/main.js`
- 新增 `CHANGELOG.md`，记录每一次更新

## [1.0.0] - 2026-08-16

### ✨ 初始版本
- 上线纪念日网站「给乖乖的纪念日网站 🐾」
- 功能：在一起天数实时计时、1 周年/100 天倒计时、情话轮播、照片墙、回忆时间线、一封信、点击冒小心心彩蛋
- 手绘风设计，单文件即可运行