import React, { useEffect, useState } from 'react';
import { Phase, TimerState } from '../types';
import { Clock, Users } from 'lucide-react';

export const LiveView: React.FC = () => {
  const [state, setState] = useState<TimerState | null>(null);

  useEffect(() => {
    // Initial load
    const saved = localStorage.getItem('defense-timer-state');
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse timer state", e);
      }
    }

    // Listen for changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'defense-timer-state' && e.newValue) {
        try {
          setState(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Failed to parse timer state update", err);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (!state) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <p className="text-2xl font-mono animate-pulse">Waiting for synchronization...</p>
      </div>
    );
  }

  const minutes = Math.floor(state.timeLeft / 60);
  const seconds = state.timeLeft % 60;
  const timeString = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const getPhaseLabel = (phase: Phase) => {
    switch (phase) {
      case Phase.PRESENTATION: return 'PRESENTATION';
      case Phase.Q_AND_A: return 'Q & A';
      case Phase.COMPLETE: return 'SESSION COMPLETE';
      default: return '';
    }
  };

  const isWarning = state.timeLeft <= 60 && state.timeLeft > 0 && state.currentPhase !== Phase.COMPLETE; // Simple warning logic for visual, or rely on config if passed
  // Note: We don't have config here, so we can't know exact warning time. 
  // Ideally we should sync config too, or just rely on simple visual cues.
  // For now, let's just show the time.

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white overflow-hidden">
      
      {/* Header Info */}
      <div className="absolute top-8 left-0 w-full flex justify-between px-12 opacity-50">
        <div className="flex items-center gap-4">
          <Users size={48} />
          <div className="flex flex-col">
             <span className="text-xl font-bold uppercase tracking-widest">Presenter</span>
             <span className="text-6xl font-mono font-bold leading-none">{state.presenterCount}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex flex-col items-end">
             <span className="text-xl font-bold uppercase tracking-widest">Status</span>
             <span className="text-4xl font-bold leading-none text-right">
               {state.isPaused ? 'PAUSED' : (state.isRunning ? 'LIVE' : 'READY')}
             </span>
           </div>
        </div>
      </div>

      {/* Main Timer */}
      <div className="flex flex-col items-center gap-8 z-10">
        <h1 className="text-[8vw] font-black tracking-tighter leading-none uppercase text-center opacity-80">
          {getPhaseLabel(state.currentPhase)}
        </h1>
        
        <div className={`
          font-mono font-bold text-[25vw] leading-none tracking-tighter tabular-nums
          ${state.timeLeft <= 10 && state.currentPhase !== Phase.COMPLETE ? 'text-red-500 animate-pulse' : 'text-white'}
          ${state.currentPhase === Phase.COMPLETE ? 'text-green-500' : ''}
        `}>
          {timeString}
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-blue-500 rounded-full blur-[100px] mix-blend-screen animate-pulse duration-[10s]" />
      </div>

    </div>
  );
};
