"""XP Engine: calculate unlocks, mastery, cascading progress."""
import json
from datetime import datetime, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.models.models import Skill, UserProgress, Activity, User
from app.core.errors import NotFoundError


def get_tree_skills(db: Session, tree_id: int) -> List[Skill]:
    return db.query(Skill).filter(Skill.tree_id == tree_id).all()


def get_user_progress_map(db: Session, user_id: int, tree_id: int) -> Dict[int, UserProgress]:
    skills = get_tree_skills(db, tree_id)
    skill_ids = [s.id for s in skills]
    progress_entries = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.skill_id.in_(skill_ids)
    ).all()
    return {p.skill_id: p for p in progress_entries}


def check_prerequisites(db: Session, skill: Skill, progress_map: Dict[int, UserProgress]) -> bool:
    try:
        prereq_ids = json.loads(skill.prerequisite_ids or "[]")
    except json.JSONDecodeError:
        prereq_ids = []
    if not prereq_ids:
        return True
    for prereq_id in prereq_ids:
        progress = progress_map.get(prereq_id)
        if not progress or progress.status == "locked":
            return False
    return True


def award_xp(
    db: Session, user_id: int, skill_id: int, xp: int,
    description: str, source: str = "manual", source_url: str = None
) -> Dict[str, Any]:
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise NotFoundError("Skill")

    progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.skill_id == skill_id
    ).first()

    if not progress:
        progress = UserProgress(user_id=user_id, skill_id=skill_id, current_xp=0, status="locked")
        db.add(progress)
        db.flush()

    progress_map = get_user_progress_map(db, user_id, skill.tree_id)
    was_locked = progress.status == "locked"
    can_unlock = check_prerequisites(db, skill, progress_map)

    new_unlocks = []
    new_masteries = []

    if was_locked and can_unlock and progress.current_xp + xp >= skill.xp_required:
        progress.status = "unlocked"
        progress.unlocked_at = datetime.now(timezone.utc)
        new_unlocks.append(skill_id)

    progress.current_xp += xp

    if progress.status == "unlocked" and progress.current_xp >= skill.max_xp:
        progress.status = "mastered"
        progress.mastered_at = datetime.now(timezone.utc)
        new_masteries.append(skill_id)

        tree_skills = get_tree_skills(db, skill.tree_id)
        for other_skill in tree_skills:
            if other_skill.id == skill_id:
                continue
            other_progress = progress_map.get(other_skill.id)
            if other_progress and other_progress.status == "locked":
                if check_prerequisites(db, other_skill, progress_map):
                    if other_progress.current_xp >= other_skill.xp_required:
                        other_progress.status = "unlocked"
                        other_progress.unlocked_at = datetime.now(timezone.utc)
                        new_unlocks.append(other_skill.id)

    activity = Activity(
        user_id=user_id,
        skill_id=skill_id,
        description=description,
        xp_amount=xp,
        source=source,
        source_url=source_url,
    )
    db.add(activity)

    # Update user last_active
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.last_active = datetime.now(timezone.utc)

    db.commit()

    return {
        "skill_id": skill_id,
        "new_xp": progress.current_xp,
        "total_xp": progress.current_xp,
        "status": progress.status,
        "new_unlocks": new_unlocks,
        "new_masteries": new_masteries,
        "activity_id": activity.id,
    }


def initialize_progress_for_tree(db: Session, user_id: int, tree_id: int):
    skills = get_tree_skills(db, tree_id)
    for skill in skills:
        exists = db.query(UserProgress).filter(
            UserProgress.user_id == user_id,
            UserProgress.skill_id == skill.id
        ).first()
        if not exists:
            db.add(UserProgress(user_id=user_id, skill_id=skill.id, current_xp=0, status="locked"))
    db.commit()


def get_tree_with_progress(db: Session, tree_id: int, user_id: int) -> Dict[str, Any]:
    from app.models.models import SkillTree
    tree = db.query(SkillTree).filter(SkillTree.id == tree_id).first()
    if not tree:
        raise NotFoundError("Tree")

    skills = get_tree_skills(db, tree_id)
    progress_map = get_user_progress_map(db, user_id, tree_id)

    skill_data = []
    for skill in skills:
        progress = progress_map.get(skill.id)
        skill_data.append({
            "id": skill.id,
            "name": skill.name,
            "description": skill.description,
            "category": skill.category,
            "x": skill.x,
            "y": skill.y,
            "xp_required": skill.xp_required,
            "max_xp": skill.max_xp,
            "icon": skill.icon,
            "prerequisite_ids": json.loads(skill.prerequisite_ids or "[]"),
            "current_xp": progress.current_xp if progress else 0,
            "status": progress.status if progress else "locked",
            "unlocked_at": progress.unlocked_at.isoformat() if progress and progress.unlocked_at else None,
            "mastered_at": progress.mastered_at.isoformat() if progress and progress.mastered_at else None,
        })

    return {
        "id": tree.id,
        "name": tree.name,
        "description": tree.description,
        "category": tree.category,
        "is_template": tree.is_template,
        "is_public": tree.is_public,
        "skills": skill_data,
    }
