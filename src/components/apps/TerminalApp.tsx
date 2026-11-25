import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { STORE_CATALOG } from '../../data/worldData';
import { useIsMobile } from '../../hooks/useIsMobile';
import { AppId, StoreAppId } from '../../types/game';
import { soundEngine } from '../../utils/audio';

interface TerminalLine {
  id: string;
  text: string;
  tone: 'info' | 'cmd' | 'warn' | 'success' | 'error';
}

const KNOWN_COMMANDS = [
  'help',
  'status',
  'whoami',
  'scan',
  'ls',
  'pwd',
  'uptime',
  'history',
  'date',
  'battery',
  'battery plug',
  'battery unplug',
  'battery saver',
  'battery perf',
  'battery drain',
  'battery stealth',
  'df',
  'clean',
  'fsck --purge',
  'dd --flood',
  'net off',
  'net on',
  'netstat',
  'ping 198.51.100.44',
  'time 00:00',
  'time 06:00',
  'time reset',
  'shield',
  'cat mirror.log',
  'sudo awaken',
  'adb connect',
  'overclock --force',
  'daemon --audit',
  'pkg list',
  'pkg install ',
  'pkg update ',
  'open ',
  'kill 0x000000',
  'clear',
];

const QUICK_CHIPS = [
  { label: 'help', cmd: 'help' },
  { label: 'status', cmd: 'status' },
  { label: 'battery', cmd: 'battery' },
  { label: 'df', cmd: 'df' },
  { label: 'clean', cmd: 'clean' },
  { label: 'netstat', cmd: 'netstat' },
  { label: 'scan', cmd: 'scan' },
  { label: 'pkg list', cmd: 'pkg list' },
  { label: 'mirror.log', cmd: 'cat mirror.log' },
  { label: 'daemon --audit', cmd: 'daemon --audit' },
];

export const TerminalApp: React.FC = () => {
  const isMobile = useIsMobile();
  const {
    sanity,
    step,
    isOnline,
    privacy,
    system,
    clockTime,
    user,
    unlockedEndings,
    installedApps,
    updatedStoreApps,
    mirrorLogRead,
    suspendedDaemon,
    batteryLevel,
    isPluggedIn,
    batteryTelemetry,
    storageSnapshot,
    tempCacheGb,
    anomalyStorageGb,
    capturedPackets,
    terminalCommandsUsed,
    setMirrorLogRead,
    toggleNetwork,
    updateSystem,
    setClockToMidnight,
    setClockToMorning,
    resetClock,
    purgeThreatsInSecurity,
    triggerJumpscareEnding,
    triggerTerminalAwaken,
    openApp,
    togglePrivacyFlag,
    togglePowerPlug,
    drainBatteryManual,
    triggerLowPowerStealthEnding,
    triggerOverclockMeltdown,
    cleanTempCache,
    purgeAnomalyStorage,
    triggerStorageZeroEnding,
    floodStorageDump,
    triggerUsbHijack,
    installStoreApp,
    updateStoreApp,
    recordTerminalCommand,
    runTerminalDaemonAudit,
  } = useGame();

  const [lines, setLines] = useState<TerminalLine[]>(() => [
    {
      id: 't1',
      text: isMobile
        ? 'Mobile Terminal v2.4 · 输入 help 或点击下方快捷指令开始诊断'
        : 'Windows Terminal v2.4 · 输入 help 或使用 Tab 补全查看可用命令',
      tone: 'info',
    },
    {
      id: 't2',
      text: isMobile ? '当前工作目录：/var/mobile/Local/' : '当前工作目录：C:\\Users\\Local\\',
      tone: 'info',
    },
  ]);
  const [cmdInput, setCmdInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mountedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines.length]);

  const cwdDisplay = useMemo(
    () => (isMobile ? '/var/mobile/Local' : 'C:\\Users\\Local'),
    [isMobile]
  );

  const pushLines = (items: Omit<TerminalLine, 'id'>[]) => {
    setLines((prev) => [
      ...prev,
      ...items.map((it, idx) => ({ ...it, id: `${Date.now()}-${idx}-${Math.random()}` })),
    ]);
  };

  const handleAutocomplete = () => {
    const raw = cmdInput.trimStart().toLowerCase();
    if (!raw) return;
    const allApps: string[] = [
      'browser',
      'email',
      'notepad',
      'security',
      'settings',
      'news',
      'chat',
      'achievements',
      'store',
      'morse',
      'taskmgr',
      'vscode',
      'monitor',
      'radio',
      'files',
      'cleaner',
      'sniffer',
    ];
    if (raw.startsWith('open ')) {
      const sub = raw.slice(5);
      const match = allApps.find((a) => a.startsWith(sub));
      if (match) setCmdInput(`open ${match}`);
      return;
    }
    if (raw.startsWith('pkg install ') || raw.startsWith('pkg update ')) {
      const prefix = raw.startsWith('pkg install ') ? 'pkg install ' : 'pkg update ';
      const sub = raw.slice(prefix.length);
      const match = STORE_CATALOG.find((item) => item.id.startsWith(sub));
      if (match) setCmdInput(`${prefix}${match.id}`);
      return;
    }
    const match = KNOWN_COMMANDS.find((c) => c.startsWith(raw));
    if (match) {
      setCmdInput(match);
    }
  };

  const runCommand = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    soundEngine.playClick();
    setCmdHistory((prev) => [trimmed, ...prev.slice(0, 39)]);
    setHistoryIdx(-1);
    pushLines([{ text: `${user.name}@local:~$ ${trimmed}`, tone: 'cmd' }]);

    const cmd = trimmed.toLowerCase();
    const baseToken = cmd.split(/\s+/)[0];

    if (cmd === 'help' || cmd === '?') {
      recordTerminalCommand('help');
      pushLines([
        { text: '=== 终端指令参考 ===', tone: 'info' },
        { text: '  status / whoami / date / uptime   系统核心、账户与时钟总览', tone: 'info' },
        { text: '  ls / pwd / history                列出本地目录与历史指令', tone: 'info' },
        { text: '  battery [plug|unplug|saver|perf|drain|stealth]  电源与电池控制', tone: 'info' },
        { text: '  df / clean / fsck --purge / dd --flood          存储审计与扇区粉碎', tone: 'info' },
        { text: '  net off|on / netstat / ping <host>              网络与异常 C2 端口排查', tone: 'info' },
        { text: '  pkg list | install <id> | update <id>           商店包管理与补丁升级', tone: 'info' },
        { text: '  time 00:00 | 06:00 | reset        调试系统时钟', tone: 'info' },
        { text: '  shield / scan / kill 0x000000     防火墙切换与异常进程查杀', tone: 'info' },
        { text: '  adb connect / overclock --force   调试端口连接与硬件超频压测', tone: 'warn' },
        { text: '  cat mirror.log / sudo awaken      读取隐藏日志与管理员提权', tone: 'info' },
        { text: '  daemon --audit                    执行终极守护进程审计 (#49)', tone: 'success' },
        { text: '  open <app> / clear                启动应用窗口 / 清屏', tone: 'info' },
      ]);
      return;
    }

    if (cmd === 'clear') {
      setLines([]);
      return;
    }

    if (cmd === 'pwd') {
      recordTerminalCommand('pwd');
      pushLines([{ text: cwdDisplay, tone: 'info' }]);
      return;
    }

    if (cmd === 'ls' || cmd === 'dir') {
      recordTerminalCommand('ls');
      pushLines([
        { text: `目录 ${cwdDisplay} 内容清单：`, tone: 'info' },
        { text: '  drwxr-xr-x   appdata/           [系统组件缓存]', tone: 'info' },
        { text: '  -rw-r--r--   mirror.log         [隐藏系统镜像日志]', tone: 'warn' },
        { text: '  -rwx------   daemon_audit.sh    [内核守护审计脚本]', tone: 'success' },
        ...(anomalyStorageGb > 0.05
          ? [
              {
                text: `  -rw-------   .shadow_swap.bin   [${anomalyStorageGb.toFixed(1)} GB 未知异常扇区]`,
                tone: 'error' as const,
              },
            ]
          : []),
      ]);
      return;
    }

    if (cmd === 'uptime') {
      recordTerminalCommand('uptime');
      const sec = Math.max(1, Math.floor((Date.now() - mountedAtRef.current) / 1000));
      const min = Math.floor(sec / 60);
      pushLines([
        {
          text: `会话运行时长: ${min}分${sec % 60}秒 | 终端诊断覆盖: ${terminalCommandsUsed.length}/5 种指令`,
          tone: 'info',
        },
      ]);
      return;
    }

    if (cmd === 'history') {
      recordTerminalCommand('history');
      if (cmdHistory.length === 0) {
        pushLines([{ text: '暂无历史命令记录。', tone: 'info' }]);
      } else {
        pushLines(
          [...cmdHistory]
            .reverse()
            .map((entry, idx) => ({ text: `  ${(idx + 1).toString().padStart(2, '0')}  ${entry}`, tone: 'info' as const }))
        );
      }
      return;
    }

    if (cmd === 'date') {
      recordTerminalCommand('date');
      const yyyy = clockTime.getFullYear();
      const mm = (clockTime.getMonth() + 1).toString().padStart(2, '0');
      const dd = clockTime.getDate().toString().padStart(2, '0');
      const hh = clockTime.getHours().toString().padStart(2, '0');
      const mi = clockTime.getMinutes().toString().padStart(2, '0');
      pushLines([
        {
          text: `系统时钟: ${yyyy}-${mm}-${dd} ${hh}:${mi}:00 | 网络校时: ${system.autoTimeSync ? 'NTP 自动同步' : '已手动解锁'}`,
          tone: 'info',
        },
      ]);
      return;
    }

    if (cmd === 'status') {
      recordTerminalCommand('status');
      const hh = clockTime.getHours().toString().padStart(2, '0');
      const mm = clockTime.getMinutes().toString().padStart(2, '0');
      pushLines([
        { text: `理智状态: ${sanity}% | 阶段: ${step} | 网络: ${isOnline ? '已连接' : '已断开'}`, tone: 'info' },
        {
          text: `电池状态: ${Math.round(batteryLevel)}% (${isPluggedIn ? '外接供电' : '电池放电'}) · 功耗 ${batteryTelemetry.watts}W · 温度 ${batteryTelemetry.tempC}°C`,
          tone: batteryLevel <= system.lowBatteryThreshold ? 'warn' : 'info',
        },
        {
          text: `存储状态: 已用 ${storageSnapshot.usedGb.toFixed(1)} / ${storageSnapshot.totalCapacityGb} GB (异常 ${anomalyStorageGb.toFixed(1)} GB)`,
          tone: anomalyStorageGb > 0.5 ? 'warn' : 'success',
        },
        { text: `系统时钟: ${hh}:${mm} | 图鉴进度: ${unlockedEndings.length}/50 | 终端指令数: ${terminalCommandsUsed.length}/5`, tone: 'info' },
        {
          text: `安全组件 -> 防火墙[${privacy.firewallEnabled ? 'ON' : 'OFF'}] 隐私[${privacy.privacyEnabled ? 'ON' : 'OFF'}] 杀毒[${privacy.antivirusEnabled ? 'ON' : 'OFF'}] DNS[${privacy.dnsEnabled ? 'ON' : 'OFF'}]`,
          tone: privacy.firewallEnabled && privacy.antivirusEnabled && privacy.dnsEnabled ? 'success' : 'warn',
        },
      ]);
      return;
    }

    if (cmd === 'whoami') {
      recordTerminalCommand('whoami');
      pushLines([
        { text: `当前账户: ${user.name} (${user.email})`, tone: 'info' },
        {
          text: sanity < 60 ? '警告：检测到生物特征出现双重回声。' : '本地会话校验正常。',
          tone: sanity < 60 ? 'warn' : 'success',
        },
      ]);
      return;
    }

    if (cmd === 'scan') {
      recordTerminalCommand('scan');
      pushLines([
        { text: '正在扫描活动进程...', tone: 'info' },
        { text: '  PID 0104  system_kernel.sys           [正常]', tone: 'success' },
        step >= 1
          ? {
              text: suspendedDaemon
                ? '  PID 0666  remote_hr_hook.dll          [已挂起]'
                : '  PID 0666  remote_hr_hook.dll          [外部连接句柄]',
              tone: suspendedDaemon ? 'info' : 'warn',
            }
          : { text: '  PID 0210  network_guard.svc           [空闲]', tone: 'info' },
        step >= 2
          ? { text: '  PID 0000  doppelganger_daemon.exe     [未知高危进程！]', tone: 'error' }
          : { text: '未检测到异常覆写进程。', tone: 'success' },
      ]);
      return;
    }

    if (baseToken === 'battery' || baseToken === 'power') {
      recordTerminalCommand('battery');
      const sub = cmd.split(/\s+/)[1] || 'status';
      if (sub === 'status') {
        pushLines([
          {
            text: `电源详情: ${Math.round(batteryLevel)}% | ${isPluggedIn ? 'AC 已接入' : '纯电池供电'} | 模式: ${system.powerMode} | 温度: ${batteryTelemetry.tempC}°C (${batteryTelemetry.watts}W)`,
            tone: batteryLevel <= 25 ? 'warn' : 'info',
          },
          {
            text: '可用子命令: battery plug | unplug | saver | perf | drain | stealth',
            tone: 'info',
          },
        ]);
        return;
      }
      if (sub === 'plug') {
        if (!isPluggedIn) togglePowerPlug();
        pushLines([{ text: '电源适配器已接入。', tone: 'success' }]);
        return;
      }
      if (sub === 'unplug') {
        if (isPluggedIn) togglePowerPlug();
        pushLines([{ text: '已拔除外部电源，当前依靠内置电池续航。', tone: 'warn' }]);
        return;
      }
      if (sub === 'saver') {
        updateSystem({ powerMode: 'saver' });
        pushLines([{ text: '已切换至「极致省电模式」。', tone: 'success' }]);
        return;
      }
      if (sub === 'perf' || sub === 'performance') {
        updateSystem({ powerMode: 'performance' });
        pushLines([{ text: '已切换至「高性能模式」，功耗与发热将显著升高。', tone: 'warn' }]);
        return;
      }
      if (sub === 'drain') {
        drainBatteryManual(25);
        pushLines([{ text: '已执行高负载放电测试 (-25%)。', tone: 'warn' }]);
        return;
      }
      if (sub === 'stealth') {
        pushLines([{ text: '正在校验零功耗隐匿协议条件…', tone: 'info' }]);
        triggerLowPowerStealthEnding();
        return;
      }
      pushLines([{ text: `未知电源子指令: ${sub}`, tone: 'error' }]);
      return;
    }

    if (cmd === 'df' || cmd === 'storage') {
      recordTerminalCommand('df');
      pushLines([
        {
          text: `磁盘卷总览 (${storageSnapshot.totalCapacityGb} GB): 已用 ${storageSnapshot.usedGb.toFixed(1)} GB (${storageSnapshot.usedPercent}%) · 剩余 ${storageSnapshot.freeGb.toFixed(1)} GB`,
          tone: storageSnapshot.usedPercent >= 85 ? 'warn' : 'info',
        },
        {
          text: `  系统固件: ${storageSnapshot.systemOsGb.toFixed(1)} GB | 已装软件: ${storageSnapshot.appsGb.toFixed(1)} GB`,
          tone: 'info',
        },
        {
          text: `  临时缓存: ${tempCacheGb.toFixed(1)} GB | 异常镜像扇区: ${anomalyStorageGb.toFixed(1)} GB`,
          tone: anomalyStorageGb > 0.05 ? 'error' : 'success',
        },
        { text: '提示: 可运行 clean 清理缓存，或 fsck --purge 粉碎异常扇区。', tone: 'info' },
      ]);
      return;
    }

    if (cmd === 'clean') {
      recordTerminalCommand('clean');
      cleanTempCache();
      pushLines([{ text: '已执行临时缓存清理流程。', tone: 'success' }]);
      return;
    }

    if (cmd === 'fsck --purge' || cmd === 'fsck') {
      recordTerminalCommand('fsck');
      if (anomalyStorageGb <= 0.05 && tempCacheGb <= 0.05 && privacy.antivirusEnabled) {
        pushLines([{ text: '磁盘已完成零字节净化，正在签发净空认证 (#44)…', tone: 'success' }]);
        window.setTimeout(() => triggerStorageZeroEnding(), 320);
        return;
      }
      purgeAnomalyStorage();
      pushLines([
        {
          text: privacy.antivirusEnabled
            ? '扇区粉碎指令已执行，运行 df 确认剩余占用（全部归零后可再运行 fsck --purge 签发认证）。'
            : '警告：实时杀毒关闭时粉碎扇区遭到镜像再生反噬！',
          tone: privacy.antivirusEnabled ? 'success' : 'error',
        },
      ]);
      return;
    }

    if (cmd === 'dd --flood') {
      recordTerminalCommand('dd');
      floodStorageDump(24);
      pushLines([{ text: '已向本地分区写入 24.0 GB 镜像转储流……', tone: 'error' }]);
      return;
    }

    if (cmd === 'netstat' || cmd === 'ports') {
      recordTerminalCommand('netstat');
      pushLines([
        { text: 'Active Internet connections (servers and established):', tone: 'info' },
        { text: '  TCP   192.168.1.104:443     1.1.1.1:443              ESTABLISHED', tone: 'success' },
        ...(isOnline
          ? [
              {
                text: `  TCP   192.168.1.104:51842   198.51.100.44:6666       ${privacy.firewallEnabled ? 'FILTERED' : 'SYN_SENT [可疑 C2]'}`,
                tone: privacy.firewallEnabled ? ('info' as const) : ('error' as const),
              },
              {
                text: `  UDP   0.0.0.0:5353          203.0.113.99:5353        ${privacy.dnsEnabled ? 'DOH_SAFE' : 'EXFIL_OPEN'}`,
                tone: privacy.dnsEnabled ? ('success' as const) : ('warn' as const),
              },
            ]
          : [{ text: '  (网卡处于离线隔离模式，未发现外部 TCP/UDP 隧道)', tone: 'info' as const }]),
        {
          text: `已捕获信标包: ${capturedPackets.length}/3 · 若已安装网络抓包工具，运行 open sniffer 溯源封锁。`,
          tone: 'info',
        },
      ]);
      return;
    }

    if (cmd.startsWith('ping ')) {
      recordTerminalCommand('ping');
      const host = trimmed.slice(5).trim();
      if (!isOnline) {
        pushLines([{ text: `ping: ${host}: Network is unreachable (当前处于离线模式)`, tone: 'warn' }]);
        return;
      }
      if (host.includes('198.51.100.44') || host.includes('0x000000')) {
        pushLines([
          { text: `PING ${host}: 56 data bytes`, tone: 'info' },
          { text: `64 bytes from ${host}: icmp_seq=1 ttl=44 time=6.66 ms — [WARNING: ECHO BACKDOOR]`, tone: 'error' },
        ]);
      } else {
        pushLines([
          { text: `PING ${host}: 56 data bytes`, tone: 'info' },
          { text: `64 bytes from ${host}: icmp_seq=1 ttl=56 time=14.2 ms`, tone: 'success' },
        ]);
      }
      return;
    }

    if (cmd === 'pkg list') {
      recordTerminalCommand('pkg');
      pushLines([
        { text: '=== 应用商店包列表 ===', tone: 'info' },
        ...STORE_CATALOG.map((item) => {
          const inst = installedApps.includes(item.id);
          const upd = updatedStoreApps.includes(item.id);
          return {
            text: `  ${item.id.padEnd(9)} v${item.version} (${item.size})  [${inst ? (upd ? '已安装·最新补丁' : '已安装·可更新') : '未安装'}]  ${isMobile ? item.iosName : item.desktopName}`,
            tone: inst ? ('success' as const) : ('info' as const),
          };
        }),
      ]);
      return;
    }

    if (cmd.startsWith('pkg install ')) {
      recordTerminalCommand('pkg');
      const target = cmd.replace('pkg install ', '').trim() as StoreAppId;
      if (!STORE_CATALOG.some((x) => x.id === target)) {
        pushLines([{ text: `未知软件包: ${target}（运行 pkg list 查看）`, tone: 'error' }]);
        return;
      }
      installStoreApp(target);
      pushLines([{ text: `已向商店队列派发安装任务: ${target}`, tone: 'info' }]);
      return;
    }

    if (cmd.startsWith('pkg update ')) {
      recordTerminalCommand('pkg');
      const target = cmd.replace('pkg update ', '').trim() as StoreAppId;
      if (!STORE_CATALOG.some((x) => x.id === target)) {
        pushLines([{ text: `未知软件包: ${target}`, tone: 'error' }]);
        return;
      }
      updateStoreApp(target);
      pushLines([{ text: `已尝试为 ${target} 拉取热补丁`, tone: 'info' }]);
      return;
    }

    if (cmd === 'net off') {
      recordTerminalCommand('net');
      if (isOnline) {
        toggleNetwork();
        pushLines([{ text: '已断开网络适配器。', tone: 'success' }]);
      } else {
        pushLines([{ text: '当前网络已处于断开状态。', tone: 'info' }]);
      }
      return;
    }

    if (cmd === 'net on') {
      recordTerminalCommand('net');
      if (!isOnline) {
        toggleNetwork();
        pushLines([{ text: '已重新启用网络适配器。', tone: 'info' }]);
      } else {
        pushLines([{ text: '当前网络已连接。', tone: 'info' }]);
      }
      return;
    }

    if (cmd === 'time 00:00') {
      recordTerminalCommand('time');
      setClockToMidnight();
      pushLines([{ text: '系统时钟已调整至 00:00:00。', tone: 'info' }]);
      return;
    }

    if (cmd === 'time 06:00') {
      recordTerminalCommand('time');
      setClockToMorning();
      pushLines([{ text: '系统时钟已调整至 06:00:00。', tone: 'info' }]);
      return;
    }

    if (cmd === 'time reset') {
      recordTerminalCommand('time');
      resetClock();
      pushLines([{ text: '已恢复实时系统时钟。', tone: 'info' }]);
      return;
    }

    if (cmd === 'cat mirror.log' || cmd === 'cat /var/log/mirror.log') {
      recordTerminalCommand('cat');
      setMirrorLogRead(true);
      pushLines([
        { text: '--- /var/log/mirror.log ---', tone: 'info' },
        { text: '[23:51] 观测者正在浏览招聘站点。', tone: 'info' },
        { text: '[23:52] 更多异常现象与传闻已收录于浏览器内的「wiki」档案站。', tone: 'warn' },
        { text: '[23:53] 仅在思维完全清醒（100%）时，底层代码才会向观测者开放。', tone: 'warn' },
        { text: '[ROOT] 紧急管理员提权唤醒指令已备妥：sudo awaken', tone: 'success' },
      ]);
      return;
    }

    if (cmd === 'sudo awaken') {
      recordTerminalCommand('sudo');
      if (!mirrorLogRead) {
        pushLines([{ text: '权限校验失败：请先查阅本地镜像日志 (cat mirror.log) 以获取 Root 令牌。', tone: 'warn' }]);
        return;
      }
      pushLines([{ text: 'Root 权限已授予！正在接管并唤醒虚拟系统核心……', tone: 'success' }]);
      window.setTimeout(() => triggerTerminalAwaken(), 550);
      return;
    }

    if (cmd === 'shield') {
      recordTerminalCommand('shield');
      togglePrivacyFlag('firewallEnabled');
      pushLines([{ text: '已切换防火墙状态。输入 status 查看详情。', tone: 'info' }]);
      return;
    }

    if (cmd === 'adb' || cmd === 'adb connect') {
      recordTerminalCommand('adb');
      pushLines([{ text: '正在尝试探测外部 USB 调试 / ADB 5555 端口……', tone: 'warn' }]);
      triggerUsbHijack();
      return;
    }

    if (cmd === 'overclock --force' || cmd === 'overclock') {
      recordTerminalCommand('overclock');
      pushLines([{ text: '正在尝试强制绕过电压锁超频调度器……', tone: 'warn' }]);
      triggerOverclockMeltdown(true);
      return;
    }

    if (cmd === 'daemon --audit' || cmd === 'daemon') {
      recordTerminalCommand('daemon');
      pushLines([
        {
          text: `正在运行守护审计脚本 (指令覆盖 ${terminalCommandsUsed.length}/5)…`,
          tone: 'info',
        },
      ]);
      runTerminalDaemonAudit();
      return;
    }

    if (cmd.startsWith('open ')) {
      recordTerminalCommand('open');
      const target = cmd.replace('open ', '').trim();
      const map: Record<string, AppId> = {
        browser: 'browser',
        email: 'email',
        notepad: 'notepad',
        security: 'security',
        settings: 'settings',
        news: 'news',
        chat: 'chat',
        achievements: 'achievements',
        store: 'store',
        morse: 'morse',
        taskmgr: 'taskmgr',
        vscode: 'vscode',
        monitor: 'monitor',
        radio: 'radio',
        files: 'files',
        cleaner: 'cleaner',
        sniffer: 'sniffer',
      };
      if (map[target]) {
        const isStoreApp = (
          ['vscode', 'monitor', 'radio', 'files', 'cleaner', 'sniffer'] as string[]
        ).includes(target);
        if (isStoreApp && !installedApps.includes(target as StoreAppId)) {
          openApp(map[target]);
          pushLines([
            {
              text: `未检测到已安装的 ${target}，已为你打开应用商店供下载安装。`,
              tone: 'warn',
            },
          ]);
        } else {
          openApp(map[target], { forceNew: target === 'browser' || target === 'notepad' });
          pushLines([{ text: `已启动 ${target} 窗口。`, tone: 'success' }]);
        }
      } else {
        pushLines([{ text: `未知应用: ${target}`, tone: 'error' }]);
      }
      return;
    }

    if (cmd === 'kill 0x000000') {
      recordTerminalCommand('kill');
      if (step < 2) {
        pushLines([{ text: '当前未检测到活跃进程 0x000000。', tone: 'info' }]);
        return;
      }
      if (privacy.firewallEnabled && privacy.antivirusEnabled && privacy.dnsEnabled) {
        pushLines([{ text: '核心防御已隔离目标，正在粉碎进程 0x000000...', tone: 'success' }]);
        purgeThreatsInSecurity();
      } else {
        pushLines([{ text: '错误：系统权限遭反噬，进程正在接管终端……', tone: 'error' }]);
        window.setTimeout(() => triggerJumpscareEnding(), 650);
      }
      return;
    }

    pushLines([{ text: `未识别的命令「${trimmed}」，输入 help 查看可用指令。`, tone: 'error' }]);
  };

  return (
    <div className="h-full min-h-0 bg-slate-950 text-slate-100 font-mono-tabular flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between gap-2 text-[11px] text-slate-400 shrink-0">
        <span className="flex items-center gap-1.5 min-w-0 truncate">
          <TerminalIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">{isMobile ? 'Mobile Terminal' : 'Windows Terminal'}</span>
        </span>
        <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            指令覆盖 {terminalCommandsUsed.length}/5
          </span>
          <span className="hidden sm:inline">Tab 补全 · ↑↓ 历史</span>
        </div>
      </div>

      {/* Scrollable Output */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4 space-y-1.5 text-xs"
      >
        {lines.map((line) => (
          <div
            key={line.id}
            className={`whitespace-pre-wrap break-words leading-relaxed ${
              line.tone === 'cmd'
                ? 'text-amber-300 font-semibold'
                : line.tone === 'warn'
                  ? 'text-amber-400'
                  : line.tone === 'error'
                    ? 'text-rose-400'
                    : line.tone === 'success'
                      ? 'text-emerald-400'
                      : 'text-slate-300'
            }`}
          >
            {line.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Touch-friendly Quick Command Chips */}
      <div className="px-3 py-1.5 border-t border-slate-800/80 bg-slate-900/70 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip.cmd}
            type="button"
            onClick={() => runCommand(chip.cmd)}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runCommand(cmdInput);
          setCmdInput('');
        }}
        className="px-3.5 sm:px-4 py-2.5 border-t border-slate-800 flex items-center gap-2 text-xs shrink-0 bg-slate-950"
      >
        <span className="text-emerald-400 font-semibold shrink-0">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={cmdInput}
          onChange={(e) => setCmdInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              handleAutocomplete();
            } else if (e.key === 'ArrowUp') {
              if (cmdHistory.length === 0) return;
              e.preventDefault();
              const nextIdx = Math.min(cmdHistory.length - 1, historyIdx + 1);
              setHistoryIdx(nextIdx);
              setCmdInput(cmdHistory[nextIdx]);
            } else if (e.key === 'ArrowDown') {
              if (historyIdx < 0) return;
              e.preventDefault();
              const nextIdx = historyIdx - 1;
              setHistoryIdx(nextIdx);
              setCmdInput(nextIdx < 0 ? '' : cmdHistory[nextIdx]);
            }
          }}
          placeholder="输入命令 (help / battery / df / netstat / daemon --audit)..."
          className="flex-1 min-w-0 bg-transparent outline-none text-slate-100 placeholder:text-slate-600"
        />
        <button
          type="submit"
          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer"
        >
          执行
        </button>
      </form>
    </div>
  );
};
