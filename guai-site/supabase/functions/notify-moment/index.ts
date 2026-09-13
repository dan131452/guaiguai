// Supabase Edge Function: notify-moment
// 收到"xx 记了一件小事"→ 给对方的所有浏览器订阅发 Web Push
//
// 部署（一次性，见 README「互拍推送」）：
//   npx supabase login
//   npx supabase link --project-ref wwupbdkkvotqlihbujjx
//   npx supabase secrets set WEBPUSH_PUBLIC_KEY=... WEBPUSH_PRIVATE_KEY=...
//   npx supabase functions deploy notify-moment
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), { status: 405, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  try {
    const { author, text } = await req.json();
    if (!author) {
      return new Response(JSON.stringify({ error: 'missing author' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    webpush.setVapidDetails(
      'mailto:qiaiwu@example.com',
      Deno.env.get('WEBPUSH_PUBLIC_KEY')!,
      Deno.env.get('WEBPUSH_PRIVATE_KEY')!,
    );

    // service_role 绕过 RLS：读全部订阅、删失效订阅
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
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
        if (code === 404 || code === 410) dead.push(s.id);   // 订阅已失效
        return 'fail:' + code;
      }
    }));

    if (dead.length) {
      await admin.from('push_subscriptions').delete().in('id', dead);
    }

    return new Response(JSON.stringify({ sent: results.filter(r => r === 'ok').length, dead: dead.length, detail: results }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message || err) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});
