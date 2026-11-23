import React, { useState } from 'react';
import {
  CheckCircle2,
  FileText,
  FileWarning,
  FolderLock,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useIsMobile } from '../../hooks/useIsMobile';

interface VaultFileItem {
  id: string;
  folder: '桌面' | '系统日志' | '隔离区';
  name: string;
  size: string;
  shreddable: boolean;
  lines: string[];
}

const VAULT_FILES: VaultFileItem[] = [
  {
    id: 'rent_notice',
    folder: '桌面',
    name: 'rent_notice.txt',
    size: '1.2 KB',
    shreddable: false,
    lines: [
      '=== 房租最后通牒（本地扫描副本）===',
      '租客：林深 | 本月应缴差额：¥2,400',
      '备注：若明天中午前无法筹齐，只能暂请搬离。',
      '提醒：与其冒险点陌生兼职，也可以跟群聊里的家人商量试试？',
    ],
  },
  {
    id: 'mirror_dump',
    folder: '系统日志',
    name: 'mirror_dump.hex',
    size: '48.0 KB',
    shreddable: false,
    lines: [
      '0x00F10: 52 45 41 4C 49 54 59 5F 43 4F 4E 46 49 47  | REALITY_CONFIG',
      '0x00F20: 47 4F 44 5F 4D 4F 44 45 20 3D 20 52 4F 4F 54  | GOD_MODE = ROOT',
      '0x00F30: 46 4D 5F 45 4D 45 52 47 45 4E 43 59 3A 39 36  | FM_EMERGENCY:96.8',
      '0x00F40: 4E 55 4D 42 45 52 53 5F 43 48 41 4E 3A 31 30  | NUMBERS_CHAN:104.2',
      '0x00F50: 57 41 52 4E 5F 54 41 42 4F 4F 3A 31 30 37 2E  | WARN_TABOO:107.9',
    ],
  },
  {
    id: 'frag_1',
    folder: '隔离区',
    name: '0x000000_fragment_1.dat',
    size: '12.6 MB',
    shreddable: true,
    lines: [
      '[受损内存残片 #1 - 高危生物特征钩子]',
      '来源句柄：remote_hr_hook.dll',
      '状态：携带异常认知污染标签。开启「实时病毒防护」后可安全粉碎以稳定精神状态（理智 +5%）。',
    ],
  },
  {
    id: 'frag_2',
    folder: '隔离区',
    name: '0x000000_fragment_2.dat',
    size: '19.4 MB',
    shreddable: true,
    lines: [
      '[受损内存残片 #2 - 镜像声纹缓存]',
      '来源句柄：127.0.0.1:6666',
      '状态：内含高频模仿音频帧。建议在实时病毒防护下粉碎清理。',
    ],
  },
];

export const FilesApp: React.FC = () => {
  const isMobile = useIsMobile();
  const { system, privacy, shreddedFiles, shredCorruptedFile } = useGame();
  const [selectedId, setSelectedId] = useState<string>('rent_notice');

  const isLight = system.theme === 'light';
  const surfaceCard = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-800/65 border-slate-700/80 text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  const activeFile = VAULT_FILES.find((f) => f.id === selectedId) ?? VAULT_FILES[0];
  const isShredded = shreddedFiles.includes(activeFile.id);

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <div
        className={`px-4 sm:px-5 py-3 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/70'
        }`}
      >
        <div className="flex items-center gap-2 text-sm font-bold">
          <FolderLock className="w-4 h-4 text-indigo-400" />
          <span>{isMobile ? '文件保险箱' : '深层文件箱 · 本地目录浏览器'}</span>
        </div>
        <span className={`text-xs font-mono-tabular ${mutedText}`}>
          已粉碎残片 {shreddedFiles.length}/2
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 pb-6 grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* File List */}
        <div className="md:col-span-5 space-y-2">
          {VAULT_FILES.map((file) => {
            const cleaned = shreddedFiles.includes(file.id);
            const active = activeFile.id === file.id;
            return (
              <button
                key={file.id}
                type="button"
                onClick={() => setSelectedId(file.id)}
                className={`w-full text-left rounded-xl border p-3 flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  active ? 'ring-2 ring-indigo-500/60' : ''
                } ${surfaceCard}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {file.shreddable ? (
                    <FileWarning className={`w-4 h-4 shrink-0 ${cleaned ? 'text-emerald-400' : 'text-rose-400'}`} />
                  ) : (
                    <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className={`text-xs font-mono-tabular font-semibold truncate ${cleaned ? 'line-through opacity-55' : ''}`}>
                      {file.name}
                    </div>
                    <div className={`text-[11px] ${mutedText}`}>
                      {file.folder} · {file.size}
                    </div>
                  </div>
                </div>
                {cleaned && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* File Inspector */}
        <div className={`md:col-span-7 rounded-2xl border p-4 space-y-4 h-fit ${surfaceCard}`}>
          <div className="flex items-center justify-between gap-2 border-b border-slate-700/40 pb-3">
            <div>
              <div className="text-sm font-mono-tabular font-bold">{activeFile.name}</div>
              <div className={`text-[11px] ${mutedText}`}>
                位置：/{activeFile.folder}/{activeFile.name} · 大小：{activeFile.size}
              </div>
            </div>
            {activeFile.shreddable && (
              <button
                type="button"
                onClick={() => shredCorruptedFile(activeFile.id)}
                disabled={isShredded}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 ${
                  isShredded
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                    : 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isShredded ? '已安全粉碎' : '安全粉碎残片'}</span>
              </button>
            )}
          </div>

          {isShredded ? (
            <div className="p-4 rounded-xl border border-emerald-500/35 bg-emerald-950/25 text-xs text-emerald-300">
              该高危数据碎片已在实时病毒防护下彻底擦除，系统认知负载得到缓解。
            </div>
          ) : (
            <div
              className={`rounded-xl border p-3.5 font-mono-tabular text-xs space-y-1.5 overflow-x-auto ${
                isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
            >
              {activeFile.lines.map((ln, idx) => (
                <div key={idx} className="leading-relaxed whitespace-pre-wrap">
                  {ln}
                </div>
              ))}
            </div>
          )}

          {activeFile.shreddable && !isShredded && !privacy.antivirusEnabled && (
            <div className="flex items-start gap-2 text-[11px] text-amber-400">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>提示：尚未开启「实时病毒防护」，直接粉碎高危残片可能引发数据反噬！</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
