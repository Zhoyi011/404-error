import React, { useEffect, useRef, useState } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { StoreAppId } from '../../types/game';
import { soundEngine } from '../../utils/audio';

interface TerminalLine {
  id: string;
  text: string;
  tone: 'info' | 'cmd' | 'warn' | 'success' | 'error';
}

export const TerminalApp: React.FC = () => {
  const {
    sanity,
    step,
    isOnline,
    privacy,
    clockTime,
    user,
    unlockedEndings,
    installedApps,
    mirrorLogRead,
    suspendedDaemon,
    setMirrorLogRead,
    toggleNetwork,
    setClockToMidnight,
    setClockToMorning,
    resetClock,
    purgeThreatsInSecurity,
    triggerJumpscareEnding,
    triggerTerminalAwaken,
    openApp,
    togglePrivacyFlag,
  } = useGame();

  const [lines, setLines] = useState<TerminalLine[]>([
    { id: 't1', text: 'Windows Terminal · 输入 help 查看可用命令', tone: 'info' },
    { id: 't2', text: '当前工作目录：C:\\Users\\Local\\', tone: 'info' },
  ]);
  const [cmdInput, setCmdInput] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines.length]);

  const pushLines = (items: Omit<TerminalLine, 'id'>[]) => {
    setLines((prev) => [
      ...prev,
      ...items.map((it, idx) => ({ ...it, id: `${Date.now()}-${idx}-${Math.random()}` })),
    ]);
  };

  const runCommand = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    soundEngine.playClick();
    pushLines([{ text: `${user.name}@local:~$ ${trimmed}`, tone: 'cmd' }]);

    const cmd = trimmed.toLowerCase();

    if (cmd === 'help' || cmd === '?') {
      pushLines([
        { text: '可用指令清单：', tone: 'info' },
        { text: '  status                 查看系统、网络与防护开关状态', tone: 'info' },
        { text: '  scan                   扫描活动进程列表', tone: 'info' },
        { text: '  net off / net on       切换网络连接', tone: 'info' },
        { text: '  time 00:00 / 06:00     设置系统时钟 (或 time reset)', tone: 'info' },
        { text: '  shield                 切换防火墙状态', tone: 'info' },
        { text: '  cat mirror.log         读取本地隐藏镜像日志', tone: 'info' },
        { text: '  open <app>             打开应用 (browser/store/taskmgr/morse/vscode/terminal...)', tone: 'info' },
        { text: '  kill 0x000000          尝试终止目标进程', tone: 'warn' },
        { text: '  clear                  清空屏幕', tone: 'info' },
      ]);
      return;
    }

    if (cmd === 'clear') {
      setLines([]);
      return;
    }

    if (cmd === 'status') {
      const hh = clockTime.getHours().toString().padStart(2, '0');
      const mm = clockTime.getMinutes().toString().padStart(2, '0');
      pushLines([
        { text: `理智状态: ${sanity}% | 阶段: ${step} | 网络: ${isOnline ? '已连接' : '已断开'}`, tone: 'info' },
        { text: `系统时钟: ${hh}:${mm} | 图鉴进度: ${unlockedEndings.length}/40`, tone: 'info' },
        {
          text: `安全组件 -> 防火墙[${privacy.firewallEnabled ? 'ON' : 'OFF'}] 隐私[${privacy.privacyEnabled ? 'ON' : 'OFF'}] 杀毒[${privacy.antivirusEnabled ? 'ON' : 'OFF'}] DNS[${privacy.dnsEnabled ? 'ON' : 'OFF'}]`,
          tone: privacy.firewallEnabled && privacy.antivirusEnabled && privacy.dnsEnabled ? 'success' : 'warn',
        },
      ]);
      return;
    }

    if (cmd === 'whoami') {
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

    if (cmd === 'net off') {
      if (isOnline) {
        toggleNetwork();
        pushLines([{ text: '已断开网络适配器。', tone: 'success' }]);
      } else {
        pushLines([{ text: '当前网络已处于断开状态。', tone: 'info' }]);
      }
      return;
    }

    if (cmd === 'net on') {
      if (!isOnline) {
        toggleNetwork();
        pushLines([{ text: '已重新启用网络适配器。', tone: 'info' }]);
      } else {
        pushLines([{ text: '当前网络已连接。', tone: 'info' }]);
      }
      return;
    }

    if (cmd === 'time 00:00') {
      setClockToMidnight();
      pushLines([{ text: '系统时钟已调整至 00:00:00。', tone: 'info' }]);
      return;
    }

    if (cmd === 'time 06:00') {
      setClockToMorning();
      pushLines([{ text: '系统时钟已调整至 06:00:00。', tone: 'info' }]);
      return;
    }

    if (cmd === 'time reset') {
      resetClock();
      pushLines([{ text: '已恢复实时系统时钟。', tone: 'info' }]);
      return;
    }

    if (cmd === 'cat mirror.log' || cmd === 'cat /var/log/mirror.log') {
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
      if (!mirrorLogRead) {
        pushLines([{ text: '权限校验失败：请先查阅本地镜像日志 (cat mirror.log) 以获取 Root 令牌。', tone: 'warn' }]);
        return;
      }
      pushLines([{ text: 'Root 权限已授予！正在接管并唤醒虚拟系统核心……', tone: 'success' }]);
      window.setTimeout(() => triggerTerminalAwaken(), 550);
      return;
    }

    if (cmd === 'shield') {
      togglePrivacyFlag('firewallEnabled');
      pushLines([{ text: '已切换防火墙状态。输入 status 查看详情。', tone: 'info' }]);
      return;
    }

    if (cmd.startsWith('open ')) {
      const target = cmd.replace('open ', '').trim();
      const map: Record<string, Parameters<typeof openApp>[0]> = {
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
      };
      if (map[target]) {
        const isStoreApp = (['vscode', 'monitor', 'radio', 'files'] as string[]).includes(target);
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
    <div className="h-full min-h-0 bg-slate-950 text-slate-100 font-mono-tabular flex flex-col">
      <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <span className="flex items-center gap-1.5">
          <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>Windows Terminal</span>
        </span>
        <span>输入 help 获取命令列表</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1.5 text-xs">
        {lines.map((line) => (
          <div
            key={line.id}
            className={`whitespace-pre-wrap leading-relaxed ${
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runCommand(cmdInput);
          setCmdInput('');
        }}
        className="px-4 py-2.5 border-t border-slate-800 flex items-center gap-2 text-xs"
      >
        <span className="text-emerald-400 font-semibold shrink-0">&gt;</span>
        <input
          type="text"
          value={cmdInput}
          onChange={(e) => setCmdInput(e.target.value)}
          placeholder="输入命令 (help / status / scan / cat mirror.log)..."
          className="flex-1 bg-transparent outline-none text-slate-100 placeholder:text-slate-600"
        />
      </form>
    </div>
  );
};
