import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Delete,
  Play,
  Radio,
  RotateCcw,
  Send,
  ShieldAlert,
  Square,
  Volume2,
  Waves,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { MORSE_SIGNALS } from '../../data/worldData';
import { soundEngine } from '../../utils/audio';

const CHAR_TO_MORSE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
};

const MORSE_TO_CHAR: Record<string, string> = Object.fromEntries(
  Object.entries(CHAR_TO_MORSE).map(([k, v]) => [v, k])
);

function encodeMorse(text: string): string {
  return text
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      word
        .split('')
        .map((ch) => CHAR_TO_MORSE[ch] ?? '')
        .filter(Boolean)
        .join(' ')
    )
    .join(' / ');
}

function decodeMorse(morse: string): string {
  return morse
    .trim()
    .split('/')
    .map((word) =>
      word
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((sym) => MORSE_TO_CHAR[sym] ?? '?')
        .join('')
    )
    .join(' ')
    .trim();
}

export const MorseApp: React.FC = () => {
  const {
    system,
    privacy,
    isOnline,
    decodedMorseIds,
    submitMorseDecode,
    sendMorseCounterPulse,
    transmitMorseCode,
    openApp,
  } = useGame();

  const [mode, setMode] = useState<'decode' | 'encode'>('decode');
  const [selectedSigId, setSelectedSigId] = useState(MORSE_SIGNALS[0].id);
  const [morseInput, setMorseInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [encodeText, setEncodeText] = useState('');
  const [isPlayingSeq, setIsPlayingSeq] = useState(false);
  const [lampLit, setLampLit] = useState(false);
  const timersRef = useRef<number[]>([]);

  const isLight = system.theme === 'light';
  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-900/80 border-slate-700/80 text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  const activeSig = useMemo(
    () => MORSE_SIGNALS.find((s) => s.id === selectedSigId) ?? MORSE_SIGNALS[0],
    [selectedSigId]
  );

  const liveDecodedFromTap = useMemo(() => decodeMorse(morseInput), [morseInput]);
  const liveEncoded = useMemo(() => encodeMorse(encodeText), [encodeText]);

  const stopSequence = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    setIsPlayingSeq(false);
    setLampLit(false);
  };

  useEffect(() => {
    return () => stopSequence();
  }, []);

  const playMorseSequence = (seq: string) => {
    if (isPlayingSeq) {
      stopSequence();
      return;
    }
    const clean = seq.trim();
    if (!clean) return;
    setIsPlayingSeq(true);
    let offset = 0;

    for (const ch of clean) {
      if (ch === '.') {
        const t1 = window.setTimeout(() => {
          soundEngine.playMorseBeep('dot');
          if (!system.photosensitiveSafe) setLampLit(true);
        }, offset);
        const t2 = window.setTimeout(() => setLampLit(false), offset + 90);
        timersRef.current.push(t1, t2);
        offset += 170;
      } else if (ch === '-') {
        const t1 = window.setTimeout(() => {
          soundEngine.playMorseBeep('dash');
          if (!system.photosensitiveSafe) setLampLit(true);
        }, offset);
        const t2 = window.setTimeout(() => setLampLit(false), offset + 240);
        timersRef.current.push(t1, t2);
        offset += 330;
      } else if (ch === '/') {
        offset += 280;
      } else {
        offset += 150;
      }
    }

    const done = window.setTimeout(() => {
      setIsPlayingSeq(false);
      setLampLit(false);
    }, offset + 60);
    timersRef.current.push(done);
  };

  const appendTap = (symbol: '.' | '-' | ' ' | ' / ') => {
    if (symbol === '.') soundEngine.playMorseBeep('dot');
    else if (symbol === '-') soundEngine.playMorseBeep('dash');
    else soundEngine.playClick();
    setMorseInput((prev) => prev + symbol);
  };

  const hasSafeDecoded = decodedMorseIds.some((id) => id === 'sig_sos' || id === 'sig_night');

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-5 pb-6 space-y-4">
      {/* Header + Signal Lamp */}
      <div className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${cardBg}`}>
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-all ${
              lampLit
                ? 'bg-amber-400 border-amber-300 text-slate-950 shadow-[0_0_18px_rgba(251,191,36,0.8)]'
                : 'bg-sky-500/15 border-sky-500/35 text-sky-400'
            }`}
          >
            <Waves className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold">短波摩斯密码破译器 · CW Decoder</div>
            <div className={`text-[11px] font-mono-tabular ${mutedText}`}>
              点 (.) = 80ms 短音 · 划 (-) = 240ms 长音 · / = 单词间隔
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 p-1 rounded-lg bg-slate-950/50 border border-slate-700/60 shrink-0">
          <button
            type="button"
            onClick={() => setMode('decode')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
              mode === 'decode' ? 'bg-sky-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            破译截获信号
          </button>
          <button
            type="button"
            onClick={() => setMode('encode')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
              mode === 'encode' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            编码发报台
          </button>
        </div>
      </div>

      {mode === 'decode' ? (
        <>
          {/* Intercepted Signal Presets */}
          <div className={`rounded-xl border p-4 space-y-3 ${cardBg}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-sky-400" />
                <span>截获短波信号频道</span>
              </span>
              <span className={`text-[11px] font-mono-tabular ${mutedText}`}>
                已破译：{decodedMorseIds.length} / {MORSE_SIGNALS.length}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {MORSE_SIGNALS.map((sig) => {
                const selected = sig.id === selectedSigId;
                const decoded = decodedMorseIds.includes(sig.id);
                return (
                  <button
                    key={sig.id}
                    type="button"
                    onClick={() => {
                      stopSequence();
                      setSelectedSigId(sig.id);
                      setAnswerInput('');
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                      selected
                        ? sig.dangerous
                          ? 'bg-rose-500/15 border-rose-500/60'
                          : 'bg-sky-500/15 border-sky-500/60'
                        : isLight
                          ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold flex items-center gap-2">
                        <span className="truncate">{sig.title}</span>
                        {decoded && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </div>
                      <div className="text-[11px] font-mono-tabular text-sky-400 mt-1 truncate">
                        {sig.freq} · {sig.morse}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 rounded-xl border border-slate-700/60 bg-slate-950/65 text-slate-100 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] text-slate-400">选中脉冲波形</div>
                  <div className="text-sm font-mono-tabular font-bold tracking-widest text-amber-300 mt-0.5">
                    {activeSig.morse}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => playMorseSequence(activeSig.morse)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                    isPlayingSeq
                      ? 'bg-rose-600 text-white'
                      : 'bg-sky-600 hover:bg-sky-500 text-white'
                  }`}
                >
                  {isPlayingSeq ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlayingSeq ? '停止试听' : '播放音频波形'}</span>
                </button>
              </div>
              <div className="text-[11px] text-slate-400">线索提示：{activeSig.hint}</div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder="输入破译后的英文明文 (如 SOS)"
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono-tabular text-white outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => submitMorseDecode(activeSig.id, answerInput)}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  校验破译
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Tap Telegraph Key & Live Translator */}
          <div className={`rounded-xl border p-4 space-y-3 ${cardBg}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">手动点划试译键台</span>
              <button
                type="button"
                onClick={() => setMorseInput('')}
                className="text-[11px] flex items-center gap-1 text-slate-400 hover:text-sky-400 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>清空</span>
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => appendTap('.')}
                className="py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono-tabular font-bold text-sm cursor-pointer"
              >
                · 点 (.)
              </button>
              <button
                type="button"
                onClick={() => appendTap('-')}
                className="py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono-tabular font-bold text-sm cursor-pointer"
              >
                — 划 (-)
              </button>
              <button
                type="button"
                onClick={() => appendTap(' ')}
                className="py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold cursor-pointer"
              >
                字母间隔
              </button>
              <button
                type="button"
                onClick={() => appendTap(' / ')}
                className="py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold cursor-pointer"
              >
                词隔 (/)
              </button>
              <button
                type="button"
                onClick={() => setMorseInput((p) => p.slice(0, -1))}
                className="py-2.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Delete className="w-3.5 h-3.5" />
                <span>退格</span>
              </button>
            </div>

            <div className="p-3 rounded-lg border border-slate-700/50 bg-slate-950/60 space-y-1.5 font-mono-tabular text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">输入脉冲：</span>
                <button
                  type="button"
                  onClick={() => setAnswerInput(liveDecodedFromTap)}
                  className="text-sky-400 hover:underline text-[11px] cursor-pointer"
                >
                  填入上方校验栏
                </button>
              </div>
              <div className="text-amber-300 min-h-[18px] break-all">{morseInput || '（等待点划输入…）'}</div>
              <div className="text-emerald-400 font-bold">
                实时译文：{liveDecodedFromTap || '—'}
              </div>
            </div>
          </div>

          {/* Emergency Counter-Code Action (#38) */}
          <div className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${cardBg}`}>
            <div className="space-y-1">
              <div className="text-xs font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <span>观察站应急声呐回传链路</span>
              </div>
              <div className={`text-[11px] leading-relaxed ${mutedText}`}>
                条件：破译安全频道 A/B（{hasSafeDecoded ? '已就绪' : '未完成'}）· 联网（{isOnline ? '正常' : '断开'}）· DNS 安全加密（{privacy.dnsEnabled ? '已开' : '未开'}）
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {!privacy.dnsEnabled && (
                <button
                  type="button"
                  onClick={() => openApp('settings')}
                  className="px-3 py-2 rounded-lg border border-slate-600 text-xs cursor-pointer hover:bg-white/5"
                >
                  去设置开 DNS
                </button>
              )}
              <button
                type="button"
                onClick={sendMorseCounterPulse}
                className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                  hasSafeDecoded && isOnline && privacy.dnsEnabled
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                回传声呐反制码
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Encoder & Taboo Transmitter Mode (#39) */
        <div className={`rounded-xl border p-4 space-y-3.5 ${cardBg}`}>
          <div className="text-xs font-bold">摩斯电报编码与发报台</div>
          <p className={`text-xs leading-relaxed ${mutedText}`}>
            输入英文字母或数字可即时生成标准摩斯电码音频并对外广播。注意：部分未知来源的短语可能在深夜引发不可预测的无线电回响……
          </p>

          <input
            type="text"
            value={encodeText}
            onChange={(e) => setEncodeText(e.target.value)}
            placeholder="输入英文或数字（如 HELLO / SOS / I SEE YOU）"
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono-tabular outline-none ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
            }`}
          />

          <div className="p-3 rounded-xl bg-slate-950/75 border border-slate-800 space-y-1.5">
            <div className="text-[11px] text-slate-400">编码波形输出：</div>
            <div className="font-mono-tabular text-sm text-amber-300 break-all min-h-[24px]">
              {liveEncoded || '—'}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!liveEncoded}
              onClick={() => playMorseSequence(liveEncoded)}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isPlayingSeq ? '停止蜂鸣试听' : '蜂鸣试听编码'}</span>
            </button>
            <button
              type="button"
              onClick={() => transmitMorseCode(encodeText)}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>向空气频段发报</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Reference Cheat Sheet */}
      <div className={`rounded-xl border p-3.5 space-y-2 ${cardBg}`}>
        <div className="text-xs font-bold">国际标准摩斯电码速查卡</div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 text-[11px] font-mono-tabular">
          {Object.entries(CHAR_TO_MORSE).map(([ch, code]) => (
            <div
              key={ch}
              className={`px-2 py-1 rounded border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800'
              }`}
            >
              <span className="font-bold text-sky-400">{ch}</span>
              <span className={mutedText}>{code}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
