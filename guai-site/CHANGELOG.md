# 更新日志

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 格式，版本号遵循语义化版本。

## [Unreleased]
- 待添加：1 周年纪念版（2027.07.25）

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