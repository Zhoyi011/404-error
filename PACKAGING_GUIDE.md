# 《伪人入侵》PWA / Windows (.exe) / Android (.apk) 全平台打包与热更新指南

本项目已完成 **PWA（渐进式 Web 应用）**、**本地离线缓存** 以及 **Linux 纯终端交叉编译 `.exe` / `.apk`** 的完整配置，统一通过 **`https://404-horror.ai.studio`** 实现**免重新打包、免更换客户端的热更新**。

---

## 一、核心架构说明：为什么无需更换新的 `.exe` / `.apk`？

| 层级 | 在线状态行为 | 离线状态行为 | 更新方式 |
| :--- | :--- | :--- | :--- |
| **PWA (浏览器/桌面安装)** | 直接从 `https://404-horror.ai.studio` 拉取最新网页并由 Workbox Service Worker 静默缓存新版 | 读取本地 `CacheStorage`（含 25MB `rickroll.mp4` 媒体缓存）与 `localStorage` 存档离线运行 | 后台自动检测新版，页面顶部弹窗一键刷新启用，或进入 **设置 → 关于 → 检查热更新** |
| **Windows (.exe)** (`Electron` 壳) | 启动时探测 `https://404-horror.ai.studio`，可达则直接加载线上最新版，同时 Chromium 会话持久化缓存本地数据 | 断网或首次离线启动时，自动切换内置 `127.0.0.1` 静态服务加载打包内嵌的 `app-dist/` 离线版本 | 打开即同步线上最新版本；也可按 `Ctrl+Shift+U` 强制同步线上新版（不丢失本地 40 结局存档） |
| **Android (.apk)** (`Capacitor` / `TWA`) | **Capacitor 模式**：联网时直接加载 `https://404-horror.ai.studio`；**TWA 模式**：由 Chrome TWA 引擎加载线上 PWA | **Capacitor 模式**：断网自动回退至内置 `www/` 离线完整包；**TWA 模式**：读取 Chrome Service Worker 本地缓存 | 直接部署网页到 `https://404-horror.ai.studio`，手机端重启 App 或点击检查更新即可生效 |

> **小贴士（预缓存 25MB 减压神曲视频）**：为保证首次安装不过于缓慢，25MB 视频默认按需缓存。玩家可在游戏标题页「游戏设置」或虚拟系统「设置 → 关于」中点击 **“预缓存完整离线包”**，将视频及图标完整写入本地缓存，随后彻底断网也可流畅游玩全部结局。

---

## 二、PWA 安装教程（Windows / macOS / Android / iOS）

1. 将当前构建部署到 `https://404-horror.ai.studio`。
2. **Windows / macOS（Chrome / Edge）**：
   - 打开 `https://404-horror.ai.studio`，标题页面下方会自动出现 **「安装桌面/手机应用 (PWA)」** 按钮，点击即可安装为独立桌面窗口（或点击浏览器地址栏右侧的安装图标）。
3. **Android（Chrome / Edge）**：
   - 打开网站后点击 **「安装桌面/手机应用 (PWA)」**，或在浏览器菜单选择 **“安装应用 / 添加到主屏幕”**。
4. **iPhone / iPad（iOS Safari）**：
   - 使用 Safari 打开网站，点击标题页 **「添加到 iOS 主屏幕 (PWA)」** 按钮查看引导，或直接点 Safari 底部 **分享 → 添加到主屏幕**。

---

## 三、Linux 终端纯命令行打包 Windows `.exe`

### 1. 准备 Linux 环境（Ubuntu / Debian 示例）
基本便携版 `.exe` 只需要 **Node.js 20+** 即可在 Linux 直接生成；如果你需要自定义 `.exe` 文件图标和 NSIS 安装包，可额外安装 `wine64` 与 `nsis`：

```bash
# 基础环境（已有 Node.js 可跳过）
sudo apt update && sudo apt install -y nodejs npm

# 可选：用于为 .exe 写入 icon.ico 图标及制作安装向导
sudo apt install -y wine64 nsis
```

### 2. 一键打包 `.exe`
在项目根目录执行：

```bash
chmod +x packaging/build-exe.sh packaging/build-apk.sh
./packaging/build-exe.sh
```

脚本会自动完成：
1. 生成 PWA & Windows `.ico` 图标（`node scripts/generate-icons.mjs`）。
2. 执行 `npm run build` 生成离线兜底包并复制到 `packaging/desktop/app-dist/`。
3. 在 Linux 终端交叉编译生成 Windows 安装包/便携版到 **`packaging/desktop/release/`**：
   - `404-horror-portable-1.0.0.exe`（单文件便携版，无需安装直接双击运行）
   - `404-horror-setup-1.0.0.exe`（安装 Wine + NSIS 后同步生成标准安装向导）

### 3. `.exe` 内置快捷键
- `Ctrl + Shift + U`：强制清理缓存并从 `https://404-horror.ai.studio` 拉取最新热更新（不会清除 `localStorage` 游戏存档）。
- `F5` / `Ctrl + R`：刷新页面。
- `F11`：全屏切换。

---

## 四、Linux 终端纯命令行打包 Android `.apk`

提供两种 Linux 终端方案，推荐优先使用 **方案 A（Capacitor 混合壳）**，因为它在**完全断网的首次启动**下也能直接读取 APK 内部打包的离线网页运行。

### 1. 在 Linux 终端安装 JDK 17 与 Android SDK（无桌面环境纯命令行）

```bash
# 1) 安装 OpenJDK 17
sudo apt update && sudo apt install -y openjdk-17-jdk wget unzip

# 2) 安装 Android Command-line Tools
mkdir -p "$HOME/Android/Sdk/cmdline-tools"
cd /tmp
wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdtools.zip
unzip -q cmdtools.zip -d "$HOME/Android/Sdk/cmdline-tools"
mv "$HOME/Android/Sdk/cmdline-tools/cmdline-tools" "$HOME/Android/Sdk/cmdline-tools/latest"

# 3) 配置环境变量（建议写入 ~/.bashrc）
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

# 4) 接受协议并下载对应编译 SDK（Android 15 / API 35）
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"
```

### 2. 方案 A：Capacitor 混合壳打包 `.apk`（推荐：离线兜底 + 热更新）
回到项目根目录执行：

```bash
./packaging/build-apk.sh capacitor
```

输出文件位置：
- `packaging/android-capacitor/android/app/build/outputs/apk/debug/app-debug.apk`

如需生成可上架/长期安装的自签名 **Release 正式版 `.apk`**：

```bash
# 1) 生成签名密钥（仅首次执行）
keytool -genkeypair -v -keystore ~/horror404-release.keystore -alias horror404 \
  -keyalg RSA -keysize 2048 -validity 10000

# 2) 构建未签名 Release APK 并使用 apksigner 签名
cd packaging/android-capacitor/android
./gradlew assembleRelease
"$ANDROID_HOME/build-tools/35.0.0/apksigner" sign \
  --ks ~/horror404-release.keystore \
  --out app-release-signed.apk \
  app/build/outputs/apk/release/app-release-unsigned.apk
```

### 3. 方案 B：Bubblewrap TWA 极简 `.apk`（体积约 2MB，调用手机 Chrome）
适用于手机端已安装 Chrome、追求极小体积的场景：

```bash
./packaging/build-apk.sh twa
```

> **重要（TWA 隐藏浏览器地址栏）**：运行上述命令后终端会打印一串 `SHA256:` 指纹。将其填入 `public/.well-known/assetlinks.json` 的 `sha256_cert_fingerprints` 字段并部署到 `https://404-horror.ai.studio/.well-known/assetlinks.json`，即可让 TWA APK 全屏沉浸隐藏顶栏。

---

## 五、日常如何发布“热更新”？

当你修改完游戏剧情、结局或 UI 后：
1. 在项目根目录重新构建并部署静态文件到 `https://404-horror.ai.studio`（确保同时包含 `dist/sw.js`、`dist/manifest.webmanifest` 和 `dist/.well-known/assetlinks.json`）。
2. **玩家无需下载新的 `.exe` 或 `.apk`**：
   - Windows `.exe` 玩家下次打开软件即自动加载线上新版；
   - Android `.apk` 玩家联网打开软件即直连线上新版；
   - PWA 用户后台静默缓存新版后，点一下 **「立即刷新启用新版」** 即可完成更新！
