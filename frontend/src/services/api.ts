const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface HealthResponse {
  status: string;
  app: string;
  version: string;
  database: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Profile {
  headline: string | null;
  location: string | null;
  target_role: string | null;
  target_domain: string | null;
}

export interface Goal {
  id: number;
  title: string;
  description: string | null;
  status: string;
  deadline: string | null;
}

export interface Task {
  id: number;
  goal_id: number | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
}

export interface DashboardData {
  user: User;
  profile: Profile | null;
  goals: Goal[];
  tasks: Task[];
}

// Resume-specific response interfaces
export interface ResumeChunk {
  chunk_index: number;
  section: string;
  content: string;
}

export interface ActiveResumeResponse {
  has_resume: boolean;
  filename?: string;
  uploaded_at?: string;
  sections?: Record<string, string>;
  chunks_count?: number;
  chunks?: ResumeChunk[];
}

export interface SearchResult {
  id: string;
  content: string;
  section: string;
  chunk_index: number;
  similarity: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
}

export interface StructuredJD {
  job_title: string | null;
  company: string | null;
  required_skills: string[];
  preferred_skills: string[];
  responsibilities: string[];
  qualifications: string[];
  experience: string[];
  education: string[];
  other_requirements: string[];
}

export interface MatchWeights {
  required_skills: number;
  preferred_skills: number;
  experience: number;
  education: number;
}

export interface MatchRequest {
  job_title: string | null;
  company: string | null;
  required_skills: string[];
  preferred_skills: string[];
  responsibilities: string[];
  qualifications: string[];
  experience: string[];
  education: string[];
  other_requirements: string[];
  weights?: MatchWeights;
}

export interface MatchEvidence {
  content: string;
  section: string;
  similarity: number;
  chunk_index: number;
}

export interface RequirementMatch {
  requirement: string;
  status: string; // "Strong Match" | "Partial Match" | "Related/Weak Evidence" | "Missing"
  similarity: number;
  evidence: MatchEvidence | null;
  related_evidence: MatchEvidence | null;
}

export interface CategoryScore {
  score: number;
  weight: number;
  matched_count: number;
  total_count: number;
}

export interface MatchReport {
  job_title: string | null;
  company: string | null;
  overall_score: number;
  recommendation: string;
  weights: MatchWeights;
  category_scores: Record<string, CategoryScore>;
  required_skills: RequirementMatch[];
  preferred_skills: RequirementMatch[];
  experience: RequirementMatch[];
  education: RequirementMatch[];
  other_requirements: RequirementMatch[];
  strengths: string[];
  gaps: string[];
}

export const apiService = {
  /**
   * Check if backend FastAPI is online.
   */
  async checkHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) {
      throw new Error(`Health check failed with status: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Fetch complete dashboard statistics and records.
   */
  async getDashboardData(): Promise<DashboardData> {
    const res = await fetch(`${API_BASE}/dashboard`);
    if (!res.ok) {
      throw new Error(`Failed to retrieve dashboard metrics with status: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Update task status (e.g. todo -> done).
   */
  async updateTaskStatus(taskId: number, status: 'todo' | 'in_progress' | 'done'): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      throw new Error(`Failed to update task ${taskId} with status: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Upload resume PDF to the backend.
   */
  async uploadResume(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/resume/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'File upload failed.' }));
      throw new Error(err.detail || `Upload failed with status: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Fetch the currently active indexed resume data.
   */
  async getActiveResume(): Promise<ActiveResumeResponse> {
    const res = await fetch(`${API_BASE}/resume/active`);
    if (!res.ok) {
      throw new Error(`Failed to query active resume with status: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Perform semantic search against resume chunks.
   */
  async searchResume(query: string): Promise<SearchResponse> {
    const res = await fetch(`${API_BASE}/resume/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      throw new Error(`Semantic retrieval query failed with status: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Analyze pasted job description text.
   */
  async analyzeJDText(text: string): Promise<StructuredJD> {
    const res = await fetch(`${API_BASE}/jd/analyze/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Analysis failed.' }));
      throw new Error(err.detail || `Text analysis failed with status: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Analyze uploaded job description PDF.
   */
  async analyzeJDFile(file: File): Promise<StructuredJD> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/jd/analyze/file`, {
      body: formData,
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Analysis failed.' }));
      throw new Error(err.detail || `File analysis failed with status: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Run the Resume-JD matching engine.
   */
  async matchResume(payload: MatchRequest): Promise<MatchReport> {
    const res = await fetch(`${API_BASE}/matching/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Matching failed.' }));
      throw new Error(err.detail || `Match report generation failed with status: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Start a new Career Orchestrator session from the goal.
   */
  async startAgentSession(goal: string): Promise<CareerState> {
    const res = await fetch(`${API_BASE}/agent/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ goal }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to start session.' }));
      throw new Error(err.detail || `Failed to start session with status: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Fetch current active agent session.
   */
  async getActiveAgentSession(): Promise<CareerState> {
    const res = await fetch(`${API_BASE}/agent/session/active`);
    if (res.status === 404) {
      throw new Error('NO_SESSION');
    }
    if (!res.ok) {
      throw new Error(`Failed to fetch active session with status: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Advance the agent execution loop by one step.
   */
  async stepAgentSession(): Promise<CareerState> {
    const res = await fetch(`${API_BASE}/agent/session/step`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to step session.' }));
      throw new Error(err.detail || `Failed to step session with status: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Submit job approvals to resume orchestrator and create roadmap tasks.
   */
  async approveAgentShortlist(approvedJobIndexes: number[]): Promise<CareerState> {
    const res = await fetch(`${API_BASE}/agent/session/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ approved_job_indexes: approvedJobIndexes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to submit approvals.' }));
      throw new Error(err.detail || `Failed to submit approvals with status: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Reset/delete current active agent session.
   */
  async resetAgentSession(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/agent/session`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`Failed to reset session with status: ${res.status}`);
    }
    return res.json();
  },
};

export interface CareerState {
  id: number;
  user_id: number;
  goal: string;
  target_role: string | null;
  location: string | null;
  resume_available: boolean;
  resume_filename: string | null;
  status: string; // 'idle' | 'running' | 'paused_for_approval' | 'completed' | 'failed'
  next_action: string;
  logs: string[];
  jobs_found: any[];
  matches: MatchReport[];
  shortlisted_jobs: any[];
  pending_approval: boolean;
  created_at: string;
  updated_at: string;
}



