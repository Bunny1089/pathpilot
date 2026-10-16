from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from backend.app.core.config import settings
from backend.app.api.api import api_router
from backend.app.database.session import engine, SessionLocal
from backend.app.database.base_class import Base
from backend.app.models.user import User
from backend.app.models.profile import Profile
from backend.app.models.goal import Goal
from backend.app.models.task import Task
from backend.app.models.career_state import CareerState
def seed_database():
    """
    Seeds the local database with development metrics if the default user's profile is missing.
    """
    db = SessionLocal()
    try:
        from backend.app.services.user_service import get_local_user
        
        # Resolve/Create the configured local user dynamically
        user = get_local_user(db)
        
        # Check if the user already has a profile. If so, database is already seeded.
        if not user.profile:
            print(f"Seeding database with default development records for {user.email}...")
            # 1. User Profile
            profile = Profile(
                user_id=user.id,
                headline="Aspiring AI/ML Engineer & Student",
                location="San Francisco, CA (Remote)",
                target_role="AI/ML Engineering Intern",
                target_domain="Healthcare & Robotics"
            )
            db.add(profile)
            
            # 2. Target Career Goal
            goal = Goal(
                user_id=user.id,
                title="Get an AI/ML internship within the next 8 weeks",
                description="Land an internship focused on training models, building RAG systems, or optimizing pipelines.",
                status="in_progress",
                deadline=datetime.now(timezone.utc) + timedelta(weeks=8)
            )
            db.add(goal)
            db.commit() # Commit to generate goal.id dynamically
            
            # 3. Actionable Roadmap Tasks
            tasks = [
                Task(
                    user_id=user.id,
                    goal_id=goal.id,
                    title="Design PathPilot database schemas & backend",
                    description="Implement the modular FastAPI, SQLAlchemy, SQLite, and Pydantic validation layer.",
                    status="done",
                    priority="high",
                    due_date=datetime.now(timezone.utc) + timedelta(days=1)
                ),
                Task(
                    user_id=user.id,
                    goal_id=goal.id,
                    title="Build React + Tailwind v4 Dashboard UI",
                    description="Develop modern web dashboard showing progress, goals, and today's tasks.",
                    status="in_progress",
                    priority="high",
                    due_date=datetime.now(timezone.utc) + timedelta(days=3)
                ),
                Task(
                    user_id=user.id,
                    goal_id=goal.id,
                    title="Refine personal ML resume",
                    description="Emphasize past generative AI, fine-tuning, and software engineering projects.",
                    status="todo",
                    priority="medium",
                    due_date=datetime.now(timezone.utc) + timedelta(days=7)
                ),
                Task(
                    user_id=user.id,
                    goal_id=goal.id,
                    title="Identify 5 target internship postings",
                    description="Find specific job openings aligned with the profile target roles.",
                    status="todo",
                    priority="low",
                    due_date=datetime.now(timezone.utc) + timedelta(days=14)
                )
            ]
            db.add_all(tasks)
            db.commit()
            print("Database seeding finished successfully.")
    except Exception as e:
        db.rollback()
        print(f"Failed to seed development database: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup step: Initialize table structures and seed default data
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
    # Shutdown step: Placeholder for cleanup logic (e.g. closing client pools)

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS middleware to allow requests from the React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Bind the router definitions
app.include_router(api_router, prefix=settings.API_V1_STR)
