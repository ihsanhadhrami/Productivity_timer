export enum FocusMode {
  S1 = 'S1', // 30/5
  S2 = 'S2', // 20/4
  CUSTOM = 'CUSTOM', // User defined
}

export enum TimerPhase {
  FOCUS = 'FOCUS',
  BREAK = 'BREAK',
}

export interface TimerConfig {
  focusTime: number; // in seconds
  breakTime: number; // in seconds
}

export interface SessionStats {
  s1Count: number;
  s2Count: number;
  customCount?: number;
  totalMinutes: number;
  dailyGoal: number; // number of sessions
  date?: string; // for daily tracking
}

export interface SessionHistory {
  id: string;
  type: string;
  duration: number;
  task: string;
  completedAt: string;
  date: string;
}

export type NotificationSound = 'crystals' | 'chime' | 'pulse' | 'bell' | 'synth';