import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Award, 
  BookMarked,
  Hourglass,
  CalendarCheck
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#94a3b8'];

export default function Dashboard() {
  const { studyLogs, tasks, user } = useApp();

  if (!user) return null;

  // 1. Calculate general stats metrics
  const totalMinutesStudied = Math.round(user.totalStudyTime / 60);
  const totalHoursStudied = (user.totalStudyTime / 3600).toFixed(1);
  const totalSessions = user.totalSessions;
  const completedTasks = tasks.filter(t => t.completed).length;
  const activeTasks = tasks.filter(t => !t.completed).length;

  // Average session length (in minutes)
  const avgSessionLength = totalSessions > 0 ? Math.round(totalMinutesStudied / totalSessions) : 0;

  // 2. Format data for donut chart (focus times by subject)
  const getSubjectPieData = () => {
    const map: { [key: string]: number } = {};
    studyLogs.forEach(log => {
      const sub = log.subject || "General";
      map[sub] = (map[sub] || 0) + Math.round(log.duration / 60); // minutes
    });

    return Object.keys(map).map(subj => ({
      name: subj,
      value: map[subj]
    }));
  };

  const subjectData = getSubjectPieData();

  // 3. Format data for bar chart (last 7 days study logs)
  const getWeeklyBarData = () => {
    const daysLog: { [key: string]: number } = {};
    const today = new Date();

    // Initialize map with last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayStr = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      daysLog[dayStr] = 0;
    }

    // Accumulate study times (minutes)
    studyLogs.forEach(log => {
      try {
        const logDate = new Date(log.createdAt);
        const dayStr = logDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        if (daysLog[dayStr] !== undefined) {
          daysLog[dayStr] += Math.round(log.duration / 60);
        }
      } catch (err) {
        console.warn("Error parsing study log time:", err);
      }
    });

    return Object.keys(daysLog).map(day => ({
      day,
      minutes: daysLog[day]
    }));
  };

  const weeklyData = getWeeklyBarData();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header section */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold font-sans text-white tracking-tight flex items-center space-x-2.5">
          <BarChart3 className="w-7 h-7 text-indigo-400" />
          <span>Progress Tracks</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Review metrics, study history, and focus breakdowns compiled across courses and tasks.
        </p>
      </div>

      {/* Numerical Stats overview bento grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center space-x-4 backdrop-blur-md shadow-lg">
          <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-400 text-center shrink-0">
            <Clock className="w-5 h-5 mx-auto" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block">Time Studied</span>
            <h3 className="text-lg md:text-xl font-bold font-mono text-slate-100">{totalHoursStudied}h</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{totalMinutesStudied} mins</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center space-x-4 backdrop-blur-md shadow-lg">
          <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400 text-center shrink-0">
            <TrendingUp className="w-5 h-5 mx-auto" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block">Completed Sessions</span>
            <h3 className="text-lg md:text-xl font-bold font-mono text-slate-100">{totalSessions}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Focus intervals</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center space-x-4 backdrop-blur-md shadow-lg">
          <div className="bg-amber-500/10 p-3 rounded-xl text-amber-550 text-center shrink-0">
            <Hourglass className="w-5 h-5 mx-auto" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block">Avg Length</span>
            <h3 className="text-lg md:text-xl font-bold font-mono text-slate-100">{avgSessionLength}m</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Per focus block</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center space-x-4 backdrop-blur-md shadow-lg">
          <div className="bg-purple-500/10 p-3 rounded-xl text-purple-400 text-center shrink-0">
            <Award className="w-5 h-5 mx-auto" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block">Done Objectives</span>
            <h3 className="text-lg md:text-xl font-bold font-mono text-slate-100">{completedTasks}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{activeTasks} objectives left</p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid lg:grid-cols-12 gap-5">
        
        {/* Left Column: Weekly Focus Duration (Bar Chart) */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl lg:col-span-7 flex flex-col justify-between min-h-[380px] backdrop-blur-md shadow-lg">
          <div>
            <h3 className="font-bold text-slate-205 text-sm flex items-center space-x-2">
              <CalendarCheck className="w-4.5 h-4.5 text-indigo-400" />
              <span>Weekly Focus Intervals (Mins)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">Tracking your total study minutes over the past seven days.</p>
          </div>

          <div className="w-full h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="day" 
                  stroke="#475569" 
                  fontSize={10}
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(5, 6, 11, 0.95)', 
                    borderRadius: '12px', 
                    borderColor: 'rgba(255,255,255,0.1)', 
                    color: '#e2e8f0',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    backdropFilter: 'blur(10px)',
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                />
                <Bar 
                  dataKey="minutes" 
                  fill="#6366f1" 
                  radius={[6, 6, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Subject Breakdown (Pie Chart) */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl lg:col-span-5 flex flex-col justify-between min-h-[380px] backdrop-blur-md shadow-lg">
          <div>
            <h3 className="font-bold text-slate-205 text-sm flex items-center space-x-2">
              <BookMarked className="w-4.5 h-4.5 text-emerald-400" />
              <span>Subject Distributions</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">Breakdown of focused study time by course subjects.</p>
          </div>

          {subjectData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-550 border border-dashed border-slate-850/50 rounded-xl m-4 py-8">
              <Hourglass className="w-8 h-8 opacity-40 mb-2" />
              <p className="text-xs">No logged sessions recorded yet.</p>
              <p className="text-[10px] font-mono text-slate-600 mt-1">Conclude a study timer to draw stats!</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center mt-2">
              <div className="w-full h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subjectData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {subjectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val) => [`${val} mins`, 'Duration']}
                      contentStyle={{ 
                        backgroundColor: 'rgba(5, 6, 11, 0.95)', 
                        borderRadius: '10px', 
                        borderColor: 'rgba(255,255,255,0.1)',
                        color: '#f8fafc',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        backdropFilter: 'blur(10px)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend mapping */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-3 max-h-16 overflow-y-auto">
                {subjectData.map((item, index) => (
                  <div key={item.name} className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="truncate max-w-[80px]">{item.name}</span>
                    <span className="text-slate-550 font-mono">({item.value}m)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History logs block */}
      <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md shadow-2xl">
        <h3 className="font-bold text-slate-200 text-sm mb-4">Focus Chronology Logs</h3>
        
        {studyLogs.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">No focus sessions found in database history.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 pl-1 font-sans">Date</th>
                  <th className="pb-3 font-sans">Topic/Subject</th>
                  <th className="pb-3 font-sans">Time Span</th>
                  <th className="pb-3 font-sans">Associated Action Goal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-350">
                {studyLogs.slice(0, 15).map((log) => {
                  const minutes = Math.round(log.duration / 60);
                  const seconds = log.duration % 60;
                  const durationFormatted = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                  const logDate = new Date(log.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={log.id} className="hover:bg-white/5 transition">
                      <td className="py-3 pl-1 font-mono">{logDate}</td>
                      <td className="py-3 font-medium text-indigo-400 font-sans">{log.subject}</td>
                      <td className="py-3 font-mono">{durationFormatted}</td>
                      <td className="py-3 text-slate-400 font-sans italic">{log.taskTitle || "General Focus Work"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
