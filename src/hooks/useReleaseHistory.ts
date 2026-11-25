import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReleaseHistoryEntry,
  ReleaseVersionManifest,
  detectClientPlatform,
  fetchReleaseHistory,
  getFallbackReleaseHistory,
  mergeReleaseHistoryWithManifest,
} from '../services/clientUpdater';

interface ReleaseHistoryState {
  entries: ReleaseHistoryEntry[];
  loading: boolean;
  hasLoadedOnce: boolean;
  source: 'github-api' | 'cache' | 'fallback';
  syncedAt: number;
  isOfflineOrLimited: boolean;
}

const sharedHistoryState: ReleaseHistoryState = {
  entries: getFallbackReleaseHistory(),
  loading: false,
  hasLoadedOnce: false,
  source: 'fallback',
  syncedAt: 0,
  isOfflineOrLimited: false,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

async function loadReleaseHistory(
  forceRefresh = false,
  knownLatestManifest: ReleaseVersionManifest | null = null
) {
  if (sharedHistoryState.loading) return;

  sharedHistoryState.loading = true;
  emit();

  try {
    const platform = detectClientPlatform();
    const res = await fetchReleaseHistory(platform, {
      forceRefresh,
      knownLatestManifest,
    });
    sharedHistoryState.entries = res.entries;
    sharedHistoryState.source = res.source;
    sharedHistoryState.syncedAt = res.syncedAt;
    sharedHistoryState.isOfflineOrLimited = res.isOfflineOrLimited;
    sharedHistoryState.hasLoadedOnce = true;
  } finally {
    sharedHistoryState.loading = false;
    emit();
  }
}

export function useReleaseHistory(options?: {
  autoLoad?: boolean;
  knownLatestManifest?: ReleaseVersionManifest | null;
}) {
  const autoLoad = options?.autoLoad ?? true;
  const knownLatestManifest = options?.knownLatestManifest ?? null;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((n) => n + 1);
    listeners.add(listener);

    if (autoLoad && !sharedHistoryState.hasLoadedOnce && !sharedHistoryState.loading) {
      void loadReleaseHistory(false, knownLatestManifest);
    }

    return () => {
      listeners.delete(listener);
    };
  }, [autoLoad, knownLatestManifest]);

  const refresh = useCallback(
    () => loadReleaseHistory(true, knownLatestManifest),
    [knownLatestManifest]
  );

  const ensureLoaded = useCallback(() => {
    if (!sharedHistoryState.hasLoadedOnce && !sharedHistoryState.loading) {
      void loadReleaseHistory(false, knownLatestManifest);
    }
  }, [knownLatestManifest]);

  const mergedEntries = useMemo(() => {
    void tick;
    return knownLatestManifest
      ? mergeReleaseHistoryWithManifest(sharedHistoryState.entries, knownLatestManifest)
      : sharedHistoryState.entries;
  }, [knownLatestManifest, tick]);

  return {
    entries: mergedEntries,
    loading: sharedHistoryState.loading,
    hasLoadedOnce: sharedHistoryState.hasLoadedOnce,
    source: sharedHistoryState.source,
    syncedAt: sharedHistoryState.syncedAt,
    isOfflineOrLimited: sharedHistoryState.isOfflineOrLimited,
    refresh,
    ensureLoaded,
  };
}
