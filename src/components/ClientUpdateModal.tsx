import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDownToLine,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  History,
  Monitor,
  Smartphone,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react';
import { useClientUpdater } from '../hooks/useClientUpdater';
import { parseStructuredReleaseNotes } from '../data/releaseHistoryFallback';
import { ClientRuntimePlatform } from '../services/clientUpdater';
import { ReleaseChangelogBullets, ReleaseHistoryList } from './ReleaseHistoryList';

function getPlatformMeta(platform: ClientRuntimePlatform): {
  label: string;
  actionText: string;
  fileName: string;
  kind: 'windows' | 'linux' | 'android';
} {
  switch (platform) {
    case 'linux-appimage':
      return {
        label: 'Linux 桌面客户端 (AppImage)',
        actionText: '立即更新 (.AppImage)',
        fileName: '404-error-linux.AppImage',
        kind: 'linux',
      };
    case 'linux-deb':
      return {
        label: 'Linux 桌面客户端 (.deb)',
        actionText: '立即更新 (.deb)',
        fileName: '404-error-linux.deb',
        kind: 'linux',
      };
    case 'android-apk':
      return {
        label: 'Android 移动客户端 (.apk)',
        actionText: '立即更新 (.apk)',
        fileName: '404-error-android.apk',
        kind: 'android',
      };
    case 'windows-exe':
    default:
      return {
        label: 'Windows 桌面客户端 (.exe)',
        actionText: '立即更新 (.exe)',
        fileName: '404-error-windows.exe',
        kind: 'windows',
      };
  }
}

export const ClientUpdateModal: React.FC = () => {
  const {
    isNativeClient,
    platform,
    currentVersion,
    latestRelease,
    hasUpdate,
    modalOpen,
    downloadUrl,
    dismissModal,
    startDownload,
  } = useClientUpdater();

  const [downloading, setDownloading] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [viewMode, setViewMode] = useState<'latest' | 'history'>('latest');

  const structuredNotes = useMemo(
    () =>
      latestRelease
        ? parseStructuredReleaseNotes(
            latestRelease.notes,
            latestRelease.changelog,
            latestRelease.sections,
            latestRelease.summary
          )
        : { changelog: [] },
    [latestRelease]
  );

  // Strictly only render inside Windows EXE, Linux AppImage/DEB, or Android APK
  if (
    !isNativeClient ||
    !modalOpen ||
    !hasUpdate ||
    !latestRelease ||
    typeof document === 'undefined'
  ) {
    return null;
  }

  const meta = getPlatformMeta(platform);
  const formattedDate = latestRelease.releaseDate
    ? new Date(latestRelease.releaseDate).toLocaleDateString('zh-CN')
    : null;

  const handleUpdateClick = async () => {
    setDownloading(true);
    try {
      await startDownload();
      setDownloadStarted(true);
    } finally {
      window.setTimeout(() => setDownloading(false), 1200);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 select-none">
      <div className="w-full max-w-md max-h-[90dvh] flex flex-col rounded-2xl border border-sky-500/40 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
        {/* Fixed header */}
        <div className="shrink-0 px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
              {viewMode === 'history' ? (
                <History className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-100 truncate">
                {viewMode === 'history' ? '版本更新历史记录' : '发现客户端新版本'}
              </h3>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                {meta.kind === 'windows' ? (
                  <Monitor className="w-3 h-3 text-sky-400 shrink-0" />
                ) : meta.kind === 'linux' ? (
                  <Terminal className="w-3 h-3 text-amber-400 shrink-0" />
                ) : (
                  <Smartphone className="w-3 h-3 text-emerald-400 shrink-0" />
                )}
                <span className="truncate">{meta.label}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissModal}
            aria-label="关闭更新提示"
            className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-header view switcher */}
        <div className="shrink-0 px-4 pt-2.5 pb-1.5 sm:px-5 border-b border-slate-800/70 bg-slate-950/30 flex items-center justify-between gap-2">
          <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950/70 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode('latest')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                viewMode === 'latest'
                  ? 'bg-sky-500/20 text-sky-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              本次更新 (v{latestRelease.version})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('history')}
              className={`px-2.5 py-1 rounded-md font-medium inline-flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'history'
                  ? 'bg-sky-500/20 text-sky-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3 h-3" />
              <span>历史更新</span>
            </button>
          </div>

          {viewMode === 'history' && (
            <button
              type="button"
              onClick={() => setViewMode('latest')}
              className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>返回本次更新</span>
            </button>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3.5 text-xs">
          {viewMode === 'latest' ? (
            <>
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 sm:px-4 sm:py-3">
                <div>
                  <div className="text-slate-400">当前本地版本</div>
                  <div className="font-mono-tabular text-sm font-semibold text-slate-200 mt-0.5">
                    v{currentVersion}
                  </div>
                </div>
                <div className="text-slate-600 font-bold">→</div>
                <div className="text-right">
                  <div className="text-sky-400">GitHub 最新版本</div>
                  <div className="font-mono-tabular text-sm font-bold text-emerald-400 mt-0.5">
                    v{latestRelease.version}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-sky-500/20 bg-sky-950/25 px-3 py-2 text-[11px] text-sky-200 flex items-center justify-between gap-2">
                <span className="text-slate-300 shrink-0">自动匹配安装包</span>
                <span className="font-mono text-sky-300 truncate">{meta.fileName}</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 gap-2">
                  <span className="font-semibold text-slate-200">
                    v{latestRelease.version} 更新内容
                  </span>
                  <div className="flex items-center gap-2.5 shrink-0">
                    {formattedDate && (
                      <span className="font-mono-tabular text-[11px]">{formattedDate}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setViewMode('history')}
                      className="text-[11px] text-sky-400 hover:text-sky-300 underline cursor-pointer"
                    >
                      查看历史更新
                    </button>
                  </div>
                </div>
                <div className="max-h-48 sm:max-h-56 overflow-y-auto overscroll-contain rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <ReleaseChangelogBullets
                    items={structuredNotes.changelog}
                    summary={structuredNotes.summary}
                    sections={structuredNotes.sections}
                    emptyFallback="优化客户端性能与本地离线体验，建议立即升级。"
                  />
                </div>
              </div>

              {downloadStarted && downloadUrl && (
                <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/35 px-3 py-2 text-[11px] text-emerald-200 flex items-center justify-between gap-2">
                  <span className="truncate">已调用系统下载器获取新版本</span>
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sky-300 hover:text-sky-200 underline shrink-0"
                  >
                    <span>手动打开</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </>
          ) : (
            <ReleaseHistoryList
              currentVersion={currentVersion}
              knownLatestManifest={latestRelease}
              allowPackageDownloads={false}
              isNativeClient={true}
              compact={true}
            />
          )}
        </div>

        {/* Pinned footer actions */}
        <div className="shrink-0 px-4 py-3 sm:px-5 sm:py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2 sm:gap-2.5 text-xs">
          <button
            type="button"
            onClick={dismissModal}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-medium cursor-pointer"
          >
            稍后提醒
          </button>
          <button
            type="button"
            onClick={() => void handleUpdateClick()}
            className="flex-[1.6] py-2.5 px-3 sm:px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            {downloading ? (
              <>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="truncate">正在拉起下载...</span>
              </>
            ) : (
              <>
                <ArrowDownToLine className="w-4 h-4 shrink-0" />
                <span className="truncate">{meta.actionText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
