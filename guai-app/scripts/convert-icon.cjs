const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = 'D:/wangrong/1.webp';
const RES = 'D:/wangrong/guai-app/android/app/src/main/res';
const FG = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
const LEGACY = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };

async function main() {
  for (const [d, sz] of Object.entries(FG)) {
    await sharp(SRC)
      .resize(sz, sz, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(RES, 'mipmap-' + d, 'ic_launcher_foreground.png'));
    console.log('foreground ' + d + ' ' + sz);
  }
  for (const [d, sz] of Object.entries(LEGACY)) {
    const out = path.join(RES, 'mipmap-' + d, 'ic_launcher.png');
    await sharp(SRC)
      .resize(sz, sz, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .png()
      .toFile(out);
    fs.copyFileSync(out, path.join(RES, 'mipmap-' + d, 'ic_launcher_round.png'));
    console.log('legacy ' + d + ' ' + sz);
  }
  console.log('done');
}
main().catch(e => { console.error(e); process.exit(1); });