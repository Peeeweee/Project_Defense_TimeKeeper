import React from 'react';
import { Play, Pause, RotateCcw, SkipForward, RotateCw } from 'lucide-react';
import { Phase } from '../types';

interface ControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  phase: Phase;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onRestartPhase: () => void;
  onSkip: () => void;
  theme: 'dark' | 'light';
}

export const Controls: React.FC<ControlsProps> = ({
  isRunning,
  isPaused,
  phase,
  onStart,
  onPause,
  onReset,
  onRestartPhase,
  onSkip,
  theme
}) => {
  const isComplete = phase === Phase.COMPLETE;
  
  const iconSize = 24;
  const buttonBase = `
    p-4 rounded-full border-2 transition-all duration-200 
    hover:scale-105 active:scale-95 flex items-center justify-center
  `;

  // Theme specific styles
  const primaryBtn = theme === 'dark' 
    ? 'border-white bg-white text-black hover:bg-gray-200' 
    : 'border-black bg-black text-white hover:bg-gray-800';
    
  const secondaryBtn = theme === 'dark'
    ? 'border-white/20 text-white hover:border-white/100 hover:bg-white/10'
    : 'border-black/20 text-black hover:border-black/100 hover:bg-black/10';

  if (isComplete) {
    return (
      <div className="flex gap-4 mt-8">
        <button 
          onClick={onReset} 
          className={`${buttonBase} ${primaryBtn} gap-2 w-auto px-8`}
        >
          <RotateCcw size={iconSize} />
          <span className="font-bold">NEW SESSION</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 md:gap-8 mt-8">
      {/* Restart Phase */}
      <button 
        onClick={onRestartPhase} 
        title="Restart Current Phase"
        className={`${buttonBase} ${secondaryBtn}`}
      >
        <RotateCw size={iconSize} />
      </button>

      {/* Play / Pause - Main Control */}
      {!isRunning ? (
        <button 
          onClick={onStart} 
          className={`${buttonBase} ${primaryBtn} w-20 h-20 md:w-24 md:h-24`}
        >
          <Play size={iconSize * 1.5} fill="currentColor" />
        </button>
      ) : (
        <button 
          onClick={onPause} 
          className={`${buttonBase} ${primaryBtn} w-20 h-20 md:w-24 md:h-24`}
        >
          <Pause size={iconSize * 1.5} fill="currentColor" />
        </button>
      )}

      {/* Skip Phase */}
      <button 
        onClick={onSkip} 
        title="Skip to Next Phase"
        className={`${buttonBase} ${secondaryBtn}`}
      >
        <SkipForward size={iconSize} />
      </button>
      
      {/* Reset Session (hidden on mobile unless paused or really needed, put in settings/menu usually, but here requested accessible) */}
      <div className="absolute top-4 left-4 md:static">
         {/* We keep reset distinct or in corners to avoid accidents, handled in layout header usually, 
             but we can add a small reset button here if paused */}
         {isPaused && (
           <button 
             onClick={onReset}
             title="Reset Session"
             className={`hidden md:flex ${buttonBase} ${secondaryBtn} border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500`}
           >
             <RotateCcw size={iconSize} />
           </button>
         )}
      </div>
    </div>
  );
};