import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Maximize2, Minimize2, Home, AlertTriangle } from 'lucide-react';
import { useDefenseTimer } from './hooks/useDefenseTimer';
import { TimerDisplay } from './components/TimerDisplay';
import { Controls } from './components/Controls';
import { PhaseIndicator } from './components/PhaseIndicator';
import { Settings } from './components/Settings';
import { SetupView } from './components/SetupView';
import { DEFAULT_CONFIG } from './constants';
import { AppConfig, Phase } from './types';

function App() {
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

  const handleStartSession = () => {
    // Reset timer to ensure it picks up the latest config values for the start phase
    timer.resetSession();
    setView('timer');
  };

  const handleReturnToSetupRequest = () => {
    // If the session is already complete, we can just go back without confirmation
    // as there is no active progress to lose.
    if (timer.currentPhase === Phase.COMPLETE) {
      timer.resetSession();
      setView('setup');
      return;
    }

    // Otherwise, show the non-blocking modal so the timer continues in background
    setIsExitConfirmOpen(true);
  };

  const confirmReturnToSetup = () => {
    timer.resetSession();
    setView('setup');
    setIsExitConfirmOpen(false);
  };

  const themeClasses = config.theme === 'dark' 
    ? 'bg-black text-white' 
    : 'bg-white text-black';

  const iconColor = config.theme === 'dark' ? 'text-white' : 'text-black';
  const modalBg = config.theme === 'dark' ? 'bg-zinc-900 text-white border-zinc-700' : 'bg-white text-black border-gray-200';

  return (
    <div className={`min-h-screen w-full flex flex-col theme-transition ${themeClasses} font-mono overflow-hidden`}>
      
      {/* Header */}
      <header className="flex justify-between items-center p-6 md:p-8 z-10">
        <div className="flex items-center gap-4">
          <div 
            className="text-sm md:text-base font-bold tracking-widest uppercase opacity-70 cursor-pointer hover:opacity-100 transition-opacity" 
            onClick={() => { if (view === 'timer') handleReturnToSetupRequest(); }}
            title="Return to Setup"
          >
            Defense TimeKeeper
          </div>
        </div>
        
        <div className="flex gap-4">
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

           {/* Settings Button (Only visible in Timer view to adjust mid-session) */}
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
          />
        ) : (
          <>
            <PhaseIndicator currentPhase={timer.currentPhase} theme={config.theme} />
            
            <TimerDisplay 
              timeLeft={timer.timeLeft} 
              totalDuration={
                timer.currentPhase === Phase.COMPLETE 
                  ? 0 
                  : config.phases[timer.currentPhase as Exclude<Phase, Phase.COMPLETE>].durationSeconds
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
              onRestartPhase={timer.restartPhase}
              onSkip={timer.skipPhase}
              theme={config.theme}
            />
          </>
        )}

      </main>

      {/* Footer / Status */}
      <footer className="p-6 text-center text-xs opacity-30 uppercase tracking-widest">
         {view === 'setup' ? (
           'Configure your session settings'
         ) : (
           <>
             {timer.isRunning ? 'Timer Running' : timer.isPaused ? 'Timer Paused' : 'Ready'}
             {' • '}
             {config.autoAdvance ? 'Auto-Advance On' : 'Manual Advance'}
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

      {/* Exit Confirmation Modal (Non-blocking) */}
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
                  className={`flex-1 py-3 rounded-lg font-bold text-sm uppercase tracking-wide border transition-colors ${config.theme === 'dark' ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10'}`}
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