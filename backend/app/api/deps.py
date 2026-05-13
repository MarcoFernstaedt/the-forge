"""API dependencies."""
from typing import Optional
from fastapi import Header, Depends
from sqlalchemy.orm import Session

from app.models.base import get_db
from app.models.models import User
from app.core.config import settings
from app.core.errors import AuthError


async def get_current_user(
    db: Session = Depends(get_db),
    x_api_key: Optional[str] = Header(None)
) -> User:
    if x_api_key:
        user = db.query(User).filter(User.api_key == x_api_key).first()
        if user:
            return user
        raise AuthError("Invalid API key")

    if settings.DEV_MODE:
        user = db.query(User).first()
        if not user:
            user = User(
                username="default",
                display_name="Default User",
                api_key="dev-key"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    raise AuthError("API key required. Set x-api-key header or enable dev mode.")
