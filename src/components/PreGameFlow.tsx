import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Monitor,
  Play,
  Settings as SettingsIcon,
  ShieldAlert,
  Sliders,
  Trophy,
  Volume2,
  X,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { ThemeMode } from '../types/game';
import { soundEngine } from '../utils/audio';
import { ClientDownloadButton, PWACachePanel, PWAInstallButton } from './PWAComponents';
import { AchievementsApp } from './apps/AchievementsApp';

const SPLASH_QUOTES = [
  '别回头看窗户玻璃！',
  '已收录 40 个不同结局',
  '试试在浏览器访问 wiki',
  '应用商店上线：VS Code / 电波 / 监视器！',
  '凌晨 00:00 或 06:00 会发生什么？',
  '100% 理智才能看穿一切',
  '千万别随便接入视频面试',
  'youtube.com/watch?v=dQw4w9WgXcQ ?',
];

const LOADING_STEPS = [
  { pct: 18, text: '正在初始化本地虚拟桌面环境...' },
  { pct: 42, text: '正在挂载邮件客户端与浏览器组件...' },
  { pct: 68, text: '正在同步本地网络与系统时钟...' },
  { pct: 89, text: '检测到一处未正常关闭的后台句柄...' },
  { pct: 100, text: '系统准备就绪' },
];

const PROLOGUE_SCENES = [
  {
    time: '23:48',
    location: '出租屋窗边',
    line: '今年入冬后最浓的一场大雾正贴着玻璃蔓延。街灯的光晕被雾气撕扯成一团惨白，楼下连个行人影子都没有。',
  },
  {
    time: '23:49',
    location: '旧书桌',
    line: '房东下午刚发来最后通牒——明天中午前必须把拖欠的房租补齐。你翻遍了所有零钱和余额，依然差了一大截。',
  },
  {
    time: '23:50',
    location: '老式台式机',
    line: '你按下主机电源键。风扇嗡鸣着亮起蓝光，桌面的收件箱角落，却静静躺着一封你从未订阅过的“内部观测备忘录”。',
  },
  {
    time: '23:51',
    location: '屏幕微光',
    line: '“不管网上那些日结高薪的兼职写得有多诱人……千万别在没有任何防护的时候，让陌生网页看见你的脸。”',
  },
];

export const PreGameFlow: React.FC = () => {
  const {
    phase,
    system,
    unlockedEndings,
    totalRuns,
    startGameSequence,
    setBootPhase,
    updateSystem,
    factoryResetAll,
  } = useGame();

  const [splashIdx, setSplashIdx] = useState(() =>
    Math.floor(Math.random() * SPLASH_QUOTES.length)
  );
  const [titleModal, setTitleModal] = useState<'none' | 'achievements' | 'settings' | 'guide'>('none');
  const [confirmClear, setConfirmClear] = useState(false);

  // Loading state
  const [loadPct, setLoadPct] = useState(0);
  const [loadMsg, setLoadMsg] = useState(LOADING_STEPS[0].text);

  // 5-second Warning countdown
  const [warnSeconds, setWarnSeconds] = useState(5);

  // Prologue beat index
  const [sceneIdx, setSceneIdx] = useState(0);

  // Fake loading progression -> WARNING
  useEffect(() => {
    if (phase !== 'LOADING') return;
    setLoadPct(8);
    setLoadMsg(LOADING_STEPS[0].text);

    const timers: number[] = [];
    LOADING_STEPS.forEach((step, idx) => {
      const t = window.setTimeout(() => {
        setLoadPct(step.pct);
        setLoadMsg(step.text);
      }, (idx + 1) * 460);
      timers.push(t);
    });

    const doneTimer = window.setTimeout(() => {
      setBootPhase('WARNING');
    }, 2650);
    timers.push(doneTimer);

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [phase, setBootPhase]);

  // 5-second warning timer -> PROLOGUE
  useEffect(() => {
    if (phase !== 'WARNING') return;
    setWarnSeconds(5);

    const interval = window.setInterval(() => {
      setWarnSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const finishTimer = window.setTimeout(() => {
      setBootPhase('PROLOGUE');
    }, 5000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(finishTimer);
    };
  }, [phase, setBootPhase]);

  // Reset prologue scene on enter & allow Space/Enter advancement
  useEffect(() => {
    if (phase !== 'PROLOGUE') return;
    setSceneIdx(0);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'PROLOGUE') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        soundEngine.playClick();
        setSceneIdx((prev) => {
          if (prev + 1 >= PROLOGUE_SCENES.length) {
            setBootPhase('PLAYING');
            return prev;
          }
          return prev + 1;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, setBootPhase]);

  const advancePrologue = () => {
    soundEngine.playClick();
    if (sceneIdx + 1 >= PROLOGUE_SCENES.length) {
      setBootPhase('PLAYING');
    } else {
      setSceneIdx((prev) => prev + 1);
    }
  };

  if (phase === 'TITLE') {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-[#070b14] text-slate-100 flex flex-col justify-between select-none">
        {/* Drifting Midnight Panorama Backdrop */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.16),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(153,27,27,0.18),transparent_58%)]" />
          <motion.div
            animate={system.animations ? { x: [0, -60, 0] } : undefined}
            transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-y-0 -left-16 -right-16 opacity-35"
          >
            {/* Distant Midnight City Skyline Silhouette */}
            <svg viewBox="0 0 1600 600" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="skyFade" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f172a" stopOpacity="0" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
                </linearGradient>
              </defs>
              <rect x="40" y="250" width="90" height="350" fill="#0f172a" />
              <rect x="150" y="190" width="120" height="410" fill="#111827" />
              <rect x="295" y="280" width="85" height="320" fill="#0b1322" />
              <rect x="410" y="150" width="130" height="450" fill="#0f172a" />
              <rect x="570" y="230" width="105" height="370" fill="#111827" />
              <rect x="705" y="175" width="140" height="425" fill="#0b1322" />
              <rect x="880" y="260" width="95" height="340" fill="#0f172a" />
              <rect x="1005" y="160" width="135" height="440" fill="#111827" />
              <rect x="1170" y="240" width="110" height="360" fill="#0b1322" />
              <rect x="1310" y="200" width="130" height="400" fill="#0f172a" />
              <rect x="1465" y="265" width="100" height="335" fill="#111827" />
              {/* Faint lit apartment windows */}
              <rect x="180" y="230" width="14" height="18" fill="#fbbf24" fillOpacity="0.35" />
              <rect x="455" y="210" width="14" height="18" fill="#38bdf8" fillOpacity="0.45" />
              <rect x="745" y="255" width="16" height="20" fill="#f87171" fillOpacity="0.3" />
              <rect x="1045" y="220" width="14" height="18" fill="#fbbf24" fillOpacity="0.35" />
              <rect x="1350" y="275" width="14" height="18" fill="#38bdf8" fillOpacity="0.3" />
              <rect x="0" y="0" width="1600" height="600" fill="url(#skyFade)" />
            </svg>
          </motion.div>
          {system.crtEffect && <div className="crt-scanlines absolute inset-0" />}
        </div>

        {/* Top Spacer */}
        <div className="relative z-10 px-6 pt-5 flex items-center justify-between text-xs text-slate-400">
          <span>心理恐怖桌面解谜</span>
          <span className="font-mono-tabular">已收录 40 个多线结局</span>
        </div>

        {/* MC-Inspired Centered Title & Tactile Menu Stack */}
        <div className="relative z-10 flex flex-col items-center justify-center px-4">
          {/* Logo Lockup + Bouncing Diagonal Splash Text */}
          <div className="relative mb-10 text-center">
            <div className="inline-block px-8 py-4 rounded-xl border-2 border-slate-600/70 bg-slate-900/80 shadow-[0_10px_0_rgba(15,23,42,0.95),0_20px_50px_rgba(0,0,0,0.65)]">
              <h1 className="text-4xl sm:text-6xl font-black tracking-[0.18em] text-slate-100 drop-shadow-[0_4px_0_rgba(15,23,42,1)]">
                伪人入侵
              </h1>
            </div>

            {/* Tilted Pulsing Yellow Splash Text (MC homage) */}
            <motion.button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setSplashIdx((i) => (i + 1) % SPLASH_QUOTES.length);
              }}
              animate={system.animations ? { scale: [1, 1.07, 1] } : undefined}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              title="点击切换标语"
              className="mt-3 sm:mt-0 sm:absolute sm:-bottom-4 sm:-right-10 -rotate-6 text-xs sm:text-sm font-bold text-amber-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.95)] cursor-pointer whitespace-nowrap"
            >
              {SPLASH_QUOTES[splashIdx]}
            </motion.button>
          </div>

          {/* Stacked Classic Game Menu Buttons */}
          <div className="w-full max-w-sm space-y-3">
            <button
              type="button"
              onClick={startGameSequence}
              className="w-full py-3.5 px-6 rounded-lg bg-sky-600 hover:bg-sky-500 active:translate-y-0.5 text-white font-bold text-base tracking-wide border-t border-sky-300/40 border-b-4 border-sky-800 shadow-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>开始游戏</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setTitleModal('achievements');
                }}
                className="py-3 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 active:translate-y-0.5 text-slate-100 font-semibold text-sm border-t border-slate-600/60 border-b-4 border-slate-950 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
              >
                <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                <span>结局图鉴 ({unlockedEndings.length}/40)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setTitleModal('settings');
                }}
                className="py-3 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 active:translate-y-0.5 text-slate-100 font-semibold text-sm border-t border-slate-600/60 border-b-4 border-slate-950 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
              >
                <SettingsIcon className="w-4 h-4 text-slate-300 shrink-0" />
                <span>游戏设置</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setTitleModal('guide');
              }}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900/90 hover:bg-slate-800 active:translate-y-0.5 text-slate-300 font-medium text-sm border border-slate-700/80 border-b-4 border-b-slate-950 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>玩法与操作说明</span>
            </button>

            <div className="pt-1 flex flex-col gap-2">
              <ClientDownloadButton className="w-full" />
              <PWAInstallButton className="w-full" />
            </div>
          </div>
        </div>

        {/* Clean Footer */}
        <div className="relative z-10 px-6 pb-4 flex items-center justify-between text-xs text-slate-500">
          <span>伪人入侵 · 虚拟桌面心理恐怖</span>
          <span className="font-mono-tabular">累计探索周目：{totalRuns} 次</span>
        </div>

        {/* Title Sub-Modals */}
        <AnimatePresence>
          {titleModal !== 'none' && (
            <motion.div
              initial={system.animations ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              exit={system.animations ? { opacity: 0 } : undefined}
              transition={{ duration: 0.16 }}
              onClick={() => setTitleModal('none')}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={system.animations ? { opacity: 0, scale: 0.96, y: 10 } : false}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={system.animations ? { opacity: 0, scale: 0.96, y: 10 } : undefined}
                transition={{ duration: 0.16 }}
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-3xl max-h-[84vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
                  titleModal === 'achievements' && system.theme === 'light'
                    ? 'border-slate-300 bg-slate-50 text-slate-900'
                    : 'border-slate-700 bg-slate-900 text-slate-100'
                }`}
              >
                <div
                  className={`px-5 py-3.5 border-b flex items-center justify-between ${
                    titleModal === 'achievements' && system.theme === 'light'
                      ? 'border-slate-200'
                      : 'border-slate-800'
                  }`}
                >
                  <span className="text-sm font-bold flex items-center gap-2">
                    {titleModal === 'achievements' && (
                      <>
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span>结局图鉴</span>
                      </>
                    )}
                    {titleModal === 'settings' && (
                      <>
                        <Sliders className="w-4 h-4 text-sky-400" />
                        <span>游戏设置</span>
                      </>
                    )}
                    {titleModal === 'guide' && (
                      <>
                        <BookOpen className="w-4 h-4 text-emerald-400" />
                        <span>玩法与操作说明</span>
                      </>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTitleModal('none')}
                    className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {titleModal === 'achievements' && <AchievementsApp />}

                  {titleModal === 'settings' && (
                    <div className="p-6 space-y-5 text-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer">
                          <span className="font-medium flex items-center gap-2">
                            <Volume2 className="w-4 h-4 text-sky-400" />
                            <span>游戏音效</span>
                          </span>
                          <input
                            type="checkbox"
                            checked={system.sound}
                            onChange={(e) => updateSystem({ sound: e.target.checked })}
                            className="w-4 h-4 accent-sky-500 cursor-pointer"
                          />
                        </label>

                        <label className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer">
                          <span className="font-medium flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-amber-400" />
                            <span>CRT 扫描线滤镜</span>
                          </span>
                          <input
                            type="checkbox"
                            checked={system.crtEffect}
                            onChange={(e) => updateSystem({ crtEffect: e.target.checked })}
                            className="w-4 h-4 accent-sky-500 cursor-pointer"
                          />
                        </label>

                        <label className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer">
                          <span className="font-medium">画面动效与过渡</span>
                          <input
                            type="checkbox"
                            checked={system.animations}
                            onChange={(e) => updateSystem({ animations: e.target.checked })}
                            className="w-4 h-4 accent-sky-500 cursor-pointer"
                          />
                        </label>

                        <label className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer sm:col-span-2">
                          <div>
                            <div className="font-medium">光敏安全模式</div>
                            <div className="text-[11px] text-slate-400">
                              关闭屏幕高频闪烁、突脸惊吓与光标强制接管效果
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={system.photosensitiveSafe}
                            onChange={(e) => updateSystem({ photosensitiveSafe: e.target.checked })}
                            className="w-4 h-4 accent-sky-500 cursor-pointer shrink-0"
                          />
                        </label>

                        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span>主音量</span>
                            <span className="font-mono-tabular text-slate-400">{system.soundVolume}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={system.soundVolume}
                            onChange={(e) => updateSystem({ soundVolume: Number(e.target.value) })}
                            className="w-full accent-sky-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="font-medium">桌面预设主题</span>
                        <div className="flex gap-2">
                          {(['dark', 'light', 'horror'] as ThemeMode[]).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => updateSystem({ theme: mode })}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer border ${
                                system.theme === mode
                                  ? 'bg-sky-600 border-sky-400 text-white'
                                  : 'bg-slate-900 border-slate-700 text-slate-300'
                              }`}
                            >
                              {mode === 'dark' ? '深色' : mode === 'light' ? '浅色' : '血色'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <PWACachePanel />

                      <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-rose-300">重置本地存档</div>
                          <div className="text-xs text-slate-400">清空已解锁的 40 个结局与统计记录</div>
                        </div>
                        {!confirmClear ? (
                          <button
                            type="button"
                            onClick={() => setConfirmClear(true)}
                            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
                          >
                            清除档案
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                factoryResetAll();
                                setConfirmClear(false);
                              }}
                              className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
                            >
                              确认清除
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmClear(false)}
                              className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs cursor-pointer"
                            >
                              取消
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {titleModal === 'guide' && (
                    <div className="p-6 space-y-4 text-sm leading-relaxed text-slate-300">
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5">
                        <div className="font-bold text-slate-100">1. 虚拟桌面探索</div>
                        <p className="text-xs text-slate-400">
                          在模拟桌面中自由操作浏览器、邮件箱、记事本、安全中心、系统设置、诊断终端与家人群聊。所有窗口支持拖动、八向缩放、停靠吸附与右键多开。
                        </p>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5">
                        <div className="font-bold text-slate-100">2. 线索检索与观察 Wiki</div>
                        <p className="text-xs text-slate-400">
                          如果在探索中感到毫无头绪，可以在浏览器中访问「wiki」或点击常用书签，翻阅民间观察者留下的记录与异常应对传闻。
                        </p>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5">
                        <div className="font-bold text-slate-100">3. 应用商店、蓝牙与 40 种结局</div>
                        <p className="text-xs text-slate-400">
                          不同的防护开关组合、网络通断、系统时钟、应用商店装机工具与理智状态都会导向截然不同的结局。解锁过的结局会永久保存在图鉴中。
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (phase === 'LOADING') {
    return (
      <div className="w-screen h-screen bg-[#05070d] text-slate-100 flex flex-col items-center justify-center px-6 select-none">
        <motion.div
          initial={system.animations ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6 text-center"
        >
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-[0.2em] text-slate-100">伪人入侵</h2>
            <p className="text-xs text-slate-400">{loadMsg}</p>
          </div>

          <div className="space-y-2">
            <div className="w-full h-3.5 rounded bg-slate-900 border border-slate-700 overflow-hidden p-0.5">
              <div
                className="h-full bg-sky-500 rounded-sm transition-all duration-300 ease-out"
                style={{ width: `${loadPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono-tabular text-slate-400">
              <span>载入桌面资源</span>
              <span>{loadPct}%</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === 'WARNING') {
    return (
      <div className="w-screen h-screen bg-[#04050a] text-slate-100 flex flex-col items-center justify-center px-4 select-none">
        <motion.div
          initial={system.animations ? { opacity: 0, scale: 0.96 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg rounded-2xl border border-amber-500/40 bg-slate-900/95 p-7 shadow-2xl space-y-5"
        >
          <div className="flex items-center gap-3 text-amber-400">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wide text-slate-100">闪光与心理恐怖体验提醒</h2>
              <p className="text-xs text-amber-300/90">请在进入剧情前阅读以下注意事项</p>
            </div>
          </div>

          <div className="space-y-3 text-sm leading-relaxed text-slate-300 border-y border-slate-800 py-4">
            <p className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-1" />
              <span>
                本游戏包含<strong className="text-slate-100">屏幕高频闪烁、画面抖动、高对比色差与突发惊吓画面</strong>，光敏性癫痫或对闪光敏感的玩家请谨慎体验。
              </span>
            </p>
            <p className="flex items-start gap-2.5">
              <Volume2 className="w-4 h-4 text-sky-400 shrink-0 mt-1" />
              <span>
                剧情推进中可能出现骤然响起的提示音或恐怖音效，建议将音量调至舒适范围。
              </span>
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono-tabular text-slate-400">
              <span>将在倒计时结束后自动进入开场剧情</span>
              <span className="text-amber-400 font-bold text-sm">{warnSeconds} 秒</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
                className="h-full bg-amber-400"
              />
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const nextSafe = !system.photosensitiveSafe;
                  updateSystem({
                    photosensitiveSafe: nextSafe,
                    animations: !nextSafe,
                    crtEffect: !nextSafe,
                  });
                  soundEngine.playClick();
                }}
                className={`px-3.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                  system.photosensitiveSafe
                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                    : 'border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                }`}
              >
                {system.photosensitiveSafe
                  ? '已开启光敏安全模式（屏蔽闪烁与突脸惊吓）'
                  : '关闭闪烁与突脸（光敏友好）'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // phase === 'PROLOGUE'
  const scene = PROLOGUE_SCENES[sceneIdx];
  const isLastScene = sceneIdx + 1 >= PROLOGUE_SCENES.length;

  return (
    <div
      onClick={advancePrologue}
      className="relative w-screen h-screen bg-[#04060b] text-slate-100 flex flex-col justify-between p-6 sm:p-10 cursor-pointer select-none overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08),transparent_65%)]"
      />
      {system.crtEffect && (
        <div aria-hidden="true" className="pointer-events-none crt-scanlines absolute inset-0" />
      )}

      {/* Top Controls */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="text-xs font-mono-tabular text-slate-400">
          序章 · {sceneIdx + 1} / {PROLOGUE_SCENES.length}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            soundEngine.playClick();
            setBootPhase('PLAYING');
          }}
          className="px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-xs text-slate-300 cursor-pointer"
        >
          跳过剧情
        </button>
      </div>

      {/* Narrative Center Stage */}
      <div className="relative z-10 max-w-2xl mx-auto w-full my-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={sceneIdx}
            initial={system.animations ? { opacity: 0, y: 12 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={system.animations ? { opacity: 0, y: -8 } : undefined}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-7 sm:p-9 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2 text-xs font-mono-tabular text-sky-400">
              <span>{scene.time}</span>
              <span aria-hidden="true">·</span>
              <span>{scene.location}</span>
            </div>
            <p className="text-base sm:text-lg leading-loose text-slate-100 font-normal">
              {scene.line}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Prompt */}
      <div className="relative z-10 flex items-center justify-between max-w-2xl mx-auto w-full text-xs text-slate-400">
        <span>点击屏幕或按空格键继续</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            advancePrologue();
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold cursor-pointer"
        >
          <span>{isLastScene ? '进入桌面' : '继续'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
