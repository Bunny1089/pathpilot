from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.mutable import MutableList
from datetime import datetime, timezone
from backend.app.database.base_class import Base

class CareerState(Base):
    __tablename__ = "career_states"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    goal = Column(String, nullable=False)
    target_role = Column(String, nullable=True)
    location = Column(String, nullable=True)
    resume_available = Column(Boolean, default=False)
    resume_filename = Column(String, nullable=True)
    status = Column(String, default="idle")  # idle, running, paused_for_approval, completed, failed
    next_action = Column(String, default="Check Context")
    logs = Column(MutableList.as_mutable(JSON), default=list)
    jobs_found = Column(MutableList.as_mutable(JSON), default=list)
    matches = Column(MutableList.as_mutable(JSON), default=list)
    shortlisted_jobs = Column(MutableList.as_mutable(JSON), default=list)
    pending_approval = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="career_state")
