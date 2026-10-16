from fastapi import APIRouter
from backend.app.api.endpoints import health, dashboard, resume, jd, matching, agent

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(dashboard.router, tags=["dashboard"])
api_router.include_router(resume.router, prefix="/resume", tags=["resume"])
api_router.include_router(jd.router, prefix="/jd", tags=["jd"])
api_router.include_router(matching.router, prefix="/matching", tags=["matching"])
api_router.include_router(agent.router, prefix="/agent", tags=["agent"])


