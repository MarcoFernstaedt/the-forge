"""Skill tree routes."""
import json
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.base import get_db
from app.models.models import SkillTree, Skill, User
from app.schemas.schemas import TreeCreate, TreeOut
from app.api.deps import get_current_user
from app.services.xp_engine import initialize_progress_for_tree, get_tree_with_progress
from app.core.errors import NotFoundError

router = APIRouter(prefix="/trees", tags=["trees"])


@router.get("", response_model=List[TreeOut])
def list_trees(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    trees = db.query(SkillTree).filter(
        (SkillTree.is_template == True) | (SkillTree.is_public == True) | (SkillTree.user_id == user.id)
    ).all()
    for t in trees:
        t.skill_count = db.query(Skill).filter(Skill.tree_id == t.id).count()
    return trees


@router.post("", response_model=TreeOut)
def create_tree(req: TreeCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tree = SkillTree(
        user_id=user.id,
        name=req.name,
        description=req.description,
        category=req.category,
        is_template=req.is_template,
        is_public=req.is_public,
    )
    db.add(tree)
    db.commit()
    db.refresh(tree)
    tree.skill_count = 0
    return tree


@router.get("/{tree_id}")
def get_tree(tree_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return get_tree_with_progress(db, tree_id, user.id)


@router.post("/{tree_id}/clone")
def clone_tree(tree_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    source = db.query(SkillTree).filter(SkillTree.id == tree_id).first()
    if not source:
        raise NotFoundError("Tree")

    new_tree = SkillTree(
        user_id=user.id,
        name=f"{source.name} (Clone)",
        description=source.description,
        category=source.category,
        is_template=False,
        is_public=False,
    )
    db.add(new_tree)
    db.commit()
    db.refresh(new_tree)

    old_skills = db.query(Skill).filter(Skill.tree_id == tree_id).all()
    id_map = {}
    for s in old_skills:
        new_skill = Skill(
            tree_id=new_tree.id,
            name=s.name,
            description=s.description,
            category=s.category,
            x=s.x, y=s.y,
            xp_required=s.xp_required,
            max_xp=s.max_xp,
            icon=s.icon,
            prerequisite_ids=s.prerequisite_ids,
        )
        db.add(new_skill)
        db.commit()
        db.refresh(new_skill)
        id_map[s.id] = new_skill.id

    for old_id, new_id in id_map.items():
        skill = db.query(Skill).filter(Skill.id == new_id).first()
        if skill:
            try:
                old_prereqs = json.loads(skill.prerequisite_ids or "[]")
                new_prereqs = [id_map[p] for p in old_prereqs if p in id_map]
                skill.prerequisite_ids = json.dumps(new_prereqs)
            except json.JSONDecodeError:
                pass
    db.commit()

    initialize_progress_for_tree(db, user.id, new_tree.id)
    return {"tree_id": new_tree.id, "message": "Tree cloned successfully"}


@router.post("/{tree_id}/init")
def init_tree_progress(tree_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    initialize_progress_for_tree(db, user.id, tree_id)
    return {"message": "Progress initialized"}
