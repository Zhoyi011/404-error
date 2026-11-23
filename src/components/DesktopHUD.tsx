import React from 'react';
import { Brain, Compass, ShieldCheck } from 'lucide-react';
import { useGame } from '../context/GameContext';

export const DesktopHUD: React.FC = () => {
  const { sanity, questText, privacy, system } = useGame();

  const isLight = system.theme === 'light';
  const cardSurface = isLight
    ? 'bg-white/78 border-slate-300/80 text-slate-900 shadow-lg'
    : system.theme === 'horror'
      ? 'bg-[#1d0b0c]/82 border-red-900/50 text-red-50 shadow-2xl'
      : 'bg-slate-900/72 border-white/12 text-slate-100 shadow-2xl';

  const sanityLabel =
    sanity >= 80 ? '稳定' : sanity >= 50 ? '动摇' : sanity >= 30 ? '紧绷' : '危急';
  const sanityBarColor =
    sanity >= 70 ? 'bg-emerald-500' : sanity >= 40 ? 'bg-amber-500' : 'bg-red-500';

  const activeShields = [
    privacy.firewallEnabled,
    privacy.privacyEnabled,
    privacy.antivirusEnabled,
    privacy.dnsEnabled,
  ].filter(Boolean).length;

  return (
    <aside aria-label="桌面状态小组件" className="fixed top-5 right-5 z-[8] w-72">
      <div className={`rounded-2xl border p-4 backdrop-blur-2xl space-y-3.5 ${cardSurface}`}>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              <Brain className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>精神稳态</span>
            </span>
            <span className="text-xs font-mono-tabular font-semibold">
              {sanity}% · {sanityLabel}
            </span>
          </div>
          <div className={`h-1.5 w-full rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
            <div
              className={`h-full transition-all duration-300 ${sanityBarColor}`}
              style={{ width: `${sanity}%` }}
            />
          </div>
        </div>

        <div className={`pt-3 border-t flex items-center justify-between text-xs ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
          <span className="flex items-center gap-1.5 opacity-80">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>安全组件</span>
          </span>
          <span className="font-mono-tabular font-semibold">{activeShields} / 4</span>
        </div>

        <div className={`pt-3 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold opacity-75 mb-1">
            <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>当前备忘</span>
          </div>
          <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            {questText}
          </p>
        </div>
      </div>
    </aside>
  );
};
