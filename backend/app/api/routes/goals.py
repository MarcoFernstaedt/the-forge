"""Goals tracking routes."""
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.base import get_db
from app.models.models import Goal
from app.schemas.schemas import GoalCreate, GoalUpdate, GoalOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("", response_model=List[GoalOut])
def list_goals(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(Goal).filter(Goal.user_id == user.id).order_by(Goal.created_at.desc()).all()


@router.post("", response_model=GoalOut)
def create_goal(req: GoalCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    goal = Goal(
        user_id=user.id,
        title=req.title,
        description=req.description,
        category=req.category,
        target_value=req.target_value,
        current_value=req.current_value,
        target_date=req.target_date,
        linked_tree_id=req.linked_tree_id,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.patch("/{goal_id}", response_model=GoalOut)
def update_goal(goal_id: int, req: GoalUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)
    goal.updated_at = datetime.now(timezone.utc)
    if goal.current_value >= goal.target_value and goal.status == "active":
        goal.status = "completed"
    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted"}
