import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  Circle,
  Clock,
  CalendarDays,
  User as UserIcon,
  ChevronRight,
  Save,
  Mail,
  Lock,
  User as UserCircle,
  ArrowRight,
  AlertCircle,
  Loader2,
  BarChart3,
  TrendingUp,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { User, Task, TaskCompletion, Event, MonthlyReport } from './types';

// --- API Helper ---
const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('taskflow_token');
  const headers = {
    ...options.headers,
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('taskflow_user');
    localStorage.removeItem('taskflow_token');
    window.location.reload();
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }
  return res;
};

// --- Components ---

const Header = ({ user, onLogout, activeTab, setActiveTab }: { 
  user: User | null, 
  onLogout: () => void,
  activeTab: string,
  setActiveTab: (tab: any) => void
}) => {
  const [time, setTime] = useState(new Date());
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: UserIcon },
    { id: 'report', label: 'Reports', icon: FileText },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3 md:gap-8">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
            <LayoutDashboard className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg md:text-xl font-black text-zinc-900 tracking-tighter uppercase italic">TaskFlow</h1>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none">Pro Management</p>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 ml-4">
          {navItems.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl transition-all font-bold text-sm ${
                activeTab === tab.id 
                  ? 'bg-zinc-100 text-indigo-600' 
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="hidden xl:flex items-center gap-6 text-zinc-400 border-r border-zinc-200 pr-6">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold uppercase tracking-wider">{time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono font-bold">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs font-black text-zinc-900 uppercase tracking-tight">{user.name}</p>
              <p className="text-[10px] text-zinc-400 font-bold">{user.email}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200 overflow-hidden">
              <UserCircle className="w-5 h-5 text-zinc-400" />
            </div>
            <button 
              onClick={onLogout}
              className="p-2 hover:bg-red-50 rounded-xl transition-colors text-zinc-400 hover:text-red-600"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-600"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-zinc-900/20 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-white shadow-2xl z-50 lg:hidden p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-black text-zinc-900 uppercase italic">Menu</h2>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-zinc-100 rounded-xl">
                  <X className="w-6 h-6 text-zinc-400" />
                </button>
              </div>
              
              <div className="space-y-2 flex-1">
                {navItems.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-bold ${
                      activeTab === tab.id 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                        : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="pt-6 border-t border-zinc-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
                    <UserCircle className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-zinc-900 uppercase">{user?.name}</p>
                    <p className="text-[10px] text-zinc-400 font-bold">{user?.email}</p>
                  </div>
                </div>
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

const Dashboard = ({ user, showToast }: { user: User, showToast: (m: string, t?: 'success' | 'error') => void }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [completions, setCompletions] = useState<Record<number, boolean>>({});
  const [stats, setStats] = useState<{ name: string, completed: number, total: number }[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [dailyChartData, setDailyChartData] = useState<{ name: string, count: number }[]>([]);

  const fetchTasks = async () => {
    const res = await apiFetch('/api/tasks');
    const data = await res.json();
    setTasks(data);
  };

  const fetchDailyCompletions = async (date: string) => {
    try {
      const res = await apiFetch(`/api/task-completions?date=${date}`);
      const data = await res.json();
      const newCompletions: Record<number, boolean> = {};
      data.forEach((t: any) => {
        newCompletions[t.task_id] = t.completed === 1;
      });
      setCompletions(newCompletions);
    } catch (err) {
      console.error("Failed to fetch daily completions", err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiFetch('/api/stats/monthly-summary');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchStats();
    apiFetch('/api/check-reset', { method: 'POST' });
  }, [user.id]);

  useEffect(() => {
    fetchDailyCompletions(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    // Update daily chart data whenever tasks or completions change
    const data = tasks.map(task => ({
      name: task.name,
      count: completions[task.id] ? 1 : 0
    }));
    setDailyChartData(data);
  }, [tasks, completions]);

  const handleToggle = (taskId: number) => {
    setCompletions(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleSubmit = async () => {
    try {
      await apiFetch('/api/task-completions', {
        method: 'POST',
        body: JSON.stringify({ date: selectedDate, completions })
      });
      setCompletions({});
      showToast('Tasks submitted successfully!');
      fetchStats(); // Refresh chart after submission
    } catch (err) {
      showToast('Failed to submit tasks', 'error');
    }
  };

  const handleDownloadDaily = () => {
    if (dailyChartData.length === 0) {
      showToast('No data to download', 'error');
      return;
    }

    const csvContent = [
      ['Selected Date', 'Task Name', 'Checkbox Count'],
      ...dailyChartData.map(d => [selectedDate, d.name, d.count])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `daily_report_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Daily report downloaded!');
  };

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight uppercase italic">Daily Dashboard</h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">Select a date and mark completed tasks.</p>
        </div>
      </div>

      <div className="space-y-6 md:space-y-8">
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <Calendar className="text-indigo-600 w-5 h-5" />
            </div>
            <label className="font-bold text-zinc-900 uppercase text-sm tracking-tight">Select Date</label>
          </div>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-700 transition-all"
          />
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
            <h3 className="font-bold text-zinc-900 uppercase text-sm tracking-widest">Task Entry</h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleDownloadDaily}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-[10px] font-black text-zinc-600 hover:bg-zinc-50 transition-all uppercase tracking-tighter"
              >
                <FileText className="w-3.5 h-3.5" />
                Download CSV
              </button>
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-tighter">
                {tasks.length} Tasks
              </span>
            </div>
          </div>
          <div className="divide-y divide-zinc-100">
            {tasks.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 font-medium italic">
                No tasks found. Please add tasks in the Tasks tab.
              </div>
            ) : (
              tasks.map(task => (
                <div 
                  key={task.id} 
                  onClick={() => handleToggle(task.id)}
                  className="flex items-center justify-between p-4 md:p-5 hover:bg-zinc-50 cursor-pointer transition-all group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl transition-all ${completions[task.id] ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200'}`}>
                      {completions[task.id] ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </div>
                    <span className={`font-bold transition-colors ${completions[task.id] ? 'text-zinc-900' : 'text-zinc-500'}`}>
                      {task.name}
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-all ${completions[task.id] ? 'text-indigo-400 translate-x-1' : 'text-zinc-300 group-hover:text-zinc-400'}`} />
                </div>
              ))
            )}
          </div>
          <div className="p-4 md:p-6 bg-zinc-50/50 border-t border-zinc-100">
            <button 
              onClick={handleSubmit}
              disabled={tasks.length === 0}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Daily Tasks
            </button>
          </div>
        </div>

        {/* Daily Performance Chart */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl">
                <BarChart3 className="text-emerald-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 uppercase text-sm tracking-widest">Daily Performance</h3>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Checked Checkboxes per Task</p>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-zinc-50 rounded-lg border border-zinc-100">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">{selectedDate}</span>
            </div>
          </div>

          <div className="h-[250px] md:h-[300px] w-full">
            {dailyChartData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-zinc-400 font-medium italic">
                No task data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      padding: '16px',
                      fontWeight: 700,
                      fontSize: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[6, 6, 0, 0]} 
                    barSize={32}
                  >
                    {dailyChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.count > 0 ? '#10b981' : '#f1f5f9'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Monthly Progress Chart */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <BarChart3 className="text-indigo-600 w-5 h-5" />
              </div>
              <h3 className="font-bold text-zinc-900 uppercase text-sm tracking-widest">Monthly Completion Stats</h3>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg uppercase tracking-tighter">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Live Performance</span>
            </div>
          </div>

          <div className="h-[250px] md:h-[300px] w-full">
            {isLoadingStats ? (
              <div className="h-full w-full flex items-center justify-center text-zinc-400 font-bold uppercase text-xs tracking-widest animate-pulse">
                Loading statistics...
              </div>
            ) : stats.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-zinc-400 font-medium italic">
                No data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      padding: '16px',
                      fontWeight: 700,
                      fontSize: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="completed" 
                    radius={[6, 6, 0, 0]} 
                    barSize={32}
                  >
                    {stats.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === stats.length - 1 ? '#4f46e5' : '#e2e8f0'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          
          <div className="mt-8 pt-8 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Current Month</p>
              <p className="text-3xl font-black text-zinc-900 tracking-tighter">
                {stats.length > 0 ? stats[stats.length - 1].completed : 0}
              </p>
            </div>
            <div className="text-center p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Total Tasks</p>
              <p className="text-3xl font-black text-zinc-900 tracking-tighter">
                {stats.length > 0 ? stats[stats.length - 1].total : 0}
              </p>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Success Rate</p>
              <p className="text-3xl font-black text-indigo-600 tracking-tighter">
                {stats.length > 0 && stats[stats.length - 1].total > 0 
                  ? Math.round((stats[stats.length - 1].completed / stats[stats.length - 1].total) * 100) 
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TasksPage = ({ user, showToast }: { user: User, showToast: (m: string, t?: 'success' | 'error') => void }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const fetchTasks = async () => {
    const res = await apiFetch('/api/tasks');
    const data = await res.json();
    setTasks(data);
  };

  useEffect(() => {
    fetchTasks();
  }, [user.id]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    try {
      await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ name: newTaskName })
      });
      setNewTaskName('');
      fetchTasks();
      showToast('Task added successfully');
    } catch (err) {
      showToast('Failed to add task', 'error');
    }
  };

  const deleteTask = async (id: number) => {
    try {
      await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
      fetchTasks();
      setConfirmDelete(null);
      showToast('Task deleted successfully');
    } catch (err) {
      showToast('Failed to delete task', 'error');
    }
  };

  const updateTask = async (id: number) => {
    if (!editName.trim()) return;
    try {
      await apiFetch(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName })
      });
      setEditingTaskId(null);
      fetchTasks();
      showToast('Task updated successfully');
    } catch (err) {
      showToast('Failed to update task', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight uppercase italic">Task Directory</h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">Manage your professional task list.</p>
        </div>
        <form onSubmit={addTask} className="flex gap-2">
          <input 
            type="text" 
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder="New Task Name..."
            className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-700 transition-all"
          />
          <button 
            type="submit"
            className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            <Plus className="w-6 h-6" />
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Task Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-zinc-400 font-medium italic">
                    No tasks added yet.
                  </td>
                </tr>
              ) : (
                tasks.map(task => (
                  <tr key={task.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      {editingTaskId === task.id ? (
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-3 py-1.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
                            autoFocus
                          />
                          <button onClick={() => updateTask(task.id)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100">
                            <Save className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingTaskId(null)} className="p-1.5 bg-zinc-100 text-zinc-400 rounded-lg hover:bg-zinc-200">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-bold text-zinc-900">{task.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setEditingTaskId(task.id);
                            setEditName(task.name);
                          }}
                          className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setConfirmDelete(task.id)}
                          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-zinc-100"
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 text-center mb-2 uppercase italic">Delete Task?</h3>
              <p className="text-zinc-500 text-center mb-8 font-medium">This will permanently remove the task and all its history. This action cannot be undone.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => deleteTask(confirmDelete)}
                  className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Reports = ({ user, showToast }: { user: User, showToast: (m: string, t?: 'success' | 'error') => void }) => {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [allCompletions, setAllCompletions] = useState<(TaskCompletion & { task_name: string })[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchReports = async () => {
    const res = await apiFetch('/api/reports');
    const data = await res.json();
    setReports(data.map((r: any) => ({
      ...r,
      total_completed: r.data.filter((t: any) => t.completed === 1).length,
      total_tasks: r.data.length
    })));
  };

  const fetchAllCompletions = async () => {
    const res = await apiFetch('/api/tasks/all');
    const data = await res.json();
    setAllCompletions(data);
  };

  useEffect(() => {
    fetchReports();
    fetchAllCompletions();
  }, [user.id]);

  const handleDownloadRangeReport = () => {
    const completionsInRange = allCompletions.filter(t => t.date >= startDate && t.date <= endDate);
    if (completionsInRange.length === 0) {
      showToast('No task submissions found for the selected range', 'error');
      return;
    }

    const csvContent = [
      ['Date', 'Task Name', 'Status'],
      ...completionsInRange.map(t => [t.date, t.task_name, t.completed ? 'Completed' : 'Not Completed'])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `task_report_${startDate}_to_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report downloaded successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight uppercase italic">Reports & Insights</h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">Analyze and export your performance data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <FileText className="text-indigo-600 w-5 h-5" />
              </div>
              <h3 className="font-bold text-zinc-900 uppercase text-xs tracking-widest">Export Data</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-700 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">End Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-700 transition-all"
                />
              </div>
              <button 
                onClick={handleDownloadRangeReport}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Download CSV
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-bold text-zinc-900 uppercase text-xs tracking-widest">Recent Submissions</h3>
            </div>
            <div className="divide-y divide-zinc-100">
              {allCompletions.length === 0 ? (
                <div className="p-12 text-center text-zinc-400 font-medium italic">
                  No submissions found.
                </div>
              ) : (
                allCompletions.map((completion, idx) => (
                  <div key={idx} className="p-4 md:p-6 flex items-center justify-between hover:bg-zinc-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${completion.completed ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-400'}`}>
                        {completion.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900">{completion.task_name}</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{new Date(completion.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter ${completion.completed ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-400'}`}>
                      {completion.completed ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-bold text-zinc-900 uppercase text-xs tracking-widest">Archived Reports</h3>
            </div>
            <div className="divide-y divide-zinc-100">
              {reports.length === 0 ? (
                <div className="p-12 text-center text-zinc-400 font-medium italic">
                  No archived reports yet.
                </div>
              ) : (
                reports.map(report => (
                  <div key={report.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-zinc-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-zinc-100 text-zinc-400 rounded-xl">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900">{report.month_name}</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Archive ID: {report.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-zinc-900">{report.total_completed}/{report.total_tasks}</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                        {Math.round((report.total_completed / report.total_tasks) * 100)}% Success
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthPage = ({ onAuthSuccess }: { onAuthSuccess: (user: User, token: string) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const body = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const res = await fetch('/api/auth/url');
    const { url } = await res.json();
    window.open(url, 'oauth_popup', 'width=600,height=700');
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-2xl max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="bg-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-100">
            <LayoutDashboard className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-zinc-900">TaskFlow</h1>
          <p className="text-zinc-500 text-sm">{isLogin ? 'Welcome back! Please login.' : 'Create your account to get started.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Full Name</label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="name@company.com"
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {isLogin ? 'Login' : 'Create Account'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-zinc-400 font-bold">Or continue with</span></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 bg-white border border-zinc-200 rounded-xl font-bold text-zinc-700 hover:bg-zinc-50 transition-all"
        >
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
          Google Account
        </button>

        <p className="mt-8 text-center text-sm text-zinc-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="ml-1 text-indigo-600 font-bold hover:underline"
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'report'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('taskflow_user');
    const savedToken = localStorage.getItem('taskflow_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);

    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { user, token } = event.data;
        setUser(user);
        localStorage.setItem('taskflow_user', JSON.stringify(user));
        localStorage.setItem('taskflow_token', token);
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  const handleAuthSuccess = (user: User, token: string) => {
    setUser(user);
    localStorage.setItem('taskflow_user', JSON.stringify(user));
    localStorage.setItem('taskflow_token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('taskflow_user');
    localStorage.removeItem('taskflow_token');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Header user={user} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="pb-20 pt-4 md:pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <Dashboard user={user} showToast={showToast} />}
            {activeTab === 'tasks' && <TasksPage user={user} showToast={showToast} />}
            {activeTab === 'report' && <Reports user={user} showToast={showToast} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 right-8 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-[100] ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
