import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen, Shield, Users, Flame, Globe2, Chrome } from 'lucide-react';
import { motion } from 'motion/react';

export default function AuthScreen() {
  const { loginWithGoogle, loginAsGuest, isCloudReady } = useApp();
  const [guestName, setGuestName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setIsSubmitting(true);
    try {
      await loginAsGuest(guestName);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05060b] text-slate-100 flex flex-col justify-between p-4 md:p-8 relative overflow-hidden">
      {/* Decorative Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-800/30 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            CoStudy Space
          </span>
        </div>
        
        {/* Mode Toast Indicator */}
        <div className={`text-xs px-3.5 py-1.5 rounded-full border flex items-center space-x-2 bg-black/40 backdrop-blur-2xl ${isCloudReady ? 'border-white/10 text-indigo-400' : 'border-white/5 text-slate-400'}`}>
          <span className={`w-2 h-2 rounded-full ${isCloudReady ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-400'}`} />
          <span>{isCloudReady ? "Cloud Synced Ready" : "Local Sandbox Sync"}</span>
        </div>
      </div>

      {/* Main Grid */}
      <main className="max-w-6xl mx-auto w-full grid md:grid-cols-12 gap-8 items-center justify-center my-auto relative z-10 py-8">
        {/* Left column: Visual Presentation */}
        <div className="md:col-span-7 space-y-8 pr-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="inline-block bg-white/5 border border-white/10 px-3 py-1 rounded-full text-indigo-400 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              Productivity Redefined &middot; Pro
            </div>
            <h1 className="text-4xl lg:text-5xl font-black font-sans tracking-tight text-white leading-[1.15]">
              Real-Time Co-Working for <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">Scholars and Creators.</span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg max-w-xl font-sans leading-relaxed">
              Unlock professional study spaces. Track progress, check off deep focus logs, listen to custom environmental waves, and collaborate with like-minded scholars world-wide.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex space-x-3 bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-md hover:border-white/10 transition duration-155">
              <Users className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-200 text-sm">Study Rooms</h4>
                <p className="text-xs text-slate-400 mt-0.5">Customizable timers and active session syncing.</p>
              </div>
            </div>
            <div className="flex space-x-3 bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-md hover:border-white/10 transition duration-155">
              <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-200 text-sm">Performance Tracks</h4>
                <p className="text-xs text-slate-400 mt-0.5">Visualize subject donuts and daily focus streaks.</p>
              </div>
            </div>
            <div className="flex space-x-3 bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-md hover:border-white/10 transition duration-155">
              <Globe2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-200 text-sm">Conversations</h4>
                <p className="text-xs text-slate-400 mt-0.5">Instant communication without leaving focus states.</p>
              </div>
            </div>
            <div className="flex space-x-3 bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-md hover:border-white/10 transition duration-155">
              <Shield className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-200 text-sm">Cloud Ready</h4>
                <p className="text-xs text-slate-400 mt-0.5">Automatic databases storage for cross-platform access.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Auth Forms */}
        <div className="md:col-span-5 w-full max-w-md mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl"
          >
            <div className="space-y-2 mb-6 text-center md:text-left">
              <h2 className="text-2xl font-bold font-sans text-white tracking-tight">Select Entrance</h2>
              <p className="text-xs text-slate-400">Choose a nickname or connect an official account.</p>
            </div>

            {/* Quick Guest Enter (Primary layout) */}
            <form onSubmit={handleSubmitGuest} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Scholar Nickname
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter study moniker..."
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  maxLength={18}
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 hover:border-white/20 rounded-xl px-4 py-3 text-slate-100 font-sans text-sm outline-none transition placeholder:text-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !guestName.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white font-semibold text-sm py-3 px-4 rounded-xl transition duration-150 shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>{isSubmitting ? "Creating study deck..." : "Access as Guest Scholar"}</span>
              </button>
            </form>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <span className="relative bg-[#0d131f] px-3 text-[10px] uppercase text-slate-500 font-bold tracking-widest bg-transparent">
                Or Connect Securely
              </span>
            </div>

            {/* Google authentication SSO */}
            <button
              onClick={loginWithGoogle}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-200 font-medium text-xs py-3 px-4 rounded-xl transition flex items-center justify-center space-x-2.5 cursor-pointer"
            >
              <Chrome className="w-4 h-4 text-indigo-400" />
              <span>Connect Google Account</span>
            </button>

            {/* Hint details */}
            <p className="text-center font-mono text-[10px] text-slate-500 mt-6 leading-relaxed bg-black/20 p-2.5 rounded-xl border border-white/5">
              {!isCloudReady 
                ? "Local Mode: All Pomodoro stats and tasks are backed up in this browser sandbox locally." 
                : "Active Cloud Sync: Sessions and chat messages synced securely to cloud servers."
              }
            </p>
          </motion.div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="max-w-7xl mx-auto w-full text-center relative z-10 py-4 border-t border-white/5">
        <p className="font-mono text-[10px] text-slate-600 uppercase tracking-wider">
          CoStudy Applet &copy; {new Date().getFullYear()} &middot; Designed with desktop-first precision and zero telemetry bloat.
        </p>
      </footer>
    </div>
  );
}
