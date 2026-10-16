from sqlalchemy.orm import Session
from backend.app.models.user import User
from backend.app.core.config import settings

def get_local_user(db: Session) -> User:
    """
    Resolves the active local user from the database based on the configured default email.
    If the user does not exist, it registers the user row.
    """
    user = db.query(User).filter(User.email == settings.DEFAULT_USER_EMAIL).first()
    if not user:
        user = User(
            email=settings.DEFAULT_USER_EMAIL,
            name=settings.DEFAULT_USER_NAME
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
