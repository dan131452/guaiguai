-- =====================================================
-- 给乖乖的纪念日网站 · Supabase 初始化脚本（账号登录版）
--
-- 用法：
-- 1. 登录 supabase.com，进入你的项目
-- 2. 左侧 SQL Editor → New query，把整个文件粘贴进去，点 RUN
--    （之前运行过旧版脚本也没关系，本脚本会自动替换旧策略）
-- 3. 建登录账号：左侧 Authentication → Users → Add user
--    - Email：wangrong@guai.site   （= js/config.js 里 account + emailSuffix）
--    - Password：你们的密码
--    - 勾选 Auto Confirm User（免邮箱验证，直接可登录）
-- 4. 项目设置 → API，把 Project URL 和 anon public key
--    填进 js/config.js 的 CONFIG.supabase，重新部署即可
--
-- 安全说明：
--   时间线和照片的读写权限只授予"已登录用户"（authenticated），
--   账号密码保存在 Supabase Auth 服务端，网页代码里看不到；
--   照片桶是公开读（文件名是随机 UUID，猜不到），写入需要登录。
-- =====================================================

-- ---------- 记录表：我们的小事 ----------
create table if not exists public.moments (
  id uuid primary key default gen_random_uuid(),
  happened_on date not null default current_date,   -- 小事发生的日子
  text text not null default '',                    -- 想记的话
  image_path text,                                  -- 照片在存储桶里的路径（可空）
  created_at timestamptz not null default now()
);

alter table public.moments enable row level security;

drop policy if exists "moments read" on public.moments;
create policy "moments read" on public.moments
  for select to authenticated using (true);

drop policy if exists "moments insert" on public.moments;
create policy "moments insert" on public.moments
  for insert to authenticated with check (true);

drop policy if exists "moments delete" on public.moments;
create policy "moments delete" on public.moments
  for delete to authenticated using (true);

-- ---------- 页面可编辑内容（键值表：如"为什么是 7.25"） ----------
create table if not exists public.settings (
  key text primary key,                             -- 内容标识，如 why725
  value text not null default '',                   -- 编辑后的内容
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

drop policy if exists "settings read" on public.settings;
create policy "settings read" on public.settings
  for select to authenticated using (true);

drop policy if exists "settings write" on public.settings;
create policy "settings write" on public.settings
  for insert to authenticated with check (true);

drop policy if exists "settings update" on public.settings;
create policy "settings update" on public.settings
  for update to authenticated using (true) with check (true);

-- ---------- 照片存储桶 ----------
insert into storage.buckets (id, name, public)
values ('moments', 'moments', true)
on conflict (id) do nothing;

drop policy if exists "moments photo read" on storage.objects;
create policy "moments photo read" on storage.objects
  for select to anon using (bucket_id = 'moments');

drop policy if exists "moments photo upload" on storage.objects;
create policy "moments photo upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'moments');

drop policy if exists "moments photo delete" on storage.objects;
create policy "moments photo delete" on storage.objects
  for delete to authenticated using (bucket_id = 'moments');

-- ---------- 清理旧版"小口令"方案的残留（没跑过旧版也不报错） ----------
drop function if exists public.app_pass_ok();
