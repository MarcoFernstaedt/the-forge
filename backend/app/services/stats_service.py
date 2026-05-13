"""User stats, levels, streaks."""
from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session

from app.models.models import UserProgress, Activity, SkillTree, User
from app.core.config import settings


def calculate_level(total_xp: int) -> tuple[int, int, float]:
    """Return (current_level, xp_for_next_level, progress_0_to_1)."""
    level = 1
    xp_needed = settings.BASE_LEVEL_XP
    accumulated = 0

    while total_xp >= accumulated + xp_needed:
        accumulated += xp_needed
        level += 1
        xp_needed = int(xp_needed * settings.LEVEL_SCALING)

    progress = (total_xp - accumulated) / xp_needed if xp_needed > 0 else 1.0
    return level, xp_needed, min(1.0, max(0.0, progress))


def calculate_streak(db: Session, user_id: int) -> tuple[int, int]:
    """Return (current_streak, longest_streak)."""
    activities = db.query(Activity).filter(
        Activity.user_id == user_id
    ).order_by(Activity.created_at.desc()).all()

    if not activities:
        return 0, 0

    dates = sorted(set(a.created_at.date() for a in activities), reverse=True)
    if not dates:
        return 0, 0

    today = datetime.now(timezone.utc).date()
    current_streak = 0

    # Check if active today or yesterday (grace period)
    check_date = today
    if dates[0] != today and dates[0] != today - timedelta(days=1):
        current_streak = 0
    else:
        current_streak = 1
        for i in range(1, len(dates)):
            if dates[i] == dates[i - 1] - timedelta(days=1):
                current_streak += 1
            else:
                break

    # Longest streak
    longest = 1
    current_run = 1
    all_dates = sorted(set(a.created_at.date() for a in activities))
    for i in range(1, len(all_dates)):
        if all_dates[i] == all_dates[i - 1] + timedelta(days=1):
            current_run += 1
            longest = max(longest, current_run)
        else:
            current_run = 1

    return current_streak, longest


def get_user_stats(db: Session, user_id: int) -> Dict[str, Any]:
    progress = db.query(UserProgress).filter(UserProgress.user_id == user_id).all()
    total_xp = sum(p.current_xp for p in progress)
    unlocked = sum(1 for p in progress if p.status == "unlocked")
    mastered = sum(1 for p in progress if p.status == "mastered")
    total = len(progress)

    level, next_xp, level_progress = calculate_level(total_xp)
    streak, longest = calculate_streak(db, user_id)

    trees_count = db.query(SkillTree).filter(SkillTree.user_id == user_id).count()
    activities_count = db.query(Activity).filter(Activity.user_id == user_id).count()

    return {
        "total_xp": total_xp,
        "skills_unlocked": unlocked,
        "skills_mastered": mastered,
        "total_skills": total,
        "current_level": level,
        "next_level_xp": next_xp,
        "level_progress": round(level_progress, 2),
        "streak_days": streak,
        "longest_streak": longest,
        "trees_created": trees_count,
        "total_activities": activities_count,
    }
