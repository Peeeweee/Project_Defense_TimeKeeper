import React, { useState } from 'react';
import { AppConfig, Phase, TickMode, Preset } from '../types';
import { Play, Volume2, VolumeX, ArrowRight, Clock, Activity, ChevronDown, AlertCircle, BellRing, Save, Trash2, FolderOpen, Check, X, ChevronUp, Users } from 'lucide-react';
import { playTickSound } from '../utils/sound';
import { DEFAULT_PRESETS } from '../constants';

interface SetupViewProps {
  config: AppConfig;
  onConfigChange: (newConfig: AppConfig) => void;
  onStart: () => void;
  presenterCount: number;
  onPresenterCountChange: (count: number) => void;
}

export const SetupView: React.FC<SetupViewProps> = ({ config, onConfigChange, onStart, presenterCount, onPresenterCountChange }) => {
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
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleTimeChange = (phase: Phase, type: 'min' | 'sec', valueStr: string, isWarning = false) => {
    if (phase === Phase.COMPLETE) return;
    if (selectedPresetId) setSelectedPresetId('');

    let val = parseInt(valueStr);
    if (valueStr.trim() === '') val = 0;
    if (isNaN(val) || val < 0) return;
    if (type === 'sec' && val >= 60) return; // Cap seconds at 59

    const pKey = phase as Exclude<Phase, Phase.COMPLETE>;
    const currentSeconds = isWarning ? config.phases[pKey].warningSeconds : config.phases[pKey].durationSeconds;

    const currentMin = Math.floor(currentSeconds / 60);
    const currentSec = currentSeconds % 60;

    let newTotalSeconds = 0;
    if (type === 'min') {
      newTotalSeconds = (val * 60) + currentSec;
    } else {
      newTotalSeconds = (currentMin * 60) + val;
    }

    if (validationError) setValidationError(null);

    onConfigChange({
      ...config,
      phases: {
        ...config.phases,
        [phase]: {
          ...config.phases[pKey],
          [isWarning ? 'warningSeconds' : 'durationSeconds']: newTotalSeconds
        }
      }
    });
  };

  const incrementTime = (phase: Phase, type: 'min' | 'sec', amount: number, isWarning = false) => {
    const pKey = phase as Exclude<Phase, Phase.COMPLETE>;
    const currentSeconds = isWarning ? config.phases[pKey].warningSeconds : config.phases[pKey].durationSeconds;
    const currentMin = Math.floor(currentSeconds / 60);
    const currentSec = currentSeconds % 60;

    let newVal = type === 'min' ? currentMin + amount : currentSec + amount;
    if (newVal < 0) newVal = type === 'sec' ? 59 : 0;
    if (type === 'sec' && newVal >= 60) newVal = 0;

    handleTimeChange(phase, type, newVal.toString(), isWarning);
  };

  const handleLoadPreset = (id: string) => {
    const preset = presets.find(p => p.id === id);
    if (!preset) return;
    setSelectedPresetId(id);
    onConfigChange(preset.config);
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
    const customPresets = updatedPresets.filter(p => !p.isDefault);
    localStorage.setItem('defense-timer-presets', JSON.stringify(customPresets));
  };

  const handleDeletePreset = () => {
    if (!selectedPresetId) return;
    const updatedPresets = presets.filter(p => p.id !== selectedPresetId);
    setPresets(updatedPresets);
    setSelectedPresetId('');
    const customPresets = updatedPresets.filter(p => !p.isDefault);
    localStorage.setItem('defense-timer-presets', JSON.stringify(customPresets));
  };

  const toggleSound = () => onConfigChange({ ...config, soundEnabled: !config.soundEnabled });
  const toggleAutoAdvance = () => onConfigChange({ ...config, autoAdvance: !config.autoAdvance });
  const cycleTickMode = () => {
    const modes = [TickMode.NONE, TickMode.LAST_TEN, TickMode.EVERY_SECOND];
    const currentIndex = modes.indexOf(config.tickMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    onConfigChange({ ...config, tickMode: nextMode });
    if (nextMode !== TickMode.NONE) playTickSound();
  };

  const handleStartSession = () => {
    const phases = [Phase.PRESENTATION, Phase.Q_AND_A];
    for (const phase of phases) {
      const key = phase as Exclude<Phase, Phase.COMPLETE>;
      const pConfig = config.phases[key];
      if (pConfig.durationSeconds <= 0) {
        setValidationError("Please set a duration for all phases before starting.");
        return;
      }
      if (pConfig.warningSeconds > 0 && pConfig.warningSeconds >= pConfig.durationSeconds) {
        setValidationError(`Warning time for ${pConfig.label} must be shorter than the phase duration.`);
        return;
      }
    }
    setValidationError(null);
    onStart();
  };

  // Determine Theme Classes
  let themeClasses = '';
  let warningTextClass = '';
  let placeholderColor = '';
  let inputColor = '';
  let selectOptionClass = '';
  let startBtnClass = '';
  let optionHoverBg = '';
  let spinBtnHover = '';

  if (config.theme === 'dark') {
    themeClasses = 'text-white border-white/20';
    warningTextClass = 'text-amber-400';
    placeholderColor = 'placeholder-white';
    inputColor = 'text-white';
    selectOptionClass = 'text-black';
    startBtnClass = 'bg-white text-black hover:bg-gray-200';
    optionHoverBg = 'hover:bg-white/10';
    spinBtnHover = 'hover:bg-white/20';
  } else if (config.theme === 'light') {
    themeClasses = 'text-black border-black/20';
    warningTextClass = 'text-amber-600';
    placeholderColor = 'placeholder-black';
    inputColor = 'text-black';
    selectOptionClass = 'text-black';
    startBtnClass = 'bg-black text-white hover:bg-gray-800';
    optionHoverBg = 'hover:bg-black/5';
    spinBtnHover = 'hover:bg-black/10';
  } else if (config.theme === 'ml2025') {
    themeClasses = 'text-ml-yellow border-ml-yellow/20';
    warningTextClass = 'text-ml-orange';
    placeholderColor = 'placeholder-ml-yellow';
    inputColor = 'text-ml-yellow';
    selectOptionClass = 'text-black';
    startBtnClass = 'bg-ml-yellow text-ml-bg hover:bg-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.2)]';
    optionHoverBg = 'hover:bg-ml-yellow/10';
    spinBtnHover = 'hover:bg-ml-yellow/20';
  }

  const getTickModeLabel = (mode: TickMode) => {
    switch (mode) {
      case TickMode.EVERY_SECOND: return 'Always';
      case TickMode.LAST_TEN: return 'Last 10s';
      default: return 'Off';
    }
  };

  const selectedPreset = presets.find(p => p.id === selectedPresetId);

  const TimeInputGroup = ({
    value,
    onChange,
    onIncrement,
    onDecrement,
    label,
    max = 99
  }: {
    value: number,
    onChange: (val: string) => void,
    onIncrement: () => void,
    onDecrement: () => void,
    label: string,
    max?: number
  }) => (
    <div className="flex flex-col items-center gap-1">
      <button onClick={onIncrement} className={`p-1 rounded transition-colors opacity-50 hover:opacity-100 ${spinBtnHover}`}>
        <ChevronUp size={16} />
      </button>
      <input
        type="number"
        min="0"
        max={max}
        value={value < 10 ? `0${value}` : value}
        onChange={(e) => onChange(e.target.value)}
        className={`text-5xl md:text-6xl font-mono font-bold w-24 text-center bg-transparent outline-none p-0 leading-none appearance-none ${placeholderColor} ${inputColor}`}
        style={{ MozAppearance: 'textfield' }}
      />
      <button onClick={onDecrement} className={`p-1 rounded transition-colors opacity-50 hover:opacity-100 ${spinBtnHover}`}>
        <ChevronDown size={16} />
      </button>
      <span className="text-xs uppercase opacity-30 font-bold tracking-widest mt-1">{label}</span>
      <style>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
      `}</style>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl mx-auto px-6 py-12">

      <header className="text-center mb-8 space-y-2 animate-slide-up">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">DEFENSE TIMEKEEPER</h1>
        <p className="text-sm md:text-base font-medium opacity-50 uppercase tracking-[0.3em]">Session Configuration</p>
      </header>

      {/* Presets Toolbar */}
      <div className={`w-full flex flex-col md:flex-row items-center justify-between gap-4 p-4 mb-8 rounded-lg border bg-opacity-5 animate-slide-up delay-100 ${themeClasses}`}>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <FolderOpen size={18} className="opacity-50" />
          <span className="text-sm font-bold uppercase tracking-wider opacity-70 whitespace-nowrap">Load Preset:</span>
          <div className="relative flex-1 md:w-64">
            <select
              value={selectedPresetId}
              onChange={(e) => handleLoadPreset(e.target.value)}
              className={`w-full appearance-none bg-transparent font-bold py-1 pr-8 outline-none border-b border-transparent hover:border-current transition-colors ${!selectedPresetId ? 'opacity-50 italic' : ''}`}
            >
              <option value="" disabled className={selectOptionClass}>-- Select / Custom --</option>
              {presets.map(p => (
                <option key={p.id} value={p.id} className={selectOptionClass}>
                  {p.name} {p.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none" size={14} />
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
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
          {isNamingPreset ? (
            <div className="flex items-center gap-2 animate-in slide-in-from-right duration-200">
              <input
                autoFocus
                type="text"
                placeholder="Preset Name..."
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                className={`bg-transparent border-b border-current w-32 md:w-40 py-1 text-sm outline-none ${inputColor}`}
              />
              <button onClick={handleSavePreset} className="p-1 hover:text-green-500 transition-colors"><Check size={18} /></button>
              <button onClick={() => setIsNamingPreset(false)} className="p-1 hover:text-red-500 transition-colors"><X size={18} /></button>
            </div>
          ) : (
            <button
              onClick={() => setIsNamingPreset(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wide ${themeClasses} ${optionHoverBg} hover:border-current transition-all backdrop-blur-sm`}
            >
              <Save size={14} />
              <span>Save Config</span>
            </button>
          )}
        </div>
      </div>

      <div className={`flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-8 p-4 rounded-lg border bg-opacity-5 animate-slide-up delay-150 ${themeClasses}`}>
        {/* Current Presenter (Start At) */}
        <div className="flex items-center gap-3">
          <Users size={20} className="opacity-70" />
          <span className="text-sm font-bold uppercase tracking-wider opacity-70">Start At Presenter:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPresenterCountChange(Math.max(1, presenterCount - 1))}
              className={`p-1 rounded transition-colors opacity-50 hover:opacity-100 ${spinBtnHover}`}
            >
              <ChevronDown size={20} />
            </button>
            <input
              type="number"
              min="1"
              value={presenterCount}
              onChange={(e) => onPresenterCountChange(Math.max(1, parseInt(e.target.value) || 1))}
              className={`text-2xl font-mono font-bold w-16 text-center bg-transparent outline-none p-0 leading-none appearance-none ${inputColor}`}
              style={{ MozAppearance: 'textfield' }}
            />
            <button
              onClick={() => onPresenterCountChange(presenterCount + 1)}
              className={`p-1 rounded transition-colors opacity-50 hover:opacity-100 ${spinBtnHover}`}
            >
              <ChevronUp size={20} />
            </button>
          </div>
        </div>

        <div className="hidden md:block h-8 w-px bg-current opacity-20"></div>

        {/* Total Presenters Limit */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold uppercase tracking-wider opacity-70">Total Presenters:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onConfigChange({ ...config, totalPresenters: Math.max(1, (config.totalPresenters || 10) - 1) })}
              className={`p-1 rounded transition-colors opacity-50 hover:opacity-100 ${spinBtnHover}`}
            >
              <ChevronDown size={20} />
            </button>
            <input
              type="number"
              min="1"
              value={config.totalPresenters || 10}
              onChange={(e) => onConfigChange({ ...config, totalPresenters: Math.max(1, parseInt(e.target.value) || 1) })}
              className={`text-2xl font-mono font-bold w-16 text-center bg-transparent outline-none p-0 leading-none appearance-none ${inputColor}`}
              style={{ MozAppearance: 'textfield' }}
            />
            <button
              onClick={() => onConfigChange({ ...config, totalPresenters: (config.totalPresenters || 10) + 1 })}
              className={`p-1 rounded transition-colors opacity-50 hover:opacity-100 ${spinBtnHover}`}
            >
              <ChevronUp size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Phase Durations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-12">
        {[Phase.PRESENTATION, Phase.Q_AND_A].map((phase, index) => {
          const pKey = phase as Exclude<Phase, Phase.COMPLETE>;
          const seconds = config.phases[pKey].durationSeconds;
          const warningSecs = config.phases[pKey].warningSeconds;
          const isWarningError = warningSecs > 0 && warningSecs >= seconds && seconds > 0;

          const durationMin = Math.floor(seconds / 60);
          const durationSec = seconds % 60;

          const warningMin = Math.floor(warningSecs / 60);
          const warningSec = warningSecs % 60;

          return (
            <div
              key={phase}
              className={`flex flex-col p-6 rounded-xl border ${isWarningError ? 'border-red-500' : themeClasses} relative group transition-all hover:-translate-y-1 hover:shadow-lg hover:border-opacity-50 animate-slide-up`}
              style={{ animationDelay: `${(index + 2) * 100}ms` }}
            >
              <div className="flex items-center gap-2 opacity-50 mb-4">
                <Clock size={16} />
                <span className={`text-xs font-bold uppercase tracking-wider ${isWarningError ? 'text-red-500' : ''}`}>{config.phases[pKey].label}</span>
              </div>

              {/* Duration Input */}
              <div className="flex items-start justify-center gap-4 mb-6">
                <TimeInputGroup
                  value={durationMin}
                  onChange={(v) => handleTimeChange(phase, 'min', v)}
                  onIncrement={() => incrementTime(phase, 'min', 1)}
                  onDecrement={() => incrementTime(phase, 'min', -1)}
                  label="MIN"
                />
                <span className="text-5xl md:text-6xl font-mono font-bold opacity-50 mt-2">:</span>
                <TimeInputGroup
                  value={durationSec}
                  onChange={(v) => handleTimeChange(phase, 'sec', v)}
                  onIncrement={() => incrementTime(phase, 'sec', 1)}
                  onDecrement={() => incrementTime(phase, 'sec', -1)}
                  label="SEC"
                  max={59}
                />
              </div>

              {/* Warning Input */}
              <div className="flex items-center gap-2 pt-2 border-t border-dashed border-opacity-20 border-inherit">
                <BellRing size={14} className={isWarningError ? 'text-red-500' : (warningSecs > 0 ? warningTextClass : "opacity-30")} />
                <span className={`text-xs font-bold uppercase opacity-50 ${isWarningError ? 'text-red-500 opacity-100' : ''}`}>Warn at:</span>
                <div className="flex-1 flex items-center justify-end gap-2">
                  <div className="flex items-center gap-1">
                    <button onClick={() => incrementTime(phase, 'min', 1, true)} className="opacity-30 hover:opacity-100"><ChevronUp size={10} /></button>
                    <input
                      type="number"
                      min="0"
                      value={warningMin}
                      onChange={(e) => handleTimeChange(phase, 'min', e.target.value, true)}
                      className={`w-6 bg-transparent text-right font-mono font-bold outline-none border-b border-transparent hover:border-current focus:border-current transition-colors text-sm ${isWarningError ? 'text-red-500' : (warningSecs > 0 ? warningTextClass : inputColor)}`}
                      style={{ MozAppearance: 'textfield' }}
                    />
                    <button onClick={() => incrementTime(phase, 'min', -1, true)} className="opacity-30 hover:opacity-100"><ChevronDown size={10} /></button>
                  </div>
                  <span className="opacity-50 text-sm">:</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => incrementTime(phase, 'sec', 1, true)} className="opacity-30 hover:opacity-100"><ChevronUp size={10} /></button>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={warningSec < 10 ? `0${warningSec}` : warningSec}
                      onChange={(e) => handleTimeChange(phase, 'sec', e.target.value, true)}
                      className={`w-6 bg-transparent text-left font-mono font-bold outline-none border-b border-transparent hover:border-current focus:border-current transition-colors text-sm ${isWarningError ? 'text-red-500' : (warningSecs > 0 ? warningTextClass : inputColor)}`}
                      style={{ MozAppearance: 'textfield' }}
                    />
                    <button onClick={() => incrementTime(phase, 'sec', -1, true)} className="opacity-30 hover:opacity-100"><ChevronDown size={10} /></button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Options */}
      <div className="flex flex-wrap items-center justify-center gap-6 mb-16 animate-slide-up delay-300">
        <button
          onClick={toggleSound}
          className={`flex items-center gap-3 px-6 py-3 rounded-full border ${themeClasses} ${optionHoverBg} hover:border-current transition-all backdrop-blur-sm`}
        >
          {config.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          <span className="text-sm font-bold uppercase tracking-wider">
            Sound: {config.soundEnabled ? 'On' : 'Off'}
          </span>
        </button>

        <button
          onClick={cycleTickMode}
          className={`flex items-center gap-3 px-6 py-3 rounded-full border ${themeClasses} ${optionHoverBg} hover:border-current transition-all backdrop-blur-sm`}
        >
          <Activity size={20} className={config.tickMode !== TickMode.NONE ? (config.theme === 'ml2025' ? 'text-ml-orange' : "text-blue-500") : "opacity-50"} />
          <span className="text-sm font-bold uppercase tracking-wider">
            Tick: {getTickModeLabel(config.tickMode)}
          </span>
        </button>

        <button
          onClick={toggleAutoAdvance}
          className={`flex items-center gap-3 px-6 py-3 rounded-full border ${themeClasses} ${optionHoverBg} hover:border-current transition-all backdrop-blur-sm`}
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
          transition-all duration-300 hover:scale-105 active:scale-95 animate-slide-up delay-300
          ${startBtnClass}
        `}
      >
        <span>Start Session</span>
        <Play fill="currentColor" size={24} />
      </button>

    </div>
  );
};