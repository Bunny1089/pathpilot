import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '../services/api';
import type { CareerState } from '../services/api';
import { 
  Bot, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Terminal, 
  Compass, 
  Briefcase, 
  Sparkles, 
  Target, 
  UserCheck, 
  ArrowRight,
  ListTodo
} from 'lucide-react';

interface CareerAgentViewProps {
  onTasksUpdated?: () => void;
}

export const CareerAgentView: React.FC<CareerAgentViewProps> = ({ onTasksUpdated }) => {
  const [careerState, setCareerState] = useState<CareerState | null>(null);
  const [goalInput, setGoalInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stepping, setStepping] = useState(false);
  const [autoRun, setAutoRun] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvedIndexes, setApprovedIndexes] = useState<Record<number, boolean>>({});
  
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [careerState?.logs]);

  // Load active session on mount
  const loadActiveSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await apiService.getActiveAgentSession();
      setCareerState(session);
      initializeApprovalCheckboxes(session);
    } catch (err: any) {
      if (err.message !== 'NO_SESSION') {
        console.error("Failed to query active agent session:", err);
        setError("Could not retrieve active session state.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveSession();
  }, []);

  // Initialize approval checkboxes to true by default for all shortlisted jobs
  const initializeApprovalCheckboxes = (session: CareerState) => {
    if (session.shortlisted_jobs && session.shortlisted_jobs.length > 0) {
      const initial: Record<number, boolean> = {};
      session.shortlisted_jobs.forEach((_, idx) => {
        initial[idx] = true;
      });
      setApprovedIndexes(initial);
    }
  };

  const handleStep = useCallback(async () => {
    if (!careerState || stepping) return;
    setStepping(true);
    setError(null);
    try {
      const updated = await apiService.stepAgentSession();
      setCareerState(updated);
      if (updated.status === 'paused_for_approval') {
        initializeApprovalCheckboxes(updated);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during step execution.");
    } finally {
      setStepping(false);
    }
  }, [careerState, stepping]);

  // Auto-advance logic
  useEffect(() => {
    if (!careerState || !autoRun || stepping) return;

    if (careerState.status === 'running' && careerState.next_action !== 'Await User Approval') {
      const timer = setTimeout(() => {
        handleStep();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [careerState, autoRun, stepping, handleStep]);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const session = await apiService.startAgentSession(goalInput);
      setCareerState(session);
      setApprovedIndexes({});
    } catch (err: any) {
      setError(err.message || "Failed to initialize orchestrator session.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!careerState) return;

    const indexes = Object.keys(approvedIndexes)
      .map(Number)
      .filter((idx) => approvedIndexes[idx]);

    setStepping(true);
    setError(null);
    try {
      const updated = await apiService.approveAgentShortlist(indexes);
      setCareerState(updated);
      if (onTasksUpdated) {
        onTasksUpdated();
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit job approvals.");
    } finally {
      setStepping(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiService.resetAgentSession();
      setCareerState(null);
      setGoalInput('');
      setApprovedIndexes({});
    } catch {
      setError("Failed to reset orchestrator session.");
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setGoalInput(example);
  };

  const toggleCheckbox = (idx: number) => {
    setApprovedIndexes((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const selectAllJobs = (val: boolean) => {
    if (!careerState?.shortlisted_jobs) return;
    const next: Record<number, boolean> = {};
    careerState.shortlisted_jobs.forEach((_, idx) => {
      next[idx] = val;
    });
    setApprovedIndexes(next);
  };

  // Helper to map action name to stepper index
  const getStepIndex = (action: string, status: string): number => {
    if (status === 'completed') return 6;
    if (status === 'failed') return -1;
    switch (action) {
      case 'Check Context': return 0;
      case 'Search Jobs': return 1;
      case 'Analyze & Match Jobs': return 2;
      case 'Rank Jobs': return 3;
      case 'Await User Approval': return 4;
      case 'Create Tasks': return 5;
      case 'Finished': return 6;
      default: return 0;
    }
  };

  const stepsList = [
    { name: 'Check Context', desc: 'Read target profile & verify resume' },
    { name: 'Search Jobs', desc: 'Retrieve matching opportunities' },
    { name: 'Analyze & Match', desc: 'Evaluate semantic similarity' },
    { name: 'Rank Jobs', desc: 'Sort matches by compatibility' },
    { name: 'User Approval', desc: 'Review shortlisted items' },
    { name: 'Create Tasks', desc: 'Generate roadmap checklist items' }
  ];

  const activeStepIdx = careerState ? getStepIndex(careerState.next_action, careerState.status) : -1;

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-8 ml-64 min-h-[calc(100vh-4rem)]">
      
      {/* View Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center space-x-3">
            <Bot className="h-9 w-9 text-indigo-400" />
            <span>Career Operations Agent</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            An autonomous, privacy-respecting career planning partner that converts goals into roadmap checklists.
          </p>
        </div>
        {careerState && (
          <button
            onClick={handleReset}
            disabled={loading || stepping}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-lg border border-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset Agent</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-rose-950/40 border border-rose-900/60 p-4 rounded-xl flex items-start space-x-3 text-rose-300 text-sm">
          <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="h-10 w-10 text-indigo-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading orchestrator state...</p>
        </div>
      ) : !careerState ? (
        
        /* 1. SETUP SESSION SCREEN */
        <div className="max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <Target className="h-5 w-5 text-indigo-400 mr-2" /> Launch New Career Goal
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Describe the role, domains, or coordinates you are targeting. The career orchestrator will parse details, gather matching jobs, analyze your local resume embeddings, rank fits, and let you approve additions to your dashboard checklist.
            </p>
            
            <form onSubmit={handleStartSession} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Target Career Objective
                </label>
                <textarea
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="e.g. Find 5 software engineering internships in Pune within the next 8 weeks..."
                  className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-sans focus:border-indigo-500 focus:outline-none placeholder:text-slate-700 leading-relaxed"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!goalInput.trim()}
                  className="flex items-center space-x-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Launch Career Orchestration</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
              <Sparkles className="h-4 w-4 text-indigo-400 mr-1.5" /> Template Examples
            </h4>
            <p className="text-[11px] text-slate-500">
              Click an objective template below to populate the orchestrator prompt.
            </p>
            <div className="space-y-2.5">
              <button
                onClick={() => handleExampleClick("Find me 10 AI/ML internships in Pune this week")}
                className="w-full text-left p-3 rounded-lg bg-slate-850 hover:bg-slate-800/80 border border-slate-800/60 text-xs text-slate-300 hover:text-white transition-colors"
              >
                "Find me 10 AI/ML internships in Pune this week"
              </button>
              <button
                onClick={() => handleExampleClick("Get a software engineering role in San Francisco")}
                className="w-full text-left p-3 rounded-lg bg-slate-850 hover:bg-slate-800/80 border border-slate-800/60 text-xs text-slate-300 hover:text-white transition-colors"
              >
                "Get a software engineering role in San Francisco"
              </button>
              <button
                onClick={() => handleExampleClick("Find backend developer positions in London")}
                className="w-full text-left p-3 rounded-lg bg-slate-850 hover:bg-slate-800/80 border border-slate-800/60 text-xs text-slate-300 hover:text-white transition-colors"
              >
                "Find backend developer positions in London"
              </button>
            </div>
          </div>
        </div>

      ) : (

        /* 2. ACTIVE SESSION RUNNING SCREEN */
        <div className="space-y-6">
          
          {/* Metadata Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Goal Objective</span>
              <span className="text-sm font-semibold text-white block mt-1 line-clamp-2">{careerState.goal}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Parsed Role</span>
              <span className="text-sm font-semibold text-indigo-300 block mt-1 flex items-center">
                <Briefcase className="h-3.5 w-3.5 mr-1" /> {careerState.target_role || 'Resolving...'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Parsed Location</span>
              <span className="text-sm font-semibold text-slate-300 block mt-1 flex items-center">
                <Compass className="h-3.5 w-3.5 mr-1" /> {careerState.location || 'Resolving...'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Session Status</span>
              <div className="mt-1 flex items-center space-x-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${
                  careerState.status === 'completed' ? 'bg-emerald-400' :
                  careerState.status === 'failed' ? 'bg-rose-500' :
                  careerState.status === 'paused_for_approval' ? 'bg-amber-400 animate-pulse' :
                  'bg-indigo-400 animate-ping'
                }`} />
                <span className="text-xs font-bold text-white capitalize">
                  {careerState.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Core Dashboard: Left Stepper & Terminal, Right Shortlist */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Progress Stepper & Terminal Logs */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Stepper Timeline */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-slate-300">
                  Agent Action Progress
                </h3>
                
                <div className="relative border-l border-slate-800 ml-3.5 space-y-6 pb-2">
                  {stepsList.map((step, idx) => {
                    const isCompleted = activeStepIdx > idx || careerState.status === 'completed';
                    const isActive = activeStepIdx === idx && careerState.status !== 'completed';
                    
                    return (
                      <div key={idx} className="relative pl-6">
                        {/* Dot Indicator */}
                        <div className={`absolute left-0 -translate-x-[50%] -translate-y-[10%] flex items-center justify-center rounded-full border h-7 w-7 transition-all ${
                          isCompleted 
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400' 
                            : isActive 
                            ? 'bg-indigo-950 border-indigo-500 text-indigo-400 ring-4 ring-indigo-950' 
                            : 'bg-slate-950 border-slate-800 text-slate-600'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : isActive ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <span className="text-[10px] font-bold">{idx + 1}</span>
                          )}
                        </div>

                        <div>
                          <h4 className={`text-xs font-bold ${
                            isCompleted ? 'text-emerald-400' : isActive ? 'text-white' : 'text-slate-500'
                          }`}>
                            {step.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Control Panel buttons */}
                {careerState.status === 'running' && (
                  <div className="mt-6 border-t border-slate-850 pt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="autoRun"
                        checked={autoRun}
                        onChange={(e) => setAutoRun(e.target.checked)}
                        className="rounded border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 h-4 w-4 bg-slate-950"
                      />
                      <label htmlFor="autoRun" className="text-xs text-slate-400 cursor-pointer">
                        Auto-Advance loop
                      </label>
                    </div>

                    {!autoRun && (
                      <button
                        onClick={handleStep}
                        disabled={stepping}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {stepping ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
                        <span>Next Step</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Log terminal */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300 flex items-center">
                    <Terminal className="h-4 w-4 text-indigo-400 mr-1.5" /> Agent execution logs
                  </h3>
                  <span className="text-[9px] font-mono bg-slate-950 text-slate-500 px-2 py-0.5 rounded border border-slate-850">
                    {careerState.logs.length} entries
                  </span>
                </div>
                
                <div className="bg-slate-950 border border-slate-855 rounded-xl p-4 h-60 overflow-y-auto font-mono text-[10px] text-slate-400 leading-relaxed space-y-2 select-text scrollbar-thin">
                  {careerState.logs.map((log, idx) => {
                    const isTool = log.startsWith('[');
                    return (
                      <div key={idx} className={`${isTool ? 'text-indigo-300' : 'text-slate-400'}`}>
                        <span className="text-slate-650 select-none mr-2">❯</span>
                        {log}
                      </div>
                    );
                  })}
                  <div ref={logEndRef} />
                </div>
              </div>

            </div>

            {/* Right 2 Columns: Shortlist Approval checklist or Results Card */}
            <div className="lg:col-span-2 space-y-6">
              
              {careerState.status === 'failed' && (
                /* FAILURE BOX */
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-lg">
                  <div className="mx-auto w-14 h-14 bg-rose-950/60 rounded-full flex items-center justify-center border border-rose-800/40">
                    <XCircle className="h-7 w-7 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Agent Execution Blocked</h3>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                      The orchestrator encountered a configuration failure:
                    </p>
                    <span className="inline-block mt-3 px-3 py-1 bg-rose-950/40 text-rose-300 border border-rose-900/60 rounded-lg text-xs font-semibold">
                      {careerState.logs[careerState.logs.length - 1] || 'Unknown Context Failure'}
                    </span>
                  </div>

                  {!careerState.resume_available && (
                    <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-6 text-center max-w-sm mx-auto">
                      <p className="text-xs text-slate-500 leading-relaxed mb-4">
                        A semantic matching run requires an indexed resume. Please proceed to upload a PDF resume first.
                      </p>
                      <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-lg"
                      >
                        Reset and go to Resume Tab
                      </button>
                    </div>
                  )}
                </div>
              )}

              {careerState.status === 'running' && careerState.next_action !== 'Await User Approval' && (
                /* RUNNING INDICATOR CARD */
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-6 shadow-lg min-h-[400px] flex flex-col justify-center items-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
                    <Bot className="h-16 w-16 text-indigo-400 relative z-10 animate-bounce" />
                  </div>
                  <div className="space-y-2 max-w-md">
                    <h3 className="text-lg font-bold text-white">Agent is Processing...</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Executing tool <span className="text-indigo-400 font-semibold font-mono font-bold">[{careerState.next_action}]</span>. Evaluating parameters, scraping local mock databases, or resolving ChromaDB vector matches.
                    </p>
                  </div>
                  
                  {/* Small progress loading bar */}
                  <div className="w-48 bg-slate-850 h-1.5 rounded-full overflow-hidden border border-slate-850">
                    <div className="bg-indigo-500 h-full rounded-full animate-infinite-loading" />
                  </div>
                </div>
              )}

              {careerState.status === 'paused_for_approval' && (
                /* 3. HUMAN IN THE LOOP APPROVAL PANEL */
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-md font-bold text-white flex items-center">
                        <UserCheck className="h-5 w-5 text-indigo-400 mr-2" /> Shortlisted Job Matches
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Select which job positions to add as action-checklist tasks to your roadmap.
                      </p>
                    </div>
                    <div className="flex space-x-2 text-[10px]">
                      <button
                        onClick={() => selectAllJobs(true)}
                        className="px-2 py-1 bg-slate-850 hover:bg-slate-805 rounded text-slate-300 font-medium"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => selectAllJobs(false)}
                        className="px-2 py-1 bg-slate-850 hover:bg-slate-805 rounded text-slate-300 font-medium"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {careerState.shortlisted_jobs && careerState.shortlisted_jobs.length > 0 ? (
                      careerState.shortlisted_jobs.map((job, idx) => {
                        const isChecked = !!approvedIndexes[idx];
                        const fitScore = job.overall_score || 0;
                        const isStrong = fitScore >= 75.0;
                        const isMedium = fitScore >= 60.0 && fitScore < 75.0;
                        
                        return (
                          <div 
                            key={idx}
                            onClick={() => toggleCheckbox(idx)}
                            className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                              isChecked 
                                ? 'bg-slate-850/60 border-indigo-500/80 shadow-md shadow-indigo-950/20' 
                                : 'bg-slate-900/40 border-slate-850 opacity-60 hover:opacity-80 hover:border-slate-800'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                {/* Checkbox input */}
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}} // toggled by parent click
                                  className="mt-1 rounded border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 h-4 w-4 bg-slate-950 cursor-pointer"
                                />
                                <div>
                                  <h4 className="text-xs font-bold text-white">{job.job_title}</h4>
                                  <span className="text-[10px] text-slate-400 mt-0.5 block">{job.company} • {careerState.location}</span>
                                  
                                  {/* strengths / gaps list */}
                                  <div className="mt-3 flex flex-wrap gap-1.5">
                                    {job.strengths && job.strengths.slice(0, 3).map((st: string, sIdx: number) => (
                                      <span key={sIdx} className="px-1.5 py-0.5 rounded bg-emerald-950/45 text-emerald-400 border border-emerald-900/40 text-[9px] font-semibold">
                                        + {st}
                                      </span>
                                    ))}
                                    {job.gaps && job.gaps.slice(0, 3).map((gp: string, gIdx: number) => (
                                      <span key={gIdx} className="px-1.5 py-0.5 rounded bg-rose-955 text-rose-350 border border-rose-900/40 text-[9px] font-semibold">
                                        - {gp}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Progress Score Indicator */}
                              <div className="text-right flex flex-col items-end space-y-1.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border ${
                                  isStrong 
                                    ? 'bg-emerald-955 text-emerald-300 border-emerald-900/60' 
                                    : isMedium
                                    ? 'bg-amber-955 text-amber-300 border-amber-900/60'
                                    : 'bg-rose-955 text-rose-350 border-rose-900/60'
                                }`}>
                                  {fitScore.toFixed(0)}% Compatibility
                                </span>
                                <span className="text-[9px] text-slate-500 font-semibold">{job.recommendation}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-xs">
                        No shortlisted jobs returned.
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-850 pt-4 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400">
                      {Object.values(approvedIndexes).filter(Boolean).length} of {careerState.shortlisted_jobs?.length || 0} jobs selected
                    </span>
                    
                    <button
                      onClick={handleApprove}
                      disabled={stepping || Object.values(approvedIndexes).filter(Boolean).length === 0}
                      className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                    >
                      {stepping ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ListTodo className="h-4 w-4" />}
                      <span>Approve & Generate Tasks</span>
                    </button>
                  </div>
                </div>
              )}

              {careerState.status === 'completed' && (
                /* 4. COMPLETED SUCCESS SCREEN */
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-lg min-h-[400px] flex flex-col justify-center items-center">
                  <div className="mx-auto w-16 h-16 bg-emerald-950/60 rounded-full flex items-center justify-center border border-emerald-800/40">
                    <CheckCircle2 className="h-9 w-9 text-emerald-400" />
                  </div>
                  <div className="space-y-2 max-w-md">
                    <h3 className="text-xl font-bold text-white">Roadmap Generation Complete</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      The Career Agent has finished analyzing, matching, and importing your approved jobs. Check-list tasks have been successfully inserted into your SQLite database.
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 flex items-center justify-between w-full max-w-sm">
                    <div className="flex items-center space-x-3 text-left">
                      <ListTodo className="h-5 w-5 text-indigo-400" />
                      <div>
                        <span className="text-xs font-bold text-white block">Interactive Checklist</span>
                        <span className="text-[10px] text-slate-500">Tasks synced with Dashboard</span>
                      </div>
                    </div>
                    <button
                      onClick={handleReset}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all"
                    >
                      <span>New Goal</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
