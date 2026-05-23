import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Compass, 
  CheckSquare, 
  BarChart3, 
  LogOut, 
  BookOpen, 
  Menu, 
  X, 
  Flame, 
  Clock,
  CloudLightning
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { user, logout, isCloudReady, studyLogs } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  // Format total study hours nicely
  const hoursStudied = (user.totalStudyTime / 3600).toFixed(1);

  // Simple streak algorithm (based on daily distinct study dates)
  const getDailyStreak = () => {
    if (studyLogs.length === 0) return 0;
    const dates: string[] = studyLogs.map(log => log.createdAt.split('T')[0]);
    const uniqueDates: string[] = Array.from(new Set(dates)).sort((a: string, b: string) => b.localeCompare(a));
    
    // Check if studied today/yesterday to start counting back
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;
    
    let streak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const current = new Date(uniqueDates[i]);
      const next = new Date(uniqueDates[i+1]);
      const diffTime = Math.abs(current.getTime() - next.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      
      if (diffDays === 1) {
        streak++;
      } else if (diffDays > 1) {
        break;
      }
    }
    return streak;
  };

  const streak = getDailyStreak();

  const navItems = [
    { id: 'lobby', label: 'Study Lobbies', icon: Compass },
    { id: 'tasks', label: 'Workspace Tasks', icon: CheckSquare },
    { id: 'analytics', label: 'Progress Tracks', icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden bg-black/40 backdrop-blur-2xl border-b border-white/5 px-4 py-3 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-slate-105 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">CoStudy Space</span>
        </div>
        
        <div className="flex items-center space-x-3">
          {streak > 0 && (
            <div className="flex items-center space-x-1 text-amber-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{streak}d</span>
            </div>
          )}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-200 focus:outline-none p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Side Navigation for Desktop / Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-black/20 backdrop-blur-2xl border-r border-white/5 flex flex-col justify-between p-6 transition-all duration-300 transform
        md:translate-x-0 md:static md:h-screen
        ${isOpen ? 'translate-x-0 bg-black/95 backdrop-blur-3xl' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-8">
          {/* Brand header */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">CoStudy Space</span>
            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-indigo-400 font-semibold uppercase tracking-wider">Pro</span>
          </div>

          {/* Quick Metrics Row for Desktop */}
          <div className="bg-white/5 backdrop-blur-md border border-white/5 p-4 rounded-2xl space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Metrics</span>
              {streak > 0 ? (
                <div className="flex items-center space-x-1 text-amber-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  <Flame className="w-3 h-3 fill-current animate-pulse" />
                  <span>{streak} Days</span>
                </div>
              ) : (
                <span className="text-[9px] text-slate-550 uppercase tracking-widest font-semibold bg-white/5 px-1.5 py-0.5 rounded">No streak</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10px] font-semibold tracking-wide text-slate-400">Hrs Studied</span>
                </div>
                <div className="text-sm font-semibold text-slate-100 font-mono">{hoursStudied}h</div>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1 text-slate-400">
                  <CloudLightning className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-semibold tracking-wide text-slate-400">Sessions</span>
                </div>
                <div className="text-sm font-semibold text-slate-100 font-mono">{user.totalSessions}</div>
              </div>
            </div>
          </div>

          {/* Main Navigation Links */}
          <nav className="space-y-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-3 px-3">
              Main Menu
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm transition font-medium cursor-pointer group
                    ${isActive 
                      ? 'bg-white/5 text-white font-medium border border-white/10 shadow-lg' 
                      : 'text-slate-450 hover:text-white hover:bg-white/5 border border-transparent'}
                  `}
                >
                  <Icon className={`w-4 h-4 transition ${isActive ? 'text-indigo-400' : 'text-slate-550 group-hover:text-white'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout controls */}
        <div className="border-t border-white/5 pt-4 space-y-4">
          <div className="flex items-center space-x-3 px-1">
            {user.photoUrl ? (
              <img 
                src={user.photoUrl} 
                alt="Avatar" 
                referrerPolicy="no-referrer"
                className="w-[38px] h-[38px] rounded-full object-cover border border-white/20 p-0.5"
              />
            ) : (
              <div className="w-[38px] h-[38px] rounded-full border border-white/25 p-0.5">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                  {user.displayName.substring(0, 2).toUpperCase()}
                </div>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-slate-205 truncate tracking-tight">{user.displayName}</h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-sans truncate">{user.email ? "Scholar" : "Guest Scholar"}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-350 hover:text-white transition py-2.5 px-4 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Drawer Overlay backdrop for mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm md:hidden"
        />
      )}
    </>
  );
}
