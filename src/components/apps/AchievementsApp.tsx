import React, { useState } from 'react';
import { Eye, Lock, Trophy } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { CATEGORY_LABELS, ENDING_IDS } from '../../data/endings';
import { getEndingDefinition } from '../../utils/mobileAdaptation';
import { EndingCategory, EndingId } from '../../types/game';

export const AchievementsApp: React.FC = () => {
  const isMobile = useIsMobile();
  const { unlockedEndings, totalRuns, system, phase, triggerOmegaEnding } = useGame();
  const [filter, setFilter] = useState<'all' | EndingCategory>('all');
  const [selectedId, setSelectedId] = useState<EndingId>(1);

  const isLight = system.theme === 'light';
  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-800/65 border-slate-700/80 text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  const visibleIds = ENDING_IDS.filter((id) =>
    filter === 'all' ? true : getEndingDefinition(id, isMobile).category === filter
  );
  const selected = getEndingDefinition(selectedId, isMobile);
  const selectedUnlocked = unlockedEndings.includes(selectedId);

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-5 pb-6 space-y-4">
      {/* Header Stats & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="text-sm font-bold font-mono-tabular">
              已收集 {unlockedEndings.length} / 50 个结局
            </div>
            <div className={`text-[11px] font-mono-tabular ${mutedText}`}>
              累计探索周目：{totalRuns} 次
            </div>
          </div>
        </div>

        <div
          className={`flex items-center gap-1 p-1 rounded-lg border overflow-x-auto ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          {(
            [
              { id: 'all', label: '全部' },
              { id: 'bad', label: '坏结局' },
              { id: 'normal', label: '普通' },
              { id: 'good', label: '好结局' },
              { id: 'secret', label: '隐藏' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filter === tab.id
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Endings Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {visibleIds.map((id) => {
          const def = getEndingDefinition(id, isMobile);
          const unlocked = unlockedEndings.includes(id);
          const isSelected = selectedId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSelectedId(id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected ? 'ring-2 ring-amber-500/60' : ''
              } ${
                unlocked
                  ? isLight
                    ? 'bg-emerald-50 border-emerald-300 text-slate-900'
                    : 'bg-emerald-950/35 border-emerald-700/60 text-slate-100'
                  : cardBg
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-lg">
                  {unlocked ? def.icon : <Lock className="w-4 h-4 text-slate-500" />}
                </span>
                <span className={`text-[10px] font-mono-tabular ${mutedText}`}>
                  #{id.toString().padStart(2, '0')}
                </span>
              </div>
              <div className="text-xs font-bold truncate">
                {unlocked ? def.name : '未解锁结局'}
              </div>
              <div className={`text-[11px] mt-0.5 ${mutedText}`}>
                {CATEGORY_LABELS[def.category]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Ending Detail Drawer */}
      <div className={`rounded-xl border p-4 space-y-2 ${cardBg}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-bold">
            {selectedUnlocked ? `${selected.icon} ${selected.name}` : `结局 #${selectedId} · 尚未解锁`}
          </div>
          <span className="text-xs text-amber-400 font-medium">
            {CATEGORY_LABELS[selected.category]}
          </span>
        </div>
        <div className="text-xs leading-relaxed text-amber-300/90">
          解锁提示：{selectedUnlocked ? selected.condition : selected.clue}
        </div>
        {selectedUnlocked && (
          <p className={`text-xs leading-relaxed pt-1 border-t border-slate-700/40 ${mutedText}`}>
            {selected.desc}
          </p>
        )}
      </div>
      {/* Omega Protocol Banner (#30 全知观测者) */}
      {unlockedEndings.length >= 25 && phase === 'PLAYING' && (
        <div className="rounded-xl border border-amber-500/50 bg-amber-950/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-left">
            <Eye className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-200">终极观测奇点已显形</div>
              <div className="text-[11px] text-amber-300/80">
                你已收束 {unlockedEndings.length} 条时间线，获得启动全知观测协议的权限。
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={triggerOmegaEnding}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold whitespace-nowrap cursor-pointer"
          >
            启动终极观测协议
          </button>
        </div>
      )}
    </div>
  );
};
