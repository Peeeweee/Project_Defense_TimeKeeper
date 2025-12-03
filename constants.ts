import { AppConfig, Phase, TickMode } from './types';

export const DEFAULT_CONFIG: AppConfig = {
  phases: {
    [Phase.SETUP]: {
      durationSeconds: 5 * 60, // 5 minutes
      warningSeconds: 60, // Warn at 1 minute
      label: 'Setup'
    },
    [Phase.PRESENTATION]: {
      durationSeconds: 20 * 60, // 20 minutes
      warningSeconds: 5 * 60, // Warn at 5 minutes
      label: 'Presentation'
    },
    [Phase.Q_AND_A]: {
      durationSeconds: 15 * 60, // 15 minutes
      warningSeconds: 2 * 60, // Warn at 2 minutes
      label: 'Q&A'
    }
  },
  theme: 'dark', // Default to black mode
  soundEnabled: true,
  tickMode: TickMode.LAST_TEN, // Default to last 10 seconds for utility
  autoAdvance: true
};

export const PHASE_ORDER = [Phase.SETUP, Phase.PRESENTATION, Phase.Q_AND_A, Phase.COMPLETE];