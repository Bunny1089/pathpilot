from backend.app.models.user import User
from backend.app.models.profile import Profile
from backend.app.models.goal import Goal
from backend.app.models.task import Task

def test_database_initialization_and_crud(db_session):
    """
    Verifies that model entities can be written to the database,
    foreign key relations work as expected, and rows are fetched correctly.
    """
    # 1. Insert User
    user = User(email="mentor@pathpilot.ai", name="Mentor User")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    assert user.id is not None
    assert user.email == "mentor@pathpilot.ai"

    # 2. Insert profile linked to the User
    profile = Profile(
        user_id=user.id,
        headline="AI Research Lead",
        location="Boston, MA",
        target_role="AI Architect",
        target_domain="Energy"
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    
    assert profile.id is not None
    # Verify the one-to-one relationship
    assert user.profile.headline == "AI Research Lead"

    # 3. Insert Goal linked to the User
    goal = Goal(
        user_id=user.id,
        title="Complete PathPilot MVP",
        description="Build and verify the foundation.",
        status="in_progress"
    )
    db_session.add(goal)
    db_session.commit()
    db_session.refresh(goal)
    
    assert goal.id is not None
    # Verify the one-to-many relationship
    assert len(user.goals) == 1
    assert user.goals[0].title == "Complete PathPilot MVP"

    # 4. Insert Task linked to User & Goal
    task = Task(
        user_id=user.id,
        goal_id=goal.id,
        title="Write pytest suite",
        description="Cover health endpoints and database mapping.",
        status="todo",
        priority="high"
    )
    db_session.add(task)
    db_session.commit()
    db_session.refresh(task)
    
    assert task.id is not None
    # Verify relationship linking
    assert len(goal.tasks) == 1
    assert goal.tasks[0].title == "Write pytest suite"
    assert len(user.tasks) == 1
