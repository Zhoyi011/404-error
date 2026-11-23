import React, { useRef } from 'react';
import { motion } from 'motion/react';
import {
  CopyPlus,
  Maximize2,
  Minimize2,
  Minus,
  PanelLeft,
  PanelRight,
  RotateCcw,
  X,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { WindowInstance } from '../types/game';
import { AppBootSplash } from './AppBootSplash';

interface DesktopWindowProps {
  instance: WindowInstance;
  icon: React.ReactNode;
  children: React.ReactNode;
}

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export const DesktopWindow: React.FC<DesktopWindowProps> = ({ instance, icon, children }) => {
  const {
    focusedInstanceId,
    system,
    focusInstance,
    closeInstance,
    minimizeInstance,
    toggleMaximizeInstance,
    updateInstanceRect,
    resetInstanceRect,
    snapInstance,
    openApp,
  } = useGame();

  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  if (instance.isMinimized) return null;

  const isFocused = focusedInstanceId === instance.instanceId;
  const isLight = system.theme === 'light';
  const isHorror = system.theme === 'horror';

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    focusInstance(instance.instanceId);
    if (instance.isMaximized) return;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: instance.rect.x,
      origY: instance.rect.y,
    };

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      const maxX = Math.max(40, window.innerWidth - 160);
      const maxY = Math.max(40, window.innerHeight - 96);
      updateInstanceRect(instance.instanceId, {
        ...instance.rect,
        x: Math.max(0, Math.min(maxX, dragRef.current.origX + dx)),
        y: Math.max(0, Math.min(maxY, dragRef.current.origY + dy)),
      });
    };

    const onMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const startResize = (dir: ResizeDir) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    focusInstance(instance.instanceId);
    if (instance.isMaximized) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const orig = { ...instance.rect };
    const minW = 340;
    const minH = 280;

    const onMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let { x, y, width, height } = orig;

      if (dir.includes('e')) {
        width = Math.max(minW, Math.min(window.innerWidth - orig.x - 8, orig.width + dx));
      }
      if (dir.includes('s')) {
        height = Math.max(minH, Math.min(window.innerHeight - orig.y - 54, orig.height + dy));
      }
      if (dir.includes('w')) {
        const nextW = Math.max(minW, orig.width - dx);
        const appliedDx = orig.width - nextW;
        const nextX = orig.x + appliedDx;
        if (nextX >= 4) {
          x = nextX;
          width = nextW;
        }
      }
      if (dir.includes('n')) {
        const nextH = Math.max(minH, orig.height - dy);
        const appliedDy = orig.height - nextH;
        const nextY = orig.y + appliedDy;
        if (nextY >= 4) {
          y = nextY;
          height = nextH;
        }
      }

      updateInstanceRect(instance.instanceId, { x, y, width, height });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const frameStyle: React.CSSProperties = instance.isMaximized
    ? {
        left: 8,
        top: 8,
        width: 'calc(100vw - 16px)',
        height: 'calc(100vh - 64px)',
        zIndex: instance.zIndex,
      }
    : {
        left: instance.rect.x,
        top: instance.rect.y,
        width: instance.rect.width,
        height: instance.rect.height,
        zIndex: instance.zIndex,
      };

  const shellClasses = isLight
    ? 'bg-slate-50/95 text-slate-900 border-slate-300/90 shadow-2xl'
    : isHorror
      ? 'bg-[#180b0c]/95 text-red-50 border-red-900/60 shadow-2xl'
      : 'bg-slate-900/92 text-slate-100 border-slate-700/80 shadow-2xl';

  const headerClasses = isLight
    ? 'bg-slate-200/85 border-b border-slate-300 text-slate-800'
    : isHorror
      ? 'bg-[#2a1012]/90 border-b border-red-900/50 text-red-100'
      : 'bg-slate-800/85 border-b border-slate-700/70 text-slate-100';

  const animDuration = system.animations ? 0.18 : 0;

  return (
    <motion.section
      aria-label={instance.title}
      initial={system.animations ? { opacity: 0, scale: 0.94, y: 12 } : false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={system.animations ? { opacity: 0, scale: 0.94, y: 10 } : undefined}
      transition={{ duration: animDuration, ease: [0.16, 1, 0.3, 1] }}
      onMouseDown={() => focusInstance(instance.instanceId)}
      style={frameStyle}
      className={`fixed flex flex-col rounded-xl border backdrop-blur-xl overflow-hidden transition-shadow duration-150 ${shellClasses} ${
        isFocused ? 'ring-1 ring-amber-500/45' : 'opacity-95'
      } max-md:!left-2 max-md:!top-2 max-md:!w-[calc(100vw-16px)] max-md:!h-[calc(100vh-72px)]`}
    >
      {/* Titlebar */}
      <header
        onMouseDown={handleHeaderMouseDown}
        onDoubleClick={() => toggleMaximizeInstance(instance.instanceId)}
        className={`h-10 px-3 flex items-center justify-between gap-2 shrink-0 cursor-move select-none ${headerClasses}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 opacity-90">{icon}</span>
          <h2 className="text-[13px] font-semibold truncate">{instance.title}</h2>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => openApp(instance.appId, { forceNew: true })}
            title="多开新窗口"
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-black/15 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <CopyPlus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => snapInstance(instance.instanceId, 'left')}
            title="左半屏分栏"
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-black/15 dark:hover:bg-white/10 transition-colors cursor-pointer max-md:hidden"
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => snapInstance(instance.instanceId, 'right')}
            title="右半屏分栏"
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-black/15 dark:hover:bg-white/10 transition-colors cursor-pointer max-md:hidden"
          >
            <PanelRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => minimizeInstance(instance.instanceId)}
            title="最小化"
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-black/15 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => toggleMaximizeInstance(instance.instanceId)}
            title={instance.isMaximized ? '还原窗口' : '最大化'}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-black/15 dark:hover:bg-white/10 transition-colors cursor-pointer max-md:hidden"
          >
            {instance.isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => resetInstanceRect(instance.instanceId)}
            title="重置位置与大小"
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-black/15 dark:hover:bg-white/10 transition-colors cursor-pointer max-md:hidden"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => closeInstance(instance.instanceId)}
            title="关闭窗口"
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden select-text">
        <AppBootSplash instance={instance} icon={icon}>
          {children}
        </AppBootSplash>
      </div>

      {/* 8-Direction Resize Handles (Desktop) */}
      {!instance.isMaximized && (
        <>
          <div onMouseDown={startResize('n')} className="hidden md:block absolute top-0 left-2 right-2 h-1.5 cursor-ns-resize" />
          <div onMouseDown={startResize('s')} className="hidden md:block absolute bottom-0 left-2 right-2 h-1.5 cursor-ns-resize" />
          <div onMouseDown={startResize('w')} className="hidden md:block absolute top-2 bottom-2 left-0 w-1.5 cursor-ew-resize" />
          <div onMouseDown={startResize('e')} className="hidden md:block absolute top-2 bottom-2 right-0 w-1.5 cursor-ew-resize" />
          <div onMouseDown={startResize('nw')} className="hidden md:block absolute top-0 left-0 w-3 h-3 cursor-nwse-resize" />
          <div onMouseDown={startResize('ne')} className="hidden md:block absolute top-0 right-0 w-3 h-3 cursor-nesw-resize" />
          <div onMouseDown={startResize('sw')} className="hidden md:block absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize" />
          <div onMouseDown={startResize('se')} className="hidden md:block absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize">
            <svg viewBox="0 0 16 16" className="w-4 h-4 text-slate-400/50">
              <path d="M14 6L6 14M14 10L10 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </>
      )}
    </motion.section>
  );
};
