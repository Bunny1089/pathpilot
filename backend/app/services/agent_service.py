import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from backend.app.models.career_state import CareerState
from backend.app.models.resume import Resume
from backend.app.models.user import User
from backend.app.models.goal import Goal
from backend.app.models.task import Task
from backend.app.schemas.schemas import MatchRequest, MatchWeights
from backend.app.services.jd_parser import parse_job_description
from backend.app.services.matching_service import match_resume_to_jd

# 1. Mock Jobs Database (Localized by Role & City)
MOCK_JOBS_TEMPLATES = {
    "ai/ml": [
        {
            "job_title": "AI/ML Developer Intern",
            "company": "{company_suffix}",
            "text": """Responsibilities:
- Build high-performance REST APIs.
- Collaborate with engineering team to train neural networks.
Required Skills:
- Python
- React
- PyTorch
Preferred Skills:
- FastAPI
Education:
- BS in Computer Science"""
        },
        {
            "job_title": "Computer Vision Intern",
            "company": "DeepVision {location_tag}",
            "text": """Responsibilities:
- Train convolutional neural networks.
- Process image and video datasets.
Required Skills:
- Python
- PyTorch
- OpenCV
Preferred Skills:
- SQL
Education:
- BS in Computer Science"""
        },
        {
            "job_title": "Generative AI Research Intern",
            "company": "SmartNLP Labs",
            "text": """Responsibilities:
- Design local RAG vector search pipelines.
- Fine-tune transformer models.
Required Skills:
- Python
- PyTorch
- LLM
Preferred Skills:
- Docker
Education:
- MS or BS in Computer Science"""
        },
        {
            "job_title": "MLOps & Cloud Intern",
            "company": "ScaleML Systems",
            "text": """Responsibilities:
- Deploy machine learning inference pipelines.
- Set up local database persistency.
Required Skills:
- Python
- Kubernetes
- SQL
Preferred Skills:
- Docker
Education:
- BS in Computer Science or Engineering"""
        }
    ],
    "software": [
        {
            "job_title": "Software Engineer Intern",
            "company": "{company_suffix}",
            "text": """Responsibilities:
- Code responsive web layouts and interface components.
- Write REST API endpoints.
Required Skills:
- React
- JavaScript
- Python
Preferred Skills:
- TypeScript
Education:
- BS in Computer Science"""
        },
        {
            "job_title": "Backend Engineering Intern",
            "company": "API Scale Solutions",
            "text": """Responsibilities:
- Design local SQLite schemas and API routing structures.
- Integrate user profiles and goal workflows.
Required Skills:
- Python
- FastAPI
- SQL
Preferred Skills:
- PostgreSQL
Education:
- BS in Computer Science"""
        },
        {
            "job_title": "Frontend developer Intern",
            "company": "PixelPerfect UI",
            "text": """Responsibilities:
- Build state command center using React.
- Style UI modules using Tailwind CSS.
Required Skills:
- React
- TypeScript
- JavaScript
Preferred Skills:
- Tailwind CSS
Education:
- BS or BA in design/CS"""
        }
    ]
}

def parse_goal_details(goal: str):
    """
    Heuristically extracts target role and location from the user's career goal text.
    """
    # Defaults
    role = "AI/ML Intern"
    loc = "Pune"
    
    # 1. Extract location: "in Pune", "in San Francisco", etc.
    loc_match = re.search(r'\bin\s+([A-Za-z\s]+?)(?=\s+(?:this|next|week|month|year)\b|$)', goal, re.IGNORECASE)
    if loc_match:
        loc = loc_match.group(1).strip()
        
    # 2. Extract role keywords
    goal_lower = goal.lower()
    if "software" in goal_lower:
        role = "Software Engineer Intern"
    elif "data scientist" in goal_lower or "data science" in goal_lower:
        role = "Data Science Intern"
    elif "frontend" in goal_lower:
        role = "Frontend Intern"
    elif "backend" in goal_lower:
        role = "Backend Intern"
    elif "ml" in goal_lower or "ai" in goal_lower or "machine learning" in goal_lower:
        role = "AI/ML Intern"
        
    return role, loc

def generate_mock_jobs(role: str, location: str) -> List[Dict[str, Any]]:
    """
    [Tool search_jobs] Generates deterministic local job listings for the target role/location.
    """
    # Pick template category based on role keywords
    category = "software"
    if any(k in role.lower() for k in ["ai", "ml", "machine", "intelligence"]):
        category = "ai/ml"
        
    templates = MOCK_JOBS_TEMPLATES.get(category, MOCK_JOBS_TEMPLATES["software"])
    jobs = []
    
    # Instantiate templates for location
    for idx, t in enumerate(templates):
        comp = t["company"].format(
            company_suffix=f"TechCorp {location}",
            location_tag=location
        )
        # Create a unique mock JD
        jobs.append({
            "id": f"mock_job_{idx + 1}",
            "job_title": t["job_title"],
            "company": comp,
            "location": location,
            "raw_text": t["text"]
        })
    return jobs

# 2. Core Agent Service Operations
def init_agent_session(db: Session, user_id: int, goal: str) -> CareerState:
    """
    Starts/resets a career orchestrator session for the given user.
    """
    # 1. Clean existing active sessions to keep it single-session
    existing = db.query(CareerState).filter(CareerState.user_id == user_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        
    # 2. Parse details
    target_role, location = parse_goal_details(goal)
    
    # 3. Check resume status
    resume = db.query(Resume).filter(Resume.user_id == user_id).first()
    resume_available = resume is not None
    resume_filename = resume.filename if resume else None
    
    # 4. Create session state record
    session = CareerState(
        user_id=user_id,
        goal=goal,
        target_role=target_role,
        location=location,
        resume_available=resume_available,
        resume_filename=resume_filename,
        status="running",
        next_action="Check Context",
        logs=[f"Session initialized with goal: '{goal}'"]
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

def run_orchestration_step(db: Session, session_id: int) -> CareerState:
    """
    Runs the next logical tool in the agent's decision loop based on CareerState.
    """
    session = db.query(CareerState).filter(CareerState.id == session_id).first()
    if not session:
        raise ValueError(f"Agent session {session_id} not found.")
        
    if session.status in ["completed", "failed", "paused_for_approval"]:
        return session
        
    user = db.query(User).filter(User.id == session.user_id).first()
    if not user:
        session.status = "failed"
        session.logs.append("Failed: User record missing.")
        db.commit()
        return session

    action = session.next_action
    
    if action == "Check Context":
        session.logs.append("[get_profile] Tool executed: read user target profile.")
        
        # Check resume availability
        resume = db.query(Resume).filter(Resume.user_id == user.id).first()
        if not resume:
            session.resume_available = False
            session.status = "failed"
            session.next_action = "Upload Resume"
            session.logs.append("[get_resume] Tool executed. Observation: No active resume indexed. Please go upload a resume.")
        else:
            session.resume_available = True
            session.resume_filename = resume.filename
            session.next_action = "Search Jobs"
            session.logs.append(f"[get_resume] Tool executed. Observation: Found active resume '{resume.filename}'. Proceeding.")
            
        db.commit()
        return session

    elif action == "Search Jobs":
        session.logs.append(f"[search_jobs] Tool executed: searching for '{session.target_role}' positions in '{session.location}'.")
        
        # Generate mock jobs
        jobs = generate_mock_jobs(session.target_role, session.location)
        session.jobs_found = jobs
        session.next_action = "Analyze & Match Jobs"
        session.logs.append(f"[search_jobs] Observation: Found {len(jobs)} positions. Ready to match compatibility.")
        
        db.commit()
        return session

    elif action == "Analyze & Match Jobs":
        session.logs.append("[match_resume] Tool executed: analyzing jobs and running vector matching engine.")
        
        matches = []
        for job in session.jobs_found:
            # 1. Structure the mock job
            structured_jd_dict = parse_job_description(job["raw_text"])
            # Inject company/title from job item
            structured_jd_dict["job_title"] = job["job_title"]
            structured_jd_dict["company"] = job["company"]
            
            # Construct matching request
            req = MatchRequest(**structured_jd_dict)
            
            # 2. Match against resume
            report = match_resume_to_jd(db, user.email, req)
            # Serialize report
            matches.append(report.model_dump())
            
        session.matches = matches
        session.next_action = "Rank Jobs"
        session.logs.append(f"[match_resume] Observation: calculated fit scores for all {len(matches)} listings.")
        
        db.commit()
        return session

    elif action == "Rank Jobs":
        session.logs.append("[rank_jobs] Tool executed: sorting jobs by overall match score.")
        
        # Rank by overall_score descending
        ranked = sorted(session.matches, key=lambda x: x.get("overall_score", 0.0), reverse=True)
        session.shortlisted_jobs = ranked
        
        # Pause for human approval
        session.status = "paused_for_approval"
        session.pending_approval = True
        session.next_action = "Await User Approval"
        
        top_job = ranked[0]["job_title"] if ranked else "N/A"
        top_company = ranked[0]["company"] if ranked else "N/A"
        top_score = ranked[0]["overall_score"] if ranked else 0.0
        
        session.logs.append(
            f"[rank_jobs] Observation: ranked job shortlist. "
            f"Top match: {top_job} at {top_company} ({top_score}% Fit). "
            f"Pausing for user selection."
        )
        
        db.commit()
        return session

    else:
        # Fallback
        session.status = "failed"
        session.logs.append(f"Failed: Unrecognized agent state action '{action}'.")
        db.commit()
        return session

def approve_shortlist(db: Session, session_id: int, approved_indexes: List[int]) -> CareerState:
    """
    Submits user approvals, resumes execution, and creates checklist tasks in SQLite database.
    """
    session = db.query(CareerState).filter(CareerState.id == session_id).first()
    if not session:
        raise ValueError(f"Agent session {session_id} not found.")
        
    if session.status != "paused_for_approval":
        raise ValueError("Cannot submit approvals: Session is not in paused_for_approval state.")
        
    session.logs.append(f"User approved job indices: {approved_indexes}. Resume loop.")
    session.pending_approval = False
    session.status = "running"
    session.next_action = "Create Tasks"
    db.commit()
    
    # Run the "Create Tasks" tool immediately in this step
    session.logs.append("[create_task] Tool executed: creating application tasks in SQLite checklist.")
    
    # 1. Resolve user's active Goal (to attach tasks to)
    goal = db.query(Goal).filter(Goal.user_id == session.user_id).first()
    if not goal:
        # Create a default goal if none exists
        goal = Goal(
            user_id=session.user_id,
            title=f"Land a {session.target_role} role",
            description=f"Roadmap generated by Career Agent for goal: '{session.goal}'",
            status="in_progress",
            deadline=datetime.now(timezone.utc) + timedelta(weeks=8)
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)
        
    created_count = 0
    # 2. Iterate approved jobs
    for idx in approved_indexes:
        if idx < 0 or idx >= len(session.shortlisted_jobs):
            continue
        job = session.shortlisted_jobs[idx]
        title = f"Apply to {job['job_title']} at {job['company']}"
        desc = (
            f"Semantic Fit Score: {job['overall_score']}%.\n"
            f"Recommendation: {job['recommendation']}.\n"
            f"Key Strengths: {', '.join(job['strengths'][:3])}.\n"
            f"Gaps to address: {', '.join(job['gaps'][:3])}."
        )
        
        # Create Task
        task = Task(
            user_id=session.user_id,
            goal_id=goal.id,
            title=title,
            description=desc,
            status="todo",
            priority="high" if job["overall_score"] >= 75.0 else "medium",
            due_date=datetime.now(timezone.utc) + timedelta(days=7)
        )
        db.add(task)
        created_count += 1
        session.logs.append(f"[create_task] Created task checklist item for '{job['job_title']}' at '{job['company']}'.")
        
    session.status = "completed"
    session.next_action = "Finished"
    session.logs.append(f"Completed: Agent finished processing. Created {created_count} tasks in active checklist.")
    db.commit()
    db.refresh(session)
    return session
