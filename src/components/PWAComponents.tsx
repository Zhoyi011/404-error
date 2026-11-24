import React, { useState } from 'react';
import {
  CheckCircle2,
  CloudDownload,
  Download,
  ExternalLink,
  HardDriveDownload,
  MonitorSmartphone,
  RefreshCw,
  Share,
  Smartphone,
  WifiOff,
  X,
} from 'lucide-react';
import { useClientUpdater } from '../hooks/useClientUpdater';
import { useOnlineStatus, usePWAInstall, usePWASync } from '../hooks/usePWAInstall';
import { GITHUB_RELEASES_LATEST_PAGE, GITHUB_REPO } from '../services/clientUpdater';

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
                  使用 <strong className="text-white">Safari 浏览器</strong> 打开游戏网页。
                </li>
                <li>
                  点击底部工具栏的{' '}
                  <strong className="text-white inline-flex items-center gap-1">
                    <Share className="w-3.5 h-3.5 inline" /> 分享
                  </strong>{' '}
                  按钮。
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
              在 Chrome / Edge 浏览器中点击地址栏右侧的「安装图标」，即可将本游戏保存为本地独立离线应用。
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

interface ClientDownloadButtonProps {
  className?: string;
  compact?: boolean;
}

export const ClientDownloadButton: React.FC<ClientDownloadButtonProps> = ({
  className = '',
  compact = false,
}) => {
  const { isNativeShell, isInstalled } = usePWAInstall();

  // Never show download prompt inside EXE, APK, or installed standalone app
  if (isNativeShell || isInstalled) {
    return null;
  }

  return (
    <a
      href={GITHUB_RELEASES_LATEST_PAGE}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-400/40 bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-100 font-semibold transition cursor-pointer ${
        compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-xs sm:text-sm border-b-4 border-b-indigo-950'
      } ${className}`}
    >
      <MonitorSmartphone className="w-4 h-4 text-sky-400 shrink-0" />
      <span>下载客户端 (GitHub Releases · EXE / APK)</span>
      <ExternalLink className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
    </a>
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
  const { isNativeShell } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  // Only show SW reload banner in Web/PWA browser contexts (native EXE/APK use ClientUpdateModal)
  if (isNativeShell || !needRefresh || dismissed) return null;

  return (
    <div className="fixed top-3 right-3 z-[9992] max-w-xs rounded-xl border border-sky-400/50 bg-slate-900/95 p-3 text-slate-100 shadow-2xl backdrop-blur-xl space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
          <CloudDownload className="w-4 h-4 shrink-0" />
          <span>发现新版离线缓存</span>
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
        新版本网页资源已缓存到本地，点击即可应用。
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
    isNativeClient,
    platform,
    currentVersion,
    checking: checkingClient,
    hasUpdate: hasClientUpdate,
    latestRelease,
    checkNow: checkClientNow,
  } = useClientUpdater();
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

  const [manualClientNotice, setManualClientNotice] = useState<string | null>(null);

  const cardClass = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-950/60 border-slate-800 text-slate-100';
  const mutedClass = isLight ? 'text-slate-600' : 'text-slate-400';

  const handleCheckClientRelease = async () => {
    setManualClientNotice(null);
    const res = await checkClientNow();
    if (!res.checked) {
      setManualClientNotice('当前离线或无法连接 GitHub Releases，保持本地正常运行');
    } else if (!res.hasUpdate) {
      setManualClientNotice(`当前客户端 v${currentVersion} 已是最新版本`);
    }
  };

  return (
    <div className={`rounded-xl border p-4 space-y-3 text-xs ${cardClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-semibold text-sm flex items-center gap-2">
            <CloudDownload className="w-4 h-4 text-sky-400" />
            <span>{isNativeClient ? '客户端版本与本地离线状态' : '本地离线缓存与网页安装'}</span>
          </div>
          <div className={`text-[11px] mt-0.5 ${mutedClass}`}>
            {isNativeClient ? (
              <>
                更新通道：<span className="font-mono">GitHub Releases ({GITHUB_REPO})</span>
              </>
            ) : (
              '支持本地离线缓存与桌面/手机客户端下载'
            )}
          </div>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-medium ${
            isOnline ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
          }`}
        >
          {isOnline ? '在线同步可用' : '离线模式运行中'}
        </span>
      </div>

      <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] ${mutedClass}`}>
        <div className="rounded-lg border border-slate-700/30 px-2.5 py-2">
          <div>当前运行环境</div>
          <div className="font-semibold text-sky-400 mt-0.5">
            {platform === 'windows-exe'
              ? `Windows 客户端 v${currentVersion}`
              : platform === 'android-apk'
                ? `Android 客户端 v${currentVersion}`
                : isInstalled
                  ? '独立 PWA 应用'
                  : '浏览器网页版'}
          </div>
        </div>
        <div className="rounded-lg border border-slate-700/30 px-2.5 py-2">
          <div>本地缓存资源</div>
          <div className="font-mono-tabular font-semibold text-emerald-400 mt-0.5">
            {cacheCount > 0 ? `${cacheCount} 项` : isNativeShell ? '内置完整包' : '0 项'}
          </div>
        </div>
        <div className="rounded-lg border border-slate-700/30 px-2.5 py-2 col-span-2 sm:col-span-1">
          <div>离线视频资源</div>
          <div className="font-semibold mt-0.5">
            {isNativeShell || mediaCached ? (
              <span className="text-emerald-400 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 本地可用
              </span>
            ) : (
              <span className="text-amber-400">按需加载</span>
            )}
          </div>
        </div>
      </div>

      <div className={`text-[11px] ${mutedClass}`}>
        {manualClientNotice ||
          (hasClientUpdate && latestRelease
            ? `发现新版本 v${latestRelease.version}，点击下方按钮立即下载更新`
            : `状态：${statusText}${lastChecked ? `（上次检查 ${lastChecked}）` : ''}`)}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isNativeClient ? (
          <button
            type="button"
            disabled={checkingClient || !isOnline}
            onClick={() => void handleCheckClientRelease()}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingClient ? 'animate-spin' : ''}`} />
            <span>{checkingClient ? '正在检查 Release...' : '检查客户端更新'}</span>
          </button>
        ) : needRefresh ? (
          <button
            type="button"
            onClick={() => void applyUpdate()}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>立即应用新版缓存</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={checkingUpdate || !isOnline}
            onClick={() => void checkForUpdates()}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdate ? 'animate-spin' : ''}`} />
            <span>{checkingUpdate ? '正在同步...' : '刷新本地缓存'}</span>
          </button>
        )}

        {!isNativeShell && (
          <button
            type="button"
            disabled={cachingMedia || !isOnline}
            onClick={() => void precacheOfflineAssets()}
            className="px-3 py-1.5 rounded-lg border border-slate-600/60 hover:bg-slate-800/60 disabled:opacity-50 font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <HardDriveDownload className="w-3.5 h-3.5 text-amber-400" />
            <span>{cachingMedia ? '正在缓存视频...' : mediaCached ? '校验离线完整包' : '预缓存完整离线包'}</span>
          </button>
        )}

        <PWAInstallButton compact showGuideWhenUnavailable />
        <ClientDownloadButton compact />
      </div>
    </div>
  );
};
