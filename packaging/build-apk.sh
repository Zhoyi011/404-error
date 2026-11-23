#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-capacitor}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=================================================="
echo "  伪人入侵 - Linux 终端打包 Android (.apk)"
echo "  当前模式: ${MODE} (可选: capacitor | twa)"
echo "  热更新源: https://404-horror.ai.studio"
echo "=================================================="

if ! command -v java >/dev/null 2>&1; then
  echo "❌ 未检测到 Java (需要 OpenJDK 17)。请先执行："
  echo "   sudo apt update && sudo apt install -y openjdk-17-jdk unzip wget"
  exit 1
fi

if [ "${MODE}" = "twa" ]; then
  TWA_DIR="${ROOT_DIR}/packaging/android-twa"
  cd "${TWA_DIR}"
  if [ ! -f "./android.keystore" ]; then
    echo "生成 TWA 签名密钥 android.keystore..."
    keytool -genkeypair -v -keystore android.keystore -alias horror404 \
      -keyalg RSA -keysize 2048 -validity 10000 \
      -storepass horror404pass -keypass horror404pass \
      -dname "CN=404Horror, OU=Indie, O=404Studio, L=Net, S=Net, C=CN"
  fi
  echo "使用 Bubblewrap 构建轻量级 TWA APK..."
  npx --yes @bubblewrap/cli update --manifest="${TWA_DIR}/twa-manifest.json" || true
  npx --yes @bubblewrap/cli build
  echo ""
  echo "提示: 请提取密钥 SHA-256 指纹并写入 public/.well-known/assetlinks.json 以隐藏顶部地址栏："
  keytool -list -v -keystore android.keystore -alias horror404 -storepass horror404pass | grep "SHA256:" || true
  exit 0
fi

# Capacitor 混合壳模式（内置离线包 + 联网直连 https://404-horror.ai.studio 热更新）
CAP_DIR="${ROOT_DIR}/packaging/android-capacitor"

if [ -z "${ANDROID_HOME:-}" ] && [ -z "${ANDROID_SDK_ROOT:-}" ]; then
  echo "❌ 未设置 ANDROID_HOME / ANDROID_SDK_ROOT 环境变量。"
  echo "请参考 PACKAGING_GUIDE.md 在 Linux 终端配置 Android Command-line Tools。"
  exit 1
fi

echo "[1/5] 构建最新前端离线资源包..."
cd "${ROOT_DIR}"
node scripts/generate-icons.mjs
npm run build

echo "[2/5] 同步 dist/ 到 Capacitor www/..."
rm -rf "${CAP_DIR}/www"
cp -r "${ROOT_DIR}/dist" "${CAP_DIR}/www"

echo "[3/5] 安装 Capacitor 并同步 Android 工程..."
cd "${CAP_DIR}"
npm install
if [ ! -d "${CAP_DIR}/android" ]; then
  npx cap add android
fi
npx cap sync android

echo "[4/5] 注入热更新与离线兜底 MainActivity 及应用图标..."
MAIN_JAVA="${CAP_DIR}/android/app/src/main/java/studio/ai/horror404/app/MainActivity.java"
mkdir -p "$(dirname "${MAIN_JAVA}")"
cp "${CAP_DIR}/MainActivity.java.tmpl" "${MAIN_JAVA}"

# 写入高分辨率 Launcher 图标与网络权限
for RES_DIR in mipmap-mdpi mipmap-hdpi mipmap-xhdpi mipmap-xxhdpi mipmap-xxxhdpi; do
  TARGET_RES="${CAP_DIR}/android/app/src/main/res/${RES_DIR}"
  mkdir -p "${TARGET_RES}"
  cp "${ROOT_DIR}/public/pwa-512x512.png" "${TARGET_RES}/ic_launcher.png"
  cp "${ROOT_DIR}/public/pwa-maskable-512x512.png" "${TARGET_RES}/ic_launcher_round.png"
done

echo "[5/5] 使用 Gradle 在 Linux 终端编译 APK..."
cd "${CAP_DIR}/android"
chmod +x ./gradlew
./gradlew assembleDebug

echo ""
echo "✅ Android APK 编译完成："
ls -lh "${CAP_DIR}/android/app/build/outputs/apk/debug/"*.apk
