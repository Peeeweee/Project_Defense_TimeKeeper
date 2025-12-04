import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Maximize2, Minimize2, Home, AlertTriangle, Sun, Moon, Palette, ExternalLink } from 'lucide-react';
import { useDefenseTimer } from './hooks/useDefenseTimer';
import { TimerDisplay } from './components/TimerDisplay';
import { Controls } from './components/Controls';
import { PhaseIndicator } from './components/PhaseIndicator';
import { Settings } from './components/Settings';
import { SetupView } from './components/SetupView';
import { LiveView } from './components/LiveView';
import { DEFAULT_CONFIG } from './constants';
import { AppConfig, Phase } from './types';

function App() {
  // Simple routing check
  const isLiveView = window.location.pathname === '/live';

  // Load config from local storage or default
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const saved = localStorage.getItem('defense-timer-config');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [view, setView] = useState<'setup' | 'timer'>('setup');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const timer = useDefenseTimer(config);

  // Persist config
  useEffect(() => {
    localStorage.setItem('defense-timer-config', JSON.stringify(config));
  }, [config]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const toggleTheme = () => {
    setConfig(prev => {
      let nextTheme: 'dark' | 'light' | 'ml2025' = 'dark';
      if (prev.theme === 'dark') nextTheme = 'light';
      else if (prev.theme === 'light') nextTheme = 'ml2025';
      else nextTheme = 'dark';
      
      return { ...prev, theme: nextTheme };
    });
  };

  const handleStartSession = () => {
    timer.resetSession();
    setView('timer');
  };

  const handleReturnToSetupRequest = () => {
    if (timer.currentPhase === Phase.COMPLETE) {
      timer.resetSession();
      setView('setup');
      return;
    }
    setIsExitConfirmOpen(true);
  };

  const confirmReturnToSetup = () => {
    timer.resetSession();
    setView('setup');
    setIsExitConfirmOpen(false);
  };

  const openLiveView = () => {
    window.open('/live', 'DefenseTimerLive', 'width=800,height=600');
  };

  // If we are in Live View mode, render only that component
  if (isLiveView) {
    return <LiveView />;
  }

  // Determine main App container classes based on theme
  let themeClasses = '';
  let iconColor = '';
  let modalBg = '';

  if (config.theme === 'dark') {
    themeClasses = 'bg-black text-white';
    iconColor = 'text-white';
    modalBg = 'bg-zinc-900 text-white border-zinc-700';
  } else if (config.theme === 'light') {
    themeClasses = 'bg-white text-black';
    iconColor = 'text-black';
    modalBg = 'bg-white text-black border-gray-200';
  } else if (config.theme === 'ml2025') {
    // Custom geometric pattern background
    themeClasses = 'bg-pattern-ml2025 text-ml-yellow';
    iconColor = 'text-ml-yellow';
    modalBg = 'bg-ml-bg text-ml-yellow border-ml-yellow/30';
  }

  // Theme Icon Logic
  const ThemeIcon = config.theme === 'dark' ? Sun : config.theme === 'light' ? Palette : Moon;

  return (
    <div className={`min-h-screen w-full flex flex-col theme-transition ${themeClasses} font-mono overflow-hidden`}>
      
      {/* Header */}
      <header className="flex justify-between items-center p-6 md:p-8 z-10 animate-slide-up">
        <div className="flex items-center gap-4">
          <div 
            className="text-sm md:text-base font-bold tracking-widest uppercase opacity-70 cursor-pointer hover:opacity-100 transition-opacity" 
            onClick={() => { if (view === 'timer') handleReturnToSetupRequest(); }}
            title="Return to Setup"
          >
            Defense TimeKeeper
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
           {/* Live View Button */}
           <button 
             onClick={openLiveView}
             className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wide opacity-50 hover:opacity-100 transition-all ${config.theme === 'dark' ? 'border-white/20 hover:bg-white/10' : config.theme === 'ml2025' ? 'border-ml-yellow/30 hover:bg-ml-yellow/10' : 'border-black/20 hover:bg-black/5'}`}
             title="Open Projector View"
           >
             <ExternalLink size={14} />
             <span className="hidden md:inline">Live View</span>
           </button>

           <div className="h-6 w-px bg-current opacity-20"></div>

           {/* Theme Toggle */}
           <button 
             onClick={toggleTheme}
             className={`opacity-50 hover:opacity-100 transition-opacity ${iconColor}`}
             title="Switch Theme"
           >
             <ThemeIcon size={24} />
           </button>

           {/* Home / New Session Button */}
           {view === 'timer' && (
             <button 
               onClick={handleReturnToSetupRequest}
               className={`opacity-50 hover:opacity-100 transition-opacity ${iconColor}`}
               title="Home / New Session"
             >
               <Home size={24} />
             </button>
           )}

           {/* Fullscreen Button */}
           <button 
             onClick={toggleFullscreen}
             className={`opacity-50 hover:opacity-100 transition-opacity ${iconColor}`}
             title="Toggle Fullscreen"
           >
             {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
           </button>

           {/* Settings Button */}
           {view === 'timer' && (
             <button 
              onClick={() => setIsSettingsOpen(true)}
              className={`opacity-50 hover:opacity-100 transition-opacity ${iconColor}`}
              title="Settings"
             >
              <SettingsIcon size={24} />
             </button>
           )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative px-4 w-full">
        
        {view === 'setup' ? (
          <SetupView 
            config={config} 
            onConfigChange={setConfig} 
            onStart={handleStartSession} 
            presenterCount={timer.presenterCount}
            onPresenterCountChange={timer.setPresenterCount}
          />
        ) : (
          <>
            <PhaseIndicator currentPhase={timer.currentPhase} theme={config.theme} />
            
            <TimerDisplay 
              key={timer.currentPhase}
              timeLeft={timer.timeLeft} 
              totalDuration={
                timer.currentPhase === Phase.COMPLETE 
                  ? 0 
                  : config.phases[timer.currentPhase as Exclude<Phase, Phase.COMPLETE>].durationSeconds
              }
              warningSeconds={
                timer.currentPhase === Phase.COMPLETE 
                ? 0 
                : config.phases[timer.currentPhase as Exclude<Phase, Phase.COMPLETE>].warningSeconds
              }
              phase={timer.currentPhase} 
              theme={config.theme}
            />

            <Controls 
              isRunning={timer.isRunning}
              isPaused={timer.isPaused}
              phase={timer.currentPhase}
              onStart={timer.start}
              onPause={timer.pause}
              onReset={handleReturnToSetupRequest}
              onRestartSession={() => timer.resetSession()}
              onRestartPhase={timer.restartPhase}
              onSkip={timer.skipPhase}
              theme={config.theme}
            />
          </>
        )}

      </main>

      {/* Footer / Status */}
      <footer className="p-6 text-center text-xs opacity-30 uppercase tracking-widest animate-slide-up delay-200">
         {view === 'setup' ? (
           'Configure your session settings'
         ) : (
           <>
             {timer.isRunning ? 'Timer Running' : timer.isPaused ? 'Timer Paused' : 'Ready'}
             {' • '}
             {config.autoAdvance ? 'Auto-Advance On' : 'Manual Advance'}
             {' • '}
             Presenter #{timer.presenterCount}
           </>
         )}
      </footer>

      {/* Settings Modal */}
      <Settings 
        config={config} 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onSave={setConfig}
      />

      {/* Exit Confirmation Modal */}
      {isExitConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-sm rounded-xl shadow-2xl border p-6 ${modalBg} transform scale-100`}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 rounded-full bg-red-500/10 text-red-500">
                <AlertTriangle size={32} />
              </div>
              
              <div>
                <h3 className="text-lg font-bold uppercase tracking-wider mb-2">Start New Session?</h3>
                <p className="text-sm opacity-70">
                  You are about to return to the setup screen. The current session progress will be lost.
                </p>
              </div>

              <div className="flex gap-3 w-full mt-4">
                <button 
                  onClick={() => setIsExitConfirmOpen(false)}
                  className={`flex-1 py-3 rounded-lg font-bold text-sm uppercase tracking-wide border transition-colors ${config.theme === 'dark' ? 'border-white/20 hover:bg-white/10' : config.theme === 'ml2025' ? 'border-ml-yellow/30 hover:bg-ml-yellow/10' : 'border-black/20 hover:bg-black/10'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmReturnToSetup}
                  className="flex-1 py-3 rounded-lg font-bold text-sm uppercase tracking-wide bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg"
                >
                  End Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default App;