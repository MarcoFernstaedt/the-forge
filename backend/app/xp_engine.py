"""XP Engine: calculate unlocks, mastery, and cascading progress."""
import json
from datetime import datetime, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from .models import Skill, UserProgress, Activity


def get_tree_skills(db: Session, tree_id: int) -> List[Skill]:
    return db.query(Skill).filter(Skill.tree_id == tree_id).all()


def get_user_progress_map(db: Session, user_id: int, tree_id: int) -> Dict[int, UserProgress]:
    """Return a dict mapping skill_id -> UserProgress for a user and tree."""
    skills = get_tree_skills(db, tree_id)
    skill_ids = [s.id for s in skills]
    progress_entries = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.skill_id.in_(skill_ids)
    ).all()
    return {p.skill_id: p for p in progress_entries}


def check_prerequisites(db: Session, skill: Skill, progress_map: Dict[int, UserProgress]) -> bool:
    """Check if all prerequisite skills are at least unlocked."""
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


def award_xp(db: Session, user_id: int, skill_id: int, xp: int, description: str, source: str = "manual", source_url: str = None) -> Dict[str, Any]:
    """Award XP to a skill. Returns dict with unlocks, mastery, and new status."""
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        return {"error": "Skill not found"}
    
    # Get or create progress
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.skill_id == skill_id
    ).first()
    
    if not progress:
        progress = UserProgress(user_id=user_id, skill_id=skill_id, current_xp=0, status="locked")
        db.add(progress)
        db.flush()
    
    # Get all progress for this tree to check prerequisites
    progress_map = get_user_progress_map(db, user_id, skill.tree_id)
    
    # Check if skill can be unlocked
    was_locked = progress.status == "locked"
    can_unlock = check_prerequisites(db, skill, progress_map)
    
    new_unlocks = []
    new_masteries = []
    
    # If prerequisites met and skill is locked, unlock it
    if was_locked and can_unlock and progress.current_xp + xp >= skill.xp_required:
        progress.status = "unlocked"
        progress.unlocked_at = datetime.now(timezone.utc)
        new_unlocks.append(skill_id)
    
    # Add XP
    progress.current_xp += xp
    
    # Check for mastery
    if progress.status == "unlocked" and progress.current_xp >= skill.max_xp:
        progress.status = "mastered"
        progress.mastered_at = datetime.now(timezone.utc)
        new_masteries.append(skill_id)
        
        # Cascade: check if any locked skills now have their prerequisites met
        tree_skills = get_tree_skills(db, skill.tree_id)
        for other_skill in tree_skills:
            if other_skill.id == skill_id:
                continue
            other_progress = progress_map.get(other_skill.id)
            if other_progress and other_progress.status == "locked":
                if check_prerequisites(db, other_skill, progress_map):
                    # Auto-unlock if XP requirement is 0 or already met
                    if other_progress.current_xp >= other_skill.xp_required:
                        other_progress.status = "unlocked"
                        other_progress.unlocked_at = datetime.now(timezone.utc)
                        new_unlocks.append(other_skill.id)
    
    # Log activity
    activity = Activity(
        user_id=user_id,
        skill_id=skill_id,
        description=description,
        xp_amount=xp,
        source=source,
        source_url=source_url,
    )
    db.add(activity)
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
    """Create locked progress entries for all skills in a tree."""
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
    """Get full tree data with user's progress overlaid."""
    tree = db.query(SkillTree).filter(SkillTree.id == tree_id).first()
    if not tree:
        return None
    
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
        "skills": skill_data,
    }
