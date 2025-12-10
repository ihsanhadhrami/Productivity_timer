import React, { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';

interface HeaderProps {
  focusTask: string;
  setFocusTask: (task: string) => void;
  isDarkTheme?: boolean;
}

const Header: React.FC<HeaderProps> = ({ focusTask, setFocusTask, isDarkTheme = true }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(focusTask);

  const handleSave = () => {
    if (editValue.trim()) {
      setFocusTask(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(focusTask);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  return (
    <header className={`w-full h-16 md:h-20 flex items-center justify-between px-6 md:px-10 border-b bg-transparent ${
      isDarkTheme ? 'border-white/5' : 'border-stone-200/60'
    }`}>
      {/* Left: Task Context */}
      <div className="flex items-center gap-3 flex-1">
        <div className="w-6 h-6 rounded-full bg-accent shadow-[0_0_10px_#39FF14] flex items-center justify-center flex-shrink-0">
          <span className="text-black font-bold text-sm">I</span>
        </div>
        <div className="flex flex-col flex-1 min-w-0">
            <span className={`text-[10px] uppercase tracking-widest font-bold ${isDarkTheme ? 'text-slate-500' : 'text-stone-400'}`}>Current Focus</span>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`border rounded px-2 py-1 text-sm w-full max-w-md focus:outline-none focus:border-accent ${
                    isDarkTheme 
                      ? 'bg-white/5 border-accent/50 text-white' 
                      : 'bg-stone-100 border-stone-300 text-stone-800'
                  }`}
                  autoFocus
                  placeholder="Enter your focus task..."
                />
                <button onClick={handleSave} className="p-1 text-accent hover:bg-accent/20 rounded">
                  <Check size={16} />
                </button>
                <button onClick={handleCancel} className={`p-1 rounded ${isDarkTheme ? 'text-slate-400 hover:bg-white/10' : 'text-stone-400 hover:bg-stone-200'}`}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <span className={`text-sm md:text-base font-medium tracking-wide truncate ${isDarkTheme ? 'text-slate-200' : 'text-stone-700'}`}>
                  {focusTask}
                </span>
                <button 
                  onClick={() => setIsEditing(true)}
                  className={`p-1 opacity-0 group-hover:opacity-100 transition-opacity ${isDarkTheme ? 'text-slate-500 hover:text-accent' : 'text-stone-400 hover:text-accent'}`}
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}
        </div>
      </div>

      {/* Right: Empty space for balance */}
      <div className="w-10"></div>
    </header>
  );
};

export default Header;