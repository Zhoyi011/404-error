import React, { useMemo, useState } from 'react';
import { ChevronLeft, KeyRound, MailOpen, ShieldAlert, Video } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { EMAIL_TEMPLATES } from '../../data/worldData';
import { useIsMobile } from '../../hooks/useIsMobile';

export const EmailApp: React.FC = () => {
  const isMobile = useIsMobile();
  const {
    step,
    emailWarningReceived,
    readEmailIds,
    goodEndingsCount,
    system,
    markEmailRead,
    joinVideoInterview,
    decryptTruthDossier,
  } = useGame();

  const availableEmails = useMemo(() => {
    return EMAIL_TEMPLATES.filter((em) => {
      if (em.requiresWarning && !emailWarningReceived) return false;
      if (em.minStep !== undefined && step < em.minStep) return false;
      return true;
    }).reverse();
  }, [emailWarningReceived, step]);

  const [selectedId, setSelectedId] = useState<string>(() => availableEmails[0]?.id || 'sys_archive');
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const selectedEmail = availableEmails.find((e) => e.id === selectedId) || availableEmails[0];

  const isLight = system.theme === 'light';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  const allRead = availableEmails.every((e) => readEmailIds.includes(e.id));
  const canDecrypt = allRead && goodEndingsCount >= 3;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    markEmailRead(id);
    if (isMobile) setMobileShowDetail(true);
  };

  const showListPane = !isMobile || !mobileShowDetail;
  const showDetailPane = !isMobile || mobileShowDetail;

  return (
    <div className="flex flex-col sm:flex-row h-full min-h-0 overflow-hidden">
      {/* Left / Mobile Inbox List */}
      {showListPane && (
        <div
          className={`${isMobile ? 'w-full flex-1 min-h-0' : 'sm:w-64 sm:border-r'} p-3 pb-6 space-y-2 overflow-y-auto shrink-0 ${
            isLight ? 'border-slate-200 bg-slate-50/70' : 'border-slate-800 bg-slate-950/35'
          }`}
        >
          <div className={`text-xs font-semibold px-1 mb-2 ${mutedText}`}>
            收件箱 · {availableEmails.length} 封邮件
          </div>

          {availableEmails.map((em) => {
            const isRead = readEmailIds.includes(em.id);
            const isSelected = !isMobile && selectedEmail?.id === em.id;
            return (
              <button
                key={em.id}
                type="button"
                onClick={() => handleSelect(em.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-sky-500/60 bg-sky-500/12'
                    : isLight
                      ? 'border-slate-200 bg-white hover:bg-slate-50'
                      : 'border-slate-800 bg-slate-900/70 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-mono-tabular opacity-70">{em.timestamp}</span>
                  <span className={`text-[11px] font-medium ${isRead ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isRead ? '已读' : '未读'}
                  </span>
                </div>
                <div className="text-xs font-semibold line-clamp-2 leading-snug">{em.title}</div>
              </button>
            );
          })}

          {/* Encrypted Truth Dossier Card */}
          <div
            className={`mt-4 rounded-xl border p-3.5 space-y-2 ${
              isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900/80'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <KeyRound className="w-3.5 h-3.5" />
              <span>加密归档：PROJECT_DOPPEL</span>
            </div>
            <div className={`text-[11px] space-y-0.5 font-mono-tabular ${mutedText}`}>
              <div>信任密钥：{Math.min(3, goodEndingsCount)} / 3</div>
              <div>收件确认：{allRead ? '已全部查收' : '尚有未读邮件'}</div>
            </div>
            <button
              type="button"
              onClick={decryptTruthDossier}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                canDecrypt
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : isLight
                    ? 'bg-slate-200 text-slate-600'
                    : 'bg-slate-800 text-slate-400'
              }`}
            >
              {canDecrypt ? '解密归档文件' : '密钥不足'}
            </button>
          </div>
        </div>
      )}

      {/* Right / Mobile Detail Pane */}
      {showDetailPane && (
        <div className="flex-1 min-h-0 p-4 sm:p-5 pb-6 overflow-y-auto">
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileShowDetail(false)}
              className="mb-3 flex items-center gap-1 text-sky-500 text-sm font-medium cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>收件箱</span>
            </button>
          )}

          {selectedEmail ? (
            <article className="space-y-4">
              <div className={`pb-3 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  {selectedEmail.severity === 'critical' || selectedEmail.severity === 'warning' ? (
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <MailOpen className="w-4 h-4 text-sky-400 shrink-0" />
                  )}
                  <h3 className="text-base font-bold">{selectedEmail.title}</h3>
                </div>
                <div className={`text-xs font-mono-tabular ${mutedText}`}>
                  发件人：{selectedEmail.sender} · 时间：{selectedEmail.timestamp}
                </div>
              </div>

              <div className="space-y-3 text-sm leading-relaxed">
                {selectedEmail.body.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                {selectedEmail.actionType === 'video_interview' && (
                  <button
                    type="button"
                    onClick={joinVideoInterview}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                    <span>接入远程面试视频</span>
                  </button>
                )}

                {!readEmailIds.includes(selectedEmail.id) && (
                  <button
                    type="button"
                    onClick={() => markEmailRead(selectedEmail.id)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    标记为已读
                  </button>
                )}
              </div>
            </article>
          ) : null}
        </div>
      )}
    </div>
  );
};
