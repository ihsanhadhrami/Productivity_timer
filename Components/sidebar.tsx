import React from 'react';
import { LayoutGrid, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkTheme?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isDarkTheme = true }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutGrid, label: 'Timer' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 w-full md:w-20 md:h-screen md:static backdrop-blur-md border-t md:border-t-0 md:border-r flex md:flex-col justify-between items-center py-4 md:py-8 z-50 ${
      isDarkTheme 
        ? 'bg-surface/50 border-white/5' 
        : 'bg-white/60 border-stone-200/60'
    }`}>
      <div className="flex md:flex-col gap-1 w-full justify-evenly md:justify-start items-center">
        {/* Logo/Brand */}
        <div className={`hidden md:flex w-10 h-10 rounded-xl mb-12 items-center justify-center shadow-inner ${
          isDarkTheme 
            ? 'bg-gradient-to-br from-slate-700 to-slate-800' 
            : 'bg-gradient-to-br from-stone-200 to-stone-300'
        }`}>
           <span className="text-accent font-bold text-xl shadow-glow-sm">I</span>
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                group relative p-3 rounded-xl transition-all duration-300 ease-out
                ${isActive 
                  ? 'text-accent' 
                  : isDarkTheme 
                    ? 'text-slate-500 hover:text-slate-300' 
                    : 'text-stone-400 hover:text-stone-600'
                }
              `}
              aria-label={item.id}
            >
              {isActive && (
                <div className="absolute inset-0 bg-accent-dim rounded-xl blur-sm md:block hidden" />
              )}
              {/* Mobile active indicator dot */}
              {isActive && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full md:hidden" />
              )}
              
              <Icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2}
                className="relative z-10 transition-transform duration-300 group-hover:scale-110" 
              />
              
              {/* Left border indicator for desktop */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-full hidden md:block -ml-[18px]" />
              )}
            </button>
          );
        })}
      </div>
      
      <div className="hidden md:flex flex-col gap-6">
         {/* Bottom utility icons could go here */}
      </div>
    </nav>
  );
};

export default Sidebar;
