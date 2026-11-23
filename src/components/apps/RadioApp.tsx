import React, { useEffect } from 'react';
import {
  CheckCircle2,
  Coffee,
  Minus,
  PackageCheck,
  Pause,
  Play,
  Plus,
  Radio,
  RadioTower,
  Skull,
  Volume2,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { soundEngine } from '../../utils/audio';

interface StationMeta {
  freq: number;
  code: 'rain' | 'news' | 'numbers' | 'taboo' | 'static';
  title: string;
  subtitle: string;
  transcript: string;
}

function resolveStation(freq: number): StationMeta {
  if (Math.abs(freq - 91.4) <= 0.25) {
    return {
      freq: 91.4,
      code: 'rain',
      title: '91.4 MHz · 深夜雨声 Lo-Fi',
      subtitle: '适合写代码或平复紧张神经的白噪音电台',
      transcript: '细密的冬雨敲打着旧式窗檐，温暖的和弦伴着咖啡香让人暂时忘却门外的迷雾。',
    };
  }
  if (Math.abs(freq - 96.8) <= 0.25) {
    return {
      freq: 96.8,
      code: 'news',
      title: '96.8 MHz · 城市夜间应急波段',
      subtitle: '民防应急广播校准频率 #1',
      transcript:
        '【应急插播】今晚全市主干道出现大雾异常，若收到陌生高薪视频复试邀请，请立即配合暗号波段 104.2 MHz 核验信号源。',
    };
  }
  if (Math.abs(freq - 104.2) <= 0.25) {
    return {
      freq: 104.2,
      code: 'numbers',
      title: '104.2 MHz · 神秘数字电台',
      subtitle: '民防应急广播校准频率 #2',
      transcript:
        '滴—— 04 - 19 - 00 - 00 —— 已截获加密 DNS 对频校验码。集齐民间观测线索并开启 DNS 加密，即可启动全城应急广播发射台。',
    };
  }
  if (Math.abs(freq - 107.9) <= 0.25) {
    return {
      freq: 107.9,
      code: 'taboo',
      title: '107.9 MHz · 未注册禁忌残响',
      subtitle: '高危次声波频段 · 请勿在精神脆弱且无隐私防护时共振收听',
      transcript:
        '嘶嘶……“把窗户打开……你打字的节奏和我一模一样……把耳朵贴近扬声器，让我替你呼吸……”',
    };
  }
  return {
    freq,
    code: 'static',
    title: `${freq.toFixed(1)} MHz · 空白噪波`,
    subtitle: '只有微弱的电流沙沙声，试着调往 91.4 / 96.8 / 104.2 / 107.9 MHz',
    transcript: '沙沙……沙沙……深夜空气中漂浮着散乱的无线电底噪。',
  };
}

export const RadioApp: React.FC = () => {
  const isMobile = useIsMobile();
  const {
    step,
    sanity,
    jobApplied,
    privacy,
    discoveredLore,
    installedApps,
    openedStoreApps,
    radioFreq,
    radioPlaying,
    radioUnlockedFreqs,
    radioRainHealed,
    system,
    tuneRadioFreq,
    toggleRadioPlay,
    healWithRadioRain,
    triggerRadioAssimilation,
    triggerEmergencyBroadcast,
    triggerStoreGeekNight,
  } = useGame();

  // Ensure audio stream stops if component unmounts (e.g. mobile app switch)
  useEffect(() => {
    return () => {
      soundEngine.stopRadioChannel();
      toggleRadioPlay(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLight = system.theme === 'light';
  const surfaceCard = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-800/65 border-slate-700/80 text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  const station = resolveStation(radioFreq);
  const has968 = radioUnlockedFreqs.includes('96.8');
  const has1042 = radioUnlockedFreqs.includes('104.2');
  const canBroadcast =
    has968 && has1042 && discoveredLore.length >= 3 && privacy.dnsEnabled;
  const canGeekNight =
    step === 0 && !jobApplied && installedApps.length === 4 && openedStoreApps.length === 4;

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-5 pb-6 space-y-4">
      {/* Radio Tuner Head Unit */}
      <div
        className={`rounded-2xl border p-5 space-y-4 ${
          station.code === 'taboo'
            ? 'border-rose-500/50 bg-rose-950/30 text-slate-100'
            : surfaceCard
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Radio className="w-4 h-4 text-amber-400" />
            <span>{isMobile ? '深夜广播 · FM Tuner' : '午夜电波 FM · 短波调频'}</span>
          </div>
          <span className="text-[11px] font-mono-tabular text-sky-400 flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5" />
            <span>{radioPlaying ? '正在收听' : '待机静音'}</span>
          </span>
        </div>

        {/* Big Frequency Readout + Play Button */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-3xl sm:text-4xl font-black font-mono-tabular tracking-tight">
              {radioFreq.toFixed(1)}{' '}
              <span className="text-base font-semibold text-amber-400">MHz</span>
            </div>
            <div className="text-xs font-bold mt-1">{station.title}</div>
          </div>

          <button
            type="button"
            onClick={() => toggleRadioPlay()}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-colors cursor-pointer shrink-0 ${
              radioPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-sky-600 hover:bg-sky-500 text-white'
            }`}
            title={radioPlaying ? '暂停收音机' : '开启电波收听'}
          >
            {radioPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
          </button>
        </div>

        {/* Interactive Slider + Fine Stepping */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => tuneRadioFreq(radioFreq - 0.1)}
              className="p-1.5 rounded-lg border border-slate-600/60 hover:bg-slate-700/40 cursor-pointer"
              aria-label="频率减 0.1"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min={88.0}
              max={108.0}
              step={0.1}
              value={radioFreq}
              onChange={(e) => tuneRadioFreq(Number(e.target.value))}
              className="flex-1 accent-amber-400 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => tuneRadioFreq(radioFreq + 0.1)}
              className="p-1.5 rounded-lg border border-slate-600/60 hover:bg-slate-700/40 cursor-pointer"
              aria-label="频率加 0.1"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Preset Channel Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { freq: 91.4, label: '91.4 雨声' },
              { freq: 96.8, label: '96.8 应急' },
              { freq: 104.2, label: '104.2 数字' },
              { freq: 107.9, label: '107.9 禁忌' },
            ].map((preset) => {
              const active = Math.abs(radioFreq - preset.freq) <= 0.25;
              return (
                <button
                  key={preset.freq}
                  type="button"
                  onClick={() => tuneRadioFreq(preset.freq)}
                  className={`py-1.5 px-2.5 rounded-lg border text-xs font-mono-tabular font-semibold cursor-pointer transition-colors ${
                    active
                      ? preset.freq === 107.9
                        ? 'bg-rose-600 border-rose-400 text-white'
                        : 'bg-amber-500 border-amber-400 text-slate-950'
                      : isLight
                        ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                        : 'bg-slate-900/70 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Station Transcript & Channel Actions */}
      <div className={`rounded-xl border p-4 space-y-3 ${surfaceCard}`}>
        <div className={`text-xs ${mutedText}`}>{station.subtitle}</div>
        <p className="text-xs leading-relaxed">{station.transcript}</p>

        {station.code === 'rain' && (
          <div className="pt-2 border-t border-slate-700/40 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={healWithRadioRain}
              disabled={radioRainHealed}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 ${
                radioRainHealed
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>{radioRainHealed ? '已听过雨声疗愈' : '静听雨声舒缓 (+8% 理智)'}</span>
            </button>

            <button
              type="button"
              onClick={triggerStoreGeekNight}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                canGeekNight
                  ? 'bg-sky-600 hover:bg-sky-500 text-white'
                  : isLight
                    ? 'bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200'
                    : 'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>伴着雨声写代码度过今晚 (#36)</span>
            </button>
          </div>
        )}

        {station.code === 'taboo' && (
          <div className="pt-2 border-t border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-[11px] text-rose-300 font-mono-tabular">
              当前理智 {sanity}% · 隐私保护：{privacy.privacyEnabled ? '已屏蔽' : '未开启'}
            </div>
            <button
              type="button"
              onClick={triggerRadioAssimilation}
              className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Skull className="w-3.5 h-3.5" />
              <span>深度共振收听 (#34)</span>
            </button>
          </div>
        )}
      </div>

      {/* Civil Defense Emergency Broadcast Station (#35) */}
      <div className={`rounded-xl border p-4 space-y-3 ${surfaceCard}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-bold flex items-center gap-2">
            <RadioTower className="w-4 h-4 text-sky-400" />
            <span>全城民防应急广播发射台 (#35)</span>
          </div>
          <span className="text-[11px] font-mono-tabular text-sky-400">
            {[has968, has1042, discoveredLore.length >= 3, privacy.dnsEnabled].filter(Boolean).length}/4 就绪
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-tabular">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className={`w-3.5 h-3.5 ${has968 ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>96.8 MHz 应急波段</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className={`w-3.5 h-3.5 ${has1042 ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>104.2 MHz 数字校验</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2
              className={`w-3.5 h-3.5 ${discoveredLore.length >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}
            />
            <span>情报收集 ({discoveredLore.length}/3)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2
              className={`w-3.5 h-3.5 ${privacy.dnsEnabled ? 'text-emerald-400' : 'text-slate-500'}`}
            />
            <span>DNS 加密通道</span>
          </div>
        </div>

        <button
          type="button"
          onClick={triggerEmergencyBroadcast}
          className={`w-full py-2 px-4 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
            canBroadcast
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : isLight
                ? 'bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
        >
          接管民防频段 · 发送全城撤离广播 (#35)
        </button>
      </div>
    </div>
  );
};
