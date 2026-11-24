export const GITHUB_REPO = 'Zhoyi011/404-error';
export const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO}`;
export const GITHUB_RELEASES_LATEST_PAGE = `${GITHUB_REPO_URL}/releases/latest`;
export const VERSION_JSON_URL = `${GITHUB_REPO_URL}/releases/latest/download/version.json`;
export const DEFAULT_WINDOWS_EXE_URL = `${GITHUB_REPO_URL}/releases/latest/download/404-error-windows.exe`;
export const DEFAULT_WINDOWS_PORTABLE_EXE_URL = `${GITHUB_REPO_URL}/releases/latest/download/404-error-windows-portable.exe`;
export const DEFAULT_LINUX_APPIMAGE_URL = `${GITHUB_REPO_URL}/releases/latest/download/404-error-linux.AppImage`;
export const DEFAULT_LINUX_DEB_URL = `${GITHUB_REPO_URL}/releases/latest/download/404-error-linux.deb`;
export const DEFAULT_ANDROID_APK_URL = `${GITHUB_REPO_URL}/releases/latest/download/404-error-android.apk`;

export type WebDownloadOS = 'Windows' | 'Linux' | 'Android';

export type WebDownloadTargetId =
  | 'windows-installer'
  | 'windows-portable'
  | 'linux-appimage'
  | 'linux-deb'
  | 'android-apk';

export type DetectedVisitorOS =
  | 'windows'
  | 'linux-deb'
  | 'linux-appimage'
  | 'android'
  | 'macos'
  | 'ios'
  | 'unknown';

export interface VisitorDeviceProfile {
  os: DetectedVisitorOS;
  displayName: string;
  shortButtonLabel: string;
  archLabel?: string;
  recommendedTargetId: WebDownloadTargetId | null;
  reason: string;
  supportsNativeClient: boolean;
}

export interface WebDownloadOption {
  id: WebDownloadTargetId;
  os: WebDownloadOS;
  title: string;
  subtitle: string;
  fileName: string;
  url: string;
}

export const CLIENT_DOWNLOAD_OPTIONS: WebDownloadOption[] = [
  {
    id: 'windows-installer',
    os: 'Windows',
    title: 'Windows 安装版 (.exe)',
    subtitle: '含标准安装向导与桌面快捷方式，适合常用电脑安装',
    fileName: '404-error-windows.exe',
    url: DEFAULT_WINDOWS_EXE_URL,
  },
  {
    id: 'windows-portable',
    os: 'Windows',
    title: 'Windows 绿色便携版 (.exe)',
    subtitle: '单文件免安装，下载后即可直接双击运行',
    fileName: '404-error-windows-portable.exe',
    url: DEFAULT_WINDOWS_PORTABLE_EXE_URL,
  },
  {
    id: 'linux-appimage',
    os: 'Linux',
    title: 'Linux 通用便携版 (.AppImage)',
    subtitle: '适配绝大多数 Linux 发行版，赋予执行权限即可运行',
    fileName: '404-error-linux.AppImage',
    url: DEFAULT_LINUX_APPIMAGE_URL,
  },
  {
    id: 'linux-deb',
    os: 'Linux',
    title: 'Linux 安装包 (.deb)',
    subtitle: '适配 Ubuntu / Debian / Linux Mint / Deepin 等 APT 系统',
    fileName: '404-error-linux.deb',
    url: DEFAULT_LINUX_DEB_URL,
  },
  {
    id: 'android-apk',
    os: 'Android',
    title: 'Android 客户端 (.apk)',
    subtitle: '适配安卓手机与平板，内置完整离线游玩资源',
    fileName: '404-error-android.apk',
    url: DEFAULT_ANDROID_APK_URL,
  },
];

interface NavigatorUAData {
  platform?: string;
  mobile?: boolean;
  getHighEntropyValues?: (hints: string[]) => Promise<{
    platform?: string;
    architecture?: string;
    bitness?: string;
  }>;
}

function buildVisitorProfile(
  rawPlatform: string,
  ua: string,
  navPlatform: string,
  maxTouchPoints: number,
  archHint?: string
): VisitorDeviceProfile {
  const plat = rawPlatform.toLowerCase();
  const uaLower = ua.toLowerCase();
  const navPlatLower = navPlatform.toLowerCase();

  let archLabel = archHint;
  if (!archLabel) {
    if (/aarch64|arm64/.test(uaLower) || /arm64/.test(navPlatLower)) {
      archLabel = 'ARM64';
    } else if (/win64|wow64|x86_64|amd64|x64/.test(uaLower) || /x86_64/.test(navPlatLower)) {
      archLabel = '64位 (x86_64)';
    }
  }

  // 1. Android
  if (plat === 'android' || /android/.test(uaLower)) {
    return {
      os: 'android',
      displayName: 'Android 移动设备',
      shortButtonLabel: '推荐 Android (.apk)',
      archLabel,
      recommendedTargetId: 'android-apk',
      reason: '已识别您正在使用 Android 设备，为您自动推荐并选中安卓独立安装包 (.apk)。',
      supportsNativeClient: true,
    };
  }

  // 2. iOS / iPadOS (including iPad desktop UA mode)
  if (
    plat === 'ios' ||
    /iphone|ipad|ipod/.test(uaLower) ||
    (/mac/.test(navPlatLower) && maxTouchPoints > 1)
  ) {
    return {
      os: 'ios',
      displayName: 'iOS / iPadOS 设备',
      shortButtonLabel: '桌面/安卓客户端',
      archLabel,
      recommendedTargetId: null,
      reason:
        '检测到您正在使用 iPhone / iPad：当前无 iOS 安装包，推荐直接点击「添加到 iOS 主屏幕 (PWA)」离线游玩；也可在下方为其他电脑或安卓设备下载。',
      supportsNativeClient: false,
    };
  }

  // 3. Windows
  if (plat === 'windows' || /windows|win32|win64/.test(uaLower) || /win/.test(navPlatLower)) {
    return {
      os: 'windows',
      displayName: 'Windows 桌面系统',
      shortButtonLabel: '推荐 Windows (.exe)',
      archLabel,
      recommendedTargetId: 'windows-installer',
      reason: '已识别您正在使用 Windows 系统，为您推荐标准安装版 (.exe)，也可切换为免安装便携版。',
      supportsNativeClient: true,
    };
  }

  // 4. Linux (Debian/Ubuntu vs general AppImage)
  if (
    plat === 'linux' ||
    ((/linux|x11/.test(uaLower) || /linux/.test(navPlatLower)) && !/android/.test(uaLower))
  ) {
    const isDebDistro = /ubuntu|debian|mint|pop!_os|kali|deepin|uos|elementary|zorin/.test(
      uaLower
    );
    if (isDebDistro) {
      return {
        os: 'linux-deb',
        displayName: 'Linux (Debian / Ubuntu 系)',
        shortButtonLabel: '推荐 Linux (.deb)',
        archLabel,
        recommendedTargetId: 'linux-deb',
        reason:
          '已识别到 Debian / Ubuntu 系列 Linux 系统，优先为您推荐 .deb 安装包（亦支持 AppImage 便携运行）。',
        supportsNativeClient: true,
      };
    }
    return {
      os: 'linux-appimage',
      displayName: 'Linux 桌面系统',
      shortButtonLabel: '推荐 Linux (AppImage)',
      archLabel,
      recommendedTargetId: 'linux-appimage',
      reason:
        '已识别您正在使用 Linux 桌面系统，为您优先推荐通用 AppImage 格式（Debian / Ubuntu 用户可选 .deb）。',
      supportsNativeClient: true,
    };
  }

  // 5. macOS
  if (plat === 'macos' || /macintosh|mac os x/.test(uaLower) || /mac/.test(navPlatLower)) {
    return {
      os: 'macos',
      displayName: 'macOS 桌面系统',
      shortButtonLabel: 'Win / Linux / APK',
      archLabel,
      recommendedTargetId: null,
      reason:
        '检测到您正在使用 macOS：目前暂无原生 .dmg 客户端，推荐直接安装网页版 PWA 本地运行；如需给其他设备下载安装包，请在下方选择。',
      supportsNativeClient: false,
    };
  }

  return {
    os: 'unknown',
    displayName: '未知操作系统',
    shortButtonLabel: 'Win / Linux / APK',
    archLabel,
    recommendedTargetId: 'windows-installer',
    reason: '未能精确识别当前系统环境，请根据实际设备在下方选择对应的客户端安装包。',
    supportsNativeClient: true,
  };
}

export function detectVisitorDevice(): VisitorDeviceProfile {
  if (typeof window === 'undefined') {
    return buildVisitorProfile('', '', '', 0);
  }
  const nav = window.navigator as Navigator & { userAgentData?: NavigatorUAData };
  return buildVisitorProfile(
    nav.userAgentData?.platform || '',
    nav.userAgent || '',
    nav.platform || '',
    nav.maxTouchPoints || 0
  );
}

export async function detectVisitorDeviceAsync(): Promise<VisitorDeviceProfile> {
  if (typeof window === 'undefined') {
    return buildVisitorProfile('', '', '', 0);
  }
  const nav = window.navigator as Navigator & { userAgentData?: NavigatorUAData };
  let highPlatform = nav.userAgentData?.platform || '';
  let archHint: string | undefined;

  if (nav.userAgentData?.getHighEntropyValues) {
    try {
      const entropy = await nav.userAgentData.getHighEntropyValues([
        'platform',
        'architecture',
        'bitness',
      ]);
      if (entropy.platform) {
        highPlatform = entropy.platform;
      }
      if (entropy.architecture) {
        const arch = entropy.architecture.toLowerCase();
        if (arch === 'arm') {
          archHint = entropy.bitness === '64' ? 'ARM64' : 'ARM';
        } else if (arch === 'x86') {
          archHint = entropy.bitness === '64' ? '64位 (x86_64)' : '32位 (x86)';
        }
      }
    } catch {
      // Ignore client hints permission errors
    }
  }

  return buildVisitorProfile(
    highPlatform,
    nav.userAgent || '',
    nav.platform || '',
    nav.maxTouchPoints || 0,
    archHint
  );
}

export type ClientRuntimePlatform =
  | 'windows-exe'
  | 'linux-appimage'
  | 'linux-deb'
  | 'android-apk'
  | 'web';

export function isDesktopTauriPlatform(platform: ClientRuntimePlatform): boolean {
  return (
    platform === 'windows-exe' ||
    platform === 'linux-appimage' ||
    platform === 'linux-deb'
  );
}

export interface ReleaseVersionManifest {
  version: string;
  tag?: string;
  releaseDate?: string;
  notes?: string;
  downloads?: {
    windows?: string;
    windowsPortable?: string;
    linuxAppImage?: string;
    linuxDeb?: string;
    android?: string;
  };
  platforms?: {
    windows?: { url?: string; portableUrl?: string; fileName?: string };
    linux?: {
      appImageUrl?: string;
      debUrl?: string;
      appImageFileName?: string;
      debFileName?: string;
    };
    android?: { url?: string; fileName?: string };
  };
}

interface TauriGlobal {
  core?: {
    invoke: <T = unknown>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
  };
}

interface AndroidClientBridge {
  getAppVersion?: () => string;
  openDownloadUrl?: (url: string) => boolean;
  fetchRemoteJson?: (url: string) => string;
}

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
}

function getExtendedWindow() {
  return window as unknown as {
    __TAURI__?: TauriGlobal;
    __TAURI_INTERNALS__?: {
      invoke?: <T = unknown>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
    };
    Capacitor?: CapacitorGlobal;
    AndroidClientBridge?: AndroidClientBridge;
  };
}

export function detectClientPlatform(): ClientRuntimePlatform {
  if (typeof window === 'undefined') return 'web';

  const win = getExtendedWindow();
  const ua = window.navigator.userAgent.toLowerCase();
  const navPlatform = (window.navigator.platform || '').toLowerCase();
  const clientParam = new URLSearchParams(window.location.search).get('client')?.toLowerCase();

  const isTauriDesktop =
    Boolean(win.__TAURI__) ||
    Boolean(win.__TAURI_INTERNALS__) ||
    ua.includes('404horror-desktop') ||
    ua.includes('tauri') ||
    clientParam === 'exe' ||
    clientParam === 'linux' ||
    clientParam === 'appimage' ||
    clientParam === 'deb';

  if (isTauriDesktop) {
    if (clientParam === 'deb') return 'linux-deb';
    if (clientParam === 'appimage' || clientParam === 'linux') return 'linux-appimage';
    if (clientParam === 'exe') return 'windows-exe';
    if ((/linux|x11/.test(ua) || /linux/.test(navPlatform)) && !/android/.test(ua)) {
      return 'linux-appimage';
    }
    return 'windows-exe';
  }

  const isAndroidApk =
    Boolean(win.AndroidClientBridge) ||
    Boolean(win.Capacitor?.isNativePlatform?.()) ||
    Boolean(win.Capacitor && win.Capacitor.getPlatform?.() === 'android') ||
    ua.includes('404horror-android') ||
    (/android/.test(ua) && /; wv\)/.test(ua)) ||
    document.referrer.startsWith('android-app://') ||
    clientParam === 'apk';

  if (isAndroidApk) {
    return 'android-apk';
  }

  return 'web';
}

export function isNativeAppRuntime(): boolean {
  return detectClientPlatform() !== 'web';
}

async function invokeTauri<T>(cmd: string, args?: Record<string, unknown>): Promise<T | null> {
  const win = getExtendedWindow();
  const invoker = win.__TAURI__?.core?.invoke || win.__TAURI_INTERNALS__?.invoke;
  if (!invoker) return null;
  try {
    return await invoker<T>(cmd, args);
  } catch {
    return null;
  }
}

export async function resolveClientRuntimePlatform(): Promise<ClientRuntimePlatform> {
  const detected = detectClientPlatform();
  if (!isDesktopTauriPlatform(detected)) {
    return detected;
  }

  const nativeTarget = await invokeTauri<string>('get_client_platform_info');
  if (
    nativeTarget === 'windows-exe' ||
    nativeTarget === 'linux-appimage' ||
    nativeTarget === 'linux-deb'
  ) {
    return nativeTarget;
  }

  return detected;
}

export async function getCurrentClientVersion(platform: ClientRuntimePlatform): Promise<string> {
  const fallback = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';
  if (isDesktopTauriPlatform(platform)) {
    const tauriVer = await invokeTauri<string>('get_app_version');
    if (tauriVer && /^\d+\.\d+\.\d+/.test(tauriVer)) {
      return tauriVer;
    }
  } else if (platform === 'android-apk') {
    const bridgeVer = getExtendedWindow().AndroidClientBridge?.getAppVersion?.();
    if (bridgeVer && /^\d+\.\d+\.\d+/.test(bridgeVer)) {
      return bridgeVer;
    }
  }
  return fallback;
}

interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
}

function parseSemver(raw: string): ParsedSemver | null {
  const cleaned = raw.trim().replace(/^v/i, '');
  const match = cleaned.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? match[4].split('.') : [],
  };
}

/**
 * Returns > 0 if remote > local, 0 if equal, < 0 if remote < local.
 */
export function compareVersions(remoteVersion: string, localVersion: string): number {
  const a = parseSemver(remoteVersion);
  const b = parseSemver(localVersion);
  if (!a || !b) {
    return remoteVersion.trim() === localVersion.trim() ? 0 : 0;
  }

  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;

  if (a.prerelease.length === 0 && b.prerelease.length === 0) return 0;
  if (a.prerelease.length === 0) return 1;
  if (b.prerelease.length === 0) return -1;

  const len = Math.max(a.prerelease.length, b.prerelease.length);
  for (let i = 0; i < len; i++) {
    const pa = a.prerelease[i];
    const pb = b.prerelease[i];
    if (pa === undefined) return -1;
    if (pb === undefined) return 1;
    const na = /^\d+$/.test(pa) ? Number(pa) : null;
    const nb = /^\d+$/.test(pb) ? Number(pb) : null;
    if (na !== null && nb !== null) {
      if (na !== nb) return na - nb;
    } else if (na !== null) {
      return -1;
    } else if (nb !== null) {
      return 1;
    } else if (pa !== pb) {
      return pa < pb ? -1 : 1;
    }
  }
  return 0;
}

export function resolveDownloadUrlForPlatform(
  manifest: ReleaseVersionManifest,
  platform: ClientRuntimePlatform
): string {
  if (platform === 'windows-exe') {
    return (
      manifest.platforms?.windows?.url ||
      manifest.downloads?.windows ||
      DEFAULT_WINDOWS_EXE_URL
    );
  }
  if (platform === 'linux-appimage') {
    return (
      manifest.platforms?.linux?.appImageUrl ||
      manifest.downloads?.linuxAppImage ||
      DEFAULT_LINUX_APPIMAGE_URL
    );
  }
  if (platform === 'linux-deb') {
    return (
      manifest.platforms?.linux?.debUrl ||
      manifest.downloads?.linuxDeb ||
      DEFAULT_LINUX_DEB_URL
    );
  }
  if (platform === 'android-apk') {
    return (
      manifest.platforms?.android?.url ||
      manifest.downloads?.android ||
      DEFAULT_ANDROID_APK_URL
    );
  }
  return GITHUB_RELEASES_LATEST_PAGE;
}

export async function fetchLatestReleaseManifest(
  platform: ClientRuntimePlatform
): Promise<ReleaseVersionManifest | null> {
  if (platform === 'web') return null;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;

  const cacheBustedUrl = `${VERSION_JSON_URL}?t=${Date.now()}`;
  let rawText: string | null = null;

  if (isDesktopTauriPlatform(platform)) {
    rawText = await invokeTauri<string>('fetch_remote_json', { url: cacheBustedUrl });
  } else if (platform === 'android-apk') {
    const bridgeText = getExtendedWindow().AndroidClientBridge?.fetchRemoteJson?.(cacheBustedUrl);
    if (bridgeText && bridgeText.trim().startsWith('{')) {
      rawText = bridgeText;
    }
  }

  if (!rawText) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(cacheBustedUrl, {
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!response.ok) return null;
      rawText = await response.text();
    } catch {
      return null;
    } finally {
      window.clearTimeout(timer);
    }
  }

  try {
    const parsed = JSON.parse(rawText) as ReleaseVersionManifest;
    if (!parsed || typeof parsed.version !== 'string' || !parseSemver(parsed.version)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function triggerClientDownload(
  url: string,
  platform: ClientRuntimePlatform
): Promise<boolean> {
  if (!url.startsWith(`${GITHUB_REPO_URL}/`)) {
    return false;
  }

  if (isDesktopTauriPlatform(platform)) {
    const invoked = await invokeTauri<void>('open_download_url', { url });
    if (invoked !== null) return true;
  }

  if (platform === 'android-apk') {
    const opened = getExtendedWindow().AndroidClientBridge?.openDownloadUrl?.(url);
    if (opened) return true;
  }

  // Fallback anchor click (avoids window.open while triggering browser/OS download)
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
