import React from 'react';
import { AlertTriangle, Newspaper } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { NORMAL_NEWS } from '../../data/worldData';

export const NewsApp: React.FC = () => {
  const { globalDoomTriggered, newsChoice, system, chooseNewsBranch, openApp } = useGame();

  const isLight = system.theme === 'light';
  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-800/65 border-slate-700/80 text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-5 pb-6 space-y-4">
      {globalDoomTriggered && (
        <div className="rounded-2xl border border-rose-500/60 bg-rose-950/60 p-5 space-y-3 text-slate-100">
          <div className="flex items-center gap-2.5 text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="text-base font-bold">突发紧急快报：全城多社区出现身份替换事件</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-200">
            应急通信中心刚刚发出最高级别警报：未知实体正在通过宽带与家用路由器向居民住宅渗透！
            请所有市民立即切断家中电源与网络，提醒独居家人迅速撤离至户外安全点。
          </p>
          <p className="text-xs text-amber-300">
            你的父母和妹妹此刻正独自在家。你打算如何应对？
          </p>

          {newsChoice === 'none' ? (
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => chooseNewsBranch('rescue')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
              >
                立即在群里提醒家人撤离
              </button>
              <button
                type="button"
                onClick={() => chooseNewsBranch('doom')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer"
              >
                别管了，继续专心工作
              </button>
            </div>
          ) : (
            <div className="pt-1 flex items-center justify-between gap-3">
              <span className="text-xs text-amber-200">
                {newsChoice === 'rescue'
                  ? '已选择提醒家人，请前往「家人群聊」查看动态'
                  : '已选择无视警报继续工作，请查看「家人群聊」'}
              </span>
              <button
                type="button"
                onClick={() => openApp('chat')}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                打开家人群聊
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs font-semibold opacity-80">
        <Newspaper className="w-4 h-4 text-amber-400" />
        <span>晚间城市资讯</span>
      </div>

      <div className="space-y-3">
        {NORMAL_NEWS.map((item) => (
          <article key={item.id} className={`rounded-xl border p-4 space-y-1.5 ${cardBg}`}>
            <div className="flex items-center justify-between gap-2 text-[11px] font-mono-tabular">
              <span className="text-amber-400 font-medium">{item.category}</span>
              <span className={mutedText}>{item.time}</span>
            </div>
            <h4 className="text-sm font-bold">{item.title}</h4>
            <p className={`text-xs leading-relaxed ${mutedText}`}>{item.content}</p>
          </article>
        ))}
      </div>
    </div>
  );
};
