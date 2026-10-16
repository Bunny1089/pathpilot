import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ResumeView } from './components/ResumeView';
import { JobDescriptionView } from './components/JobDescriptionView';
import { CareerAgentView } from './components/CareerAgentView';
import { apiService } from './services/api';
import type { Profile, Goal, Task } from './services/api';
import { Lock } from 'lucide-react';

function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  
  // Unified Dashboard State
  const [profile, setProfile] = useState<Profile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [updatingTask, setUpdatingTask] = useState(false);

  /**
   * Evaluates backend reachability and updates connection indicator.
   */
  const checkConnection = async () => {
    setBackendConnected(null);
    try {
      const health = await apiService.checkHealth();
      if (health.status === 'healthy') {
        setBackendConnected(true);
        // Load data on connection confirmation
        loadDashboardMetrics();
      } else {
        setBackendConnected(false);
      }
    } catch (err) {
      setBackendConnected(false);
    }
  };

  /**
   * Fetches database statistics for profile command center.
   */
  const loadDashboardMetrics = async () => {
    setLoading(true);
    try {
      const data = await apiService.getDashboardData();
      setProfile(data.profile);
      setGoals(data.goals);
      setTasks(data.tasks);
    } catch (err) {
      console.error("Failed to query dashboard database metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  /**
   * Action handler to toggle status properties in the database.
   */
  const handleToggleTask = async (taskId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'done' ? 'todo' : 'done';
    setUpdatingTask(true);
    try {
      const updated = await apiService.updateTaskStatus(taskId, nextStatus);
      // Reactively map local array states
      setTasks((prev) => 
        prev.map((t) => (t.id === taskId ? { ...t, status: updated.status } : t))
      );
    } catch (err) {
      console.error(`Failed to toggle task ID ${taskId}:`, err);
    } finally {
      setUpdatingTask(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Drawer Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Header controls and indicators */}
      <Header backendConnected={backendConnected} onRefreshHealth={checkConnection} />

      {/* Main Core Layout area */}
      <main className="flex-1">
        {currentTab === 'dashboard' ? (
          <Dashboard 
            profile={profile}
            goals={goals}
            tasks={tasks}
            onToggleTask={handleToggleTask}
            loading={updatingTask || loading}
          />
        ) : currentTab === 'resume' ? (
          <ResumeView />
        ) : currentTab === 'jobs' ? (
          <JobDescriptionView />
        ) : currentTab === 'agent' ? (
          <CareerAgentView onTasksUpdated={loadDashboardMetrics} />
        ) : (
          <div className="flex-1 bg-slate-950 text-slate-100 p-8 ml-64 min-h-[calc(100vh-4rem)] flex items-center justify-center">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
              <div className="mx-auto w-14 h-14 bg-indigo-950/60 rounded-full flex items-center justify-center mb-6 border border-indigo-800/40">
                <Lock className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Feature Scheduled</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                The <span className="text-indigo-400 font-semibold uppercase">{currentTab}</span> pipeline is scheduled for later roadmap phases (incorporating scraping, RAG indexers, and local LLMs) and is not implemented in the current Phase 1 foundation.
              </p>
              <button 
                onClick={() => setCurrentTab('dashboard')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg transition-colors shadow-lg shadow-indigo-650/20"
              >
                Return to Command Center
              </button>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}

export default App;
