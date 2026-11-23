import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ENDINGS, GOOD_ENDING_IDS } from '../data/endings';
import {
  DEFAULT_BOOKMARKS,
  DESKTOP_ANOMALIES,
  DOOM_CHAT_SCRIPT,
  EMAIL_TEMPLATES,
  INITIAL_BLUETOOTH_DEVICES,
  INITIAL_CHAT_MESSAGES,
  MORSE_SIGNALS,
  RESCUE_CHAT_SCRIPT,
  SEARCH_CATALOG,
  STORE_CATALOG,
  WIKI_SECTIONS,
} from '../data/worldData';
import {
  AppId,
  BluetoothDevice,
  BrowserBookmark,
  BrowserDownloadItem,
  BrowserHistoryEntry,
  BrowserInstanceState,
  BrowserSubTab,
  BrowserTabView,
  ChatBubbleItem,
  DesktopAnomaly,
  EndingId,
  GamePhase,
  NotepadEntry,
  PrivacySettings,
  StoreAppId,
  SystemSettings,
  ToastNotification,
  UserProfile,
  WindowInstance,
  WindowRect,
} from '../types/game';
import { soundEngine } from '../utils/audio';
import { computeSystemMetrics, SystemMetricsSnapshot } from '../utils/systemMetrics';

const STORAGE_KEYS = {
  ENDINGS: 'pseudo_v3_unlocked_endings',
  SETTINGS: 'pseudo_v3_settings',
  USER: 'pseudo_v3_user',
  STATS: 'pseudo_v3_stats',
  PINNED_TASKBAR: 'pseudo_v3_pinned_taskbar',
};

const DEFAULT_PINNED_TASKBAR: AppId[] = ['browser', 'email', 'store', 'settings'];

const DEFAULT_PRIVACY: PrivacySettings = {
  firewallEnabled: false,
  privacyEnabled: false,
  antivirusEnabled: false,
  dnsEnabled: false,
};

const DEFAULT_SYSTEM: SystemSettings = {
  sound: true,
  soundVolume: 55,
  notifications: true,
  animations: true,
  crtEffect: true,
  photosensitiveSafe: false,
  theme: 'dark',
  accentColor: '#38bdf8',
  bluetooth: false,
  brightness: 100,
  nightLight: false,
  powerMode: 'balanced',
  doNotDisturb: false,
  haptics: true,
};

function isEndedOrStory(p: GamePhase): boolean {
  return p === 'ENDED' || p === 'ENDING_STORY' || p === 'CRASH_SEQUENCE';
}

const DEFAULT_USER: UserProfile = {
  name: '林深',
  avatar: '👤',
  email: 'linshen@night-node.net',
};

const APP_TITLES: Record<AppId, string> = {
  browser: 'Edge 深网浏览器',
  email: '邮件箱',
  notepad: '记事本',
  settings: '系统设置',
  security: 'Windows 安全中心',
  news: '城市晚间新闻',
  chat: '相亲相爱一家人',
  achievements: '结局图鉴 (40)',
  terminal: '系统诊断终端',
  store: 'Microsoft Store',
  morse: '摩斯密码破译器',
  taskmgr: '任务管理器',
  vscode: 'Visual Studio Code',
  monitor: '资源监视器',
  radio: '午夜电波 FM',
  files: '深层文件箱',
};

const STORE_APP_IDS: StoreAppId[] = ['vscode', 'monitor', 'radio', 'files'];

function isStoreAppId(id: AppId): id is StoreAppId {
  return (STORE_APP_IDS as string[]).includes(id);
}

function getRadioStationMode(freq: number): 'static' | 'rain' | 'news' | 'numbers' | 'taboo' {
  if (Math.abs(freq - 91.4) <= 0.25) return 'rain';
  if (Math.abs(freq - 96.8) <= 0.25) return 'news';
  if (Math.abs(freq - 104.2) <= 0.25) return 'numbers';
  if (Math.abs(freq - 107.9) <= 0.25) return 'taboo';
  return 'static';
}

const DRIVER_PATCH_TEMPLATE: BrowserDownloadItem = {
  id: 'dl_patch',
  filename: 'HR_Cam_Patch_v2.exe',
  size: '4.8 MB',
  source: 'https://pseudo-jobs.dark/driver-patch',
  dangerous: true,
  executed: false,
};

function createCascadeRect(offsetIndex: number, appId?: AppId): WindowRect {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
  const isWide =
    appId === 'browser' ||
    appId === 'achievements' ||
    appId === 'settings' ||
    appId === 'store' ||
    appId === 'vscode' ||
    appId === 'taskmgr';
  const baseW = isWide ? 840 : 660;
  const baseH = isWide ? 600 : 480;
  const width = Math.min(baseW, Math.max(360, vw - 160));
  const height = Math.min(baseH, Math.max(320, vh - 96));
  const x = Math.max(128, Math.min(vw - width - 24, 144 + (offsetIndex % 6) * 30));
  const y = Math.max(20, Math.min(vh - height - 68, 44 + (offsetIndex % 6) * 26));
  return { x, y, width, height };
}

function getTabTitle(entry: BrowserHistoryEntry): string {
  switch (entry.tab) {
    case 'wiki':
      return '异常观察 Wiki';
    case 'jobs':
      return '高薪兼职招聘';
    case 'job_detail':
      return '职位详情';
    case 'apply_result':
      return '端口握手状态';
    case 'ritual':
      return '数字驱逐仪式';
    case 'code_truth':
      return '运行时源码';
    case 'lore_article':
      return entry.query || '网页档案';
    case 'invasion':
      return '警告: 0x000000';
    case 'rickroll':
      return 'YouTube - Never Gonna...';
    case 'live_web':
      try {
        return new URL(entry.liveUrl || entry.query).hostname;
      } catch {
        return entry.query || '外部网页';
      }
    case 'void_404':
      return '404.void';
    case 'omega':
      return 'internal://omega';
    case 'search_results':
      return `搜索: ${entry.query}`;
    default:
      return '新标签页';
  }
}

function createSubTab(initialQuery = ''): BrowserSubTab {
  const q = initialQuery.trim();
  const isUrl = q ? looksLikeUrl(q) : false;
  const entry: BrowserHistoryEntry = {
    tab: q
      ? isUrl && q.toLowerCase().includes('wiki.deepnet.local')
        ? 'wiki'
        : isUrl
          ? 'live_web'
          : 'search_results'
      : 'home',
    query: q,
    selectedJobId: null,
    activeArticleId: null,
    activeWikiId: WIKI_SECTIONS[0].id,
    liveUrl: isUrl ? normalizeWebUrl(q) : undefined,
  };
  return {
    tabId: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: getTabTitle(entry),
    ...entry,
    history: [entry],
    historyIndex: 0,
  };
}

function createInitialBrowserState(initialQuery = ''): BrowserInstanceState {
  const firstTab = createSubTab(initialQuery);
  return {
    tab: firstTab.tab,
    query: firstTab.query,
    selectedJobId: firstTab.selectedJobId,
    activeArticleId: firstTab.activeArticleId,
    activeWikiId: firstTab.activeWikiId,
    liveUrl: firstTab.liveUrl,
    history: firstTab.history,
    historyIndex: firstTab.historyIndex,
    tabs: [firstTab],
    activeTabId: firstTab.tabId,
  };
}

function syncActiveTabFields(bs: BrowserInstanceState, tabs: BrowserSubTab[], activeTabId: string): BrowserInstanceState {
  const active = tabs.find((t) => t.tabId === activeTabId) ?? tabs[0];
  return {
    tab: active.tab,
    query: active.query,
    selectedJobId: active.selectedJobId,
    activeArticleId: active.activeArticleId,
    activeWikiId: active.activeWikiId,
    liveUrl: active.liveUrl,
    history: active.history,
    historyIndex: active.historyIndex,
    tabs,
    activeTabId: active.tabId,
  };
}

function looksLikeUrl(input: string): boolean {
  if (/^(https?|internal|alert):\/\//i.test(input)) return true;
  if (/^(about:blank|404\.void)$/i.test(input)) return true;
  if (!input.includes(' ') && /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(:\d+)?(\/.*)?$/.test(input)) {
    return true;
  }
  return false;
}

function normalizeWebUrl(input: string): string {
  if (/^https?:\/\//i.test(input)) return input;
  return `https://${input}`;
}

interface GameContextValue {
  phase: GamePhase;
  step: number;
  sanity: number;
  isOnline: boolean;
  questText: string;
  currentEndingId: EndingId | null;
  unlockedEndings: EndingId[];
  goodEndingsCount: number;
  totalRuns: number;

  privacy: PrivacySettings;
  system: SystemSettings;
  user: UserProfile;
  clockTime: Date;
  isMidnight: boolean;

  jobApplied: boolean;
  appliedJobId: number | null;
  emailWarningReceived: boolean;
  readEmailIds: string[];
  discoveredLore: string[];
  searchCount: number;
  mirrorInspectCount: number;
  casualChatCount: number;
  mirrorLogRead: boolean;
  predictionText: string;
  notepadEntries: NotepadEntry[];
  coffeeCharges: number;
  breatheCharges: number;
  cameraModalOpen: boolean;
  cameraDenyCount: number;
  cameraScanResult: string | null;
  toggleCount: number;
  globalDoomTriggered: boolean;
  newsChoice: 'none' | 'rescue' | 'doom';
  chatMessages: ChatBubbleItem[];
  chatSequenceStarted: boolean;
  activeAnomaly: DesktopAnomaly | null;
  desktopShake: boolean;
  invasionLocked: boolean;
  bookmarks: BrowserBookmark[];
  downloads: BrowserDownloadItem[];
  pinnedTaskbarApps: AppId[];
  bluetoothDevices: BluetoothDevice[];
  bluetoothScanning: boolean;
  decodedMorseIds: string[];
  systemMetrics: SystemMetricsSnapshot;

  installedApps: StoreAppId[];
  downloadingApps: Partial<Record<StoreAppId, number>>;
  openedStoreApps: StoreAppId[];
  suspendedDaemon: boolean;
  vscodePatches: [boolean, boolean, boolean];
  vscodeGodMode: boolean;
  vscodeCorruptExt: boolean;
  radioFreq: number;
  radioPlaying: boolean;
  radioUnlockedFreqs: string[];
  radioRainHealed: boolean;
  shreddedFiles: string[];

  emailBadge: number;
  newsBadge: boolean;
  chatBadge: boolean;
  toasts: ToastNotification[];
  windowInstances: WindowInstance[];
  focusedInstanceId: string | null;
  bootedInstanceIds: string[];
  startMenuOpen: boolean;
  quickSettingsOpen: boolean;

  setStartMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setQuickSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setMirrorLogRead: React.Dispatch<React.SetStateAction<boolean>>;
  markInstanceBooted: (instanceId: string) => void;
  openApp: (appId: AppId, opts?: { forceNew?: boolean; initialQuery?: string }) => void;
  toggleTaskbarApp: (appId: AppId) => void;
  togglePinTaskbarApp: (appId: AppId) => void;
  closeAllAppWindows: (appId: AppId) => void;
  focusInstance: (instanceId: string) => void;
  closeInstance: (instanceId: string) => void;
  minimizeInstance: (instanceId: string) => void;
  toggleMaximizeInstance: (instanceId: string) => void;
  updateInstanceRect: (instanceId: string, rect: WindowRect) => void;
  resetInstanceRect: (instanceId: string) => void;
  snapInstance: (instanceId: string, mode: 'left' | 'right' | 'center') => void;
  cascadeAllWindows: () => void;
  minimizeAllWindows: () => void;

  notify: (message: string, type?: ToastNotification['type']) => void;
  dismissToast: (id: string) => void;
  toggleNetwork: () => void;
  toggleBluetooth: () => void;
  scanBluetoothDevices: () => void;
  toggleBluetoothConnection: (deviceId: string) => void;
  togglePrivacyFlag: (key: keyof PrivacySettings) => void;
  updateSystem: (patch: Partial<SystemSettings>) => void;
  updateUser: (patch: Partial<UserProfile>) => void;
  setClockToMidnight: () => void;
  setClockToMorning: () => void;
  advanceClockMinutes: (delta: number) => void;
  resetClock: () => void;

  addBrowserTab: (instanceId: string, initialQuery?: string) => void;
  switchBrowserTab: (instanceId: string, tabId: string) => void;
  closeBrowserTab: (instanceId: string, tabId: string) => void;
  toggleBookmark: (label: string, url: string) => void;
  downloadDriverPatch: () => void;
  executeDownloadItem: (id: string) => void;

  navigateBrowser: (
    instanceId: string,
    tab: BrowserTabView,
    opts?: {
      query?: string;
      jobId?: number | null;
      activeArticleId?: string | null;
      activeWikiId?: string;
      liveUrl?: string;
    }
  ) => void;
  browserBack: (instanceId: string) => void;
  browserForward: (instanceId: string) => void;
  performBrowserSearch: (instanceId: string, query: string) => void;
  openSearchArticle: (instanceId: string, articleId: string) => void;
  selectWikiSection: (instanceId: string, wikiId: string) => void;
  applyForJob: (instanceId: string, jobId: number) => void;
  escalateToInvasion: (instanceId?: string) => void;
  handleCameraAllow: () => void;
  handleCameraDeny: () => void;
  closeCameraModal: () => void;
  performRitual: () => void;
  executeCodeTruth: () => void;
  publishSurvivalGuide: () => void;
  triggerRickrollEnding: () => void;
  triggerBrowserOverload: () => void;
  triggerTerminalAwaken: () => void;
  triggerOmegaEnding: () => void;

  installStoreApp: (id: StoreAppId) => void;
  uninstallStoreApp: (id: StoreAppId) => void;
  toggleVscodePatch: (idx: 0 | 1 | 2) => void;
  setVscodeGodMode: (val: boolean) => void;
  toggleVscodeCorruptExt: () => void;
  compileVscodeHotfix: () => string;
  runCorruptVscodeSample: () => void;
  suspendDaemonProcess: () => void;
  triggerKernelMeltdown: () => void;
  tuneRadioFreq: (freq: number) => void;
  toggleRadioPlay: (playing?: boolean) => void;
  healWithRadioRain: () => void;
  triggerRadioAssimilation: () => void;
  triggerEmergencyBroadcast: () => void;
  triggerStoreGeekNight: () => void;
  shredCorruptedFile: (fileId: string) => void;
  submitMorseDecode: (signalId: string, decodedText: string) => boolean;
  sendMorseCounterPulse: () => void;
  transmitMorseCode: (text: string) => void;
  auditAndTerminateDaemon: () => void;

  markEmailRead: (emailId: string) => void;
  joinVideoInterview: () => void;
  decryptTruthDossier: () => void;
  inscribePrediction: (text: string) => void;
  addCustomNote: (text: string) => void;
  restTonight: () => void;
  drinkCoffee: () => void;
  deepBreathe: () => void;
  purgeThreatsInSecurity: () => void;
  submitSecurityReport: () => void;
  chooseNewsBranch: (choice: 'rescue' | 'doom') => void;
  sendCasualChatReply: (text: string) => void;
  resolveAnomaly: (action: 'block' | 'ignore') => void;

  triggerJumpscareEnding: () => void;
  completeEndingStory: () => void;
  shutdownSystem: () => void;
  startGameSequence: () => void;
  setBootPhase: (next: 'WARNING' | 'PROLOGUE' | 'PLAYING') => void;
  returnToTitle: () => void;
  resetRun: () => void;
  factoryResetAll: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

/** Keep window z-index strictly inside [10..40] so system modals (z-9000+) always sit on top */
function normalizeWindowZIndices(list: WindowInstance[], promoteId?: string): WindowInstance[] {
  const sorted = [...list].sort((a, b) => a.zIndex - b.zIndex);
  const reordered = promoteId
    ? [...sorted.filter((w) => w.instanceId !== promoteId), ...sorted.filter((w) => w.instanceId === promoteId)]
    : sorted;
  return reordered.map((w, idx) => ({
    ...w,
    zIndex: 12 + idx,
    isMinimized: w.instanceId === promoteId ? false : w.isMinimized,
  }));
}

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phase, setPhase] = useState<GamePhase>('TITLE');
  const [step, setStep] = useState(0);
  const [sanity, setSanity] = useState(100);
  const [isOnline, setIsOnline] = useState(true);
  const [questText, setQuestText] = useState('房租快到期了，打开「浏览器」看看兼职，或访问「Wiki」了解传闻');
  const [currentEndingId, setCurrentEndingId] = useState<EndingId | null>(null);

  const [unlockedEndings, setUnlockedEndings] = useState<EndingId[]>(() =>
    loadJson<EndingId[]>(STORAGE_KEYS.ENDINGS, [])
  );
  const [totalRuns, setTotalRuns] = useState<number>(() =>
    loadJson<number>(STORAGE_KEYS.STATS, 1)
  );

  const [privacy, setPrivacy] = useState<PrivacySettings>(DEFAULT_PRIVACY);
  const [system, setSystem] = useState<SystemSettings>(() => ({
    ...DEFAULT_SYSTEM,
    ...loadJson<Partial<SystemSettings>>(STORAGE_KEYS.SETTINGS, {}),
  }));
  const [user, setUser] = useState<UserProfile>(() => ({
    ...DEFAULT_USER,
    ...loadJson<Partial<UserProfile>>(STORAGE_KEYS.USER, {}),
  }));

  const [clockOffsetMinutes, setClockOffsetMinutes] = useState(0);
  const [nowTick, setNowTick] = useState(() => new Date());

  const [jobApplied, setJobApplied] = useState(false);
  const [appliedJobId, setAppliedJobId] = useState<number | null>(null);
  const [emailWarningReceived, setEmailWarningReceived] = useState(false);
  const [readEmailIds, setReadEmailIds] = useState<string[]>([]);
  const [discoveredLore, setDiscoveredLore] = useState<string[]>([]);
  const [searchCount, setSearchCount] = useState(0);
  const [mirrorInspectCount, setMirrorInspectCount] = useState(0);
  const [casualChatCount, setCasualChatCount] = useState(0);
  const [mirrorLogRead, setMirrorLogRead] = useState(false);
  const [predictionText, setPredictionText] = useState('');
  const [notepadEntries, setNotepadEntries] = useState<NotepadEntry[]>([
    {
      id: 'init-1',
      time: '23:50',
      text: '房租明天到期，今晚得在网上找份高薪兼职。如果遇到奇怪的事情，可以去浏览器搜搜 Wiki。',
      kind: 'user',
    },
  ]);
  const [coffeeCharges, setCoffeeCharges] = useState(2);
  const [breatheCharges, setBreatheCharges] = useState(1);

  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraDenyCount, setCameraDenyCount] = useState(0);
  const [cameraScanResult, setCameraScanResult] = useState<string | null>(null);
  const [toggleCount, setToggleCount] = useState(0);

  const [globalDoomTriggered, setGlobalDoomTriggered] = useState(false);
  const [newsChoice, setNewsChoice] = useState<'none' | 'rescue' | 'doom'>('none');
  const [chatMessages, setChatMessages] = useState<ChatBubbleItem[]>(INITIAL_CHAT_MESSAGES);
  const [chatSequenceStarted, setChatSequenceStarted] = useState(false);

  const [activeAnomaly, setActiveAnomaly] = useState<DesktopAnomaly | null>(null);
  const [desktopShake, setDesktopShake] = useState(false);
  const [invasionLocked, setInvasionLocked] = useState(false);
  const [bookmarks, setBookmarks] = useState<BrowserBookmark[]>(DEFAULT_BOOKMARKS);
  const [downloads, setDownloads] = useState<BrowserDownloadItem[]>([]);
  const [pinnedTaskbarApps, setPinnedTaskbarApps] = useState<AppId[]>(() =>
    loadJson<AppId[]>(STORAGE_KEYS.PINNED_TASKBAR, DEFAULT_PINNED_TASKBAR)
  );
  const [bluetoothDevices, setBluetoothDevices] = useState<BluetoothDevice[]>(
    INITIAL_BLUETOOTH_DEVICES
  );
  const [bluetoothScanning, setBluetoothScanning] = useState(false);
  const [decodedMorseIds, setDecodedMorseIds] = useState<string[]>([]);

  const [installedApps, setInstalledApps] = useState<StoreAppId[]>([]);
  const [downloadingApps, setDownloadingApps] = useState<Partial<Record<StoreAppId, number>>>({});
  const [openedStoreApps, setOpenedStoreApps] = useState<StoreAppId[]>([]);
  const [suspendedDaemon, setSuspendedDaemon] = useState(false);
  const [vscodePatches, setVscodePatches] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [vscodeGodMode, setVscodeGodMode] = useState(false);
  const [vscodeCorruptExt, setVscodeCorruptExt] = useState(false);
  const [radioFreq, setRadioFreq] = useState(91.4);
  const [radioPlaying, setRadioPlaying] = useState(false);
  const [radioUnlockedFreqs, setRadioUnlockedFreqs] = useState<string[]>([]);
  const [radioRainHealed, setRadioRainHealed] = useState(false);
  const [shreddedFiles, setShreddedFiles] = useState<string[]>([]);

  const [emailBadge, setEmailBadge] = useState(1);
  const [newsBadge, setNewsBadge] = useState(false);
  const [chatBadge, setChatBadge] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [windowInstances, setWindowInstances] = useState<WindowInstance[]>([]);
  const [focusedInstanceId, setFocusedInstanceId] = useState<string | null>(null);
  const [bootedInstanceIds, setBootedInstanceIds] = useState<string[]>([]);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [quickSettingsOpen, setQuickSettingsOpen] = useState(false);

  const instanceCounterRef = useRef(1);
  const chatTimerRef = useRef<number | null>(null);
  const jumpscareTimerRef = useRef<number | null>(null);
  const crashTimerRef = useRef<number | null>(null);
  const storeTimersRef = useRef<number[]>([]);
  const morningWarnedRef = useRef(false);
  const ramWarnedRef = useRef(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const sanityRef = useRef(sanity);
  sanityRef.current = sanity;
  const stepRef = useRef(step);
  stepRef.current = step;
  const isOnlineRef = useRef(isOnline);
  isOnlineRef.current = isOnline;
  const privacyRef = useRef(privacy);
  privacyRef.current = privacy;
  const suspendedDaemonRef = useRef(suspendedDaemon);
  suspendedDaemonRef.current = suspendedDaemon;

  useEffect(() => {
    soundEngine.setConfig(system.sound, system.soundVolume);
    saveJson(STORAGE_KEYS.SETTINGS, system);
  }, [system]);

  useEffect(() => {
    saveJson(STORAGE_KEYS.USER, user);
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;
    if (system.theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    root.style.setProperty('--accent-color', system.accentColor);
  }, [system.theme, system.accentColor]);

  useEffect(() => {
    const base = Math.max(0, (100 - sanity) / 100);
    const intensity = step >= 2 ? Math.max(base, 0.55) : base;
    document.documentElement.style.setProperty('--horror-intensity', intensity.toFixed(2));
  }, [sanity, step]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const clockTime = useMemo(
    () => new Date(nowTick.getTime() + clockOffsetMinutes * 60000),
    [nowTick, clockOffsetMinutes]
  );

  const isMidnight = useMemo(() => {
    const h = clockTime.getHours();
    const m = clockTime.getMinutes();
    return (h === 23 && m >= 55) || (h === 0 && m <= 5);
  }, [clockTime]);

  const goodEndingsCount = useMemo(
    () => GOOD_ENDING_IDS.filter((id) => unlockedEndings.includes(id)).length,
    [unlockedEndings]
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, type: ToastNotification['type'] = 'info') => {
      if (!system.notifications) return;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    [system.notifications]
  );

  const appendNote = useCallback((text: string, kind: NotepadEntry['kind'] = 'clue') => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setNotepadEntries((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, time, text, kind }]);
  }, []);

  const triggerEnding = useCallback((id: EndingId, opts?: { allowFromCrash?: boolean }) => {
    const cur = phaseRef.current;
    if (cur === 'ENDED' || cur === 'ENDING_STORY') return;
    if (cur === 'CRASH_SEQUENCE' && !opts?.allowFromCrash) return;
    phaseRef.current = 'ENDING_STORY';
    setPhase('ENDING_STORY');
    setCurrentEndingId(id);
    setInvasionLocked(false);
    setCameraModalOpen(false);
    setActiveAnomaly(null);
    setStartMenuOpen(false);
    setQuickSettingsOpen(false);
    setRadioPlaying(false);
    soundEngine.stopRadioChannel();
    if (chatTimerRef.current) {
      window.clearInterval(chatTimerRef.current);
      chatTimerRef.current = null;
    }
    if (crashTimerRef.current) {
      window.clearTimeout(crashTimerRef.current);
      crashTimerRef.current = null;
    }

    soundEngine.playNotification();

    setUnlockedEndings((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveJson(STORAGE_KEYS.ENDINGS, next);
      return next;
    });
  }, []);

  const triggerMemoryCrash = useCallback(() => {
    if (isEndedOrStory(phaseRef.current) || phaseRef.current === 'JUMPSCARE') return;
    phaseRef.current = 'CRASH_SEQUENCE';
    setPhase('CRASH_SEQUENCE');
    setInvasionLocked(false);
    setCameraModalOpen(false);
    setActiveAnomaly(null);
    setStartMenuOpen(false);
    setQuickSettingsOpen(false);
    setRadioPlaying(false);
    soundEngine.stopRadioChannel();
    soundEngine.playError();
    if (chatTimerRef.current) {
      window.clearInterval(chatTimerRef.current);
      chatTimerRef.current = null;
    }
    if (crashTimerRef.current) window.clearTimeout(crashTimerRef.current);
    crashTimerRef.current = window.setTimeout(() => {
      triggerEnding(27, { allowFromCrash: true });
    }, 5000);
  }, [triggerEnding]);

  const completeEndingStory = useCallback(() => {
    if (phaseRef.current !== 'ENDING_STORY') return;
    phaseRef.current = 'ENDED';
    setPhase('ENDED');

    if (currentEndingId) {
      const def = ENDINGS[currentEndingId];
      if (def.category === 'good' || def.category === 'secret') {
        soundEngine.playSuccess();
      } else if (def.category === 'bad') {
        soundEngine.playError();
      } else {
        soundEngine.playNotification();
      }
    }
  }, [currentEndingId]);

  // Sanity 0 -> Ending #7 (深渊凝视) vs Ending #8 (无声失踪)
  useEffect(() => {
    if (phase !== 'PLAYING' && phase !== 'INVASION') return;
    if (sanity <= 0) {
      if (discoveredLore.length >= 1) {
        triggerEnding(7);
      } else {
        triggerEnding(8);
      }
    }
  }, [sanity, phase, discoveredLore.length, triggerEnding]);

  const startChatScript = useCallback(
    (branch: 'rescue' | 'doom') => {
      const script = branch === 'rescue' ? RESCUE_CHAT_SCRIPT : DOOM_CHAT_SCRIPT;
      let idx = 0;
      if (chatTimerRef.current) window.clearInterval(chatTimerRef.current);

      chatTimerRef.current = window.setInterval(() => {
        if (isEndedOrStory(phaseRef.current)) {
          if (chatTimerRef.current) window.clearInterval(chatTimerRef.current);
          return;
        }
        if (idx < script.length) {
          const msg = script[idx++];
          setChatMessages((prev) => [...prev, { ...msg, id: `script-${Date.now()}-${idx}` }]);
          if (branch === 'rescue') soundEngine.playNotification();
          else soundEngine.playError();
        } else {
          if (chatTimerRef.current) {
            window.clearInterval(chatTimerRef.current);
            chatTimerRef.current = null;
          }
          window.setTimeout(() => {
            if (!isEndedOrStory(phaseRef.current)) {
              triggerEnding(branch === 'rescue' ? 13 : 9);
            }
          }, 950);
        }
      }, 1250);
    },
    [triggerEnding]
  );

  const markInstanceBooted = useCallback((instanceId: string) => {
    setBootedInstanceIds((prev) => (prev.includes(instanceId) ? prev : [...prev, instanceId]));
  }, []);

  const openApp = useCallback(
    (appId: AppId, opts?: { forceNew?: boolean; initialQuery?: string }) => {
      if (isEndedOrStory(phaseRef.current)) return;
      if (isStoreAppId(appId) && !installedApps.includes(appId)) {
        soundEngine.playError();
        notify('请先在应用商店下载安装该应用', 'warning');
        appId = 'store';
      } else {
        soundEngine.playClick();
      }
      setStartMenuOpen(false);
      setQuickSettingsOpen(false);

      if (isStoreAppId(appId)) {
        const sid = appId;
        setOpenedStoreApps((prev) => (prev.includes(sid) ? prev : [...prev, sid]));
      }

      if (appId === 'email') setEmailBadge(0);
      if (appId === 'news') setNewsBadge(false);
      if (appId === 'chat') {
        setChatBadge(false);
        if (!chatSequenceStarted && newsChoice !== 'none' && globalDoomTriggered) {
          setChatSequenceStarted(true);
          startChatScript(newsChoice);
        }
      }

      setWindowInstances((prev) => {
        const existing = prev.filter((w) => w.appId === appId);
        if (!opts?.forceNew && existing.length > 0) {
          const target = existing[existing.length - 1];
          setFocusedInstanceId(target.instanceId);
          return normalizeWindowZIndices(prev, target.instanceId);
        }

        const seqNum = instanceCounterRef.current++;
        const instanceId = `${appId}-${seqNum}`;
        const sameAppCount = existing.length;
        const title =
          sameAppCount > 0 ? `${APP_TITLES[appId]} (${sameAppCount + 1})` : APP_TITLES[appId];

        const browserState =
          appId === 'browser' ? createInitialBrowserState(opts?.initialQuery ?? '') : undefined;

        const newInstance: WindowInstance = {
          instanceId,
          appId,
          title,
          isMinimized: false,
          isMaximized: false,
          zIndex: 99,
          rect: createCascadeRect(prev.length, appId),
          browserState,
        };
        setFocusedInstanceId(instanceId);
        return normalizeWindowZIndices([...prev, newInstance], instanceId);
      });
    },
    [installedApps, notify, chatSequenceStarted, newsChoice, globalDoomTriggered, startChatScript]
  );

  const systemMetrics = useMemo(
    () =>
      computeSystemMetrics({
        windowInstances,
        installedApps,
        step,
        suspendedDaemon,
      }),
    [windowInstances, installedApps, step, suspendedDaemon]
  );

  // Monitor 4.00 GB old-PC memory pressure from open apps / tabs -> 5s crash screen -> Ending #27
  useEffect(() => {
    if (phase !== 'PLAYING' && phase !== 'INVASION') {
      ramWarnedRef.current = false;
      return;
    }
    if (systemMetrics.memPercent >= 100) {
      notify('4.00 GB 物理内存彻底爆表，系统内核正在崩溃……', 'error');
      const t = window.setTimeout(() => {
        if (phaseRef.current === 'PLAYING' || phaseRef.current === 'INVASION') {
          triggerMemoryCrash();
        }
      }, 480);
      return () => window.clearTimeout(t);
    } else if (systemMetrics.memPercent >= 85) {
      if (!ramWarnedRef.current) {
        ramWarnedRef.current = true;
        notify(
          `老机内存告警：4.00 GB 内存已占用 ${systemMetrics.memPercent}%（${systemMetrics.totalUsedGb.toFixed(2)} GB），继续多开软件将崩溃`,
          'warning'
        );
      }
    } else if (systemMetrics.memPercent < 78) {
      ramWarnedRef.current = false;
    }
  }, [phase, systemMetrics.memPercent, systemMetrics.totalUsedGb, notify, triggerMemoryCrash]);

  // Breaking News trigger at sanity <= 75 when step >= 1
  useEffect(() => {
    if (
      (phase === 'PLAYING' || phase === 'INVASION') &&
      !globalDoomTriggered &&
      step >= 1 &&
      sanity <= 75 &&
      sanity > 0
    ) {
      setGlobalDoomTriggered(true);
      setNewsBadge(true);
      soundEngine.playError();
      notify('突发紧急新闻：城市出现大规模异常失踪事件，请立即查看「城市晚间新闻」', 'error');
      setQuestText('紧急新闻已弹出，请前往「城市晚间新闻」做出抉择');
      openApp('news');
    }
  }, [phase, globalDoomTriggered, step, sanity, notify, openApp]);

  // Passive sanity drain during unshielded online invasion (step >= 2)
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (
        (phaseRef.current === 'PLAYING' || phaseRef.current === 'INVASION') &&
        stepRef.current >= 2 &&
        isOnlineRef.current &&
        !privacyRef.current.firewallEnabled &&
        !suspendedDaemonRef.current
      ) {
        setSanity((prev) => Math.max(0, prev - 2));
      }
    }, 3200);
    return () => window.clearInterval(timer);
  }, []);

  // Periodic desktop anomaly popups during step >= 1 & online
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (
        (phaseRef.current !== 'PLAYING' && phaseRef.current !== 'INVASION') ||
        stepRef.current < 1 ||
        !isOnlineRef.current ||
        privacyRef.current.firewallEnabled ||
        suspendedDaemonRef.current ||
        system.doNotDisturb
      ) {
        return;
      }
      setActiveAnomaly((current) => {
        if (current) return current;
        const pick = DESKTOP_ANOMALIES[Math.floor(Math.random() * DESKTOP_ANOMALIES.length)];
        soundEngine.playNotification();
        return pick;
      });
    }, 24000);
    return () => window.clearInterval(timer);
  }, [system.doNotDisturb]);

  // Monitor 06:00 Dawn trigger (#26 晨光破晓) reliably whenever clock hits 06:00
  useEffect(() => {
    if (phase !== 'PLAYING' && phase !== 'INVASION') return;
    const h = clockTime.getHours();
    const m = clockTime.getMinutes();
    if (h === 6 && m <= 2) {
      if (clockOffsetMinutes === 0 && step === 0) return;
      if (!isOnline) {
        if (!morningWarnedRef.current) {
          morningWarnedRef.current = true;
          notify('清晨 06:00 已至，但当前处于断网状态，无法接入晨光校准协议', 'warning');
        }
        return;
      }
      if (sanity < 50) {
        if (!morningWarnedRef.current) {
          morningWarnedRef.current = true;
          notify('清晨 06:00 已至，但当前理智低于 50%，难以抗衡午夜残余侵蚀', 'warning');
        }
        return;
      }
      if (!morningWarnedRef.current) {
        morningWarnedRef.current = true;
        notify('第一缕清晨六点的阳光照进了房间……', 'success');
        const t = window.setTimeout(() => {
          if (!isEndedOrStory(phaseRef.current)) {
            triggerEnding(26);
          }
        }, 520);
        return () => window.clearTimeout(t);
      }
    } else {
      morningWarnedRef.current = false;
    }
  }, [phase, clockTime, clockOffsetMinutes, step, isOnline, sanity, notify, triggerEnding]);

  const focusInstance = useCallback((instanceId: string) => {
    if (isEndedOrStory(phaseRef.current)) return;
    setWindowInstances((prev) => normalizeWindowZIndices(prev, instanceId));
    setFocusedInstanceId(instanceId);
  }, []);

  const toggleTaskbarApp = useCallback(
    (appId: AppId) => {
      const matching = windowInstances.filter((w) => w.appId === appId);
      if (matching.length === 0) {
        openApp(appId);
        return;
      }
      const topMost = [...matching].sort((a, b) => b.zIndex - a.zIndex)[0];
      if (!topMost.isMinimized && focusedInstanceId === topMost.instanceId) {
        soundEngine.playClick();
        setWindowInstances((prev) =>
          prev.map((w) => (w.instanceId === topMost.instanceId ? { ...w, isMinimized: true } : w))
        );
      } else {
        focusInstance(topMost.instanceId);
        if (appId === 'email') setEmailBadge(0);
        if (appId === 'news') setNewsBadge(false);
        if (appId === 'chat') setChatBadge(false);
      }
    },
    [windowInstances, focusedInstanceId, openApp, focusInstance]
  );

  const closeInstance = useCallback((instanceId: string) => {
    soundEngine.playClick();
    setWindowInstances((prev) => {
      const next = prev.filter((w) => w.instanceId !== instanceId);
      const closedWin = prev.find((w) => w.instanceId === instanceId);
      if (closedWin?.appId === 'radio' && !next.some((w) => w.appId === 'radio')) {
        soundEngine.stopRadioChannel();
        setRadioPlaying(false);
      }
      return next;
    });
  }, []);

  const togglePinTaskbarApp = useCallback(
    (appId: AppId) => {
      soundEngine.playClick();
      const label = APP_TITLES[appId] ?? appId;
      setPinnedTaskbarApps((prev) => {
        const exists = prev.includes(appId);
        const next = exists ? prev.filter((id) => id !== appId) : [...prev, appId];
        saveJson(STORAGE_KEYS.PINNED_TASKBAR, next);
        notify(
          exists ? `已将「${label}」从任务栏取消固定` : `已将「${label}」固定到任务栏（跨周目保存）`,
          exists ? 'info' : 'success'
        );
        return next;
      });
    },
    [notify]
  );

  const closeAllAppWindows = useCallback((appId: AppId) => {
    soundEngine.playClick();
    setWindowInstances((prev) => {
      const next = prev.filter((w) => w.appId !== appId);
      if (appId === 'radio') {
        soundEngine.stopRadioChannel();
        setRadioPlaying(false);
      }
      return next;
    });
  }, []);

  const minimizeInstance = useCallback((instanceId: string) => {
    soundEngine.playClick();
    setWindowInstances((prev) =>
      prev.map((w) => (w.instanceId === instanceId ? { ...w, isMinimized: true } : w))
    );
  }, []);

  const toggleMaximizeInstance = useCallback((instanceId: string) => {
    soundEngine.playClick();
    setWindowInstances((prev) =>
      normalizeWindowZIndices(
        prev.map((w) =>
          w.instanceId === instanceId ? { ...w, isMaximized: !w.isMaximized } : w
        ),
        instanceId
      )
    );
    setFocusedInstanceId(instanceId);
  }, []);

  const updateInstanceRect = useCallback((instanceId: string, rect: WindowRect) => {
    setWindowInstances((prev) =>
      prev.map((w) => (w.instanceId === instanceId ? { ...w, rect } : w))
    );
  }, []);

  const resetInstanceRect = useCallback((instanceId: string) => {
    setWindowInstances((prev) =>
      prev.map((w, idx) =>
        w.instanceId === instanceId
          ? { ...w, isMaximized: false, rect: createCascadeRect(idx, w.appId) }
          : w
      )
    );
  }, []);

  const snapInstance = useCallback(
    (instanceId: string, mode: 'left' | 'right' | 'center') => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const gap = 8;
      const usableH = vh - 64;
      let rect: WindowRect;
      if (mode === 'left') {
        rect = { x: gap, y: gap, width: Math.floor(vw / 2) - gap * 1.5, height: usableH };
      } else if (mode === 'right') {
        const w = Math.floor(vw / 2) - gap * 1.5;
        rect = { x: vw - w - gap, y: gap, width: w, height: usableH };
      } else {
        const w = Math.min(820, vw - 80);
        const h = Math.min(580, usableH - 40);
        rect = { x: Math.floor((vw - w) / 2), y: Math.floor((usableH - h) / 2), width: w, height: h };
      }
      setWindowInstances((prev) =>
        normalizeWindowZIndices(
          prev.map((w) =>
            w.instanceId === instanceId
              ? { ...w, isMaximized: false, isMinimized: false, rect }
              : w
          ),
          instanceId
        )
      );
      setFocusedInstanceId(instanceId);
    },
    []
  );

  const cascadeAllWindows = useCallback(() => {
    soundEngine.playClick();
    setWindowInstances((prev) =>
      prev.map((w, idx) => ({
        ...w,
        isMinimized: false,
        isMaximized: false,
        zIndex: 12 + idx,
        rect: createCascadeRect(idx, w.appId),
      }))
    );
  }, []);

  const minimizeAllWindows = useCallback(() => {
    soundEngine.playClick();
    setWindowInstances((prev) => prev.map((w) => ({ ...w, isMinimized: true })));
  }, []);

  // Network toggle -> Ending #2 (断网避难) or Ending #22 (数字极简主义者)
  const toggleNetwork = useCallback(() => {
    if (isEndedOrStory(phase)) return;
    const nextOnline = !isOnline;
    setIsOnline(nextOnline);
    if (!nextOnline) {
      soundEngine.playNotification();
      notify('已断开网络连接，外部数据通道已关闭', 'info');
      if (step >= 1 || jobApplied) {
        triggerEnding(2);
      } else if (
        privacy.firewallEnabled &&
        privacy.privacyEnabled &&
        privacy.antivirusEnabled &&
        privacy.dnsEnabled
      ) {
        triggerEnding(22);
      }
    } else {
      soundEngine.playClick();
      notify('网络已重新连接', 'info');
    }
  }, [phase, isOnline, step, jobApplied, privacy, notify, triggerEnding]);

  // Privacy switches -> Ending #16 (双重人格) at 40..60 sanity with 4 toggles
  const togglePrivacyFlag = useCallback(
    (key: keyof PrivacySettings) => {
      soundEngine.playClick();
      const nextVal = !privacy[key];
      setPrivacy((prev) => ({ ...prev, [key]: nextVal }));
      const labels: Record<keyof PrivacySettings, string> = {
        firewallEnabled: 'Windows 防火墙',
        privacyEnabled: '隐私保护模式',
        antivirusEnabled: '实时病毒防护',
        dnsEnabled: 'DNS 加密',
      };
      notify(`${labels[key]}已${nextVal ? '开启' : '关闭'}`, nextVal ? 'success' : 'warning');

      if (sanity >= 40 && sanity <= 60 && !isEndedOrStory(phase)) {
        const nextCount = toggleCount + 1;
        setToggleCount(nextCount);
        if (nextCount === 1) {
          notify('……刚才拨动开关的，真的是你吗？(1/4)', 'warning');
        } else if (nextCount === 2) {
          notify('视野边缘似乎出现了另一个倒影……(2/4)', 'warning');
        } else if (nextCount === 3) {
          notify('别再继续拨动了，快停下……(3/4)', 'warning');
        } else if (nextCount >= 4) {
          triggerEnding(16);
        }
      }
    },
    [privacy, sanity, toggleCount, phase, notify, triggerEnding]
  );

  const updateSystem = useCallback((patch: Partial<SystemSettings>) => {
    setSystem((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateUser = useCallback((patch: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...patch }));
  }, []);

  const setClockToMidnight = useCallback(() => {
    const real = new Date();
    const target = new Date(real);
    target.setHours(0, 0, 0, 0);
    if (target.getTime() < real.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    setClockOffsetMinutes(Math.round((target.getTime() - real.getTime()) / 60000));
    soundEngine.playNotification();
    notify('系统时间已调整至 00:00', 'info');
  }, [notify]);

  // #26 晨光破晓
  const setClockToMorning = useCallback(() => {
    const real = new Date();
    const target = new Date(real);
    target.setHours(6, 0, 0, 0);
    if (target.getTime() < real.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    morningWarnedRef.current = false;
    setClockOffsetMinutes(Math.round((target.getTime() - real.getTime()) / 60000));
    soundEngine.playNotification();
    notify('系统时间已调整至清晨 06:00', 'info');
  }, [notify]);

  const advanceClockMinutes = useCallback(
    (delta: number) => {
      morningWarnedRef.current = false;
      setClockOffsetMinutes((prev) => prev + delta);
      soundEngine.playClick();
    },
    []
  );

  const resetClock = useCallback(() => {
    morningWarnedRef.current = false;
    setClockOffsetMinutes(0);
    soundEngine.playClick();
    notify('系统时间已与网络同步', 'info');
  }, [notify]);

  const toggleBluetooth = useCallback(() => {
    soundEngine.playClick();
    setSystem((prev) => {
      const nextBt = !prev.bluetooth;
      notify(nextBt ? '蓝牙适配器已开启' : '蓝牙已关闭', nextBt ? 'info' : 'warning');
      if (!nextBt) {
        setBluetoothDevices((devs) => devs.map((d) => ({ ...d, connected: false })));
      }
      return { ...prev, bluetooth: nextBt };
    });
  }, [notify]);

  const scanBluetoothDevices = useCallback(() => {
    if (!system.bluetooth) {
      soundEngine.playError();
      notify('请先开启蓝牙开关再扫描附近设备', 'warning');
      return;
    }
    if (bluetoothScanning) return;
    soundEngine.playClick();
    setBluetoothScanning(true);
    const t = window.setTimeout(() => {
      setBluetoothScanning(false);
      soundEngine.playNotification();
      notify('蓝牙扫描完成：发现附近存在 1 个未认证异常音频信标', 'warning');
    }, 850);
    storeTimersRef.current.push(t);
  }, [system.bluetooth, bluetoothScanning, notify]);

  // Bluetooth connection -> Ending #37 (蓝牙幽灵配对)
  const toggleBluetoothConnection = useCallback(
    (deviceId: string) => {
      if (isEndedOrStory(phaseRef.current)) return;
      if (!system.bluetooth) {
        soundEngine.playError();
        notify('蓝牙当前处于关闭状态', 'warning');
        return;
      }
      const target = bluetoothDevices.find((d) => d.id === deviceId);
      if (!target) return;

      if (target.suspicious && !target.connected) {
        if (!privacy.privacyEnabled) {
          soundEngine.playError();
          setBluetoothDevices((prev) =>
            prev.map((d) => (d.id === deviceId ? { ...d, paired: true, connected: true } : d))
          );
          appendNote('警告：在未启用硬件隐私保护时配对了异常蓝牙信标 0x000000_BLE_Audio！', 'warning');
          notify('正在建立 2.4GHz 蓝牙音频握手……大脑皮层出现低频耳语！', 'error');
          window.setTimeout(() => triggerEnding(37), 650);
          return;
        }
        soundEngine.playSuccess();
        notify('硬件隐私权限保护已阻断 0x000000_BLE_Audio 的异常音频权限请求！', 'success');
        appendNote('通过硬件隐私保护拦截了未知蓝牙音频设备 0x000000_BLE_Audio。', 'clue');
        return;
      }

      soundEngine.playClick();
      setBluetoothDevices((prev) =>
        prev.map((d) =>
          d.id === deviceId ? { ...d, paired: true, connected: !d.connected } : d
        )
      );
      notify(
        `${target.name} ${target.connected ? '已断开连接' : '已通过蓝牙连接'}`,
        target.connected ? 'info' : 'success'
      );
    },
    [system.bluetooth, bluetoothDevices, privacy.privacyEnabled, notify, appendNote, triggerEnding]
  );

  const registerLore = useCallback((topic: string) => {
    setDiscoveredLore((prev) => (prev.includes(topic) ? prev : [...prev, topic]));
  }, []);

  const pushBrowserHistory = useCallback(
    (instanceId: string, entry: BrowserHistoryEntry) => {
      setWindowInstances((prev) =>
        prev.map((w) => {
          if (w.instanceId !== instanceId || w.appId !== 'browser') return w;
          const bs = w.browserState ?? createInitialBrowserState();
          const nextTabs = bs.tabs.map((t) => {
            if (t.tabId !== bs.activeTabId) return t;
            const trimmed = t.history.slice(0, t.historyIndex + 1);
            const nextHistory = [...trimmed, entry];
            return {
              ...t,
              ...entry,
              title: getTabTitle(entry),
              history: nextHistory,
              historyIndex: nextHistory.length - 1,
            };
          });
          return {
            ...w,
            browserState: syncActiveTabFields(bs, nextTabs, bs.activeTabId),
          };
        })
      );
    },
    []
  );

  // Multi-tab management inside browser (#27 浏览器的尽头 at 5+ tabs)
  const addBrowserTab = useCallback(
    (instanceId: string, initialQuery = '') => {
      soundEngine.playClick();
      let newTabCount = 1;
      setWindowInstances((prev) =>
        prev.map((w) => {
          if (w.instanceId !== instanceId || w.appId !== 'browser') return w;
          const bs = w.browserState ?? createInitialBrowserState();
          const created = createSubTab(initialQuery);
          const nextTabs = [...bs.tabs, created];
          newTabCount = nextTabs.length;
          return {
            ...w,
            browserState: syncActiveTabFields(bs, nextTabs, created.tabId),
          };
        })
      );
      if (newTabCount >= 5 && !isEndedOrStory(phaseRef.current)) {
        notify('浏览器进程占用突破 4.00 GB 极限，设备即将崩溃……', 'error');
        window.setTimeout(() => {
          triggerMemoryCrash();
        }, 420);
      }
    },
    [notify, triggerMemoryCrash]
  );

  const switchBrowserTab = useCallback((instanceId: string, tabId: string) => {
    soundEngine.playClick();
    setWindowInstances((prev) =>
      prev.map((w) => {
        if (w.instanceId !== instanceId || w.appId !== 'browser' || !w.browserState) return w;
        const nextState = syncActiveTabFields(w.browserState, w.browserState.tabs, tabId);
        return {
          ...w,
          browserState: nextState,
        };
      })
    );
  }, []);

  const closeBrowserTab = useCallback((instanceId: string, tabId: string) => {
    soundEngine.playClick();
    setWindowInstances((prev) =>
      prev.map((w) => {
        if (w.instanceId !== instanceId || w.appId !== 'browser' || !w.browserState) return w;
        const bs = w.browserState;
        if (bs.tabs.length <= 1) {
          const fresh = createSubTab('');
          return { ...w, browserState: syncActiveTabFields(bs, [fresh], fresh.tabId) };
        }
        const idx = bs.tabs.findIndex((t) => t.tabId === tabId);
        const remaining = bs.tabs.filter((t) => t.tabId !== tabId);
        const nextActiveId =
          bs.activeTabId === tabId
            ? remaining[Math.max(0, idx - 1)].tabId
            : bs.activeTabId;
        const nextState = syncActiveTabFields(bs, remaining, nextActiveId);
        return { ...w, browserState: nextState };
      })
    );
  }, []);

  const toggleBookmark = useCallback(
    (label: string, url: string) => {
      soundEngine.playClick();
      setBookmarks((prev) => {
        const exists = prev.some((b) => b.url === url);
        if (exists) {
          notify(`已从书签栏移除「${label}」`, 'info');
          return prev.filter((b) => b.url !== url);
        }
        notify(`已添加书签「${label}」`, 'success');
        return [...prev, { id: `bm-${Date.now()}`, label, url }];
      });
    },
    [notify]
  );

  const downloadDriverPatch = useCallback(() => {
    if (!isOnline) {
      soundEngine.playError();
      notify('当前处于离线状态，无法下载补丁程序', 'warning');
      return;
    }
    if (downloads.some((d) => d.id === 'dl_patch')) {
      soundEngine.playClick();
      notify('HR_Cam_Patch_v2.exe 已在下载管理列表中', 'info');
      return;
    }

    soundEngine.playClick();
    setDownloads((prev) => [...prev, { ...DRIVER_PATCH_TEMPLATE, progress: 14 }]);

    const steps = [
      { pct: 48, delay: 260 },
      { pct: 86, delay: 560 },
    ];
    steps.forEach((s) => {
      const t = window.setTimeout(() => {
        setDownloads((prev) =>
          prev.map((d) => (d.id === 'dl_patch' ? { ...d, progress: s.pct } : d))
        );
      }, s.delay);
      storeTimersRef.current.push(t);
    });

    const finish = window.setTimeout(() => {
      setDownloads((prev) =>
        prev.map((d) => (d.id === 'dl_patch' ? { ...d, progress: 100 } : d))
      );
      soundEngine.playNotification();
      notify('已下载驱动补丁 HR_Cam_Patch_v2.exe（可在浏览器下载管理查看）', 'warning');
    }, 860);
    storeTimersRef.current.push(finish);
  }, [isOnline, downloads, notify]);

  // #23 恶意载荷
  const executeDownloadItem = useCallback(
    (id: string) => {
      const target = downloads.find((d) => d.id === id);
      if (!target) return;
      if (target.progress !== undefined && target.progress < 100) {
        notify('文件正在下载中，请稍候完成', 'info');
        return;
      }
      if (target.dangerous) {
        if (!privacy.antivirusEnabled) {
          triggerEnding(23);
          return;
        }
        soundEngine.playSuccess();
        setDownloads((prev) => prev.map((d) => (d.id === id ? { ...d, executed: true } : d)));
        notify('实时病毒防护已成功拦截并隔离 HR_Cam_Patch_v2.exe 恶意载荷！', 'success');
        appendNote('安全中心拦截了伪造的视频面试补丁程序 HR_Cam_Patch_v2.exe。', 'clue');
      }
    },
    [downloads, privacy.antivirusEnabled, triggerEnding, notify, appendNote]
  );

  const navigateBrowser = useCallback(
    (
      instanceId: string,
      tab: BrowserTabView,
      opts?: {
        query?: string;
        jobId?: number | null;
        activeArticleId?: string | null;
        activeWikiId?: string;
        liveUrl?: string;
      }
    ) => {
      const targetWin = windowInstances.find((w) => w.instanceId === instanceId);
      const cur = targetWin?.browserState ?? createInitialBrowserState();
      pushBrowserHistory(instanceId, {
        tab,
        query: opts?.query !== undefined ? opts.query : cur.query,
        selectedJobId: opts?.jobId !== undefined ? opts.jobId : cur.selectedJobId,
        activeArticleId:
          opts?.activeArticleId !== undefined ? opts.activeArticleId : cur.activeArticleId,
        activeWikiId: opts?.activeWikiId !== undefined ? opts.activeWikiId : cur.activeWikiId,
        liveUrl: opts?.liveUrl !== undefined ? opts.liveUrl : cur.liveUrl,
      });
    },
    [windowInstances, pushBrowserHistory]
  );

  const browserBack = useCallback((instanceId: string) => {
    soundEngine.playClick();
    setWindowInstances((prev) =>
      prev.map((w) => {
        if (w.instanceId !== instanceId || !w.browserState) return w;
        const bs = w.browserState;
        const nextTabs = bs.tabs.map((t) => {
          if (t.tabId !== bs.activeTabId || t.historyIndex <= 0) return t;
          const idx = t.historyIndex - 1;
          const entry = t.history[idx];
          return { ...t, ...entry, title: getTabTitle(entry), historyIndex: idx };
        });
        return { ...w, browserState: syncActiveTabFields(bs, nextTabs, bs.activeTabId) };
      })
    );
  }, []);

  const browserForward = useCallback((instanceId: string) => {
    soundEngine.playClick();
    setWindowInstances((prev) =>
      prev.map((w) => {
        if (w.instanceId !== instanceId || !w.browserState) return w;
        const bs = w.browserState;
        const nextTabs = bs.tabs.map((t) => {
          if (t.tabId !== bs.activeTabId || t.historyIndex >= t.history.length - 1) return t;
          const idx = t.historyIndex + 1;
          const entry = t.history[idx];
          return { ...t, ...entry, title: getTabTitle(entry), historyIndex: idx };
        });
        return { ...w, browserState: syncActiveTabFields(bs, nextTabs, bs.activeTabId) };
      })
    );
  }, []);

  const selectWikiSection = useCallback(
    (instanceId: string, wikiId: string) => {
      const sec = WIKI_SECTIONS.find((s) => s.id === wikiId);
      if (!sec) return;
      soundEngine.playClick();
      registerLore(sec.loreKey);
      pushBrowserHistory(instanceId, {
        tab: 'wiki',
        query: 'wiki',
        selectedJobId: null,
        activeArticleId: 'art_wiki',
        activeWikiId: wikiId,
      });
    },
    [registerLore, pushBrowserHistory]
  );

  // Track mirror echo inspect (#24 镜像回响)
  const recordSelfTraceAccess = useCallback(() => {
    if (stepRef.current < 1 || isEndedOrStory(phaseRef.current)) return;
    setMirrorInspectCount((prev) => {
      const next = prev + 1;
      if (next === 1) {
        notify('镜像观测日志出现了一行不属于你的访问时间戳… (1/3)', 'warning');
      } else if (next === 2) {
        notify('警告：档案里的屏幕倒影开始模仿你的敲键节奏！ (2/3)', 'warning');
      } else if (next >= 3) {
        window.setTimeout(() => triggerEnding(24), 450);
      }
      return next;
    });
  }, [notify, triggerEnding]);

  const openSearchArticle = useCallback(
    (instanceId: string, articleId: string) => {
      const art = SEARCH_CATALOG.find((a) => a.id === articleId);
      if (!art) return;
      soundEngine.playClick();
      registerLore(art.loreKey);
      if (art.sanityDelta) {
        setSanity((prev) => Math.max(0, Math.min(100, prev + art.sanityDelta!)));
      }
      if (art.id === 'art_ritual') {
        appendNote('在深网查阅了《数字驱逐仪式》残卷。', 'clue');
      } else if (art.id === 'art_code') {
        appendNote('打开了世界底层运行时源码检查器。', 'clue');
      } else {
        appendNote(`阅读网页档案：《${art.title}》`, 'clue');
      }

      if (art.id === 'art_self') {
        recordSelfTraceAccess();
      }

      pushBrowserHistory(instanceId, {
        tab: art.targetTab ?? 'lore_article',
        query: art.url,
        selectedJobId: null,
        activeArticleId: art.id,
        activeWikiId: WIKI_SECTIONS[0].id,
      });
    },
    [registerLore, appendNote, pushBrowserHistory, recordSelfTraceAccess]
  );

  const performBrowserSearch = useCallback(
    (instanceId: string, rawQuery: string) => {
      const q = rawQuery.trim();
      if (!q) {
        notify('请输入搜索关键词或网址', 'warning');
        return;
      }

      const lower = q.toLowerCase();

      // Offline only permits about:offline or local internal paths if needed, otherwise block
      if (!isOnline && !lower.startsWith('internal://') && lower !== 'about:blank') {
        notify('当前处于离线状态，无法访问网络', 'warning');
        return;
      }

      soundEngine.playClick();
      const nextCount = searchCount + 1;
      setSearchCount(nextCount);

      // 1. Explicit Rickroll URL detection (keyword searches like "rickroll" go to search results first)
      if (
        lower.includes('dqw4w9wgxcq') ||
        (looksLikeUrl(q) && lower.includes('youtube.com/watch') && lower.includes('dqw4w9wgxcq'))
      ) {
        registerLore('rickroll');
        appendNote('意外打开了一个上世纪八十年代的神秘音乐视频网页……', 'clue');
        pushBrowserHistory(instanceId, {
          tab: 'rickroll',
          query: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          selectedJobId: null,
          activeArticleId: 'art_rickroll',
          activeWikiId: WIKI_SECTIONS[0].id,
          liveUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        });
        return;
      }

      // 2. internal://omega (#30)
      if (lower === 'internal://omega' || lower === 'omega://truth') {
        pushBrowserHistory(instanceId, {
          tab: 'omega',
          query: 'internal://omega',
          selectedJobId: null,
          activeArticleId: null,
          activeWikiId: WIKI_SECTIONS[0].id,
        });
        return;
      }

      // 3. 404.void / about:blank (#27 combo if >= 3 tabs)
      if (lower === '404.void' || lower === 'https://404.void' || lower === 'about:blank') {
        const win = windowInstances.find((w) => w.instanceId === instanceId);
        const tabCount = win?.browserState?.tabs.length ?? 1;
        pushBrowserHistory(instanceId, {
          tab: 'void_404',
          query: q,
          selectedJobId: null,
          activeArticleId: null,
          activeWikiId: WIKI_SECTIONS[0].id,
        });
        if (tabCount >= 3) {
          notify('老旧内存无法承载虚空标签堆叠，正在崩溃……', 'error');
          window.setTimeout(() => triggerMemoryCrash(), 480);
        }
        return;
      }

      // Apply sanity drain only on online deepnet queries after first query during step >= 1
      if (nextCount > 1 && step >= 1) {
        setSanity((prev) => Math.max(0, prev - 10));
      }

      // 4. Direct URL Navigation (Bookmarks / Links with protocol or domain)
      if (lower.includes('wiki.deepnet.local')) {
        registerLore('wiki_intro');
        pushBrowserHistory(instanceId, {
          tab: 'wiki',
          query: 'https://wiki.deepnet.local',
          selectedJobId: null,
          activeArticleId: 'art_wiki',
          activeWikiId: WIKI_SECTIONS[0].id,
        });
        return;
      }

      if (lower.includes('pseudo-jobs.dark/driver-patch')) {
        downloadDriverPatch();
        return;
      }

      if (lower.includes('pseudo-jobs.dark')) {
        registerLore('jobs');
        pushBrowserHistory(instanceId, {
          tab: 'jobs',
          query: 'https://pseudo-jobs.dark/listings',
          selectedJobId: null,
          activeArticleId: 'art_jobs',
          activeWikiId: WIKI_SECTIONS[0].id,
        });
        return;
      }

      if (lower.includes('archive.void/exorcism-codex')) {
        registerLore('ritual');
        appendNote('查阅了古籍《数字驱逐仪式》。', 'clue');
        pushBrowserHistory(instanceId, {
          tab: 'ritual',
          query: 'https://archive.void/exorcism-codex',
          selectedJobId: null,
          activeArticleId: 'art_ritual',
          activeWikiId: WIKI_SECTIONS[0].id,
        });
        return;
      }

      if (lower.includes('internal://world-engine')) {
        registerLore('code');
        appendNote('打开了世界底层源码检查器。', 'clue');
        pushBrowserHistory(instanceId, {
          tab: 'code_truth',
          query: 'internal://world-engine/source.ts',
          selectedJobId: null,
          activeArticleId: 'art_code',
          activeWikiId: WIKI_SECTIONS[0].id,
        });
        return;
      }

      if (lower.includes('city-watch.net/missing-timeline')) {
        openSearchArticle(instanceId, 'art_missing');
        return;
      }

      if (lower.includes('mirror-trace.void/subject/you')) {
        openSearchArticle(instanceId, 'art_self');
        return;
      }

      // Check self-search for Mirror Echo (#24)
      if (
        q === user.name ||
        q === '林深' ||
        q === '我自己' ||
        q === '我是谁'
      ) {
        recordSelfTraceAccess();
      }

      // 5. Real external URL / domain -> Open local simulated Web Mirror Snapshot
      if (looksLikeUrl(q)) {
        const normalized = normalizeWebUrl(q);
        pushBrowserHistory(instanceId, {
          tab: 'live_web',
          query: normalized,
          selectedJobId: null,
          activeArticleId: null,
          activeWikiId: WIKI_SECTIONS[0].id,
          liveUrl: normalized,
        });
        return;
      }

      // 6. Standard keyword search -> ALWAYS land on Search Results page first
      const matched = SEARCH_CATALOG.filter(
        (art) =>
          art.title.toLowerCase().includes(lower) ||
          art.summary.toLowerCase().includes(lower) ||
          art.keywords.some((kw) => lower.includes(kw.toLowerCase()) || kw.toLowerCase().includes(lower))
      );

      if (matched.length > 0) {
        registerLore(matched[0].loreKey);
      } else {
        registerLore(`query:${q}`);
      }

      pushBrowserHistory(instanceId, {
        tab: 'search_results',
        query: q,
        selectedJobId: null,
        activeArticleId: null,
        activeWikiId: WIKI_SECTIONS[0].id,
      });
    },
    [
      isOnline,
      searchCount,
      step,
      user.name,
      windowInstances,
      notify,
      registerLore,
      appendNote,
      pushBrowserHistory,
      triggerEnding,
      downloadDriverPatch,
      openSearchArticle,
      recordSelfTraceAccess,
    ]
  );

  const escalateToInvasion = useCallback(
    (instanceId?: string) => {
      if (isEndedOrStory(phaseRef.current)) return;
      const nextSanity = Math.max(0, sanityRef.current - 25);
      setStep(2);
      setPhase('INVASION');
      setSanity(nextSanity);
      setDesktopShake(true);
      window.setTimeout(() => setDesktopShake(false), 450);
      soundEngine.playError();
      appendNote('警报：伪人程序已经顺着暗网连接侵入桌面，屏幕出现异常频闪！', 'warning');

      // #17 预知未来
      if (predictionText && (predictionText.includes('入侵') || predictionText.includes('伪人'))) {
        notify('你写下的因果预言正在实时重写现实……', 'warning');
        window.setTimeout(() => triggerEnding(17), 700);
        return;
      }

      // #2 断网避难
      if (!isOnlineRef.current) {
        triggerEnding(2);
        return;
      }

      // #6 基因侵蚀 (< 30% 理智被入侵)
      if (nextSanity > 0 && nextSanity < 30) {
        triggerEnding(6);
        return;
      }

      // #11 防火墙无敌！
      const p = privacyRef.current;
      if (p.firewallEnabled && p.antivirusEnabled && p.dnsEnabled) {
        triggerEnding(11);
        return;
      }

      setInvasionLocked(true);
      setQuestText('未知进程正在入侵系统！请立即通过断网、安全中心或驱逐手段应对');

      if (instanceId) {
        pushBrowserHistory(instanceId, {
          tab: 'invasion',
          query: 'alert://0x000000-system-lockdown',
          selectedJobId: null,
          activeArticleId: null,
          activeWikiId: WIKI_SECTIONS[0].id,
        });
      } else {
        openApp('browser');
      }
    },
    [predictionText, triggerEnding, appendNote, notify, pushBrowserHistory, openApp]
  );

  const applyForJob = useCallback(
    (instanceId: string, jobId: number) => {
      if (isEndedOrStory(phase)) return;
      if (jobId === 2) {
        setCameraScanResult(null);
        setCameraModalOpen(true);
        return;
      }

      if (!jobApplied) {
        setJobApplied(true);
        setAppliedJobId(jobId);
        setStep(1);
        setSanity((prev) => Math.max(0, prev - 15));
        setEmailWarningReceived(true);
        setEmailBadge((prev) => prev + 2);
        soundEngine.playNotification();
        notify('收到新的面试回执与安全警告邮件，请查看「邮件箱」', 'warning');
        setQuestText('简历已投递！去「邮件箱」查看新邮件，或调查安全状态');
        appendNote('已向可疑高薪招聘站点投递简历，后台连接似乎并未断开……', 'warning');
        pushBrowserHistory(instanceId, {
          tab: 'apply_result',
          query: 'https://pseudo-jobs.dark/handshake-active',
          selectedJobId: jobId,
          activeArticleId: null,
          activeWikiId: WIKI_SECTIONS[0].id,
        });
      } else {
        escalateToInvasion(instanceId);
      }
    },
    [phase, jobApplied, notify, appendNote, pushBrowserHistory, escalateToInvasion]
  );

  // Camera -> #18 伪人之眼
  const handleCameraAllow = useCallback(() => {
    setCameraModalOpen(false);
    if (cameraDenyCount >= 3 && !isEndedOrStory(phase)) {
      triggerEnding(18);
      return;
    }
    soundEngine.playNotification();
    setStep((prev) => Math.max(1, prev));
    setSanity((prev) => Math.max(0, prev - 10));
    setCameraScanResult('摄像头画面中出现了两个重叠的轮廓……生物特征匹配度 87%。');
    appendNote('开启面容验证摄像头时捕捉到双重轮廓异常，理智下降。', 'warning');
  }, [cameraDenyCount, phase, triggerEnding, appendNote]);

  const handleCameraDeny = useCallback(() => {
    setCameraModalOpen(false);
    const nextDeny = cameraDenyCount + 1;
    setCameraDenyCount(nextDeny);
    soundEngine.playClick();
    if (nextDeny === 1) {
      setCameraScanResult('你拒绝了摄像头访问权限（1/3）。验证页面仍停留在后台等待。');
    } else if (nextDeny === 2) {
      setCameraScanResult('你再次拒绝了权限（2/3）。奇怪的是，摄像头旁的指示灯自己闪了一下……');
    } else {
      setCameraScanResult('你已拒绝 3 次（3/3）。镜头背后似乎有什么东西正在等着你点下“允许”。');
    }
  }, [cameraDenyCount]);

  const closeCameraModal = useCallback(() => setCameraModalOpen(false), []);

  // Ritual -> #20 古老契约 / #12 驱逐仪式
  const performRitual = useCallback(() => {
    if (isEndedOrStory(phase)) return;
    if (isMidnight) {
      triggerEnding(20);
      return;
    }
    if (privacy.firewallEnabled && privacy.antivirusEnabled && privacy.dnsEnabled) {
      triggerEnding(12);
      return;
    }
    soundEngine.playError();
    setSanity((prev) => Math.max(0, prev - 10));
    notify('仪式共鸣失败，反噬导致理智下降！系统防御条件尚未满足', 'warning');
  }, [phase, isMidnight, privacy, triggerEnding, notify]);

  // Code Truth -> #19 代码真相
  const executeCodeTruth = useCallback(() => {
    if (isEndedOrStory(phase)) return;
    if (sanity === 100) {
      triggerEnding(19);
    } else {
      notify('当前理智值非 100%，无法读取完整根权限源码', 'warning');
    }
  }, [phase, sanity, triggerEnding, notify]);

  // Publish Survival Guide -> #14 知识就是力量 (4+ lore)
  const publishSurvivalGuide = useCallback(() => {
    if (isEndedOrStory(phase)) return;
    if (discoveredLore.length >= 4) {
      triggerEnding(14);
    }
  }, [phase, discoveredLore.length, triggerEnding]);

  // #21 永不放弃你 (Rickroll)
  const triggerRickrollEnding = useCallback(() => {
    triggerEnding(21);
  }, [triggerEnding]);

  // #27 4GB 内存崩溃 (5s crash sequence)
  const triggerBrowserOverload = useCallback(() => {
    triggerMemoryCrash();
  }, [triggerMemoryCrash]);

  // #28 管理员权限
  const triggerTerminalAwaken = useCallback(() => {
    triggerEnding(28);
  }, [triggerEnding]);

  // #30 全知观测者
  const triggerOmegaEnding = useCallback(() => {
    if (unlockedEndings.length >= 25) {
      triggerEnding(30);
    } else {
      notify(`需先累计解锁至少 25 个结局（当前 ${unlockedEndings.length}/25）`, 'warning');
    }
  }, [unlockedEndings.length, triggerEnding, notify]);

  // === Microsoft Store / App Store & Downloadable Apps Logic ===
  const installStoreApp = useCallback(
    (id: StoreAppId) => {
      if (isEndedOrStory(phaseRef.current)) return;
      if (!isOnline) {
        soundEngine.playError();
        notify('当前处于离线状态，无法连接应用商店服务器下载安装包', 'warning');
        return;
      }
      if (installedApps.includes(id) || downloadingApps[id] !== undefined) return;

      const meta = STORE_CATALOG.find((item) => item.id === id);
      soundEngine.playClick();
      setDownloadingApps((prev) => ({ ...prev, [id]: 12 }));

      const stages = [
        { pct: 38, delay: 280 },
        { pct: 72, delay: 620 },
        { pct: 94, delay: 940 },
      ];
      stages.forEach((s) => {
        const t = window.setTimeout(() => {
          setDownloadingApps((prev) =>
            prev[id] !== undefined ? { ...prev, [id]: s.pct } : prev
          );
        }, s.delay);
        storeTimersRef.current.push(t);
      });

      const done = window.setTimeout(() => {
        setDownloadingApps((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setInstalledApps((prev) => (prev.includes(id) ? prev : [...prev, id]));
        soundEngine.playSuccess();
        notify(`已安装「${meta?.desktopName ?? id}」，可在桌面或开始菜单启动`, 'success');
        appendNote(`从应用商店安装了「${meta?.desktopName ?? id}」。`, 'clue');
      }, 1220);
      storeTimersRef.current.push(done);
    },
    [isOnline, installedApps, downloadingApps, notify, appendNote]
  );

  const uninstallStoreApp = useCallback(
    (id: StoreAppId) => {
      soundEngine.playClick();
      if (id === 'radio') {
        soundEngine.stopRadioChannel();
        setRadioPlaying(false);
      }
      setWindowInstances((prev) => prev.filter((w) => w.appId !== id));
      setInstalledApps((prev) => prev.filter((x) => x !== id));
      const meta = STORE_CATALOG.find((item) => item.id === id);
      notify(`已卸载「${meta?.desktopName ?? id}」`, 'info');
    },
    [notify]
  );

  const toggleVscodePatch = useCallback((idx: 0 | 1 | 2) => {
    soundEngine.playClick();
    setVscodePatches((prev) => {
      const next: [boolean, boolean, boolean] = [...prev] as [boolean, boolean, boolean];
      next[idx] = !next[idx];
      return next;
    });
  }, []);

  const toggleVscodeCorruptExt = useCallback(() => {
    soundEngine.playClick();
    setVscodeCorruptExt((prev) => {
      const next = !prev;
      if (next) {
        notify('警告：已启用未知来源扩展 Doppelganger-Linter，本地代码出现异常高亮', 'warning');
      }
      return next;
    });
  }, [notify]);

  const compileVscodeHotfix = useCallback((): string => {
    if (isEndedOrStory(phaseRef.current)) return '会话已结束。';
    if (vscodeGodMode) {
      if (sanity === 100 && mirrorLogRead) {
        soundEngine.playSuccess();
        triggerEnding(32);
        return '[GOD_MODE] Root override verified. World engine locked safely.';
      }
      soundEngine.playError();
      notify('权限不足：GOD_MODE 需要保持 100% 理智并先在终端读取 mirror.log', 'warning');
      return '[ERR 403] GOD_MODE 校验失败：请先在「终端」执行 cat mirror.log 并确保理智值处于 100%。';
    }

    if (vscodePatches.every(Boolean)) {
      if (privacy.firewallEnabled && privacy.antivirusEnabled) {
        soundEngine.playSuccess();
        triggerEnding(31);
        return '[SUCCESS] Daemon 0x000000 neutralized & hotfix committed.';
      }
      soundEngine.playError();
      notify('热更新写入被拦截：请先开启「防火墙」与「实时病毒防护」后再编译', 'warning');
      return '[WARN] 3/3 异常修复就绪，但系统缺乏「防火墙 + 实时病毒防护」保护，热更新被安全内核挂起。';
    }

    const fixedCount = vscodePatches.filter(Boolean).length;
    soundEngine.playError();
    return `[FAIL] daemon/0x000000.ts 仍有 ${3 - fixedCount} 处高危注入未修复（当前 ${fixedCount}/3），无法执行安全热更新。`;
  }, [vscodeGodMode, sanity, mirrorLogRead, vscodePatches, privacy, triggerEnding, notify]);

  const runCorruptVscodeSample = useCallback(() => {
    if (isEndedOrStory(phaseRef.current)) return;
    soundEngine.playError();
    setSanity((prev) => Math.max(0, prev - 10));
    setStep((prev) => Math.max(1, prev));
    setDesktopShake(true);
    window.setTimeout(() => setDesktopShake(false), 380);
    notify('Doppelganger-Linter 扩展注入了反编译耳语！（理智 -10%）', 'error');
    appendNote('在 VS Code 中运行了可疑插件脚本，桌面似乎产生了诡异共振。', 'warning');
  }, [notify, appendNote]);

  const suspendDaemonProcess = useCallback(() => {
    if (suspendedDaemon) {
      soundEngine.playClick();
      notify('remote_hr_hook.dll 当前已处于挂起状态', 'info');
      return;
    }
    setSuspendedDaemon(true);
    soundEngine.playSuccess();
    notify('已挂起异常后台模块 remote_hr_hook.dll，被动理智侵蚀已暂停', 'success');
    appendNote('通过监视器挂起了 remote_hr_hook.dll，异常弹窗与理智流逝暂时停止。', 'clue');
  }, [suspendedDaemon, notify, appendNote]);

  const triggerKernelMeltdown = useCallback(() => {
    if (isEndedOrStory(phaseRef.current)) return;
    setDesktopShake(true);
    soundEngine.playError();
    window.setTimeout(() => setDesktopShake(false), 450);
    triggerEnding(33);
  }, [triggerEnding]);

  const recordFreqDiscovery = useCallback(
    (freq: number) => {
      const mode = getRadioStationMode(freq);
      if (mode === 'news') {
        registerLore('radio_news');
        setRadioUnlockedFreqs((prev) => (prev.includes('96.8') ? prev : [...prev, '96.8']));
      } else if (mode === 'numbers') {
        registerLore('radio_numbers');
        setRadioUnlockedFreqs((prev) => (prev.includes('104.2') ? prev : [...prev, '104.2']));
      }
    },
    [registerLore]
  );

  const tuneRadioFreq = useCallback(
    (rawFreq: number) => {
      const clamped = Math.max(88.0, Math.min(108.0, Math.round(rawFreq * 10) / 10));
      setRadioFreq(clamped);
      recordFreqDiscovery(clamped);
      if (radioPlaying) {
        soundEngine.startRadioChannel(getRadioStationMode(clamped));
      }
    },
    [radioPlaying, recordFreqDiscovery]
  );

  const toggleRadioPlay = useCallback(
    (force?: boolean) => {
      const next = force !== undefined ? force : !radioPlaying;
      setRadioPlaying(next);
      if (next) {
        recordFreqDiscovery(radioFreq);
        soundEngine.startRadioChannel(getRadioStationMode(radioFreq));
      } else {
        soundEngine.stopRadioChannel();
      }
    },
    [radioPlaying, radioFreq, recordFreqDiscovery]
  );

  const healWithRadioRain = useCallback(() => {
    if (radioRainHealed) {
      notify('本局已收听过深夜雨声舒缓疗愈', 'info');
      return;
    }
    setRadioRainHealed(true);
    setSanity((prev) => Math.min(100, prev + 8));
    soundEngine.playSuccess();
    notify('伴着 91.4 MHz 细雨白噪音平复了心神（理智 +8%）', 'success');
  }, [radioRainHealed, notify]);

  const triggerRadioAssimilation = useCallback(() => {
    if (isEndedOrStory(phaseRef.current)) return;
    if (Math.abs(radioFreq - 107.9) > 0.25) {
      notify('请先将收音机调频至 107.9 MHz', 'warning');
      return;
    }
    if (privacy.privacyEnabled) {
      soundEngine.playSuccess();
      notify('隐私保护模式已屏蔽 107.9 MHz 的高频耳语注入', 'info');
      return;
    }
    if (sanity < 55) {
      triggerEnding(34);
    } else {
      soundEngine.playError();
      setSanity((prev) => Math.max(0, prev - 10));
      notify('107.9 MHz 传来失真的低语……当前理智尚高于 55%，暂未被同化（理智 -10%）', 'warning');
    }
  }, [radioFreq, privacy.privacyEnabled, sanity, triggerEnding, notify]);

  const triggerEmergencyBroadcast = useCallback(() => {
    if (isEndedOrStory(phaseRef.current)) return;
    const has968 = radioUnlockedFreqs.includes('96.8');
    const has1042 = radioUnlockedFreqs.includes('104.2');
    if (has968 && has1042 && discoveredLore.length >= 3 && privacy.dnsEnabled) {
      triggerEnding(35);
      return;
    }
    soundEngine.playError();
    notify(
      '发射条件不足：需先收听 96.8 & 104.2 MHz 获取双频校验、收集至少 3 份情报，并开启 DNS 加密',
      'warning'
    );
  }, [radioUnlockedFreqs, discoveredLore.length, privacy.dnsEnabled, triggerEnding, notify]);

  const triggerStoreGeekNight = useCallback(() => {
    if (isEndedOrStory(phaseRef.current)) return;
    if (step === 0 && !jobApplied && installedApps.length === 4 && openedStoreApps.length === 4) {
      triggerEnding(36);
      return;
    }
    soundEngine.playError();
    notify(
      `需保持未应聘状态 (step=0)，并从商店安装且打开全部 4 款应用（当前已安装 ${installedApps.length}/4 · 已体验 ${openedStoreApps.length}/4）`,
      'warning'
    );
  }, [step, jobApplied, installedApps.length, openedStoreApps.length, triggerEnding, notify]);

  const shredCorruptedFile = useCallback(
    (fileId: string) => {
      if (shreddedFiles.includes(fileId)) return;
      if (!privacy.antivirusEnabled) {
        soundEngine.playError();
        setSanity((prev) => Math.max(0, prev - 6));
        notify('警告：未开启实时病毒防护直接粉碎碎片引发了残余数据反噬！（理智 -6%）', 'error');
        return;
      }
      setShreddedFiles((prev) => [...prev, fileId]);
      setSanity((prev) => Math.min(100, prev + 5));
      soundEngine.playSuccess();
      notify('安全粉碎受损数据碎片完成（理智 +5%）', 'success');
      appendNote(`使用深层文件箱安全粉碎了受损残片 ${fileId}。`, 'clue');
    },
    [shreddedFiles, privacy.antivirusEnabled, notify, appendNote]
  );

  // Morse Decoder Actions -> #38 (声呐破译者) & #39 (莫尔斯回响)
  const submitMorseDecode = useCallback(
    (signalId: string, decodedText: string): boolean => {
      const sig = MORSE_SIGNALS.find((s) => s.id === signalId);
      if (!sig) return false;
      const cleanInput = decodedText.trim().toUpperCase().replace(/\s+/g, ' ');
      const cleanAnswer = sig.answer.trim().toUpperCase().replace(/\s+/g, ' ');
      if (cleanInput === cleanAnswer) {
        soundEngine.playSuccess();
        setDecodedMorseIds((prev) => (prev.includes(signalId) ? prev : [...prev, signalId]));
        registerLore(`morse:${signalId}`);
        notify(`脉冲破译成功：[${cleanAnswer}]！`, 'success');
        appendNote(`破译摩斯短波信号（${sig.freq}）→ 明文：${cleanAnswer}`, 'clue');
        return true;
      }
      soundEngine.playError();
      notify('破译结果与脉冲波形不匹配，请核对摩斯电码对照表', 'warning');
      return false;
    },
    [registerLore, notify, appendNote]
  );

  const sendMorseCounterPulse = useCallback(() => {
    if (isEndedOrStory(phaseRef.current)) return;
    const safeDecoded = decodedMorseIds.filter((id) => id === 'sig_sos' || id === 'sig_night');
    if (safeDecoded.length === 0) {
      soundEngine.playError();
      notify('请先成功破译至少 1 条安全频道脉冲（频道 A 或 B）后再回传反制码', 'warning');
      return;
    }
    if (!isOnline) {
      soundEngine.playError();
      notify('当前处于离线状态，无法接入加密观察站天线阵', 'warning');
      return;
    }
    if (!privacy.dnsEnabled) {
      soundEngine.playError();
      notify('请先在设置开启「DNS 安全加密 (DoH)」以保护声呐回传链路不被劫持', 'warning');
      return;
    }
    soundEngine.playSuccess();
    triggerEnding(38);
  }, [decodedMorseIds, isOnline, privacy.dnsEnabled, notify, triggerEnding]);

  const transmitMorseCode = useCallback(
    (rawText: string) => {
      if (isEndedOrStory(phaseRef.current)) return;
      const clean = rawText.trim().toUpperCase().replace(/\s+/g, ' ');
      if (!clean) {
        notify('请输入要编码发报的英文文本或代号', 'warning');
        return;
      }
      if (clean.includes('I SEE YOU') || clean.includes('0X000000')) {
        soundEngine.playError();
        notify('警告：外部阴影正在回应这段禁忌摩尔斯电码……', 'error');
        window.setTimeout(() => triggerEnding(39), 680);
        return;
      }
      soundEngine.playNotification();
      notify(`已向空气频段发报明文：「${clean}」`, 'info');
    },
    [notify, triggerEnding]
  );

  // Task Manager Secure Daemon Tree Termination -> #40 (零号进程清零)
  const auditAndTerminateDaemon = useCallback(() => {
    if (isEndedOrStory(phaseRef.current)) return;
    if (!suspendedDaemon) {
      soundEngine.playError();
      setSanity((prev) => Math.max(0, prev - 10));
      notify('操作被反制：请先挂起外联句柄 remote_hr_hook.dll，否则子线程会立即重连！', 'error');
      return;
    }
    if (!privacy.firewallEnabled || !privacy.antivirusEnabled) {
      soundEngine.playError();
      notify('缺少沙箱封锁条件：需先同时开启「防火墙」与「实时病毒防护」后再清零线程树', 'warning');
      return;
    }
    soundEngine.playSuccess();
    triggerEnding(40);
  }, [suspendedDaemon, privacy.firewallEnabled, privacy.antivirusEnabled, notify, triggerEnding]);

  const markEmailRead = useCallback((emailId: string) => {
    setReadEmailIds((prev) => (prev.includes(emailId) ? prev : [...prev, emailId]));
  }, []);

  // Video interview trap -> #25 蜜罐反制 (all 4 shields) vs safe block vs #10 致命连线
  const joinVideoInterview = useCallback(() => {
    if (isEndedOrStory(phase)) return;
    if (
      privacy.firewallEnabled &&
      privacy.privacyEnabled &&
      privacy.antivirusEnabled &&
      privacy.dnsEnabled
    ) {
      triggerEnding(25);
      return;
    }
    if (privacy.firewallEnabled && privacy.privacyEnabled) {
      soundEngine.playSuccess();
      notify('防火墙与隐私保护已拦截该异常视频端口！开启全部四重防护可进一步实施反追踪。', 'success');
      return;
    }
    triggerEnding(10);
  }, [phase, privacy, notify, triggerEnding]);

  // Decrypt Truth -> #15 真相大白
  const decryptTruthDossier = useCallback(() => {
    if (isEndedOrStory(phase)) return;
    const availableIds = EMAIL_TEMPLATES.filter((em) => {
      if (em.requiresWarning && !emailWarningReceived) return false;
      if (em.minStep !== undefined && step < em.minStep) return false;
      return true;
    }).map((em) => em.id);
    const allRead = availableIds.every((id) => readEmailIds.includes(id));

    if (goodEndingsCount >= 3 && allRead) {
      triggerEnding(15);
    } else {
      notify('需先累计达成 3 个不同好结局，并阅读当前收件箱内全部邮件', 'warning');
    }
  }, [phase, emailWarningReceived, step, readEmailIds, goodEndingsCount, triggerEnding, notify]);

  const inscribePrediction = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        notify('请先输入文字内容', 'warning');
        return;
      }
      setPredictionText(trimmed);
      soundEngine.playSuccess();
      appendNote(`已铭刻预言：「${trimmed}」`, 'clue');
      notify('预言已写入本地缓冲区', 'success');
    },
    [notify, appendNote]
  );

  const addCustomNote = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      appendNote(trimmed, 'user');
      soundEngine.playClick();
    },
    [appendNote]
  );

  // Rest tonight -> #3 平凡的夜
  const restTonight = useCallback(() => {
    if (isEndedOrStory(phase)) return;
    if (step === 0 && !jobApplied && sanity === 100) {
      triggerEnding(3);
    }
  }, [phase, step, jobApplied, sanity, triggerEnding]);

  const drinkCoffee = useCallback(() => {
    if (coffeeCharges <= 0) return;
    setCoffeeCharges((c) => c - 1);
    setSanity((prev) => Math.min(100, prev + 20));
    soundEngine.playSuccess();
    notify('喝下热黑咖啡，精神恢复专注（理智 +20%）', 'success');
  }, [coffeeCharges, notify]);

  const deepBreathe = useCallback(() => {
    if (breatheCharges <= 0) return;
    setBreatheCharges((c) => c - 1);
    setSanity((prev) => Math.min(100, prev + 10));
    soundEngine.playSuccess();
    notify('完成深呼吸稳态调节（理智 +10%）', 'success');
  }, [breatheCharges, notify]);

  // Security Purge -> #11 防火墙无敌！
  const purgeThreatsInSecurity = useCallback(() => {
    if (isEndedOrStory(phase)) return;
    if (step >= 2 && privacy.firewallEnabled && privacy.antivirusEnabled && privacy.dnsEnabled) {
      triggerEnding(11);
      return;
    }
    if (privacy.antivirusEnabled) {
      soundEngine.playSuccess();
      notify('已清理当前表层异常缓存。', 'success');
    }
  }, [phase, step, privacy, triggerEnding, notify]);

  // Security Report -> #4 匿名举报 (Fix: works at step >= 1 or if user explored suspicious jobs page + >= 3 lore)
  const submitSecurityReport = useCallback(() => {
    if (isEndedOrStory(phase)) return;
    const hasContactedJobs = step >= 1 || discoveredLore.includes('jobs');
    if (hasContactedJobs && discoveredLore.length >= 3) {
      triggerEnding(4);
    } else if (!hasContactedJobs) {
      notify('需先访问可疑招聘站点或投递简历获取目标域名线索后才可举报', 'warning');
    } else {
      notify(`证据尚不充分（已收集 ${discoveredLore.length}/3 份，可去浏览器查阅 Wiki 或档案页）`, 'warning');
    }
  }, [phase, step, discoveredLore, triggerEnding, notify]);

  const chooseNewsBranch = useCallback(
    (choice: 'rescue' | 'doom') => {
      setNewsChoice(choice);
      setChatBadge(true);
      setWindowInstances((prev) => prev.filter((w) => w.appId !== 'news'));
      if (choice === 'rescue') {
        soundEngine.playNotification();
        setQuestText('你决定提醒家人撤离！快打开「相亲相爱一家人」群聊查看回复');
        notify('已准备向家人发送紧急撤离警告，请打开群聊确认', 'info');
      } else {
        soundEngine.playError();
        setQuestText('你选择了继续工作……打开「相亲相爱一家人」看看家里发生了什么');
        notify('群聊里似乎传来了异样的敲门回音……', 'error');
      }
    },
    [notify]
  );

  // Casual Chat -> #29 双向奔赴 on 3rd warm reply when safe
  const sendCasualChatReply = useCallback(
    (text: string) => {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      setChatMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, sender: '你', text, time, tone: 'player' },
      ]);
      soundEngine.playClick();

      if (step === 0 && !jobApplied && sanity === 100 && !globalDoomTriggered && !isEndedOrStory(phase)) {
        const nextCount = casualChatCount + 1;
        setCasualChatCount(nextCount);

        window.setTimeout(() => {
          if (isEndedOrStory(phaseRef.current)) return;
          if (nextCount === 1) {
            soundEngine.playNotification();
            setChatMessages((prev) => [
              ...prev,
              {
                id: `fam-1-${Date.now()}`,
                sender: '妈妈',
                text: '这么晚还醒着呀？是不是房租的事儿发愁了？快跟妈直说，别硬撑。',
                time,
                tone: 'normal',
              },
            ]);
          } else if (nextCount === 2) {
            soundEngine.playNotification();
            setChatMessages((prev) => [
              ...prev,
              {
                id: `fam-2-${Date.now()}`,
                sender: '爸爸',
                text: '你妈刚刚拍醒我了，你卡号还是尾号那张吧？我先转你一笔应急。',
                time,
                tone: 'normal',
              },
            ]);
          } else if (nextCount >= 3) {
            soundEngine.playSuccess();
            setChatMessages((prev) => [
              ...prev,
              {
                id: `fam-3-${Date.now()}`,
                sender: '妹妹',
                text: '哥！老爸已经给你转完钱啦，明早记得回来喝妈妈煮的热粥！',
                time,
                tone: 'urgent',
              },
            ]);
            window.setTimeout(() => triggerEnding(29), 950);
          }
        }, 650);
      }
    },
    [step, jobApplied, sanity, globalDoomTriggered, phase, casualChatCount, triggerEnding]
  );

  const resolveAnomaly = useCallback(
    (action: 'block' | 'ignore') => {
      if (!activeAnomaly) return;
      if (action === 'block') {
        soundEngine.playSuccess();
        setSanity((prev) => Math.max(0, prev - 2));
        notify(`已手动拦截「${activeAnomaly.title}」`, 'success');
      } else {
        soundEngine.playError();
        setSanity((prev) => Math.max(0, prev - activeAnomaly.sanityPenalty));
        notify(`未处理异常导致认知污染（理智 -${activeAnomaly.sanityPenalty}%）`, 'error');
      }
      setActiveAnomaly(null);
    },
    [activeAnomaly, notify]
  );

  // Jumpscare -> #5 身份覆写
  const triggerJumpscareEnding = useCallback(() => {
    if (isEndedOrStory(phaseRef.current) || phaseRef.current === 'JUMPSCARE') return;
    soundEngine.stopRadioChannel();
    setRadioPlaying(false);
    setPhase('JUMPSCARE');
    soundEngine.playJumpscare();
    if (jumpscareTimerRef.current) window.clearTimeout(jumpscareTimerRef.current);
    jumpscareTimerRef.current = window.setTimeout(() => {
      triggerEnding(5);
    }, 1700);
  }, [triggerEnding]);

  // Shutdown -> #1 断电逃生
  const shutdownSystem = useCallback(() => {
    setStartMenuOpen(false);
    triggerEnding(1);
  }, [triggerEnding]);

  const clearRunState = useCallback(() => {
    if (chatTimerRef.current) {
      window.clearInterval(chatTimerRef.current);
      chatTimerRef.current = null;
    }
    if (jumpscareTimerRef.current) {
      window.clearTimeout(jumpscareTimerRef.current);
      jumpscareTimerRef.current = null;
    }
    if (crashTimerRef.current) {
      window.clearTimeout(crashTimerRef.current);
      crashTimerRef.current = null;
    }
    ramWarnedRef.current = false;
    storeTimersRef.current.forEach((t) => window.clearTimeout(t));
    storeTimersRef.current = [];
    soundEngine.stopRadioChannel();

    setStep(0);
    setSanity(100);
    setIsOnline(true);
    setQuestText('房租快到期了，打开「浏览器」看看兼职，或访问「Wiki」与「应用商店」');
    setCurrentEndingId(null);
    setPrivacy(DEFAULT_PRIVACY);
    setClockOffsetMinutes(0);
    morningWarnedRef.current = false;
    setBluetoothDevices(INITIAL_BLUETOOTH_DEVICES);
    setBluetoothScanning(false);
    setDecodedMorseIds([]);
    setJobApplied(false);
    setAppliedJobId(null);
    setEmailWarningReceived(false);
    setReadEmailIds([]);
    setDiscoveredLore([]);
    setSearchCount(0);
    setMirrorInspectCount(0);
    setCasualChatCount(0);
    setMirrorLogRead(false);
    setPredictionText('');
    setNotepadEntries([
      {
        id: 'init-reset',
        time: '23:50',
        text: '房租明天到期，今晚得在网上找份高薪兼职。如果遇到奇怪的事情，可以去浏览器搜搜 Wiki。',
        kind: 'user',
      },
    ]);
    setCoffeeCharges(2);
    setBreatheCharges(1);
    setCameraModalOpen(false);
    setCameraDenyCount(0);
    setCameraScanResult(null);
    setToggleCount(0);
    setGlobalDoomTriggered(false);
    setNewsChoice('none');
    setChatMessages(INITIAL_CHAT_MESSAGES);
    setChatSequenceStarted(false);
    setActiveAnomaly(null);
    setInvasionLocked(false);
    setDownloads([]);

    setInstalledApps([]);
    setDownloadingApps({});
    setOpenedStoreApps([]);
    setSuspendedDaemon(false);
    setVscodePatches([false, false, false]);
    setVscodeGodMode(false);
    setVscodeCorruptExt(false);
    setRadioFreq(91.4);
    setRadioPlaying(false);
    setRadioUnlockedFreqs([]);
    setRadioRainHealed(false);
    setShreddedFiles([]);

    setEmailBadge(1);
    setNewsBadge(false);
    setChatBadge(false);
    setStartMenuOpen(false);
    setQuickSettingsOpen(false);
    setWindowInstances([]);
    setFocusedInstanceId(null);
    setBootedInstanceIds([]);
  }, []);

  const startGameSequence = useCallback(() => {
    soundEngine.playClick();
    clearRunState();
    setPhase('LOADING');
  }, [clearRunState]);

  const setBootPhase = useCallback((next: 'WARNING' | 'PROLOGUE' | 'PLAYING') => {
    setPhase(next);
    if (next === 'PLAYING') {
      soundEngine.playNotification();
    }
  }, []);

  const returnToTitle = useCallback(() => {
    soundEngine.playClick();
    clearRunState();
    setPhase('TITLE');
  }, [clearRunState]);

  const resetRun = useCallback(() => {
    clearRunState();
    setPhase('PLAYING');
    setTotalRuns((r) => {
      const next = r + 1;
      saveJson(STORAGE_KEYS.STATS, next);
      return next;
    });
    soundEngine.playNotification();
    notify('已重启新一局（历史解锁结局与任务栏固定已保留）', 'success');
  }, [clearRunState, notify]);

  const factoryResetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.ENDINGS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.STATS);
    localStorage.removeItem(STORAGE_KEYS.PINNED_TASKBAR);
    setUnlockedEndings([]);
    setSystem(DEFAULT_SYSTEM);
    setUser(DEFAULT_USER);
    setPinnedTaskbarApps(DEFAULT_PINNED_TASKBAR);
    setTotalRuns(1);
    resetRun();
    notify('已清除全部历史结局与本地档案', 'info');
  }, [resetRun, notify]);

  const value: GameContextValue = {
    phase,
    step,
    sanity,
    isOnline,
    questText,
    currentEndingId,
    unlockedEndings,
    goodEndingsCount,
    totalRuns,
    privacy,
    system,
    user,
    clockTime,
    isMidnight,
    jobApplied,
    appliedJobId,
    emailWarningReceived,
    readEmailIds,
    discoveredLore,
    searchCount,
    mirrorInspectCount,
    casualChatCount,
    mirrorLogRead,
    predictionText,
    notepadEntries,
    coffeeCharges,
    breatheCharges,
    cameraModalOpen,
    cameraDenyCount,
    cameraScanResult,
    toggleCount,
    globalDoomTriggered,
    newsChoice,
    chatMessages,
    chatSequenceStarted,
    activeAnomaly,
    desktopShake,
    invasionLocked,
    bookmarks,
    downloads,
    pinnedTaskbarApps,
    bluetoothDevices,
    bluetoothScanning,
    decodedMorseIds,
    systemMetrics,
    installedApps,
    downloadingApps,
    openedStoreApps,
    suspendedDaemon,
    vscodePatches,
    vscodeGodMode,
    vscodeCorruptExt,
    radioFreq,
    radioPlaying,
    radioUnlockedFreqs,
    radioRainHealed,
    shreddedFiles,
    emailBadge,
    newsBadge,
    chatBadge,
    toasts,
    windowInstances,
    focusedInstanceId,
    bootedInstanceIds,
    startMenuOpen,
    quickSettingsOpen,
    setStartMenuOpen,
    setQuickSettingsOpen,
    setMirrorLogRead,
    markInstanceBooted,
    openApp,
    toggleTaskbarApp,
    togglePinTaskbarApp,
    closeAllAppWindows,
    focusInstance,
    closeInstance,
    minimizeInstance,
    toggleMaximizeInstance,
    updateInstanceRect,
    resetInstanceRect,
    snapInstance,
    cascadeAllWindows,
    minimizeAllWindows,
    notify,
    dismissToast,
    toggleNetwork,
    toggleBluetooth,
    scanBluetoothDevices,
    toggleBluetoothConnection,
    togglePrivacyFlag,
    updateSystem,
    updateUser,
    setClockToMidnight,
    setClockToMorning,
    advanceClockMinutes,
    resetClock,
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
    handleCameraAllow,
    handleCameraDeny,
    closeCameraModal,
    performRitual,
    executeCodeTruth,
    publishSurvivalGuide,
    triggerRickrollEnding,
    triggerBrowserOverload,
    triggerTerminalAwaken,
    triggerOmegaEnding,
    installStoreApp,
    uninstallStoreApp,
    toggleVscodePatch,
    setVscodeGodMode,
    toggleVscodeCorruptExt,
    compileVscodeHotfix,
    runCorruptVscodeSample,
    suspendDaemonProcess,
    triggerKernelMeltdown,
    tuneRadioFreq,
    toggleRadioPlay,
    healWithRadioRain,
    triggerRadioAssimilation,
    triggerEmergencyBroadcast,
    triggerStoreGeekNight,
    shredCorruptedFile,
    submitMorseDecode,
    sendMorseCounterPulse,
    transmitMorseCode,
    auditAndTerminateDaemon,
    markEmailRead,
    joinVideoInterview,
    decryptTruthDossier,
    inscribePrediction,
    addCustomNote,
    restTonight,
    drinkCoffee,
    deepBreathe,
    purgeThreatsInSecurity,
    submitSecurityReport,
    chooseNewsBranch,
    sendCasualChatReply,
    resolveAnomaly,
    triggerJumpscareEnding,
    completeEndingStory,
    shutdownSystem,
    startGameSequence,
    setBootPhase,
    returnToTitle,
    resetRun,
    factoryResetAll,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
