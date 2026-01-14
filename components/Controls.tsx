import React from 'react';
import { Play, Pause, RotateCcw, SkipForward, RotateCw, Settings2, Users } from 'lucide-react';
import { Phase } from '../types';

interface ControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  phase: Phase;
  presenterCount?: number;
  totalPresenters?: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onRestartSession: () => void;
  onRestartPhase: () => void;
  onSkip: () => void;
  onNextPresenter?: () => void;
  theme: 'dark' | 'light' | 'ml2025';
}

export const Controls: React.FC<ControlsProps> = ({
  isRunning,
  isPaused,
  phase,
  presenterCount = 1,
  totalPresenters,
  onStart,
  onPause,
  onReset,
  onRestartSession,
  onRestartPhase,
  onSkip,
  onNextPresenter,
  theme
}) => {
  const isComplete = phase === Phase.COMPLETE;

  const iconSize = 24;
  const buttonBase = `
    p-4 rounded-full border-2 transition-all duration-200 
    hover:scale-105 active:scale-95 flex items-center justify-center
  `;

  // Theme specific styles
  let primaryBtn = '';
  let secondaryBtn = '';

  if (theme === 'dark') {
    primaryBtn = 'border-white bg-white text-black hover:bg-gray-200';
    secondaryBtn = 'border-white/20 text-white hover:border-white/100 hover:bg-white/10';
  } else if (theme === 'light') {
    primaryBtn = 'border-black bg-black text-white hover:bg-gray-800';
    secondaryBtn = 'border-black/20 text-black hover:border-black/100 hover:bg-black/10';
  } else if (theme === 'ml2025') {
    primaryBtn = 'border-ml-yellow bg-ml-yellow text-ml-bg hover:bg-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)]';
    secondaryBtn = 'border-ml-yellow/30 text-ml-yellow hover:border-ml-yellow hover:bg-ml-yellow/10';
  }

  // Check if we should show Next Presenter button
  // Show if totalPresenters is NOT set (infinite) OR if we haven't reached the limit yet
  const showNextPresenter = onNextPresenter && (!totalPresenters || presenterCount < totalPresenters);

  if (isComplete) {
    return (
      <div className="flex flex-col md:flex-row items-center gap-4 mt-8 animate-slide-up">
        {/* Restart Same Config */}
        <button
          onClick={onRestartSession}
          className={`${buttonBase} ${primaryBtn} gap-3 w-full md:w-auto px-8 py-4`}
          title="Restart Session from Presenter 1"
        >
          <RotateCcw size={iconSize} />
          <span className="font-bold tracking-wider">RESTART SESSION</span>
        </button>

        {/* Configure New */}
        <button
          onClick={onReset}
          className={`${buttonBase} ${secondaryBtn} gap-3 w-full md:w-auto px-8 py-4`}
          title="Return to Setup"
        >
          <Settings2 size={iconSize} />
          <span className="font-bold tracking-wider">CONFIGURE NEW</span>
        </button>

        {/* Next Presenter (Manual Override/Extension) */}
        {/* Only show if we strictly believe there are more, OR if we want to allow 'adding' a presenter?
            The user said "if there arent more ... do not show".
            Usually Phase.COMPLETE means we are done. But maybe user wants to continue anyway?
            I'll interpret 'do not show if last' strictly. But since we are at COMPLETE, we are technically at 'last'.
            However, if I want to support the user's likely intent of "Oh, I forgot one" or "next please",
            maybe I show it if totalPresenters is undefined?
        */}
        {(!totalPresenters) && onNextPresenter && (
          <button
            onClick={onNextPresenter}
            className={`${buttonBase} ${secondaryBtn} gap-3 w-full md:w-auto px-8 py-4`}
          >
            <Users size={iconSize} />
            <span className="font-bold tracking-wider">NEXT PRESENTER</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 md:gap-8 mt-8 animate-slide-up delay-100">
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

      {/* Reset Session */}
      <div className="absolute top-4 left-4 md:static">
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

      {/* Next Presenter (Manual - During Session) */}
      {/* If user wants to skip the rest of this presenter and go to next immediately */}
      {/* The user didn't explicitly ask for this here, but it's useful. I'll hide it to stick to the request "add a 3rd button here" (refering to end screen) */}
    </div>
  );
};