import React, { useMemo, useState } from 'react';
import {
  Activity,
  Award,
  CheckCircle2,
  Code2,
  Download,
  FolderLock,
  HardDrive,
  PackageCheck,
  Radar,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  WifiOff,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { STORE_CATALOG } from '../../data/worldData';
import { useIsMobile } from '../../hooks/useIsMobile';
import { StoreAppCatalogItem, StoreAppId } from '../../types/game';

function getAppGlyph(id: StoreAppId, size: 'sm' | 'lg' = 'sm') {
  const iconSize = size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';
  switch (id) {
    case 'vscode':
      return {
        box: 'bg-sky-500/15 border-sky-500/35 text-sky-400',
        icon: <Code2 className={iconSize} />,
      };
    case 'monitor':
      return {
        box: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400',
        icon: <Activity className={iconSize} />,
      };
    case 'radio':
      return {
        box: 'bg-amber-500/15 border-amber-500/35 text-amber-400',
        icon: <Radio className={iconSize} />,
      };
    case 'files':
      return {
        box: 'bg-indigo-500/15 border-indigo-500/35 text-indigo-400',
        icon: <FolderLock className={iconSize} />,
      };
    case 'cleaner':
      return {
        box: 'bg-amber-500/15 border-amber-500/35 text-amber-400',
        icon: <Sparkles className={iconSize} />,
      };
    case 'sniffer':
      return {
        box: 'bg-cyan-500/15 border-cyan-500/35 text-cyan-400',
        icon: <Radar className={iconSize} />,
      };
  }
}

export const StoreApp: React.FC = () => {
  const isMobile = useIsMobile();
  const {
    system,
    sanity,
    isOnline,
    privacy,
    batteryLevel,
    anomalyStorageGb,
    storageSnapshot,
    installedApps,
    downloadingApps,
    openedStoreApps,
    updatedStoreApps,
    installStoreApp,
    uninstallStoreApp,
    updateStoreApp,
    triggerSystemArchitectEnding,
    openApp,
  } = useGame();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'全部' | StoreAppCatalogItem['category']>('全部');
  const [selectedId, setSelectedId] = useState<StoreAppId>('vscode');

  const isLight = system.theme === 'light';
  const surfaceCard = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-800/65 border-slate-700/80 text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  const totalCatalogCount = STORE_CATALOG.length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STORE_CATALOG.filter((item) => {
      if (category !== '全部' && item.category !== category) return false;
      if (!q) return true;
      return (
        item.desktopName.toLowerCase().includes(q) ||
        item.iosName.toLowerCase().includes(q) ||
        item.tagline.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  const selectedItem =
    STORE_CATALOG.find((x) => x.id === selectedId) ?? STORE_CATALOG[0];

  const displayName = (item: StoreAppCatalogItem) =>
    isMobile ? item.iosName : item.desktopName;

  const allInstalled = installedApps.length === totalCatalogCount;
  const allOpened = openedStoreApps.length === totalCatalogCount;
  const allShields =
    privacy.firewallEnabled &&
    privacy.privacyEnabled &&
    privacy.antivirusEnabled &&
    privacy.dnsEnabled;
  const architectReady =
    allInstalled &&
    allOpened &&
    updatedStoreApps.length >= 1 &&
    anomalyStorageGb <= 0.05 &&
    batteryLevel >= 50 &&
    allShields &&
    sanity >= 80;

  const renderActionBtn = (item: StoreAppCatalogItem, compact = false) => {
    const isInstalled = installedApps.includes(item.id);
    const isUpdated = updatedStoreApps.includes(item.id);
    const pct = downloadingApps[item.id];
    const isDownloading = pct !== undefined;

    if (isDownloading) {
      return (
        <div className={`${compact ? 'w-24' : 'w-32'} space-y-1`}>
          <div className="h-2 rounded-full bg-slate-700/60 overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-[10px] font-mono-tabular text-sky-400 text-right">
            下载中 {pct}%
          </div>
        </div>
      );
    }

    if (isInstalled) {
      return (
        <div className="flex items-center gap-1.5">
          {!isUpdated && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                updateStoreApp(item.id);
              }}
              title={`安装热补丁 v${item.updateVersion}`}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{compact ? '补丁' : `更新 v${item.updateVersion}`}</span>
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openApp(item.id);
            }}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            打开
          </button>
          {!compact && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                uninstallStoreApp(item.id);
              }}
              title="卸载此应用"
              className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                isLight
                  ? 'border-slate-300 text-slate-600 hover:bg-slate-100'
                  : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-rose-400'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      );
    }

    const lacksSpace = storageSnapshot.freeGb < item.sizeGb;

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          installStoreApp(item.id);
        }}
        title={lacksSpace ? `磁盘空间不足（需要 ${item.sizeGb} GB）` : `下载 ${item.size}`}
        className={`px-3 py-1.5 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
          lacksSpace
            ? 'bg-amber-600 hover:bg-amber-500'
            : 'bg-emerald-600 hover:bg-emerald-500'
        }`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>{lacksSpace ? '空间不足' : '获取'}</span>
      </button>
    );
  };

  const glyphSelected = getAppGlyph(selectedItem.id, 'lg');

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      {/* Store Header Bar */}
      <div
        className={`px-4 sm:px-5 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 ${
          isLight ? 'border-slate-200 bg-slate-50/90' : 'border-slate-800 bg-slate-900/80'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
            {isMobile ? 'A' : 'MS'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold leading-tight truncate">
              {isMobile ? 'App Store' : 'Microsoft Store'}
            </div>
            <div className={`text-[11px] font-mono-tabular flex flex-wrap items-center gap-x-2 gap-y-0.5 ${mutedText}`}>
              <span>
                装机 {installedApps.length}/{totalCatalogCount} · 已体验 {openedStoreApps.length}/{totalCatalogCount}
              </span>
              <span className="inline-flex items-center gap-1 text-sky-400">
                <HardDrive className="w-3 h-3" />
                剩余 {storageSnapshot.freeGb.toFixed(1)} / {storageSnapshot.totalCapacityGb} GB
              </span>
            </div>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs w-full sm:w-64 ${
            isLight
              ? 'bg-white border-slate-300 text-slate-900'
              : 'bg-slate-950/70 border-slate-700 text-slate-100'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索应用、清理、嗅探或工具..."
            className="bg-transparent outline-none w-full"
          />
        </div>
      </div>

      {/* Category Tabs + Offline Notice */}
      <div
        className={`px-4 sm:px-5 py-2.5 border-b flex items-center justify-between gap-3 overflow-x-auto shrink-0 ${
          isLight ? 'border-slate-200 bg-white' : 'border-slate-800/80 bg-slate-950/40'
        }`}
      >
        <div className="flex items-center gap-1.5">
          {(['全部', '开发工具', '系统安全', '影音电波', '效率实用'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                category === cat
                  ? 'bg-sky-600 text-white'
                  : isLight
                    ? 'text-slate-600 hover:bg-slate-100'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {!isOnline && (
          <div className="flex items-center gap-1.5 text-[11px] text-rose-400 font-medium whitespace-nowrap">
            <WifiOff className="w-3.5 h-3.5" />
            <span>离线模式无法下载</span>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 pb-6 space-y-4">
        {/* Featured Pack Banner */}
        <div
          className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isLight
              ? 'bg-gradient-to-r from-sky-50 to-indigo-50 border-sky-200 text-slate-900'
              : 'bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/50 border-sky-500/30 text-slate-100'
          }`}
        >
          <div className="space-y-1">
            <div className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>精选推荐 · 全栈装机工具集 ({totalCatalogCount} 款)</span>
            </div>
            <p className={`text-xs leading-relaxed ${mutedText}`}>
              {isMobile
                ? '安装至少 4 款并逐一启动可解锁「极客之夜」；集齐全部 6 款并完成净化升级可冲刺 #50 架构师认证。'
                : '安装至少 4 款并逐一启动可解锁「极客之夜」；集齐全部 6 款并完成净化升级可冲刺 #50 架构师认证。'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono-tabular shrink-0 whitespace-nowrap">
            <PackageCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {allInstalled
                ? '全套 6 款已安装就绪'
                : `已安装 ${installedApps.length} / ${totalCatalogCount} 款`}
            </span>
          </div>
        </div>

        {/* #50 System Architect Certification Banner */}
        <div
          className={`rounded-2xl border p-4 space-y-3 ${
            architectReady
              ? 'border-emerald-500/50 bg-emerald-500/10'
              : surfaceCard
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <div className="text-xs font-bold flex items-center gap-1.5 text-amber-400">
                <Award className="w-4 h-4 shrink-0" />
                <span>终极系统架构师认证 (#50)</span>
              </div>
              <p className={`text-[11px] leading-relaxed ${mutedText}`}>
                达成全装机、热补丁、存储净空、电池续航、四重安全防护与清醒思维，即可签发终极防线认证。
              </p>
            </div>
            <button
              type="button"
              onClick={triggerSystemArchitectEnding}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                architectReady
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : 'bg-sky-600/25 hover:bg-sky-600/40 text-sky-300 border border-sky-500/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>签发终极架构师认证</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono-tabular">
            <div className={`px-2.5 py-1.5 rounded-lg border ${allInstalled && allOpened ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-slate-700/60 opacity-75'}`}>
              6/6 安装且启动 ({openedStoreApps.length}/6)
            </div>
            <div className={`px-2.5 py-1.5 rounded-lg border ${updatedStoreApps.length >= 1 ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-slate-700/60 opacity-75'}`}>
              热补丁升级 ({updatedStoreApps.length}/1)
            </div>
            <div className={`px-2.5 py-1.5 rounded-lg border ${anomalyStorageGb <= 0.05 && batteryLevel >= 50 ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-slate-700/60 opacity-75'}`}>
              异常 0G · 电量≥50%
            </div>
            <div className={`px-2.5 py-1.5 rounded-lg border ${allShields && sanity >= 80 ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-slate-700/60 opacity-75'}`}>
              4/4 防护 · 理智≥80%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* App Catalog Cards */}
          <div className="lg:col-span-7 space-y-2.5">
            {filtered.map((item) => {
              const glyph = getAppGlyph(item.id, 'sm');
              const isSelected = selectedItem.id === item.id;
              const isInstalled = installedApps.includes(item.id);
              const isOpened = openedStoreApps.includes(item.id);
              const isUpdated = updatedStoreApps.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`rounded-xl border p-3.5 flex items-center justify-between gap-3 transition-all cursor-pointer ${
                    isSelected ? 'ring-2 ring-sky-500/60' : ''
                  } ${surfaceCard}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${glyph.box}`}
                    >
                      {glyph.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold truncate">
                          {displayName(item)}
                        </span>
                        {isInstalled && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        {isUpdated && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-mono-tabular whitespace-nowrap shrink-0">
                            v{item.updateVersion}
                          </span>
                        )}
                      </div>
                      <div className={`text-[11px] truncate ${mutedText}`}>
                        {item.category} · {item.size} · {item.rating} ★
                        {isOpened ? ' · 已体验' : ''}
                      </div>
                      <div className={`text-xs mt-0.5 truncate ${mutedText}`}>
                        {item.tagline}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">{renderActionBtn(item, true)}</div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className={`rounded-xl border p-8 text-center text-xs ${surfaceCard}`}>
                未找到匹配的应用，请尝试清除搜索词。
              </div>
            )}
          </div>

          {/* Detail Inspector */}
          <div className={`lg:col-span-5 rounded-2xl border p-5 space-y-4 h-fit ${surfaceCard}`}>
            <div className="flex items-start gap-3.5">
              <div
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${glyphSelected.box}`}
              >
                {glyphSelected.icon}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="text-base font-bold leading-snug">
                  {displayName(selectedItem)}
                </h3>
                <div className={`text-xs ${mutedText}`}>
                  {selectedItem.developer} · {selectedItem.category}
                </div>
                <div className="flex items-center gap-2 text-xs font-mono-tabular text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{selectedItem.rating}</span>
                  <span className={mutedText}>
                    · v
                    {updatedStoreApps.includes(selectedItem.id)
                      ? selectedItem.updateVersion
                      : selectedItem.version}{' '}
                    · {selectedItem.size}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
              {renderActionBtn(selectedItem, false)}
              <span className={`text-[11px] ${mutedText}`}>
                {installedApps.includes(selectedItem.id)
                  ? openedStoreApps.includes(selectedItem.id)
                    ? '本局已启动过'
                    : '已就绪 · 等待启动'
                  : '尚未安装'}
              </span>
            </div>

            <div className="border-t border-slate-700/40 pt-3 space-y-2">
              <div className="text-xs font-semibold">应用简介</div>
              <p className={`text-xs leading-relaxed ${mutedText}`}>
                {selectedItem.description}
              </p>
            </div>

            <div className="border-t border-slate-700/40 pt-3 space-y-1.5">
              <div className="text-xs font-semibold">
                {updatedStoreApps.includes(selectedItem.id)
                  ? `安全热补丁 v${selectedItem.updateVersion}（已应用）`
                  : `基础版日志 · 可升级补丁 v${selectedItem.updateVersion}`}
              </div>
              <p className={`text-xs leading-relaxed font-mono-tabular ${mutedText}`}>
                {updatedStoreApps.includes(selectedItem.id)
                  ? selectedItem.updateNote
                  : `${selectedItem.releaseNote}（补丁说明：${selectedItem.updateNote}）`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
