import React, { useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, Flag, Search, ShieldCheck } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useIsMobile } from '../../hooks/useIsMobile';

export const SecurityApp: React.FC = () => {
  const isMobile = useIsMobile();
  const {
    step,
    privacy,
    system,
    discoveredLore,
    openApp,
    purgeThreatsInSecurity,
    submitSecurityReport,
  } = useGame();

  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);

  const isLight = system.theme === 'light';
  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-800/65 border-slate-700/80 text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  const activeCount = [
    privacy.firewallEnabled,
    privacy.privacyEnabled,
    privacy.antivirusEnabled,
    privacy.dnsEnabled,
  ].filter(Boolean).length;

  const coreReady =
    privacy.firewallEnabled && privacy.antivirusEnabled && privacy.dnsEnabled;

  const threats: string[] = [];
  if (!privacy.firewallEnabled) {
    threats.push(isMobile ? '本地网络防火墙未启用 · 端口处于开放状态' : 'Windows 防火墙未启用 · 端口处于开放状态');
  }
  if (!privacy.privacyEnabled) threats.push('隐私权限保护未启用');
  if (!privacy.antivirusEnabled) threats.push('实时病毒防护未启用');
  if (!privacy.dnsEnabled) threats.push('DNS 安全解析未启用');
  if (step >= 1) threats.push('未备案外部站点残留连接句柄 (remote_hr_hook)');
  if (step >= 2) threats.push('高危未知进程运行中：doppelganger_daemon.exe (0x000000)');

  const runDeepScan = () => {
    setScanning(true);
    setScanDone(false);
    window.setTimeout(() => {
      setScanning(false);
      setScanDone(true);
    }, 950);
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-5 pb-6 space-y-4">
      {/* Defense Summary */}
      <div className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${cardBg}`}>
        <div className="flex items-center gap-3">
          {coreReady ? (
            <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-8 h-8 text-amber-400 shrink-0" />
          )}
          <div>
            <div className="text-sm font-bold">
              系统安全组件已启用：{activeCount} / 4
            </div>
            <div className={`text-xs ${mutedText}`}>
              {coreReady
                ? '网络防火墙与核心安全组件运行正常'
                : '部分防护未打开，可在系统设置中管理安全开关'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openApp('settings')}
          className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
        >
          打开隐私与安全性
        </button>
      </div>

      {/* Live Process Telemetry */}
      <div className={`rounded-xl border p-4 space-y-2.5 ${cardBg}`}>
        <div className="flex items-center gap-2 text-xs font-bold">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>活动进程监测</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono-tabular">
          <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/70 border-slate-800'}`}>
            <div>system_kernel.sys · 正常</div>
          </div>
          <div
            className={`p-2.5 rounded-lg border ${
              step >= 2
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : step >= 1
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-900/70 border-slate-800'
            }`}
          >
            {step >= 2
              ? 'doppelganger_daemon.exe · 异常占用'
              : step >= 1
                ? 'remote_hr_hook.dll · 会话驻留'
                : 'network_guard.svc · 空闲'}
          </div>
        </div>
      </div>

      {/* Deep Scan */}
      <button
        type="button"
        disabled={scanning}
        onClick={runDeepScan}
        className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        <Search className="w-4 h-4" />
        <span>{scanning ? '正在扫描系统内存与网络端口...' : '运行快速安全扫描'}</span>
      </button>

      {scanDone && (
        <div className={`rounded-xl border p-4 space-y-3 ${cardBg}`}>
          {threats.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              <span>未检测到已知系统威胁或异常连接。</span>
            </div>
          ) : (
            <>
              <div className="text-xs font-bold text-rose-400">
                共发现 {threats.length} 项安全注意项：
              </div>
              <ul className="space-y-1.5 text-xs">
                {threats.map((item) => (
                  <li
                    key={item}
                    className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-200"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              {privacy.antivirusEnabled ? (
                <button
                  type="button"
                  onClick={purgeThreatsInSecurity}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer"
                >
                  隔离并清除已检测到的威胁
                </button>
              ) : (
                <p className={`text-xs ${mutedText}`}>
                  实时病毒防护未开启，暂时无法执行自动隔离清除。
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Cyber Report Card */}
      <div className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${cardBg}`}>
        <div>
          <div className="text-xs font-bold flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5 text-amber-400" />
            <span>网安可疑站点举报接口</span>
          </div>
          <div className={`text-[11px] mt-0.5 font-mono-tabular ${mutedText}`}>
            已缓存异常访问证据：{discoveredLore.length} / 3 份 · 招聘站接触：
            {step >= 1 || discoveredLore.includes('jobs') ? '已确认' : '未访问'}
          </div>
        </div>
        <button
          type="button"
          onClick={submitSecurityReport}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            (step >= 1 || discoveredLore.includes('jobs')) && discoveredLore.length >= 3
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              : isLight
                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
          }`}
        >
          提交网安封禁举报
        </button>
      </div>
    </div>
  );
};
