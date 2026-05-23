import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import AuthScreen from './components/AuthScreen';
import RoomsLobby from './components/RoomsLobby';
import TasksList from './components/TasksList';
import Dashboard from './components/Dashboard';
import StudyRoomActive from './components/StudyRoomActive';
import { BookOpen, Compass, CloudLightning, Loader2 } from 'lucide-react';

function AppContent() {
  const { user, activeRoom, isLoading, isCloudReady } = useApp();
  const [activeTab, setActiveTab] = useState<string>("lobby");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs font-mono text-slate-500">Securing environment keys...</p>
      </div>
    );
  }

  // Authentication Lock
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#05060b] text-slate-150 flex flex-col md:flex-row relative overflow-x-hidden">
      {/* Dynamic Background ambience elements (Frosted Glass Theme) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-800/40 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-blue-500/30 rounded-full blur-[100px]" />
      </div>

      {/* Responsive Collapsible Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Study Deck Workspace */}
      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8 relative z-10 select-none">
        {activeRoom ? (
          // Immersive Study Session Layout
          <StudyRoomActive />
        ) : (
          // Tabs dashboard router
          <div className="space-y-6">
            {activeTab === 'lobby' && <RoomsLobby />}
            {activeTab === 'tasks' && <TasksList />}
            {activeTab === 'analytics' && <Dashboard />}
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

