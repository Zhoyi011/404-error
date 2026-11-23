import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  Cpu,
  FileCode2,
  FileJson,
  Play,
  Puzzle,
  Terminal as TerminalIcon,
  Wrench,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useIsMobile } from '../../hooks/useIsMobile';

type IdeFileId = 'daemon' | 'reality' | 'exorcism' | 'env';

const IDE_FILES: { id: IdeFileId; path: string; name: string; lang: string }[] = [
  { id: 'daemon', path: 'src/daemon/0x000000.ts', name: '0x000000.ts', lang: 'TypeScript' },
  { id: 'reality', path: 'src/reality.config.ts', name: 'reality.config.ts', lang: 'TypeScript' },
  { id: 'exorcism', path: 'src/protocols/exorcism.json', name: 'exorcism.json', lang: 'JSON' },
  { id: 'env', path: '.env.local', name: '.env.local', lang: 'Env' },
];

export const VSCodeApp: React.FC = () => {
  const isMobile = useIsMobile();
  const {
    sanity,
    step,
    privacy,
    mirrorLogRead,
    vscodePatches,
    vscodeGodMode,
    vscodeCorruptExt,
    toggleVscodePatch,
    setVscodeGodMode,
    toggleVscodeCorruptExt,
    compileVscodeHotfix,
    runCorruptVscodeSample,
  } = useGame();

  const [activeFile, setActiveFile] = useState<IdeFileId>('daemon');
  const [sidebarTab, setSidebarTab] = useState<'files' | 'extensions'>('files');
  const [logs, setLogs] = useState<string[]>([
    '[VS Code Hot-Patch Engine v1.98.2] Workspace attached: C:\\Users\\Local\\night-node',
    '提示：检查 src/daemon/0x000000.ts 中的异常注入配置，修复后点击右上角「编译热更新」。',
  ]);

  const appendLog = (msg: string) => {
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLogs((prev) => [...prev.slice(-14), `[${ts}] ${msg}`]);
  };

  const handleCompile = () => {
    const res = compileVscodeHotfix();
    appendLog(res);
  };

  const fixedCount = vscodePatches.filter(Boolean).length;
  const activeMeta = IDE_FILES.find((f) => f.id === activeFile) ?? IDE_FILES[0];

  return (
    <div className="h-full min-h-0 bg-[#1e1e1e] text-slate-200 flex flex-col overflow-hidden select-none">
      {/* Top Action & Tab Strip */}
      <div className="px-3 py-2 bg-[#252526] border-b border-[#333336] flex items-center justify-between gap-2 shrink-0 flex-wrap">
        <div className="flex items-center gap-2 text-xs">
          <Code2 className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="font-semibold text-slate-100">
            {isMobile ? 'VS Code Mobile' : 'Visual Studio Code'}
          </span>
          <span className="text-[11px] font-mono-tabular text-slate-400 hidden sm:inline">
            · {activeMeta.path}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono-tabular text-amber-300">
            修复进度 {fixedCount}/3
          </span>
          <button
            type="button"
            onClick={handleCompile}
            className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>编译热更新</span>
          </button>
        </div>
      </div>

      {/* Main Workbench Area */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {/* Explorer / Extensions Rail */}
        <div className="md:w-56 bg-[#252526] border-b md:border-b-0 md:border-r border-[#333336] flex flex-col shrink-0">
          <div className="flex border-b border-[#333336] text-[11px]">
            <button
              type="button"
              onClick={() => setSidebarTab('files')}
              className={`flex-1 py-2 px-2.5 flex items-center justify-center gap-1.5 font-medium cursor-pointer ${
                sidebarTab === 'files'
                  ? 'bg-[#1e1e1e] text-sky-400 border-b-2 border-sky-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>资源管理器</span>
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab('extensions')}
              className={`flex-1 py-2 px-2.5 flex items-center justify-center gap-1.5 font-medium cursor-pointer ${
                sidebarTab === 'extensions'
                  ? 'bg-[#1e1e1e] text-amber-400 border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Puzzle className="w-3.5 h-3.5" />
              <span>扩展插件</span>
            </button>
          </div>

          {sidebarTab === 'files' ? (
            <div className="p-2 flex md:flex-col gap-1 overflow-x-auto">
              {IDE_FILES.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setActiveFile(file.id)}
                  className={`px-2.5 py-1.5 rounded text-xs text-left flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    activeFile === file.id
                      ? 'bg-[#37373d] text-white font-medium'
                      : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                  }`}
                >
                  {file.lang === 'JSON' ? (
                    <FileJson className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <FileCode2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  )}
                  <span className="truncate">{file.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 space-y-3 text-xs">
              <div className="p-2.5 rounded border border-rose-500/35 bg-rose-950/25 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-rose-300">Doppelganger-Linter</span>
                  <span className="text-[10px] font-mono-tabular text-rose-400">v0.0.0</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  未知来源的语法分析器，声称可以反编译宿主脑波信号。
                </p>
                <button
                  type="button"
                  onClick={toggleVscodeCorruptExt}
                  className={`w-full py-1.5 rounded text-xs font-semibold cursor-pointer ${
                    vscodeCorruptExt
                      ? 'bg-rose-600 text-white'
                      : 'bg-[#37373d] text-slate-200 hover:bg-[#45454c]'
                  }`}
                >
                  {vscodeCorruptExt ? '已启用（点击停用）' : '启用此扩展'}
                </button>
                {vscodeCorruptExt && (
                  <button
                    type="button"
                    onClick={() => {
                      runCorruptVscodeSample();
                      appendLog('[EXT] Doppelganger-Linter 注入了一个未知反编译样本！');
                    }}
                    className="w-full py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    运行异常注入样本
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Code Canvas + Bottom Output Console */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4 font-mono-tabular text-xs leading-6">
            {activeFile === 'daemon' && (
              <div className="space-y-2">
                <div className="text-slate-500">
                  // 点击下方标红的高危注入行即可在线修补源码逻辑
                </div>
                <div className="text-sky-300">export const DAEMON_HOOK_0x000000 = {'{'}</div>

                {/* Patch 1 */}
                <button
                  type="button"
                  onClick={() => {
                    toggleVscodePatch(0);
                    appendLog(
                      vscodePatches[0]
                        ? '[EDIT] 已还原 ALLOW_CAMERA_SILENT_HOOK 为原始状态'
                        : '[PATCH 1/3] 已将 ALLOW_CAMERA_SILENT_HOOK 改为 false'
                    );
                  }}
                  className={`w-full text-left px-3 py-2 rounded border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    vscodePatches[0]
                      ? 'bg-emerald-950/35 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/35 border-rose-500/40 text-rose-300 hover:bg-rose-950/55'
                  }`}
                >
                  <span>
                    <span className="text-slate-500 mr-3">04</span>
                    ALLOW_CAMERA_SILENT_HOOK:{' '}
                    <strong>{vscodePatches[0] ? 'false' : 'true'}</strong>,
                  </span>
                  <span className="text-[11px] flex items-center gap-1 shrink-0">
                    {vscodePatches[0] ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>已修复</span>
                      </>
                    ) : (
                      <>
                        <Wrench className="w-3.5 h-3.5" />
                        <span>点击修复</span>
                      </>
                    )}
                  </span>
                </button>

                {/* Patch 2 */}
                <button
                  type="button"
                  onClick={() => {
                    toggleVscodePatch(1);
                    appendLog(
                      vscodePatches[1]
                        ? '[EDIT] 已还原 MIRROR_IDENTITY_OVERRIDE'
                        : '[PATCH 2/3] 已将 MIRROR_IDENTITY_OVERRIDE 锁定为 "BLOCKED"'
                    );
                  }}
                  className={`w-full text-left px-3 py-2 rounded border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    vscodePatches[1]
                      ? 'bg-emerald-950/35 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/35 border-rose-500/40 text-rose-300 hover:bg-rose-950/55'
                  }`}
                >
                  <span>
                    <span className="text-slate-500 mr-3">05</span>
                    MIRROR_IDENTITY_OVERRIDE:{' '}
                    <strong>{vscodePatches[1] ? '"BLOCKED"' : '"AUTO_CLONE"'}</strong>,
                  </span>
                  <span className="text-[11px] flex items-center gap-1 shrink-0">
                    {vscodePatches[1] ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>已修复</span>
                      </>
                    ) : (
                      <>
                        <Wrench className="w-3.5 h-3.5" />
                        <span>点击修复</span>
                      </>
                    )}
                  </span>
                </button>

                {/* Patch 3 */}
                <button
                  type="button"
                  onClick={() => {
                    toggleVscodePatch(2);
                    appendLog(
                      vscodePatches[2]
                        ? '[EDIT] 已还原 HEARTBEAT_PORT 为 6666'
                        : '[PATCH 3/3] 已封闭异常心跳端口 HEARTBEAT_PORT = 0'
                    );
                  }}
                  className={`w-full text-left px-3 py-2 rounded border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    vscodePatches[2]
                      ? 'bg-emerald-950/35 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/35 border-rose-500/40 text-rose-300 hover:bg-rose-950/55'
                  }`}
                >
                  <span>
                    <span className="text-slate-500 mr-3">06</span>
                    HEARTBEAT_PORT:{' '}
                    <strong>{vscodePatches[2] ? '0 /* CLOSED */' : '6666'}</strong>,
                  </span>
                  <span className="text-[11px] flex items-center gap-1 shrink-0">
                    {vscodePatches[2] ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>已修复</span>
                      </>
                    ) : (
                      <>
                        <Wrench className="w-3.5 h-3.5" />
                        <span>点击修复</span>
                      </>
                    )}
                  </span>
                </button>

                <div className="text-sky-300">{'};'}</div>

                <div className="mt-3 p-3 rounded border border-slate-700/80 bg-[#252526] text-[11px] text-slate-300 space-y-1">
                  <div>
                    热更新内核校验前提：
                    <span className={privacy.firewallEnabled ? 'text-emerald-400' : 'text-amber-400'}>
                      {' '}防火墙 [{privacy.firewallEnabled ? 'ON' : 'OFF'}]
                    </span>
                    {' · '}
                    <span className={privacy.antivirusEnabled ? 'text-emerald-400' : 'text-amber-400'}>
                      实时病毒防护 [{privacy.antivirusEnabled ? 'ON' : 'OFF'}]
                    </span>
                  </div>
                  <div className="text-slate-400">
                    修复上述 3 行逻辑后，在开启防火墙和杀毒的状态下点击「编译热更新」即可从源码层面彻底重写伪人进程。
                  </div>
                </div>
              </div>
            )}

            {activeFile === 'reality' && (
              <div className="space-y-3">
                <div className="text-slate-500">// 运行时全局现实常量 · 需要最高调试凭证方可生效</div>
                <div className="space-y-1 text-slate-300">
                  <div><span className="text-purple-400">export const</span> CURRENT_STEP = <span className="text-amber-300">{step}</span>;</div>
                  <div><span className="text-purple-400">export const</span> SUBJECT_SANITY = <span className="text-amber-300">{sanity}</span>;</div>
                  <div><span className="text-purple-400">export const</span> ROOT_MIRROR_TOKEN = <span className="text-emerald-300">{mirrorLogRead ? '"VERIFIED_FROM_LOG"' : '"MISSING"'}</span>;</div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = !vscodeGodMode;
                    setVscodeGodMode(next);
                    appendLog(`已将 reality.config.ts 中的 GOD_MODE 设置为 ${String(next)}`);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    vscodeGodMode
                      ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                      : 'bg-[#252526] border-slate-700 text-slate-200 hover:border-slate-500'
                  }`}
                >
                  <span>
                    <span className="text-purple-400">export const</span> GOD_MODE ={' '}
                    <strong className="text-amber-300">{String(vscodeGodMode)}</strong>;
                  </span>
                  <span className="text-[11px] flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>{vscodeGodMode ? '点击关闭' : '点击切换为 true'}</span>
                  </span>
                </button>

                <div className="p-3 rounded border border-slate-700 bg-[#252526] text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Root 调试锁提示</span>
                  </div>
                  <p>
                    当 `GOD_MODE = true` 时点击「编译热更新」，必须同时满足：理智 100% 且已在「终端」读取过 `mirror.log`（当前：{sanity}% / {mirrorLogRead ? '已读取' : '未读取'}）。
                  </p>
                </div>
              </div>
            )}

            {activeFile === 'exorcism' && (
              <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed">
{`{
  "protocol": "DIGITAL_EXORCISM_REV4",
  "requiredShields": ["firewallEnabled", "antivirusEnabled", "dnsEnabled"],
  "emergencyRadioCheck": {
    "civilAlertFreq": "96.8 MHz",
    "numbersCipherFreq": "104.2 MHz",
    "tabooWarningFreq": "107.9 MHz"
  },
  "notes": "若在资源监视器强行结束 system_kernel.sys，内核记忆体将瞬间熔断崩溃。"
}`}
              </pre>
            )}

            {activeFile === 'env' && (
              <pre className="text-sky-200 whitespace-pre-wrap leading-relaxed">
{`NODE_ENV=midnight_local
DAEMON_HOST=127.0.0.1
MIRROR_LOG_PATH=/var/log/mirror.log
FIREWALL_ACTIVE=${String(privacy.firewallEnabled)}
ANTIVIRUS_ACTIVE=${String(privacy.antivirusEnabled)}
DNS_ENCRYPTED=${String(privacy.dnsEnabled)}
`}
              </pre>
            )}
          </div>

          {/* Bottom Output Terminal */}
          <div className="h-24 sm:h-32 bg-[#181818] border-t border-[#333336] flex flex-col shrink-0">
            <div className="px-3 py-1.5 border-b border-[#2b2b2e] flex items-center justify-between text-[11px] text-slate-400 shrink-0">
              <span className="flex items-center gap-1.5">
                <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>输出控制台 (OUTPUT)</span>
              </span>
              <span className="font-mono-tabular">UTF-8 · TypeScript 5.8</span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-2.5 font-mono-tabular text-[11px] space-y-1">
              {logs.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.includes('[FAIL]') || line.includes('[ERR')
                      ? 'text-rose-400'
                      : line.includes('[WARN]')
                        ? 'text-amber-300'
                        : line.includes('[SUCCESS]') || line.includes('[GOD_MODE]')
                          ? 'text-emerald-400'
                          : 'text-slate-300'
                  }
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
