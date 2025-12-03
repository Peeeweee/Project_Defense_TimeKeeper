import React from 'react';
import { Phase } from '../types';
import { PHASE_ORDER } from '../constants';

interface PhaseIndicatorProps {
  currentPhase: Phase;
  theme: 'dark' | 'light';
}

export const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ currentPhase, theme }) => {
  // Filter out COMPLETE for the stepper
  const steps = [Phase.SETUP, Phase.PRESENTATION, Phase.Q_AND_A];

  return (
    <div className="flex items-center justify-center w-full max-w-2xl gap-2 md:gap-4 px-4">
      {steps.map((phase, index) => {
        const isActive = phase === currentPhase;
        const isPast = PHASE_ORDER.indexOf(phase) < PHASE_ORDER.indexOf(currentPhase);
        
        // Define styles based on state and theme
        let borderClass = theme === 'dark' ? 'border-white/20' : 'border-black/20';
        let bgClass = 'bg-transparent';
        let textClass = theme === 'dark' ? 'text-white/40' : 'text-black/40';

        if (isActive) {
          borderClass = theme === 'dark' ? 'border-white' : 'border-black';
          bgClass = theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white';
          textClass = theme === 'dark' ? 'text-black' : 'text-white';
        } else if (isPast) {
          borderClass = theme === 'dark' ? 'border-white/60' : 'border-black/60';
          textClass = theme === 'dark' ? 'text-white/60' : 'text-black/60';
        }

        return (
          <div 
            key={phase} 
            className={`
              flex-1 flex flex-col md:flex-row items-center justify-center 
              py-2 md:py-3 px-2 rounded border 
              ${borderClass} ${bgClass} ${textClass}
              transition-all duration-300
            `}
          >
            <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-center">
              {phase.replace(/_/g, ' ')}
            </span>
          </div>
        );
      })}
    </div>
  );
};