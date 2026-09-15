// Supabase Edge Function: notify-moment
// 收到"xx 记了一件小事"→ 给对方的所有浏览器订阅发 Web Push
//
// 安全：仅已登录用户（有效 JWT）可调用；匿名 key / 无 token 一律拒绝。
// CORS：默认仅允许环境变量 ALLOWED_ORIGINS（逗号分隔）里的来源。
//
// 部署（一次性，见 README「互拍推送」）：
//   npx supabase login
//   npx supabase link --project-ref wwupbdkkvotqlihbujjx
//   npx supabase secrets set WEBPUSH_PUBLIC_KEY=... WEBPUSH_PRIVATE_KEY=...
//   npx supabase functions deploy notify-moment
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  const allow = (Deno.env.get('ALLOWED_ORIGINS') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  // 未配置白名单时：回显请求 Origin（仍要求登录），避免通配 *
  const allowed = allow.length === 0
    ? origin
    : (allow.includes(origin) ? origin : allow[0]);
  return {
    'Access-Control-Allow-Origin': allowed || 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

Deno.serve(async (req: Request) => {
  const CORS = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), {
      status: 405,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(url, serviceKey);

    // ---------- 鉴权：必须是已登录用户的有效 JWT ----------
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : '';
    if (!token) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const { author, text } = await req.json();
    if (!author) {
      return new Response(JSON.stringify({ error: 'missing author' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    webpush.setVapidDetails(
      'mailto:qiaiwu@example.com',
      Deno.env.get('WEBPUSH_PUBLIC_KEY')!,
      Deno.env.get('WEBPUSH_PRIVATE_KEY')!,
    );

    // 只推给"不是记录者本人"的设备
    const { data: subs, error } = await admin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth, owner')
      .neq('owner', author);
    if (error) throw new Error('读取订阅失败: ' + error.message);

    const payload = JSON.stringify({
      title: `${author} 记了一件小事 🐾`,
      body: (text || '').slice(0, 80) || '点开看看吧',
      url: './2.html',
    });

    const dead: string[] = [];
    const results = await Promise.all((subs || []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { TTL: 86400 },
        );
        return 'ok';
      } catch (err) {
        const code = err?.statusCode ?? 0;
        if (code === 404 || code === 410) dead.push(s.id);
        return 'fail:' + code;
      }
    }));

    if (dead.length) {
      await admin.from('push_subscriptions').delete().in('id', dead);
    }

    return new Response(
      JSON.stringify({ sent: results.filter(r => r === 'ok').length, dead: dead.length, detail: results }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String((err && err.message) || err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
