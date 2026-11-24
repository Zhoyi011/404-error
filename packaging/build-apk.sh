#!/usr/bin/env bash
set -euo pipefail

BUILD_TYPE="${1:-debug}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CAP_DIR="${ROOT_DIR}/packaging/android-capacitor"

echo "=================================================="
echo "  伪人入侵 - Capacitor Android (.apk) 构建脚本"
echo "  构建类型: ${BUILD_TYPE} (debug | release)"
echo "  更新源: https://github.com/Zhoyi011/404-error/releases/latest"
echo "=================================================="

if ! command -v java >/dev/null 2>&1; then
  echo "❌ 未检测到 Java (需要 OpenJDK 17+)。"
  exit 1
fi

if [ -z "${ANDROID_HOME:-}" ]; then
  if [ -n "${ANDROID_SDK_ROOT:-}" ]; then
    export ANDROID_HOME="${ANDROID_SDK_ROOT}"
  elif [ -d "${HOME}/Android/Sdk" ]; then
    export ANDROID_HOME="${HOME}/Android/Sdk"
  elif [ -d "/usr/local/lib/android/sdk" ]; then
    export ANDROID_HOME="/usr/local/lib/android/sdk"
  elif [ -d "/opt/android-sdk" ]; then
    export ANDROID_HOME="/opt/android-sdk"
  fi
fi

if [ -z "${ANDROID_HOME:-}" ] || [ ! -d "${ANDROID_HOME}" ]; then
  echo "❌ 未找到 Android SDK (ANDROID_HOME)。"
  exit 1
fi
export ANDROID_SDK_ROOT="${ANDROID_HOME}"

APP_VERSION="$(node -e 'console.log(require("./package.json").version || "1.0.0")' 2>/dev/null || echo "1.0.0")"
VERSION_CODE="$(node -e '
  const v = (require("./package.json").version || "1.0.0").split("-")[0].split(".").map(Number);
  const code = (v[0] || 1) * 10000 + (v[1] || 0) * 100 + (v[2] || 0);
  console.log(Math.max(1, code));
')"

echo "[1/6] 生成图标并构建前端离线资源包 (v${APP_VERSION})..."
cd "${ROOT_DIR}"
node scripts/generate-icons.mjs
npm run build

echo "[2/6] 同步 dist/ 到 Capacitor www/..."
rm -rf "${CAP_DIR}/www"
cp -r "${ROOT_DIR}/dist" "${CAP_DIR}/www"

echo "[3/6] 安装 Capacitor 依赖并同步 Android 工程..."
cd "${CAP_DIR}"
npm install

if [ ! -f "${CAP_DIR}/android/gradlew" ]; then
  rm -rf "${CAP_DIR}/android"
  CI=true npx cap add android
fi
CI=true npx cap sync android

echo "[4/6] 配置 local.properties、版本信息与权限..."
printf 'sdk.dir=%s\n' "${ANDROID_HOME}" > "${CAP_DIR}/android/local.properties"

APP_BUILD_GRADLE="${CAP_DIR}/android/app/build.gradle"
node -e '
const fs = require("node:fs");
const [p, vName, vCode] = process.argv.slice(1);
let gradle = fs.readFileSync(p, "utf8");
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${vCode}`);
gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${vName}"`);
fs.writeFileSync(p, gradle);
' "${APP_BUILD_GRADLE}" "${APP_VERSION}" "${VERSION_CODE}"

MANIFEST_XML="${CAP_DIR}/android/app/src/main/AndroidManifest.xml"
node -e '
const fs = require("node:fs");
const p = process.argv[1];
let xml = fs.readFileSync(p, "utf8");
if (!xml.includes("android.permission.ACCESS_NETWORK_STATE")) {
  xml = xml.replace(
    /<uses-permission android:name="android\.permission\.INTERNET"\s*\/>/,
    "<uses-permission android:name=\"android.permission.INTERNET\" />\n    <uses-permission android:name=\"android.permission.ACCESS_NETWORK_STATE\" />"
  );
}
fs.writeFileSync(p, xml);
' "${MANIFEST_XML}"

echo "[5/6] 注入 MainActivity 更新桥接与自适应图标..."
MAIN_JAVA="${CAP_DIR}/android/app/src/main/java/studio/ai/horror404/app/MainActivity.java"
mkdir -p "$(dirname "${MAIN_JAVA}")"
cp "${CAP_DIR}/MainActivity.java.tmpl" "${MAIN_JAVA}"

for RES_DIR in mipmap-mdpi mipmap-hdpi mipmap-xhdpi mipmap-xxhdpi mipmap-xxxhdpi; do
  TARGET_RES="${CAP_DIR}/android/app/src/main/res/${RES_DIR}"
  mkdir -p "${TARGET_RES}"
  cp "${ROOT_DIR}/public/pwa-512x512.png" "${TARGET_RES}/ic_launcher.png"
  cp "${ROOT_DIR}/public/pwa-maskable-512x512.png" "${TARGET_RES}/ic_launcher_round.png"
  cp "${ROOT_DIR}/public/pwa-maskable-512x512.png" "${TARGET_RES}/ic_launcher_foreground.png"
done

VALUES_DIR="${CAP_DIR}/android/app/src/main/res/values"
mkdir -p "${VALUES_DIR}"
cat > "${VALUES_DIR}/ic_launcher_background.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#070b14</color>
</resources>
EOF

echo "[6/6] 编译 Android APK..."
cd "${CAP_DIR}/android"
chmod +x ./gradlew

if [ "${BUILD_TYPE}" = "release" ] || [ "${BUILD_TYPE}" = "--release" ]; then
  ./gradlew assembleRelease
  UNSIGNED_APK="${CAP_DIR}/android/app/build/outputs/apk/release/app-release-unsigned.apk"
  OUT_APK="${CAP_DIR}/404-error-android.apk"
  if [ -n "${ANDROID_KEYSTORE_PATH:-}" ] && [ -f "${ANDROID_KEYSTORE_PATH}" ]; then
    APKSIGNER="$(find "${ANDROID_HOME}/build-tools" -name apksigner | sort -V | tail -n 1)"
    "${APKSIGNER}" sign \
      --ks "${ANDROID_KEYSTORE_PATH}" \
      --ks-pass "pass:${ANDROID_KEYSTORE_PASSWORD}" \
      --ks-key-alias "${ANDROID_KEY_ALIAS}" \
      --key-pass "pass:${ANDROID_KEY_PASSWORD}" \
      --out "${OUT_APK}" \
      "${UNSIGNED_APK}"
    echo "✅ 已签名 Release APK: ${OUT_APK}"
  else
    cp "${UNSIGNED_APK}" "${OUT_APK}"
    echo "⚠️ 未检测到签名环境变量，已输出未签名 Release APK: ${OUT_APK}"
  fi
else
  ./gradlew assembleDebug
  cp "${CAP_DIR}/android/app/build/outputs/apk/debug/app-debug.apk" "${CAP_DIR}/404-error-android.apk"
  echo "✅ Debug APK 编译完成: ${CAP_DIR}/404-error-android.apk"
fi
