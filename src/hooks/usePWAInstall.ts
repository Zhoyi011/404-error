import { useCallback, useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

export const REMOTE_UPDATE_ORIGIN = 'https://404-horror.ai.studio';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type SyncListener = () => void;

const syncState = {
  needRefresh: false,
  offlineReady: false,
  checkingUpdate: false,
  cachingMedia: false,
  mediaCached: false,
  cacheCount: 0,
  lastChecked: null as string | null,
  statusText: '就绪',
  registration: null as ServiceWorkerRegistration | null,
  updateFn: null as ((reloadPage?: boolean) => Promise<void>) | null,
};

const listeners = new Set<SyncListener>();
let swInitialized = false;

function emitSync() {
  listeners.forEach((fn) => fn());
}

async function inspectLocalCache() {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const cacheNames = await window.caches.keys();
    let totalEntries = 0;
    let hasVideo = false;
    for (const name of cacheNames) {
      const cache = await window.caches.open(name);
      const reqs = await cache.keys();
      totalEntries += reqs.length;
      if (reqs.some((r) => r.url.includes('/video/rickroll.mp4'))) {
        hasVideo = true;
      }
    }
    syncState.cacheCount = totalEntries;
    syncState.mediaCached = hasVideo;
    emitSync();
  } catch {
    // Ignore storage quota / private mode restrictions
  }
}

function initServiceWorkerOnce() {
  if (swInitialized || typeof window === 'undefined') return;
  swInitialized = true;

  try {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        syncState.needRefresh = true;
        syncState.statusText = '检测到远程新版本，已缓存到本地等待应用';
        emitSync();
      },
      onOfflineReady() {
        syncState.offlineReady = true;
        syncState.statusText = '核心离线资源已缓存到本地';
        void inspectLocalCache();
        emitSync();
      },
      onRegisteredSW(_swUrl, registration) {
        if (registration) {
          syncState.registration = registration;
          // Periodic background update check every 30 minutes
          window.setInterval(() => {
            if (navigator.onLine) {
              void registration.update();
            }
          }, 30 * 60 * 1000);
        }
        void inspectLocalCache();
        emitSync();
      },
    });
    syncState.updateFn = updateSW;
  } catch {
    // Service worker unsupported in restricted embedded contexts
  }
  void inspectLocalCache();
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isNativeShell, setIsNativeShell] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const isElectronOrCap =
      ua.includes('electron') ||
      ua.includes('404horror-desktop') ||
      ua.includes('404horror-android') ||
      Boolean((window as unknown as { Capacitor?: unknown }).Capacitor);

    setIsInstalled(isStandalone || isElectronOrCap);
    setIsNativeShell(isElectronOrCap);
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isNativeShell,
    install,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function usePWASync() {
  const [, setTick] = useState(0);

  useEffect(() => {
    initServiceWorkerOnce();
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    void inspectLocalCache();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (syncState.checkingUpdate) return false;
    syncState.checkingUpdate = true;
    syncState.statusText = `正在向 ${REMOTE_UPDATE_ORIGIN} 检查更新...`;
    emitSync();

    try {
      if (syncState.registration) {
        await syncState.registration.update();
      } else if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          syncState.registration = reg;
          await reg.update();
        }
      }
      // Also probe manifest to verify connectivity & warm cache
      await fetch('/manifest.webmanifest', { cache: 'no-store' }).catch(() => null);
      syncState.lastChecked = new Date().toLocaleTimeString('zh-CN', { hour12: false });
      if (!syncState.needRefresh) {
        syncState.statusText = '当前已是最新本地缓存版本';
      }
      await inspectLocalCache();
      return true;
    } catch {
      syncState.statusText = '检查更新失败（可能处于离线状态）';
      return false;
    } finally {
      syncState.checkingUpdate = false;
      emitSync();
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    if (syncState.updateFn) {
      await syncState.updateFn(true);
    } else {
      window.location.reload();
    }
  }, []);

  const precacheOfflineAssets = useCallback(async () => {
    if (syncState.cachingMedia || typeof window === 'undefined' || !('caches' in window)) {
      return false;
    }
    syncState.cachingMedia = true;
    syncState.statusText = '正在下载完整离线资源包（含减压神曲视频）...';
    emitSync();

    try {
      const cache = await window.caches.open('offline-media-v1');
      const targets = [
        '/video/rickroll.mp4',
        '/icon.svg',
        '/pwa-192x192.png',
        '/pwa-512x512.png',
        '/apple-touch-icon.png',
      ];
      for (const url of targets) {
        const res = await fetch(url, { cache: 'reload' });
        if (res.ok && res.status === 200) {
          await cache.put(url, res.clone());
        }
      }
      await inspectLocalCache();
      syncState.statusText = '完整离线缓存包已就绪，断网也可完整游玩';
      return true;
    } catch {
      syncState.statusText = '离线包缓存未完成，请保持网络连接后重试';
      return false;
    } finally {
      syncState.cachingMedia = false;
      emitSync();
    }
  }, []);

  return {
    ...syncState,
    checkForUpdates,
    applyUpdate,
    precacheOfflineAssets,
    refreshCacheStats: inspectLocalCache,
  };
}
