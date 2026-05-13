"""User routes."""
import secrets
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.base import get_db
from app.models.models import User
from app.schemas.schemas import UserCreate, UserOut
from app.api.deps import get_current_user
from app.core.errors import ConflictError

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserOut)
def create_user(req: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == req.username).first()
    if existing:
        raise ConflictError("Username already taken")
    user = User(
        username=req.username,
        display_name=req.display_name or req.username,
        api_key="fk_" + secrets.token_urlsafe(24),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
