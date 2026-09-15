/* 安卓打包准备：同步网页 → 清理不该进 APK 的文件（测试依赖/私钥/文档）
   用法：node scripts/build-apk.cjs  然后 cd android && gradlew.bat assembleDebug */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const APP = path.join(__dirname, '..');
const PUB = path.join(APP, 'android', 'app', 'src', 'main', 'assets', 'public');

console.log('1/2 同步网页资源...');
execSync('npx cap sync android', { cwd: APP, stdio: 'inherit' });

console.log('2/2 清理不该打进 APK 的文件...');
const KILL = ['node_modules', 'tests', 'scripts', 'supabase', 'supabase-setup.sql',
  'vapid-keys.json', 'CHANGELOG.md', 'README.md', 'package.json', 'package-lock.json', '.gitignore'];
let removed = 0;
for (const name of KILL) {
  const p = path.join(PUB, name);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
    removed++;
  }
}
console.log('已移除 ' + removed + ' 项，assets 最终大小：');
execSync('du -sh .', { cwd: PUB, stdio: 'inherit' });
console.log('下一步：cd android && gradlew.bat assembleDebug');
