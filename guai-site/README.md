# 🐾 给乖乖的纪念日网站

一个清新的手绘风纪念日网站：在一起多少天、周年倒计时、情话小纸条、照片墙、回忆时间线、一封写给乖乖的信。

**纪念日开始日期：`2026-07-25`** · 本项目用于记录我们的每一段回忆。

## 📂 文件结构

```
guai-site/
├── index.html           ← 网站入口（双击就能打开）
├── manifest.json        ← PWA 配置（App 名称/图标/主题色）
├── sw.js                ← Service Worker：离线缓存（照片不缓存）
├── css/style.css        ← 全部样式（一般不用改）
├── js/config.js         ← ★ 内容设置区：纪念日/昵称/情话/时间线/信/Supabase 都在这里改
├── js/db.js             ← 云端接入：记录的读写、照片上传压缩（一般不用改）
├── js/main.js           ← 页面逻辑（一般不用改）
├── js/register-sw.js    ← PWA 注册（离线环境自动跳过）
├── icons/               ← App 图标（已生成，可用 scripts 重新生成）
├── scripts/generate-icons.cjs  ← 图标生成脚本（node scripts/generate-icons.cjs）
├── photos/              ← 放照片的文件夹（照片墙用，把照片丢进来）
├── supabase-setup.sql   ← ★ 云端记录的建表脚本（在 Supabase 里运行一次）
├── CHANGELOG.md         ← 更新记录
└── README.md            ← 本说明
```

> 双击打开时 PWA 相关文件不生效（`file://` 下 Service Worker 无法运行），属正常现象；部署到线上后 App 能力自动开启。

## 🚀 怎么打开

直接**双击 `index.html`**，浏览器里就能看，完全离线可用。

## 📱 做成手机 App（PWA 方案）

本项目已内置 **PWA（渐进式 Web 应用）** 能力：部署到线上后，手机浏览器打开一次，即可"添加到主屏幕"，变成**全屏、无地址栏、可离线使用**的真 App 图标。照片（`/photos/`）不会被 Service Worker 缓存，始终走网络，隐私可控。

具体步骤：

1. 将网站部署到 HTTPS 地址（推荐 GitHub Pages，见下方部署说明）。
2. 手机浏览器打开该网址（Chrome / 手机自带浏览器均可）。
3. **安卓**：浏览器菜单 → "添加到主屏幕" / "安装应用"；**iPhone**：Safari 分享按钮 → "添加到主屏幕"。
4. 桌面上出现爪印图标，点击即全屏启动 🐾

> PWA 需要在 HTTPS 下才生效；本地双击或 `http://localhost` 下会自动跳过注册（`js/register-sw.js`），不影响网站本身。

## ✏️ 想改内容？只动 `js/config.js`

所有文字内容都集中在 `js/config.js` 顶部的 `CONFIG` 里：

| 想改什么 | 改哪里 |
|---|---|
| 在一起的日子 | `startDate: '2026-07-25T00:00:00'` |
| 昵称（她/你） | `her: '乖乖'`、`me: '宝宝'` |
| "为什么是 7.25" 的故事 | `why725: '...'` |
| 情话列表 | `quotes: [...]` 里加一行，逗号隔开 |
| 时间线小事 | `timeline: [...]` 里加 `{ date, text }` |
| 给乖乖的信 | `letter: '...'`（`\n` 表示换行） |

> 改完保存，刷新浏览器即可看到效果。

## 🔐 登录功能

配置好 Supabase 后，打开网站会先进入登录页：输入账号 `wangrong` 和你们的密码，点"进来"才能看到"我们的小事"。

- 账号密码存在 **Supabase Auth 服务端**，网页代码里看不到，不是简单的前端障眼法；时间线和照片只有登录后才能读写（数据库 RLS 限制）。
- 登录状态会记住（token 自动续期），平时打开不用重复输密码；页脚有"退出登录"。
- 想换密码：Supabase → Authentication → Users 里选中用户重置；想加第二个账号（比如各一个）同样在 Users 里 Add user 即可。

## 📝 云端记录怎么配置（手机上"记一笔"+ 传照片）

配置一次之后，你和乖乖在手机 App 里就能直接往"我们的小事"里写文字、传照片，两个人都能看到，不用再改代码。

1. 到 [supabase.com](https://supabase.com) 注册（免费），点 **New project** 建一个项目（名字随意，区域选 Singapore 就行）。
2. 把本项目里的 `supabase-setup.sql` 全文粘贴到 Supabase 的 **SQL Editor → New query**，点 **RUN**。它会创建记录表 `moments` 和照片存储桶 `moments`（跑过旧版口令方案的也没关系，会自动替换）。
3. **建登录账号**：左侧 **Authentication → Users → Add user**，邮箱填 `wangrong@guai.site`（要和 `js/config.js` 里 `account` + `emailSuffix` 拼出来的一致），密码填你们的密码，勾选 **Auto Confirm User**。
4. Supabase **Project Settings → API**，复制 `Project URL` 和 `anon public` key。
5. 打开 `js/config.js`，填进 `CONFIG.supabase` 的 `url` 和 `anonKey`，核对 `account` / `emailSuffix` 和第 3 步一致。
6. 重新部署一次（git push），手机上重新打开 App 即可。

配置好后的行为：

- 打开网站先登录（账号 `wangrong` + 密码），才能看到"我们的小事"。
- **"为什么是 7.25"** 也能在线改了：登录后卡片右上角出现 ✏️，点开写好保存即可（存云端 `settings` 表，两人共享）。没登录/未配置时仍读 `js/config.js` 里的 `why725`。
- "我们的小事"顶部有**记一笔**表单：选日期、写几句话、（可选）选一张照片，点"记下来"就上云了。
- 照片会自动压缩（长边 1600px）再上传，不费流量。
- 每条记录右上角有个 ✕，可以删除（会连照片一起删）。
- 断网时：显示最近一次同步的内容，等恢复网络后自动刷新。
- **隐私边界**：云端记录和照片有登录保护；但页面上的信、情话等静态内容在公开仓库里本身就是公开的，介意的话就按上文用 Pro 私有仓库托管。

## 📷 怎么加照片（照片墙）

照片墙（页面中部那个九宫格）仍是传统方式：把你们的合照命名为 `1.jpg`、`2.jpg`、…… 放进 `photos` 文件夹（支持 jpg / png / gif / webp），并在 `js/config.js` 里 `CONFIG.photos` 列出。

想在手机上随手记录、配图，用上面"云端记录"的**记一笔**就好，两者互不影响。

## � 版本管理与备份（重要）

本项目用 Git 做版本管理，**照片属于隐私数据，已被 `.gitignore` 排除，不会入库**。

日常维护建议：

1. 每次有内容更新（新照片、新时间线、新情话）提交一次：
   ```powershell
   git add .
   git commit -m "feat: 记录 xxx 的回忆"
   ```
2. 每年纪念日记一个里程碑（tag）：
   ```powershell
   git tag v1.0-一周年
   ```
3. 照片原件请额外备份到网盘/移动硬盘（Git 不保留照片）。

## �📱 怎么让乖乖在手机上打开（重点！）

电脑上打开只有你能看，想让她在手机上看，最省事的办法是 **GitHub Pages**（免费）：

1. 注册/登录 [github.com](https://github.com)，点右上角 **+ → New repository** 新建仓库（名字随意，比如 `guai-site`）。
   > 注意：GitHub **免费**账号的私有仓库开不了 Pages，需要 Pro；公开仓库则内容全网可见。建议二选一：① 升级 Pro 用私有仓库；② 免费公开仓库，但**照片墙用的照片尽量少放**，私密回忆走"云端记录"（照片存在 Supabase，不在仓库里）。国内手机访问 GitHub Pages 不稳定的话，可以换成 Cloudflare Pages / EdgeOne Pages 托管。
2. 上传文件：仓库页面 → **Add file → Upload files**，把 `index.html`、`css`、`js`、`photos` 文件夹拖进去，Commit。
   > 也可用命令行：`git remote add origin https://github.com/你的用户名/guai-site.git` 然后 `git push`。
3. 打开仓库的 **Settings → Pages**，Source 选 `Deploy from a branch`，Branch 选 `main`，Save。
4. 等 1~2 分钟，访问 `https://你的用户名.github.io/guai-site/`，把链接发给乖乖就行 🎉

> 想绑定自己的域名、或放到服务器（比如用你们学的 Flask/Node 搭个主页跳转），都是加分项，可以之后慢慢折腾。

## 🎵 想加背景音乐？

把一首歌命名为 `music.mp3` 放在 `index.html` 旁边，然后在 `js/main.js` 最下面加一行：

```js
// 页面打开后自动播放（浏览器可能拦截，配合点击事件更稳）
document.addEventListener('click', () => {
  const a = new Audio('music.mp3');
  a.loop = true; a.volume = 0.4; a.play();
}, { once: true });
```

## � 开发者说明

- 纯原生 HTML/CSS/JS，无任何构建依赖，双击即可运行
- 页面逻辑为普通 `<script>` 顺序引入（`config.js` → `main.js`），保持 file:// 协议下可用
- 版本记录见 [CHANGELOG.md](CHANGELOG.md)

## �💡 小彩蛋

网页上**点任意位置**会冒出小心心和小爪印 🐾，做网页的时候可以自己点着玩。