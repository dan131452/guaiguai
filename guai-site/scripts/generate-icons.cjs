/* 生成 PWA 图标：icon-192.png / icon-512.png / icon-maskable-512.png
   纯 Node 实现，无第三方依赖；node scripts/generate-icons.cjs 运行 */
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

/* ---------- 极简 PNG 编码（RGBA8, 非隔行） ---------- */
let CRC_TABLE = null;
function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      CRC_TABLE[n] = c;
    }
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
    raw[y * rowLen] = 0; /* filter: none */
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = pixelAt(x, y);
      const o = y * rowLen + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;                 /* 8bit, RGBA */
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/* ---------- 手绘爪印图案 ---------- */
const CREAM = [253, 251, 243];
const GREEN = [74, 103, 65];
function inEllipse(nx, ny, cx, cy, rx, ry) {
  const dx = (nx - cx) / rx, dy = (ny - cy) / ry;
  return dx * dx + dy * dy <= 1;
}
const TOES = [[0.32, 0.30, 0.115], [0.68, 0.30, 0.115], [0.44, 0.19, 0.115], [0.56, 0.19, 0.115]];
function isPaw(nx, ny) {
  for (const [tx, ty, tr] of TOES) {
    if ((nx - tx) * (nx - tx) + (ny - ty) * (ny - ty) <= tr * tr) return true;
  }
  return inEllipse(nx, ny, 0.5, 0.62, 0.28, 0.20);
}
function pawIcon(size, maskable) {
  const bg = maskable ? GREEN : CREAM;
  const fg = maskable ? CREAM : GREEN;
  return makePNG(size, size, (x, y) => {
    const nx = (x + 0.5) / size, ny = (y + 0.5) / size;
    if (maskable) {
      /* maskable：完整填充背景色，图案约束在中心 80% 安全区 */
      if (isPaw(0.5 + (nx - 0.5) / 0.8, 0.5 + (ny - 0.5) / 0.8)) return [...fg, 255];
      return [...bg, 255];
    }
    if (isPaw(nx, ny)) return [...fg, 255];
    return [...bg, 255];
  });
}

const OUT = path.join(__dirname, '..', 'icons');
fs.mkdirSync(OUT, { recursive: true });
const jobs = [
  ['icon-192.png', pawIcon(192, false)],
  ['icon-512.png', pawIcon(512, false)],
  ['icon-maskable-512.png', pawIcon(512, true)]
];
for (const [name, buf] of jobs) {
  /* 自校验：文件头 + 各 chunk CRC */
  if (buf.readUInt32BE(0) !== 0x89504E47) throw new Error(name + ': bad PNG signature');
  let off = 8;
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); table[n] = c; }
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const crcBuf = buf.subarray(off + 8 + len, off + 12 + len);
    let crc = -1;
    const data = buf.subarray(off + 4, off + 8 + len);
    for (let i = 0; i < data.length; i++) crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
    if ((crc ^ -1) >>> 0 !== crcBuf.readUInt32BE(0)) throw new Error(name + ': CRC mismatch @' + type);
    off += 12 + len;
  }
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log('generated icons/' + name + ' (' + buf.length + ' bytes, CRC OK)');
}
console.log('done');