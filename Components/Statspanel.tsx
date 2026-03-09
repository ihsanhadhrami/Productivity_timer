import React, { useState, useMemo, useCallback } from 'react';
import { Zap, Clock, Target, History, RotateCcw, ChevronDown, ChevronUp, Edit2, Check, Flame, ListTodo, X } from 'lucide-react';
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
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  
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

  // Group today's sessions by activity/task
  const activitySummary = useMemo(() => {
    const activityMap = new Map<string, { minutes: number; sessions: number; lastTime: string }>();
    
    todaySessions.forEach(session => {
      const task = session.task || 'Unnamed Task';
      const existing = activityMap.get(task) || { minutes: 0, sessions: 0, lastTime: '' };
      activityMap.set(task, {
        minutes: existing.minutes + session.duration,
        sessions: existing.sessions + 1,
        lastTime: session.completedAt
      });
    });
    
    // Convert to array and sort by minutes (descending)
    return Array.from(activityMap.entries())
      .map(([task, data]) => ({ task, ...data }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [todaySessions]);

  // Calculate total minutes for percentage calculation
  const totalActivityMinutes = activitySummary.reduce((sum, a) => sum + a.minutes, 0);

  // Activity colors for visual distinction
  const activityColors = [
    'from-accent to-green-400',
    'from-blue-500 to-cyan-400',
    'from-purple-500 to-pink-400',
    'from-orange-500 to-yellow-400',
    'from-red-500 to-rose-400',
    'from-teal-500 to-emerald-400',
  ];

  // Solid hex colors matching the gradient palette (for Recharts bars)
  const solidColors = [
    '#39FF14', // green/accent
    '#3B82F6', // blue
    '#A855F7', // purple
    '#F97316', // orange
    '#EF4444', // red
    '#14B8A6', // teal
    '#EC4899', // pink
    '#FACC15', // yellow
  ];

  // Weekly stacked chart data
  const { weeklyData, weekTasks, weekSessionsByDay } = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const taskSet = new Set<string>();
    const dayTaskMap: Record<string, Record<string, number>> = {};
    const daySessionsMap: Record<string, SessionHistory[]> = {};
    dayNames.forEach(d => { dayTaskMap[d] = {}; daySessionsMap[d] = []; });

    sessionHistory.forEach(session => {
      const sessionDate = new Date(session.completedAt);
      if (sessionDate >= startOfWeek && sessionDate <= endOfWeek) {
        const dayName = dayNames[sessionDate.getDay()];
        const task = session.task || 'Unnamed Task';
        taskSet.add(task);
        dayTaskMap[dayName][task] = (dayTaskMap[dayName][task] || 0) + session.duration;
        daySessionsMap[dayName].push(session);
      }
    });

    const tasks = Array.from(taskSet);
    const data = dayNames.map(day => {
      const entry: Record<string, any> = { day };
      tasks.forEach(t => { entry[t] = dayTaskMap[day][t] || 0; });
      return entry;
    });

    return { weeklyData: data, weekTasks: tasks, weekSessionsByDay: daySessionsMap };
  }, [sessionHistory]);

  // Details for selected day
  const selectedDaySessions = useMemo(() => {
    if (!selectedDay) return [];
    return weekSessionsByDay[selectedDay] || [];
  }, [selectedDay, weekSessionsByDay]);

  const handleBarClick = useCallback((dayName: string) => {
    setSelectedDay(prev => prev === dayName ? null : dayName);
  }, []);

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

      {/* Today's Activities Results Bar */}
      {activitySummary.length > 0 && (
        <div className={`backdrop-blur-xl border rounded-3xl p-6 ${
          isDarkTheme 
            ? 'bg-surface/60 border-white/5' 
            : 'bg-white/70 border-stone-200/60 shadow-sm'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <ListTodo size={18} className="text-accent" />
            <h3 className={`text-xs font-bold uppercase tracking-widest ${isDarkTheme ? 'text-slate-500' : 'text-stone-400'}`}>
              Today's Activities
            </h3>
          </div>
          
          {/* Stacked Results Bar */}
          <div className={`w-full h-4 rounded-full mb-4 overflow-hidden flex ${isDarkTheme ? 'bg-slate-800' : 'bg-stone-200'}`}>
            {activitySummary.map((activity, index) => {
              const percentage = totalActivityMinutes > 0 ? (activity.minutes / totalActivityMinutes) * 100 : 0;
              return (
                <div
                  key={activity.task}
                  className={`h-full bg-gradient-to-r ${activityColors[index % activityColors.length]} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                  title={`${activity.task}: ${activity.minutes} min`}
                />
              );
            })}
          </div>

          {/* Activity List */}
          <div className="space-y-3">
            {activitySummary.map((activity, index) => (
              <div 
                key={activity.task}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  isDarkTheme 
                    ? 'bg-white/5 border-white/5 hover:border-white/10' 
                    : 'bg-stone-50/80 border-stone-200/60 hover:border-stone-300/60'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div 
                    className={`w-3 h-3 rounded-full bg-gradient-to-r ${activityColors[index % activityColors.length]} flex-shrink-0`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${isDarkTheme ? 'text-white' : 'text-stone-800'}`}>
                      {activity.task}
                    </p>
                    <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-stone-500'}`}>
                      {activity.sessions} session{activity.sessions > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className={`text-sm font-mono font-bold ${isDarkTheme ? 'text-white' : 'text-stone-800'}`}>
                    {activity.minutes}<span className={`text-xs ml-0.5 ${isDarkTheme ? 'text-slate-500' : 'text-stone-400'}`}>m</span>
                  </p>
                  <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-stone-500'}`}>
                    {formatSessionTime(activity.lastTime)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Total Summary */}
          <div className={`mt-4 pt-4 border-t ${isDarkTheme ? 'border-white/10' : 'border-stone-200/60'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${isDarkTheme ? 'text-slate-400' : 'text-stone-500'}`}>
                Total across {activitySummary.length} activit{activitySummary.length > 1 ? 'ies' : 'y'}
              </span>
              <span className={`text-sm font-mono font-bold ${isDarkTheme ? 'text-accent' : 'text-accent'}`}>
                {totalActivityMinutes} min
              </span>
            </div>
          </div>
        </div>
      )}

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
         <div className="w-full mb-4">
            <p className={`text-xs mb-2 ${isDarkTheme ? 'text-slate-500' : 'text-stone-500'}`}>This Week</p>
            <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} onClick={(state: any) => {
                if (state && state.activeLabel) handleBarClick(state.activeLabel);
              }} style={{ cursor: 'pointer' }}>
                <XAxis dataKey="day" tick={{ fill: isDarkTheme ? '#64748b' : '#78716c', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: isDarkTheme ? '#0B101E' : '#fafaf9', borderColor: isDarkTheme ? '#334155' : '#d6d3d1', borderRadius: '8px' }}
                  itemStyle={{ color: isDarkTheme ? '#fff' : '#292524' }}
                  formatter={(value: number, name: string) => [`${value}m`, name]}
                />
                {weekTasks.length === 0 ? (
                  <Bar dataKey="minutes" fill="#39FF14" radius={[4, 4, 0, 0]} />
                ) : (
                  weekTasks.map((task, idx) => (
                    <Bar
                      key={task}
                      dataKey={task}
                      stackId="week"
                      fill={solidColors[idx % solidColors.length]}
                      radius={idx === weekTasks.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))
                )}
              </BarChart>
            </ResponsiveContainer>
            </div>

            {/* Task color legend */}
            {weekTasks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {weekTasks.map((task, idx) => (
                  <div key={task} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: solidColors[idx % solidColors.length] }} />
                    <span className={`text-[10px] truncate max-w-[80px] ${isDarkTheme ? 'text-slate-400' : 'text-stone-500'}`}>{task}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tap hint */}
            <p className={`text-[10px] mt-1 ${isDarkTheme ? 'text-slate-600' : 'text-stone-400'}`}>
              Tap a day to view details
            </p>

            {/* Selected day detail panel */}
            {selectedDay && (
              <div className={`mt-3 p-4 rounded-2xl border animate-in fade-in slide-in-from-top-2 duration-300 ${
                isDarkTheme
                  ? 'bg-white/5 border-white/10'
                  : 'bg-stone-50/80 border-stone-200/60'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`text-sm font-bold ${isDarkTheme ? 'text-white' : 'text-stone-800'}`}>
                    {selectedDay}'s Sessions
                  </h4>
                  <button onClick={() => setSelectedDay(null)} className={`p-1 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-white/10' : 'hover:bg-stone-200'}`}>
                    <X size={14} className={isDarkTheme ? 'text-slate-400' : 'text-stone-500'} />
                  </button>
                </div>
                {selectedDaySessions.length === 0 ? (
                  <p className={`text-xs text-center py-2 ${isDarkTheme ? 'text-slate-500' : 'text-stone-500'}`}>No sessions on this day</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedDaySessions.map((session) => {
                      const taskIdx = weekTasks.indexOf(session.task || 'Unnamed Task');
                      const color = solidColors[(taskIdx >= 0 ? taskIdx : 0) % solidColors.length];
                      return (
                        <div
                          key={session.id}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                            isDarkTheme
                              ? 'bg-white/5 border-white/5'
                              : 'bg-white/80 border-stone-200/60'
                          }`}
                        >
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium truncate ${isDarkTheme ? 'text-white' : 'text-stone-800'}`}>
                              {session.task || 'Unnamed Task'}
                            </p>
                            <p className={`text-[10px] ${isDarkTheme ? 'text-slate-500' : 'text-stone-400'}`}>
                              {session.type} • {formatSessionTime(session.completedAt)}
                            </p>
                          </div>
                          <span className={`text-xs font-mono font-bold flex-shrink-0 ${isDarkTheme ? 'text-white' : 'text-stone-800'}`}>
                            {session.duration}<span className={`text-[10px] ${isDarkTheme ? 'text-slate-500' : 'text-stone-400'}`}>m</span>
                          </span>
                        </div>
                      );
                    })}
                    <div className={`flex justify-between pt-2 border-t ${isDarkTheme ? 'border-white/10' : 'border-stone-200/60'}`}>
                      <span className={`text-[10px] ${isDarkTheme ? 'text-slate-500' : 'text-stone-400'}`}>
                        {selectedDaySessions.length} session{selectedDaySessions.length > 1 ? 's' : ''}
                      </span>
                      <span className={`text-xs font-mono font-bold ${isDarkTheme ? 'text-accent' : 'text-accent'}`}>
                        {selectedDaySessions.reduce((s, ss) => s + ss.duration, 0)}m total
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
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