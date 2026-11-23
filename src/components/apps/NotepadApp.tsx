import React, { useState } from 'react';
import { Coffee, Moon, Sparkles, Wind } from 'lucide-react';
import { useGame } from '../../context/GameContext';

export const NotepadApp: React.FC = () => {
  const {
    step,
    jobApplied,
    sanity,
    notepadEntries,
    predictionText,
    coffeeCharges,
    breatheCharges,
    system,
    inscribePrediction,
    addCustomNote,
    restTonight,
    drinkCoffee,
    deepBreathe,
    openApp,
  } = useGame();

  const [predInput, setPredInput] = useState(predictionText);
  const [noteInput, setNoteInput] = useState('');

  const isLight = system.theme === 'light';
  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-800/60 border-slate-700/80 text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  const handleInscribe = (e: React.FormEvent) => {
    e.preventDefault();
    inscribePrediction(predInput);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    addCustomNote(noteInput);
    setNoteInput('');
  };

  const canRest = step === 0 && !jobApplied && sanity === 100;

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-5 pb-6 space-y-5">
      {/* Recovery & Night Choice */}
      <div className={`rounded-xl border p-4 space-y-3 ${cardBg}`}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold">夜间状态调节</h3>
          <span className={`text-xs ${mutedText}`}>夜间专注与作息记录</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            disabled={coffeeCharges <= 0}
            onClick={drinkCoffee}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              coffeeCharges > 0
                ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>喝热黑咖啡 (+20% · 剩 {coffeeCharges} 次)</span>
          </button>

          <button
            type="button"
            disabled={breatheCharges <= 0}
            onClick={deepBreathe}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              breatheCharges > 0
                ? 'bg-teal-600 hover:bg-teal-500 text-white cursor-pointer'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Wind className="w-4 h-4" />
            <span>深呼吸稳态 (+10% · 剩 {breatheCharges} 次)</span>
          </button>

          {canRest && (
            <button
              type="button"
              onClick={restTonight}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
            >
              <Moon className="w-4 h-4" />
              <span>放弃熬夜求职，关灯睡觉</span>
            </button>
          )}
        </div>
      </div>

      {/* Atmospheric Thought / Prophecy */}
      <form onSubmit={handleInscribe} className={`rounded-xl border p-4 space-y-3 ${cardBg}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-violet-400">
            <Sparkles className="w-4 h-4" />
            <span>深夜随笔 / 预感铭刻</span>
          </div>
          {predictionText && (
            <span className="text-xs text-emerald-400 font-medium">已封存记录</span>
          )}
        </div>
        <p className={`text-xs leading-relaxed ${mutedText}`}>
          有些念头在写下的那一刻起，就仿佛不再只是单纯的文字。
        </p>
        <textarea
          value={predInput}
          onChange={(e) => setPredInput(e.target.value)}
          placeholder="写下此刻令你在意或不安的预感..."
          rows={2}
          className={`w-full rounded-lg border p-2.5 text-xs outline-none resize-none ${
            isLight
              ? 'bg-slate-50 border-slate-300 text-slate-900'
              : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
          >
            封存预感
          </button>
          <button
            type="button"
            onClick={() => openApp('browser', { forceNew: true, initialQuery: 'wiki' })}
            className={`px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer ${cardBg}`}
          >
            打开浏览器查阅 Wiki
          </button>
        </div>
      </form>

      {/* Investigation Log */}
      <div className={`rounded-xl border p-4 space-y-3 ${cardBg}`}>
        <h3 className="text-sm font-bold">日志与备忘记录</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {notepadEntries.map((entry) => (
            <div
              key={entry.id}
              className={`rounded-lg p-2.5 text-xs leading-relaxed border ${
                entry.kind === 'warning'
                  ? 'border-rose-500/30 bg-rose-500/10'
                  : entry.kind === 'clue'
                    ? 'border-amber-500/30 bg-amber-500/10'
                    : isLight
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-slate-700/70 bg-slate-900/60'
              }`}
            >
              <span className="font-mono-tabular opacity-60 mr-2">[{entry.time}]</span>
              <span>{entry.text}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddNote} className="flex gap-2 pt-1">
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="追加备忘笔记..."
            className={`flex-1 rounded-lg border px-3 py-1.5 text-xs outline-none ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900'
                : 'bg-slate-900 border-slate-700 text-slate-100'
            }`}
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium cursor-pointer"
          >
            记录
          </button>
        </form>
      </div>
    </div>
  );
};
