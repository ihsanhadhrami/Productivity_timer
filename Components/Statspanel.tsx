import React, { useState } from 'react';
import { Zap, Clock, Target, History, RotateCcw, ChevronDown, ChevronUp, Edit2, Check, Flame } from 'lucide-react';
import { SessionStats, SessionHistory } from '../types';
import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis } from 'recharts';

interface StatsPanelProps {
  stats: SessionStats;
  todaySessions: SessionHistory[];
  sessionHistory: SessionHistory[];
  onResetStats: () => void;
  onUpdateDailyGoal: (goal: number) => void;
  onClearHistory: () => void;
  focusTask: string;
  streak?: number;
  isDarkTheme?: boolean;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ 
  stats, 
  todaySessions,
  sessionHistory,
  onResetStats,
  onUpdateDailyGoal,
  onClearHistory,
  focusTask,
  streak = 0,
  isDarkTheme = true
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(stats.dailyGoal);
  
  const totalSessions = stats.s1Count + stats.s2Count + (stats.customCount || 0);
  const progressPercentage = Math.min((totalSessions / stats.dailyGoal) * 100, 100);

  const handleSaveGoal = () => {
    onUpdateDailyGoal(tempGoal);
    setEditingGoal(false);
  };

  const formatSessionTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full lg:w-96 flex flex-col gap-6 animate-in fade-in slide-in-from-right duration-700">
      
      {/* Deep Work Progress Card */}
      <div className={`backdrop-blur-xl border rounded-3xl p-6 relative overflow-hidden group ${
        isDarkTheme 
          ? 'bg-surface/60 border-white/5' 
          : 'bg-white/70 border-stone-200/60 shadow-sm'
      }`}>
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${isDarkTheme ? '' : 'text-stone-400'}`}>
           <Zap size={80} />
        </div>
        
        <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${isDarkTheme ? 'text-slate-500' : 'text-stone-400'}`}>Current Task</h3>
        
        <div className="mb-6">
          <h2 className={`text-xl font-bold mb-1 ${isDarkTheme ? 'text-white' : 'text-stone-800'}`}>{focusTask}</h2>
          <p className={`text-sm leading-relaxed ${isDarkTheme ? 'text-slate-400' : 'text-stone-500'}`}>
            {totalSessions > 0 
              ? `You've completed ${totalSessions} session${totalSessions > 1 ? 's' : ''} today. Keep going!`
              : 'Start your first focus session today!'}
          </p>
        </div>

        <div className="flex items-center gap-4 mb-6">
           <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border ${
             isDarkTheme 
               ? 'text-slate-300 bg-white/5 border-white/5' 
               : 'text-stone-600 bg-stone-100/80 border-stone-200/60'
           }`}>
             <Clock size={14} className="text-accent" />
             <span>{stats.totalMinutes} min focused</span>
           </div>
           <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border ${
             isDarkTheme 
               ? 'text-slate-300 bg-white/5 border-white/5' 
               : 'text-stone-600 bg-stone-100/80 border-stone-200/60'
           }`}>
             <Target size={14} className="text-blue-400" />
             <span>{totalSessions} sessions</span>
           </div>
           {streak > 0 && (
             <div className="flex items-center gap-2 text-sm text-orange-300 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20">
               <Flame size={14} className="text-orange-400" />
               <span>{streak} day{streak > 1 ? 's' : ''}</span>
             </div>
           )}
        </div>

        {/* Session Breakdown */}
        <div className="flex items-center gap-2 text-xs mb-4">
          <span className="px-2 py-1 bg-accent/10 text-accent rounded">S1: {stats.s1Count}</span>
          <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded">S2: {stats.s2Count}</span>
          {(stats.customCount || 0) > 0 && (
            <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded">Custom: {stats.customCount}</span>
          )}
        </div>

        <button 
          onClick={onResetStats}
          className={`w-full py-3 font-medium rounded-xl transition-all flex items-center justify-center gap-2 border ${
            isDarkTheme 
              ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5' 
              : 'bg-stone-100/80 hover:bg-stone-200/80 text-stone-600 border-stone-200/60'
          }`}
        >
          <RotateCcw size={16} /> Reset Today's Stats
        </button>
      </div>

      {/* Daily Stats */}
      <div className={`backdrop-blur-lg border rounded-3xl p-6 flex-1 ${
        isDarkTheme 
          ? 'bg-surface/40 border-white/5' 
          : 'bg-white/70 border-stone-200/60 shadow-sm'
      }`}>
         <div className="flex items-center justify-between mb-6">
            <h3 className={`text-sm font-bold ${isDarkTheme ? 'text-white' : 'text-stone-800'}`}>Today's Progress</h3>
            
            {/* Editable Daily Goal */}
            {editingGoal ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(Number(e.target.value))}
                  className={`w-12 px-2 py-1 border rounded text-center text-xs ${
                    isDarkTheme 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : 'bg-stone-100 border-stone-200 text-stone-800'
                  }`}
                />
                <button onClick={handleSaveGoal} className={`p-1 rounded ${isDarkTheme ? 'hover:bg-white/10' : 'hover:bg-stone-100'}`}>
                  <Check size={14} className="text-accent" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { setTempGoal(stats.dailyGoal); setEditingGoal(true); }}
                className="text-xs font-mono text-accent bg-accent/10 px-2 py-1 rounded-md flex items-center gap-1 hover:bg-accent/20 transition-colors"
              >
                {totalSessions} / {stats.dailyGoal} <Edit2 size={10} />
              </button>
            )}
         </div>

         {/* Progress Bar */}
         <div className={`w-full h-3 rounded-full mb-2 overflow-hidden ${isDarkTheme ? 'bg-slate-800' : 'bg-stone-200'}`}>
            <div 
              className="h-full bg-gradient-to-r from-accent to-green-400 shadow-[0_0_10px_rgba(57,255,20,0.5)] transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
         </div>
         <p className={`text-xs mb-6 ${isDarkTheme ? 'text-slate-500' : 'text-stone-500'}`}>
           {progressPercentage >= 100 
             ? '🎉 Daily goal achieved!' 
             : `${stats.dailyGoal - totalSessions} more to reach your goal`}
         </p>

         <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`p-4 rounded-2xl border transition-colors ${
              isDarkTheme 
                ? 'bg-white/5 border-white/5 hover:border-white/10' 
                : 'bg-stone-50/80 border-stone-200/60 hover:border-stone-300/60'
            }`}>
               <p className={`text-xs mb-1 ${isDarkTheme ? 'text-slate-500' : 'text-stone-500'}`}>Total Focus</p>
               <p className={`text-2xl font-mono ${isDarkTheme ? 'text-white' : 'text-stone-800'}`}>{stats.totalMinutes}<span className={`text-sm ml-1 ${isDarkTheme ? 'text-slate-500' : 'text-stone-400'}`}>m</span></p>
            </div>
            <div className={`p-4 rounded-2xl border transition-colors ${
              isDarkTheme 
                ? 'bg-white/5 border-white/5 hover:border-white/10' 
                : 'bg-stone-50/80 border-stone-200/60 hover:border-stone-300/60'
            }`}>
               <p className={`text-xs mb-1 ${isDarkTheme ? 'text-slate-500' : 'text-stone-500'}`}>Avg Session</p>
               <p className={`text-2xl font-mono ${isDarkTheme ? 'text-white' : 'text-stone-800'}`}>
                 {totalSessions > 0 ? Math.round(stats.totalMinutes / totalSessions) : 0}
                 <span className={`text-sm ml-1 ${isDarkTheme ? 'text-slate-500' : 'text-stone-400'}`}>m</span>
               </p>
            </div>
         </div>

         {/* Weekly Chart */}
         <div className="h-24 w-full mb-4">
            <p className={`text-xs mb-2 ${isDarkTheme ? 'text-slate-500' : 'text-stone-500'}`}>This Week</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(() => {
                const days: { [key: string]: number } = {};
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                
                // Get start of current week (Sunday)
                const now = new Date();
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                
                // Get end of current week (Saturday)
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                endOfWeek.setHours(23, 59, 59, 999);
                
                // Filter sessions for current week only
                sessionHistory.forEach(session => {
                  const sessionDate = new Date(session.completedAt);
                  if (sessionDate >= startOfWeek && sessionDate <= endOfWeek) {
                    const dayName = dayNames[sessionDate.getDay()];
                    days[dayName] = (days[dayName] || 0) + session.duration;
                  }
                });
                return dayNames.map(day => ({ day, minutes: days[day] || 0 }));
              })()}>
                <XAxis dataKey="day" tick={{ fill: isDarkTheme ? '#64748b' : '#78716c', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: isDarkTheme ? '#0B101E' : '#fafaf9', borderColor: isDarkTheme ? '#334155' : '#d6d3d1', borderRadius: '8px' }}
                  itemStyle={{ color: isDarkTheme ? '#fff' : '#292524' }}
                  formatter={(value: number) => [`${value}m`, 'Focus']}
                />
                <Bar dataKey="minutes" fill="#39FF14" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
         </div>

         {/* Session History Toggle */}
         <button
           onClick={() => setShowHistory(!showHistory)}
           className={`w-full py-2 flex items-center justify-center gap-2 text-sm transition-colors ${
             isDarkTheme 
               ? 'text-slate-400 hover:text-white' 
               : 'text-stone-500 hover:text-stone-700'
           }`}
         >
           <History size={16} />
           Session History
           {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
         </button>

         {/* Session History List */}
         {showHistory && (
           <div className="mt-4 max-h-48 overflow-y-auto space-y-2">
             {todaySessions.length === 0 ? (
               <p className={`text-sm text-center py-4 ${isDarkTheme ? 'text-slate-500' : 'text-stone-500'}`}>No sessions completed today</p>
             ) : (
               todaySessions.map((session) => (
                 <div 
                   key={session.id} 
                   className={`flex items-center justify-between p-3 rounded-xl border ${
                     isDarkTheme 
                       ? 'bg-white/5 border-white/5' 
                       : 'bg-stone-50/80 border-stone-200/60'
                   }`}
                 >
                   <div>
                     <p className={`text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-stone-800'}`}>{session.task}</p>
                     <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-stone-500'}`}>{session.type} • {session.duration}min</p>
                   </div>
                   <span className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-stone-400'}`}>{formatSessionTime(session.completedAt)}</span>
                 </div>
               ))
             )}
             {todaySessions.length > 0 && (
               <button
                 onClick={onClearHistory}
                 className="w-full py-2 text-xs text-red-400 hover:text-red-300 transition-colors"
               >
                 Clear History
               </button>
             )}
           </div>
         )}
      </div>
    </div>
  );
};

export default StatsPanel;