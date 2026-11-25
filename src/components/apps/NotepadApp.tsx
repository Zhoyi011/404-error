import React, { useEffect, useState } from 'react';
import { Briefcase, CheckCircle2, Coffee, Moon, Sparkles, Wind } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useIsMobile } from '../../hooks/useIsMobile';

const DESKTOP_PROPHECY_PRESETS = [
  '今晚会有伪人试图入侵我的桌面',
  '进程 0x000000 即将在深夜入侵系统',
];

const MOBILE_PROPHECY_PRESETS = [
  '今晚会有伪人试图入侵我的手机',
  '进程 0x000000 即将在深夜入侵系统',
];

export const NotepadApp: React.FC = () => {
  const isMobile = useIsMobile();
  const prophecyPresets = isMobile ? MOBILE_PROPHECY_PRESETS : DESKTOP_PROPHECY_PRESETS;
  const {
    phase,
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

  useEffect(() => {
    setPredInput(predictionText);
  }, [predictionText]);

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
  const alreadyInvaded = step >= 2 || phase === 'INVASION';
  const prophecyResonating = Boolean(
    predictionText && /入侵|伪人|0x000000/.test(predictionText)
  );

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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-violet-400">
            <Sparkles className="w-4 h-4" />
            <span>深夜随笔 / 预感铭刻</span>
          </div>
          {alreadyInvaded ? (
            <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium">
              入侵已爆发 · 需在入侵前封存
            </span>
          ) : prophecyResonating ? (
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              因果共鸣已激活 · 等待触发入侵
            </span>
          ) : predictionText ? (
            <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-medium">
              已存随笔（未含「入侵 / 伪人」）
            </span>
          ) : null}
        </div>
        <p className={`text-xs leading-relaxed ${mutedText}`}>
          有些念头在危机降临前写下，就会成为撬动时间线的支点。在文本中提及「<span className="text-violet-300 font-semibold">入侵</span>」或「<span className="text-violet-300 font-semibold">伪人</span>」并封存，随后再去{isMobile ? ' Safary ' : '浏览器'}应聘并「深入对方后台服务器」，预言便会瞬间应验。
        </p>

        {!alreadyInvaded && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[11px] ${mutedText}`}>快捷写入预言：</span>
            {prophecyPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setPredInput(preset)}
                className="px-2 py-1 rounded-md text-[11px] border border-violet-500/35 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 transition cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        )}

        <textarea
          value={predInput}
          onChange={(e) => setPredInput(e.target.value)}
          placeholder={
            isMobile
              ? '写下包含「入侵」或「伪人」的预感（如：今晚会有伪人试图入侵我的手机）...'
              : '写下包含「入侵」或「伪人」的预感（如：今晚会有伪人试图入侵我的桌面）...'
          }
          rows={2}
          className={`w-full rounded-lg border p-2.5 text-xs outline-none resize-none ${
            isLight
              ? 'bg-slate-50 border-slate-300 text-slate-900'
              : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={alreadyInvaded}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              alreadyInvaded
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-500 text-white cursor-pointer'
            }`}
          >
            {prophecyResonating ? '更新预感内容' : '封存预感'}
          </button>

          {prophecyResonating && !alreadyInvaded && (
            <button
              type="button"
              onClick={() =>
                openApp('browser', { forceNew: true, initialQuery: '高薪工作应聘网站' })
              }
              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>前往应聘并深入后台</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => openApp('browser', { forceNew: true, initialQuery: 'wiki' })}
            className={`px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer ${cardBg}`}
          >
            {isMobile ? '打开 Safary 查阅 Wiki' : '打开浏览器查阅 Wiki'}
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
            placeholder="追加日常备忘笔记..."
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
