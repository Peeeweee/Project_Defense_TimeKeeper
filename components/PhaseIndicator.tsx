import React from 'react';
import { Phase } from '../types';
import { PHASE_ORDER } from '../constants';

interface PhaseIndicatorProps {
  currentPhase: Phase;
  theme: 'dark' | 'light' | 'ml2025';
}

export const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ currentPhase, theme }) => {
  // Filter out COMPLETE for the stepper
  const steps = [Phase.SETUP, Phase.PRESENTATION, Phase.Q_AND_A];

  return (
    <div className="flex items-center justify-center w-full max-w-2xl gap-2 md:gap-4 px-4">
      {steps.map((phase, index) => {
        const isActive = phase === currentPhase;
        const isPast = PHASE_ORDER.indexOf(phase) < PHASE_ORDER.indexOf(currentPhase);
        
        let borderClass = '';
        let bgClass = '';
        let textClass = '';

        if (theme === 'dark') {
          if (isActive) {
            borderClass = 'border-white';
            bgClass = 'bg-white';
            textClass = 'text-black';
          } else {
            borderClass = 'border-white/20';
            bgClass = 'bg-transparent';
            textClass = isPast ? 'text-white/60' : 'text-white/40';
          }
        } else if (theme === 'light') {
          if (isActive) {
            borderClass = 'border-black';
            bgClass = 'bg-black';
            textClass = 'text-white';
          } else {
            borderClass = 'border-black/20';
            bgClass = 'bg-transparent';
            textClass = isPast ? 'text-black/60' : 'text-black/40';
          }
        } else if (theme === 'ml2025') {
          if (isActive) {
            borderClass = 'border-ml-yellow';
            bgClass = 'bg-ml-yellow';
            textClass = 'text-ml-bg'; // Dark maroon text on yellow bg
          } else {
            borderClass = 'border-ml-yellow/30';
            bgClass = 'bg-transparent';
            textClass = isPast ? 'text-ml-yellow/70' : 'text-ml-yellow/40';
          }
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