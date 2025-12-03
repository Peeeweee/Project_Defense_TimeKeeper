import React, { useState } from 'react';
import { AppConfig, Phase, TickMode } from '../types';
import { Play, Volume2, VolumeX, ArrowRight, Clock, Activity, ChevronDown, AlertCircle } from 'lucide-react';
import { playTickSound } from '../utils/sound';

interface SetupViewProps {
  config: AppConfig;
  onConfigChange: (newConfig: AppConfig) => void;
  onStart: () => void;
}

type TimeUnit = 'sec' | 'min' | 'hr' | 'day';

const UNIT_MULTIPLIERS: Record<TimeUnit, number> = {
  sec: 1,
  min: 60,
  hr: 3600,
  day: 86400
};

export const SetupView: React.FC<SetupViewProps> = ({ config, onConfigChange, onStart }) => {
  // Local state for units, independent per phase
  const [units, setUnits] = useState<Record<string, TimeUnit>>({
    [Phase.SETUP]: 'min',
    [Phase.PRESENTATION]: 'min',
    [Phase.Q_AND_A]: 'min'
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleValueChange = (phase: Phase, valueStr: string) => {
    if (phase === Phase.COMPLETE) return;
    
    let val = parseFloat(valueStr);
    
    // Fix: Allow clearing input (treat empty string as 0)
    if (valueStr.trim() === '') {
      val = 0;
    }

    if (isNaN(val) || val < 0) return;

    // Clear error if user starts typing
    if (validationError) setValidationError(null);

    const unit = units[phase] || 'min';
    const multiplier = UNIT_MULTIPLIERS[unit];
    const totalSeconds = val * multiplier;

    onConfigChange({
      ...config,
      phases: {
        ...config.phases,
        [phase]: {
          ...config.phases[phase as Exclude<Phase, Phase.COMPLETE>],
          durationSeconds: totalSeconds
        }
      }
    });
  };

  const handleUnitChange = (phase: Phase, newUnit: TimeUnit) => {
    setUnits(prev => ({
      ...prev,
      [phase]: newUnit
    }));
  };

  const toggleSound = () => {
    onConfigChange({ ...config, soundEnabled: !config.soundEnabled });
  };

  const toggleAutoAdvance = () => {
    onConfigChange({ ...config, autoAdvance: !config.autoAdvance });
  };
  
  const cycleTickMode = () => {
    const modes = [TickMode.NONE, TickMode.LAST_TEN, TickMode.EVERY_SECOND];
    const currentIndex = modes.indexOf(config.tickMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];

    onConfigChange({ ...config, tickMode: nextMode });

    if (nextMode !== TickMode.NONE) {
      playTickSound();
    }
  };

  const handleStartSession = () => {
    // Validate that no phase has 0 duration
    const phases = [Phase.SETUP, Phase.PRESENTATION, Phase.Q_AND_A];
    const invalidPhases = phases.filter(p => {
       const key = p as Exclude<Phase, Phase.COMPLETE>;
       return config.phases[key].durationSeconds <= 0;
    });

    if (invalidPhases.length > 0) {
      setValidationError("Please set a duration for all phases before starting.");
      return;
    }
    
    setValidationError(null);
    onStart();
  };

  const themeClasses = config.theme === 'dark' 
    ? 'text-white border-white/20' 
    : 'text-black border-black/20';

  const getTickModeLabel = (mode: TickMode) => {
    switch (mode) {
      case TickMode.EVERY_SECOND: return 'Always';
      case TickMode.LAST_TEN: return 'Last 10s';
      default: return 'Off';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl mx-auto px-6 py-12 animate-in fade-in duration-500">
      
      <header className="text-center mb-16 space-y-2">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">DEFENSE TIMEKEEPER</h1>
        <p className="text-sm md:text-base font-medium opacity-50 uppercase tracking-[0.3em]">Session Configuration</p>
      </header>

      {/* Phase Durations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
        {[Phase.SETUP, Phase.PRESENTATION, Phase.Q_AND_A].map((phase) => {
          const pKey = phase as Exclude<Phase, Phase.COMPLETE>;
          const currentUnit = units[phase];
          
          // Calculate display value based on current unit
          const seconds = config.phases[pKey].durationSeconds;
          const displayValue = parseFloat((seconds / UNIT_MULTIPLIERS[currentUnit]).toFixed(2));
          
          return (
            <div key={phase} className={`flex flex-col p-6 rounded-xl border ${themeClasses} relative group transition-all hover:border-opacity-50`}>
              <div className="flex items-center gap-2 opacity-50 mb-4">
                <Clock size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">{config.phases[pKey].label}</span>
              </div>
              
              <div className="flex items-baseline gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={displayValue === 0 && seconds === 0 ? '' : displayValue}
                  placeholder="0"
                  onChange={(e) => handleValueChange(phase, e.target.value)}
                  className={`text-5xl md:text-6xl font-mono font-bold w-full bg-transparent outline-none border-b-2 border-transparent hover:border-current focus:border-current transition-all p-0 leading-none placeholder-opacity-20 ${config.theme === 'dark' ? 'placeholder-white' : 'placeholder-black'}`}
                />
                
                <div className="relative group/select">
                  <select 
                    value={currentUnit}
                    onChange={(e) => handleUnitChange(phase, e.target.value as TimeUnit)}
                    className="appearance-none bg-transparent text-xl font-medium opacity-50 hover:opacity-100 cursor-pointer pr-5 outline-none"
                  >
                    <option value="sec" className="text-black">sec</option>
                    <option value="min" className="text-black">min</option>
                    <option value="hr" className="text-black">hr</option>
                    <option value="day" className="text-black">day</option>
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none" size={14} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Options */}
      <div className="flex flex-wrap items-center justify-center gap-6 mb-16">
        <button 
          onClick={toggleSound}
          className={`flex items-center gap-3 px-6 py-3 rounded-full border ${themeClasses} hover:bg-opacity-10 hover:bg-current transition-all`}
        >
          {config.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          <span className="text-sm font-bold uppercase tracking-wider">
            Sound: {config.soundEnabled ? 'On' : 'Off'}
          </span>
        </button>

        <button 
          onClick={cycleTickMode}
          className={`flex items-center gap-3 px-6 py-3 rounded-full border ${themeClasses} hover:bg-opacity-10 hover:bg-current transition-all`}
        >
          <Activity size={20} className={config.tickMode !== TickMode.NONE ? "text-blue-500" : "opacity-50"} />
          <span className="text-sm font-bold uppercase tracking-wider">
            Tick: {getTickModeLabel(config.tickMode)}
          </span>
        </button>

        <button 
          onClick={toggleAutoAdvance}
          className={`flex items-center gap-3 px-6 py-3 rounded-full border ${themeClasses} hover:bg-opacity-10 hover:bg-current transition-all`}
        >
          <ArrowRight size={20} className={config.autoAdvance ? "text-green-500" : "opacity-50"} />
          <span className="text-sm font-bold uppercase tracking-wider">
            Auto-Advance: {config.autoAdvance ? 'On' : 'Off'}
          </span>
        </button>
      </div>

      {/* Validation Error Message */}
      {validationError && (
        <div className="mb-6 flex items-center gap-2 text-red-500 bg-red-500/10 px-4 py-3 rounded-lg animate-in fade-in slide-in-from-bottom-2">
          <AlertCircle size={20} />
          <span className="font-bold text-sm uppercase tracking-wide">{validationError}</span>
        </div>
      )}

      {/* Start Button */}
      <button 
        onClick={handleStartSession}
        className={`
          group relative flex items-center justify-center gap-4 px-12 py-6 rounded-full 
          text-xl md:text-2xl font-bold tracking-widest uppercase
          transition-all duration-300 hover:scale-105 active:scale-95
          ${config.theme === 'dark' ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}
        `}
      >
        <span>Start Session</span>
        <Play fill="currentColor" size={24} />
      </button>

    </div>
  );
};