export enum FocusMode {
  S1 = 'S1', // 30/5
  S2 = 'S2', // 40/6
}

export interface TimerConfig {
  focusTime: number; // in seconds
  breakTime: number; // in seconds
}

export interface SessionStats {
  s1Count: number;
  s2Count: number;
  totalMinutes: number;
  dailyGoal: number; // number of sessions
}