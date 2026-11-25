import React, { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { adaptCopyForMobile } from '../../utils/mobileAdaptation';

export const ChatApp: React.FC = () => {
  const isMobile = useIsMobile();
  const {
    chatMessages,
    newsChoice,
    chatSequenceStarted,
    system,
    sendCasualChatReply,
  } = useGame();

  const [reply, setReply] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const isLight = system.theme === 'light';
  const mutedText = isLight ? 'text-slate-500' : 'text-slate-400';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || chatSequenceStarted) return;
    sendCasualChatReply(reply.trim());
    setReply('');
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div
        className={`px-4 py-2.5 border-b flex items-center justify-between text-xs font-semibold shrink-0 ${
          isLight
            ? 'bg-emerald-50 border-slate-200 text-emerald-950'
            : 'bg-emerald-950/40 border-slate-800 text-emerald-100'
        }`}
      >
        <span>相亲相爱一家人 (4)</span>
        <span className={`font-normal ${mutedText}`}>
          {newsChoice === 'rescue'
            ? '正在进行紧急撤离联络'
            : newsChoice === 'doom'
              ? '信号连接异常'
              : '家庭群组'}
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {chatMessages.map((msg) => {
          const isPlayer = msg.tone === 'player';
          const isCorrupted = msg.tone === 'corrupted';
          const isUrgent = msg.tone === 'urgent';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isPlayer ? 'items-end' : 'items-start'}`}
            >
              <div className={`text-[11px] mb-1 px-1 ${mutedText}`}>
                {msg.sender} · <span className="font-mono-tabular">{msg.time}</span>
              </div>
              <div
                className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed border ${
                  isPlayer
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : isCorrupted
                      ? 'bg-rose-950/90 text-rose-200 border-rose-700/70'
                      : isUrgent
                        ? 'bg-emerald-950/80 text-emerald-100 border-emerald-700/60'
                        : isLight
                          ? 'bg-white text-slate-900 border-slate-200'
                          : 'bg-slate-800 text-slate-100 border-slate-700'
                }`}
              >
                {adaptCopyForMobile(msg.text, isMobile)}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className={`p-3 border-t flex items-center gap-2 shrink-0 ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/60 border-slate-800'
        }`}
      >
        <input
          type="text"
          value={reply}
          disabled={chatSequenceStarted}
          onChange={(e) => setReply(e.target.value)}
          placeholder={chatSequenceStarted ? '正在接收实时消息...' : '给家人发一条消息报平安...'}
          className={`flex-1 rounded-xl border px-3 py-2 text-xs outline-none ${
            isLight
              ? 'bg-white border-slate-300 text-slate-900'
              : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}
        />
        <button
          type="submit"
          disabled={chatSequenceStarted || !reply.trim()}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>发送</span>
        </button>
      </form>
    </div>
  );
};
