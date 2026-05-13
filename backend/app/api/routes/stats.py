"""Stats routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.base import get_db
from app.models.models import User
from app.schemas.schemas import StatsOut, UserOut
from app.api.deps import get_current_user
from app.services.stats_service import get_user_stats

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    stats = get_user_stats(db, user.id)
    return {
        "user": UserOut.model_validate(user),
        "trees_created": stats["trees_created"],
        "total_activities": stats["total_activities"],
        "total_xp": stats["total_xp"],
        "skills_unlocked": stats["skills_unlocked"],
        "skills_mastered": stats["skills_mastered"],
        "current_level": stats["current_level"],
        "next_level_xp": stats["next_level_xp"],
        "streak_days": stats["streak_days"],
        "longest_streak": stats["longest_streak"],
    }
