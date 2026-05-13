"""Skill routes."""
import json
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.base import get_db
from app.models.models import Skill, SkillTree
from app.schemas.schemas import SkillCreate, SkillOut
from app.api.deps import get_current_user
from app.core.errors import NotFoundError

router = APIRouter(prefix="/skills", tags=["skills"])


@router.get("/tree/{tree_id}", response_model=List[SkillOut])
def list_skills(tree_id: int, db: Session = Depends(get_db)):
    skills = db.query(Skill).filter(Skill.tree_id == tree_id).all()
    return skills


@router.post("/tree/{tree_id}", response_model=SkillOut)
def create_skill(tree_id: int, req: SkillCreate, db: Session = Depends(get_db)):
    tree = db.query(SkillTree).filter(SkillTree.id == tree_id).first()
    if not tree:
        raise NotFoundError("Tree")
    skill = Skill(
        tree_id=tree_id,
        name=req.name,
        description=req.description,
        category=req.category,
        x=req.x, y=req.y,
        xp_required=req.xp_required,
        max_xp=req.max_xp,
        icon=req.icon,
        prerequisite_ids=json.dumps(req.prerequisite_ids),
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


@router.put("/{skill_id}", response_model=SkillOut)
def update_skill(skill_id: int, req: SkillCreate, db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise NotFoundError("Skill")
    skill.name = req.name
    skill.description = req.description
    skill.category = req.category
    skill.x = req.x
    skill.y = req.y
    skill.xp_required = req.xp_required
    skill.max_xp = req.max_xp
    skill.icon = req.icon
    skill.prerequisite_ids = json.dumps(req.prerequisite_ids)
    db.commit()
    db.refresh(skill)
    return skill


@router.delete("/{skill_id}")
def delete_skill(skill_id: int, db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise NotFoundError("Skill")
    db.delete(skill)
    db.commit()
    return {"message": "Skill deleted"}
