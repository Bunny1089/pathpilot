from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.services.user_service import get_local_user
from backend.app.models.career_state import CareerState
from backend.app.schemas.schemas import (
    AgentGoalPayload, CareerStateOut, JobApprovalPayload
)
from backend.app.services.agent_service import (
    init_agent_session, run_orchestration_step, approve_shortlist
)

router = APIRouter()

@router.post("/session", response_model=CareerStateOut)
def start_session(payload: AgentGoalPayload, db: Session = Depends(get_db)):
    """
    Starts a new Career Orchestrator session from the user's input career goal.
    """
    try:
        user = get_local_user(db)
        session = init_agent_session(db, user.id, payload.goal)
        return session
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start agent session: {str(e)}"
        )

@router.get("/session/active", response_model=CareerStateOut)
def get_active_session(db: Session = Depends(get_db)):
    """
    Fetches the current active orchestrator session state.
    """
    user = get_local_user(db)
    session = db.query(CareerState).filter(CareerState.user_id == user.id).first()
    if not session:
        raise HTTPException(
            status_code=404,
            detail="No active agent session found."
        )
    return session

@router.post("/session/step", response_model=CareerStateOut)
def run_step(db: Session = Depends(get_db)):
    """
    Executes the next step in the agent decision loop.
    """
    user = get_local_user(db)
    session = db.query(CareerState).filter(CareerState.user_id == user.id).first()
    if not session:
        raise HTTPException(
            status_code=404,
            detail="No active agent session found to step."
        )
    try:
        updated_session = run_orchestration_step(db, session.id)
        return updated_session
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Step execution failed: {str(e)}")

@router.post("/session/approve", response_model=CareerStateOut)
def approve_jobs(payload: JobApprovalPayload, db: Session = Depends(get_db)):
    """
    Submits user approvals for shortlisted jobs and creates roadmap tasks.
    """
    user = get_local_user(db)
    session = db.query(CareerState).filter(CareerState.user_id == user.id).first()
    if not session:
        raise HTTPException(
            status_code=404,
            detail="No active agent session found to approve."
        )
    try:
        updated_session = approve_shortlist(db, session.id, payload.approved_job_indexes)
        return updated_session
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Approval submission failed: {str(e)}")

@router.delete("/session")
def reset_session(db: Session = Depends(get_db)):
    """
    Resets/deletes the current agent session.
    """
    user = get_local_user(db)
    session = db.query(CareerState).filter(CareerState.user_id == user.id).first()
    if session:
        db.delete(session)
        db.commit()
    return {"status": "success", "message": "Agent session reset successfully."}
