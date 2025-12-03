import React from 'react';
import { formatTime } from '../utils/format';
import { Phase } from '../types';

interface TimerDisplayProps {
  timeLeft: number;
  totalDuration: number;
  phase: Phase;
  theme: 'dark' | 'light';
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ timeLeft, totalDuration, phase, theme }) => {
  const isCritical = timeLeft < 60 && phase !== Phase.COMPLETE && phase !== Phase.SETUP;
  
  // Dynamic sizing based on viewport
  const timeString = formatTime(timeLeft);
  
  // Reduce size if time string is long (e.g. includes hours)
  const isLongFormat = timeString.length > 5;
  const textSizeClass = isLongFormat 
    ? 'text-[10vw] md:text-[8rem] lg:text-[10rem]' 
    : 'text-[15vw] md:text-[12rem] lg:text-[15rem]';

  // Calculate progress
  const progress = phase === Phase.COMPLETE 
    ? 100 
    : totalDuration > 0 
      ? Math.min(100, Math.max(0, ((totalDuration - timeLeft) / totalDuration) * 100))
      : 0;

  return (
    <div className="flex flex-col items-center justify-center w-full py-8 md:py-16">
      <div 
        className={`
          font-mono font-bold leading-none tracking-tighter select-none
          ${textSizeClass}
          ${isCritical && theme === 'dark' ? 'text-red-500' : ''}
          ${isCritical && theme === 'light' ? 'text-red-600' : ''}
          transition-colors duration-300
        `}
      >
        {phase === Phase.COMPLETE ? "END" : timeString}
      </div>
      
      <div className={`
        text-xl md:text-3xl uppercase tracking-[0.5em] font-medium opacity-60 mt-4 mb-10
        animate-pulse
      `}>
        {phase === Phase.COMPLETE ? 'Session Complete' : phase.replace(/_/g, ' ')}
      </div>

      {/* Progress Bar */}
      <div className={`w-full max-w-md h-1.5 md:h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/10' : 'bg-black/10'}`}>
        <div 
          className={`h-full transition-all duration-1000 ease-linear ${theme === 'dark' ? 'bg-white' : 'bg-black'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};