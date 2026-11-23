#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESKTOP_DIR="${ROOT_DIR}/packaging/desktop"

echo "=================================================="
echo "  伪人入侵 - Linux 终端打包 Windows (.exe)"
echo "  热更新源: https://404-horror.ai.studio"
echo "=================================================="

echo "[1/4] 生成应用图标与离线前端资源包..."
cd "${ROOT_DIR}"
node scripts/generate-icons.mjs
npm run build

echo "[2/4] 同步离线兜底资源到 Electron 壳..."
rm -rf "${DESKTOP_DIR}/app-dist"
cp -r "${ROOT_DIR}/dist" "${DESKTOP_DIR}/app-dist"

echo "[3/4] 安装 Electron 打包依赖..."
cd "${DESKTOP_DIR}"
npm install

echo "[4/4] 在 Linux 终端交叉编译 Windows .exe..."
if command -v wine >/dev/null 2>&1; then
  echo "检测到 Wine，将完整写入 .ico 图标与 PE 版本元数据..."
  npx electron-builder --win portable nsis --x64
else
  echo "未检测到 Wine：跳过 PE 图标注入，直接生成便携版 Windows .exe..."
  echo "提示: 如需自定义 .exe 文件图标，请先在 Linux 安装 wine (sudo apt install -y wine64 nsis)"
  npx electron-builder --win portable --x64 -c.win.signAndEditExecutable=false
fi

echo ""
echo "✅ 打包完成！输出文件位于："
ls -lh "${DESKTOP_DIR}/release/"*.exe 2>/dev/null || ls -lh "${DESKTOP_DIR}/release/"
