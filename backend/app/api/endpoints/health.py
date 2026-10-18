from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.database.session import get_db
from backend.app.schemas.schemas import HealthResponse

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health_check(response: Response, db: Session = Depends(get_db)):
    """
    Check the health of the FastAPI application and the SQLite database.
    """
    try:
        # Execute a minimal query to verify connection
        db.execute(text("SELECT 1"))
        db_status = "connected"
        app_status = "healthy"
    except Exception as e:
        db_status = f"disconnected: {str(e)}"
        app_status = "unhealthy"
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return HealthResponse(
        status=app_status,
        app="PathPilot Backend",
        version="0.1.0",
        database=db_status
    )
