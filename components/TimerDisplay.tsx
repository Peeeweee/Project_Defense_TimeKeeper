import React from 'react';
import { formatTime } from '../utils/format';
import { Phase, AppConfig } from '../types';

interface TimerDisplayProps {
  timeLeft: number;
  totalDuration: number;
  phase: Phase;
  theme: 'dark' | 'light';
  warningSeconds?: number;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ timeLeft, totalDuration, phase, theme, warningSeconds = 0 }) => {
  // Critical is < 60s
  const isCritical = timeLeft < 60 && phase !== Phase.COMPLETE && phase !== Phase.SETUP;
  
  // Warning is <= warningSeconds (but not critical yet if we want distinct colors, though critical usually overrides warning)
  const isWarning = !isCritical && warningSeconds > 0 && timeLeft <= warningSeconds && phase !== Phase.COMPLETE;
  
  // Dynamic sizing based on viewport
  const timeString = formatTime(timeLeft);
  
  // Reduce size if time string is long (e.g. includes hours)
  const isLongFormat = timeString.length > 5;
  const textSizeClass = isLongFormat 
    ? 'text-[10vw] md:text-[8rem] lg:text-[10rem]' 
    : 'text-[15vw] md:text-[12rem] lg:text-[15rem]';

  // Determine Text Color
  let textColorClass = '';
  if (theme === 'dark') {
    if (isCritical) textColorClass = 'text-red-500';
    else if (isWarning) textColorClass = 'text-amber-400';
    else textColorClass = 'text-white';
  } else {
    if (isCritical) textColorClass = 'text-red-600';
    else if (isWarning) textColorClass = 'text-amber-500';
    else textColorClass = 'text-black';
  }

  // Calculate progress
  const progress = phase === Phase.COMPLETE 
    ? 100 
    : totalDuration > 0 
      ? Math.min(100, Math.max(0, ((totalDuration - timeLeft) / totalDuration) * 100))
      : 0;

  // Progress bar color matches text state
  let progressColor = theme === 'dark' ? 'bg-white' : 'bg-black';
  if (isCritical) progressColor = 'bg-red-500';
  else if (isWarning) progressColor = 'bg-amber-500';

  return (
    <div className="flex flex-col items-center justify-center w-full py-8 md:py-16">
      <div 
        className={`
          font-mono font-bold leading-none tracking-tighter select-none
          ${textSizeClass}
          ${textColorClass}
          transition-colors duration-300
        `}
      >
        {phase === Phase.COMPLETE ? "END" : timeString}
      </div>
      
      <div className={`
        text-xl md:text-3xl uppercase tracking-[0.5em] font-medium opacity-60 mt-4 mb-10
        animate-pulse
        ${theme === 'dark' ? 'text-white' : 'text-black'}
      `}>
        {phase === Phase.COMPLETE ? 'Session Complete' : phase.replace(/_/g, ' ')}
      </div>

      {/* Progress Bar */}
      <div className={`w-full max-w-md h-1.5 md:h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/10' : 'bg-black/10'}`}>
        <div 
          className={`h-full transition-all duration-1000 ease-linear ${progressColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Warning Indicator (Optional Text) */}
      {isWarning && (
        <div className={`mt-4 text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'} animate-bounce`}>
          Warning: Time Ending Soon
        </div>
      )}
    </div>
  );
};