import React from 'react';
import { formatTime } from '../utils/format';
import { Phase } from '../types';

interface TimerDisplayProps {
  timeLeft: number;
  totalDuration: number;
  phase: Phase;
  theme: 'dark' | 'light' | 'ml2025';
  warningSeconds?: number;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ timeLeft, totalDuration, phase, theme, warningSeconds = 0 }) => {
  // Dynamic Critical Threshold
  // If the user sets a Warning <= 10s, we lower the Critical threshold 
  // to ensure the Warning (Amber) has time to show before Red takes over.
  const criticalThreshold = warningSeconds > 0 && warningSeconds <= 10 
    ? Math.floor(warningSeconds / 2) 
    : 10;

  // Critical State (Red/White) - The final moments
  const isCritical = timeLeft <= criticalThreshold && phase !== Phase.COMPLETE;
  
  // Warning State (Amber/Orange) - Active within warning window but BEFORE critical threshold
  const isWarning = !isCritical && warningSeconds > 0 && timeLeft <= warningSeconds && phase !== Phase.COMPLETE;
  
  // Dynamic sizing based on viewport and length
  const timeString = formatTime(timeLeft);
  const isLongFormat = timeString.length > 5;
  const textSizeClass = isLongFormat 
    ? 'text-[10vw] md:text-[8rem] lg:text-[10rem]' 
    : 'text-[15vw] md:text-[12rem] lg:text-[15rem]';

  // Determine Text Color based on Theme and State
  let textColorClass = '';

  if (theme === 'dark') {
    if (isCritical) textColorClass = 'text-red-500';
    else if (isWarning) textColorClass = 'text-amber-400';
    else textColorClass = 'text-white';
  } else if (theme === 'light') {
    if (isCritical) textColorClass = 'text-red-600';
    else if (isWarning) textColorClass = 'text-amber-500';
    else textColorClass = 'text-black';
  } else if (theme === 'ml2025') {
    if (isCritical) textColorClass = 'text-white'; // White pops against dark red
    else if (isWarning) textColorClass = 'text-ml-orange';
    else textColorClass = 'text-ml-yellow';
  }

  // Calculate progress
  const progress = phase === Phase.COMPLETE 
    ? 100 
    : totalDuration > 0 
      ? Math.min(100, Math.max(0, ((totalDuration - timeLeft) / totalDuration) * 100))
      : 0;

  // Progress bar color matches text state or theme accent
  let progressColor = 'bg-white';
  let progressTrackColor = 'bg-white/10';

  if (theme === 'dark') {
    progressTrackColor = 'bg-white/10';
    progressColor = isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-white';
  } else if (theme === 'light') {
    progressTrackColor = 'bg-black/10';
    progressColor = isCritical ? 'bg-red-600' : isWarning ? 'bg-amber-500' : 'bg-black';
  } else if (theme === 'ml2025') {
    progressTrackColor = 'bg-ml-yellow/20';
    progressColor = isCritical ? 'bg-white' : isWarning ? 'bg-ml-orange' : 'bg-ml-yellow';
  }

  // Phase Label Color
  let labelColor = '';
  if (theme === 'dark') labelColor = 'text-white';
  else if (theme === 'light') labelColor = 'text-black';
  else if (theme === 'ml2025') labelColor = 'text-ml-yellow';

  // Warning Label Color
  let warningLabelColor = '';
  if (theme === 'dark') warningLabelColor = 'text-amber-400';
  else if (theme === 'light') warningLabelColor = 'text-amber-600';
  else if (theme === 'ml2025') warningLabelColor = 'text-ml-orange';

  return (
    <div className="flex flex-col items-center justify-center w-full py-8 md:py-16 animate-scale-in">
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
        ${labelColor}
      `}>
        {phase === Phase.COMPLETE ? 'Session Complete' : phase.replace(/_/g, ' ')}
      </div>

      {/* Progress Bar */}
      <div className={`w-full max-w-md h-1.5 md:h-2 rounded-full overflow-hidden ${progressTrackColor}`}>
        <div 
          className={`h-full transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(255,255,255,0.3)] ${progressColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Warning Indicator (Optional Text) */}
      {isWarning && (
        <div className={`mt-4 text-sm font-bold uppercase tracking-widest ${warningLabelColor} animate-pulse`}>
          Warning: Time Ending Soon
        </div>
      )}
    </div>
  );
};