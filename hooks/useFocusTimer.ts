import { useCallback, useEffect, useRef, useState } from 'react';
import { FocusMode, TimerPhase } from '../types';

/**
 * The focus/break countdown.
 *
 * Counts down in a Web Worker so it keeps accurate time in background tabs
 * (falls back to setInterval), holds a screen wake lock while running, and
 * moves from focus to break when time runs out. The timer stops at the end of
 * each phase and waits for the user to start the next one.
 *
 * Usage:
 *   const timer = useFocusTimer({
 *     onFocusComplete: (mode, minutes) => { ... },
 *     onBreakComplete: () => { ... },
 *   });
 *   timer.setIsRunning(true); timer.skip(); timer.reset(); timer.setMode(FocusMode.S2);
 */

// Durations in minutes. CUSTOM is user-defined, see customFocusTime/customBreakTime.
export const TIMER_PRESETS = {
  [FocusMode.S1]: { focus: 30, break: 5 },
  [FocusMode.S2]: { focus: 60, break: 10 },
} as const;

export interface CustomDurations {
  customFocusTime: number;
  customBreakTime: number;
}

// Length of a phase in minutes
export const getPhaseMinutes = (mode: FocusMode, phase: TimerPhase, custom: CustomDurations) => {
  const durations = mode === FocusMode.CUSTOM
    ? { focus: custom.customFocusTime, break: custom.customBreakTime }
    : TIMER_PRESETS[mode];
  return phase === TimerPhase.FOCUS ? durations.focus : durations.break;
};

interface FocusTimerCallbacks {
  onFocusComplete: (mode: FocusMode, minutes: number) => void;
  onBreakComplete: () => void;
}

export function useFocusTimer(callbacks: FocusTimerCallbacks) {
  const [mode, setMode] = useState<FocusMode>(FocusMode.S1);
  const [phase, setPhase] = useState<TimerPhase>(TimerPhase.FOCUS);
  const [isRunning, setIsRunning] = useState(false);

  // Custom timer settings
  const [customFocusTime, setCustomFocusTime] = useState(25);
  const [customBreakTime, setCustomBreakTime] = useState(5);

  const getPhaseSeconds = (m: FocusMode, p: TimerPhase) =>
    getPhaseMinutes(m, p, { customFocusTime, customBreakTime }) * 60;

  const [timeLeft, setTimeLeft] = useState(() => getPhaseSeconds(mode, phase));

  // Latest callbacks, so completion handling never sees a stale closure
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  // Web Worker and Wake Lock refs for background timer
  const timerWorkerRef = useRef<Worker | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Initialize Web Worker for background timer
  useEffect(() => {
    console.log('🏭 Initializing Web Worker...');

    try {
      timerWorkerRef.current = new Worker('/timer-worker.js');
      console.log('✅ Timer Web Worker initialized');

      // Handle messages from worker
      timerWorkerRef.current.onmessage = (e) => {
        try {
          if (!e || !e.data) {
            console.warn('⚠️  Invalid message from worker');
            return;
          }

          const { type, timeLeft: workerTimeLeft, error } = e.data;

          if (type === 'TICK') {
            setTimeLeft(workerTimeLeft);
          } else if (type === 'COMPLETE') {
            console.log('✅ Timer completed (from worker)');
            setTimeLeft(0);
          } else if (type === 'ERROR') {
            console.error('❌ Worker error:', error);
          } else {
            console.warn('⚠️  Unknown message type from worker:', type);
          }
        } catch (msgError) {
          console.error('❌ Error handling worker message:', msgError);
        }
      };

      timerWorkerRef.current.onerror = (error) => {
        console.error('❌ Timer Worker error:', error);
      };

    } catch (e) {
      console.warn('⚠️  Web Worker not supported or failed to load, using fallback timer:', e);
      // Set to null to trigger fallback
      timerWorkerRef.current = null;
    }

    return () => {
      if (timerWorkerRef.current) {
        console.log('🧹 Terminating Web Worker');
        try {
          timerWorkerRef.current.terminate();
        } catch (e) {
          console.warn('⚠️  Error terminating worker:', e);
        }
        timerWorkerRef.current = null;
      }
    };
  }, []);

  // Wake Lock API - Prevent screen from turning off while timer is running
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('Wake Lock activated - screen will stay on');

        if (wakeLockRef.current) {
          wakeLockRef.current.addEventListener('release', () => {
            console.log('Wake Lock released');
          });
        }
      } catch (e) {
        console.warn('Wake Lock request failed:', e);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
      console.log('Wake Lock manually released');
    }
  }, []);

  // When returning to the page while running: resync with the worker and re-acquire the wake lock
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden || !isRunning) return;
      if (timerWorkerRef.current) {
        console.log('🔄 Syncing timer state after tab visibility change');
        timerWorkerRef.current.postMessage({ type: 'getStatus' });
      }
      requestWakeLock();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning, requestWakeLock]);

  // Reset timer when mode changes
  useEffect(() => {
    setIsRunning(false);
    setPhase(TimerPhase.FOCUS);
    setTimeLeft(getPhaseSeconds(mode, TimerPhase.FOCUS));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, customFocusTime]);

  // Timer Logic - Use Web Worker if available, fallback to setInterval
  useEffect(() => {
    let fallbackInterval: number | undefined;

    if (isRunning && timeLeft > 0) {
      // Request wake lock to keep screen on
      requestWakeLock();

      if (timerWorkerRef.current) {
        // Use Web Worker for accurate background timing
        timerWorkerRef.current.postMessage({ type: 'START', payload: { timeLeft } });
      } else {
        // Fallback to regular interval
        fallbackInterval = window.setInterval(() => {
          setTimeLeft((prev) => prev - 1);
        }, 1000);
      }
    } else if (!isRunning) {
      // Pause or stop
      if (timerWorkerRef.current) {
        timerWorkerRef.current.postMessage({ type: 'PAUSE' });
      }
      releaseWakeLock();
    }

    // Handle timer completion
    if (isRunning && timeLeft === 0) {
      if (phase === TimerPhase.FOCUS) {
        // Focus completed - switch to break and wait for user to acknowledge
        callbacksRef.current.onFocusComplete(mode, getPhaseMinutes(mode, TimerPhase.FOCUS, { customFocusTime, customBreakTime }));
        setPhase(TimerPhase.BREAK);
        setTimeLeft(getPhaseSeconds(mode, TimerPhase.BREAK));
      } else {
        // Break completed - stop, session complete
        callbacksRef.current.onBreakComplete();
      }
      setIsRunning(false);
      releaseWakeLock();
    }

    return () => {
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, timeLeft, mode, phase, customFocusTime, customBreakTime, requestWakeLock, releaseWakeLock]);

  // Sets the countdown and tells the worker, stopping the timer
  const jumpTo = (nextPhase: TimerPhase) => {
    const seconds = getPhaseSeconds(mode, nextPhase);
    setPhase(nextPhase);
    setTimeLeft(seconds);
    setIsRunning(false);
    if (timerWorkerRef.current) {
      timerWorkerRef.current.postMessage({ type: 'RESET', payload: { timeLeft: seconds } });
    }
    releaseWakeLock();
  };

  // Skip to the next phase (break after focus, a new focus after break)
  const skip = () => jumpTo(phase === TimerPhase.FOCUS ? TimerPhase.BREAK : TimerPhase.FOCUS);

  // Restart the current phase
  const reset = () => jumpTo(phase);

  return {
    mode, setMode,
    phase,
    timeLeft,
    isRunning, setIsRunning,
    skip, reset,
    customFocusTime, setCustomFocusTime,
    customBreakTime, setCustomBreakTime,
  };
}
