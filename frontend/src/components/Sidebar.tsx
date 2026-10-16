import React from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileCheck, 
  GraduationCap, 
  FileText, 
  MessageSquareCode, 
  Settings as SettingsIcon,
  Compass,
  Bot
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'agent', name: 'Career Agent', icon: Bot },
    { id: 'jobs', name: 'Jobs', icon: Briefcase },
    { id: 'applications', name: 'Applications', icon: FileCheck },

    { id: 'skills', name: 'Skills', icon: GraduationCap },
    { id: 'resume', name: 'Resume', icon: FileText },
    { id: 'interview', name: 'Interview Prep', icon: MessageSquareCode },
    { id: 'settings', name: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-20">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <Compass className="h-8 w-8 text-indigo-400 animate-pulse" />
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">PathPilot</h1>
          <span className="text-xs text-indigo-400 font-medium">Career Ops Agent</span>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'hover:bg-slate-850 hover:text-slate-100'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'}`} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Version Tag */}
      <div className="p-6 border-t border-slate-800 text-xs text-slate-500">
        <p>Phase 1 Foundation</p>
        <p className="mt-1">v0.1.0 (Local Only)</p>
      </div>
    </aside>
  );
};
