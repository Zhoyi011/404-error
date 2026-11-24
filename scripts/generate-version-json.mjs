import fs from 'node:fs';
import path from 'node:path';

const REPO = 'Zhoyi011/404-error';
const RELEASE_BASE = `https://github.com/${REPO}/releases/latest/download`;

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = (process.env.RELEASE_VERSION || pkg.version || '1.0.0').replace(/^v/, '').trim();
const notes =
  (process.env.RELEASE_NOTES || '').trim() ||
  `发布 v${version}：包含桌面端 (.exe) 与移动端 (.apk) 客户端更新及离线资源同步。`;
const outPath = path.resolve(root, process.argv[2] || 'version.json');

const manifest = {
  version,
  tag: `v${version}`,
  releaseDate: new Date().toISOString(),
  notes,
  repository: `https://github.com/${REPO}`,
  downloads: {
    windows: `${RELEASE_BASE}/404-error-windows.exe`,
    windowsPortable: `${RELEASE_BASE}/404-error-windows-portable.exe`,
    android: `${RELEASE_BASE}/404-error-android.apk`,
  },
  platforms: {
    windows: {
      url: `${RELEASE_BASE}/404-error-windows.exe`,
      portableUrl: `${RELEASE_BASE}/404-error-windows-portable.exe`,
      fileName: '404-error-windows.exe',
    },
    android: {
      url: `${RELEASE_BASE}/404-error-android.apk`,
      fileName: '404-error-android.apk',
    },
  },
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Generated ${path.relative(root, outPath)} for v${version}`);
