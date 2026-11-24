import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  Code2,
  Cpu,
  ExternalLink,
  FileText,
  FolderLock,
  Globe,
  Layers,
  Mail,
  MessageSquare,
  Minimize2,
  Newspaper,
  Palette,
  Pin,
  PinOff,
  Radio,
  Settings as SettingsIcon,
  Shield,
  ShoppingBag,
  Terminal,
  Trophy,
  Waves,
  Wifi,
  XCircle,
} from 'lucide-react';
import { GameProvider, useGame } from './context/GameContext';
import { useIsMobile } from './hooks/useIsMobile';
import { DesktopHUD } from './components/DesktopHUD';
import { DesktopWindow } from './components/DesktopWindow';
import { MobilePhoneShell } from './components/MobilePhoneShell';
import { Overlays } from './components/Overlays';
import { ClientUpdateModal } from './components/ClientUpdateModal';
import { PreGameFlow } from './components/PreGameFlow';
import { OfflineIndicator, PWAUpdateBanner } from './components/PWAComponents';
import { StartMenu } from './components/StartMenu';
import { Taskbar } from './components/Taskbar';
import { AchievementsApp } from './components/apps/AchievementsApp';
import { BrowserApp } from './components/apps/BrowserApp';
import { ChatApp } from './components/apps/ChatApp';
import { EmailApp } from './components/apps/EmailApp';
import { FilesApp } from './components/apps/FilesApp';
import { MonitorApp } from './components/apps/MonitorApp';
import { MorseApp } from './components/apps/MorseApp';
import { NewsApp } from './components/apps/NewsApp';
import { NotepadApp } from './components/apps/NotepadApp';
import { RadioApp } from './components/apps/RadioApp';
import { SecurityApp } from './components/apps/SecurityApp';
import { SettingsApp } from './components/apps/SettingsApp';
import { StoreApp } from './components/apps/StoreApp';
import { TaskManagerApp } from './components/apps/TaskManagerApp';
import { TerminalApp } from './components/apps/TerminalApp';
import { VSCodeApp } from './components/apps/VSCodeApp';
import { AppId, StoreAppId, ThemeMode, WindowInstance } from './types/game';

const DESKTOP_ICONS: { id: AppId; label: string; icon: React.ReactNode }[] = [
  { id: 'browser', label: '浏览器', icon: <Globe className="w-7 h-7 text-sky-400" /> },
  { id: 'email', label: '邮件箱', icon: <Mail className="w-7 h-7 text-amber-400" /> },
  { id: 'notepad', label: '记事本', icon: <FileText className="w-7 h-7 text-emerald-400" /> },
  { id: 'security', label: '安全中心', icon: <Shield className="w-7 h-7 text-cyan-400" /> },
  { id: 'morse', label: '电码破译', icon: <Waves className="w-7 h-7 text-teal-400" /> },
  { id: 'taskmgr', label: '任务管理器', icon: <Cpu className="w-7 h-7 text-sky-400" /> },
  { id: 'store', label: '应用商店', icon: <ShoppingBag className="w-7 h-7 text-blue-400" /> },
  { id: 'settings', label: '设置', icon: <SettingsIcon className="w-7 h-7 text-slate-300" /> },
  { id: 'achievements', label: '结局图鉴', icon: <Trophy className="w-7 h-7 text-yellow-400" /> },
];

const STORE_DESKTOP_ICONS: Record<StoreAppId, { id: AppId; label: string; icon: React.ReactNode }> = {
  vscode: { id: 'vscode', label: 'VS Code', icon: <Code2 className="w-7 h-7 text-sky-400" /> },
  monitor: { id: 'monitor', label: '资源监视器', icon: <Activity className="w-7 h-7 text-emerald-400" /> },
  radio: { id: 'radio', label: '午夜电波', icon: <Radio className="w-7 h-7 text-amber-400" /> },
  files: { id: 'files', label: '深层文件箱', icon: <FolderLock className="w-7 h-7 text-indigo-400" /> },
};

function getSmallIcon(appId: AppId) {
  switch (appId) {
    case 'browser':
      return <Globe className="w-4 h-4 text-sky-400" />;
    case 'email':
      return <Mail className="w-4 h-4 text-amber-400" />;
    case 'notepad':
      return <FileText className="w-4 h-4 text-emerald-400" />;
    case 'terminal':
      return <Terminal className="w-4 h-4 text-lime-400" />;
    case 'security':
      return <Shield className="w-4 h-4 text-cyan-400" />;
    case 'settings':
      return <SettingsIcon className="w-4 h-4 text-slate-300" />;
    case 'news':
      return <Newspaper className="w-4 h-4 text-rose-400" />;
    case 'chat':
      return <MessageSquare className="w-4 h-4 text-green-400" />;
    case 'achievements':
      return <Trophy className="w-4 h-4 text-yellow-400" />;
    case 'store':
      return <ShoppingBag className="w-4 h-4 text-blue-400" />;
    case 'morse':
      return <Waves className="w-4 h-4 text-teal-400" />;
    case 'taskmgr':
      return <Cpu className="w-4 h-4 text-sky-400" />;
    case 'vscode':
      return <Code2 className="w-4 h-4 text-sky-400" />;
    case 'monitor':
      return <Activity className="w-4 h-4 text-emerald-400" />;
    case 'radio':
      return <Radio className="w-4 h-4 text-amber-400" />;
    case 'files':
      return <FolderLock className="w-4 h-4 text-indigo-400" />;
  }
}

function renderAppBody(instance: WindowInstance) {
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

type DesktopContextMenu =
  | { kind: 'desktop'; x: number; y: number }
  | { kind: 'icon'; appId: AppId; label: string; x: number; y: number };

const VirtualDesktop: React.FC = () => {
  const isMobile = useIsMobile();
  const {
    phase,
    system,
    step,
    isOnline,
    installedApps,
    pinnedTaskbarApps,
    desktopShake,
    emailBadge,
    windowInstances,
    openApp,
    togglePinTaskbarApp,
    closeAllAppWindows,
    setStartMenuOpen,
    setQuickSettingsOpen,
    cascadeAllWindows,
    minimizeAllWindows,
    toggleNetwork,
    updateSystem,
  } = useGame();

  const [ctxMenu, setCtxMenu] = useState<DesktopContextMenu | null>(null);

  // Ctrl+Shift+Esc opens Task Manager in-OS
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (phase === 'PLAYING' && e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'escape') {
        e.preventDefault();
        openApp('taskmgr');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, openApp]);

  if (phase === 'TITLE' || phase === 'LOADING' || phase === 'WARNING' || phase === 'PROLOGUE') {
    return <PreGameFlow />;
  }

  if (isMobile) {
    return <MobilePhoneShell />;
  }

  const isLight = system.theme === 'light';
  const isHorror = system.theme === 'horror';

  const wallpaperClass = isLight
    ? 'bg-gradient-to-br from-slate-200 via-sky-100 to-slate-300 text-slate-900'
    : isHorror
      ? 'bg-gradient-to-br from-[#2b090c] via-[#1a0507] to-[#0a0203] text-red-50'
      : 'bg-gradient-to-br from-[#0b1526] via-[#0f243f] to-[#070e19] text-slate-100';

  const iconTileClass = isLight
    ? 'hover:bg-white/65 text-slate-900 border-transparent hover:border-slate-300/60'
    : 'hover:bg-white/10 text-slate-100 border-transparent hover:border-white/15';

  const handleDesktopContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if ((e.target as HTMLElement).closest('section, footer, aside')) return;
    setStartMenuOpen(false);
    setQuickSettingsOpen(false);
    const maxX = Math.max(12, window.innerWidth - 224);
    const maxY = Math.max(12, window.innerHeight - 340);
    setCtxMenu({
      kind: 'desktop',
      x: Math.min(e.clientX, maxX),
      y: Math.min(e.clientY, maxY),
    });
  };

  const handleIconContextMenu = (e: React.MouseEvent, item: { id: AppId; label: string }) => {
    e.preventDefault();
    e.stopPropagation();
    setStartMenuOpen(false);
    setQuickSettingsOpen(false);
    const maxX = Math.max(12, window.innerWidth - 224);
    const maxY = Math.max(12, window.innerHeight - 210);
    setCtxMenu({
      kind: 'icon',
      appId: item.id,
      label: item.label,
      x: Math.min(e.clientX, maxX),
      y: Math.min(e.clientY, maxY),
    });
  };

  const cycleTheme = () => {
    const order: ThemeMode[] = ['dark', 'light', 'horror'];
    const next = order[(order.indexOf(system.theme) + 1) % order.length];
    updateSystem({ theme: next });
    setCtxMenu(null);
  };

  const brightnessDimOpacity = Math.max(0, Math.min(0.6, (100 - system.brightness) / 115));

  return (
    <main
      onClick={() => {
        setStartMenuOpen(false);
        setQuickSettingsOpen(false);
        setCtxMenu(null);
      }}
      onContextMenu={handleDesktopContextMenu}
      className={`relative w-screen h-screen overflow-hidden flex flex-col ${wallpaperClass} ${
        step >= 2 && !system.photosensitiveSafe ? 'animate-glitch' : ''
      } ${desktopShake && !system.photosensitiveSafe ? 'animate-shake' : ''}`}
    >
      {/* Win11 Bloom Centerpiece Wallpaper Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden"
      >
        <div
          className={`w-[540px] h-[540px] rounded-full blur-3xl opacity-30 ${
            isHorror
              ? 'bg-gradient-to-tr from-red-700 via-rose-900 to-transparent'
              : isLight
                ? 'bg-gradient-to-tr from-sky-300 via-blue-200 to-indigo-200'
                : 'bg-gradient-to-tr from-sky-600/60 via-blue-700/40 to-indigo-500/30'
          }`}
        />
      </div>

      {/* Display Brightness / Night Light / Atmospheric Horror Overlays */}
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

      {/* Clean Adaptive Desktop Icons Column */}
      <div className="p-4 z-10 w-fit">
        <div className="flex flex-col flex-wrap max-h-[calc(100vh-88px)] gap-2 content-start">
          {[...DESKTOP_ICONS, ...installedApps.map((id) => STORE_DESKTOP_ICONS[id])].map((item) => {
            const badgeCount = item.id === 'email' ? emailBadge : 0;

            return (
              <motion.button
                key={item.id}
                type="button"
                whileHover={system.animations ? { scale: 1.03 } : undefined}
                whileTap={system.animations ? { scale: 0.96 } : undefined}
                transition={{ duration: 0.12 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setCtxMenu(null);
                  setQuickSettingsOpen(false);
                  openApp(item.id);
                }}
                onContextMenu={(e) => handleIconContextMenu(e, item)}
                title={`${item.label}（右键可置顶到任务栏或多开）`}
                className={`relative w-21 h-21 rounded-xl border flex flex-col items-center justify-center gap-1.5 p-2 transition-colors cursor-pointer ${iconTileClass}`}
              >
                {item.icon}
                <span className="text-[11px] font-medium leading-tight whitespace-nowrap drop-shadow-sm">
                  {item.label}
                </span>
                {badgeCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-mono-tabular font-bold flex items-center justify-center">
                    {badgeCount}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Top-Right Desktop Status Widget */}
      <DesktopHUD />

      {/* Multi-Instance Draggable / 8-Way Resizable Windows */}
      <AnimatePresence>
        {windowInstances.map((instance) => (
          <DesktopWindow
            key={instance.instanceId}
            instance={instance}
            icon={getSmallIcon(instance.appId)}
          >
            {renderAppBody(instance)}
          </DesktopWindow>
        ))}
      </AnimatePresence>

      {/* Custom Desktop / Icon Right-Click Context Menu */}
      <AnimatePresence>
        {ctxMenu && (
          <motion.div
            initial={system.animations ? { opacity: 0, scale: 0.95 } : false}
            animate={{ opacity: 1, scale: 1 }}
            exit={system.animations ? { opacity: 0, scale: 0.95 } : undefined}
            transition={{ duration: 0.12 }}
            style={{ left: ctxMenu.x, top: ctxMenu.y }}
            onClick={(e) => e.stopPropagation()}
            className={`fixed z-[85] w-56 rounded-xl border p-1.5 shadow-2xl backdrop-blur-xl text-xs space-y-0.5 ${
              isLight
                ? 'bg-white/95 border-slate-300 text-slate-900'
                : 'bg-slate-900/95 border-slate-700 text-slate-100'
            }`}
          >
            {ctxMenu.kind === 'icon' ? (
              <>
                <div className="px-3 py-1 text-[11px] font-semibold opacity-70 truncate">
                  {ctxMenu.label}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    openApp(ctxMenu.appId);
                    setCtxMenu(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-500/20 cursor-pointer text-left"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  <span>打开应用</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openApp(ctxMenu.appId, { forceNew: true });
                    setCtxMenu(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-500/20 cursor-pointer text-left"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>多开新窗口</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    togglePinTaskbarApp(ctxMenu.appId);
                    setCtxMenu(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-500/15 cursor-pointer text-left"
                >
                  {pinnedTaskbarApps.includes(ctxMenu.appId) ? (
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
                {windowInstances.some((w) => w.appId === ctxMenu.appId) && (
                  <button
                    type="button"
                    onClick={() => {
                      closeAllAppWindows(ctxMenu.appId);
                      setCtxMenu(null);
                    }}
                    className="w-full px-3 py-2 rounded-lg flex items-center gap-2 text-rose-400 hover:bg-rose-500/15 cursor-pointer text-left"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>关闭全部该应用窗口</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    openApp('taskmgr');
                    setCtxMenu(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg flex items-center justify-between hover:bg-sky-500/20 cursor-pointer text-left font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-sky-400" />
                    <span>任务管理器</span>
                  </span>
                  <span className="text-[10px] opacity-60 font-mono-tabular">Ctrl+Shift+Esc</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openApp('browser', { forceNew: true });
                    setCtxMenu(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-500/20 cursor-pointer text-left"
                >
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  <span>新建浏览器窗口</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openApp('notepad', { forceNew: true });
                    setCtxMenu(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-500/20 cursor-pointer text-left"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>新建记事本窗口</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openApp('terminal', { forceNew: true });
                    setCtxMenu(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-500/20 cursor-pointer text-left"
                >
                  <Terminal className="w-3.5 h-3.5 text-lime-400" />
                  <span>打开终端</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openApp('store');
                    setCtxMenu(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-500/20 cursor-pointer text-left"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                  <span>打开应用商店</span>
                </button>

                <div className="my-1 border-t border-slate-700/40" />

                <button
                  type="button"
                  onClick={() => {
                    cascadeAllWindows();
                    setCtxMenu(null);
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
                    setCtxMenu(null);
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
                    toggleNetwork();
                    setCtxMenu(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-white/10 cursor-pointer text-left"
                >
                  <Wifi className="w-3.5 h-3.5 text-sky-400" />
                  <span>{isOnline ? '断开网络连接' : '连接网络'}</span>
                </button>
                <button
                  type="button"
                  onClick={cycleTheme}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-white/10 cursor-pointer text-left"
                >
                  <Palette className="w-3.5 h-3.5 text-rose-400" />
                  <span>切换桌面主题</span>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start Menu, Taskbar & Modals */}
      <StartMenu />
      <Taskbar />
      <Overlays />
    </main>
  );
};

export default function App() {
  // Globally suppress the native browser context menu across all shells and overlays
  useEffect(() => {
    const suppressNativeContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener('contextmenu', suppressNativeContextMenu);
    return () => window.removeEventListener('contextmenu', suppressNativeContextMenu);
  }, []);

  return (
    <GameProvider>
      <VirtualDesktop />
      <OfflineIndicator />
      <PWAUpdateBanner />
      <ClientUpdateModal />
    </GameProvider>
  );
}
