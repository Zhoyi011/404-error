# 《伪人入侵》跨平台打包与 GitHub Releases 自动更新指南

本项目采用 **Tauri v2（Windows `.exe` / Linux `AppImage` & `.deb`）+ Capacitor（Android `.apk`）+ GitHub Actions / Releases** 架构：
- **离线可用**：桌面端与 `.apk` 均将完整前端与资源打包在本地，断网或无网络下可直接流畅运行。
- **自动更新托管**：统一托管在 `https://github.com/Zhoyi011/404-error/releases/latest`。
- **端环境隔离**：自动更新检测与弹窗**仅在原生客户端中触发**；普通浏览器网页端不会弹出客户端更新提示。

---

## 一、GitHub Actions 自动化发布流程（Push 即触发）

工作流文件：`.github/workflows/release.yml`
- **触发方式**：直接 `git push` 到 `main` 或 `release/**` 分支（无 Pull Request 触发），也支持 GitHub 网页端 `workflow_dispatch` 手动触发。
- **流水线步骤**：
  1. `resolve-version`：读取 `package.json` 版本号；若该版本 Tag（如 `v1.0.0`）已存在，则自动递增补丁位（`v1.0.1`、`v1.0.2`……）并收集近期 commit 日志作为更新原料。
  2. `build-windows-exe`（`windows-latest`）：同步版本号 → 安装依赖 → 编译 Tauri v2 Windows NSIS 安装版（`404-error-windows.exe`）与绿色单文件版（`404-error-windows-portable.exe`）。
  3. `build-linux`（`ubuntu-latest`）：安装 Linux Tauri 依赖 → 编译通用便携版（`404-error-linux.AppImage`）与 Debian/Ubuntu 安装包（`404-error-linux.deb`）。
  4. `build-android-apk`（`ubuntu-latest`）：配置 JDK 17 + Android 34 SDK → 同步版本号 → 构建并签名 Android APK（`404-error-android.apk`）。
  5. `publish-release`：通过 `scripts/polish-release-notes.mjs` 与 `scripts/generate-version-json.mjs` 将本次更新整理为结构化**简体中文更新说明**（优先调用 Gemini API 润色，若未配置 Key 或超时则自动无缝降级为内置中文整理器），同步写入 `version.json` 与 GitHub Release 正文，并上传全平台固定文件名附件。

---

## 二、GitHub Secrets 配置说明

进入仓库 **Settings → Secrets and variables → Actions → New repository secret**：

### 1. 中文更新日志 AI 润色密钥（可选，强烈建议配置）
- `GEMINI_API_KEY`：Google Gemini API 密钥（仅在 GitHub Actions 发布阶段读取，绝不打包进前端/客户端代码）。
- 若未配置或请求失败，发布脚本会自动降级为内置规则中文改写器，不会中断发版流程。

### 2. Android APK 正式签名密钥（强烈建议配置）
若暂未配置，流水线会自动降级产出可安装的 **Debug 签名 APK**；配置后将自动产出正式签名 **Release APK**：
1. `KEYSTORE_BASE64`：`.keystore` 文件的 Base64 编码字符串
2. `KEYSTORE_PASSWORD`：Keystore 密码
3. `KEY_ALIAS`：密钥别名（例如 `horror404`）
4. `KEY_PASSWORD`：密钥密码

**在本地终端生成密钥与 Base64 示例**：
```bash
keytool -genkeypair -v -keystore horror404-release.keystore -alias horror404 \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -w 0 horror404-release.keystore
```
> 注意：`GITHUB_TOKEN` 由 GitHub Actions 自动提供，只需保证工作流中的 `permissions: contents: write`（已配置），无需手动添加 PAT。

---

## 三、本地测试打包命令

- **生成全平台图标**：`npm run icons`
- **构建网页 / PWA**：`npm run build`
- **本地构建 Android APK**（需已配置 JDK 17 与 Android SDK）：
  ```bash
  npm run pack:apk
  ```
- **本地构建 Windows Tauri EXE**（需已安装 Rust 与 Tauri 依赖）：
  ```bash
  npm run pack:exe
  ```

---

## 四、客户端更新弹窗测试方法

1. 本地发版或推送前保持旧版本号（如 `1.0.0`），并已在 GitHub Releases 发布过更新的版本（如 `1.0.1`）。
2. 在 Windows `.exe` 或 Android `.apk` 中启动应用（或从后台切回前台），客户端会在后台静默请求 `version.json?t=...`：
   - 若远端版本 `>` 本地版本，自动弹出 **「发现客户端新版本」** 对话框并展示更新说明；
   - 点击 **「立即更新」** 后，Windows 端直接拉起 `404-error-windows.exe` 下载，Android 端直接拉起 `404-error-android.apk` 下载；
   - 若处于断网状态，请求静默跳过，游戏可正常离线游玩。
3. 在普通浏览器（Chrome / Edge / Safari）打开网页时，不会运行此更新检测，也不会弹出客户端更新窗口。
