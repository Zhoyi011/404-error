import { useCallback, useEffect, useState } from 'react';
import {
  ClientRuntimePlatform,
  ReleaseVersionManifest,
  compareVersions,
  detectClientPlatform,
  fetchLatestReleaseManifest,
  getCurrentClientVersion,
  resolveDownloadUrlForPlatform,
  triggerClientDownload,
} from '../services/clientUpdater';

const AUTO_CHECK_COOLDOWN_MS = 5 * 60 * 1000;

interface UpdaterState {
  platform: ClientRuntimePlatform;
  currentVersion: string;
  latestRelease: ReleaseVersionManifest | null;
  hasUpdate: boolean;
  modalOpen: boolean;
  checking: boolean;
  lastCheckedAt: number;
  dismissedVersion: string | null;
  downloadUrl: string | null;
}

const initialPlatform = detectClientPlatform();

const sharedState: UpdaterState = {
  platform: initialPlatform,
  currentVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0',
  latestRelease: null,
  hasUpdate: false,
  modalOpen: false,
  checking: false,
  lastCheckedAt: 0,
  dismissedVersion: null,
  downloadUrl: null,
};

const listeners = new Set<() => void>();
let autoListenersAttached = false;
let initialCheckScheduled = false;

function emit() {
  listeners.forEach((fn) => fn());
}

async function runUpdateCheck(force = false): Promise<{
  checked: boolean;
  hasUpdate: boolean;
  latestVersion?: string;
}> {
  const platform = detectClientPlatform();
  sharedState.platform = platform;

  // Strictly disabled on standard web browsers
  if (platform === 'web') {
    return { checked: false, hasUpdate: false };
  }

  const now = Date.now();
  if (sharedState.checking) {
    return { checked: false, hasUpdate: sharedState.hasUpdate };
  }
  if (!force && sharedState.lastCheckedAt > 0 && now - sharedState.lastCheckedAt < AUTO_CHECK_COOLDOWN_MS) {
    return { checked: false, hasUpdate: sharedState.hasUpdate };
  }

  sharedState.checking = true;
  emit();

  try {
    const currentVersion = await getCurrentClientVersion(platform);
    sharedState.currentVersion = currentVersion;

    const manifest = await fetchLatestReleaseManifest(platform);
    sharedState.lastCheckedAt = Date.now();

    if (!manifest) {
      // Silent handling when offline or release unavailable
      return { checked: false, hasUpdate: false };
    }

    const isNewer = compareVersions(manifest.version, currentVersion) > 0;
    sharedState.latestRelease = manifest;
    sharedState.hasUpdate = isNewer;
    sharedState.downloadUrl = isNewer ? resolveDownloadUrlForPlatform(manifest, platform) : null;

    if (isNewer && (force || sharedState.dismissedVersion !== manifest.version)) {
      sharedState.modalOpen = true;
    }

    return {
      checked: true,
      hasUpdate: isNewer,
      latestVersion: manifest.version,
    };
  } finally {
    sharedState.checking = false;
    emit();
  }
}

export function useClientUpdater() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((n) => n + 1);
    listeners.add(listener);

    const platform = detectClientPlatform();
    sharedState.platform = platform;

    if (platform !== 'web') {
      if (!initialCheckScheduled) {
        initialCheckScheduled = true;
        window.setTimeout(() => {
          void runUpdateCheck(false);
        }, 1200);
      }

      if (!autoListenersAttached) {
        autoListenersAttached = true;

        const onForeground = () => {
          if (document.visibilityState === 'visible') {
            void runUpdateCheck(false);
          }
        };

        document.addEventListener('visibilitychange', onForeground);
        window.addEventListener('focus', onForeground);
      }
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const checkNow = useCallback(() => runUpdateCheck(true), []);

  const dismissModal = useCallback(() => {
    if (sharedState.latestRelease?.version) {
      sharedState.dismissedVersion = sharedState.latestRelease.version;
    }
    sharedState.modalOpen = false;
    emit();
  }, []);

  const startDownload = useCallback(async () => {
    if (!sharedState.downloadUrl) return false;
    return triggerClientDownload(sharedState.downloadUrl, sharedState.platform);
  }, []);

  return {
    ...sharedState,
    isNativeClient: sharedState.platform !== 'web',
    checkNow,
    dismissModal,
    startDownload,
  };
}
