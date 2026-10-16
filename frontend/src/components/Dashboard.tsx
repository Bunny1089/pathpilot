import React from 'react';
import type { 
  Task, 
  Goal, 
  Profile 
} from '../services/api';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  MapPin, 
  Target, 
  Cpu, 
  Sparkles,
  TrendingUp,
  FolderLock
} from 'lucide-react';

interface DashboardProps {
  profile: Profile | null;
  goals: Goal[];
  tasks: Task[];
  onToggleTask: (taskId: number, currentStatus: string) => Promise<void>;
  loading: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  profile, 
  goals, 
  tasks, 
  onToggleTask, 
  loading 
}) => {
  
  // Calculate dynamic metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const currentGoal = goals[0] || null;

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-8 ml-64 min-h-[calc(100vh-4rem)]">
      
      {/* Welcome Banner */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Career Operations Command</h1>
        {profile ? (
          <div className="flex items-center space-x-2 mt-2 text-sm text-slate-400">
            <Cpu className="h-4 w-4 text-indigo-400" />
            <span className="font-semibold text-slate-300">{profile.target_role}</span>
            <span>•</span>
            <span className="text-slate-400">{profile.headline}</span>
            <span>•</span>
            <MapPin className="h-3 w-3 text-slate-500" />
            <span>{profile.location}</span>
          </div>
        ) : (
          <p className="text-slate-400 mt-1">Loading your profile details...</p>
        )}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Goal & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Goal Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                <Target className="h-3.5 w-3.5 mr-1" /> Active Goal
              </span>
            </div>
            
            {currentGoal ? (
              <>
                <h3 className="text-xl font-bold text-white mb-2 pr-28">{currentGoal.title}</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">{currentGoal.description}</p>
                
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-slate-400">Roadmap Progress</span>
                    <span className="text-sm font-bold text-indigo-400">{progressPercent}% Completed</span>
                  </div>
                  <div className="w-full bg-slate-850 h-3 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500 ease-out shadow-lg shadow-indigo-500/20"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-slate-500 text-sm">
                No active goals found in the database.
              </div>
            )}
          </div>

          {/* Tasks List Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <Clock className="h-5 w-5 text-indigo-400 mr-2" /> Actionable Roadmap
            </h3>
            
            {loading ? (
              <div className="py-12 text-center text-slate-500">Updating tasks...</div>
            ) : tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => {
                  const isDone = task.status === 'done';
                  return (
                    <div 
                      key={task.id}
                      onClick={() => onToggleTask(task.id, task.status)}
                      className={`flex items-start justify-between p-4 rounded-lg border transition-all duration-150 cursor-pointer ${
                        isDone 
                          ? 'bg-slate-900/40 border-slate-850 opacity-60 hover:opacity-80' 
                          : 'bg-slate-850/60 border-slate-800 hover:border-slate-700/80 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-start space-x-3 flex-1 pr-4">
                        <button className="mt-0.5 text-slate-400 hover:text-indigo-400 transition-colors duration-150">
                          {isDone ? (
                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <Circle className="h-5 w-5 text-slate-500" />
                          )}
                        </button>
                        <div>
                          <p className={`text-sm font-semibold text-white ${isDone ? 'line-through text-slate-500' : ''}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{task.description}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Badge properties */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          task.priority === 'high' 
                            ? 'bg-rose-950/40 text-rose-300 border-rose-900/60' 
                            : task.priority === 'medium'
                            ? 'bg-amber-950/40 text-amber-300 border-amber-900/60'
                            : 'bg-blue-950/40 text-blue-300 border-blue-900/60'
                        }`}>
                          {task.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-sm">
                No tasks available.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Future Placeholders */}
        <div className="space-y-6">
          
          {/* Applications Overview Module */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-bold text-white flex items-center">
                <TrendingUp className="h-4 w-4 text-emerald-400 mr-2" /> Applications
              </h3>
              <FolderLock className="h-4 w-4 text-slate-500" />
            </div>
            
            {/* Mock stats grid */}
            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              <div className="bg-slate-850 p-2.5 rounded border border-slate-800/40">
                <span className="block text-lg font-extrabold text-white">0</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Sent</span>
              </div>
              <div className="bg-slate-850 p-2.5 rounded border border-slate-800/40">
                <span className="block text-lg font-extrabold text-white">0</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Interviews</span>
              </div>
              <div className="bg-slate-850 p-2.5 rounded border border-slate-800/40">
                <span className="block text-lg font-extrabold text-white">0</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Offers</span>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 bg-slate-950/50 p-3 rounded-lg border border-slate-850 leading-relaxed">
              <span className="font-semibold text-slate-400 block mb-0.5">Phase 2 Automation:</span>
              Application tracking database and local browser automation pipelines will mount here.
            </p>
          </div>

          {/* Recommended Jobs Module */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-bold text-white flex items-center">
                <Sparkles className="h-4 w-4 text-indigo-400 mr-2" /> Matched Jobs
              </h3>
              <span className="text-[10px] font-bold bg-slate-850 text-indigo-300 px-2 py-0.5 rounded border border-slate-800">Mockup</span>
            </div>

            {/* Static Job matches */}
            <div className="space-y-3 mb-4">
              <div className="bg-slate-850/40 border border-slate-800/60 p-3 rounded-lg">
                <p className="text-xs font-bold text-white">AI/ML Engineering Intern</p>
                <p className="text-[10px] text-slate-400 mt-0.5">TechCorp Systems • Remote</p>
              </div>
              <div className="bg-slate-850/40 border border-slate-800/60 p-3 rounded-lg">
                <p className="text-xs font-bold text-white">Computer Vision Intern</p>
                <p className="text-[10px] text-slate-400 mt-0.5">RoboSolutions Inc. • San Francisco, CA</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 bg-slate-950/50 p-3 rounded-lg border border-slate-850 leading-relaxed">
              <span className="font-semibold text-slate-400 block mb-0.5">Phase 3 Intelligence:</span>
              Web scraper search agents and Pydantic-based Job Description parsers are coming in future phases.
            </p>
          </div>

          {/* Skill Gaps Module */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-bold text-white flex items-center">
                <Cpu className="h-4 w-4 text-pink-400 mr-2" /> Target Skills
              </h3>
              <span className="text-[10px] font-bold bg-slate-850 text-pink-300 px-2 py-0.5 rounded border border-slate-800">Mockup</span>
            </div>

            {/* Skills checklist */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2 py-1 bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 rounded text-xs font-semibold">FastAPI (Match)</span>
              <span className="px-2 py-1 bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 rounded text-xs font-semibold">React + TS (Match)</span>
              <span className="px-2 py-1 bg-rose-950/40 text-rose-300 border border-rose-800/40 rounded text-xs font-semibold">PyTorch (Gap)</span>
              <span className="px-2 py-1 bg-rose-950/40 text-rose-300 border border-rose-800/40 rounded text-xs font-semibold">Docker (Gap)</span>
            </div>

            <p className="text-xs text-slate-500 bg-slate-950/50 p-3 rounded-lg border border-slate-850 leading-relaxed">
              <span className="font-semibold text-slate-400 block mb-0.5">Phase 3 RAG Matching:</span>
              AI gap analysis running against resume markdown strings and scraped job requirements.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
