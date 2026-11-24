export const GITHUB_REPO = 'Zhoyi011/404-error';
export const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO}`;
export const GITHUB_RELEASES_LATEST_PAGE = `${GITHUB_REPO_URL}/releases/latest`;
export const VERSION_JSON_URL = `${GITHUB_REPO_URL}/releases/latest/download/version.json`;
export const DEFAULT_WINDOWS_EXE_URL = `${GITHUB_REPO_URL}/releases/latest/download/404-error-windows.exe`;
export const DEFAULT_ANDROID_APK_URL = `${GITHUB_REPO_URL}/releases/latest/download/404-error-android.apk`;

export type ClientRuntimePlatform = 'windows-exe' | 'android-apk' | 'web';

export interface ReleaseVersionManifest {
  version: string;
  tag?: string;
  releaseDate?: string;
  notes?: string;
  downloads?: {
    windows?: string;
    windowsPortable?: string;
    android?: string;
  };
  platforms?: {
    windows?: { url?: string; portableUrl?: string; fileName?: string };
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
    __TAURI_INTERNALS__?: { invoke?: <T = unknown>(cmd: string, args?: Record<string, unknown>) => Promise<T> };
    Capacitor?: CapacitorGlobal;
    AndroidClientBridge?: AndroidClientBridge;
  };
}

export function detectClientPlatform(): ClientRuntimePlatform {
  if (typeof window === 'undefined') return 'web';

  const win = getExtendedWindow();
  const ua = window.navigator.userAgent.toLowerCase();
  const clientParam = new URLSearchParams(window.location.search).get('client')?.toLowerCase();

  const isTauriDesktop =
    Boolean(win.__TAURI__) ||
    Boolean(win.__TAURI_INTERNALS__) ||
    ua.includes('404horror-desktop') ||
    ua.includes('tauri') ||
    clientParam === 'exe';

  if (isTauriDesktop) {
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

export async function getCurrentClientVersion(platform: ClientRuntimePlatform): Promise<string> {
  const fallback = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';
  if (platform === 'windows-exe') {
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

  if (platform === 'windows-exe') {
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

  if (platform === 'windows-exe') {
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
