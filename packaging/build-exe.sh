#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=================================================="
echo "  伪人入侵 - Tauri v2 Windows (.exe) 打包脚本"
echo "  更新源: https://github.com/Zhoyi011/404-error/releases/latest"
echo "=================================================="

cd "${ROOT_DIR}"
node scripts/generate-icons.mjs

if ! command -v cargo >/dev/null 2>&1; then
  echo "❌ 未检测到 Rust/Cargo 工具链。"
  echo "说明：推荐使用仓库内置 GitHub Actions（push 到 main 自动在 windows-latest 生成 .exe），"
  echo "或在本机安装 Rust (https://rustup.rs) 后运行: npx @tauri-apps/cli@2 build"
  exit 1
fi

OS_NAME="$(uname -s || echo Unknown)"
if [[ "${OS_NAME}" == MINGW* ]] || [[ "${OS_NAME}" == MSYS* ]] || [[ "${OS_NAME}" == CYGWIN* ]] || [[ "${OS_NAME}" == Windows_NT ]]; then
  npx --yes @tauri-apps/cli@2 build --bundles nsis
else
  if command -v cargo-xwin >/dev/null 2>&1 && command -v makensis >/dev/null 2>&1; then
    echo "检测到 cargo-xwin + makensis，开始在 Linux 交叉编译 Windows .exe..."
    npx --yes @tauri-apps/cli@2 build --runner cargo-xwin --target x86_64-pc-windows-msvc --bundles nsis
  else
    echo "⚠️ 当前为 Linux 环境且未安装 cargo-xwin / nsis。"
    echo "若需在本地 Linux 交叉编译 Windows .exe，请安装："
    echo "  rustup target add x86_64-pc-windows-msvc"
    echo "  cargo install --locked cargo-xwin"
    echo "  sudo apt install -y nsis lld llvm clang"
    echo "或直接 git push 到 GitHub main 分支，由 GitHub Actions 自动产出 Windows .exe 与 Android .apk！"
    exit 1
  fi
fi
