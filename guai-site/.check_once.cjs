const fs = require('fs');
const cfgSrc = fs.readFileSync('D:/wangrong/guai-site/js/config.js', 'utf8');
const url = cfgSrc.match(/url:\s*'([^']+)'/)[1].replace(/\/+$/, '');
const key = cfgSrc.match(/anonKey:\s*'([^']+)'/)[1];
const H = { apikey: key, Authorization: 'Bearer ' + key };
(async () => {
  const r = await fetch(url + '/storage/v1/bucket/moments', { headers: H });
  const t = await r.text();
  console.log('bucket/moments ->', r.status, t.slice(0, 120));
  if (r.status === 200) console.log('✅ 桶已存在:', JSON.parse(t).public ? '(public)' : '(私有)');
  else {
    const r2 = await fetch(url + '/storage/v1/bucket?limit=100', { headers: H });
    const arr = JSON.parse(await r2.text());
    console.log('当前项目桶列表:', arr.length ? arr.map(b => b.id).join(', ') : '(空)');
  }
})();