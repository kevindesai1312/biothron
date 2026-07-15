import React from 'react';
import { Home, UserCircle2, Activity, BarChart3, Settings } from 'lucide-react';

const Sidebar = ({ currentView, onViewChange, isAdmin }) => {
  const navItems = [
    { id: 'chat', label: 'Patient Hub', icon: Home },
    { id: 'schemes', label: 'Health Programs', icon: Activity },
    { id: 'hospitals', label: 'Hospitals', icon: UserCircle2 },
    { id: 'analytics', label: 'Admin Insights', icon: BarChart3 },
    { id: 'ussd', label: 'USSD Channel', icon: Settings }, // Using settings icon for this secondary channel or change it
  ];

  return (
    <div className="w-24 h-full flex flex-col items-center py-8 glass-card border-none shadow-[0_4px_30px_rgba(0,128,128,0.1)] bg-white/80 shrink-0">
      <div className="mb-12">
        {/* Placeholder for Logo if needed, otherwise just structural spacing */}
        <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-teal-200">
          SAI
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-6 w-full items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center w-20 py-3 rounded-2xl transition-all duration-300 group
                ${isActive 
                  ? 'bg-gradient-to-b from-teal-50 to-emerald-100 shadow-inner' 
                  : 'hover:bg-teal-50/50'
                }`}
            >
              <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-white shadow-sm' : 'group-hover:scale-110'}`}>
                <Icon 
                  className={`w-6 h-6 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} 
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
              </div>
              <span className={`text-[10px] mt-2 font-medium text-center leading-tight
                ${isActive ? 'text-teal-700' : 'text-slate-400'}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
      
      {isAdmin && (
        <div className="mt-auto">
          <button 
            onClick={() => onViewChange('settings')}
            className={`flex flex-col items-center justify-center w-20 py-3 rounded-2xl transition-all duration-300 group
              ${currentView === 'settings'
                ? 'bg-gradient-to-b from-teal-50 to-emerald-100 shadow-inner' 
                : 'hover:bg-teal-50/50'
              }`}
          >
             <div className={`p-2 rounded-xl transition-all duration-300 ${currentView === 'settings' ? 'bg-white shadow-sm' : 'group-hover:scale-110'}`}>
                <Settings className={`w-6 h-6 ${currentView === 'settings' ? 'text-teal-600' : 'text-slate-400'}`} strokeWidth={currentView === 'settings' ? 2.5 : 1.5} />
             </div>
             <span className={`text-[10px] mt-2 font-medium ${currentView === 'settings' ? 'text-teal-700' : 'text-slate-400'}`}>Settings</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
