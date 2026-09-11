/* 生成 Android 通知栏小图标（ic_stat_guai）
   通知小图标必须是「透明底 + 单色前景」，否则系统会把整个方形图标
   渲染成一坨白色色块。这里复用启动图标同款爪印几何，
   输出白色爪印（透明底），并做 3x3 超采样抗锯齿。

   用法：node scripts/generate-notification-icon.cjs
   产出：android/app/src/main/res/drawable-<密度>/ic_stat_guai.png */
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

/* ---------- PNG 编码（与 generate-android-icons.cjs 同款） ---------- */
let CRC_TABLE = null;
function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Int32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); CRC_TABLE[n] = c; }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xFF];
  return (crc ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function makePNG(w, h, pixelAt) {
  const rowLen = 1 + w * 4;
  const raw = Buffer.alloc(h * rowLen);
  for (let y = 0; y < h; y++) {
    raw[y * rowLen] = 0;
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = pixelAt(x, y);
      const o = y * rowLen + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))
  ]);
}

/* ---------- 爪印几何（与启动图标一致） ---------- */
function inEllipse(nx, ny, cx, cy, rx, ry) {
  const dx = (nx - cx) / rx, dy = (ny - cy) / ry;
  return dx * dx + dy * dy <= 1;
}
const TOES = [[0.32, 0.30, 0.115], [0.68, 0.30, 0.115], [0.44, 0.19, 0.115], [0.56, 0.19, 0.115]];
function isPaw(nx, ny) {
  for (const [tx, ty, tr] of TOES) if ((nx - tx) ** 2 + (ny - ty) ** 2 <= tr * tr) return true;
  return inEllipse(nx, ny, 0.5, 0.62, 0.28, 0.20);
}

/* 放大倍率：让爪印占满 24dp 画布（留一点安全边距），并垂直居中 */
const ZOOM = 1.20;
const DY = 0.04;
function pawSample(nx, ny) {
  return isPaw((nx - 0.5) / ZOOM + 0.5, (ny - 0.5 - DY) / ZOOM + 0.5);
}

/* 白色前景 + 透明底，3x3 超采样把边缘磨平 */
function notifIcon(size) {
  return makePNG(size, size, (x, y) => {
    let hit = 0;
    for (let sy = 0; sy < 3; sy++) {
      for (let sx = 0; sx < 3; sx++) {
        const nx = (x + (sx + 0.5) / 3) / size;
        const ny = (y + (sy + 0.5) / 3) / size;
        if (pawSample(nx, ny)) hit++;
      }
    }
    return [255, 255, 255, Math.round((hit / 9) * 255)];
  });
}

const RES = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
/* 通知小图标按 24dp 设计，各密度 = 24 * 倍数 */
const SIZES = { mdpi: 24, hdpi: 36, xhdpi: 48, xxhdpi: 72, xxxhdpi: 96 };

for (const [d, sz] of Object.entries(SIZES)) {
  const dir = path.join(RES, 'drawable-' + d);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'ic_stat_guai.png'), notifIcon(sz));
  console.log('drawable-' + d + '/ic_stat_guai.png (' + sz + 'px / 24dp)');
}
console.log('done');
