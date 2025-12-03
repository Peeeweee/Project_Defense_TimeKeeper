import React, { useState, useEffect } from 'react';
import { AppConfig, Phase, TickMode, Preset } from '../types';
import { Play, Volume2, VolumeX, ArrowRight, Clock, Activity, ChevronDown, AlertCircle, BellRing, Save, Trash2, FolderOpen, Check, X, Plus } from 'lucide-react';
import { playTickSound } from '../utils/sound';
import { DEFAULT_PRESETS } from '../constants';

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

// Helper to guess best unit for a preset value
const getOptimalUnit = (seconds: number): TimeUnit => {
  if (seconds === 0) return 'min';
  if (seconds % 86400 === 0) return 'day';
  if (seconds % 3600 === 0) return 'hr';
  if (seconds % 60 === 0) return 'min';
  return 'sec';
};

export const SetupView: React.FC<SetupViewProps> = ({ config, onConfigChange, onStart }) => {
  // Presets State
  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const saved = localStorage.getItem('defense-timer-presets');
      const customPresets = saved ? JSON.parse(saved) : [];
      return [...DEFAULT_PRESETS, ...customPresets];
    } catch {
      return DEFAULT_PRESETS;
    }
  });
  
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [isNamingPreset, setIsNamingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Local state for units, independent per phase
  const [units, setUnits] = useState<Record<string, TimeUnit>>({
    [Phase.SETUP]: 'min',
    [Phase.PRESENTATION]: 'min',
    [Phase.Q_AND_A]: 'min'
  });

  const [warningUnits, setWarningUnits] = useState<Record<string, TimeUnit>>({
    [Phase.SETUP]: 'sec',
    [Phase.PRESENTATION]: 'min',
    [Phase.Q_AND_A]: 'min'
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize units based on current config on mount (helpful if config persisted)
  useEffect(() => {
    const newUnits = { ...units };
    const newWarningUnits = { ...warningUnits };
    
    [Phase.SETUP, Phase.PRESENTATION, Phase.Q_AND_A].forEach(phase => {
        const pKey = phase as Exclude<Phase, Phase.COMPLETE>;
        newUnits[phase] = getOptimalUnit(config.phases[pKey].durationSeconds);
        newWarningUnits[phase] = getOptimalUnit(config.phases[pKey].warningSeconds);
    });
    
    setUnits(newUnits);
    setWarningUnits(newWarningUnits);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const handleValueChange = (phase: Phase, valueStr: string, isWarning = false) => {
    if (phase === Phase.COMPLETE) return;
    
    // Changing a value implies we are drifting from any preset
    if (selectedPresetId) setSelectedPresetId('');

    let val = parseFloat(valueStr);
    
    if (valueStr.trim() === '') {
      val = 0;
    }

    if (isNaN(val) || val < 0) return;

    if (validationError) setValidationError(null);

    const unitMap = isWarning ? warningUnits : units;
    const unit = unitMap[phase] || (isWarning ? 'sec' : 'min');
    const multiplier = UNIT_MULTIPLIERS[unit];
    const totalSeconds = val * multiplier;

    const pKey = phase as Exclude<Phase, Phase.COMPLETE>;

    onConfigChange({
      ...config,
      phases: {
        ...config.phases,
        [phase]: {
          ...config.phases[pKey],
          [isWarning ? 'warningSeconds' : 'durationSeconds']: totalSeconds
        }
      }
    });
  };

  const handleUnitChange = (phase: Phase, newUnit: TimeUnit, isWarning = false) => {
    if (isWarning) {
      setWarningUnits(prev => ({ ...prev, [phase]: newUnit }));
    } else {
      setUnits(prev => ({ ...prev, [phase]: newUnit }));
    }
  };

  // Preset Handlers
  const handleLoadPreset = (id: string) => {
    const preset = presets.find(p => p.id === id);
    if (!preset) return;

    setSelectedPresetId(id);
    onConfigChange(preset.config);

    // Update units to match the loaded config so it looks nice
    const newUnits: Record<string, TimeUnit> = {};
    const newWarningUnits: Record<string, TimeUnit> = {};

    [Phase.SETUP, Phase.PRESENTATION, Phase.Q_AND_A].forEach(phase => {
       const pKey = phase as Exclude<Phase, Phase.COMPLETE>;
       newUnits[phase] = getOptimalUnit(preset.config.phases[pKey].durationSeconds);
       newWarningUnits[phase] = getOptimalUnit(preset.config.phases[pKey].warningSeconds);
    });

    setUnits(newUnits);
    setWarningUnits(newWarningUnits);
    setValidationError(null);
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    
    const newPreset: Preset = {
      id: `custom_${Date.now()}`,
      name: newPresetName.trim(),
      config: config,
      isDefault: false
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    setSelectedPresetId(newPreset.id);
    setNewPresetName('');
    setIsNamingPreset(false);

    // Persist custom presets only
    const customPresets = updatedPresets.filter(p => !p.isDefault);
    localStorage.setItem('defense-timer-presets', JSON.stringify(customPresets));
  };

  const handleDeletePreset = () => {
    if (!selectedPresetId) return;
    
    const updatedPresets = presets.filter(p => p.id !== selectedPresetId);
    setPresets(updatedPresets);
    setSelectedPresetId('');
    
    // Persist custom presets only
    const customPresets = updatedPresets.filter(p => !p.isDefault);
    localStorage.setItem('defense-timer-presets', JSON.stringify(customPresets));
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
    const phases = [Phase.SETUP, Phase.PRESENTATION, Phase.Q_AND_A];
    
    // Iterate to check for validity
    for (const phase of phases) {
        const key = phase as Exclude<Phase, Phase.COMPLETE>;
        const pConfig = config.phases[key];

        // Check for empty/zero duration
        if (pConfig.durationSeconds <= 0) {
             setValidationError("Please set a duration for all phases before starting.");
             return;
        }

        // Check for Warning >= Duration
        if (pConfig.warningSeconds > 0 && pConfig.warningSeconds >= pConfig.durationSeconds) {
             setValidationError(`Warning time for ${pConfig.label} must be shorter than the phase duration.`);
             return;
        }
    }
    
    setValidationError(null);
    onStart();
  };

  const themeClasses = config.theme === 'dark' 
    ? 'text-white border-white/20' 
    : 'text-black border-black/20';
  
  const warningTextClass = config.theme === 'dark' ? 'text-amber-400' : 'text-amber-600';

  const getTickModeLabel = (mode: TickMode) => {
    switch (mode) {
      case TickMode.EVERY_SECOND: return 'Always';
      case TickMode.LAST_TEN: return 'Last 10s';
      default: return 'Off';
    }
  };

  const selectedPreset = presets.find(p => p.id === selectedPresetId);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl mx-auto px-6 py-12 animate-in fade-in duration-500">
      
      <header className="text-center mb-8 space-y-2">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">DEFENSE TIMEKEEPER</h1>
        <p className="text-sm md:text-base font-medium opacity-50 uppercase tracking-[0.3em]">Session Configuration</p>
      </header>

      {/* Presets Toolbar */}
      <div className={`w-full flex flex-col md:flex-row items-center justify-between gap-4 p-4 mb-8 rounded-lg border bg-opacity-5 ${themeClasses}`}>
         
         {/* Left: Load Preset */}
         <div className="flex items-center gap-3 w-full md:w-auto">
            <FolderOpen size={18} className="opacity-50" />
            <span className="text-sm font-bold uppercase tracking-wider opacity-70 whitespace-nowrap">Load Preset:</span>
            
            <div className="relative flex-1 md:w-64">
              <select 
                value={selectedPresetId}
                onChange={(e) => handleLoadPreset(e.target.value)}
                className={`w-full appearance-none bg-transparent font-bold py-1 pr-8 outline-none border-b border-transparent hover:border-current transition-colors ${!selectedPresetId ? 'opacity-50 italic' : ''}`}
              >
                <option value="" disabled className="text-black italic">-- Select / Custom --</option>
                {presets.map(p => (
                  <option key={p.id} value={p.id} className="text-black not-italic">
                    {p.name} {p.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none" size={14} />
            </div>
         </div>

         {/* Right: Save / Delete Actions */}
         <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            
            {/* Delete Button (Only for custom presets) */}
            {selectedPreset && !selectedPreset.isDefault && (
              <button 
                onClick={handleDeletePreset}
                title="Delete Preset"
                className="p-2 hover:text-red-500 transition-colors opacity-50 hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
            )}

            <div className="h-6 w-px bg-current opacity-10 mx-2 hidden md:block"></div>

            {/* Save Action */}
            {isNamingPreset ? (
              <div className="flex items-center gap-2 animate-in slide-in-from-right duration-200">
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Preset Name..."
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                  className={`bg-transparent border-b border-current w-32 md:w-40 py-1 text-sm outline-none`}
                />
                <button onClick={handleSavePreset} className="p-1 hover:text-green-500 transition-colors"><Check size={18}/></button>
                <button onClick={() => setIsNamingPreset(false)} className="p-1 hover:text-red-500 transition-colors"><X size={18}/></button>
              </div>
            ) : (
              <button 
                onClick={() => setIsNamingPreset(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wide hover:bg-current hover:bg-opacity-10 transition-all ${themeClasses}`}
              >
                <Save size={14} />
                <span>Save Config</span>
              </button>
            )}
         </div>
      </div>

      {/* Phase Durations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
        {[Phase.SETUP, Phase.PRESENTATION, Phase.Q_AND_A].map((phase) => {
          const pKey = phase as Exclude<Phase, Phase.COMPLETE>;
          
          // Duration Calculation
          const currentUnit = units[phase];
          const seconds = config.phases[pKey].durationSeconds;
          const displayValue = parseFloat((seconds / UNIT_MULTIPLIERS[currentUnit]).toFixed(2));
          
          // Warning Calculation
          const currentWarningUnit = warningUnits[phase];
          const warningSecs = config.phases[pKey].warningSeconds;
          const warningDisplayValue = parseFloat((warningSecs / UNIT_MULTIPLIERS[currentWarningUnit]).toFixed(2));

          // Check if this specific phase has a warning error for visual feedback
          const isWarningError = warningSecs > 0 && warningSecs >= seconds && seconds > 0;

          return (
            <div key={phase} className={`flex flex-col p-6 rounded-xl border ${isWarningError ? 'border-red-500' : themeClasses} relative group transition-all hover:border-opacity-50`}>
              
              {/* Header */}
              <div className="flex items-center gap-2 opacity-50 mb-4">
                <Clock size={16} />
                <span className={`text-xs font-bold uppercase tracking-wider ${isWarningError ? 'text-red-500' : ''}`}>{config.phases[pKey].label}</span>
              </div>
              
              {/* Main Duration Input */}
              <div className="flex items-baseline gap-2 mb-6 border-b border-transparent group-hover:border-inherit transition-colors pb-2">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={displayValue === 0 && seconds === 0 ? '' : displayValue}
                  placeholder="0"
                  onChange={(e) => handleValueChange(phase, e.target.value)}
                  className={`text-5xl md:text-6xl font-mono font-bold w-full bg-transparent outline-none p-0 leading-none placeholder-opacity-20 ${config.theme === 'dark' ? 'placeholder-white' : 'placeholder-black'}`}
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

              {/* Warning Input */}
              <div className="flex items-center gap-2 pt-2 border-t border-dashed border-opacity-20 border-inherit">
                 <BellRing size={14} className={isWarningError ? 'text-red-500' : (warningSecs > 0 ? warningTextClass : "opacity-30")} />
                 <span className={`text-xs font-bold uppercase opacity-50 ${isWarningError ? 'text-red-500 opacity-100' : ''}`}>Warn at:</span>
                 
                 <div className="flex-1 flex items-baseline gap-1">
                   <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={warningDisplayValue === 0 && warningSecs === 0 ? '' : warningDisplayValue}
                    placeholder="0"
                    onChange={(e) => handleValueChange(phase, e.target.value, true)}
                    className={`w-full bg-transparent text-right font-mono font-bold outline-none border-b border-transparent hover:border-current focus:border-current transition-colors text-sm ${isWarningError ? 'text-red-500' : (warningSecs > 0 ? warningTextClass : '')}`}
                   />
                   
                   <div className="relative">
                      <select 
                        value={currentWarningUnit}
                        onChange={(e) => handleUnitChange(phase, e.target.value as TimeUnit, true)}
                        className={`appearance-none bg-transparent text-xs font-bold uppercase cursor-pointer pr-3 outline-none ${isWarningError ? 'text-red-500' : (warningSecs > 0 ? warningTextClass : 'opacity-50')}`}
                      >
                        <option value="sec" className="text-black">sec</option>
                        <option value="min" className="text-black">min</option>
                        <option value="hr" className="text-black">hr</option>
                      </select>
                   </div>
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