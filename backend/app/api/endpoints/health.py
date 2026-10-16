from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.database.session import get_db

router = APIRouter()

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Check the health of the FastAPI application and the SQLite database.
    """
    try:
        # Execute a minimal query to verify connection
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"disconnected: {str(e)}"

    return {
        "status": "healthy",
        "app": "PathPilot Backend",
        "version": "0.1.0",
        "database": db_status
    }
