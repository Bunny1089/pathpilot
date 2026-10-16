from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.profile import Profile
from backend.app.models.goal import Goal
from backend.app.models.task import Task
from backend.app.schemas.schemas import TaskOut, TaskUpdate
from typing import Dict, Any

router = APIRouter()

@router.get("/dashboard", response_model=Dict[str, Any])
def get_dashboard_data(db: Session = Depends(get_db)):
    """
    Fetch all dashboard metrics for the default profile in a single batch request,
    minimizing round-trips for the local client.
    """
    # Resolve the active local user dynamically from configuration
    from backend.app.services import user_service
    user = user_service.get_local_user(db)
        
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    goals = db.query(Goal).filter(Goal.user_id == user.id).all()
    tasks = db.query(Task).filter(Task.user_id == user.id).all()
    
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
        },
        "profile": {
            "headline": profile.headline if profile else None,
            "location": profile.location if profile else None,
            "target_role": profile.target_role if profile else None,
            "target_domain": profile.target_domain if profile else None,
        } if profile else None,
        "goals": [
            {
                "id": g.id,
                "title": g.title,
                "description": g.description,
                "status": g.status,
                "deadline": g.deadline.isoformat() if g.deadline else None,
            } for g in goals
        ],
        "tasks": [
            {
                "id": t.id,
                "goal_id": t.goal_id,
                "title": t.title,
                "description": t.description,
                "status": t.status,
                "priority": t.priority,
                "due_date": t.due_date.isoformat() if t.due_date else None,
            } for t in tasks
        ]
    }

@router.patch("/tasks/{task_id}", response_model=TaskOut)
def update_task(task_id: int, task_in: TaskUpdate, db: Session = Depends(get_db)):
    """
    Allows updating task properties, such as checking them off as complete.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
        
    db.commit()
    db.refresh(task)
    return task
