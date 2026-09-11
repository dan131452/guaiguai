/* 生成 Android 启动图标（爪印）并覆盖 Capacitor 模板图标
   用法：node scripts/generate-android-icons.cjs
   同时修正 strings.xml 的 app_name（UTF-8 无 BOM）与背景色 */
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

/* ---------- PNG 编码（与 guai-site 脚本同款） ---------- */
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

/* ---------- 爪印图案 ---------- */
const CREAM = [255, 255, 255];
const GREEN = [255, 143, 171];
function inEllipse(nx, ny, cx, cy, rx, ry) {
  const dx = (nx - cx) / rx, dy = (ny - cy) / ry;
  return dx * dx + dy * dy <= 1;
}
const TOES = [[0.32, 0.30, 0.115], [0.68, 0.30, 0.115], [0.44, 0.19, 0.115], [0.56, 0.19, 0.115]];
function isPaw(nx, ny) {
  for (const [tx, ty, tr] of TOES) if ((nx - tx) ** 2 + (ny - ty) ** 2 <= tr * tr) return true;
  return inEllipse(nx, ny, 0.5, 0.62, 0.28, 0.20);
}
/* size 画布，中心 SAFE 比例内画爪印（自适应图标安全区） */
function pawIcon(size, safe) {
  return makePNG(size, size, (x, y) => {
    const nx = (x + 0.5) / size, ny = (y + 0.5) / size;
    if (isPaw((nx - 0.5) / safe + 0.5, (ny - 0.5) / safe + 0.5)) return [...GREEN, 255];
    return [...CREAM, 255];
  });
}
function legacyIcon(size) {
  return makePNG(size, size, (x, y) => {
    const nx = (x + 0.5) / size, ny = (y + 0.5) / size;
    if (isPaw(nx, ny)) return [...GREEN, 255];
    return [...CREAM, 255];
  });
}

const RES = 'D:/wangrong/guai-app/android/app/src/main/res';
const SAFE = 66 / 108;               /* 自适应图标安全区：画布 108dp 中 66dp */
const FG = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
const LEGACY = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };

for (const [d, sz] of Object.entries(FG)) {
  fs.writeFileSync(path.join(RES, 'mipmap-' + d, 'ic_launcher_foreground.png'), pawIcon(sz, SAFE));
  console.log('mipmap-' + d + '/ic_launcher_foreground.png (' + sz + ')');
}
for (const [d, sz] of Object.entries(LEGACY)) {
  const img = legacyIcon(sz);
  fs.writeFileSync(path.join(RES, 'mipmap-' + d, 'ic_launcher.png'), img);
  fs.writeFileSync(path.join(RES, 'mipmap-' + d, 'ic_launcher_round.png'), img);
  console.log('mipmap-' + d + '/ic_launcher* -> legacy ' + sz);
}

/* 背景：纯白色 */
fs.writeFileSync(path.join(RES, 'drawable', 'ic_launcher_background.xml'),
`<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportHeight="108"
    android:viewportWidth="108">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M0,0h108v108h-108z" />
</vector>
`);
console.log('drawable/ic_launcher_background.xml -> 白色');

/* 修正 strings.xml 的 app_name（UTF-8 中文） */
const sp = path.join(RES, 'values', 'strings.xml');
let s = fs.readFileSync(sp, 'utf8');
const fixed = s.replace(/(<string name="app_name">).*(<\/string>)/, '$1妻爱吾$2');
fs.writeFileSync(sp, fixed, 'utf8');
console.log('strings.xml app_name -> 妻爱吾（' + (s !== fixed ? '已替换' : '已存在/未变化') + '）');
console.log('done');