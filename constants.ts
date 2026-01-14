import { AppConfig, Phase, TickMode, Preset } from './types';

export const DEFAULT_CONFIG: AppConfig = {
  phases: {
    [Phase.PRESENTATION]: {
      durationSeconds: 10 * 60, // 10 minutes
      warningSeconds: 60, // Warn at 1 minute
      label: 'Setup & Presentation'
    },
    [Phase.Q_AND_A]: {
      durationSeconds: 5 * 60, // 5 minutes
      warningSeconds: 60, // Warn at 1 minute
      label: 'Q&A'
    }
  },
  theme: 'dark', // Default to black mode
  soundEnabled: true,
  tickMode: TickMode.LAST_TEN, // Default to last 10 seconds for utility
  autoAdvance: true,
  totalPresenters: 10
};

export const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'default_standard',
    name: 'Standard Defense',
    isDefault: true,
    config: DEFAULT_CONFIG
  },
  {
    id: 'default_short',
    name: 'Short Practice',
    isDefault: true,
    config: {
      ...DEFAULT_CONFIG,
      phases: {
        [Phase.PRESENTATION]: {
          durationSeconds: 5 * 60,
          warningSeconds: 30,
          label: 'Setup & Presentation'
        },
        [Phase.Q_AND_A]: {
          durationSeconds: 2 * 60,
          warningSeconds: 30,
          label: 'Q&A'
        }
      }
    }
  },
  {
    id: 'default_long',
    name: 'Extended Session',
    isDefault: true,
    config: {
      ...DEFAULT_CONFIG,
      phases: {
        [Phase.PRESENTATION]: {
          durationSeconds: 20 * 60,
          warningSeconds: 120,
          label: 'Setup & Presentation'
        },
        [Phase.Q_AND_A]: {
          durationSeconds: 10 * 60,
          warningSeconds: 60,
          label: 'Q&A'
        }
      }
    }
  }
];

export const PHASE_ORDER = [Phase.PRESENTATION, Phase.Q_AND_A, Phase.COMPLETE];