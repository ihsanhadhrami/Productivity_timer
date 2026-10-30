import React from 'react';
import { Volume2, Check, RotateCcw, Trash2, Sun, Moon, Flame, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { NotificationSound } from '../types';
import { NOTIFICATION_SOUNDS } from '../hooks/useAlarm';

interface SettingsPageProps {
  isDarkTheme: boolean;
  onToggleTheme: () => void;
  streak: number;
  selectedSound: NotificationSound;
  onSelectSound: (sound: NotificationSound) => void;
  hasNotificationPermission: boolean;
  onResetStats: () => void;
  onClearHistory: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  isDarkTheme,
  onToggleTheme,
  streak,
  selectedSound,
  onSelectSound,
  hasNotificationPermission,
  onResetStats,
  onClearHistory,
}) => (
  <div className={`max-w-2xl mx-auto p-4 md:p-10 ${isDarkTheme ? '' : 'text-stone-800'}`}>
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
          onClick={onToggleTheme}
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
      
      {/* Background Notifications Info */}
      <div className={`mb-4 p-3 rounded-lg ${
        hasNotificationPermission 
          ? isDarkTheme ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50/80 border border-green-200/60'
          : isDarkTheme ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-50/80 border border-yellow-200/60'
      }`}>
        <div className="flex items-start gap-2">
          {hasNotificationPermission ? (
            <CheckCircle2 size={18} className="text-green-500 mt-0.5" />
          ) : (
            <AlertTriangle size={18} className="text-yellow-500 mt-0.5" />
          )}
          <div>
            <p className={`text-sm font-medium ${
              hasNotificationPermission 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-yellow-600 dark:text-yellow-400'
            }`}>
              {hasNotificationPermission ? '✓ Background Notifications Enabled' : '⚠ Background Notifications Disabled'}
            </p>
            <p className={`text-xs mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-stone-500'}`}>
              {hasNotificationPermission 
                ? 'Timer akan notify kau even bila multitask atau switch tab/app lain' 
                : 'Allow notifications untuk dapat alert bila timer habis walaupun tak buka tab'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {NOTIFICATION_SOUNDS.map((sound) => (
          <button
            key={sound.id}
            onClick={() => onSelectSound(sound.id)}
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
          onClick={onResetStats}
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
              onClearHistory();
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

export default SettingsPage;
