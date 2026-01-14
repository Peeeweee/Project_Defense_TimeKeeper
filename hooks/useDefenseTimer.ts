import { useState, useEffect, useCallback, useRef } from 'react';
import { Phase, AppConfig, TimerState, TickMode } from '../types';
import { PHASE_ORDER } from '../constants';
import { playAlertSound, playTickSound, playWarningSound } from '../utils/sound';

export const useDefenseTimer = (config: AppConfig) => {
  const [timerState, setTimerState] = useState<TimerState>({
    currentPhase: Phase.PRESENTATION,
    timeLeft: config.phases[Phase.PRESENTATION].durationSeconds,
    isRunning: false,
    isPaused: false,
    presenterCount: 1
  });

  const timerRef = useRef<number | null>(null);

  // Sync state to localStorage for Live View
  useEffect(() => {
    localStorage.setItem('defense-timer-state', JSON.stringify(timerState));
  }, [timerState]);

  // When config changes (e.g. settings update), if we are in that phase and not running, update time
  useEffect(() => {
    if (!timerState.isRunning && !timerState.isPaused && timerState.currentPhase !== Phase.COMPLETE) {
      const phaseKey = timerState.currentPhase as Exclude<Phase, Phase.COMPLETE>;
      setTimerState(prev => ({
        ...prev,
        timeLeft: config.phases[phaseKey].durationSeconds
      }));
    }
  }, [config.phases, timerState.currentPhase, timerState.isRunning, timerState.isPaused]);

  const advancePhase = useCallback(() => {
    const currentIndex = PHASE_ORDER.indexOf(timerState.currentPhase);
    const nextPhase = PHASE_ORDER[currentIndex + 1];

    if (nextPhase && nextPhase !== Phase.COMPLETE) {
      // if (config.soundEnabled) playAlertSound(); // User requested to stop sound on transition
      setTimerState(prev => ({
        ...prev,
        currentPhase: nextPhase,
        timeLeft: config.phases[nextPhase as Exclude<Phase, Phase.COMPLETE>].durationSeconds,
        isRunning: config.autoAdvance, // Auto-continue if enabled
        isPaused: !config.autoAdvance,
      }));
    } else {
      // End of cycle (e.g. QnA finished)
      // Check if we should loop to next presenter
      const total = config.totalPresenters || 1;

      if (timerState.presenterCount < total) {
        // Next Presenter
        // if (config.soundEnabled) playAlertSound(); // User requested to stop sound on loop
        setTimerState(prev => ({
          ...prev,
          currentPhase: Phase.PRESENTATION,
          timeLeft: config.phases[Phase.PRESENTATION].durationSeconds,
          isRunning: config.autoAdvance,
          isPaused: !config.autoAdvance,
          presenterCount: prev.presenterCount + 1
        }));
      } else {
        // All Complete
        if (config.soundEnabled) playAlertSound();
        setTimerState(prev => ({
          ...prev,
          currentPhase: Phase.COMPLETE,
          timeLeft: 0,
          isRunning: false,
          isPaused: false
        }));
      }
    }
  }, [timerState.currentPhase, config]);

  const tick = useCallback(() => {
    setTimerState(prev => {
      if (prev.timeLeft <= 0) {
        // Phase finished in this tick
        return prev; // Handled by effect below
      }

      const nextTime = prev.timeLeft - 1;

      const currentPhaseConfig = config.phases[prev.currentPhase as Exclude<Phase, Phase.COMPLETE>];

      if (config.soundEnabled) {
        // Warning Sound
        if (currentPhaseConfig && currentPhaseConfig.warningSeconds > 0 && nextTime === currentPhaseConfig.warningSeconds) {
          playWarningSound();
        }

        // Ticking Sound
        const shouldTick =
          config.tickMode === TickMode.EVERY_SECOND ||
          (config.tickMode === TickMode.LAST_TEN && nextTime <= 10 && nextTime >= 0);

        if (shouldTick) {
          // User requested to remove the "Last second 3 buzz"
          // playTickSound(); 
        }
      }

      return { ...prev, timeLeft: nextTime };
    });
  }, [config.soundEnabled, config.tickMode, config.phases]);

  // Timer interval
  useEffect(() => {
    if (timerState.isRunning && timerState.timeLeft > 0) {
      timerRef.current = window.setInterval(tick, 1000);
    } else if (timerState.timeLeft <= 0 && timerState.isRunning) {
      // Time is up, trigger advance
      advancePhase();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerState.isRunning, timerState.timeLeft, tick, advancePhase]);

  const start = () => setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false }));

  const pause = () => setTimerState(prev => ({ ...prev, isRunning: false, isPaused: true }));

  const resetSession = () => {
    setTimerState(prev => ({
      ...prev,
      currentPhase: Phase.PRESENTATION,
      timeLeft: config.phases[Phase.PRESENTATION].durationSeconds,
      isRunning: false,
      isPaused: false,
    }));
  };

  const restartPhase = () => {
    if (timerState.currentPhase === Phase.COMPLETE) return;
    const phaseKey = timerState.currentPhase as Exclude<Phase, Phase.COMPLETE>;
    setTimerState(prev => ({
      ...prev,
      timeLeft: config.phases[phaseKey].durationSeconds,
      isRunning: false,
      isPaused: false
    }));
  };

  const skipPhase = () => {
    advancePhase();
  };

  const setPresenterCount = (count: number) => {
    setTimerState(prev => ({ ...prev, presenterCount: count }));
  };

  const nextPresenter = () => {
    // if (config.soundEnabled) playAlertSound();
    setTimerState(prev => ({
      ...prev,
      currentPhase: Phase.PRESENTATION,
      timeLeft: config.phases[Phase.PRESENTATION].durationSeconds,
      isRunning: false,
      isPaused: false,
      presenterCount: prev.presenterCount + 1
    }));
  };

  return {
    ...timerState,
    start,
    pause,
    resetSession,
    restartPhase,
    skipPhase,
    setPresenterCount,
    nextPresenter
  };
};