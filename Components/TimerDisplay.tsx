import React, { useState } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Coffee, Brain, BellOff, Settings, X } from 'lucide-react';
import { FocusMode, TimerPhase } from '../types';

interface TimerDisplayProps {
  mode: FocusMode;
  setMode: (mode: FocusMode) => void;
  phase: TimerPhase;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  timeLeft: number;
  onSkip: () => void;
  onReset: () => void;
  isAlarmPlaying: boolean;
  onStopAlarm: () => void;
  customFocusTime: number;
  customBreakTime: number;
  setCustomFocusTime: (time: number) => void;
  setCustomBreakTime: (time: number) => void;
  isDarkTheme?: boolean;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ 
  mode, 
  setMode,
  phase,
  isRunning, 
  setIsRunning,
  timeLeft,
  onSkip,
  onReset,
  isAlarmPlaying,
  onStopAlarm,
  customFocusTime,
  customBreakTime,
  setCustomFocusTime,
  setCustomBreakTime,
  isDarkTheme = true
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [tempFocus, setTempFocus] = useState(customFocusTime);
  const [tempBreak, setTempBreak] = useState(customBreakTime);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer configurations
  const TIMER_CONFIG = {
    [FocusMode.S1]: { focus: 30 * 60, break: 5 * 60 },
    [FocusMode.S2]: { focus: 20 * 60, break: 4 * 60 },
    [FocusMode.CUSTOM]: { focus: customFocusTime * 60, break: customBreakTime * 60 },
  };

  // Calculate progress for circle stroke based on current phase
  const totalTime = phase === TimerPhase.FOCUS 
    ? TIMER_CONFIG[mode].focus 
    : TIMER_CONFIG[mode].break;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  // Colors based on phase
  const isBreak = phase === TimerPhase.BREAK;
  const accentColor = isBreak ? '#60A5FA' : '#39FF14'; // Blue for break, Green for focus
  const phaseLabel = isBreak ? 'Break Time' : (isRunning ? 'Focusing' : 'Ready');
  const PhaseIcon = isBreak ? Coffee : Brain;

  // Get time label for current mode
  const getTimeLabel = () => {
    if (mode === FocusMode.S1) return isBreak ? '5 min' : '30 min';
    if (mode === FocusMode.S2) return isBreak ? '4 min' : '20 min';
    return isBreak ? `${customBreakTime} min` : `${customFocusTime} min`;
  };

  const handleSaveCustom = () => {
    setCustomFocusTime(tempFocus);
    setCustomBreakTime(tempBreak);
    setMode(FocusMode.CUSTOM);
    setShowCustomModal(false);
  };

  const openCustomModal = () => {
    setTempFocus(customFocusTime);
    setTempBreak(customBreakTime);
    setShowCustomModal(true);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 relative z-10 py-10">
      
      {/* Phase Indicator */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500 ${
        isBreak 
          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
          : 'bg-accent/10 border-accent/30 text-accent'
      }`}>
        <PhaseIcon size={18} />
        <span className="text-sm font-semibold uppercase tracking-wider">
          {isBreak ? 'Break' : 'Focus'} • {getTimeLabel()}
        </span>
      </div>

      {/* Timer Circle */}
      <div className="relative group cursor-pointer" onClick={() => setIsRunning(!isRunning)}>
        {/* Outer Glow Layer */}
        <div className={`
          absolute inset-0 rounded-full transition-all duration-700 opacity-40 blur-[40px]
          ${isRunning ? (isBreak ? 'bg-blue-500/30' : 'bg-accent/30') + ' scale-110' : 'bg-transparent scale-100'}
        `} style={{ backgroundColor: isRunning ? (isBreak ? 'rgba(96, 165, 250, 0.3)' : 'rgba(57, 255, 20, 0.3)') : 'transparent' }} />

        {/* SVG Ring */}
        <div className={`relative w-[300px] h-[300px] md:w-[360px] md:h-[360px] rounded-full shadow-2xl flex items-center justify-center border-[6px] ${
          isDarkTheme 
            ? 'bg-[#050608] border-[#0F1420]' 
            : 'bg-gradient-to-br from-stone-100 to-stone-200 border-stone-300/60'
        }`}>
          
          {/* Progress Ring SVG - Like battery charging from 12 o'clock clockwise */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
             {/* Background circle (empty battery) */}
             <circle
              cx="50"
              cy="50"
              r="46"
              fill="transparent"
              stroke={isDarkTheme ? "#0f172a" : "#d6d3d1"}
              strokeWidth="4"
             />
             {/* Progress circle (charging) - starts from top (12 o'clock) and goes clockwise */}
             <circle
              cx="50"
              cy="50"
              r="46"
              fill="transparent"
              stroke={accentColor}
              strokeWidth="4"
              strokeDasharray={`${(progress / 100) * 289} 289`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ 
                transition: 'stroke-dasharray 1s linear',
                filter: `drop-shadow(0 0 6px ${accentColor})`
              }}
             />
          </svg>

          {/* Inner Circle Detail */}
          <div className={`w-[85%] h-[85%] rounded-full shadow-inner-glow flex flex-col items-center justify-center relative border ${
            isDarkTheme 
              ? 'bg-gradient-to-br from-[#0B1121] to-[#02040A] border-white/5' 
              : 'bg-gradient-to-br from-white to-stone-50 border-stone-200/60'
          }`}>
             
             {/* Decorative dots */}
             <div className={`absolute top-8 w-1 h-1 rounded-full ${isDarkTheme ? 'bg-slate-700' : 'bg-stone-300'}`}></div>
             <div className={`absolute bottom-8 w-1 h-1 rounded-full ${isDarkTheme ? 'bg-slate-700' : 'bg-stone-300'}`}></div>

             <span className={`text-sm font-medium tracking-[0.2em] mb-2 uppercase opacity-80 transition-colors duration-500 ${isBreak ? 'text-blue-400' : 'text-accent'}`}>
               {phaseLabel}
             </span>
             
             <h1 className={`text-6xl md:text-8xl font-mono font-bold tracking-tight tabular-nums relative z-10 drop-shadow-lg ${isDarkTheme ? 'text-white' : 'text-stone-800'}`}>
               {formatTime(timeLeft)}
             </h1>
             
             <div className={`mt-6 transition-all duration-300 ${isRunning ? 'opacity-100' : 'opacity-60'}`}>
                {isRunning ? (
                  <Pause className={`w-8 h-8 ${isBreak ? 'text-blue-400' : 'text-accent'}`} />
                ) : (
                  <Play className={`w-8 h-8 ml-1 ${isDarkTheme ? 'text-slate-500 fill-slate-500/20' : 'text-stone-400 fill-stone-400/20'}`} />
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-3">
        {isAlarmPlaying ? (
          /* Stop Alarm Button - Shows when alarm is playing */
          <button
            onClick={onStopAlarm}
            className="px-8 py-4 rounded-full font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white animate-pulse"
          >
            <BellOff size={20} />
            Stop Alarm
          </button>
        ) : (
          /* Normal Control Buttons */
          <>
            <button
              onClick={onReset}
              className={`p-3 rounded-full border transition-all ${
                isDarkTheme 
                  ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10' 
                  : 'bg-stone-100 border-stone-200/60 text-stone-400 hover:text-stone-600 hover:bg-stone-200/80'
              }`}
              title="Reset Timer"
            >
              <RotateCcw size={20} />
            </button>
            
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`px-8 py-4 rounded-full font-bold transition-all shadow-glow-sm hover:shadow-glow flex items-center gap-2 ${
                isBreak 
                  ? 'bg-blue-500 hover:bg-blue-400 text-white' 
                  : 'bg-accent hover:bg-[#32e012] text-black'
              }`}
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
              {isRunning ? 'Pause' : 'Start'}
            </button>

            <button
              onClick={onSkip}
              className={`p-3 rounded-full border transition-all ${
                isDarkTheme 
                  ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10' 
                  : 'bg-stone-100 border-stone-200/60 text-stone-400 hover:text-stone-600 hover:bg-stone-200/80'
              }`}
              title="Skip to Next Phase"
            >
              <SkipForward size={20} />
            </button>
          </>
        )}
      </div>

      {/* Mode Selectors */}
      <div className={`flex items-center gap-4 p-1.5 rounded-full border backdrop-blur-sm ${
        isDarkTheme 
          ? 'bg-surface/40 border-white/5' 
          : 'bg-white/70 border-stone-200/60 shadow-sm'
      }`}>
        <button
          onClick={() => { setMode(FocusMode.S1); }}
          className={`
            px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2
            ${mode === FocusMode.S1 
              ? 'bg-accent text-black shadow-glow-sm scale-105' 
              : isDarkTheme 
                ? 'text-slate-400 hover:text-white hover:bg-white/5'
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'}
          `}
        >
          <span>S1</span>
          <span className={`opacity-60 text-xs font-normal ${mode === FocusMode.S1 ? 'text-black' : isDarkTheme ? 'text-slate-500' : 'text-stone-400'}`}>30/5</span>
        </button>

        <button
          onClick={() => { setMode(FocusMode.S2); }}
          className={`
            px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2
            ${mode === FocusMode.S2 
              ? 'bg-accent text-black shadow-glow-sm scale-105' 
              : isDarkTheme 
                ? 'text-slate-400 hover:text-white hover:bg-white/5'
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'}
          `}
        >
          <span>S2</span>
          <span className={`opacity-60 text-xs font-normal ${mode === FocusMode.S2 ? 'text-black' : isDarkTheme ? 'text-slate-500' : 'text-stone-400'}`}>20/4</span>
        </button>

        <button
          onClick={openCustomModal}
          className={`
            px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2
            ${mode === FocusMode.CUSTOM 
              ? 'bg-accent text-black shadow-glow-sm scale-105' 
              : isDarkTheme 
                ? 'text-slate-400 hover:text-white hover:bg-white/5'
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'}
          `}
        >
          <Settings size={16} />
          <span className={`opacity-60 text-xs font-normal ${mode === FocusMode.CUSTOM ? 'text-black' : isDarkTheme ? 'text-slate-500' : 'text-stone-400'}`}>
            {customFocusTime}/{customBreakTime}
          </span>
        </button>
      </div>

      {/* Custom Timer Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCustomModal(false)}>
          <div className={`border rounded-2xl p-6 w-[90%] max-w-md shadow-2xl ${
            isDarkTheme 
              ? 'bg-[#0B1121] border-white/10' 
              : 'bg-white border-stone-200'
          }`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-stone-800'}`}>Custom Timer</h3>
              <button onClick={() => setShowCustomModal(false)} className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-white/10' : 'hover:bg-stone-100'}`}>
                <X size={20} className={isDarkTheme ? 'text-slate-400' : 'text-stone-400'} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Focus Time */}
              <div>
                <label className={`text-sm mb-2 block ${isDarkTheme ? 'text-slate-400' : 'text-stone-500'}`}>Focus Duration (minutes)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="5"
                    max="90"
                    step="5"
                    value={tempFocus}
                    onChange={(e) => setTempFocus(Number(e.target.value))}
                    className="flex-1 accent-accent h-2 rounded-full"
                  />
                  <div className={`w-16 px-3 py-2 border rounded-lg text-center font-mono text-accent ${
                    isDarkTheme ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200'
                  }`}>
                    {tempFocus}
                  </div>
                </div>
              </div>

              {/* Break Time */}
              <div>
                <label className={`text-sm mb-2 block ${isDarkTheme ? 'text-slate-400' : 'text-stone-500'}`}>Break Duration (minutes)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={tempBreak}
                    onChange={(e) => setTempBreak(Number(e.target.value))}
                    className="flex-1 accent-blue-400 h-2 rounded-full"
                  />
                  <div className={`w-16 px-3 py-2 border rounded-lg text-center font-mono text-blue-400 ${
                    isDarkTheme ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200'
                  }`}>
                    {tempBreak}
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div>
                <label className={`text-sm mb-2 block ${isDarkTheme ? 'text-slate-400' : 'text-stone-500'}`}>Quick Presets</label>
                <div className="flex gap-2">
                  {[{ f: 25, b: 5 }, { f: 45, b: 10 }, { f: 60, b: 15 }, { f: 90, b: 20 }].map((preset) => (
                    <button
                      key={`${preset.f}-${preset.b}`}
                      onClick={() => { setTempFocus(preset.f); setTempBreak(preset.b); }}
                      className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                        isDarkTheme 
                          ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300' 
                          : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-600'
                      }`}
                    >
                      {preset.f}/{preset.b}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveCustom}
              className="w-full mt-6 py-3 rounded-xl bg-accent text-black font-bold hover:bg-accent/90 transition-colors"
            >
              Apply Custom Timer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimerDisplay;