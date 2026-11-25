import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  Cpu,
  Flame,
  HardDrive,
  PauseCircle,
  ShieldCheck,
  Skull,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { computeSystemMetrics } from '../../utils/systemMetrics';

export const MonitorApp: React.FC = () => {
  const isMobile = useIsMobile();
  const {
    step,
    sanity,
    isOnline,
    privacy,
    installedApps,
    suspendedDaemon,
    windowInstances,
    system,
    suspendDaemonProcess,
    triggerKernelMeltdown,
  } = useGame();

  const [stressTest, setStressTest] = useState(false);
  const [confirmKillKernel, setConfirmKillKernel] = useState(false);
  const [tick, setTick] = useState(0);
  const [cpuHistory, setCpuHistory] = useState<number[]>([18, 22, 19, 25, 24, 21, 26, 20, 23, 22]);
  const [memHistory, setMemHistory] = useState<number[]>([38, 39, 38, 40, 40, 41, 39, 40, 41, 40]);

  const isLight = system.theme === 'light';
  const surfaceCard = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-800/65 border-slate-700/80 text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  const latestMetrics = computeSystemMetrics({
    windowInstances,
    installedApps,
    step,
    suspendedDaemon,
    stressTest,
    tickOffset: tick,
  });

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => {
        const nextTick = t + 1;
        const m = computeSystemMetrics({
          windowInstances,
          installedApps,
          step,
          suspendedDaemon,
          stressTest,
          tickOffset: nextTick,
        });
        setCpuHistory((prev) => [...prev.slice(-17), m.cpuPercent]);
        setMemHistory((prev) => [...prev.slice(-17), m.memPercent]);
        return nextTick;
      });
    }, 950);
    return () => window.clearInterval(id);
  }, [windowInstances, installedApps, step, suspendedDaemon, stressTest]);

  const currentCpu = cpuHistory[cpuHistory.length - 1];
  const currentMem = memHistory[memHistory.length - 1];

  const renderSparkline = (values: number[], strokeColor: string) => {
    const pts = values
      .map((v, i) => {
        const x = (i / Math.max(1, values.length - 1)) * 100;
        const y = 100 - v;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-14 overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinejoin="round"
          points={pts}
        />
      </svg>
    );
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-5 pb-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <h2 className="text-sm font-bold">
              {isMobile ? '性能监视器 · iOS 进程观测' : 'Windows 资源监视器'}
            </h2>
            <div className={`text-[11px] font-mono-tabular ${mutedText}`}>
              活动应用：{windowInstances.length} · 网络：{isOnline ? '活跃' : '已隔离'} · 防护：
              {privacy.firewallEnabled ? '开启' : '未防护'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setStressTest((s) => !s)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border ${
            stressTest
              ? 'bg-rose-600 border-rose-500 text-white'
              : isLight
                ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>{stressTest ? '停止硬件压测' : '压力负载测试'}</span>
        </button>
      </div>

      {/* Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={`rounded-xl border p-4 space-y-2 ${surfaceCard}`}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-sky-400" />
              <span>{isMobile ? '处理器占用 (A13 移动芯片)' : '处理器占用 (i3-4130)'}</span>
            </span>
            <span className="font-mono-tabular font-bold text-sky-400">{currentCpu}%</span>
          </div>
          {renderSparkline(cpuHistory, '#38bdf8')}
        </div>

        <div className={`rounded-xl border p-4 space-y-2 ${surfaceCard}`}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>
                {isMobile ? '运行内存' : '物理内存'} ({latestMetrics.totalUsedGb.toFixed(2)} / 4.00 GB)
              </span>
            </span>
            <span
              className={`font-mono-tabular font-bold ${
                currentMem >= 85 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {currentMem}%
            </span>
          </div>
          {renderSparkline(memHistory, currentMem >= 85 ? '#f43f5e' : '#34d399')}
        </div>
      </div>

      {/* Meltdown warning banner if stressTest is active */}
      {stressTest && (
        <div className="rounded-xl border border-rose-500/50 bg-rose-950/35 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs text-rose-200">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>
              警告：核心温度正在接近临界值（理智 {sanity}%）。继续超频压测可能导致底层内核与虚拟内存发生不可逆熔断。
            </span>
          </div>
          <button
            type="button"
            onClick={triggerKernelMeltdown}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
          >
            极限超频崩溃
          </button>
        </div>
      )}

      {/* Active Process Table */}
      <div className={`rounded-xl border overflow-hidden ${surfaceCard}`}>
        <div className="px-4 py-2.5 border-b border-slate-700/40 flex items-center justify-between text-xs font-bold">
          <span>活动系统句柄与进程列表</span>
          <span className={`font-mono-tabular font-normal ${mutedText}`}>
            {suspendedDaemon ? '异常句柄已挂起' : '实时监控中'}
          </span>
        </div>

        <div className="divide-y divide-slate-700/35 text-xs">
          {/* Core Kernel Process -> Ending #33 */}
          <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="font-mono-tabular font-bold flex items-center gap-2">
                <span>system_kernel.sys</span>
                <span className="text-[11px] font-normal text-sky-400">PID 0104 · 内核保护</span>
              </div>
              <div className={`text-[11px] mt-0.5 ${mutedText}`}>
                {isMobile
                  ? '维持 iOS 沙箱边界与内存隔离，禁止强行终止。'
                  : '维持虚拟桌面边界与内存隔离，禁止强行终止。'}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {confirmKillKernel ? (
                <>
                  <button
                    type="button"
                    onClick={triggerKernelMeltdown}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Skull className="w-3.5 h-3.5" />
                    <span>确认强制终止</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmKillKernel(false)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-600 text-xs cursor-pointer"
                  >
                    取消
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmKillKernel(true)}
                  className="px-3 py-1.5 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/15 text-xs font-medium cursor-pointer"
                >
                  结束进程
                </button>
              )}
            </div>
          </div>

          {/* Suspicious Hook Process -> Suspend! */}
          <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="font-mono-tabular font-bold flex items-center gap-2">
                <span>remote_hr_hook.dll</span>
                <span
                  className={`text-[11px] font-normal ${
                    suspendedDaemon
                      ? 'text-emerald-400'
                      : step >= 1
                        ? 'text-amber-400'
                        : mutedText
                  }`}
                >
                  PID 0666 · {suspendedDaemon ? '已挂起' : step >= 1 ? '异常外部唤醒中' : '预加载占位'}
                </span>
              </div>
              <div className={`text-[11px] mt-0.5 ${mutedText}`}>
                挂起该模块可立即冻结后台异常弹窗与被动理智流失。
              </div>
            </div>
            <button
              type="button"
              onClick={suspendDaemonProcess}
              disabled={suspendedDaemon}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 ${
                suspendedDaemon
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                  : 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
              }`}
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>{suspendedDaemon ? '已安全挂起' : '挂起模块'}</span>
            </button>
          </div>

          {/* Daemon 0x000000 when step >= 2 */}
          {step >= 2 && (
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-rose-950/20">
              <div>
                <div className="font-mono-tabular font-bold text-rose-400">
                  doppelganger_daemon.exe · PID 0000 · 高危覆写
                </div>
                <div className={`text-[11px] mt-0.5 ${mutedText}`}>
                  {isMobile
                    ? '无法直接从性能监视结束，需通过「设备安全」「终端」或「VS Code Mobile 热更新」根除。'
                    : '无法直接从任务管理器结束，需通过「安全中心」「终端」或「VS Code 源码热更新」根除。'}
                </div>
              </div>
              <span className="text-xs font-mono-tabular text-rose-400 shrink-0">拒绝访问</span>
            </div>
          )}

          {/* Network Guard */}
          <div className="px-4 py-3 flex items-center justify-between gap-2">
            <div>
              <div className="font-mono-tabular font-semibold">network_guard.svc · PID 0210</div>
              <div className={`text-[11px] mt-0.5 ${mutedText}`}>
                本地端口防护守卫 · {privacy.firewallEnabled ? '已拦截外部探针' : '规则未启用'}
              </div>
            </div>
            <ShieldCheck
              className={`w-4 h-4 shrink-0 ${
                privacy.firewallEnabled ? 'text-emerald-400' : 'text-slate-500'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
