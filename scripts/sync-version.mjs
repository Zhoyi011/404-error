import fs from 'node:fs';
import path from 'node:path';

const targetVersion = (process.argv[2] || '').replace(/^v/, '').trim();

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(targetVersion)) {
  console.error(`Usage: node scripts/sync-version.mjs <semver> (got "${targetVersion}")`);
  process.exit(1);
}

const root = process.cwd();

function updateJsonVersion(relPath) {
  const filePath = path.join(root, relPath);
  if (!fs.existsSync(filePath)) return;
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  json.version = targetVersion;
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n');
  console.log(`Synced ${relPath} -> ${targetVersion}`);
}

updateJsonVersion('package.json');
updateJsonVersion('src-tauri/tauri.conf.json');
updateJsonVersion('packaging/android-capacitor/package.json');

const cargoPath = path.join(root, 'src-tauri', 'Cargo.toml');
if (fs.existsSync(cargoPath)) {
  let cargo = fs.readFileSync(cargoPath, 'utf8');
  cargo = cargo.replace(/^version\s*=\s*"[^"]+"/m, `version = "${targetVersion}"`);
  fs.writeFileSync(cargoPath, cargo);
  console.log(`Synced src-tauri/Cargo.toml -> ${targetVersion}`);
}
