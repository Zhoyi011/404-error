import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, Camera, ChevronRight, Eye, ShieldAlert, X } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { CATEGORY_LABELS } from '../data/endings';
import {
  adaptCopyForMobile,
  getEndingDefinition,
  getEndingStoryBeats,
} from '../utils/mobileAdaptation';
import { soundEngine } from '../utils/audio';

export const Overlays: React.FC = () => {
  const isMobile = useIsMobile();
  const {
    phase,
    system,
    currentEndingId,
    cameraModalOpen,
    cameraDenyCount,
    activeAnomaly,
    toasts,
    unlockedEndings,
    handleCameraAllow,
    handleCameraDeny,
    closeCameraModal,
    resolveAnomaly,
    dismissToast,
    completeEndingStory,
    resetRun,
    returnToTitle,
    openApp,
  } = useGame();

  const [storyIdx, setStoryIdx] = useState(0);
  const [crashProgress, setCrashProgress] = useState(0);
  const [crashStageTick, setCrashStageTick] = useState(0);

  const endingDef = currentEndingId ? getEndingDefinition(currentEndingId, isMobile) : null;
  const storyBeats = currentEndingId ? getEndingStoryBeats(currentEndingId, isMobile) : [];
  const dur = system.animations ? 0.18 : 0;
  const isTerminated =
    phase === 'ENDED' ||
    phase === 'ENDING_STORY' ||
    phase === 'CRASH_SEQUENCE' ||
    phase === 'JUMPSCARE';

  useEffect(() => {
    if (phase === 'ENDING_STORY') {
      setStoryIdx(0);
    }
  }, [phase, currentEndingId]);

  useEffect(() => {
    if (phase !== 'CRASH_SEQUENCE') {
      setCrashProgress(0);
      setCrashStageTick(0);
      return;
    }
    const start = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / 4750) * 100));
      setCrashProgress(pct);
      setCrashStageTick(elapsed);
    }, 80);
    return () => window.clearInterval(interval);
  }, [phase]);

  const advanceEndingStory = () => {
    soundEngine.playClick();
    if (storyIdx + 1 >= storyBeats.length) {
      completeEndingStory();
    } else {
      setStoryIdx((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (phase !== 'ENDING_STORY') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        soundEngine.playClick();
        setStoryIdx((prev) => {
          if (prev + 1 >= storyBeats.length) {
            completeEndingStory();
            return prev;
          }
          return prev + 1;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, storyBeats.length, completeEndingStory]);

  const cameraPromptText =
    cameraDenyCount === 0
      ? '“伪人识别测试员”职位要求接入本地摄像头进行生物面容比对。'
      : cameraDenyCount === 1
        ? '验证服务仍在等待（已拒绝 1/3 次）。你拒绝之后，网页背景里的阴影似乎往前移动了一步。'
        : cameraDenyCount === 2
          ? isMobile
            ? '已拒绝 2/3 次。手机前置摄像头旁的指示灯突然自己闪烁起来……'
            : '已拒绝 2/3 次。电脑摄像头旁的指示灯突然自己闪烁起来……'
          : '已拒绝 3 次。镜头背后有什么东西正屏住呼吸盯着你……';

  const currentBeat = storyBeats[storyIdx] ?? storyBeats[0];
  const isLastBeat = storyIdx + 1 >= storyBeats.length;

  const beatGlowClass =
    currentBeat?.tone === 'horror'
      ? 'bg-[radial-gradient(circle_at_center,rgba(225,29,72,0.16),transparent_65%)]'
      : currentBeat?.tone === 'warm'
        ? 'bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.13),transparent_65%)]'
        : currentBeat?.tone === 'glitch'
          ? 'bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12),transparent_65%)]'
          : 'bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.09),transparent_65%)]';

  const beatBorderClass =
    currentBeat?.tone === 'horror'
      ? 'border-rose-500/40'
      : currentBeat?.tone === 'warm'
        ? 'border-amber-500/35'
        : currentBeat?.tone === 'glitch'
          ? 'border-emerald-500/35'
          : 'border-slate-800';

  return (
    <>
      {/* Top-center Toast Stack */}
      <div className="fixed top-12 md:top-4 left-1/2 -translate-x-1/2 z-[9500] flex flex-col items-center gap-2 pointer-events-none w-full max-w-md px-4">
        <AnimatePresence>
          {toasts.map((t) => {
            const borderClass =
              t.type === 'error'
                ? 'border-rose-500/70 bg-rose-950/92 text-rose-100'
                : t.type === 'warning'
                  ? 'border-amber-500/70 bg-amber-950/92 text-amber-100'
                  : t.type === 'success'
                    ? 'border-emerald-500/70 bg-emerald-950/92 text-emerald-100'
                    : 'border-sky-500/60 bg-slate-900/92 text-slate-100';

            return (
              <motion.div
                key={t.id}
                initial={system.animations ? { opacity: 0, y: -14, scale: 0.96 } : false}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={system.animations ? { opacity: 0, y: -12, scale: 0.96 } : undefined}
                transition={{ duration: dur, ease: [0.16, 1, 0.3, 1] }}
                className={`pointer-events-auto w-full rounded-xl border px-3.5 py-2.5 shadow-xl backdrop-blur-md flex items-center justify-between gap-3 text-xs ${borderClass}`}
              >
                <span className="leading-snug">{t.message}</span>
                <button
                  type="button"
                  onClick={() => dismissToast(t.id)}
                  className="opacity-70 hover:opacity-100 cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Desktop Anomaly Alert */}
      <AnimatePresence>
        {activeAnomaly && !isTerminated && (
          <motion.div
            initial={system.animations ? { opacity: 0, x: 24, scale: 0.96 } : false}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={system.animations ? { opacity: 0, x: 24, scale: 0.96 } : undefined}
            transition={{ duration: dur, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-28 md:bottom-16 right-3 md:right-4 z-[9000] w-80 max-w-[calc(100vw-24px)] rounded-xl border border-rose-500/60 bg-slate-950/95 text-slate-100 p-4 shadow-2xl backdrop-blur-xl space-y-2.5"
          >
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>系统安全拦截提醒 · {adaptCopyForMobile(activeAnomaly.title, isMobile)}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {adaptCopyForMobile(activeAnomaly.detail, isMobile)}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => resolveAnomaly('block')}
                className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
              >
                立即拦截
              </button>
              <button
                type="button"
                onClick={() => resolveAnomaly('ignore')}
                className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
              >
                忽略
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fake Camera Permission Modal */}
      <AnimatePresence>
        {cameraModalOpen && !isTerminated && (
          <motion.div
            initial={system.animations ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={system.animations ? { opacity: 0 } : undefined}
            transition={{ duration: dur }}
            className="fixed inset-0 z-[9950] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={system.animations ? { opacity: 0, scale: 0.94 } : false}
              animate={{ opacity: 1, scale: 1 }}
              exit={system.animations ? { opacity: 0, scale: 0.94 } : undefined}
              transition={{ duration: dur, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md rounded-2xl border border-rose-500/60 bg-slate-900 text-slate-100 overflow-hidden shadow-2xl"
            >
              <div className="px-5 py-3.5 bg-rose-950/70 border-b border-rose-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-rose-200">
                  <Camera className="w-4 h-4" />
                  <span>设备摄像头权限请求</span>
                </div>
                <button
                  type="button"
                  onClick={closeCameraModal}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-center">
                <p className="text-xs text-slate-300 leading-relaxed">{cameraPromptText}</p>

                <div className="relative h-44 rounded-xl bg-black border border-slate-800 overflow-hidden flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-b from-rose-500/10 via-transparent to-rose-500/15 pointer-events-none" />
                  <div className="absolute inset-x-0 h-8 bg-rose-500/15 animate-scan-beam pointer-events-none" />
                  <Eye className={`w-10 h-10 mb-2 ${cameraDenyCount >= 3 ? 'text-rose-500' : 'text-slate-400'}`} />
                  <span className="text-xs font-mono-tabular text-rose-300">
                    {cameraDenyCount >= 3 ? '信号就绪：它正在看着你' : '等待视频流授权...'}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCameraAllow}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    允许访问
                  </button>
                  <button
                    type="button"
                    onClick={handleCameraDeny}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    拒绝 ({cameraDenyCount}/3)
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5-Second Crash Overlay: Desktop BSOD :(  / Mobile Shutdown -> Reboot */}
      <AnimatePresence>
        {phase === 'CRASH_SEQUENCE' && (
          isMobile ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[9996] bg-black text-white flex flex-col items-center justify-center p-8 select-none"
            >
              {crashStageTick < 1700 ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 rounded-full border-2 border-white/25 border-t-white animate-spin" />
                  <div className="text-xs font-mono-tabular text-slate-300 tracking-wide">
                    内存溢出 · iPhone 正在强制关机…
                  </div>
                </div>
              ) : crashStageTick < 2350 ? (
                <div className="w-full h-full bg-black" />
              ) : (
                <div className="flex flex-col items-center gap-6 w-full max-w-xs">
                  <div className="w-16 h-16 rounded-2xl border border-white/15 bg-white/[0.04] flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.12)]">
                    <span className="text-2xl font-black tracking-tighter text-white">iOS</span>
                  </div>
                  <div className="w-48 h-1 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-100"
                      style={{
                        width: `${Math.min(100, Math.max(4, Math.round(((crashStageTick - 2350) / 2500) * 100)))}%`,
                      }}
                    />
                  </div>
                  <div className="text-[11px] font-mono-tabular text-slate-400 text-center">
                    {crashStageTick > 4100
                      ? '0x000000 守护进程已随缓存清空'
                      : '内存重建与系统重启中…'}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={`fixed inset-0 z-[9996] bg-[#0078d7] text-white flex items-center justify-center p-8 sm:p-16 select-none ${
                crashStageTick > 3600 && !system.photosensitiveSafe ? 'animate-glitch' : ''
              }`}
            >
              <div className="max-w-3xl w-full space-y-6">
                <div className="text-7xl sm:text-8xl font-light leading-none tracking-tight">:(</div>
                <h2 className="text-xl sm:text-2xl font-normal leading-relaxed">
                  你的老式电脑遇到内存严重溢出问题，需要重新启动。
                  <br />
                  我们只收集某些错误信息，然后为你重新启动。
                </h2>
                <div className="text-xl sm:text-2xl font-mono-tabular font-light">
                  {crashProgress}% 完成
                </div>

                <div className="flex items-start gap-4 pt-2">
                  <div className="w-20 h-20 bg-white p-1.5 shrink-0 grid grid-cols-5 grid-rows-5 gap-0.5">
                    {[
                      1, 1, 1, 0, 1,
                      1, 0, 1, 1, 0,
                      1, 1, 0, 1, 1,
                      0, 1, 1, 0, 1,
                      1, 0, 1, 1, 1,
                    ].map((cell, i) => (
                      <div key={i} className={cell ? 'bg-[#0078d7]' : 'bg-white'} />
                    ))}
                  </div>
                  <div className="text-xs sm:text-sm space-y-1.5 text-white/90 font-mono-tabular">
                    <div>有关此问题的详细信息和可能的解决方法，请检查系统物理内存 (4.00 GB LIMIT)。</div>
                    <div>如果致电支持人员，请向他们提供以下信息：</div>
                    <div className="font-semibold">
                      终止代码: CRITICAL_MEMORY_EXHAUSTION (0x0000001A)
                    </div>
                    <div className="text-white/80">
                      失败的操作: multi_app_pool.sys &amp; doppelganger_daemon.exe
                    </div>
                    {crashStageTick > 3400 && (
                      <div className="pt-1 text-amber-200 font-semibold">
                        [内核转储] 0x000000 线程因交换页耗尽已被强制挤出……
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>

      {/* Jumpscare Overlay */}
      <AnimatePresence>
        {phase === 'JUMPSCARE' && (
          <motion.div
            initial={{ opacity: 0, scale: system.photosensitiveSafe ? 1 : 1.15 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className={`fixed inset-0 z-[9995] bg-black flex flex-col items-center justify-center p-6 ${
              system.photosensitiveSafe ? '' : 'animate-jumpscare'
            }`}
          >
            <Eye className="w-24 h-24 text-rose-500 mb-6" />
            <div className="text-3xl sm:text-5xl font-bold tracking-widest text-rose-500 text-center">
              身 份 覆 写 完 成
            </div>
            <p className="text-sm text-slate-200 mt-4 tracking-wider">
              现在，屏幕前的那个人……是我了
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tailored Ending Epilogue Story Stage (Before Ending Reveal Card) */}
      <AnimatePresence>
        {phase === 'ENDING_STORY' && endingDef && currentBeat && (
          <motion.div
            initial={system.animations ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={system.animations ? { opacity: 0 } : undefined}
            transition={{ duration: dur }}
            onClick={advanceEndingStory}
            className="fixed inset-0 z-[9998] bg-[#04060b] text-slate-100 flex flex-col justify-between p-6 sm:p-10 cursor-pointer select-none overflow-hidden"
          >
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 ${beatGlowClass}`}
            />

            {/* Top Controls */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="text-xs font-mono-tabular text-slate-400">
                终章 · {storyIdx + 1} / {storyBeats.length}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundEngine.playClick();
                  completeEndingStory();
                }}
                className="px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900/85 hover:bg-slate-800 text-xs text-slate-300 cursor-pointer"
              >
                跳过剧情
              </button>
            </div>

            {/* Narrative Center Card */}
            <div className="relative z-10 max-w-2xl mx-auto w-full my-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentEndingId}-${storyIdx}`}
                  initial={system.animations ? { opacity: 0, y: 12 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={system.animations ? { opacity: 0, y: -8 } : undefined}
                  transition={{ duration: system.animations ? 0.24 : 0, ease: [0.16, 1, 0.3, 1] }}
                  className={`rounded-2xl border bg-slate-900/85 backdrop-blur-md p-6 sm:p-9 shadow-2xl space-y-4 ${beatBorderClass}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div
                      className={`flex items-center gap-2 text-xs font-mono-tabular ${
                        currentBeat.tone === 'horror'
                          ? 'text-rose-400'
                          : currentBeat.tone === 'warm'
                            ? 'text-amber-300'
                            : currentBeat.tone === 'glitch'
                              ? 'text-emerald-400'
                              : 'text-sky-400'
                      }`}
                    >
                      <span>{currentBeat.time}</span>
                      <span aria-hidden="true">·</span>
                      <span>{currentBeat.scene}</span>
                    </div>

                    {currentBeat.speaker && (
                      <span className="px-2.5 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/35 text-[11px] font-mono-tabular font-semibold text-rose-300">
                        {currentBeat.speaker}
                      </span>
                    )}
                  </div>

                  <p className="text-base sm:text-lg leading-loose text-slate-100 font-normal">
                    {currentBeat.line}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Prompt */}
            <div className="relative z-10 flex items-center justify-between max-w-2xl mx-auto w-full text-xs text-slate-400">
              <span>{isMobile ? '点击屏幕继续' : '点击屏幕或按空格键继续'}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  advanceEndingStory();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold cursor-pointer"
              >
                <span>{isLastBeat ? '查看结局归档' : '继续'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ending Reveal Modal (Always topmost z-9999) */}
      <AnimatePresence>
        {phase === 'ENDED' && endingDef && (
          <motion.div
            initial={system.animations ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={system.animations ? { opacity: 0 } : undefined}
            transition={{ duration: dur }}
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={system.animations ? { opacity: 0, scale: 0.92, y: 16 } : false}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: system.animations ? 0.24 : 0, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 p-7 shadow-2xl space-y-5 text-center"
            >
              <div className="text-xs font-semibold tracking-wide text-amber-400 font-mono-tabular">
                {CATEGORY_LABELS[endingDef.category]} · 结局 #{endingDef.id.toString().padStart(2, '0')} · 图鉴 {unlockedEndings.length}/50
              </div>

              <div className="text-4xl">{endingDef.icon}</div>

              <h2 className="text-2xl font-bold tracking-tight">{endingDef.name}</h2>

              <p className="text-sm text-slate-300 leading-relaxed">{endingDef.desc}</p>

              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2 text-left">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>触发条件：{endingDef.condition}</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={resetRun}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold cursor-pointer"
                >
                  重新开始新一局
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetRun();
                    openApp('achievements');
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-sm font-medium cursor-pointer"
                >
                  重开并查看图鉴
                </button>
                <button
                  type="button"
                  onClick={returnToTitle}
                  className="py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 text-sm font-medium cursor-pointer whitespace-nowrap"
                >
                  主菜单
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
