import React, { useState } from 'react';
import { ArrowDownToLine, CheckCircle2, Monitor, Smartphone, Sparkles, X } from 'lucide-react';
import { useClientUpdater } from '../hooks/useClientUpdater';

export const ClientUpdateModal: React.FC = () => {
  const {
    isNativeClient,
    platform,
    currentVersion,
    latestRelease,
    hasUpdate,
    modalOpen,
    dismissModal,
    startDownload,
  } = useClientUpdater();

  const [downloading, setDownloading] = useState(false);

  // Strictly only render inside Windows EXE or Android APK
  if (!isNativeClient || !modalOpen || !hasUpdate || !latestRelease) {
    return null;
  }

  const isWindows = platform === 'windows-exe';
  const platformLabel = isWindows ? 'Windows 桌面客户端 (.exe)' : 'Android 移动客户端 (.apk)';
  const formattedDate = latestRelease.releaseDate
    ? new Date(latestRelease.releaseDate).toLocaleDateString('zh-CN')
    : null;

  const handleUpdateClick = async () => {
    setDownloading(true);
    try {
      await startDownload();
    } finally {
      window.setTimeout(() => setDownloading(false), 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-md rounded-2xl border border-sky-500/40 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">发现客户端新版本</h3>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                {isWindows ? (
                  <Monitor className="w-3 h-3 text-sky-400" />
                ) : (
                  <Smartphone className="w-3 h-3 text-emerald-400" />
                )}
                <span>{platformLabel}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissModal}
            aria-label="关闭更新提示"
            className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold text-slate-300">更新说明</span>
              {formattedDate && <span className="font-mono-tabular">{formattedDate}</span>}
            </div>
            <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-slate-300 leading-relaxed whitespace-pre-wrap">
              {latestRelease.notes || '优化客户端性能与本地离线体验，建议立即升级。'}
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
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
              className="flex-[1.5] py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              {downloading ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>正在拉起下载...</span>
                </>
              ) : (
                <>
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>{isWindows ? '立即更新 (.exe)' : '立即更新 (.apk)'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
