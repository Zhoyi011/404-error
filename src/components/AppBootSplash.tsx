import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { WindowInstance } from '../types/game';

interface AppBootSplashProps {
  instance: WindowInstance;
  icon: React.ReactNode;
  isMobile?: boolean;
  children: React.ReactNode;
}

export const AppBootSplash: React.FC<AppBootSplashProps> = ({
  instance,
  icon,
  isMobile = false,
  children,
}) => {
  const { bootedInstanceIds, markInstanceBooted, system } = useGame();
  const isBooted = bootedInstanceIds.includes(instance.instanceId);
  const [progress, setProgress] = useState(22);

  useEffect(() => {
    if (isBooted) return;
    setProgress(24);
    const midDelay = system.animations ? 180 : 60;
    const endDelay = system.animations ? 440 : 120;

    const t1 = window.setTimeout(() => setProgress(78), midDelay);
    const t2 = window.setTimeout(() => {
      setProgress(100);
      markInstanceBooted(instance.instanceId);
    }, endDelay);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [instance.instanceId, isBooted, system.animations, markInstanceBooted]);

  if (isBooted) {
    return <>{children}</>;
  }

  const isLight = system.theme === 'light';

  return (
    <div
      className={`h-full w-full flex flex-col items-center justify-center p-6 select-none ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950/70 text-slate-100'
      }`}
    >
      <div className="w-12 h-12 rounded-2xl border border-sky-500/30 bg-sky-500/10 flex items-center justify-center mb-3 shadow-sm">
        {icon}
      </div>
      <div className="text-sm font-semibold mb-1">{instance.title}</div>
      <div
        className={`text-[11px] font-mono-tabular mb-4 ${
          isLight ? 'text-slate-500' : 'text-slate-400'
        }`}
      >
        {isMobile ? '正在启动沙箱进程...' : '正在初始化本地运行环境...'}
      </div>
      <div
        className={`w-44 h-1.5 rounded-full overflow-hidden ${
          isLight ? 'bg-slate-200' : 'bg-slate-800'
        }`}
      >
        <div
          className="h-full bg-sky-500 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
