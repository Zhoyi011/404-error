import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  Battery,
  BatteryCharging,
  Bluetooth,
  Code2,
  Cpu,
  ExternalLink,
  FileText,
  FolderLock,
  Globe,
  HardDrive,
  Layers,
  Mail,
  MessageSquare,
  Minimize2,
  Monitor,
  Newspaper,
  Pin,
  PinOff,
  Plug,
  Radar,
  Radio,
  Search,
  Settings as SettingsIcon,
  Shield,
  ShoppingBag,
  Sparkles,
  Terminal,
  Trophy,
  Volume2,
  VolumeX,
  Waves,
  Wifi,
  WifiOff,
  XCircle,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { AppId, ThemeMode } from '../types/game';

interface TaskbarAppMeta {
  id: AppId;
  label: string;
  aliases: string;
  icon: React.ReactNode;
}

const ALL_TASKBAR_APPS: TaskbarAppMeta[] = [
  { id: 'browser', label: '浏览器', aliases: 'browser edge chrome wiki web', icon: <Globe className="w-4 h-4 text-sky-400" /> },
  { id: 'email', label: '邮件箱', aliases: 'email mail', icon: <Mail className="w-4 h-4 text-amber-400" /> },
  { id: 'notepad', label: '记事本', aliases: 'notepad note 备忘', icon: <FileText className="w-4 h-4 text-emerald-400" /> },
  { id: 'store', label: '应用商店', aliases: 'store microsoft app 商店', icon: <ShoppingBag className="w-4 h-4 text-blue-400" /> },
  { id: 'security', label: '安全中心', aliases: 'security defender 防护 杀毒', icon: <Shield className="w-4 h-4 text-cyan-400" /> },
  { id: 'settings', label: '设置', aliases: 'settings system 系统 蓝牙', icon: <SettingsIcon className="w-4 h-4 text-slate-300" /> },
  { id: 'morse', label: '电码破译', aliases: 'morse telegraph 摩斯 密码 电报', icon: <Waves className="w-4 h-4 text-teal-400" /> },
  { id: 'taskmgr', label: '任务管理器', aliases: 'taskmgr task manager 进程 任务 管理器', icon: <Cpu className="w-4 h-4 text-sky-400" /> },
  { id: 'terminal', label: '终端', aliases: 'terminal cmd shell bash', icon: <Terminal className="w-4 h-4 text-lime-400" /> },
  { id: 'news', label: '新闻', aliases: 'news 晚间', icon: <Newspaper className="w-4 h-4 text-rose-400" /> },
  { id: 'chat', label: '群聊', aliases: 'chat 家人 微信', icon: <MessageSquare className="w-4 h-4 text-green-400" /> },
  { id: 'achievements', label: '图鉴', aliases: 'achievements endings 成就 结局', icon: <Trophy className="w-4 h-4 text-yellow-400" /> },
  { id: 'vscode', label: 'VS Code', aliases: 'vscode code ide 源码', icon: <Code2 className="w-4 h-4 text-sky-400" /> },
  { id: 'monitor', label: '监视器', aliases: 'monitor 性能 资源 进程', icon: <Activity className="w-4 h-4 text-emerald-400" /> },
  { id: 'radio', label: '电波 FM', aliases: 'radio fm 广播 收音机', icon: <Radio className="w-4 h-4 text-amber-400" /> },
  { id: 'files', label: '文件箱', aliases: 'files vault 保险箱 文件', icon: <FolderLock className="w-4 h-4 text-indigo-400" /> },
  { id: 'cleaner', label: '净化大师', aliases: 'cleaner disk storage 清理 磁盘 存储', icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
  { id: 'sniffer', label: '嗅探仪', aliases: 'sniffer packet trace 抓包 嗅探 c2', icon: <Radar className="w-4 h-4 text-cyan-400" /> },
];

type TaskbarContextMenu =
  | { kind: 'bar'; x: number; y: number }
  | { kind: 'app'; appId: AppId; label: string; x: number; y: number };

export const Taskbar: React.FC = () => {
  const {
    windowInstances,
    focusedInstanceId,
    isOnline,
    system,
    clockTime,
    unlockedEndings,
    pinnedTaskbarApps,
    batteryLevel,
    isPluggedIn,
    storageSnapshot,
    emailBadge,
    newsBadge,
    chatBadge,
    startMenuOpen,
    quickSettingsOpen,
    setStartMenuOpen,
    setQuickSettingsOpen,
    toggleTaskbarApp,
    togglePinTaskbarApp,
    closeAllAppWindows,
    cascadeAllWindows,
    toggleNetwork,
    toggleBluetooth,
    togglePowerPlug,
    updateSystem,
    minimizeAllWindows,
    openApp,
  } = useGame();

  const [quickQuery, setQuickQuery] = useState('');
  const [taskbarMenu, setTaskbarMenu] = useState<TaskbarContextMenu | null>(null);
  const isLight = system.theme === 'light';

  useEffect(() => {
    if (!taskbarMenu) return;
    const close = () => setTaskbarMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTaskbarMenu(null);
    };
    window.addEventListener('click', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [taskbarMenu]);

  const pinnedSet = new Set(pinnedTaskbarApps);
  const pinnedOrdered = pinnedTaskbarApps
    .map((id) => ALL_TASKBAR_APPS.find((a) => a.id === id))
    .filter((a): a is TaskbarAppMeta => Boolean(a));
  const runningUnpinned = ALL_TASKBAR_APPS.filter(
    (app) => !pinnedSet.has(app.id) && windowInstances.some((w) => w.appId === app.id)
  );
  const taskbarApps = [...pinnedOrdered, ...runningUnpinned];

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && quickQuery.trim()) {
      const q = quickQuery.trim().toLowerCase();
      const match = ALL_TASKBAR_APPS.find(
        (a) =>
          a.label.toLowerCase().includes(q) ||
          a.aliases.toLowerCase().includes(q)
      );
      if (match) {
        openApp(match.id);
      } else {
        openApp('browser', { forceNew: true, initialQuery: quickQuery.trim() });
      }
      setQuickQuery('');
    }
  };

  const openBarContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStartMenuOpen(false);
    setQuickSettingsOpen(false);
    const x = Math.max(12, Math.min(window.innerWidth - 224, e.clientX));
    const y = Math.max(12, Math.min(window.innerHeight - 220, e.clientY - 170));
    setTaskbarMenu({ kind: 'bar', x, y });
  };

  const openAppContextMenu = (e: React.MouseEvent, app: TaskbarAppMeta) => {
    e.preventDefault();
    e.stopPropagation();
    setStartMenuOpen(false);
    setQuickSettingsOpen(false);
    const x = Math.max(12, Math.min(window.innerWidth - 228, e.clientX));
    const y = Math.max(12, Math.min(window.innerHeight - 240, e.clientY - 185));
    setTaskbarMenu({ kind: 'app', appId: app.id, label: app.label, x, y });
  };

  const hh = clockTime.getHours().toString().padStart(2, '0');
  const mm = clockTime.getMinutes().toString().padStart(2, '0');
  const year = clockTime.getFullYear();
  const month = clockTime.getMonth() + 1;
  const day = clockTime.getDate();

  return (
    <>
      {/* Windows 11 Quick Settings Flyout */}
      <AnimatePresence>
        {quickSettingsOpen && (
          <motion.div
            initial={system.animations ? { opacity: 0, y: 12, scale: 0.97 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={system.animations ? { opacity: 0, y: 10, scale: 0.97 } : undefined}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={`fixed bottom-14 right-3 z-[75] w-80 max-w-[calc(100vw-24px)] rounded-2xl border p-4 shadow-2xl backdrop-blur-2xl space-y-4 ${
              isLight
                ? 'bg-white/95 border-slate-300 text-slate-900'
                : 'bg-slate-900/95 border-slate-700/80 text-slate-100'
            }`}
          >
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={toggleNetwork}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1.5 text-xs font-medium cursor-pointer transition-colors ${
                  isOnline
                    ? 'bg-sky-500 text-slate-950 border-sky-400'
                    : isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-700'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span>{isOnline ? 'WLAN 已连接' : 'WLAN 已断开'}</span>
              </button>

              <button
                type="button"
                onClick={toggleBluetooth}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1.5 text-xs font-medium cursor-pointer transition-colors ${
                  system.bluetooth
                    ? 'bg-indigo-500 text-white border-indigo-400'
                    : isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-700'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <Bluetooth className="w-4 h-4" />
                <span>{system.bluetooth ? '蓝牙已开启' : '蓝牙已关闭'}</span>
              </button>

              <button
                type="button"
                onClick={() => updateSystem({ sound: !system.sound })}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1.5 text-xs font-medium cursor-pointer transition-colors ${
                  system.sound
                    ? 'bg-sky-500 text-slate-950 border-sky-400'
                    : isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-700'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                {system.sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span>{system.sound ? '音效开启' : '已静音'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const order: ThemeMode[] = ['dark', 'light', 'horror'];
                  const next = order[(order.indexOf(system.theme) + 1) % order.length];
                  updateSystem({ theme: next });
                }}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1.5 text-xs font-medium cursor-pointer transition-colors ${
                  isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>
                  主题：{system.theme === 'dark' ? '深色' : system.theme === 'light' ? '浅色' : '血色'}
                </span>
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>屏幕亮度</span>
                  <span className="font-mono-tabular opacity-70">{system.brightness}%</span>
                </div>
                <input
                  type="range"
                  min={35}
                  max={100}
                  value={system.brightness}
                  onChange={(e) => updateSystem({ brightness: Number(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>系统音量</span>
                  <span className="font-mono-tabular opacity-70">{system.soundVolume}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={system.soundVolume}
                  onChange={(e) => updateSystem({ soundVolume: Number(e.target.value) })}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              <div className={`rounded-xl border px-3 py-2 flex items-center justify-between gap-2 text-xs ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-700/80 bg-slate-800/70'}`}>
                <div className="min-w-0">
                  <div className="font-semibold flex items-center gap-1.5">
                    {isPluggedIn ? (
                      <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Battery className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className="font-mono-tabular">
                      {Math.round(batteryLevel)}% · {isPluggedIn ? '供电中' : '放电中'}
                    </span>
                  </div>
                  <div className="text-[11px] opacity-75 font-mono-tabular flex items-center gap-1 mt-0.5">
                    <HardDrive className="w-3 h-3 shrink-0" />
                    <span>剩余 {storageSnapshot.freeGb.toFixed(1)} / {storageSnapshot.totalCapacityGb} GB</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={togglePowerPlug}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer ${
                    isPluggedIn
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500 text-slate-950'
                  }`}
                >
                  <Plug className="w-3 h-3" />
                  <span>{isPluggedIn ? '拔掉' : '接电'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setQuickSettingsOpen(false);
                  openApp('taskmgr');
                }}
                className="opacity-75 hover:opacity-100 hover:text-sky-400 transition-colors cursor-pointer"
              >
                打开任务管理器
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuickSettingsOpen(false);
                  openApp('settings');
                }}
                className="text-sky-400 hover:underline font-medium cursor-pointer"
              >
                打开全部设置
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Taskbar & Taskbar Icon Context Menu */}
      <AnimatePresence>
        {taskbarMenu && (
          <motion.div
            initial={system.animations ? { opacity: 0, y: 6, scale: 0.96 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={system.animations ? { opacity: 0, y: 6, scale: 0.96 } : undefined}
            transition={{ duration: 0.12 }}
            style={{ left: taskbarMenu.x, top: taskbarMenu.y }}
            onClick={(e) => e.stopPropagation()}
            className={`fixed z-[90] w-54 rounded-xl border p-1.5 shadow-2xl backdrop-blur-xl text-xs space-y-0.5 ${
              isLight
                ? 'bg-white/95 border-slate-300 text-slate-900'
                : 'bg-slate-900/95 border-slate-700 text-slate-100'
            }`}
          >
            {taskbarMenu.kind === 'bar' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    openApp('taskmgr');
                    setTaskbarMenu(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg flex items-center justify-between hover:bg-sky-500/20 cursor-pointer text-left font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-sky-400" />
                    <span>任务管理器</span>
                  </span>
                  <span className="text-[10px] opacity-60 font-mono-tabular">Ctrl+Shift+Esc</span>
                </button>
                <div className="my-1 border-t border-slate-700/40" />
                <button
                  type="button"
                  onClick={() => {
                    cascadeAllWindows();
                    setTaskbarMenu(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-white/10 cursor-pointer text-left"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>层叠整理窗口</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    minimizeAllWindows();
                    setTaskbarMenu(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-white/10 cursor-pointer text-left"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>显示桌面</span>
                </button>
                <div className="my-1 border-t border-slate-700/40" />
                <button
                  type="button"
                  onClick={() => {
                    openApp('settings');
                    setTaskbarMenu(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-white/10 cursor-pointer text-left"
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-slate-300" />
                  <span>系统与任务栏设置</span>
                </button>
              </>
            ) : (
              <>
                <div className="px-3 py-1.5 text-[11px] font-semibold opacity-70 truncate">
                  {taskbarMenu.label}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    openApp(taskbarMenu.appId);
                    setTaskbarMenu(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-500/20 cursor-pointer text-left"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  <span>打开 / 聚焦窗口</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openApp(taskbarMenu.appId, { forceNew: true });
                    setTaskbarMenu(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-500/20 cursor-pointer text-left"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>多开新窗口</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    togglePinTaskbarApp(taskbarMenu.appId);
                    setTaskbarMenu(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-500/15 cursor-pointer text-left"
                >
                  {pinnedTaskbarApps.includes(taskbarMenu.appId) ? (
                    <>
                      <PinOff className="w-3.5 h-3.5 text-amber-400" />
                      <span>从任务栏取消固定</span>
                    </>
                  ) : (
                    <>
                      <Pin className="w-3.5 h-3.5 text-amber-400" />
                      <span>固定到任务栏 (跨周目保存)</span>
                    </>
                  )}
                </button>
                {windowInstances.some((w) => w.appId === taskbarMenu.appId) && (
                  <button
                    type="button"
                    onClick={() => {
                      closeAllAppWindows(taskbarMenu.appId);
                      setTaskbarMenu(null);
                    }}
                    className="w-full px-3 py-2 rounded-lg flex items-center gap-2 text-rose-400 hover:bg-rose-500/15 cursor-pointer text-left"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>关闭全部该应用窗口</span>
                  </button>
                )}
                <div className="my-1 border-t border-slate-700/40" />
                <button
                  type="button"
                  onClick={() => {
                    openApp('taskmgr');
                    setTaskbarMenu(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-white/10 cursor-pointer text-left"
                >
                  <Cpu className="w-3.5 h-3.5 text-sky-400" />
                  <span>打开任务管理器</span>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Authentic Centered Windows 11 Taskbar */}
      <footer
        onContextMenu={openBarContextMenu}
        className={`fixed bottom-0 left-0 right-0 h-12 px-2.5 z-[60] border-t backdrop-blur-2xl grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 ${
          isLight
            ? 'bg-slate-100/85 border-slate-300/80 text-slate-800'
            : system.theme === 'horror'
              ? 'bg-[#170709]/90 border-red-900/60 text-red-100'
              : 'bg-[#141923]/88 border-white/10 text-slate-100'
        }`}
      >
        {/* Left Zone: Subtle Codex Progress Pill */}
        <div className="flex items-center justify-start min-w-0">
          <button
            type="button"
            onClick={() => openApp('achievements')}
            className={`hidden sm:flex items-center gap-2 px-2.5 h-8 rounded-md text-xs transition-colors cursor-pointer whitespace-nowrap ${
              isLight ? 'hover:bg-black/5' : 'hover:bg-white/10'
            }`}
            title="打开 50 结局收集图鉴"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-mono-tabular font-medium">
              图鉴 {unlockedEndings.length}/50
            </span>
          </button>
        </div>

        {/* Center Zone: Win11 Start + Search Pill + Centered App Dock */}
        <div className="flex items-center justify-center gap-1 min-w-0 max-w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setQuickSettingsOpen(false);
              setTaskbarMenu(null);
              setStartMenuOpen((prev) => !prev);
            }}
            aria-label="开始"
            title="开始"
            className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              startMenuOpen
                ? isLight
                  ? 'bg-black/10'
                  : 'bg-white/15'
                : isLight
                  ? 'hover:bg-black/5'
                  : 'hover:bg-white/10'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="2.5" y="2.5" width="8.5" height="8.5" rx="1" fill="#38bdf8" />
              <rect x="13" y="2.5" width="8.5" height="8.5" rx="1" fill="#38bdf8" />
              <rect x="2.5" y="13" width="8.5" height="8.5" rx="1" fill="#0284c7" />
              <rect x="13" y="13" width="8.5" height="8.5" rx="1" fill="#0284c7" />
            </svg>
          </button>

          <div
            className={`hidden lg:flex items-center gap-2 px-3 h-8 rounded-full border text-xs w-40 mr-1 shrink-0 ${
              isLight
                ? 'bg-white/90 border-slate-300 text-slate-800'
                : 'bg-white/10 border-white/10 text-slate-100'
            }`}
          >
            <Search className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <input
              type="text"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="搜索应用 / 网页"
              className="bg-transparent outline-none w-full placeholder:text-slate-400"
            />
          </div>

          <nav aria-label="任务栏应用" className="flex items-center gap-0.5 max-w-full overflow-x-auto no-scrollbar">
            {taskbarApps.map((app) => {
              const instances = windowInstances.filter((w) => w.appId === app.id);
              const isOpen = instances.length > 0;
              const isActive = instances.some((w) => !w.isMinimized && w.instanceId === focusedInstanceId);
              const hasUnread =
                (app.id === 'email' && emailBadge > 0) ||
                (app.id === 'news' && newsBadge) ||
                (app.id === 'chat' && chatBadge);

              return (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => toggleTaskbarApp(app.id)}
                  onContextMenu={(e) => openAppContextMenu(e, app)}
                  title={`${app.label}${instances.length > 1 ? ` (${instances.length})` : ''} · 右键置顶或管理`}
                  className={`relative w-10 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    isActive
                      ? isLight
                        ? 'bg-black/10'
                        : 'bg-white/14'
                      : isLight
                        ? 'hover:bg-black/5'
                        : 'hover:bg-white/10'
                  }`}
                >
                  {app.icon}
                  {isOpen && (
                    <span
                      className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all ${
                        isActive ? 'w-4 bg-sky-400' : 'w-1.5 bg-slate-400'
                      }`}
                    />
                  )}
                  {instances.length > 1 && (
                    <span className="absolute top-0.5 right-0.5 text-[9px] font-mono-tabular font-bold px-1 rounded bg-slate-700 text-sky-300">
                      {instances.length}
                    </span>
                  )}
                  {hasUnread && (
                    <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Zone: Win11 Quick Settings Pill + Stacked Clock + Show Desktop */}
        <div className="flex items-center justify-end gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setStartMenuOpen(false);
              setTaskbarMenu(null);
              setQuickSettingsOpen((prev) => !prev);
            }}
            title="快速设置 (网络 / 蓝牙 / 亮度 / 音量)"
            className={`h-9 px-2.5 rounded-md flex items-center gap-2 transition-colors cursor-pointer ${
              quickSettingsOpen
                ? isLight
                  ? 'bg-black/10'
                  : 'bg-white/15'
                : isLight
                  ? 'hover:bg-black/5'
                  : 'hover:bg-white/10'
            }`}
          >
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-sky-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            )}
            {system.bluetooth && <Bluetooth className="w-3.5 h-3.5 text-indigo-400" />}
            {system.sound ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 opacity-60" />
            )}
            <span
              className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-mono-tabular ${
                isPluggedIn
                  ? 'text-emerald-400'
                  : batteryLevel <= system.lowBatteryThreshold
                    ? 'text-rose-400'
                    : ''
              }`}
            >
              {isPluggedIn ? (
                <BatteryCharging className="w-3.5 h-3.5" />
              ) : (
                <Battery className="w-3.5 h-3.5" />
              )}
              <span>{Math.round(batteryLevel)}%</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => openApp('settings')}
            title="日期和时间"
            className={`px-2 h-9 rounded-md text-right leading-tight flex flex-col justify-center transition-colors cursor-pointer ${
              isLight ? 'hover:bg-black/5' : 'hover:bg-white/10'
            }`}
          >
            <div className="text-[11px] font-mono-tabular font-medium">
              {hh}:{mm}
            </div>
            <div className="text-[10px] font-mono-tabular opacity-75">
              {year}/{month}/{day}
            </div>
          </button>

          <button
            type="button"
            onClick={minimizeAllWindows}
            title="显示桌面"
            className={`w-2 h-9 border-l ml-0.5 transition-colors cursor-pointer ${
              isLight
                ? 'border-slate-300 hover:bg-black/10'
                : 'border-white/15 hover:bg-white/15'
            }`}
          />
        </div>
      </footer>
    </>
  );
};

