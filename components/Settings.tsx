import React, { useState } from 'react';
import { AppConfig, Phase, TickMode } from '../types';
import { X, Check, ChevronDown, BellRing } from 'lucide-react';

interface SettingsProps {
  config: AppConfig;
  onSave: (newConfig: AppConfig) => void;
  onClose: () => void;
  isOpen: boolean;
}

type TimeUnit = 'sec' | 'min' | 'hr' | 'day';

const UNIT_MULTIPLIERS: Record<TimeUnit, number> = {
  sec: 1,
  min: 60,
  hr: 3600,
  day: 86400
};

export const Settings: React.FC<SettingsProps> = ({ config, onSave, onClose, isOpen }) => {
  const [localConfig, setLocalConfig] = React.useState<AppConfig>(config);
  
  const [units, setUnits] = useState<Record<string, TimeUnit>>({
    [Phase.PRESENTATION]: 'min',
    [Phase.Q_AND_A]: 'min'
  });

  const [warningUnits, setWarningUnits] = useState<Record<string, TimeUnit>>({
    [Phase.PRESENTATION]: 'min',
    [Phase.Q_AND_A]: 'min'
  });

  React.useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  if (!isOpen) return null;

  const handleValueChange = (phase: Phase, valStr: string, isWarning = false) => {
    if (phase === Phase.COMPLETE) return;
    let val = parseFloat(valStr);
    if (valStr.trim() === '') val = 0;
    if (isNaN(val) || val < 0) return;

    const unitMap = isWarning ? warningUnits : units;
    const unit = unitMap[phase] || 'min';
    const multiplier = UNIT_MULTIPLIERS[unit];
    const totalSeconds = val * multiplier;
    const pKey = phase as Exclude<Phase, Phase.COMPLETE>;

    setLocalConfig(prev => ({
      ...prev,
      phases: {
        ...prev.phases,
        [phase]: {
          ...prev.phases[pKey],
          [isWarning ? 'warningSeconds' : 'durationSeconds']: totalSeconds
        }
      }
    }));
  };

  const handleUnitChange = (phase: Phase, newUnit: TimeUnit, isWarning = false) => {
    if (isWarning) setWarningUnits(prev => ({ ...prev, [phase]: newUnit }));
    else setUnits(prev => ({ ...prev, [phase]: newUnit }));
  };

  const handleToggle = (key: keyof Pick<AppConfig, 'autoAdvance' | 'soundEnabled'>) => {
    setLocalConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTickModeChange = (mode: TickMode) => {
    setLocalConfig(prev => ({ ...prev, tickMode: mode }));
  };

  const handleThemeChange = (theme: 'dark' | 'light' | 'ml2025') => {
    setLocalConfig(prev => ({ ...prev, theme }));
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  // Styles for the modal itself should be neutral or follow current theme
  const isDark = localConfig.theme === 'dark' || localConfig.theme === 'ml2025';
  const bgColor = isDark ? 'bg-zinc-900' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-black';
  const borderColor = isDark ? 'border-zinc-700' : 'border-gray-200';
  const inputBg = isDark ? 'bg-black' : 'bg-gray-50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`w-full max-w-md ${bgColor} ${textColor} rounded-xl shadow-2xl border ${borderColor} overflow-hidden flex flex-col max-h-[90vh]`}>
        
        <div className={`p-6 border-b ${borderColor} flex justify-between items-center`}>
          <h2 className="text-xl font-bold uppercase tracking-wider">Configuration</h2>
          <button onClick={onClose} className="opacity-60 hover:opacity-100">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* Durations */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold opacity-50 uppercase">Phase Settings</h3>
            {[Phase.PRESENTATION, Phase.Q_AND_A].map((phase) => {
               const pKey = phase as Exclude<Phase, Phase.COMPLETE>;
               const currentUnit = units[phase];
               const seconds = localConfig.phases[pKey].durationSeconds;
               const displayValue = parseFloat((seconds / UNIT_MULTIPLIERS[currentUnit]).toFixed(2));
               const currentWarningUnit = warningUnits[phase];
               const warningSecs = localConfig.phases[pKey].warningSeconds;
               const warningDisplayValue = parseFloat((warningSecs / UNIT_MULTIPLIERS[currentWarningUnit]).toFixed(2));

               return (
                <div key={phase} className={`flex flex-col gap-2 p-3 rounded-lg border ${borderColor} ${inputBg}`}>
                  <div className="flex items-center justify-between gap-4">
                    <label className="capitalize font-medium min-w-[100px]">{localConfig.phases[pKey].label}</label>
                    <div className={`flex-1 flex items-center border-b ${borderColor} border-opacity-30`}>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={displayValue === 0 && seconds === 0 ? '' : displayValue}
                        placeholder="0"
                        onChange={(e) => handleValueChange(phase, e.target.value)}
                        className={`w-full p-2 bg-transparent text-right font-mono font-bold outline-none`}
                      />
                      <div className="relative border-l border-inherit pl-1">
                        <select 
                          value={currentUnit}
                          onChange={(e) => handleUnitChange(phase, e.target.value as TimeUnit)}
                          className={`appearance-none bg-transparent pl-2 pr-6 py-2 text-xs font-bold uppercase cursor-pointer outline-none ${textColor}`}
                        >
                           <option value="sec" className="text-black">sec</option>
                           <option value="min" className="text-black">min</option>
                           <option value="hr" className="text-black">hr</option>
                           <option value="day" className="text-black">day</option>
                        </select>
                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" size={12} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 mt-1">
                     <BellRing size={12} className={`opacity-50 ${warningSecs > 0 ? 'text-amber-500 opacity-100' : ''}`} />
                     <span className="text-[10px] font-bold uppercase opacity-50">Warn at:</span>
                     <div className="flex w-24 border-b border-dashed border-zinc-500/30">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={warningDisplayValue === 0 && warningSecs === 0 ? '' : warningDisplayValue}
                          placeholder="0"
                          onChange={(e) => handleValueChange(phase, e.target.value, true)}
                          className="w-full bg-transparent text-right text-xs font-mono font-bold outline-none p-1"
                        />
                        <select 
                          value={currentWarningUnit}
                          onChange={(e) => handleUnitChange(phase, e.target.value as TimeUnit, true)}
                          className={`appearance-none bg-transparent pl-1 text-[10px] font-bold uppercase cursor-pointer outline-none ${textColor}`}
                        >
                           <option value="sec" className="text-black">s</option>
                           <option value="min" className="text-black">m</option>
                        </select>
                     </div>
                  </div>
                </div>
               );
            })}
          </div>

          {/* Appearance */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold opacity-50 uppercase">Appearance</h3>
            <div className={`grid grid-cols-3 gap-2 p-1 rounded-lg border ${borderColor} ${inputBg}`}>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-2 rounded text-xs font-bold transition-colors ${localConfig.theme === 'dark' ? 'bg-zinc-800 text-white shadow-sm' : 'opacity-50'}`}
              >
                Dark
              </button>
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-2 rounded text-xs font-bold transition-colors ${localConfig.theme === 'light' ? 'bg-white text-black shadow-sm border border-gray-200' : 'opacity-50'}`}
              >
                Light
              </button>
              <button
                onClick={() => handleThemeChange('ml2025')}
                className={`p-2 rounded text-xs font-bold transition-colors ${localConfig.theme === 'ml2025' ? 'bg-[#450a0f] text-[#fbbf24] shadow-sm border border-[#fbbf24]' : 'opacity-50'}`}
              >
                ML'25
              </button>
            </div>
          </div>

          {/* Behavior */}
          <div className="space-y-4">
             <h3 className="text-sm font-bold opacity-50 uppercase">Behavior</h3>
             
             <label className="flex items-center justify-between cursor-pointer">
               <span className="font-medium">Auto-Advance Phases</span>
               <div 
                 onClick={() => handleToggle('autoAdvance')}
                 className={`w-12 h-6 rounded-full relative transition-colors ${localConfig.autoAdvance ? 'bg-green-500' : 'bg-gray-400'}`}
               >
                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${localConfig.autoAdvance ? 'left-7' : 'left-1'}`} />
               </div>
             </label>

             <label className="flex items-center justify-between cursor-pointer">
               <span className="font-medium">Phase End Alerts</span>
               <div 
                 onClick={() => handleToggle('soundEnabled')}
                 className={`w-12 h-6 rounded-full relative transition-colors ${localConfig.soundEnabled ? 'bg-green-500' : 'bg-gray-400'}`}
               >
                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${localConfig.soundEnabled ? 'left-7' : 'left-1'}`} />
               </div>
             </label>

             <div className="space-y-2">
               <span className="font-medium block">Countdown Ticking</span>
               <div className={`grid grid-cols-3 gap-2 p-1 rounded-lg border ${borderColor} ${inputBg}`}>
                {[
                  { label: 'Off', val: TickMode.NONE },
                  { label: 'Last 10s', val: TickMode.LAST_TEN },
                  { label: 'Always', val: TickMode.EVERY_SECOND }
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => handleTickModeChange(opt.val)}
                    className={`
                      p-2 rounded text-xs font-bold uppercase transition-colors
                      ${localConfig.tickMode === opt.val 
                        ? (isDark ? 'bg-zinc-800 text-white' : 'bg-white text-black shadow-sm') 
                        : 'opacity-50 hover:opacity-100'}
                    `}
                  >
                    {opt.label}
                  </button>
                ))}
               </div>
             </div>
          </div>
        </div>

        <div className={`p-6 border-t ${borderColor} bg-opacity-50`}>
          <button 
            onClick={handleSave}
            className={`w-full py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}
          >
            <Check size={20} />
            APPLY CHANGES
          </button>
        </div>

      </div>
    </div>
  );
};