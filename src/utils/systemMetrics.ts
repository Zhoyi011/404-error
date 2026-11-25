import { AppId, StoreAppId, WindowInstance } from '../types/game';

export const TOTAL_RAM_MB = 4096; // 老旧设备 4.00 GB 物理内存上限
export const TOTAL_RAM_GB = 4.0;

const APP_BASE_RAM_MB: Record<AppId, number> = {
  browser: 480,
  email: 240,
  notepad: 130,
  settings: 210,
  security: 310,
  news: 220,
  chat: 230,
  achievements: 220,
  terminal: 150,
  store: 340,
  morse: 190,
  taskmgr: 250,
  vscode: 540,
  monitor: 260,
  radio: 210,
  files: 230,
  cleaner: 200,
  sniffer: 270,
};

const APP_BASE_CPU: Record<AppId, number> = {
  browser: 12,
  email: 4,
  notepad: 2,
  settings: 4,
  security: 8,
  news: 5,
  chat: 5,
  achievements: 4,
  terminal: 3,
  store: 7,
  morse: 5,
  taskmgr: 6,
  vscode: 14,
  monitor: 7,
  radio: 6,
  files: 5,
  cleaner: 6,
  sniffer: 9,
};

export interface WindowUsageEstimate {
  instanceId: string;
  appId: AppId;
  title: string;
  memMb: number;
  cpuPercent: number;
}

export interface SystemMetricsSnapshot {
  baseOsMb: number;
  anomalyMb: number;
  appsMb: number;
  totalUsedMb: number;
  totalUsedGb: number;
  memPercent: number;
  cpuPercent: number;
  windowBreakdown: WindowUsageEstimate[];
}

export function estimateWindowUsage(win: WindowInstance): WindowUsageEstimate {
  const baseMem = APP_BASE_RAM_MB[win.appId] ?? 200;
  const baseCpu = APP_BASE_CPU[win.appId] ?? 4;
  const tabCount = win.appId === 'browser' ? Math.max(1, win.browserState?.tabs.length ?? 1) : 1;
  const extraTabs = Math.max(0, tabCount - 1);
  const minimizedDiscount = win.isMinimized ? 0.72 : 1;

  const memMb = Math.round((baseMem + extraTabs * 300) * (win.appId === 'browser' ? 1 : minimizedDiscount));
  const cpuPercent = Math.max(
    1,
    Math.round((baseCpu + extraTabs * 7) * (win.isMinimized ? 0.4 : 1))
  );

  return {
    instanceId: win.instanceId,
    appId: win.appId,
    title: win.title,
    memMb,
    cpuPercent,
  };
}

export function computeSystemMetrics(params: {
  windowInstances: WindowInstance[];
  installedApps: StoreAppId[];
  step: number;
  suspendedDaemon: boolean;
  stressTest?: boolean;
  tickOffset?: number;
}): SystemMetricsSnapshot {
  const {
    windowInstances,
    installedApps,
    step,
    suspendedDaemon,
    stressTest = false,
    tickOffset = 0,
  } = params;

  const baseOsMb = 1120 + installedApps.length * 42;
  const anomalyMb =
    (step >= 1 ? 340 : 0) +
    (step >= 2 ? (suspendedDaemon ? 280 : 640) : 0) +
    (stressTest ? 720 : 0);

  const windowBreakdown = windowInstances.map(estimateWindowUsage);
  const appsMb = windowBreakdown.reduce((sum, item) => sum + item.memMb, 0);
  const appsCpu = windowBreakdown.reduce((sum, item) => sum + item.cpuPercent, 0);

  const jitterMb = ((tickOffset * 13) % 37) - 18;
  const rawTotalMb = Math.max(960, baseOsMb + anomalyMb + appsMb + jitterMb);
  const memPercent = Math.min(100, Math.round((rawTotalMb / TOTAL_RAM_MB) * 100));
  const clampedUsedMb = Math.min(TOTAL_RAM_MB, rawTotalMb);
  const totalUsedGb = Number((clampedUsedMb / 1024).toFixed(2));

  const baseCpu =
    11 +
    (step >= 1 ? 14 : 0) +
    (step >= 2 ? (suspendedDaemon ? 10 : 28) : 0) +
    (stressTest ? 38 : 0);
  const jitterCpu = ((tickOffset * 5) % 7) - 3;
  const cpuPercent = Math.min(100, Math.max(6, baseCpu + appsCpu + jitterCpu));

  return {
    baseOsMb,
    anomalyMb,
    appsMb,
    totalUsedMb: rawTotalMb,
    totalUsedGb,
    memPercent,
    cpuPercent,
    windowBreakdown,
  };
}

export interface StorageSnapshot {
  totalCapacityGb: number;
  systemOsGb: number;
  appsGb: number;
  tempCacheGb: number;
  anomalyGb: number;
  usedGb: number;
  freeGb: number;
  usedPercent: number;
}

const APP_SIZE_GB: Record<StoreAppId, number> = {
  vscode: 2.4,
  monitor: 1.2,
  radio: 1.6,
  files: 1.1,
  cleaner: 1.4,
  sniffer: 1.8,
};

export function getStoreAppSizeGb(appId: StoreAppId): number {
  return APP_SIZE_GB[appId] ?? 1.2;
}

export function computeStorageSnapshot(params: {
  isMobile: boolean;
  installedApps: StoreAppId[];
  tempCacheGb: number;
  anomalyStorageGb: number;
}): StorageSnapshot {
  const totalCapacityGb = params.isMobile ? 64 : 128;
  const systemOsGb = params.isMobile ? 22.4 : 46.8;
  const appsGb = Number(
    (
      (params.isMobile ? 8.2 : 14.6) +
      params.installedApps.reduce((sum, id) => sum + getStoreAppSizeGb(id), 0)
    ).toFixed(1)
  );
  const tempCacheGb = Number(Math.max(0, params.tempCacheGb).toFixed(1));
  const anomalyGb = Number(Math.max(0, params.anomalyStorageGb).toFixed(1));
  const rawUsed = systemOsGb + appsGb + tempCacheGb + anomalyGb;
  const usedGb = Number(Math.min(totalCapacityGb, rawUsed).toFixed(1));
  const freeGb = Number(Math.max(0, totalCapacityGb - usedGb).toFixed(1));
  const usedPercent = Math.min(100, Math.round((usedGb / totalCapacityGb) * 100));

  return {
    totalCapacityGb,
    systemOsGb,
    appsGb,
    tempCacheGb,
    anomalyGb,
    usedGb,
    freeGb,
    usedPercent,
  };
}

export interface BatteryTelemetry {
  level: number;
  isPluggedIn: boolean;
  watts: number;
  tempC: number;
  drainPerTick: number;
  estimatedMinutesLeft: number;
}

export function computeBatteryTelemetry(params: {
  batteryLevel: number;
  isPluggedIn: boolean;
  powerMode: 'balanced' | 'performance' | 'saver';
  brightness: number;
  bluetooth: boolean;
  isOnline: boolean;
  overclockEnabled: boolean;
  openWindowCount: number;
  step: number;
}): BatteryTelemetry {
  const modeFactor =
    params.powerMode === 'performance' ? 1.55 : params.powerMode === 'saver' ? 0.52 : 1.0;
  const baseWatts =
    6.5 +
    (params.brightness / 100) * 5.2 +
    (params.bluetooth ? 1.1 : 0) +
    (params.isOnline ? 1.4 : 0) +
    params.openWindowCount * 1.15 +
    (params.step >= 2 ? 4.8 : params.step === 1 ? 2.1 : 0) +
    (params.overclockEnabled ? 11.5 : 0);

  const watts = Number((baseWatts * modeFactor).toFixed(1));
  const tempC = Math.round(
    33 +
      (watts / 36) * 26 +
      (params.isPluggedIn ? 4 : 0) +
      (params.overclockEnabled && params.powerMode === 'performance' ? 22 : 0)
  );
  const drainPerTick = params.isPluggedIn
    ? 0
    : Number(Math.max(0.4, (watts / 18) * 1.25).toFixed(2));
  const estimatedMinutesLeft = params.isPluggedIn
    ? Math.max(5, Math.round(((100 - params.batteryLevel) / 100) * 75))
    : Math.max(2, Math.round((params.batteryLevel / Math.max(0.5, drainPerTick)) * 0.8));

  return {
    level: Math.max(0, Math.min(100, Math.round(params.batteryLevel))),
    isPluggedIn: params.isPluggedIn,
    watts,
    tempC,
    drainPerTick,
    estimatedMinutesLeft,
  };
}

