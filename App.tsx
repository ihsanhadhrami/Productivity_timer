import React, { useEffect, useRef, useState } from 'react';
import Sidebar from './Components/sidebar';
import Header from './Components/Header';
import TimerDisplay from './Components/TimerDisplay';
import StatsPanel from './Components/Statspanel';
import InstallPrompt from './Components/InstallPrompt';
import ChunkingPanel from './Components/ChunkingPanel';
import SettingsPage from './Components/SettingsPage';
import { ToastStack, useNotifications } from './Components/Notifications';
import { NotificationSound, ChunkProject, FocusMode } from './types';
import { useFocusTimer } from './hooks/useFocusTimer';
import { useAlarm, NOTIFICATION_SOUNDS } from './hooks/useAlarm';
import { useSessionTracking } from './hooks/useSessionTracking';
import { STORAGE_KEYS, StorageCodec, jsonCodec, stringCodec, usePersistentState } from './hooks/usePersistentState';

const themeCodec: StorageCodec<boolean> = {
  parse: (raw) => raw !== 'light',
  stringify: (isDark) => (isDark ? 'dark' : 'light'),
};

const soundCodec: StorageCodec<NotificationSound> = {
  parse: (raw) => NOTIFICATION_SOUNDS.find(s => s.id === raw)?.id,
  stringify: (sound) => sound,
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Preferences and user content, saved to localStorage
  const [isDarkTheme, setIsDarkTheme] = usePersistentState(STORAGE_KEYS.theme, true, themeCodec);
  const [selectedSound, setSelectedSound] = usePersistentState<NotificationSound>(STORAGE_KEYS.notificationSound, 'crystals', soundCodec);
  const [focusTask, setFocusTask] = usePersistentState(STORAGE_KEYS.focusTask, 'What are you working on?', stringCodec);
  const [chunkProjects, setChunkProjects] = usePersistentState<ChunkProject[]>(STORAGE_KEYS.chunkProjects, [], jsonCodec<ChunkProject[]>());

  const tracking = useSessionTracking();
  const notifications = useNotifications();

  // The alarm needs to know if the timer runs, and the timer rings the alarm,
  // so the timer reaches the alarm through a ref
  const playAlarmRef = useRef<() => void>(() => {});

  const timer = useFocusTimer({
    onFocusComplete: (mode: FocusMode, minutes: number) => {
      playAlarmRef.current();
      notifications.notify('focus-complete', 'Focus Complete! 🎉', 'Great job! Time for a break.', {
        whenHidden: {
          title: '🎉 Focus Complete!',
          body: `Great work! You completed a ${minutes}-minute focus session. Time for a break!`,
        },
      });
      tracking.recordFocusSession(mode, minutes, focusTask);
    },
    onBreakComplete: () => {
      playAlarmRef.current();
      notifications.notify('break-complete', 'Break Over! 💪', 'Ready for another focus session?', {
        whenHidden: {
          title: '💪 Break Over!',
          body: 'Your break is complete. Ready for another focus session?',
        },
      });
    },
  });

  const alarm = useAlarm(selectedSound, timer.isRunning);
  playAlarmRef.current = alarm.playAlarm;

  // Keyboard shortcuts. Handlers are read through a ref so they always act on the current state.
  const shortcutsRef = useRef({ timer, alarm });
  shortcutsRef.current = { timer, alarm };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const { timer, alarm } = shortcutsRef.current;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (!alarm.isAlarmPlaying) {
            timer.setIsRunning(prev => !prev);
          }
          break;
        case 'KeyR':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            timer.reset();
          }
          break;
        case 'KeyS':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            timer.skip();
          }
          break;
        case 'Escape':
          if (alarm.isAlarmPlaying) {
            alarm.stopAlarm();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`h-[100dvh] ${isDarkTheme ? 'bg-gradient-to-br from-[#020617] via-[#050608] to-[#0a0f1c]' : 'bg-gradient-to-br from-stone-100 via-amber-50/30 to-stone-50'} text-white flex flex-col md:flex-row font-sans selection:bg-accent selection:text-black overflow-hidden`}>

      {/* Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isDarkTheme={isDarkTheme} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative pt-[env(safe-area-inset-top)] pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
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
            <SettingsPage
              isDarkTheme={isDarkTheme}
              onToggleTheme={() => setIsDarkTheme(prev => !prev)}
              streak={tracking.streak}
              selectedSound={selectedSound}
              onSelectSound={(sound) => {
                setSelectedSound(sound);
                alarm.previewSound(sound);
              }}
              hasNotificationPermission={notifications.hasPermission}
              onResetStats={() => {
                tracking.resetStats();
                notifications.notify('success', 'Stats Reset! ✨', 'Today\'s stats have been cleared successfully.', { system: false });
              }}
              onClearHistory={() => {
                tracking.clearHistory();
                notifications.notify('warning', 'History Cleared! 🗑️', 'All session records have been permanently deleted.', { system: false });
              }}
            />
          </div>
        ) : activeTab === 'chunking' ? (
          /* Chunking Page */
          <div className="flex-1 overflow-y-auto">
            <ChunkingPanel
              projects={chunkProjects}
              onProjectsChange={setChunkProjects}
              isDarkTheme={isDarkTheme}
            />
          </div>
        ) : (
          /* Dashboard / Timer Page */
          <>
            <Header focusTask={focusTask} setFocusTask={setFocusTask} isDarkTheme={isDarkTheme} />

            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="max-w-[1600px] mx-auto p-4 md:p-10 min-h-full flex flex-col lg:flex-row gap-8 lg:items-center justify-center">

                {/* Center Timer Area */}
                <div className="flex-1 flex justify-center items-center py-2 md:py-8 lg:py-0 order-1 lg:order-1">
                   <TimerDisplay
                     mode={timer.mode}
                     setMode={timer.setMode}
                     phase={timer.phase}
                     isRunning={timer.isRunning}
                     setIsRunning={timer.setIsRunning}
                     timeLeft={timer.timeLeft}
                     onSkip={timer.skip}
                     onReset={timer.reset}
                     isAlarmPlaying={alarm.isAlarmPlaying}
                     onStopAlarm={alarm.stopAlarm}
                     customFocusTime={timer.customFocusTime}
                     customBreakTime={timer.customBreakTime}
                     setCustomFocusTime={timer.setCustomFocusTime}
                     setCustomBreakTime={timer.setCustomBreakTime}
                     isDarkTheme={isDarkTheme}
                     onUnlockAudio={alarm.unlockAudio}
                   />
                </div>

                {/* Right Info Panel */}
                <div className="flex-shrink-0 order-2 lg:order-2">
                   <StatsPanel
                     stats={tracking.stats}
                     todaySessions={tracking.todaySessions}
                     sessionHistory={tracking.sessionHistory}
                     onResetStats={tracking.resetStats}
                     onUpdateDailyGoal={tracking.updateDailyGoal}
                     onClearHistory={tracking.clearHistory}
                     focusTask={focusTask}
                     streak={tracking.streak}
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

      {/* PWA Install Prompt - positioned at bottom left, non-intrusive */}
      <InstallPrompt />

      <ToastStack toasts={notifications.toasts} dismiss={notifications.dismiss} />
    </div>
  );
};

export default App;
