import React, { useState } from 'react';
import {
  CheckCircle2,
  CloudDownload,
  Download,
  HardDriveDownload,
  RefreshCw,
  Share,
  Smartphone,
  WifiOff,
  X,
} from 'lucide-react';
import {
  REMOTE_UPDATE_ORIGIN,
  useOnlineStatus,
  usePWAInstall,
  usePWASync,
} from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  compact?: boolean;
  showGuideWhenUnavailable?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  compact = false,
  showGuideWhenUnavailable = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showGenericGuide, setShowGenericGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className={`inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition cursor-pointer ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-xs sm:text-sm'
        } ${className}`}
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>安装桌面/手机应用 (PWA)</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center justify-center gap-2 rounded-lg border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 font-semibold transition cursor-pointer ${
            compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-xs sm:text-sm'
          } ${className}`}
        >
          <Smartphone className="w-4 h-4 shrink-0" />
          <span>添加到 iOS 主屏幕 (PWA)</span>
        </button>

        {showIOSGuide && (
          <div
            onClick={() => setShowIOSGuide(false)}
            className="fixed inset-0 z-[9995] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">安装到 iPhone / iPad 主屏幕</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="text-xs text-slate-300 space-y-2.5 leading-relaxed list-decimal pl-4">
                <li>
                  使用 <strong className="text-white">Safari 浏览器</strong> 打开{' '}
                  <span className="font-mono text-sky-400">404-horror.ai.studio</span>。
                </li>
                <li>
                  点击底部工具栏的 <strong className="text-white inline-flex items-center gap-1"><Share className="w-3.5 h-3.5 inline" /> 分享</strong> 按钮。
                </li>
                <li>
                  向下滑动并选择 <strong className="text-white">“添加到主屏幕”</strong>，即可离线全屏游玩。
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer"
              >
                我知道了
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (!showGuideWhenUnavailable) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGenericGuide(true)}
        className={`inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs'
        } ${className}`}
      >
        <Download className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <span>PWA 安装说明</span>
      </button>

      {showGenericGuide && (
        <div
          onClick={() => setShowGenericGuide(false)}
          className="fixed inset-0 z-[9995] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 p-5 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">安装 PWA 本地应用</h3>
              <button
                type="button"
                onClick={() => setShowGenericGuide(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              在 Chrome / Edge 打开线上地址 <span className="font-mono text-sky-400">{REMOTE_UPDATE_ORIGIN}</span> 后，点击地址栏右侧的「安装图标」即可直接封装为独立桌面/手机应用，支持本地离线缓存与自动热更新。
            </p>
            <button
              type="button"
              onClick={() => setShowGenericGuide(false)}
              className="w-full py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold cursor-pointer"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-12 left-3 z-[9990] flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-950/90 px-3 py-1.5 text-[11px] font-medium text-amber-100 shadow-xl backdrop-blur-md pointer-events-none">
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>离线模式 · 正在使用本地缓存运行</span>
    </div>
  );
};

export const PWAUpdateBanner: React.FC = () => {
  const { needRefresh, applyUpdate } = usePWASync();
  const [dismissed, setDismissed] = useState(false);

  if (!needRefresh || dismissed) return null;

  return (
    <div className="fixed top-3 right-3 z-[9992] max-w-xs rounded-xl border border-sky-400/50 bg-slate-900/95 p-3 text-slate-100 shadow-2xl backdrop-blur-xl space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
          <CloudDownload className="w-4 h-4 shrink-0" />
          <span>发现远程热更新版本</span>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-[11px] text-slate-300 leading-relaxed">
        已从线上同步最新资源到本地缓存，无需更换 EXE / APK。
      </p>
      <button
        type="button"
        onClick={() => void applyUpdate()}
        className="w-full py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer"
      >
        立即刷新启用新版
      </button>
    </div>
  );
};

export const PWACachePanel: React.FC<{ isLight?: boolean }> = ({ isLight = false }) => {
  const isOnline = useOnlineStatus();
  const { isInstalled, isNativeShell } = usePWAInstall();
  const {
    needRefresh,
    checkingUpdate,
    cachingMedia,
    mediaCached,
    cacheCount,
    lastChecked,
    statusText,
    checkForUpdates,
    applyUpdate,
    precacheOfflineAssets,
  } = usePWASync();

  const cardClass = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-950/60 border-slate-800 text-slate-100';
  const mutedClass = isLight ? 'text-slate-600' : 'text-slate-400';

  return (
    <div className={`rounded-xl border p-4 space-y-3 text-xs ${cardClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-semibold text-sm flex items-center gap-2">
            <CloudDownload className="w-4 h-4 text-sky-400" />
            <span>离线本地缓存与热更新通道</span>
          </div>
          <div className={`text-[11px] mt-0.5 ${mutedClass}`}>
            更新源：<span className="font-mono">{REMOTE_UPDATE_ORIGIN}</span>（免重装 EXE / APK）
          </div>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-medium ${
            isOnline ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
          }`}
        >
          {isOnline ? '在线同步可用' : '离线缓存运行中'}
        </span>
      </div>

      <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] ${mutedClass}`}>
        <div className="rounded-lg border border-slate-700/30 px-2.5 py-2">
          <div>运行形态</div>
          <div className="font-semibold text-sky-400 mt-0.5">
            {isNativeShell ? '客户端壳 (热更新)' : isInstalled ? '独立 PWA 应用' : '浏览器模式'}
          </div>
        </div>
        <div className="rounded-lg border border-slate-700/30 px-2.5 py-2">
          <div>本地已缓存资源</div>
          <div className="font-mono-tabular font-semibold text-emerald-400 mt-0.5">
            {cacheCount} 项
          </div>
        </div>
        <div className="rounded-lg border border-slate-700/30 px-2.5 py-2 col-span-2 sm:col-span-1">
          <div>离线视频包</div>
          <div className="font-semibold mt-0.5">
            {mediaCached ? (
              <span className="text-emerald-400 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 已完整缓存
              </span>
            ) : (
              <span className="text-amber-400">按需加载</span>
            )}
          </div>
        </div>
      </div>

      <div className={`text-[11px] ${mutedClass}`}>
        状态：{statusText}
        {lastChecked ? `（上次检查 ${lastChecked}）` : ''}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {needRefresh ? (
          <button
            type="button"
            onClick={() => void applyUpdate()}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>立即应用已下载的新版</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={checkingUpdate || !isOnline}
            onClick={() => void checkForUpdates()}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdate ? 'animate-spin' : ''}`} />
            <span>{checkingUpdate ? '正在同步...' : '检查热更新'}</span>
          </button>
        )}

        <button
          type="button"
          disabled={cachingMedia || !isOnline}
          onClick={() => void precacheOfflineAssets()}
          className="px-3 py-1.5 rounded-lg border border-slate-600/60 hover:bg-slate-800/60 disabled:opacity-50 font-medium flex items-center gap-1.5 cursor-pointer"
        >
          <HardDriveDownload className="w-3.5 h-3.5 text-amber-400" />
          <span>{cachingMedia ? '正在缓存视频...' : mediaCached ? '校验离线完整包' : '预缓存完整离线包'}</span>
        </button>

        <PWAInstallButton compact showGuideWhenUnavailable />
      </div>
    </div>
  );
};
