export type StoreAppId = 'vscode' | 'monitor' | 'radio' | 'files' | 'cleaner' | 'sniffer';

export type AppId =
  | 'browser'
  | 'email'
  | 'notepad'
  | 'settings'
  | 'security'
  | 'news'
  | 'chat'
  | 'achievements'
  | 'terminal'
  | 'store'
  | 'morse'
  | 'taskmgr'
  | StoreAppId;

export type EndingCategory = 'bad' | 'normal' | 'good' | 'secret';

export type EndingId =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40
  | 41
  | 42
  | 43
  | 44
  | 45
  | 46
  | 47
  | 48
  | 49
  | 50;

export type GamePhase =
  | 'TITLE'
  | 'LOADING'
  | 'WARNING'
  | 'PROLOGUE'
  | 'PLAYING'
  | 'INVASION'
  | 'CRASH_SEQUENCE'
  | 'JUMPSCARE'
  | 'ENDING_STORY'
  | 'ENDED';

export type ThemeMode = 'dark' | 'light' | 'horror';
export type PowerMode = 'balanced' | 'performance' | 'saver';

export interface EndingStoryBeat {
  time: string;
  scene: string;
  speaker?: string;
  line: string;
  tone?: 'calm' | 'tense' | 'horror' | 'warm' | 'glitch';
}

export interface EndingDefinition {
  id: EndingId;
  name: string;
  icon: string;
  category: EndingCategory;
  desc: string;
  condition: string;
  clue: string;
}

export interface PrivacySettings {
  firewallEnabled: boolean;
  privacyEnabled: boolean;
  antivirusEnabled: boolean;
  dnsEnabled: boolean;
}

export interface SystemSettings {
  sound: boolean;
  soundVolume: number;
  notifications: boolean;
  animations: boolean;
  crtEffect: boolean;
  photosensitiveSafe: boolean;
  theme: ThemeMode;
  accentColor: string;
  bluetooth: boolean;
  brightness: number;
  nightLight: boolean;
  powerMode: PowerMode;
  doNotDisturb: boolean;
  haptics: boolean;
  usbDebugging: boolean;
  overclockEnabled: boolean;
  autoTimeSync: boolean;
  uiCompact: boolean;
  lowBatteryThreshold: number;
}

export interface BluetoothDevice {
  id: string;
  name: string;
  category: 'audio' | 'input' | 'wearable' | 'anomaly';
  signal: number;
  battery?: number;
  mac: string;
  suspicious?: boolean;
  paired: boolean;
  connected: boolean;
}

export interface MorseSignalItem {
  id: string;
  title: string;
  freq: string;
  morse: string;
  answer: string;
  hint: string;
  dangerous?: boolean;
}

export interface UserProfile {
  name: string;
  avatar: string;
  email: string;
}

export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type BrowserTabView =
  | 'home'
  | 'wiki'
  | 'search_results'
  | 'jobs'
  | 'job_detail'
  | 'apply_result'
  | 'ritual'
  | 'code_truth'
  | 'lore_article'
  | 'invasion'
  | 'live_web'
  | 'rickroll'
  | 'void_404'
  | 'omega';

export interface BrowserHistoryEntry {
  tab: BrowserTabView;
  query: string;
  selectedJobId: number | null;
  activeArticleId: string | null;
  activeWikiId: string;
  liveUrl?: string;
}

export interface BrowserSubTab extends BrowserHistoryEntry {
  tabId: string;
  title: string;
  history: BrowserHistoryEntry[];
  historyIndex: number;
}

export interface BrowserInstanceState extends BrowserHistoryEntry {
  history: BrowserHistoryEntry[];
  historyIndex: number;
  tabs: BrowserSubTab[];
  activeTabId: string;
}

export interface BrowserBookmark {
  id: string;
  label: string;
  url: string;
}

export interface BrowserDownloadItem {
  id: string;
  filename: string;
  size: string;
  source: string;
  dangerous: boolean;
  executed: boolean;
  progress?: number;
}

export interface WindowInstance {
  instanceId: string;
  appId: AppId;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  rect: WindowRect;
  browserState?: BrowserInstanceState;
}

export interface WikiSection {
  id: string;
  title: string;
  subtitle: string;
  loreKey: string;
  paragraphs: string[];
  quickLinkLabel?: string;
  quickLinkQuery?: string;
}

export interface SearchArticle {
  id: string;
  title: string;
  url: string;
  summary: string;
  keywords: string[];
  loreKey: string;
  category: string;
  targetTab?: BrowserTabView;
  content: string[];
  relatedIds?: string[];
  sanityDelta?: number;
}

export interface JobListing {
  id: number;
  title: string;
  company: string;
  salary: string;
  desc: string;
  danger: string;
  requirement: string;
  anomalyNote: string;
  fakeCamera: boolean;
}

export interface EmailItem {
  id: string;
  title: string;
  sender: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical' | 'classified';
  body: string[];
  minStep?: number;
  requiresWarning?: boolean;
  actionType?: 'video_interview';
}

export interface ChatBubbleItem {
  id: string;
  sender: string;
  text: string;
  time: string;
  tone: 'normal' | 'player' | 'urgent' | 'corrupted';
}

export interface NewsBulletin {
  id: string;
  title: string;
  category: string;
  time: string;
  content: string;
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export interface DesktopAnomaly {
  id: string;
  title: string;
  detail: string;
  sanityPenalty: number;
}

export interface NotepadEntry {
  id: string;
  time: string;
  text: string;
  kind: 'clue' | 'warning' | 'user';
}

export interface StoreAppCatalogItem {
  id: StoreAppId;
  desktopName: string;
  iosName: string;
  developer: string;
  category: '开发工具' | '系统安全' | '效率实用' | '影音电波';
  size: string;
  sizeGb: number;
  rating: string;
  version: string;
  updateVersion: string;
  updateNote: string;
  tagline: string;
  description: string;
  releaseNote: string;
}
