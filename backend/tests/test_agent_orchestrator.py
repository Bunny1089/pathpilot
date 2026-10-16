import pytest
from backend.app.services.agent_service import (
    parse_goal_details, init_agent_session,
    run_orchestration_step, approve_shortlist
)
from backend.app.models.user import User
from backend.app.models.resume import Resume
from backend.app.models.goal import Goal
from backend.app.models.task import Task
from backend.app.models.career_state import CareerState
from backend.app.core.config import settings

def test_goal_parsing_heuristics():
    """
    Verify target role and location extraction from goal prompts.
    """
    role, loc = parse_goal_details("Find me 10 AI/ML internships in Pune this week")
    assert role == "AI/ML Intern"
    assert loc == "Pune"
    
    role, loc = parse_goal_details("Find 5 software engineering internships in San Francisco")
    assert role == "Software Engineer Intern"
    assert loc == "San Francisco"
    
    role, loc = parse_goal_details("Get a backend developer role in London")
    assert role == "Backend Intern"
    assert loc == "London"

def test_agent_session_initialization(db_session):
    """
    Verify that initializing a session creates the database CareerState record.
    """
    user = User(id=1, email="agent_test@pathpilot.ai", name="Agent Tester")
    db_session.add(user)
    db_session.commit()
    
    goal = "Find me 10 AI/ML internships in Pune"
    session = init_agent_session(db_session, user.id, goal)
    
    assert session.user_id == user.id
    assert session.goal == goal
    assert session.target_role == "AI/ML Intern"
    assert session.location == "Pune"
    assert session.status == "running"
    assert session.next_action == "Check Context"
    assert len(session.logs) == 1

def test_orchestrator_state_transitions(db_session, monkeypatch):
    """
    Verify step-by-step state machine logic for context checking, job searching,
    compatibility matching, and ranking.
    """
    # 1. Seed user and resume
    user = User(id=2, email="loop@pathpilot.ai", name="Loop Tester")
    db_session.add(user)
    db_session.commit()
    
    resume = Resume(
        user_id=user.id,
        filename="test_res.pdf",
        raw_text="React, Python software student",
        sections={"Skills": "React\nPython"}
    )
    db_session.add(resume)
    db_session.commit()
    
    session = init_agent_session(db_session, user.id, "Find software internships in SF")
    
    # --- Step 1: Check Context ---
    session = run_orchestration_step(db_session, session.id)
    assert session.next_action == "Search Jobs"
    assert session.resume_available is True
    assert "Found active resume" in session.logs[-1]
    
    # --- Step 2: Search Jobs ---
    session = run_orchestration_step(db_session, session.id)
    assert session.next_action == "Analyze & Match Jobs"
    assert len(session.jobs_found) == 3 # 3 templates for software
    assert session.jobs_found[0]["location"] == "SF"
    
    # --- Step 3: Match & Analyze ---
    # Mock matching service so it returns a report without requiring vector index loading
    from backend.app.schemas.schemas import MatchReportOut, CategoryScore, MatchWeights
    dummy_report = MatchReportOut(
        job_title="Intern",
        company="TechCorp",
        overall_score=80.0,
        recommendation="Recommended",
        weights=MatchWeights(),
        category_scores={"required_skills": CategoryScore(score=100.0, weight=1.0, matched_count=1, total_count=1)},
        required_skills=[],
        preferred_skills=[],
        experience=[],
        education=[]
    )
    
    import backend.app.services.agent_service as agent_service_mod
    monkeypatch.setattr(agent_service_mod, "match_resume_to_jd", lambda db, email, payload: dummy_report)
    
    session = run_orchestration_step(db_session, session.id)
    assert session.next_action == "Rank Jobs"
    assert len(session.matches) == 3
    assert session.matches[0]["overall_score"] == 80.0
    
    # --- Step 4: Rank Jobs (Pauses for human-in-the-loop) ---
    session = run_orchestration_step(db_session, session.id)
    assert session.status == "paused_for_approval"
    assert session.pending_approval is True
    assert session.next_action == "Await User Approval"
    assert len(session.shortlisted_jobs) == 3

def test_human_approval_and_task_generation(db_session):
    """
    Verify that submitting approvals resumes the loop and creates SQLite tasks.
    """
    user = User(id=3, email="approve@pathpilot.ai", name="Approve Tester")
    db_session.add(user)
    db_session.commit()
    
    # Seed Goal
    goal = Goal(user_id=user.id, title="Get software role", status="in_progress")
    db_session.add(goal)
    db_session.commit()
    
    session = CareerState(
        user_id=user.id,
        goal="Find software roles",
        target_role="Software Engineer Intern",
        location="SF",
        status="paused_for_approval",
        pending_approval=True,
        next_action="Await User Approval",
        shortlisted_jobs=[
            {"job_title": "React Dev Intern", "company": "PixelCorp", "overall_score": 90.0, "recommendation": "Strong", "strengths": ["React"], "gaps": []},
            {"job_title": "Backend Intern", "company": "APICorp", "overall_score": 65.0, "recommendation": "Weak", "strengths": [], "gaps": ["FastAPI"]}
        ]
    )
    db_session.add(session)
    db_session.commit()
    
    # Approve only index 0 (React Dev Intern)
    session = approve_shortlist(db_session, session.id, [0])
    
    assert session.status == "completed"
    assert session.pending_approval is False
    assert session.next_action == "Finished"
    
    # Verify Task is created
    tasks = db_session.query(Task).filter(Task.user_id == user.id).all()
    assert len(tasks) == 1
    assert tasks[0].goal_id == goal.id
    assert "Apply to React Dev Intern at PixelCorp" in tasks[0].title
    assert "Fit Score: 90.0%" in tasks[0].description
    assert tasks[0].priority == "high"

def test_api_endpoints_integration(client, db_session, monkeypatch):
    """
    Verify active agent endpoints: start session, active check, step, approve.
    """
    user = User(id=1, email=settings.DEFAULT_USER_EMAIL, name="API Tester")
    db_session.add(user)
    db_session.commit()
    
    # Start session
    response = client.post("/api/agent/session", json={"goal": "Find 5 software internships in SF"})
    assert response.status_code == 200
    data = response.json()
    assert data["goal"] == "Find 5 software internships in SF"
    assert data["status"] == "running"
    assert data["next_action"] == "Check Context"
    
    # Get active
    response = client.get("/api/agent/session/active")
    assert response.status_code == 200
    assert response.json()["goal"] == "Find 5 software internships in SF"
    
    # Mock step
    # We monkeypatch run_orchestration_step in endpoints namespace
    from datetime import datetime
    dummy_session = CareerState(
        id=1,
        user_id=user.id,
        goal="Find 5 software internships in SF",
        target_role="Software Engineer Intern",
        location="SF",
        resume_available=True,
        status="running",
        next_action="Search Jobs",
        logs=[],
        jobs_found=[],
        matches=[],
        shortlisted_jobs=[],
        pending_approval=False,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    import backend.app.api.endpoints.agent as agent_endpoint
    monkeypatch.setattr(agent_endpoint, "run_orchestration_step", lambda db, sid: dummy_session)
    
    response = client.post("/api/agent/session/step")
    assert response.status_code == 200
    assert response.json()["next_action"] == "Search Jobs"
    
    # Mock approve
    completed_session = CareerState(
        id=1,
        user_id=user.id,
        goal="Find 5 software internships in SF",
        target_role="Software Engineer Intern",
        location="SF",
        resume_available=True,
        status="completed",
        next_action="Finished",
        logs=[],
        jobs_found=[],
        matches=[],
        shortlisted_jobs=[],
        pending_approval=False,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    monkeypatch.setattr(agent_endpoint, "approve_shortlist", lambda db, sid, indexes: completed_session)
    
    response = client.post("/api/agent/session/approve", json={"approved_job_indexes": [0]})
    assert response.status_code == 200
    assert response.json()["status"] == "completed"
    
    # Delete
    response = client.delete("/api/agent/session")
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    
    # Active check should now be 404
    response = client.get("/api/agent/session/active")
    assert response.status_code == 404
