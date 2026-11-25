import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDownToLine,
  Check,
  CheckCircle2,
  CloudDownload,
  Cpu,
  Download,
  ExternalLink,
  HardDriveDownload,
  History,
  Monitor,
  MonitorSmartphone,
  Package,
  RefreshCw,
  Share,
  Smartphone,
  Sparkles,
  Terminal,
  WifiOff,
  X,
} from 'lucide-react';
import { useClientUpdater } from '../hooks/useClientUpdater';
import { useOnlineStatus, usePWAInstall, usePWASync } from '../hooks/usePWAInstall';
import { useReleaseHistory } from '../hooks/useReleaseHistory';
import {
  CLIENT_DOWNLOAD_OPTIONS,
  GITHUB_RELEASES_LATEST_PAGE,
  GITHUB_REPO,
  VisitorDeviceProfile,
  WebDownloadOS,
  WebDownloadOption,
  WebDownloadTargetId,
  detectVisitorDevice,
  detectVisitorDeviceAsync,
} from '../services/clientUpdater';
import {
  ReleaseChangelogBullets,
  ReleaseHistoryList,
  ReleaseHistoryModal,
} from './ReleaseHistoryList';

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

        {showIOSGuide &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowIOSGuide(false);
              }}
              className="fixed inset-0 z-[9995] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 p-4 sm:p-5 shadow-2xl space-y-4"
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
            </div>,
            document.body
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

      {showGenericGuide &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={(e) => {
              e.stopPropagation();
              setShowGenericGuide(false);
            }}
            className="fixed inset-0 z-[9995] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 p-4 sm:p-5 shadow-2xl space-y-3"
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
          </div>,
          document.body
        )}
    </>
  );
};

interface ClientDownloadButtonProps {
  className?: string;
  compact?: boolean;
}

const OS_FILTER_TABS: Array<{ id: 'ALL' | WebDownloadOS; label: string }> = [
  { id: 'ALL', label: '全部平台' },
  { id: 'Windows', label: 'Windows' },
  { id: 'Linux', label: 'Linux' },
  { id: 'Android', label: 'Android' },
];

function triggerRawUrlDownload(fileName: string, url: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function triggerDirectAnchorDownload(option: WebDownloadOption) {
  triggerRawUrlDownload(option.fileName, option.url);
}

export const ClientDownloadButton: React.FC<ClientDownloadButtonProps> = ({
  className = '',
  compact = false,
}) => {
  const { isNativeShell, isInstalled } = usePWAInstall();
  const [visitor, setVisitor] = useState<VisitorDeviceProfile>(() => detectVisitorDevice());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'download' | 'history'>('download');
  const [osFilter, setOsFilter] = useState<'ALL' | WebDownloadOS>('ALL');
  const [selectedId, setSelectedId] = useState<WebDownloadTargetId>(
    () => detectVisitorDevice().recommendedTargetId ?? 'windows-installer'
  );
  const [startedFile, setStartedFile] = useState<string | null>(null);
  const { entries: releaseEntries, ensureLoaded: ensureHistoryLoaded } = useReleaseHistory({
    autoLoad: false,
  });

  useEffect(() => {
    if (isNativeShell || isInstalled) return;
    let active = true;
    void detectVisitorDeviceAsync().then((refined) => {
      if (!active) return;
      setVisitor(refined);
      if (!modalOpen && refined.recommendedTargetId) {
        setSelectedId(refined.recommendedTargetId);
      }
    });
    return () => {
      active = false;
    };
  }, [isNativeShell, isInstalled, modalOpen]);

  const sortedOptions = useMemo(() => {
    const recId = visitor.recommendedTargetId;
    const list =
      osFilter === 'ALL'
        ? [...CLIENT_DOWNLOAD_OPTIONS]
        : CLIENT_DOWNLOAD_OPTIONS.filter((opt) => opt.os === osFilter);

    if (!recId) return list;
    const recOption = CLIENT_DOWNLOAD_OPTIONS.find((o) => o.id === recId);
    const recOs = recOption?.os;

    return list.sort((a, b) => {
      if (a.id === recId) return -1;
      if (b.id === recId) return 1;
      if (recOs && a.os === recOs && b.os !== recOs) return -1;
      if (recOs && b.os === recOs && a.os !== recOs) return 1;
      return 0;
    });
  }, [osFilter, visitor.recommendedTargetId]);

  // Never show download prompt inside EXE, Linux AppImage/DEB, APK, or installed standalone app
  if (isNativeShell || isInstalled) {
    return null;
  }

  const recommendedOption = visitor.recommendedTargetId
    ? CLIENT_DOWNLOAD_OPTIONS.find((opt) => opt.id === visitor.recommendedTargetId) ?? null
    : null;

  const selectedOption =
    CLIENT_DOWNLOAD_OPTIONS.find((opt) => opt.id === selectedId) ?? CLIENT_DOWNLOAD_OPTIONS[0];

  const handleOpenModal = () => {
    const fresh = detectVisitorDevice();
    setVisitor(fresh);
    setStartedFile(null);
    setModalTab('download');
    setOsFilter('ALL');
    setSelectedId(fresh.recommendedTargetId ?? 'windows-installer');
    setModalOpen(true);
    ensureHistoryLoaded();

    void detectVisitorDeviceAsync().then((refined) => {
      setVisitor(refined);
      if (refined.recommendedTargetId) {
        setSelectedId(refined.recommendedTargetId);
      }
    });
  };

  const latestHistoryEntry = releaseEntries[0] ?? null;
  const webBuildVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

  const handleSelectFilter = (nextFilter: 'ALL' | WebDownloadOS) => {
    setOsFilter(nextFilter);
    if (nextFilter !== 'ALL' && selectedOption.os !== nextFilter) {
      if (recommendedOption && recommendedOption.os === nextFilter) {
        setSelectedId(recommendedOption.id);
      } else {
        const firstMatch = CLIENT_DOWNLOAD_OPTIONS.find((opt) => opt.os === nextFilter);
        if (firstMatch) {
          setSelectedId(firstMatch.id);
        }
      }
      setStartedFile(null);
    }
  };

  const handleConfirmDownload = (targetOption: WebDownloadOption = selectedOption) => {
    setSelectedId(targetOption.id);
    triggerDirectAnchorDownload(targetOption);
    setStartedFile(targetOption.fileName);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        className={`inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-400/40 bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-100 font-semibold transition cursor-pointer ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-xs sm:text-sm border-b-4 border-b-indigo-950'
        } ${className}`}
      >
        <MonitorSmartphone className="w-4 h-4 text-sky-400 shrink-0" />
        <span className="truncate">
          {compact
            ? `下载客户端 (${visitor.shortButtonLabel})`
            : `下载客户端 · ${visitor.shortButtonLabel}`}
        </span>
      </button>

      {modalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(false);
            }}
            className="fixed inset-0 z-[9996] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 select-none"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md sm:max-w-lg max-h-[92dvh] flex flex-col rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden text-left"
            >
              {/* Fixed header */}
              <div className="shrink-0 px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
                    <ArrowDownToLine className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate">
                      选择客户端系统与版本
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      已自动检测当前运行系统，支持自由切换其他平台安装包
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  aria-label="关闭下载弹窗"
                  className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal primary view tabs */}
              <div className="shrink-0 px-4 pt-2.5 sm:px-5 sm:pt-3 pb-2 border-b border-slate-800/80 bg-slate-950/35 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="inline-flex self-start rounded-lg border border-slate-800 bg-slate-950/70 p-0.5 text-[11px] sm:text-xs">
                  <button
                    type="button"
                    onClick={() => setModalTab('download')}
                    className={`px-3 py-1 rounded-md font-medium inline-flex items-center gap-1.5 transition cursor-pointer ${
                      modalTab === 'download'
                        ? 'bg-sky-500/20 text-sky-200'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>下载客户端</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalTab('history');
                      ensureHistoryLoaded();
                    }}
                    className={`px-3 py-1 rounded-md font-medium inline-flex items-center gap-1.5 transition cursor-pointer ${
                      modalTab === 'history'
                        ? 'bg-sky-500/20 text-sky-200'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>更新历史</span>
                    {latestHistoryEntry && (
                      <span className="font-mono-tabular text-[10px] text-emerald-300">
                        v{latestHistoryEntry.version}
                      </span>
                    )}
                  </button>
                </div>

                {modalTab === 'download' && (
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {OS_FILTER_TABS.map((tab) => {
                      const isActive = osFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => handleSelectFilter(tab.id)}
                          className={`px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-medium whitespace-nowrap transition cursor-pointer border ${
                            isActive
                              ? 'bg-sky-500/20 border-sky-400/60 text-sky-200'
                              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Scrollable body */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5 sm:py-3.5 space-y-2.5 text-xs">
                {modalTab === 'download' ? (
                  <>
                    {/* Auto OS Detection & Smart Recommendation Card */}
                    <div
                      className={`rounded-xl border p-3 space-y-2 ${
                        recommendedOption
                          ? 'border-emerald-500/35 bg-emerald-950/25'
                          : 'border-amber-500/35 bg-amber-950/25'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-100">
                          <Cpu
                            className={`w-3.5 h-3.5 shrink-0 ${
                              recommendedOption ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          />
                          <span>检测到当前系统：{visitor.displayName}</span>
                        </div>
                        {visitor.archLabel && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-700/80 font-mono text-[10px] text-slate-300">
                            {visitor.archLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{visitor.reason}</p>
                      {recommendedOption && (
                        <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
                          <span className="text-[11px] text-emerald-300 font-medium truncate">
                            推荐下载：{recommendedOption.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleConfirmDownload(recommendedOption)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Download className="w-3 h-3" />
                            <span>一键下载推荐版</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Package options */}
                    <div className="space-y-2">
                      {sortedOptions.map((option) => {
                        const active = option.id === selectedId;
                        const isPrimaryRec = visitor.recommendedTargetId === option.id;
                        const isSameOsAlt =
                          !isPrimaryRec &&
                          ((visitor.os === 'linux-deb' && option.id === 'linux-appimage') ||
                            (visitor.os === 'linux-appimage' && option.id === 'linux-deb') ||
                            (visitor.os === 'windows' && option.id === 'windows-portable'));

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              setSelectedId(option.id);
                              setStartedFile(null);
                            }}
                            className={`w-full text-left rounded-xl border p-2.5 sm:p-3.5 transition flex items-start gap-2.5 sm:gap-3 cursor-pointer ${
                              active
                                ? 'border-sky-400 bg-sky-500/12 shadow-inner'
                                : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900'
                            }`}
                          >
                            <div
                              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                option.os === 'Android'
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : option.os === 'Linux'
                                    ? 'bg-amber-500/15 text-amber-400'
                                    : option.id === 'windows-portable'
                                      ? 'bg-indigo-500/15 text-indigo-400'
                                      : 'bg-sky-500/15 text-sky-400'
                              }`}
                            >
                              {option.os === 'Android' ? (
                                <Smartphone className="w-4 h-4" />
                              ) : option.os === 'Linux' ? (
                                <Terminal className="w-4 h-4" />
                              ) : option.id === 'windows-portable' ? (
                                <Package className="w-4 h-4" />
                              ) : (
                                <Monitor className="w-4 h-4" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <span className="font-bold text-slate-100 text-xs sm:text-[13px]">
                                  {option.title}
                                </span>
                                {isPrimaryRec && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                                    当前系统首选推荐
                                  </span>
                                )}
                                {isSameOsAlt && (
                                  <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 text-[10px] font-medium">
                                    兼容当前系统
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                                {option.subtitle}
                              </p>
                              <div className="font-mono text-[10px] text-sky-300/80 mt-1 truncate">
                                {option.fileName}
                              </div>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                                active
                                  ? 'border-sky-400 bg-sky-500 text-white'
                                  : 'border-slate-600 bg-slate-900'
                              }`}
                            >
                              {active && <Check className="w-3 h-3" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Latest version release notes preview */}
                    {latestHistoryEntry && (
                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span>v{latestHistoryEntry.version} 当次更新内容</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setModalTab('history');
                              ensureHistoryLoaded();
                            }}
                            className="text-[11px] text-sky-400 hover:text-sky-300 underline cursor-pointer shrink-0"
                          >
                            查看全部历史 →
                          </button>
                        </div>
                        <ReleaseChangelogBullets
                          items={latestHistoryEntry.changelog.slice(0, 3)}
                          compact
                        />
                      </div>
                    )}

                    {startedFile && (
                      <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/40 px-3 py-2.5 text-[11px] text-emerald-200 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="truncate">已自动拉起下载：{startedFile}</span>
                        </span>
                        <a
                          href={selectedOption.url}
                          download={selectedOption.fileName}
                          rel="noopener noreferrer"
                          className="underline text-sky-300 hover:text-sky-200 shrink-0"
                        >
                          重试
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <ReleaseHistoryList
                    currentVersion={webBuildVersion}
                    allowPackageDownloads={true}
                    isNativeClient={false}
                    onDownloadAsset={(fileName, url) => {
                      triggerRawUrlDownload(fileName, url);
                      setStartedFile(fileName);
                    }}
                  />
                )}
              </div>

              {/* Pinned footer actions */}
              <div className="shrink-0 px-4 py-3 sm:px-5 sm:py-3.5 border-t border-slate-800 bg-slate-950/60 space-y-2.5 text-xs">
                {modalTab === 'download' ? (
                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="sm:flex-1 py-2 sm:py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-medium cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmDownload(selectedOption)}
                      className="sm:flex-[1.7] py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        确认下载 ({selectedOption.os} · {selectedOption.fileName.split('.').pop()})
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setModalTab('download')}
                      className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold cursor-pointer"
                    >
                      返回选择安装包
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-medium cursor-pointer"
                    >
                      关闭
                    </button>
                  </div>
                )}

                <div className="flex justify-center">
                  <a
                    href={GITHUB_RELEASES_LATEST_PAGE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-sky-300"
                  >
                    <span>查看 GitHub Releases 全部安装包与更新日志</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>,
          document.body
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
  const { isNativeShell } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  // Only show SW reload banner in Web/PWA browser contexts (native desktop/APK use ClientUpdateModal)
  if (isNativeShell || !needRefresh || dismissed) return null;

  return (
    <div className="fixed top-3 right-3 z-[9992] max-w-[calc(100vw-1.5rem)] sm:max-w-xs rounded-xl border border-sky-400/50 bg-slate-900/95 p-3 text-slate-100 shadow-2xl backdrop-blur-xl space-y-2">
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
    openUpdateModal,
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
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

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

  const runtimeLabel =
    platform === 'windows-exe'
      ? `Windows 客户端 v${currentVersion}`
      : platform === 'linux-appimage'
        ? `Linux 客户端 (AppImage) v${currentVersion}`
        : platform === 'linux-deb'
          ? `Linux 客户端 (.deb) v${currentVersion}`
          : platform === 'android-apk'
            ? `Android 客户端 v${currentVersion}`
            : isInstalled
              ? '独立 PWA 应用'
              : '浏览器网页版';

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
              '支持本地离线缓存与桌面 / Linux / 手机客户端下载'
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
          <div className="font-semibold text-sky-400 mt-0.5">{runtimeLabel}</div>
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
            ? `发现新版本 v${latestRelease.version}，点击下方按钮查看更新日志并下载安装包`
            : `状态：${statusText}${lastChecked ? `（上次检查 ${lastChecked}）` : ''}`)}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isNativeClient && hasClientUpdate && latestRelease && (
          <button
            type="button"
            onClick={openUpdateModal}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>发现新版 v{latestRelease.version} · 立即更新</span>
          </button>
        )}

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

        <button
          type="button"
          onClick={() => setHistoryModalOpen(true)}
          className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 cursor-pointer ${
            isLight
              ? 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800'
              : 'border-slate-600/60 hover:bg-slate-800/60 text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5 text-sky-400" />
          <span>版本更新历史</span>
        </button>

        <PWAInstallButton compact showGuideWhenUnavailable />
        <ClientDownloadButton compact />
      </div>

      <ReleaseHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
      />
    </div>
  );
};
