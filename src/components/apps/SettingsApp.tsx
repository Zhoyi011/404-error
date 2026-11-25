import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Award,
  Battery,
  BatteryCharging,
  BellOff,
  Bluetooth,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cpu,
  Flame,
  HardDrive,
  Headphones,
  Info,
  Keyboard,
  Monitor,
  Moon,
  Palette,
  PlugZap,
  Power,
  RefreshCw,
  Search,
  Shield,
  Sliders,
  Smartphone,
  Sparkles,
  Sun,
  Terminal,
  Trash2,
  Usb,
  User,
  Volume2,
  Watch,
  Wifi,
  Wrench,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { BluetoothDevice, PowerMode, PrivacySettings, ThemeMode } from '../../types/game';
import { PWACachePanel } from '../PWAComponents';

type SettingsPage =
  | 'system'
  | 'power'
  | 'storage'
  | 'display'
  | 'bluetooth'
  | 'network'
  | 'personalization'
  | 'privacy'
  | 'advanced'
  | 'account'
  | 'about';

type MobileSettingsView =
  | 'root'
  | 'bluetooth'
  | 'general'
  | 'datetime'
  | 'storage'
  | 'battery'
  | 'display'
  | 'privacy'
  | 'developer'
  | 'account'
  | 'about'
  | 'sound'
  | 'focus';

const PAGE_LABELS: Record<SettingsPage, string> = {
  system: '系统与时间',
  power: '电源与电池',
  storage: '存储与磁盘清理',
  display: '显示与声音',
  bluetooth: '蓝牙和其他设备',
  network: '网络和 Internet',
  personalization: '个性化',
  privacy: '隐私和安全性',
  advanced: '高级与开发者',
  account: '账户',
  about: '关于与系统认证',
};

const IOS_PRIVACY_ROWS: { key: keyof PrivacySettings; title: string; desc: string }[] = [
  {
    key: 'firewallEnabled',
    title: '本地网络防火墙',
    desc: '监控 App 传入与传出端口连接，拦截未授权通信',
  },
  {
    key: 'privacyEnabled',
    title: '相机、蓝牙与硬件隐私锁',
    desc: '限制网页、ADB 或未知蓝牙读取摄像头、麦克风与音频流',
  },
  {
    key: 'antivirusEnabled',
    title: '实时恶意进程防护',
    desc: '持续检测后台异常负载并阻止异常区块写入与再生',
  },
  {
    key: 'dnsEnabled',
    title: '专用 DNS 安全加密',
    desc: '启用 DoH 加密域名解析，防止请求路由被劫持',
  },
];

const WIN_PRIVACY_ROWS: { key: keyof PrivacySettings; title: string; desc: string }[] = [
  {
    key: 'firewallEnabled',
    title: 'Windows 防火墙',
    desc: '监控传入和传出网络连接，阻止未经授权的端口通信',
  },
  {
    key: 'privacyEnabled',
    title: '硬件与蓝牙隐私权限保护',
    desc: '限制未签名应用、ADB 或未知蓝牙设备访问摄像头与音频流',
  },
  {
    key: 'antivirusEnabled',
    title: '实时病毒与威胁防护',
    desc: '持续扫描本地内存与磁盘扇区，阻止异常转储再生并隔离木马',
  },
  {
    key: 'dnsEnabled',
    title: 'DNS over HTTPS (DoH) 加密',
    desc: '通过加密通道解析域名，防止网络请求被中间节点劫持',
  },
];

const ACCENT_SWATCHES = ['#38bdf8', '#10b981', '#f59e0b', '#f43f5e', '#a855f7'];

function renderBtIcon(cat: BluetoothDevice['category']) {
  switch (cat) {
    case 'audio':
    case 'anomaly':
      return <Headphones className="w-4 h-4 shrink-0" />;
    case 'input':
      return <Keyboard className="w-4 h-4 shrink-0" />;
    case 'wearable':
      return <Watch className="w-4 h-4 shrink-0" />;
  }
}

const IosToggle: React.FC<{ checked: boolean; onChange: () => void; label: string }> = ({
  checked,
  onChange,
  label,
}) => (
  <button
    type="button"
    role="switch"
    aria-label={label}
    aria-checked={checked}
    onClick={onChange}
    className={`w-12 h-7 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
      checked ? 'bg-emerald-500' : 'bg-slate-400/50 dark:bg-slate-600'
    }`}
  >
    <span
      className={`block w-6 h-6 rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

const WinToggle: React.FC<{
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
  activeClass?: string;
  isLight?: boolean;
}> = ({ checked, onChange, ariaLabel, activeClass = 'bg-sky-500', isLight = false }) => (
  <button
    type="button"
    role="switch"
    aria-label={ariaLabel}
    aria-checked={checked}
    onClick={onChange}
    className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors shrink-0 ${
      checked ? activeClass : isLight ? 'bg-slate-300' : 'bg-slate-600'
    }`}
  >
    <span
      className={`block w-4 h-4 rounded-full bg-white transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

export const SettingsApp: React.FC = () => {
  const isMobile = useIsMobile();
  const {
    privacy,
    system,
    user,
    isOnline,
    clockTime,
    clockWarpCount,
    installedApps,
    openedStoreApps,
    updatedStoreApps,
    sanity,
    bluetoothDevices,
    bluetoothScanning,
    batteryLevel,
    isPluggedIn,
    batteryTelemetry,
    tempCacheGb,
    anomalyStorageGb,
    storageSnapshot,
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
    shutdownSystem,
    factoryResetAll,
    notify,
    openApp,
    togglePowerPlug,
    drainBatteryManual,
    triggerLowPowerStealthEnding,
    triggerOverclockMeltdown,
    cleanTempCache,
    purgeAnomalyStorage,
    triggerStorageZeroEnding,
    floodStorageDump,
    triggerUsbHijack,
    triggerSystemArchitectEnding,
  } = useGame();

  const [page, setPage] = useState<SettingsPage>('system');
  const [mobileView, setMobileView] = useState<MobileSettingsView>('root');
  const [navSearch, setNavSearch] = useState('');
  const [nameInput, setNameInput] = useState(user.name);
  const [emailInput, setEmailInput] = useState(user.email);
  const [confirmReset, setConfirmReset] = useState(false);

  const isLight = system.theme === 'light';
  const rowBg = isLight
    ? 'bg-white border-slate-200/90 text-slate-900'
    : 'bg-white/[0.04] border-white/[0.08] text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  const timeString = `${clockTime.getHours().toString().padStart(2, '0')}:${clockTime
    .getMinutes()
    .toString()
    .padStart(2, '0')}:${clockTime.getSeconds().toString().padStart(2, '0')}`;

  const connectedBtCount = bluetoothDevices.filter((d) => d.connected).length;
  const pctSystem = (storageSnapshot.systemOsGb / storageSnapshot.totalCapacityGb) * 100;
  const pctApps = (storageSnapshot.appsGb / storageSnapshot.totalCapacityGb) * 100;
  const pctTemp = (storageSnapshot.tempCacheGb / storageSnapshot.totalCapacityGb) * 100;
  const pctAnom = (storageSnapshot.anomalyGb / storageSnapshot.totalCapacityGb) * 100;

  const lowPowerStealthReady =
    !isPluggedIn &&
    system.powerMode === 'saver' &&
    system.brightness <= 50 &&
    (!isOnline || (privacy.firewallEnabled && privacy.privacyEnabled)) &&
    batteryLevel > 0 &&
    batteryLevel <= 35;

  const zeroStorageReady =
    privacy.antivirusEnabled && tempCacheGb <= 0.05 && anomalyStorageGb <= 0.05;

  const architectReady =
    installedApps.length === 6 &&
    openedStoreApps.length === 6 &&
    updatedStoreApps.length >= 1 &&
    anomalyStorageGb <= 0.05 &&
    batteryLevel >= 50 &&
    privacy.firewallEnabled &&
    privacy.privacyEnabled &&
    privacy.antivirusEnabled &&
    privacy.dnsEnabled &&
    sanity >= 80;

  /* ========================= iOS 27.2.1 MOBILE SETTINGS ========================= */
  if (isMobile) {
    const iosCard = isLight
      ? 'bg-white text-slate-900 divide-y divide-slate-200/80'
      : 'bg-slate-900/90 text-slate-100 divide-y divide-white/10';
    const iosMuted = isLight ? 'text-slate-500' : 'text-slate-400';

    if (mobileView !== 'root') {
      const viewTitles: Record<Exclude<MobileSettingsView, 'root'>, string> = {
        bluetooth: '蓝牙',
        general: '通用',
        datetime: '日期与时间',
        storage: 'iPhone 储存空间',
        battery: '电池与功耗',
        display: '显示与亮度',
        privacy: '隐私与安全性',
        developer: '开发者模式',
        account: 'Apple 账户',
        about: '关于本机',
        sound: '声音与触感',
        focus: '专注与通知模式',
      };

      const isGeneralChild =
        mobileView === 'about' ||
        mobileView === 'datetime' ||
        mobileView === 'storage' ||
        mobileView === 'developer';

      return (
        <div className="h-full min-h-0 overflow-y-auto p-4 pb-10 space-y-4">
          <button
            type="button"
            onClick={() => setMobileView(isGeneralChild ? 'general' : 'root')}
            className="flex items-center gap-1 text-sky-500 text-sm font-medium cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{isGeneralChild ? '通用' : '设置'}</span>
          </button>

          <h2 className="text-xl font-bold px-1">{viewTitles[mobileView]}</h2>

          {mobileView === 'bluetooth' && (
            <div className="space-y-4">
              <div className={`rounded-2xl overflow-hidden ${iosCard}`}>
                <div className="px-4 py-3.5 flex items-center justify-between text-sm">
                  <span>蓝牙</span>
                  <IosToggle label="蓝牙" checked={system.bluetooth} onChange={toggleBluetooth} />
                </div>
                {system.bluetooth && (
                  <button
                    type="button"
                    onClick={scanBluetoothDevices}
                    disabled={bluetoothScanning}
                    className="w-full px-4 py-3 flex items-center justify-between text-sm text-sky-500 cursor-pointer"
                  >
                    <span>{bluetoothScanning ? '正在扫描附近蓝牙信标...' : '扫描附近蓝牙设备'}</span>
                    <RefreshCw className={`w-4 h-4 ${bluetoothScanning ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>

              {system.bluetooth && (
                <div className="space-y-1.5">
                  <div className={`text-xs px-2 font-medium ${iosMuted}`}>可发现设备</div>
                  <div className={`rounded-2xl overflow-hidden ${iosCard}`}>
                    {bluetoothDevices.map((dev) => (
                      <button
                        key={dev.id}
                        type="button"
                        onClick={() => toggleBluetoothConnection(dev.id)}
                        className="w-full px-4 py-3.5 flex items-center justify-between gap-2 text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={dev.suspicious ? 'text-rose-400' : 'text-sky-500'}>
                            {renderBtIcon(dev.category)}
                          </span>
                          <div className="min-w-0">
                            <div
                              className={`text-sm font-medium truncate ${
                                dev.suspicious ? 'text-rose-400' : ''
                              }`}
                            >
                              {dev.name}
                            </div>
                            <div className={`text-[11px] font-mono-tabular ${iosMuted}`}>
                              {dev.mac} · 信号 {dev.signal}%{dev.battery ? ` · 电量 ${dev.battery}%` : ''}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-medium shrink-0 ${
                            dev.connected ? 'text-emerald-400' : 'text-sky-500'
                          }`}
                        >
                          {dev.connected ? '已连接' : dev.paired ? '连接' : '配对'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {mobileView === 'general' && (
            <div className="space-y-4">
              <div className={`rounded-2xl overflow-hidden ${iosCard}`}>
                <button
                  type="button"
                  onClick={() => setMobileView('about')}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-sm cursor-pointer"
                >
                  <span>关于本机</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-mono-tabular ${iosMuted}`}>iOS 27.2.1</span>
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileView('storage')}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-sm cursor-pointer"
                >
                  <span>iPhone 储存空间</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-mono-tabular ${iosMuted}`}>
                      {storageSnapshot.usedGb.toFixed(1)} / 64 GB
                    </span>
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileView('datetime')}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-sm cursor-pointer"
                >
                  <span>日期与时间</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-mono-tabular ${iosMuted}`}>
                      {timeString.slice(0, 5)}
                    </span>
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileView('developer')}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-sm cursor-pointer"
                >
                  <span>开发者模式与调试</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs ${iosMuted}`}>
                      {system.usbDebugging || system.overclockEnabled ? '已启用实验项' : '标准'}
                    </span>
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </div>
                </button>
              </div>

              <div className={`rounded-2xl overflow-hidden ${iosCard}`}>
                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="w-full px-4 py-3.5 text-center text-sm font-medium text-rose-500 cursor-pointer"
                  >
                    传输或还原 iPhone（抹掉所有数据）
                  </button>
                ) : (
                  <div className="p-4 space-y-2.5">
                    <div className="text-xs text-center text-rose-400">
                      将抹掉全部已解锁结局与本地档案，是否继续？
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmReset(false);
                          factoryResetAll();
                        }}
                        className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        确认抹掉
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="flex-1 py-2 rounded-xl bg-slate-700 text-slate-200 text-xs cursor-pointer"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className={`rounded-2xl overflow-hidden ${iosCard}`}>
                <button
                  type="button"
                  onClick={shutdownSystem}
                  className="w-full px-4 py-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-rose-500 cursor-pointer"
                >
                  <Power className="w-4 h-4" />
                  <span>关机</span>
                </button>
              </div>
            </div>
          )}

          {mobileView === 'storage' && (
            <div className="space-y-4">
              <div className={`rounded-2xl p-4 space-y-3 ${isLight ? 'bg-white' : 'bg-slate-900/90'}`}>
                <div className="flex justify-between text-xs font-mono-tabular">
                  <span className="font-semibold">已使用 {storageSnapshot.usedGb.toFixed(1)} GB</span>
                  <span className={iosMuted}>可用 {storageSnapshot.freeGb.toFixed(1)} GB / 64 GB</span>
                </div>
                <div className="h-3 rounded-full bg-slate-700/40 overflow-hidden flex">
                  <div className="h-full bg-slate-500" style={{ width: `${pctSystem}%` }} />
                  <div className="h-full bg-sky-500" style={{ width: `${pctApps}%` }} />
                  <div className="h-full bg-amber-400" style={{ width: `${pctTemp}%` }} />
                  <div className="h-full bg-rose-500" style={{ width: `${pctAnom}%` }} />
                </div>
                <div className={`text-xs space-y-1.5 pt-2 ${iosMuted}`}>
                  <div className="flex justify-between">
                    <span>iOS 27.2.1 系统文件</span>
                    <span className="font-mono-tabular">{storageSnapshot.systemOsGb} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>已安装 App Store 应用 ({installedApps.length} 款)</span>
                    <span className="font-mono-tabular">{storageSnapshot.appsGb} GB</span>
                  </div>
                  <div className="flex justify-between text-amber-400">
                    <span>Safary 离线缓存与临时日志</span>
                    <span className="font-mono-tabular">{tempCacheGb.toFixed(1)} GB</span>
                  </div>
                  <div className="flex justify-between text-rose-400">
                    <span>异常隐藏镜像区块</span>
                    <span className="font-mono-tabular">{anomalyStorageGb.toFixed(1)} GB</span>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-4 space-y-2.5 ${isLight ? 'bg-white' : 'bg-slate-900/90'}`}>
                <button
                  type="button"
                  onClick={cleanTempCache}
                  disabled={tempCacheGb <= 0.05}
                  className="w-full py-2.5 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-semibold disabled:opacity-45 cursor-pointer"
                >
                  清理离线缓存 ({tempCacheGb.toFixed(1)} GB)
                </button>
                <button
                  type="button"
                  onClick={purgeAnomalyStorage}
                  disabled={anomalyStorageGb <= 0.05}
                  className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold disabled:opacity-45 cursor-pointer"
                >
                  零字节粉碎异常区块 ({anomalyStorageGb.toFixed(1)} GB)
                </button>
                <button
                  type="button"
                  onClick={triggerStorageZeroEnding}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                    zeroStorageReady
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  确认零字节净空认证 (#44)
                </button>
              </div>
            </div>
          )}

          {mobileView === 'battery' && (
            <div className="space-y-4">
              <div className={`rounded-2xl p-4 space-y-3 ${isLight ? 'bg-white' : 'bg-slate-900/90'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs opacity-70">当前实时电量</div>
                    <div className="text-2xl font-bold font-mono-tabular text-emerald-400">
                      {Math.round(batteryLevel)}%
                    </div>
                  </div>
                  <div className="text-right text-xs font-mono-tabular space-y-0.5">
                    <div>{isPluggedIn ? '⚡ USB-C 充电中' : '🔋 电池供电中'}</div>
                    <div className={iosMuted}>
                      功耗 {batteryTelemetry.watts}W · 温度 {batteryTelemetry.tempC}°C
                    </div>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-slate-700/40 overflow-hidden">
                  <div
                    className={`h-full transition-[width] duration-300 ${
                      batteryLevel <= 20
                        ? 'bg-rose-500'
                        : isPluggedIn
                          ? 'bg-emerald-400'
                          : 'bg-sky-400'
                    }`}
                    style={{ width: `${Math.round(batteryLevel)}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={togglePowerPlug}
                    className={`py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
                      isPluggedIn
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500 text-slate-950'
                    }`}
                  >
                    {isPluggedIn ? '拔掉充电线' : '插上充电线'}
                  </button>
                  <button
                    type="button"
                    onClick={() => drainBatteryManual(24)}
                    disabled={isPluggedIn}
                    className="py-2.5 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    高负载耗电 (-24%)
                  </button>
                </div>
              </div>

              <div className={`rounded-2xl overflow-hidden ${iosCard}`}>
                <div className="px-4 py-3.5 space-y-2">
                  <div className="text-sm font-medium">性能调度策略</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'saver', label: '低电量模式' },
                        { id: 'balanced', label: '智能平衡' },
                        { id: 'performance', label: '高性能' },
                      ] as { id: PowerMode; label: string }[]
                    ).map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => updateSystem({ powerMode: pm.id })}
                        className={`py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                          system.powerMode === pm.id
                            ? 'bg-sky-500 text-white'
                            : 'bg-slate-500/15 opacity-80'
                        }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="px-4 py-3.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm">零功耗静默守夜 (#42)</div>
                    <div className={`text-[11px] ${iosMuted}`}>
                      需拔线、低电量模式、亮度≤50%、断网或开双盾、电量 1-35%
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={triggerLowPowerStealthEnding}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
                      lowPowerStealthReady
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    启动守夜
                  </button>
                </div>
              </div>
            </div>
          )}

          {mobileView === 'developer' && (
            <div className="space-y-4">
              <div className={`rounded-2xl overflow-hidden ${iosCard}`}>
                <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm">自动设置日期与时间</div>
                    <div className={`text-[11px] ${iosMuted}`}>
                      关闭后连续改时间 ≥5 次将触发时间悖论 (#48)
                    </div>
                  </div>
                  <IosToggle
                    label="自动设置日期与时间"
                    checked={system.autoTimeSync}
                    onChange={() => updateSystem({ autoTimeSync: !system.autoTimeSync })}
                  />
                </div>
                <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm">USB 调试 / 无线 ADB</div>
                    <div className={`text-[11px] ${iosMuted}`}>
                      无硬件隐私锁保护且联网时极其危险 (#46)
                    </div>
                  </div>
                  <IosToggle
                    label="USB 调试"
                    checked={system.usbDebugging}
                    onChange={() => updateSystem({ usbDebugging: !system.usbDebugging })}
                  />
                </div>
                {system.usbDebugging && (
                  <div className="px-4 py-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-amber-300">检测到待授权 ADB 调试请求</span>
                    <button
                      type="button"
                      onClick={triggerUsbHijack}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-semibold cursor-pointer shrink-0"
                    >
                      握手校验
                    </button>
                  </div>
                )}
                <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-rose-400">解锁芯片超频与温控上限</div>
                    <div className={`text-[11px] ${iosMuted}`}>
                      插电开启高性能+满亮度压测可触发熔断 (#45)
                    </div>
                  </div>
                  <IosToggle
                    label="解锁超频"
                    checked={system.overclockEnabled}
                    onChange={() => updateSystem({ overclockEnabled: !system.overclockEnabled })}
                  />
                </div>
                {system.overclockEnabled && (
                  <div className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => triggerOverclockMeltdown(false)}
                      className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      执行极端峰值热压测 (#45)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {mobileView === 'focus' && (
            <div className={`rounded-2xl overflow-hidden ${iosCard}`}>
              <div className="px-4 py-3.5 flex items-center justify-between text-sm">
                <div>
                  <div>勿扰模式</div>
                  <div className={`text-[11px] ${iosMuted}`}>屏蔽非必要的系统异常弹窗干扰</div>
                </div>
                <IosToggle
                  label="勿扰模式"
                  checked={system.doNotDisturb}
                  onChange={() => updateSystem({ doNotDisturb: !system.doNotDisturb })}
                />
              </div>
            </div>
          )}

          {mobileView === 'about' && (
            <div className="space-y-4">
              <div className={`rounded-2xl overflow-hidden text-sm ${iosCard}`}>
                <div className="px-4 py-3.5 flex items-center justify-between">
                  <span>名称</span>
                  <span className={iosMuted}>{user.name} 的 iPhone</span>
                </div>
                <div className="px-4 py-3.5 flex items-center justify-between">
                  <span>iOS 版本</span>
                  <span className={`font-mono-tabular ${iosMuted}`}>27.2.1</span>
                </div>
                <div className="px-4 py-3.5 flex items-center justify-between">
                  <span>机型名称</span>
                  <span className={iosMuted}>老旧 iPhone 备用机 (4.00 GB 运存)</span>
                </div>
                <div className="px-4 py-3.5 flex items-center justify-between">
                  <span>网络状态</span>
                  <span className={iosMuted}>{isOnline ? 'WLAN 正常' : '离线模式'}</span>
                </div>
              </div>
              <div className={`rounded-2xl p-4 space-y-2 ${isLight ? 'bg-white' : 'bg-slate-900/90'}`}>
                <div className="text-sm font-bold flex items-center gap-1.5 text-amber-300">
                  <Award className="w-4 h-4" />
                  <span>终极系统架构师认证 (#50)</span>
                </div>
                <p className={`text-xs ${iosMuted}`}>
                  装齐并打开商店 6 款软件、升级 1 个补丁、异常存储归零、电量 ≥ 50%、四盾全开且理智 ≥ 80%。
                </p>
                <button
                  type="button"
                  onClick={triggerSystemArchitectEnding}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                    architectReady ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  提交架构师认证
                </button>
              </div>
              <PWACachePanel isLight={isLight} />
            </div>
          )}

          {mobileView === 'datetime' && (
            <div className="space-y-4">
              <div className={`rounded-2xl overflow-hidden ${iosCard}`}>
                <div className="px-4 py-3.5 flex items-center justify-between text-sm">
                  <span>当前设备时间</span>
                  <span className="font-mono-tabular font-semibold text-sky-500">{timeString}</span>
                </div>
                <div className="px-4 py-3.5 flex items-center justify-between text-sm">
                  <div>
                    <div>自动设置</div>
                    <div className={`text-[11px] ${iosMuted}`}>
                      {system.autoTimeSync
                        ? '已锁定网络时区'
                        : `手动模式 · 时间扰动 ${clockWarpCount}/5`}
                    </div>
                  </div>
                  <IosToggle
                    label="自动设置日期与时间"
                    checked={system.autoTimeSync}
                    onChange={() => updateSystem({ autoTimeSync: !system.autoTimeSync })}
                  />
                </div>
                <div className="px-4 py-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => advanceClockMinutes(10)}
                    className="py-2 rounded-xl bg-slate-500/15 text-xs font-semibold cursor-pointer"
                  >
                    +10 分钟
                  </button>
                  <button
                    type="button"
                    onClick={() => advanceClockMinutes(60)}
                    className="py-2 rounded-xl bg-slate-500/15 text-xs font-semibold cursor-pointer"
                  >
                    +1 小时
                  </button>
                  <button
                    type="button"
                    onClick={setClockToMidnight}
                    className="py-2 rounded-xl bg-slate-500/15 text-xs font-semibold cursor-pointer"
                  >
                    设为 00:00
                  </button>
                  <button
                    type="button"
                    onClick={setClockToMorning}
                    className="py-2 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-semibold cursor-pointer"
                  >
                    设为 06:00
                  </button>
                  <button
                    type="button"
                    onClick={resetClock}
                    className="col-span-2 py-2 rounded-xl bg-sky-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    自动网络同步
                  </button>
                </div>
              </div>
            </div>
          )}

          {mobileView === 'sound' && (
            <div className={`rounded-2xl overflow-hidden ${iosCard}`}>
              <div className="px-4 py-3.5 flex items-center justify-between">
                <span className="text-sm">系统提示音效</span>
                <IosToggle
                  label="系统提示音效"
                  checked={system.sound}
                  onChange={() => updateSystem({ sound: !system.sound })}
                />
              </div>
              <div className="px-4 py-3.5 flex items-center justify-between">
                <span className="text-sm">触感反馈</span>
                <IosToggle
                  label="触感反馈"
                  checked={system.haptics}
                  onChange={() => updateSystem({ haptics: !system.haptics })}
                />
              </div>
              <div className="px-4 py-3.5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span>铃声与提醒音量</span>
                  <span className={`font-mono-tabular ${iosMuted}`}>{system.soundVolume}%</span>
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
          )}

          {mobileView === 'display' && (
            <div className="space-y-4">
              <div className={`rounded-2xl p-4 space-y-3 ${isLight ? 'bg-white' : 'bg-slate-900/90'}`}>
                <div className="text-xs font-semibold opacity-75">外观</div>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'dark', label: '深色' },
                      { id: 'light', label: '浅色' },
                      { id: 'horror', label: '血色' },
                    ] as { id: ThemeMode; label: string }[]
                  ).map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => updateSystem({ theme: th.id })}
                      className={`py-2.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                        system.theme === th.id
                          ? 'bg-sky-500 border-sky-400 text-white'
                          : isLight
                            ? 'bg-slate-100 border-slate-200 text-slate-700'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {th.label}
                    </button>
                  ))}
                </div>
                <div className="pt-2 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span>屏幕亮度</span>
                    <span className={`font-mono-tabular ${iosMuted}`}>{system.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={100}
                    value={system.brightness}
                    onChange={(e) => updateSystem({ brightness: Number(e.target.value) })}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className={`rounded-2xl overflow-hidden ${iosCard}`}>
                <div className="px-4 py-3.5 flex items-center justify-between text-sm">
                  <span>夜览护眼模式 (Night Shift)</span>
                  <IosToggle
                    label="夜览"
                    checked={system.nightLight}
                    onChange={() => updateSystem({ nightLight: !system.nightLight })}
                  />
                </div>
                <div className="px-4 py-3.5 flex items-center justify-between text-sm">
                  <span>CRT 扫描线滤镜</span>
                  <IosToggle
                    label="CRT 扫描线滤镜"
                    checked={system.crtEffect}
                    onChange={() => updateSystem({ crtEffect: !system.crtEffect })}
                  />
                </div>
                <div className="px-4 py-3.5 flex items-center justify-between text-sm">
                  <span>界面过渡动画</span>
                  <IosToggle
                    label="界面过渡动画"
                    checked={system.animations}
                    onChange={() => updateSystem({ animations: !system.animations })}
                  />
                </div>
                <div className="px-4 py-3.5 flex items-center justify-between text-sm gap-3">
                  <div>
                    <div>光敏安全模式</div>
                    <div className={`text-[11px] ${iosMuted}`}>屏蔽闪烁与突发突脸惊吓</div>
                  </div>
                  <IosToggle
                    label="光敏安全模式"
                    checked={system.photosensitiveSafe}
                    onChange={() =>
                      updateSystem({ photosensitiveSafe: !system.photosensitiveSafe })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {mobileView === 'privacy' && (
            <div className={`rounded-2xl overflow-hidden ${iosCard}`}>
              {IOS_PRIVACY_ROWS.map((row) => (
                <div key={row.key} className="px-4 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{row.title}</div>
                    <div className={`text-[11px] mt-0.5 leading-snug ${iosMuted}`}>{row.desc}</div>
                  </div>
                  <IosToggle
                    label={row.title}
                    checked={privacy[row.key]}
                    onChange={() => togglePrivacyFlag(row.key)}
                  />
                </div>
              ))}
            </div>
          )}

          {mobileView === 'account' && (
            <div className={`rounded-2xl p-4 space-y-3.5 ${isLight ? 'bg-white' : 'bg-slate-900/90'}`}>
              <div className="flex gap-2 justify-center">
                {['👤', '👻', '🎭', '🕵️', '🤖'].map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => updateUser({ avatar: av })}
                    className={`w-10 h-10 rounded-full border text-lg flex items-center justify-center cursor-pointer ${
                      user.avatar === av ? 'border-sky-500 bg-sky-500/15' : 'border-slate-600/40'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Apple 账户名称"
                className="w-full rounded-xl border border-slate-500/30 bg-transparent px-3 py-2 text-sm outline-none"
              />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="iCloud 邮箱"
                className="w-full rounded-xl border border-slate-500/30 bg-transparent px-3 py-2 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  updateUser({
                    name: nameInput.trim() || user.name,
                    email: emailInput.trim() || user.email,
                  });
                  notify('Apple 账户信息已保存', 'success');
                }}
                className="w-full py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold cursor-pointer"
              >
                保存更改
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="h-full min-h-0 overflow-y-auto p-4 space-y-4 pb-10">
        <h2 className="text-2xl font-bold px-1">设置</h2>

        {/* Apple Account Card */}
        <button
          type="button"
          onClick={() => setMobileView('account')}
          className={`w-full rounded-2xl p-3.5 flex items-center justify-between gap-3 text-left cursor-pointer ${
            isLight ? 'bg-white text-slate-900' : 'bg-slate-900/90 text-slate-100'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center text-2xl shrink-0">
              {user.avatar}
            </div>
            <div className="min-w-0">
              <div className="text-base font-semibold truncate">{user.name}</div>
              <div className={`text-xs truncate ${iosMuted}`}>Apple 账户、iCloud 与本机信息</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 opacity-40 shrink-0" />
        </button>

        {/* Connectivity Group */}
        <div className={`rounded-2xl overflow-hidden ${iosCard}`}>
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center">
                <Wifi className="w-4 h-4" />
              </span>
              <div>
                <div className="text-sm font-medium">无线局域网 (WLAN)</div>
                <div className={`text-[11px] ${iosMuted}`}>{isOnline ? 'Home_5G_Node' : '未连接'}</div>
              </div>
            </div>
            <IosToggle label="无线局域网" checked={isOnline} onChange={toggleNetwork} />
          </div>

          <button
            type="button"
            onClick={() => setMobileView('bluetooth')}
            className="w-full px-4 py-3 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Bluetooth className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium">蓝牙</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs ${iosMuted}`}>
                {!system.bluetooth
                  ? '关闭'
                  : connectedBtCount > 0
                    ? `已连 ${connectedBtCount} 台`
                    : '开启'}
              </span>
              <ChevronRight className="w-4 h-4 opacity-40" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMobileView('sound')}
            className="w-full px-4 py-3 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center">
                <Volume2 className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium">声音与触感</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-40" />
          </button>

          <button
            type="button"
            onClick={() => setMobileView('focus')}
            className="w-full px-4 py-3 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium">专注与勿扰模式</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs ${iosMuted}`}>{system.doNotDisturb ? '已开启' : '关闭'}</span>
              <ChevronRight className="w-4 h-4 opacity-40" />
            </div>
          </button>
        </div>

        {/* General / Display / Battery / Privacy / Developer Group */}
        <div className={`rounded-2xl overflow-hidden ${iosCard}`}>
          <button
            type="button"
            onClick={() => setMobileView('general')}
            className="w-full px-4 py-3 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-slate-500 text-white flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium">通用</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-mono-tabular ${iosMuted}`}>iOS 27.2.1</span>
              <ChevronRight className="w-4 h-4 opacity-40" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMobileView('display')}
            className="w-full px-4 py-3 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                <Palette className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium">显示与亮度</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-40" />
          </button>

          <button
            type="button"
            onClick={() => setMobileView('battery')}
            className="w-full px-4 py-3 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                <BatteryCharging className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium">电池与性能</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-mono-tabular ${iosMuted}`}>
                {Math.round(batteryLevel)}% {isPluggedIn ? '⚡' : ''}
              </span>
              <ChevronRight className="w-4 h-4 opacity-40" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMobileView('storage')}
            className="w-full px-4 py-3 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                <HardDrive className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium">iPhone 储存空间</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-mono-tabular ${iosMuted}`}>
                {storageSnapshot.usedGb.toFixed(1)}/64G
              </span>
              <ChevronRight className="w-4 h-4 opacity-40" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMobileView('privacy')}
            className="w-full px-4 py-3 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium">隐私与安全性</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-40" />
          </button>

          <button
            type="button"
            onClick={() => setMobileView('developer')}
            className="w-full px-4 py-3 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-zinc-700 text-white flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium">开发者模式</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-40" />
          </button>
        </div>

        <div className={`rounded-2xl overflow-hidden ${iosCard}`}>
          <button
            type="button"
            onClick={shutdownSystem}
            className="w-full px-4 py-3.5 text-center text-sm font-semibold text-rose-500 cursor-pointer"
          >
            关机
          </button>
        </div>
      </div>
    );
  }

  /* ========================= DESKTOP WIN11 SETTINGS ========================= */
  const navItems: {
    id: SettingsPage;
    label: string;
    keywords: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'system',
      label: '系统与时间',
      keywords: '时间 日期 通知 勿扰 重置',
      icon: <Monitor className="w-4 h-4 text-sky-400 shrink-0" />,
    },
    {
      id: 'power',
      label: '电源与电池',
      keywords: '电量 充电 功耗 省电 性能 温度',
      icon: <BatteryCharging className="w-4 h-4 text-emerald-400 shrink-0" />,
    },
    {
      id: 'storage',
      label: '存储与磁盘清理',
      keywords: '磁盘 硬盘 空间 缓存 清理 扇区',
      icon: <HardDrive className="w-4 h-4 text-amber-400 shrink-0" />,
    },
    {
      id: 'display',
      label: '显示与声音',
      keywords: '亮度 护眼 音量 音效 扫描线 动画 光敏',
      icon: <Sun className="w-4 h-4 text-yellow-400 shrink-0" />,
    },
    {
      id: 'bluetooth',
      label: '蓝牙和其他设备',
      keywords: '耳机 键盘 无线 ble',
      icon: <Bluetooth className="w-4 h-4 text-blue-400 shrink-0" />,
    },
    {
      id: 'network',
      label: '网络和 Internet',
      keywords: 'wifi wlan dns ip',
      icon: <Wifi className="w-4 h-4 text-sky-400 shrink-0" />,
    },
    {
      id: 'personalization',
      label: '个性化',
      keywords: '主题 深色 浅色 壁纸 强调色',
      icon: <Palette className="w-4 h-4 text-purple-400 shrink-0" />,
    },
    {
      id: 'privacy',
      label: '隐私和安全性',
      keywords: '防火墙 杀毒 病毒 doh 权限',
      icon: <Shield className="w-4 h-4 text-emerald-400 shrink-0" />,
    },
    {
      id: 'advanced',
      label: '高级与开发者',
      keywords: 'usb adb 超频 校时 开发者',
      icon: <Wrench className="w-4 h-4 text-rose-400 shrink-0" />,
    },
    {
      id: 'account',
      label: '账户',
      keywords: '头像 用户名 邮箱',
      icon: <User className="w-4 h-4 text-sky-400 shrink-0" />,
    },
    {
      id: 'about',
      label: '关于与系统认证',
      keywords: '配置 规格 架构师 pwa 离线',
      icon: <Info className="w-4 h-4 text-sky-400 shrink-0" />,
    },
  ];

  const q = navSearch.trim().toLowerCase();
  const filteredNav = navItems.filter(
    (n) => !q || n.label.toLowerCase().includes(q) || n.keywords.toLowerCase().includes(q)
  );

  return (
    <div className="flex flex-col sm:flex-row h-full min-h-0 overflow-hidden">
      {/* Win11 Left Sidebar — Scrollable independently with flex-1 min-h-0 */}
      <aside
        className={`flex flex-col sm:w-56 sm:h-full sm:min-h-0 border-b sm:border-b-0 sm:border-r p-3 gap-2.5 shrink-0 overflow-hidden ${
          isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-black/25 border-white/10'
        }`}
      >
        <div className="flex items-center gap-2.5 px-2 py-1 max-sm:hidden shrink-0">
          <div className="w-9 h-9 rounded-full bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-lg shrink-0">
            {user.avatar}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate">{user.name}</div>
            <div className={`text-[10px] truncate ${mutedText}`}>{user.email}</div>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs max-sm:hidden shrink-0 ${
            isLight
              ? 'bg-white border-slate-300 text-slate-800'
              : 'bg-white/[0.06] border-white/10 text-slate-200'
          }`}
        >
          <input
            type="text"
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            placeholder="查找设置 (如: 电量 / 磁盘)"
            className="bg-transparent outline-none w-full placeholder:text-slate-500"
          />
          <Search className="w-3.5 h-3.5 opacity-60 shrink-0" />
        </div>

        <nav className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-x-hidden sm:overflow-y-auto sm:flex-1 sm:min-h-0 sm:pr-1">
          {filteredNav.length === 0 ? (
            <div className={`px-3 py-2 text-[11px] ${mutedText}`}>未找到匹配设置项</div>
          ) : (
            filteredNav.map((item) => {
              const active = page === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPage(item.id)}
                  className={`relative flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? isLight
                        ? 'bg-black/[0.06] text-slate-950 font-semibold'
                        : 'bg-white/[0.09] text-white font-semibold'
                      : isLight
                        ? 'text-slate-700 hover:bg-black/[0.04]'
                        : 'text-slate-300 hover:bg-white/[0.05]'
                  }`}
                >
                  {active && (
                    <span className="hidden sm:block absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-sky-400" />
                  )}
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })
          )}
        </nav>
      </aside>

      {/* Win11 Right Pane */}
      <div className="flex-1 min-h-0 p-5 sm:p-6 overflow-y-auto space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-lg font-semibold">{PAGE_LABELS[page]}</div>
          <div className={`text-[11px] font-mono-tabular ${mutedText}`}>
            电量 {Math.round(batteryLevel)}% · 磁盘可用 {storageSnapshot.freeGb.toFixed(1)} GB
          </div>
        </div>

        {page === 'system' && (
          <div className="space-y-2.5">
            {/* Clock & Time */}
            <div className={`rounded-lg border p-4 flex flex-wrap items-center justify-between gap-3 ${rowBg}`}>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-sky-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">日期和时间</div>
                  <div className={`text-[11px] font-mono-tabular ${mutedText}`}>
                    当前本地时间：{timeString} ·{' '}
                    {system.autoTimeSync ? '自动网络校时已锁' : `手动偏移 (扰动 ${clockWarpCount}/5)`}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => advanceClockMinutes(10)}
                  className={`px-2.5 py-1.5 rounded-md border text-xs font-medium cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 border-slate-300 hover:bg-slate-200'
                      : 'bg-white/10 border-white/15 hover:bg-white/15'
                  }`}
                >
                  +10分
                </button>
                <button
                  type="button"
                  onClick={() => advanceClockMinutes(60)}
                  className={`px-2.5 py-1.5 rounded-md border text-xs font-medium cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 border-slate-300 hover:bg-slate-200'
                      : 'bg-white/10 border-white/15 hover:bg-white/15'
                  }`}
                >
                  +1小时
                </button>
                <button
                  type="button"
                  onClick={setClockToMidnight}
                  className={`px-3 py-1.5 rounded-md border text-xs font-medium cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 border-slate-300 hover:bg-slate-200'
                      : 'bg-white/10 border-white/15 hover:bg-white/15'
                  }`}
                >
                  设为 00:00
                </button>
                <button
                  type="button"
                  onClick={setClockToMorning}
                  className={`px-3 py-1.5 rounded-md border text-xs font-medium cursor-pointer ${
                    isLight
                      ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                      : 'bg-amber-500/15 border-amber-500/35 text-amber-200 hover:bg-amber-500/25'
                  }`}
                >
                  设为 06:00
                </button>
                <button
                  type="button"
                  onClick={resetClock}
                  className="px-3 py-1.5 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold cursor-pointer"
                >
                  立即同步
                </button>
              </div>
            </div>

            {/* Auto Time Sync toggle */}
            <div className={`rounded-lg border p-4 flex items-center justify-between gap-4 ${rowBg}`}>
              <div>
                <div className="text-xs font-semibold">自动设置网络时间与时区</div>
                <div className={`text-[11px] ${mutedText}`}>
                  关闭后允许手动反复穿梭修改系统时钟（提示：过度篡改时间可能引发悖论）
                </div>
              </div>
              <WinToggle
                ariaLabel="自动网络校时"
                checked={system.autoTimeSync}
                onChange={() => updateSystem({ autoTimeSync: !system.autoTimeSync })}
                isLight={isLight}
              />
            </div>

            {/* Focus / DND & Notifications */}
            <div className={`rounded-lg border p-4 space-y-3 ${rowBg}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <BellOff className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">专注时段（勿扰模式）</div>
                    <div className={`text-[11px] ${mutedText}`}>抑制周期性非紧急桌面弹窗打扰</div>
                  </div>
                </div>
                <WinToggle
                  ariaLabel="勿扰模式"
                  checked={system.doNotDisturb}
                  onChange={() => updateSystem({ doNotDisturb: !system.doNotDisturb })}
                  isLight={isLight}
                />
              </div>
              <div className="pt-2.5 border-t border-slate-700/25 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold">桌面通知横幅</div>
                  <div className={`text-[11px] ${mutedText}`}>控制应用与系统事件底部 Toast 提示</div>
                </div>
                <WinToggle
                  ariaLabel="桌面通知"
                  checked={system.notifications}
                  onChange={() => updateSystem({ notifications: !system.notifications })}
                  isLight={isLight}
                />
              </div>
            </div>

            {/* Quick jump cards to Power & Storage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPage('power')}
                className={`rounded-lg border p-3.5 text-left flex items-center justify-between gap-2 cursor-pointer hover:border-sky-400/50 ${rowBg}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <BatteryCharging className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">电源与电池</div>
                    <div className={`text-[11px] font-mono-tabular ${mutedText}`}>
                      {Math.round(batteryLevel)}% · {isPluggedIn ? '已接电源' : '电池放电中'}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setPage('storage')}
                className={`rounded-lg border p-3.5 text-left flex items-center justify-between gap-2 cursor-pointer hover:border-sky-400/50 ${rowBg}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <HardDrive className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">存储与磁盘清理</div>
                    <div className={`text-[11px] font-mono-tabular ${mutedText}`}>
                      已用 {storageSnapshot.usedGb.toFixed(1)} / {storageSnapshot.totalCapacityGb} GB
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
              </button>
            </div>

            {/* Factory Reset */}
            <div className={`rounded-lg border p-4 flex items-center justify-between gap-4 ${rowBg}`}>
              <div>
                <div className="text-xs font-semibold">重置此电脑</div>
                <div className={`text-[11px] ${mutedText}`}>清除所有本地记录、图鉴成就与个人配置</div>
              </div>
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
                >
                  初始化电脑
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmReset(false);
                      factoryResetAll();
                    }}
                    className="px-3 py-1.5 rounded-md bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    确认清除
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className={`px-3 py-1.5 rounded-md border text-xs cursor-pointer ${rowBg}`}
                  >
                    取消
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {page === 'power' && (
          <div className="space-y-3">
            {/* Battery Hero Telemetry */}
            <div className={`rounded-lg border p-4 space-y-3 ${rowBg}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                      batteryLevel <= 20
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                        : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                    }`}
                  >
                    {isPluggedIn ? (
                      <BatteryCharging className="w-5 h-5" />
                    ) : (
                      <Battery className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold font-mono-tabular">
                      当前电量：{Math.round(batteryLevel)}%{' '}
                      <span className="text-xs font-normal opacity-80">
                        ({isPluggedIn ? '已接通交流电源' : '独立电池放电中'})
                      </span>
                    </div>
                    <div className={`text-[11px] font-mono-tabular ${mutedText}`}>
                      实时功耗 {batteryTelemetry.watts} W · 核心温度 {batteryTelemetry.tempC}°C ·{' '}
                      {isPluggedIn
                        ? `约 ${batteryTelemetry.estimatedMinutesLeft} 分钟充满`
                        : `预计续航 ${batteryTelemetry.estimatedMinutesLeft} 分钟`}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePowerPlug}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                      isPluggedIn
                        ? 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    }`}
                  >
                    <PlugZap className="w-3.5 h-3.5" />
                    <span>{isPluggedIn ? '拔掉电源适配器' : '接通电源适配器'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => drainBatteryManual(24)}
                    disabled={isPluggedIn}
                    className="px-3 py-1.5 rounded-md bg-rose-600/20 hover:bg-rose-600/35 disabled:opacity-40 border border-rose-500/40 text-rose-300 text-xs font-semibold cursor-pointer"
                  >
                    高负载耗电 (-24%)
                  </button>
                </div>
              </div>

              <div className="h-2.5 rounded-full bg-slate-700/40 overflow-hidden">
                <div
                  className={`h-full transition-[width] duration-300 ${
                    batteryLevel <= 20
                      ? 'bg-rose-500'
                      : isPluggedIn
                        ? 'bg-emerald-400'
                        : 'bg-sky-400'
                  }`}
                  style={{ width: `${Math.round(batteryLevel)}%` }}
                />
              </div>
            </div>

            {/* Power Mode Selector */}
            <div className={`rounded-lg border p-4 space-y-3 ${rowBg}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold">电源模式与性能调度</div>
                  <div className={`text-[11px] ${mutedText}`}>
                    极致省电可大幅压低散热与电磁外泄；最佳性能会加速掉电与升温
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'saver', label: '极致省电' },
                      { id: 'balanced', label: '智能平衡' },
                      { id: 'performance', label: '最佳性能' },
                    ] as { id: PowerMode; label: string }[]
                  ).map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => updateSystem({ powerMode: pm.id })}
                      className={`px-3 py-1.5 rounded text-xs font-medium border cursor-pointer ${
                        system.powerMode === pm.id
                          ? 'bg-sky-500 border-sky-400 text-slate-950 font-semibold'
                          : isLight
                            ? 'bg-slate-100 border-slate-300 text-slate-700'
                            : 'bg-white/5 border-white/10 text-slate-300'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-700/25 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold font-mono-tabular">
                    低电量告警阈值 ({system.lowBatteryThreshold}%)
                  </div>
                  <div className={`text-[11px] ${mutedText}`}>
                    当未接电源且电量低于该阈值时发出安全提醒
                  </div>
                </div>
                <input
                  type="range"
                  min={10}
                  max={40}
                  step={5}
                  value={system.lowBatteryThreshold}
                  onChange={(e) =>
                    updateSystem({ lowBatteryThreshold: Number(e.target.value) })
                  }
                  className="w-36 accent-sky-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Low-Power Stealth Action (#42) */}
            <div
              className={`rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                lowPowerStealthReady ? 'bg-emerald-500/10 border-emerald-400/45' : rowBg
              }`}
            >
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Moon className="w-4 h-4 shrink-0" />
                  <span>零功耗静默守夜协议 (#42)</span>
                </div>
                <div className={`text-[11px] leading-relaxed ${mutedText}`}>
                  条件：拔掉电源 ({!isPluggedIn ? '✓' : '未拔'}) · 极致省电 (
                  {system.powerMode === 'saver' ? '✓' : '未选'}) · 屏幕亮度 ≤50% (
                  {system.brightness <= 50 ? '✓' : `${system.brightness}%`}) · 断网或防火墙+隐私锁 (
                  {!isOnline || (privacy.firewallEnabled && privacy.privacyEnabled) ? '✓' : '未隔离'}
                  ) · 电量 1%~35% ({batteryLevel > 0 && batteryLevel <= 35 ? '✓' : `${Math.round(batteryLevel)}%`})
                </div>
              </div>
              <button
                type="button"
                onClick={triggerLowPowerStealthEnding}
                className={`px-3.5 py-2 rounded-md text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                  lowPowerStealthReady
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-white/10 hover:bg-white/15 text-slate-300'
                }`}
              >
                启动零功耗守夜
              </button>
            </div>

            {/* Overclock Stress Card (#45) */}
            <div className={`rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${rowBg}`}>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 shrink-0" />
                  <span>峰值超频供电压测 (#45)</span>
                </div>
                <div className={`text-[11px] ${mutedText}`}>
                  需在「高级与开发者」开启超频限制解锁、接通电源、选择最佳性能并把屏幕亮度拉至 ≥95%
                </div>
              </div>
              <button
                type="button"
                onClick={() => triggerOverclockMeltdown(false)}
                className="px-3.5 py-2 rounded-md bg-rose-600/25 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>运行极限热压测</span>
              </button>
            </div>
          </div>
        )}

        {page === 'storage' && (
          <div className="space-y-3">
            {/* Stacked Disk Bar */}
            <div className={`rounded-lg border p-4 space-y-3 ${rowBg}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <HardDrive className="w-4 h-4 text-sky-400" />
                  <span>本地磁盘 (C:) · {storageSnapshot.totalCapacityGb} GB SATA HDD</span>
                </div>
                <span className="font-mono-tabular text-xs font-semibold">
                  已用 {storageSnapshot.usedGb.toFixed(1)} GB · 剩余{' '}
                  <span className={storageSnapshot.usedPercent >= 85 ? 'text-rose-400' : 'text-emerald-400'}>
                    {storageSnapshot.freeGb.toFixed(1)} GB
                  </span>
                </span>
              </div>

              <div className="h-3.5 rounded-full bg-slate-700/40 overflow-hidden flex border border-white/5">
                <div className="h-full bg-slate-500 transition-[width] duration-300" style={{ width: `${pctSystem}%` }} />
                <div className="h-full bg-sky-500 transition-[width] duration-300" style={{ width: `${pctApps}%` }} />
                <div className="h-full bg-amber-400 transition-[width] duration-300" style={{ width: `${pctTemp}%` }} />
                <div className="h-full bg-rose-500 transition-[width] duration-300" style={{ width: `${pctAnom}%` }} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono-tabular">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-500 shrink-0" />
                  <span>系统 {storageSnapshot.systemOsGb}G</span>
                </div>
                <div className="flex items-center gap-1.5 text-sky-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 shrink-0" />
                  <span>应用 {storageSnapshot.appsGb}G</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 shrink-0" />
                  <span>缓存 {storageSnapshot.tempCacheGb}G</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shrink-0" />
                  <span>异常 {storageSnapshot.anomalyGb}G</span>
                </div>
              </div>
            </div>

            {/* Clean controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={`rounded-lg border p-4 space-y-3 ${rowBg}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-amber-400" />
                    <span>临时文件与浏览器缓存</span>
                  </span>
                  <span className="text-xs font-mono-tabular text-amber-400">
                    {tempCacheGb.toFixed(1)} GB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={cleanTempCache}
                  disabled={tempCacheGb <= 0.05}
                  className="w-full py-2 rounded-md bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-45 border border-amber-500/40 text-amber-300 text-xs font-semibold cursor-pointer"
                >
                  {tempCacheGb <= 0.05 ? '临时缓存已清空' : '删除临时文件'}
                </button>
              </div>

              <div className={`rounded-lg border p-4 space-y-3 ${rowBg}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>异常隐藏影子扇区</span>
                  </span>
                  <span className="text-xs font-mono-tabular text-rose-400">
                    {anomalyStorageGb.toFixed(1)} GB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={purgeAnomalyStorage}
                  disabled={anomalyStorageGb <= 0.05}
                  className="w-full py-2 rounded-md bg-rose-600 hover:bg-rose-500 disabled:opacity-45 text-white text-xs font-semibold cursor-pointer"
                >
                  {anomalyStorageGb <= 0.05 ? '异常扇区已归零' : '零字节粉碎异常扇区'}
                </button>
              </div>
            </div>

            <div
              className={`rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                zeroStorageReady ? 'bg-emerald-500/10 border-emerald-400/45' : rowBg
              }`}
            >
              <div>
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>零字节净空认证 (#44) · 或打开商店「磁盘净化大师」</span>
                </div>
                <div className={`text-[11px] mt-0.5 ${mutedText}`}>
                  开启「实时病毒防护」并将缓存与异常扇区全部归零后可签发净空认证。
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={triggerStorageZeroEnding}
                  className={`px-3 py-2 rounded-md text-xs font-bold cursor-pointer ${
                    zeroStorageReady
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      : 'bg-white/10 hover:bg-white/15 text-slate-300'
                  }`}
                >
                  净空认证
                </button>
                <button
                  type="button"
                  onClick={() => floodStorageDump(24)}
                  className="px-3 py-2 rounded-md bg-rose-600/20 hover:bg-rose-600/35 border border-rose-500/40 text-rose-300 text-xs font-semibold cursor-pointer"
                >
                  写入转储 (+24G)
                </button>
              </div>
            </div>
          </div>
        )}

        {page === 'display' && (
          <div className="space-y-3">
            {/* Display Brightness & Night Light */}
            <div className={`rounded-lg border p-4 space-y-3 ${rowBg}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Sun className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">显示器亮度 ({system.brightness}%)</div>
                    <div className={`text-[11px] ${mutedText}`}>调整内置虚拟屏幕全局亮度</div>
                  </div>
                </div>
                <input
                  type="range"
                  min={30}
                  max={100}
                  value={system.brightness}
                  onChange={(e) => updateSystem({ brightness: Number(e.target.value) })}
                  className="w-36 accent-sky-400 cursor-pointer"
                />
              </div>
              <div className="pt-2.5 border-t border-slate-700/25 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold">夜间模式（暖色护眼色温）</div>
                  <div className={`text-[11px] ${mutedText}`}>减少深夜蓝光刺激，提升长时间阅读舒适度</div>
                </div>
                <WinToggle
                  ariaLabel="夜间模式"
                  checked={system.nightLight}
                  onChange={() => updateSystem({ nightLight: !system.nightLight })}
                  activeClass="bg-amber-500"
                  isLight={isLight}
                />
              </div>
            </div>

            {/* Sound */}
            <div className={`rounded-lg border p-4 space-y-3 ${rowBg}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-sky-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">声音输出</div>
                    <div className={`text-[11px] ${mutedText}`}>系统提示音、通知与音频反馈</div>
                  </div>
                </div>
                <WinToggle
                  ariaLabel="声音输出"
                  checked={system.sound}
                  onChange={() => updateSystem({ sound: !system.sound })}
                  isLight={isLight}
                />
              </div>

              <div className="pt-2.5 border-t border-slate-700/25 flex items-center justify-between gap-4">
                <span className="text-xs font-semibold font-mono-tabular">
                  主音量 ({system.soundVolume}%)
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={system.soundVolume}
                  onChange={(e) => updateSystem({ soundVolume: Number(e.target.value) })}
                  className="w-40 accent-sky-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Effects & Photosensitive */}
            <div className={`rounded-lg border p-4 space-y-3 ${rowBg}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold">显示扫描线滤镜</div>
                  <div className={`text-[11px] ${mutedText}`}>模拟传统显示器光学扫描纹理</div>
                </div>
                <WinToggle
                  ariaLabel="显示扫描线滤镜"
                  checked={system.crtEffect}
                  onChange={() => updateSystem({ crtEffect: !system.crtEffect })}
                  isLight={isLight}
                />
              </div>

              <div className="pt-2.5 border-t border-slate-700/25 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold">桌面与窗口动画效果</div>
                  <div className={`text-[11px] ${mutedText}`}>控制窗口打开、最小化与菜单过渡</div>
                </div>
                <WinToggle
                  ariaLabel="窗口动画"
                  checked={system.animations}
                  onChange={() => updateSystem({ animations: !system.animations })}
                  isLight={isLight}
                />
              </div>

              <div className="pt-2.5 border-t border-slate-700/25 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold">光敏安全模式（屏蔽闪烁与突脸）</div>
                  <div className={`text-[11px] ${mutedText}`}>
                    关闭高频闪烁滤镜、突发突脸惊吓与光标强制接管效果
                  </div>
                </div>
                <WinToggle
                  ariaLabel="光敏安全模式"
                  checked={system.photosensitiveSafe}
                  onChange={() => updateSystem({ photosensitiveSafe: !system.photosensitiveSafe })}
                  activeClass="bg-emerald-500"
                  isLight={isLight}
                />
              </div>
            </div>
          </div>
        )}

        {page === 'bluetooth' && (
          <div className="space-y-3">
            <div className={`rounded-lg border p-4 flex items-center justify-between gap-4 ${rowBg}`}>
              <div className="flex items-center gap-3">
                <Bluetooth className={`w-5 h-5 ${system.bluetooth ? 'text-blue-400' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-semibold">蓝牙 (Bluetooth)</div>
                  <div className={`text-[11px] ${mutedText}`}>
                    {system.bluetooth
                      ? `蓝牙可发现模式已开启 · 已连接 ${connectedBtCount} 台设备`
                      : '蓝牙适配器当前已关闭'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                {system.bluetooth && (
                  <button
                    type="button"
                    onClick={scanBluetoothDevices}
                    disabled={bluetoothScanning}
                    className="px-3 py-1.5 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${bluetoothScanning ? 'animate-spin' : ''}`} />
                    <span>{bluetoothScanning ? '扫描中' : '扫描设备'}</span>
                  </button>
                )}
                <WinToggle
                  ariaLabel="蓝牙"
                  checked={system.bluetooth}
                  onChange={toggleBluetooth}
                  activeClass="bg-blue-500"
                  isLight={isLight}
                />
              </div>
            </div>

            {system.bluetooth ? (
              <div className="space-y-2">
                {bluetoothDevices.map((dev) => (
                  <div
                    key={dev.id}
                    className={`rounded-lg border p-3.5 flex items-center justify-between gap-3 ${
                      dev.suspicious
                        ? 'bg-rose-950/20 border-rose-500/40 text-rose-100'
                        : rowBg
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                          dev.suspicious
                            ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                            : 'bg-sky-500/15 border-sky-500/30 text-sky-400'
                        }`}
                      >
                        {renderBtIcon(dev.category)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">{dev.name}</div>
                        <div className={`text-[11px] font-mono-tabular ${mutedText}`}>
                          MAC: {dev.mac} · 信号强度 {dev.signal}%{dev.battery ? ` · 电量 ${dev.battery}%` : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleBluetoothConnection(dev.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer shrink-0 ${
                        dev.connected
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : dev.suspicious
                            ? 'bg-rose-600 hover:bg-rose-500 text-white'
                            : 'bg-sky-600 hover:bg-sky-500 text-white'
                      }`}
                    >
                      {dev.connected ? '已连接（点击断开）' : dev.paired ? '连接' : '配对连接'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`rounded-lg border p-5 text-center text-xs ${rowBg} ${mutedText}`}>
                打开蓝牙以连接无线耳机、键盘或扫描附近的异常 BLE 广播设备。
              </div>
            )}
          </div>
        )}

        {page === 'network' && (
          <div className="space-y-2">
            <div className={`rounded-lg border p-4 flex items-center justify-between gap-4 ${rowBg}`}>
              <div className="flex items-center gap-3">
                <Wifi className={`w-5 h-5 ${isOnline ? 'text-sky-400' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-semibold">WLAN 无线网络</div>
                  <div className={`text-[11px] ${mutedText}`}>
                    {isOnline ? '已连接至 Home_5G_Node (192.168.1.42) · 延迟 18ms' : '已断开网络连接'}
                  </div>
                </div>
              </div>
              <WinToggle
                ariaLabel="WLAN"
                checked={isOnline}
                onChange={toggleNetwork}
                isLight={isLight}
              />
            </div>

            <button
              type="button"
              onClick={() => setPage('privacy')}
              className={`w-full rounded-lg border p-4 flex items-center justify-between text-left cursor-pointer ${rowBg}`}
            >
              <div>
                <div className="text-xs font-semibold">DNS 服务器分配与安全性</div>
                <div className={`text-[11px] ${mutedText}`}>
                  当前加密状态：{privacy.dnsEnabled ? '已启用 DoH' : '标准明文解析'}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>
          </div>
        )}

        {page === 'privacy' && (
          <div className="space-y-2">
            {WIN_PRIVACY_ROWS.map((row) => {
              const active = privacy[row.key];
              return (
                <div
                  key={row.key}
                  className={`rounded-lg border p-4 flex items-center justify-between gap-4 ${rowBg}`}
                >
                  <div>
                    <div className="text-xs font-semibold">{row.title}</div>
                    <div className={`text-[11px] mt-0.5 ${mutedText}`}>{row.desc}</div>
                  </div>
                  <WinToggle
                    ariaLabel={row.title}
                    checked={active}
                    onChange={() => togglePrivacyFlag(row.key)}
                    isLight={isLight}
                  />
                </div>
              );
            })}
          </div>
        )}

        {page === 'advanced' && (
          <div className="space-y-3">
            {/* USB Debugging (#46) */}
            <div className={`rounded-lg border p-4 space-y-3 ${rowBg}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Usb className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">USB 调试与远程 ADB 端口监听</div>
                    <div className={`text-[11px] ${mutedText}`}>
                      开放 localhost:5555 内核调试桥梁。若未启用硬件隐私锁且处于联网状态极易被劫持 (#46)
                    </div>
                  </div>
                </div>
                <WinToggle
                  ariaLabel="USB调试"
                  checked={system.usbDebugging}
                  onChange={() => updateSystem({ usbDebugging: !system.usbDebugging })}
                  activeClass="bg-amber-500"
                  isLight={isLight}
                />
              </div>
              {system.usbDebugging && (
                <div className="pt-2.5 border-t border-slate-700/25 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-amber-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    <span>端口 5555 处于监听状态，等待外部调试握手或本地拦截测试</span>
                  </span>
                  <button
                    type="button"
                    onClick={triggerUsbHijack}
                    className="px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold cursor-pointer"
                  >
                    检测 ADB 握手
                  </button>
                </div>
              )}
            </div>

            {/* Overclock Limit Unlock (#45) */}
            <div className={`rounded-lg border p-4 space-y-3 ${rowBg}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">实验性：解除硬件超频与功耗上限</div>
                    <div className={`text-[11px] ${mutedText}`}>
                      绕过主板 BIOS 过热保护，允许功耗突破安全阈值（可前往电源面板或终端触发压测）
                    </div>
                  </div>
                </div>
                <WinToggle
                  ariaLabel="超频解锁"
                  checked={system.overclockEnabled}
                  onChange={() => updateSystem({ overclockEnabled: !system.overclockEnabled })}
                  activeClass="bg-rose-500"
                  isLight={isLight}
                />
              </div>
              {system.overclockEnabled && (
                <div className="pt-2.5 border-t border-slate-700/25 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-rose-300">
                    超频解锁已激活 · 当前核心温度 {batteryTelemetry.tempC}°C
                  </span>
                  <button
                    type="button"
                    onClick={() => triggerOverclockMeltdown(false)}
                    className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    启动极限压力测试 (#45)
                  </button>
                </div>
              )}
            </div>

            {/* Compact Density & Terminal Shortcut */}
            <div className={`rounded-lg border p-4 flex items-center justify-between gap-4 ${rowBg}`}>
              <div className="flex items-center gap-3">
                <Sliders className="w-5 h-5 text-sky-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">开发者紧凑视口模式</div>
                  <div className={`text-[11px] ${mutedText}`}>优化窗口与面板内边距密度</div>
                </div>
              </div>
              <WinToggle
                ariaLabel="紧凑布局"
                checked={system.uiCompact}
                onChange={() => updateSystem({ uiCompact: !system.uiCompact })}
                isLight={isLight}
              />
            </div>

            <button
              type="button"
              onClick={() => openApp('terminal')}
              className={`w-full rounded-lg border p-3.5 flex items-center justify-between text-left cursor-pointer hover:border-sky-400/50 ${rowBg}`}
            >
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">打开系统诊断终端 (CLI)</div>
                  <div className={`text-[11px] ${mutedText}`}>
                    支持 `battery`、`df`、`clean`、`fsck --purge`、`daemon --audit` 等高级命令
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>
          </div>
        )}

        {page === 'personalization' && (
          <div className={`rounded-lg border p-4 space-y-5 ${rowBg}`}>
            <div>
              <div className="text-xs font-semibold mb-2.5">选择你的主题模式</div>
              <div className="grid grid-cols-3 gap-2.5">
                {(
                  [
                    { id: 'dark', label: '深色模式', swatch: 'bg-slate-900 border-slate-700' },
                    { id: 'light', label: '浅色模式', swatch: 'bg-slate-200 border-slate-300' },
                    { id: 'horror', label: '深红壁纸', swatch: 'bg-red-950 border-red-800' },
                  ] as { id: ThemeMode; label: string; swatch: string }[]
                ).map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => updateSystem({ theme: th.id })}
                    className={`p-2.5 rounded-lg border text-center cursor-pointer transition-all ${
                      system.theme === th.id
                        ? 'border-sky-400 ring-1 ring-sky-400/50'
                        : isLight
                          ? 'border-slate-200'
                          : 'border-white/10'
                    }`}
                  >
                    <div className={`h-10 rounded-md border mb-2 ${th.swatch}`} />
                    <div className="text-xs font-medium">{th.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700/25">
              <div className="text-xs font-semibold mb-2.5">系统强调色 (Accent Color)</div>
              <div className="flex items-center gap-2.5">
                {ACCENT_SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => updateSystem({ accentColor: hex })}
                    style={{ backgroundColor: hex }}
                    className={`w-7 h-7 rounded-full cursor-pointer border-2 transition-transform ${
                      system.accentColor === hex ? 'border-white scale-110' : 'border-transparent opacity-80'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {page === 'account' && (
          <div className={`rounded-lg border p-4 space-y-3.5 ${rowBg}`}>
            <div>
              <div className="text-xs font-semibold mb-2">账户头像</div>
              <div className="flex gap-2">
                {['👤', '👻', '🎭', '🕵️', '🤖'].map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => updateUser({ avatar: av })}
                    className={`w-10 h-10 rounded-full border text-lg flex items-center justify-center cursor-pointer ${
                      user.avatar === av
                        ? 'border-sky-400 bg-sky-500/15'
                        : isLight
                          ? 'border-slate-300'
                          : 'border-white/15'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold block">用户名</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className={`w-full rounded-md border px-3 py-2 text-xs outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-950/60 border-white/15 text-slate-100'
                }`}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold block">联系邮箱</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className={`w-full rounded-md border px-3 py-2 text-xs outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-950/60 border-white/15 text-slate-100'
                }`}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                updateUser({
                  name: nameInput.trim() || user.name,
                  email: emailInput.trim() || user.email,
                });
                notify('账户信息已更新', 'success');
              }}
              className="px-4 py-2 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold cursor-pointer"
            >
              保存信息
            </button>
          </div>
        )}

        {page === 'about' && (
          <div className="space-y-3">
            <div className={`rounded-lg border p-4 space-y-2 text-xs leading-relaxed ${rowBg}`}>
              <div className="font-semibold">设备规格与版本</div>
              <div className={`font-mono-tabular space-y-1 ${mutedText}`}>
                <div>设备名称：DESKTOP-NIGHTNODE (老旧出租屋主机)</div>
                <div>处理器：Intel Core i3-4130 双核 @ 3.40 GHz</div>
                <div>已安装内存：4.00 GB DDR3 (1600 MHz · 可用极限)</div>
                <div>
                  系统磁盘：{storageSnapshot.totalCapacityGb} GB SATA 机械硬盘 (剩余{' '}
                  {storageSnapshot.freeGb.toFixed(1)} GB)
                </div>
                <div>系统版本：Windows 11 精简适配版 24H2 (模拟环境)</div>
                <div>蓝牙驱动：USB 蓝牙 4.0 适配器 · {system.bluetooth ? '已启用' : '已关闭'}</div>
                <div>
                  电池模块：{Math.round(batteryLevel)}% ({isPluggedIn ? '交流电源已接入' : '独立放电'})
                </div>
              </div>
            </div>

            <div
              className={`rounded-lg border p-4 space-y-2.5 ${
                architectReady ? 'bg-amber-500/10 border-amber-400/50' : rowBg
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>终极系统架构师认证 (#50)</span>
                </div>
                <button
                  type="button"
                  onClick={triggerSystemArchitectEnding}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer ${
                    architectReady
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-white/10 hover:bg-white/15 text-slate-300'
                  }`}
                >
                  认证结算
                </button>
              </div>
              <div className={`grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] ${mutedText}`}>
                <span>装齐应用: {installedApps.length}/6</span>
                <span>全部体验: {openedStoreApps.length}/6</span>
                <span>补丁升级: {updatedStoreApps.length >= 1 ? '✓' : '0/1'}</span>
                <span>异常归零: {anomalyStorageGb <= 0.05 ? '✓' : `${anomalyStorageGb.toFixed(1)}G`}</span>
                <span>电量 ≥50%: {batteryLevel >= 50 ? '✓' : `${Math.round(batteryLevel)}%`}</span>
                <span>四盾+理智≥80: {sanity >= 80 && privacy.firewallEnabled && privacy.privacyEnabled && privacy.antivirusEnabled && privacy.dnsEnabled ? '✓' : '未就绪'}</span>
              </div>
            </div>

            <PWACachePanel isLight={isLight} />
          </div>
        )}
      </div>
    </div>
  );
};
