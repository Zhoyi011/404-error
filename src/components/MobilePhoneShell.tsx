import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  Battery,
  BellOff,
  Bluetooth,
  ChevronLeft,
  Code2,
  Compass,
  Cpu,
  FileText,
  FolderLock,
  Home,
  Layers,
  Mail,
  MessageSquare,
  Monitor,
  Newspaper,
  Plus,
  Power,
  Radio,
  RotateCcw,
  Settings as SettingsIcon,
  Shield,
  ShoppingBag,
  SlidersHorizontal,
  Terminal,
  Trophy,
  Volume2,
  VolumeX,
  Waves,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { AppId, StoreAppId, ThemeMode, WindowInstance } from '../types/game';
import { AppBootSplash } from './AppBootSplash';
import { Overlays } from './Overlays';
import { AchievementsApp } from './apps/AchievementsApp';
import { BrowserApp } from './apps/BrowserApp';
import { ChatApp } from './apps/ChatApp';
import { EmailApp } from './apps/EmailApp';
import { FilesApp } from './apps/FilesApp';
import { MonitorApp } from './apps/MonitorApp';
import { MorseApp } from './apps/MorseApp';
import { NewsApp } from './apps/NewsApp';
import { NotepadApp } from './apps/NotepadApp';
import { RadioApp } from './apps/RadioApp';
import { SecurityApp } from './apps/SecurityApp';
import { SettingsApp } from './apps/SettingsApp';
import { StoreApp } from './apps/StoreApp';
import { TaskManagerApp } from './apps/TaskManagerApp';
import { TerminalApp } from './apps/TerminalApp';
import { VSCodeApp } from './apps/VSCodeApp';

const IOS_HOME_APPS: {
  id: AppId;
  label: string;
  bgClass: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'browser',
    label: 'Safary',
    bgClass: 'bg-gradient-to-br from-sky-400 to-blue-600 text-white',
    icon: <Compass className="w-7 h-7" />,
  },
  {
    id: 'email',
    label: '邮件',
    bgClass: 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white',
    icon: <Mail className="w-7 h-7" />,
  },
  {
    id: 'notepad',
    label: '备忘录',
    bgClass: 'bg-gradient-to-b from-amber-400 via-amber-50 to-slate-100 text-amber-700',
    icon: <FileText className="w-7 h-7" />,
  },
  {
    id: 'security',
    label: '安全中心',
    bgClass: 'bg-gradient-to-br from-emerald-400 to-teal-700 text-white',
    icon: <Shield className="w-7 h-7" />,
  },
  {
    id: 'settings',
    label: '设置',
    bgClass: 'bg-gradient-to-br from-slate-400 to-slate-700 text-white',
    icon: <SettingsIcon className="w-7 h-7" />,
  },
  {
    id: 'terminal',
    label: '终端',
    bgClass: 'bg-gradient-to-br from-slate-800 to-black text-lime-400',
    icon: <Terminal className="w-7 h-7" />,
  },
  {
    id: 'news',
    label: '今日新闻',
    bgClass: 'bg-gradient-to-br from-rose-500 to-red-700 text-white',
    icon: <Newspaper className="w-7 h-7" />,
  },
  {
    id: 'achievements',
    label: '结局图鉴',
    bgClass: 'bg-gradient-to-br from-amber-400 to-orange-600 text-white',
    icon: <Trophy className="w-7 h-7" />,
  },
  {
    id: 'store',
    label: 'App Store',
    bgClass: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white',
    icon: <ShoppingBag className="w-7 h-7" />,
  },
  {
    id: 'morse',
    label: '电码破译',
    bgClass: 'bg-gradient-to-br from-teal-500 to-cyan-700 text-white',
    icon: <Waves className="w-7 h-7" />,
  },
  {
    id: 'taskmgr',
    label: '进程监视',
    bgClass: 'bg-gradient-to-br from-sky-600 to-slate-800 text-white',
    icon: <Cpu className="w-7 h-7" />,
  },
];

const IOS_STORE_APPS: Record<
  StoreAppId,
  { id: AppId; label: string; bgClass: string; icon: React.ReactNode }
> = {
  vscode: {
    id: 'vscode',
    label: 'VS Code',
    bgClass: 'bg-gradient-to-br from-sky-500 to-blue-700 text-white',
    icon: <Code2 className="w-7 h-7" />,
  },
  monitor: {
    id: 'monitor',
    label: '性能监视',
    bgClass: 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white',
    icon: <Activity className="w-7 h-7" />,
  },
  radio: {
    id: 'radio',
    label: '深夜广播',
    bgClass: 'bg-gradient-to-br from-amber-500 to-orange-700 text-white',
    icon: <Radio className="w-7 h-7" />,
  },
  files: {
    id: 'files',
    label: '文件保险箱',
    bgClass: 'bg-gradient-to-br from-indigo-500 to-purple-700 text-white',
    icon: <FolderLock className="w-7 h-7" />,
  },
};

const IOS_DOCK_APPS: {
  id: AppId;
  label: string;
  bgClass: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'browser',
    label: 'Safary',
    bgClass: 'bg-gradient-to-br from-sky-400 to-blue-600 text-white',
    icon: <Compass className="w-7 h-7" />,
  },
  {
    id: 'email',
    label: '邮件',
    bgClass: 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white',
    icon: <Mail className="w-7 h-7" />,
  },
  {
    id: 'chat',
    label: '信息',
    bgClass: 'bg-gradient-to-br from-emerald-400 to-green-600 text-white',
    icon: <MessageSquare className="w-7 h-7" />,
  },
  {
    id: 'settings',
    label: '设置',
    bgClass: 'bg-gradient-to-br from-slate-400 to-slate-700 text-white',
    icon: <SettingsIcon className="w-7 h-7" />,
  },
];

const IOS_APP_TITLES: Record<AppId, string> = {
  browser: 'Safary',
  email: '邮件',
  notepad: '备忘录',
  settings: '设置',
  security: '设备安全',
  news: '今日新闻',
  chat: '相亲相爱一家人',
  achievements: '结局图鉴',
  terminal: '终端',
  store: 'App Store',
  morse: '电码破译器',
  taskmgr: '任务监视器',
  vscode: 'VS Code Mobile',
  monitor: '性能监视器',
  radio: '深夜广播',
  files: '文件保险箱',
};

function getMobileBootIcon(appId: AppId) {
  const dock = IOS_DOCK_APPS.find((a) => a.id === appId);
  if (dock) return dock.icon;
  const home = IOS_HOME_APPS.find((a) => a.id === appId);
  if (home) return home.icon;
  if (appId in IOS_STORE_APPS) {
    return IOS_STORE_APPS[appId as StoreAppId].icon;
  }
  return <Compass className="w-7 h-7" />;
}

function renderMobileAppBody(instance: WindowInstance) {
  switch (instance.appId) {
    case 'browser':
      return <BrowserApp instance={instance} />;
    case 'email':
      return <EmailApp />;
    case 'notepad':
      return <NotepadApp />;
    case 'terminal':
      return <TerminalApp />;
    case 'security':
      return <SecurityApp />;
    case 'settings':
      return <SettingsApp />;
    case 'news':
      return <NewsApp />;
    case 'chat':
      return <ChatApp />;
    case 'achievements':
      return <AchievementsApp />;
    case 'store':
      return <StoreApp />;
    case 'morse':
      return <MorseApp />;
    case 'taskmgr':
      return <TaskManagerApp />;
    case 'vscode':
      return <VSCodeApp />;
    case 'monitor':
      return <MonitorApp />;
    case 'radio':
      return <RadioApp />;
    case 'files':
      return <FilesApp />;
  }
}

export const MobilePhoneShell: React.FC = () => {
  const {
    system,
    step,
    sanity,
    questText,
    privacy,
    isOnline,
    installedApps,
    clockTime,
    desktopShake,
    emailBadge,
    newsBadge,
    chatBadge,
    unlockedEndings,
    windowInstances,
    focusedInstanceId,
    openApp,
    focusInstance,
    closeInstance,
    minimizeAllWindows,
    toggleNetwork,
    toggleBluetooth,
    updateSystem,
    shutdownSystem,
    resetRun,
    returnToTitle,
  } = useGame();

  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const [tabSwitcherOpen, setTabSwitcherOpen] = useState(false);

  const visibleApps = windowInstances.filter((w) => !w.isMinimized);
  const activeInstance =
    visibleApps.find((w) => w.instanceId === focusedInstanceId) ||
    visibleApps[visibleApps.length - 1] ||
    null;

  const isLight = system.theme === 'light';
  const isHorror = system.theme === 'horror';

  const wallpaperBg = isLight
    ? 'bg-gradient-to-b from-sky-200 via-indigo-100 to-slate-200 text-slate-900'
    : isHorror
      ? 'bg-gradient-to-b from-[#30080d] via-[#1c0407] to-[#090203] text-red-50'
      : 'bg-gradient-to-b from-[#0b1830] via-[#102849] to-[#080f1f] text-slate-100';

  const appSurfaceBg = isLight
    ? 'bg-[#f2f2f7] text-slate-900'
    : isHorror
      ? 'bg-[#140608] text-red-50'
      : 'bg-[#0b0f19] text-slate-100';

  const hh = clockTime.getHours().toString().padStart(2, '0');
  const mm = clockTime.getMinutes().toString().padStart(2, '0');
  const activeShields = [
    privacy.firewallEnabled,
    privacy.privacyEnabled,
    privacy.antivirusEnabled,
    privacy.dnsEnabled,
  ].filter(Boolean).length;

  const getBadge = (id: AppId) => {
    if (id === 'email' && emailBadge > 0) return String(emailBadge);
    if (id === 'news' && newsBadge) return '!';
    if (id === 'chat' && chatBadge) return '!';
    return null;
  };

  const brightnessDimOpacity = Math.max(0, Math.min(0.6, (100 - system.brightness) / 115));

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className={`relative w-screen h-[100dvh] overflow-hidden flex flex-col select-none ${wallpaperBg} ${
        step >= 2 && !system.photosensitiveSafe ? 'animate-glitch' : ''
      } ${desktopShake && !system.photosensitiveSafe ? 'animate-shake' : ''}`}
    >
      {/* Atmospheric Overlays */}
      {brightnessDimOpacity > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[108] bg-black"
          style={{ opacity: brightnessDimOpacity }}
        />
      )}
      {system.nightLight && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[109] bg-amber-500/15 mix-blend-multiply"
        />
      )}
      <div aria-hidden="true" className="horror-vignette pointer-events-none fixed inset-0 z-[110]" />
      {system.crtEffect && (
        <div aria-hidden="true" className="crt-scanlines pointer-events-none fixed inset-0 z-[111]" />
      )}

      {/* iOS Status Bar + Dynamic Island */}
      <header
        className={`relative z-30 h-11 px-5 flex items-center justify-between shrink-0 ${
          activeInstance ? appSurfaceBg : ''
        }`}
      >
        <span className="text-xs font-mono-tabular font-semibold tracking-tight w-16">
          {hh}:{mm}
        </span>

        {/* Dynamic Island */}
        <button
          type="button"
          onClick={() => setControlCenterOpen((v) => !v)}
          className="h-7 px-3.5 rounded-full bg-black text-white flex items-center gap-2 border border-white/10 shadow-md cursor-pointer transition-all"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              step >= 2 ? 'bg-rose-500' : step >= 1 ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
          />
          <span className="text-[10px] font-mono-tabular font-medium whitespace-nowrap">
            {step >= 2 ? '端口异常 · 0x000000' : `理智 ${sanity}%`}
          </span>
        </button>

        {/* Status Icons -> opens Control Center */}
        <button
          type="button"
          onClick={() => setControlCenterOpen(true)}
          aria-label="打开控制中心"
          className="w-16 flex items-center justify-end gap-1.5 text-xs cursor-pointer min-h-[36px]"
        >
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
          <Battery className="w-4 h-4" />
        </button>
      </header>

      {/* Main Area: Either Fullscreen Active iOS App OR iPhone Home Screen */}
      {activeInstance ? (
        <div className={`relative z-20 flex-1 flex flex-col overflow-hidden ${appSurfaceBg}`}>
          {/* iOS App Sub-Header */}
          <div
            className={`h-11 px-3 border-b flex items-center justify-between gap-2 shrink-0 ${
              isLight ? 'border-slate-200 bg-white/80' : 'border-white/10 bg-white/[0.03]'
            }`}
          >
            <button
              type="button"
              onClick={minimizeAllWindows}
              className="flex items-center gap-0.5 text-sky-500 text-sm font-medium min-h-[40px] pr-2 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>桌面</span>
            </button>

            <h1 className="text-sm font-semibold truncate">
              {IOS_APP_TITLES[activeInstance.appId]}
              {activeInstance.appId === 'settings' ? ' · iOS 27.2.1' : ''}
            </h1>

            <div className="flex items-center gap-1">
              {windowInstances.length > 1 && (
                <button
                  type="button"
                  onClick={() => setTabSwitcherOpen(true)}
                  title="切换后台标签"
                  className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-sky-500 cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                </button>
              )}
              {(activeInstance.appId === 'browser' || activeInstance.appId === 'notepad') ? (
                <button
                  type="button"
                  onClick={() => openApp(activeInstance.appId, { forceNew: true })}
                  title="新建标签页"
                  className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-sky-500 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setControlCenterOpen(true)}
                  title="控制中心"
                  className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center opacity-70 cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Active App Content */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <AppBootSplash
              instance={activeInstance}
              icon={getMobileBootIcon(activeInstance.appId)}
              isMobile
            >
              {renderMobileAppBody(activeInstance)}
            </AppBootSplash>
          </div>

          {/* Bottom Home Indicator Bar */}
          <div className="h-6 flex items-center justify-center shrink-0">
            <button
              type="button"
              onClick={minimizeAllWindows}
              aria-label="返回主屏幕"
              className="w-32 h-1.5 rounded-full bg-slate-400/50 hover:bg-slate-400 transition-colors cursor-pointer"
            />
          </div>
        </div>
      ) : (
        /* iPhone Home Screen */
        <div className="relative z-10 flex-1 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6 pt-3 pb-4">
            {/* iOS Widgets Row */}
            <div className="px-4 grid grid-cols-2 gap-3">
              {/* Sanity Widget */}
              <div
                className={`rounded-3xl p-3.5 backdrop-blur-xl border space-y-2 ${
                  isLight
                    ? 'bg-white/75 border-white/80 text-slate-900 shadow-sm'
                    : 'bg-slate-900/65 border-white/10 text-slate-100'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] opacity-75 font-medium">
                  <span>精神稳态</span>
                  <span className="font-mono-tabular font-bold">{sanity}%</span>
                </div>
                <div className="h-2 rounded-full bg-black/15 dark:bg-white/10 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      sanity >= 70 ? 'bg-emerald-500' : sanity >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${sanity}%` }}
                  />
                </div>
                <div className="text-[11px] opacity-80 truncate">
                  {sanity >= 80 ? '状态正常' : sanity >= 50 ? '轻度焦虑' : '认知动摇'}
                </div>
              </div>

              {/* Security & Codex Widget */}
              <button
                type="button"
                onClick={() => openApp('security')}
                className={`rounded-3xl p-3.5 backdrop-blur-xl border text-left space-y-1.5 cursor-pointer ${
                  isLight
                    ? 'bg-white/75 border-white/80 text-slate-900 shadow-sm'
                    : 'bg-slate-900/65 border-white/10 text-slate-100'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] opacity-75 font-medium">
                  <span>iOS 安全保护</span>
                  <span className="font-mono-tabular font-bold">{activeShields}/4</span>
                </div>
                <div className="text-xs font-semibold truncate">
                  {isOnline ? 'WLAN 已连接' : '已启用断网隔离'}
                </div>
                <div className="text-[11px] font-mono-tabular opacity-75">
                  图鉴 {unlockedEndings.length}/40
                </div>
              </button>
            </div>

            {/* Memo Banner Widget */}
            <div className="px-4">
              <div
                className={`rounded-2xl px-4 py-2.5 backdrop-blur-xl border text-xs leading-relaxed ${
                  isLight
                    ? 'bg-white/70 border-white/80 text-slate-800'
                    : 'bg-slate-900/60 border-white/10 text-slate-200'
                }`}
              >
                <span className="font-semibold text-sky-400 mr-1.5">备忘</span>
                <span>{questText}</span>
              </div>
            </div>

            {/* 4-Column iOS App Grid */}
            <div className="px-5 grid grid-cols-4 gap-x-3 gap-y-5">
              {[...IOS_HOME_APPS, ...installedApps.map((id) => IOS_STORE_APPS[id])].map((app) => {
                const badge = getBadge(app.id);
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => openApp(app.id)}
                    className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    <div
                      className={`relative w-14 h-14 rounded-[16px] shadow-lg flex items-center justify-center border border-white/20 ${app.bgClass}`}
                    >
                      {app.icon}
                      {badge && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-mono-tabular font-bold flex items-center justify-center shadow">
                          {badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-center leading-tight drop-shadow-sm whitespace-nowrap">
                      {app.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* iPhone Frosted Dock + Home Indicator */}
          <div className="shrink-0">
            <div
              className={`mx-4 mb-2 rounded-[26px] p-3 backdrop-blur-2xl border grid grid-cols-4 gap-2 ${
                isLight
                  ? 'bg-white/55 border-white/60'
                  : 'bg-slate-900/55 border-white/15'
              }`}
            >
              {IOS_DOCK_APPS.map((app) => {
                const badge = getBadge(app.id);
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => openApp(app.id)}
                    aria-label={app.label}
                    className="flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform"
                  >
                    <div
                      className={`relative w-13 h-13 rounded-[15px] shadow-md flex items-center justify-center border border-white/20 ${app.bgClass}`}
                    >
                      {app.icon}
                      {badge && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-mono-tabular font-bold flex items-center justify-center shadow">
                          {badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="h-5 flex items-center justify-center">
              <div className="w-32 h-1 rounded-full bg-white/40" />
            </div>
          </div>
        </div>
      )}

      {/* iOS App Switcher Sheet */}
      <AnimatePresence>
        {tabSwitcherOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setTabSwitcherOpen(false)}
            className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-xl p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-white">
              <span className="text-sm font-bold">后台标签页 ({windowInstances.length})</span>
              <button
                type="button"
                onClick={() => setTabSwitcherOpen(false)}
                className="px-3 py-1.5 rounded-full bg-white/15 text-xs cursor-pointer"
              >
                完成
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
              {windowInstances.map((win) => (
                <div
                  key={win.instanceId}
                  className="rounded-2xl border border-white/15 bg-slate-900/90 p-3.5 flex items-center justify-between text-white"
                >
                  <button
                    type="button"
                    onClick={() => {
                      focusInstance(win.instanceId);
                      setTabSwitcherOpen(false);
                    }}
                    className="flex-1 text-left text-sm font-medium cursor-pointer"
                  >
                    {IOS_APP_TITLES[win.appId]} · {win.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => closeInstance(win.instanceId)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-rose-400 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Control Center Drawer */}
      <AnimatePresence>
        {controlCenterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setControlCenterOpen(false)}
            className="fixed inset-0 z-[85] bg-black/65 backdrop-blur-2xl p-5 flex flex-col justify-start"
          >
            <motion.div
              initial={system.animations ? { y: -24, opacity: 0 } : false}
              animate={{ y: 0, opacity: 1 }}
              exit={system.animations ? { y: -20, opacity: 0 } : undefined}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm mx-auto mt-6 space-y-4 text-white"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">控制中心</span>
                <button
                  type="button"
                  onClick={() => setControlCenterOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={toggleNetwork}
                  className={`rounded-3xl p-4 flex flex-col items-start gap-2 cursor-pointer border ${
                    isOnline
                      ? 'bg-sky-500 border-sky-400 text-white'
                      : 'bg-white/10 border-white/15 text-slate-300'
                  }`}
                >
                  {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                  <div className="text-xs font-semibold">
                    {isOnline ? 'WLAN 已连接' : '已断开网络'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={toggleBluetooth}
                  className={`rounded-3xl p-4 flex flex-col items-start gap-2 cursor-pointer border ${
                    system.bluetooth
                      ? 'bg-indigo-500 border-indigo-400 text-white'
                      : 'bg-white/10 border-white/15 text-slate-300'
                  }`}
                >
                  <Bluetooth className="w-5 h-5" />
                  <div className="text-xs font-semibold">
                    {system.bluetooth ? '蓝牙已开启' : '蓝牙未开启'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateSystem({ sound: !system.sound })}
                  className={`rounded-3xl p-4 flex flex-col items-start gap-2 cursor-pointer border ${
                    system.sound
                      ? 'bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-white/10 border-white/15 text-slate-300'
                  }`}
                >
                  {system.sound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  <div className="text-xs font-semibold">
                    {system.sound ? '声音开启' : '静音模式'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateSystem({ doNotDisturb: !system.doNotDisturb })}
                  className={`rounded-3xl p-4 flex flex-col items-start gap-2 cursor-pointer border ${
                    system.doNotDisturb
                      ? 'bg-purple-600 border-purple-400 text-white'
                      : 'bg-white/10 border-white/15 text-slate-300'
                  }`}
                >
                  <BellOff className="w-5 h-5" />
                  <div className="text-xs font-semibold">
                    {system.doNotDisturb ? '勿扰开启' : '勿扰关闭'}
                  </div>
                </button>
              </div>

              <div className="rounded-3xl bg-white/10 border border-white/15 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span>媒体与提示音量</span>
                  <span className="font-mono-tabular">{system.soundVolume}%</span>
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

              <div className="rounded-3xl bg-white/10 border border-white/15 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Monitor className="w-4 h-4 text-sky-400" />
                  <span>外观主题</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'dark', label: '深色' },
                    { id: 'light', label: '浅色' },
                    { id: 'horror', label: '血色' },
                  ] as { id: ThemeMode; label: string }[]).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => updateSystem({ theme: t.id })}
                      className={`py-2 rounded-xl text-xs font-medium cursor-pointer ${
                        system.theme === t.id
                          ? 'bg-sky-500 text-white'
                          : 'bg-black/30 text-slate-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setControlCenterOpen(false);
                    returnToTitle();
                  }}
                  className="py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-xs font-medium flex flex-col items-center gap-1 cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>主菜单</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setControlCenterOpen(false);
                    resetRun();
                  }}
                  className="py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-xs font-medium flex flex-col items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>重启</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setControlCenterOpen(false);
                    shutdownSystem();
                  }}
                  className="py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer"
                >
                  <Power className="w-4 h-4" />
                  <span>关机</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Overlays />
    </div>
  );
};
