import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Briefcase,
  Code2,
  Compass,
  Download,
  ExternalLink,
  Eye,
  Globe,
  History,
  Home,
  Lock,
  Play,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  WifiOff,
  X,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { JOB_LISTINGS, SEARCH_CATALOG, WIKI_SECTIONS } from '../../data/worldData';
import { WindowInstance } from '../../types/game';
import { soundEngine } from '../../utils/audio';

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export const BrowserApp: React.FC<{ instance: WindowInstance }> = ({ instance }) => {
  const isMobile = useIsMobile();
  const {
    phase,
    isOnline,
    sanity,
    privacy,
    clockTime,
    discoveredLore,
    cameraScanResult,
    system,
    bookmarks,
    downloads,
    unlockedEndings,
    systemMetrics,
    openApp,
    addBrowserTab,
    switchBrowserTab,
    closeBrowserTab,
    toggleBookmark,
    downloadDriverPatch,
    executeDownloadItem,
    navigateBrowser,
    browserBack,
    browserForward,
    performBrowserSearch,
    openSearchArticle,
    selectWikiSection,
    applyForJob,
    escalateToInvasion,
    performRitual,
    executeCodeTruth,
    publishSurvivalGuide,
    triggerRickrollEnding,
    triggerOmegaEnding,
    toggleNetwork,
    triggerJumpscareEnding,
  } = useGame();

  const bs = instance.browserState ?? {
    tab: 'home' as const,
    query: '',
    selectedJobId: null,
    activeArticleId: null,
    activeWikiId: WIKI_SECTIONS[0].id,
    history: [
      {
        tab: 'home' as const,
        query: '',
        selectedJobId: null,
        activeArticleId: null,
        activeWikiId: WIKI_SECTIONS[0].id,
      },
    ],
    historyIndex: 0,
    tabs: [
      {
        tabId: 'fallback-tab',
        title: '新标签页',
        tab: 'home' as const,
        query: '',
        selectedJobId: null,
        activeArticleId: null,
        activeWikiId: WIKI_SECTIONS[0].id,
        history: [
          {
            tab: 'home' as const,
            query: '',
            selectedJobId: null,
            activeArticleId: null,
            activeWikiId: WIKI_SECTIONS[0].id,
          },
        ],
        historyIndex: 0,
      },
    ],
    activeTabId: 'fallback-tab',
  };

  const [inputVal, setInputVal] = useState(bs.query);
  const [ritualSigils, setRitualSigils] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [drawer, setDrawer] = useState<'none' | 'bookmarks' | 'downloads' | 'history' | 'source'>('none');
  const [pageLoading, setPageLoading] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  // Rickroll MV horror cutscene & MP4 video player state
  type RickStage = 'story_1' | 'story_2' | 'hijack_move' | 'hijack_click' | 'jumpscare' | 'playing';
  const rickVideoRef = useRef<HTMLVideoElement | null>(null);
  const rickPlayBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number }>({
    x: typeof window !== 'undefined' ? Math.round(window.innerWidth * (isMobile ? 0.72 : 0.42)) : 420,
    y: typeof window !== 'undefined' ? Math.round(window.innerHeight * (isMobile ? 0.7 : 0.36)) : 280,
  });
  const [rickStage, setRickStage] = useState<RickStage>(() =>
    system.photosensitiveSafe ? 'playing' : 'story_1'
  );
  const rickStageRef = useRef<RickStage>(rickStage);
  rickStageRef.current = rickStage;
  const isRickTabRef = useRef(false);
  isRickTabRef.current = bs.tab === 'rickroll';
  const primingMediaRef = useRef(false);
  const [rickMediaUnlocked, setRickMediaUnlocked] = useState(false);
  const [rickReplayNonce, setRickReplayNonce] = useState(0);
  const [hijackCursorPos, setHijackCursorPos] = useState<{ x: number; y: number }>(() => ({
    x: typeof window !== 'undefined' ? Math.round(window.innerWidth * (isMobile ? 0.72 : 0.42)) : 420,
    y: typeof window !== 'undefined' ? Math.round(window.innerHeight * (isMobile ? 0.7 : 0.36)) : 280,
  }));
  const [rickVideoKey, setRickVideoKey] = useState(0);
  const [rickVideoError, setRickVideoError] = useState(false);
  const [rickErrorDetail, setRickErrorDetail] = useState('');
  const [rickAutoplayBlocked, setRickAutoplayBlocked] = useState(false);

  const isRickrollTarget = (raw: string) => {
    const trimmed = raw.trim().toLowerCase();
    return (
      trimmed.includes('dqw4w9wgxcq') ||
      ((trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) &&
        trimmed.includes('rickroll'))
    );
  };

  // Unlock iOS Safari media playback synchronously inside user tap without playing early
  const primeRickrollMedia = () => {
    setRickMediaUnlocked(true);
    const el = rickVideoRef.current;
    if (!el) return;
    primingMediaRef.current = true;
    try {
      el.preload = 'auto';
      el.muted = !system.sound;
      el.volume = Math.max(0, Math.min(1, system.soundVolume / 100));
      const playPromise = el.play();
      // Immediately pause synchronously so zero frames/audio escape while WebKit registers user activation
      el.pause();
      el.currentTime = 0;
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            if (primingMediaRef.current || !isRickTabRef.current || rickStageRef.current !== 'playing') {
              el.pause();
              el.currentTime = 0;
            }
          })
          .catch(() => {
            // Expected AbortError when synchronously paused during silent iOS gesture unlock
          })
          .finally(() => {
            primingMediaRef.current = false;
          });
      } else {
        primingMediaRef.current = false;
      }
    } catch {
      primingMediaRef.current = false;
    }
  };

  const navigateOrSearch = (query: string) => {
    if (isRickrollTarget(query)) {
      primeRickrollMedia();
    }
    performBrowserSearch(instance.instanceId, query);
  };

  const openArticle = (articleId: string) => {
    if (articleId === 'art_rickroll') {
      primeRickrollMedia();
    }
    openSearchArticle(instance.instanceId, articleId);
  };

  const getUrlText = () => {
    if (!isOnline && bs.tab !== 'omega' && bs.tab !== 'void_404') return 'about:offline';
    switch (bs.tab) {
      case 'wiki':
        return 'https://wiki.deepnet.local';
      case 'search_results':
        return `https://deepnet.search/query?q=${encodeURIComponent(bs.query)}`;
      case 'jobs':
        return 'https://pseudo-jobs.dark/listings';
      case 'job_detail':
        return `https://pseudo-jobs.dark/position/${bs.selectedJobId ?? 1}`;
      case 'apply_result':
        return 'https://pseudo-jobs.dark/handshake-active';
      case 'ritual':
        return 'https://archive.void/exorcism-codex';
      case 'code_truth':
        return 'internal://world-engine/source.ts';
      case 'lore_article':
        return activeArticle?.url ?? 'https://wiki.deepnet.local/archive';
      case 'invasion':
        return 'alert://0x000000-system-lockdown';
      case 'live_web':
        return bs.liveUrl ?? bs.query;
      case 'rickroll':
        return 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      case 'void_404':
        return bs.query || '404.void';
      case 'omega':
        return 'internal://omega';
      default:
        return '';
    }
  };

  const selectedJob = JOB_LISTINGS.find((j) => j.id === bs.selectedJobId) || null;
  const activeArticle = SEARCH_CATALOG.find((a) => a.id === bs.activeArticleId) || null;
  const activeWiki = WIKI_SECTIONS.find((w) => w.id === bs.activeWikiId) || WIKI_SECTIONS[0];
  const currentUrl = getUrlText();
  const isBookmarked = Boolean(currentUrl && bookmarks.some((b) => b.url === currentUrl));

  useEffect(() => {
    setInputVal(bs.tab === 'home' ? '' : currentUrl || bs.query);
  }, [bs.tab, bs.query, currentUrl]);

  // Simulated browser page navigation / network load delay
  useEffect(() => {
    // Rickroll MV skips generic loading bar so it enters the horror mini-story directly
    if (bs.tab === 'home' || bs.tab === 'rickroll') {
      setPageLoading(false);
      return;
    }
    setPageLoading(true);
    const delay = system.animations ? 360 : 100;
    const t = window.setTimeout(() => setPageLoading(false), delay);
    return () => window.clearTimeout(t);
  }, [
    bs.activeTabId,
    bs.tab,
    bs.query,
    bs.selectedJobId,
    bs.activeArticleId,
    bs.liveUrl,
    refreshNonce,
    system.animations,
  ]);

  // Track latest real pointer / touch position so hijacked cursor or ghost touch starts seamlessly from there
  useEffect(() => {
    const updatePointer = (e: PointerEvent) => {
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('pointermove', updatePointer, { passive: true });
    window.addEventListener('pointerdown', updatePointer, { passive: true });
    return () => {
      window.removeEventListener('pointermove', updatePointer);
      window.removeEventListener('pointerdown', updatePointer);
    };
  }, []);

  // Rickroll MV horror mini-story -> autonomous cursor / mobile ghost touch hijack -> jumpscare sequence
  useEffect(() => {
    const isRickActive =
      bs.tab === 'rickroll' && !instance.isMinimized && isOnline && phase === 'PLAYING';

    if (!isRickActive) {
      rickVideoRef.current?.pause();
      const resetStage: RickStage = system.photosensitiveSafe ? 'playing' : 'story_1';
      rickStageRef.current = resetStage;
      setRickStage(resetStage);
      return;
    }

    if (system.photosensitiveSafe) {
      rickStageRef.current = 'playing';
      setRickStage('playing');
      return;
    }

    setRickVideoError(false);
    setRickErrorDetail('');
    setRickAutoplayBlocked(false);

    const startPos = { ...lastPointerRef.current };
    setHijackCursorPos(startPos);
    rickStageRef.current = 'story_1';
    setRickStage('story_1');

    const timers: number[] = [];
    let rafId = 0;

    // Beat 2: Cursor / Ghost touch spot appears and trembles on its own
    timers.push(
      window.setTimeout(() => {
        rickStageRef.current = 'story_2';
        setRickStage('story_2');
        soundEngine.playNotification();
        if (isMobile && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          try {
            navigator.vibrate([25, 45, 25]);
          } catch {
            // ignore unsupported vibration
          }
        }
        const tremorStart = performance.now();
        const runTremor = (now: number) => {
          const elapsed = now - tremorStart;
          if (elapsed > 1350) return;
          const jitterX = (Math.random() - 0.5) * 14;
          const jitterY = (Math.random() - 0.5) * 14;
          setHijackCursorPos({
            x: Math.max(20, Math.min(window.innerWidth - 24, startPos.x + jitterX)),
            y: Math.max(20, Math.min(window.innerHeight - 24, startPos.y + jitterY)),
          });
          rafId = window.requestAnimationFrame(runTremor);
        };
        rafId = window.requestAnimationFrame(runTremor);
      }, 1400)
    );

    // Beat 3: Hijacked pointer / ghost touch glides smoothly onto the video Play button
    timers.push(
      window.setTimeout(() => {
        if (rafId) window.cancelAnimationFrame(rafId);
        rickStageRef.current = 'hijack_move';
        setRickStage('hijack_move');
        soundEngine.playError();

        const rect = rickPlayBtnRef.current?.getBoundingClientRect();
        const targetX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
        const targetY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
        const fromX = startPos.x;
        const fromY = startPos.y;
        const moveStart = performance.now();
        const duration = 1420;

        const animateMove = (now: number) => {
          const t = Math.min(1, (now - moveStart) / duration);
          const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          const wobble = (1 - t) * Math.sin(t * Math.PI * 6) * 8;
          setHijackCursorPos({
            x: fromX + (targetX - fromX) * eased + wobble,
            y: fromY + (targetY - fromY) * eased - wobble * 0.6,
          });
          if (t < 1) {
            rafId = window.requestAnimationFrame(animateMove);
          } else {
            setHijackCursorPos({ x: targetX, y: targetY });
          }
        };
        rafId = window.requestAnimationFrame(animateMove);
      }, 2800)
    );

    // Beat 4: Autonomous click / ghost tap on Play
    timers.push(
      window.setTimeout(() => {
        if (rafId) window.cancelAnimationFrame(rafId);
        const rect = rickPlayBtnRef.current?.getBoundingClientRect();
        if (rect) {
          setHijackCursorPos({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          });
        }
        rickStageRef.current = 'hijack_click';
        setRickStage('hijack_click');
        soundEngine.playClick();
        if (isMobile && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          try {
            navigator.vibrate(45);
          } catch {
            // ignore
          }
        }
      }, 4300)
    );

    // Beat 5: Fullscreen 突脸 Rickroll shock
    timers.push(
      window.setTimeout(() => {
        rickStageRef.current = 'jumpscare';
        setRickStage('jumpscare');
        soundEngine.playJumpscare();
        if (isMobile && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          try {
            navigator.vibrate([80, 40, 120]);
          } catch {
            // ignore
          }
        }
      }, 4650)
    );

    // Beat 6: Release hijack & play pre-authorized MP4
    timers.push(
      window.setTimeout(() => {
        rickStageRef.current = 'playing';
        setRickStage('playing');
      }, 5450)
    );

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [
    bs.tab,
    bs.activeTabId,
    instance.isMinimized,
    isOnline,
    system.photosensitiveSafe,
    rickReplayNonce,
    phase,
    isMobile,
  ]);

  // Sync system sound & volume into Rickroll <video>
  useEffect(() => {
    const el = rickVideoRef.current;
    if (!el) return;
    el.volume = Math.max(0, Math.min(1, system.soundVolume / 100));
    el.muted = !system.sound;
  }, [system.sound, system.soundVolume, bs.tab, rickVideoKey, rickStage]);

  // Reset error state whenever entering the Rickroll tab
  useEffect(() => {
    if (bs.tab === 'rickroll') {
      setRickVideoError(false);
      setRickErrorDetail('');
      setRickAutoplayBlocked(false);
    }
  }, [bs.tab]);

  // Attempt autoplay when Rickroll cutscene finishes; pause if minimized
  useEffect(() => {
    const el = rickVideoRef.current;
    if (bs.tab !== 'rickroll' || rickStage !== 'playing') return;
    if (instance.isMinimized) {
      el?.pause();
      return;
    }
    if (rickVideoError || !el) return;
    el.preload = 'auto';
    el.volume = Math.max(0, Math.min(1, system.soundVolume / 100));
    el.muted = !system.sound;
    const playPromise = el.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise
        .then(() => {
          setRickAutoplayBlocked(false);
        })
        .catch(() => {
          setRickAutoplayBlocked(true);
        });
    }
  }, [bs.tab, rickStage, rickVideoKey, rickVideoError, instance.isMinimized]);

  const isLight = system.theme === 'light';
  const surfaceCard = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-800/70 border-slate-700/80 text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDrawer('none');
    navigateOrSearch(inputVal);
  };

  const defensesReady = privacy.firewallEnabled && privacy.antivirusEnabled && privacy.dnsEnabled;
  const sigilsCompleted = ritualSigils.every(Boolean);

  const searchMatches = useMemo(() => {
    const lower = bs.query.trim().toLowerCase();
    if (!lower) return SEARCH_CATALOG;
    return SEARCH_CATALOG.filter(
      (art) =>
        art.title.toLowerCase().includes(lower) ||
        art.summary.toLowerCase().includes(lower) ||
        art.category.toLowerCase().includes(lower) ||
        art.keywords.some((kw) => lower.includes(kw.toLowerCase()) || kw.toLowerCase().includes(lower))
    );
  }, [bs.query]);

  const toggleSigil = (index: 0 | 1 | 2) => {
    setRitualSigils((prev) => {
      const next: [boolean, boolean, boolean] = [...prev] as [boolean, boolean, boolean];
      next[index] = !next[index];
      if (next[index]) soundEngine.playRitualChime(index);
      else soundEngine.playClick();
      return next;
    });
  };

  const activeSubTab = bs.tabs.find((t) => t.tabId === bs.activeTabId) ?? bs.tabs[0];
  const canGoBack = bs.historyIndex > 0;
  const canGoForward = bs.historyIndex < bs.history.length - 1;
  const liveDomain = bs.liveUrl ? getHostname(bs.liveUrl) : '';

  const tabStripNode = (
    <div
      className={`px-1.5 pt-1 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 ${
        isLight ? 'bg-slate-200/80 border-b border-slate-300' : 'bg-slate-950 border-b border-slate-800/90'
      }`}
    >
      {bs.tabs.map((t) => {
        const active = t.tabId === bs.activeTabId;
        return (
          <div
            key={t.tabId}
            className={`group flex items-center gap-1 px-2 py-0.5 h-6 rounded-t-md text-[11px] max-w-[140px] shrink-0 transition-colors ${
              active
                ? isLight
                  ? 'bg-slate-100 text-slate-900 font-semibold border-t border-x border-slate-300'
                  : 'bg-slate-900 text-slate-100 font-semibold border-t border-x border-slate-700'
                : isLight
                  ? 'text-slate-600 hover:bg-slate-300/60'
                  : 'text-slate-400 hover:bg-slate-900/50'
            }`}
          >
            <button
              type="button"
              onClick={() => switchBrowserTab(instance.instanceId, t.tabId)}
              className="truncate text-left flex-1 cursor-pointer"
              title={t.title}
            >
              {t.title}
            </button>
            <button
              type="button"
              onClick={() => closeBrowserTab(instance.instanceId, t.tabId)}
              aria-label="关闭标签页"
              className="opacity-60 hover:opacity-100 rounded p-0.5 cursor-pointer shrink-0"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => addBrowserTab(instance.instanceId)}
        title={`新建标签页（当前 ${bs.tabs.length} 个）`}
        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
          isLight ? 'hover:bg-slate-300/70 text-slate-700' : 'hover:bg-slate-800 text-slate-300'
        }`}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
      <div className="ml-auto flex items-center gap-1.5 px-1.5 text-[10px] font-mono-tabular shrink-0">
        <span
          className={`px-1.5 py-0.5 rounded ${
            systemMetrics.memPercent >= 85
              ? 'bg-rose-500/20 text-rose-400 font-bold'
              : systemMetrics.memPercent >= 70
                ? 'bg-amber-500/15 text-amber-400'
                : mutedText
          }`}
          title={`老电脑 4.00 GB 物理内存占用：${systemMetrics.totalUsedGb.toFixed(2)} GB`}
        >
          RAM {systemMetrics.memPercent}%
        </span>
        <span className={mutedText}>{bs.tabs.length}页</span>
      </div>
    </div>
  );

  const hasReadyDownload = downloads.some(
    (d) => !d.executed && (d.progress === undefined || d.progress >= 100)
  );

  const toolbarNode = isMobile ? (
    /* Compact 2-Row iOS Safary Bottom Chrome */
    <div
      className={`px-2.5 pt-1.5 pb-1.5 border-t flex flex-col gap-1.5 shrink-0 ${
        isLight ? 'bg-slate-100/95 border-slate-200' : 'bg-slate-900/95 border-slate-800'
      }`}
    >
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5 w-full">
        <div
          className={`flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-mono-tabular min-w-0 ${
            isLight
              ? 'bg-white border-slate-300 text-slate-800'
              : 'bg-slate-950 border-slate-700 text-slate-100'
          }`}
        >
          <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="搜索关键词或输入网址..."
            className="bg-transparent outline-none w-full min-w-0"
          />
          {currentUrl && (
            <button
              type="button"
              onClick={() => toggleBookmark(activeSubTab?.title || currentUrl, currentUrl)}
              title={isBookmarked ? '取消收藏' : '收藏'}
              className="cursor-pointer shrink-0 opacity-80 hover:opacity-100"
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
                }`}
              />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-3 py-1.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer shrink-0"
        >
          前往
        </button>
      </form>

      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={!canGoBack}
            onClick={() => browserBack(instance.instanceId)}
            title="后退"
            className={`w-8 h-7 rounded-lg flex items-center justify-center ${
              canGoBack ? 'hover:bg-white/10 cursor-pointer' : 'opacity-35 cursor-not-allowed'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={!canGoForward}
            onClick={() => browserForward(instance.instanceId)}
            title="前进"
            className={`w-8 h-7 rounded-lg flex items-center justify-center ${
              canGoForward ? 'hover:bg-white/10 cursor-pointer' : 'opacity-35 cursor-not-allowed'
            }`}
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigateBrowser(instance.instanceId, 'home', { query: '' })}
            title="主页"
            className="w-8 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 cursor-pointer"
          >
            <Home className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setRefreshNonce((n) => n + 1);
              if (bs.tab === 'rickroll') {
                primeRickrollMedia();
                if (!system.photosensitiveSafe) {
                  setRickReplayNonce((n) => n + 1);
                }
              }
            }}
            title="刷新"
            className="w-8 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${pageLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setDrawer((d) => (d === 'bookmarks' ? 'none' : 'bookmarks'))}
            title="收藏夹"
            className={`w-8 h-7 rounded-lg flex items-center justify-center cursor-pointer ${
              drawer === 'bookmarks' ? 'bg-sky-500/20 text-sky-400' : 'hover:bg-white/10'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDrawer((d) => (d === 'downloads' ? 'none' : 'downloads'))}
            title="下载管理"
            className={`relative w-8 h-7 rounded-lg flex items-center justify-center cursor-pointer ${
              drawer === 'downloads' ? 'bg-sky-500/20 text-sky-400' : 'hover:bg-white/10'
            }`}
          >
            <Download className="w-4 h-4" />
            {hasReadyDownload && (
              <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setDrawer((d) => (d === 'history' ? 'none' : 'history'))}
            title="历史记录"
            className={`w-8 h-7 rounded-lg flex items-center justify-center cursor-pointer ${
              drawer === 'history' ? 'bg-sky-500/20 text-sky-400' : 'hover:bg-white/10'
            }`}
          >
            <History className="w-4 h-4" />
          </button>
          {discoveredLore.length > 0 && (
            <button
              type="button"
              disabled={discoveredLore.length < 4}
              onClick={publishSurvivalGuide}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap ${
                discoveredLore.length >= 4
                  ? 'bg-emerald-600 text-white cursor-pointer'
                  : isLight
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              档案 {discoveredLore.length}/4
            </button>
          )}
        </div>
      </div>
    </div>
  ) : (
    /* Ultra-Slim Single-Row Desktop Toolbar (Bookmarks moved to 1-click popover!) */
    <div
      className={`px-2 py-1 flex items-center gap-1 shrink-0 border-b ${
        isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}
    >
      <button
        type="button"
        disabled={!canGoBack}
        onClick={() => browserBack(instance.instanceId)}
        title="后退"
        className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
          canGoBack ? 'hover:bg-white/10 cursor-pointer' : 'opacity-35 cursor-not-allowed'
        }`}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        disabled={!canGoForward}
        onClick={() => browserForward(instance.instanceId)}
        title="前进"
        className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
          canGoForward ? 'hover:bg-white/10 cursor-pointer' : 'opacity-35 cursor-not-allowed'
        }`}
      >
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => {
          setRefreshNonce((n) => n + 1);
          if (bs.tab === 'rickroll') {
            primeRickrollMedia();
            if (!system.photosensitiveSafe) {
              setRickReplayNonce((n) => n + 1);
            }
          }
        }}
        title="刷新页面"
        className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
          isLight ? 'hover:bg-slate-200' : 'hover:bg-slate-800'
        }`}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${pageLoading ? 'animate-spin' : ''}`} />
      </button>
      <button
        type="button"
        onClick={() => navigateBrowser(instance.instanceId, 'home', { query: '' })}
        title="主页"
        className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
          isLight ? 'hover:bg-slate-200' : 'hover:bg-slate-800'
        }`}
      >
        <Home className="w-3.5 h-3.5" />
      </button>

      <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-1 min-w-0">
        <div
          className={`flex-1 flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono-tabular min-w-0 ${
            isLight
              ? 'bg-white border-slate-300 text-slate-700'
              : 'bg-slate-950 border-slate-700 text-slate-200'
          }`}
        >
          <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="输入网址 (https://...) 或搜索关键词..."
            className="bg-transparent outline-none w-full min-w-0 truncate"
          />
          {currentUrl && (
            <button
              type="button"
              onClick={() => toggleBookmark(activeSubTab?.title || currentUrl, currentUrl)}
              title={isBookmarked ? '取消收藏' : '收藏此网页'}
              className="cursor-pointer shrink-0 opacity-80 hover:opacity-100"
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
                }`}
              />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-2.5 py-1 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-semibold cursor-pointer whitespace-nowrap"
        >
          访问
        </button>
      </form>

      {/* Compact Tools: Bookmarks / Downloads / History / Source */}
      <button
        type="button"
        onClick={() => setDrawer((d) => (d === 'bookmarks' ? 'none' : 'bookmarks'))}
        title="书签收藏夹"
        className={`px-1.5 h-6 rounded-md flex items-center gap-1 text-[11px] cursor-pointer transition-colors ${
          drawer === 'bookmarks' ? 'bg-sky-500/20 text-sky-400' : 'hover:bg-white/10'
        }`}
      >
        <Bookmark className="w-3.5 h-3.5" />
        <span className="hidden md:inline">书签</span>
      </button>

      <button
        type="button"
        onClick={() => setDrawer((d) => (d === 'downloads' ? 'none' : 'downloads'))}
        title="下载管理"
        className={`relative w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-colors ${
          drawer === 'downloads' ? 'bg-sky-500/20 text-sky-400' : 'hover:bg-white/10'
        }`}
      >
        <Download className="w-3.5 h-3.5" />
        {hasReadyDownload && (
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
        )}
      </button>

      <button
        type="button"
        onClick={() => setDrawer((d) => (d === 'history' ? 'none' : 'history'))}
        title="历史记录"
        className={`w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-colors ${
          drawer === 'history' ? 'bg-sky-500/20 text-sky-400' : 'hover:bg-white/10'
        }`}
      >
        <History className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setDrawer((d) => (d === 'source' ? 'none' : 'source'))}
        title="查看当前网页源码"
        className={`w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-colors ${
          drawer === 'source' ? 'bg-sky-500/20 text-sky-400' : 'hover:bg-white/10'
        }`}
      >
        <Code2 className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => openApp('browser', { forceNew: true, initialQuery: '' })}
        title="新建独立浏览器窗口"
        className={`w-6 h-6 rounded-md border flex items-center justify-center cursor-pointer ${surfaceCard}`}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      {discoveredLore.length > 0 && (
        <button
          type="button"
          disabled={discoveredLore.length < 4}
          onClick={publishSurvivalGuide}
          className={`px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
            discoveredLore.length >= 4
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
              : isLight
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
          title="搜集 4 份档案情报后可整理发布公开警示"
        >
          档案 {discoveredLore.length}/4 {discoveredLore.length >= 4 ? '· 发布' : ''}
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0 relative">
      {tabStripNode}
      {!isMobile && toolbarNode}

      {/* Simulated Top Page Progress Bar */}
      {pageLoading && (
        <div className="h-0.5 w-full bg-slate-800/40 overflow-hidden shrink-0">
          <div className="h-full w-2/3 bg-sky-500 animate-pulse" />
        </div>
      )}

      {/* Utility Drawer (Bookmarks / Downloads / History / Source) */}
      {drawer !== 'none' && (
        <div
          className={`border-b px-3.5 py-2.5 text-xs shrink-0 space-y-2 max-h-52 overflow-y-auto ${
            isLight ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-slate-950/95 border-slate-700 text-slate-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold">
              {drawer === 'bookmarks'
                ? `收藏夹书签 (${bookmarks.length})`
                : drawer === 'downloads'
                  ? '下载管理'
                  : drawer === 'history'
                    ? '当前标签页浏览历史'
                    : '页面源代码检查'}
            </span>
            <button
              type="button"
              onClick={() => setDrawer('none')}
              className="opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {drawer === 'bookmarks' && (
            <div className="flex flex-wrap gap-1.5">
              {bookmarks.map((bm) => (
                <button
                  key={bm.id}
                  type="button"
                  onClick={() => {
                    setDrawer('none');
                    navigateOrSearch(bm.url);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${surfaceCard} hover:border-sky-500/60`}
                >
                  <Bookmark className="w-3 h-3 text-amber-400" />
                  <span>{bm.label}</span>
                </button>
              ))}
            </div>
          )}

          {drawer === 'downloads' && (
            <div className="space-y-2">
              {downloads.length === 0 ? (
                <div className={`rounded-xl border p-4 text-center ${surfaceCard}`}>
                  <div className={`text-xs ${mutedText}`}>
                    暂无下载记录（在招聘页面点击下载驱动补丁后将显示于此）
                  </div>
                </div>
              ) : (
                downloads.map((dl) => {
                  const downloading = dl.progress !== undefined && dl.progress < 100;
                  return (
                    <div
                      key={dl.id}
                      className={`rounded-xl border p-2.5 flex items-center justify-between gap-3 ${surfaceCard}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold font-mono-tabular truncate">{dl.filename}</div>
                        <div className={`text-[11px] truncate ${mutedText}`}>
                          {dl.size} · 来源：{dl.source}
                        </div>
                        {downloading && (
                          <div className="mt-1.5 h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                            <div
                              className="h-full bg-sky-500 transition-all duration-200"
                              style={{ width: `${dl.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={dl.executed || downloading}
                        onClick={() => executeDownloadItem(dl.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                          dl.executed
                            ? 'bg-emerald-600/20 text-emerald-400 cursor-not-allowed'
                            : downloading
                              ? 'bg-sky-600/30 text-sky-300 cursor-wait'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                        }`}
                      >
                        {dl.executed ? '已隔离' : downloading ? `下载中 ${dl.progress}%` : '运行程序'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {drawer === 'history' && (
            <div className="space-y-1">
              {bs.history.map((item, idx) => (
                <button
                  key={`${item.tab}-${idx}`}
                  type="button"
                  onClick={() => {
                    navigateOrSearch(item.liveUrl || item.query || 'wiki');
                    setDrawer('none');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                    idx === bs.historyIndex
                      ? 'bg-sky-500/15 text-sky-400 font-semibold'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <span className="truncate font-mono-tabular">
                    {item.liveUrl || item.query || '起始页'}
                  </span>
                  <span className={`text-[10px] shrink-0 ml-2 ${mutedText}`}>#{idx + 1}</span>
                </button>
              ))}
            </div>
          )}

          {drawer === 'source' && (
            <pre className="rounded-lg bg-black/70 border border-slate-800 p-3 text-[11px] font-mono-tabular text-emerald-300 overflow-x-auto leading-relaxed">
{`<!-- Document Inspector: ${currentUrl || 'about:home'} -->
<meta name="observer-sanity" content="${sanity}%" />
<meta name="tab-count" content="${bs.tabs.length}" />
<meta name="hint" content="Try youtube.com/watch?v=dQw4w9WgXcQ or internal://omega" />`}
            </pre>
          )}
        </div>
      )}

      {/* Viewport */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-3.5">
        {pageLoading ? (
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center gap-3 py-12">
            <RefreshCw className="w-7 h-7 text-sky-400 animate-spin" />
            <div className="space-y-1">
              <div className="text-xs font-semibold">正在建立加密连接并加载文档...</div>
              <div className={`text-[11px] font-mono-tabular ${mutedText}`}>
                {currentUrl || bs.query || 'resolving host...'}
              </div>
            </div>
          </div>
        ) : !isOnline && bs.tab !== 'invasion' && bs.tab !== 'omega' && bs.tab !== 'void_404' ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <WifiOff className="w-12 h-12 text-slate-400 mb-3" />
            <h3 className="text-lg font-semibold mb-1">
              {isMobile ? 'Safary 无法打开页面' : '未连接到 Internet'}
            </h3>
            <p className={`text-sm mb-5 max-w-sm ${mutedText}`}>
              {isMobile ? '因为 iPhone 尚未接入互联网。' : '当前网络适配器已断开，无法加载远程网页或传输数据。'}
            </p>
            <button
              type="button"
              onClick={toggleNetwork}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium cursor-pointer"
            >
              重新连接网络
            </button>
          </div>
        ) : bs.tab === 'home' ? (
          <div className="max-w-2xl mx-auto py-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center mb-3">
              {isMobile ? <Compass className="w-6 h-6 text-sky-400" /> : <Globe className="w-6 h-6 text-sky-400" />}
            </div>
            <h3 className="text-2xl font-bold tracking-tight mb-1.5">
              {isMobile ? 'Safary 浏览器' : 'Edge 全网浏览与深网检索'}
            </h3>
            <p className={`text-xs mb-5 ${mutedText}`}>
              支持输入自定义网址、内部协议或搜索「wiki」「高薪」「如何摆脱伪人」
            </p>

            <form onSubmit={handleSubmit} className="w-full flex gap-2 mb-6">
              <div
                className={`flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-slate-900/90 border-slate-700 text-slate-100'
                }`}
              >
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="输入网址 https://... 或关键词 / wiki"
                  className="bg-transparent outline-none w-full text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                访问
              </button>
            </form>

            <div className="w-full text-left space-y-2.5">
              <div className={`text-xs font-medium ${mutedText}`}>
                {isMobile ? '个人收藏与快捷站点' : '常用书签与直达网页'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {bookmarks.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      navigateOrSearch(item.url);
                    }}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition-colors cursor-pointer ${surfaceCard} ${
                      isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-medium truncate">{item.label}</div>
                      <div className={`text-[10px] font-mono-tabular truncate ${mutedText}`}>
                        {item.url}
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 opacity-55 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : bs.tab === 'live_web' && bs.liveUrl ? (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className={`rounded-2xl border p-5 space-y-4 ${surfaceCard}`}>
              <div className="flex items-center justify-between gap-2 border-b border-slate-700/35 pb-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-mono-tabular text-sky-400 truncate">
                    WEB SNAPSHOT · {liveDomain}
                  </div>
                  <h3 className="text-lg font-bold mt-0.5">
                    {liveDomain.includes('wikipedia')
                      ? '维基百科 · 自由的百科全书'
                      : liveDomain.includes('youtube') || liveDomain.includes('youtu.be')
                        ? 'YouTube · 热门视频频道'
                        : liveDomain.includes('bilibili')
                          ? '哔哩哔哩 · 弹幕视频网'
                          : liveDomain.includes('github')
                            ? 'GitHub · 开源代码仓库'
                            : `${liveDomain} · 网页快照`}
                  </h3>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 font-medium shrink-0">
                  本地安全快照
                </span>
              </div>

              {liveDomain.includes('wikipedia') ? (
                <div className="space-y-3 text-sm leading-relaxed">
                  <p>
                    欢迎来到维基百科。正在为您展示与本市深夜异常网络事件相关的公开词条摘要：
                  </p>
                  <p className={mutedText}>
                    「网络都市传说（Internet Urban Legend）」通常借助伪装成高薪兼职或即时通讯软件的漏洞进行传播。
                    若想查看针对今晚异常节点的详细实测记录，可跳转至民间维护的{' '}
                    <button
                      type="button"
                      onClick={() =>
                        performBrowserSearch(instance.instanceId, 'https://wiki.deepnet.local')
                      }
                      className="text-sky-400 underline cursor-pointer"
                    >
                      异常网络观察 Wiki
                    </button>
                    。
                  </p>
                </div>
              ) : liveDomain.includes('youtube') ||
                liveDomain.includes('youtu.be') ||
                liveDomain.includes('bilibili') ? (
                <div className="space-y-3 text-sm">
                  <p className={mutedText}>当前热门减压推荐视频（点击即可直接在浏览器内播放）：</p>
                  <button
                    type="button"
                    onClick={() =>
                      navigateOrSearch('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
                    }
                    className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-left cursor-pointer ${surfaceCard} hover:border-rose-500/60`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-9 rounded-lg bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                        <Play className="w-4 h-4 fill-current" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">
                          Rick Astley - Never Gonna Give You Up (4K Remaster)
                        </div>
                        <div className="text-[11px] font-mono-tabular text-sky-400 truncate">
                          https://www.youtube.com/watch?v=dQw4w9WgXcQ
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 opacity-60 shrink-0" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3 text-sm leading-relaxed">
                  <p>
                    已解析目标域名 <span className="font-mono-tabular text-sky-400">{bs.liveUrl}</span> 的文本快照内容。
                  </p>
                  <p className={mutedText}>
                    该外部站点暂未检测到与「0x000000」或暗网诱饵节点的直接关联。若要查阅本机及深夜异常事件的完整档案，可搜索「wiki」或直接进入 Wiki 站点。
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-700/35 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    performBrowserSearch(instance.instanceId, 'https://wiki.deepnet.local')
                  }
                  className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium cursor-pointer"
                >
                  进入异常观察 Wiki
                </button>
                <button
                  type="button"
                  onClick={() => navigateBrowser(instance.instanceId, 'home', { query: '' })}
                  className={`px-3.5 py-2 rounded-lg border text-xs cursor-pointer ${surfaceCard}`}
                >
                  回到起始页
                </button>
              </div>
            </div>
          </div>
        ) : bs.tab === 'rickroll' ? null : bs.tab === 'void_404' ? (
          <div className="max-w-lg mx-auto py-8 text-center space-y-4">
            <div className={`rounded-2xl border p-6 space-y-3 ${surfaceCard}`}>
              <div className="text-4xl font-black font-mono-tabular text-slate-500">404.VOID</div>
              <h3 className="text-base font-bold">页面已落入空标签页夹缝</h3>
              <p className={`text-xs leading-relaxed ${mutedText}`}>
                当前浏览器已打开 {bs.tabs.length} 个标签页。当标签页数量过多（5 个以上），老式计算机的内存会彻底崩溃。
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => addBrowserTab(instance.instanceId)}
                  className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium cursor-pointer"
                >
                  继续新建标签页
                </button>
                <button
                  type="button"
                  onClick={() =>
                    performBrowserSearch(instance.instanceId, 'https://wiki.deepnet.local')
                  }
                  className={`px-3.5 py-2 rounded-lg border text-xs cursor-pointer ${surfaceCard}`}
                >
                  回到 Wiki
                </button>
              </div>
            </div>
          </div>
        ) : bs.tab === 'omega' ? (
          <div className="max-w-lg mx-auto py-6">
            <div className="rounded-2xl border border-amber-500/50 bg-slate-950 text-slate-100 p-6 space-y-4 text-center">
              <Eye className="w-10 h-10 text-amber-400 mx-auto" />
              <div className="text-xs font-mono-tabular text-amber-400">INTERNAL://OMEGA</div>
              <h3 className="text-lg font-bold">终极全知观测协议</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                当前时间线已收束结局：<span className="font-mono-tabular font-bold text-amber-300">{unlockedEndings.length} / 40</span>（需至少 25 个结局解锁最高权限）
              </p>
              <button
                type="button"
                onClick={triggerOmegaEnding}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm cursor-pointer"
              >
                启动终极观测协议 (#30)
              </button>
            </div>
          </div>
        ) : bs.tab === 'wiki' ? (
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4">
            {/* Wiki Left Chapter Sidebar */}
            <div className="sm:w-60 shrink-0 space-y-2.5">
              <div className={`rounded-xl border p-3 ${surfaceCard}`}>
                <div className="text-xs font-bold flex items-center justify-between gap-2">
                  <span>异常网络观察 Wiki</span>
                  <span className="text-[10px] font-mono-tabular text-sky-400">v4.0</span>
                </div>
                <div className={`text-[11px] mt-1 font-mono-tabular ${mutedText}`}>
                  已收集情报：{discoveredLore.length} 份 · 全 40 结局指南
                </div>
              </div>

              <div className="flex sm:flex-col gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                {WIKI_SECTIONS.map((sec, sIdx) => {
                  const active = activeWiki.id === sec.id;
                  const read = discoveredLore.includes(sec.loreKey);
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => selectWikiSection(instance.instanceId, sec.id)}
                      className={`shrink-0 sm:w-full text-left px-3 py-2.5 rounded-xl border text-xs transition-all cursor-pointer whitespace-nowrap sm:whitespace-normal flex items-center justify-between gap-2 ${
                        active
                          ? 'bg-sky-500/15 border-sky-500/60 font-semibold text-sky-400 shadow-sm'
                          : `${surfaceCard} ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/80'}`
                      }`}
                    >
                      <span className="truncate sm:whitespace-normal leading-snug">
                        <span className="font-mono-tabular opacity-60 mr-1.5">
                          {(sIdx + 1).toString().padStart(2, '0')}
                        </span>
                        {sec.title.split('·')[0].trim()}
                      </span>
                      {read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="已收录情报" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Wiki Beautified Article Surface */}
            <article className={`flex-1 rounded-2xl border overflow-hidden h-fit ${surfaceCard}`}>
              <div
                className={`px-5 py-4 border-b ${
                  isLight
                    ? 'bg-gradient-to-r from-sky-50 via-white to-indigo-50 border-slate-200'
                    : 'bg-gradient-to-r from-sky-950/50 via-slate-900 to-indigo-950/35 border-slate-700/60'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-mono-tabular text-sky-400">
                    wiki.deepnet.local/{activeWiki.id}
                  </span>
                  <span className="text-[10px] font-mono-tabular px-2 py-0.5 rounded border border-sky-500/35 bg-sky-500/10 text-sky-400">
                    民间实测归档
                  </span>
                </div>
                <h3 className="text-lg font-bold tracking-tight">{activeWiki.title}</h3>
                <p className={`text-xs mt-1 leading-relaxed ${mutedText}`}>{activeWiki.subtitle}</p>
              </div>

              <div className="p-5 space-y-3 text-sm leading-relaxed">
                {activeWiki.paragraphs.map((p, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border p-3.5 text-[13px] leading-relaxed ${
                      isLight
                        ? 'bg-slate-50/90 border-slate-200/80 text-slate-800'
                        : 'bg-slate-950/45 border-slate-800/80 text-slate-200'
                    }`}
                  >
                    {p}
                  </div>
                ))}
              </div>

              <div className="px-5 pb-5 pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-700/30">
                <div className="flex flex-wrap gap-2">
                  {activeWiki.quickLinkLabel && activeWiki.quickLinkQuery && (
                    <button
                      type="button"
                      onClick={() => navigateOrSearch(activeWiki.quickLinkQuery!)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium cursor-pointer"
                    >
                      <span>{activeWiki.quickLinkLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {discoveredLore.length >= 4 && (
                    <button
                      type="button"
                      onClick={publishSurvivalGuide}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                    >
                      <span>整理并公开发布《防身手册》(#14)</span>
                    </button>
                  )}
                </div>
                <span className={`text-[11px] font-mono-tabular ${mutedText}`}>
                  浏览各章节自动计入安全情报
                </span>
              </div>
            </article>
          </div>
        ) : bs.tab === 'search_results' ? (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className={`text-xs ${mutedText}`}>
                关键词「<span className="font-semibold text-sky-400">{bs.query}</span>」共匹配到 {searchMatches.length} 条记录
              </div>
              <button
                type="button"
                onClick={() => navigateBrowser(instance.instanceId, 'home', { query: '' })}
                className={`px-3 py-1 rounded-lg border text-xs cursor-pointer ${surfaceCard}`}
              >
                返回搜索
              </button>
            </div>

            {searchMatches.length > 0 ? (
              <div className="space-y-3">
                {searchMatches.map((art) => (
                  <div
                    key={art.id}
                    className={`rounded-xl border p-4 space-y-1.5 transition-colors ${surfaceCard}`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono-tabular">
                      <span className="text-sky-400 truncate">{art.url}</span>
                      <span className={mutedText}>{art.category}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openArticle(art.id)}
                      className="text-sm font-bold text-left hover:text-sky-400 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{art.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    </button>
                    <p className={`text-xs leading-relaxed ${mutedText}`}>{art.summary}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`rounded-xl border p-5 space-y-3 ${surfaceCard}`}>
                <h4 className="text-sm font-bold">未找到「{bs.query}」的公开网页</h4>
                <p className={`text-xs leading-relaxed ${mutedText}`}>
                  你可以尝试浏览已收录的民间维基与深夜观察档案：
                </p>
                <div className="flex flex-wrap gap-2">
                  {['art_wiki', 'art_jobs', 'art_missing', 'art_self'].map((id) => {
                    const art = SEARCH_CATALOG.find((a) => a.id === id);
                    if (!art) return null;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => openSearchArticle(instance.instanceId, id)}
                        className="px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/35 text-xs text-sky-400 hover:bg-sky-500/25 cursor-pointer"
                      >
                        {art.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : bs.tab === 'lore_article' && activeArticle ? (
          <article className="max-w-2xl mx-auto space-y-4">
            <div className={`rounded-2xl border p-5 space-y-3 ${surfaceCard}`}>
              <div className="flex items-center justify-between gap-2 text-xs font-mono-tabular">
                <span className="text-sky-400 font-semibold">{activeArticle.category}</span>
                <span className={mutedText}>{activeArticle.url}</span>
              </div>
              <h3 className="text-lg font-bold">{activeArticle.title}</h3>
              <div className="space-y-3 text-sm leading-relaxed pt-2 border-t border-slate-700/35">
                {activeArticle.content.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>

              {activeArticle.relatedIds && activeArticle.relatedIds.length > 0 && (
                <div className="pt-3 border-t border-slate-700/35 space-y-2">
                  <div className={`text-xs font-semibold ${mutedText}`}>延伸访问</div>
                  <div className="flex flex-wrap gap-2">
                    {activeArticle.relatedIds.map((rid) => {
                      const rel = SEARCH_CATALOG.find((a) => a.id === rid);
                      if (!rel) return null;
                      return (
                        <button
                          key={rid}
                          type="button"
                          onClick={() => openArticle(rid)}
                          className={`px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${surfaceCard} hover:border-sky-500/50`}
                        >
                          {rel.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </article>
        ) : bs.tab === 'jobs' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">夜间高薪紧急招聘</h3>
                <p className={`text-xs ${mutedText}`}>
                  未备案招聘节点 · 共 {JOB_LISTINGS.length} 个日结与高薪岗位
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateBrowser(instance.instanceId, 'home')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${surfaceCard}`}
              >
                返回主页
              </button>
            </div>

            {cameraScanResult && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-200 leading-relaxed">
                {cameraScanResult}
              </div>
            )}

            <div className="space-y-2.5">
              {JOB_LISTINGS.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => navigateBrowser(instance.instanceId, 'job_detail', { jobId: job.id })}
                  className={`w-full text-left rounded-xl border p-4 transition-colors cursor-pointer ${surfaceCard} ${
                    isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-amber-400 shrink-0" />
                      {job.title}
                    </span>
                    <span className="text-xs font-medium text-rose-400">{job.danger}</span>
                  </div>
                  <div className={`text-xs mb-1.5 ${mutedText}`}>
                    {job.company} · {job.salary}
                  </div>
                  <p className={`text-xs line-clamp-2 ${mutedText}`}>{job.desc}</p>
                </button>
              ))}
            </div>
          </div>
        ) : bs.tab === 'job_detail' && selectedJob ? (
          <div className="space-y-4 max-w-xl mx-auto">
            <div className={`rounded-xl border p-5 space-y-3 ${surfaceCard}`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold">{selectedJob.title}</h3>
                <span className="text-xs font-semibold text-rose-400">{selectedJob.danger}</span>
              </div>
              <div className={`text-xs space-y-1 ${mutedText}`}>
                <div>机构：{selectedJob.company}</div>
                <div>薪资：{selectedJob.salary}</div>
                <div>要求：{selectedJob.requirement}</div>
              </div>
              <p className="text-sm leading-relaxed pt-2 border-t border-slate-700/40">
                {selectedJob.desc}
              </p>
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/25 p-3 text-xs text-rose-300 leading-relaxed">
                {selectedJob.anomalyNote}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => applyForJob(instance.instanceId, selectedJob.id)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors cursor-pointer"
                >
                  {selectedJob.fakeCamera ? '发起生物面容验证并应聘' : '立即投递个人简历'}
                </button>
                <button
                  type="button"
                  onClick={() => navigateBrowser(instance.instanceId, 'jobs')}
                  className={`py-2.5 px-4 rounded-xl border text-sm font-medium cursor-pointer ${surfaceCard}`}
                >
                  返回列表
                </button>
              </div>

              <div className="pt-2 border-t border-slate-700/35 flex items-center justify-between gap-2 text-xs">
                <span className={mutedText}>面试摄像头打不开？可下载站方提供的驱动补丁</span>
                <button
                  type="button"
                  onClick={() => {
                    downloadDriverPatch();
                    setDrawer('downloads');
                  }}
                  className="text-amber-400 hover:underline font-medium flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下载补丁</span>
                </button>
              </div>
            </div>
          </div>
        ) : bs.tab === 'apply_result' ? (
          <div className="max-w-lg mx-auto py-6">
            <div className="rounded-2xl border border-rose-500/40 bg-rose-950/35 p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-lg font-bold">简历已上传，检测到反向端口连接</h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-200">
                对方服务器在接收简历后没有关闭会话，而是持续保持着你的本地端口句柄。你可以先查看刚刚收到的邮件，或冒险深入对方的后台面板。
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => escalateToInvasion(instance.instanceId)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-colors cursor-pointer"
                >
                  深入对方后台服务器
                </button>
                <button
                  type="button"
                  onClick={() => openApp('email')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 text-sm font-medium cursor-pointer"
                >
                  打开邮件箱查看回执
                </button>
              </div>
            </div>
          </div>
        ) : bs.tab === 'ritual' ? (
          <div className="max-w-xl mx-auto space-y-4">
            <div className={`rounded-2xl border p-5 space-y-4 ${surfaceCard}`}>
              <div className="flex items-center gap-2.5 text-amber-400">
                <BookOpen className="w-5 h-5 shrink-0" />
                <h3 className="text-lg font-bold">旧网络残卷：数字驱逐仪式</h3>
              </div>
              <p className={`text-sm leading-relaxed ${mutedText}`}>
                “唯有系统之盾筑牢、三印依次共鸣之时，寄生于端口中的阴影方能散去。”
              </p>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className={`p-2.5 rounded-lg border ${privacy.firewallEnabled ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-slate-600/40 bg-slate-900/40 text-slate-400'}`}>
                  防火墙 · {privacy.firewallEnabled ? '就绪' : '未开'}
                </div>
                <div className={`p-2.5 rounded-lg border ${privacy.antivirusEnabled ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-slate-600/40 bg-slate-900/40 text-slate-400'}`}>
                  病毒防护 · {privacy.antivirusEnabled ? '就绪' : '未开'}
                </div>
                <div className={`p-2.5 rounded-lg border ${privacy.dnsEnabled ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-slate-600/40 bg-slate-900/40 text-slate-400'}`}>
                  DNS 加密 · {privacy.dnsEnabled ? '就绪' : '未开'}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold mb-2">依次点亮三枚共鸣符印</div>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['净化端口', '断绝镜像', '铭刻真言'] as const).map((label, idx) => {
                    const active = ritualSigils[idx];
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleSigil(idx as 0 | 1 | 2)}
                        className={`py-3 px-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : isLight
                              ? 'bg-slate-100 border-slate-300 text-slate-700'
                              : 'bg-slate-900 border-slate-700 text-slate-300'
                        }`}
                      >
                        {active ? `✦ ${label}` : label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={`rounded-xl border p-3 text-xs font-mono-tabular ${isLight ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-slate-700 bg-slate-900/60 text-slate-300'}`}>
                当前系统时钟：{clockTime.getHours().toString().padStart(2, '0')}:{clockTime.getMinutes().toString().padStart(2, '0')}
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  disabled={!sigilsCompleted}
                  onClick={performRitual}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                    sigilsCompleted
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{sigilsCompleted ? '执行仪式' : '请先点亮全部符印'}</span>
                </button>
                {!defensesReady && (
                  <button
                    type="button"
                    onClick={() => openApp('settings')}
                    className={`py-2.5 px-4 rounded-xl border text-sm font-medium cursor-pointer ${surfaceCard}`}
                  >
                    打开系统设置
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : bs.tab === 'code_truth' ? (
          <div className="max-w-xl mx-auto space-y-4">
            <div className={`rounded-2xl border p-5 space-y-4 ${surfaceCard}`}>
              <div className="flex items-center gap-2.5 text-sky-400">
                <Code2 className="w-5 h-5 shrink-0" />
                <h3 className="text-lg font-bold">底层运行时源码检查器</h3>
              </div>

              <pre className="rounded-xl bg-slate-950 border border-slate-800 p-4 text-xs font-mono-tabular text-sky-300 overflow-x-auto leading-relaxed">
{`const WORLD_RUNTIME = {
  build: "PSEUDO_DESKTOP_SIM",
  entity: "MEMETIC_GARBAGE_COLLECTOR",
  observerSanity: ${sanity},
  awakeThreshold: 100,
  accessGranted: ${sanity === 100 ? 'true' : 'false'},
};`}
              </pre>

              {sanity === 100 ? (
                <button
                  type="button"
                  onClick={executeCodeTruth}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm cursor-pointer"
                >
                  执行源码解析
                </button>
              ) : (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 leading-relaxed">
                  当前思维清晰度为 {sanity}%，未达到 100% 根权限阈值，暂时无法读取完整底层代码。
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-lg mx-auto py-4">
            <div className="rounded-2xl border-2 border-rose-500/70 bg-rose-950/60 p-6 text-center space-y-4">
              <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
              <h3 className="text-xl font-bold text-rose-200">系统核心权限已被未知进程接管</h3>
              <p className="text-xs font-mono-tabular text-rose-300">
                进程 0x000000 正在持续写入本地身份扇区……
              </p>
              <p className="text-xs text-slate-200 leading-relaxed">
                系统警报：外部连接未阻断前，直接强制结束该进程可能导致权限彻底覆写。
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => openApp('security')}
                  className="py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs cursor-pointer"
                >
                  打开安全中心
                </button>
                <button
                  type="button"
                  onClick={toggleNetwork}
                  className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs cursor-pointer"
                >
                  断开网络连接
                </button>
              </div>
              <button
                type="button"
                onClick={triggerJumpscareEnding}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-semibold text-xs cursor-pointer"
              >
                强制终止进程 0x000000
              </button>
            </div>
          </div>
        )}
        {/* Persistent Rickroll Stage: keeps exact same <video> DOM node alive for synchronous iOS media permission unlocking */}
        <div
          aria-hidden={pageLoading || !isOnline || bs.tab !== 'rickroll'}
          className={
            !pageLoading && isOnline && bs.tab === 'rickroll'
              ? 'max-w-2xl mx-auto space-y-4'
              : 'fixed -left-[9999px] -top-[9999px] w-px h-px overflow-hidden opacity-0 pointer-events-none'
          }
        >
          {system.photosensitiveSafe && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-3.5 py-2.5 flex items-center gap-2 text-xs text-emerald-300">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                已开启光敏安全模式：已跳过{isMobile ? '幽灵触控劫持' : '鼠标劫持'}与突脸闪烁惊吓，当前为安全直连播放视图。
              </span>
            </div>
          )}

          <div className="rounded-2xl overflow-hidden border border-rose-500/40 bg-slate-950 text-white shadow-2xl">
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              {!rickVideoError ? (
                <>
                  <video
                    key={rickVideoKey}
                    ref={rickVideoRef}
                    src={rickVideoKey > 0 ? `/video/rickroll.mp4?v=${rickVideoKey}` : '/video/rickroll.mp4'}
                    controls={rickStage === 'playing' || system.photosensitiveSafe}
                    loop
                    playsInline
                    preload={rickMediaUnlocked || bs.tab === 'rickroll' ? 'auto' : 'none'}
                    onCanPlay={() => {
                      setRickVideoError(false);
                      setRickErrorDetail('');
                    }}
                    onPlay={(e) => {
                      if (
                        primingMediaRef.current ||
                        !isRickTabRef.current ||
                        (rickStageRef.current !== 'playing' && !system.photosensitiveSafe)
                      ) {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                        return;
                      }
                      setRickAutoplayBlocked(false);
                    }}
                    onError={(e) => {
                      if (bs.tab !== 'rickroll' && !rickMediaUnlocked) return;
                      const err = e.currentTarget.error;
                      const codeMap: Record<number, string> = {
                        1: '加载被中断 (MEDIA_ERR_ABORTED)',
                        2: '网络或文件读取失败 (MEDIA_ERR_NETWORK)',
                        3: '视频解码失败 (MEDIA_ERR_DECODE)',
                        4: '文件不存在或格式不受支持 (MEDIA_ERR_SRC_NOT_SUPPORTED)',
                      };
                      setRickErrorDetail(
                        err ? codeMap[err.code] ?? `错误码 ${err.code}` : '未知播放错误'
                      );
                      setRickVideoError(true);
                    }}
                    className={`w-full h-full object-contain bg-black ${
                      rickStage === 'playing' || system.photosensitiveSafe ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  {rickAutoplayBlocked && (rickStage === 'playing' || system.photosensitiveSafe) && (
                    <button
                      type="button"
                      onClick={() => {
                        const el = rickVideoRef.current;
                        if (!el) return;
                        el.muted = !system.sound;
                        el.volume = Math.max(0, Math.min(1, system.soundVolume / 100));
                        void el.play().then(() => setRickAutoplayBlocked(false));
                      }}
                      className="absolute inset-0 z-10 bg-black/55 backdrop-blur-xs flex flex-col items-center justify-center gap-2.5 text-white cursor-pointer hover:bg-black/45 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center shadow-xl">
                        <Play className="w-7 h-7 fill-current ml-0.5" />
                      </div>
                      <span className="text-xs font-bold tracking-wide px-3 py-1 rounded-lg bg-black/70 border border-white/15">
                        点击立即播放减压神曲 MV
                      </span>
                    </button>
                  )}
                </>
              ) : (
                <div className="p-6 text-center space-y-3 max-w-md">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-100">
                    视频加载失败：/video/rickroll.mp4
                  </div>
                  {rickErrorDetail && (
                    <div className="text-[11px] font-mono-tabular text-rose-300 bg-rose-950/50 border border-rose-500/30 rounded-lg px-2.5 py-1 inline-block">
                      {rickErrorDetail}
                    </div>
                  )}
                  <p className="text-xs text-slate-400 leading-relaxed">
                    请确认 <code className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono-tabular">public/video/rickroll.mp4</code> 已完整上传且为有效的 MP4 (H.264/AAC) 文件，然后点击下方重试。
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setRickVideoError(false);
                      setRickErrorDetail('');
                      setRickAutoplayBlocked(false);
                      setRickMediaUnlocked(true);
                      setRickVideoKey((k) => k + 1);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>重新加载视频</span>
                  </button>
                </div>
              )}

              {/* Opaque pre-play frozen horror preview layer during cutscene */}
              {bs.tab === 'rickroll' && rickStage !== 'playing' && !system.photosensitiveSafe && (
                <div className="absolute inset-0 z-20 bg-gradient-to-b from-slate-950 via-black to-rose-950/35 flex flex-col items-center justify-center p-6 text-center select-none">
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 4px)',
                    }}
                  />
                  <div className="absolute top-0 inset-x-0 h-1 bg-slate-800">
                    <div className="h-full w-4/5 bg-rose-600/80" />
                  </div>

                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="text-[11px] font-mono-tabular tracking-widest uppercase text-rose-400/90">
                      {isMobile
                        ? rickStage === 'story_1'
                          ? 'BUFFER_HOLD // 网页脚本卡死'
                          : rickStage === 'story_2'
                            ? 'GHOST_TOUCH // 屏幕出现未知触点'
                            : rickStage === 'hijack_move'
                              ? '0x000000_OVERRIDE // 幽灵触控滑动中...'
                              : 'EXEC_TAP // 已强制点击播放'
                        : rickStage === 'story_1'
                          ? 'BUFFER_HOLD // 视频脚本未加载'
                          : rickStage === 'story_2'
                            ? 'HID_WARNING // 检测到异常指针偏移'
                            : rickStage === 'hijack_move'
                              ? '0x000000_OVERRIDE // 指针接管中...'
                              : 'EXEC_PLAY // 已触发强制播放'}
                    </div>

                    <button
                      ref={rickPlayBtnRef}
                      type="button"
                      tabIndex={-1}
                      aria-label="播放减压神曲 MV"
                      className={`relative w-20 h-14 rounded-2xl flex items-center justify-center transition-transform duration-150 shadow-2xl border ${
                        rickStage === 'hijack_click'
                          ? 'bg-rose-400 border-white scale-90 shadow-rose-500/70'
                          : rickStage === 'hijack_move'
                            ? 'bg-rose-600 border-rose-300/70 scale-105 shadow-rose-600/50'
                            : 'bg-rose-600/90 border-rose-400/40'
                      }`}
                    >
                      <Play className="w-8 h-8 fill-white text-white ml-1" />
                      {rickStage === 'hijack_click' && (
                        <span className="absolute inset-0 rounded-2xl border-2 border-white animate-ping" />
                      )}
                    </button>

                    <div className="text-xs text-slate-300 font-medium">
                      减压神曲 MV · {rickMediaUnlocked ? '已授权媒体通道 · 等待触发' : '等待触发播放'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Player Info & Easter Egg Trigger Bar */}
            <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <div className="text-xs font-bold">
                    Rick Astley - Never Gonna Give You Up (Official Video)
                  </div>
                  <div className="text-[11px] font-mono-tabular text-slate-400">
                    dQw4w9WgXcQ · /video/rickroll.mp4 · {system.sound ? `音量 ${system.soundVolume}%` : '已静音'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!system.photosensitiveSafe && rickStage === 'playing' && (
                  <button
                    type="button"
                    onClick={() => {
                      primeRickrollMedia();
                      setRickReplayNonce((n) => n + 1);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>重温惊吓剧情</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={triggerRickrollEnding}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>一起摇摆 · 触发彩蛋结局</span>
                </button>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className={`rounded-2xl border p-4 space-y-3 ${surfaceCard}`}>
            <div className="flex items-center justify-between text-xs font-bold">
              <span>热门评论区 (2 条)</span>
              <span className="flex items-center gap-1 text-sky-400">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>1.7B</span>
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-black/20 border border-white/10">
                <span className="font-bold text-rose-400">进程_0x000000：</span>
                <span className="text-slate-300">
                  ……我顺着暗网连进来了，原本准备接管你的身份，现在我决定先跟着摇完这首。
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/20 border border-white/10">
                <span className="font-bold text-sky-400">深夜观察员：</span>
                <span className="text-slate-300">
                  好家伙，恐怖游戏里被 Rickroll 还是头一回。
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isMobile && toolbarNode}

      {/* Global Portal for Hijacked Cursor (Desktop) / Ghost Touch Orb (iPhone Mobile) & 突脸 Rickroll Shock */}
      {typeof document !== 'undefined' &&
        bs.tab === 'rickroll' &&
        !instance.isMinimized &&
        isOnline &&
        phase === 'PLAYING' &&
        !system.photosensitiveSafe &&
        rickStage !== 'playing' &&
        createPortal(
          <div
            onClick={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              e.preventDefault();
              if (!rickMediaUnlocked) primeRickrollMedia();
            }}
            onContextMenu={(e) => e.preventDefault()}
            className={`fixed inset-0 z-[9990] pointer-events-auto select-none touch-none ${
              isMobile ? '' : 'cursor-none'
            }`}
          >
            {rickStage === 'jumpscare' ? (
              <div className="absolute inset-0 bg-black flex flex-col items-center justify-center overflow-hidden animate-jumpscare">
                {/* Flashing horror strobe background (guarded by !photosensitiveSafe) */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.65),rgba(15,23,42,0.95)_58%,black_85%)] animate-pulse" />
                <div
                  className="absolute inset-0 opacity-45 mix-blend-screen"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(0deg, rgba(244,63,94,0.45) 0px, transparent 3px, rgba(56,189,248,0.35) 6px, transparent 10px)',
                  }}
                />

                {/* Giant Uncanny Rickroll Jumpscare Face */}
                <div className="relative z-10 flex flex-col items-center text-center px-6 space-y-4">
                  <svg
                    viewBox="0 0 220 220"
                    className="w-56 h-56 sm:w-72 sm:h-72 drop-shadow-[0_0_45px_rgba(244,63,94,0.95)]"
                  >
                    <circle cx="110" cy="110" r="96" fill="#09090b" stroke="#f43f5e" strokeWidth="4" />
                    <path
                      d="M42 78 C60 22, 160 22, 178 78 C156 54, 64 54, 42 78 Z"
                      fill="#f43f5e"
                      opacity="0.75"
                    />
                    <ellipse cx="74" cy="96" rx="22" ry="18" fill="#ffffff" />
                    <ellipse cx="146" cy="96" rx="22" ry="18" fill="#ffffff" />
                    <circle cx="76" cy="96" r="7" fill="#000000" />
                    <circle cx="144" cy="96" r="7" fill="#000000" />
                    <circle cx="76" cy="96" r="2.5" fill="#f43f5e" />
                    <circle cx="144" cy="96" r="2.5" fill="#f43f5e" />
                    <path
                      d="M52 140 Q110 198 168 140 Q110 162 52 140 Z"
                      fill="#ffffff"
                      stroke="#f43f5e"
                      strokeWidth="3"
                    />
                    <line x1="78" y1="149" x2="78" y2="164" stroke="#09090b" strokeWidth="3" />
                    <line x1="110" y1="154" x2="110" y2="171" stroke="#09090b" strokeWidth="3" />
                    <line x1="142" y1="149" x2="142" y2="164" stroke="#09090b" strokeWidth="3" />
                  </svg>

                  <div className="space-y-1.5">
                    <div className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-[0_0_24px_rgba(244,63,94,1)]">
                      NEVER GONNA GIVE YOU UP!!
                    </div>
                    <div className="text-sm sm:text-base font-mono-tabular font-bold tracking-[0.28em] text-rose-300 uppercase">
                      抓 到 你 了 · WE&apos;RE NO STRANGERS TO FEAR
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Subtle dread border vignette during cursor / touch hijack */}
                <div
                  className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
                    rickStage === 'hijack_move' || rickStage === 'hijack_click'
                      ? 'bg-rose-950/20 shadow-[inset_0_0_120px_rgba(225,29,72,0.45)]'
                      : 'bg-black/20 shadow-[inset_0_0_90px_rgba(0,0,0,0.75)]'
                  }`}
                />

                {/* Desktop: Hijacked Fake OS Cursor | Mobile: iOS Ghost AssistiveTouch Orb */}
                <div
                  className="fixed top-0 left-0 pointer-events-none z-[9995]"
                  style={{
                    transform: isMobile
                      ? `translate3d(${Math.round(hijackCursorPos.x - 24)}px, ${Math.round(hijackCursorPos.y - 24)}px, 0)`
                      : `translate3d(${Math.round(hijackCursorPos.x)}px, ${Math.round(hijackCursorPos.y)}px, 0)`,
                  }}
                >
                  {isMobile ? (
                    rickStage !== 'story_1' && (
                      <div className="relative flex flex-col items-center">
                        {rickStage === 'hijack_click' && (
                          <span className="absolute inset-0 rounded-full border-2 border-rose-400 animate-ping" />
                        )}
                        <div
                          className={`w-12 h-12 rounded-2xl bg-slate-900/80 backdrop-blur-md border-2 flex items-center justify-center shadow-[0_0_24px_rgba(244,63,94,0.8)] transition-transform ${
                            rickStage === 'hijack_click'
                              ? 'scale-75 border-white'
                              : 'scale-100 border-rose-400/90'
                          }`}
                        >
                          <div className="w-6 h-6 rounded-full bg-white/90 ring-4 ring-rose-500/45 shadow-inner" />
                        </div>
                        <div className="mt-1.5 px-2 py-0.5 rounded-full bg-rose-600/95 border border-rose-300/60 text-[10px] font-mono-tabular font-bold text-white whitespace-nowrap shadow-lg">
                          TOUCH_OVERRIDE
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="relative">
                      {rickStage === 'hijack_click' && (
                        <span className="absolute -left-3 -top-3 w-7 h-7 rounded-full border-2 border-rose-400 animate-ping" />
                      )}
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        className={`drop-shadow-[0_2px_8px_rgba(244,63,94,0.85)] transition-transform ${
                          rickStage === 'hijack_click' ? 'scale-90' : 'scale-100'
                        }`}
                      >
                        <path
                          d="M3 2L19 13L11.5 14.5L15 21.5L12.2 22.8L8.8 15.8L3.5 19.5Z"
                          fill="#ffffff"
                          stroke="#09090b"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {(rickStage === 'hijack_move' || rickStage === 'hijack_click') && (
                        <div className="ml-4 -mt-1 px-1.5 py-0.5 rounded bg-rose-600/95 border border-rose-300/60 text-[10px] font-mono-tabular font-bold text-white whitespace-nowrap shadow-lg">
                          HID_LOCKED
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Horror Mini-Story Subtitle Box (tailored for Desktop vs iPhone) */}
                <div className="fixed bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 w-[92%] max-w-xl pointer-events-none z-[9994]">
                  <div className="rounded-2xl border border-rose-500/45 bg-slate-950/92 backdrop-blur-md px-5 py-4 shadow-2xl space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono-tabular">
                      <span className="text-rose-400 font-bold tracking-wider uppercase">
                        {isMobile
                          ? rickStage === 'story_1'
                            ? '● Safary 脚本阻塞'
                            : rickStage === 'story_2'
                              ? '● 检测到幽灵触控点'
                              : '● 屏幕触控权已被 0x000000 接管'
                          : rickStage === 'story_1'
                            ? '● 异常脚本阻塞'
                            : rickStage === 'story_2'
                              ? '● 指针异常偏移'
                              : '● HID 鼠标控制权已被 0x000000 接管'}
                      </span>
                      <span className="text-slate-500">
                        {isMobile ? '触屏已锁定' : '请勿触碰输入设备'}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed">
                      {isMobile ? (
                        <>
                          {rickStage === 'story_1' &&
                            '「刚点开这首传闻中的“减压神曲”，Safary 却像被冻住了一样，划不动屏幕了……」'}
                          {rickStage === 'story_2' &&
                            '「等等……你的手指明明没有碰手机。屏幕怎么自己浮现出一个发抖的小白点？」'}
                          {rickStage === 'hijack_move' &&
                            '「别抢手机控制权——那个幽灵触控点在自己滑向视频播放键！」'}
                          {rickStage === 'hijack_click' &&
                            '「*啪* —— 幽灵触点直接按下了播放键！！」'}
                        </>
                      ) : (
                        <>
                          {rickStage === 'story_1' &&
                            '「刚点开这首传闻中的“减压神曲”，浏览器的加载条却突然像被冻住了一样……」'}
                          {rickStage === 'story_2' &&
                            '「等等……你的手明明已经离开鼠标了。屏幕上的指针，为什么自己在发抖？」'}
                          {rickStage === 'hijack_move' &&
                            '「别过去——鼠标已经不受你控制了，它在自己移向那个播放键！」'}
                          {rickStage === 'hijack_click' &&
                            '「*咔哒* —— 播放按钮被按下了！！」'}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
