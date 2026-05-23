import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CheckSquare, Plus, Trash2, BookLock, FolderHeart, Award, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PRESET_SUBJECTS = ["Coding", "Mathematics", "Science", "Literature", "History", "Economics", "General"];

export default function TasksList() {
  const { tasks, addTask, toggleTask, deleteTask } = useApp();
  const [newTitle, setNewTitle] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("General");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addTask(newTitle, selectedSubject);
    setNewTitle("");
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header section */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold font-sans text-white tracking-tight flex items-center space-x-2.5">
          <CheckSquare className="w-7 h-7 text-indigo-400" />
          <span>Workspace Tasks</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Stay organized. Cross off individual items as you complete focused study blocks, syncing instantly with your Pomodoro planner.
        </p>
      </div>

      {/* Quick Add Bar Form */}
      <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 p-4 rounded-2xl md:flex gap-3 space-y-3 md:space-y-0 shadow-lg">
        <input
          type="text"
          required
          placeholder="What is your study goal for today?"
          value={newTitle}
          maxLength={120}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 focus:border-indigo-505 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition"
        />

        <div className="flex gap-2">
          {/* Subject selector dropdown */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-white/5 border border-white/10 text-slate-300 rounded-xl px-3 py-3 text-sm outline-none transition cursor-pointer hover:bg-white/10"
          >
            {PRESET_SUBJECTS.map((sub) => (
              <option key={sub} value={sub} className="bg-[#05060b] text-slate-205">{sub}</option>
            ))}
          </select>

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 px-5 rounded-xl text-white font-semibold text-sm transition flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap grow md:grow-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Goal</span>
          </button>
        </div>
      </form>

      {/* Tasks Display Lists */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Active Checklist Column */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-widest flex items-center space-x-1.5 px-1">
            <FolderHeart className="w-4 h-4" />
            <span>Active Objectives ({activeTasks.length})</span>
          </h3>

          {activeTasks.length === 0 ? (
            <div className="bg-white/5 border border-dashed border-white/10 p-8 rounded-2xl text-center text-slate-500 backdrop-blur-sm">
              <BookLock className="w-8 h-8 mx-auto text-slate-650 mb-2" />
              <p className="text-xs font-sans">No pending objectives.</p>
              <p className="text-[10px] font-mono text-slate-650 mt-1">Use the planner above to capture goals.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {activeTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-xl hover:border-white/20 hover:bg-white/[0.08] group transition backdrop-blur-sm"
                  >
                    <div className="flex items-start space-x-3.5 mr-4 max-w-[85%]">
                      {/* Checkbox trigger */}
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="mt-1 w-4.5 h-4.5 rounded text-indigo-600 focus:ring-indigo-505 border-white/10 bg-white/5 cursor-pointer accent-indigo-500"
                      />
                      <div className="space-y-1">
                        <p className="text-sm text-slate-200 font-sans break-words">{task.title}</p>
                        <span className="text-[10px] uppercase font-semibold font-mono bg-white/5 border border-white/10 text-slate-400 px-2 py-0.5 rounded">
                          {task.subject}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 hover:bg-white/5 rounded-lg cursor-pointer border border-transparent hover:border-white/10 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Completed Checklist Column */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-widest flex items-center space-x-1.5 px-1">
            <Award className="w-4 h-4" />
            <span>Graduated Goals ({completedTasks.length})</span>
          </h3>

          {completedTasks.length === 0 ? (
            <div className="bg-white/5 border border-dashed border-white/10 p-8 rounded-2xl text-center text-slate-500 backdrop-blur-sm">
              <HelpCircle className="w-8 h-8 mx-auto text-slate-650 mb-2" />
              <p className="text-xs font-sans text-slate-600">No completed items compiled yet.</p>
              <p className="text-[10px] font-mono text-slate-700 mt-1">Check off items as they mature to study.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {completedTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-between items-center bg-white/5 border border-white/5 p-3.5 rounded-xl group/comp transition hover:bg-white/[0.08] backdrop-blur-sm"
                  >
                    <div className="flex items-start space-x-3.5 mr-4 max-w-[85%]">
                      {/* Checkbox trigger */}
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="mt-1 w-4.5 h-4.5 rounded text-emerald-600 focus:ring-emerald-505 border-white/15 bg-white/5 cursor-pointer accent-emerald-500"
                      />
                      <div className="space-y-1">
                        <p className="text-sm text-slate-500 line-through font-sans break-words">{task.title}</p>
                        <span className="text-[9px] uppercase font-semibold font-mono bg-white/5 border border-white/10 text-slate-600 px-1.5 py-0.2 rounded">
                          {task.subject}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-slate-650 hover:text-rose-455 p-1.5 hover:bg-white/5 rounded-lg cursor-pointer transition opacity-0 group-hover/comp:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
