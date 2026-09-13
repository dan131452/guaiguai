/* 字体本地化：把 Google Fonts 的手写字体下载到 fonts/ 目录，生成 fonts/fonts.css。
   中文字体在部分网络下只返回拉丁子集，所以用旧版 Safari UA 拿「完整单文件 woff」，
   「妻爱吾」三字标题子集用现代 UA 拿 woff2（带 text= 参数，本来就只有一个分段）。
   用法：node scripts/fetch-fonts.cjs （需要联网，只需跑一次） */
const fs = require('fs');
const path = require('path');
const https = require('https');

const UA_FULL = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.51.22 (KHTML, like Gecko) Version/5.1.1 Safari/534.51.22';
const UA_MODERN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const JOBS = [
  { css: 'https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap', ua: UA_FULL, fmt: 'woff' },
  { css: 'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap', ua: UA_FULL, fmt: 'woff' },
  { css: 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700&text=%E5%A6%BB%E7%88%B1%E5%90%BE&display=swap', ua: UA_MODERN, fmt: 'woff2' }
];
const OUT = path.join(__dirname, '..', 'fonts');
const FILES = path.join(OUT, 'files');

function get(url, ua, binary) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': ua } }, resp => {
      if (resp.statusCode !== 200) return reject(new Error('HTTP ' + resp.statusCode + ' ' + url.slice(0, 80)));
      const chunks = [];
      resp.on('data', c => chunks.push(c));
      resp.on('end', () => resolve(binary ? Buffer.concat(chunks) : Buffer.concat(chunks).toString('utf8')));
    }).on('error', reject);
  });
}

(async () => {
  fs.mkdirSync(FILES, { recursive: true });
  let cssAll = '';
  let n = 0;
  for (const job of JOBS) {
    const css = await get(job.css, job.ua, false);
    const blocks = css.match(/@font-face\s*{[^}]+}/g) || [];
    if (!blocks.length) throw new Error('没有解析到 @font-face: ' + job.css);
    for (const block of blocks) {
      const m = block.match(/url\((https:[^)]+)\)/);
      if (!m) throw new Error('块里没有字体地址: ' + job.css);
      n += 1;
      const file = 'f' + String(n).padStart(3, '0') + '-' +
        path.basename(m[1]).replace(/[^A-Za-z0-9._-]/g, '').slice(0, 48) + '.' + job.fmt;
      const buf = await get(m[1], job.ua, true);
      if (buf.length < 1000) throw new Error('文件太小，可能不是完整字体: ' + file);
      fs.writeFileSync(path.join(FILES, file), buf);
      cssAll += block.replace(m[1], 'files/' + file)
                     .replace(/format\('woff2'\)/, "format('" + job.fmt + "')") + '\n';
    }
    console.log('OK ' + decodeURIComponent(job.css.split('family=')[1].split('&')[0]) + ' → ' + blocks.length + ' 个文件');
  }
  fs.writeFileSync(path.join(OUT, 'fonts.css'), cssAll);
  const total = fs.readdirSync(FILES).reduce((s, f) => s + fs.statSync(path.join(FILES, f)).size, 0);
  console.log('共 ' + n + ' 个文件，' + Math.round(total / 1024) + ' KB，已生成 fonts/fonts.css');
})().catch(e => { console.error('FAIL: ' + e.message); process.exit(1); });
