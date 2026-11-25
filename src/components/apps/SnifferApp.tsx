import React, { useState } from 'react';
import {
  Activity,
  Lock,
  Radio,
  Search,
  ShieldAlert,
  ShieldCheck,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { soundEngine } from '../../utils/audio';

interface PacketBeacon {
  id: string;
  src: string;
  dst: string;
  proto: string;
  len: number;
  summary: string;
  decoded: string;
}

const ANOMALY_BEACONS: PacketBeacon[] = [
  {
    id: 'beacon_1',
    src: '192.168.1.104:51842',
    dst: '198.51.100.44:6666',
    proto: 'TLSv1.3 / ALPN-VOID',
    len: 412,
    summary: '伪装成系统字体校验的异常出站心跳握手',
    decoded: 'KEY=0x000000_HANDSHAKE | NODE=MIRROR-RELAY-01',
  },
  {
    id: 'beacon_2',
    src: '198.51.100.44:6666',
    dst: '192.168.1.104:51842',
    proto: 'TCP PSH/ACK',
    len: 1280,
    summary: '携带 `doppelganger_daemon` 加密载荷的回传指令帧',
    decoded: 'CMD=MOUNT_SHADOW_DUMP | C2_MASTER=198.51.100.44',
  },
  {
    id: 'beacon_3',
    src: '192.168.1.104:5353',
    dst: '203.0.113.99:8443',
    proto: 'UDP / DNS-TUNNEL',
    len: 256,
    summary: '未走 DoH 加密通道的侧信道坐标外泄脉冲',
    decoded: 'EXFIL_ACK=LOCAL_HOST_COORDS | BACKUP_C2=203.0.113.99',
  },
];

export const SnifferApp: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  const {
    isOnline,
    step,
    privacy,
    capturedPackets,
    captureSnifferPacket,
    traceAndSeverC2,
    openApp,
  } = useGame();

  const [scanningIdx, setScanningIdx] = useState<string | null>(null);

  const handleCapture = (beaconId: string) => {
    if (!isOnline) {
      captureSnifferPacket(beaconId);
      return;
    }
    soundEngine.playClick();
    setScanningIdx(beaconId);
    window.setTimeout(() => {
      setScanningIdx(null);
      captureSnifferPacket(beaconId);
    }, 360);
  };

  const canSever =
    isOnline &&
    step >= 1 &&
    capturedPackets.length >= 3 &&
    privacy.firewallEnabled &&
    privacy.dnsEnabled;

  return (
    <div className="h-full min-h-0 flex flex-col bg-[#060b13] text-slate-100 select-none overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold truncate">
              {isMobile ? '网络抓包仪 · PacketTrace' : '深网嗅探仪 · PacketTrace Lab'}
            </div>
            <div className="text-[11px] text-slate-400 truncate font-mono-tabular">
              nic0 · {isOnline ? 'PROMISCUOUS CAPTURE ACTIVE' : 'LINK DOWN (OFFLINE)'}
            </div>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-md text-xs font-mono-tabular font-semibold whitespace-nowrap shrink-0 ${
            capturedPackets.length >= 3
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
          }`}
        >
          已捕获信标 {capturedPackets.length} / 3
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {!isOnline && (
          <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center gap-2.5 text-xs text-amber-200">
            <WifiOff className="w-4 h-4 shrink-0 text-amber-400" />
            <span>当前设备处于离线状态，无法抓包捕获外网暗网信标。请先恢复网络连接。</span>
          </div>
        )}

        {/* Normal baseline noise row */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="px-3.5 py-2 border-b border-white/10 bg-white/[0.03] flex items-center justify-between text-[11px] font-mono-tabular text-slate-400">
            <span>LIVE PACKET WATERFALL</span>
            <span>BPF: tcp port 6666 or udp port 5353</span>
          </div>

          <div className="divide-y divide-white/5">
            <div className="px-3.5 py-2.5 text-[11px] font-mono-tabular text-slate-400 flex flex-wrap items-center justify-between gap-2 opacity-75">
              <span className="text-emerald-400">OK</span>
              <span className="truncate">192.168.1.104 → 1.1.1.1 (HTTPS KeepAlive)</span>
              <span>64B</span>
            </div>

            {ANOMALY_BEACONS.map((beacon) => {
              const captured = capturedPackets.includes(beacon.id);
              const busy = scanningIdx === beacon.id;
              return (
                <div
                  key={beacon.id}
                  className={`p-3.5 transition-colors ${
                    captured ? 'bg-cyan-500/10' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            captured
                              ? 'bg-emerald-500/25 text-emerald-300'
                              : 'bg-rose-500/25 text-rose-300'
                          }`}
                        >
                          {captured ? 'CAPTURED' : 'ANOMALY'}
                        </span>
                        <span className="text-cyan-300 font-semibold truncate">
                          {beacon.src} → {beacon.dst}
                        </span>
                        <span className="text-slate-400">{beacon.proto}</span>
                      </div>
                      <div className="text-xs text-slate-300">{beacon.summary}</div>
                      {captured && (
                        <div className="mt-1 px-2.5 py-1.5 rounded bg-black/50 border border-cyan-500/30 font-mono-tabular text-[11px] text-cyan-200 break-all">
                          [DECODED] {beacon.decoded}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleCapture(beacon.id)}
                      disabled={captured || busy || !isOnline}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer flex items-center justify-center gap-1.5 ${
                        captured
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 cursor-default'
                          : 'bg-cyan-600 hover:bg-cyan-500 disabled:opacity-45 text-white'
                      }`}
                    >
                      <Search className="w-3.5 h-3.5 shrink-0" />
                      <span>{captured ? '已抓包解码' : busy ? '捕获中…' : '截获数据包'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* C2 Trace & Sever Panel (#47) */}
        <div
          className={`p-4 rounded-xl border space-y-3 ${
            canSever
              ? 'bg-emerald-500/12 border-emerald-400/45'
              : 'bg-white/[0.03] border-white/10'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
                <Radio className="w-4 h-4 shrink-0" />
                <span>C2 控制端溯源与全栈封锁 (#47)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                在联网且接触异常阶段（step ≥ 1）抓齐全部 3 条信标，定位真实中继节点 `198.51.100.44`
                并配合「防火墙 + DNS 加密」一举反向切断。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div
              className={`px-2.5 py-2 rounded-lg border flex items-center gap-1.5 ${
                isOnline && step >= 1
                  ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>联网+异常期 ({step >= 1 ? '就绪' : '待触发'})</span>
            </div>
            <div
              className={`px-2.5 py-2 rounded-lg border flex items-center gap-1.5 ${
                capturedPackets.length >= 3
                  ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <Activity className="w-3.5 h-3.5 shrink-0" />
              <span>信标 {capturedPackets.length}/3</span>
            </div>
            <div
              className={`px-2.5 py-2 rounded-lg border flex items-center gap-1.5 ${
                privacy.firewallEnabled
                  ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>防火墙 ({privacy.firewallEnabled ? '开' : '关'})</span>
            </div>
            <div
              className={`px-2.5 py-2 rounded-lg border flex items-center gap-1.5 ${
                privacy.dnsEnabled
                  ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>DNS 加密 ({privacy.dnsEnabled ? '开' : '关'})</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={traceAndSeverC2}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
                canSever
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : 'bg-cyan-600/30 hover:bg-cyan-600/45 text-cyan-200 border border-cyan-500/40'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>溯源并封锁 C2 源头节点</span>
            </button>
            {(!privacy.firewallEnabled || !privacy.dnsEnabled) && (
              <button
                onClick={() => openApp('settings')}
                className="px-3.5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
              >
                前往开启防护
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
