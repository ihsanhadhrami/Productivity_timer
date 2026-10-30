import { useCallback } from 'react';
import { FocusMode, SessionHistory, SessionStats } from '../types';
import { STORAGE_KEYS, StorageCodec, jsonCodec, stringCodec, usePersistentState } from './usePersistentState';

/**
 * Everything the app remembers about completed focus sessions: today's stats,
 * the session history (last 100) and the daily streak. All of it is saved to
 * localStorage, and today's stats start fresh each new day.
 *
 * Usage:
 *   const tracking = useSessionTracking();
 *   tracking.recordFocusSession(FocusMode.S1, 30, 'Write report');
 */

const HISTORY_LIMIT = 100;

// Get today's date string for daily tracking
export const getTodayKey = () => new Date().toISOString().split('T')[0];

const freshStats = (dailyGoal = 5): SessionStats => ({
  s1Count: 0,
  s2Count: 0,
  customCount: 0,
  totalMinutes: 0,
  dailyGoal,
  date: getTodayKey(),
});

// Stats saved on a previous day are discarded
const todayStatsCodec: StorageCodec<SessionStats> = {
  parse: (raw) => {
    const parsed = JSON.parse(raw) as SessionStats;
    return parsed.date === getTodayKey() ? parsed : undefined;
  },
  stringify: (value) => JSON.stringify(value),
};

const streakCodec: StorageCodec<number> = {
  parse: (raw) => parseInt(raw, 10) || 0,
  stringify: (value) => value.toString(),
};

export function useSessionTracking() {
  const [stats, setStats] = usePersistentState<SessionStats>(STORAGE_KEYS.stats, () => freshStats(), todayStatsCodec);
  const [sessionHistory, setSessionHistory] = usePersistentState<SessionHistory[]>(STORAGE_KEYS.history, [], jsonCodec<SessionHistory[]>());
  const [streak, setStreak] = usePersistentState<number>(STORAGE_KEYS.streak, 0, streakCodec);
  const [lastActiveDate, setLastActiveDate] = usePersistentState<string>(STORAGE_KEYS.lastActiveDate, '', stringCodec);

  // Extend the streak if the last session was yesterday, otherwise restart it
  const updateStreak = useCallback(() => {
    const today = getTodayKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (lastActiveDate === today) return; // Already active today, streak continues
    setStreak(prev => (lastActiveDate === yesterday ? prev + 1 : 1));
    setLastActiveDate(today);
  }, [lastActiveDate, setStreak, setLastActiveDate]);

  const recordFocusSession = useCallback((mode: FocusMode, minutes: number, task: string) => {
    setStats(prev => ({
      ...prev,
      s1Count: mode === FocusMode.S1 ? prev.s1Count + 1 : prev.s1Count,
      s2Count: mode === FocusMode.S2 ? prev.s2Count + 1 : prev.s2Count,
      customCount: mode === FocusMode.CUSTOM ? (prev.customCount || 0) + 1 : (prev.customCount || 0),
      totalMinutes: prev.totalMinutes + minutes,
    }));

    const session: SessionHistory = {
      id: Date.now().toString(),
      type: mode,
      duration: minutes,
      task,
      completedAt: new Date().toISOString(),
      date: getTodayKey(),
    };
    setSessionHistory(prev => [session, ...prev].slice(0, HISTORY_LIMIT));

    updateStreak();
  }, [setStats, setSessionHistory, updateStreak]);

  const resetStats = useCallback(() => {
    setStats(prev => freshStats(prev.dailyGoal));
  }, [setStats]);

  const updateDailyGoal = useCallback((goal: number) => {
    setStats(prev => ({ ...prev, dailyGoal: goal }));
  }, [setStats]);

  const clearHistory = useCallback(() => setSessionHistory([]), [setSessionHistory]);

  const todaySessions = sessionHistory.filter(s => s.date === getTodayKey());

  return {
    stats,
    sessionHistory,
    todaySessions,
    streak,
    recordFocusSession,
    resetStats,
    updateDailyGoal,
    clearHistory,
  };
}
