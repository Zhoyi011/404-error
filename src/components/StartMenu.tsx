import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  Code2,
  Cpu,
  ExternalLink,
  FileText,
  FolderLock,
  Globe,
  Home,
  Layers,
  Mail,
  MessageSquare,
  Newspaper,
  Pin,
  PinOff,
  Power,
  Radar,
  Radio,
  RotateCcw,
  Search,
  Settings as SettingsIcon,
  Shield,
  ShoppingBag,
  Sparkles,
  Terminal,
  Trophy,
  Waves,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { AppId, StoreAppId } from '../types/game';

interface StartAppMeta {
  id: AppId;
  name: string;
  desc: string;
  keywords: string;
  isStoreApp?: boolean;
  icon: React.ReactNode;
}

const ALL_START_APPS: StartAppMeta[] = [
  { id: 'browser', name: '浏览器', desc: '网页检索与民间 Wiki', keywords: 'browser edge chrome web wiki 浏览器', icon: <Globe className="w-5 h-5 text-sky-400" /> },
  { id: 'email', name: '邮件箱', desc: '收件箱与加密归档', keywords: 'email mail 邮件', icon: <Mail className="w-5 h-5 text-amber-400" /> },
  { id: 'notepad', name: '记事本', desc: '随笔记录与备忘', keywords: 'notepad note 记事本 备忘', icon: <FileText className="w-5 h-5 text-emerald-400" /> },
  { id: 'store', name: '应用商店', desc: 'Microsoft Store 装机', keywords: 'store microsoft app 商店', icon: <ShoppingBag className="w-5 h-5 text-blue-400" /> },
  { id: 'morse', name: '电码破译', desc: '摩斯密码破译与发报台', keywords: 'morse telegraph 摩斯 密码 电报 声呐', icon: <Waves className="w-5 h-5 text-teal-400" /> },
  { id: 'taskmgr', name: '任务管理器', desc: '系统进程监控与树状审计', keywords: 'taskmgr task manager 进程 任务 管理器 cpu', icon: <Cpu className="w-5 h-5 text-sky-400" /> },
  { id: 'terminal', name: '终端', desc: '命令行系统工具', keywords: 'terminal cmd shell 终端', icon: <Terminal className="w-5 h-5 text-lime-400" /> },
  { id: 'security', name: '安全中心', desc: '系统扫描与举报接口', keywords: 'security defender 安全 杀毒 防护', icon: <Shield className="w-5 h-5 text-cyan-400" /> },
  { id: 'settings', name: '系统设置', desc: '蓝牙、亮度、时间与隐私设置', keywords: 'settings system 设置 网络 时钟 蓝牙 亮度', icon: <SettingsIcon className="w-5 h-5 text-slate-300" /> },
  { id: 'news', name: '城市新闻', desc: '晚间新闻动态', keywords: 'news 新闻 晚间', icon: <Newspaper className="w-5 h-5 text-rose-400" /> },
  { id: 'chat', name: '家人群聊', desc: '相亲相爱一家人', keywords: 'chat 群聊 家人', icon: <MessageSquare className="w-5 h-5 text-green-400" /> },
  { id: 'achievements', name: '结局图鉴', desc: '查看 50 个结局档案', keywords: 'achievements endings 图鉴 结局 成就', icon: <Trophy className="w-5 h-5 text-yellow-400" /> },
  { id: 'vscode', name: 'VS Code', desc: '源码重构与热更新编译器', keywords: 'vscode code ide 源码 编译', isStoreApp: true, icon: <Code2 className="w-5 h-5 text-sky-400" /> },
  { id: 'monitor', name: '资源监视器', desc: '实时性能与进程挂起', keywords: 'monitor 监视器 性能 进程 cpu', isStoreApp: true, icon: <Activity className="w-5 h-5 text-emerald-400" /> },
  { id: 'radio', name: '午夜电波', desc: 'FM 调频与应急广播', keywords: 'radio fm 电波 收音机 广播', isStoreApp: true, icon: <Radio className="w-5 h-5 text-amber-400" /> },
  { id: 'files', name: '深层文件箱', desc: '日志转储与碎片粉碎', keywords: 'files vault 文件 保险箱 粉碎', isStoreApp: true, icon: <FolderLock className="w-5 h-5 text-indigo-400" /> },
  { id: 'cleaner', name: '磁盘净化大师', desc: '缓存清理与隐藏扇区粉碎', keywords: 'cleaner storage disk 清理 磁盘 存储 空间', isStoreApp: true, icon: <Sparkles className="w-5 h-5 text-amber-400" /> },
  { id: 'sniffer', name: '深网嗅探仪', desc: '实时网卡抓包与 C2 信标溯源', keywords: 'sniffer packet trace 抓包 嗅探 网络 c2', isStoreApp: true, icon: <Radar className="w-5 h-5 text-cyan-400" /> },
];

export const StartMenu: React.FC = () => {
  const {
    startMenuOpen,
    setStartMenuOpen,
    user,
    system,
    installedApps,
    unlockedEndings,
    pinnedTaskbarApps,
    togglePinTaskbarApp,
    openApp,
    shutdownSystem,
    resetRun,
    returnToTitle,
  } = useGame();

  const [filter, setFilter] = useState('');
  const [appCtx, setAppCtx] = useState<{ app: StartAppMeta; x: number; y: number } | null>(null);

  const isLight = system.theme === 'light';
  const q = filter.trim().toLowerCase();
  const filteredApps = ALL_START_APPS.filter(
    (app) =>
      !q ||
      app.id.toLowerCase().includes(q) ||
      app.name.toLowerCase().includes(q) ||
      app.desc.toLowerCase().includes(q) ||
      app.keywords.toLowerCase().includes(q)
  );

  return (
    <AnimatePresence>
      {startMenuOpen && (
        <motion.div
          initial={system.animations ? { opacity: 0, y: 18, scale: 0.97 } : false}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={system.animations ? { opacity: 0, y: 12, scale: 0.97 } : undefined}
          transition={{ duration: system.animations ? 0.16 : 0, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => {
            e.stopPropagation();
            setAppCtx(null);
          }}
          className={`fixed bottom-14 left-1/2 -translate-x-1/2 z-[75] w-[540px] max-w-[calc(100vw-24px)] max-h-[calc(100vh-80px)] rounded-2xl border backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden ${
            isLight
              ? 'bg-white/95 border-slate-300 text-slate-900'
              : 'bg-slate-900/95 border-slate-700/80 text-slate-100'
          }`}
        >
          {/* Search Bar */}
          <div className={`p-4 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <div
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-full border text-xs ${
                isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-800'
                  : 'bg-slate-950/70 border-slate-700 text-slate-200'
              }`}
            >
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="键入以搜索应用、摩斯破译器、任务管理器或设置"
                className="bg-transparent outline-none w-full placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* All Apps Grid */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 relative">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {q ? `搜索结果 (${filteredApps.length})` : `全部应用 (${ALL_START_APPS.length})`}
                </span>
                <span className={`text-[11px] font-mono-tabular ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  结局图鉴 {unlockedEndings.length} / 50
                </span>
              </div>
              {filteredApps.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {filteredApps.map((app) => {
                    const needsStore =
                      Boolean(app.isStoreApp) &&
                      !installedApps.includes(app.id as StoreAppId);
                    const isPinned = pinnedTaskbarApps.includes(app.id);

                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => {
                          openApp(app.id);
                          setFilter('');
                          setAppCtx(null);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const x = Math.max(12, Math.min(window.innerWidth - 220, e.clientX));
                          const y = Math.max(12, Math.min(window.innerHeight - 170, e.clientY));
                          setAppCtx({ app, x, y });
                        }}
                        title={
                          needsStore
                            ? `${app.name} · 需前往应用商店安装（右键可固定）`
                            : `${app.desc}（右键可固定到任务栏）`
                        }
                        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors cursor-pointer ${
                          isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10'
                        }`}
                      >
                        {isPinned && (
                          <span
                            title="已固定到任务栏"
                            className="absolute top-1.5 left-1.5 text-amber-400/90"
                          >
                            <Pin className="w-3 h-3" />
                          </span>
                        )}
                        {needsStore && (
                          <span className="absolute top-1.5 right-1.5 px-1 rounded text-[9px] font-mono-tabular bg-sky-500/15 text-sky-400 border border-sky-500/30">
                            商店
                          </span>
                        )}
                        <span className={needsStore ? 'opacity-75' : ''}>{app.icon}</span>
                        <span className="text-[11px] font-medium whitespace-nowrap">{app.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className={`py-8 text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  未找到匹配的应用，试试搜索「摩斯」「任务管理器」「vscode」或「蓝牙」。
                </div>
              )}
            </div>

            <div className={`rounded-xl border p-3.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800'}`}>
              <div className="text-xs font-semibold mb-1">提示与快捷操作</div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                右键任何应用图标可固定到任务栏（跨周目自动保存）；右键任务栏空白处可打开任务管理器。
              </p>
            </div>
          </div>

          {/* Win11 Footer: User Account left + Power actions right */}
          <div
            className={`px-5 py-3 border-t flex items-center justify-between gap-2 ${
              isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-slate-950/85 border-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={() => openApp('settings')}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                isLight ? 'hover:bg-slate-200/70' : 'hover:bg-white/10'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sm shrink-0">
                {user.avatar}
              </div>
              <span className="text-xs font-medium">{user.name}</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={returnToTitle}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isLight ? 'hover:bg-slate-200 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>主菜单</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartMenuOpen(false);
                  resetRun();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isLight ? 'hover:bg-slate-200 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重启</span>
              </button>
              <button
                type="button"
                onClick={shutdownSystem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/90 hover:bg-red-600 text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <Power className="w-3.5 h-3.5" />
                <span>关机</span>
              </button>
            </div>
          </div>

          {appCtx && (
            <div
              style={{ left: appCtx.x, top: appCtx.y }}
              onClick={(e) => e.stopPropagation()}
              className={`fixed z-[95] w-52 rounded-xl border p-1.5 shadow-2xl backdrop-blur-xl text-xs space-y-0.5 ${
                isLight
                  ? 'bg-white/95 border-slate-300 text-slate-900'
                  : 'bg-slate-900/95 border-slate-700 text-slate-100'
              }`}
            >
              <div className="px-3 py-1 text-[11px] font-semibold opacity-70 truncate">
                {appCtx.app.name}
              </div>
              <button
                type="button"
                onClick={() => {
                  openApp(appCtx.app.id);
                  setAppCtx(null);
                  setFilter('');
                }}
                className="w-full px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-500/20 cursor-pointer text-left"
              >
                <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                <span>打开</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  openApp(appCtx.app.id, { forceNew: true });
                  setAppCtx(null);
                  setFilter('');
                }}
                className="w-full px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-500/20 cursor-pointer text-left"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>多开新窗口</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  togglePinTaskbarApp(appCtx.app.id);
                  setAppCtx(null);
                }}
                className="w-full px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-500/15 cursor-pointer text-left"
              >
                {pinnedTaskbarApps.includes(appCtx.app.id) ? (
                  <>
                    <PinOff className="w-3.5 h-3.5 text-amber-400" />
                    <span>从任务栏取消固定</span>
                  </>
                ) : (
                  <>
                    <Pin className="w-3.5 h-3.5 text-amber-400" />
                    <span>固定到任务栏</span>
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

