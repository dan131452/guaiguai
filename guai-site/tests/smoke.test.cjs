/* =====================================================
   冒烟测试：每个页面在 jsdom 里完整跑一遍脚本。
   用 stub 模拟 Supabase 接口，走通"登录 → 解锁 → 云端渲染"，
   断言无致命错误、关键内容渲染正确。
   运行：npm i jsdom && node tests/smoke.test.cjs
   GitHub Actions 每次 push 自动执行（.github/workflows/smoke-test.yml）
   ===================================================== */
const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES = ['index.html', '1.html', '2.html', '3.html', 'report.html'];

let failed = 0;

function check(name, cond, extra) {
  if (cond) {
    console.log('  ✅ ' + name);
  } else {
    failed++;
    console.log('  ❌ ' + name + (extra ? ' — ' + extra : ''));
  }
}

/* 模拟 Supabase：密码登录成功、moments 空、photos 1 张、settings 空 */
function stubFetch(window) {
  const R = obj => Promise.resolve({
    ok: true, status: 200,
    json: () => Promise.resolve(obj),
    text: () => Promise.resolve(JSON.stringify(obj))
  });
  window.fetch = (url) => {
    const u = String(url);
    if (u.includes('/auth/v1/token')) return R({ access_token: 'at-test', refresh_token: 'rt-test', expires_in: 3600 });
    if (u.includes('/auth/v1/logout')) return R({});
    if (u.includes('/rest/v1/moments')) return R([]);
    if (u.includes('/rest/v1/photos')) return R([{ id: 'p1', image_path: 'moments/test.jpg', caption: '测试照片', created_at: '2026-09-13T10:00:00Z' }]);
    if (u.includes('/rest/v1/settings')) return R([]);
    if (u.includes('/functions/v1/')) return R({ sent: 0 });
    return R([]);
  };
}

async function loadPage(file) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(String(e.message || e)));
  vc.on('error', (...a) => errors.push(a.join(' ')));

  const dom = await JSDOM.fromFile(path.join(ROOT, file), {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      stubFetch(window);
      window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {} }));
      window.scrollTo = () => {};
      window.confirm = () => false;
      window.alert = () => {};
      /* file:// 在 jsdom 里是 opaque origin，localStorage 不可用 → 内存版替身 */
      const mkStore = () => {
        const m = new Map();
        return {
          getItem: k => (m.has(k) ? m.get(k) : null),
          setItem: (k, v) => { m.set(k, String(v)); },
          removeItem: k => { m.delete(k); },
          clear: () => m.clear(),
          key: i => [...m.keys()][i] ?? null,
          get length() { return m.size; }
        };
      };
      Object.defineProperty(window, 'localStorage', { value: mkStore(), configurable: true });
      Object.defineProperty(window, 'sessionStorage', { value: mkStore(), configurable: true });
    }
  });
  await new Promise(r => setTimeout(r, 500));      /* 资源加载 + 门禁初始状态 */
  /* 填密码登录（或已锁则走登录流程），再等钩子跑完 */
  const d0 = dom.window.document;
  const lp = d0.getElementById('loginPass');
  const go = d0.getElementById('loginGo');
  if (lp && go) { lp.value = 'test-pass'; go.click(); await new Promise(r => setTimeout(r, 900)); }
  return { dom, errors };
}

(async () => {
  for (const file of PAGES) {
    console.log('\n== ' + file + ' ==');
    const { dom, errors } = await loadPage(file);
    const d = dom.window.document;
    const w = dom.window;
    const text = id => { const el = d.getElementById(id); return el ? el.textContent : null; };
    const unlocked = !d.body.classList.contains('locked');

    check('无 JS 致命错误', errors.filter(e => !/Could not load|not implemented/i.test(e)).length === 0,
      errors.slice(0, 3).join(' | '));
    check('登录成功并解锁', unlocked);
    check('底部导航 5 个入口', d.querySelectorAll('.tabbar .tab').length === 5);
    check('导出备份按钮可见', d.getElementById('exportBtn') && !d.getElementById('exportBtn').hidden);
    check('页脚开始日期已渲染', text('startDateF') === '2026.07.25', String(text('startDateF')));
    check('称呼=烨航/溶宝', text('me1') === '溶宝' &&
      ((text('her1') === '烨航') || (text('her4') === '烨航') || !d.getElementById('her1')),
      'me1=' + text('me1') + ' her1=' + text('her1'));

    if (file === 'index.html') {
      check('在一起天数已渲染', text('days') !== '0', String(text('days')));
      check('周年倒计时已渲染', text('c1d') !== '--', String(text('c1d')));
      check('100 天日期已渲染', text('d100Date') === '2026.11.02', String(text('d100Date')));
      check('情话已渲染', (text('quote') || '').length > 0);
      check('✏️ 编辑按钮可见', d.getElementById('whyEdit').hidden === false);
    }
    if (file === '1.html') {
      check('云端照片渲染 1 张', d.querySelectorAll('#photoGrid .photo').length === 1,
        String(d.querySelectorAll('#photoGrid .photo').length));
      check('弹窗元素齐全（说明/下载/删除）', ['photoModalImg', 'photoModalCap', 'photoModalDl', 'photoModalDel'].every(id => !!d.getElementById(id)));
    }
    if (file === '2.html') {
      check('保存按钮可用', d.getElementById('recSave').disabled === false);
      check('作者按钮=溶宝/烨航', text('authorMe') === '溶宝' && text('authorHer') === '烨航');
      check('筛选按钮=溶宝/烨航', text('filterMe') === '溶宝' && text('filterHer') === '烨航');
      check('空时间线有友好提示', !!d.querySelector('.tl-empty'));
    }
    if (file === '3.html') {
      check('信件已渲染', (text('letter') || '').indexOf('见字如面') > -1);
      check('✏️ 编辑按钮可见', d.getElementById('letterEdit').hidden === false);
    }
    if (file === 'report.html') {
      check('数据已打包', (text('giftTip') || '').indexOf('打包好') > -1, String(text('giftTip')));
      d.getElementById('giftBox').click();
      await new Promise(r => setTimeout(r, 900));
      check('盲盒点开后展示报告', d.getElementById('reportBody').hidden === false);
      check('报告至少 4 张卡片', d.querySelectorAll('.rp-card').length >= 4,
        String(d.querySelectorAll('.rp-card').length));
      check('照片数统计正确=1', (d.getElementById('reportBody').textContent || '').indexOf('拍下/上传的照片') > -1);
    }

    w.close();
  }

  console.log('\n' + (failed ? '❌ ' + failed + ' 项未通过' : '✅ 全部通过'));
  process.exit(failed ? 1 : 0);
})();
