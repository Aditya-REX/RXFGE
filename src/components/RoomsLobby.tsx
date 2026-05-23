import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Compass, Search, PlusCircle, Users, BookMarked, Layers, CircleDot, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function RoomsLobby() {
  const { rooms, joinRoom, createRoom } = useApp();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Custom room form fields
  const [roomName, setRoomName] = useState("");
  const [roomDesc, setRoomDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Filter existing rooms based on search text input
  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(search.toLowerCase()) ||
    room.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    setIsCreating(true);
    try {
      const generatedId = await createRoom(roomName, roomDesc);
      setIsModalOpen(false);
      setRoomName("");
      setRoomDesc("");
      // Join the newly created room immediately!
      await joinRoom(generatedId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Search and Header Rows */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-sans text-white tracking-tight flex items-center space-x-2.5">
            <Compass className="w-7 h-7 text-indigo-400" />
            <span>Study Lobbies</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Choose a study ecosystem to connect, activate customizable Pomodoro timers, and co-work live.
          </p>
        </div>

        {/* Action triggers */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-505 text-white shadow-lg shadow-indigo-600/10 cursor-pointer transition select-none self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Launch Custom Room</span>
        </button>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
        <input
          type="text"
          placeholder="Filter lobbies by name, topic or environment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 hover:border-white/20 rounded-xl pl-12 pr-4 py-3.5 text-slate-100 placeholder:text-slate-500 outline-none text-sm font-sans transition backdrop-blur-md"
        />
      </div>

      {/* Grid of rooms */}
      {filteredRooms.length === 0 ? (
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-12 text-center space-y-4 shadow-2xl">
          <BookMarked className="w-12 h-12 text-slate-650 mx-auto" />
          <h3 className="text-lg font-bold text-slate-300">No matching spaces located</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Try adjusting your search queries or launch your own room using the actions button above.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map((room) => {
            // Pick a subtle accent theme based on room configurations
            const isSystemRoom = room.creatorId === 'system';

            return (
              <motion.div
                key={room.id}
                whileHover={{ y: -4, transition: { duration: 0.15 } }}
                className="bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 p-5 rounded-2xl flex flex-col justify-between h-56 transition-all duration-150 group shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${isSystemRoom ? 'bg-indigo-950/20 text-indigo-400 border-white/10' : 'bg-purple-950/20 text-purple-400 border-white/10'}`}>
                      {isSystemRoom ? "Official Lobby" : "Student Created"}
                    </span>

                    {/* Occupant Counter badge */}
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                      <span className="text-[11px] font-sans text-slate-400">{room.activeCount} online</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-100 group-hover:text-indigo-400 transition font-sans text-[17px] line-clamp-1">
                    {room.name}
                  </h3>
                  
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {room.description}
                  </p>
                </div>

                <div className="border-t border-white/5 pt-3 flex items-center justify-between mt-auto">
                  <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-550">
                    <CircleDot className={`w-2.5 h-2.5 ${room.timerStatus !== 'idle' ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                    <span>Timer: {room.timerStatus === 'idle' ? 'Ready' : room.timerStatus === 'work' ? 'Work Session' : 'Relaxing'}</span>
                  </div>

                  <button
                    onClick={() => joinRoom(room.id)}
                    className="flex items-center space-x-1 py-1.5 px-3 rounded-xl text-xs font-bold text-indigo-400 group-hover:bg-white/15 transition cursor-pointer border border-transparent hover:border-white/10"
                  >
                    <span>Enter Space</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Creation Modal dialog */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop filter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Content modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black/90 border border-white/10 rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl backdrop-blur-3xl"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold font-sans text-white tracking-tight">Launch Custom Space</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Lobby Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Advanced Deep Learning Prep"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    maxLength={32}
                    className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 hover:border-white/20 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-500 outline-none text-sm font-sans transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Focus Target & Goals
                  </label>
                  <textarea
                    placeholder="Describe the environment or goals (max 150 characters)..."
                    value={roomDesc}
                    onChange={(e) => setRoomDesc(e.target.value)}
                    maxLength={150}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 hover:border-white/20 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-500 outline-none text-sm font-sans transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreating || !roomName.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 py-3 rounded-xl text-white text-sm font-semibold tracking-wide transition shadow-lg shadow-indigo-600/10 cursor-pointer"
                >
                  {isCreating ? "Deploying custom lobby..." : "Deploy Custom Room"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
