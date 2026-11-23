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
