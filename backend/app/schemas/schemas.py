from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List, Dict, Literal

# Health Check Schemas
class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    database: str

# Allowed Status and Priority Enums
TaskStatus = Literal["todo", "in_progress", "done", "blocked"]
TaskPriority = Literal["low", "medium", "high"]
GoalStatus = Literal["not_started", "in_progress", "completed", "archived"]

# Task Schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = "todo"
    priority: TaskPriority = "medium"
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    goal_id: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None

class TaskOut(TaskBase):
    id: int
    user_id: int
    goal_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Goal Schemas
class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: GoalStatus = "not_started"
    deadline: Optional[datetime] = None

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[GoalStatus] = None
    deadline: Optional[datetime] = None

class GoalOut(GoalBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    tasks: List[TaskOut] = []

    model_config = ConfigDict(from_attributes=True)

# Profile Schemas
class ProfileBase(BaseModel):
    headline: Optional[str] = None
    location: Optional[str] = None
    target_role: Optional[str] = None
    target_domain: Optional[str] = None

class ProfileCreate(ProfileBase):
    pass

class ProfileOut(ProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# User Schemas
class UserBase(BaseModel):
    email: str
    name: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserOut(UserBase):
    id: int
    created_at: datetime
    profile: Optional[ProfileOut] = None

    model_config = ConfigDict(from_attributes=True)

# Job Description Schemas
class JobDescriptionTextPayload(BaseModel):
    text: str

class JobDescriptionStructured(BaseModel):
    job_title: Optional[str] = None
    company: Optional[str] = None
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    responsibilities: List[str] = []
    qualifications: List[str] = []
    experience: List[str] = []
    education: List[str] = []
    other_requirements: List[str] = []

# Matching Engine Schemas
class MatchWeights(BaseModel):
    required_skills: float = 0.60
    preferred_skills: float = 0.20
    experience: float = 0.15
    education: float = 0.05

class MatchRequest(BaseModel):
    job_title: Optional[str] = None
    company: Optional[str] = None
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    responsibilities: List[str] = []
    qualifications: List[str] = []
    experience: List[str] = []
    education: List[str] = []
    other_requirements: List[str] = []
    weights: Optional[MatchWeights] = None

class MatchEvidence(BaseModel):
    content: str
    section: str
    similarity: float
    chunk_index: int

class RequirementMatch(BaseModel):
    requirement: str
    status: str  # Strong Match, Partial Match, Related/Weak Evidence, Missing
    similarity: float
    evidence: Optional[MatchEvidence] = None
    related_evidence: Optional[MatchEvidence] = None

class CategoryScore(BaseModel):
    score: float
    weight: float
    matched_count: int
    total_count: int

class MatchReportOut(BaseModel):
    job_title: Optional[str] = None
    company: Optional[str] = None
    overall_score: float
    recommendation: str
    weights: MatchWeights
    category_scores: Dict[str, CategoryScore]
    required_skills: List[RequirementMatch] = []
    preferred_skills: List[RequirementMatch] = []
    experience: List[RequirementMatch] = []
    education: List[RequirementMatch] = []
    other_requirements: List[RequirementMatch] = []
    strengths: List[str] = []
    gaps: List[str] = []

# Agentic Career Intelligence Schemas
class AgentGoalPayload(BaseModel):
    goal: str

class CareerStateOut(BaseModel):
    id: int
    user_id: int
    goal: str
    target_role: Optional[str] = None
    location: Optional[str] = None
    resume_available: bool
    resume_filename: Optional[str] = None
    status: str
    next_action: str
    logs: List[str] = []
    jobs_found: List[dict] = []
    matches: List[MatchReportOut] = []
    shortlisted_jobs: List[dict] = []
    pending_approval: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class JobApprovalPayload(BaseModel):
    approved_job_indexes: List[int]



