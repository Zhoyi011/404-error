import React, { useState } from 'react';
import {
  BatteryCharging,
  BellOff,
  Bluetooth,
  ChevronLeft,
  ChevronRight,
  Clock,
  HardDrive,
  Headphones,
  Info,
  Keyboard,
  Monitor,
  Moon,
  Palette,
  Power,
  RefreshCw,
  Search,
  Shield,
  Smartphone,
  Sun,
  User,
  Volume2,
  Watch,
  Wifi,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { BluetoothDevice, PowerMode, PrivacySettings, ThemeMode } from '../../types/game';
import { PWACachePanel } from '../PWAComponents';

type SettingsPage = 'system' | 'bluetooth' | 'network' | 'personalization' | 'privacy' | 'account' | 'about';
type MobileSettingsView =
  | 'root'
  | 'bluetooth'
  | 'general'
  | 'datetime'
  | 'storage'
  | 'battery'
  | 'display'
  | 'privacy'
  | 'account'
  | 'about'
  | 'sound'
  | 'focus';

const PAGE_LABELS: Record<SettingsPage, string> = {
  system: '系统',
  bluetooth: '蓝牙和其他设备',
  network: '网络和 Internet',
  personalization: '个性化',
  privacy: '隐私和安全性',
  account: '账户',
  about: '关于',
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
    desc: '限制网页或未知蓝牙/进程读取摄像头、麦克风与音频流',
  },
  {
    key: 'antivirusEnabled',
    title: '实时恶意进程防护',
    desc: '持续检测后台异常负载并隔离可疑可执行文件',
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
    desc: '限制未签名应用或未知蓝牙设备访问摄像头、音频与位置信息',
  },
  {
    key: 'antivirusEnabled',
    title: '实时病毒与威胁防护',
    desc: '持续扫描本地内存进程，并自动隔离可疑可执行文件',
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

export const SettingsApp: React.FC = () => {
  const isMobile = useIsMobile();
  const {
    privacy,
    system,
    user,
    isOnline,
    clockTime,
    installedApps,
    bluetoothDevices,
    bluetoothScanning,
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
  const usedStorageGb = (38.4 + installedApps.length * 0.4).toFixed(1);

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
        battery: '电池',
        display: '显示与亮度',
        privacy: '隐私与安全性',
        account: 'Apple 账户',
        about: '关于本机',
        sound: '声音与触感',
        focus: '专注与通知模式',
      };

      const isGeneralChild =
        mobileView === 'about' || mobileView === 'datetime' || mobileView === 'storage';

      return (
        <div className="h-full overflow-y-auto p-4 pb-8 space-y-4">
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
                            <div className={`text-sm font-medium truncate ${dev.suspicious ? 'text-rose-400' : ''}`}>
                              {dev.name}
                            </div>
                            <div className={`text-[11px] font-mono-tabular ${iosMuted}`}>
                              {dev.mac} · 信号 {dev.signal}%{dev.battery ? ` · 电量 ${dev.battery}%` : ''}
                            </div>
                          </div>
                        </div>
                        <span className={`text-xs font-medium shrink-0 ${dev.connected ? 'text-emerald-400' : 'text-sky-500'}`}>
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
                    <span className={`text-xs font-mono-tabular ${iosMuted}`}>{usedStorageGb} / 64 GB</span>
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
                    <span className={`text-xs font-mono-tabular ${iosMuted}`}>{timeString.slice(0, 5)}</span>
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
            <div className={`rounded-2xl p-4 space-y-3 ${isLight ? 'bg-white' : 'bg-slate-900/90'}`}>
              <div className="flex justify-between text-xs font-mono-tabular">
                <span>已使用 {usedStorageGb} GB</span>
                <span className={iosMuted}>共 64 GB</span>
              </div>
              <div className="h-3 rounded-full bg-slate-700/40 overflow-hidden flex">
                <div className="h-full bg-sky-500" style={{ width: '34%' }} />
                <div className="h-full bg-emerald-500" style={{ width: '10%' }} />
                <div className="h-full bg-amber-500" style={{ width: '6%' }} />
              </div>
              <div className={`text-xs space-y-1.5 pt-2 ${iosMuted}`}>
                <div className="flex justify-between">
                  <span>iOS 27.2.1 系统文件</span>
                  <span className="font-mono-tabular">21.6 GB</span>
                </div>
                <div className="flex justify-between">
                  <span>已安装商店应用 ({installedApps.length} 款)</span>
                  <span className="font-mono-tabular">{(installedApps.length * 0.4 + 4.2).toFixed(1)} GB</span>
                </div>
                <div className="flex justify-between">
                  <span>Safari 离线缓存与日志</span>
                  <span className="font-mono-tabular">2.8 GB</span>
                </div>
              </div>
            </div>
          )}

          {mobileView === 'battery' && (
            <div className="space-y-4">
              <div className={`rounded-2xl overflow-hidden ${iosCard}`}>
                <div className="px-4 py-3.5 flex items-center justify-between text-sm">
                  <span>当前电量与健康度</span>
                  <span className="font-mono-tabular text-emerald-400 font-semibold">92% · 健康</span>
                </div>
                <div className="px-4 py-3.5 flex items-center justify-between text-sm">
                  <div>
                    <div>低电量模式</div>
                    <div className={`text-[11px] ${iosMuted}`}>降低后台扫描与屏幕高亮功耗</div>
                  </div>
                  <IosToggle
                    label="低电量模式"
                    checked={system.powerMode === 'saver'}
                    onChange={() =>
                      updateSystem({
                        powerMode: system.powerMode === 'saver' ? 'balanced' : 'saver',
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {mobileView === 'focus' && (
            <div className={`rounded-2xl overflow-hidden ${iosCard}`}>
              <div className="px-4 py-3.5 flex items-center justify-between text-sm">
                <div>
                  <div>勿扰模式</div>
                  <div className={`text-[11px] ${iosMuted}`}>屏蔽非必要的桌面异常弹窗干扰</div>
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
                  {([
                    { id: 'dark', label: '深色' },
                    { id: 'light', label: '浅色' },
                    { id: 'horror', label: '血色' },
                  ] as { id: ThemeMode; label: string }[]).map((th) => (
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
                    min={40}
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
      <div className="h-full overflow-y-auto p-4 space-y-4 pb-8">
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
                {!system.bluetooth ? '关闭' : connectedBtCount > 0 ? `已连 ${connectedBtCount} 台` : '开启'}
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

        {/* General / Display / Battery / Privacy Group */}
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
              <span className={`text-xs font-mono-tabular ${iosMuted}`}>92%</span>
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
  const navItems: { id: SettingsPage; label: string; icon: React.ReactNode }[] = [
    { id: 'system', label: '系统', icon: <Monitor className="w-4 h-4 text-sky-400" /> },
    { id: 'bluetooth', label: '蓝牙和其他设备', icon: <Bluetooth className="w-4 h-4 text-blue-400" /> },
    { id: 'network', label: '网络和 Internet', icon: <Wifi className="w-4 h-4 text-sky-400" /> },
    { id: 'personalization', label: '个性化', icon: <Palette className="w-4 h-4 text-sky-400" /> },
    { id: 'privacy', label: '隐私和安全性', icon: <Shield className="w-4 h-4 text-sky-400" /> },
    { id: 'account', label: '账户', icon: <User className="w-4 h-4 text-sky-400" /> },
    { id: 'about', label: '关于', icon: <Info className="w-4 h-4 text-sky-400" /> },
  ];

  const filteredNav = navItems.filter((n) =>
    n.label.toLowerCase().includes(navSearch.trim().toLowerCase())
  );

  return (
    <div className="flex flex-col sm:flex-row h-full min-h-0">
      {/* Win11 Left Sidebar */}
      <aside
        className={`sm:w-56 border-b sm:border-b-0 sm:border-r p-3 space-y-3 shrink-0 ${
          isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-black/25 border-white/10'
        }`}
      >
        <div className="flex items-center gap-2.5 px-2 py-1 max-sm:hidden">
          <div className="w-9 h-9 rounded-full bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-lg shrink-0">
            {user.avatar}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate">{user.name}</div>
            <div className={`text-[10px] truncate ${mutedText}`}>{user.email}</div>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs max-sm:hidden ${
            isLight
              ? 'bg-white border-slate-300 text-slate-800'
              : 'bg-white/[0.06] border-white/10 text-slate-200'
          }`}
        >
          <input
            type="text"
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            placeholder="查找设置"
            className="bg-transparent outline-none w-full placeholder:text-slate-500"
          />
          <Search className="w-3.5 h-3.5 opacity-60 shrink-0" />
        </div>

        <nav className="flex sm:flex-col gap-1 overflow-x-auto">
          {filteredNav.map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPage(item.id)}
                className={`relative flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
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
          })}
        </nav>
      </aside>

      {/* Win11 Right Pane */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        <div className="flex items-center gap-1.5 text-lg font-semibold">
          <span>{PAGE_LABELS[page]}</span>
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
                    当前本地时间：{timeString}
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
                  min={40}
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
                <button
                  type="button"
                  role="switch"
                  aria-checked={system.nightLight}
                  onClick={() => updateSystem({ nightLight: !system.nightLight })}
                  className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${
                    system.nightLight ? 'bg-amber-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      system.nightLight ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Power Mode & Do Not Disturb */}
            <div className={`rounded-lg border p-4 space-y-3 ${rowBg}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <BatteryCharging className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">电源模式与散热策略</div>
                    <div className={`text-[11px] ${mutedText}`}>当前电源状态：已接通交流电源 (100%)</div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {(
                    [
                      { id: 'saver', label: '最佳能效' },
                      { id: 'balanced', label: '平衡' },
                      { id: 'performance', label: '最佳性能' },
                    ] as { id: PowerMode; label: string }[]
                  ).map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => updateSystem({ powerMode: pm.id })}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium border cursor-pointer ${
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
                <div className="flex items-center gap-3">
                  <BellOff className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">专注时段（勿扰模式）</div>
                    <div className={`text-[11px] ${mutedText}`}>抑制周期性非紧急桌面弹窗打扰</div>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={system.doNotDisturb}
                  onClick={() => updateSystem({ doNotDisturb: !system.doNotDisturb })}
                  className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${
                    system.doNotDisturb ? 'bg-sky-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      system.doNotDisturb ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Storage Overview */}
            <div className={`rounded-lg border p-4 space-y-2 ${rowBg}`}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-sky-400" />
                  <span>本地磁盘存储 (C:)</span>
                </span>
                <span className={`font-mono-tabular ${mutedText}`}>
                  已用 {usedStorageGb} GB / 128 GB (SATA HDD)
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-700/40 overflow-hidden">
                <div className="h-full bg-sky-500" style={{ width: '28%' }} />
              </div>
            </div>

            {/* Sound */}
            <div className={`rounded-lg border p-4 flex items-center justify-between gap-4 ${rowBg}`}>
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-sky-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">声音输出</div>
                  <div className={`text-[11px] ${mutedText}`}>系统提示音、通知与音频反馈</div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={system.sound}
                onClick={() => updateSystem({ sound: !system.sound })}
                className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${
                  system.sound ? 'bg-sky-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    system.sound ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className={`rounded-lg border p-4 flex items-center justify-between gap-4 ${rowBg}`}>
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

            <div className={`rounded-lg border p-4 flex items-center justify-between gap-4 ${rowBg}`}>
              <div>
                <div className="text-xs font-semibold">显示扫描线滤镜</div>
                <div className={`text-[11px] ${mutedText}`}>模拟传统显示器光学扫描纹理</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={system.crtEffect}
                onClick={() => updateSystem({ crtEffect: !system.crtEffect })}
                className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${
                  system.crtEffect ? 'bg-sky-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    system.crtEffect ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className={`rounded-lg border p-4 flex items-center justify-between gap-4 ${rowBg}`}>
              <div>
                <div className="text-xs font-semibold">桌面与窗口动画效果</div>
                <div className={`text-[11px] ${mutedText}`}>控制窗口打开、最小化与菜单过渡</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={system.animations}
                onClick={() => updateSystem({ animations: !system.animations })}
                className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${
                  system.animations ? 'bg-sky-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    system.animations ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className={`rounded-lg border p-4 flex items-center justify-between gap-4 ${rowBg}`}>
              <div>
                <div className="text-xs font-semibold">光敏安全模式（屏蔽闪烁与突脸）</div>
                <div className={`text-[11px] ${mutedText}`}>
                  关闭高频闪烁滤镜、突发突脸惊吓与光标强制接管效果
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={system.photosensitiveSafe}
                onClick={() => updateSystem({ photosensitiveSafe: !system.photosensitiveSafe })}
                className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors shrink-0 ${
                  system.photosensitiveSafe ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    system.photosensitiveSafe ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

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
                <button
                  type="button"
                  role="switch"
                  aria-checked={system.bluetooth}
                  onClick={toggleBluetooth}
                  className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${
                    system.bluetooth ? 'bg-blue-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      system.bluetooth ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
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
              <button
                type="button"
                role="switch"
                aria-checked={isOnline}
                onClick={toggleNetwork}
                className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${
                  isOnline ? 'bg-sky-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    isOnline ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
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
                <div key={row.key} className={`rounded-lg border p-4 flex items-center justify-between gap-4 ${rowBg}`}>
                  <div>
                    <div className="text-xs font-semibold">{row.title}</div>
                    <div className={`text-[11px] mt-0.5 ${mutedText}`}>{row.desc}</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={active}
                    onClick={() => togglePrivacyFlag(row.key)}
                    className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors shrink-0 ${
                      active ? 'bg-sky-500' : isLight ? 'bg-slate-300' : 'bg-slate-600'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                        active ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {page === 'personalization' && (
          <div className={`rounded-lg border p-4 space-y-5 ${rowBg}`}>
            <div>
              <div className="text-xs font-semibold mb-2.5">选择你的主题模式</div>
              <div className="grid grid-cols-3 gap-2.5">
                {([
                  { id: 'dark', label: '深色模式', swatch: 'bg-slate-900 border-slate-700' },
                  { id: 'light', label: '浅色模式', swatch: 'bg-slate-200 border-slate-300' },
                  { id: 'horror', label: '深红壁纸', swatch: 'bg-red-950 border-red-800' },
                ] as { id: ThemeMode; label: string; swatch: string }[]).map((th) => (
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
                <div>系统磁盘：128 GB SATA 机械硬盘</div>
                <div>系统版本：Windows 11 精简适配版 24H2 (模拟环境)</div>
                <div>蓝牙驱动：USB 蓝牙 4.0 适配器 · {system.bluetooth ? '已启用' : '已关闭'}</div>
                <div>安全状态：部分硬件特征受未知网络策略影响</div>
              </div>
            </div>
            <PWACachePanel isLight={isLight} />
          </div>
        )}
      </div>
    </div>
  );
};
