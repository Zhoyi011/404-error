import React, { useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Code2,
  Download,
  FolderLock,
  PackageCheck,
  Radio,
  Search,
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
  }
}

export const StoreApp: React.FC = () => {
  const isMobile = useIsMobile();
  const {
    system,
    isOnline,
    installedApps,
    downloadingApps,
    openedStoreApps,
    installStoreApp,
    uninstallStoreApp,
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

  const renderActionBtn = (item: StoreAppCatalogItem, compact = false) => {
    const isInstalled = installedApps.includes(item.id);
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

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          installStoreApp(item.id);
        }}
        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
      >
        <Download className="w-3.5 h-3.5" />
        <span>获取</span>
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
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
            {isMobile ? 'A' : 'MS'}
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">
              {isMobile ? 'App Store' : 'Microsoft Store'}
            </div>
            <div className={`text-[11px] font-mono-tabular ${mutedText}`}>
              本地装机进度 {installedApps.length}/4 · 已体验 {openedStoreApps.length}/4
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
            placeholder="搜索应用、开发者或工具..."
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
              <span>精选推荐 · 深夜装机工具集</span>
            </div>
            <p className={`text-xs leading-relaxed ${mutedText}`}>
              所有应用均免费提供本地离线沙箱安装。下载后的应用会直接出现在桌面图标与快捷入口中。
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono-tabular shrink-0">
            <PackageCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {installedApps.length === 4
                ? '全套应用已安装就绪'
                : `已安装 ${installedApps.length} / 4 款`}
            </span>
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
                  <span className={mutedText}>· v{selectedItem.version} · {selectedItem.size}</span>
                </div>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between gap-2">
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
              <div className="text-xs font-semibold">版本更新日志</div>
              <p className={`text-xs leading-relaxed font-mono-tabular ${mutedText}`}>
                {selectedItem.releaseNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
