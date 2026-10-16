from backend.app.models.user import User
from backend.app.models.profile import Profile
from backend.app.models.goal import Goal
from backend.app.models.task import Task
from backend.app.core.config import settings

def test_get_dashboard_data(client, db_session):
    """
    Verifies that GET /api/dashboard returns complete metrics for the active local user.
    """
    # Seed utilizing the configured default email
    user = User(email=settings.DEFAULT_USER_EMAIL, name="Test Pilot")
    db_session.add(user)
    db_session.commit()
    
    profile = Profile(user_id=user.id, headline="Developer", location="SF")
    goal = Goal(user_id=user.id, title="Test Goal", status="in_progress")
    db_session.add_all([profile, goal])
    db_session.commit() # Commit to generate IDs
    
    task = Task(user_id=user.id, goal_id=goal.id, title="Test Task", status="todo")
    db_session.add(task)
    db_session.commit()
    
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    
    data = response.json()
    assert data["user"]["name"] == "Test Pilot"
    assert data["user"]["email"] == settings.DEFAULT_USER_EMAIL
    assert data["profile"]["headline"] == "Developer"
    assert len(data["goals"]) == 1
    assert data["goals"][0]["title"] == "Test Goal"
    assert len(data["tasks"]) == 1
    assert data["tasks"][0]["title"] == "Test Task"

def test_update_task_status(client, db_session):
    """
    Verifies that PATCH /api/tasks/{task_id} successfully updates task statuses.
    """
    user = User(email=settings.DEFAULT_USER_EMAIL, name="Test Pilot")
    db_session.add(user)
    db_session.commit()
    
    task = Task(id=42, user_id=user.id, title="Test Task", status="todo")
    db_session.add(task)
    db_session.commit()
    
    # Call the update endpoint to mark as done
    response = client.patch("/api/tasks/42", json={"status": "done"})
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "done"
    
    # Confirm the update was persisted in database
    db_session.refresh(task)
    assert task.status == "done"
