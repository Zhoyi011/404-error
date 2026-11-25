import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Flame,
  HardDrive,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { soundEngine } from '../../utils/audio';

export const CleanerApp: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  const {
    privacy,
    storageSnapshot,
    tempCacheGb,
    anomalyStorageGb,
    cleanTempCache,
    purgeAnomalyStorage,
    triggerStorageZeroEnding,
    floodStorageDump,
    openApp,
  } = useGame();

  const [scanning, setScanning] = useState(false);
  const [scanTimestamp, setScanTimestamp] = useState<string | null>(null);

  const handleScan = () => {
    soundEngine.playClick();
    setScanning(true);
    window.setTimeout(() => {
      setScanning(false);
      const now = new Date();
      setScanTimestamp(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      );
      soundEngine.playNotification();
    }, 620);
  };

  const zeroReady =
    privacy.antivirusEnabled && tempCacheGb <= 0.05 && anomalyStorageGb <= 0.05;

  const pctSystem = (storageSnapshot.systemOsGb / storageSnapshot.totalCapacityGb) * 100;
  const pctApps = (storageSnapshot.appsGb / storageSnapshot.totalCapacityGb) * 100;
  const pctTemp = (storageSnapshot.tempCacheGb / storageSnapshot.totalCapacityGb) * 100;
  const pctAnom = (storageSnapshot.anomalyGb / storageSnapshot.totalCapacityGb) * 100;

  return (
    <div className="h-full min-h-0 flex flex-col bg-[#080d16] text-slate-100 select-none overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-slate-900/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold truncate">
              {isMobile ? '手机清理专家 · ZeroByte' : '磁盘净化大师 · ZeroByte Guard'}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {isMobile ? '闪存区块诊断 & 异常碎片粉碎' : 'DoD-5220 零字节擦除 & 隐藏扇区净空系统'}
            </div>
          </div>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? '全盘扫描中…' : '全盘诊断扫描'}</span>
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {/* Capacity Bar Card */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <div className="text-xs text-slate-400">
                {isMobile ? 'iPhone 内部闪存' : '本地系统盘 (C:\\)'}
              </div>
              <div className="text-xl font-bold font-mono-tabular mt-0.5">
                {storageSnapshot.usedGb.toFixed(1)}{' '}
                <span className="text-xs text-slate-400 font-normal">
                  / {storageSnapshot.totalCapacityGb} GB ({storageSnapshot.usedPercent}%)
                </span>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold font-mono-tabular ${
                  storageSnapshot.usedPercent >= 90
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                可用 {storageSnapshot.freeGb.toFixed(1)} GB
              </span>
            </div>
          </div>

          <div className="w-full h-3.5 rounded-full bg-slate-800/90 overflow-hidden flex border border-white/5">
            <div
              style={{ width: `${pctSystem}%` }}
              className="h-full bg-slate-500 transition-[width] duration-300"
              title={`系统内核 ${storageSnapshot.systemOsGb} GB`}
            />
            <div
              style={{ width: `${pctApps}%` }}
              className="h-full bg-sky-500 transition-[width] duration-300"
              title={`已装应用 ${storageSnapshot.appsGb} GB`}
            />
            <div
              style={{ width: `${pctTemp}%` }}
              className="h-full bg-amber-400 transition-[width] duration-300"
              title={`临时缓存 ${storageSnapshot.tempCacheGb} GB`}
            />
            <div
              style={{ width: `${pctAnom}%` }}
              className="h-full bg-rose-500 transition-[width] duration-300"
              title={`异常隐藏扇区 ${storageSnapshot.anomalyGb} GB`}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300 font-mono-tabular">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-500 shrink-0" />
              <span>系统 {storageSnapshot.systemOsGb}G</span>
            </div>
            <div className="flex items-center gap-1.5 text-sky-300 font-mono-tabular">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 shrink-0" />
              <span>应用 {storageSnapshot.appsGb}G</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-300 font-mono-tabular">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 shrink-0" />
              <span>缓存 {storageSnapshot.tempCacheGb}G</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-300 font-mono-tabular">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shrink-0" />
              <span>异常 {storageSnapshot.anomalyGb}G</span>
            </div>
          </div>

          {scanTimestamp && (
            <div className="text-[11px] text-emerald-400/90 flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>
                最近全盘体检完成 ({scanTimestamp})：
                {anomalyStorageGb > 0
                  ? `发现 ${anomalyStorageGb.toFixed(1)} GB 疑似镜像自增转储块`
                  : '未发现隐藏异常扇区'}
              </span>
            </div>
          )}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Temp cache card */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-amber-300 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 shrink-0" />
                  <span>临时缓存垃圾</span>
                </div>
                <span className="font-mono-tabular text-xs font-bold text-amber-200">
                  {tempCacheGb.toFixed(1)} GB
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                包含浏览器离线缩略图、网页预加载碎片与过期安装包残留。可安全直接清空释放空间。
              </p>
            </div>
            <button
              onClick={cleanTempCache}
              disabled={tempCacheGb <= 0.05}
              className="w-full py-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-45 border border-amber-500/40 text-amber-200 text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              {tempCacheGb <= 0.05 ? '临时缓存已清空 (0.0 GB)' : '一键清空临时缓存'}
            </button>
          </div>

          {/* Anomaly sectors card */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-rose-500/25 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-rose-300 flex items-center gap-1.5">
                  <Database className="w-4 h-4 shrink-0" />
                  <span>隐藏异常影子扇区</span>
                </div>
                <span className="font-mono-tabular text-xs font-bold text-rose-200">
                  {anomalyStorageGb.toFixed(1)} GB
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                `.mirror` 与 `mirror_dump.bin` 碎片。若未先在设置开启「
                {isMobile ? '实时恶意进程防护' : '实时病毒防护'}」，直接擦除会引发瞬间再生拷贝！
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={purgeAnomalyStorage}
                disabled={anomalyStorageGb <= 0.05}
                className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-45 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                {anomalyStorageGb <= 0.05 ? '异常扇区已归零' : '零字节粉碎异常区'}
              </button>
              {!privacy.antivirusEnabled && (
                <button
                  onClick={() => openApp('settings')}
                  className="px-3 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-slate-200 whitespace-nowrap cursor-pointer"
                >
                  去开防护
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Zero-Byte Certification (#44) */}
        <div
          className={`p-4 rounded-xl border transition-colors ${
            zeroReady
              ? 'bg-emerald-500/12 border-emerald-400/45'
              : 'bg-white/[0.02] border-white/10'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>零字节净空认证 (#44)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                条件：开启「{isMobile ? '实时恶意进程防护' : '实时病毒防护'}」(
                {privacy.antivirusEnabled ? '✓' : '未开启'}) · 缓存 0.0 GB (
                {tempCacheGb <= 0.05 ? '✓' : `${tempCacheGb.toFixed(1)}G`}) · 异常区 0.0 GB (
                {anomalyStorageGb <= 0.05 ? '✓' : `${anomalyStorageGb.toFixed(1)}G`})
              </p>
            </div>
            <button
              onClick={triggerStorageZeroEnding}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer flex items-center justify-center gap-1.5 ${
                zeroReady
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : 'bg-white/10 hover:bg-white/15 text-slate-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>签发零字节净空认证</span>
            </button>
          </div>
        </div>

        {/* Dangerous Stress Test (#43) */}
        <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-red-300">扇区写入压测实验（高危）：</span>
              强制将异常影子镜像转储写入磁盘（+24 GB）。若总占用达 100% 将引发系统写满锁死！
            </div>
          </div>
          <button
            onClick={() => floodStorageDump(24)}
            className="px-3 py-2 rounded-lg bg-red-600/25 hover:bg-red-600/40 border border-red-500/40 text-red-200 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Flame className="w-3.5 h-3.5 shrink-0" />
            <span>写入 +24 GB 镜像</span>
          </button>
        </div>
      </div>
    </div>
  );
};
