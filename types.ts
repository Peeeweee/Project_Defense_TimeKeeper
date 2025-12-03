export enum Phase {
  SETUP = 'SETUP',
  PRESENTATION = 'PRESENTATION',
  Q_AND_A = 'Q_AND_A',
  COMPLETE = 'COMPLETE'
}

export enum TickMode {
  NONE = 'NONE',
  LAST_TEN = 'LAST_TEN',
  EVERY_SECOND = 'EVERY_SECOND'
}

export interface PhaseConfig {
  durationSeconds: number;
  label: string;
}

export interface AppConfig {
  phases: Record<Exclude<Phase, Phase.COMPLETE>, PhaseConfig>;
  theme: 'dark' | 'light';
  soundEnabled: boolean;
  tickMode: TickMode;
  autoAdvance: boolean;
}

export interface TimerState {
  currentPhase: Phase;
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
}