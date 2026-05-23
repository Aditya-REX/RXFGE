import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  Flame, 
  Volume2, 
  Send, 
  Users, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  Coffee, 
  VolumeX,
  Plus,
  Compass,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, Task } from '../types';

export default function StudyRoomActive() {
  const { 
    activeRoom, 
    leaveRoom, 
    chatMessages, 
    sendMessage, 
    updateRoomTimer,
    tasks,
    toggleTask,
    addTask,
    saveStudyLog,
    user,
    isCloudReady
  } = useApp();

  const [timeLeft, setTimeLeft] = useState(1500); // Default study duration
  const [isRunning, setIsRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<"work" | "break">("work");
  const [initialDuration, setInitialDuration] = useState(1500);
  
  // Custom Timer adjust inputs
  const [customMin, setCustomMin] = useState("25");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

  // Sound Synthesizers States
  const [synthActive, setSynthActive] = useState(false);
  const [rainVolume, setRainVolume] = useState(0.5);
  const [staticVolume, setStaticVolume] = useState(0.2);
  const [droneVolume, setDroneVolume] = useState(0.4);

  // Chat message textbox
  const [messageText, setMessageText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Web Audio Context refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rainNodeRef = useRef<GainNode | null>(null);
  const staticNodeRef = useRef<GainNode | null>(null);
  const droneNodeRef = useRef<GainNode | null>(null);
  
  // Oscillators and Noise Nodes for Web Audio synthesis
  const synthSourcesRef = useRef<any[]>([]);

  // Task inline insert input
  const [inlineTaskTitle, setInlineTaskTitle] = useState("");

  const activeUserTasks = tasks.filter(t => !t.completed);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Synchronised Timer Core System
  useEffect(() => {
    if (!activeRoom) return;

    // Is there an active shared cloud timer countdown running?
    if (activeRoom.timerStatus !== "idle" && activeRoom.timerEndsAt) {
      setIsRunning(true);
      setTimerMode(activeRoom.timerStatus === "work" ? "work" : "break");
      setInitialDuration(activeRoom.timerDuration);

      const interval = setInterval(() => {
        const endTime = new Date(activeRoom.timerEndsAt!).getTime();
        const diff = Math.max(0, Math.round((endTime - Date.now()) / 1000));
        
        setTimeLeft(diff);

        if (diff <= 0) {
          setIsRunning(false);
          clearInterval(interval);
          handleTimerComplete();
        }
      }, 250);

      return () => clearInterval(interval);
    } else {
      // Local/Offline Timer Countdown management
      setIsRunning(false);
      if (activeRoom.timerStatus === "idle") {
        setTimeLeft(activeRoom.timerDuration);
      }
    }
  }, [activeRoom?.timerStatus, activeRoom?.timerEndsAt, activeRoom?.timerDuration]);

  // Handle countdown if in local offline state but running locally
  useEffect(() => {
    if (isCloudReady) return; // If online, handled by real-time hook above
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          clearInterval(interval);
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isCloudReady]);

  // Auto-fill active tasks dropdown if selected task completes or gets deleted
  useEffect(() => {
    if (activeUserTasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(activeUserTasks[0].id);
    }
  }, [activeUserTasks, selectedTaskId]);

  const handleTimerComplete = async () => {
    if (!activeRoom || !user) return;
    
    // Play subtle synthesized bell noise to celebrate!
    triggerCongratsBell();

    const selectedTask = tasks.find(t => t.id === selectedTaskId);
    const label = selectedTask ? selectedTask.title : "Completed Focus interval";

    // Save logs
    if (timerMode === "work") {
      await saveStudyLog(
        activeRoom.name === "silent-hall" ? "General Focus" : activeRoom.name.split(" ")[0] || "General",
        initialDuration,
        label
      );
      
      // Auto complete selected task
      if (selectedTaskId) {
        toggleTask(selectedTaskId);
      }
      
      alert(`🎉 Session completed! You did fantastic. Studied for ${Math.round(initialDuration/60)} minutes.`);
    } else {
      alert("☕ Break interval concluded! Time to jump back in.");
    }

    // Reset shared timer state
    await updateRoomTimer(activeRoom.id, {
      timerStatus: "idle",
      timerEndsAt: null
    });
  };

  const handleStartTimer = async (statusType: "work" | "break", seconds: number) => {
    if (!activeRoom) return;

    setTimerMode(statusType === "work" ? "work" : "break");
    setInitialDuration(seconds);
    setTimeLeft(seconds);

    const now = Date.now();
    const endsAt = new Date(now + seconds * 1000).toISOString();

    await updateRoomTimer(activeRoom.id, {
      timerStatus: statusType,
      timerDuration: seconds,
      timerEndsAt: endsAt
    });

    if (!isCloudReady) {
      setIsRunning(true);
    }
  };

  const handleStopTimer = async () => {
    if (!activeRoom) return;

    await updateRoomTimer(activeRoom.id, {
      timerStatus: "idle",
      timerEndsAt: null
    });

    if (!isCloudReady) {
      setIsRunning(false);
      setTimeLeft(initialDuration);
    }
  };

  const handleCustomTimerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customMin);
    if (isNaN(mins) || mins < 1 || mins > 180) {
      alert("Please enter a value between 1 and 180 minutes.");
      return;
    }
    handleStartTimer("work", mins * 60);
  };

  // --- AUDIO SYNTHESIZER LOGIC (Web Audio API) ---

  const initSynth = () => {
    if (audioCtxRef.current) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    // 1. Rain Synthesizer Node
    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(rainVolume, ctx.currentTime);
    rainNodeRef.current = rainGain;

    // 2. Wave Brownian Static Node
    const staticGain = ctx.createGain();
    staticGain.gain.setValueAtTime(staticVolume, ctx.currentTime);
    staticNodeRef.current = staticGain;

    // 3. Low Pulsing Lofi Meditation Drone Gain Node
    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(droneVolume, ctx.currentTime);
    droneNodeRef.current = droneGain;

    // Pipe Gains to primary speaker destination
    rainGain.connect(ctx.destination);
    staticGain.connect(ctx.destination);
    droneGain.connect(ctx.destination);

    // Build Brownian Wave Deep Static Generator Buffer
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02; // Simple low-pass brown noise filter approximation
      lastOut = output[i];
      output[i] *= 3.5; // Gain compensation
    }

    const staticSource = ctx.createBufferSource();
    staticSource.buffer = noiseBuffer;
    staticSource.loop = true;
    
    // Connect to LP Filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, ctx.currentTime);

    staticSource.connect(filter);
    filter.connect(staticGain);
    staticSource.start();
    synthSourcesRef.current.push(staticSource);

    // Build Rain Synthesizer (Highpass white noise crackles + filters)
    const rainBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const rainOutput = rainBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      rainOutput[i] = Math.random() * 2 - 1;
    }
    const rainSource = ctx.createBufferSource();
    rainSource.buffer = rainBuffer;
    rainSource.loop = true;

    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.setValueAtTime(900, ctx.currentTime);
    rainFilter.Q.setValueAtTime(1.5, ctx.currentTime);

    rainSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainSource.start();
    synthSourcesRef.current.push(rainSource);

    // Build low drone pulsing Lofi oscillations chord
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(55, ctx.currentTime); // A1 note (comforting deep hum)

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(110, ctx.currentTime); // A2 note fifth offset approximation

    // Depth Pulse Tremolo LFO
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.15; // Slow 6.5s wave intervals
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.25;

    lfo.connect(lfoGain);
    lfoGain.connect(droneGain.gain); // Pulsate the volume gain!

    osc1.connect(droneGain);
    osc2.connect(droneGain);
    
    osc1.start();
    osc2.start();
    lfo.start();

    synthSourcesRef.current.push(osc1, osc2, lfo);
  };

  const handleToggleSynth = () => {
    if (synthActive) {
      // Disconnect/Shutdown ctx
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      synthSourcesRef.current = [];
      setSynthActive(false);
    } else {
      initSynth();
      setSynthActive(true);
    }
  };

  // Live congratulate sound trigger (Synthesizing double gold bell ding!)
  const triggerCongratsBell = () => {
    try {
      const BellContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new BellContext();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High elegant chime
      osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.12); // Double tone

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 1.3);
    } catch (_) {}
  };

  // Synthesizer real-time Sliders adjustments
  useEffect(() => {
    if (rainNodeRef.current && audioCtxRef.current) {
      rainNodeRef.current.gain.setValueAtTime(rainVolume, audioCtxRef.current.currentTime);
    }
  }, [rainVolume]);

  useEffect(() => {
    if (staticNodeRef.current && audioCtxRef.current) {
      staticNodeRef.current.gain.setValueAtTime(staticVolume, audioCtxRef.current.currentTime);
    }
  }, [staticVolume]);

  useEffect(() => {
    if (droneNodeRef.current && audioCtxRef.current) {
      droneNodeRef.current.gain.setValueAtTime(droneVolume, audioCtxRef.current.currentTime);
    }
  }, [droneVolume]);

  useEffect(() => {
    // Teardown Web Audio synthesize nodes on component dismount to prevent leaks
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Send dynamic chat logic
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendMessage(messageText);
    setMessageText("");
  };

  const handleInlineTaskAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTaskTitle.trim()) return;
    const sub = activeRoom?.name === "silent-hall" ? "General" : activeRoom?.name.split(" ")[0] || "General";
    addTask(inlineTaskTitle, sub);
    setInlineTaskTitle("");
  };

  if (!activeRoom || !user) return null;

  // Render nicely formatted minutes & seconds timer counters
  const displayMins = Math.floor(timeLeft / 60);
  const displaySecs = timeLeft % 60;
  const timeFormatted = `${displayMins.toString().padStart(2, '0')}:${displaySecs.toString().padStart(2, '0')}`;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Back button header */}
      <div className="flex justify-between items-center bg-[#111625] border border-slate-850 p-4 rounded-2xl">
        <button
          onClick={leaveRoom}
          className="flex items-center space-x-2.5 text-slate-450 hover:text-white transition font-semibold text-sm cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Exit Workspace Lobbies</span>
        </button>

        <div className="flex items-center space-x-2 text-xs bg-indigo-900/40 text-indigo-400 font-bold border border-indigo-505/20 px-3.5 py-1.5 rounded-full">
          <Layers className="w-3.5 h-3.5 animate-spin" />
          <span className="font-sans text-[11px] truncate">{activeRoom.name}</span>
        </div>
      </div>

      {/* Main Core Grid layout (Timer + Audio beats left, chat + tasks right) */}
      <div className="grid lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: TIMER & AUDIO BEATS CONTROLS */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* 1. Timer visual display block */}
          <div className="bg-[#111625] border border-slate-850 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* Ambient Background wave loop reflection */}
            {isRunning && (
              <div className={`absolute inset-0 opacity-[0.03] transition-all duration-1000 ${timerMode === 'work' ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
            )}

            <span className="text-xs uppercase font-extrabold tracking-widest text-slate-450 mb-1 flex items-center space-x-1.5 font-sans">
              {timerMode === "work" ? <Flame className="w-4 h-4 text-orange-400" /> : <Coffee className="w-4 h-4 text-emerald-400" />}
              <span>{timerMode === "work" ? "Deep Focus Segment" : "Relaxation Segment"}</span>
            </span>

            {/* Huge numerical readout */}
            <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-slate-100 my-4 select-none font-mono font-medium drop-shadow-lg leading-none">
              {timeFormatted}
            </h1>

            {/* Quick preset timers triggers */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <button
                onClick={() => handleStartTimer("work", 1500)}
                disabled={isRunning}
                className="px-3.5 py-1.5 rounded-xl border border-slate-800 hover:border-indigo-500/20 bg-slate-900 hover:bg-slate-850 text-xs font-semibold text-slate-350 disabled:opacity-50 cursor-pointer"
              >
                Focus (25m)
              </button>
              <button
                onClick={() => handleStartTimer("work", 3000)}
                disabled={isRunning}
                className="px-3.5 py-1.5 rounded-xl border border-slate-800 hover:border-indigo-500/20 bg-slate-900 hover:bg-slate-850 text-xs font-semibold text-slate-350 disabled:opacity-50 cursor-pointer"
              >
                Extended (50m)
              </button>
              <button
                onClick={() => handleStartTimer("break", 300)}
                disabled={isRunning}
                className="px-3.5 py-1.5 rounded-xl border border-slate-800 hover:border-emerald-500/20 bg-slate-900 hover:bg-slate-850 text-xs font-semibold text-emerald-400 disabled:opacity-50 cursor-pointer"
              >
                Rest (5m)
              </button>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex items-center space-x-4">
              {isRunning ? (
                <button
                  onClick={handleStopTimer}
                  className="bg-rose-650 hover:bg-rose-600 px-6 py-3.5 rounded-xl text-white font-bold text-sm transition tracking-wide shadow-lg shadow-rose-600/10 cursor-pointer flex items-center space-x-2"
                >
                  <Pause className="w-4.5 h-4.5 fill-current" />
                  <span>Pause Segment</span>
                </button>
              ) : (
                <button
                  onClick={() => handleStartTimer("work", initialDuration)}
                  className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3.5 rounded-xl text-white font-bold text-sm transition tracking-wide shadow-lg shadow-indigo-600/10 cursor-pointer flex items-center space-x-2"
                >
                  <Play className="w-4.5 h-4.5 fill-current" />
                  <span>Initialize Focus</span>
                </button>
              )}

              <button
                onClick={handleStopTimer}
                disabled={!isRunning && timeLeft === initialDuration}
                className="border border-slate-800 hover:border-slate-705 p-3.5 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Reset timer"
              >
                <RotateCcw className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Custom customizable timer form block */}
            <form onSubmit={handleCustomTimerSubmit} className="mt-8 border-t border-slate-850 pt-5 w-full max-w-sm flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono flex-shrink-0">Custom timer:</span>
              <input
                type="number"
                min="1"
                max="180"
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                className="w-16 bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-lg px-2 py-1.5 text-center font-mono outline-none focus:border-indigo-505"
              />
              <span className="text-xs text-slate-500 font-mono flex-shrink-0">mins</span>
              <button
                type="submit"
                className="ml-auto bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold py-1.5 px-3 rounded-lg cursor-pointer max-w-none"
              >
                Set
              </button>
            </form>
          </div>

          {/* 2. Audio Focus Synthesizer Waves Panel */}
          <div className="bg-[#111625] border border-slate-850 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-200 text-sm flex items-center space-x-2">
                  <Volume2 className="w-4.5 h-4.5 text-emerald-400" />
                  <span>Interactive Binaural Synth</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Generate real-time environmental comfort streams client-side.</p>
              </div>

              <button
                onClick={handleToggleSynth}
                className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold cursor-pointer transition ${synthActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}
              >
                {synthActive ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{synthActive ? "Synth Audio Active" : "Start Synthesizer"}</span>
              </button>
            </div>

            {synthActive ? (
              <div className="grid sm:grid-cols-3 gap-4 bg-slate-950/40 p-4 border border-slate-850/60 rounded-xl">
                {/* Channel 1 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400">
                    <span>Deep Rain Shower</span>
                    <span className="font-mono text-[10px]">{Math.round(rainVolume*100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05"
                    value={rainVolume}
                    onChange={(e) => setRainVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-ew-resize accent-indigo-550"
                  />
                  <p className="text-[10px] text-slate-600">Ambient rain drops dynamics</p>
                </div>

                {/* Channel 2 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400">
                    <span>Brown Static Wave</span>
                    <span className="font-mono text-[10px]">{Math.round(staticVolume*100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="0.5" 
                    step="0.02"
                    value={staticVolume}
                    onChange={(e) => setStaticVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-ew-resize accent-indigo-550"
                  />
                  <p className="text-[10px] text-slate-600">Safeguards ear focus states</p>
                </div>

                {/* Channel 3 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400">
                    <span>Sub Meditation Hum</span>
                    <span className="font-mono text-[10px]">{Math.round(droneVolume*100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05"
                    value={droneVolume}
                    onChange={(e) => setDroneVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-ew-resize accent-indigo-550"
                  />
                  <p className="text-[10px] text-slate-600">Pulsing binaural frequencies (55Hz)</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 py-3 italic bg-slate-900/30 text-center rounded-xl border border-dashed border-slate-850/40">
                Audio is muted. Tap 'Start Synthesizer' to play atmospheric crackles & meditating frequencies compiled dynamically.
              </p>
            )}
          </div>

          {/* User Task dropdown association for active Timer */}
          <div className="bg-[#111625] border border-slate-850 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-0.5 max-w-md">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest block">Associate Objective:</h4>
              <p className="text-[11px] text-slate-500">Choosing an objective automatically finishes and crosses it off when your focus timer logs!</p>
            </div>

            {activeUserTasks.length === 0 ? (
              <span className="text-xs text-slate-500 italic">No active workspace tasks to link.</span>
            ) : (
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="bg-slate-950 border border-slate-850 text-slate-300 text-xs rounded-xl px-4 py-2.5 outline-none font-sans cursor-pointer focus:border-indigo-505 shrink-0 max-w-[240px]"
              >
                {activeUserTasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.subject})</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CHAT CONVERSATION BOX & TASKS ON THE FLY */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          
          {/* A. Live Chat Conversation Box */}
          <div className="bg-[#111625] border border-slate-850 rounded-2xl flex flex-col h-[350px] lg:h-[420px] shadow-lg">
            {/* Header chat indicators */}
            <div className="px-4 py-3 border-b border-slate-850/80 flex justify-between items-center shrink-0">
              <span className="text-xs font-bold font-sans text-slate-100 uppercase tracking-widest flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Space Chatroom</span>
              </span>

              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-semibold text-slate-400 font-mono">Live Sync</span>
              </div>
            </div>

            {/* Message lists */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-0 select-text">
              {chatMessages.map((msg) => {
                const isMe = msg.senderId === user.userId;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] font-semibold text-slate-500 mb-0.5 font-sans px-1">
                      {isMe ? "You" : msg.senderName}
                    </span>
                    <div className={`p-3 rounded-2xl text-xs max-w-[90%] break-words leading-relaxed shadow-sm ${
                      isMe 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-slate-900 border border-slate-800 text-slate-250 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Message input triggers */}
            <form onSubmit={handleSendChat} className="p-3 border-t border-slate-850/60 flex items-center gap-2 bg-[#0c101c] rounded-b-2xl shrink-0">
              <input
                type="text"
                required
                maxLength={400}
                placeholder="Post encouraging goal or query..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-850 focus:border-indigo-505 rounded-xl px-4.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition"
              />
              <button
                type="submit"
                className="p-2.5 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl transition cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* B. Dynamic quick Task check-board to cross off goals whilst focusing! */}
          <div className="bg-[#111625] border border-slate-850 rounded-2xl p-4 flex flex-col justify-between h-[230px]">
            <div>
              <h4 className="text-xs font-bold text-slate-350 uppercase tracking-widest mb-3 flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>Quick Workspace Panel</span>
              </h4>

              {/* Checklist scrolling container */}
              <div className="space-y-2 overflow-y-auto max-h-24 pr-1">
                {activeUserTasks.length === 0 ? (
                  <p className="text-[11px] text-slate-600 italic py-2">All tasks completed! Add a new one below.</p>
                ) : (
                  activeUserTasks.map((task) => (
                    <div key={task.id} className="flex items-center space-x-2 bg-slate-950/40 p-2 rounded-lg border border-slate-850/50">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="w-4 h-4 text-indigo-650 rounded border-slate-800 bg-slate-900 cursor-pointer accent-indigo-500"
                      />
                      <span className="text-xs text-slate-300 truncate font-sans">{task.title}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick adding tasks in active workspace */}
            <form onSubmit={handleInlineTaskAdd} className="flex items-center gap-1.5 mt-3 border-t border-slate-850/50 pt-3">
              <input
                type="text"
                required
                placeholder="Add focus item..."
                value={inlineTaskTitle}
                onChange={(e) => setInlineTaskTitle(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-2 text-[11px] text-slate-100 placeholder:text-slate-600 outline-none focus:border-indigo-505"
              />
              <button
                type="submit"
                className="bg-indigo-650 hover:bg-indigo-600 p-2 text-white rounded-lg transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
