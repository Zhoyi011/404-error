import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  History,
  RefreshCw,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import { useClientUpdater } from '../hooks/useClientUpdater';
import { useReleaseHistory } from '../hooks/useReleaseHistory';
import {
  GITHUB_RELEASES_PAGE,
  ReleaseChangelogSections,
  ReleaseHistoryEntry,
  ReleaseVersionManifest,
  compareVersions,
} from '../services/clientUpdater';

const SECTION_META: Array<{
  key: keyof ReleaseChangelogSections;
  label: string;
  badgeClass: string;
  dotClass: string;
}> = [
  {
    key: 'added',
    label: '新增功能',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
  },
  {
    key: 'improved',
    label: '优化体验',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    dotClass: 'bg-sky-400',
  },
  {
    key: 'fixed',
    label: '问题修复',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotClass: 'bg-amber-400',
  },
];

export const ReleaseChangelogBullets: React.FC<{
  items: string[];
  summary?: string;
  sections?: Partial<ReleaseChangelogSections>;
  emptyFallback?: string;
  compact?: boolean;
}> = ({
  items,
  summary,
  sections,
  emptyFallback = '优化客户端运行性能与本地离线体验，建议及时更新。',
  compact = false,
}) => {
  const hasStructuredSections = Boolean(
    sections &&
      ((sections.added && sections.added.length > 0) ||
        (sections.improved && sections.improved.length > 0) ||
        (sections.fixed && sections.fixed.length > 0))
  );

  const list = items.length > 0 ? items : [emptyFallback];

  return (
    <div className={compact ? 'space-y-2' : 'space-y-2.5'}>
      {summary && (
        <p
          className={`${
            compact ? 'text-[11px]' : 'text-xs'
          } text-slate-200/95 leading-relaxed rounded-lg bg-slate-900/70 border border-slate-800/80 px-2.5 py-1.5`}
        >
          {summary}
        </p>
      )}

      {hasStructuredSections && sections ? (
        <div className={compact ? 'space-y-2' : 'space-y-2.5'}>
          {SECTION_META.map(({ key, label, badgeClass, dotClass }) => {
            const groupItems = sections[key] || [];
            if (groupItems.length === 0) return null;
            return (
              <div key={key} className="space-y-1">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-semibold ${badgeClass}`}
                >
                  {label}
                </span>
                <ul className={compact ? 'space-y-1' : 'space-y-1.5'}>
                  {groupItems.map((line, index) => (
                    <li
                      key={`${key}-${index}-${line.slice(0, 18)}`}
                      className="flex items-start gap-2 text-slate-300 leading-relaxed"
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-[6px] w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`}
                      />
                      <span className={compact ? 'text-[11px]' : 'text-xs'}>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <ul className={compact ? 'space-y-1.5' : 'space-y-2'}>
          {list.map((line, index) => (
            <li
              key={`${index}-${line.slice(0, 20)}`}
              className="flex items-start gap-2 text-slate-300 leading-relaxed"
            >
              <span
                aria-hidden="true"
                className="mt-[6px] w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0"
              />
              <span className={compact ? 'text-[11px]' : 'text-xs'}>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

function formatReleaseDate(raw?: string): string {
  if (!raw) return '近期发布';
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return raw;
  return dt.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function triggerWebFileDownload(fileName: string, url: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

interface ReleaseHistoryListProps {
  currentVersion?: string;
  knownLatestManifest?: ReleaseVersionManifest | null;
  allowPackageDownloads?: boolean;
  isNativeClient?: boolean;
  compact?: boolean;
  onDownloadAsset?: (fileName: string, url: string) => void;
}

export const ReleaseHistoryList: React.FC<ReleaseHistoryListProps> = ({
  currentVersion,
  knownLatestManifest = null,
  allowPackageDownloads = false,
  isNativeClient = false,
  compact = false,
  onDownloadAsset,
}) => {
  const { entries, loading, source, isOfflineOrLimited, refresh } = useReleaseHistory({
    autoLoad: true,
    knownLatestManifest,
  });

  const [downloadedTagFile, setDownloadedTagFile] = useState<string | null>(null);

  const handleAssetClick = (fileName: string, url: string) => {
    if (onDownloadAsset) {
      onDownloadAsset(fileName, url);
    } else {
      triggerWebFileDownload(fileName, url);
    }
    setDownloadedTagFile(`${fileName} (${url})`);
  };

  const sourceLabel =
    source === 'github-api'
      ? '已同步 GitHub Releases'
      : source === 'cache'
        ? isOfflineOrLimited
          ? '离线 / 本地缓存记录'
          : '本地缓存记录'
        : '本地内置历史记录';

  return (
    <div className="space-y-3 text-xs">
      {/* Sync status bar */}
      <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="text-[11px] text-slate-300 truncate">{sourceLabel}</span>
          <span className="text-[10px] text-slate-500 font-mono-tabular shrink-0">
            共 {entries.length} 个版本
          </span>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-[11px] text-slate-200 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? '同步中' : '刷新'}</span>
        </button>
      </div>

      {/* Timeline list */}
      <div className="relative pl-4 space-y-3">
        <div
          aria-hidden="true"
          className="absolute left-[6px] top-2 bottom-2 w-px bg-slate-800"
        />

        {entries.map((entry: ReleaseHistoryEntry, idx: number) => {
          const isCurrentLocal =
            Boolean(currentVersion) &&
            compareVersions(entry.version, currentVersion || '') === 0;
          const isNewerThanLocal =
            isNativeClient &&
            Boolean(currentVersion) &&
            compareVersions(entry.version, currentVersion || '') > 0;
          const isLatest = entry.isLatest || idx === 0;

          const assetChips: Array<{ label: string; fileName: string; url: string }> = [];
          if (allowPackageDownloads) {
            if (entry.assets.windows) {
              assetChips.push({
                label: 'Win 安装版 (.exe)',
                fileName: '404-error-windows.exe',
                url: entry.assets.windows,
              });
            }
            if (entry.assets.windowsPortable) {
              assetChips.push({
                label: 'Win 便携版 (.exe)',
                fileName: '404-error-windows-portable.exe',
                url: entry.assets.windowsPortable,
              });
            }
            if (entry.assets.linuxAppImage) {
              assetChips.push({
                label: 'Linux (.AppImage)',
                fileName: '404-error-linux.AppImage',
                url: entry.assets.linuxAppImage,
              });
            }
            if (entry.assets.linuxDeb) {
              assetChips.push({
                label: 'Linux (.deb)',
                fileName: '404-error-linux.deb',
                url: entry.assets.linuxDeb,
              });
            }
            if (entry.assets.android) {
              assetChips.push({
                label: 'Android (.apk)',
                fileName: '404-error-android.apk',
                url: entry.assets.android,
              });
            }
          }

          return (
            <div key={`${entry.tag}-${idx}`} className="relative">
              <span
                aria-hidden="true"
                className={`absolute -left-4 top-3.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                  isLatest
                    ? 'bg-emerald-400'
                    : isCurrentLocal
                      ? 'bg-sky-400'
                      : 'bg-slate-600'
                }`}
              />

              <div
                className={`rounded-xl border p-3 sm:p-3.5 space-y-2.5 ${
                  isLatest
                    ? 'border-emerald-500/35 bg-slate-950/75'
                    : 'border-slate-800 bg-slate-950/55'
                }`}
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span className="inline-flex items-center gap-1 font-mono-tabular font-bold text-slate-100 text-xs sm:text-[13px]">
                      <Tag className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>v{entry.version}</span>
                    </span>
                    {isLatest && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                        最新版本
                      </span>
                    )}
                    {isNativeClient && isCurrentLocal && (
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-semibold">
                        当前安装
                      </span>
                    )}
                    {isNewerThanLocal && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold">
                        可更新
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono-tabular text-slate-400 shrink-0">
                    {formatReleaseDate(entry.releaseDate)}
                  </span>
                </div>

                <ReleaseChangelogBullets
                  items={entry.changelog}
                  summary={entry.summary}
                  sections={entry.sections}
                  compact={compact}
                />

                {allowPackageDownloads && assetChips.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-800/80 space-y-1.5">
                    <div className="text-[10px] text-slate-400">该版本对应安装包：</div>
                    <div className="flex flex-wrap gap-1.5">
                      {assetChips.map((chip) => (
                        <button
                          key={`${entry.tag}-${chip.fileName}`}
                          type="button"
                          onClick={() => handleAssetClick(chip.fileName, chip.url)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-700 bg-slate-900 hover:border-sky-500/60 hover:bg-sky-950/40 text-[11px] text-sky-200 cursor-pointer transition"
                        >
                          <Download className="w-3 h-3 text-sky-400 shrink-0" />
                          <span>{chip.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!compact && (
                  <div className="flex items-center justify-between pt-0.5 text-[11px]">
                    <span className="text-slate-500 truncate">{entry.name}</span>
                    <a
                      href={entry.releaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-sky-300 shrink-0"
                    >
                      <span>Release 页面</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {downloadedTagFile && allowPackageDownloads && (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/35 px-3 py-2 text-[11px] text-emerald-200 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">已触发下载：{downloadedTagFile.split(' (')[0]}</span>
        </div>
      )}
    </div>
  );
};

interface ReleaseHistoryModalProps {
  open: boolean;
  onClose: () => void;
}

export const ReleaseHistoryModal: React.FC<ReleaseHistoryModalProps> = ({
  open,
  onClose,
}) => {
  const {
    isNativeClient,
    currentVersion,
    hasUpdate,
    latestRelease,
    openUpdateModal,
  } = useClientUpdater();
  const { ensureLoaded } = useReleaseHistory({
    autoLoad: false,
    knownLatestManifest: latestRelease,
  });

  useEffect(() => {
    if (open) {
      ensureLoaded();
    }
  }, [open, ensureLoaded]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className="fixed inset-0 z-[9997] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90dvh] flex flex-col rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden text-left"
      >
        {/* Fixed header */}
        <div className="shrink-0 px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate">
                版本更新历史记录
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {isNativeClient
                  ? `当前客户端版本 v${currentVersion} · GitHub Releases 发布轨迹`
                  : `当前网页构建 v${currentVersion} · 查看历史版本更新与安装包`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭版本历史弹窗"
            className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5">
          <ReleaseHistoryList
            currentVersion={currentVersion}
            knownLatestManifest={latestRelease}
            allowPackageDownloads={!isNativeClient}
            isNativeClient={isNativeClient}
          />
        </div>

        {/* Pinned footer */}
        <div className="shrink-0 px-4 py-3 sm:px-5 sm:py-3.5 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <a
            href={GITHUB_RELEASES_PAGE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-sky-300"
          >
            <span>GitHub Releases 仓库页</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex items-center gap-2 ml-auto">
            {isNativeClient && hasUpdate && latestRelease && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openUpdateModal();
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>升级到 v{latestRelease.version}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>关闭</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
