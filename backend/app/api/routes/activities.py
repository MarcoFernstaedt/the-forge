"""Activity routes."""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.models.base import get_db
from app.models.models import Activity
from app.schemas.schemas import ActivityCreate, ActivityOut
from app.api.deps import get_current_user
from app.services.xp_engine import award_xp
from app.core.errors import NotFoundError

router = APIRouter(prefix="/activities", tags=["activities"])


@router.post("")
def log_activity(req: ActivityCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
    result = award_xp(
        db, user.id, req.skill_id, req.xp_amount,
        req.description, req.source, req.source_url
    )
    return result


@router.get("", response_model=List[ActivityOut])
def list_activities(
    skill_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    q = db.query(Activity).filter(Activity.user_id == user.id)
    if skill_id:
        q = q.filter(Activity.skill_id == skill_id)
    activities = q.order_by(Activity.created_at.desc()).limit(limit).all()
    return activities
