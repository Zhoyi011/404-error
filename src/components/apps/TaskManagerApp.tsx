import React, { useEffect, useState } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  Skull,
  Trash2,
  Wifi,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { computeSystemMetrics } from '../../utils/systemMetrics';

export const TaskManagerApp: React.FC = () => {
  const isMobile = useIsMobile();
  const {
    step,
    sanity,
    isOnline,
    privacy,
    system,
    installedApps,
    suspendedDaemon,
    windowInstances,
    closeInstance,
    focusInstance,
    suspendDaemonProcess,
    triggerKernelMeltdown,
    triggerJumpscareEnding,
    auditAndTerminateDaemon,
    openApp,
  } = useGame();

  const [tab, setTab] = useState<'processes' | 'performance' | 'startup'>('processes');
  const [cpuTick, setCpuTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setCpuTick((t) => t + 1), 1600);
    return () => window.clearInterval(id);
  }, []);

  const isLight = system.theme === 'light';
  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-900/80 border-slate-700/80 text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  const metrics = computeSystemMetrics({
    windowInstances,
    installedApps,
    step,
    suspendedDaemon,
    tickOffset: cpuTick,
  });
  const { cpuPercent, memPercent, totalUsedGb, windowBreakdown } = metrics;
  const netMbps = !isOnline ? '0.0' : step >= 2 ? '84.6' : step >= 1 ? '12.4' : '0.8';

  const handleKillDaemonRaw = () => {
    if (privacy.firewallEnabled && privacy.antivirusEnabled && suspendedDaemon) {
      auditAndTerminateDaemon();
      return;
    }
    triggerJumpscareEnding();
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-5 pb-6 space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-sky-400 shrink-0" />
          <div>
            <div className="text-sm font-bold">
              {isMobile ? '手机进程监视 · Process Monitor' : '系统任务管理器 · Task Manager'}
            </div>
            <div className={`text-[11px] font-mono-tabular ${mutedText}`}>
              {isMobile
                ? `后台应用：${windowInstances.length} · 运行内存：4.00 GB LPDDR4 · 精神同步负载：${100 - sanity}%`
                : `活动窗口：${windowInstances.length} · 物理内存：4.00 GB DDR3 · 精神同步负载：${100 - sanity}%`}
            </div>
          </div>
        </div>

        <div className="flex gap-1 p-1 rounded-lg bg-slate-950/60 border border-slate-700/70">
          {(
            [
              { id: 'processes', label: '进程' },
              { id: 'performance', label: '性能' },
              { id: 'startup', label: '启动与端口' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                tab === t.id ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Metrics Strip */}
      <div className="grid grid-cols-3 gap-2.5 text-xs font-mono-tabular">
        <div className={`rounded-xl border p-3 ${cardBg}`}>
          <div className={`text-[10px] ${mutedText}`}>CPU 使用率</div>
          <div className={`text-lg font-bold mt-0.5 ${cpuPercent > 75 ? 'text-rose-400' : 'text-sky-400'}`}>
            {cpuPercent}%
          </div>
        </div>
        <div className={`rounded-xl border p-3 ${cardBg}`}>
          <div className={`text-[10px] ${mutedText}`}>
            {isMobile ? '运存' : '内存'} ({totalUsedGb.toFixed(2)} / 4.00 GB)
          </div>
          <div
            className={`text-lg font-bold mt-0.5 ${
              memPercent >= 85 ? 'text-rose-400' : memPercent > 65 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {memPercent}%
          </div>
        </div>
        <div className={`rounded-xl border p-3 ${cardBg}`}>
          <div className={`text-[10px] ${mutedText}`}>网络吞吐</div>
          <div className="text-lg font-bold mt-0.5 text-cyan-400">{netMbps} Mbps</div>
        </div>
      </div>

      {tab === 'processes' && (
        <div className="space-y-3">
          {/* Open Window Apps */}
          <div className={`rounded-xl border p-3.5 space-y-2 ${cardBg}`}>
            <div className="text-xs font-bold flex items-center justify-between">
              <span>{isMobile ? `后台驻留应用 (${windowInstances.length})` : `正在运行的应用 (${windowInstances.length})`}</span>
              <span className={`text-[11px] ${mutedText}`}>
                {isMobile ? '驻留越多应用与标签页运存占用越高' : '打开越多软件与标签页内存占用越高'}
              </span>
            </div>
            {windowInstances.length === 0 ? (
              <div className={`text-xs py-2 ${mutedText}`}>暂无其他前景窗口。</div>
            ) : (
              <div className="space-y-1.5">
                {windowInstances.map((win) => {
                  const est = windowBreakdown.find((b) => b.instanceId === win.instanceId);
                  return (
                    <div
                      key={win.instanceId}
                      className={`px-3 py-2 rounded-lg border flex items-center justify-between gap-2 text-xs ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{win.title}</div>
                        <div className={`text-[10px] font-mono-tabular ${mutedText}`}>
                          {win.appId}.exe · 内存 {est?.memMb ?? 180} MB · CPU {est?.cpuPercent ?? 4}% ·{' '}
                          {win.isMinimized ? '后台挂起' : '运行中'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => focusInstance(win.instanceId)}
                          className="px-2.5 py-1 rounded bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 text-[11px] cursor-pointer"
                        >
                          切换
                        </button>
                        <button
                          type="button"
                          onClick={() => closeInstance(win.instanceId)}
                          className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-[11px] cursor-pointer"
                        >
                          结束
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* System & Anomaly Processes */}
          <div className={`rounded-xl border p-3.5 space-y-2.5 ${cardBg}`}>
            <div className="text-xs font-bold">后台与内核服务进程</div>

            {/* system_kernel.sys (#33) */}
            <div
              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/65 border-slate-800'
              }`}
            >
              <div>
                <div className="font-mono-tabular font-bold flex items-center gap-2">
                  <span>PID 0104 · system_kernel.sys</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px]">
                    核心保护 · {metrics.baseOsMb} MB
                  </span>
                </div>
                <div className={`text-[11px] mt-0.5 ${mutedText}`}>
                  {isMobile
                    ? '移动操作系统底层调度内核（强制结束会导致严重过热熔断）'
                    : '操作系统底层调度内核（强制结束会导致严重蓝屏熔断）'}
                </div>
              </div>
              <button
                type="button"
                onClick={triggerKernelMeltdown}
                className="px-3 py-1.5 rounded-lg bg-rose-600/85 hover:bg-rose-600 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Trash2 className="w-3 h-3" />
                <span>强行终止</span>
              </button>
            </div>

            {/* remote_hr_hook.dll */}
            <div
              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                suspendedDaemon
                  ? 'bg-emerald-500/10 border-emerald-500/40'
                  : 'bg-amber-500/10 border-amber-500/40'
              }`}
            >
              <div>
                <div className="font-mono-tabular font-bold flex items-center gap-2">
                  <span>PID 0666 · remote_hr_hook.dll</span>
                  <span className="text-[10px] font-normal">
                    {suspendedDaemon ? '[已挂起冻结]' : step >= 1 ? '[外联句柄活跃]' : '[待命监听]'}
                  </span>
                </div>
                <div className={`text-[11px] mt-0.5 ${mutedText}`}>
                  {suspendedDaemon
                    ? '外联通信与理智侵蚀已被冻结，可继续对主进程执行安全审计清零。'
                    : '建议先挂起该外联句柄以阻断子线程重连通道。'}
                </div>
              </div>
              <button
                type="button"
                onClick={suspendDaemonProcess}
                disabled={suspendedDaemon}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer shrink-0 ${
                  suspendedDaemon
                    ? 'bg-emerald-600/30 text-emerald-300 cursor-default'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                {suspendedDaemon ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                <span>{suspendedDaemon ? '已冻结' : '挂起线程'}</span>
              </button>
            </div>

            {/* doppelganger_daemon.exe (0x000000) -> #40 or #5 */}
            <div className="p-3 rounded-xl border border-rose-500/45 bg-rose-950/20 space-y-2.5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-mono-tabular font-bold text-rose-300 flex items-center gap-2">
                    <span>PID 0000 · doppelganger_daemon.exe</span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px]">
                      {step >= 2 ? '高危驻留' : '影子休眠'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    0x000000 主体守护树 · 安全清零前置：挂起 hook（{suspendedDaemon ? '✓' : '✗'}）、防火墙（{privacy.firewallEnabled ? '✓' : '✗'}）、杀毒防护（{privacy.antivirusEnabled ? '✓' : '✗'}）
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={auditAndTerminateDaemon}
                  className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer ${
                    suspendedDaemon && privacy.firewallEnabled && privacy.antivirusEnabled
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      : 'bg-sky-600 hover:bg-sky-500 text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>安全审计并清零进程树</span>
                </button>
                <button
                  type="button"
                  onClick={handleKillDaemonRaw}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-700 text-slate-200 text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Skull className="w-3.5 h-3.5" />
                  <span>无防护强杀</span>
                </button>
                {(!privacy.firewallEnabled || !privacy.antivirusEnabled) && (
                  <button
                    type="button"
                    onClick={() => openApp('settings')}
                    className="px-3 py-1.5 rounded-lg border border-slate-600 text-[11px] cursor-pointer hover:bg-white/5"
                  >
                    前往设置开防护
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'performance' && (
        <div className={`rounded-xl border p-4 space-y-4 ${cardBg}`}>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono-tabular">
              <span className="flex items-center gap-1.5 font-semibold">
                <Activity className="w-4 h-4 text-sky-400" />
                <span>{isMobile ? 'A13 Bionic 移动芯片 (6 核)' : 'Intel Core i3-4130 (2 核 4 线程)'}</span>
              </span>
              <span>{cpuPercent}% · {isMobile ? '2.65 GHz' : '3.40 GHz'}</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${cpuPercent > 75 ? 'bg-rose-500' : 'bg-sky-500'}`}
                style={{ width: `${cpuPercent}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono-tabular">
              <span className="flex items-center gap-1.5 font-semibold">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>{isMobile ? '统一运行内存 (LPDDR4)' : '物理内存 (DDR3 1600 MHz)'}</span>
              </span>
              <span>{totalUsedGb.toFixed(2)} GB / 4.00 GB</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  memPercent >= 85 ? 'bg-rose-500' : memPercent > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${memPercent}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono-tabular">
              <span className="flex items-center gap-1.5 font-semibold">
                <Wifi className="w-4 h-4 text-cyan-400" />
                <span>WLAN 网络适配器</span>
              </span>
              <span>{isOnline ? `已连接 · ${netMbps} Mbps` : '已断开'}</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'startup' && (
        <div className={`rounded-xl border p-4 space-y-2 text-xs font-mono-tabular ${cardBg}`}>
          <div className="font-sans font-bold mb-2">开机自启与开放端口监测</div>
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between">
            <span>{isMobile ? 'iOS Security Health' : 'Windows Security Health'}</span>
            <span className="text-emerald-400">已启用</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between">
            <span>NightNode Telemetry Bridge</span>
            <span className={step >= 1 ? 'text-rose-400' : 'text-amber-400'}>
              {step >= 1 ? '端口 6666 已唤醒' : '待机监听'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between">
            <span>BLE_Audio_Mirror_Svc</span>
            <span className={system.bluetooth ? 'text-amber-400' : 'text-slate-500'}>
              {system.bluetooth ? '蓝牙广播扫描中' : '适配器关闭'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
