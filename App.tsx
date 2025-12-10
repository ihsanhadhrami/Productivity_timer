import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './Components/sidebar';
import Header from './Components/Header';
import TimerDisplay from './Components/TimerDisplay';
import StatsPanel from './Components/Statspanel';
import { FocusMode, TimerPhase, SessionStats, SessionHistory, NotificationSound } from './types';
import { Volume2, Check, RotateCcw, Trash2, Sun, Moon, Flame, X, PartyPopper, Coffee, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

// Toast Notification Types
interface ToastNotification {
  id: string;
  type: 'focus-complete' | 'break-complete' | 'info' | 'success' | 'warning';
  title: string;
  message: string;
  icon: React.ReactNode;
}

// Timer configurations
const TIMER_CONFIG = {
  [FocusMode.S1]: { focus: 30 * 60, break: 5 * 60 },  // 30 min focus, 5 min break
  [FocusMode.S2]: { focus: 20 * 60, break: 4 * 60 },  // 20 min focus, 4 min break
  custom: { focus: 25 * 60, break: 5 * 60 },  // Custom default
};

// Local Storage Keys
const STORAGE_KEYS = {
  stats: 'ihsan_timer_stats',
  focusTask: 'ihsan_focus_task',
  history: 'ihsan_session_history',
  customTimer: 'ihsan_custom_timer',
  theme: 'ihsan_theme',
  dailyGoal: 'ihsan_daily_goal',
  notificationSound: 'ihsan_notification_sound',
  streak: 'ihsan_streak',
  lastActiveDate: 'ihsan_last_active_date',
};

// Notification Sound Options
const NOTIFICATION_SOUNDS: { id: NotificationSound; name: string; description: string }[] = [
  { id: 'crystals', name: 'Crystals', description: 'iPhone-style melody' },
  { id: 'chime', name: 'Chime', description: 'Gentle bell chime' },
  { id: 'pulse', name: 'Pulse', description: 'Soft pulse beat' },
  { id: 'bell', name: 'Bell', description: 'Classic bell ring' },
  { id: 'synth', name: 'Synth Wave', description: 'Electronic tone' },
];

// Get today's date string for daily tracking
const getTodayKey = () => new Date().toISOString().split('T')[0];

// Safe localStorage helpers with error handling
const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`Failed to read from localStorage: ${key}`, e);
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Failed to write to localStorage: ${key}`, e);
  }
};

const safeParseJSON = <T,>(json: string | null, fallback: T): T => {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    console.warn('Failed to parse JSON:', e);
    return fallback;
  }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mode, setMode] = useState<FocusMode>(FocusMode.S1);
  const [phase, setPhase] = useState<TimerPhase>(TimerPhase.FOCUS);
  const [isRunning, setIsRunning] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  
  // Theme state
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const saved = safeGetItem(STORAGE_KEYS.theme);
    return saved !== 'light';
  });
  
  // Streak counter
  const [streak, setStreak] = useState(() => {
    const saved = safeGetItem(STORAGE_KEYS.streak);
    return saved ? parseInt(saved, 10) || 0 : 0;
  });
  
  const [lastActiveDate, setLastActiveDate] = useState(() => {
    return safeGetItem(STORAGE_KEYS.lastActiveDate) || '';
  });
  
  // Custom timer settings
  const [customFocusTime, setCustomFocusTime] = useState(25);
  const [customBreakTime, setCustomBreakTime] = useState(5);
  
  // Notification sound
  const [selectedSound, setSelectedSound] = useState<NotificationSound>(() => {
    const saved = safeGetItem(STORAGE_KEYS.notificationSound);
    const validSounds: NotificationSound[] = ['crystals', 'chime', 'pulse', 'bell', 'synth'];
    return validSounds.includes(saved as NotificationSound) ? (saved as NotificationSound) : 'crystals';
  });
  
  // Focus task
  const [focusTask, setFocusTask] = useState(() => {
    const saved = safeGetItem(STORAGE_KEYS.focusTask);
    return saved || 'What are you working on?';
  });
  
  // Session history
  const [sessionHistory, setSessionHistory] = useState<SessionHistory[]>(() => {
    const saved = safeGetItem(STORAGE_KEYS.history);
    return safeParseJSON<SessionHistory[]>(saved, []);
  });
  
  // Refs for audio context and interval
  const audioContextRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<number | null>(null);
  const sharedAudioContextRef = useRef<AudioContext | null>(null); // Persistent context for mobile
  
  // Toast notifications state
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  
  // Timer State
  const getInitialTime = (m: FocusMode, p: TimerPhase) => {
    if (m === FocusMode.CUSTOM) {
      return p === TimerPhase.FOCUS ? customFocusTime * 60 : customBreakTime * 60;
    }
    return p === TimerPhase.FOCUS ? TIMER_CONFIG[m].focus : TIMER_CONFIG[m].break;
  };
  const [timeLeft, setTimeLeft] = useState(getInitialTime(mode, phase));

  // Stats with localStorage
  const [stats, setStats] = useState<SessionStats>(() => {
    const saved = safeGetItem(STORAGE_KEYS.stats);
    const defaultStats: SessionStats = {
      s1Count: 0,
      s2Count: 0,
      customCount: 0,
      totalMinutes: 0,
      dailyGoal: 5,
      date: getTodayKey()
    };
    const parsed = safeParseJSON<SessionStats>(saved, defaultStats);
    // Check if stats are from today
    if (parsed.date === getTodayKey()) {
      return parsed;
    }
    return defaultStats;
  });

  // Save to localStorage when stats change
  useEffect(() => {
    safeSetItem(STORAGE_KEYS.stats, JSON.stringify(stats));
  }, [stats]);

  // Save focus task to localStorage
  useEffect(() => {
    safeSetItem(STORAGE_KEYS.focusTask, focusTask);
  }, [focusTask]);

  // Save session history to localStorage
  useEffect(() => {
    safeSetItem(STORAGE_KEYS.history, JSON.stringify(sessionHistory));
  }, [sessionHistory]);

  // Save selected sound to localStorage
  useEffect(() => {
    safeSetItem(STORAGE_KEYS.notificationSound, selectedSound);
  }, [selectedSound]);

  // Save theme to localStorage
  useEffect(() => {
    safeSetItem(STORAGE_KEYS.theme, isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

  // Save streak to localStorage
  useEffect(() => {
    safeSetItem(STORAGE_KEYS.streak, streak.toString());
  }, [streak]);

  // Save last active date
  useEffect(() => {
    safeSetItem(STORAGE_KEYS.lastActiveDate, lastActiveDate);
  }, [lastActiveDate]);

  // Check and update streak on app load and when completing a session
  const updateStreak = useCallback(() => {
    const today = getTodayKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (lastActiveDate === today) {
      // Already active today, streak continues
      return;
    } else if (lastActiveDate === yesterday) {
      // Was active yesterday, increment streak
      setStreak(prev => prev + 1);
    } else if (lastActiveDate === '') {
      // First time user
      setStreak(1);
    } else {
      // Streak broken, reset to 1
      setStreak(1);
    }
    setLastActiveDate(today);
  }, [lastActiveDate]);

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkTheme(prev => !prev);
  };

  // Reset timer when mode changes
  useEffect(() => {
    setIsRunning(false);
    setPhase(TimerPhase.FOCUS);
    setTimeLeft(getInitialTime(mode, TimerPhase.FOCUS));
  }, [mode, customFocusTime]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (!isAlarmPlaying) {
            setIsRunning(prev => !prev);
          }
          break;
        case 'KeyR':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            resetTimer();
          }
          break;
        case 'KeyS':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            skipPhase();
          }
          break;
        case 'Escape':
          if (isAlarmPlaying) {
            stopAlarm();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAlarmPlaying]);

  // Browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Show toast notification
  const showToast = useCallback((type: ToastNotification['type'], title: string, message: string) => {
    const icons: Record<ToastNotification['type'], React.ReactNode> = {
      'focus-complete': <PartyPopper className="w-6 h-6" />,
      'break-complete': <Zap className="w-6 h-6" />,
      'info': <Coffee className="w-6 h-6" />,
      'success': <CheckCircle2 className="w-6 h-6" />,
      'warning': <AlertTriangle className="w-6 h-6" />,
    };
    
    const newToast: ToastNotification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      icon: icons[type],
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 5000);
  }, []);
  
  // Dismiss toast
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Send browser notification
  const sendNotification = useCallback((title: string, body: string, type: ToastNotification['type'] = 'info') => {
    // Show in-app toast
    showToast(type, title, body);
    
    // Also send browser notification
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: 'timer-notification',
        });
      }
    } catch (e) {
      console.warn('Failed to send notification:', e);
    }
  }, [showToast]);

  // Unlock AudioContext for mobile browsers (must be called on user interaction)
  const unlockAudioContext = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      // Create or resume shared context
      if (!sharedAudioContextRef.current) {
        sharedAudioContextRef.current = new AudioContextClass();
      }
      
      // Resume if suspended (mobile browsers suspend by default)
      if (sharedAudioContextRef.current.state === 'suspended') {
        sharedAudioContextRef.current.resume();
      }
      
      // Play silent buffer to fully unlock on iOS
      const buffer = sharedAudioContextRef.current.createBuffer(1, 1, 22050);
      const source = sharedAudioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(sharedAudioContextRef.current.destination);
      source.start(0);
    } catch (e) {
      console.warn('Failed to unlock AudioContext:', e);
    }
  }, []);

  // Sound generators for different notification sounds
  const playSound = useCallback((soundType: NotificationSound, preview = false) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('AudioContext not supported');
        return;
      }
      
      // Use shared context for alarm (already unlocked), new one for preview
      let audioContext: AudioContext;
      if (preview) {
        audioContext = new AudioContextClass();
      } else {
        // Reuse shared context or create new one
        if (!sharedAudioContextRef.current || sharedAudioContextRef.current.state === 'closed') {
          sharedAudioContextRef.current = new AudioContextClass();
        }
        audioContext = sharedAudioContextRef.current;
        audioContextRef.current = audioContext;
      }
      
      // Resume if suspended (critical for mobile!)
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log('AudioContext resumed for playback');
        });
      }
    
    const playMelody = () => {
      let notes: { freq: number; duration: number; type?: OscillatorType }[] = [];
      
      switch (soundType) {
        case 'crystals':
          // iPhone Crystals-like melody
          notes = [
            { freq: 1318.5, duration: 0.15 }, // E6
            { freq: 1567.98, duration: 0.15 }, // G6
            { freq: 1760, duration: 0.15 }, // A6
            { freq: 1567.98, duration: 0.15 }, // G6
            { freq: 1318.5, duration: 0.15 }, // E6
            { freq: 1174.66, duration: 0.3 }, // D6
          ];
          break;
        case 'chime':
          // Gentle bell chime
          notes = [
            { freq: 523.25, duration: 0.4 }, // C5
            { freq: 659.25, duration: 0.4 }, // E5
            { freq: 783.99, duration: 0.6 }, // G5
          ];
          break;
        case 'pulse':
          // Soft pulse beat
          notes = [
            { freq: 220, duration: 0.1, type: 'sine' },
            { freq: 0, duration: 0.1 },
            { freq: 220, duration: 0.1, type: 'sine' },
            { freq: 0, duration: 0.1 },
            { freq: 330, duration: 0.2, type: 'sine' },
          ];
          break;
        case 'bell':
          // Classic bell ring
          notes = [
            { freq: 830.6, duration: 0.5 }, // G#5
            { freq: 0, duration: 0.1 },
            { freq: 830.6, duration: 0.5 }, // G#5
          ];
          break;
        case 'synth':
          // Electronic synth wave
          notes = [
            { freq: 440, duration: 0.1, type: 'sawtooth' },
            { freq: 554.37, duration: 0.1, type: 'sawtooth' },
            { freq: 659.25, duration: 0.1, type: 'sawtooth' },
            { freq: 880, duration: 0.3, type: 'sawtooth' },
          ];
          break;
      }
      
      let startTime = audioContext.currentTime;
      
      notes.forEach((note) => {
        if (note.freq === 0) {
          startTime += note.duration;
          return;
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = note.freq;
        oscillator.type = note.type || 'sine';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + note.duration);
        
        startTime += note.duration;
      });
    };
    
    playMelody();
    
    if (!preview) {
      // Repeat for alarm
      alarmIntervalRef.current = window.setInterval(() => {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          playMelody();
        }
      }, 1500);
      
      setIsAlarmPlaying(true);
    } else {
      // For preview, close after playing once
      setTimeout(() => {
        try {
          audioContext.close();
        } catch (e) {
          // Ignore close errors
        }
      }, 2000);
    }
    } catch (e) {
      console.warn('Failed to play sound:', e);
    }
  }, []);

  // Play alarm with selected sound
  const playAlarm = useCallback(() => {
    playSound(selectedSound);
  }, [playSound, selectedSound]);

  // Stop alarm sound
  const stopAlarm = useCallback(() => {
    try {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } catch (e) {
      console.warn('Error stopping alarm:', e);
    }
    setIsAlarmPlaying(false);
  }, []);

  // Add session to history
  const addToHistory = useCallback((sessionType: string, duration: number) => {
    const newSession: SessionHistory = {
      id: Date.now().toString(),
      type: sessionType,
      duration,
      task: focusTask,
      completedAt: new Date().toISOString(),
      date: getTodayKey()
    };
    setSessionHistory(prev => [newSession, ...prev].slice(0, 100)); // Keep last 100 sessions
    
    // Update streak when completing a session
    updateStreak();
  }, [focusTask, updateStreak]);

  // Timer Logic
  useEffect(() => {
    let interval: number | undefined;

    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Timer completed - switch phase
      if (phase === TimerPhase.FOCUS) {
        // Focus completed, play alarm and switch to break
        playAlarm();
        sendNotification('Focus Complete! 🎉', `Great job! Time for a break.`, 'focus-complete');
        
        const sessionLength = mode === FocusMode.S1 ? 30 : mode === FocusMode.S2 ? 20 : customFocusTime;
        
        // Update stats
        setStats(prev => ({
          ...prev,
          s1Count: mode === FocusMode.S1 ? prev.s1Count + 1 : prev.s1Count,
          s2Count: mode === FocusMode.S2 ? prev.s2Count + 1 : prev.s2Count,
          customCount: mode === FocusMode.CUSTOM ? (prev.customCount || 0) + 1 : (prev.customCount || 0),
          totalMinutes: prev.totalMinutes + sessionLength
        }));
        
        // Add to history
        addToHistory(mode, sessionLength);
        
        setPhase(TimerPhase.BREAK);
        const breakTime = mode === FocusMode.CUSTOM ? customBreakTime * 60 : TIMER_CONFIG[mode].break;
        setTimeLeft(breakTime);
        setIsRunning(false); // Stop and wait for user to acknowledge
      } else {
        // Break completed - STOP completely and play alarm
        playAlarm();
        sendNotification('Break Over! 💪', 'Ready for another focus session?', 'break-complete');
        setIsRunning(false); // Stop after break, session complete
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, phase, playAlarm, sendNotification, focusTask, customFocusTime, customBreakTime, addToHistory]);

  // Function to skip to next phase
  const skipPhase = () => {
    if (phase === TimerPhase.FOCUS) {
      setPhase(TimerPhase.BREAK);
      const breakTime = mode === FocusMode.CUSTOM ? customBreakTime * 60 : TIMER_CONFIG[mode].break;
      setTimeLeft(breakTime);
    } else {
      // Reset to focus for new session
      setPhase(TimerPhase.FOCUS);
      setTimeLeft(getInitialTime(mode, TimerPhase.FOCUS));
    }
    setIsRunning(false);
  };

  // Function to reset current phase
  const resetTimer = () => {
    setTimeLeft(getInitialTime(mode, phase));
    setIsRunning(false);
  };

  // Function to reset all stats
  const resetStats = () => {
    setStats({
      s1Count: 0,
      s2Count: 0,
      customCount: 0,
      totalMinutes: 0,
      dailyGoal: stats.dailyGoal,
      date: getTodayKey()
    });
  };

  // Function to update daily goal
  const updateDailyGoal = (goal: number) => {
    setStats(prev => ({ ...prev, dailyGoal: goal }));
  };

  // Function to clear history
  const clearHistory = () => {
    setSessionHistory([]);
  };

  // Get today's sessions from history
  const todaySessions = sessionHistory.filter(s => s.date === getTodayKey());

  // Settings Page Component
  const SettingsPage = () => (
    <div className={`max-w-2xl mx-auto p-6 md:p-10 ${isDarkTheme ? '' : 'text-stone-800'}`}>
      <h1 className={`text-3xl font-bold mb-8 ${isDarkTheme ? 'text-white' : 'text-stone-800'}`}>Settings</h1>
      
      {/* Streak Display */}
      <div className={`${isDarkTheme ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30' : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200/60'} backdrop-blur-lg border rounded-2xl p-6 mb-6 shadow-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${isDarkTheme ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-gradient-to-br from-orange-400 to-red-400'} flex items-center justify-center shadow-lg`}>
              <Flame size={28} className="text-white" />
            </div>
            <div>
              <p className={`text-sm ${isDarkTheme ? 'text-orange-300' : 'text-orange-600/80'} font-medium`}>Current Streak</p>
              <p className={`text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-stone-800'}`}>{streak} {streak === 1 ? 'day' : 'days'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-stone-500'}`}>
              {streak >= 7 ? '🔥 On fire!' : streak >= 3 ? '💪 Keep going!' : '🌱 Building momentum!'}
            </p>
            <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-stone-400'} mt-1`}>
              Complete sessions daily to maintain streak
            </p>
          </div>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className={`${isDarkTheme ? 'bg-surface/40 border-white/5' : 'bg-white/70 border-stone-200/60'} backdrop-blur-lg border rounded-2xl p-6 mb-6 shadow-sm`}>
        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-stone-800'}`}>
          {isDarkTheme ? <Moon size={20} className="text-blue-400" /> : <Sun size={20} className="text-yellow-500" />}
          Appearance
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-medium ${isDarkTheme ? 'text-slate-200' : 'text-stone-700'}`}>Theme</p>
            <p className={`text-sm ${isDarkTheme ? 'text-slate-500' : 'text-stone-500'}`}>
              {isDarkTheme ? 'Dark mode enabled' : 'Light mode enabled'}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-16 h-9 rounded-full transition-all duration-300 ${
              isDarkTheme 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500' 
                : 'bg-gradient-to-r from-yellow-400 to-orange-400'
            }`}
          >
            <div className={`absolute top-1 w-7 h-7 rounded-full bg-white shadow-lg transition-all duration-300 flex items-center justify-center ${
              isDarkTheme ? 'left-8' : 'left-1'
            }`}>
              {isDarkTheme ? (
                <Moon size={14} className="text-indigo-500" />
              ) : (
                <Sun size={14} className="text-yellow-500" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Notification Sounds */}
      <div className={`${isDarkTheme ? 'bg-surface/40 border-white/5' : 'bg-white/70 border-stone-200/60'} backdrop-blur-lg border rounded-2xl p-6 mb-6 shadow-sm`}>
        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-stone-800'}`}>
          <Volume2 size={20} className="text-accent" />
          Notification Sound
        </h2>
        <p className={`text-sm mb-4 ${isDarkTheme ? 'text-slate-400' : 'text-stone-500'}`}>Choose your preferred alarm sound</p>
        
        <div className="space-y-3">
          {NOTIFICATION_SOUNDS.map((sound) => (
            <button
              key={sound.id}
              onClick={() => {
                setSelectedSound(sound.id);
                playSound(sound.id, true); // Preview sound
              }}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                selectedSound === sound.id
                  ? isDarkTheme ? 'bg-accent/10 border-accent/30 text-white' : 'bg-emerald-50 border-emerald-300/50 text-stone-800'
                  : isDarkTheme 
                    ? 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                    : 'bg-stone-50/80 border-stone-200/60 text-stone-700 hover:bg-stone-100/80'
              }`}
            >
              <div className="text-left">
                <p className="font-medium">{sound.name}</p>
                <p className={`text-sm ${isDarkTheme ? 'text-slate-500' : 'text-stone-500'}`}>{sound.description}</p>
              </div>
              {selectedSound === sound.id && (
                <Check size={20} className="text-accent" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className={`${isDarkTheme ? 'bg-surface/40 border-white/5' : 'bg-white/70 border-stone-200/60'} backdrop-blur-lg border rounded-2xl p-6 shadow-sm`}>
        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-stone-800'}`}>
          <Trash2 size={20} className="text-red-400" />
          Data Management
        </h2>
        
        <div className="space-y-3">
          <button
            onClick={() => {
              resetStats();
              showToast('success', 'Stats Reset! ✨', 'Today\'s stats have been cleared successfully.');
            }}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
              isDarkTheme 
                ? 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                : 'bg-stone-50/80 border-stone-200/60 text-stone-700 hover:bg-stone-100/80'
            }`}
          >
            <div className="text-left">
              <p className="font-medium">Reset Today's Stats</p>
              <p className={`text-sm ${isDarkTheme ? 'text-slate-500' : 'text-stone-500'}`}>Clear session count and focus time for today</p>
            </div>
            <RotateCcw size={18} />
          </button>
          
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all session history?')) {
                clearHistory();
                showToast('warning', 'History Cleared! 🗑️', 'All session records have been permanently deleted.');
              }
            }}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
              isDarkTheme 
                ? 'bg-white/5 border-white/5 text-slate-300 hover:bg-red-500/10 hover:border-red-500/20'
                : 'bg-stone-50/80 border-stone-200/60 text-stone-700 hover:bg-red-50/80 hover:border-red-300/60'
            }`}
          >
            <div className="text-left">
              <p className="font-medium">Clear All History</p>
              <p className={`text-sm ${isDarkTheme ? 'text-slate-500' : 'text-stone-500'}`}>Permanently delete all session records</p>
            </div>
            <Trash2 size={18} className="text-red-400" />
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className={`mt-8 text-center text-sm ${isDarkTheme ? 'text-slate-500' : 'text-stone-400'}`}>
        <p>Ihsan Productivity Timer v1.1</p>
        <p className="mt-1">Built with ❤️ for deep work</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-gradient-to-br from-[#020617] via-[#050608] to-[#0a0f1c]' : 'bg-gradient-to-br from-stone-100 via-amber-50/30 to-stone-50'} text-white flex flex-col md:flex-row font-sans selection:bg-accent selection:text-black overflow-hidden`}>
      
      {/* Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isDarkTheme={isDarkTheme} />
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Background Grid Decoration */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" 
             style={{ 
               backgroundImage: `linear-gradient(${isDarkTheme ? '#fff' : '#000'} 1px, transparent 1px), linear-gradient(90deg, ${isDarkTheme ? '#fff' : '#000'} 1px, transparent 1px)`,
               backgroundSize: '40px 40px'
             }}>
        </div>

        {activeTab === 'settings' ? (
          /* Settings Page */
          <div className="flex-1 overflow-y-auto">
            <SettingsPage />
          </div>
        ) : (
          /* Dashboard / Timer Page */
          <>
            <Header focusTask={focusTask} setFocusTask={setFocusTask} isDarkTheme={isDarkTheme} />
            
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="max-w-[1600px] mx-auto p-6 md:p-10 min-h-full flex flex-col lg:flex-row gap-8 lg:items-center justify-center">
                
                {/* Center Timer Area */}
                <div className="flex-1 flex justify-center items-center py-8 lg:py-0 order-1 lg:order-1">
                   <TimerDisplay 
                     mode={mode} 
                     setMode={setMode} 
                     phase={phase}
                     isRunning={isRunning}
                     setIsRunning={setIsRunning}
                     timeLeft={timeLeft}
                     onSkip={skipPhase}
                     onReset={resetTimer}
                     isAlarmPlaying={isAlarmPlaying}
                     onStopAlarm={stopAlarm}
                     customFocusTime={customFocusTime}
                     customBreakTime={customBreakTime}
                     setCustomFocusTime={setCustomFocusTime}
                     setCustomBreakTime={setCustomBreakTime}
                     isDarkTheme={isDarkTheme}
                     onUnlockAudio={unlockAudioContext}
                   />
                </div>

                {/* Right Info Panel */}
                <div className="flex-shrink-0 order-2 lg:order-2">
                   <StatsPanel 
                     stats={stats} 
                     todaySessions={todaySessions}
                     sessionHistory={sessionHistory}
                     onResetStats={resetStats}
                     onUpdateDailyGoal={updateDailyGoal}
                     onClearHistory={clearHistory}
                     focusTask={focusTask}
                     streak={streak}
                     isDarkTheme={isDarkTheme}
                   />
                </div>

              </div>
            </div>
            
            {/* Keyboard Shortcuts Hint */}
            <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-4 text-xs ${isDarkTheme ? 'text-slate-500' : 'text-stone-500'}`}>
              <span><kbd className={`px-1.5 py-0.5 rounded border ${isDarkTheme ? 'bg-white/5 border-white/10' : 'bg-stone-200/80 border-stone-300/60'}`}>Space</kbd> Start/Pause</span>
              <span><kbd className={`px-1.5 py-0.5 rounded border ${isDarkTheme ? 'bg-white/5 border-white/10' : 'bg-stone-200/80 border-stone-300/60'}`}>R</kbd> Reset</span>
              <span><kbd className={`px-1.5 py-0.5 rounded border ${isDarkTheme ? 'bg-white/5 border-white/10' : 'bg-stone-200/80 border-stone-300/60'}`}>S</kbd> Skip</span>
              <span><kbd className={`px-1.5 py-0.5 rounded border ${isDarkTheme ? 'bg-white/5 border-white/10' : 'bg-stone-200/80 border-stone-300/60'}`}>Esc</kbd> Stop Alarm</span>
            </div>
          </>
        )}
      </main>
      
      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="pointer-events-auto animate-slide-in"
            style={{
              animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              animationDelay: `${index * 50}ms`,
            }}
          >
            <div
              className={`relative overflow-hidden rounded-2xl shadow-2xl backdrop-blur-xl min-w-[320px] max-w-[400px] ${
                toast.type === 'focus-complete'
                  ? 'bg-gradient-to-r from-emerald-500/90 via-green-500/90 to-teal-500/90'
                  : toast.type === 'break-complete'
                  ? 'bg-gradient-to-r from-violet-500/90 via-purple-500/90 to-fuchsia-500/90'
                  : toast.type === 'success'
                  ? 'bg-gradient-to-r from-cyan-500/90 via-blue-500/90 to-indigo-500/90'
                  : toast.type === 'warning'
                  ? 'bg-gradient-to-r from-amber-500/90 via-orange-500/90 to-red-500/90'
                  : 'bg-gradient-to-r from-blue-500/90 via-cyan-500/90 to-teal-500/90'
              }`}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
              
              {/* Glow effect */}
              <div className={`absolute -inset-1 blur-xl opacity-50 ${
                toast.type === 'focus-complete'
                  ? 'bg-emerald-400'
                  : toast.type === 'break-complete'
                  ? 'bg-violet-400'
                  : toast.type === 'success'
                  ? 'bg-cyan-400'
                  : toast.type === 'warning'
                  ? 'bg-amber-400'
                  : 'bg-blue-400'
              }`} />
              
              <div className="relative p-4 flex items-start gap-4">
                {/* Icon with pulse */}
                <div className={`flex-shrink-0 p-3 rounded-xl bg-white/20 backdrop-blur-sm ${
                  toast.type === 'focus-complete' ? 'animate-bounce-soft' : 'animate-pulse-soft'
                }`}>
                  <div className="text-white drop-shadow-lg">
                    {toast.icon}
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <h4 className="text-white font-bold text-lg tracking-tight drop-shadow-sm">
                    {toast.title}
                  </h4>
                  <p className="text-white/90 text-sm mt-0.5 leading-relaxed">
                    {toast.message}
                  </p>
                </div>
                
                {/* Close button */}
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="flex-shrink-0 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110 active:scale-95 group"
                >
                  <X className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
                </button>
              </div>
              
              {/* Progress bar */}
              <div className="h-1 bg-black/10">
                <div 
                  className="h-full bg-white/40 animate-progress"
                  style={{ animation: 'progress 5s linear forwards' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Toast Animation Styles */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        
        @keyframes bounce-soft {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        
        @keyframes pulse-soft {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
        
        .animate-bounce-soft {
          animation: bounce-soft 1s ease-in-out infinite;
        }
        
        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default App;