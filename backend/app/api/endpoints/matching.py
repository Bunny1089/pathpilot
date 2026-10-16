from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.schemas.schemas import MatchRequest, MatchReportOut
from backend.app.services.user_service import get_local_user
from backend.app.services.matching_service import match_resume_to_jd

router = APIRouter()

@router.post("/match", response_model=MatchReportOut)
def match_resume(payload: MatchRequest, db: Session = Depends(get_db)):
    """
    Accepts structured job description details, retrieves the active user's resume,
    performs skill normalization and ChromaDB vector retrieval, and returns a detailed Match Report.
    """
    try:
        user = get_local_user(db)
        report = match_resume_to_jd(db, user.email, payload)
        return report
    except ValueError as ve:
        raise HTTPException(
            status_code=400,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while running the matching engine: {str(e)}"
        )
